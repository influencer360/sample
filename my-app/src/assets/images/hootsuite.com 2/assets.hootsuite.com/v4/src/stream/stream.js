import $ from 'jquery';
import _ from 'underscore';
import translation from 'utils/translation';
import ajaxQueueManager from 'utils/ajax-queue-manager';
import ImageLightbox from 'utils/image-lightbox';
import snActions from 'apps/social-network/actions';
import 'utils/ajax';
import 'utils/maps';
import localCache from 'utils/local-cache';
import BoxService from 'box/service';
import streamTwitter from 'stream/twitter';
import hootbus from 'utils/hootbus';
import hsEvents from 'hs-events';
import reactBoxChecker from 'stream/react-box-checker';
import darklaunch from 'utils/darklaunch';
import resize from 'resize';
import trackerDataLab from 'utils/tracker-datalab';
import NetworksConf from 'utils/networks-conf';
import Cocktail from 'backbone.cocktail';
import messageSubscriptionMixin from 'utils/mixins/message-subscription';
import { getPrepopulatingStreamsEntitlement } from 'utils/entitlements';
import hsEjs from 'utils/hs_ejs';
import jsapi from '../in_jsapi';
import { getSocialNetworkNameByType } from 'utils/string';
import { asyncStreamLoader } from './components/streams-loader';
import addressUtils from 'address-utils';
import { getPerformanceMetrics } from 'fe-lib-performance-metrics';
import { recordIncrement } from 'fe-lib-recording';
import { getMemberId } from 'fe-lib-hs';
const {
    CUSTOM_APPROVALS,
    PRODUCT_ACCESS_UNIFIED_INBOX,
    MESSAGE_TAGGING,
    NO_TWITTER_SEARCH,
    getCustomPermissions,
    DENY_ACCESS,
} = require('fe-lib-entitlements');
import streamsFlux from 'hs-app-streams/lib/stores/flux';
import { MESSAGE_LIST, MESSAGE } from 'hs-app-streams/lib/actions/types';
import messageListRenderer from './components/message-list-renderer';
import { abortStreamRefresh } from 'hs-app-streams/lib/services/message-list';

var stream = window.stream || {};

const SESSION_ATTEMPTED = "engage.streams.session-attempted";

const featureCodes = [
    CUSTOM_APPROVALS,
    MESSAGE_TAGGING,
    NO_TWITTER_SEARCH,
    PRODUCT_ACCESS_UNIFIED_INBOX
];

Cocktail.mixin(stream, messageSubscriptionMixin());
stream.stream = (stream.stream) ? stream.stream : {};

stream.stream.boxCachePrefix = "boxMsg_";
stream.stream.ERROR_MESSAGE_DELAY = 10 * 1000;

stream.stream.SUPPORTED_PIC_URLS = /http:\/\/(www\.)?(twitpic\.com|yfrog\.com|ow\.ly\/i|tweetphoto\.com|instagr\.am\/p|plixi\.com\/p)\/([\w\d]+)/i;

stream.messageEvents = {
    'statusObject:extraAction:recoverStream': 'recoverBoxFromLocalStorage',
    'socialNetwork:refresh:success': 'onRefreshSocialNetwork',
    'full_screen_composer:response:message_success': 'onPostScheduledOrSent',
    'amplify:create_from_composer:success': 'onPostAmplifyCreateFromComposer'
};

stream.entitlements = null; // a set of feature codes that the member has access to

async function getEntitlementsAsSet() {
    const featureSet = new Set();
    const memberId = await getMemberId();
    let permissions = null;
    try {
        permissions = await getCustomPermissions(memberId, featureCodes);
    } catch(err) {
        // eslint-disable-next-line no-console
        console.error('Get Streams entitlements failed.', err);
    }
    if (permissions) {
        for (const permission of permissions) {
            if (permission.value !== DENY_ACCESS) {
                featureSet.add(permission.featureCode);
            }
        }
    }
    return featureSet;
}

/**
 * init
 * place all stream init code here, this gets called by hs.require when stream related js files are loaded
 */
stream.init = async function () {
    recordIncrement(SESSION_ATTEMPTED);

    this.delegateMessageEvents();

    stream.entitlements = await getEntitlementsAsSet();

    /**
     * Binds on body element
     * to maintain [jquery .live|.delegate] behaviour
     * element must exist when function is bound thus [body]
     */
    $('body')
    // handle custom "refreshBoxDone" event
        .on('hsRefreshBoxDone', function (_e, boxId, r, data) {
            setTimeout(function () {
                stream.stream.updateStreamOnScroll("#box" + boxId);
                /* call for this box */
            }, 1000);	// delay for 1 second to not block jsonp calls (like search), old value: 750
            stream.stream.applyFilter(boxId);	// apply filter if needed

            if (r === 'old' && data.count) {
                $('#box' + boxId).find('._tweetMoreHidden').removeClass('_tweetMoreHidden').addClass('_tweetMore');	// show the load more button if it was hidden
            }
        })
        //make all twitter hashtags clickable for quick search
        .on('click', '._quickSearchPopup', function () {
            var $this = $(this),
                tag = $.trim($this.text());

            var data = {
                tag: tag,
            };
            streamsFlux.getActions(MESSAGE).showHashtagSearch(data);
            return false;
        })
        // this button isn't clickable
        .on('click', '._box ._isShared, ._box ._notShared', function () {
            return false;
        })
        // more menu dropdown for boxes
        .on('click', '._box ._boxMoreMenu', function () {
            stream.stream.openBoxMoreMenu(this);
        })
        // refresh box button
        .on('click', '._box ._refresh', function () {
            $(this).closest('._box').box('refresh', 'new');
        })
        // bind individual message action buttons
        .on('click', '._box ._options a, ._box ._options button', function () {
            stream.box.messageOptionsButtonHandler(this, hs.currentMessage);
        })
        .on('click', '._box ._deletePostComment', function () {
            // facebook streams live binds
            if (confirm(translation._("Are you sure you want to permanently delete this comment?"))) {
                var $comment = $(this).closest('._comment'),
                    commentId = $comment.attr('commentid'),
                    $box = $comment.closest('._box'),
                    socialNetworkId = $box.box('get', 'socialNetworkId');
                stream.facebook.deleteComment(commentId, socialNetworkId, function () {
                    var $commentCount = $comment.closest('._postComments').find('._commentCount');
                    window.fadeSlideRemove($comment, null, function () {
                        if ($commentCount.length) {
                            var count = parseInt($commentCount.html(), 10);
                            $commentCount.html((count - 1) + " comments");
                        }
                    });
                });
            }
        })
        .on('click', '._tLocationInfo', function () {
            // twitter location preview
            stream.stream.openTwitterPreview(this);
        })
        .on('click', '._response ._header', function () {
            window.assignment.toggleMessage(this);
        })
        .on('click', '._box ._message ._imageToggle', function () {
            var $anchor = $(this),
                $box = $anchor.closest('._box'),
                $message = $anchor.closest('._message'),
                $gallery = $message.find('.mediaGallery');

            $box.find('._message ._close').trigger('click');

            $gallery.toggle();
            $anchor.text(translation._(($gallery.is(':visible') ? 'Hide image' : 'Show image') + ($anchor.data('count') === 1 ? '' : 's')));
        })
        .on('click', '._box ._message ._inlineMedia ._close', function () {
            var $message = $(this).closest('._message');

            // When removing NGE-279_STANDARDIZED_IMAGES, please consider removing
            // ._postAttachment from the list below as only ._mediaGallery is used
            // in the new templates.
            $message.find('._postAttachment, ._mediaGallery').show().siblings('._inlineMediaContainer').remove();
        })
        .on('click', '._box ._socialNetworkExpirationStream ._reconnectSocialNetwork', function (e) {
            var snId = $(e.target).data("snid");
            var socialNetwork = {socialNetworkId: snId};
            snActions.reconnect(socialNetwork, null);
            hs.util.recordAction('reauthStreamReconnect');
        })
        .on('click', '._box ._socialNetworkExpirationStream ._showExplanation', function (e) {
            $(e.target).siblings('._reauthExplanation').toggle();
        })
        .on('click', '._box ._deleteGroup', function (_e) {
            //Only used for groups deprecation delete button
            var snId = $(this).data("snid");
            var tabId = $(this).data("tabid");
            ajaxCall({
                url: '/ajax/network/delete',
                data: {
                    socialNetworkIds: snId
                },
                success: function () {
                    window.loadStreams(tabId, null, true);
                }
            }, 'qm');
        })
        .on('click', '._box ._message ._toggleMessageContent', function () {
            $(this).closest('._message').find('._collapsedMessageContent').toggle();
        })
        .on('click', '._box ._loadOld', function () {
            $(this).closest('._box').box('refresh', 'old');
            return false;
        });
    // End Binds on Body Element

    hootbus.on('message:retweetMessage', function (data) {
        streamTwitter.showRetweetPopup(data.anchor, data.socialNetworkId, data.messageId, data.impressionId, data.fnOldRetweet, data.fnNewRetweet, data.fnTwitterQuote);
    });

    hootbus.on("streams:stream:refresh", function (boxId) {
        $("#box" + boxId).box("refresh", "new");
    });
};

stream.onPostScheduledOrSent = function () {
    if (darklaunch.isFeatureEnabled('PGR_561_REFRESH_STREAMS_ON_MESSAGE_SUCCESS')) {
        if (hs.dashboardState === 'streams') {
            hootbus.emit('streams:board:refresh');
        }
    }
};

