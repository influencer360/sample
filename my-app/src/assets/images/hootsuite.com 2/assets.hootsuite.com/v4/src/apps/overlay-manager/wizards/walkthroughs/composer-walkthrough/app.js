import { exitWalkthrough, startWalkthrough } from 'fe-billing-lib-walkthrough';
import { createBoundUserContext, getExperimentVariation } from 'fe-lib-optimizely';
import domUtils from "hs-nest/lib/utils/dom-utils";
import translation from "utils/translation";
import hootbus from "utils/hootbus";
import walkthroughUtils from "utils/walkthrough";
import darklaunch from 'utils/darklaunch';
import Constants from "components/publisher/constants";
import WalkthroughAppBase from "../walkthrough-app-base";
import step1 from "./steps/step1";
import step2 from "./steps/step2";
import step3 from "./steps/step3";
import step4 from "./steps/step4";
import step5 from "./steps/step5";
import step4Draft from "./steps/step4Draft";
import customizeCaptionStep from "./steps/contentLab/customizeCaptionStep";
import useOwnImageStep from "./steps/contentLab/useOwnImageStep";
import readyToGo from "./steps/contentLab/readyToGo";
import selectSocialNetworkStep from "./steps/contentLab/selectSocialNetworkStep";

// Walkthrough tracking origin.
var TRACKING_ORIGIN = 'web.dashboard.walkthrough.composer';

/**
 * @class WizardAppBase
 */
var ComposerWalkthrough = WalkthroughAppBase.extend({
    /**
     * Initialize App
     */
    onInitialize: function (options) {
        this.origin = options?.origin
        this.trackingWalkthroughName = 'compose_content';
        this.walkthroughId = 'walkthroughComposer';
        this.isTrackingOn = true;
    },

    /**
     * Start the first step, which is to initialize a popover pointing to the location of composer with no step counter
     */
    onStartWalkthrough: async function () {
        var self = this;
        if (!hs.memberExtras.hasSeenNewComposerOnboarding) {
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
        }

        var isComposerOpen = !!document.querySelector('.vk-ComposerModal');

        if (!isComposerOpen) {
            walkthroughUtils.pollForElement('.vk-NewPostButton', function () {
                var handleComposerOpen = function () {
                    exitWalkthrough();
                    self.startComposerWalkthrough();
                    hootbus.off('full_screen_composer:response:open', handleComposerOpen);
                };

                hootbus.on('full_screen_composer:response:open', handleComposerOpen);

                var onNext = function () {
                    hootbus.emit('composer.open', {});
                };

                var onExit = function () {
                    hootbus.off('full_screen_composer:response:open', handleComposerOpen);
                }

                var getTitle = function () {
                    return translation._('Let\'s get posting, ') + hs.memberName + '!';
                };

                var getDescription = function () {
                    return translation._('Post to one network or many. Publish immediately or schedule it and we\'ll post it for you later. We\'ll walk you through it.');
                };

                var buttonSelector = 'button.vk-NewPostButton > div > div';

                var steps = [
                    {
                        target: buttonSelector,
                        title: getTitle,
                        description: getDescription,
                        placement: 'right',
                        hidePrev: true,
                        onNext: onNext,
                        onExit: onExit,
                        offset: '40, 0',
                        spotlightBorderRadius: 33,
                        spotlightPadding: 6,
                        trackingName: 'step_0_new_post'
                    }
                ];
                startWalkthrough(steps, {
                    showSteps: false,
                    trackingOrigin: TRACKING_ORIGIN,
                    zIndex: domUtils.provisionIndex()
                });
            }, 50, 10000);
        } else {
            if (darklaunch.isFeatureEnabled('PGR_1659_REMOVE_COMPOSER_ONBOARDING')) {
                // PGR-1659
                // GRW_SS_ACT_PB_1
                const userContext = await createBoundUserContext()
                const decision = userContext.decide('grw_ss_act_pb_1')
                
                if(decision.variationKey === 'variation_1') {
                    walkthroughUtils.selectTwoSocialProfiles();
                } else { // Variation 0
                    self.startComposerWalkthrough();
                }
            } else { // users not in experiment who haven't seen composer onboarding
                self.startComposerWalkthrough();
            }
        }
    },

    /**
     * The rest of the walkthrough once inside of composer
     */
    startComposerWalkthrough: async function () {
        var stepsClassic = [step1, step2, step3, step4, step5];
        var stepsContentLab = [selectSocialNetworkStep, customizeCaptionStep, useOwnImageStep, step4, readyToGo];

        // GRW_SS_OB_7_0 Draft First Post
        var stepsDraftFirstPost = [step1, step2, step3, step4Draft, step4, step5];
        const draftFirstPostExperimentEnabled =
            darklaunch.isFeatureEnabled('PGR_2050_DRAFT_FIRST_POST') &&
            getExperimentVariation('grw_ss_onboarding_7_0') === 'variation_1'

        const steps = this?.origin === 'contentLab' ?
            stepsContentLab :
            draftFirstPostExperimentEnabled ?
                stepsDraftFirstPost : stepsClassic

        // Delay start of composer walkthrough to allow time for the social profile picker to initialize
        setTimeout(function () {
            startWalkthrough(steps, {
                isSpotlightAnimated: true,
                trackingOrigin: TRACKING_ORIGIN,
                zIndex: domUtils.provisionIndex()
            });
            hootbus.emit('composer:onboarding:walkthrough:open');
        }, 500);
    }
});

export default ComposerWalkthrough;
