import $ from 'jquery';
import _ from 'underscore';
import { logInfo } from 'fe-lib-logging';
import hootbus from 'utils/hootbus';
import util from 'utils/util';
import schedulerUtil from 'publisher/scheduler/util';
import messagesActions from 'publisher/scheduler/messages-actions';
import schedulerRejected from 'publisher/scheduler/rejected';
import renderYouTubeDeleteModal from '../../../src/components/publisher/render-youtube-delete-modal';
import snActions from 'apps/social-network/actions';
import darklaunch from 'utils/darklaunch';
import hsEvents from 'hs-events';
import renderMessagePreviewModal from '../../../src/components/publisher/render-message-preview-modal';
import renderUnscheduledMessagesBanner from '../../../src/components/publisher/render-unscheduled-messages-banner';
import renderInlineRedirectNotification from '../../../src/components/publisher/render-inline-redirect-notification';
import renderMessageBulkDeleteModal from '../../../src/components/publisher/render-message-bulk-delete-modal';
import PublisherConstants from 'components/publisher/constants';
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise';
import NetworksConf from 'utils/networks-conf';
import translation from 'utils/translation';
import trackerDatalab from 'utils/tracker-datalab';
import AbortionError from 'hs-nest/lib/error/abortion-error';
import messageTemplate from 'publisher/message_template';
import { renderComposer } from '../components/composer-handlers';
import { renderDeprecationBanner } from './deprecation-banner';

import { CUSTOM_APPROVALS } from 'fe-lib-entitlements';
import { hasEntitlement } from 'fe-pnc-data-entitlements';

import 'publisher/scheduler/message-list';
import 'publisher/scheduler/unscheduled-approval';
import 'publisher/scheduler/stream';
import 'publisher/scheduler/collapsible-section';
import 'message_box';

window.scheduler = window.scheduler || {};

hs.SOCIALNETWORKLIMIT = false;

/**
 * find out which message search function to call
 */
var fnApplyFilter = async function () {

    var $filter = $("#schedulerSection ._filter"),
        subSec = $filter.find("input._subSec").val();

    var promiseArray = [];
    var hasCollapsibleSec = false;

    const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

    if (schedulerUtil.isInListView()) {
        if (hasCustomApprovals) {
            if (subSec === "pendingapproval" || subSec === "approvequeue" || subSec === "rejected" || subSec === "scheduled" || subSec === "expired") {
                promiseArray.push(schedulerUtil.getMessagePromise(schedulerUtil.collectSearchQueryForCombinedMessages(undefined, scheduler.messageList.numMessagesToLoad), schedulerUtil.getLoadUrl()));
            } else {
                scheduler.messageList.loadMessages(undefined, undefined, undefined, undefined, scheduler.messageList.insert, true);
            }
        } else {
            scheduler.messageList.loadMessages(undefined, undefined, undefined, undefined, scheduler.messageList.insert, false);
        }
    }

    //check whether to load unscheduled approval msg or not
    switch (subSec) {
        case 'expired':
        case 'rejected':
        case 'scheduled':
        case 'approvequeue':
        case 'optimizer':
        case 'pendingapproval':
            // Entitlement is adding the expired case to this switch statement, this whole 'if' can be removed when dl is
            if (hasCustomApprovals && subSec === 'expired') {
                break;
            }

            if (hasCustomApprovals) {
                if (subSec === 'approvequeue' || subSec === 'pendingapproval' || subSec === 'rejected' || subSec === 'expired') {
                    if (_.keys(hs.socialNetworks).length) {
                        hasCollapsibleSec = true;
                        promiseArray.push(schedulerUtil.getMessagePromise(schedulerUtil.collectSearchQueryForCombinedMessages(), scheduler.collapsibleSection.getAjaxLoadUrl(PublisherConstants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES)));
                        promiseArray.push(schedulerUtil.getMessagePromise(schedulerUtil.collectSearchQueryForCombinedMessages(null, null, subSec), scheduler.collapsibleSection.getAjaxLoadUrl(PublisherConstants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES)));
                        if (subSec === PublisherConstants.APPROVALS.TYPE.EXPIRED) {
                            promiseArray.push(schedulerUtil.getMessagePromise(schedulerUtil.collectSearchQueryForCombinedMessages(null, null, subSec), scheduler.collapsibleSection.getAjaxLoadUrl(PublisherConstants.COLLAPSIBLE_LIST_TYPES.FAILED_MESSAGES)));
                        }
                    }
                } else {
                    scheduler.unscheduledApproval.load();
                }
            } else if (subSec === 'rejected') {
                schedulerRejected.load();
            } else {
                scheduler.unscheduledApproval.load();
            }
            break;
        default:
            break;
    }

    if (hasCustomApprovals) {
        hs.statusObj.update(translation.c.LOADING, 'info');
        scheduler.messageList.loadingUIHelper(0);
        Promise.all(promiseArray).then(async function (data) {
            var scheduledMessageData = data[0];
            var unscheduledMessageData = data[1];
            var commentsRepliesData = data[2];
            var failedMessageData;
            if (subSec === PublisherConstants.APPROVALS.TYPE.EXPIRED) {
                failedMessageData = data[3];
            }
            var unscheduledMessage;

            const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

            scheduler.messageList.onLoadSuccess(schedulerUtil.convertTimestampsToUserTime(scheduledMessageData), hasCustomApprovals);

            if ($('#schedulerSection ._loadMore img:visible').length) {
                scheduler.messageList.triggerInfiniteLoad();
            }

            if (hasCollapsibleSec) {
                if (unscheduledMessageData) {
                    if (subSec === 'rejected') {
                        unscheduledMessage = translation._("You have %s1unscheduled%s2 rejected message(s). %s1View messages%s2.");
                    } else {
                        unscheduledMessage = translation._("You have %s1unscheduled%s2 unapproved messages(s). %s1View messages%s2.");
                    }

                    await scheduler.collapsibleSection.onLoadSuccess(
                        unscheduledMessageData,
                        PublisherConstants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES,
                        translation._('Unscheduled'),
                        unscheduledMessage,
                        PublisherConstants.COLLAPSIBLE_LIST_TYPE_TO_CLASS[PublisherConstants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES]
                    );
                }

                if (commentsRepliesData) {
                    await scheduler.collapsibleSection.onLoadSuccess(
                        commentsRepliesData,
                        PublisherConstants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES,
                        translation._('Comments and Replies'),
                        translation._('You have comments and replies waiting for approval. %s1View comments and replies%s2.'),
                        PublisherConstants.COLLAPSIBLE_LIST_TYPE_TO_CLASS[PublisherConstants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES]
                    );
                }

                if (failedMessageData) {
                    await scheduler.collapsibleSection.onLoadSuccess(
                        failedMessageData,
                        PublisherConstants.COLLAPSIBLE_LIST_TYPES.FAILED_MESSAGES,
                        translation._('Failed Messages'),
                        translation._('You have approved messages that failed to send or schedule. %s1View messages%s2'),
                        PublisherConstants.COLLAPSIBLE_LIST_TYPE_TO_CLASS[PublisherConstants.COLLAPSIBLE_LIST_TYPES.FAILED_MESSAGES]
                    );
                }
            }

            scheduler.messageList.postLoadUIHelper(0, scheduledMessageData, hasCustomApprovals);
            hs.statusObj.reset();
        }).catch(function (err) {
            var isAborted = AbortionError.isAbortionError(err);
            if (err && err.message) {
                try {
                    var error = JSON.parse(err.message);
                    if (error && error.statusText && error.statusText === "abort") {
                        isAborted = true;
                    }
                } catch (e) {
                    // we only care about trying to parse the error for abort if its not we'll just let the error handler below log it
                }
            }

            if (!isAborted) {
                hs.statusObj.update(translation._("There was an error loading these messages. Please try again later."), "error", true);
                // Caught errors should be logged to the console instead of silently failing
                if (typeof console !== 'undefined') {
                    logInfo(
                        'scheduler.fnApplyFilter',
                        'error loading messages in scheduler',
                        {
                            error: err
                        }
                    );
                }
            }
        });
    }

    window.updateDashboardHeight();
};