stream.onPostAmplifyCreateFromComposer = function(){
    if (hs.dashboardState === 'streams'){
        hootbus.emit('streams:board:refresh');
    }
}

stream.onRefreshSocialNetwork = function () {
    if (hs.dashboardState === 'streams') {
        //reset stream view
        var tabId = null;
        if (addressUtils.path() === '/tabs' && addressUtils.queryString().match(/id=\d+/)) {
            var id = addressUtils.queryString().match(/id=(\d+)/);
            id = id[1];
            tabId = id;
        }
        if (tabId) {
            // if we have a tabId, that means the deep linking is correct, we can trigger helper to load stream
            window.loadStreams(tabId, null, true);
        } else {
            // if there is no tab id, we are likely not in the streams view, so use deep linking
            window.address.reloadStreams();
        }
    }

    // update new add stream-stream if possible
    if ($('#boxAddStream').length) {
        stream.streamHelper.initSnDropdown();
    }

    if ($('#streamsContainer:visible').length) {
        getPrepopulatingStreamsEntitlement(hs.memberId, function(_hasEntitlement) {
            var callback = function () {
                var $lastTab = $('#dashboardTabs').find('._tab').last();
                var lastTabId = $lastTab && $lastTab.attr('id') && $lastTab.attr('id').replace('tab', '');

                if (lastTabId && hs.currentTabId !== lastTabId) {
                    window.loadStreams(lastTabId, null, true);
                }
            };

            stream.stream.refreshTabs(callback);
        });
    }
};

stream.recoverBoxFromLocalStorage = function () {
    var streamData, storedObject, postData = ['newAddStream=1'];
    if (localCache.isSupported) {
        // obtain data to rebuild stream
        storedObject = localCache.getItem('lastDeletedStream');
        if (storedObject) {
            streamData = storedObject.data;

            // use streamData to recreate the deleted stream.
            $.each(streamData, function (key, val) {
                postData.push(encodeURIComponent('box[' + key + ']') + '=' + encodeURIComponent(val.toString().replace(/%22/g, '"').replace(/%27/g, "'")));
            });
            stream.saveBox.saveBoxSubmit(postData.join('&'));
            stream.streamHelper.toggleOptionsOverlay();

            // Delete stream recovery data so that we don't recover it multiple times.
            localCache.removeItem('lastDeletedStream');
        }
    }
};

/**
 * open Twitter Preview
 */
stream.stream.openTwitterPreview = function (anchor, delay) {
    if (!anchor) {
        return;
    }

    var $anchor = $(anchor);
    if (!$anchor.is("._tLocationInfo")) {
        $anchor = $anchor.closest("._tLocationInfo");
    }
    var locationData = $anchor.attr('rel');

    var callback = function () {
        ajaxCall({
            type: 'GET',
            url: "/ajax/twitter/location-info?locationData=" + locationData,
            success: function (data) {
                hs.bubblePopup.setContent(data.output);
                if (typeof data.latitude != "undefined" && typeof data.longitude != "undefined") {
                    hs.util.showGoogleMap(data.latitude, data.longitude, '#map_canvas');
                }
            }
        }, 'single');
    };

    if (delay && delay > 0) {
        hs.bubblePopup.openWithDelay($anchor, null, null, callback, delay);
    } else {
        hs.bubblePopup.open($anchor, null, null, callback);
    }
};


/**
 * Create preview popup
 * options.type - image, video...
 * options.clickUrl - where to go when user click on the resource on the preview popup (such as going to original image page)
 * options.imgSrc   - if type is image, then source of image
 */
stream.stream.showPreviewPopup = function (options) {
    var $content = null;
    switch (options.type) {
        case "image":
            options.clickUrl = options.clickUrl || '#';
            $content = $('<a href="' + options.clickUrl + '" target="_blank"><img class="previewImage" src="' + hs.util.proxify(options.imgSrc) + '" alt="" title="' + translation._("View on website") + '" /></a>')
                .click(function () {
                    $previewPopup.dialog('close');
                });
            break;
        default:
            $content = $("<span></span>");
            break;
    }

    var params = {
            minHeight: 150,
            width: 640,
            closeOnEscape: true,
            draggable: true,
            title: translation._("Preview") + " " + options.type,
            position: ['center', 60]
        },
        $previewPopup = $.dialogFactory.create('urlPreviewPopup', params);

    $previewPopup.empty().append($content);

    // create a function that allows re-centering this popup
    stream.stream.showPreviewPopup.center = function () {
        $previewPopup.dialog('option', 'position', ['center', 60]);
    };
};
// end preview popup

stream.stream.showGalleryPopup = function (options) {
    var popup = new ImageLightbox(options);
    popup.render();
};

/**
 * quickly refresh tabs (if they are out of sync)
 */
stream.stream.refreshTabs = function (callback) {
    var activeTabId = $("#editTabForm input[name='id']").val();

    ajaxCall({
        url: '/ajax/stream/refresh-tabs?activeTabId=' + activeTabId,
        success: function (data) {
            if (data.output) {
                var $dashboardTabs = $("#dashboardTabs");

                var currentDashboardTabCount = $dashboardTabs.find('._tab').length;

                $dashboardTabs.empty().html(data.output);
                $dashboardTabs.find('._addNewTabBtn').bind('click', function (_e) {
                    stream.stream.addNewTab();
                });
                window.updateTabs();
                // TODO: We need to find a better way to manage navigation to newly created tabs...
                // If any new tabs are found, move to that new tab
                if (data.tabCount && currentDashboardTabCount && currentDashboardTabCount < data.tabCount) {
                    $dashboardTabs.find('._tab:last').find('._load').click();
                }

                if ($.isFunction(callback)) {
                    callback();
                }
            }
        }
    }, 'q1');
};

/**
 * init Stream
 */
window.initStream = function (data) {

    const currentTabId = hs.currentTabId
    const STREAMS_NAMESPACE = 'streams'
    const TTL_BOARD_HISTOGRAM_NAME = 'time_to_load_board_seconds'
    const TTL_BOARD_HISTOGRAM_DESCRIPTION = 'Time to load a board in Streams'
    const TTL_BOARD_HISTOGRAM_BUCKETS = [.25, .5, 1, 2, 2.5, 3, 4, 5, 6, 7, 8, 10, 12.5, 15, 17.5, 20]
    let timer = null;

    const $streamsContainerBox = $("#streamsContainer").find("._box");
    if ($streamsContainerBox && $streamsContainerBox.length && currentTabId) {
        timer = getPerformanceMetrics(STREAMS_NAMESPACE)
          .getHistogramTimer(
            TTL_BOARD_HISTOGRAM_NAME,
            TTL_BOARD_HISTOGRAM_DESCRIPTION,
            TTL_BOARD_HISTOGRAM_BUCKETS,
          );
          timer.start({id: currentTabId});
    }

    // begin Masthead event bindings and stream resizing
    const $streamTabInfo = $('#streamTabInfo');
    const selectedSize = $streamTabInfo.find('input[name="streamSize"]').val();

    window.updateStreamSize(selectedSize);
    window.updateViewableColumns();
    window.resizeColumns();

    // controls like _refresh and _refreshing
    $streamTabInfo.find('#editTabForm').bind('keypress', function (e) {
        return window.disableEnterKey(e);
    });

    // done Masthead event bindings and stream resizing

    //set box to be droppable if it is a LISTS with a managable ownerId
    stream.stream.makeColumnsDroppable();

    stream.stream.makeAppColumnsDroppable();

    if (darklaunch.isFeatureDisabled('NGE_19796_REACT_SORTABLE_STREAMS')) {
        //make columns sortable
        $("#streamsScroll ._streamsScroll").sortable({
            forcePlaceholderSize: true,
            handle: '._header ._handle',
            distance: 3,
            //opacity: 0.8,
            axis: 'x',
            //revert: true,
            cursor: 'move',
            tolerance: 'pointer',
            placeholder: 'sortable-placeholder',
            start: function (_event, ui) {
                ui.placeholder.width(ui.placeholder.width() - 6); // to account for dotted border
                ui.item.height(ui.item.height() + 30);
                ui.item.children('._body').hide();
                if (hs.timers.editTabTimer) {
                    clearTimeout(hs.timers.editTabTimer);
                    delete hs.timers.editTabTimer;
                }
            },
            stop: function (_event, ui) {
                var $boxBody = ui.item.children('._body');
                $boxBody.show();
                window.editTabWithTimer();
                // refresh app if needed
                var $iframe = $boxBody.find('iframe[pid]');
                if ($iframe.length) {
                    var pid = false;
                    var iframeName = $iframe.attr('name');
                    try {
                        pid = iframeName.split('_')[1];
                    } catch (e) {
                        hs.statusObj.update(translation._('Cannot get member stream id (pid)'), 'error', true);
                    }

                    if (pid) {
                        ajaxCall({
                            url: '/ajax/appdirectory/get-stream-url',
                            data: {pid: pid},
                            type: 'GET'
                        }, 'qm')
                            .done(function (data) {
                                const form = document.createElement('form');
                                form.setAttribute('action', data.url);
                                form.setAttribute('method', 'post');
                                form.setAttribute('target', iframeName);
                                document.body.appendChild(form);

                                _.defer(function () {
                                    form.submit();
                                    form.remove();
                                });
                            })
                            .fail(function (jqXHR) {
                                hs.statusObj.update(JSON.parse(jqXHR.responseText).error, 'error', true);
                            });
                    }
                }
            }
        });
    }

    var requests = _.map($streamsContainerBox, function (box) {
        return new Promise(function (resolve) {
            $(box).box('refresh', null, resolve);
        });
    });

    // Creating a new board calls initStream. We don't want to record load time of the empty board
    if (requests.length !== 0) {
        Promise.all(requests).then(function () {
            if (currentTabId) {
                timer.end({ id: currentTabId })
                hootbus.emit('streams:board:refresh:done');
            }
        });
    } else {
        // Whenever there is no stream box to load, we need to emit an event for the masthead refreshing btn to stop showing refreshing icon
        hootbus.emit('streams:board:refresh:done');
    }

    //auto refresh now
    window.startTabRefreshTimer();

    //detect user inactivity
    window.startUserInactiveTimer();

    if (darklaunch.isFeatureEnabled('NGE_17040_REACT_ADD_STREAM')) {
        var isHidden = !!(data.isShowStreamHelper === 0 && $('._box').length > 0);
        asyncStreamLoader('addStreamPane', { isHidden: isHidden })
    }

};

