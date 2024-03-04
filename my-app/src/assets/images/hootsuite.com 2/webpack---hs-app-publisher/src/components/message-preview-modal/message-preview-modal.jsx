/**
 * @format
 * @preventMunge
 */

import './message-preview-modal.less'

import PropTypes from 'prop-types'
import React from 'react'
import _ from 'underscore'
import classNames from 'classnames'
import moment from 'moment'
import DOMPurify from 'dompurify'
import { CUSTOM_APPROVALS } from 'fe-lib-entitlements'

import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'
import Button from 'hs-nest/lib/components/buttons/button'
import darklaunch from 'hs-nest/lib/utils/darklaunch'
import domUtils from 'hs-nest/lib//utils/dom-utils'
import hootbus from 'hs-nest/lib/utils/hootbus'
import JsxUtils from 'hs-nest/lib/utils/jsx-utils'
import translation from 'hs-nest/lib/utils/translation'
import { proxify } from 'hs-nest/lib/utils/static-assets'
import styled from 'styled-components'
import { venk } from 'fe-hoc-venkman'
import { getSubtitlesVttUrl } from 'fe-pnc-lib-utils'

// logging
import { logError } from 'fe-lib-logging'
import LOGGING_CATEGORIES from '../../constants/logging-categories'

import Constants from '../../constants/constants'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import statusObject from '../../hs-nest-utils/status_bar'
import ComposerUtils from '../../utils/composer-utils'
import StringUtils from '../../utils/string-utils'
import { handleEntitlementCheck } from '../../utils/entitlement-utils'

import MessagePreviewBanner from '../message-preview-banner/message-preview-banner'

/* fe-global */
import Icon from '@fp-icons/icon-base'
import SymbolPlay from '@fp-icons/symbol-play'
import Comment from '@fp-icons/symbol-chat-box'
import Reply from '@fp-icons/action-reply'
import Pencil from '@fp-icons/emblem-pencil'
import HootsuiteAvatarPlaceholder from '@fp-icons/product-logo-hootsuite-avatar-placeholder'
import EmblemTrash from '@fp-icons/emblem-trash'
import ArrowRoundCounterClockwise from '@fp-icons/arrow-round-counter-clockwise'
import XLight from '@fp-icons/symbol-x-light'
import IconCheck from '@fp-icons/symbol-check'

const { SN_TYPES } = SocialProfileConstants
const { makeUrlClickable, makeUsernameClickable, makeHashClickable, makeNonHttpUrlClickable } = StringUtils
const FONT_WEIGHT_SEMI_BOLD = 600
const LOADING_BAR_COLOR = '#EDEEEF'
const LIGHT_TEXT_COLOR = '#5c6365'

const ThumbImg = styled.img`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  width: 100%;
`

const Thumbnail = ({ src, onThumbnailError }) => <ThumbImg src={src} onError={onThumbnailError} />

const ThumbnailContainer = styled.div`
  position: relative;
  float: right;
  width: 106px;
  height: 60px;
  border-radius: 3px;
  cursor: zoom-in;
  overflow: hidden;

  background-color: ${p => (p.isLoading ? LOADING_BAR_COLOR : 'inherit')};
`

const ThumbnailArea = venk(
  ({ isVideo = false, thumbnailUrl, onClick, onThumbnailError, isLoading = false }) =>
    thumbnailUrl ? (
      <ThumbnailContainer isLoading={isLoading} onClick={onClick}>
        {!isLoading ? <Thumbnail src={proxify(thumbnailUrl)} onThumbnailError={onThumbnailError} /> : null}
        {!isLoading && isVideo ? (
          <PlayButton>
            {' '}
            <Icon fill="#fff" size={20} glyph={SymbolPlay} />{' '}
          </PlayButton>
        ) : null}
      </ThumbnailContainer>
    ) : null,
  'MessagePreviewThumbnail',
)

const PlayButton = venk(
  styled.span`
    position: absolute;
    border: 2px solid #fff;
    border-radius: 50%;
    width: 12px;
    height: 12px;
    padding: 4px 6px 15px 14px;
    background-color: #000;
    opacity: 0.6;
    margin: auto;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    svg {
      margin-left: -6px;
    }
  `,
  'MessagePreviewPlayButton',
)

const AltTextContainer = styled.div`
  padding-top: 24px;
  padding-bottom: 24px;
`

const AltTextLabel = styled.span`
  display: inline-block;
  font-weight: ${FONT_WEIGHT_SEMI_BOLD};
  font-style: italic;
  margin-right: 5px;
  width: auto;
`

const AltText = styled.span`
  display: inline;
  position: relative;
  border-radius: 3px;
  text-overflow: ellipsis;
`

const AltTextArea = ({ label, text }) =>
  text ? (
    <AltTextContainer>
      <AltTextLabel>{label}</AltTextLabel>
      <AltText>{text}</AltText>
    </AltTextContainer>
  ) : null

const MessagePreviewSpan = styled.span`
  display: inline-block;
  width: 67%;
  color: ${LIGHT_TEXT_COLOR};
  margin-right: 20px;
  line-height: 1.5;

  .-usernameLink.x-instagram {
    width: auto;
    margin-right: 0;
  }
`

/* eslint-disable react/no-danger */
const MessagePreview = venk(
  ({ messageHtml, isFullWidth, className }) => (
    <MessagePreviewSpan
      className={className}
      dangerouslySetInnerHTML={{ __html: messageHtml }}
      style={isFullWidth ? { width: '100%', marginRight: '0' } : {}}
    />
  ),
  'PreviewModalMessagePreview',
)
/* eslint-enable react/no-danger */