var fnInitFilter = function () {
    var $filter = $("#schedulerSection ._filter");

    $filter.find("._viewType ._viewBtn").click(function () {
        var $target = $(this);
        if ($target.hasClass("active")) {
            return;
        }

        var view = "_list";
        const calendarDeprecationContainer = $('.calendarDeprecationContainer') // TODO: Remove with https://hootsuite.atlassian.net/browse/PUB-26015

        if ($target.is('._month')) {
            view = '_month';
            trackerDatalab.trackCustom(
                'web.dashboard.publisher.calendar_view',
                'toggle_month_view',
                {
                    section: schedulerUtil.getSubSection(),
                },
            );
            // TODO: Remove with https://hootsuite.atlassian.net/browse/PUB-26015
            if (hs.isFeatureEnabled('PUB_25906_LEGACY_CALENDAR_DEPRECATION_BANNER')) {
                calendarDeprecationContainer.removeClass('u-displayNone');
            }
        }
        else if ($target.is('._week')) {
            view = '_week';
            if (hs.isFeatureEnabled('PUB_26031_LEGACY_DAY_WEEK_AND_LIST_VIEW_TRACKING')) {
                trackerDatalab.trackCustom(
                    'web.dashboard.publisher.calendar_view',
                    'toggle_week_view',
                    {
                        section: schedulerUtil.getSubSection(),
                    },
                );
            }
            // TODO: Remove with https://hootsuite.atlassian.net/browse/PUB-26015
            if (hs.isFeatureEnabled('PUB_25906_LEGACY_CALENDAR_DEPRECATION_BANNER')) {
                calendarDeprecationContainer.removeClass('u-displayNone');
            }
        }
        else if ($target.is('._day')) {
            view = '_day';
            if (hs.isFeatureEnabled('PUB_26031_LEGACY_DAY_WEEK_AND_LIST_VIEW_TRACKING')) {
                trackerDatalab.trackCustom(
                    'web.dashboard.publisher.calendar_view',
                    'toggle_day_view',
                    {
                        section: schedulerUtil.getSubSection(),
                    },
                );
            }
            // TODO: Remove with https://hootsuite.atlassian.net/browse/PUB-26015
            if (hs.isFeatureEnabled('PUB_25906_LEGACY_CALENDAR_DEPRECATION_BANNER')) {
                calendarDeprecationContainer.removeClass('u-displayNone');
            }
        }
        else {
            if (hs.isFeatureEnabled('PUB_26031_LEGACY_DAY_WEEK_AND_LIST_VIEW_TRACKING')) {
                trackerDatalab.trackCustom(
                    'web.dashboard.publisher.calendar_view',
                    'toggle_list_view',
                    {
                        section: schedulerUtil.getSubSection(),
                    },
                );
            }
            // TODO: Remove with https://hootsuite.atlassian.net/browse/PUB-26015
            if (hs.isFeatureEnabled('PUB_25906_LEGACY_CALENDAR_DEPRECATION_BANNER')) {
                calendarDeprecationContainer.addClass('u-displayNone');
            }
        }

        fnActivateViewType(view);
        fnApplyFilter();
    });

    // collect IDs of first 50 postable SNs for pre-selection

    var order = hs.socialNetworkTypeProfileSelectorOrder,
        fnSortByName = function (a, b) {
            var compareA = (a.username + '').toLowerCase(),
                compareB = (b.username + '').toLowerCase(); // force string for names incase of null

            return (compareA < compareB) ? -1 : (compareA > compareB) ? 1 : 0;
        },
        buffer = [];

    $.each(order, function () {
        var sns = _.values(hs.socialNetworksKeyedByType[this]),
            postableSns = sns;

        if (this == 'INSTAGRAM') { // skip Instagram, it is not postable
            var snsids = _.keys(hs.socialNetworksKeyedByType[this]);
            $.each(snsids, function () {
                if ($.inArray(this.toString(), hs.pinnedSns) >= 0) {
                    hs.pinnedSns.splice(hs.pinnedSns.indexOf(this.toString()), 1);
                }
            });
            return true;
        }
        postableSns = [];
        _.each(sns, function (sn) {
            if (sn.permissions && (sn.permissions['SN_POST_WITH_APPROVAL'] || sn.permissions['SN_POST']) && !(hs.prefs.restrictedLogin && sn.ownerType == "MEMBER")) {
                postableSns.push(sn);
            }
        });

        postableSns.sort(fnSortByName);
        buffer.push(postableSns);
    });
    var preSelectedSns = _.flatten(buffer);
    var preSelectedSnIds = $.map(preSelectedSns, function (sn) {
        return sn.socialNetworkId;
    });

    // LIMIT NUMBER OF SOCIAL NETWORKS TO DISPLAY BY DEFAULT
    var publisher_limit = 200;

    // DARK LAUNCH TO REDUCE THE NUMBER OF NETWORKS TO 1 INSTEAD OF 200
    if (hs.isFeatureEnabled('PUBLISHER_SN_LIMIT')) {
        publisher_limit = 1;
    }

    if (preSelectedSnIds.length > publisher_limit) {
        hs.SOCIALNETWORKLIMIT = true;
        preSelectedSnIds = preSelectedSnIds.slice(0, publisher_limit);
    } else {
        hs.SOCIALNETWORKLIMIT = false;
    }

    //init profile selector
    var ps;

    // store and re-load the user's selection
    var snIdKey = 'tempPublisherFilterSnIds';
    var snIds = $.cookie.read(snIdKey);
    if (typeof snIds === 'string') {
        snIds = $.parseJSON(snIds);
    } else {
        snIds = null;
    }

    var networksToFilter = NetworksConf.getExcludedNetworkTypesForComponent('SCHEDULER', 'COMMON');

    // use the messagebox profile selector here
    // the messagebox PS has filterPostable:true by default
    ps = new hs.messageboxProfileSelector($filter.find('._profileSelectorWidget'), {
        isNoPin: true,
        filterOverride: networksToFilter
    }, snIds);

    // on change of the selection, store it in a cookie to be retrieved when switching sections
    ps.bind('change', function (selected) {
        $.cookie.create(snIdKey, JSON.stringify(selected));
    });

    ps.bind('collapsechange', function () {
        fnApplyFilter();
    });

    $filter.find("select._tm").change(function () {
        fnApplyFilter();
    });

    $filter.find("._refresh").click(function () {
        fnApplyFilter();
    });

    //init filter reset button
    $filter.find("._resetFilter").click(function () {
        ps.clearSelected();
        $filter.find("select option._default").attr("selected", "selected");
        fnApplyFilter();
    });

    // start the timer
    scheduler.showClock(function () {
        fnClearOldMessagesFromView();
    }, 1);

};
/**
 * Do necessary stuff to activate a view type (list/calendar)
 */
var fnActivateViewType = async function (view, callback) {
    view = view ? view : '_list';
    if (view.charAt(0) != '_') {
        view = '_' + view;
    }
    var $scheduler = $('#schedulerSection'),
        $filter = $scheduler.find("._filter"),
        $content = $scheduler.find('._content'),
        $activeView = $filter.find("._viewType ._viewBtn." + view),
        $loadMoreBtn = $scheduler.find("._loadMore");
    var parent;
    var subSec;

    const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

    $activeView.siblings("._viewBtn").removeClass("active");
    $activeView.addClass('active');

    if ($activeView.is("._list")) {
        $('.selectMessagesHeader').show();

        if (hasCustomApprovals) {
            parent = document.getElementsByClassName('_inlineRedirectNotification');
            subSec = schedulerUtil.getSubSection();

            if (subSec !== 'scheduled') {
                $scheduler.find('._unscheduledApprovalSec').prependTo($content);
                $scheduler.find('._commentsRepliesSec').prependTo($content);

                if (subSec === PublisherConstants.APPROVALS.TYPE.EXPIRED) {
                    $scheduler.find('._failedMessagesSec').prependTo($content);

                    if (!$('._failedMessagesSec').length) {
                        $content.prepend('<div class="_failedMessagesSec _headerTop collapsibleSection _collapsibleSection" data-type="' + PublisherConstants.COLLAPSIBLE_LIST_TYPES.FAILED_MESSAGES + '"></div>');
                    }

                    if (!$('._commentsRepliesSec').length) {
                        var commentsRepliesHtml = '<div class="_commentsRepliesSec _headerTop collapsibleSection _collapsibleSection" data-type="' + PublisherConstants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES + '"></div>';

                        if ($('._failedMessagesSec').length) {
                            $(commentsRepliesHtml).insertAfter('._failedMessagesSec');
                        } else {
                            $content.prepend(commentsRepliesHtml);
                        }
                    }

                    if (!$('._unscheduledApprovalSec').length) {
                        $content.append('<div class="_unscheduledApprovalSec _headerTop collapsibleSection _collapsibleSection" data-type="' + PublisherConstants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES + '"></div>');
                    }

                } else {
                    if (!$('._commentsRepliesSec').length) {
                        $content.prepend('<div class="_commentsRepliesSec _headerTop collapsibleSection _collapsibleSection" data-type="' + PublisherConstants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES + '"></div>');
                    }

                    if (!$('._unscheduledApprovalSec').length) {
                        if ($('._commentsRepliesSec').length) {
                            $content.append('<div class="_unscheduledApprovalSec _headerTop collapsibleSection _collapsibleSection" data-type="' + PublisherConstants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES + '"></div>');
                        } else {
                            $content.prepend('<div class="_unscheduledApprovalSec _headerTop collapsibleSection _collapsibleSection" data-type="' + PublisherConstants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES + '"></div>');
                        }
                    }
                }

                if (parent.length) {
                    scheduler.unloadUnscheduledMessagesBanner(parent[0]);
                    scheduler.setHeight();
                }
            } else {
                $scheduler.find('._unscheduledApprovalSec').remove();
            }
        } else {
            //for list view, wrap unscheduled and scheduled view into a single div and apply content-scroll
            $scheduler.find("._unscheduledApprovalSec").prependTo($content);
        }

        $('#schedulerCalendar').remove();
        $content.append('<div class="_messageListView"></div>'); //create a container for message list
        $loadMoreBtn.appendTo($content); //move load more section inside content view
        $content.removeClass('fc');
        $content.addClass('content-scroll content-list');
        scheduler.setHeight();
    }

    $.isFunction(callback) && callback();
};
var fnHasUnscheduledApprovalView = function () {
    return $("#schedulerSection ._unscheduledApprovalSec ._itemList").length > 0;
};
var fnIsInStreamsView = function () {
    return !!$('#streamsContainer:visible').length;
};
var fnShowSchedulerClock = function (callback, callbackIntervalMinutes) {
    // set clock
    var interval,
        callbackIntervalCounter = 0,
        $target = $('#publisherSidebar ._clock'),
        fnReset = function () {
            if (interval) {
                clearInterval(interval);
            }
            callbackIntervalCounter = 0;
        },
        fnGo = function () {
            if (!$target.length) {
                fnReset();
                return;
            }
            var hoursFromGmt = (hs.timezoneOffset / 3600),
                plusMinus = hoursFromGmt >= 0 ? '+' : '-',
                html = '<div>' + hs.util.userDate().format('mmm d, h:MM tt') + '</div><div class="zone" title="' + hs.timezoneName + '">(GMT' + plusMinus + Math.abs(hoursFromGmt) + ') ' + hs.timezoneName + '</div>';

            $target.html(html);

            if ($.isFunction(callback) && callbackIntervalMinutes > 0 && ((callbackIntervalCounter / 2) % callbackIntervalMinutes === 0)) {
                callback();
                callbackIntervalCounter = 0;
            }
            callbackIntervalCounter++;
        };

    fnReset();
    interval = setInterval(fnGo, 30 * 1000);		// 30 seconds, that's why our callback interval counter needs to be divided by 2
    fnGo();
};
var fnClearOldMessagesFromView = function () {
    var subSec = schedulerUtil.getSubSection();
    // don't clear old messaged for the pastscheduled and the rejected messages
    if (!subSec || subSec == 'pastscheduled' || subSec == 'rejected') {
        return;
    }

    var now = hs.util.userDate();

    $('#schedulerSection ._messageListView ._itemWrapper').each2(function (i, $el) {
        // Don't remove old unapproved scheduled messages
        if ($el.find('._message').length > 0 && +now >= +hs.util.userDateHootsuiteTime($el.attr('ts'))) {
            $el.remove();
        }
    });
};