/**
 * initScrollAutoLoad
 * @param selector
 */
window.initScrollAutoLoad = function (selector) {
    $(selector).unbind('scroll.autoLoadStream').bind('scroll.autoLoadStream', function (e) {
        var $target = $(e.target);
        var isLoadMore = false;

        if (!$target.find('._tweetMore').length) {
            return;
        }

        if ($target.find("._messages").length) {
            isLoadMore = $target.find('._tweetMore').position().top - $target.height() < 200;
        } else {
            // quick search
            var offset = $target.find('._tweetMore').offset();
            if (offset) {
                var top = offset.top;
                isLoadMore = $target.height() > top - 200;	// is the button within 200px of being visible in the scroll?
            }
        }

        if (isLoadMore) {
            $target.find("._tweetMore")
                .find("a").click()
                .end().hide().swapClass('_tweetMore', '_tweetMoreHidden');	// stop auto load until load finishes
        }
    });
};

/**
 * get Min Tweet Id
 */
stream.stream.getMinTweetId = function (boxData) {
    if (!boxData.count) {
        return null;
    }

    var messages = boxData.viewData.messages,
        boxType = boxData.boxType,
        key = 'id';

    if (boxType.match(/\b(f_|l_|m_)/i)) {
        if (boxType.match(/\bf_/i)) {
            key = 'created';
        } else if (boxType.match(/\bl_/i)) {
            key = 'timestamp';
        } else {
            key = 'postDate';	// or id...jeez!
        }
    }

    return messages[messages.length - 1][key];
};

/**
 * refreshTab
 */
window.refreshTab = function (force) {
    // do not refresh when set to manual, unless forced eg. dashboard.js:1769
    if (force !== true && parseInt($("#editTabForm ._interval._active").attr('interval'), 10) === 0) {
        return false;
    }

    const $streamsTabInfo = $("#streamTabInfo");

    $streamsTabInfo.find('._refresh').hide();
    $streamsTabInfo.find('._refreshing').show();

    const totalBoxes = window.refreshBoxes();

    hs.checkTabRefreshStateTimesTried = 0;
    hs.checkTabRefreshStateInterval = totalBoxes;
    hs.checkTabRefreshStateMaxTries = Math.round(60 / totalBoxes);
    setTimeout(checkTabRefreshState, hs.checkTabRefreshStateInterval * 1000);

    return false;
};

stream.stream.abortRefreshes = function () {
    try {
        ajaxQueueManager('qstream').abort();
    } catch (e) {
        // ajaxQueueManager('qstream').abort() is throwing an error as seen here: https://sentry.io/organizations/ubervu/issues/3114629035/?project=5493994.
        // All "stream/refresh-box" requests still abort, but we're throwing an error on every abort and Sentry catches it.
        // This isn't a real error, so we should catch the error and not log it on Sentry.
    }
}

window.refreshBoxes = function() {
    const messageListIds = [];
    const $streamsContainerBox = $("#streamsContainer").find("._box");


    if (darklaunch.isFeatureEnabled('LPLAT_2324_FIX_STREAMS_ABORT_ERROR')) {
        abortStreamRefresh()
    } else if (darklaunch.isFeatureEnabled('PUB_25645_ABORT_ERROR_FIX')) {
        stream.stream.abortRefreshes();
    } else {
        //abort existing refreshes to start from clean
        ajaxQueueManager('qstream').abort();
    }

    //check if there are any boxes existing in current view.
    const totalBoxes = $streamsContainerBox.length;
    if (totalBoxes < 1) return 0;

    $streamsContainerBox.find("._header ._refresh").hide();
    $streamsContainerBox.find("._header ._refreshing").show();
    $streamsContainerBox.find("._body ._error").hide();

    $streamsContainerBox.each(function () {
        var $box = $(this);
        $box.box('refresh', 'new');
        messageListIds.push($box.data('boxid'));
    });

    if (messageListIds.length) {
        messageListIds.push('singlePostView');
        streamsFlux.getActions(MESSAGE_LIST).remove({ exclude: messageListIds });
    }

    hootbus.emit('streams:analytics:refresh', { boxIds: messageListIds });
    return totalBoxes;
}

/**
 * checkTabRefreshState
 * Once Refresh tab function is fired, checkTabRefreshState will be called every X seconds to check if all columns refreshes
 * all done. if not done, call checkTabRefreshState again X seconds later. If done, then call refreshTabDone function
 * Note that we'll call checkTabRefreshState a maxinum of Y times, so if something wrong with column refresh,  it doesn't hang forever
 *
 * X and Y are determined by the number of total columns in current Tab. the goal is to call checkTabRefreshState() for a maximum of 1 minute,
 * and and call frequency depends on # of total columns. the more column, the less requent.
 *
 * X: 60 seconds/total columns.
 * Y: total columns
 *
 * If there are 1 column, then call checkTabRefreshState function every 1 second for a max of 60 times
 * If there are 5 columns, then call checkTabRefreshState function every 5 seconds for a max of 12 times
 * If there are 10 columns, then call checkTabRefreshState function every 10 seconds for a max of 6 times
 */
var checkTabRefreshState = function () {
    hs.checkTabRefreshStateTimesTried++;
    if (hs.checkTabRefreshStateTimesTried > hs.checkTabRefreshStateMaxTries) {
        refreshTabDone();
    }
    else {
        if ($("#streamsContainer ._box ._header ._refreshing:visible").length > 0) {
            setTimeout(checkTabRefreshState, hs.checkTabRefreshStateInterval * 1000);
        }
        else {
            refreshTabDone();
        }
    }
};

window.refreshBoxesDone = function() {
    $("#streamsContainer ._box ._header ._refresh").show();
    $("#streamsContainer ._box ._header ._refreshing").hide();

    // sum the amount of new tweets in each column, add in the plus sign if it was present
    var totalCount = 0,
        hasMore = false;
    var $newCounts = $("#streamsScroll ._newCount");
    $.each($newCounts, function (_i, v) {
        v = $(v);
        totalCount += v.html().replace(/\D/g, "") * 1;
        if (!hasMore) {
            hasMore = (v.html().indexOf("+") > -1);
        }
    });

    if (totalCount > 0) {
        hs.windowHasFocus = false;
        alertTitleUpdate(totalCount + (hasMore ? "+" : ""));
    }
}

function refreshTabDone() {
    $("#streamTabInfo ._refresh").show();
    $("#streamTabInfo ._refreshing").hide();

    window.refreshBoxesDone();

    var date = new Date();
    var hour = date.getHours();
    var min = date.getMinutes();
    var ampm = "AM";
    if (hour == 12) {
        ampm = "PM";
    }
    else if (hour > 12) {
        hour = hour - 12;
        ampm = "PM";
    }
    if (min < 10) {
        min = "0" + min;
    }
    $("#streamTabInfo ._refresh").attr('title', translation._("Refresh all | Last update: ") + hour + ":" + min + ampm);
}

/**
 * updateNewCount
 */
stream.stream.updateNewCount = function (boxSelector, count, hasMore) {
    count = parseInt(count, 10);
    var $newCount = $(boxSelector).find('._header ._newCount');
    if (!isNaN(count) && count > 0) {
        if (hasMore) {
            count = count + '+';	// append plus sign
        }
        $newCount.text(count).show('fast');
    } else {
        $newCount.empty().hide('fast');
    }
};

/**
 * addNewTab
 */
