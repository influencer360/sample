import $ from 'jquery';
import hootbus from 'utils/hootbus';

var resize = {};

hs.minColsForRes = 1;
hs.maxColsForRes = 3;
resize.showTabDropdown = false;
resize.STREAM_SIZE = {
    COMPACT: 'compact',
    STANDARD: 'standard',
    COMFORTABLE: 'comfortable',
};

resize.isDashboard = function () {
    return !!$("#dashboard").length;	// only trigger in the dashboard
};

$(window).resize(function () {
    if (!resize.isDashboard()) {
        return;
    }

    if (hs.timers.windowResizeTimer != void 0) {
        clearTimeout(hs.timers.windowResizeTimer);
        delete hs.timers.windowResizeTimer;
    }

    hs.timers.windowResizeTimer = setTimeout(window.resizeUpdate, hs.c.delayResizeView);
});


// TODO: couldn't find any use of it : remove it -AB still see no use -EP
window.checkBrowserDimensions = function () {
    //only remove scrollbars if on analytics/streams/settings page and view is larger than 975 width
    if (hs.dashboardState) {
        if ($(window).width() < 975) {
            $('html').css('overflow', 'auto');
        } else {
            $('html').css('overflow', 'hidden');
        }
    }
};

window.resizeUpdate = function () {
    var fnTriggerPostResize = function () {
        $(document).trigger('hspostresize');
    };

    window.updateDashboardHeight();
    window.updateDashboardWidth();

    // resize actions when on streams
    if (hs.dashboardState == 'streams') {
        // use timeout to let the dashboard render new width and height first
        setTimeout(function () {
            window.updateViewableColumns();
            window.resizeColumns();
            window.updateSlider();
            window.updateTabs();

            // trigger lazyload
            $("#streamsContainer ._box").each(function (i, v) {
                setTimeout(function () {
                    window.stream.stream.updateStreamOnScroll($(v));
                }, i * 100);
            });

            // resize again...for tabs
            window.updateDashboardHeight();
            window.updateDashboardWidth();

            fnTriggerPostResize();
        }, 1);
    } else {
        fnTriggerPostResize();
    }
};

//used for all pages
window.updateDashboardWidth = function () {
    if (!resize.isDashboard()) {
        return;
    }

    switch (hs.dashboardState) {
        case 'organizations':
            //resize actions when on organizations
            break;
        default:
            break;
    }
};

window.updateDashboardHeight = function () {
    if (!resize.isDashboard()) {
        return;
    }

    switch (hs.dashboardState) {
        case 'streams':
            window.updateStreamsHeight();
            break;
        case 'organizations':
            var newHeight = $('._teamManagementOrganizationPage').outerHeight() -
                $('._teamsContainer').outerHeight() -
                $('._headerContainer').outerHeight() -
                $('.instructionsContainer').outerHeight();

            $('._membersContainer, ._socialNetworksContainer').height(newHeight);

            var maxWidth = $('._teamManagementOrganizationPage').outerWidth() - 460; //magic number relevant to min width of ._socialNetworksContainer;

            $("._membersContainer").resizable("option", "maxWidth", maxWidth);

            if ($("._membersContainer").outerWidth() < 400 || $("._socialNetworksContainer").outerWidth() < 400) {
                //if the panes are too small after resize, reset to 50%
                $("._membersContainer, ._socialNetworksContainer").width('50%');
            }
            break;
    }
};

window.updateStreamsHeight = function () {
    $("#streamsContainer")
        .find("._box").each(function () {
            var $box = $(this),
                $boxFilter = $box.find('._boxFilter');
            $box.css({'height': ''});	// clear height style
            // adjust for filter height
            if ($boxFilter.is(":visible")) {
                setTimeout(function () {
                    $box.height($("#streamsScroll").height() - $boxFilter.outerHeight());
                }, 1);
            }
        });
};

//updates tabs and moves them into dropdown if needed
window.updateTabs = function () {
    var $tabDropdown = $("#tabDropdown");
    $tabDropdown.hide();
};

//moves tabs into dropdown
window.moveToDropdown = function (el) {
    var $tabDropdown = $("#tabDropdown");
    if (!resize.showTabDropdown) {
        $tabDropdown.show();
        resize.showTabDropdown = true;
    }
    if (el.is('.active')) {
        $tabDropdown.addClass('active');
    }
    el.remove().appendTo($tabDropdown.find(".dropdown-content"));
};

//updates column slider. checks to see how many columns can fit on the page
window.updateSlider = function () {
    var $slider = $("#colSizeSlider");
    if ($slider.length > 0) {
        $slider.slider('option', 'min', hs.minColsForRes);
        $slider.slider('option', 'max', hs.maxColsForRes);
        $slider.slider('option', 'value', hs.c.numViewableCols);
    }
};

