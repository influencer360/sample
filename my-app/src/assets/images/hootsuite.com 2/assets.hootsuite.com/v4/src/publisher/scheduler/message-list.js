import $ from 'jquery';
import _ from 'underscore';
import hootbus from 'utils/hootbus';
import schedulerUtil from 'publisher/scheduler/util';
import messagePreScreen from 'publisher/scheduler/messages/pre-screen';
import messagesActions from 'publisher/scheduler/messages-actions';
import { getSubtitlesVttUrl } from 'fe-pnc-lib-utils';
import { getSubtitlesVttLang } from 'fe-pnc-lib-utils';
import messageActionsFactory from '../../../src/components/publisher/message-actions-factory';
import Constants from 'components/publisher/constants';
import renderButton from '../../../src/components/render-button';
import hsEjs from 'utils/hs_ejs';
import translation from 'utils/translation';

import { CUSTOM_APPROVALS } from 'fe-lib-entitlements';
import { hasEntitlement } from 'fe-pnc-data-entitlements';

window.scheduler = window.scheduler || {};

/**
 * object to manage message List view
 * @module publisher/scheduler/message-list
 */
scheduler.messageList = {};

var fnCreateDateSlot = function (ts) {  //create a new date slot if it doesn't exist yet. and return it
        var msgDateTs = fnGetDateTs(ts);
        if ($("#dateslot_" + msgDateTs).length < 1) {
            var dateSlotHtml = hsEjs.getEjs('publisher/scheduler/dateslot').render({
                'msgDateTs': msgDateTs,
                'msgDateString': fnGetDateTsAsString(ts)
            });

            var curSlots = [];
            var $list = $("#schedulerSection ._content ._messageListView");
            $list.find("._dateslot").each(function (i) {
                curSlots[i] = parseInt($(this).attr('id').replace("dateslot_", ""), 10);
            });

            var subSec = schedulerUtil.getSubSection();

            if (curSlots.length < 1) {
                $list.append(dateSlotHtml);
            }
            else {
                if (subSec === 'pastscheduled') {
                    // the pastscheduled list view is sorted in descending order (Most Recent -> Less Recent)
                    curSlots.sort();    // start our loop at the oldest date and work our way to the most recent
                    $.each(curSlots, function (i, e) {
                        if (e > msgDateTs) {
                            $("#dateslot_" + e).after(dateSlotHtml);
                            return false;
                        }
                        else if (i < (curSlots.length - 1)) {  //if there are still more to search and the next one is gt msgDateTs, then insert before next
                            var next = curSlots[i + 1];
                            if (next > msgDateTs) {
                                $("#dateslot_" + next).after(dateSlotHtml);
                                return false;
                            }
                        }
                        else { //last item still can't find right slot, so just insert at the end
                            $("#dateslot_" + e).before(dateSlotHtml);
                            return false;
                        }
                    });
                } else {

                    $.each(curSlots, function (i, e) {
                        if (e > msgDateTs) {
                            $("#dateslot_" + e).before(dateSlotHtml);
                            return false;
                        }
                        else if (i < (curSlots.length - 1)) {  //if there are still more to search and the next one is gt msgDateTs, then insert before next
                            var next = curSlots[i + 1];
                            if (next > msgDateTs) {
                                $("#dateslot_" + next).before(dateSlotHtml);
                                return false;
                            }
                        }
                        else { //last item still can't find right slot, so just insert at the end
                            $("#dateslot_" + e).after(dateSlotHtml);
                            return false;
                        }
                    });

                }

            }
        }

        return $("#dateslot_" + msgDateTs);
    },
    fnHasValidAttachments = function (attachments, hasCustomApprovals) {
        if (hasCustomApprovals) {
            return (attachments && _.isArray(attachments) && attachments.length > 0 && (attachments[0].mimeType || attachments[0].youtubeEmbedUrl));
        } else {
            return (attachments && _.isArray(attachments) && attachments.length > 0 && attachments[0].mimeType);
        }
    },
    fnGetDateTs = function (ts) {
        var incomingDate = new Date(ts * 1000);
        return Math.round(Date.UTC(incomingDate.getUTCFullYear(), incomingDate.getUTCMonth(), incomingDate.getUTCDate()) / 1000);
    },
    fnGetDateTsAsString = function (ts) {
        var incomingDate = new Date(ts * 1000);
        var now = new Date(fnGetNow() * 1000);

        //pick the correct format
        var format;
        if (now.getUTCFullYear() == incomingDate.getUTCFullYear()) {
            if (now.getUTCMonth() == incomingDate.getUTCMonth() && now.getUTCDate() == incomingDate.getUTCDate()) {
                return translation._("Today");
            }
            else {
                format = "dddd, mmm d";
            }
        }
        else {
            format = "dddd, mmm d yyyy";
        }
        return incomingDate.format("UTC:" + format);
    },
    fnGetNow = function () {
        if (!vMyNow) {
            var now = new Date();
            var myNow = new Date(now.getTime() + hs.timezoneOffset * 1000);
            vMyNow = Math.round(myNow.getTime() / 1000);
        }
        return vMyNow;
    },

    fnInsertNonGroupedMessages = function (messages) {
        $.each(messages, async function (i, message) {
            const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

            //if message already exists then don't create again
            if (schedulerUtil.isAllowInsertIntoView(false, hasCustomApprovals) && $("#message_" + message._id).length < 1) {
                var $dateSlot = $(fnCreateDateSlot(message.sendDate));
                var msgHtml = null;
                var videoLink = null;
                var thumbnailLink = null;
                var imgData = null;

                if (hasCustomApprovals && message.type !== 'YOUTUBECHANNEL') {
                    var attachments = message.attachments;

                    if (fnHasValidAttachments(attachments, hasCustomApprovals)) {
                        if (attachments[0].mimeType === 'video/mp4') {
                            videoLink = attachments[0].url;
                            thumbnailLink = attachments[0].thumbnailUrl;
                        } else if (message.attachments[0].mimeType.indexOf('image') > -1) {
                            var imgArray = _.map(attachments, function (attachment) { return attachment.url; });
                            imgData = {
                                'imageNum': imgArray.length,
                                'images': imgArray.toString()
                            };
                        }
                    }

                    msgHtml = hsEjs.getEjs('publisher/scheduler/nongroupedmessage').render({
                        u_escape: _.escape,
                        'imgData': imgData,
                        'message': message,
                        'approval': false,
                        'isScheduled': true,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        'schedulerUtil': schedulerUtil,
                        hasCustomApprovals: true,
                    });
                } else {
                    if (message.attachments != null && message.attachments.length > 0 && message.attachments[0].mimeType === 'video/mp4') {
                        videoLink = message.attachments[0].url;
                        thumbnailLink = message.attachments[0].thumbnailUrl;
                    }

                    msgHtml = hsEjs.getEjs('publisher/scheduler/nongroupedmessage').render({
                        u_escape: _.escape,
                        'message': message,
                        'approval': false,
                        'isScheduled': true,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        hasCustomApprovals: false,
                    });
                }

                fnFindTimeslotAndInsert($dateSlot, msgHtml, message.sendDate);

                if (hasCustomApprovals) {
                    if (message.type !== 'YOUTUBECHANNEL') {
                        var isLegacy = true;
                        var $msg = $("._message[mid='" + message._id + "']").first();
                        var $container = $msg.find('._customApprovalActions')[0];
                        if ($msg.attr('islegacy') === 'false') {
                            isLegacy = false;
                        }

                        if ($container) {
                            messageActionsFactory.renderAsSingleMessage($container, message, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                        }
                    }
                }

            }
        });
    },
    fnInsertNonGroupedApprovalMessages = function (approvals) {
        var now = fnGetNow();
        $.each(approvals, async function (i, approval) {
            const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

            //if approval already exists then don't create again
            if (schedulerUtil.isAllowInsertIntoView(true, hasCustomApprovals) && $("#approval_" + approval._id).length < 1) {
                var $dateSlot = $(fnCreateDateSlot(approval.message.sendDate));
                var msgHtml = null;
                var videoLink = null;
                var thumbnailLink = null;
                var imgData = null;

                if (hasCustomApprovals) {
                    var attachments = approval.message.attachments;

                    if (fnHasValidAttachments(attachments, hasCustomApprovals)) {
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

                    //quick trick to change data to appear as in user's timezone
                    approval.message.createdDate = approval.message.createdDate + hs.timezoneOffset;
                    approval.message._id = approval._id;
                    approval.message.canEdit = approval.canEdit;

                    approval.message.isApproval = true;

                    msgHtml = hsEjs.getEjs('publisher/scheduler/nongroupedmessage').render({
                        u_escape: _.escape,
                        'message': approval.message,
                        'approval': approval,
                        'imgData': imgData,
                        'isScheduled': true,
                        'now': now,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        'schedulerUtil': schedulerUtil,
                        hasCustomApprovals: true,
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
                        'isScheduled': true,
                        'now': now,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        hasCustomApprovals: false,
                    });
                }

                fnFindTimeslotAndInsert($dateSlot, msgHtml, approval.message.sendDate);

                if (hasCustomApprovals) {
                    var isLegacy = true;
                    var $msg = $("._approval[mid='" + approval._id + "']").first();
                    var $container = $msg.find('._customApprovalActions')[0];
                    if ($msg.attr('islegacy') === 'false') {
                        isLegacy = false;
                    }

                    if ($container) {
                        messageActionsFactory.renderAsSingleApproval($container, approval, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                    }

                }
            }
        });
    },
    fnInsertNonGroupedOldMessages = function (messages) {
        $.each(messages, async function (i, message) {
            //if message already exists then don't create again
            if ($("#message_" + message._id).length < 1) {
                var $dateSlot = $(fnCreateDateSlot(message.sendDate));
                var msgHtml = null;
                var videoLink = null;
                var thumbnailLink = null;
                var imgData = null;

                const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

                if (hasCustomApprovals && message.type !== 'YOUTUBECHANNEL') {
                    var attachments = message.attachments;

                    if (fnHasValidAttachments(attachments, hasCustomApprovals)) {
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

                    msgHtml = hsEjs.getEjs('publisher/scheduler/nongroupedoldmessage').render({
                        'imgData': imgData,
                        'message': message,
                        'approval': false,
                        'isScheduled': true,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        'schedulerUtil': schedulerUtil,
                        hasCustomApprovals: true,
                    });
                } else {
                    if (message.attachments != null && message.attachments.length > 0 && message.attachments[0].mimeType == 'video/mp4') {
                        videoLink = message.attachments[0].url;
                        thumbnailLink = message.attachments[0].thumbnailUrl;
                    }
                    msgHtml = hsEjs.getEjs('publisher/scheduler/nongroupedoldmessage').render({
                        'message': message,
                        'approval': false,
                        'isScheduled': true,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        hasCustomApprovals: false,
                    });
                }

                fnFindTimeslotAndInsert($dateSlot, msgHtml, message.sendDate);

                if (hasCustomApprovals) {
                    var isLegacy = true;
                    var $msgContainer = $("[mid='" + message._id + "']");
                    var $msgActionContainer = $msgContainer.find('._customApprovalActions')[0];
                    if ($msgContainer.attr('islegacy') === 'false') {
                        isLegacy = false;
                    }

                    if ($msgActionContainer) {
                        messageActionsFactory.renderAsSingleMessage($msgActionContainer, message, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                    }
                }
            }
        });
    },
    fnInsertGroupedOldMessages = function (groups) {
        $.each(groups, async function (groupHash, group) {
            //if group already exists then don't create again
            if ($("#group_" + groupHash).length < 1) {
                var firstMsg = group.messages[0];
                var $dateSlot = $(fnCreateDateSlot(firstMsg.sendDate));
                var groupHtml = null;
                var videoLink = null;
                var thumbnailLink = null;
                var imgData = null;

                const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

                if (hasCustomApprovals) {
                    var attachments = firstMsg.attachments;

                    if (fnHasValidAttachments(attachments, hasCustomApprovals)) {
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

                    groupHtml = hsEjs.getEjs('publisher/scheduler/groupedoldmessage').render({
                        'groupHash': groupHash,
                        'group': group,
                        'firstMsg': firstMsg,
                        'firstApproval': false,
                        'imgData': imgData,
                        'isScheduled': true,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        hasCustomApprovals: true,
                    });
                } else {
                    if (firstMsg.attachments != null && firstMsg.attachments.length > 0 && firstMsg.attachments[0].mimeType == 'video/mp4') {
                        videoLink = firstMsg.attachments[0].url;
                        thumbnailLink = firstMsg.attachments[0].thumbnailUrl;
                    }

                    groupHtml = hsEjs.getEjs('publisher/scheduler/groupedoldmessage').render({
                        'groupHash': groupHash,
                        'group': group,
                        'firstMsg': firstMsg,
                        'firstApproval': false,
                        'isScheduled': true,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        hasCustomApprovals: false,
                    });
                }

                fnFindTimeslotAndInsert($dateSlot, groupHtml, firstMsg.sendDate);
            }
        });
    },
    fnInsertGroupedMessages = function (groups) {
        $.each(groups, async function (groupHash, group) {
            const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

            //if group already exists then don't create again
            if (schedulerUtil.isAllowInsertIntoView(false, hasCustomApprovals) && $("#group_" + groupHash).length < 1) {
                var firstMsg = group.messages[0];
                var $dateSlot = $(fnCreateDateSlot(firstMsg.sendDate));
                var groupHtml = null;
                var videoLink = null;
                var thumbnailLink = null;
                var imgData = null;

                if (hasCustomApprovals) {
                    var attachments = firstMsg.attachments;

                    if (fnHasValidAttachments(attachments, hasCustomApprovals)) {
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
                        'firstMsg': firstMsg,
                        'firstApproval': false,
                        'imgData': imgData,
                        'isScheduled': true,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        'schedulerUtil': schedulerUtil,
                        hasCustomApprovals: true,
                    });
                } else {
                    if (firstMsg.attachments != null && firstMsg.attachments.length > 0 && firstMsg.attachments[0].mimeType === 'video/mp4') {
                        videoLink = firstMsg.attachments[0].url;
                        thumbnailLink = firstMsg.attachments[0].thumbnailUrl;
                    }
                    groupHtml = hsEjs.getEjs('publisher/scheduler/groupedmessage').render({
                        'groupHash': groupHash,
                        'group': group,
                        'firstMsg': firstMsg,
                        'firstApproval': false,
                        'isScheduled': true,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        hasCustomApprovals: false,
                    });
                }

                fnFindTimeslotAndInsert($dateSlot, groupHtml, firstMsg.sendDate, group.messages.length);

                if (hasCustomApprovals) {
                    var isLegacy = true;
                    var $msg = $("#group_" + groupHash).first();
                    var $groupActionContainer = $msg.find('._customApprovalActions')[0];

                    if ($msg.attr('islegacy') === 'false') {
                        isLegacy = false;
                    }

                    if ($groupActionContainer) {
                        messageActionsFactory.renderAsGroupedMessage($groupActionContainer, group, firstMsg, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                    }

                    $.each(group.messages, function (i, message) {
                        var $msgContainer = $msg.find("._groupMessage[mid='" + message._id + "']");
                        var $msgActionContainer = $msgContainer.find('._groupedMessageActions')[0];
                        if ($msgActionContainer) {
                            messageActionsFactory.renderAsSingleMessage($msgActionContainer, message, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                        }
                    });

                }
            }
        });
    },
    fnInsertGroupedApprovalMessages = function (groups) {
        var now = fnGetNow();
        $.each(groups, async function (groupHash, group) {
            const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

            //if group already exists then don't create again
            if (schedulerUtil.isAllowInsertIntoView(true, hasCustomApprovals) && $("#group_approval_" + groupHash).length < 1) {
                var firstApproval = group.approvals[0];
                var $dateSlot = $(fnCreateDateSlot(firstApproval.message.sendDate));
                var groupHtml = null;
                var videoLink = null;
                var thumbnailLink = null;
                var imgData = null;

                if (hasCustomApprovals) {
                    var attachments = firstApproval.message.attachments;

                    if (fnHasValidAttachments(attachments, hasCustomApprovals)) {
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

                    //quick trick to change data to appear as in user's timezone
                    firstApproval.message.createdDate = firstApproval.message.createdDate + hs.timezoneOffset;

                    groupHtml = hsEjs.getEjs('publisher/scheduler/groupedmessage').render({
                        'groupHash': groupHash,
                        'group': group,
                        'firstMsg': firstApproval.message,
                        'firstApproval': firstApproval,
                        'imgData': imgData,
                        'isScheduled': true,
                        'now': now,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        'schedulerUtil': schedulerUtil,
                        hasCustomApprovals: true,
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
                        'isScheduled': true,
                        'now': now,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        hasCustomApprovals: false,
                    });
                }

                fnFindTimeslotAndInsert($dateSlot, groupHtml, firstApproval.message.sendDate, group.approvals.length);

                if (hasCustomApprovals) {
                    var isLegacy = true;
                    var $msg = $("#group_approval_" + groupHash).first();
                    var $groupActionContainer = $msg.find('._customApprovalActions')[0];
                    // Add the group hash to the message object so it can be used in the component
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
    fnInsertGroupedPreScreenMessages = function (groups) {
        $.each(groups, function (groupHash, group) {
            //if group already exists then don't create again
            if ($("._grouped._preScreen_" + groupHash).length < 1) {
                var firstPreScreen = group.messages[0];
                var $dateSlot = $(fnCreateDateSlot(firstPreScreen.message.sendDate));
                var groupHtml = messagePreScreen.renderGroup(groupHash, group);
                fnFindTimeslotAndInsert($dateSlot, groupHtml, firstPreScreen.message.sendDate);
            }
        });
    },
    fnInsertNonGroupedPreScreenMessages = function (preScreens) {
        $.each(preScreens, function (i, preScreen) {
            //if draft already exists then don't create again
            if ($("._preScreen_" + preScreen._id).length < 1) {
                var $dateSlot = $(fnCreateDateSlot(preScreen.message.sendDate));
                var msgHtml = messagePreScreen.renderNonGroup(preScreen);
                fnFindTimeslotAndInsert($dateSlot, msgHtml, preScreen.message.sendDate);
            }
        });
    },
    fnInsertCombinedNonGroupedMessages = function (messages) {
        $.each(messages, async function (i, message) {
            //if message already exists then don't create again
            if ($("[mid='" + message._id + "']").length < 1) {
                var $dateSlot = $(fnCreateDateSlot(message.sendDate));
                var videoLink = null;
                var videoSubtitlesUrl = null;
                var videoSubtitlesLang = null;
                var thumbnailLink = null;
                var msgHtml = null;
                var imgData = null;
                var approval = null;
                var imgArray = [];

                const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

                if (hasCustomApprovals) {
                    var attachments = message.attachments;

                    if (fnHasValidAttachments(attachments, hasCustomApprovals)) {
                        if (attachments[0].mimeType && attachments[0].mimeType === 'video/mp4') {
                            videoLink = attachments[0].url;
                            thumbnailLink = attachments[0].thumbnailUrl;
                            videoSubtitlesUrl = getSubtitlesVttUrl(attachments[0]);
                            videoSubtitlesLang = getSubtitlesVttLang(attachments[0]);
                        } else if (attachments[0].mimeType && attachments[0].mimeType.indexOf('image') > -1) {
                            imgArray = _.map(attachments, function (attachment) { return attachment.url; });

                            imgData = {
                                'imageNum': imgArray.length,
                                'images': imgArray.toString()
                            };
                        } else if (attachments[0].youtubeEmbedUrl) {
                            videoLink = attachments[0].youtubeEmbedUrl;
                            thumbnailLink = attachments[0].thumbnailUrl;
                        }
                    }

                    if (message.isApproval) {
                        approval = {
                            _id: message._id,
                            canApprove: message.canApprove,
                            canDelete: message.canDelete,
                            canEdit: message.canEdit,
                            isRejected: message.isRejected,
                            message: message
                        };
                    }

                    var msgData = {
                        u_escape: _.escape,
                        'message': message,
                        'approval': approval,
                        'imgData': imgData,
                        'isScheduled': true,
                        'videoLink': videoLink,
                        'videoSubtitlesUrl': videoSubtitlesUrl,
                        'videoSubtitlesLang': videoSubtitlesLang,
                        'thumbnail': thumbnailLink,
                        'now': fnGetNow(),
                        'schedulerUtil': schedulerUtil,
                        hasCustomApprovals: true,
                    };

                    msgHtml = hsEjs.getEjs('publisher/scheduler/nongroupedmessage').render(msgData);

                } else {
                    if (message.attachments != null && message.attachments.length > 0 && message.attachments[0].mimeType === 'video/mp4') {
                        videoLink = message.attachments[0].url;
                        thumbnailLink = message.attachments[0].thumbnailUrl;
                    }

                    msgHtml = hsEjs.getEjs('publisher/scheduler/nongroupedmessage').render({
                        u_escape: _.escape,
                        'message': message,
                        'approval': message,
                        'isScheduled': true,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        hasCustomApprovals: false,
                    });
                }

                fnFindTimeslotAndInsert($dateSlot, msgHtml, message.sendDate);

                if (hasCustomApprovals) {
                    var isLegacy = true;
                    var $msgContainer = $("[mid='" + message._id + "']");
                    var $msgActionContainer = $msgContainer.find('._customApprovalActions')[0];
                    if ($msgContainer.attr('islegacy') === 'false') {
                        isLegacy = false;
                    }

                    if ($msgActionContainer) {
                        if (message.isApproval) {
                            messageActionsFactory.renderAsSingleApproval($msgActionContainer, approval, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                        } else {
                            messageActionsFactory.renderAsSingleMessage($msgActionContainer, message, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                        }

                    }
                }
            }
        });
    },
    fnInsertCombinedGroupedMessages = function (groups) {
        $.each(groups, async function (groupHash, group) {
            //if group already exists then don't create again
            if ($("#group_" + groupHash).length < 1) {
                var firstMsg = group[0];
                var $dateSlot = $(fnCreateDateSlot(firstMsg.sendDate));
                var videoLink = null;
                var thumbnailLink = null;
                var groupHtml = null;
                var imgData = null;

                const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

                // Placing group into format expected by ejs template to avoid having to create an entirely new template
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

                if (hasCustomApprovals) {
                    var attachments = firstMsg.attachments;

                    if (fnHasValidAttachments(attachments, hasCustomApprovals)) {
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

                    var msgData = {
                        'groupHash': firstMsg.groupHash,
                        'group': groupWrapper,
                        'firstMsg': firstMsg,
                        'firstApproval': firstMsg.isApproval ? groupWrapper.approvals[0] : false,
                        'imgData': imgData,
                        'isScheduled': true,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        schedulerUtil: schedulerUtil,
                        hasCustomApprovals: true,
                    };

                    groupHtml = hsEjs.getEjs('publisher/scheduler/groupedmessage').render(msgData);

                } else {
                    if (firstMsg.attachments != null && firstMsg.attachments.length > 0 && firstMsg.attachments[0].mimeType === 'video/mp4') {
                        videoLink = firstMsg.attachments[0].url;
                        thumbnailLink = firstMsg.attachments[0].thumbnailUrl;
                    }

                    groupHtml = hsEjs.getEjs('publisher/scheduler/groupedmessage').render({
                        'groupHash': firstMsg.groupHash,
                        'group': groupWrapper,
                        'firstMsg': firstMsg,
                        'firstApproval': firstMsg,
                        'isScheduled': true,
                        'videoLink': videoLink,
                        'thumbnail': thumbnailLink,
                        hasCustomApprovals: false,
                    });
                }

                fnFindTimeslotAndInsert($dateSlot, groupHtml, firstMsg.sendDate, group.length);

                if (hasCustomApprovals) {
                    var $msg;
                    var $groupActionContainer;
                    // Add the group hash to the message object so it can be used in the component
                    var groupObj = _.extend(groupWrapper, {groupHash: firstMsg.groupHash});
                    var isApproval = firstMsg.isApproval;
                    var isLegacy = true;

                    if (isApproval) {
                        $msg = $("#group_approval_" + firstMsg.groupHash).first();
                        $groupActionContainer = $msg.find('._customApprovalActions')[0];

                        if ($msg.attr('islegacy') === 'false') {
                            isLegacy = false;
                        }

                        if ($groupActionContainer) {
                            messageActionsFactory.renderAsGroupedApproval($groupActionContainer, groupObj, groupObj.approvals[0], isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                        }

                        $.each(groupWrapper.approvals, function (i, approval) {
                            var $msgContainer = $msg.find("[mid='" + approval._id + "']");
                            var $msgActionContainer = $msgContainer.find('._groupedMessageActions')[0];

                            if ($msgActionContainer) {
                                messageActionsFactory.renderAsSingleApproval($msgActionContainer, approval, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                            }
                        });

                    } else {
                        $msg = $("#group_" + firstMsg.groupHash).first();
                        $groupActionContainer = $msg.find('._customApprovalActions')[0];

                        if ($msg.attr('islegacy') === 'false') {
                            isLegacy = false;
                        }

                        if ($groupActionContainer) {
                            messageActionsFactory.renderAsGroupedMessage($groupActionContainer, groupObj, firstMsg, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                        }

                        $.each(groupWrapper.messages, function (i, message) {
                            var $msgContainer = $msg.find("[mid='" + message._id + "']");
                            var $msgActionContainer = $msgContainer.find('._groupedMessageActions')[0];

                            if ($msgActionContainer) {
                                messageActionsFactory.renderAsSingleMessage($msgActionContainer, message, isLegacy, schedulerUtil.showHideMessageOptionsMenu);
                            }
                        });
                    }
                }
            }
        });
    },
    fnFindTimeslotAndInsert = function (dateSlot, html, ts, numMessages) {  //insert an item into the correct time slot within the provided date slot
        var $dateSlot = $(dateSlot);
        var $itemList = $dateSlot.find("._itemList");
        var curTimeSlots = [];

        numMessages = (typeof numMessages !== 'undefined') ? numMessages : 1;
        var scheduledMessagesCount = parseInt($dateSlot.find(".sectionTitle .scheduledMessageCount ._messageCount").text(), 10) + numMessages;
        $dateSlot.find(".sectionTitle .scheduledMessageCount ._messageCount").text(scheduledMessagesCount);

        $itemList.find("._itemWrapper").each(function () {
            curTimeSlots.push(parseInt($(this).attr('ts'), 10));
        });

        if (curTimeSlots.length < 1) {
            $itemList.append(html);
        }
        else {
            $.each(curTimeSlots, function (i, e) {
                if (e == ts) {
                    //there could be multiple with the same timestamp, so insert after the last one
                    $itemList.find("._itemWrapper[ts='" + e + "']").last().after(html);
                    return false;
                }
                if (e > ts) {
                    $itemList.find("._itemWrapper[ts='" + e + "']").first().before(html);
                    return false;
                }
                else if (i < (curTimeSlots.length - 1)) {
                    var next = curTimeSlots[i + 1];
                    if (next > ts) {
                        $itemList.find("._itemWrapper[ts='" + next + "']").first().before(html);
                        return false;
                    }
                }
                else {
                    $itemList.find("._itemWrapper[ts='" + e + "']").last().after(html);
                    return false;
                }
            });
        }
    },
    fnWrapperHasData = function (msgWrapper) {
        return (Object.prototype.hasOwnProperty.call(msgWrapper,'nonGroupedApprovalMessages') && _.values(msgWrapper.nonGroupedApprovalMessages).length > 0) ||
            (Object.prototype.hasOwnProperty.call(msgWrapper,'groupedApprovalMessages') && _.values(msgWrapper.groupedApprovalMessages).length > 0) ||
            (Object.prototype.hasOwnProperty.call(msgWrapper,'nonGroupedMessages') && _.values(msgWrapper.nonGroupedMessages).length > 0) ||
            (Object.prototype.hasOwnProperty.call(msgWrapper,'groupedMessages') && _.values(msgWrapper.groupedMessages).length > 0) ||
            (Object.prototype.hasOwnProperty.call(msgWrapper,'groupedOldMessages') && _.values(msgWrapper.groupedOldMessages).length > 0) ||
            (Object.prototype.hasOwnProperty.call(msgWrapper,'nonGroupedOldMessages') && _.values(msgWrapper.nonGroupedOldMessages).length > 0) ||
            (Object.prototype.hasOwnProperty.call(msgWrapper,'groupedPreScreenMessages') && _.values(msgWrapper.groupedPreScreenMessages).length > 0) ||
            (Object.prototype.hasOwnProperty.call(msgWrapper,'nonGroupedPreScreenMessages') && _.values(msgWrapper.nonGroupedPreScreenMessages).length > 0) ||
            (Object.prototype.hasOwnProperty.call(msgWrapper,'nonGrouped') && _.values(msgWrapper.nonGrouped).length > 0) ||
            (Object.prototype.hasOwnProperty.call(msgWrapper,'grouped') && _.values(msgWrapper.grouped).length > 0)
            ;

    },
    vMyNow;  //a unit timestamp represents now

scheduler.messageList.loadingUIHelper = function (regularFromTs) {
    var $scheduler = $("#schedulerSection");
    var isStartOver = (regularFromTs === 0);

    //if starting over, then make sure user has at least one social network to access
    //also reset load more button's timestamp back to 0
    if (isStartOver) {

        if (!_.keys(hs.socialNetworks).length) {
            $scheduler.find("._content ._messageListView").empty().append($scheduler.find("._noSocialNetworkMsg").clone(true).removeClass("hidden"));
            return;
        }
        $scheduler.find("._content ._messageListView").empty();
    }
};

scheduler.messageList.postLoadUIHelper = function (regularFromTs, data, hasCustomApprovals) {
    var isStartOver = (regularFromTs === 0);
    var $scheduler = $("#schedulerSection");

    if (hasCustomApprovals) {
        $scheduler.find('._content ._messageListView').removeClass('noMessages');
    }

    if (data) {
        //if starting over, not any filters applied, and there are no messages, then show "no message created" message to user
        if (isStartOver && !fnWrapperHasData(data)) {
            //if no filter has been selected, then show big splash no message call to action, otherwise just show no message found error
            if (schedulerUtil.isFilterEmpty()) {
                if (hasCustomApprovals) {
                    var subSection = schedulerUtil.getSubSection();
                    var hasScheduledMessages = $('._messageListView').find('._itemList').length > 0;

                    if (subSection === 'scheduled' && !hasScheduledMessages) {
                        scheduler.messageList.showNoMessages();
                    } else {
                        schedulerUtil.renderNoMessagesInListView([Constants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES, Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES, Constants.COLLAPSIBLE_LIST_TYPES.FAILED_MESSAGES]);
                    }
                } else {
                    $scheduler.find("._content ._messageListView").empty().append($scheduler.find("._noMessagesMsg").clone().removeClass("hidden"));
                }
            }
            else {
                scheduler.messageList.renderNoScheduledMessagesView();
            }
            return;
        }
    }


    $('#selectAllMessagesCb').prop('checked', false);
    messagesActions.disableOptions();

};

scheduler.messageList.renderNoScheduledMessagesView = function () {
    if ($('._messageListView').find('._itemList').length === 0) {
        var $scheduler = $("#schedulerSection");

        if (schedulerUtil.getSubSection() === 'scheduled') {
            var contentText = translation._("Create your posts in advance, then schedule them to publish automatically throughout the week.");
            if (hs.memberMaxScheduledMessages !== Constants.FEATURE_UNLIMITED) {
                contentText = translation._("Create your posts in advance, then schedule up to %n posts to publish automatically throughout the week.")
                    .replace('%n', hs.memberMaxScheduledMessages.toString());
            }
            var $noScheduledMessagesView = $('<div class="noScheduledMessages _noResults"></div>');
            var headerText = translation._("Save time by scheduling posts");
            $noScheduledMessagesView.append('<img src="../images/publisher/scheduling-graphic.svg"/>');
            $noScheduledMessagesView.append('<p class="noMessageHeader"><b>' + headerText + '</b></p>');
            $noScheduledMessagesView.append('<p class="noMessageContent">' + contentText + '</p>');
            $noScheduledMessagesView.append('<div class="noMessageButton _noMessageButton"></div>');
            renderButton(
                $noScheduledMessagesView.find('._noMessageButton')[0],
                {
                    onClick: function () {
                        hootbus.emit('composer.open', {});
                    },
                    trackingOrigin: 'web.dashboard.publisher.list_view',
                    trackingAction: 'schedule_a_message_clicked'
                },
                translation._("Schedule a post")
            );
            $scheduler.find("._content ._messageListView").append($noScheduledMessagesView);
        } else {
            $scheduler.find("._content ._messageListView").empty().append("<p class='noResults _noResults'>" + translation._("No Results Found") + "</p>");
        }
    }
};

scheduler.messageList.loadCombinedMessages = function (fromTs, limit, callback, hasCustomApprovals) {

    //for from timestamps, negative means no results. 0 means start over. greater than 0 means real timestamp
    fromTs = isNaN(parseInt(fromTs, 10)) ? 0 : parseInt(fromTs, 10);

    scheduler.messageList.loadingUIHelper(fromTs);
    hs.statusObj.update(translation.c.LOADING, 'info');

    var successCb = function (data) {
        scheduler.messageList.insert(data, hasCustomApprovals);
        scheduler.messageList.postLoadUIHelper(fromTs, data, hasCustomApprovals);
        scheduler.messageList.initLoadMore(data, hasCustomApprovals);
    };

    schedulerUtil.getMessages(schedulerUtil.collectSearchQueryForCombinedMessages(fromTs, limit), schedulerUtil.getLoadUrl(), successCb, callback, function () {}, null);
};

/**
 * After messages have been loaded, render them into the view
 *
 * @param data
 * @param {boolean} hasCustomApprovals
 */
scheduler.messageList.onLoadSuccess = function (data, hasCustomApprovals) {
    if (data) {
        scheduler.messageList.insert(data, hasCustomApprovals);
    }
    scheduler.messageList.initLoadMore(data, hasCustomApprovals);
};

/**
 * Number of messages to get in each request
 * @type {number}
 */
if (hs.isFeatureEnabled('PUB_5556_INCREASED_PAGINATION_LIMIT_BY_ORG')) {
    // A fix for pagination issues caused by users having a large amount of grouped/ungrouped messages in the same timeslots
    scheduler.messageList.numMessagesToLoad = 200;
} else {
    scheduler.messageList.numMessagesToLoad = 100;
}


/**
 * Initialize the load more functionality. This will either show the load more spinner and start listening for the
 * scroll event, or remove it.
 *
 * @param {boolean} hasCustomApprovals
 * @param data
 */
scheduler.messageList.initLoadMore = function (data, hasCustomApprovals) {
    scheduler.messageList.nextTs = scheduler.messageList.findNextTsFromData(data);

    if (scheduler.messageList.nextTs && scheduler.messageList.hasMoreMessages(data, hasCustomApprovals)) {
        scheduler.messageList.showLoadMoreSpinner();
        scheduler.messageList.listenForScroll();
    } else {
        scheduler.messageList.hideLoadMoreSpinner();
        scheduler.messageList.stopListeningForScroll();
    }
};

/**
 * Returns true if there are more messages that can be retrieved
 * @param data
 * @param {boolean} hasCustomApprovals
 * @returns {boolean}
 */
scheduler.messageList.hasMoreMessages = function (data, hasCustomApprovals) {
    if (!data || !data.grouped || !data.nonGrouped) {
        return false;
    }

    // Adding in a fail safe here, if we get 80% of the limit then we should assume there might be more messages, as
    // errors have occurred in the endpoint before leading to less results than the limit, so better to be safe than
    // sorry (assuming 100%)
    if (hasCustomApprovals) {
        return (_.flatten(data.grouped).length + data.nonGrouped.length) >= (scheduler.messageList.numMessagesToLoad * 0.8);
    } else {
        return (data.grouped.length + data.nonGrouped.length) >= (scheduler.messageList.numMessagesToLoad * 0.8);
    }
};

/**
 * Show the load more spinner
 */
scheduler.messageList.showLoadMoreSpinner = function () {
    var $loadMoreContainer = $("#schedulerSection ._loadMore");
    $loadMoreContainer.show().find('img').show();

    // Hide the button, we only want to see the spinner
    $loadMoreContainer.find('._loadMoreBtn').hide();
};

/**
 * Hide the load more spinner
 */
scheduler.messageList.hideLoadMoreSpinner = function () {
    $("#schedulerSection ._loadMore").hide();
};

/**
 * Listen out for the scroll event and attach the infinite scroll method to it
 */
scheduler.messageList.listenForScroll = function () {
    $("#schedulerSection ._content").unbind('scroll.updateSchedulerList').bind('scroll.updateSchedulerList', scheduler.messageList.infiniteScroll);
};

/**
 * Stop listening for the scroll event
 */
scheduler.messageList.stopListeningForScroll = function () {
    $("#schedulerSection ._content").unbind('scroll.updateSchedulerList');
};

/**
 * Find the next timestamp to get messages from (for load more)
 * @param data
 * @returns {*}
 */
scheduler.messageList.findNextTsFromData = function (data) {

    // Return false if no more messages
    if (!data || (!data.grouped.length && !data.nonGrouped.length)) {
        return false;
    }

    var mostRecent = 0;

    // Find latest for grouped
    for (var i = 0; i < data.grouped.length; i++) {

        // We only have to check the first in the group, since all the send dates are the same
        if (data.grouped[i][0]['originalSendDate'] > mostRecent) {
            mostRecent = data.grouped[i][0]['originalSendDate'];
        }
    }

    // Find latest for nonGrouped
    for (i = 0; i < data.nonGrouped.length; i++) {
        if (data.nonGrouped[i]['originalSendDate'] > mostRecent) {
            mostRecent = data.nonGrouped[i]['originalSendDate'];
        }
    }
    // list view has user adjusted time, this will unadjust it
    return mostRecent + 1 - hs.timezoneOffset;
};

/**
 * loads messages based on the timestamps in the parameters or defaults and inserts the messages into either messageList or messageListDrafts based on the insert function used
 * @param {int} regularFromTs The timestamp to load regular messages from
 * @param {int} approvalFromTs The timestamp to load appoval messages from
 * @param {int} createdNextTs The timestamp to load drafts from
 * @param {function} callback A callback function at the end of loadMessages
 * @param {function} insertFunc The insert function to use for inserting messages into a list scheduler.messageList.insert or scheduler.messageListDrafts.insert
 * @param {boolean} hasCustomApprovals
 *
 * @returns {boolean}
 */
scheduler.messageList.loadMessages = function (regularFromTs, approvalFromTs, createdNextTs, callback, insertFunc, hasCustomApprovals) {
    //if use switch out side of list view, then stop

    if (!schedulerUtil.isInListView()) {
        return false;
    }

    var $scheduler = $("#schedulerSection"),
        $loadMoreContainer = $scheduler.find("._loadMore"),
        $loadMoreBtn = $loadMoreContainer.find("._loadMoreBtn"),
        $loadMoreThrobber = $loadMoreContainer.find("img"),
        query = schedulerUtil.collectSearchQuery();

    var now = new Date(),
        nowTs = Math.round(now.getTime() / 1000);  //this is UTC timestamp, which is what backend expects

    var regularToTs = nowTs - 300;

    // for past scheduled messages, retrieve from up to 3 months ago
    var past = new Date();
    past.setMonth(past.getMonth() - 3);
    var pastTs = Math.round(past.getTime() / 1000);

    //for from timestamps, negative means no results. 0 means start over. greater than 0 means real timestamp
    regularFromTs = isNaN(parseInt(regularFromTs, 10)) ? 0 : parseInt(regularFromTs, 10);
    approvalFromTs = isNaN(parseInt(approvalFromTs, 10)) ? 0 : parseInt(approvalFromTs, 10);

    createdNextTs = isNaN(parseInt(createdNextTs, 10)) ? 0 : parseInt(createdNextTs, 10);

    var isStartOver = (regularFromTs === 0) && (approvalFromTs === 0),
        isNoMoreMsgs = (regularFromTs < 0) && (approvalFromTs < 0); //if both regular and approval are less than 0, it means no more results for neither

    if (!createdNextTs || createdNextTs <= 0) {

        if (isNoMoreMsgs) {
            $loadMoreBtn.attr("regularfromts", -1);
            $loadMoreBtn.attr("approvalfromts", -1);
            return;
        }

    }

    //if starting over, then make sure user has at least one social network to access
    //also reset load more button's timestamp back to 0
    if (isStartOver) {
        $loadMoreBtn.attr("regularfromts", 0);
        $loadMoreBtn.attr("approvalfromts", 0);

        if (!_.keys(hs.socialNetworks).length) {
            $loadMoreContainer.hide();
            $scheduler.find("._content ._messageListView").empty().append($scheduler.find("._noSocialNetworkMsg").clone(true).removeClass("hidden"));
            return;
        }
    }

    query.getRegular = regularFromTs < 0 ? 0 : query.getRegular;  //if regularFromTs is less than 0, it means no more results for regular message, so set the flag to 0
    query.getApproval = approvalFromTs < 0 ? 0 : query.getApproval; //if approvalFromTs is less than 0, it means no more results for approval message, so set the flag to 0
    query.createdNextTs = createdNextTs;

    if (query.getRegular) {
        if (Object.prototype.hasOwnProperty.call(query,'passedOnly') && query.passedOnly) {

            /*
             * If regularFromTs is set, then we are loading additional messages into the list.
             * We are searching backwards, so wset regularToTs as fromTs
             */
            if (regularFromTs !== 0) {
                regularToTs = regularFromTs;
            }

            query.regularFromTs = pastTs;
            query.regularToTs = regularToTs;
        } else {
            query.regularFromTs = regularFromTs === 0 ? nowTs : regularFromTs; //if regularFromTs is 0, means start over, which is UTC now
        }
    }
    if (query.getApproval) {
        if (Object.prototype.hasOwnProperty.call(query,'getPastUnapproved') && query.getPastUnapproved) {
            query.approvalFromTs = pastTs;
        }
        else {
            query.approvalFromTs = approvalFromTs === 0 ? nowTs : approvalFromTs; //if approvalFromTs is 0, means start over, which is UTC now
        }

        if (Object.prototype.hasOwnProperty.call(query,'hideFutureApproval') && query.hideFutureApproval) {
            query.approvalToTs = nowTs;
        }
    }

    $loadMoreThrobber.show();
    $loadMoreBtn.hide();

    // additional data to pass into search query, based on subsection
    var $filter = $("#schedulerSection ._filter"),
        $subSec = $filter.find("input._subSec"),
        subSec = $subSec.val();
    if (subSec === 'pastscheduled') {
        query.sort = 'descending';      // need to sort by descending for past scheduled to show most recent first
    }

    schedulerUtil.searchMessages(query, function (data) {

        //if start over the search, empty the view before reloading the whole list
        if (isStartOver) {
            $scheduler.find("._content ._messageListView").empty();
            $scheduler.find("._content").unbind('scroll.updateSchedulerList').bind('scroll.updateSchedulerList', scheduler.messageList.infiniteScroll);
        }
        if (Object.prototype.hasOwnProperty.call(data,'messagesWrapper')) {
            //if starting over, not any filters applied, and there are no messages, then show "no message created" message to user
            if (isStartOver && !fnWrapperHasData(data.messagesWrapper)) {
                //if no filter has been selected, then show big splash no message call to action, otherwise just show no mesage found error
                if (schedulerUtil.isFilterEmpty()) {
                    if (!hasCustomApprovals) {
                        $scheduler.find("._content ._messageListView").empty().append($scheduler.find("._noMessagesMsg").clone().removeClass("hidden"));
                    }
                }
                else {
                    scheduler.messageList.renderNoScheduledMessagesView();
                }
                $loadMoreContainer.hide();
                return;
            }

            if (typeof insertFunc !== 'undefined' && _.isFunction(insertFunc)) {
                insertFunc(data.messagesWrapper);
            } else {
                scheduler.messageList.insert(data.messagesWrapper);
            }

            var doScroll = false;
            //Now handle the load more button based on whether there are more regular or approval messages
            //if one of approval/regular messages have more results, then show load more button and trigger infinit scroll
            if (parseInt(data.regularNextTs, 10) > 0 || parseInt(data.approvalNextTs, 10) > 0 || parseInt(data.createdNextTs, 10) > 0) {
                $loadMoreContainer.show();
                doScroll = true;
            }
            else {
                $loadMoreContainer.hide();
            }

            $loadMoreBtn.attr("regularfromts", data.regularNextTs);
            $loadMoreBtn.attr("approvalfromts", data.approvalNextTs);
            $loadMoreBtn.attr("createdNextTs", data.createdNextTs);

            //this must wait for $loadMoreBtn's timestamp attribute set with new value
            if (doScroll) {
                $scheduler.find("._content").triggerHandler('scroll');
            }
        }
        else { //if messagesWrapper doesnt exist, there was a problem. show the 'load more' button so user can manually load more
            $loadMoreContainer.show();
            $loadMoreThrobber.hide();
        }


        $('#selectAllMessagesCb').prop('checked', false);
        messagesActions.disableOptions();

        $.isFunction(callback) && callback();
    });
};

scheduler.messageList.triggerInfiniteLoad = function () {
    $("#schedulerSection ._content").triggerHandler('scroll');
};

scheduler.messageList.insert = function (msgWrapper, hasCustomApprovals) {
    if (hasCustomApprovals) {
        var $scheduler = $('#schedulerSection');

        $scheduler.find('._content ._messageListView').removeClass('noMessages');
        // Remove any helper text on the screen that indicates a lack of messages
        $scheduler.find('._noResults, ._noMessagesMsg:visible, ._publisherNoMessages, ._noMessageWarning')
            // If any of them are present, remove them
            .each(function (i, warningEl) {
                $(warningEl).remove();
            });

    } else {
        // Remove any helper text on the screen that indicates a lack of messages
        $('#schedulerSection').find('._noResults, ._noMessagesMsg:visible, ._publisherNoMessages')
            // If any of them are present, remove them
            .each(function (i, warningEl) {
                $(warningEl).remove();
            });
    }


    if (Object.prototype.hasOwnProperty.call(msgWrapper,'nonGroupedApprovalMessages')) {
        fnInsertNonGroupedApprovalMessages(msgWrapper.nonGroupedApprovalMessages);
    }
    if (Object.prototype.hasOwnProperty.call(msgWrapper,'groupedApprovalMessages')) {
        fnInsertGroupedApprovalMessages(msgWrapper.groupedApprovalMessages);
    }
    if (Object.prototype.hasOwnProperty.call(msgWrapper,'nonGroupedMessages')) {
        fnInsertNonGroupedMessages(msgWrapper.nonGroupedMessages);
    }
    if (Object.prototype.hasOwnProperty.call(msgWrapper,'groupedMessages')) {
        fnInsertGroupedMessages(msgWrapper.groupedMessages);
    }
    if (Object.prototype.hasOwnProperty.call(msgWrapper,'nonGroupedOldMessages')) {
        fnInsertNonGroupedOldMessages(msgWrapper.nonGroupedOldMessages);
    }
    if (Object.prototype.hasOwnProperty.call(msgWrapper,'groupedOldMessages')) {
        fnInsertGroupedOldMessages(msgWrapper.groupedOldMessages);
    }
    if (Object.prototype.hasOwnProperty.call(msgWrapper,'groupedPreScreenMessages')) {
        fnInsertGroupedPreScreenMessages(msgWrapper.groupedPreScreenMessages);
    }
    if (Object.prototype.hasOwnProperty.call(msgWrapper,'nonGroupedPreScreenMessages')) {
        fnInsertNonGroupedPreScreenMessages(msgWrapper.nonGroupedPreScreenMessages);
    }

    // handle cases from new data format
    if (Object.prototype.hasOwnProperty.call(msgWrapper,'grouped')) {
        fnInsertCombinedGroupedMessages(msgWrapper.grouped);
    }
    if (Object.prototype.hasOwnProperty.call(msgWrapper,'nonGrouped')) {
        fnInsertCombinedNonGroupedMessages(msgWrapper.nonGrouped);
    }

    if (hasCustomApprovals) {
        if (Object.prototype.hasOwnProperty.call(msgWrapper,'grouped') || Object.prototype.hasOwnProperty.call(msgWrapper,'nonGrouped')) {
            scheduler.loadInlineRedirectNotification(msgWrapper);
        }
    }

    vMyNow = null;  //must reset vMyNow to null so later on it will be recalculated
};

scheduler.messageList.removeEmptyMessage = function () {
    var $noSNMessage = $('#schedulerSection ._messageListView ._noSocialNetworkMsg');

    // If the "no social network" message is visible, remove it
    $noSNMessage.length && $noSNMessage.remove();
};

// Listen for when a social network is added - on success, remove the empty message
hootbus.on('socialNetwork:refresh:success', scheduler.messageList.removeEmptyMessage);

scheduler.messageList.remove = function (messageId, isGroupMode, isApproval, hasCustomApprovals) {
    var $dateSlot = null,
        $groupDiv = null;

    if (isGroupMode) {
        $groupDiv = isApproval ? $('#approval_' + messageId).closest("._itemWrapper") : $('#message_' + messageId).closest("._itemWrapper");
        $dateSlot = $groupDiv.closest("._dateslot");

        if (hasCustomApprovals) {
            // Clean up message actions component before removal
            var $groupActionsNode = $groupDiv.find('._customApprovalActions')[0];
            if ($groupActionsNode) {
                messageActionsFactory.remove($groupActionsNode);
            }
        }

        $groupDiv.remove();
    }
    else {
        //check to see if this message is part of a group, if so, remove sn avatar from the group avatars as well, and if all individual msgs removed, then remove the group as well
        var $msgDiv = null;

        if (hasCustomApprovals) {
            $msgDiv = $('div[mid=' + messageId + ']');
        } else {
            $msgDiv = isApproval ? $('#approval_' + messageId) : $('#message_' + messageId);
        }

        if (hasCustomApprovals) {
            if ($msgDiv.hasClass('_unscheduledApproval') || $msgDiv.hasClass('_unScheduledApprovalInGroup')) {
                return;
            }
        }

        $groupDiv = isApproval ? $msgDiv.closest("._groupedApproval") : $msgDiv.closest("._groupedMessages");

        if (hasCustomApprovals) {
            if (!$groupDiv.length) {
                $groupDiv = $msgDiv.closest('._groupedUnscheduledApproval');
            }
        }

        $dateSlot = $msgDiv.closest("._dateslot");
        var $counter, count;
        if ($groupDiv.length == 1) {
            $counter = $groupDiv.find(".message #groupSize");
            count = parseInt($counter.text().split(' ')[0], 10);

            var snId = $msgDiv.attr('snid');
            count--;
            if (count <= 1) {  //if this is the only one left, then remove whole group
                scheduler.messageList.loadMessages(undefined, undefined, undefined, undefined, undefined, );
            } else {
                $groupDiv.find("._networkGroup ._profile[snid='" + snId + "']").remove();

                var $nextMessageInGroup, nextSnId;
                $counter.text(count + ' messages');
                parseInt($groupDiv.find(".createdTime #groupCountLessOne").html(count - 1));
                // if the group being deleted is the current first group, then change the username being shown
                if ($groupDiv.find('._groupMessage').first().attr('snID') === snId) {
                    $nextMessageInGroup = $groupDiv.find("._groupMessage").first().next();
                    nextSnId = $nextMessageInGroup.attr('snID');
                    var nextSnUsername = hs.socialNetworks[nextSnId].username;
                    $groupDiv.find(".createdTime #firstSnUsername").text(nextSnUsername);
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
    }

    //if nothing left for the day, then remove the date slot
    if ($dateSlot.length === 1 && $dateSlot.find("._itemList ._itemWrapper").length < 1) {
        $dateSlot.remove();
    }
};

scheduler.messageList.sort = function (order) {
    // This function doesn't actually sort them, it just assumes that default order was ascending and reverses it if needed
    var $messageListView = $('._messageListView');
    var currentOrder = $messageListView.attr('order') || 'ascending';
    if (order != currentOrder) {
        // reverse everything
        if (currentOrder == 'ascending') {
            $messageListView.attr('order', 'descending');
        } else {
            $messageListView.attr('order', 'ascending');
        }
        $messageListView.find('._dateslot').each(function () {
            var $dateslot = $(this);

            $dateslot.find(".itemWrapper").each(function () {
                $(this).parent().prepend($(this));
            });
            $dateslot.parent().prepend($(this));
        });
    }
};

scheduler.messageList.sortAscending = function () {
    scheduler.messageList.sort("ascending");
};

scheduler.messageList.sortDescending = function () {
    scheduler.messageList.sort("descending");
};

/**
 * check that for the provided timestamp (ts) is allowed to be inserted into the current list view
 * if it's earlier than or equal to the range of all the date slots currently displayed, then allow insert
 * if it's later than all the date slots,
 *        if load more button is hidden, then yes can insert
 *    if load more button is shown, then no can't insert
 * for example if currently user has loaded all msgs from Jan 1 to Jan 31 2011 on screen, and if timestamp is Feb 2 2011, then return false.
 * if the timestamp is Jan 15 2010, or Dec 5th 2010, then return true
 */
scheduler.messageList.isInsertPermitted = function (ts) {
    var isPastMode = $('#publisherSidebar .tab._pastscheduled').hasClass('active'),
        dateNow = new Date(),
        nowTs = Math.round(dateNow.getTime() / 1000) - (dateNow.getTimezoneOffset() * 60),
        $dateSlots = $("#schedulerSection ._content  ._messageListView ._dateslot");

    if (isPastMode && ts > nowTs) {
        return false;
    }

    //if no date slot in display yet, then return true
    if ($dateSlots.length < 1) {
        return true;
    }

    var msgDateTs = fnGetDateTs(ts);
    var lastDateSlotTs = parseInt($dateSlots.last().attr("id").replace("dateslot_", ""), 10);
    if (msgDateTs > lastDateSlotTs) {
        if ($("#schedulerSection ._loadMore:visible").length) {
            return false;
        }
        else {
            return true;
        }
    }
    else {
        return true;
    }
};

/*Infinite scroll to be bound to message list*/
scheduler.messageList.infiniteScroll = function () {

    var DELAY = 150,	// milli seconds till function execution
        timerId = 'schedulerList',

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
            try {
                var $listContent = $('#schedulerSection');

                if ($listContent.find('._loadMore img:visible').length && $listContent.find('._loadMore').position().top - $listContent.find('._content').height() < 100) {
                    _.defer(function () {
                        $listContent.find('._loadMore:visible ._loadMoreBtn').triggerHandler('click');
                    });
                }
            } catch (err) {
                // comment added to remove eslint error
            }

            fnClearTimer();
        };

    fnClearTimer();
    hs.timers[timerId] = setTimeout(fnCheckScroll, DELAY);
};

scheduler.messageList.showNoMessages = function () {
    var $scheduler = $('#schedulerSection');
    var subSec = schedulerUtil.getSubSection();
    var html = '';

    if (subSec === 'scheduled') {
        html = '<h2 class="_noMessageWarning">' + translation._('You have no scheduled messages') + '</h2>';
    } else if (subSec === 'approvequeue') {
        html = '<h2 class="_noMessageWarning">' + translation._('You have no messages that require your approval') + '</h2>';
    } else if (subSec === 'pendingapproval') {
        html = '<h2 class="_noMessageWarning">' + translation._('You have no messages that are pending approval') + '</h2>';
    } else if (subSec === 'expired') {
        html = '<h2 class="_noMessageWarning">' + translation._('You have no expired messages') + '</h2>';
    } else if (subSec === 'rejected') {
        html = '<h2 class="_noMessageWarning">' + translation._('You have no rejected messages') + '</h2>';
    }

    $scheduler.find('._content ._messageListView')
        .empty()
        .append(html)
        .addClass('noMessages');
};