stream.stream.addNewTab = function (tabName, callback) {

    tabName = tabName || translation._("New Board");

    var $dashboardTabs = $("#dashboardTabs");
    if ($dashboardTabs.find("._tab").length >= 20) {
        hs.statusObj.update(translation._("You can only add up to 20 boards"), 'warning', true);
        return false;
    }

    // add fake tab
    // clear #streamsScroll
    var $dummyTab = $('<div class="_addNewTabDummy _tab tab animated fadeInUp active">' +
        '<div class="text text-edit"><input type="text" maxlength="30" value="' + tabName + '" class="_newTabName" style="min-width: 200px;" /></div>' +
        '<button title="' + translation._("Cancel adding new board") + '" class="_cancelAddTab -closeButton"><span class="icon-13 close">X</span></button>' +
        '</div>');
    var fnAddNewTab = function () {
        // save tab
        var newTabName = $dummyTab.find('._newTabName').val();
        // validate
        if (!$.trim(newTabName).length) {
            hs.statusObj.update(translation._("Board name can not be empty"), 'warning', true);
            return false;
        } else if (newTabName.length > 30) {
            hs.statusObj.update(translation._("Board name can not be over 30 characters"), 'warning', true);
            return false;
        }

        $('body').unbind('click.addNewTab');
        hs.statusObj.update(translation._("Adding new board..."), 'info', true);

        ajaxCall({
            url: "/ajax/stream/add-tab",
            data: 'refreshInterval=10&title=' + newTabName,
            success: function (data) {
                if (data.tabId > 0) {
                    window.address.go('/tabs?id=' + data.tabId, callback);
                }
                else {
                    hs.statusObj.update(translation._("Adding new board failed. Please try again."), 'error', true);
                }
                return false;
            }
        }, 'q1');
    };

    $dummyTab.find('._cancelAddTab').click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('body').unbind('click.addNewTab');

        $dummyTab.remove();
        // goto first tab
        window.address.reloadStreams();
    });
    $dummyTab.find('._newTabName').keyup(function (e) {

        if (e.keyCode == 13) {
            fnAddNewTab();
        }
    });

    $dummyTab.bind('finishAddingTab', function () {
        fnAddNewTab();
    });

    $dashboardTabs.find('._tab').removeClass('active');
    if ($("#tabExtras .dropdown-content > *").length) {
        $dashboardTabs.find('._tab').eq(0).before($dummyTab);
    } else {
        $dashboardTabs.find('#tabExtras').before($dummyTab);
    }
    window.updateTabs();
    $("#streamsScroll").empty().width('100%');
    window.updateDashboardHeight();

    $('body').bind('click.addNewTab', function (e) {
        var $target = $(e.target);
        if ($target.is('_addNewTabDummy') ||
            $target.closest('._addNewTabDummy').length ||
            $target.is('addTab') ||
            $target.closest('.addTab').length) {
            return;
        }

        $('body').unbind('click.addNewTab');
        //$dummyTab.find('._cancelAddTab').click();
        fnAddNewTab();

        e.stopPropagation();	// don't let it trigger other calls

    });

    $dashboardTabs.find('._addNewTabDummy').trigger('finishAddingTab');

    return false;
};

/**
 * editTabWithTimer
 * @param timeout
 */
window.editTabWithTimer = function (timeout) {
    if (!timeout) {
        timeout = hs.c.delayPrefsTab * 1000;
    }

    if (hs.timers.editTabTimer) {
        clearTimeout(hs.timers.editTabTimer);
        delete hs.timers.editTabTimer;
    }

    hs.timers.editTabTimer = setTimeout(editTab, timeout);
};

/**
 * editTab
 */
var editTab = function () {
    var streamSize = $("#streamTabInfo input[name='streamSize']").val() || hs.c.currentStreamSize;
    hs.c.numViewableCols = resize.getNumViewableColsForStreamSize(streamSize);
    $("#streamTabInfo input[name='visibleColumnCount']").val(hs.c.numViewableCols);
    var $form = $("#streamTabInfo form"),
        postData = $form.serialize();

    //if current view is not stream view (a timer is set for editTab, but user switch to other dashboard view)
    if (!postData) {
        return false;
    }
    var boxOrder = '';
    $("#streamsContainer ._box").each(function (i) {
        var boxId = $(this).attr('id').replace('box', '');
        if (i === 0) {
            boxOrder = boxId;
        }
        else {
            boxOrder += ',' + boxId;
        }

    });
    postData += '&boxOrder=' + encodeURIComponent(boxOrder);

    // just silently finish the job, if there is error, then whatever
    ajaxCall({
        url: "/ajax/stream/edit-tab",
        data: postData
    }, 'qm');

    return false;
};

/**
 * alertTitleUpdate
 * @param n
 */
function alertTitleUpdate(n) {
    if (!hs.windowHasFocus && hs.prefs.isNotifyNewTweet) {
        if (document.title === 'Hootsuite') {
            document.title = n + ' ' + translation._("new tweets...");
        } else {
            document.title = 'Hootsuite';
        }

        if (hs.timers.alertTitleUpdateTimer) {
            clearTimeout(hs.timers.alertTitleUpdateTimer);
            delete hs.timers.alertTitleUpdateTimer;
        }

        hs.timers.alertTitleUpdateTimer = setTimeout(function () {
            alertTitleUpdate(n);
        }, hs.c.delayUpdateTitleAlert * 1000);
    }
}

_.bindAll(BoxService, 'save');
var debouncedSave = _.debounce(BoxService.save, 500);

/**
 * selectSocialNetworkPopup
 * display twitter profiles selector popup, twitter profile that gets clicked on will be
 * passed as an argument to successCallback function
 */
window.selectSocialNetworkPopup = function (successCallback, title, forceOpen, type, isAllowSkip) {
    type = typeof type === 'string' ? type : (_.isArray(type) ? type.join(' ') : 'TWITTER');
    isAllowSkip = isAllowSkip || false;
    // if there is only one account, then auto select it
    var sns = [];
    _.each(type.split(' '), function (snType) {
        sns = sns.concat(_.values(hs.socialNetworksKeyedByType[snType]));
    });
    if (sns.length == 1 && !forceOpen) {
        successCallback(sns[0]['socialNetworkId']);
    }
    else {
        dashboard.showTwitterProfileSelectorPopup(function (snId) {
            successCallback(snId);
            $("#socialNetworkSelectorPopup").dialog('close');
        }, forceOpen, type, isAllowSkip);
        _.defer(function () {
            var $popup = $("#socialNetworkSelectorPopup");
            if (title) {
                $popup.find("._title").html(title);
            } else {
                $popup.find("._title").text(translation._("Twitter network to apply the action to:"));
            }
        })
    }
};

/**
 * openBoxMoreMenu
 */
stream.stream.openBoxMoreMenu = function (anchor) {
    var $anchor = $(anchor);
    if (!$anchor.length) {
        return;
    }

    if (!$anchor.is("._more")) {
        $anchor = $anchor.closest("._more");
    }

    var $menu = $anchor.next("._moreMenu");
    if ($menu.is(":visible")) {
        $menu.hide();
        return;	// don't bind
    }

    $menu.show();

    var fnCloseBoxMoreMenu = function (_e) {
        $menu.hide();
    };

    _.defer(function () {
        $('body').one("click.closeBoxMoreMenu", fnCloseBoxMoreMenu);
    });		// timeout so we don't trigger this ourselves...
    return false;	// return false here so the click event doesn't bubble up to trigger the click event we just bound on the body!
};

/**
 * editTabName
 */
stream.stream.editTabName = function (tab) {
    var $tab = $(tab),
        currentName = $tab.find('._edit input').val(),
        currentNameCleaned = hsEjs.cleanPage(currentName),
        fnSave = function (e) {
            var $target = $(e.target),
                newName = $tab.find('._edit input').val(),
                newNameCleaned = hsEjs.cleanPage(newName),
                tabId = $tab.attr('id').match(/\d+/)[0],
                isSave = true;
            if ($target.closest('._tab').length) {
                if (!$target.closest('._tab').is('#' + $tab.attr('id'))) {
                    // clicked on another tab, abort
                    isSave = false;
                } else {
                    // clicked on same tab, do nothing
                    return;
                }
            } else {
                if (!$.trim(newName).length || newName.length > 30) {
                    var msg = translation._("Tab name can not be empty");
                    if (newName.length > 30) {
                        msg = translation._("Tab name can not be over 30 characters");
                    }
                    hs.statusObj.update(msg, 'warning', true);
                    isSave = false;
                }
                else {
                    isSave = currentName != newName;
                }
            }

            $tab.find('._load').show();
            $tab.find('._edit').hide();
            window.updateTabs();

            if (isSave) {
                // update names with cleaned name
                $tab.find('._text').html(newNameCleaned);
                $tab.find('._text input').val(newName);
                // update tab width, do it right away so users don't see two rows of tabs and have to wait for ajax callback
                window.updateTabs();

                ajaxCall({
                    url: "/ajax/stream/edit-tab",
                    data: 'id=' + tabId + '&title=' + encodeURIComponent(newName),
                    error: function () {
                        // revert
                        $tab.find('._text').html(currentNameCleaned);
                        $tab.find('._text input').val(currentName);
                        window.updateTabs();
                    }
                }, 'qm');
            } else {
                // revert
                $tab.find('._text').html(currentNameCleaned);
                $tab.find('._edit input').val(currentName);
            }

            $('body').unbind('click.editTabName');

            e.stopPropagation();
        };

    var textWidth = $tab.find('._load').width();

    $tab.find('._load').hide();
    $tab.find('._edit').show().find('input')
        .width(textWidth)
        .unbind('keydown.editTabName').bind('keydown.editTabName', function (e) {
            if (e.keyCode === 13) {
                $('body').trigger('click.editTabName');
            }
        });

    setTimeout(function () {
        $tab.find('._edit input').get(0).select();
    }, 1);

    window.updateTabs();

    $('body').unbind('click.editTabName').bind('click.editTabName', fnSave);
};