const BodyContent = venk(
  styled.div`
    display: block;
    min-height: 60px;
    max-height: 160px;
    overflow: auto;
    padding: 0 16px 16px 16px;
  `,
  'PreviewModalBodyContent',
)

const LoadingBar = styled.div`
  height: 6px;
  background-color: ${LOADING_BAR_COLOR};
`

const LoadingBars = styled.div`
  float: left;
  width: 340px;
`

const ThumbnailLoadingBars = () => (
  <LoadingBars>
    <LoadingBar width="100%" />
    <LoadingBar width="95%" />
    <LoadingBar width="100%" />
  </LoadingBars>
)

const BodyContentArea = ({ isLoading, messageData, messageAsHtml, onClickThumbnail, onThumbnailError }) => {
  if (isLoading) {
    return (
      <BodyContent>
        <ThumbnailLoadingBars />
        <ThumbnailArea isLoading={isLoading} />
      </BodyContent>
    )
  }

  return (
    <BodyContent>
      {messageData.message ? (
        <MessagePreview isFullWidth={!messageData.thumbnailUrl} messageHtml={messageAsHtml} />
      ) : null}
      <ThumbnailArea
        isLoading={isLoading}
        isVideo={messageData.isVideo}
        thumbnailUrl={messageData.thumbnailUrl}
        onClick={onClickThumbnail}
        onThumbnailError={onThumbnailError}
      />
      <AltTextArea label={translation._('Alt-text: ')} text={messageData.firstImageAltText} />
    </BodyContent>
  )
}

export default class MessagePreviewModal extends React.Component {
  constructor(props) {
    super(props)

    this.iconSize = '15'
    this.statusObject = statusObject
    this.onViewPostClick = this.onViewPostClick.bind(this)
    this.showPreviewBanner = this.showPreviewBanner.bind(this)
    this.isInstagramCommentOrReply = this.isInstagramCommentOrReply.bind(this)
    this.isInstagramNetwork = this.isInstagramNetwork.bind(this)

    this.state = {
      isLoading: true,
      messageData: {},
      hasCustomApprovalsEntitlement: false,
    }
  }

  componentDidMount() {
    if (this.props.isGroupMessage) {
      this.showGroupMessage()
    } else {
      this.showSingleMessage()
    }

    domUtils.ownerDocument(this).addEventListener('keyup', this.handleDocumentKeyUp.bind(this))

    handleEntitlementCheck(CUSTOM_APPROVALS, hasCustomApprovalsEntitlement => {
      this.setState({ hasCustomApprovalsEntitlement })
    })
  }

  componentWillUnmount() {
    if (this.props.isGroupMessage) {
      this.groupMessageRequest.abortAndReject('abort')
    } else {
      this.singleMessageRequest.abortAndReject('abort')
    }
    domUtils.ownerDocument(this).removeEventListener('keyup', this.handleDocumentKeyUp)
  }

  handleDocumentKeyUp(e) {
    if (e.keyCode === 27) {
      this.props.onClose()
    }
  }

  getMessagePromise(messageId, messageType, isPreScreen, isLegacy, isApproval, isComment, isReply) {
    isComment = isComment ? isComment : null
    isReply = isReply ? isReply : null
    return ajaxPromise(
      {
        url: '/ajax/scheduler/get-message',
        type: 'GET',
        data: {
          messageId: messageId,
          messageType: messageType,
          isPreScreen: isPreScreen ? 1 : 0,
          isLegacy: isLegacy ? 1 : 0,
          isApproval: isApproval ? 1 : 0,
          isComment: isComment ? 1 : 0,
          isReply: isReply ? 1 : 0,
        },
      },
      'qm',
    )
  }

  getGroupMessagePromise(groupHash, messageId, messageType, isPreScreen, isLegacy, sendDate, isApproval) {
    return ajaxPromise(
      {
        url: '/ajax/scheduler/get-group-message',
        type: 'GET',
        data: {
          groupHash: groupHash,
          messageId: messageId,
          messageType: messageType,
          isPreScreen: isPreScreen ? 1 : 0,
          isLegacy: isLegacy ? 1 : 0,
          sendDate: sendDate,
          isApproval: isApproval ? 1 : 0,
        },
      },
      'qm',
    )
  }

  getSignedUrlPromise(url) {
    return ajaxPromise(
      {
        url: '/ajax/scheduler/sign-single-url',
        type: 'GET',
        data: {
          objectKey: url,
        },
      },
      'qmNoPreventDouble',
    )
  }

  handlePromiseError(e) {
    if (e.message !== 'abort') {
      statusObject.update(translation._('Failed to retrieve message data'), 'warning', true)

      logError(LOGGING_CATEGORIES.DASHBOARD_LIST_VIEW, 'Failed to retrieve message data', {
        errorMessage: JSON.stringify(e.message),
        stack: JSON.stringify(e.stack),
      })
    }
  }

  attachmentsFromBoards(boards) {
    return boards ? boards.map(b => b.attachment).filter(a => a) : []
  }