/**
 * scheduled, approvalqueu, optimizer and pastscheduled are actually Sub sections inside scheduler,
 * although they appear to be top level section under Pubisher on the side bar
 */
scheduler.load = function (section, params) {
    params = params || {};
    ajaxCall({
        type: 'GET',
        url: "/ajax/scheduler/home?subSec=" + section,
        beforeSend: function () {
            hs.statusObj.update(translation.c.LOADING, 'info');
        },
        success: function (data) {

            var $publisherSectionContent = $("#publisherSection").find("._content");

            $publisherSectionContent.html(data.output);

            $publisherSectionContent.find('._showFeatureAccessDeniedCalendar').bind('click', function () {
                dashboard.showFeatureAccessDeniedPopup({
                    reason: 'CALENDAR_VIEW_ADVANCED',
                    isOwner: 1
                });
                return false;
            });
            $publisherSectionContent.find('._loadMoreBtn').bind('click', async function () {
                var $this = $(this);

                const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

                // throttle the infinite scroll load
                if ($this.data('disabled')) {
                    return false;       // still loading
                }
                $this.data('disabled', true);   // set to true to denote that we're loading more already
                var fnCallback = function () {
                    $this.data('disabled', false);  // reset flag in callback
                };

                if (hasCustomApprovals) {
                    var subSec = $('#schedulerSection ._filter ._subSec').val();

                    if (subSec === "pendingapproval" || subSec === "approvequeue" || subSec === "rejected" || subSec === "scheduled" || subSec === "expired") {
                        scheduler.messageList.loadCombinedMessages(scheduler.messageList.nextTs, scheduler.messageList.numMessagesToLoad, fnCallback, true);
                    } else {
                        scheduler.messageList.loadMessages($this.attr('regularfromts'), $this.attr('approvalfromts'), $this.attr('creatednextts'), fnCallback, scheduler.messageList.insert, true);
                    }
                } else {
                    scheduler.messageList.loadMessages($this.attr('regularfromts'), $this.attr('approvalfromts'), $this.attr('creatednextts'), fnCallback, scheduler.messageList.insert, false);
                }

                return false;
            });

            $publisherSectionContent.find('._addSocialNetworkPopupBtn').bind('click', function () {
                snActions.add();
                return false;
            });

            $publisherSectionContent.delegate('._composeMessageBtn', 'click', function () {
                window.newActionTweet(null, null, null, null, null, (+new Date() / 1000) + 600, true);
                return false;
            });

            scheduler.initLive();
            fnInitFilter();
            fnActivateViewType(data.viewType);
            fnApplyFilter();

            if (darklaunch.isFeatureEnabledOrBeta('PUB_31275_LEGACY_PUBLISHER_VIEWS_DEPRECATION_BANNER')) {
                renderDeprecationBanner(section);
            }

            window.updateDashboardHeight();
            publisher.highlightSidebarBtn(section);

            // if a specific rejected message or group is specified in params, open the popup on load
            if (section === 'rejected' && params['id'] && params['isPreScreen']) {
                if (_.isString(params['snIds'])) {
                    params['snIds'] = params['snIds'].split(",");
                }
                if (!_.isArray(params['snIds'])) {
                    params['snIds'] = [];
                }
                scheduler.editMessagePopup({
                    isApproval: false,
                    isGroupMode: parseInt(params['isGroupMode'], 10),
                    isPreScreen: params['isPreScreen'],
                    messageId: params['id'],
                    snIds: params['snIds'],
                });
            }

            hootbus.emit(hsEvents.PUBLISHER_SCHEDULED_MESSAGES_OPENED);

            hootbus.on('full_screen_composer:response:message_success', function () {
                fnApplyFilter();
            });
        },
        complete: function () {
            hs.statusObj.reset();
            $.isFunction(params.callback) && params.callback();
        },
        abort: function () {
            hs.statusObj.reset();
        }
    }, 'q1');
};

scheduler.switchView = function (view, callback) {
    fnActivateViewType(view, callback);
};

/**
 * Function to retrieve selectedMessageIds from scheduler
 *
 * @param {function(Element, Number)} callback - An optional callback that is called
 *    for every scheduler message DOM Element that is in a selected state. Passes in
 *    the DOMElement and index in the current iteration.
 * @return {Object[]} - Returns either an array of selectedMessageId strings, or an
 *    whatever is returned from the callback function.
 */
scheduler.getSelectedMessageIds = function (callback) {
    var selectedMessageIds = [];
    var messageElements = $('.singleMessageCb:checked, .messageInGroupCb:checked');

    if (!callback) {
        messageElements.each(function (id, elem) {
            selectedMessageIds.push($(elem).attr('value'));
        });
    } else {
        selectedMessageIds = $.makeArray(messageElements).map(callback);
    }
    return selectedMessageIds;
};

/**
 * Function to check if currently selected messages contain YouTube events
 * @return {boolean}
 */
scheduler.selectedMessagesContainYoutube = function () {
    var selectedMessagesAreYouTube = [];

    $('.singleMessageCb:checked, .messageInGroupCb:checked').each(function () {
        selectedMessagesAreYouTube.push($(this).hasClass('_youtube'));
    });

    return _.contains(selectedMessagesAreYouTube, true);
};

/**
 * Function to check if currently selected messages are all YouTube
 * @return {boolean}
 */
scheduler.allSelectedMessagesAreYoutube = function () {
    var selectedMessagesAreYouTube = [];

    $('.singleMessageCb:checked, .messageInGroupCb:checked').each(function () {
        selectedMessagesAreYouTube.push($(this).hasClass('_youtube'));
    });

    var checkIfYouTube = function (val) {
        return val === true;
    };

    return selectedMessagesAreYouTube.every(checkIfYouTube);
};

/**
 * Function to count number of messages that are YouTube
 * @return {number}
 */
scheduler.getNumberOfYoutubeMessages = function () {
    var videoCount = 0;

    $('.singleMessageCb:checked, .messageInGroupCb:checked').each(function () {
        if ($(this).hasClass('_youtube')) {
            videoCount++;
        }
    });

    return videoCount;
};

/**
 * Get an array of msgIdsAndSeqNums based on some passed in message ids
 * @param messageIds
 * @returns {Array}
 */
scheduler.getMsgIdsAndSeqNumsFromIds = function (messageIds) {

    // Get sequence numbers for messages
    var msgIdsAndSeqNums = [];

    for (var i = 0; i < messageIds.length; i++) {

        var $sequenceNumElem = $('[name="sequenceNumber_' + messageIds[i] + '"]');

        msgIdsAndSeqNums.push({
            id: messageIds[i],
            sequenceNumber: $sequenceNumElem.size() ? $sequenceNumElem.val() : -1
        });
    }

    return msgIdsAndSeqNums;
};