stream.stream.resetFilter = function (boxId) {
    var $box = $("#box" + boxId);
    var $boxFilter = $box.find("._boxFilter");
    var $boxFilterInput = $boxFilter.find('._values span:visible input');
    var $messages = $box.find("._messages ._message");

    $boxFilterInput.val('').focus();
    $boxFilterInput.trigger('keyup');
    $messages.show();
};

/**
 * applyFilter
 */
stream.stream.applyFilter = function (boxId) {
    if (!boxId) {
        return;
    }
    var $box = $("#box" + boxId),
      $boxFilter = $box.find("._boxFilter");
    if (!$boxFilter.is(":visible")) {
        // no filtering
        return;
    }
    var $boxFilterInput = $boxFilter.find('._values span:visible input');

    var filter = $boxFilter.find('._filters').val(),
        value = $boxFilterInput.val(),
        $messages = $box.find("._messages ._message"),
        isStreamFiltered = false,
        eventData;

    // add a clear button for the stream filter search input
    $boxFilter.find('._clearInputValue').on('click', function () {
        stream.stream.resetFilter(boxId);
    });

    var trackFilter = function (filterType) {
        // Google Analytics tracking
        hs.trackEvent('stream', 'filter', filterType);
        // Data Lab tracking
        var origin = $.grep([
            "web.dashboard.streams.stream",
            $box.box('get', 'socialNetworkType'),
            $box.box('get', 'type')
        ], function (value) { return value && value.length; }).join('.').toLowerCase();
        trackerDataLab.trackCustom(origin, 'filter_stream_' + filterType.toLowerCase(), {'value': value});
    };

    switch (filter) {
        case 'keyword':
            if (value.length) {
                eventData = {
                    messageListId: boxId,
                    keyword: value
                };
                hootbus.emit('stream:filter', eventData);
                hootbus.emit('streams:resize');

                trackFilter('keyword');

                $messages.filter(":not(:Contains(" + value + "))").each(function () {
                    $(this)
                        .hide()
                        .prev('._assignment, ._response').hide();
                });
                isStreamFiltered = true;
            }
            break;
        case 'followers':
            if (value) {
                var data = {
                    messageListId: boxId,
                    followersCount: value
                };
                hootbus.emit('stream:filter', data);
                hootbus.emit('streams:resize');

                stream.stream.saveFilters(boxId);
                trackFilter('followers');

                isStreamFiltered = true;
            }
            break;
        default:
            break;
    }

    if (isStreamFiltered) {
        $box
            .find('._loadgap').hide().end() // just hide gap anyways
            .find('._tweetMore').hide().swapClass('_tweetMore', '_tweetMoreHidden'); // IMPORTANT: gotta hide this or our auto-scroll load goes crazy

        setTimeout(function () {
            stream.stream.updateStreamOnScroll("#box" + boxId);
            /* call for this box */
            $box.find('._body').scrollTop(0);
        }, 500);
    }
};

/**
 * removeFilter
 */
stream.stream.removeFilter = function (boxId) {
    if (!boxId) {
        return;
    }

    streamsFlux.getActions(MESSAGE_LIST).resetFilters(boxId);
    hootbus.emit('streams:resize');
};

stream.stream.getFilters = function (boxId) {
    var $box = $("#box" + boxId);
    var $boxFilter = $box.find("._boxFilter");
    var $boxFilterInput = $boxFilter.find('._values span:visible input');

    var filter = $boxFilter.find('._filters').val();
    var value = $boxFilterInput.val();
    var filters = {};

    if (value) {
        switch (filter) {
            case 'keyword':
                filters.keyword = value;
                break;
            case 'followers':
                filters.followers = parseInt(value);
                break;
            case 'tag':
                filters.tag = value;
                break;
            default:
                break;
        }
    }

    return filters;
};

stream.stream.saveFilters = function (boxId) {
    var boxType = $("#box" + boxId).box('get', 'type');
    var tabId = $("#streamTabInfo input[name='id']").val();
    var filters = stream.stream.getFilters(boxId);

    if (boxId && boxType && tabId) {
        debouncedSave({
            box: {
                boxId: boxId,
                type: boxType,
                tabId: tabId,
                filters: _.isEmpty(filters) ? '' : filters
            }
        });
    }
};

stream.stream.getLayout = function (id) {
    var $box = $("#box" + id),
        layout = $box.box('get', 'layout');

    if (!_.isObject(layout)) {
        layout = {};
    }

    return layout;
};

stream.stream.saveLayout = function (id, updatedLayout) {
    var $box = $("#box" + id),
        type = $box.box('get', 'type'),
        layout = updatedLayout ? updatedLayout : stream.stream.getLayout(id),
        tabId = $box.box('get', 'tabId');

    if (id && type && tabId) {
        debouncedSave({
            box: {
                boxId: id,
                type: type,
                tabId: tabId,
                layout: layout
            }
        });
    }
};

/**
 * refreshAppBox
 */
stream.stream.refreshAppBox = function (boxId) {
    var $box = $('#box' + boxId),
        $refresh = $box.find('._header ._refresh'),
        $refreshing = $refresh.next('._refreshing'),
        $iframe = $box.find('._body iframe'),
        apiKey = $iframe.attr('apikey'),
        pid = $iframe.attr('pid');

    jsapi.refresh(apiKey, pid);	// fire event

    window.appapi.callBackFunc.refresh(pid);

    // animate
    $refresh.hide();
    $refreshing.show();
    setTimeout(function () {
        $refresh.show();
        $refreshing.hide();
    }, 700);

    return false;
};

/**
 * init the $.data of the box
 */
stream.stream.initBox = function (boxId, params) {
    var $box = $('#box' + boxId);
    $box.box(params);

    if (reactBoxChecker.canRenderReactStream(params.socialNetworkType, params.type)) {
        var $boxMessagesContainer = $box.find('._messages');
        $box.box('set', 'reactStream', true);
        $boxMessagesContainer.closest('._box').addClass('x-reactContext');
        $boxMessagesContainer.addClass('-reactContainer');

        if ($boxMessagesContainer.length) {
            messageListRenderer({
                loadMessagesBetween: function (messageListId, gapId) {
                    streamsFlux.getActions(MESSAGE_LIST).trimMessagesBelowGap(messageListId, gapId);
                },
                loadMessagesOlder: function (messageListId) {
                    streamsFlux.getActions(MESSAGE_LIST).fetch(messageListId, 'old').then(function () {
                        hootbus.emit('stream:refreshSuccess', messageListId);
                    });
                },
                loadUnreadMessages: function (messageListId) {
                    streamsFlux.getActions(MESSAGE_LIST).loadUnreadMessages(messageListId);
                },
                setUnreadCaching: function (messageListId, cacheUnread) {
                    streamsFlux.getActions(MESSAGE_LIST).setUnreadCaching(messageListId, cacheUnread);
                },
                messageListId: boxId,
                entitlements: window.stream?.entitlements,
            }, $boxMessagesContainer[0]);
        }
    }
};

/**
 * removeWelcomeTab
 */
stream.removeWelcomeTab = function () {
    if (!confirm(translation._("Are you sure you want to remove the 'Getting Started' tab? Removing this tab cannot be undone."))) {
        return false;
    }

    ajaxCall({
        url: "/ajax/member/update-preference",
        data: "type=isShowTweetBoxInfo&value=0",
        beforeSend: function () {
            hs.statusObj.update(translation._("Deleting tab..."), 'info');
        },
        success: function (data) {
            if (data.output == "SUCCESS") {
                var $tabToDelete = $('#tab0');
                $tabToDelete.find('._delete').remove();
                $tabToDelete.animate({
                    opacity: 0,
                    width: 0
                }, 1000, function () {
                    if ($tabToDelete.hasClass('active')) {
                        // load the next tab if possible
                        var $nextTab = $tabToDelete.next('._tab'),
                            fnLoadNextTab;
                        if ($nextTab.length) {
                            fnLoadNextTab = function () {
                                $nextTab.find('._load').click();
                            };
                        } else {
                            // force stream reload
                            fnLoadNextTab = window.address.reloadStreams;
                        }
                        _.defer(fnLoadNextTab);
                    }
                    $tabToDelete.remove();
                    hs.statusObj.reset();
                    window.updateTabs();
                });
            }
            else {
                hs.statusObj.update(translation._("We are not able to delete the tab at this time, please try again later"), 'error', true);
            }
        },
        error: function () {
            hs.statusObj.reset();
        },
        abort: function () {
            hs.statusObj.reset();
        }
    }, 'q1');
    return false;
};

/**
 * showStreamMessage
 */
stream.stream.showStreamMessage = function (boxId, message, isPermanent, fnOnClick) {
    var $streamMessage = $('#box' + boxId + ' ._streamMessage');
    $streamMessage
        .find('._content').html(message).end()
        .show();//.slideToggle();

    $.isFunction(fnOnClick) && $streamMessage.bind('click', fnOnClick).css({cursor: 'pointer'});

    if (!isPermanent) {
        setTimeout(function () {
            stream.stream.hideStreamMessage(boxId);
        }, 5000);
    }
};

/**
 * hideStreamMessage
 */
stream.stream.hideStreamMessage = function (boxId) {
    var $streamMessage = $('#box' + boxId + ' ._streamMessage');
    $streamMessage
        .find('._content').empty().end()
        .hide()
        .unbind('click')
        .css({cursor: 'default'});
};

