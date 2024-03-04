/**
 * This app is instanced on dashboard load and listens for events to start overlays.
 * New overlays should be added to one of the the overlays collection below (currently only wizards and popups).
 *
 * Example call usage:
 *    hootbus.emit('overlay:init', wizardName, optionalParams);
 */
'use strict';

import _ from 'underscore';
import hootbus from 'utils/hootbus';
import AppBase from 'core/app-base';

import darklaunch from 'hs-nest/lib/utils/darklaunch';
import trackerDatalab from 'utils/tracker-datalab';
import StreamBuilder from 'apps/overlay-manager/wizards/stream-builder/components/stream-builder';
import EngagementWalkthrough from './wizards/walkthroughs/engagement-walkthrough';
import AddSocialNetworkWalkthrough from './wizards/walkthroughs/add-social-network-walkthrough';
import NewComposerWalkthrough from './wizards/walkthroughs/new-composer-walkthrough';
import ComposerWalkthrough from './wizards/walkthroughs/composer-walkthrough/app';
import PopoverGeneric from './wizards/popovers/popover-generic';
import Popover from './wizards/walkthroughs/popover';

import { showReauthModal } from 'components/modals/reauth-modal';
import CloneStreamsModal from './modals/clone-streams/components/clone-streams-modal';
import AcceptCloneStreamsModal from './modals/accept-clone-streams/components/accept-clone-streams-modal';
import UnableToShareSnModal from './modals/unable-to-share-sn/components/unable-to-share-sn-modal';
import ShareSocialNetworkModal from './modals/share-social-network-modal/components/share-social-network-modal';
import AddSharedSocialNetworkModal from './modals/add-shared-social-network-modal/components/add-shared-social-network-modal';
import TransferSocialNetworkModal from './modals/transfer-social-network-modal/components/transfer-social-network-modal';
import DeleteOrganization from './modals/delete-organization/components/delete-organization-modal';
import ConfirmationModal from './modals/confirmation-modal/components/confirmation-modal';
import CreateTeamWithSnsAndMembers from './modals/create-team-with-sns-and-members/components/create-team-with-sns-and-members-modal';
import InviteMembers from './modals/invite-members/components/invite-members-modal';
import FreeTrialPromoModal from './modals/free-trial-promo-modal/components/free-trial-promo-modal';
import OnboardingVideoModal from './modals/onboarding-video-modal/components/onboarding-video-modal';
import InstagramBusinessAccountOverviewModal from './modals/instagram-business-account-overview-modal/components/instagram-bunsiness-account-overview-modal';
import TwitterAccountOverviewModal from './modals/twitter-account-overview-modal/components/twitter-account-overview-modal';
import FacebookGroupAccountOverviewModal from './modals/facebook-group-account-overview-modal/components/facebook-group-account-overview-modal';
import { getModal as getExtendedAuthFlowSuccessModal } from './modals/extended-auth-flow-success-modal/components/extended-auth-flow-success-modal';
import Dialog from './modals/generic-dialog/components/dialog';

