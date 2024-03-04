import $ from 'jquery';
import _ from 'underscore';
import schedulerUtil from 'publisher/scheduler/util';
import Constants from 'components/publisher/constants';
import messageActionsFactory from '../../../src/components/publisher/message-actions-factory';
import hootbus from 'utils/hootbus';
import hsEjs from 'utils/hs_ejs';
import translation from 'utils/translation';

import { CUSTOM_APPROVALS } from 'fe-lib-entitlements';
import { hasEntitlement } from 'fe-pnc-data-entitlements';

window.scheduler = window.scheduler || {};
scheduler.collapsibleSection = {};

var addCommentReplyDataToMessageData = function (data, hasCustomApprovals) {
    var message = {};
    message._id = data.id;
    message.canEdit = data.permissions.canEdit;
    message.canApprove = data.permissions.canApprove;
    message.creatorName = data.comment ? data.comment.creatorName : data.message.creatorName;
    message.socialNetworkId = data.comment ? data.comment.socialProfileId : data.message.socialProfileId;
    message.message = data.comment ? data.comment.comment : data.message.message;
    message.createdDate = data.comment ? data.comment.createdDate : data.message.createdDate;
    message.isScheduled = data.message && data.message.isScheduled ? data.message.isScheduled : false;
    message.isLegacy = false;

    if (message.isScheduled) {
        message.sendDate = data.message && data.message.timeslot ? data.message.timeslot : null;
    }

    if (hasCustomApprovals) {
        message.parentId = data.comment ? data.comment.parentId : null;
        message.rootId = data.comment && data.comment.rootId ? data.comment.rootId : null;
        message.details = data.details ? data.details : null;
        message.sequenceNumber = data.sequenceNumber;

        if (data.comment && data.comment.parentType) {
            if (data.comment.parentType === 'POST') {
                message.isComment = true;
            } else if (data.comment.parentType === 'COMMENT') {
                message.isReply = true;
            }
        } else if (data.type === 'MESSAGE') {
            message.isReply = true;
        }
    } else {
        if (data.type === 'COMMENT') {
            message.isComment = true;
        } else if (data.type === 'MESSAGE') {
            message.isReply = true;
        }
    }

    var section = schedulerUtil.getSubSection();
    switch (section) {
        case 'pendingapproval':
        case 'approvequeue':
            message.isApproval = true;
            break;
        case 'rejected':
            message.isApproval = true;
            message.isRejected = true;
            break;
        case 'expired':
            message.isApproval = true;
            break;
        default:
            break;
    }

    return message;
};

