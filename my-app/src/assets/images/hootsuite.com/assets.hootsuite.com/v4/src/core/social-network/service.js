/**
 * Handles connecting to social networks
 */
import _ from 'underscore';
import util from 'utils/util';
import AppBase from 'core/app-base';
import config from './config';
import snUtil from './util';
import events from 'hs-events';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import modals from 'apps/social-network/views/modals';

const NO_PERMISSION_TO_TRANSFER_IN_ORG = 45;  // errorCode 45 - matches the error code on the baseApiController

export default AppBase.extend(/** @lends SocialNetworkService.prototype */{
    messageEvents: {
        // Modal calls
        'socialNetwork:addNetwork:igbAuthProcess': 'igbAuthProcess',
        // Service events
        'socialNetwork:authorize:command': 'authorizeCommand',
        'socialNetwork:addAccount:command': 'addAccountCommand',
        'socialNetwork:deleteAccount:command': 'deleteAccountCommand',
        'socialNetwork:reauthorize:command': 'reauthorizeNetworkCommand',
        'socialNetwork:transfer:command': 'transferNetworkCommand',
        'socialNetwork:refresh:command': 'refreshNetworkCommand',
        'socialNetwork:sync:command': 'syncNetworkCommand',
        'socialNetwork:storePreference:command': 'storePreferenceCommand'
    },
    text: {
        transferError: translation._("There was an error transferring the social network, please try again"),
        deleteError: translation._("Cannot delete network at this time. Please try again."),
        deleteAuthError: translation._("You don't have permission to delete this social network"),
        devDeleteNoSnIdError: "You must specify a snId when you call the deleteAccountCommand"
    },
    onInitialize: function (options) {
        options = options || {};
        if (!options.connectorClasses) {
            throw new Error("You must supply connectorClasses to the SocialNetworkService");
        }

        var connectors = {};
        _.each(options.connectorClasses, function (ConnectorClass, snType) {
            connectors[snType] = new ConnectorClass();
            connectors[snType].setNetworkType(snType);
        });
        this.connectors = connectors;

        if (!options.snResource) {
            throw new Error("You must supply snResource to the SocialNetworkService");
        }
        this.snResource = options.snResource;
    },

    getConnectorByNetwork: function (snType) {
        var network = snUtil.getSocialNetworkFromType(snType);
        if (this.connectors[network]) {
            return this.connectors[network];
        }

        return null;
    },

    igbAuthProcess: function (orgAndTeam) {
        modals.IgbAuthProcessModal(orgAndTeam)
    },

    /**
     * ConnectSN
     * Step 2a:
     * Connecting a social network or series of accounts for a given network is a two-stage process
     * Connect begins the authentication and signals successful authentication
     *
     * NOTE: The implementing code must call the addNetworkCommand to complete the process
     *
     * @param {String} snType
     * @param {{}} [options]
     * @param {Number} options.organizationId If the user wants to add the account to an organization, provide the id
     * @param {boolean} options.useRedirect If we should use the redirect workflow for authentication
     * @param {AuthTriggerData} options.triggerData If we're finishing up the redirect auth workflow
     */
    authorizeCommand: function (snType, options) {
        options = options || {};
        var connector = this.getConnectorByNetwork(snType);

        util.boolToForm(options, 'useRedirect');
        if (connector) {
            hs.track('/ga/settings/add-sn/' + connector.type.toLowerCase() + '/connect');
            connector.connect(options)
                .fail(function (data) {
                    if (data.shouldShowError) {
                        hootbus.emit('socialNetwork:authorize:error', data, snType);
                    }
                });
        } else {
            hootbus.emit('socialNetwork:authorize:error', {developerMessage: "There was no connector of type " + snType}, snType);
        }
    },

    /**
     * ConnectSN
     * Step 3b: Upon network authorization, we add the account or identities
     *
     * @param snType
     * @param data
     * @param {boolean} [data.createTab]
     * @param {{type: String, userId: Number}} [data.socialNetwork]
     * @param {boolean} [data.follow]
     * @param {Number} [data.organizationId]
     * @param {boolean} [data.isMultiIdentity] Passed back to handlers to deal with multi-identity cases as needed
     *
     * @param callbacks
     * @param {Function} [callbacks.onSuccess]
     * @param {Function} [callbacks.onComplete]
     *
     * @fires socialNetwork:addAccount:success
     * @fires socialNetwork:addAccount:transfer
     * @fires socialNetwork:addAccount:error
     */
    addAccountCommand: function (snType, data, callbacks) {
        data = data || {};
        data.socialNetwork = data.socialNetwork || {};
        data.socialNetwork.type = snType;
        // Hack! Why do we even have this? The point of GET vs POST, no?
        data.form_submit = 'form';
        if (data.organizationId === null) {
            delete data.organizationId;
        }
        data.isPvp = this.checkPvp();

        util.boolToForm(data, 'createTab', 'follow');
        var ajaxArgs = {
            url: "/ajax/network/add",
            data: data
        };
        this.hackInAjaxCallbacks(callbacks, ajaxArgs);
        util.promiseRealSuccess(ajaxCall(ajaxArgs, 'q1'))
            .done(function (responseData) {
                // Pass along multi-identity attribute; hacky?
                _.extend(responseData, _.pick(data, 'isMultiIdentity', 'uiContext'));
                if (responseData.success) {
                    hootbus.emit(events.SOCIAL_NETWORK_ADD_SUCCESS, responseData, snType);
                } else if (responseData.errorCode === NO_PERMISSION_TO_TRANSFER_IN_ORG) {
                    hootbus.emit(events.SOCIAL_NETWORK_ADD_ERROR, responseData);
                } else if (responseData.isTransfer) {
                    responseData.resetTwitterPhotoUpload = true;
                    hootbus.emit(events.SOCIAL_NETWORK_ADD_TRANSFER, responseData, snType, data);
                }
            })
            .fail(function (jqXHR, textStatus, errorThrown, data) {
                data = data ? data : {};
                data.errorThrown = errorThrown;
                hootbus.emit(events.SOCIAL_NETWORK_ADD_ERROR, data, snType);
            });
    },

    /**
     * Check if user is trying to add network through pvp. Boolean variable is checked in
     * NetworkController. Fixes GH-204.
     * @returns {boolean}
     */
    checkPvp: function () {
        var pvpUrlSearch = window.location.href.search('pvp');
        return pvpUrlSearch > 0;
    },

    /* @private (hence no JSDoc-style comment)
     * Avoid using these callbacks for new code! It causes deep coupling.
     * It wasn't worth re-engineering the Facebook/Google+/LinkedIn account selectors for absolute code cleanliness
     *
     * @param options
     * @param ajaxArgs
     */
    hackInAjaxCallbacks: function (callbacks, ajaxArgs) {
        if (!callbacks) { return; }

        if (_.isFunction(callbacks.onSuccess)) {
            ajaxArgs.success = callbacks.onSuccess;
        }
        if (_.isFunction(callbacks.onComplete)) {
            ajaxArgs.complete = callbacks.onComplete;
        }
    },

    /**
     * Remove the single specified account
     *
     * @param {Number} snIds
     * @param callbacks
     * @param {Function} [callbacks.onSuccess]
     * @param {Function} [callbacks.onComplete]
     */
    deleteAccountCommand: function (snIds, callbacks) {
        if (!snIds) {
            hootbus.emit('socialNetwork:delete:error', {developerMessage: this.text.devDeleteNoSnIdError});
            return;
        }
        if (_.isArray(snIds)) {
            snIds = snIds.join(',');
        }
        var self = this;
        var ajaxArgs = {
            url: '/ajax/network/delete',
            data: {socialNetworkIds: snIds}
        };
        this.hackInAjaxCallbacks(callbacks, ajaxArgs);
        util.promiseRealSuccess(ajaxCall(ajaxArgs, 'qm'))
            .done(function () {
                hootbus.emit(events.SOCIAL_NETWORK_DELETE_SUCCESS, snIds);
            })
            .fail(function (jqXHR) {
                var message = self.text.deleteError;

                // The back end will throw a 403 error if the user does not have permissions
                // to delete this social network for both member owned and org owned sns
                if (jqXHR.status === 403) {
                    message = self.text.deleteAuthError;
                }

                hootbus.emit('socialNetwork:delete:error', {message: message}, snIds);
            });
    },

    /**
     * When auth tokens expire they a network must be re-authorized
     *
     * @param {Object} socialNetwork
     * @param {Number} socialNetwork.socialNetworkId
     * @param {String} [socialNetwork.auth1] Should only be coming through for WordPress since it uses a password
     * @param {boolean} [socialNetwork.isSecurePost] In case it wasn't updated through ajax call?
     * @param {Object} [options]
     * @param {boolean} options.useRedirect If we should use the redirect workflow for authentication
     * @param {Object} options.triggerData If we're finishing up the redirect auth workflow
     * @param {SocialNetworkPermissionRequest} options.permissionRequest
     *
     * @fires socialNetwork:reauthorize:success
     * @fires socialNetwork:reauthorize:error
     */
    reauthorizeNetworkCommand: function (socialNetwork, options) {
        socialNetwork = socialNetwork || {};
        options = options || {};
        var snId = socialNetwork.socialNetworkId;
        var snData = this.snResource.getSocialNetworkData(snId);
        var snType = snData && snData.type;

        var connector = this.getConnectorByNetwork(snType) || null;
        if (connector) {
            options.snId = snId;

            connector.connect(options)
                .done(_.bind(this.postReauthorize, this, snType, socialNetwork, options.permissionRequest))
                .fail(function (data) {
                    if (data.shouldShowError) {
                        hootbus.emit('socialNetwork:reauthorize:error', data, connector.type, options.permissionRequest);
                    }
                });
        } else {
            hootbus.emit('socialNetwork:reauthorize:error',
                {developerMessage: "Couldn't locate a connector for snId: " + snId},
                null);
        }
    },

    /**
     * Send the credentials to the backend on complete
     *
     * @param {SocialNetworkConnector} connector bound from {@link reauthorizeNetworkCommand}
     * @param {Object} socialNetwork bound from {@link reauthorizeNetworkCommand}
     * @param {SocialNetworkPermissionRequest} permissionRequest bound from {@link reauthorizeNetworkCommand}
     * @param {Object} authData
     */
    postReauthorize: function (snType, socialNetwork, permissionRequest) {
        var self = this;
        util.boolToForm(socialNetwork, 'isSecurePost');
        var data = {socialNetwork: socialNetwork};

        util.promiseRealSuccess(ajaxCall({
            url: '/ajax/network/edit',
            data: data
        }, 'qm'))
            .done(function (data) {
                hootbus.emit('socialNetwork:reauthorize:success', data, snType, permissionRequest);

                if (snType === config.c.FACEBOOK) {
                    self.facebookPostChangeCommand({snId: socialNetwork.socialNetworkId});
                }
                self.refreshNetworkCommand();
            })
            .fail(function (jqXHR, textStatus, errorThrown, data) {
                hootbus.emit('socialNetwork:reauthorize:error', data, snType, permissionRequest);
            });
    },

    /**
     *
     * @param data
     * @param {Number} data.socialNetworkId
     * @param {Number|null} [data.toOrganizationId] if transfering to an org, otherwise transfer to current user
     * @param {boolean} [data.createTab]
     * @param {boolean} [data.saveCheckbox]
     *
     * @param callbacks
     * @param {Function} [callbacks.onSuccess] Only used for backward-compatibility with old code
     * @param {Function} [callbacks.onComplete] Only used for backward-compatibility with old code
     *
     * @fires socialNetwork:transfer:success
     * @fires socialNetwork:transfer:error
     */
    transferNetworkCommand: function (data, callbacks) {
        util.boolToForm(data, 'createTab', 'saveCheckbox', 'deleteMessages');
        var ajaxArgs = {
            url: '/ajax/network/transfer',
            data: data
        };
        this.hackInAjaxCallbacks(callbacks, ajaxArgs);
        util.promiseRealSuccess(ajaxCall(ajaxArgs, 'qm'))
            .done(function (data) {
                hootbus.emit(events.SOCIAL_NETWORK_TRANSFER_SUCCESS, data);
            })
            .fail(function (jqXHR, textStatus, errorThrown, data) {
                hootbus.emit(events.SOCIAL_NETWORK_TRANSFER_ERROR, data);
            });
    },

    /**
     * After change in the social networks, sync data from the server
     *
     * @param options
     * @param {boolean} [options.isHootlet] This is kind of hacky and as soon as we stop generating the message box
     *                                      HTML on the back end we can get rid of this
     * @param {Function} options.onSuccess For compatibility with older code
     *
     * @fires socialNetwork:refresh:success
     */
    refreshNetworkCommand: function (options) {
        var self = this;
        var ajaxArgs = {
            url: "/ajax/network/refresh-social-networks",
            type: 'GET'
        };

        this.hackInAjaxCallbacks(options, ajaxArgs);

        ajaxCall(ajaxArgs, 'q1')
            .done(function (data) {
                self.snResource.update(data);
                hootbus.emit('socialNetwork:refresh:success', data);
            });

        hootbus.emit('adAccount:refresh:command');
    },

    /**
     * Synchronise the display name and avatar for a social network (get updates from the network)
     *
     * @param {Number} socialNetworkId
     * @param callbacks
     * @param {Function} [callbacks.onSuccess] Only used for backward-compatibility with old code
     * @param {Function} [callbacks.onComplete] Only used for backward-compatibility with old code
     *
     * @fires socialNetwork:sync:success
     */
    syncNetworkCommand: function (socialNetworkId, callbacks) {
        var self = this;
        var ajaxArgs = {
            url: '/ajax/network/sync',
            data: {socialNetworkId: socialNetworkId}
        };
        this.hackInAjaxCallbacks(callbacks, ajaxArgs);
        util.promiseRealSuccess(ajaxCall(ajaxArgs, 'qm'))
            .done(function (data) {
                self.snResource.update(data);
                hootbus.emit('socialNetwork:sync:success', data, socialNetworkId);
            });
    },

    /**
     * Store user preferences related to social networks (pinned, favourited, etc.)
     *
     * @param {number} socialNetworkId
     * @param {string} key (pin, favorite, publisherFilter)
     * @param {boolean} value
     * @param options
     * @param {Function} options.onSuccess
     * @param {boolean} options.isSoftRefresh
     */
    storePreferenceCommand: function (socialNetworkId, key, value, options) {
        options = options || {};
        var self = this;
        util.promiseRealSuccess(ajaxCall({
            type: 'POST',
            url: '/ajax/member/update-social-network-extra',
            data: {
                snId: socialNetworkId,
                key: key,
                value: value
            }
        }, 'q1'))
            .done(function () {
                if (options.isSoftRefresh) {
                    self.snResource.updateCacheItem(socialNetworkId, key, value);
                    _.isFunction(options.onSuccess) && options.onSuccess();
                } else {
                    self.refreshNetworkCommand(_.pick(options, 'onSuccess'));
                }
            });
    }
});
