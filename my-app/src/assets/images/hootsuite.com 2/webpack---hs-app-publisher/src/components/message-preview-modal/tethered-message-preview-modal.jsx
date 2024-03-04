/**
 * @format
 * @preventMunge
 */

import React from 'react'
import _ from 'underscore'
import { getSubtitlesVttUrl, getSubtitlesVttLang } from 'fe-pnc-lib-utils'
import domUtils from 'hs-nest/lib/utils/dom-utils'
import hootbus from 'hs-nest/lib/utils/hootbus'
import TetheredElement from 'hs-nest/lib/utils/tethered-element'
import Constants from '../../constants/constants'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import MessagePreviewModal from './message-preview-modal'

const { SN_TYPES } = SocialProfileConstants

let tetheredMessagePreviewModal = null

const handleVideoThumbnailClick = (messageObj, showVideoPopup) => {
  showVideoPopup(
    messageObj.originalAttachmentUrl,
    messageObj.thumbnailUrl,
    null,
    getSubtitlesVttUrl(messageObj),
    getSubtitlesVttLang(messageObj),
    messageObj.socialNetworkType,
  )
}

const handleYoutubeVideoThumbnailClick = (messageObj, showYoutubeVideoPopup) => {
  showYoutubeVideoPopup(messageObj.youtubeEmbedUrl)
}

const _shouldUpdateInPreview = (messageProps, messageObj) => {
  const isCommentOrReply = messageProps.isComment || messageProps.isReply
  let snType

  if (isCommentOrReply && messageObj.socialNetworkId) {
    snType = messageProps.socialNetworks[messageObj.socialNetworkId].type
    return _.contains(Constants.SN_UPDATE_COMMENT_IN_PREVIEW, snType)
  } else {
    return false
  }
}

const handleEditClick = (messageProps, showEditModal, isApproval, messageObj, isReply, isLocked) => {
  if (_shouldUpdateInPreview(messageProps, messageObj)) {
    const actions = messageObj.actions
    let isRejected = false

    if (actions && _.isArray(actions)) {
      isRejected = actions[actions.length - 1].actionType === Constants.APPROVAL_ACTION_TYPES.REJECT
    }

    const pendingComment = {
      canApprove: messageObj.hasApprovePermission,
      commentId: messageObj.messageId,
      createdDate: messageObj.createdDate,
      isEditing: true,
      message: messageObj.message,
      sequenceNumber: messageObj.sequenceNumber,
      socialNetworkAvatar: messageProps.socialNetworks[messageObj.socialNetworkId].avatar,
      socialNetworkId: messageObj.socialNetworkId,
      socialNetworkName: messageProps.socialNetworks[messageObj.socialNetworkId].username,
      userId: messageProps.socialNetworks[messageObj.socialNetworkId].userId,
      rootId: messageObj.rootId,
      parentId: messageObj.parentId,
      isRejected: isRejected,
    }

    const data = {
      boxType: 'PENDING_COMMENT_MODAL',
      messageId: messageObj.rootId ? messageObj.rootId : messageObj.parentId,
      socialNetworkId: messageObj.socialNetworkId,
      socialNetworkType: messageProps.socialNetworks[messageObj.socialNetworkId].type,
      pendingComment: pendingComment,
    }

    hootbus.emit('publisher:renderPendingCommentModal', data)
  } else {
    const isExpired = messageProps.type === Constants.APPROVALS.TYPE.EXPIRED

    showEditModal({
      asset: null,
      contentLibraryId: null,
      isApproval,
      isExpired,
      isGroupMode: messageProps.isGroupMessage,
      isLegacy: messageProps.isLegacy,
      isLocked,
      isNewDraft: null,
      isPreScreen: messageProps.isPreScreen,
      isReply,
      isTemplate: false,
      messageId: messageProps.messageId,
      messageListId: null,
      messageType: null,
      org: null,
      snIds: messageProps.isGroupMessage ? messageObj.socialNetworkIds : messageObj.socialNetworkId,
    })
  }
}