scheduler.initLive = function () {
    var fnCollectSnIdsFromGroup = function (wrapper) {
        var snIds = [], $wrapper = $(wrapper);
        $wrapper.find("._itemDetail ._groupMessage").each(function () {
            snIds.push($(this).attr('snid'));
        });
        return snIds;
    };

    if (!$('._messageCb:not(#selectAllMessagesCb):checked').length) {
        messagesActions.disableOptions();
    }

    $('#selectAllMessagesCb').click(function () {
        $('._messageCb').prop("checked", $(this).prop("checked"));
        if (!$('._messageCb:not(#selectAllMessagesCb):checked').length) {
            messagesActions.disableOptions();
        } else {
            messagesActions.enableOptions();
        }
    });

    $('#deleteMessagesBtn, ._deleteMessagesBtn').click(async function () {
        if (!$(this).hasClass('disabled')) {
            var selectedMessageIds = scheduler.getSelectedMessageIds();

            if (selectedMessageIds.length) {
                if (scheduler.selectedMessagesContainYoutube()) {
                    var $message;
                    var videoData;

                    const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

                    if (hasCustomApprovals) {
                        // Get sequence numbers for messages
                        var msgIdsAndSeqNums = scheduler.getMsgIdsAndSeqNumsFromIds(selectedMessageIds);

                        if (selectedMessageIds.length === 1) {
                            // Single video- display video data in confirmation modal
                            $message = scheduler.stream.getMessageById(selectedMessageIds[0]);
                            videoData = $message.data();
                            renderYouTubeDeleteModal(msgIdsAndSeqNums, videoData.videoId, videoData.socialNetworkId, videoData.sendTime, 'SINGLE', 1, scheduler.removeMessagesFromView);
                        } else {
                            if (scheduler.allSelectedMessagesAreYoutube()) {
                                renderYouTubeDeleteModal(msgIdsAndSeqNums, null, null, null, 'MULTIPLE', selectedMessageIds.length, scheduler.removeMessagesFromView);
                            } else {
                                renderYouTubeDeleteModal(msgIdsAndSeqNums, null, null, null, 'MIXED', scheduler.getNumberOfYoutubeMessages(), scheduler.removeMessagesFromView);
                            }
                        }
                        return;

                    } else {

                        if (selectedMessageIds.length === 1) {
                            // Single video- display video data in confirmation modal
                            $message = scheduler.stream.getMessageById(selectedMessageIds[0]);
                            videoData = $message.data();
                            renderYouTubeDeleteModal(selectedMessageIds, videoData.videoId, videoData.socialNetworkId, videoData.sendTime, 'SINGLE', 1, scheduler.removeMessagesFromView);
                        } else {
                            if (scheduler.allSelectedMessagesAreYoutube()) {
                                renderYouTubeDeleteModal(selectedMessageIds, null, null, null, 'MULTIPLE', selectedMessageIds.length, scheduler.removeMessagesFromView);
                            } else {
                                renderYouTubeDeleteModal(selectedMessageIds, null, null, null, 'MIXED', scheduler.getNumberOfYoutubeMessages(), scheduler.removeMessagesFromView);
                            }
                        }
                        return;
                    }
                }
                scheduler.deleteMessages(selectedMessageIds);
            } else {
                hs.statusObj.update(translation._("Please select at least one message"), "warning", true, 2000);
            }
        }
    });

    $('._messagesActionBtn').hsDropdown({
        data: {
            items: [
                {
                    title: 'Export to CSV (mm/dd/yyyy)',
                    id: 'export-csv-mdy'
                },
                {
                    title: 'Export to CSV (dd/mm/yyyy)',
                    id: 'export-csv-dmy'
                },
                {
                    title: 'Export to Google CSV (mm/dd/yyyy)',
                    id: 'google-calendar-csv-mdy'
                },
                {
                    title: 'Export to Google CSV (dd/mm/yyyy)',
                    id: 'google-calendar-csv-dmy'
                }
            ]
        },
        mute: true,
        resetOnSelect: true,
        change: function (element) {
            var actionType = element.id;

            var selectedMessageIdsFilter = function (elem) {
                if ($(elem).siblings('.badge').text() === translation._('Unapproved')) {
                    // if Unapproved message: flag it so the csv not include it
                    return 'APPROVAL_MESSAGE';
                } else {
                    return $(elem).attr('value');
                }
            };
            var selectedMessageIds = scheduler.getSelectedMessageIds(selectedMessageIdsFilter);
            switch (actionType) {
                case "export-csv-mdy":
                case "export-csv-dmy":
                case "google-calendar-csv-mdy":
                case "google-calendar-csv-dmy":
                    if (selectedMessageIds.length) {
                        scheduler.exportMessagesToCsv(selectedMessageIds, actionType);
                    } else {
                        hs.statusObj.update(translation._("Please select at least one message"), "warning", true, 2000);
                    }
                    break;
                default:
                    break;
            }
        }
    });

    $('#schedulerSection').delegate('._previewImages', 'click', function () {
        var $parent = $(this).parent();
        var imgArray = $parent.data('images').split(",");
        var data = {
            imgArray: imgArray,
            displayImg: 0
        };
        ajaxPromise({
            method: "POST",
            url: "/ajax/scheduler/batch-sign-urls",
            json: {
                urls: imgArray,
                expiry: 60
            }
        }, 'qm', true, false).then(function (response) {
            if (response) {
                data.imgArray = response.urls;
                hootbus.emit('message:renderLightbox', data);
            }
        });
        return false;
    });

    $('#schedulerSection').delegate('._previewVideo', 'click', async function (e) {
        e.stopPropagation()

        var $parent = $(this).parent();
        var videoLink = $parent.data('videolink');
        var messageId = $parent.data('message-id');
        var messageType = $parent.data('message-type');
        var socialNetworkType = $parent.data('social-network-type');
        var videoSubtitlesUrl = $parent.data('videosubtitlesurl');
        var videoSubtitlesLang = $parent.data('videosubtitleslang');

        const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

        if (hasCustomApprovals) {
            if (videoLink.indexOf('youtube.com/embed') > -1) {
                dashboard.showYoutubeVideoPopup(videoLink);
            } else {
                var requests = [schedulerUtil.getSignedVideoUrls(messageId, messageType, videoLink)]
                if (videoSubtitlesUrl !== undefined) {
                    requests.push(schedulerUtil.getSignedUrl(videoSubtitlesUrl))
                }
                Promise.all(requests)
                    .then(function (data) {
                        var message = data[0];
                        var signedUrl = data[1] ? data[1].url : undefined;
                        if (message != null && message.signedVideoUrl != null && message.signedThumbnailUrl != null) {
                            dashboard.showVideoPopup(message.signedVideoUrl, message.signedThumbnailUrl, null, signedUrl, videoSubtitlesLang, socialNetworkType);
                        }
                    })
                    .catch(function () {
                        var errorText = translation._('Error getting signed video url');
                        hs.statusObj.update(errorText, "error", true);
                    })
            }
        } else {
            $.ajax({
                url: '/ajax/scheduler/get-signed-video-urls?id=' + messageId + '&type=' + messageType + '&objectKey=' + videoLink,
                type: 'GET',
                error: function () {
                    var errorText = translation._('Error getting signed video url');
                    hs.statusObj.update(errorText, "error", true);
                },
                success: function (data) {
                    if (data != null && data.signedVideoUrl != null && data.signedThumbnailUrl != null) {
                        dashboard.showVideoPopup(data.signedVideoUrl, data.signedThumbnailUrl);
                    }
                }
            });
        }

        return false;
    });

    $('#schedulerSection').delegate('._playMessageVideo', 'click', function () {
        var $button = $(this);
        var messageType = 'normal';

        var videoLink = $button.data('videolink');
        var messageId = $button.closest('._message').attr("mid");
        if (!messageId) {
            messageId = $button.closest('._groupedMessages').find('._groupMessage').first().attr('mid');
        }
        if (!messageId) {
            messageType = 'approval';
            messageId = $button.closest('._approval').attr("mid");
        }
        if (!messageId) {
            messageType = 'approval';
            messageId = $button.closest('._unscheduledApproval').attr("mid");
        }
        $.ajax({
            url: '/ajax/scheduler/get-signed-video-urls?id=' + messageId + '&type=' + messageType + '&objectKey=' + videoLink,
            type: 'GET',
            error: function () {
                var errorText = translation._('Error getting signed video url');
                hs.statusObj.update(errorText, "error", true);
            },
            success: function (data) {
                if (data != null && data.signedVideoUrl != null && data.signedThumbnailUrl != null) {
                    dashboard.showVideoPopup(data.signedVideoUrl, data.signedThumbnailUrl);
                }
            }
        });
        return false;
    });

    $('#schedulerSection ._itemWrapper').die('click').live('click', async function (e) {
        var $target = $(e.target),
            targetHref = $target.attr('href'),
            targetHasRealHref = ((targetHref !== undefined) && (targetHref !== location.protocol + '//' + location.host + location.pathname + '#' && targetHref !== '#')),
            $wrapper = $target.closest("._itemWrapper"),
            messageType = $('#schedulerSection ._filter ._subSec').val(),
            isLegacy = true,
            isUnscheduled = false;

        var id, isGroupMode, snIds, isApproval, isPreScreen, infoPreScreen, groupHash, sendDate, isLocked;

        if (targetHasRealHref || $target.is('._userInfoPopup')) {
            return;  // do nothing, and allow click to propagate
        }

        const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

        if (hasCustomApprovals) {
            if ($target.closest('._customApprovalActions').length > 0) {
                return false;
            }
        }

        if ($target.is('._noAction')) {
            return false;
        } else if ($target.is('._messageCb')) {
            if ($target.is('.groupCb')) {
                $('._messageCb[group="' + $target.attr('group') + '"]').prop("checked", $target.prop("checked"));
            } else if ($target.is('.messageInGroupCb')) {
                groupHash = $target.attr('group');
                var allMessagesInGroupChecked = !$('.messageInGroupCb[group="' + groupHash + '"]:checkbox:not(:checked)').length;
                $('.groupCb[group="' + groupHash + '"]').prop("checked", allMessagesInGroupChecked);
            }

            var allMessagesChecked = !$('._messageCb:not(#selectAllMessagesCb):checkbox:not(:checked)').length;
            $('#selectAllMessagesCb').prop("checked", allMessagesChecked);

            if (!$('._messageCb:not(#selectAllMessagesCb):checked').length) {
                messagesActions.disableOptions();
            } else {
                messagesActions.enableOptions();
            }
            return true;
        } else if ($target.is('._edit')) {
            id = null;
            isGroupMode = false;
            snIds = null;
            isApproval = false;
            isPreScreen = false;

            if ($target.closest("._messageInGroup").length == 1) {
                id = $target.closest("._messageInGroup").attr('mid');
            }
            else if ($wrapper.is("._message")) {
                id = $wrapper.attr('mid');
            }
            else if ($wrapper.is("._groupedMessages")) {
                id = $wrapper.find("._itemDetail ._messageInGroup").first().attr("mid");
                isGroupMode = true;
                snIds = fnCollectSnIdsFromGroup($wrapper);
            }
            else if ($target.closest("._approvalInGroup").length == 1) {
                isApproval = true;
                id = $target.closest("._approvalInGroup").attr('mid');
            }
            else if ($wrapper.is("._approval")) {
                isApproval = true;
                id = $wrapper.attr('mid');
            }
            else if ($wrapper.is("._groupedApproval")) {
                id = $wrapper.find("._itemDetail ._approvalInGroup").first().attr("mid");
                isApproval = true;
                isGroupMode = true;
                snIds = fnCollectSnIdsFromGroup($wrapper);
            }
            else if ($target.closest("._unScheduledApprovalInGroup").length == 1) {
                isApproval = true;
                id = $target.closest("._unScheduledApprovalInGroup").attr('mid');
            }
            else if ($wrapper.is("._unscheduledApproval")) {
                isApproval = true;
                id = $wrapper.attr('mid');
            }
            else if ($wrapper.is("._groupedUnscheduledApproval")) {
                id = $wrapper.find("._itemDetail ._unScheduledApprovalInGroup").first().attr("mid");
                isApproval = true;
                isGroupMode = true;
                snIds = fnCollectSnIdsFromGroup($wrapper);
            }
            else if ($wrapper.is("._preScreen")) {
                isPreScreen = true;
                infoPreScreen = schedulerRejected.extractInfoFromDom($wrapper, $target);
                isGroupMode = infoPreScreen.isGroupMode;
                id = infoPreScreen.id;
                snIds = infoPreScreen.snIds;
            }
            else {
                return false;
            }

            if (hasCustomApprovals) {
                if ($wrapper.attr('islegacy') === 'false') {
                    isLegacy = false;
                }

                scheduler.editMessagePopup({
                    contentLibraryId: null,
                    isApproval,
                    isGroupMode,
                    isLegacy,
                    isPreScreen,
                    isTemplate: null,
                    messageId: id,
                    messageListId: null,
                    snIds,
                });
            } else {
                scheduler.editMessagePopup({
                    isApproval,
                    isGroupMode,
                    isPreScreen,
                    isTemplate: null, //null here is for template which is in content library
                    messageId: id,
                    snIds,
                });
            }
        } else if ($target.is('._showFeatureAccessDeniedCalendar')) {

            dashboard.showFeatureAccessDeniedPopup({
                reason: 'CALENDAR_VIEW_ADVANCED',
                isOwner: 1
            });

            util.recordAction('viewInCalendarPayWall');

            return false;
        } else if ($target.is('._delete')) {
            id = null;
            isGroupMode = false;
            snIds = null;
            isApproval = false;
            isPreScreen = false;

            if ($target.hasClass('_youtube')) {
                var messageVideoData = $wrapper.data();
                var videoMessageId = $wrapper.attr('mid');
                renderYouTubeDeleteModal([videoMessageId], messageVideoData.videoId, messageVideoData.socialNetworkId, messageVideoData.sendTime, 'SINGLE', 1, scheduler.removeMessagesFromView);
                return;
            }

            if ($target.closest("._messageInGroup").length == 1) {
                id = $target.closest("._messageInGroup").attr('mid');
            }
            else if ($wrapper.is("._message")) {
                id = $wrapper.attr('mid');
            }
            else if ($wrapper.is("._groupedMessages")) {
                id = $wrapper.find("._itemDetail ._messageInGroup").first().attr("mid");
                isGroupMode = true;
                snIds = fnCollectSnIdsFromGroup($wrapper);
            }
            else if ($target.closest("._approvalInGroup").length == 1) {
                isApproval = true;
                id = $target.closest("._approvalInGroup").attr('mid');
            }
            else if ($wrapper.is("._approval")) {
                isApproval = true;
                id = $wrapper.attr('mid');
            }
            else if ($wrapper.is("._groupedApproval")) {
                isApproval = true;
                isGroupMode = true;
                id = $wrapper.find("._itemDetail ._approvalInGroup").first().attr("mid");
                snIds = fnCollectSnIdsFromGroup($wrapper);
            }
            else if ($target.closest("._unScheduledApprovalInGroup").length == 1) {
                isApproval = true;
                id = $target.closest("._unScheduledApprovalInGroup").attr('mid');
            }
            else if ($wrapper.is("._unscheduledApproval")) {
                isApproval = true;
                id = $wrapper.attr('mid');
            }
            else if ($wrapper.is("._groupedUnscheduledApproval")) {
                isApproval = true;
                isGroupMode = true;
                id = $wrapper.find("._itemDetail ._unScheduledApprovalInGroup").first().attr("mid");
                snIds = fnCollectSnIdsFromGroup($wrapper);
            }
            else if ($wrapper.is("._preScreen")) {
                infoPreScreen = schedulerRejected.extractInfoFromDom($wrapper, $target);
                isGroupMode = infoPreScreen.isGroupMode;
                id = infoPreScreen.id;
                snIds = infoPreScreen.snIds;
                isPreScreen = true;
            } else {
                return false;
            }

            if (isApproval) {
                scheduler.deleteApprovalMessage(id, isGroupMode, snIds);
            } else {
                scheduler.deleteMessage(id, isGroupMode, snIds, isPreScreen);
            }
        }
        else if ($target.is('._approve')) {
            id = null;
            isGroupMode = false;
            snIds = null;

            if ($target.closest("._approvalInGroup").length === 1) {
                id = $target.closest("._approvalInGroup").attr('mid');
            }
            else if ($wrapper.is("._approval")) {
                id = $wrapper.attr('mid');
            }
            else if ($wrapper.is("._groupedApproval")) {
                id = $wrapper.find("._itemDetail ._approvalInGroup").first().attr("mid");
                isGroupMode = true;
                snIds = fnCollectSnIdsFromGroup($wrapper);
            }
            else if ($target.closest("._unScheduledApprovalInGroup").length === 1) {
                id = $target.closest("._unScheduledApprovalInGroup").attr('mid');
            }
            else if ($wrapper.is("._unscheduledApproval")) {
                id = $wrapper.attr('mid');
            }
            else if ($wrapper.is("._groupedUnscheduledApproval")) {
                id = $wrapper.find("._itemDetail ._unScheduledApprovalInGroup").first().attr("mid");
                isGroupMode = true;
                snIds = fnCollectSnIdsFromGroup($wrapper);
            }
            else {
                return false;
            }

            scheduler.approveMessage(id, isGroupMode, snIds);
        }
        else if ($wrapper.is('._customApprovalActions')) {
            return false;
        }
        else if ($target.is('._exndColps') || $target.closest('._exndColps').length) {
            var $groupedMessages;
            id = $wrapper.attr('mid');

            isPreScreen = false;

            if (messageType === 'scheduled') {
                $groupedMessages = $target.closest('._groupedMessages');

                // Approval messages also show up in the Scheduled view
                if ($target.closest('._groupedApproval').length || $target.closest('._approval').length) {
                    messageType = 'approvequeue';
                    sendDate = $wrapper.attr('ts');
                }
            } else if (messageType === 'approvequeue' || messageType === 'pendingapproval' || messageType === 'expired') {
                $groupedMessages = $target.closest('._groupedUnscheduledApproval');
                sendDate = $wrapper.attr('ts');

                // If it's not an unscheduled grouped message
                // then it must be a scheduled grouped message
                if ($groupedMessages.length === 0) {
                    $groupedMessages = $target.closest('._groupedApproval');
                }
            } else if (messageType === 'pastscheduled') {
                $groupedMessages = $target.closest('._groupedUnscheduledApproval');
            }

            // extracts the gh if exists, else will not be a numeric value
            groupHash = $wrapper.attr('id').replace(/^.*gh_/g, 'gh_');
            if (/^gh_\d+$/.test(groupHash)) {
                id = $target.closest('._itemWrapper').find('._itemDetail ._groupMessage').first().attr('mid');
            } else {
                groupHash = false;
            }

            if ($wrapper.is('._preScreen') || $wrapper.attr('isprescreen') === 'true') {
                isPreScreen = true;
            }

            if ($wrapper.attr('islegacy') === 'false') {
                isLegacy = false;
            }

            if ($wrapper.attr('isLocked') === 'true') {
                isLocked = true;
            }

            if ($wrapper.hasClass('_groupedUnscheduledApproval') ||
                $wrapper.hasClass('_unscheduledApproval') ||
                $wrapper.hasClass('_unScheduledApprovalInGroup')) {
                isUnscheduled = true;
            }

            isApproval = $wrapper.hasClass('_approval') ||
                $wrapper.hasClass('_groupedApproval') ||
                $wrapper.hasClass('_groupedUnscheduledApproval') ||
                $wrapper.hasClass('_unscheduledApproval') ||
                $wrapper.hasClass('_unScheduledApprovalInGroup');

            scheduler.messagePreviewModalPopup($wrapper, id, groupHash, messageType, isPreScreen, isUnscheduled, sendDate ? parseInt(sendDate) : 0, dashboard.showVideoPopup, dashboard.showYoutubeVideoPopup, hs.timezoneOffset, 'list', isLegacy, isApproval, isLocked);

        }
        else if ($target.closest('._messageInGroup').length) {
            if (hasCustomApprovals) {
                id = $target.closest('._messageInGroup').attr('mid');

                if ($wrapper.is('._preScreen')) {
                    isPreScreen = true;
                }

                if ($wrapper.attr('islegacy') === 'false') {
                    isLegacy = false;
                }

                if ($wrapper.hasClass('_groupedUnscheduledApproval') ||
                    $wrapper.hasClass('_unscheduledApproval') ||
                    $wrapper.hasClass('_unScheduledApprovalInGroup')) {
                    isUnscheduled = true;
                }

                scheduler.messagePreviewModalPopup($wrapper, id, null, messageType, isPreScreen, isUnscheduled, null, dashboard.showVideoPopup, dashboard.showYoutubeVideoPopup, hs.timezoneOffset, 'list', isLegacy, false);
            } else {
                if (parseInt($target.closest('._messageInGroup').attr('canedit'), 10) === 1) {
                    id = $target.closest('._messageInGroup').attr('mid');
                    scheduler.editMessagePopup({ messageId: id });
                }
            }
        }
        else if ($target.closest('._approvalInGroup').length) {
            id = $target.closest('._approvalInGroup').attr('mid');

            if (hasCustomApprovals) {
                if ($wrapper.is('._preScreen') || $wrapper.attr('isprescreen') === 'true') {
                    isPreScreen = true;
                }

                // Approval messages also show up in the Scheduled view,
                // so we need to change the message type to approvequeue
                if (messageType === 'scheduled') {
                    messageType = 'approvequeue';
                }

                if ($wrapper.attr('islegacy') === 'false') {
                    isLegacy = false;
                }

                if ($wrapper.hasClass('_groupedUnscheduledApproval') ||
                    $wrapper.hasClass('_unscheduledApproval') ||
                    $wrapper.hasClass('_unScheduledApprovalInGroup')) {
                    isUnscheduled = true;
                }

                scheduler.messagePreviewModalPopup($wrapper, id, null, messageType, isPreScreen, isUnscheduled, null, dashboard.showVideoPopup, dashboard.showYoutubeVideoPopup, hs.timezoneOffset, 'list', isLegacy, true);
            } else {
                scheduler.editMessagePopup({
                    isApproval: true,
                    isGroupMode: false,
                    messageId: id,
                    snIds: null,
                });
            }
        }
        else if ($target.closest('._unScheduledApprovalInGroup').length) {
            id = $target.closest('._unScheduledApprovalInGroup').attr('mid');

            if (hasCustomApprovals) {
                if ($wrapper.is('._preScreen') || $wrapper.attr('isprescreen') === 'true') {
                    isPreScreen = true;
                }

                if ($wrapper.attr('islegacy') === 'false') {
                    isLegacy = false;
                }

                scheduler.messagePreviewModalPopup($wrapper, id, null, messageType, isPreScreen, isUnscheduled, null, dashboard.showVideoPopup, dashboard.showYoutubeVideoPopup, hs.timezoneOffset, 'list', isLegacy, true);
            } else {
                scheduler.editMessagePopup({
                    isApproval: true,
                    isGroupMode: false,
                    messageId: id,
                    snIds: null,
                });
            }
        }

        return false;
    });

    $('#schedulerSection').delegate('._expandGroupedMessage, ._networkGroup', 'click', function (e) {
        e.stopPropagation();

        var $this = $(this);
        $this.toggleClass('arrowRight arrowDown');

        $this.closest('._itemWrapper').find('._itemDetail').stop(true, true).slideToggle({
            step: async function () {
                const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)
                if (hasCustomApprovals) {
                    scheduler.collapsibleSection.resize(PublisherConstants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES);
                } else {
                    scheduler.unscheduledApproval.resize();
                }
            }
        }).end().toggleClass('expanded');
    });
};

