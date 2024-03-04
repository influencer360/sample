/** @preventMunge */
'use strict';

import _ from 'underscore';
import ReactDOM from 'react-dom';
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise';
import translation from 'utils/translation';
import hootbus from 'utils/hootbus';
import $ from 'jquery';
import schedulerUtil from 'publisher/scheduler/util';
import Constants from 'components/publisher/constants';
import getHsAppPublisher from 'components/publisher/get-hs-app-publisher';

const _shouldViewUpdate = (data) => {
    if ((data.grouped && data.grouped.length) || (data.nonGrouped && data.nonGrouped.length)) {
        if (schedulerUtil.getSubSection() === Constants.APPROVALS.TYPE.SCHEDULED ||
            schedulerUtil.getSubSection() === Constants.APPROVALS.TYPE.PENDING_APPROVAL) {
            return true;
        } else if (schedulerUtil.getSubSection() === Constants.APPROVALS.TYPE.REQUIRE_APPROVAL) {
            // In the event that the user can still approve, it should be re-rendered into the approval queue
            if (data.grouped && data.grouped.length) {
                const firstGroup = data.grouped[0];
                const firstMsg = firstGroup[0];
                return firstMsg.canApprove;
            } else if (data.nonGrouped && data.nonGrouped.length) {
                return data.nonGrouped[0].canApprove || (data.nonGrouped[0].permissions && data.nonGrouped[0].permissions.canApprove);
            }
        }
    }

    return false;
};

const _isApprovalUnscheduled = (data) => {
    let approval = {};

    if (data.nonGrouped && data.nonGrouped.length) {
        approval = data.nonGrouped[0];
    } else if (data.grouped && data.grouped.length) {
        const firstGroup = data.grouped[0];
        approval = firstGroup[0];
    }

    return (_.isNull(approval.sendDate) || _.isUndefined(approval.sendDate));
};

const _isCommentOrReply = (data) => {
    let msg = {};

    if (data.nonGrouped && data.nonGrouped.length) {
        msg = data.nonGrouped[0];
    } else if (data.grouped && data.grouped.length) {
        const firstGroup = data.grouped[0];
        msg = firstGroup[0];
    }

    const isCommentOrReply = msg.inReplyToId ? true : false;
    return isCommentOrReply;
};

const _shouldUpdateCollapsibleSection = (data) => {
    const hasCollapsibleSection = schedulerUtil.getSubSection() === Constants.APPROVALS.TYPE.REQUIRE_APPROVAL || schedulerUtil.getSubSection() === Constants.APPROVALS.TYPE.PENDING_APPROVAL;
    return hasCollapsibleSection && (_isApprovalUnscheduled(data) || _isCommentOrReply(data));
};

const _shouldUpdateInPreview = (messageData) => {
    const snType = messageData.socialNetworkId ? hs.socialNetworks[messageData.socialNetworkId].type : null;
    const shouldUpdateInPreview = _.contains(Constants.SN_UPDATE_COMMENT_IN_PREVIEW, snType);
    const isCommentOrReply = messageData.isComment || messageData.isReply;
    return (isCommentOrReply && shouldUpdateInPreview);
}

const _updateMessagesInView = async (messageIds, isGroupMode, data) => {
    const sectionType = schedulerUtil.getCollapsibleSectionByMessageId(messageIds, isGroupMode);
    await scheduler.remove({
        isApproval: true,
        isGroupMode,
        messageId: messageIds,
    });

    if (_shouldViewUpdate(data)) {
        let msgWrapper = {};
        if (data.grouped && data.grouped.length) {
            msgWrapper.grouped = data.grouped;
        }

        if (data.nonGrouped && data.nonGrouped.length) {
            msgWrapper.nonGrouped = data.nonGrouped;
        }

        msgWrapper = schedulerUtil.convertTimestampsToUserTime(msgWrapper);

        if (_shouldUpdateCollapsibleSection(msgWrapper)) {
            scheduler.collapsibleSection.insertCombinedData(sectionType, msgWrapper);
        } else {
            scheduler.insert(msgWrapper);
        }
    }

    scheduler.collapsibleSection.resizeAll();

};