/**
 * deletePost
 */
stream.stream.deletePostGenerator = function (name) {
    return function (postId, socialNetworkId, callback) {
        ajaxCall({
            url: "/ajax/" + name + "/delete-post",
            data: "postId=" + postId + "&socialNetworkId=" + socialNetworkId,
            beforeSend: function () {
                hs.statusObj.update(translation._("Deleting post..."), 'info');
            },
            success: function (data) {
                if (data.success == 1) {
                    callback();
                    hs.statusObj.reset();
                } else {
                    hs.statusObj.update(translation._("Error deleting your post, you may not have permission to delete this post"), 'error', true);
                }
            },
            error: function () {
                hs.statusObj.reset();
            },
            abort: function () {
                hs.statusObj.reset();
            }
        }, 'q1');
        return false;
    };
};

/**
 * deleteCommentGenerator
 */
stream.stream.deleteCommentGenerator = function (name) {
    return function (commentId, socialNetworkId, callback) {
        ajaxCall({
            url: "/ajax/" + name + "/delete-comment",
            data: "commentId=" + commentId + "&socialNetworkId=" + socialNetworkId,
            beforeSend: function () {
                return hs.statusObj.update(translation._("Deleting comment..."), 'info');
            },
            success: function (data) {
                if (data.success === 1) {
                    callback();
                    return hs.statusObj.reset();
                } else {
                    return hs.statusObj.update(translation._("Error deleting your comment, you may not have permission to delete it"), 'error', true);
                }
            },
            error: function (data) {
                hs.util.keepErrorMessageVisible(data);
            },
            abort: function () {
                return hs.statusObj.reset();
            }
        }, 'q1');
        return false;
    };
};

/**
 * updateStreamOnScroll
 * Function to be bound on a stream's scrolling div,
 * so that on scroll, we hide all the images which aren't in view
 */
stream.stream.updateStreamOnScroll = function (e) {
    var DELAY = 300,	// milli seconds till function execution
        $box = (e.target) ? $(e.target).closest("._box") : $(e),
        boxId = $box.attr('id'),
        timerId = 'timerLazyload_' + boxId,
        fnClearTimer = function () {
            if (hs.timers[timerId]) {
                clearTimeout(hs.timers[timerId]);
                try {
                    delete hs.timers[timerId];
                } catch (err) {
                    hs.timers[timerId] = undefined;
                }
            }
        },
        fnCheckScroll = function () {
            hs.stopMessageMenuEvent = false; // enable scroll

            // calculate fold
            var $boxBody = $box.find("._body"),
                foldBuffer = 300,
                topFold = $boxBody.offset().top,
                bottomFold = topFold + $boxBody.height();

            topFold -= foldBuffer;
            bottomFold += foldBuffer;

            // do unread message here
            if ($boxBody.scrollTop() === 0) {
                var boxNum = boxId.replace("box", ""),
                    uc = stream.unreadCache.get(boxNum);
                if (uc) {
                    _.defer(function () {
                        uc.render();

                        if (uc.getCount() < hs.c.tweetPageSize) {
                            $boxBody.scrollTop(0);
                        }
                        stream.stream.hideStreamMessage(boxNum);
                        stream.unreadCache.remove(boxNum); // free memory when done
                    });
                    return; // stop
                }
            }

            // also do infinite scroll here
            if (
                $boxBody.find("._tweetMore:visible").length &&
                $boxBody.find("._tweetMore").position().top -
                    $boxBody.height() <
                    300
            ) {
                _.defer(function () {
                    $boxBody
                        .find(
                            "._tweetMore:visible a, ._tweetMore:visible button"
                        )
                        .click();
                });
            }

            $boxBody
                // do not unload images
                //.find(avatarImgSelector+'[lazysrc]').attr('lazysrc', function() { return $(this).attr('src'); }).attr('src', blankImg).end()	// only unload avatars, not other lazy images
                .find("._message")
                .each(function (_i, v) {
                    var $m = $(v),
                        offset = $m.offset().top,
                        height = $m.outerHeight(true);

                    // fold calculations found from the old jquery lazyload plugin: http://www.appelsiini.net/projects/lazyload
                    if (topFold < offset + height && bottomFold > offset) {
                        // in view, we just show
                        stream.stream.handleMessageLazyLoad($m);
                    }
                });

            fnClearTimer();
        };

    fnClearTimer();
    hs.timers[timerId] = setTimeout(fnCheckScroll, DELAY);
    hs.stopMessageMenuEvent = true;
};

/**
 * makeColumnsDroppable
 */
stream.stream.makeColumnsDroppable = function (selector) {
    selector = selector || '#streamsScroll ._box';
    var $boxes = $(selector).filter(function () {
        var $box = $(this);
        return $box.box('get', 'listOwnerSocialNetworkId') && !$box.attr('is-draggable');
    });

    //make boxes droppable for lists
    $boxes.droppable({
        activeClass: 'droppable',
        tolerance: 'pointer',
        accept: '._dragUser',
        /*deactivate: function(event, ui) {
         ui.helper.animate({
         opacity: 0,
         top: ui.helper.position().top - 20
         });
         },*/
        over: function (_event, ui) {
            ui.helper.find('._icon')
                .removeClass('denied').addClass('approved');
        },
        out: function (_event, ui) {
            ui.helper.find('._icon')
                .removeClass('approved').addClass('denied');
        },
        drop: function (_evt, ui) {
            /*
             // Animate helper out
             var tclone = $(ui.helper).clone(true).insertAfter(ui.helper);
             var distanceTop = 30;
             var positionTop = ui.position.top - ui.absolutePosition.top + distanceTop;
             var distanceLeft = 30;
             var positionLeft = ui.position.left - ui.absolutePosition.left + distanceLeft;
             $(tclone).hide('slow');
             */

            var user = ui.draggable.attr('title'); // can be id or username
            var boxId = $(this).box('get', 'id');
            stream.twitter.dropUserToList(user, boxId);
        }
    }).attr('is-draggable', 1);
};

/**
 * makeAppColumnsDroppable
 */
stream.stream.makeAppColumnsDroppable = function (selector) {
    selector = selector || '#streamsScroll ._box';
    var $boxes = $(selector).filter(function () {
        var $box = $(this);
        return $box.box('get', 'type') && $box.box('get', 'type').match(/^app_/i) && !$box.attr('is-draggable');	//$box.is(':not([is-draggable])');
    });

    $boxes.droppable({
        activeClass: 'droppable',
        tolerance: 'pointer',
        accept: '._dragUser',
        over: function (_event, ui) {
            ui.helper.find('._icon')
                .removeClass('denied').addClass('approved');
        },
        out: function (_event, ui) {
            ui.helper.find('._icon')
                .removeClass('approved').addClass('denied');
        },
        drop: function (_evt, ui) {
            var user = ui.draggable.attr('title'),
                postId = ui.draggable.attr('postid'),
                $iframe = $(this).find('._body iframe'),
                apiKey = $iframe.attr('apikey'),
                pid = $iframe.attr('pid');
            user && apiKey && jsapi.dropUser(apiKey, pid, user, postId);

            if (pid) {
                window.appapi.callBackFunc.dropUser(pid, user, postId);
            }
        }
    }).attr('is-draggable', 1);
};

// function to take a container div and process lazy load for all nodes inside
stream.stream.handleMessageLazyLoad = function (sel) {
    var $container = $(sel);
    var $lazyImages = $container.find('img[lazysrc]');
    $lazyImages.attr('src', function () {
        return $(this).attr('lazysrc');
    });
    _.each($lazyImages, function (el) {
        $(el).load(function () {
            if ($(this).hasClass('_centerCrop')) {
                var $cropimagecontainer = $(this).parent();
                if (($(this).width() / $(this).height()) >= ($cropimagecontainer.outerWidth() / $cropimagecontainer.outerHeight())) {
                    $(this).addClass('x-landscape');
                } else {
                    $(this).addClass('x-portrait');
                }
                $(this).removeClass('_centerCrop');
                $(this).addClass('x-centerCrop');
            }
            $(this).removeAttr('lazysrc').addClass('isLoaded'); // load all lazy images (ie. facebook post images)
        });
    });
    $container.find('[lazystyle]').attr('style', function () {
        return $(this).attr('lazystyle');
    }).removeAttr('lazystyle');
};


/**
 * add stream stream
 */
stream.streamHelper = {};

stream.streamHelper.initShareTeamsDropdown = function () {
    var $box = $('#boxAddStream'),
        $teamSelector = $box.find('._sharedTeamsSelector');

    ajaxCall({
        url: '/ajax/stream/get-sharable-teams',
        success: function (data) {
            var teams = [];
            _.each(data.teams, function (team) {
                teams.push({
                    id: team.teamId,
                    orgId: team.organizationId,
                    title: _.escape(team.name),
                    img: hs.util.rootifyAvatar('team', team.logo) || hs.util.getDefaultAvatar('team')
                });
            });

            if (teams.length) {
                $teamSelector.show()
                    .closest('._sharedTeams').find('._noTeam').hide();
                $teamSelector.hsDropdown({
                    data: {
                        items: teams,
                        withSearch: true
                    },
                    change: function (element) {
                        $teamSelector
                            .find('._selectedAvatar').attr('src', element.img).end()
                            .find('._selectedName').html(_.escape(element.title)).end();

                        ajaxCall({
                            url: '/ajax/stream/get-team-streams',
                            data: {teamId: element.id},
                            success: function (data) {
                                var template = hsEjs.getEjs('stream/streamhelper/sharedstreamrow'),
                                    $container = $box.find('._sharedList');

                                if (data.teamSharedBoxes && _.values(data.teamSharedBoxes).length) {
                                    $container.empty();
                                    _.each(data.teamSharedBoxes, function (stream) {
                                        $container.append(template.render({
                                            ...stream,
                                            u_escape: _.escape
                                        }));
                                    });
                                } else {
                                    $container.html(translation._("This team has no shared streams."));
                                }
                            }
                        }, 'qm');
                    }
                });

                $teamSelector.hsDropdown('selectElement', teams[0]['id']);
            } else {
                $teamSelector.hide().closest('._sharedTeams').find('._noTeam').show();
            }
        }
    }, 'q1');

};