scheduler.messagePreviewModalPopup = function (element, messageId, groupHash, messageType, isPreScreen, isUnscheduled, sendDate, showVideoPopupFunc, showYoutubeVideoPopupFunc, timezoneOffset, view, isLegacy, isApproval, isLocked) {
    element.find('.itemInfo').addClass('active');

    _.defer(function () {
        if (groupHash) {
            renderMessagePreviewModal.asGroupedMessage(element, groupHash, parseInt(messageId), messageType, isPreScreen, isUnscheduled, sendDate, showVideoPopupFunc, showYoutubeVideoPopupFunc, timezoneOffset, view, isLegacy, isApproval);
        } else {
            renderMessagePreviewModal.asSingleMessage(element, parseInt(messageId), messageType, isPreScreen, isUnscheduled, showVideoPopupFunc, showYoutubeVideoPopupFunc, timezoneOffset, view, isLegacy, isApproval, isLocked);
        }
    });
};

scheduler.editMessagePopup = function ({
                                           /* eslint-disable no-unused-vars */
                                           asset,
                                           contentLibraryId,
                                           isApproval,
                                           isExpired,
                                           isGroupMode,
                                           isLegacy,
                                           isLocked,
                                           isNewDraft,
                                           isPreScreen,
                                           isReply,
                                           isTemplate,
                                           messageId,
                                           messageListId,
                                           messageType,
                                           org,
                                           snIds,
                                           privacy,
                                           /* eslint-enable no-unused-vars */
                                       }) {
    hs.statusObj.update(translation.c.LOADING, 'info');

    if (isNewDraft) {
        var callBack = function () { return; };
        renderComposer({ callBack: callBack, draftId: messageId });
        return;
    }

    // asset is a backbone model instance
    if (isTemplate && asset.contentType !== "MESSAGE") {
        var assetsMessageData = asset.get("messageContent") || {};
        var orgId;
        var isEdit;
        orgId = asset.get("orgId") || null;
        isEdit = true;
        if (typeof assetsMessageData.messageTags === 'string') {
            // It's a string sometimes because reasons
            assetsMessageData.messageTags = JSON.parse(assetsMessageData.messageTags || "[]");
        }
        // edit template

        renderComposer({
            templateId: messageId, // actually the asset id
            templateData: Object.assign({}, {
                messageText: assetsMessageData.template || "",
                snIds: snIds,
                snText: assetsMessageData.snText || {},
                snMentions: assetsMessageData.snMentions || {},
                snAttachments: assetsMessageData.snAttachments || {},
                snLinkSettings: assetsMessageData.snLinkSettings || {},
                snLinkSettingsPresetId: assetsMessageData.snLinkSettingsPresetId || {},
                attachments: assetsMessageData.attachments || undefined,
                tagIds: assetsMessageData.messageTags || [],
                targeting: assetsMessageData.targeting || {},
                albumName: assetsMessageData.albumName,
                albumType: assetsMessageData.albumType,
                locations: assetsMessageData.locations || {},
                organizationId: orgId,
                isEdit: isEdit,
                isLocked: isLocked,
                publishingMode: assetsMessageData.publishingMode || undefined,
                postType: assetsMessageData.postType || undefined,
                privacy: assetsMessageData.privacy || undefined,
                publisherNotes: assetsMessageData.publisherNotes || undefined,
                linkSettings: assetsMessageData.linkSettings || undefined,
                linkSettingsPresetId: assetsMessageData.linkSettingsPresetId || undefined,
            }),
            isEdit: isEdit,
            onSaveTemplate: function (templateData) {
                return new Promise(function (resolve, reject) {
                    var onSuccess = function (updatedAssetData) {
                        hs.statusObj.update(translation._("Template updated successfully!"), 'info', true);

                        // Allow pre-approvals to respond to the success or failure
                        if (darklaunch.isFeatureEnabled("PUB_10313_ENABLE_CONTENT_LIBRARY_PREAPPROVE")) {
                            if (asset) {
                                hootbus.emit('contentLib:templateAsset:updateDisp', asset);
                            }
                        }

                        // If it was successful, emit the edit event, which will refresh content library
                        updatedAssetData.messageData.messageId = asset.get("assetId");
                        updatedAssetData.messageData._id = asset.get("assetId");
                        hootbus.emit('message:edit', updatedAssetData);
                        resolve(updatedAssetData);
                    };
                    var onError = function (e) {
                        hs.statusObj.update(translation._("An error occurred updating your template. Please try again."), 'error', true);

                        // Allow pre-approvals to respond to the success or failure
                        if (darklaunch.isFeatureEnabled("PUB_10313_ENABLE_CONTENT_LIBRARY_PREAPPROVE")) {
                            if (asset) {
                                hootbus.emit('contentLib:templateAsset:updateDisp', asset);
                            }
                        }

                        reject(e);
                    };

                    var removeUndefinedOrNullAttachmentData = function (arr) {
                        // New Compose adds some extra data to attachments- e.g. height, width.
                        // This removes any null or undefined values to avoid issues when saving the template
                        arr.forEach(function (obj) {
                            Object.keys(obj).forEach(function (k) {
                                if (obj[k] === undefined || obj[k] === null) {
                                    delete obj[k];
                                }
                            });
                        });
                        return arr;
                    };

                    if (templateData.message && templateData.message.attachments && templateData.message.attachments.length) {
                        removeUndefinedOrNullAttachmentData(templateData.message.attachments);
                    }

                    messageTemplate.editTemplate(templateData, asset, onSuccess, onError);
                });
            },
        });
    } else {
        renderComposer({ messageId: messageId, org: org, isEdit: true });
    }
};