const _approveMessage = function (msgIdsAndSeqNums, socialNetworkIds, isGroupMode, callbackFn) {
    let isComment = false;
    let isReply = false;

    const messageIds = msgIdsAndSeqNums.map(function (msgIdAndSeqNum) {
        return msgIdAndSeqNum.id;
    });
    const sectionType = schedulerUtil.getCollapsibleSectionByMessageId(messageIds[0], false);

    if (sectionType === Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES) {
        isReply = $('._itemWrapper[mid="' + messageIds[0] + '"]').hasClass('_replyItem');
        isComment = !isReply;
    }

    const onApproveSuccess = function (data) {
        hs.statusObj.update(data.statusMsg, data.statusType, true);
        if (data.statusType === 'success') {
            const messageIds = msgIdsAndSeqNums.map(function (msgIdAndSeqNum) {
                return msgIdAndSeqNum.id;
            });
            _updateMessagesInView(messageIds, isGroupMode, data);
        }

        if (callbackFn) {
            callbackFn();
        }
    };

    if (isCommentOrReplyApprovalEnabledSocialNetwork(socialNetworkIds, isComment, isReply)) {
        const commentId = msgIdsAndSeqNums[0].id;
        const sequenceNumber = msgIdsAndSeqNums[0].sequenceNumber;

        getApproveCommentPromise(commentId, sequenceNumber).then((data) => {
            onApproveSuccess(data);
        });
    } else {
        getApproveMessagePromise(msgIdsAndSeqNums, socialNetworkIds).then((data) => {
            onApproveSuccess(data);
        });
    }
};

const _renderRejectModal = function (msgIdsAndSeqNums, socialNetworkIds, isGroupMode, callbackFn, origin) {
    const MESSAGE_REJECT_MODAL = 'messageRejectModal'
    let parentNode = document.getElementById(MESSAGE_REJECT_MODAL);
    let isComment = false;
    let isReply = false;

    if (!parentNode) {
        parentNode = document.createElement('div');
        parentNode.id = MESSAGE_REJECT_MODAL;
        $('body').append(parentNode);
    }

    const messageIds = msgIdsAndSeqNums.map(function (msgIdAndSeqNum) {
        return msgIdAndSeqNum.id;
    });
    const sectionType = schedulerUtil.getCollapsibleSectionByMessageId(messageIds[0], false);

    if (sectionType === Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES) {
        isReply = $('._itemWrapper[mid="' + messageIds[0] + '"]').hasClass('_replyItem');
        isComment = !isReply;
    }

    const onConfirmReject = (msgIdsAndSeqNums, socialNetworkIds, rejectionReason, isGroupMode, callbackFn) => {
        getRejectMessagePromise(msgIdsAndSeqNums, socialNetworkIds, rejectionReason).then((data) => {
            if (data.statusMsg && data.statusType) {
                hs.statusObj.update(data.statusMsg, data.statusType, true);
            }

            if (data.statusType === 'success') {
                const messageIds = msgIdsAndSeqNums.map(function (msgIdAndSeqNum) {
                    return msgIdAndSeqNum.id;
                });
                scheduler.remove({
                    isApproval: true,
                    isGroupMode,
                    messageId: messageIds,
                });
                scheduler.collapsibleSection.resize(Constants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES);
                scheduler.collapsibleSection.resize(Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES);
            }

            if (callbackFn) {
                callbackFn();
            }
        });
    };

    const onConfirmCommentReject = (msgIdsAndSeqNums, socialNetworkIds, rejectionReason, callbackFn) => {
        const commentId = msgIdsAndSeqNums[0].id;
        const sequenceNumber = msgIdsAndSeqNums[0].sequenceNumber;

        getRejectCommentPromise(commentId, sequenceNumber, rejectionReason).then((data) => {
            if (data.statusMsg && data.statusType) {
                hs.statusObj.update(data.statusMsg, data.statusType, true);
            }

            if (data.statusType === 'success') {
                scheduler.remove({
                    isApproval: true,
                    isGroupMode: false,
                    messageId: commentId,
                });
                scheduler.collapsibleSection.resize(Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES);
            }

            if (callbackFn) {
                callbackFn();
            }
        });
    };

    getHsAppPublisher().then(({ renderMessageRejectModal }) => {
        const props = {
            isComment: isComment,
            isGroupMode: isGroupMode,
            isReply: isReply,
            msgIdsAndSeqNums: msgIdsAndSeqNums,
            onConfirmReject: isCommentOrReplyApprovalEnabledSocialNetwork(socialNetworkIds, isComment, isReply) ? onConfirmCommentReject : onConfirmReject,
            socialNetworkIds: socialNetworkIds,
            trackingOrigin: origin,
        };
        renderMessageRejectModal(props, parentNode, MESSAGE_REJECT_MODAL);
    });
};