stream.streamHelper.getSocialProfilesForStreams = function () {
    //get network types that are not supported here
    var excludedNetworkTypes = NetworksConf.getExcludedNetworkTypesForComponent('STREAMS', 'COMMON');

    //condition to remove network from the array
    var isNetworkExcluded = function (network) {
        return _.some(excludedNetworkTypes, function (excludedType) {
            return (excludedType === network.type);
        });
    };

    //exclude networks that are not supported here
    return _.reject(hs.profileSelector.getSortedSocialNetworks(), isNetworkExcluded);
};

/**
 * Checks if the provided social network's avatar is null and sets to a default avatar based on the network type
 * @private
 */
stream.streamHelper.getDefaultSnAvatar = function (sn) {
    var GENERIC_DEFAULT_AVATAR = "https://assets.hootsuite.com/v2/images/dashboard/avatars/member-default-100.8e9a4075.png?ssl=1";
    var IG_PERSONAL_DEFAULT_AVATAR = "https://i.hootsuite.com/assets/channel-integrations/default_avatar_ig_personal_square.svg";

    var avatarSrc = sn.avatar;
    if (sn && sn.type === "INSTAGRAMBUSINESS") {
        avatarSrc = GENERIC_DEFAULT_AVATAR;
    } else if (sn && sn.type === "INSTAGRAM") {
        avatarSrc = IG_PERSONAL_DEFAULT_AVATAR;
    }
    return avatarSrc;
};

stream.streamHelper.initSnDropdown = function () {
    var $box = $('#boxAddStream'),
        $snSelector = $box.find('._snSelector');

    // initialize SN dropdown
    var snItems = [];
    _.each(this.getSocialProfilesForStreams(), function (sn) {
        snItems.push({
            title: _.escape(sn.username),
            id: sn.socialNetworkId,
            img: sn.avatar || stream.streamHelper.getDefaultSnAvatar(sn),
            type: sn.type,
            text: getSocialNetworkNameByType(sn.type)
        });
    });

    if (snItems.length) {
        $snSelector.show()
            .closest('._socialNetworks').find('._noSn').hide();
        $snSelector.hsDropdown({
            withLazyLoading: true,
            data: {
                items: snItems,
                withSearch: true
            },
            change: function (element) {
                $snSelector
                    .find('._selectedAvatar').attr('src', element.img).end()
                    .find('._selectedName').html(_.escape(element.title)).end()
                    .find('._selectedType').text(element.text).end();

                $box.find('._streamType').hide().filter('._' + element.type.toLowerCase()).show();

                //Hide all buttons and animate in one by one (animation effect in CSS)
                var $buttons = $box.find('._' + element.type.toLowerCase() + ' .btn-select');
                $buttons.hide();
                var btnDisplayPromises = _.map($buttons, function (button, i) {
                    return new Promise(function (resolve) {
                        setTimeout(function () {
                            $(button).show();
                            resolve();
                        }, i * 50);
                    });
                });
                //Fire event that all buttons have finished transitioning in.
                Promise.all(btnDisplayPromises).then(function () {
                    hootbus.emit(hsEvents.STREAM_BUTTONS_TRANSITION_COMPLETE);
                });
                hootbus.emit(hsEvents.STREAM_SN_CHANGED, {type: element.type, snId: element.id});
            }
        });
        $snSelector.hsDropdown('selectElement', ((hs.pinnedSns.length && hs.pinnedSns[0] in hs.socialNetworks) ? hs.pinnedSns[0] : snItems[0]['id']));	// select first pinned SN if possible, else just the first sn

        $snSelector.hsDropdown('onclose', function () {
            hootbus.emit(hsEvents.STREAM_SN_CLOSED);
        });
    } else {
        $snSelector.hide().closest('._socialNetworks').find('._noSn').show();
    }
};


stream.streamHelper.initAppsSection = function () {
    var $box = $('#boxAddStream'),
        $noApps = $box.find('._apps ._noApps'),
        $hasApps = $box.find('._apps ._hasApps');

    ajaxCall({
        url: '/ajax/stream/get-apps-streams',
        success: function (data) {
            var template;
            if (data.streams.length) {
                $hasApps.show();
                var $trendsContainer = $hasApps.find('._installedList').empty();

                template = hsEjs.getEjs('stream/streamhelper/appstreamrow');
                _.each(data.streams, function (as) {
                    $trendsContainer.append(template.render({
                        ...as,
                        u_escape: _.escape
                    }));
                });
            } else {
                $noApps.show();
                $hasApps.hide();
                var $noAppsButtons = $noApps.find('._appButtons').empty();

                template = hsEjs.getEjs('stream/streamhelper/appinstallicon');
                _.each(data.featured, function (app) {
                    // Separate paid and free apps so we install free and link to app directory for paid.
                    /* eslint-disable no-underscore-dangle */
                    app._paid = '';
                    if (app.isPaid) {
                        app._paid = '_paidApp';
                    }
                    else {
                        app._paid = '_freeApp';
                    }
                    /* eslint-enable no-underscore-dangle */
                    $noAppsButtons.append(template.render({
                        ...app,
                        u_escape: _.escape
                    }));
                });
            }
        }
    }, 'qm');
};