hootbus.on('calendar.viewDisplay', fnApplyFilter);

scheduler.onErrors = function (errors) {
    _.each(errors, function (error) {
        hs.statusObj.update(error, 'error', true);
    });
};

/**
 * for user approving message directly instead of going through edit message box to approve
 */
scheduler.approveMessage = function (approvalId, isGroupMode, snIds) {
    isGroupMode = isGroupMode ? 1 : 0;

    ajaxCall({
        url: "/ajax/scheduler/approve-message",
        data: 'approvalId=' + approvalId + '&isGroupMode=' + isGroupMode + '&snIds=' + snIds,
        success: function (data) {
            //process rest of response
            if (data.success == 1) {

                //once a msg gets approved/edited, always remove it from the view first. it will be added back to the view later on depends on some conditions, see below
                scheduler.remove({
                    isApproval: true,
                    isGroupMode: data.isGroupMode,
                    messageId: approvalId,
                });

                //then insert modified scheduled messages back to the view (approved or edited)
                if (data.scheduledMessages && scheduler.isInsertPermitted(data.scheduledSendDate)) {
                    scheduler.insert(data.scheduledMessages);
                }

                if (data.unscheduledApprovalMessages && fnHasUnscheduledApprovalView()) {
                    scheduler.unscheduledApproval.insert(data.unscheduledApprovalMessages);
                }

                hs.statusObj.update(data.successMsg, "success", true);
            } else if (data.statusType) {
                hs.statusObj.update(data.statusMsg, data.statusType, true);
            }
            return false;
        },
        complete: function () { /*hs.throbberMgrObj.remove("._submitAddMessage");*/
        }
    }, 'q1NoAbort');

    return false;
};

