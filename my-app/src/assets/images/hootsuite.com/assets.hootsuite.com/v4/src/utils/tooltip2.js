import _ from 'underscore';

var Tooltip = function ($el, options) {
    this.init($el, options);
};

var fnCleanString = function (s) {
    return s.replace(/\s&\s/g, ' &amp; ').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\\/g, '&#92;');
};

$.extend(Tooltip.prototype, {
    defaults: {
        triggerShowOnInit: false,
        paneId: 'tooltip',
        anchorFn: false,
        template: '<div class="_tooltipTitle title"></div><div class="_tooltipContent content"></div><span class="icon-13 tip"></span>',
        placement: 'left'
    },
    init: function ($el, options) {
        this.$el = $el;

        // set options
        this.placements = ['top', 'bottom', 'left', 'right'];

        if (options.placement && _.indexOf(this.placements, options.placement) === -1) {
            delete options.placement;
        }
        this.o = $.extend({}, this.defaults, options);

        // init pane
        this.$pane = $("#" + this.o.paneId);
        if (!this.$pane.length) {
            this.$pane = $('<div id="' + this.o.paneId + '"></div>').appendTo("body");
        }
        this.$pane.css({position: 'absolute'});
        this.hidePane();

        // bind events
        this.$el.on('mouseenter', $.proxy(this.show, this));
        this.$el.on('click', $.proxy(this.hide, this));
        this.$el.on('mouseleave', $.proxy(this.hide, this));

        if (this.o.triggerShowOnInit === true) {
            this.show();
        }
    },
    show: function (e) {
        if (!this.$tip) {
            this.setTip();
        }
        this.$pane.empty().append(this.$tip);
        this.$pane.removeClass(this.placements.join(' ')).addClass(this.o.placement + ' advanced');
        this.$pane.css(this.getPosition()).show();

        e && e.stopPropagation();
    },
    hide: function (e) {
        this.$pane.removeClass(this.placements.join(' ') + ' advanced');
        this.$pane.contents().detach();
        this.hidePane();

        e && (e.type === 'mouseleave') && e.stopPropagation();
    },
    hidePane: function () {
        this.$pane.css({"top": "-200px"});
    },
    setTip: function () {
        this.$tip = $(this.o.template);
        var title = this.getTitle(),
            content = this.getContent();
        this.$tip.filter('._tooltipTitle').html(title);
        if (content) {
            this.$tip.filter('._tooltipContent').html(content);
        }
    },
    getOptionsFromData: function () {
        var dataEl = this.$el.data(),
            prop,
            match,
            optionsData = {};
        for (prop in dataEl) {
            if (typeof prop === 'string') {
                match = /^tooltip(.+)$/.exec(prop);
                if (match && match.length === 2) {
                    optionsData[match[1]] = dataEl[prop];
                }
            }
        }
        return optionsData;
    },
    getTitle: function () {
        if (this.$el.attr('title') && !this.$el.data('tooltiptitle')) {
            this.$el.data('tooltiptitle', fnCleanString(this.$el.attr('title')) || '').removeAttr('title');
        }
        return this.$el.data('tooltiptitle');
    },
    getContent: function () {
        return this.$el.data('tooltipcontent');
    },
    getPosition: function () {
        var $tip = this.$pane,
            $anchor = (this.o.anchorFn && _.isFunction(this.o.anchorFn)) ? this.o.anchorFn.call(this) : this.$el,
            actualWidth = $tip.outerWidth(true),
            actualHeight = $tip.outerHeight(true),
            pos = $.extend({}, $anchor.offset(), {
                width: $anchor.outerWidth(true),
                height: $anchor.outerHeight(true)
            }),
            top, left,
            $innerSVG = $anchor.find('rect');

        if ($innerSVG.length > 0) {
            pos.width = +$innerSVG.attr('width');
            pos.height = +$innerSVG.attr('height');
        }
        if ($anchor.is('rect')) {
            if (pos.width <= 0) {
                pos.width = +$anchor.attr('width');
            }
            if (pos.height <= 0) {
                pos.height = +$anchor.attr('height');
            }
        }

        if (this.o.placement === 'left' || this.o.placement === 'right') {
            var leftLeft = pos.left - actualWidth,
                leftRight = pos.left + pos.width;
            top = pos.top + pos.height / 2 - actualHeight / 2;

            if (this.o.placement === 'left') {
                //left = (leftLeft >= 0) ? leftLeft : leftRight;
                left = leftLeft;
                if (left < 0) {
                    left = leftRight;
                    this.$pane.removeClass('left').addClass('right');
                }

            } else if (this.o.placement === 'right') {
                //left = (leftRight + actualWidth < $(window).width()) ? leftRight : leftLeft;
                left = leftRight;
                if (left > $(window).width() - actualWidth) {
                    left = leftLeft;
                    this.$pane.removeClass('right').addClass('left');
                }
            }
        } else if (this.o.placement === 'top' || this.o.placement === 'bottom') {
            var topTop = pos.top - actualHeight,
                topBottom = pos.top + pos.height;
            left = pos.left + pos.width / 2 - actualWidth / 2;

            if (this.o.placement === 'top') {
                //top = (topTop > 0) ? topTop : topBottom;
                top = topTop;
                if (top < 0) {
                    top = topBottom;
                    this.$pane.removeClass('top').addClass('bottom');
                }
            } else if (this.o.placement === 'bottom') {
                //top = (topTop + actualHeight < $(window).height()) ? topTop : topBottom;
                top = topBottom;
                if (top > $(window).height() - actualHeight) {
                    top = topTop;
                    this.$pane.removeClass('bottom').addClass('top');
                }
            }
        }

        return {
            top: top,
            left: left
        };
    }
});

/**
 * jQuery Plugin to create tooltips
 * @name $.hsTooltip
 * @param {Object} options - Configuration object
 * @param {String} options.placement - Where to position the tooltip
 * @param {Function} options.anchorFn - A function that return an anchor. If none provided, the anchor is the element on which the plugin is applied
 * @example
 * $('.foo').hsTooltip({
         *      placement: 'right'
         * });
 * @example
 * $('.foo').hsTooltip('show');
 * $('.foo').hsTooltip('hide');
 */
$.fn.hsTooltip = function () {
    if ($(this).length === 0) {
        return;
    }
    var options = {}, fnToRun;
    if (typeof arguments[0] === 'string') {
        fnToRun = arguments[0];
    }
    if (typeof arguments[0] === 'object') {
        options = arguments[0];
    }

    return this.each(function () {
        var $this = $(this),
            data = $this.data('tooltip');
        if (!data) {
            $this.data('tooltip', (data = new Tooltip($this, options)));
        }
        if (typeof fnToRun == 'string' && _.isFunction(data[fnToRun])) {
            data[fnToRun]();
        }
    });
};

var tooltip2 = {
    init: function () {
        $(document).on('mouseenter', '._hsTooltip', function () {
            $(this).hsTooltip({
                triggerShowOnInit: true,
                placement: 'right'
            });
        });
    }
};

export default tooltip2;