const _renderMessageDeleteModal = function ({
    isApproval,
    isExpired,
    isGroup,
    isPreScreen,
    messageId,
    msgIdsAndSeqNums,
    socialNetworkIds,
}) {
    const MESSAGE_DELETE_MODAL = 'messageDeleteModal'
    let parentNode = document.getElementById(MESSAGE_DELETE_MODAL);
    let isComment = false;
    let isReply = false;

    if (!parentNode) {
        parentNode = document.createElement('div');
        parentNode.id = MESSAGE_DELETE_MODAL;
        $('body').append(parentNode);
    }

    const messageIds = msgIdsAndSeqNums.map(function (msgIdAndSeqNum) {
        return msgIdAndSeqNum.id;
    });
    const sectionType = schedulerUtil.getCollapsibleSectionByMessageId(messageIds[0], false);

    if (sectionType === Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES) {
        isReply = $('._itemWrapper[mid="' + messageIds[0] + '"]').hasClass('_replyItem');
        isComment = !isReply;
    }

    const onConfirmDelete = (callbackFn) => {

        getDeleteMessagePromise({
            isApproval,
            isGroupMode: isGroup,
            isPreScreen,
            messageId,
            msgIdsAndSeqNums,
            snIds: socialNetworkIds,
        }).then((data) => {
            const sectionType = schedulerUtil.getCollapsibleSectionByMessageId(messageId, isGroup);
            const message = isGroup ? translation._('Messages deleted') : translation._('Message deleted');
            const messageIds = msgIdsAndSeqNums.map(function (msgIdAndSeqNum) {
                return msgIdAndSeqNum.id;
            });

            if (isApproval) {

                if (data.partialDelete) {
                    $.each(data.deletedIds, function (i, e) {
                        scheduler.remove({
                            isApproval: true,
                            isGroupMode: false,
                            isPartial: true,
                            messageId: e,
                        });
                    });
                } else {
                    scheduler.remove({
                        isApproval,
                        isGroupMode: isGroup,
                        isPartial: false,
                        isPreScreen,
                        messageId: messageIds,
                    });
                }

                hs.statusObj.update(message, 'success', true);
            } else {
                if (data.statusMsg !== undefined) {
                    hs.statusObj.update(data.statusMsg, data.statusType, true);
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
                    } else {
                        scheduler.remove({
                            isApproval: false,
                            isGroupMode: isGroup,
                            isPartial: false,
                            isPreScreen,
                            messageId,
                        });
                    }

                    hs.statusObj.update(message, 'success', true);
                    hootbus.emit('message:delete', data.deletedIds);
                }
            }

            scheduler.collapsibleSection.resize(sectionType);

            if (callbackFn) {
                callbackFn();
            }
        });
    };

    const onConfirmDeleteComment = (callbackFn) => {
        const commentId = msgIdsAndSeqNums[0].id;
        const sequenceNumber = msgIdsAndSeqNums[0].sequenceNumber;

        getDeleteCommentPromise(commentId, sequenceNumber).then((data) => {
            hs.statusObj.update(data.statusMsg, data.statusType, true);

            if (data.statusType === 'success') {
                scheduler.remove({
                    isApproval: true,
                    isGroupMode: false,
                    messageId: commentId,
                });
                scheduler.collapsibleSection.resize(Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES);
            }

            if (callbackFn) {
                callbackFn();
            }
        });
    };

    const handleDeleteBtnClick = isCommentOrReplyApprovalEnabledSocialNetwork(socialNetworkIds, isComment, isReply) ? onConfirmDeleteComment : onConfirmDelete;

    getHsAppPublisher().then(({ renderMessageDeleteModal }) => {
        const props = {
            isApproval: isApproval,
            isComment: isComment,
            isExpired: isExpired,
            isGroup: isGroup,
            isReply: isReply,
            onDeleteBtnClick: handleDeleteBtnClick,
        };
        renderMessageDeleteModal(props, parentNode, MESSAGE_DELETE_MODAL);
    });
};

const getRejectMessagePromise = (msgIdsAndSeqNums, socialNetworkIds, rejectionReason) => {

    const postData = {
        msgIdsAndSeqNums: msgIdsAndSeqNums,
        socialNetworkIds: socialNetworkIds.toString(),
        reasons: rejectionReason.toString()
    };

    return ajaxPromise({
        url: '/ajax/message-review/reject-message',
        type: 'POST',
        data: postData
    }, 'qm');
};

