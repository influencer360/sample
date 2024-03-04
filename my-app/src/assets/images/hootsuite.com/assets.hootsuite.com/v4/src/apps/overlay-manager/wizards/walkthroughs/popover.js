import { startWalkthrough, exitWalkthrough } from 'fe-billing-lib-walkthrough';
import WalkthroughAppBase from './walkthrough-app-base';
import domUtils from 'hs-nest/lib/utils/dom-utils';

// Walkthrough tracking origin.
var TRACKING_ORIGIN = 'web.dashboard.walkthrough.popover';

/**
 * @class WizardAppBase
 */
var Popover = WalkthroughAppBase.extend({

    messageEvents: {
        'walkthrough:popover:close': 'hide',
    },

    /**
     * Initialize App
     */
    onInitialize: function (options) {
        this.walkthroughId = 'walkthroughPopover';
        this.options = options;
    },

    onStartWalkthrough: function () {
        var step = [
            {
                target: this.options.target,
                title: this.options.title,
                description: this.options.description,
                placement: this.options.placement,
                next: this.options.next,
                hidePrev: this.options.hidePrev,
                hideNext: this.options.hideNext,
                onNext: this.options.onNext,
                onEnter: this.options.onEnter,
                onExit: this.options.onExit,
                offset: this.options.offset,
                spotlightPadding: this.options.spotlightPadding,
                spotlightPaddingLeft: this.options.spotlightPaddingLeft,
                spotlightPaddingTop: this.options.spotlightPaddingTop,
                spotlightPaddingRight: this.options.spotlightPaddingRight,
                spotlightPaddingBottom: this.options.spotlightPaddingBottom,
                spotlightBorderRadius: this.options.spotlightBorderRadius,
                spotlightTargets: this.options.spotlightTargets,
                hasExitOnBackgroundClick: this.options.hasExitOnBackgroundClick,
                trackingName: this.options.trackingName,
                width: this.options.width,
            }
        ];

        startWalkthrough(step, {
            showSteps: this.options.showSteps,
            showSpotlight: this.options.showSpotlight,
            hasExit: this.options.hasExit,
            trackingOrigin: TRACKING_ORIGIN,
            zIndex: domUtils.provisionIndex()
        });
    },

    hide: function () {
        exitWalkthrough();
    }
});

export default Popover;
