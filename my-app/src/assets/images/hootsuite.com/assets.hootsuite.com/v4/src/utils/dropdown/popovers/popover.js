import $ from 'jquery';
import '3rd/jquery-ui';

import domUtils from 'hs-nest/lib/utils/dom-utils';

/**
 * Creates a popover, appends content to it
 * This popover will automatically close if user clicks outside of it
 * @class Represents a popover
 * @param {Object} options Configuration object
 * @param {jQuery} options.content The content of the popover
 * @param {jQuery} [options.$anchor] jquery element that will be the anchor, can be defined later but has to be defined
 * @param {string} [options.placement_my=left top] Which position on the popover to align with the anchor
 * @param {string} [options.placement_at=left bottom] Which position on the anchor to align with the popover
 * @param {string} [options.placement_collision=flipfirstorfit] How to react when the popover goes off screen : flip, fit, flipfirstorfit (default)
 * @example
 * var popover = new Popover({
     *      content: 'some <strong>content</strong>',
     *      anchor: $('.my_anchor')
     * });
 * popover.open();
 * popover.close();
 * popoven.open($('.another_anchor'));
 */
var Popover = function (options) {

    this.o = $.extend({}, this.defaults, options);

    this.$pane = $("#" + this.o.paneId);

    //This re-uses the pane
    if (!this.$pane.length) {
        this.$pane = $('<div id="' + this.o.paneId + '"></div>').appendTo('body');
    }

    // auto z-index provisioning
    var zIndex = domUtils.provisionIndex();

    this.$pane.css({
        position: 'absolute',
        'z-index': zIndex
    });
    this.setContent();
};

$.extend(Popover.prototype,
    /** @lends Popover.prototype */
    {
        /**
         * Default configuration options
         */
        defaults: {
            paneId: 'popOverPane',
            placement_my: 'left top',
            placement_at: 'left bottom',
            placement_collision: 'flipfirstorfit',
            $anchor: $([])
        },
        /**
         * Set the content of the popover
         */
        setContent: function () {
            this.$content = $('<div class="content"/>').append(this.o.content);
        },
        /**
         * Display the popover
         */
        open: function ($anchor) {
            if ($anchor && $anchor.length) {
                this.o.$anchor = $anchor;
            }
            if (!this.o.$anchor || this.o.$anchor.length === 0) {
                return;
            }
            this.$pane.find('.content').detach();
            this.$pane.html(this.$content);
            this.$pane.position({
                of: this.o.$anchor,
                my: this.o.placement_my,
                at: this.o.placement_at,
                collision: this.o.placement_collision
            });

            this.bindClosePopupEvents();

            // Added _hover class for testing mouse hover state, including IE8
            this.$pane.hover(
                function () { $(this).addClass('_hover'); },
                function () { $(this).removeClass('_hover'); }
            );
        },
        /**
         * Close the popover
         */
        close: function () {
            this.$pane.unbind('mouseenter mouseleave');
            this.o.$anchor.trigger('popoverclose');
            this.unbindClosePopupEvents();

            // Ensure _hover class is removed on close
            this.$pane.removeClass('_hover');

            this.$content.detach();
        },
        /**
         * Handler that closes the popover when user clicks outside or scrolls
         * @private
         */
        closePopupEventHandler: function (e) {
            var close = false,
                $anchor = this.o.$anchor;
            if (e.type === "mousedown") {
                var $target = $(e.target);
                if ($target.is(this.$pane) ||
                    $target.closest(this.$pane).length ||
                    $target.is($anchor) ||
                    $target.closest($anchor).length) {
                    return;
                } else {
                    close = true;
                }
            } else if (e.type === "scroll" || e.type === "blur") {
                close = true;
            } else if (e.type === "keyup" && e.keyCode == 27) {
                close = true;
            }
            if (close) {
                this.close();
                e.stopPropagation();
            }
        },
        /**
         * Unbind handler function that closes the popover
         * @private
         */
        unbindClosePopupEvents: function () {
            var self = this,
                handler = $.proxy(self.closePopupEventHandler, self);
            $('body').unbind("mousedown", handler);
            $('body').unbind("keyup", handler);
            $("#streamsScroll div._body").unbind("scroll", handler);
            $("#streamsContainer").unbind("scroll", handler);
            $('#analyticsContent').unbind("scroll", handler);
        },
        /**
         * Bind handler function that closes the popover to appropriate events
         * @private
         */
        bindClosePopupEvents: function () {
            var self = this,
                handler = $.proxy(self.closePopupEventHandler, self);
            this.unbindClosePopupEvents();
            // bind an event on the body, to check for a click outside of the preview pane
            $('body').bind("mousedown", handler);
            $('body').bind("keyup", handler);
            // also bind an event on this column, if user scrolls, it will close this pane as well
            $("#streamsScroll div._body").bind("scroll", handler);
            $("#streamsContainer").bind("scroll", handler);	// horizontal scroll
            $('#analyticsContent').bind("scroll", handler);	// when viewing reports
        }
    });

export default Popover;