const getApproveMessagePromise = (msgIdsAndSeqNums, socialNetworkIds) => {
    const postData = {
        socialNetworkIds: socialNetworkIds.toString(),
        msgIdsAndSeqNums: msgIdsAndSeqNums
    };

    return ajaxPromise({
        url: '/ajax/message-review/approve-message',
        type: 'POST',
        data: postData
    }, 'qm');
};

const getApproveCommentPromise = (commentId, sequenceNumber) => {
    const postData = {
        commentId: commentId,
        sequenceNumber: sequenceNumber
    };

    return ajaxPromise({
        url: '/ajax/message-review/approve-comment',
        type: 'POST',
        data: postData
    }, 'qm');
};

const getDeleteMessagePromise = ({
    isApproval,
    isGroupMode,
    isPreScreen,
    messageId,
    msgIdsAndSeqNums,
    snIds,
}) => {

    isGroupMode = isGroupMode ? 1 : 0;
    let ajaxUrl = '';
    const postData = {};
    postData.isGroupMode = isGroupMode;

    if (isGroupMode) {
        postData.snIds = snIds.join();
    }

    if (isApproval && !isPreScreen) {
        postData.msgIdsAndSeqNums = msgIdsAndSeqNums;

    } else {
        postData.id = messageId;
    }

    if (isPreScreen) {
        ajaxUrl = '/ajax/scheduler/delete-pre-screen-message';
    } else if (isApproval) {
        ajaxUrl = '/ajax/scheduler/delete-approval';
    } else {
        ajaxUrl = '/ajax/scheduler/delete-message';
    }

    return ajaxPromise({
        url: ajaxUrl,
        type: 'POST',
        data: postData
    }, 'qm');
};

const getDeleteCommentPromise = (commentId, sequenceNumber) => {
    return ajaxPromise({
        url: '/ajax/message-review/delete-comment',
        type: 'POST',
        data: {
            commentId: commentId,
            sequenceNumber: sequenceNumber
        }
    }, 'qm');
};

const getRetryPromise = (id, sequenceNumber, url) => {
    return ajaxPromise({
        url,
        type: 'POST',
        data: {
            id,
            sequenceNumber
        }
    }, 'qm');
};

const retry = (props, callbackFn) => {
    const url = props.isComment || props.isReply ? '/ajax/message-review/retry-comment' : '/ajax/message-review/retry-message';
    const id = props.messageId;

    getRetryPromise(id, props.sequenceNumber, url).then((data) => {
        if (data.statusMsg && data.statusType) {
            hs.statusObj.update(data.statusMsg, data.statusType, true);
            if (data.statusType === 'success') {
                scheduler.collapsibleSection.remove(id, false);
                scheduler.collapsibleSection.resize(Constants.COLLAPSIBLE_LIST_TYPES.FAILED_MESSAGES);
                if (callbackFn) {
                    callbackFn();
                }
            }
        }
    }).catch(() => {
        hs.statusObj.update(translation._('An error has occurred. Please try again.'), 'error', true);
    });
};

const editMessageFn = (props) => {
    if (_shouldUpdateInPreview(props.message)) {
        const messageData = props.message;
        const pendingComment = {
            commentId: messageData._id,
            canApprove: props.canApprove,
            createdDate: messageData.createdDate,
            isEditing: true,
            message: messageData.message,
            sequenceNumber: messageData.sequenceNumber,
            socialNetworkAvatar: hs.socialNetworks[messageData.socialNetworkId].avatar,
            socialNetworkId: messageData.socialNetworkId,
            socialNetworkName: hs.socialNetworks[messageData.socialNetworkId].username,
            userId: hs.socialNetworks[messageData.socialNetworkId].userId,
            rootId: messageData.rootId,
            parentId: messageData.parentId,
            isRejected: messageData.isRejected
        };

        const data = {
            boxType: 'PENDING_COMMENT_MODAL',
            messageId: messageData.rootId ? messageData.rootId : messageData.parentId,
            socialNetworkId: messageData.socialNetworkId,
            socialNetworkType: hs.socialNetworks[messageData.socialNetworkId].type,
            pendingComment: pendingComment
        };

        hootbus.emit('publisher:renderPendingCommentModal', data);
    } else {
        scheduler.editMessagePopup({
            asset: null,
            contentLibraryId: null,
            isApproval: props.isApproval,
            isExpired: props.isExpired,
            isGroupMode: props.isGroup,
            isLegacy: Object.prototype.hasOwnProperty.call(props, "isLegacy") ? props.isLegacy : true,
            isLocked: props.isLocked,
            isNewDraft: null,
            isPreScreen: props.message.isPreScreen,
            isReply: props.isReply,
            isTemplate: false,
            messageId: props.messageId,
            messageListId: null,
            messageType: null,
            org: null,
            snIds: props.socialNetworkIds,
        });
    }
};