  getAttachmentData(data) {
    let attachments
    if (
      ComposerUtils.isInstagramStory(data.postType || data.message.postType) &&
      (data.boards || (data.message && data.message.boards))
    ) {
      attachments = this.attachmentsFromBoards(data.boards || data.message.boards)
    } else if (data.attachments) {
      attachments = data.attachments
    } else if (data.message) {
      attachments = data.message.attachments ? data.message.attachments : null
    }
    const hasAttachments = attachments && attachments[0] && attachments.length
    const isVideo = hasAttachments && attachments[0].videoCodec
    const isYoutubeVideo = hasAttachments && attachments[0].youtubeEmbedUrl
    const thumbnailUrl = hasAttachments && attachments[0].thumbnailUrl ? attachments[0].thumbnailUrl : null
    const originalAttachmentUrl = hasAttachments && attachments[0].url ? attachments[0].url : null
    const youtubeEmbedUrl =
      hasAttachments && attachments[0].youtubeEmbedUrl ? attachments[0].youtubeEmbedUrl : null
    const firstImageAltText = hasAttachments && attachments[0].altText ? attachments[0].altText : null
    const subtitles = hasAttachments && attachments[0].subtitles ? attachments[0].subtitles : null

    return {
      isVideo: isVideo,
      isYoutubeVideo: isYoutubeVideo,
      hasAttachments: hasAttachments,
      thumbnailUrl: thumbnailUrl,
      originalAttachmentUrl: originalAttachmentUrl,
      youtubeEmbedUrl: youtubeEmbedUrl,
      firstImageAltText: firstImageAltText,
      subtitles: subtitles,
    }
  }

  getMessageIds(messages) {
    return _.map(messages, message => {
      return message._id
    })
  }

  shouldUseSignedThumbnailUrls(signedThumbnail, signedOriginalThumbnail) {
    return !!(
      signedThumbnail &&
      signedThumbnail.url &&
      signedOriginalThumbnail &&
      signedOriginalThumbnail.url
    )
  }

  /**
   * Gets the thumbnailUrl and originalAttachmentUrl base on isVideo
   * @param {Object} signedThumbnail
   * @param {Object} signedOriginalThumbnail
   * @param {Object} attachmentData
   * @returns {{thumbnailUrl: ?string, originalAttachmentUrl: ?string}}
   */
  getThumbnailUrlAndOriginalAttachmentUrl(signedThumbnail, signedOriginalThumbnail, attachmentData) {
    let thumbnailUrl = null
    let originalAttachmentUrl = null

    if (attachmentData.hasAttachments) {
      if (
        this.shouldUseSignedThumbnailUrls(signedThumbnail, signedOriginalThumbnail) ||
        attachmentData.isVideo
      ) {
        thumbnailUrl = signedThumbnail.url
        originalAttachmentUrl = signedOriginalThumbnail.url
      } else {
        thumbnailUrl = attachmentData.thumbnailUrl
        originalAttachmentUrl = attachmentData.originalAttachmentUrl
      }
    }

    return { thumbnailUrl, originalAttachmentUrl }
  }

  getSocialNetworkData(messages) {
    let socialNetworkIds = []
    let socialNetworkCount = 0
    let usernames = ''

    socialNetworkIds = _.map(messages, message => {
      return message.socialNetworkId
    })

    _.each(socialNetworkIds, (id, index) => {
      if (index === socialNetworkIds.length - 1) {
        usernames += this.props.socialNetworks[id].username
      } else {
        usernames += this.props.socialNetworks[id].username + ', '
      }

      socialNetworkCount++
    })

    return {
      socialNetworkCount: socialNetworkCount,
      socialNetworkIds: socialNetworkIds,
      usernames: usernames,
    }
  }

  getSNUsername(socialNetwork, extendedInfo) {
    if (
      socialNetwork &&
      socialNetwork.type === SN_TYPES.PINTEREST &&
      extendedInfo &&
      extendedInfo.boardName
    ) {
      return socialNetwork.username + ` (${extendedInfo.boardName})`
    } else {
      return socialNetwork ? socialNetwork.username || null : null
    }
  }

