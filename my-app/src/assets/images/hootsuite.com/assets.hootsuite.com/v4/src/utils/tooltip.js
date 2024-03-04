import $ from 'jquery';
import hsEjs from 'utils/hs_ejs';

var tooltip = {
    init: function () {
        var self = this;
        var $tooltip = $('#tooltip');
        var $jsTooltip = $("body ._jsTooltip");
        var $jsFocusTooltip = $("body ._jsFocusTooltip");
        var moveTooltipOffScreen = function () {
            $tooltip.css("top", "-300px");
        };

        //attach tooltips
        $jsTooltip.live("mouseenter", function () {
            var $anchor = $(this);
            $anchor.off('mouseup').on('mouseup', moveTooltipOffScreen);

            self.attachToolTip($anchor, $tooltip);
        });
        $jsTooltip.live("mouseleave", moveTooltipOffScreen);

        $jsFocusTooltip.live("focus", function () {
            var $anchor = $(this);
            self.attachToolTip($anchor, $tooltip);
        });
        $jsFocusTooltip.live("blur", moveTooltipOffScreen);
        $tooltip.live("mouseenter", moveTooltipOffScreen);
    },

    attachToolTip: function ($anchor, $tooltip) {

        if (!$anchor.data('title')) {
            var title = $anchor.attr('title');
            if (typeof title === 'undefined') {
                title = $anchor.parent().attr('title');
                $anchor.parent().removeAttr('title');
            }
            $anchor.data('title', title);
            $anchor.removeAttr('title');
        }
        var offset = $anchor.offset();
        var top = offset.top; //$anchor.height();
        var left = offset.left + ($anchor.outerWidth(true) / 2);	// mid point

        $tooltip.empty().html(hsEjs.cleanPage($anchor.data('title')) + '<span class="icon-13 tip"></span>');
        left -= $tooltip.outerWidth(true) / 2;
        if (left < 0) {
            $tooltip.find('.tip').css({'left': (-1 * left + ($anchor.outerWidth(true) / 2)) + 'px'});
            left = 0;
        }
        var finaltop = top - $tooltip.outerHeight(true);
        var classPosition = "top";
        if (finaltop < 0) {
            finaltop = top + $anchor.height();
            classPosition = "bottom";
        }

        $tooltip.css({
            "top": finaltop + "px",
            "left": left + "px"
        });
        $tooltip.removeClass("top bottom").addClass(classPosition);
        $tooltip.show();
    }
};

window.tooltip = tooltip;

export default tooltip;