const getRejectCommentPromise = (commentId, sequenceNumber, rejectionReason) => {
    const postData = {
        commentId: commentId,
        sequenceNumber: sequenceNumber,
        reasons: rejectionReason.toString()
    };

    return ajaxPromise({
        url: '/ajax/message-review/reject-comment',
        type: 'POST',
        data: postData
    }, 'qm');
};

/**
 * Returns whether or not the first social network in the array
 * is a SN that supports Custom Approvals
 *
 * @param {Array} socialNetworkIds
 * @returns {Boolean}
 */
const isCustomApprovalEnabledSocialNetwork = (socialNetworkIds) => {
    return socialNetworkIds &&
        socialNetworkIds[0] &&
        (hs.socialNetworks[socialNetworkIds[0]].type === Constants.SN_TYPES.FACEBOOK ||
            hs.socialNetworks[socialNetworkIds[0]].type === Constants.SN_TYPES.FACEBOOKPAGE ||
            hs.socialNetworks[socialNetworkIds[0]].type === Constants.SN_TYPES.LINKEDIN ||
            hs.socialNetworks[socialNetworkIds[0]].type === Constants.SN_TYPES.LINKEDINCOMPANY ||
            hs.socialNetworks[socialNetworkIds[0]].type === Constants.SN_TYPES.INSTAGRAM ||
            hs.socialNetworks[socialNetworkIds[0]].type === Constants.SN_TYPES.INSTAGRAMBUSINESS ||
            hs.socialNetworks[socialNetworkIds[0]].type === Constants.SN_TYPES.TWITTER);
};

/**
 * Returns whether or not the first social network in the array
 * is a SN that supports Comment/Reply Approvals
 *
 * @param {Array} socialNetworkIds
 * @param {Boolean} isComment
 * @param {Boolean} isReply
 * @returns {Boolean}
 */
const isCommentOrReplyApprovalEnabledSocialNetwork = (socialNetworkIds, isComment, isReply) => {
    return isCustomApprovalEnabledSocialNetwork(socialNetworkIds) && (isComment || isReply);
}