export default AppBase.extend(/** @lends OverlayApp.prototype */{
    messageEvents: {
        'overlay:init': 'initOverlay',
        'notify:overlay:closed': 'overlayNotifyClosed',
    },

    currentOverlays: {
        wizard: {},
        modal: {},
        popover: {}
    },

    /**
     * Lists of overlays by type (wizards, modals). Each overlay is expected to have at least a launch() and close() method.
     * The launch() method is called through initOverlay. The close() method is only called in instances when the manager
     * needs to handle conflicting overlays.
     *
     * @todo: Document the mandatory requirement of notifying the manager onClose of the overlay (once the method is added).
     * The unit tests will enforce that this is implemented for all new overlays.
     *
     * Expected structure:
     * wizard: {
     *     myOverlayName : {
     *         launch: (params) => {#logic to launch wizard#},
     *         close: () => {#logic to close wizard (cleanup event listeners etc)#},
     *         allowConcurrentOverlays: true //When set to true, will not close existing wizards when initialized, not will close when others are initialized
     *         ignoreIfAnotherOverlayRunning: true // When set to true, will not launch if there is any other wizard running at the moment.
     *         blockNewOverlays: true // when set to true, will not launch any other wizards if current overlay is showing
     *     }
     * },
     * modal: {}
     *
     * You will also need to update the tests in tests/js/specs/modules/apps/overlay-manager/app-spec.js,
     * making sure that your overlay notifies the manager on being closed.
     */
    wizard: {
        streamBuilder: {
            launch: function(params) {
                new StreamBuilder(params);
            },
            close: function() {
                hootbus.emit('stream:builder:close');
            },
            blockNewOverlays: !darklaunch.isFeatureEnabled('PGR_412_STREAM_BUILDER_ALLOW_NEW_OVERLAYS'),
            allowConcurrentOverlays: darklaunch.isFeatureEnabled('PGR_412_STREAM_BUILDER_ALLOW_NEW_OVERLAYS')

        },
        walkthroughEngagement: {
            launch: function(params) {
                new EngagementWalkthrough(params).startWalkthrough();
            },
            close: function() {
                hootbus.emit('walkthrough:close');
            }
        },
        walkthroughAddSocialNetwork: {
            launch: function(params) {
                if (darklaunch.isFeatureEnabled('PGR_828_SOCIAL_NETWORK_MODAL_DEEPLINK')) {
                    hootbus.emit('socialNetwork:addNetwork:modal');
                } else {
                    new AddSocialNetworkWalkthrough(params).startSNWalkthrough();
                }
            },
            close: function() {
                if (darklaunch.isFeatureEnabled('PGR_828_SOCIAL_NETWORK_MODAL_DEEPLINK')) {
                    hootbus.emit('socialNetwork:addNetwork:close')
                } else {
                    hootbus.emit('walkthrough:close');
                }
            }
        },
        walkthroughNewComposer: {
            launch: function(params) {
                new NewComposerWalkthrough(params).startWalkthrough();
            },
            close: function() {
                hootbus.emit('walkthrough:close');
            }
        },
        walkthroughComposer: {
            launch: function(params) {
                new ComposerWalkthrough(params).startWalkthrough();
            },
            close: function() {
                hootbus.emit('walkthrough:close');
            }
        }
    },

    modal: {
        addSharedSocialNetwork: {
            launch: function (params) {
                new AddSharedSocialNetworkModal(params).render();
            },
            close: function () {
                hootbus.emit('addSharedSocialNetworkModal:close');
            },
            allowConcurrentOverlays: true
        },
        createTeamWithSnsAndMembers: {
            launch: function (params) {
                new CreateTeamWithSnsAndMembers(params).render();
            },
            close: function () {
                hootbus.emit('createTeamWithSnsAndMembers:close');
            },
            allowConcurrentOverlays: true
        },
        freeTrialPromo: {
            launch: function (params) {
                new FreeTrialPromoModal(params).render();
            },
            close: function () {
                hootbus.emit('freeTrialPromoModal:close');
            },
            allowConcurrentOverlays: true
        },
        transferSocialNetwork: {
            launch: function (params) {
                new TransferSocialNetworkModal(params).render();
            },
            close: function () {
                hootbus.emit('transferSocialNetworkModal:close');
            },
            allowConcurrentOverlays: true
        },
        shareSocialNetwork: {
            launch: function (params) {
                new ShareSocialNetworkModal(params).render();
            },
            close: function () {
                hootbus.emit('shareSocialNetworkModal:close');
            },
            allowConcurrentOverlays: true
        },
        socialNetworkExpirationModal: {
            launch: function (params) {
                showReauthModal(params.data ? params.data.invalidSocialNetworkRecords : undefined);
            },
            close: function () {
                hootbus.emit('notify:overlay:closed', 'modal', 'socialNetworkExpirationModal');
            }
        },
        deleteOrganization: {
            launch: function (params) {
                new DeleteOrganization(params).render();
            },
            close: function () {
                hootbus.emit('modals:delete_organization:destroy');
            }
        },
        cloneStreams: {
            launch: function (params) {
                new CloneStreamsModal(params).render();
            },
            close: function () {
                hootbus.emit('modals:clone:streams:destroy');
            }
        },
        unableToShareSN: {
            launch: function (params) {
                new UnableToShareSnModal(params).render();
            },
            close: function () {
                hootbus.emit('modals:unable:to:share:sn:destroy');
            }
        },
        confirmationModal: {
            launch: function (params) {
                new ConfirmationModal(params);
            },
            close: function () {
                hootbus.emit('modals:confirmation:modal:destroy');
            }
        },
        acceptCloneStreams: {
            launch: function (params) {
                new AcceptCloneStreamsModal(params).render();
            },
            close: function () {
                hootbus.emit('modals:accept:clone:streams:destroy');
            }
        },
        inviteMembers: {
            launch: function (params) {
                new InviteMembers(params).render();
            },
            close: function () {
                hootbus.emit('inviteMembersModal:close');
            }
        },
        onboardingVideo: {
            launch : function (params) {
                new OnboardingVideoModal(params).render();
            },
            close: function () {
                hootbus.emit('popups:onboarding:video:modal:close');
            },
            allowConcurrentOverlays: true
        },
        instagramBusinessAccountOverview: {
            launch: function () {
                new InstagramBusinessAccountOverviewModal().render()
            },
            close: function () {
                hootbus.emit('instagramBusinessAccountOverview:close')
                }
        },
        extendedAuthFlowSuccess: {
            launch: function (params) {
                getExtendedAuthFlowSuccessModal(true, params);
            },
            close: function () {
                getExtendedAuthFlowSuccessModal(false);
            }
        },
        twitterAccountOverview: {
            launch: function () {
                new TwitterAccountOverviewModal().render()
            },
            close: function () {
                hootbus.emit('twitterAccountOverview:close')
            }
        },
        facebookGroupAccountOverview: {
            launch: function () {
                new FacebookGroupAccountOverviewModal().render()
            },
            close: function () {
                hootbus.emit('facebookGroupAccountOverview:close')
            }
        },
        dialog: {
            launch: function (params) {
                new Dialog(params);
            },
            close: function () {
                hootbus.emit('dialog:close');
            },
            allowConcurrentOverlays: function(params) {
                return params.allowConcurrentOverlays;
            }
        },
    },

    popover: {
        popoverGeneric: {
            launch: function (params) {
                new PopoverGeneric(params).show();
            },
            close: function () {
                hootbus.emit('popover:generic:close');
            }
        },
        walkthroughPopover: {
            launch: function (params) {
                new Popover(params).startWalkthrough();
            },
            close: function () {
                hootbus.emit('walkthrough:popover:close');
            }
        },
    },

    /**
     * Returns whether an overlay is currently showing. @todo: Can expand on this to query by type.
     * @returns {boolean}
     */
    isOverlayShowing: function () {
        var isShowing = false;
        _.each(this.currentOverlays, function (overlaysByType) {
            if (_.keys(overlaysByType).length > 0) {
                isShowing = true;
            }
        });
        return isShowing;
    },

    shouldBlockNewOverlays: function () {
        var shouldBlockNewOverlays = false;

        _.each(this.currentOverlays, function (overlaysByType) {
            _.each(overlaysByType, function (overlay) {
                if (overlay.blockNewOverlays) {
                    shouldBlockNewOverlays = true;
                    return;
                }
            });
        });
        return shouldBlockNewOverlays;
    },

    /**
     * Initializes and starts an overlay.
     * @param overlayType
     * @param overlayName
     * @param params
     */
    initOverlay: function(overlayType, overlayName, params) {
        trackerDatalab.trackCustom('web.dashboard.overlay', 'overlay_triggered', {
            type: overlayType,
            name: overlayName,
            trackingName: params && params.trackingName
        });

        // exit if current wizard running should block new overlays
        if (this.shouldBlockNewOverlays()) {
            return;
        }

        //Attempt to find the said wizard in the wizards list.
        var newOverlay = _.has(this[overlayType], overlayName) ? this[overlayType][overlayName] : null;

        if (!newOverlay) return;//Exit if no wizard found.

        // exit if there is any wizard running and the newWizard should be ignored
        if (newOverlay.ignoreIfAnotherOverlayRunning && this.isOverlayShowing()) {
            return;
        }

        //If the new overlay doesn't allow concurrent overlays to be displayed, then close all current
        //overlays that also do not allow concurrent overlays.
        if (!newOverlay.allowConcurrentOverlays) {
            _.each(this.currentOverlays, _.bind(function (overlaysByType, overlayType) {
                _.each(overlaysByType, _.bind(function(overlay, overlayName) {
                    if (!overlay.allowConcurrentOverlays && _.has(overlay, 'close')) {
                        overlay.close();
                        delete this.currentOverlays[overlayType][overlayName];//Remove from current wizards collection.
                    }
                }, this));
            }, this));
        }
        //Launch the new wizard.
        if (_.has(newOverlay, 'launch')) {
            this.currentOverlays[overlayType][overlayName] = newOverlay;
            newOverlay.launch(params);
        }
    },

    overlayNotifyClosed: function (overlayType, overlayName) {
        if (this.currentOverlays[overlayType] && this.currentOverlays[overlayType][overlayName]) {
            delete this.currentOverlays[overlayType][overlayName];
        }
    }
});