const TetheredMessagePreviewModal = {
  createPopoverV2: ({
    element,
    groupHash,
    isApproval,
    isGroupMessage,
    isLegacy,
    isLocked,
    isPreScreen,
    isUnscheduled,
    memberId,
    messageActions,
    messageId,
    sendDate,
    showEditModal,
    showVideoPopup,
    showYoutubeVideoPopup,
    socialNetworks,
    timezoneOffset,
    type,
    view,
  }) => {
    let offset = '0 0'
    let attachment = 'top right'
    let targetAttachment = 'top right'
    let cleanupAndDestroy
    let isComment = false
    let isReply = false
    let isFailed = false
    let messageItemWrapper = document.querySelector(`._itemWrapper[mid="${messageId}"]`)
    if (messageItemWrapper) {
      isFailed = messageItemWrapper.classList.contains('_failed')
      isComment = messageItemWrapper.classList.contains('_commentItem')
      isReply = messageItemWrapper.classList.contains('_replyItem')
    }

    const trackedEventOccurred = (action, data) => {
      hootbus.emit(
        'hs.app.web.tracked_event_occurred',
        'web.dashboard.publisher.custom_approval',
        action,
        data,
      )
    }

    const onClose = e => {
      const container = document.querySelector('._messagePreviewModal')
      if (
        container &&
        container !== e.target &&
        !container.contains(e.target) &&
        e.target.classList &&
        !e.target.classList.contains('_ui-widget-overlay') &&
        !domUtils.closest(e.target, '.rc-ModalBase') &&
        !domUtils.closest(e.target, '._imageLightboxClose')
      ) {
        cleanupAndDestroy()
      }
    }

    cleanupAndDestroy = () => {
      const itemWrappers = document.querySelectorAll('._itemWrapper .itemInfo')

      // Remove the active class if we're in the list view
      if (itemWrappers && itemWrappers.length) {
        _.forEach(itemWrappers, itemWrapper => itemWrapper.classList.remove('active'))
      }

      if (tetheredMessagePreviewModal) {
        tetheredMessagePreviewModal.destroy()
      }

      document.body.removeEventListener('click', onClose)
    }

    const getMsgIdsAndSeqNums = messageObj => {
      if (isGroupMessage) {
        // We don't support MRS message groups yet, so no sequence numbers for this situation
        return messageObj.messageIds.map(id => {
          return {
            id: id,
            sequenceNumber: -1,
          }
        })
      }

      return [
        {
          id: messageObj.messageId,
          sequenceNumber: messageObj.sequenceNumber ? messageObj.sequenceNumber : -1,
        },
      ]
    }

    const getSocialNetworkIds = messageObj => {
      return isGroupMessage ? messageObj.socialNetworkIds : [messageObj.socialNetworkId]
    }

    const handleLeftButtonClick = (messageProps, messageObj) => {
      const onCompleteCallback = () => {
        TetheredMessagePreviewModal.destroyPopover()
      }

      let socialNetworkIds
      let msgIdsAndSeqNums
      let props

      const isExpired = messageProps.type === Constants.APPROVALS.TYPE.EXPIRED

      let snType

      if (messageObj.socialNetworkId) {
        snType = messageProps.socialNetworks[messageObj.socialNetworkId].type
      }

      if (messageObj.hasApprovePermission && isApproval && !isExpired) {
        socialNetworkIds = getSocialNetworkIds(messageObj)
        msgIdsAndSeqNums = getMsgIdsAndSeqNums(messageObj)
        messageActions.approveMessage(msgIdsAndSeqNums, socialNetworkIds, isGroupMessage, onCompleteCallback)
      } else if (messageProps.isApproval && messageProps.isFailed) {
        props = {
          isComment: messageProps.isComment,
          isReply: messageProps.isReply,
          messageId: messageProps.messageId,
          sequenceNumber: messageObj.sequenceNumber,
        }
        messageActions.retry(props, onCompleteCallback)
      } else if (
        (messageProps.isComment && snType === SN_TYPES.INSTAGRAM) ||
        (messageProps.isApproval && messageObj.isPrivateMessage && !messageObj.hasApprovePermission)
      ) {
        msgIdsAndSeqNums = getMsgIdsAndSeqNums(messageObj)
        messageActions.renderMessageDeleteModal({
          callbackFn: onCompleteCallback,
          isApproval,
          isDraft: false,
          isGroup: isGroupMessage,
          isLegacy,
          isPreScreen,
          messageId,
          msgIdsAndSeqNums,
          socialNetworkIds: getSocialNetworkIds(messageObj),
        })
      } else {
        handleEditClick(messageProps, showEditModal, isApproval, messageObj, isReply, isLocked)
      }
    }

    const handleRightButtonClick = messageObj => {
      const socialNetworkIds = getSocialNetworkIds(messageObj)

      const onCompleteCallback = () => {
        TetheredMessagePreviewModal.destroyPopover()
      }

      const msgIdsAndSeqNums = getMsgIdsAndSeqNums(messageObj)

      if (messageObj.hasApprovePermission && isApproval && !isLegacy) {
        messageActions.renderRejectModal(
          msgIdsAndSeqNums,
          socialNetworkIds,
          isGroupMessage,
          onCompleteCallback,
        )
      } else {
        messageActions.renderMessageDeleteModal({
          callbackFn: onCompleteCallback,
          isApproval,
          isDraft: type === Constants.APPROVALS.TYPE.DRAFT,
          isExpired: type === Constants.APPROVALS.TYPE.EXPIRED,
          isGroup: isGroupMessage,
          isLegacy,
          isPreScreen,
          messageId,
          msgIdsAndSeqNums,
          socialNetworkIds,
        })
      }
    }

    const props = {
      groupHash: groupHash,
      isApproval: isApproval,
      isComment: isComment,
      isFailed: isFailed,
      isGroupMessage: isGroupMessage,
      isLegacy: isLegacy,
      isPreScreen: isPreScreen,
      isReply: isReply,
      isUnscheduled: isUnscheduled,
      memberId: memberId,
      messageId: messageId,
      onClose: cleanupAndDestroy,
      onEditClick: (messageProps, messageObj) =>
        handleEditClick(messageProps, showEditModal, isApproval, messageObj, isReply),
      onFooterLeftBtnClick: (messageProps, messageObj) => handleLeftButtonClick(messageProps, messageObj),
      onFooterRightBtnClick: messageObj => handleRightButtonClick(messageObj),
      onVideoClick: messageObj => handleVideoThumbnailClick(messageObj, showVideoPopup),
      onYoutubeVideoClick: messageObj => handleYoutubeVideoThumbnailClick(messageObj, showYoutubeVideoPopup),
      sendDate: sendDate,
      socialNetworks: socialNetworks,
      timezoneOffset: timezoneOffset,
      type: type,
    }

    trackedEventOccurred(Constants.APPROVAL_TRACKING_ORIGINS.VIEW_PREVIEW, {
      socialNetworkIds: props.socialNetworkIds,
      messageIds: props.messageId,
    })

    if (view === 'agendaDay' || view === 'agendaWeek') {
      offset = '-55px 0'
    } else if (view === 'month') {
      offset = '-16px 0'
      attachment = 'top left'
      targetAttachment = 'top left'
    }

    const tetheredOptions = {
      target: element,
      attachment: attachment,
      targetAttachment: targetAttachment,
      offset: offset,
      followTarget: true,
      constraints: [
        {
          to: 'scrollParent',
          attachment: 'together',
          pin: true,
        },
      ],
    }

    const popover = React.createElement(MessagePreviewModal, props)

    tetheredMessagePreviewModal = new TetheredElement(popover, tetheredOptions)
    tetheredMessagePreviewModal.pushToTop(2001)

    document.body.addEventListener('click', onClose)
  },
  destroyPopover: () => {
    if (tetheredMessagePreviewModal) {
      tetheredMessagePreviewModal.destroy()
    }
  },
}

export default TetheredMessagePreviewModal