stream.streamHelper.init = function (opts) {
    opts = opts || {};

    var $box = $('#boxAddStream'),
        $overlay = $box.find('._optionsOverlay');

    // Used for PGR-694 Streams buttons hover states
    var $streamButtonPopover = $('#stream-button-popover');

    // initialize the sn dropdown
    stream.streamHelper.initSnDropdown();
    setTimeout(function () {
        stream.streamHelper.initShareTeamsDropdown();
    }, 1000);	// wait one second before initalizing the shared teams dropdown since it makes ajax calls, plus it's hidden

    // binds
    $box
        .delegate('._tab', 'click', function () {
            var target = $(this).data('tab');
            if (target && $box.find('._tabSection._' + target).length && !$box.find('._tabSection._' + target).is(':visible')) {
                // close overlay blade if visible
                var $overlay = $box.find('._optionsOverlay');
                if ($overlay.is(':visible')) {
                    $overlay.find('._close').click();
                }

                $box.find('._tabSection').hide().filter('._' + target).show();

                // remove active class
                $box.find('._tab').removeClass('active').each(function (_tab) {
                    var $tab = $(this);
                    if ($tab.data('tab') == target) {
                        $tab.addClass('active');
                        return false;
                    }
                });

                // tab specific
                if (target === 'apps') {
                    stream.streamHelper.initAppsSection();
                }
            }
        })
        .find('._socialNetworks ._noSn ._connectTwitter').click(function () {
            snActions.add({selectedSocialNetwork: 'TWITTER'});
        }).end()
        .find('._socialNetworks ._noSn ._connectFacebook').click(function () {
            snActions.add({selectedSocialNetwork: 'FACEBOOK'});
        }).end()
        .find('._socialNetworks ._noSn ._connectLinkedIn').click(function () {
            snActions.add({selectedSocialNetwork: 'LINKEDIN'});
        }).end()
        .find('._socialNetworks ._noSn ._connectOthers').click(function () {
            snActions.add();
        }).end()
        .find('._streamTypes').delegate('.btn-select', 'click', function () {
            var $this = $(this),
                boxType = $this.attr('class').match(/_\w+/);	// get the first underscore class

            // checks
            if (!boxType) {
                return;
            }

            boxType = boxType[0].replace(/_/, '').toUpperCase();		// "_retweets_of_me" => "RETWEETS_OF_ME"
            var isMoreDataNeeded = false,
                streamData = {
                    type: boxType
                };

            // handle specific box types which need more data
            switch (boxType) {
                case 'ADVANCED_SEARCH':
                case 'SEARCH':
                case 'LIST':
                case 'I_B_TOP_TAG_SEARCH':
                case 'I_B_TAG_SEARCH':
                case 'Y_SEARCH':
                case 'Y_PLAYLIST':
                    stream.streamHelper.toggleOptionsOverlay(boxType, true);
                    isMoreDataNeeded = true;
                    break;
                default:
                    break;
            }

            if (isMoreDataNeeded) {
                return;
            }

            stream.streamHelper.addStream(streamData);
        }).end()
        .find('._viewAllApps').click(function () {
            window.loadAppDirectory();
        }).end()
        .delegate('._shared ._sharedList ._sharedRow', 'click', function () {
            // just do the add stream here
            stream.streamHelper.addStream($(this).data('teamstreamid'), true);
        })
        .delegate('._apps ._installedList ._appStreamRow', 'click', function () {
            /*
             box[appStreamId]	1202
             box[boxId]
             box[memberAppId]	100958
             box[socialNetworkId]	0
             box[tabId]	17297652
             box[title]	Application
             box[type]	APP_DEFAULT
             */
            var data = $(this).data();
            stream.streamHelper.addStream({
                appStreamId: data.appstreamid,
                memberAppId: data.memberappid,
                title: 'Application',
                type: 'APP_DEFAULT'
            });
        })
        // Install free apps, open app directory for paid apps.
        .on('click', '._apps ._noApps ._freeApp', function () {
            // /ajax/appdirectory/install?appId=1101
            window.appdirectory.installApp($(this).data('appid'));
        })
        .on('click', '._apps ._noApps ._paidApp', function () {
            window.loadAppDirectory('app-details', 'appId=' + $(this).data('appid'));
        })
        .on('click', '._addSn ', function () {
            var type = $(this).data('type') || $(this).attr('type');
            snActions.add({
                selectedSocialNetwork: type
            });
        })
        .on('mouseenter', '.btn-select', function () {
            if (darklaunch.isFeatureEnabled('PGR_694_STEAMS_BUTTONS_HOVER_STATE')) {
                if ($(this).data('popoverCopy')) {
                    trackerDataLab.trackCustom($(this).data('trackingOrigin'), 'streams_user_hovers_add_stream_button',
                        { 'buttonClickEvent': $(this).data('trackingAction') }
                    );

                    $streamButtonPopover.html($(this).data('popoverCopy'));

                    var topOffset = $(this).offset().top - $streamButtonPopover.outerHeight() - 4;
                    var clampedTopOffset = Math.max(topOffset, $box.offset().top);

                    var leftOffset = $(this).offset().left;
                    var clampedLeftOffset = Math.min(
                        leftOffset,
                        $box.offset().left + $box.outerWidth() - $streamButtonPopover.outerWidth()
                    );

                    $streamButtonPopover.offset({
                        top: clampedTopOffset,
                        left: clampedLeftOffset,
                    });
                    $streamButtonPopover.addClass('visible');
                }
            }
        })
        .on('mouseleave', '.btn-select', function () {
            if (darklaunch.isFeatureEnabled('PGR_694_STEAMS_BUTTONS_HOVER_STATE')) {
                $streamButtonPopover.removeClass('visible');
            }
        });
    if (!darklaunch.isFeatureEnabled('NGE_17040_REACT_ADD_STREAM')) {
        $box
            .find('._minimize').click(function () {
                stream.streamHelper.toggle(true);
            }).end()

    }
    $box
        .on('mousedown', '._shared ._sharedList ._sharedRow ._remove', function (_e) {
            $(this).parents('._controls').addClass('onRemove');
        })
        .on('mouseup mouseout mouseover', '._shared ._sharedList ._sharedRow ._remove', function (_e) {
            $(this).parents('._controls').removeClass('onRemove');
        })
        .on('click', '._shared ._sharedList ._sharedRow ._remove', function (e) {
            e.stopPropagation();
            var confirmMessage = translation._("Are you sure you want to delete this Shared stream from this list? (This will not remove any existing streams from any dashboards)");
            var userConfirm = window.confirm(confirmMessage);
            if (userConfirm) {
                var $sharedRow = $(this).closest('._sharedRow');
                stream.saveBox.removeTeamSharedStream($sharedRow.data('teamstreamid'));
            }
        });

    $overlay
        .find('._close').bind('click', function () {
            stream.streamHelper.toggleOptionsOverlay();
        }).end()
        .find('._section').delegate('._terms', 'keyup', function (e) {
            var $section = $(this).closest('._section');
            if (e.which == 13) {
                $section.find('._add').click();
            }
        }).end();

    if (!hs.memberIsInOrganization) {
        // hide shared tab
        $box.find('._tab[data-tab="shared"]').hide();
    }

    if (!(hs && hs.entryPoints && hs.entryPoints.canAccessAppDirectory)) {
        // User is not allowed to see App Directory, do not show the "Apps" tab
        $box.find('._tab[data-tab="apps"]').hide();
    }

    if (opts.hidden) {
        stream.streamHelper.toggle(true, true);
    }
};

stream.streamHelper.addStream = function (opts, isShared) {
    //box[socialNetworkId]
    //box[tabId]
    //box[type]
    //box[terms]
    var postData = ['newAddStream=1'],		// post data to send to controller, start with the source of the stream creation
        tabId = $("#streamTabInfo input[name='id']").val(),
        networkType = $('#boxAddStream ._snSelector').hsDropdown('selectedElement').type,
        selectedSnId = opts.snId;

    if (!selectedSnId) {
        var selectedSn = $('#boxAddStream ._snSelector').hsDropdown('selectedElement');
        if (!selectedSn && opts.type !== 'APP_DEFAULT' && !isShared) {
            return;
        }
        selectedSnId = selectedSn.id;
    }

    if (!tabId) {
        hs.statusObj.update(translation._("You can only add new Stream to a Tab with columns."), 'warning', true);
        return;
    }

    const maybeNetworkType = networkType ? networkType.toLowerCase() : null
    // FE tracking for add stream
    var trackingDetails = {
        source: opts.source ? opts.source : 'ADD_A_STREAM_PANE',
        socialNetworkType: maybeNetworkType,
        socialNetworkId: selectedSnId,
        streamType: opts.type,
    };
    if (opts.type === 'APP_DEFAULT') {
        trackingDetails.socialNetworkType = 'hsapps';
        trackingDetails.appStreamId = opts.appStreamId;
        trackingDetails.memberAppId = opts.memberAppId;
    }
    trackerDataLab.trackCustom('web.dashboard.streams', 'stream_user_clicked_add_stream', trackingDetails);

    if (opts.source) {
        opts = _.omit(opts, 'source'); // source property is for Interana tracking purpose
    }

    if (!isShared) {
        var o = $.extend({
            tabId: tabId,
            socialNetworkId: selectedSnId
        }, opts);

        if (o.type === 'APP_DEFAULT') {
            o.socialNetworkId = null;
        }

        $.each(o, function (key, val) {
            postData.push(encodeURIComponent('box[' + key + ']') + '=' + encodeURIComponent(val));
        });
        stream.saveBox.saveBoxSubmit(postData.join('&'));
        stream.streamHelper.toggleOptionsOverlay();
    } else {
        // @TODO: figure out how to pass newAddStream tracking
        stream.saveBox.addTeamSharedBox(opts, tabId);
    }
};

stream.streamHelper.toggleOptionsOverlay = function (boxType, isShow) {
    var $box = $('#boxAddStream'),
        $overlay = $box.find('._optionsOverlay');

    if (!isShow) {
        $overlay.hide();
        return;
    }

    // reset display state
    $overlay.show().find('input[type="text"]').val('');
    $overlay.find('._section').hide();
    $overlay.find('.controls').show();

    switch (boxType) {
        default:
            break;
    }
    hootbus.emit(hsEvents.STREAM_OPTIONS_OVERLAY_TOGGLED, {'boxType': boxType, bShow: isShow});
};

stream.streamHelper.toggle = function (isForceHide, isNoAnimation) {
    var $box = $('#boxAddStream'),
        isHide = isForceHide || $box.is(':visible'),
        fnSaveState = function () {
            ajaxCall({
                url: '/ajax/stream/save-stream-helper-state',
                data: {on: !isHide}
            }, 'qm');
        };

    $box.show();

    if (isHide) {
        /**
         *  If the add stream pane is visible with the DL on, we want to change the behaviour to scroll to the
         *  pane (not close it) but we don't want to prevent this function from force closing/minimizing the pane
         */
        if (isForceHide || (!($box.is(':visible')))) {

            const targetId = '#newAddStreamButton';

            // TODO: move to function
            var $transferBox = $("<div class='streamHelperTransition'></div>"),
              $target = $(targetId),
              boxWidth = $box.outerWidth(),
              boxHeight = $box.outerHeight(),
              boxX = $box.offset().left,
              boxY = $box.offset().top,
              targetWidth = $target.outerWidth(),
              targetHeight = $target.outerHeight(),
              targetX = $target.offset().left,
              targetY = $target.offset().top;

            $transferBox.css({
                height: boxHeight,
                width: boxWidth,
                top: boxY,
                left: boxX
            });

            $transferBox.appendTo('body');
            $box.hide();

            $transferBox.animate({
                height: targetHeight,
                width: targetWidth,
                top: targetY,
                left: targetX,
                opacity: 0.3
            }, isNoAnimation ? 0 : 400, function () {
                $(this).remove();
            });
        }
    }

    window.resizeColumns();

    // With the addition of the right side navigation bar, we want to scroll to the add stream pane if it's unminimized but not in scroll view
    if (!isHide || ($box.is(':visible'))) {
        // re-showing the stream, scroll to the right most
        // need to wait for resizeColumns first
        _.defer(function () {
            $('#streamsContainer')[0].scrollLeft = $('#streamsScroll').outerWidth();
        });
    }

    const evt = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window
        });
    const addStreamPaneSelector = document.getElementById('addStreamPaneProfileSelector');
    if (addStreamPaneSelector) {
        addStreamPaneSelector.dispatchEvent(evt);
    }

    fnSaveState();
};

window.stream = stream;

export default stream;