  setSingleMessageState({ messageWrapper, signedThumbnail, signedOriginalThumbnail, signedSubtitlesVtt }) {
    let messageObj = messageWrapper.message
    let attachmentData = this.getAttachmentData(messageWrapper)
    let extendedInfo = messageObj.extendedInfo
    let socialNetwork = this.props.socialNetworks[messageObj.socialNetworkId]
    let thumbnailUrl = null
    let subtitles = (attachmentData && attachmentData.subtitles) || []
    let originalAttachmentUrl = null

    if (attachmentData.hasAttachments) {
      if (
        this.shouldUseSignedThumbnailUrls(signedThumbnail, signedOriginalThumbnail) ||
        attachmentData.isVideo
      ) {
        thumbnailUrl = signedThumbnail.url
        originalAttachmentUrl = signedOriginalThumbnail.url
      } else {
        thumbnailUrl = attachmentData.thumbnailUrl
        originalAttachmentUrl = attachmentData.originalAttachmentUrl
      }
    }

    if (attachmentData.hasAttachments && attachmentData.isVideo && signedSubtitlesVtt !== null) {
      const subtitleVtt = _.findWhere(subtitles, { mimeType: 'text/vtt' })
      subtitles = _.reject(subtitles, subtitle => subtitle === subtitleVtt)
      subtitles = subtitles.concat([_.extend({}, subtitleVtt, { url: signedSubtitlesVtt.url })])
    }

    if (this.state.hasCustomApprovalsEntitlement) {
      this.setState({
        isLoading: false,
        messageData: {
          actions: messageObj.actions || null,
          messageId: this.props.messageId,
          creatorName: messageObj.creatorName || null,
          message: messageObj.message ? messageObj.message : null,
          sendDate: messageObj.sendDate || null,
          avatar: socialNetwork ? socialNetwork.avatar || null : null,
          snUsername: this.getSNUsername(socialNetwork, extendedInfo),
          modifiedDate: messageObj.modifiedDate || null,
          modifiedUserFullName: messageObj.modifiedUserFullName || null,
          hasApprovePermission: messageWrapper.hasApprovePermission || null,
          hasEditPermission: messageWrapper.hasEditPermission || null,
          socialNetworkId: messageObj.socialNetworkId || null,
          socialNetworkType: socialNetwork ? socialNetwork.type || null : null,
          firstImageAltText: attachmentData.firstImageAltText,
          isVideo: attachmentData.isVideo || attachmentData.isYoutubeVideo,
          youtubeEmbedUrl:
            attachmentData.hasAttachments && attachmentData.isYoutubeVideo
              ? attachmentData.youtubeEmbedUrl
              : null,
          isPreScreen: messageObj.isPreScreen ? messageObj.isPreScreen : this.props.isPreScreen,
          numBoards: (messageObj.boards && messageObj.boards.length) || null,
          postType: messageObj.postType || null,
          publishingMode: messageObj.publishingMode || null,
          thumbnailUrl,
          originalAttachmentUrl,
          details: messageObj.details || null,
          sequenceNumber: messageObj.sequenceNumber || -1,
          socialNetworkMessageId: messageObj.socialNetworkMessageId || null,
          rejectedDate: messageObj.rejectedDate || null,
          parentPostUsername: messageObj.parentPostUsername || null,
          parentId: messageObj.parentId || null,
          createdDate: messageObj.createdDate || null,
          rootId: messageObj.rootId || null,
          failedError: messageObj.failedError || null,
          isPrivateMessage: messageObj.isPrivateMessage || false,
          subtitles,
        },
      })
    } else {
      this.setState({
        isLoading: false,
        messageData: {
          actions: messageObj.actions || null,
          messageId: this.props.messageId,
          creatorName: messageObj.creatorName || null,
          message: messageObj.message ? messageObj.message : null,
          sendDate: messageObj.sendDate || null,
          avatar: socialNetwork ? socialNetwork.avatar || null : null,
          snUsername: this.getSNUsername(socialNetwork, extendedInfo),
          modifiedDate: messageObj.modifiedDate || null,
          modifiedUserFullName: messageObj.modifiedUserFullName || null,
          hasApprovePermission: messageWrapper.hasApprovePermission || null,
          hasEditPermission: messageWrapper.hasEditPermission || null,
          socialNetworkType: socialNetwork ? socialNetwork.type || null : null,
          socialNetworkId: messageObj.socialNetworkId || null,
          firstImageAltText: attachmentData.firstImageAltText,
          isVideo: attachmentData.isVideo || attachmentData.isYoutubeVideo,
          youtubeEmbedUrl:
            attachmentData.hasAttachments && attachmentData.isYoutubeVideo
              ? attachmentData.youtubeEmbedUrl
              : null,
          isPreScreen: messageObj.isPreScreen ? messageObj.isPreScreen : this.props.isPreScreen,
          numBoards: (messageObj.boards && messageObj.boards.length) || null,
          postType: messageObj.postType || null,
          publishingMode: messageObj.publishingMode || null,
          thumbnailUrl,
          originalAttachmentUrl,
          details: messageObj.details || null,
          sequenceNumber: messageObj.sequenceNumber || -1,
          rejectedDate: messageObj.rejectedDate || null,
          failedError: messageObj.failedError || null,
          isPrivateMessage: messageObj.isPrivateMessage || false,
          subtitles,
        },
      })
    }
  }

  setGroupMessageState(data) {
    let messageWrapper = data[0]
    let signedThumbnail = data[1]
    let signedOriginalThumbnail = data[2]
    let messageObj = messageWrapper.message[this.props.messageId]
    let modifiedDate = messageObj.modifiedDate
    let socialNetworkData = this.getSocialNetworkData(messageWrapper.message)
    let attachmentData = this.getAttachmentData(messageObj)
    let { thumbnailUrl, originalAttachmentUrl } = this.getThumbnailUrlAndOriginalAttachmentUrl(
      signedThumbnail,
      signedOriginalThumbnail,
      attachmentData,
    )
    const socialNetwork = this.props.socialNetworks[messageObj.socialNetworkId]

    this.setState({
      isLoading: false,
      messageData: {
        actions: messageObj.actions || null,
        creatorName: messageObj.creatorName || null,
        message: messageObj.message ? messageObj.message : null,
        sendDate: messageObj.sendDate || null,
        // Display the avatar for the first social network in the message list
        avatar: socialNetwork.avatar || null,
        snUsername: socialNetworkData.usernames,
        modifiedDate: modifiedDate,
        modifiedUserFullName: messageObj.modifiedUserFullName || null,
        hasApprovePermission: messageWrapper.hasApprovePermission || null,
        hasEditPermission: messageWrapper.hasEditPermission || null,
        socialNetworkType: socialNetwork.type || null,
        socialNetworkId: null,
        firstImageAltText: attachmentData.firstImageAltText,
        isVideo: attachmentData.isVideo,
        youtubeEmbedUrl:
          attachmentData.hasAttachments && attachmentData.isYoutubeVideo
            ? attachmentData.youtubeEmbedUrl
            : null,
        isPreScreen: this.props.isPreScreen,
        socialNetworkIds: socialNetworkData.socialNetworkIds,
        socialNetworkCount: socialNetworkData.socialNetworkCount,
        numBoards: (messageObj.boards && messageObj.boards.length) || null,
        postType: messageObj.postType || null,
        publishingMode: messageObj.publishingMode || null,
        thumbnailUrl,
        originalAttachmentUrl,
        details: messageObj.details || null,
        messageIds: this.getMessageIds(messageWrapper.message),
        failedError: messageObj.failedError || null,
      },
    })
  }

