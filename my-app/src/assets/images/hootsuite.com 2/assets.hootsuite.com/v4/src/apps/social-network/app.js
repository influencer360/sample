/**
 * Replaces much of settings/social_network
 * Wires together pop-ups and social-core for users adding social networks
 * Not part of social-core because it's specific to the settings functionality
 */
import _ from "underscore";
import hootbus from "utils/hootbus";
import translation from "utils/translation";
import util from "utils/util";
import statusHelper from "utils/status-helper";
import AppBase from 'core/app-base';
import modals from "apps/social-network/views/modals";
import config from "core/social-network/config";
import snActions from "../../core/social-network/actions";
import UiContexts from "../../core/social-network/ui-contexts";
import ExternalAuthenticator from "../../core/social-network/external-authenticator";
import {FACEBOOK} from 'utils/social-networks';
import {YOUTUBECHANNEL} from 'utils/social-networks';
import {TIKTOKBUSINESS} from 'utils/social-networks';
import {PINTEREST} from 'utils/social-networks';
import {INSTAGRAMBUSINESS} from 'utils/social-networks';
import {TWITTER} from 'utils/social-networks';
import {LINKEDIN} from 'utils/social-networks';
import {INSTAGRAM} from 'utils/social-networks';
import {WHATSAPP} from 'utils/social-networks';

import {getMemberPlan, isInOrganization, getMemberSocialNetworkLimitation} from 'fe-lib-hs'
import {hasMemberReachedSNMax, isSocialNetworkPaywallEnabled} from 'fe-lib-pendo'
import baseFlux from 'hs-nest/lib/stores/flux';
import {ORGANIZATIONS, SOCIAL_NETWORK_PROFILES} from 'hs-nest/lib/actions';

import {ajaxRequest} from '../../utils/ajax-promise';
import keyMirror from "keymirror";
import { isFeatureEnabled } from "fe-pnc-lib-darklaunch";

const NO_PERMISSION_TO_TRANSFER_IN_ORG = 45; // errorCode 45 is encoded when the user has no permission to transfer a sn
const ERROR_AUTH_SOCIAL_NETWORK_LIMIT_REACHED = 104; // errorCode 104 (in Static_AppController.php) is when user exceeds sn cap
const ERROR_FORKED_AUTH_CANNOT_DOWNGRADE_INSTAGRAM_BUSINESS = 120; // errorCode 120 (in Static_AppController.php) is when user tries to downgrade an owned IGB profile
const types = keyMirror({
    YOUTUBECHANNEL: null,
    PINTEREST: null,
});

const getProfilesV2 = (organizationId) => {
    return ajaxRequest(
        hs.facadeApiUrl + "/v2.0/social-profiles?splitPrivateProfiles=true",
        "GET",
        {
            data: {
                includeSuggested: true,
                includeTeams: true,
                organizationId,
            },
            credentials: "include",
        }
    ).then((d) => {
        const data = d.data;
        let suggested = null;
        let teams = [];
        if (Array.isArray(data.socialProfiles)) {
            const findProfiles = (ids) => {
                return data.socialProfiles.filter((socialProfile) => {
                    return (
                        ids &&
                        Array.isArray(ids.socialProfileIds) &&
                        ids.socialProfileIds.includes(
                            socialProfile.socialProfileId
                        )
                    );
                });
            };
            if (Array.isArray(data.suggested)) {
                const suggestedSocialProfileIds = data.suggested.filter(
                    (suggestedItem) => suggestedItem.socialProfileIds
                );
                suggested = suggestedSocialProfileIds
                    .map((ids) => ({
                        socialProfiles: findProfiles(ids),
                    }))
                    .filter((profile) => profile.socialProfiles.length > 0);
            }
            if (Array.isArray(data.teams)) {
                teams = data.teams.filter((team) => {
                    team.socialProfiles = findProfiles(team);
                    // Filter out any YouTube or Pinterest social profiles
                    team.socialProfiles = team.socialProfiles.filter(
                        (sn) =>
                            sn.socialProfileType !== types.YOUTUBECHANNEL &&
                            sn.socialProfileType !== types.PINTEREST
                    );
                    // sync socialProfileIds array with filtered socialProfiles array
                    team.socialProfileIds = team.socialProfiles.map(
                        (sn) => sn.socialProfileId
                    );
                    // remove this team if no social profiles remain after filter out pinterest and youtube
                    return (
                        team.socialProfileIds.length > 0 &&
                        team.socialProfiles.length > 0
                    );
                });
            }
        }
        return {
            privateSocialProfiles: data.privateSocialProfiles,
            socialProfiles: data.socialProfiles,
            suggestedNetworks: suggested,
            teams: teams,
        };
    });
};

