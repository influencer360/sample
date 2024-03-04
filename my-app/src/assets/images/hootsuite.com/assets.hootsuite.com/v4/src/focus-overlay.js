import $ from 'jquery';
import util from 'utils/util';
import domUtils from 'hs-nest/lib/utils/dom-utils';
import zIndexConstants from 'hs-nest/lib/constants/z-index';
import _ from 'underscore';

var focusOverlay = {

    ID: 'focusOverlay',

    /**
     *
     * @param el
     * @param {Object} opts
     * @param {Number} [opts.width]
     * @param {Number} [opts.height]
     * @param {{top: Number, right: Number, bottom: Number, left: Number}} [opts.padding]
     * @param {Boolean} [opts.disableView]
     * @param {Function} [opts.onDisableViewClick]
     * @param {String} [opts.customCssClass]
     */
    show: function (el, opts) {
        var $el = $(el),
            pos = $el.offset(),
            top = pos.top,
            left = util.isEdge ? Math.round(pos.left) : pos.left,
            width = util.isEdge ? Math.round($el.outerWidth()) : $el.outerWidth(),
            height = $el.outerHeight(),
            $win = $(window),
            windowWidth = $win.width(),
            windowHeight = $win.height(),
            customCssClass = "",
            disableView = false;

        if (typeof opts !== 'undefined' && opts !== null) {
            if (typeof opts.width !== 'undefined' && opts.width !== null) {
                width = parseInt(opts.width, 10);
            }
            if (typeof opts.height !== 'undefined' && opts.height !== null) {
                height = parseInt(opts.height, 10);
            }
            if (typeof opts.padding === 'object') {
                if (typeof opts.padding.top !== 'undefined') {
                    var paddingTop = parseInt(opts.padding.top);
                    top -= paddingTop;
                    if (top < 0) {
                        paddingTop += top; // reduce padding to fit border to top of screen
                        top = 0;
                    }
                    height += paddingTop;
                }
                if (typeof opts.padding.left !== 'undefined') {
                    var paddingLeft = parseInt(opts.padding.left);
                    left -= paddingLeft;
                    if (left < 0) {
                        paddingLeft += left; // reduce padding to fit border to left of screen
                        left = 0;
                    }
                    width += paddingLeft;
                }
                if (typeof opts.padding.bottom !== 'undefined') {
                    var paddingBottom = parseInt(opts.padding.bottom);
                    height += paddingBottom;
                }
                if (typeof opts.padding.right !== 'undefined') {
                    var paddingRight = parseInt(opts.padding.right);
                    width += paddingRight;
                }
            }
            if (typeof opts.disableView !== 'undefined') {
                disableView = true;
            }
            if (typeof opts.customCssClass !== 'undefined' && opts.customCssClass !== null) {
                customCssClass = opts.customCssClass;
            }
        }

        $('#foCentre').remove();

        var $left, $right, $top, $bottom, $centre;

        var zIndex = domUtils.provisionIndex(zIndexConstants.provisioning.ranges.focusOverlay);

        $left = $('#foLeft').length ? $('#foLeft') : $('<div id="foLeft" class="focusOverlay ' + customCssClass + ' animated fadeIn">').appendTo('body');
        $right = $('#foRight').length ? $('#foRight') : $('<div id="foRight" class="focusOverlay ' + customCssClass + ' animated fadeIn">').appendTo('body');
        $top = $('#foTop').length ? $('#foTop') : $('<div id="foTop" class="focusOverlay ' + customCssClass + ' animated fadeIn">').appendTo('body');
        $bottom = $('#foBottom').length ? $('#foBottom') : $('<div id="foBottom" class="focusOverlay ' + customCssClass + ' animated fadeIn">').appendTo('body');

        if (disableView) {
            $centre = $('#foCentre').length ? $('#foCentre') : $('<div id="foCentre" class="focusOverlayCentre">').appendTo('body');

            $centre.css({
                height: height,
                width: width,
                left: left,
                top: top,
                zIndex: zIndex
            });

            if (_.isFunction(opts.onDisableViewClick)) {
                // Auto-unbind after called
                $centre.one('click', opts.onDisableViewClick);
            }
        }

        $left.css({
            height: '100%',
            width: left,
            left: 0,
            top: 0,
            zIndex: zIndex
        });

        $right.css({
            height: '100%',
            width: windowWidth - width - left,
            left: left + width + 'px',
            top: 0,
            zIndex: zIndex
        });

        $top.css({
            height: top,
            width: width,
            left: left + 'px',
            top: 0,
            zIndex: zIndex
        });

        $bottom.css({
            height: windowHeight - height - top,
            width: width,
            left: left + 'px',
            top: top + height + 'px',
            zIndex: zIndex
        });
    },
    hide: function () {
        var $overlay = $('#foTop, #foBottom, #foLeft, #foRight, #foCentre');
        $overlay.remove();
    },
    /**
     * Toggles whether the overlay should animate when transitioning
     * @param {Boolean} animate
     */
    toggleAnimation: function (animate) {
        var $overlay = $('#foTop, #foBottom, #foLeft, #foRight');

        if (animate) {
            $overlay.addClass('animated');
        } else {
            $overlay.removeClass('animated');
        }
    },
    addLift: function (el) {
        var z = $('#foTop').css('z-index'),
            $style = $("<style class='_overlayLift'>" + el + " { z-index: " + z + 1 + " !important; }" + "</style>");
        $style.appendTo('body');
    },
    removeLift: function () {
        $("._overlayLift").remove();
    }

};

export default focusOverlay;
