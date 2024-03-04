import $ from 'jquery';
import _ from 'underscore';
import hootbus from 'utils/hootbus';
import domUtils from 'hs-nest/lib/utils/dom-utils';

var bubblePopup = (function () {
    /**
     * Creates a bubble popup
     */
    function BubblePopup() {
        var _paneId = 'bubblePopPane';
        var _$pane = [];
        var _openDelayTimeout = null,
            _openDelay = 1000;
        var _$lastAnchor,		// used to prevent opening again when user clicks repeatedly on an anchor (only works for anchors)
            _lastPos,
            _lastParams = {};
        var __this = this;		// context

        /**
         * add the bubble container to the dom if not already here and reset the innerhtml with the loading content
         * @private
         */
        var makePopup = function (params) {
            _$pane = $("#" + _paneId);
            if (!_$pane.length) {
                _$pane = $('<div id="' + _paneId + '" class="animated fadeInLeft"></div>').appendTo("body");
            }
            // put loading html in
            _$pane.html('<div class="_content content"><img src="' + hs.util.rootifyImage('/module-loader-small.gif') + '" alt="" class="spinner _loading" /></div><span class="icon-static-19 tip"></span>');

            _$pane.css({
                'width': '',
                'height': ''
            });

            _$pane.css({
                'zIndex': domUtils.provisionIndex()
            });

            if (params.width) {
                _$pane.css('width', params.width);
            }
            if (params.height) {
                _$pane.css('height', params.height);
            }
            if (params.cssClass) {
                _$pane.addClass(params.cssClass);
            }
            if (params.inComposeBox) {
                _$pane.addClass('_keepExpanded');
            }

            return _$pane;
        };

        /**
         * Save arguments (top, left, orientation) to _lastPos private object
         * @private
         * @param {Number} top
         * @param {Number} left
         * @param {String} [orientation='h'] Orientation, accepts h or v
         */
        var setLastPos = function (orientation) {
            orientation = orientation || "h";	// default horizontal
            _lastPos = {"orientation": orientation};
        };

        /**
         * Reset _lastPos to an empty object
         * @private
         */
        var clearLastPos = function () {
            _lastPos = null;
        };

        /**
         * Tests whether _lastAnchor is equivalent to anchor argument
         * @private
         * @param {String} anchor Anchor selector
         * @returns {Boolean}
         */
        var isAlreadyOpen = function (anchor) {
            var $anchor = $(anchor);
            if (!$anchor.length) {
                return false;
            }

            if (_$lastAnchor && _$lastAnchor.length && _$lastAnchor.get(0) === $anchor.get(0)) {
                return true;
            }
            return false;
        };

        /**
         * Tests whether bubble container is in its loading state
         * @private
         */
        var isLoading = function () {
            if (_$pane.length && _$pane.find("._loading").length) {
                return true;
            } else {
                return false;
            }
        };

        /**
         * closePopupEventHandler
         * @private
         * @param {Event} e
         */
        var closePopupEventHandler = function (e) {
            var isClose = false;

            if (e.type == "click") {
                var $target = $(e.target);

                if ($target.attr("id") == _paneId ||
                    $target.closest("#" + _paneId).length ||
                    $target.is("._bubblePopup") ||
                    $target.closest("._bubblePopup").length ||
                    $target.is('body')) { // The last condition is required to fix a bug in Streams with the tag selector (when on mouseup, the target is different than the target on mousedown - click gets the body as the target)
                    return;
                } else {
                    // close pane immediately
                    isClose = true;
                }
            } else if (e.type == "scroll") {
                // close pane immediately
                isClose = true;
            } else if (e.type == "blur") {
                isClose = true;
            }

            if (isClose) {
                __this.close();
            }
        };

        /**
         * Unbind close popup events
         * @private
         */
        var unbindClosePopupEvents = function () {
            $('body').unbind("click", closePopupEventHandler);
            $("#streamsScroll div._body").unbind("scroll", closePopupEventHandler);
            $("#streamsContainer").unbind("scroll", closePopupEventHandler);
            $('#analyticsContent').unbind("scroll", closePopupEventHandler);
        };

        /**
         * Binds events so that bubble will close on events like click outside, scroll streams.
         * @private
         */
        var bindClosePopupEvents = function () {
            unbindClosePopupEvents();
            // bind an event on the body, to check for a click outside of the preview pane
            $('body').bind("click", closePopupEventHandler);
            // also bind an event on this column, if user scrolls, it will close this pane as well
            $("#streamsScroll div._body").bind("scroll", closePopupEventHandler);
            $("#streamsContainer").bind("scroll", closePopupEventHandler);	// horizontal scroll
            $('#analyticsContent').bind("scroll", closePopupEventHandler);	// when viewing reports
        };

        /**
         * Sets a timeout to wait for bubble container to be rendered before calculations
         * @private
         */
        var keepOnScreen = function () {
            // set a timeout to wait for pane to be rendered before calculations
            setTimeout(function () {
                var $pane = $('#' + _paneId);
                if (!$pane.length) {
                    return;
                }

                var left = Math.ceil($pane.position().left),
                    width = $pane.outerWidth(true),
                    windowWidth = $(window).width(),
                    buffer = 10;
                if (left + width + buffer > windowWidth) {
                    $pane.css({
                        'left': 'auto',
                        'right': 0
                    });
                }
            }, 1);
        };

        /**
         * Determines whether a popup bound to the given anchor is already open.
         *
         * @param anchor
         * @returns {Boolean}
         */
        this.isPopupOpen = function (anchor) {
            return isAlreadyOpen(anchor);
        };

        /**
         * Return a reference to the current bubble popup
         */
        this.getCurrentPopup = function () {
            return _$pane;
        };

        /**
         * Opens a bubble and position it according to the anchor or supplied position
         * @param {string} anchor Anchor selector
         * @param {number} [top] Position to top
         * @param {number} [left] Position to left
         * @param {function} [callback] Callback function
         * @param {Object} [params] Configuration object
         * @param {boolean} [params.isVertical]
         * @param {boolean} [params.autoclose]
         * @param {string} [params.pos] Position : right, left, up, down
         */
        this.open = function (anchor, top, left, callback, params) {

            if (!$(anchor).is('._bubblePopup')) {
                $(anchor).addClass('_bubblePopup');
            }

            if (isAlreadyOpen(anchor)) {
                // check if it is loading, if loading, don't close
                if (!isLoading()) {
                    this.close();
                }
                return;
            }

            params = params || {};
            _lastParams = params;

            this.clearOpenDelay();
            // set currently open vars
            _$lastAnchor = (anchor) ? $(anchor) : null;
            setLastPos('h');

            makePopup(params);

            this.detach = params.detach;

            var self = this;
            if (params.isVertical) {
                self.setPositionVertical(null, top, left);
            } else {
                self.setPosition(null, top, left);
            }

            if (false !== params.autoclose) {
                bindClosePopupEvents();
            }
            $.isFunction(callback) && callback(this); // pass on the BubblePopup object
        };

        /**
         * Opens a bubble with a delay
         * @param {Number} [top] Position to top
         * @param {Number} [left] Position to left
         * @param {Function} [callback] Callback function
         * @param {Number} [delay=_openDelay] Delay before opening the popup
         */
        this.openWithDelay = function (anchor, top, left, callback, delay) {
            delay = delay || _openDelay;
            if (!isAlreadyOpen(anchor)) {
                // only show if not currently open.  but don't close on mouseover either
                _openDelayTimeout = setTimeout(function () {
                    __this.open(anchor, top, left, callback);
                }, delay);
            }
        };

        /**
         * Opens a bubble vertically
         * Alias to this.open with isVertical = true
         * @see this#openVertical
         */
        this.openVertical = function (anchor, top, left, callback, params) {
            params = $.extend(params, {isVertical: true});
            this.open(anchor, top, left, callback, params);
        };

        /**
         * Clears timeout to open bubble with delay
         */
        this.clearOpenDelay = function () {
            clearTimeout(_openDelayTimeout);
        };

        /**
         * Closes bubble, removes bubble container, resets last Position, unbinds event
         */
        this.close = function () {
            if (_$pane.length) {
                _$pane[this.detach === true ? 'detach' : 'remove']();
                _$pane = [];
            }
            _$lastAnchor && _$lastAnchor.length && _$lastAnchor.trigger('close.bubblepopup') && _$lastAnchor.unbind('close.bubblepopup');

            // unset
            _$lastAnchor = null;
            clearLastPos();
            // unbind
            unbindClosePopupEvents();

            const popOverPaneNode = document.getElementById('popOverPane');
            if (popOverPaneNode) {
                while (popOverPaneNode.hasChildNodes()) {
                    popOverPaneNode.removeChild(popOverPaneNode.lastChild);
                }
            }

            clearTimeout(_openDelayTimeout);
        };

        /**
         * set Position horizontally
         * If no arguments are passed, use currently bubble
         * @param {String} [anchor] Anchor selector
         * @param {Number} [paramTop]
         * @param {Number} [paramLeft]
         */
        this.setPosition = function (anchor, paramTop, paramLeft) {	// call this with no arguments to use currently open

            if (!_$pane.length) {
                return;
            }
            var TRIANGLE_WIDTH = 14,
                ANCHOR_WIDTH = 13;

            // if anchor is found, use it.  else use supplied co-ordinates
            var top, left, anchorWidth, anchorHeight,
                arrowPositionClass = "right",	// defaults to be right of the anchor
                paneWidth = _$pane.outerWidth(),
                paneHeight = _$pane.outerHeight(),
                windowWidth = $(window).width(),
                windowHeight = $(window).height(),
                $anchor = (anchor) ? $(anchor) : _$lastAnchor,
                bottomViewable = $("#footer").length ? $("#footer").position().top : windowHeight;

            //check if the paramTop and paramLeft arguments are supplied
            //if not, center the bubblepop
            if (!paramTop && !paramLeft) {
                if ($anchor && !$anchor.is(':visible') && !_$lastAnchor.is(':visible')) {
                    paramLeft = (windowWidth / 2) - (paneWidth / 2);
                    paramTop = (windowHeight / 2) - (paneHeight / 2);
                    arrowPositionClass = "arrowNone"; //remove pointer arrow
                }
            }

            if ($anchor && $anchor.length) {
                var anchorPos = $anchor.offset();
                top = paramTop || anchorPos.top;
                left = paramLeft || anchorPos.left;
                anchorWidth = $anchor.outerWidth();
                anchorHeight = $anchor.outerHeight();
            } else {
                top = paramTop || 0;
                left = paramLeft || 0;
                anchorWidth = ANCHOR_WIDTH;
                anchorHeight = ANCHOR_WIDTH;
            }

            setLastPos("h");	// save positions

            top -= (paneHeight / 2 - anchorHeight / 2);

            // adjust pane to fit within screen horizontally
            if (left + paneWidth > (windowWidth - anchorWidth) || _lastParams.pos == 'left') {
                // bubble is off the right side of the screen
                // move to the left of the anchor instead
                left = left - TRIANGLE_WIDTH - paneWidth;
                arrowPositionClass = "left";
            } else {
                left += anchorWidth + TRIANGLE_WIDTH;
            }

            // adjust pane to fit within screen vertically
            if (top + paneHeight > bottomViewable) {
                top = top - (top + paneHeight - bottomViewable);
            }
            if (top < 0 || _lastParams.pos == 'rightdown' || _lastParams.pos == 'leftdown') {
                top += paneHeight * 0.25; // push popup down 25%
                if (arrowPositionClass == "left") {
                    arrowPositionClass = "leftdown";
                }
                if (arrowPositionClass == "right") {
                    arrowPositionClass = "rightdown";
                }
            }

            // make sure that the popup is always within the screen
            // vertical position is already constrained, just need to constraing the horizontal position
            var minLeft = 0;
            var maxLeft = windowWidth - TRIANGLE_WIDTH - paneWidth;

            if (left < minLeft) {
                left = minLeft;
            } else if (left > maxLeft) {
                left = maxLeft;
            }
            _$pane.css("top", top + "px").css("left", left + "px").removeClass("right rightdown left leftdown up down arrowNone").addClass(arrowPositionClass);	// apply

            keepOnScreen();
        };

        /**
         * set Position vertically
         * If no arguments are passed, use currently bubble
         * @param {String} [anchor] Anchor selector
         * @param {Number} [paramTop]
         * @param {Number} [paramLeft]
         */
        this.setPositionVertical = function (anchor, paramTop, paramLeft) {	// call this with no arguments to use currently open
            if (!_$pane.length) {
                return;
            }
            var TRIANGLE_HEIGHT = 14,
                ANCHOR_HEIGHT = 13,
                bottomViewable = $("#footer").length ? $("#footer").position().top : $(window).height();

            // if anchor is found, use it.  else use supplied co-ordinates
            var top, left, anchorHeight, anchorWidth,
                arrowPositionClass = "down",	// defaults to be below the anchor
                paneWidth = _$pane.outerWidth(),
                paneHeight = _$pane.outerHeight(),
                $anchor = (anchor) ? $(anchor) : _$lastAnchor;

            if ($anchor && $anchor.length) {
                var anchorPos = $anchor.offset();
                top = paramTop || anchorPos.top;
                left = paramLeft || anchorPos.left;
                anchorHeight = $anchor.outerHeight();
                anchorWidth = $anchor.outerWidth();
            } else {
                top = paramTop || 0;
                left = paramLeft || 0;
                anchorHeight = ANCHOR_HEIGHT;
                anchorWidth = ANCHOR_HEIGHT;
            }

            setLastPos("v");	// save positions

            // position left (center it with anchor)
            left += anchorWidth / 2 - paneWidth / 2;

            // adjust pane to be ABOVE anchor if needed
            if (top + anchorHeight + paneHeight > bottomViewable || _lastParams.pos == 'up') {
                top = top - TRIANGLE_HEIGHT - paneHeight;	// move to above the anchor instead
                if (top < 0) {
                    top = 0;
                }
                arrowPositionClass = "up";
            } else {
                top = top + anchorHeight;
            }

            // pane shouldn't be off the right edge of window
            var $tip, originalMarginLeft;
            if (left + paneWidth > $(window).width()) {
                var offset = (left + paneWidth - $(window).width());
                left -= offset;

                // move the tip
                if ($.isFunction(this.getTip)) {
                    $tip = this.getTip();
                    originalMarginLeft = -12;

                    $tip.css('marginLeft', originalMarginLeft + offset);
                }
            } else if (left < 10) {	// pane shouldn't be off the left edge of the window
                var oldLeft = left;
                left = 10;	// some margin
                // move the tip
                if ($.isFunction(this.getTip)) {
                    $tip = this.getTip();
                    originalMarginLeft = -12;

                    $tip.css('marginLeft', originalMarginLeft - Math.abs(oldLeft) - 10);
                }
            }

            _$pane.css("top", top + "px").css("left", left + "px").removeClass("right left up down fadeInLeft").addClass(arrowPositionClass + " fadeInDown");	// apply

            keepOnScreen();

        };

        this.getTip = function () {
            // @TODO: add underscore class
            return _$pane.find('.tip');
        };

        /**
         * Set html content
         * @param {String} content Html content
         */
        this.setContent = function (content) {
            var _this = this;

            var pos = function () {
                if (_lastPos && _lastPos.orientation == "v") {
                    _this.setPositionVertical();
                } else {
                    _this.setPosition();		// use current
                }
                hootbus.emit("bubblepop:contentSet");
            };

            if (!_$pane.length) {
                return;
            }

            _$pane.find("._content").empty().append(content).find('img').bind('load', function () {
                _.defer(pos);
                $(this).unbind('load');
            });
            _.defer(pos);
        };

        /**
         * Set Position for current anchor | positions
         * Alias for this.setPosition or setPositionVertical
         */
        this.setPositionForCurrent = function () {
            if (_lastPos && _lastPos.orientation == "v") {
                this.setPositionVertical();
            } else {
                this.setPosition();
            }
        };

        /**
         * Tests if bubble container is open or not
         * @returns {Boolean}
         */
        this.isOpen = function () {
            return _$pane.length > 0;
        };
    }

    // make it in global hs obj
    return new BubblePopup();
})();

hs.bubblePopup = bubblePopup;

export default bubblePopup;

