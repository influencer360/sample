import $ from 'jquery';
import _ from 'underscore';
import util from 'utils/util';
import hootbus from 'utils/hootbus';
import events from 'hs-events';
import ExternalAuthenticator from 'core/social-network/external-authenticator';
import RedirectAuthenticator from 'core/social-network/redirect-authenticator';
import translation from 'utils/translation';
import EmbeddedFlowAuthenticator from "../embedded-flow-authenticator";

/** @typedef {Object} AuthTriggerData
 * @property {String} source - social network authenticated
 * @property {{token: String, verifier: String}} [token]
 * @property {{userCancelled: Boolean, socialNetworkId: Number}} [options]
 */

/**
 * Base class for gaining authentication to use a SocialNetwork
 *
 * @class SocialNetworkConnector
 */
var SocialNetworkConnector = function () {
    _.bindAll(this, '_rejectAuth', 'cancelAuth', 'errorAuth');
    this.initialize.apply(this, arguments);
};
_.extend(SocialNetworkConnector.prototype, /** @lends SocialNetworkConnector.prototype */{
    initialize: $.noop,

    cancelConnectMessage: '',
    networkType: null,

    setNetworkType: function (type) {
        this.networkType = type;
    },

    /**
     *
     * @param {{}} options
     * @returns {Promise|null}
     */
    connect: function (options) {
        options = options || {};
        if (!this.isAuthPending()) {
            this._authDeferred = $.Deferred();
            this.options = options;
            this.extAuth = this.doConnect(options);
            var authPromise = this.extAuth && this.extAuth.promise() || null;
            if (authPromise && Object.prototype.hasOwnProperty.call(authPromise, 'fail')) {
                authPromise.fail(_.bind(this.onExternalAuthFail, this));
            }
        } else {
            this.cancelAuth(this.getCancelConnectMessage());
            if (this.extAuth) {
                this.extAuth.close();
            }
        }

        return this._authDeferred && this._authDeferred.promise();
    },
    /**
     * Execute connection logic.
     * Pass back a Promise if you want fail handling
     *
     * @return {Promise|null}
     */
    doConnect: function () {
        throw new Error('You must implement doConnect in a subclass. Return the ExternalAuthenticator for error handling.');
    },

    getAuthenticator: function (service, options) {
        if (service === "whatsapp" && hs.isFeatureEnabled("CI_4205_WHATSAPP_EMBEDDED_LOGIN")) {
            // EmbeddedFlowAuthenticator scoped to WhatsApp profiles (both auth and reauth) when DL is enabled
            return new EmbeddedFlowAuthenticator(service, options)
        } else if (!!options.useRedirect) {
            return new RedirectAuthenticator(service, options.triggerData);
        } else {
            return new ExternalAuthenticator(service, options);
        }
    },

    reconnect: SocialNetworkConnector.prototype.connect,

    // Authentication
    isAuthPending: function () {
        return this._authDeferred && this._authDeferred.state() === 'pending';
    },
    completeAuth: function () {
        //reset the existing deferred to avoid triggering due to still pending state
        this._authDeferred = null;
        var options = this.options;
        this.options = null;

        var responseData = {};
        var isReauth = false;
        var socialNetworkId = 0;
        var authFailed = true;
        var errorCode = 0;
        var errorMessage = "Error";

        if (arguments[1]) {
            isReauth = arguments[1].isReauth;
            socialNetworkId = arguments[1].socialNetworkId;
            authFailed = arguments[1].authFailed;
            errorCode = arguments[1].errorCode;
            errorMessage = arguments[1].errorMessage;
        }

        if (isReauth && socialNetworkId > 0) {
            responseData.socialNetwork = {};
            responseData.socialNetwork.socialNetworkId = socialNetworkId;
        }

        if (!authFailed) {
            // Adding this to maintain parity with twitter, instagram, pinterest and youtube
            if (socialNetworkId > 0) {
                responseData.socialNetworkId = socialNetworkId;
            }
            responseData.success = 1;


            if (typeof arguments[1].authSuccessFollowup !== 'undefined') {
                responseData.authSuccessFollowup = arguments[1].authSuccessFollowup;
            }
            if (typeof arguments[1].authSuccessOne !== 'undefined') {
                responseData.authSuccessOne = arguments[1].authSuccessOne;
            }

            if (typeof arguments[1].extendedAuthFlow !== 'undefined') {
                responseData.extendedAuthFlow = arguments[1].extendedAuthFlow;
            }

            if (typeof arguments[1].finishWithoutCompletingExtendedAuth !== 'undefined') {
                responseData.finishWithoutCompletingExtendedAuth = arguments[1].finishWithoutCompletingExtendedAuth;
            }

            if (typeof arguments[1].isInstagramBusiness !== 'undefined') {
                responseData.isInstagramBusiness = arguments[1].isInstagramBusiness;
            }

            if (isReauth) {
                hootbus.emit(events.SOCIAL_NETWORK_REAUTH_SUCCESS, responseData, this.snType);
            } else {
                hootbus.emit(events.SOCIAL_NETWORK_ADD_SUCCESS, responseData, this.snType);
            }
        } else {
            responseData.errorCode = errorCode;
            responseData.errorMessage = errorMessage;
            if (isReauth) {
                hootbus.emit(events.SOCIAL_NETWORK_REAUTH_ERROR, responseData, this.snType);
            } else {
                responseData.options = options;
                hootbus.emit(events.SOCIAL_NETWORK_ADD_ERROR, responseData, this.snType);
            }
        }

        // Cleanup the callback proxy
        window.onAddSocialNetworkSuccess = undefined;
    },
    /**
     * Reject the auth promise (if one is in progress)
     *
     * @param {String} status
     * @param {String} message
     * @param {boolean} shouldShowError
     * @private
     *
     * @this {SocialNetworkConnector}
     */
    _rejectAuth: function (status, message, shouldShowError) {
        if (!this._authDeferred) { return; }

        this._authDeferred.reject({
            status: status,
            message: message,
            shouldShowError: shouldShowError
        });
    },
    /**
     * Signal that the user has cancelled the auth process
     *
     * @param {String} message
     * @param {boolean} shouldShowError
     * @this {SocialNetworkConnector}
     */
    cancelAuth: function (message, shouldShowError) {
        this._rejectAuth('cancelled', message, /*shouldShowError*/ shouldShowError);
    },
    /**
     * Signal there was an error with auth process
     *
     * @param {String} message
     * @this {SocialNetworkConnector}
     */
    errorAuth: function (message) {
        this._rejectAuth('error', message, /*shouldShowError*/ true);
    },

    /**
     * Helper to handle the fail results on external auth
     * @param data
     */
    onExternalAuthFail: function (data) {
        var cancelMessage = this.getCancelConnectMessage();
        if (data.customErrorMessage) {
            cancelMessage = data.customErrorMessage;
        }
        if (data.userClosed === true && data.userDismissedAuthPopup === true) {
            this.cancelAuth(cancelMessage, /*shouldShowError*/false);
        } else if (data.userClosed === true) {
            this.cancelAuth(cancelMessage, /*shouldShowError*/true);
        } else {
            var errorMessage = translation._("An error occurred while connecting to external API. Please try again later");
            if (data.errorCode) {
                errorMessage += "; Code: " + data.errorCode;
            }
            this.errorAuth(errorMessage);
        }
    },

    getCancelConnectMessage: function () {
        return this.cancelConnectMessage;
    },
});
SocialNetworkConnector.extend = util.extend;

export default SocialNetworkConnector;