const MessageActionsFactory = {
    renderAsSingleMessage: function (container, msgObj, isLegacy, onShowHideMenu) {
        const message = msgObj;
        const messageId = msgObj._id;
        const canEdit = !!msgObj.canEdit;
        const socialNetworkIds = [message.socialNetworkId];
        const isLocked = message.lockStatus && message.lockStatus.isLocked;

        getHsAppPublisher().then(({ renderMessageActions }) => {
            const props = {
                canApprove: false,
                canEdit: canEdit,
                editMessage: (props) => editMessageFn(props),
                isLegacy: isLegacy,
                isLocked: isLocked,
                message: message,
                messageId: messageId,
                onRetryClick: (props) => retry(props),
                onShowHideMenu: onShowHideMenu,
                renderDeleteModal: this.renderMessageDeleteModal,
                socialNetworkIds: socialNetworkIds,
            };
            renderMessageActions(props, container).then(unmount => {
                container.unmountMessageAction = unmount
            });
        });
    },
    renderAsGroupedMessage: function (container, groupObj, firstMsgObj, isLegacy, onShowHideMenu) {
        const message = firstMsgObj;
        const messageId = firstMsgObj._id;
        const canEdit = !!firstMsgObj.canEdit;
        const socialNetworkIds = groupObj.socialNetworkIds;

        getHsAppPublisher().then(({ renderMessageActions }) => {
            const props = {
                canEdit: canEdit,
                editMessage: (props) => editMessageFn(props),
                group: groupObj,
                isGroup: true,
                isLegacy: isLegacy,
                message: message,
                messageId: messageId,
                onShowHideMenu: onShowHideMenu,
                renderDeleteModal: this.renderMessageDeleteModal,
                socialNetworkIds: socialNetworkIds,
            };
            renderMessageActions(props, container).then(unmount => {
                container.unmountMessageAction = unmount
            });
        });
    },
    renderAsSingleApproval: function (container, approvalObj, isLegacy, onShowHideMenu) {
        const message = approvalObj.message;
        const messageId = approvalObj._id;
        const canApprove = !!approvalObj.canApprove;
        let canEdit = !!approvalObj.canEdit;
        let canDelete = approvalObj.canDelete; //purposely not using !!, canDelete may not be set and may be null. We want to pass in null
        const socialNetworkIds = [message.socialNetworkId];
        let isComment = false;
        const isFailed = $(container).closest('._failed').length > 0;
        const isExpired = schedulerUtil.getSubSection() === Constants.APPROVALS.TYPE.EXPIRED;
        const commentsRepliesClassName = '.' + Constants.COLLAPSIBLE_LIST_TYPE_TO_CLASS[Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES];
        const isReply = $(container).closest('._replyItem').length > 0;

        const isLocked = message.lockStatus && message.lockStatus.isLocked;

        if (!isReply) {
            isComment = $(container).closest(commentsRepliesClassName).length > 0;
        }

        const snType = message.socialNetworkId ? hs.socialNetworks[message.socialNetworkId].type : null;

        if (
            (snType === Constants.SN_TYPES.INSTAGRAM || snType === Constants.SN_TYPES.INSTAGRAMBUSINESS) &&
            (isComment || isReply) &&
            canEdit
        ) {
            // Instagram is an edge case where we allow comments to be deleted, but not edited
            canDelete = true;
            canEdit = false;
        }

        getHsAppPublisher().then(({ renderMessageActions }) => {
            const props = {
                approval: approvalObj,
                approveMessage: this.approveMessage,
                canApprove: canApprove,
                canEdit: canEdit,
                canDelete: canDelete,
                editMessage: (props) => editMessageFn(props),
                isApproval: true,
                isComment: isComment,
                isExpired: isExpired,
                isFailed: isFailed,
                isLegacy: isLegacy,
                isLocked: isLocked,
                isPreScreen: message.isPreScreen,
                isReply: isReply,
                message: message,
                messageId: messageId,
                onRetryClick: (props) => retry(props),
                onShowHideMenu: onShowHideMenu,
                renderDeleteModal: this.renderMessageDeleteModal,
                renderRejectModal: this.renderRejectModal,
                socialNetworkIds: socialNetworkIds,
                sequenceNumber: message.sequenceNumber,
            };
            renderMessageActions(props, container).then(unmount => {
                container.unmountMessageAction = unmount
            });
        });
    },
    renderAsGroupedApproval: function (container, groupObj, firstApprovalObj, isLegacy, onShowHideMenu) {
        const message = firstApprovalObj.message;
        const messageId = firstApprovalObj._id;
        const canApprove = !!firstApprovalObj.canApprove;
        const canEdit = !!firstApprovalObj.canEdit;
        const socialNetworkIds = groupObj.socialNetworkIds;

        getHsAppPublisher().then(({ renderMessageActions }) => {
            const isExpired = schedulerUtil.getSubSection() === Constants.APPROVALS.TYPE.EXPIRED;
            const props = {
                approval: firstApprovalObj,
                approveMessage: this.approveMessage,
                canApprove: canApprove,
                canEdit: canEdit,
                editMessage: (props) => editMessageFn(props),
                group: groupObj,
                isApproval: true,
                isExpired: isExpired,
                isGroup: true,
                isLegacy: isLegacy,
                isPreScreen: message.isPreScreen,
                message: message,
                messageId: messageId,
                onShowHideMenu: onShowHideMenu,
                renderDeleteModal: this.renderMessageDeleteModal,
                renderRejectModal: this.renderRejectModal,
                socialNetworkIds: socialNetworkIds,
            };
            renderMessageActions(props, container).then(unmount => {
                container.unmountMessageAction = unmount
            });
        });
    },
    remove: function (parentNode) {
        if (parentNode.unmountMessageAction) {
            parentNode.unmountMessageAction()
        } else {
            // eslint-disable-next-line no-console
            console.warning("MessageActionsFactory.remove(container) received a non-message-actions container", parentNode)
            ReactDOM.unmountComponentAtNode(parentNode);
        }
    },
    approveMessage: _approveMessage,
    renderRejectModal: _renderRejectModal,
    renderMessageDeleteModal: _renderMessageDeleteModal,
    updateMessagesInView: _updateMessagesInView,
    retry: retry
};


export default MessageActionsFactory;