scheduler.deleteMessage = function (messageId, isGroupMode, snIds, isPreScreen) {

    isGroupMode = isGroupMode ? 1 : 0;

    if (isGroupMode) {
        if (!confirm(translation._("Are you sure you want to delete all messages in this group?"))) {
            return;
        }
    }
    else {
        if (!confirm(translation._("Are you sure you want to delete this message?"))) {
            return;
        }
    }


    var postData = "id=" + messageId + "&isGroupMode=" + isGroupMode;
    if (isGroupMode) {
        postData += '&snIds=' + snIds.join();
    }

    var ajaxUrl = "/ajax/scheduler/delete-message";
    if (isPreScreen) {
        ajaxUrl = "/ajax/scheduler/delete-pre-screen-message";
    }

    ajaxCall({
        url: ajaxUrl,
        data: postData,
        beforeSend: function () {
            hs.statusObj.update(translation._("Deleting..."), 'info');
        },
        success: function (data) {
            if (data.statusMsg !== undefined) {
                hs.statusObj.update(data.statusMsg, data.statusType, true);

                // Remove the scheduled event from the view
                if (data.scheduledYouTubeEventDeleted) {
                    scheduler.remove({
                        isApproval: false,
                        isGroupMode,
                        isPartial: false,
                        isPreScreen,
                        messageId,
                    });
                }
            } else {
                if (data.partialDelete) {
                    $.each(data.deletedIds, function (i, e) {
                        scheduler.remove({
                            isApproval: false,
                            isGroupMode: false,
                            isPartial: true,
                            isPreScreen,
                            messageId: e,
                        });
                    });
                }
                else {
                    scheduler.remove({
                        isApproval: false,
                        isGroupMode,
                        isPartial: false,
                        isPreScreen,
                        messageId,
                    });
                }
                hs.statusObj.update(translation._("Message deleted"), 'success', true);
                hootbus.emit('message:delete', data.deletedIds);
            }
        },
        complete: function () {
        },
        abort: function () {
            hs.statusObj.reset();
        }
    }, 'q1NoAbort');
    return false;
};

scheduler.removeMessagesFromView = function (partialDelete, deletedIds) {
    if (partialDelete) {
        $.each(deletedIds, function (i, e) {
            scheduler.remove({
                isApproval: false,
                isGroupMode: false,
                isPartial: true,
                messageId: e,
            });
        });
    }
    else {
        $.each(deletedIds, function (i, e) {
            scheduler.remove({
                isApproval: false,
                isGroupMode: false,
                messageId: e,
            });
        });
    }
};

scheduler.deleteMessages = async function (messageIds) {
    const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)
    if (hasCustomApprovals) {
        var messageIdsThatCannotBeRemoved = [];
        $.each(messageIds, function (index, messageId) {
            var $item = scheduler.stream.getItemById(messageId);
            var isCanApprove = $item.attr('canapprove') === 'true';
            var canDelete = $item.attr('candelete') === 'true';

            if (isCanApprove && !canDelete) {
                messageIdsThatCannotBeRemoved.push(messageId);
            }
        });

        messageIds = _.difference(messageIds, messageIdsThatCannotBeRemoved);

        // Get sequence numbers for messages
        var msgIdsAndSeqNums = [];

        for (var i = 0; i < messageIds.length; i++) {

            var $sequenceNumElem = $('[name="sequenceNumber_' + messageIds[i] + '"]');

            msgIdsAndSeqNums.push({
                id: messageIds[i],
                sequenceNumber: $sequenceNumElem.size() ? $sequenceNumElem.val() : -1
            });
        }

        var dialogType = PublisherConstants.BULK_MESSAGE_DELETE_DIALOG_TYPE.SIMPLE_DELETE;

        if (messageIds.length === 0) {
            dialogType = PublisherConstants.BULK_MESSAGE_DELETE_DIALOG_TYPE.CANNOT_DELETE;
        }

        else if (messageIdsThatCannotBeRemoved.length > 0) {
            dialogType = PublisherConstants.BULK_MESSAGE_DELETE_DIALOG_TYPE.APPROVAL_WARNING;
        }

        var deleteClickedCallback = function () {

            var postData = {
                msgIdsAndSeqNums: msgIdsAndSeqNums
            };

            ajaxCall({
                url: "/ajax/scheduler/bulk-delete-messages",
                data: postData,
                beforeSend: function () {
                    hs.statusObj.update(translation._("Deleting..."), 'info');
                },
                success: function (data) {
                    if (data.statusMsg !== undefined) {
                        hs.statusObj.update(data.statusMsg, data.statusType, true);

                        if (data.deletedIds) {
                            scheduler.removeMessagesFromView(data.partialDelete, data.deletedIds);
                        }
                    } else {
                        if (data.partialDelete) {
                            $.each(data.deletedIds, function (i, e) {
                                scheduler.remove({
                                    isApproval: false,
                                    isGroupMode: false,
                                    isPartial: true,
                                    messageId: e,
                                });
                            });
                        }
                        else {
                            $.each(data.deletedIds, function (i, e) {
                                scheduler.remove({
                                    isApproval: false,
                                    isGroupMode: false,
                                    messageId: e,
                                });
                            });
                        }
                        hs.statusObj.update(translation._("Selected messages deleted"), 'success', true);
                        hootbus.emit('message:delete', data.deletedIds);

                        // Uncheck the bulk delete message checkbox if the bulk delete is successful
                        $('._headerTop ._messageCb').prop('checked', false);
                    }

                    if (hasCustomApprovals) {
                        scheduler.collapsibleSection.resizeAll();
                    } else {
                        scheduler.unscheduledApproval.resize();
                    }

                    if (hasCustomApprovals) {
                        $('#selectAllMessagesCb').prop('checked', false);
                        messagesActions.disableOptions();
                    }
                },
                complete: function () {
                    if (dialogType === PublisherConstants.BULK_MESSAGE_DELETE_DIALOG_TYPE.APPROVAL_WARNING) {
                        renderMessageBulkDeleteModal(PublisherConstants.BULK_MESSAGE_DELETE_DIALOG_TYPE.SOME_MESSAGES_COULD_NOT_BE_DELETED);
                    }
                },
                abort: function () {
                    hs.statusObj.reset();
                }
            }, 'q1NoAbort');
            return false;
        };

        renderMessageBulkDeleteModal(dialogType, deleteClickedCallback);

    } else {
        if (!confirm(translation._("Are you sure you want to delete all selected messages?"))) {
            return;
        }

        var postData = "messageIds=" + messageIds.join();

        ajaxCall({
            url: "/ajax/scheduler/bulk-delete-messages",
            data: postData,
            beforeSend: function () {
                hs.statusObj.update(translation._("Deleting..."), 'info');
            },
            success: function (data) {
                if (data.statusMsg !== undefined) {
                    hs.statusObj.update(data.statusMsg, data.statusType, true);

                    if (data.deletedIds) {
                        scheduler.removeMessagesFromView(data.partialDelete, data.deletedIds);
                    }
                } else {
                    if (data.partialDelete) {
                        $.each(data.deletedIds, function (i, e) {
                            scheduler.remove({
                                isApproval: false,
                                isGroupMode: false,
                                isPartial: true,
                                messageId: e,
                            });
                        });
                    }
                    else {
                        $.each(data.deletedIds, function (i, e) {
                            scheduler.remove({
                                isApproval: false,
                                isGroupMode: false,
                                messageId: e,
                            });
                        });
                    }
                    hs.statusObj.update(translation._("Selected messages deleted"), 'success', true);
                    hootbus.emit('message:delete', data.deletedIds);
                }
            },
            complete: function () {
            },
            abort: function () {
                hs.statusObj.reset();
            }
        }, 'q1NoAbort');
        return false;
    }
};

