import React from 'react';
import translation from 'utils/translation';
import WalkthroughAppBase from './walkthrough-app-base';
import {popoverArrowDefaultPosition} from './step-popover'
import Constants from 'components/publisher/constants';

var SELECTORS = Object.freeze({
    campaignSelectDropdown: '.rc-FullScreenComposer .rc-ComposerHeader .rc-CampaignSelectDropdown',
    composerFooter: '.rc-FullScreenComposer .rc-ComposerFooter',
    composerHeader: '.rc-FullScreenComposer .rc-ComposerHeader',
    feedbackButton: '.rc-FullScreenComposer .-feedbackButton',
    networkPreview: '.rc-FullScreenComposer .rc-MessagePreviewArea .-messagePreview',
    publishTimeSelector: '.rc-FullScreenComposer .rc-ComposerFooter .-publishTimeSelector',
    focusOverlay: '-newComposerFocusOverlay',
});

/**
 * @class WizardAppBase
 */
var NewComposerWalkthrough = WalkthroughAppBase.extend({
    /**
     * Initialize App
     * @param options
     */
    onInitialize: function () {
        this.trackingWalkthroughName = 'new_composer_walkthrough';
        this.walkthroughId = 'walkthroughNewComposer';
        this.showCurrentStepText = true;
        this.isTrackingOn = false;

        this.defaultPopoverProps = {
            hasCloseButton: true,
            onRequestHide: function () {
                this.exitWalkthrough({isComplete: false, showPopover: false});
            }.bind(this)
        };

        var stepOne = {
            target: SELECTORS.composerHeader,
            id: 'welcome_to_composer',
            trackStep: false,
            data: {
                title: React.createElement('span', {className: '-newComposerBetaTag'}, translation._('Welcome to Composer')), // TODO: span tag and className can be removed once Composer is no longer in beta
                content: translation._('Welcome to the Beta stage of the new full screen compose experience. Try it and let us know what you think so far.'),
                footerButtonText: translation._('Next step'),
                footerButtonAction: function () {
                    this.showNextStep();
                }.bind(this),
                arrowPosition: {horizontal: '22px', vertical: popoverArrowDefaultPosition}
            },
            onOpen: function () {
                this.spotlight.toggleAnimation(false);

                this.spotlight.show(SELECTORS.composerHeader, {customCssClass: SELECTORS.focusOverlay});
                this.adjustFocusOverlayZIndex();
            },
            tetherOptions: {
                attachment: 'top left',
                targetAttachment: 'bottom left',
                offset: '-5px 12px'
            }
        };

        if (!hs.memberExtras.hasSeenNewComposerOnboarding) {
            stepOne.tetherOptions.offset = '-5px -20px';
        }

        var campaignsOnboarding = {
            target: SELECTORS.campaignSelectDropdown,
            id: 'introducing_campaigns',
            trackStep: false,
            data: {
                title: translation._('Introducing campaigns!'),
                content: translation._('Campaigns is a way to organize and analyze all scheduled posts related to a specific event, topic or announcement. Select a campaign from the dropdown.'),
                footerButtonText: translation._('Done!'),
                footerButtonAction: function () {
                    this.exitWalkthrough({isComplete: false, showPopover: false});
                }.bind(this),
                arrowPosition: {horizontal: '22px', vertical: popoverArrowDefaultPosition}
            },
            onOpen: function () {
                this.spotlight.toggleAnimation(false);
                this.spotlight.show(SELECTORS.composerHeader, {customCssClass: SELECTORS.focusOverlay});
                this.adjustFocusOverlayZIndex();

                ajaxCall({
                    url: '/ajax/member/popup-seen',
                    data: {
                        a: 'click',
                        n: Constants.CAMPAIGNS_ONBOARDING_SEEN
                    },
                    type: 'POST',
                    success: function () {
                        hs.memberExtras.hasSeenNewComposerCampaignsOnboarding = true;
                    }
                }, 'qm');
            },
            tetherOptions: {
                attachment: 'top left',
                targetAttachment: 'bottom left',
                offset: '-5px -45px'
            }
        };

        this.stepQueue = [
            stepOne,
            {
                target: SELECTORS.networkPreview,
                id: 'network_preview',
                trackStep: false,
                data: {
                    title: translation._('Network Preview'),
                    content: translation._('Preview is where you can view how your messages will look across the social networks before publishing.'),
                    footerButtonText: translation._('Next step'),
                    footerButtonAction: function () {
                        this.showNextStep();
                    }.bind(this)
                },
                onOpen: function () {
                    this.spotlight.toggleAnimation(false);
                    this.spotlight.show(SELECTORS.networkPreview, {padding: {bottom: -32}, customCssClass: SELECTORS.focusOverlay});
                    this.adjustFocusOverlayZIndex();
                },
                tetherOptions: {
                    attachment: 'middle left',
                    targetAttachment: 'middle right',
                    offset: '12px 0'
                }
            },
            {
                target: SELECTORS.publishTimeSelector,
                id: 'publish_or_schedule_messages',
                trackStep: false,
                data: {
                    title: translation._('Publish or Schedule messages'),
                    content: translation._('You can switch between sending messages immediately and scheduling them in the future.'),
                    footerButtonText: translation._('Next step'),
                    footerButtonAction: function () {
                        this.showNextStep();
                    }.bind(this)
                },
                onOpen: function () {
                    this.spotlight.toggleAnimation(false);
                    this.spotlight.show(SELECTORS.composerFooter, {customCssClass: SELECTORS.focusOverlay});
                    this.adjustFocusOverlayZIndex();
                },
                tetherOptions: {
                    attachment: 'bottom center',
                    targetAttachment: 'top center',
                    offset: '7px 0'
                }
            },
            {
                target: SELECTORS.feedbackButton,
                id: 'feedback_for_composer',
                trackStep: false,
                data: {
                    title: React.createElement('span', {className: '-newComposerBetaTag'}, translation._('Feedback for Composer')), // TODO: span tag and className can be removed once Composer is no longer in beta
                    content: translation._('You can leave feedback at any time on how you are enjoying Composer so far.'),
                    footerButtonText: !hs.memberExtras.hasSeenNewComposerOnboarding ? translation._('Next step') : translation._('Done'),
                    footerButtonAction: function () {
                        if (!hs.memberExtras.hasSeenNewComposerOnboarding) {
                            this.showNextStep();
                        } else {
                            this.exitWalkthrough({isComplete: false, showPopover: false});
                        }
                    }.bind(this)
                },
                onOpen: function () {
                    this.spotlight.toggleAnimation(false);
                    this.spotlight.show(SELECTORS.composerHeader, {customCssClass: SELECTORS.focusOverlay});
                    this.adjustFocusOverlayZIndex();
                },
                tetherOptions: {
                    attachment: 'top center',
                    targetAttachment: 'bottom center',
                    offset: '5px 12px'
                }
            }
        ];

        if (document.querySelector(SELECTORS.campaignSelectDropdown) !== null) {
            if (hs.memberExtras.hasSeenNewComposerOnboarding) {
                this.showCurrentStepText = false;
                this.stepQueue = [campaignsOnboarding];
            } else {
                this.stepQueue.push(campaignsOnboarding);
            }
        }
    },

    /**
     * Start the walkthrough
     */
    onStartWalkthrough: function () {
        this.showStep();
    },

    /**
     * On walkthrough destroy, set the New Composer Onboarding seen value
     */
    onDestroy: function () {
        ajaxCall({
            url: '/ajax/member/popup-seen',
            data: {
                a: 'click',
                n: Constants.ONBOARDING_SEEN
            },
            type: 'POST',
            success: function () {
                hs.memberExtras.hasSeenNewComposerOnboarding = true;
            }
        }, 'qm');
    },

    adjustFocusOverlayZIndex: function () {
        var focusOverlay = document.querySelectorAll('.' + SELECTORS.focusOverlay);
        var newComposer = document.querySelector('.rc-Composer');
        if (focusOverlay && newComposer) {
            focusOverlay.forEach(function (overlay) {
                overlay.style.zIndex = Number(newComposer.style.zIndex) + 1;
            });
        }
    },
});

export default NewComposerWalkthrough;