  showSingleMessage() {
    this.singleMessageRequest = this.getMessagePromise(
      this.props.messageId,
      this.props.type,
      this.props.isPreScreen,
      this.props.isLegacy,
      this.props.isApproval,
      this.props.isComment,
      this.props.isReply,
    )
      .then(data => {
        const attachmentData = this.getAttachmentData(data)

        if ((attachmentData.thumbnailUrl && attachmentData.originalAttachmentUrl) || attachmentData.isVideo) {
          const vtt = getSubtitlesVttUrl(attachmentData)

          return Promise.all([
            data,
            this.getSignedUrlPromise(attachmentData.thumbnailUrl),
            this.getSignedUrlPromise(attachmentData.originalAttachmentUrl),
            vtt ? this.getSignedUrlPromise(vtt) : null,
          ])
        }

        return Promise.all([data])
      })
      .then(data => {
        this.setSingleMessageState({
          messageWrapper: data[0],
          signedThumbnail: data[1],
          signedOriginalThumbnail: data[2],
          signedSubtitlesVtt: data[3],
        })
      })
      .catch(this.handlePromiseError)
  }

  showGroupMessage() {
    this.groupMessageRequest = this.getGroupMessagePromise(
      this.props.groupHash,
      this.props.messageId,
      this.props.type,
      this.props.isPreScreen,
      this.props.isLegacy,
      this.props.sendDate,
      this.props.isApproval,
    )
      .then(data => {
        const messageObj = data.message[this.props.messageId]
        const attachmentData = this.getAttachmentData(messageObj)

        if ((attachmentData.thumbnailUrl && attachmentData.originalAttachmentUrl) || attachmentData.isVideo) {
          return Promise.all([
            data,
            this.getSignedUrlPromise(attachmentData.thumbnailUrl),
            this.getSignedUrlPromise(attachmentData.originalAttachmentUrl),
          ])
        }
        return Promise.all([data])
      })
      .then(data => {
        this.setGroupMessageState(data)
      })
      .catch(this.handlePromiseError)
  }

  isApproverAndApproval() {
    return (
      (this.state.messageData.hasApprovePermission && this.isRequireApproval()) ||
      (this.state.messageData.hasApprovePermission && this.isPendingApproval())
    )
  }

  isInstagramNetwork() {
    if (this.state.messageData.socialNetworkId) {
      const socialNetwork = this.props.socialNetworks[this.state.messageData.socialNetworkId]
      return socialNetwork.type === SN_TYPES.INSTAGRAM || socialNetwork.type === SN_TYPES.INSTAGRAMBUSINESS
    }

    return false
  }

  isTwitterNetwork() {
    if (this.state.messageData.socialNetworkId) {
      const socialNetwork = this.props.socialNetworks[this.state.messageData.socialNetworkId]
      return socialNetwork.type === SN_TYPES.TWITTER
    }

    return false
  }

  isInstagramCommentOrReply() {
    return this.isInstagramNetwork() && (this.props.isComment || this.props.isReply)
  }

  isTwitterReplyApproval() {
    return this.isTwitterNetwork() && this.props.isReply && this.props.isApproval
  }

  isInstagramCommentOrReplyApproval() {
    return this.isInstagramCommentOrReply() && this.props.isApproval
  }

  isRequireApproval() {
    return this.props.type === Constants.APPROVALS.TYPE.REQUIRE_APPROVAL
  }

  isPendingApproval() {
    return this.props.type === Constants.APPROVALS.TYPE.PENDING_APPROVAL
  }

  isScheduled() {
    return this.props.type === Constants.APPROVALS.TYPE.SCHEDULED
  }

  isPublished() {
    return this.props.type === Constants.APPROVALS.TYPE.PUBLISHED
  }

  isExpired() {
    return this.props.type === Constants.APPROVALS.TYPE.EXPIRED
  }

  hasFailedToSend() {
    return !!this.state.messageData.failedError
  }

  isUneditableContentType() {
    return this.state.messageData.isPrivateMessage || this.props.isComment || this.props.isReply
  }

  onViewPostClick() {
    let reviewerName = this.state.messageData.details.reviewers[0].name
    const actions = this.state.messageData.actions
    let rejectAction
    let rejectedDate

    if (!reviewerName && actions) {
      rejectAction = actions.filter(action => {
        return action.actionType === 'REJECT'
      })

      if (rejectAction && rejectAction[0]) {
        reviewerName = rejectAction[0].actorName
        rejectedDate = rejectAction[0].timestamp
      }
    }

    const pendingComment = {
      createdDate: this.state.messageData.createdDate,
      message: this.state.messageData.message,
      reviewerName: reviewerName,
      socialNetworkAvatar: this.state.messageData.avatar,
      socialNetworkName: this.state.messageData.snUsername,
      userId: this.props.socialNetworks[this.state.messageData.socialNetworkId].userId,
      rootId: this.state.messageData.rootId,
      parentId: this.state.messageData.parentId,
      isRejected: rejectAction && rejectAction.length > 0,
      rejectedDate,
    }

    const data = {
      boxType: 'PENDING_COMMENT_MODAL',
      messageId: this.state.messageData.rootId
        ? this.state.messageData.rootId
        : this.state.messageData.parentId,
      socialNetworkId: this.state.messageData.socialNetworkId,
      socialNetworkType: this.props.socialNetworks[this.state.messageData.socialNetworkId].type,
      pendingComment: pendingComment,
    }

    if (!data.messageId) {
      statusObject.update(
        translation._('Sorry, we were unable to record the original post id when this comment was created.'),
        'error',
        true,
      )
    } else {
      hootbus.emit('publisher:renderPendingCommentModal', data)
    }
  }