var fnInsertCombinedGroupedMsgs = function (type, groups) {
    var $sectionType = schedulerUtil.getCollapsibleSection(type);
    var $content = $sectionType ? $sectionType.find('._itemList') : null;

    $.each(groups, function (groupHash, group) {
        //if group already exists then don't create again
        if ($('#group_unscheduled_approval_' + groupHash).length < 1) {
            var firstApproval = group[0];
            var videoLink = null;
            var thumbnailLink = null;
            var imgData = null;
            var attachments = firstApproval.attachments;

            if (attachments && _.isArray(attachments) && attachments.length > 0 && attachments[0].mimeType) {
                if (attachments[0].mimeType === 'video/mp4') {
                    videoLink = attachments[0].url;
                    thumbnailLink = attachments[0].thumbnailUrl;
                } else if (attachments[0].mimeType.indexOf('image') > -1) {
                    var imgArray = _.map(attachments, function (attachment) { return attachment.url; });

                    imgData = {
                        'imageNum': imgArray.length,
                        'images': imgArray.toString()
                    };
                }
            }

            var groupWrapper = {
                messages: group,
                approvals: group.map(function (message) {
                    return {
                        _id: message._id,
                        canApprove: message.canApprove,
                        canDelete: message.canDelete,
                        canEdit: message.canEdit,
                        isRejected: message.isRejected,
                        message: message
                    };
                }),
                socialNetworkIds: _.map(group, function (val) {
                    return val.socialNetworkId;
                })
            };

            var groupData = {
                'groupHash': firstApproval.groupHash,
                'group': groupWrapper,
                'firstMsg': firstApproval,
                'firstApproval': groupWrapper.approvals[0],
                'imgData': imgData,
                'isScheduled': false,
                'videoLink': videoLink,
                'thumbnail': thumbnailLink
            };

            groupData.schedulerUtil = schedulerUtil;
            var groupHtml = hsEjs.getEjs('publisher/scheduler/groupedmessage').render(groupData);

            if ($content && $content.length) {
                $content.append(groupHtml);
            }

            var $msg = $('#group_unscheduled_approval_' + firstApproval.groupHash).first();
            var isLegacy = true;
            var $groupActionContainer = $msg.find('._customApprovalActions')[0];
            // Add the group hash to the message object so it can be used in the component
            var groupObj = _.extend(groupWrapper, {groupHash: firstApproval.groupHash});

            if ($msg.attr('islegacy') === 'false') {
                isLegacy = false;
            }

            if ($groupActionContainer) {
                messageActionsFactory.renderAsGroupedApproval($groupActionContainer, groupObj, groupObj.approvals[0], isLegacy, schedulerUtil.showHideMessageOptionsMenu);
            }

            $.each(groupWrapper.approvals, function (i, approval) {
                var $msgContainer = $msg.find('[mid="' + approval._id + '"]');
                var $msgActionContainer = $msgContainer.find('._groupedMessageActions')[0];

                if ($msgActionContainer) {
                    messageActionsFactory.renderAsSingleApproval($msgActionContainer, approval, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                }
            });
        }
    });
};

var fnInsertCombinedNonGroupedMsgs = function (type, messages) {
    var $sectionType = schedulerUtil.getCollapsibleSection(type);
    var $content = $sectionType ? $sectionType.find('._itemList') : null;
    var isFailed = type === Constants.COLLAPSIBLE_LIST_TYPES.FAILED_MESSAGES;

    $.each(messages, async function (i, message) {
        //if approval already exists then don't create again
        if ($('#unscheduled_approval_' + message._id).length < 1) {
            var videoLink = null;
            var thumbnailLink = null;
            var imgData = null;
            var attachments = message.attachments;
            var msgData = {};

            const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS);

            if (message.comment) {
                message = addCommentReplyDataToMessageData(message, hasCustomApprovals);
            } else if (message.message && message.message.socialNetworkRequestData && message.message.socialNetworkRequestData.inReplyToId) {
                message = addCommentReplyDataToMessageData(message, hasCustomApprovals);
            }

            message = message.comment ? addCommentReplyDataToMessageData(message, hasCustomApprovals) : message;

            if (hasCustomApprovals) {
                if (message.inReplyToId) {
                    message.isReply = true;
                }
            }

            if (attachments && _.isArray(attachments) && attachments.length > 0 && attachments[0].mimeType) {
                if (attachments[0].mimeType === 'video/mp4') {
                    videoLink = attachments[0].url;
                    thumbnailLink = attachments[0].thumbnailUrl;
                } else if (attachments[0].mimeType.indexOf('image') > -1) {
                    var imgArray = _.map(attachments, function (attachment) { return attachment.url; });
                    imgData = {
                        'imageNum': imgArray.length,
                        'images': imgArray.toString()
                    };
                }
            }

            var approval = {
                _id: message._id,
                canApprove: message.canApprove,
                canDelete: message.canDelete,
                canEdit: message.canEdit,
                isRejected: message.isRejected,
                message: message
            };

            if (hasCustomApprovals) {
                msgData = {
                    'imgData': imgData,
                    'message': message,
                    'approval': approval,
                    'isScheduled': message.isScheduled ? message.isScheduled : false,
                    'videoLink': videoLink,
                    'thumbnail': thumbnailLink,
                    'schedulerUtil': schedulerUtil,
                    'isFailed': isFailed,
                    hasCustomApprovals: true,
                };
            } else {
                msgData = {
                    'imgData': imgData,
                    'message': message,
                    'approval': approval,
                    'isScheduled': false,
                    'videoLink': videoLink,
                    'thumbnail': thumbnailLink,
                    'schedulerUtil': schedulerUtil,
                    'isFailed': isFailed,
                    hasCustomApprovals: false,
                };
            }

            var msgHtml = hsEjs.getEjs('publisher/scheduler/nongroupedmessage').render(msgData);

            if ($content && $content.length) {
                $content.append(msgHtml);
            }

            var isLegacy = true;
            var $msg = $('#unscheduled_approval_' + message._id).first();

            if (hasCustomApprovals) {
                // If $msg is empty then we have a scheduled twitter reply
                // in the Comments and Replies section
                if (!$msg.length) {
                    $msg = $('#approval_' + message._id).first();
                }
            }

            var $container = $msg.find('._customApprovalActions')[0];

            if ($msg.attr('islegacy') === 'false') {
                isLegacy = false;
            }

            if ($container) {
                messageActionsFactory.renderAsSingleApproval($container, approval, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
            }
        }
    });
};

scheduler.collapsibleSection.getMessageHTML = function (title, message, classNames) {
    return '<div class="_prompt warningMessage u-c-center u-cursorPointer">' +
                message.replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>') +
                '<span class=\'icon-19 collapsed\'></span>' +
            '</div>' +
            '<div class="' + classNames + ' publisherMessageGroup sectionList _sectionList" style="display: none">' +
                '<h3 class="_close sectionTitle">' + translation._('%s').replace('%s', title) + '&nbsp;<span class="icon-19 expanded"></span></h3>' +
                '<div class="_itemListWrapper itemListWrapper">' +
                    '<div class="_itemList itemList"></div>' +
                '</div>' +
            '</div>';
};

scheduler.collapsibleSection.getAjaxLoadUrl = function (type) {
    var url;
    var section = schedulerUtil.getSubSection();

    if (type === Constants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES) {
        switch (section) {
            case 'pendingapproval':
                url = '/ajax/message-review/get-pending-approval-unscheduled-messages?';
                break;
            case 'approvequeue':
                url = '/ajax/message-review/get-require-approval-unscheduled-messages?';
                break;
            case 'rejected':
                url = '/ajax/message-review/get-rejected-unscheduled-messages?';
                break;
            case 'expired':
                url = '/ajax/message-review/get-expired-unscheduled-messages?';
                break;
            case 'scheduled':
                url = '/ajax/message-review/get-require-approval-unscheduled-messages?';
                break;
            default:
                break;
        }
    } else if (type === Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES) {
        switch (section) {
            case 'pendingapproval':
            case 'rejected':
            case 'expired':
                url = '/ajax/message-review/get-submitted-comments?';
                break;
            case 'approvequeue':
                url = '/ajax/message-review/get-reviewable-comments?';
                break;
            default:
                break;
        }
    } else if (type === Constants.COLLAPSIBLE_LIST_TYPES.FAILED_MESSAGES) {
        url = '/ajax/message-review/get-failed-submitted-messages-and-comments?';
    }

    return url;
};

scheduler.collapsibleSection.insertCombinedData = function (type, data) {
    if (Object.prototype.hasOwnProperty.call(data,'nonGrouped')) {
        fnInsertCombinedNonGroupedMsgs(type, data.nonGrouped);
    }
    if (Object.prototype.hasOwnProperty.call(data,'grouped')) {
        fnInsertCombinedGroupedMsgs(type, data.grouped);
    }

    scheduler.collapsibleSection.resize(type);
};

scheduler.collapsibleSection.remove = function (approvalId, isGroupMode) {
    var $groupDiv;

    if (isGroupMode) {
        // Clean up message actions component before removal
        var $groupActionsNode = $('#unscheduled_approval_' + approvalId).find('._customApprovalActions')[0];
        if ($groupActionsNode) {
            messageActionsFactory.remove($groupActionsNode);
        }

        var $unscheduledApproval = $('#unscheduled_approval_' + approvalId);

        // It's possible to have both unscheduled and scheduled approval items in the collapsible list
        if ($unscheduledApproval.length) {
            $unscheduledApproval.closest('._itemWrapper').remove();
        } else {
            $('#approval_' + approvalId).closest('._itemWrapper').remove();
        }
    } else {
        //check to see if this message is part of a group, if so, remove sn avatar from the group avatars as well, and if all individual msgs removed, then remove the group as well
        var $msgDiv = $('#unscheduled_approval_' + approvalId);
        $groupDiv = $msgDiv.closest('._groupedUnscheduledApproval');
        if ($groupDiv.length == 1) {
            var $counter = $groupDiv.find('._networkGroup ._profileCount');
            var count = parseInt($counter.text(), 10);
            if (count <= 1) {  //if this is the only one left, then remove whole group
                $groupDiv.remove();
            } else {
                count--;
                $counter.text(count);
                var snId = $msgDiv.attr('snid');
                $groupDiv.find('._networkGroup ._profile[snid="' + snId + '"]').remove(); //PLEASE DON'T ADD ANY TIME DELAYED EFFECTS, AS NEXT STATEMENT WILL COUNT VISIBLE ONES
                if ($groupDiv.find('._unScheduledApprovalInGroup').length > 1 && $groupDiv.find('._unScheduledApprovalInGroup').first().attr('snID') === snId) {
                    // If the first social network in the group is being removed, replace the icon with the next social network in the group
                    var $nextMessageInGroup = $groupDiv.find("._unScheduledApprovalInGroup").first().next();
                    var $groupIcon = $nextMessageInGroup.find(".networkType").clone();
                    var nextSnId = $nextMessageInGroup.attr('snID');
                    $groupIcon.removeClass("networkType");
                    $groupIcon.addClass("profile _profile _jsTooltip");
                    $groupIcon.attr('snid', nextSnId);
                    $groupDiv.find("._networkGroup").prepend($groupIcon);
                }
            }
        }

        // Clean up message actions component before removal
        var $msgActionsNode = $msgDiv.find('._customApprovalActions')[0];
        if ($msgActionsNode) {
            messageActionsFactory.remove($msgActionsNode);
        }

        $msgDiv.remove();
    }
};

scheduler.collapsibleSection.resize = async function (type) {
    var fullHeight;
    var $sectionList = schedulerUtil.getCollapsibleSectionList(type);

    const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS);

    if ($sectionList) {
        if (hasCustomApprovals) {
            if ((type === Constants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES &&
                $sectionList.find('._unscheduledApproval').length === 0 &&
                $sectionList.find('._groupedUnscheduledApproval').length === 0) ||
                (type === Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES &&
                $sectionList.find('._itemWrapper').length === 0) ||
                (type === Constants.COLLAPSIBLE_LIST_TYPES.FAILED_MESSAGES &&
                $sectionList.find('._itemWrapper').length === 0)) {
                $sectionList.remove();
            } else {
                fullHeight = $sectionList.find('._close').outerHeight() + $sectionList.find('._itemListWrapper').outerHeight();
                $sectionList.css('height', fullHeight);
            }
        } else {
            if ($sectionList.find('._unscheduledApproval').length === 0 && $sectionList.find('._groupedUnscheduledApproval').length === 0) {
                $sectionList.remove();
            } else {
                fullHeight = $sectionList.find('._close').outerHeight() + $sectionList.find('._itemListWrapper').outerHeight();
                $sectionList.css('height', fullHeight);
            }
        }
    }
};

