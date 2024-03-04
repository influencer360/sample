import FocusOverlay from 'focus-overlay';

export default {

    lastTarget: null,
    lastParams: null,

    /**
     * Highlight a dom element.
     * @param elemSelector
     * @param options
     */
    show: function (elemSelector, options) {
        FocusOverlay.show(elemSelector, options);
        this.lastTarget = elemSelector;
        this.lastParams = options;
    },

    /**
     * Remove spotlighting
     */
    hide: function () {
        FocusOverlay.hide();
        this.lastTarget = this.lastParams = null;
    },

    /**
     * Reapply the cached target and params
     */
    reapply: function () {
        if (this.lastTarget) {
            this.show(this.lastTarget, this.lastParams || {});
        }
    },

    /**
     * Toggle the transition animation for the overlay
     * @param {Boolean} animate
     */
    toggleAnimation: function (animate) {
        FocusOverlay.toggleAnimation(animate);
    }
};