  renderHeader() {
    return (
      <div className="-header">
        <MessagePreviewBanner
          isComment={this.props.isComment}
          isFailed={this.props.isFailed}
          isGroupMessage={this.props.isGroupMessage}
          isLegacy={this.props.isLegacy}
          isLoading={this.state.isLoading}
          isPreScreen={
            this.state.messageData.isPreScreen ? this.state.messageData.isPreScreen : this.props.isPreScreen
          }
          isReply={this.props.isReply}
          isUnscheduled={this.props.isUnscheduled}
          messageData={this.state.messageData}
          onClose={this.props.onClose}
          timezoneOffset={this.props.timezoneOffset}
          type={this.props.type}
          isNotification={ComposerUtils.isPushPublishing(this.state.messageData.publishingMode)}
        />
      </div>
    )
  }

  formatDateForPreview(sendDate) {
    let minuteHour
    const momentSendDate = moment.utc(sendDate)
    const now = moment()
    // Display the year if it is not the current one
    const dateFormatted = momentSendDate.isSame(now, 'year')
      ? momentSendDate.format('MMM D')
      : momentSendDate.format('MMM D, YYYY')
    if (momentSendDate.isAfter(now)) {
      // Display the time for future scheduled dates
      minuteHour = momentSendDate.format('h:mma')
      // prettier-ignore
      return translation._('%1$s at %2$s').replace('%1$s', dateFormatted).replace('%2$s', minuteHour)
    } else {
      return dateFormatted
    }
  }

  renderPostPreviewBanner() {
    const postIcon = this.props.isComment ? Comment : Reply
    const postInfoComment = translation._('Comment to %s')
    const postInfoReply = translation._('Reply to %s')
    const postInfo = (this.props.isComment ? postInfoComment : postInfoReply).replace(
      '%s',
      this.state.messageData.parentPostUsername,
    )

    if (this.state.isLoading) {
      return (
        <div className="-postPreviewBanner">
          <div>
            <Icon className="-postIcon" fill="#949a9b" size={16} glyph={postIcon} />
            <span className="-postInfo -loadingDark -loadingBar" />
          </div>
          <span className="-viewPost -loadingDark -loadingBar" />
        </div>
      )
    } else {
      const socialNetwork = this.props.socialNetworks[this.state.messageData.socialNetworkId]
      let viewPost
      if (
        socialNetwork &&
        socialNetwork.type &&
        socialNetwork.type !== SN_TYPES.TWITTER &&
        !this.isInstagramCommentOrReplyApproval()
      ) {
        viewPost = (
          <a className="-viewPost" href="#" onClick={this.onViewPostClick}>
            {translation._('View post')}
          </a>
        )
      }

      return (
        <div className="-postPreviewBanner">
          <div>
            <Icon className="-postIcon" fill="#949a9b" size={16} glyph={postIcon} />
            <span className="-postInfo">{postInfo}</span>
          </div>
          {viewPost}
        </div>
      )
    }
  }