scheduler.deleteApprovalMessage = async function (approvalId, isGroupMode, snIds) {

    isGroupMode = isGroupMode ? 1 : 0;

    if (isGroupMode) {
        if (!confirm(translation._("Are you sure you want to delete all messages in this group?"))) {
            return;
        }
    }
    else {
        if (!confirm(translation._("Are you sure you want to delete this message?"))) {
            return;
        }
    }

    var postData = "id=" + approvalId + "&isGroupMode=" + isGroupMode;

    const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

    if (isGroupMode) {
        postData += '&snIds=' + snIds.join();

        if (hasCustomApprovals) {
            //find all approval message ids from supplied approval id
            var messageIds = [];
            $("#schedulerSection div[id$='approval_" + approvalId + "']").parent().children().each(function (i) {
                messageIds[i] = $(this).attr("mid");
            });
            if (messageIds.length > 0) {
                postData += '&messageIds=' + messageIds.join();
            }
        }
    } else {
        if (hasCustomApprovals) {
            postData += '&messageIds=' + approvalId;
        }
    }

    ajaxCall({
        url: "/ajax/scheduler/delete-approval",
        data: postData,
        beforeSend: function () {
            hs.statusObj.update(translation._("Deleting..."), 'info');
        },
        success: function (data) {
            if (data.isScheduled) {
                if (data.partialDelete) {
                    $.each(data.deletedIds, function (i, e) {
                        scheduler.remove({
                            isApproval: true,
                            isGroupMode: false,
                            isPartial: true,
                            messageId: e,
                        });
                    });
                }
                else {
                    scheduler.remove({
                        isApproval: true,
                        isGroupMode,
                        messageId: approvalId,
                    });
                }
            }
            else {
                if (data.partialDelete) {
                    $.each(data.deletedIds, function (i, e) {
                        if (hasCustomApprovals) {
                            scheduler.collapsibleSection.remove(e, false);
                        } else {
                            scheduler.unscheduledApproval.remove(e, false);
                        }
                    });
                }
                else {
                    if (hasCustomApprovals) {
                        scheduler.collapsibleSection.remove(approvalId, isGroupMode);
                    } else {
                        scheduler.unscheduledApproval.remove(approvalId, isGroupMode);
                    }
                }
            }
            hs.statusObj.update(translation._("Message deleted"), 'success', true);
        },
        complete: function () {
        },
        abort: function () {
            hs.statusObj.reset();
        }
    }, 'q1NoAbort');
    return false;
};

scheduler.exportMessagesToCsv = function (selectedMessageIds, csvType) {
    function post_to_url(path, params, method) {
        method = method || "post"; // Set method to post by default, if not specified.

        var form = document.createElement("form");
        form.setAttribute("method", method);
        form.setAttribute("action", path);

        for (var key in params) {
            if (Object.prototype.hasOwnProperty.call(params, key)) {
                var hiddenField = document.createElement("input");
                hiddenField.setAttribute("type", "hidden");
                hiddenField.setAttribute("name", key);
                hiddenField.setAttribute("value", params[key]);

                form.appendChild(hiddenField);
            }
        }

        document.body.appendChild(form);
        $(form).submit();
    }

    if (selectedMessageIds.length) {
        var paramsData = [];
        paramsData['messageIds'] = selectedMessageIds.join();
        if (csvType) {
            paramsData['csvType'] = csvType;
        }
        // Pass the controller the difference between local and UTC time so that it can make the CSV file in local time
        var now = new Date(),
            offset = now.getTimezoneOffset();
        paramsData['timezoneOffset'] = offset; // difference between local and UTC time, in minutes
        post_to_url('/publisher/scheduler/export-messages-csv', paramsData);
    }
    return false;
};

scheduler.loadUnscheduledMessagesBanner = async function (messages, isRefresh) {
    const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)
    if (hasCustomApprovals) {
        var subSec = schedulerUtil.getSubSection();
        const hasMessages = (messages.grouped && messages.grouped.length > 0) || (messages.nonGrouped && messages.nonGrouped.length > 0);

        if (subSec === 'scheduled' || (schedulerUtil.isInCalendarView() && (subSec === 'approvequeue' || subSec === 'pendingapproval' || subSec === 'rejected'))) {
            // Other views still use the expandable unscheduled messages list,
            // so for now we just hide it on the Schedule view.
            $('._unscheduledApprovalSec, ._commentsRepliesSec, ._failedMessagesSec').hide();

            if (!$('._unscheduledMessagesBanner').length && hasMessages) {
                $('._filter._headerTop').after('<div class="unscheduledMessagesBanner _unscheduledMessagesBanner _headerTop"></div>');
            }

            renderUnscheduledMessagesBanner.render(messages, isRefresh);
        }
    }
};

scheduler.unloadUnscheduledMessagesBanner = function (component) {
    renderUnscheduledMessagesBanner.unload(component);
};

scheduler.loadInlineRedirectNotification = function (data) {
    var subSec = schedulerUtil.getSubSection();
    var hasData = (data.grouped && data.grouped.length > 0) || (data.nonGrouped && data.nonGrouped.length > 0);
    var isCommentOrReply = hasData && data.nonGrouped[0] && (data.nonGrouped[0].type === 'MESSAGE' || data.nonGrouped[0].type === 'COMMENT');

    if (subSec === 'scheduled' || (schedulerUtil.isInCalendarView() && (subSec === 'approvequeue' || subSec === 'pendingapproval' || subSec === 'rejected' || isCommentOrReply))) {
        // Other views still use the expandable unscheduled messages list,
        // so for now we just hide it on the Schedule view. For comments and replies
        // we hide it in the calendar view for require my approval and pending
        // approval list view.
        $('._unscheduledApprovalSec, ._commentsRepliesSec, ._failedMessagesSec').hide();

        if (hasData) {
            var className = isCommentOrReply ? '_commentsRepliesNotification' : '_unscheduledMessagesNotification';

            if (!$('.' + className).length && hasData) {
                $('._filter._headerTop').after('<div class="inlineRedirectNotification _inlineRedirectNotification _headerTop ' + className + '"></div>');
            }
        }

        renderInlineRedirectNotification.render(data);
    }
};

scheduler.unloadInlineRedirectNotification = function (component) {
    renderInlineRedirectNotification.unload(component);
};

/**
 * ========================================================================================================================================
 * ========== Start of a list of proxy functions delegate to either list or calendar related functions  ===================================
 * ========================================================================================================================================
 */
//a proxy function to check if the provided timestamp (ts) fits anywhere in the current displayed message list or calendar view
scheduler.isInsertPermitted = function (ts) {
    if (schedulerUtil.isInListView()) {
        return scheduler.messageList.isInsertPermitted(ts);
    }
    return false;
};

//a proxy function to insert message into list or calendar view
scheduler.insert = function (msgWrapper) {

    if (schedulerUtil.isInListView()) {
        scheduler.messageList.insert(msgWrapper);
    }

    hootbus.emit(hsEvents.PUBLISHER_SCHEDULED_MESSAGES_INSERTED);
};

//a proxy function to remove message from list or calendar view
scheduler.remove = async function ({
   isApproval,
   isGroupMode,
   isPreScreen,
   messageId,
}) {
    const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

    if (isPreScreen) {
        schedulerRejected.remove(messageId, isGroupMode);
    }

    if (schedulerUtil.isInListView()) {
        scheduler.messageList.remove(messageId, isGroupMode, isApproval, hasCustomApprovals);
        scheduler.messageList.renderNoScheduledMessagesView();
    } else if (fnIsInStreamsView()) {
        window.fadeSlideRemove(scheduler.stream.getMessageById(messageId));
    }

    var shouldRemoveFromUnscheduled;
    var shouldRemoveFromCommentsReplies;
    var shouldRemoveFromFailedMessages;

    if (hasCustomApprovals) {
        shouldRemoveFromUnscheduled = fnHasUnscheduledApprovalView();
        shouldRemoveFromCommentsReplies = schedulerUtil.hasCommentsRepliesView();
        shouldRemoveFromFailedMessages = schedulerUtil.hasFailedMessagesView();
    } else {
        shouldRemoveFromUnscheduled = fnHasUnscheduledApprovalView() && isApproval;
    }

    if (shouldRemoveFromUnscheduled || shouldRemoveFromCommentsReplies || shouldRemoveFromFailedMessages) {
        if (hasCustomApprovals) {
            scheduler.collapsibleSection.remove(messageId, isGroupMode);
        } else {
            scheduler.unscheduledApproval.remove(messageId, isGroupMode);
        }
    }

};

// Added to reset the top and height of the list content after viewing the month section
scheduler.setHeight = function () {
    var $headerTop = $('#schedulerSection > ._headerTop:visible'),
    headerTopHeight = _.reduce($headerTop, function (memo, item) {
        return memo + $(item).outerHeight(true);
    }, 0);
    $('#publisherContent ._content').css('top', headerTopHeight).css('height', '');
}

/**
 * ========================================================================================================================================
 * ========== End of a list of proxy functions delegate to either list or calendar related functions  ===================================
 * ========================================================================================================================================
 */


scheduler.showClock = function (cb, cbIntervalMinutes) {
    fnShowSchedulerClock(cb, cbIntervalMinutes);
};