export default AppBase.extend(
    /** @lends SocialNetworkApp.prototype */ {
        messageEvents: {
            // Modal calls
            "socialNetwork:addNetwork:instagramType": "selectInstagramType",
            "socialNetwork:addNetwork:modal": "showAddNetworkModal",
            "socialNetwork:addNetwork:close": "closeAddNetworkModal",
            "socialNetwork:addNetwork:direct": "addNetworkDirectly",
            "socialNetwork:showPaywall:tiktokbusiness": "showTikTokBusinessPaywallModal",
            "socialNetwork:transfer:modal": "showTransferModal",
            "socialNetwork:socialNetworkExpiration:modal":
                "showSocialNetworkExpirationModal",
            "socialNetwork:deleteNetwork:action": "onDeleteAction",
            "socialNetwork:sync:action": "onSyncAction",

            // Service events
            "socialNetwork:authorize:error": statusHelper.displayError,
            "socialNetwork:addAccount:success": "onAddAccountSuccess",
            "socialNetwork:addAccount:error": "onAddAccountError",
            "socialNetwork:addAccount:complete": "onAddAccountComplete",
            "socialNetwork:addAccount:transfer": "renderTransferModal",
            "socialNetwork:transfer:success": "onAccountTransferSuccess",
            "socialNetwork:transfer:error": "onTransferError",
            "socialNetwork:reauthorize:success": statusHelper.displaySuccess,
            "socialNetwork:reauthorize:error":
            statusHelper.displayErrorIfDefined,
            "socialNetwork:loadingIdentities": statusHelper.displayLoading,
            "socialNetwork:delete:success": "onDeleteSuccess",
            "socialNetwork:delete:error": statusHelper.displayError,
        },

        // Whether a modal is currently overlayed (to re-route messages)
        isModalShowing: false,

        getPrivateAccountAmount: function () {
            if (typeof window.hs === 'object') {
                return Object.values(window.hs.socialNetworks).filter(
                    ({ ownerType }) => ownerType === 'MEMBER'
                ).length;
            }
        },

        /**
         * Open the appropriate modal for adding an instagram profile
         *
         * @param {String} orgAndTeam
         */
        instagramAddFlow: function (orgAndTeam) {
            const isDisableIGPersonalExperimentActive = isFeatureEnabled("CI_3360_DISABLE_ADD_IG_PERSONAL");
            const isOnboarding = (!hs?.dashboardState);
            if (isDisableIGPersonalExperimentActive && isOnboarding) {
                // Route to IGB Auth flow instead
                hootbus.emit("socialNetwork:addNetwork:igbAuthProcess", orgAndTeam);
            } else {
                // Display Select Instagram Type Modal
                modals.SelectInstagramProfileTypeModal(orgAndTeam);
            }
        },

        /**
         * Connect modals from the Instagram auth flow
         *
         * @param {String} orgAndTeam
         */
        selectInstagramType: function (orgAndTeam) {
            isInOrganization().then((isInOrg) => {
                const canAddSocialNetwork = !hasMemberReachedSNMax() || isInOrg;

                if (canAddSocialNetwork) {
                    this.instagramAddFlow(orgAndTeam);
                } else {
                    statusHelper.displayError({
                        message: translation._("You’ve already connected %d social accounts. [Link]Upgrade your plan[/Link] to manage additional accounts and save more time.")
                            .replace("%d", this.getPrivateAccountAmount())
                            .replace("[Link]", '<a href="https://www.hootsuite.com/plans/upgrade">')
                            .replace("[/Link]", '</a>')
                    });
                }
            });
        },

        /**
         * ConnectSN
         * STEP 1a: Show the popup
         *
         * @param options
         * @param {Number} options.organizationId
         * @param {boolean} options.createTab
         * @param {String} options.selectedSocialNetwork social network type to have selected
         * @param {Function} options.onSuccess deprecated, use success and complete event for new implementations
         * @param {Function} options.onComplete deprecated, use success and complete event for new implementations
         */
        showAddNetworkModal: function (options) {
            isInOrganization().then((isInOrg) => {
                const canAddSocialNetwork = !hasMemberReachedSNMax()

                if (
                    isSocialNetworkPaywallEnabled()
                    && !isInOrg
                ){

                    if (canAddSocialNetwork) {
                        this.showAddNetworkModalWorker(options);
                    }

                } else {
                    this.showAddNetworkModalWorker(options);
                }
            })
        },

        showAddNetworkModalWorker: function (options) {
            options = options || {};
            this.addOptions = options;

            var self = this;
            util.promiseRealSuccess(
                ajaxCall(
                    {
                        url: "/ajax/network/add",
                        type: "GET",
                        data: {
                            organizationId: options.organizationId,
                        },
                    },
                    "q1"
                )
            )
                .done(function (data) {
                    self.addModal = modals.AddSocialAccountModal(data, options);
                })
                .fail(function (jqXHR, textStatus, errorThrown, data) {
                    // FeatureAccessDenied pop-up returns Forbidden
                    if (errorThrown !== "Forbidden") {
                        statusHelper.displayError(data);
                    }
                });
        },

        closeAddNetworkModal: function () {
            this.addModal && this.addModal.close();
            this.addModal = null;
        },

        setModalParams: function (params) {
            this.modalParams = params;
        },

        /**
         * @see TikTokBusinessPaywallModal
         *
         * Launch the TikTok Business Paywall Modal
         */
        showTikTokBusinessPaywallModal: function () {
            modals.TikTokBusinessPaywallModal();
        },

        /**
         * @see TransferNetworkModal
         *
         *
         * @param {Number} socialNetworkId
         * @param options
         * @param {Function} options.onSuccess
         */
        showTransferModal: function (socialNetworkId, options) {
            var self = this;
            util.promiseRealSuccess(
                ajaxCall(
                    {
                        url: "/ajax/network/transfer-popup",
                        data: {socialNetworkId: socialNetworkId},
                    },
                    "q1"
                )
            )
                .done(function (data) {
                    _.extend(options, {
                        createTab: !data.ignoreNewTab,
                        saveCheckbox: true,
                        isUsedForMemberAuth: data.isUsedForMemberAuth,
                    });
                    self.renderTransferModal(data, null, options);
                })
                .fail(function (jqXHR, textStatus, errorThrown, data) {
                    data.errorMessage = data.errorMsg;
                    statusHelper.displayError(data);
                });
        },

        showSocialNetworkExpirationModal: function () {
            // get all expired/expiring social networks using ajax call
            util.promiseRealSuccess(
                ajaxCall(
                    {
                        url: "/ajax/network/get-expired-social-networks",
                        data: "includeDismissed=true&prioritizeActionableProfiles=true",
                    },
                    "q1"
                )
            )
                .done(function (data) {
                    // render modal with success callback
                    hootbus.emit(
                        "overlay:init",
                        "modal",
                        "socialNetworkExpirationModal",
                        {data: data}
                    );
                })
                .fail(function (jqXHR, textStatus, errorThrown, data) {
                    statusHelper.displayError(data);
                });
        },

        /**
         * Bypass the add account modal and authorize for a specific social network (used for Hootlet)
         *
         * @param snType
         * @param options
         * @param options.organizationId
         *
         * @param {boolean} options.createTab
         * @param {boolean} options.follow
         * @param {Function} [options.onSuccess]
         * @param {Function} [options.onComplete]
         */
        addNetworkDirectly: function (snType, options) {
            this.addOptions = options;
            var data = _.pick(options, "organizationId", "uiContext");
            hootbus.emit("socialNetwork:authorize:command", snType, data);
        },

        /**
         * We're done here and want to refresh the socialNetwork data
         *
         * @param data
         * @param {boolean} [data.isMultiIdentity]
         * @param {String} snType
         */
        onAddAccountSuccess: function (data, snType) {
            var showAuthSuccess = !!data.authSuccessOne && (hs.dashboardState === "organizations" || hs.dashboardState === "home") && (snType.toUpperCase() !== WHATSAPP || (snType.toUpperCase() === WHATSAPP && hs.isFeatureEnabled("CI_4310_WHATSAPP_AUTH_SUCCESS")))
            if (
                snType.toUpperCase() === INSTAGRAM &&
                data.finishWithoutCompletingExtendedAuth
            ) {
                statusHelper.displayWarning({
                    message: translation._(
                        "The Instagram profile you’ve connected has limited functionality until you connect it to your business page in Facebook."
                    ),
                });

            } else if (showAuthSuccess) {
                modals.AuthSuccessModal(data.authSuccessOne);
            } else {
                this.displaySuccess();
            }

            if (
                snType.toUpperCase() == LINKEDIN ||
                snType.toUpperCase() == PINTEREST ||
                snType.toUpperCase() == INSTAGRAM ||
                snType.toUpperCase() == INSTAGRAMBUSINESS ||
                snType.toUpperCase() == FACEBOOK ||
                snType.toUpperCase() == YOUTUBECHANNEL ||
                snType.toUpperCase() == TWITTER ||
                snType.toUpperCase() == TIKTOKBUSINESS
            ) {
                // Original options passed in from showAddNetworkModal
                var requestData = this.addOptions || {};
                var callbacks = _.pick(requestData, "onSuccess", "onComplete");
                if (callbacks && typeof callbacks.onComplete != "undefined") {
                    callbacks.onComplete();
                }

                if (callbacks && typeof callbacks.onSuccess != "undefined") {
                    if (data.socialNetworkId && data.success) {
                        callbacks.onSuccess(data);
                    }
                }
            }

            this.addOptions = null;

            if (!data || !data.isMultiIdentity) {
                this.closeAddNetworkModal();
            }
            hootbus.emit("socialNetwork:refresh:command");

            this.accountAddSuccessFollowup(data, snType);
        },

        /**
         * An error during the add process
         * if the error is caused because the member has no permissions in the org show the "unable to share" modal
         * otherwise display a toast with the error message
         * @param data
         */
        onAddAccountError: function (data) {
            switch (data.errorCode) {
                case NO_PERMISSION_TO_TRANSFER_IN_ORG:
                    hootbus.emit(
                        "overlay:init",
                        "modal",
                        "unableToShareSN",
                        _.pick(
                            data,
                            "socialNetworkName",
                            "socialNetworkOwnerName"
                        )
                    );
                    break;
                case ERROR_AUTH_SOCIAL_NETWORK_LIMIT_REACHED:
                    Promise.all([getMemberPlan(), getMemberSocialNetworkLimitation(), isInOrganization()]).then((values) => {
                        const memberPlan = values[0];
                        const socialNetworkLimit = values[1];
                        const isInOrg = values[2];

                        if (!isSocialNetworkPaywallEnabled()) {
                            data.feature = "SOCIAL_NETWORKS"; // Paywall referrer
                            dashboard.showFeatureAccessDeniedPopup(
                                data,
                                function () {
                                }
                            );
                        } else if (memberPlan !== 'FREE' || socialNetworkLimit > 2 || isInOrg) {
                            data.feature = "SOCIAL_NETWORKS"; // Paywall referrer
                            dashboard.showFeatureAccessDeniedPopup(
                                data,
                                function () {
                                }
                            );
                        }
                    })
                    break;
                case ERROR_FORKED_AUTH_CANNOT_DOWNGRADE_INSTAGRAM_BUSINESS:
                    modals.IgbStealDowngradeErrorModal(data.options);
                    break;
                default:
                    statusHelper.displayErrorIfDefined(data);
            }
        },

        /**
         * This function can be used to call any network specific function after successfully adding the network
         * This function is called after successfully adding a new account as well as after successfully transferring an existing account
         *
         * @param data
         * @param snType
         */
        accountAddSuccessFollowup: function (data, snType) {
            // For some reason, sntype is `instagram` here, not INSTAGRAM. Patching for now in a safe way
            snType = snType.toUpperCase();
            switch (snType) {
                case config.c.INSTAGRAM:
                    var isInstagramBusiness =
                        data &&
                        typeof data.extendedAuthFlow !== "undefined" &&
                        data.extendedAuthFlow.networkType ===
                        config.c.INSTAGRAMBUSINESS;
                    // Don't show the success modal when user left the flow after failing to auth with the right Facebook account (exit with limited functionalities)
                    var finishWithoutCompletingExtendedAuth =
                        !!data.finishWithoutCompletingExtendedAuth;
                    if (
                        isInstagramBusiness &&
                        !finishWithoutCompletingExtendedAuth
                    ) {
                        hootbus.emit(
                            "overlay:init",
                            "modal",
                            "extendedAuthFlowSuccess",
                            data.extendedAuthFlow
                        );
                    }
                    break;
                case config.c.TWITTER:
                    if (hs.isFeatureEnabled("ADS_707_ACTIVATE_TWITTER")) {
                        if (data && data.uiContext === UiContexts.ADS) {
                            var url =
                                hs.util.getUrlRoot() +
                                "/hsads/twitter-authorize?snId=" +
                                encodeURIComponent(data.socialNetworkId);
                            window.open(
                                url,
                                ExternalAuthenticator.generateEventId("twitter")
                            );
                        }
                    }
                    break;
            }

            //if configured data, show followup popover tooltip on the new post menu
            var isFullScreenComposerOpen = document.querySelector(
                ".rc-FullScreenComposer"
            );
            if (isFullScreenComposerOpen) {
                var orgStore = baseFlux.getStore(ORGANIZATIONS);
                var selectedOrganization = orgStore.getSelectedOrganization();
                try {
                    var getSocialProfiles = getProfilesV2(
                        selectedOrganization &&
                        selectedOrganization.organizationId
                    );
                    getSocialProfiles.then(function (data) {
                        if (data.socialProfiles && data.suggestedNetworks) {
                            baseFlux.getActions(SOCIAL_NETWORK_PROFILES).setSocialProfiles(data.socialProfiles);
                            baseFlux.getActions(SOCIAL_NETWORK_PROFILES).setSuggestedNetworks(data.suggestedNetworks);
                        }
                        if (data.privateSocialProfiles) {
                            baseFlux.getActions(SOCIAL_NETWORK_PROFILES).setPrivateSocialProfiles(data.privateSocialProfiles);
                        }
                        if (data.teams) {
                            baseFlux.getActions(SOCIAL_NETWORK_PROFILES).setTeamProfiles(data.teams);
                        }
                    });
                } catch (e) {
                    hs.statusObj.update(
                        translation._("Unable to fetch social profiles"),
                        "error",
                        true
                    );
                }
            }
        },

        /**
         * Either called as follow-up to an attempted 'add social network' that's already owned by another account
         * OR After someone has triggered the transfer network modal directly through {@link showTransferModal}
         *
         * @param {string} snType
         * @param {{}} data
         * @param {SocialNetworkData} data.socialNetwork
         * @param {string} data.currentOwnerType "member"|"organization"
         * @param {Object} data.currentOwner member or organization data
         * @param {Object} [data.addForOrganization] The target organization for adding the profile
         * @param {{}} options
         * @param {Function} options.onSuccess
         * @param {Function} options.onComplete
         * @param {boolean} options.createTab
         * @param {boolean} options.saveCheckbox
         * @param {boolean} options.isUsedForMemberAuth
         */
        renderTransferModal: function (data, snType, options) {
            if (this.transferModal && this.transferModal.close) {
                this.transferModal.close();
            }

            var callbacks = this.addOptions
                ? _.pick(this.addOptions, "onSuccess", "onComplete")
                : {};
            this.transferModal = new modals.TransferNetworkModal(
                this.getModalOptions(data, callbacks, options)
            );
            this.transferModal.render();
        },

        /**
         * Get the options to apply to a spawned modal. Mostly used for Hootlet differences
         *
         * @param {Object} data the data attribute for modal rendering
         * @param {...Object} Additional parameter bundles to merge together
         * @returns {Object}
         */
        getModalOptions: function (data) {
            // Convert to proper array
            var args = Array.prototype.slice.call(arguments);
            // All the arguments except the data argument (which needs to be wrapped)
            args.splice(0, 1, {data: data});
            // Add params for modal override if specified
            if (_.isObject(this.modalParams)) {
                args.push({params: this.modalParams});
            }

            return _.extend.apply(null, args);
        },

        /**
         * Transfer a previously owned account, close the transfer modal, and refresh social networks
         */
        onAccountTransferSuccess: function (data) {
            this.displaySuccess();

            this.transferModal && this.transferModal.close();
            this.transferModal = null;

            this.closeAddNetworkModal();

            hootbus.emit("socialNetwork:refresh:command");

            if (
                typeof data !== "undefined" &&
                typeof data["snType"] !== "undefined"
            ) {
                this.accountAddSuccessFollowup(data, data["snType"]);
            }
        },

        /**
         * If there's an error during the transfer process, close the transfer modal for UX
         * @param data
         */
        onTransferError: function (data) {
            statusHelper.displayErrorIfDefined(data);

            this.transferModal && this.transferModal.close();
            this.transferModal = null;
        },

        /**
         * Remove a social network from the current user (or organisation given permission)
         *
         * @param {Number|array} socialNetworkIds
         * @param callbacks
         * @param {Function} callbacks.onSuccess
         *
         * @see SocialNetworkService#deleteAccountCommand
         */
        onDeleteAction: function (socialNetworkIds, callbacks) {
            callbacks = callbacks || {};

            hs.statusObj.update(translation._("Deleting network..."), "info");
            callbacks.onComplete = _.bind(hs.statusObj.reset, hs.statusObj);

            snActions.deleteAccount(socialNetworkIds, callbacks);
        },

        onDeleteSuccess: function () {
            hootbus.emit("socialNetwork:refresh:command");
        },

        /**
         * Synchronise the display name and avatar for a social network
         *
         * @param {Number} socialNetworkId
         * @param [callbacks]
         * @param {Function} callbacks.onSuccess
         */
        onSyncAction: function (socialNetworkId, callbacks) {
            statusHelper.displayLoading();
            hootbus.emit(
                "socialNetwork:sync:command",
                socialNetworkId,
                callbacks
            );
        },

        /**
         * Suppress global message display when in modal view
         */
        displaySuccess: function () {
            if (!this.isModalShowing) {
                statusHelper.displaySuccess();
            }
        },
    }
);
