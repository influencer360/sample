import $ from 'jquery';
import 'profileselector';
import _ from "underscore";
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise';
import translation from 'utils/translation';

var utils = {
    /**
     * The scheduler controller endpoint get-all-scheduled-message
     * performs the timezone offset the same as the old scheduler controller endpoint
     *
     * In the old scheduler controller endpoint, dates are returned as a UTC timestamp that has already been offset by the user's current timezone. The newer
     * endpoint that includes MRS messages returns a UTC timestamp that is actually in UTC. To pass this data to the scheduler code that is expecting a time
     * in the user's time, we first offset the send dates of all the messages by the user's timezone offset. Original (UTC) send dates are preserved in a separate
     * property.
     * @param data the combined MRS/legacy message data retrieved from the new endpoint
     * @returns {*} the same data with send date timestamps offset by the user's current timezone and original send date added as a property
     */
    convertTimestampsToUserTime: function (data) {
        var convertMessageTimes = function (message) {
            if (message.sendDate !== null) {
                message.originalSendDate = message.sendDate;
            }
            message.originalCreatedDate = message.createdDate;
        };

        if (data && Object.prototype.hasOwnProperty.call(data,'nonGrouped')) {
            _.each(data.nonGrouped, convertMessageTimes);
        }
        if (data && Object.prototype.hasOwnProperty.call(data,'grouped')) {
            _.each(data.grouped, function (group) {
                _.each(group, convertMessageTimes);
            });
        }

        return data;
    },
    /**
     * Return the scheduler top header
     * @returns {jQuery}
     */
    getHeaderTop: function () {
        return $("#schedulerSection").find("._filter");
    },
    /**
     * Return the sub section
     * @returns {string}
     */
    getSubSection: function () {
        return this.getHeaderTop().find("input._subSec").val();
    },
    /**
     * Return true if we are in a sub section that has bulk actions
     * @returns {boolean}
     */
    showBulkActions: function () {
        return $.inArray(this.getSubSection(), ['pastscheduled', 'scheduled', 'pendingapproval', 'approvequeue', 'expired', 'rejected']) !== -1;
    },
    /**
     * Check whether it is the calendar view
     * @returns {boolean}
     */
    isInCalendarView: function () {
        return this.getHeaderTop().find("._viewType ._calendar.active").length > 0;
    },
    isInListView: function () {
        return this.getHeaderTop().find("._viewType ._list.active").length > 0;
    },
    /**
     * Check if regular, or approval, message should be inserted into the current view user has up
     * @returns {boolean}
     */
    isAllowInsertIntoView: function (isApproval, hasCustomApproval) {
        if (hasCustomApproval) {
            var subSec = this.getSubSection();
            if (isApproval && (subSec === "scheduled" || subSec === "pendingapproval")) {
                return true;
            } else if (!isApproval && subSec === "scheduled") {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    },
    /**
     * Check that no social networks supplied and no createduser supplied in filter
     * @returns {boolean}
     */
    isFilterEmpty: function () {
        var $filter = $("#schedulerSection ._filter");
        //$tm = $filter.find("select._tm");
        var ps = new hs.profileSelector($filter.find('._profileSelectorWidget'));

        return !ps.getSelected().length;
        //Change this later once the team member filter is put back into the UI
        //return $tm.find("option:selected").val() == "" && ps.getSelected().length == 0;
    },
    /**
     * Returns Now
     * @returns {number|*}
     */
    getNow: function () {
        var now = new Date();
        var myNow = new Date(now.getTime() + hs.timezoneOffset * 1000);
        return Math.round(myNow.getTime() / 1000);
    },
    getLoadUrl: function () {
        var subSec = this.getSubSection();
        var ajaxUrl;

        if (subSec === "pendingapproval") {
            ajaxUrl = "/ajax/message-review/get-pending-approval-scheduled-messages?";
        } else if (subSec === "approvequeue") {
            ajaxUrl = "/ajax/message-review/get-require-approval-scheduled-messages?";
        } else if (subSec === "rejected") {
            ajaxUrl = "/ajax/message-review/get-rejected-scheduled-messages?";
        } else if (subSec === "expired") {
            ajaxUrl = "/ajax/message-review/get-expired-scheduled-messages?";
        } else if (subSec === "scheduled") {
            ajaxUrl = "/ajax/message-review/get-all-scheduled-messages?";
        }

        return ajaxUrl;
    },
    /**
     * Returns grouped message type
     * @param isApproval Boolean whether or not the first grouped message is an approval
     * @returns {string}
     */
    getGroupedMessageType: function (isApproval) {
        return "group_" + this.getNongroupedMessageType(isApproval);
    },
    /**
     * Returns non grouped message type
     * @param isApproval Boolean whether or not the message is an approval
     * @returns {string}
     */
    getNongroupedMessageType: function (isApproval) {
        switch (this.getSubSection()) {
            case 'scheduled':
                var messageType = isApproval ? 'approval' : 'message';
                return messageType;
            case 'pendingapproval':
            case 'approvequeue':
                return 'approval';
            case 'rejected':
                return 'rejected';
            default:
                return 'message';
        }
    },
    /**
     * search messages from backend based on various params
     *
     * @var viewType either list or calendar
     * @var query a object contains key/value pairs. keys/value paris provided here will override defaults
     * @var successCb callback function if successful
     * @var completeCb callback function if completes
     * @var errorCb callback function if there is error
     */
    searchMessages: function (query, successCb, completeCb, errorCb, ajaxQueue) {
        var q = '';
        $.each(query, function (k, v) {
            if (q !== '') {
                q += "&";
            }
            q += encodeURIComponent(k) + "=" + encodeURIComponent(v);
        });

        ajaxQueue = ajaxQueue ? ajaxQueue : 'q1';

        hs.statusObj.update(translation.c.LOADING, 'info');

        ajaxCall({
            type: 'GET',
            url: "/ajax/scheduler/search-messages?" + q,
            success: function (data) {
                $.isFunction(successCb) && successCb(data);
                hs.statusObj.reset();
            },
            complete: function () {
                $.isFunction(completeCb) && completeCb();
                if (hs.SOCIALNETWORKLIMIT) {
                    hs.statusObj.update('Messages for 200 social networks are shown. View more by adjusting the filtered drop down menu.', 'warning', true, 5000);
                }
            },
            abort: function () {
                $.isFunction(errorCb) && errorCb();
                hs.statusObj.reset();
            }
        }, ajaxQueue);
    },
    /**
     *
     * @param query Object contains key/value pairs. keys/value pairs provided here will override defaults
     * @param url String the url of the ajax endpoint to call
     * @param successCb callback function if successful
     * @param completeCb callback function if complete
     * @param errorCb callback function id there is an error
     * @param ajaxQueue
     */
    getMessages: function (query, url, successCb, completeCb, errorCb, ajaxQueue) {

        ajaxQueue = ajaxQueue ? ajaxQueue : 'q1';

        hs.statusObj.update(translation.c.LOADING, 'info');

        ajaxCall({
            type: 'GET',
            url: url,
            data: query,
            success: function (data) {
                _.isFunction(successCb) && successCb(this.convertTimestampsToUserTime(data));
                hs.statusObj.reset();
            }.bind(this),
            complete: function () {
                _.isFunction(completeCb) && completeCb();
                if (hs.SOCIALNETWORKLIMIT) {
                    hs.statusObj.update('Messages for 200 social networks are shown. View more by adjusting the filtered drop down menu.', 'warning', true, 5000);
                }
            },
            abort: function () {
                _.isFunction(errorCb) && errorCb();
                hs.statusObj.reset();
            }
        }, ajaxQueue);
    },
    /**
     *
     * @param query Object contains key/value pairs. keys/value pairs provided here will override defaults
     * @param url String the url of the ajax endpoint to call
     * @returns {ajaxPromise}
     */
    getMessagePromise: function (query, url) {
        return ajaxPromise({
            type: 'GET',
            url: url,
            data: query
        }, 'qm');
    },
    collectSearchQueryForCombinedMessages: function (fromTs, limit, section) {
        var q = {},
            $filter = $("#schedulerSection ._filter"),
            ps = new hs.profileSelector($filter.find('._profileSelectorWidget'));
        section = section ? section : null;

        var snIds = ps.getSelected();

        if (snIds.length > 0) {
            q.socialNetworkIds = snIds.join();
        }

        if (fromTs) {
            q.sendDateFrom = fromTs;
        }

        if (limit) {
            q.limit = limit;
        }

        if (section) {
            q.section = section;
        }

        return q;
    },

    /**
     * Collect common search terms from filter and return a key/value pair object
     */
    collectSearchQuery: function () {

        var q = {},
            $filter = $("#schedulerSection ._filter"),
            $tm = $filter.find("select._tm"),
            $subSec = $filter.find("input._subSec"),
            ps = new hs.profileSelector($filter.find('._profileSelectorWidget')),
            subSec = $subSec.val();

        //we only need this because we have removed the team member filter from the UI. This can be removed once the team member filter is added back in.
        if (!$tm.length) {
            q['query[createdUser]'] = "";
        } else {
            q[$tm.attr('name')] = $tm.find("option:selected").val();
        }

        q[$subSec.attr('name')] = subSec;

        //collect selected social network Ids;
        q['query[socialNetworkIds]'] = ps.getSelected().join();

        q['getPreScreen'] = 0;

        //based on subsection, decide the flags that determines what kind of results to return
        switch (subSec) {
            case 'optimizer':
                q['getPastUnapproved'] = 0;
                q['optimizedOnly'] = 1;
                q['getRegular'] = 1;
                q['getApproval'] = 1;
                break;
            case 'pastscheduled':
                q['getPastUnapproved'] = 0;
                q['passedOnly'] = 1;
                q['getRegular'] = 1;
                q['getApproval'] = 0;
                break;
            case 'approvequeue':
                q['getPastUnapproved'] = 0;
                q['getRegular'] = 0;
                q['getApproval'] = 1;
                break;
            case 'expired':
                q['getPastUnapproved'] = 1;
                q['hideFutureApproval'] = 1;
                q['getRegular'] = 0;
                q['getApproval'] = 1;
                break;
            case 'scheduled':
                q['getPastUnapproved'] = 0;
                q['getRegular'] = 1;
                q['getApproval'] = 1;
                break;
            case 'rejected':
                q['getPastUnapproved'] = 0;
                q['getRegular'] = 0;
                q['getApproval'] = 0;
                q['getPreScreen'] = 1;
                break;
            default:
                q['getPastUnapproved'] = 0;
                q['getRegular'] = 1;
                q['getApproval'] = 1;
                break;
        }

        return q;
    },

    collectSnIdsFromGroup: function ($wrapper) {
        var snIds = [];
        $wrapper.find("._itemDetail ._groupMessage").each(function () {
            snIds.push($(this).attr('snid'));
        });
        return snIds;
    },

    showHideMessageOptionsMenu: function (selector, isShowing) {
        var $newExpandedMsgContainer = $(selector);
        var $newExpandedMsgInfo = $newExpandedMsgContainer.find('.itemInfo');

        if (isShowing) {
            $newExpandedMsgContainer.addClass('expandedActions');
            $newExpandedMsgContainer.addClass('active');
            $newExpandedMsgInfo.addClass('expandedActions');
        } else {
            $newExpandedMsgContainer.removeClass('expandedActions');
            $newExpandedMsgContainer.removeClass('active');
            $newExpandedMsgInfo.removeClass('expandedActions');
        }
    },

    getCollapsibleSection: function (type) {
        return $('#schedulerSection ._collapsibleSection[data-type="' + type + '"]');
    },

    getCollapsibleSectionByMessageId: function (messageId, isGroupMode) {
        isGroupMode = isGroupMode ? isGroupMode : null;

        var sectionType = isGroupMode ?
            $('._groupMessage[mid="' + messageId + '"]').closest('._collapsibleSection').data('type') :
            $('._itemWrapper[mid="' + messageId + '"]').closest('._collapsibleSection').data('type');

        // If sectionType is null then the message is part of a grouped message
        if (!sectionType) {
            sectionType = $('._groupMessage[mid="' + messageId + '"]').closest('._collapsibleSection').data('type');
        }

        return sectionType;
    },

    getCollapsibleSectionList: function (type) {
        var $section = utils.getCollapsibleSection(type);
        return $section.length ? $section.find('._sectionList') : null;
    },

    hasUnscheduledApprovalView: function () {
        return $('#schedulerSection ._unscheduledApprovalSec ._itemList').length > 0;
    },

    hasCommentsRepliesView: function () {
        return $('#schedulerSection ._commentsRepliesSec ._itemList').length > 0;
    },

    hasFailedMessagesView: function () {
        return $('#schedulerSection ._failedMessagesSec ._itemList').length > 0;
    },

    /**
     * Renders the "You have no messages..." message in the list
     *
     * @param {Array.<string>} sections An array of collapsible section types (ie. unscheduled messages and comments/replies)
     */
    renderNoMessagesInListView: function (sections) {
        var hasCollapsibleSectionContent = false;
        var hasScheduledMessages = $('._messageListView').find('._itemList').length > 0;

        sections.some(function (section) {
            var $section = utils.getCollapsibleSection(section);
            var sectionContent;
            if ($section.length) {
                sectionContent = $section.html().trim();

                if (sectionContent.length) {
                    hasCollapsibleSectionContent = true;
                    return true;
                }
            }
        });

        if (!hasCollapsibleSectionContent && !hasScheduledMessages) {
            scheduler.messageList.showNoMessages();
        }
    },

    getSignedVideoUrls: function(messageId, messageType, videoLink) {
        return ajaxPromise({
            url: '/ajax/scheduler/get-signed-video-urls',
            data: {
                id: messageId,
                type: messageType,
                objectKey: videoLink
            },
            type: 'GET'
        });
    },

    getSignedUrl: function(url) {
        return ajaxPromise({
            url: '/ajax/scheduler/sign-single-url',
            data: {
                objectKey: url,
            },
            type: 'GET'
        });
    },
};

export default utils;