/**
 * Resizes all the collapsible lists
 *
 */
scheduler.collapsibleSection.resizeAll = function () {
    var fullHeight;

    _.each(Constants.COLLAPSIBLE_LIST_TYPES, function (type) {
        var $sectionList = schedulerUtil.getCollapsibleSectionList(type);

        if ($sectionList) {
            if ((type === Constants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES &&
                $sectionList.find('._unscheduledApproval').length === 0 &&
                $sectionList.find('._groupedUnscheduledApproval').length === 0) ||
                $sectionList.find('._itemWrapper').length === 0) {
                $sectionList.remove();
            } else {
                fullHeight = $sectionList.find('._close').outerHeight() + $sectionList.find('._itemListWrapper').outerHeight();
                $sectionList.css('height', fullHeight);
            }
        }
    });
};

/**
 * After data have been loaded into the collapsible section, render them into the view.
 *
 * @param data
 * @param type
 * @param title
 * @param message
 * @param classNames
 */
scheduler.collapsibleSection.onLoadSuccess = async function (data, type, title, message, classNames) {
    var $section;
    var $scheduler = $('#schedulerSection');

    if (type === Constants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES) {
        $section = $scheduler.find('._unscheduledApprovalSec');
    } else if (type === Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES) {
        $section = $scheduler.find('._commentsRepliesSec');
    } else if (type === Constants.COLLAPSIBLE_LIST_TYPES.FAILED_MESSAGES) {
        $section = $scheduler.find('._failedMessagesSec');
    }

    if (data) {
        var htmlInput = null;
        //always reload the whole list
        if (data.grouped.length > 0 || data.nonGrouped.length > 0) {
            htmlInput = scheduler.collapsibleSection.getMessageHTML(title, message, classNames);
        }

        schedulerUtil.convertTimestampsToUserTime(data);
        $section.empty().removeClass('resizable').html(htmlInput);

        var $list;
        var $prompt = $section.find('._prompt');
        var collapsibleSectionSecContent = $section.html();
        var $messageListView = $scheduler.find('._content ._messageListView');
        var hasScheduledMessages = $('._messageListView').find('._itemList').length > 0;

        if (type === Constants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES) {
            $list = $section.find('._unscheduled');
        } else if (type === Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES) {
            $list = $section.find('._commentsRepliesList');
        } else if (type === Constants.COLLAPSIBLE_LIST_TYPES.FAILED_MESSAGES) {
            $list = $section.find('._failedMessagesList');
        }

        scheduler.collapsibleSection.insertCombinedData(type, data);

        const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS);

        if (hasCustomApprovals) {
            scheduler.loadInlineRedirectNotification(data);
        } else {
            scheduler.loadUnscheduledMessagesBanner(data, false);
        }

        if (hasCustomApprovals) {
            if ($messageListView.hasClass('noMessages')) {
                $messageListView.removeClass('noMessages');
                // Remove any helper text on the screen that indicates a lack of messages
                $scheduler.find('._noResults, ._noMessagesMsg:visible, ._publisherNoMessages, ._noMessageWarning')
                    // If any of them are present, remove them
                    .each(function (i, warningEl) {
                        $(warningEl).remove();
                    });
            }
        } else {
            if ($section.length && !(collapsibleSectionSecContent.trim().length) && !hasScheduledMessages) {
                scheduler.messageList.showNoMessages();
            } else if ($messageListView.hasClass('noMessages')) {
                $messageListView.removeClass('noMessages');
                // Remove any helper text on the screen that indicates a lack of messages
                $scheduler.find('._noResults, ._noMessagesMsg:visible, ._publisherNoMessages, ._noMessageWarning')
                    // If any of them are present, remove them
                    .each(function (i, warningEl) {
                        $(warningEl).remove();
                    });
            }
        }

        // init approval events
        $prompt.mousedown(function () {
            $prompt.hide();

            $list.slideDown(function () {
                // bind resizeable AFTER slidedown
                $section.find('._close').click(function () {
                    var fullHeight = $list.css('height');
                    var miniHeight = String(parseInt($section.find('._prompt').css('height').replace('px', '')) + 14) + 'px'; //Add 14 for the margins
                    $list.stop().animate({height: miniHeight}, 250, function () {
                        $list.hide();
                        $list.css('height', fullHeight);
                        $prompt.show();
                    });
                    return false;
                });

                scheduler.collapsibleSection.resize(type);
            });
        });

        var section = schedulerUtil.getSubSection();

        //if user is in approval queue section, then expand unscheduled view automatically
        if (section === 'approvequeue' || section === 'pendingapproval' || section === 'rejected' || section === 'expired') {
            $prompt.trigger('mousedown');
        }
    }
    else {
        $section.empty();
    }
};

/**
 * After a comment or reply has been successfully edited, remove it or render it back into the view.
 *
 * @param data
 */
scheduler.collapsibleSection.onUpdateComment = function (data) {
    if (data.nonGrouped && data.nonGrouped.length) {
        var messageIds = data.nonGrouped.map(function (msg) {
            return msg.id;
        });
        var sectionType = schedulerUtil.getCollapsibleSectionByMessageId(messageIds, false);

        scheduler.remove({
            isApproval: true,
            isGroupMode: false,
            messageId: messageIds,
        });

        if (schedulerUtil.getSubSection() === Constants.APPROVALS.TYPE.PENDING_APPROVAL) {
            var msgWrapper = {};
            msgWrapper.nonGrouped = data.nonGrouped;
            scheduler.collapsibleSection.insertCombinedData(sectionType, msgWrapper);
        }

        scheduler.collapsibleSection.resize(sectionType);

        if ($('._messagePreviewModal').length) {
            $('body').trigger('click'); // Click outside of the message preview modal to close it
        }
    }
};

// Listen for when a comment or reply has been updated - on success, update the view
hootbus.on('publisher:updateComment', scheduler.collapsibleSection.onUpdateComment);
