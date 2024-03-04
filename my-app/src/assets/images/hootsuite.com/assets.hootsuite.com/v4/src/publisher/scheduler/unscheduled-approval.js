import $ from 'jquery';
import _ from 'underscore';
import hsEjs from 'utils/hs_ejs';
import schedulerUtil from 'publisher/scheduler/util';
import messageActionsFactory from '../../../src/components/publisher/message-actions-factory';
import translation from 'utils/translation';

import { CUSTOM_APPROVALS } from 'fe-lib-entitlements';
import { hasEntitlement } from 'fe-pnc-data-entitlements';

import 'utils/hs_ejs';

window.scheduler = window.scheduler || {};
scheduler.unscheduledApproval = {};

var fnInsertGroupedMsgs = function (groups) {

        var $content = $("#schedulerSection ._unscheduledApprovalSec ._itemList");

        $.each(groups, async function (groupHash, group) {
            //if group already exists then don't create again
            if ($("#group_unscheduled_approval_" + groupHash).length < 1) {
                var firstApproval = group.approvals[0];
                var groupHtml = null;
                var videoLink = null;
                var thumbnailLink = null;
                var imgData = null;

                const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS);

                if (hasCustomApprovals) {
                    var attachments = firstApproval.message.attachments;

                    if (attachments && _.isArray(attachments) && attachments.length > 0 && attachments[0].mimeType) {
                        if (attachments[0].mimeType === 'video/mp4') {
                            videoLink = attachments[0].url;
                            thumbnailLink = attachments[0].thumbnailUrl;
                        } else if (attachments[0].mimeType.indexOf('image') > -1) {
                            var imgArray = _.map(attachments, function (attachment) {
                                return attachment.url;
                            });

                            imgData = {
                                'imageNum': imgArray.length,
                                'images': imgArray.toString()
                            };
                        }
                    }

                    groupHtml = hsEjs.getEjs('publisher/scheduler/groupedmessage').render({
                        'groupHash': groupHash,
                        'group': group,
                        'firstMsg': firstApproval.message,
                        'firstApproval': firstApproval,
                        'imgData': imgData,
                        'isScheduled': false,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        'schedulerUtil': schedulerUtil
                    });
                } else {
                    if (firstApproval.message.attachments != null && firstApproval.message.attachments.length > 0 && firstApproval.message.attachments[0].mimeType === 'video/mp4') {
                        videoLink = firstApproval.message.attachments[0].url;
                        thumbnailLink = firstApproval.message.attachments[0].thumbnailUrl;
                    }
                    groupHtml = hsEjs.getEjs('publisher/scheduler/groupedmessage').render({
                        'groupHash': groupHash,
                        'group': group,
                        'firstMsg': firstApproval.message,
                        'firstApproval': firstApproval,
                        'isScheduled': false,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink
                    });
                }

                $content.append(groupHtml);

                if (hasCustomApprovals) {
                    var isLegacy = true;
                    var $msg = $("#group_unscheduled_approval_" + groupHash).first();
                    var $groupActionContainer = $msg.find('._customApprovalActions')[0];
                    var groupObj = _.extend(group, {groupHash: groupHash});

                    if ($msg.attr('islegacy') === 'false') {
                        isLegacy = false;
                    }

                    if ($groupActionContainer) {
                        messageActionsFactory.renderAsGroupedApproval($groupActionContainer, groupObj, firstApproval, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                    }

                    $.each(group.approvals, function (i, approval) {
                        var $msgContainer = $msg.find("._groupMessage[mid='" + approval._id + "']");
                        var $msgActionContainer = $msgContainer.find('._groupedMessageActions')[0];
                        if ($msgActionContainer) {
                            messageActionsFactory.renderAsSingleApproval($msgActionContainer, approval, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                        }
                    });
                }
            }
        });
    },
    fnInsertNonGroupedMsgs = function (approvals) {

        var $content = $("#schedulerSection ._unscheduledApprovalSec ._itemList");

        $.each(approvals, async function (i, approval) {
            //if approval already exists then don't create again
            if ($("#unscheduled_approval_" + approval._id).length < 1) {
                var msgHtml = null;
                var videoLink = null;
                var thumbnailLink = null;
                var imgData = null;

                const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS);

                if (hasCustomApprovals) {
                    var attachments = approval.message.attachments;

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

                    msgHtml = hsEjs.getEjs('publisher/scheduler/nongroupedmessage').render({
                        u_escape: _.escape,
                        'message': approval.message,
                        'approval': approval,
                        'imgData': imgData,
                        'isScheduled': false,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        'schedulerUtil': schedulerUtil
                    });
                } else {
                    if (approval.message.attachments != null && approval.message.attachments.length > 0 && approval.message.attachments[0].mimeType === 'video/mp4') {
                        videoLink = approval.message.attachments[0].url;
                        thumbnailLink = approval.message.attachments[0].thumbnailUrl;
                    }
                    msgHtml = hsEjs.getEjs('publisher/scheduler/nongroupedmessage').render({
                        u_escape: _.escape,
                        'message': approval.message,
                        'approval': approval,
                        'isScheduled': false,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink
                    });
                }

                $content.append(msgHtml);

                if (hasCustomApprovals) {
                    var isLegacy = true;
                    var $msg = $("#unscheduled_approval_" + approval._id).first();
                    var $msgActionContainer = $msg.find('._customApprovalActions')[0];

                    if ($msg.attr('islegacy') === 'false') {
                        isLegacy = false;
                    }

                    if ($msgActionContainer) {
                        messageActionsFactory.renderAsSingleApproval($msgActionContainer, approval, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                    }
                }
            }
        });
    };

scheduler.unscheduledApproval.getAjaxLoadUrl = function () {
    var url;

    switch (schedulerUtil.getSubSection()) {
        case "pendingapproval":
            url = "/ajax/message-review/get-pending-approval-unscheduled-messages?";
            break;
        case "approvequeue":
            url = "/ajax/message-review/get-require-approval-unscheduled-messages?";
            break;
        case "rejected":
            url = "/ajax/message-review/get-rejected-unscheduled-messages?";
            break;
        case "expired":
            url = "/ajax/message-review/get-expired-unscheduled-messages?";
            break;
        case "scheduled":
            url = "/ajax/message-review/get-require-approval-unscheduled-messages?";
            break;
        default:
            break;
    }

    return url;
};

scheduler.unscheduledApproval.getMessageHTML = function () {
    var unscheduledTitle = translation._("Unscheduled");

    var message = "";
    if (schedulerUtil.getSubSection() === "rejected") {
        message = translation._("You have %s1unscheduled%s2 rejected message(s). %s1View messages%s2.");
    } else {
        message = translation._("You have %s1unscheduled%s2 unapproved messages(s). %s1View messages%s2.");
    }

    var unscheduledMessage = message.replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>');

    return "<div class=\"_prompt warningMessage u-c-center u-cursorPointer\">\n\t\t\t\t\t\t" + unscheduledMessage + "<span class=\"icon-19 collapsed\"></span>\n</div>\n<div class=\"_unscheduled unscheduled publisherMessageGroup\" style=\"display:none\">\n\t<h3 class=\"_close sectionTitle\">" + unscheduledTitle + "&nbsp;<span class=\"icon-19 expanded\"></span></h3>\n    <div class=\"_itemListWrapper itemListWrapper\">\n        <div class=\"_itemList itemList\">\n                    </div>\n\t</div>\n</div>";
};

scheduler.unscheduledApproval.load = function () {

    //if no social network, then just do nothing
    if (!_.keys(hs.socialNetworks).length) {
        return;
    }

    var $scheduler = $("#schedulerSection"),
        query = schedulerUtil.collectSearchQuery();

    var q = '';
    $.each(query, function (k, v) {
        if (q !== '') {
            q += "&";
        }
        q += encodeURIComponent(k) + "=" + encodeURIComponent(v);
    });

    ajaxCall({
        type: 'GET',
        url: "/ajax/scheduler/unscheduled-approvals?" + q,
        success: function (data) {
            var $unScheduledSec = $scheduler.find("._unscheduledApprovalSec");
            if (data.hasResult) {


                //always reload the whole list
                $unScheduledSec.empty().removeClass('resizable').html(data.output);
                var $prompt = $unScheduledSec.find("._prompt"),
                    $unscheduled = $unScheduledSec.find('._unscheduled');

                // init approval events
                $prompt.mousedown(function () {
                    $prompt.hide();
                    scheduler.unscheduledApproval.insert(data.messagesWrapper);

                    $unscheduled.slideDown(function () {
                        // bind resizeable AFTER slidedown
                        $unScheduledSec.find('._close').click(function () {
                            var fullHeight = $unscheduled.css('height');
                            var miniHeight = String(parseInt($unScheduledSec.find('._prompt').css('height').replace('px', '')) + 14) + "px"; //Add 14 for the margins
                            $unscheduled.stop().animate({height: miniHeight}, 250, function () {
                                $unscheduled.hide();
                                $unscheduled.css('height', fullHeight);
                                $prompt.show();
                            });
                            return false;
                        });
                    });
                });


                //if user is in approval queue section, then expand unscheduled view automatically
                if (query['query[subSec]'] == 'approvequeue') {
                    $prompt.trigger('mousedown');
                }
            }
            else {
                $unScheduledSec.empty();
            }
        },
        complete: function () { /*always silent */
        },
        abort: function () { /*always silent*/
        }
    }, 'qm');
};

scheduler.unscheduledApproval.insert = function (wrapper) {
    if (Object.prototype.hasOwnProperty.call(wrapper,'nonGrouped')) {
        fnInsertNonGroupedMsgs(wrapper.nonGrouped);
    }
    if (Object.prototype.hasOwnProperty.call(wrapper,'grouped')) {
        fnInsertGroupedMsgs(wrapper.grouped);
    }
};

scheduler.unscheduledApproval.remove = async function (approvalId, isGroupMode) {
    const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS);

    var $groupDiv;
    if (isGroupMode) {
        if (hasCustomApprovals) {
            // Clean up message actions component before removal
            var $groupActionsNode = $('#unscheduled_approval_' + approvalId).find('._customApprovalActions')[0];
            if ($groupActionsNode) {
                messageActionsFactory.remove($groupActionsNode);
            }
        }

        $('#unscheduled_approval_' + approvalId).closest("._itemWrapper").remove();
    }
    else {
        //check to see if this message is part of a group, if so, remove sn avatar from the group avatars as well, and if all individual msgs removed, then remove the group as well
        var $msgDiv = $('#unscheduled_approval_' + approvalId);
        $groupDiv = $msgDiv.closest("._groupedUnscheduledApproval");
        if ($groupDiv.length == 1) {
            var $counter = $groupDiv.find("._networkGroup ._profileCount");
            var count = parseInt($counter.text(), 10);
            if (count <= 1) {  //if this is the only one left, then remove whole group
                $groupDiv.remove();
            }
            else {
                count--;
                $counter.text(count);
                var snId = $msgDiv.attr('snid');
                $groupDiv.find("._networkGroup ._profile[snid='" + snId + "']").remove(); //PLEASE DON'T ADD ANY TIME DELAYED EFFECTS, AS NEXT STATEMENT WILL COUNT VISIBLE ONES

                if (hasCustomApprovals) {
                    var $groupIcon;

                    if ($groupDiv.find('._unScheduledApprovalInGroup').length > 1 && $groupDiv.find('._unScheduledApprovalInGroup').first().attr('snID') === snId) {
                        // If the first social network in the group is being removed, replace the icon with the next social network in the group
                        var $nextMessageInGroup = $groupDiv.find("._unScheduledApprovalInGroup").first().next();
                        $groupIcon = $nextMessageInGroup.find(".networkType").clone();
                        var nextSnId = $nextMessageInGroup.attr('snID');
                        $groupIcon.removeClass("networkType");
                        $groupIcon.addClass("profile _profile _jsTooltip");
                        $groupIcon.attr('snid', nextSnId);
                        $groupDiv.find("._networkGroup").prepend($groupIcon);
                    }
                } else {
                    //if there are less than 5 shown avatars, then show the first hidden avatar
                    if ($groupDiv.find("._networkGroup ._profile").filter(":visible").length < 5) {
                        $groupDiv.find("._networkGroup ._profile").filter(":hidden").first().show();
                    }
                }
            }
        }

        if (hasCustomApprovals) {
            // Clean up message actions component before removal
            var $msgActionsNode = $msgDiv.find('._customApprovalActions')[0];
            if ($msgActionsNode) {
                messageActionsFactory.remove($msgActionsNode);
            }
        }

        $msgDiv.remove();

        if (hasCustomApprovals) {
            scheduler.unscheduledApproval.resize();
        }
    }
};

scheduler.unscheduledApproval.resize = async function () {
    var $unscheduled = $('#schedulerSection ._unscheduledApprovalSec ._unscheduled');
    var fullHeight;

    const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS);

    if (hasCustomApprovals) {
        if ($unscheduled.find('._unscheduledApproval').length === 0 && $unscheduled.find('._groupedUnscheduledApproval').length === 0) {
            $unscheduled.remove();
        } else {
            fullHeight = $unscheduled.find('._close').outerHeight() + $unscheduled.find('._itemListWrapper').outerHeight();
            $unscheduled.css('height', fullHeight);
        }
    } else {
        if ($unscheduled.find('._unscheduledApproval').length === 0) {
            $unscheduled.remove();
        } else {
            fullHeight = $unscheduled.find('._close').outerHeight() + $unscheduled.find('._itemListWrapper').outerHeight();
            $unscheduled.css('height', fullHeight);
        }
    }
};