  renderBody() {
    let scheduledDateLabel = translation._('Scheduled for: %b%s%/b')
    if (this.isExpired()) {
      scheduledDateLabel = translation._('Was scheduled for: %b%s%/b')
    } else if (this.isPublished()) {
      scheduledDateLabel = '%b%s%/b'
    } else if (ComposerUtils.isInstagramStory(this.state.messageData.postType)) {
      // prettier-ignore
      scheduledDateLabel = translation._('Story (' + this.state.messageData.numBoards + ') scheduled for: %b%s%/b')
    }

    const socialNetwork = this.props.socialNetworks[this.state.messageData.socialNetworkId]
    const socialNetworkType = socialNetwork && socialNetwork.type ? socialNetwork.type : undefined
    let avatarSrc = this.state.messageData.avatar
    if (!avatarSrc) {
      if (
        socialNetworkType &&
        (socialNetworkType === SN_TYPES.INSTAGRAM || socialNetworkType === SN_TYPES.INSTAGRAMBUSINESS)
      ) {
        avatarSrc = Constants.DEFAULT_INSTAGRAM_AVATAR_URL
      } else {
        avatarSrc = Constants.DEFAULT_AVATAR_URL
      }
    }
    let sendDate
    if (this.state.messageData.sendDate) {
      sendDate = this.formatDateForPreview(
        this.state.messageData.sendDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS,
      )
    }

    // The isUnscheduled prop is for unscheduled messages
    // that have the sendDate not set to null. If it is
    // not set or set to false then we display the send date.
    if (this.state.messageData.sendDate && !this.props.isUnscheduled) {
      scheduledDateLabel = scheduledDateLabel.replace('%s', sendDate)
    } else {
      scheduledDateLabel = translation._('No schedule date')
    }

    let messageAsHtml = ''
    if (!_.isEmpty(this.state.messageData)) {
      const msgText = DOMPurify.sanitize(String(this.state.messageData.message))

      messageAsHtml = makeNonHttpUrlClickable(
        makeUrlClickable(makeUsernameClickable(makeHashClickable(msgText), socialNetworkType)),
      )
    }

    const onThumbnailError = () => {
      if (this.state.messageData.isVideo) {
        const { messageData } = this.state
        const messageDataToLog = {
          messageId: messageData.messageId,
          socialNetworkType: messageData.socialNetworkType,
          socialNetworkId: messageData.socialNetworkId,
          thumbnailUrl: messageData.thumbnailUrl,
          originalAttachmentUrl: messageData.originalAttachmentUrl,
          failedError: messageData.failedError,
        }
        const proxifyUrl = proxify(messageData.thumbnailUrl)
        logError(LOGGING_CATEGORIES.DASHBOARD_LIST_VIEW, 'preview modal attachment error', {
          messageData: JSON.stringify(messageDataToLog),
          proxifyUrl,
        })

        ajaxPromise({
          url: '/ajax/scheduler/track-failed-video',
          type: 'POST',
          json: {
            messageID: this.props.messageId,
            videoUrl: this.state.messageData.originalAttachmentUrl,
          },
        })

        statusObject.update(
          translation._('Sorry, failed to retrieve thumbnail data. Video may have been expired'),
          'error',
          true,
        )
      } else {
        const { messageData } = this.state
        const proxifyUrl = proxify(messageData.thumbnailUrl)
        const messageDataToLog = {
          messageId: messageData.messageId,
          memberId: this.props.memberId,
          socialNetworkType: messageData.socialNetworkType,
          socialNetworkId: messageData.socialNetworkId,
          thumbnailUrl: messageData.thumbnailUrl,
          originalAttachmentUrl: messageData.originalAttachmentUrl,
          failedError: messageData.failedError,
        }
        logError(LOGGING_CATEGORIES.DASHBOARD_LIST_VIEW, 'preview modal thumbnail attachment error', {
          messageData: JSON.stringify(messageDataToLog),
          proxifyUrl,
        })
        statusObject.update(translation._('Sorry, failed to retrieve thumbnail data.'), 'error', true)
      }
    }

    const onClickThumbnail = () => {
      if (this.state.messageData.isVideo) {
        if (this.state.messageData.youtubeEmbedUrl) {
          this.props.onYoutubeVideoClick(this.state.messageData)
        } else {
          this.props.onVideoClick(this.state.messageData)
        }
      } else {
        hootbus.emit('message:renderLightbox', {
          imgArray: [this.state.messageData.originalAttachmentUrl || ''],
          displayImg: 0,
        })
      }
    }

    const isTiktokBusiness = snType => snType === SN_TYPES.TIKTOKBUSINESS

    const renderMsgPreviewAvatar = () => {
      if (isTiktokBusiness(socialNetworkType)) {
        return (
          <Icon
            style={{ display: 'inline-block' }}
            fill="currentColor"
            glyph={HootsuiteAvatarPlaceholder}
            size={50}
          />
        )
      } else {
        return <img className="-avatar fs-exclude-container" src={proxify(avatarSrc)} />
      }
    }

    const EditButton = () => {
      return this.state.messageData.hasEditPermission &&
        this.isApproverAndApproval() &&
        !this.isInstagramCommentOrReply() &&
        !this.isTwitterReplyApproval() ? (
        <span className="-edit" onClick={() => this.props.onEditClick(this.props, this.state.messageData)}>
          <Icon fill="#000" size={this.iconSize} glyph={Pencil} />
        </span>
      ) : null
    }

    return (
      <div className="-body">
        <div className={`-subBodyHeader ${isTiktokBusiness(socialNetworkType) && `-subBodyHeaderWithIcon`}`}>
          <span className="x-ImageIcon">
            {this.state.isLoading ? <div className="-avatarLoading -loading" /> : renderMsgPreviewAvatar()}
            {!this.state.isLoading && this.state.messageData.socialNetworkCount ? (
              <span className="-socialNetworkCount">{this.state.messageData.socialNetworkCount}</span>
            ) : null}
          </span>
          {this.state.isLoading ? (
            <div className="-subBodyHeaderContentLoading">
              <span className="-accountUsernames -loading -loadingBar" />
              <span className="-date -loading -loadingBar" />
            </div>
          ) : (
            <div
              className={`-subBodyHeaderContent ${
                isTiktokBusiness(socialNetworkType) && `-subBodyHeaderContentWithIcon`
              }`}
            >
              <span
                className="-accountUsernames fs-exclude-container"
                style={this.isApproverAndApproval() ? { width: '335px' } : { width: '403px' }}
              >
                {this.state.messageData.snUsername}
              </span>
              <span className="-date">{JsxUtils.jsxFromTemplate(scheduledDateLabel)}</span>
            </div>
          )}
          <EditButton />
        </div>
        <BodyContentArea
          isLoading={this.state.isLoading}
          messageData={this.state.messageData}
          messageAsHtml={messageAsHtml}
          onClickThumbnail={onClickThumbnail}
          onThumbnailError={onThumbnailError}
        />
      </div>
    )
  }