window.updateViewableColumns = function (num) {
    var minColumnSize = hs.c.minColumnSize;
    var maxColumnSize = hs.c.maxColumnSize;

    // TODO: is this still a pref that's used?
    if (hs.prefs.allowSlimStreams) {
        minColumnSize = hs.c.slimColumnSize;
    }

    if (num) {
        hs.c.numViewableCols = num;
    } else {
        hs.c.numViewableCols = $("#streamTabInfo input[name='visibleColumnCount']").val();
    }

    hs.minColsForRes = Math.floor($("#streamsContainer").width() / maxColumnSize);
    hs.maxColsForRes = Math.floor($("#streamsContainer").width() / minColumnSize);

    if (hs.maxColsForRes > 0)	//should only be 0 if no tabs yet and thus no slider should be showing
    {
        //restrict cols to max allowable cols per tab
        if (hs.maxColsForRes > hs.c.maxTabColumns) {
            hs.maxColsForRes = hs.c.maxTabColumns;
        }
        //only allow a max number of cols for resolution
        if (hs.maxColsForRes < hs.c.numViewableCols) {
            hs.c.numViewableCols = hs.maxColsForRes;
        }
    }

    hs.c.colWidthPercent = 1 / hs.c.numViewableCols;

    window.updateSlider();
};

//function to update all of the columns width/height
window.resizeColumns = function () {
    var $streamsScroll = $('#streamsScroll');
    var $boxAddStream = $('#boxAddStream:visible');
    var containerWidth = $('#streamsContainer').width();
    // total number of non '._box' streams
    var additionalStreamsCount = $boxAddStream.length;
    var numOfCols = $streamsScroll.find('._box').filter('.stream').length + additionalStreamsCount;
    var colWidth = (containerWidth * hs.c.colWidthPercent) - hs.c.columnSpacing;
    var minColumnSize = hs.c.streamSizes[hs.c.currentStreamSize].minColumnSize;
    var maxColumnSize = hs.c.streamSizes[hs.c.currentStreamSize].maxColumnSize;
    if (numOfCols * (maxColumnSize + hs.c.columnSpacing) < containerWidth) {
        colWidth = maxColumnSize;
    } else {
        var numOfVisibleColumns = numOfCols;
        if ((numOfCols * (minColumnSize + hs.c.columnSpacing)) < containerWidth) {
            colWidth = Math.floor((containerWidth - (numOfVisibleColumns * hs.c.columnSpacing)) / numOfVisibleColumns);
        } else {
            // add more spacing when all the columns don't fit on screen
            // this is thought to help users see they have more columns
            numOfVisibleColumns = Math.floor(containerWidth / (minColumnSize + hs.c.columnSpacing + hs.c.moreColumnsSpacing));
            colWidth = Math.floor((containerWidth - (numOfVisibleColumns * hs.c.columnSpacing + hs.c.moreColumnsSpacing)) / numOfVisibleColumns);
        }
    }

    // min width since it lives outside streams container
    $boxAddStream.css('min-width', colWidth);

    var w = numOfCols * (colWidth + hs.c.columnSpacing);
    if (w > 0) {
        $streamsScroll.width(w + additionalStreamsCount);
    } else {
        $streamsScroll.width('0px');
    }

    hootbus.emit('streams:resize');

    window.updateStreamsHeight();
};

window.resize = resize;

// TODO remove when streamSize is in Tab model
resize.getNumViewableColsForStreamSize = function (streamSize) {
    var numViewableCols;
    switch (streamSize) {
        case resize.STREAM_SIZE.COMPACT:
            numViewableCols = 5;
            break;
        case resize.STREAM_SIZE.COMFORTABLE:
            numViewableCols = 3;
            break;
        default:
            numViewableCols = 4;
            break;
    }
    return numViewableCols;
};

window.updateStreamSize = function (size) {
    if (hs.c.currentStreamSize !== size) {
        var $streamsContainer = $('#streamsContainer');
        if (hs.c.currentStreamSize) {
            $streamsContainer.removeClass('x-' + hs.c.currentStreamSize);
        }
        $streamsContainer.addClass('x-' + size);
        hs.c.currentStreamSize = size;

        hs.c.numViewableCols = resize.getNumViewableColsForStreamSize(size);
    }

    $("#streamTabInfo input[name='streamSize']").val(size);
    // TODO remove when streamSize is in Tab model
    $("#streamTabInfo input[name='visibleColumnCount']").val(hs.c.numViewableCols);

    window.editTabWithTimer();
    window.resizeColumns();
};

export default resize;