  renderFooter() {
    const greyBgColour = '#969C9D'
    const btnBgColour = '#F5F5F5'
    const isExpiredReviewable = this.isExpired() && this.state.messageData.hasApprovePermission
    let canShowRightButton = !this.hasFailedToSend() && !isExpiredReviewable
    let canShowLeftButton = true
    let leftBtn
    let rightBtn

    if (
      darklaunch.isFeatureEnabledOrBeta('PUB_27301_DISABLE_LEGACY_GROUP_EDIT') &&
      this.props.isGroupMessage
    ) {
      canShowRightButton = false
      leftBtn = {
        icon: EmblemTrash,
        iconColour: greyBgColour,
        text: translation._('Delete Group'),
      }
    } else {
      if (darklaunch.isFeatureEnabledOrBeta('PUB_29764_REMOVE_COMMENT_EDIT_OPTION')) {
        canShowLeftButton = this.isApproverAndApproval()
          ? true
          : !(this.props.isComment || this.props.isReply)
      } else {
        canShowLeftButton = true
      }

      leftBtn = {
        icon: Pencil,
        iconColour: greyBgColour,
        text: this.props.isGroupMessage ? translation._('Edit Group') : translation._('Edit'),
      }
      rightBtn = {
        icon: EmblemTrash,
        iconColour: greyBgColour,
        text: this.props.isGroupMessage ? translation._('Delete Group') : translation._('Delete'),
      }
    }

    if (this.isApproverAndApproval()) {
      leftBtn.icon = IconCheck
      leftBtn.iconColour = '#8DC63F'

      if (!this.props.isLegacy) {
        rightBtn.icon = XLight
        rightBtn.iconColour = '#FF3F02'
      }

      if (this.props.isGroupMessage) {
        leftBtn.text = translation._('Approve Group')

        if (!this.props.isLegacy) {
          rightBtn.text = translation._('Reject Group')
        }
      } else {
        leftBtn.text = translation._('Approve')

        if (!this.props.isLegacy) {
          rightBtn.text = translation._('Reject')
        }
      }
    } else if (
      this.isInstagramCommentOrReply() ||
      (this.state.messageData.isPrivateMessage && !this.isApproverAndApproval())
    ) {
      canShowRightButton = false
      leftBtn.icon = EmblemTrash
      leftBtn.iconColour = greyBgColour
      leftBtn.text = translation._('Delete')
    }

    if (this.isTwitterReplyApproval()) {
      if (darklaunch.isFeatureEnabledOrBeta('PUB_29764_REMOVE_COMMENT_EDIT_OPTION')) {
        canShowLeftButton = false
        canShowRightButton = true
      } else {
        canShowRightButton = false

        leftBtn.icon = EmblemTrash
        leftBtn.iconColour = greyBgColour
        leftBtn.text = translation._('Delete')
      }
    }

    if (this.props.isApproval && this.props.isFailed) {
      leftBtn.icon = ArrowRoundCounterClockwise
      leftBtn.text = translation._('Retry')
    }

    if (this.state.isLoading) {
      return (
        <div className="-footer">
          <div className="-actionsLoading">
            <div className="-buttonLoading" />
            <div className="-buttonLoading" />
          </div>
        </div>
      )
    }

    if (
      (!this.state.messageData.hasEditPermission && !this.isUneditableContentType()) ||
      (this.isPublished() && !this.hasFailedToSend())
    ) {
      return null
    }

    const actionClasses = classNames(
      '-actions',
      canShowRightButton && canShowLeftButton ? '' : '-hasSingleButton',
    )

    return (
      <div className="-footer">
        <div className={actionClasses}>
          {canShowLeftButton && (
            <Button
              backgroundColor={btnBgColour}
              btnStyle="standard"
              className="-leftBtn"
              onClick={() => this.props.onFooterLeftBtnClick(this.props, this.state.messageData)}
            >
              <Icon fill={leftBtn.iconColour} size={this.iconSize} glyph={leftBtn.icon} />
              {leftBtn.text}
            </Button>
          )}
          {canShowRightButton ? (
            <Button
              backgroundColor={btnBgColour}
              btnStyle="standard"
              className="-rightBtn"
              onClick={() => this.props.onFooterRightBtnClick(this.state.messageData)}
            >
              <Icon fill={rightBtn.iconColour} size={this.iconSize} glyph={rightBtn.icon} />
              {rightBtn.text}
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  showPreviewBanner() {
    const socialNetwork = this.props.socialNetworks[this.state.messageData.socialNetworkId]
    if (socialNetwork && socialNetwork.type && socialNetwork.type === SN_TYPES.INSTAGRAM) {
      return false
    }
    return this.props.isComment || this.props.isReply
  }

  render() {
    return (
      <div className="rc-MessagePreviewModal _messagePreviewModal">
        {this.renderHeader()}
        {this.showPreviewBanner() && this.renderPostPreviewBanner()}
        {this.renderBody()}
        {this.renderFooter()}
      </div>
    )
  }
}

MessagePreviewModal.propTypes = {
  groupHash: PropTypes.string,
  isApproval: PropTypes.bool,
  isComment: PropTypes.bool,
  isFailed: PropTypes.bool,
  isGroupMessage: PropTypes.bool.isRequired,
  isLegacy: PropTypes.bool.isRequired,
  isPreScreen: PropTypes.bool,
  isReply: PropTypes.bool,
  isUnscheduled: PropTypes.bool,
  memberId: PropTypes.number,
  messageId: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onEditClick: PropTypes.func,
  onFooterLeftBtnClick: PropTypes.func.isRequired,
  onFooterRightBtnClick: PropTypes.func.isRequired,
  onVideoClick: PropTypes.func,
  onYoutubeVideoClick: PropTypes.func,
  sendDate: PropTypes.number,
  socialNetworks: PropTypes.object.isRequired,
  timezoneOffset: PropTypes.number.isRequired,
  type: PropTypes.oneOf([
    Constants.APPROVALS.TYPE.DRAFT,
    Constants.APPROVALS.TYPE.REQUIRE_APPROVAL,
    Constants.APPROVALS.TYPE.PENDING_APPROVAL,
    Constants.APPROVALS.TYPE.SCHEDULED,
    Constants.APPROVALS.TYPE.PUBLISHED,
    Constants.APPROVALS.TYPE.EXPIRED,
    Constants.APPROVALS.TYPE.REJECTED,
  ]).isRequired,
}

MessagePreviewModal.defaultProps = {
  isFailed: false,
}

MessagePreviewModal.displayName = 'Message Preview Modal'
