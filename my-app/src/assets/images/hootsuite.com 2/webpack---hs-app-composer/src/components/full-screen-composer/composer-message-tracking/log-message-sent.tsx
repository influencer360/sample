import { isNil } from 'lodash'
import _ from 'underscore'

import { sendWootricEvent } from 'fe-lib-wootric-events'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import ComposerConstants from '@/constants/composer'
import Constants from '@/constants/constants'
import MessageConstants from '@/constants/message'
import TrackingConstants from '@/constants/tracking'
import InnerMessage from '@/models/inner-message'
import Message from '@/models/message'
import AttachmentUtils from '@/utils/attachment-utils'
import { doesMessagesContainsMention, getMentionCountsPerNetworkGroup } from '@/utils/mentions-utils'
import MessageUtils from '@/utils/message-utils'
import { track } from '@/utils/tracking'
import getUtcTimestamp from './get-utc-timestamp'
import { logCustomizedContent } from './log-customized-content'
import { logMessageSummary } from './log-message-summary'

interface MessageSentEventDetails {
  numOfMedia: number
  numOfImages: number
  numOfVideos: number
  hasPDF: boolean
  socialNetworkType: string
  numFromLibrary?: number
  numEditedImages?: number
  numSuggestedImages?: number
  numUrls?: number
  shorterUrls?: number
  trackedUrls?: number
  campaignId?: number
  numTags?: number
  isDraft?: boolean
  isAutoScheduled?: boolean
  scheduledType?: string
  memberId: string
  publishingMode: string
  postType: string
  numProductTags: number
  creativeSources: string[]
  acceptedHashtagSuggestion: boolean
  hasCustomThumbnail: boolean
  origin?: string
  ideaId?: string
  utcTimestamp: string
  to_be_published_time?: string
}

export const logMentionUsed = (innerMessages: Record<string, InnerMessage>, originId: string) => {
  if (doesMessagesContainsMention(innerMessages)) {
    const mentionCounts = getMentionCountsPerNetworkGroup(innerMessages)
    track(originId, TrackingConstants.TRACKING_ACTIONS.MENTION.MESSAGE_SENT_WITH_MENTION, mentionCounts)
  }
}

export const logProductCatalog = (message: Message, originId: string) => {
  const hasProductCatalogs = message.messages.some(innerMessage => innerMessage.hasCatalogs === true)
  track(originId, TrackingConstants.TRACKING_ACTIONS.PRODUCT_TAGGING.PRODUCT_TAGGING_WITH_CATALOGS, {
    hasProductCatalogs,
  })
}

export const getCreativeSources = (message: Message) => {
  const attachmentTrackingSources = message?.attachments?.map(attachment => attachment.trackingSource) || []
  const messageTrackingSources = message?.trackingSources || []
  const sources = [...messageTrackingSources, ...attachmentTrackingSources]
  return sources
}

/**
 * Log social network type, member Id, and # of images whenever a message is sent or scheduled.
 * Note: The memberId and timestamp is always tracked by default.
 *
 * @param {Message} messageToSend The message(s) that are being sent or scheduled (need this to get the social network type)
 * @param {object} messages The message(s) that were sent or scheduled
 * @param {bool} isDraft Whether the message being consumed was a draft
 */
export const logMessageSent = (
  messageToSend,
  messages,
  isDraft,
  memberId,
  origin,
  ideaId,
  acceptedHashtagSuggestion = false,
) => {
  /**
   * isScheduled is true if it's a 'SCHEDULED' message, or
   * a 'PENDING_APPROVAL' message with one time approver and scheduled date
   */
  const isScheduled =
    messages[0].state === MessageConstants.STATE.SCHEDULED ||
    (messages[0].state === MessageConstants.STATE.PENDING_APPROVAL &&
      messageToSend.oneTimeReviewerId &&
      messageToSend.sendDate)
  const isAutoScheduled = messageToSend.isAutoScheduled && isScheduled
  const context = isScheduled
    ? TrackingConstants.TRACKING_CONTEXT.SCHEDULE
    : TrackingConstants.TRACKING_CONTEXT.SEND
  const singleMessageActionId = isScheduled
    ? TrackingConstants.TRACKING_ACTION.SCHEDULE_MESSAGES
    : TrackingConstants.TRACKING_ACTION.SEND_MESSAGES
  const summaryActionId = isScheduled
    ? TrackingConstants.TRACKING_ACTION.SCHEDULE_MESSAGES_SUMMARY
    : TrackingConstants.TRACKING_ACTION.SEND_MESSAGES_SUMMARY
  const originId = `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.${context}`
  const to_be_published_time =
    isScheduled && messages[0]?.scheduledSendTime ? messages[0].scheduledSendTime : undefined

  // Named utc because timestamp is already used in Mixpanel to show "time" in the MP dashboard
  const utcTimestamp = getUtcTimestamp()

  let numUrls = 0
  let shorterUrls = 0
  let trackedUrls = 0
  let hasProductTaggingNetwork = false

  if (!_.isNull(messageToSend.linkSettings)) {
    numUrls = messageToSend.linkSettings.length
    _.each(messageToSend.linkSettings, linkSetting => {
      if (linkSetting.linkShortenerId !== Constants.LINK_SHORTENER.NONE) {
        shorterUrls++
      }
      if (!_.isEmpty(linkSetting.linkTracker) && !_.isNull(linkSetting.linkTracker.trackingParameters)) {
        trackedUrls++
      }
    })
  }

  const attachmentSummary = {
    maxImages: 0,
    maxVideos: 0,
    hasPDF: false,
  }

  _.each(messages, message => {
    const socialNetworkType = messageToSend.socialNetworksKeyedById.get(
      message.socialProfile.id.toString(),
    ).type
    const numOfMedia = (_.isArray(message.mediaUrls) && message.mediaUrls.length) || 0
    const numOfImages = numOfMedia ? AttachmentUtils.getNumImages(message.mediaUrls) : 0
    const numOfVideos = numOfMedia ? AttachmentUtils.getNumVideos(message.mediaUrls) : 0
    const hasPDF = AttachmentUtils.hasPdf(message.mediaUrls)

    if (numOfImages > attachmentSummary.maxImages) attachmentSummary.maxImages = numOfImages
    if (numOfVideos > attachmentSummary.maxVideos) attachmentSummary.maxVideos = numOfVideos
    attachmentSummary.hasPDF = hasPDF

    const eventDetails: MessageSentEventDetails = {
      numOfMedia,
      numOfImages,
      numOfVideos,
      hasPDF,
      socialNetworkType,
      numUrls,
      shorterUrls,
      trackedUrls,
      isDraft,
      isAutoScheduled,
      origin,
      ideaId,
      utcTimestamp,
      to_be_published_time,
      creativeSources: getCreativeSources(messageToSend),
      numFromLibrary: undefined,
      numEditedImages: undefined,
      numSuggestedImages: undefined,
      campaignId: undefined,
      numTags: undefined,
      scheduledType: undefined,
      publishingMode: undefined,
      postType: undefined,
      numProductTags: undefined,
      acceptedHashtagSuggestion: false,
      hasCustomThumbnail: false,
      memberId: undefined,
    }

    // handle event with attachments
    if (_.isArray(messageToSend.attachments) && messageToSend.attachments.length) {
      const attachmentTypes = messageToSend.attachments.reduce((acc, attachment) => {
        const trackingSource = attachment.trackingSource
        if (trackingSource !== null) {
          if (acc[trackingSource] === undefined) {
            acc[trackingSource] = [attachment]
          } else {
            acc[trackingSource].push(attachment)
          }
        }
        return acc
      }, {})

      let numProductTags

      if (SocialProfileConstants.SN_TYPES_PRODUCT_TAGGING_ENABLED.includes(socialNetworkType)) {
        const snGroup = SocialProfileConstants.SN_TYPE_TO_SN_GROUP[socialNetworkType]
        // TODO - update this logic to include tags for multiple attachments when carousel tagging is available
        const { productTags = null } =
          messageToSend.baseMessage?.attachments.find(attachment => attachment.productTags) || {}
        numProductTags = isNil(productTags) ? 0 : productTags?.[snGroup]?.length
        hasProductTaggingNetwork = true
      }

      eventDetails.numFromLibrary = attachmentTypes[
        ComposerConstants.ATTACHMENT_TRACKING_SOURCE.MEDIA_LIBRARY
      ]
        ? attachmentTypes[ComposerConstants.ATTACHMENT_TRACKING_SOURCE.MEDIA_LIBRARY].length
        : 0
      eventDetails.numEditedImages = attachmentTypes[ComposerConstants.ATTACHMENT_TRACKING_SOURCE.EDITING]
        ? attachmentTypes[ComposerConstants.ATTACHMENT_TRACKING_SOURCE.EDITING].length
        : 0
      eventDetails.numSuggestedImages = attachmentTypes[
        ComposerConstants.ATTACHMENT_TRACKING_SOURCE.SUGGESTED
      ]
        ? attachmentTypes[ComposerConstants.ATTACHMENT_TRACKING_SOURCE.SUGGESTED].length
        : 0
      eventDetails.numProductTags = numProductTags
    } else {
      eventDetails.numFromLibrary = 0
      eventDetails.numEditedImages = 0
      eventDetails.numSuggestedImages = 0
    }

    eventDetails.numUrls = numUrls
    eventDetails.shorterUrls = shorterUrls
    eventDetails.trackedUrls = trackedUrls
    eventDetails.origin = origin
    eventDetails.ideaId = ideaId

    if (messageToSend.campaignId) {
      eventDetails.campaignId = Number(messageToSend.campaignId)
    }
    eventDetails.isDraft = isDraft

    eventDetails.numTags = messageToSend.tags.length

    eventDetails.isAutoScheduled = isAutoScheduled

    if (messageToSend.recommendedTimesScheduledType !== 'disabled') {
      eventDetails.scheduledType = messageToSend.recommendedTimesScheduledType
    }

    if (isFeatureEnabledOrBeta('PUB_25544_MEMBER_ID_TRACKING')) {
      eventDetails.memberId = memberId
      if (message.publishingMode) {
        eventDetails.publishingMode = messageToSend.publishingMode
      }
    }

    if (message.postType) {
      eventDetails.postType = messageToSend.postType
    }

    eventDetails.acceptedHashtagSuggestion = acceptedHashtagSuggestion

    const snGroup = SocialProfileConstants.SN_TYPE_TO_SN_GROUP[socialNetworkType]
    const innerMessage = messageToSend?.messages?.find(message => message.snType === socialNetworkType)
    eventDetails.hasCustomThumbnail = MessageUtils.isThumbnailCustomized(innerMessage, snGroup)

    track(originId, singleMessageActionId, eventDetails)
  })

  const mentionSupportedInnerMessages = MessageUtils.getInnerMessagesByGroup(messageToSend.messages || [], [
    SocialProfileConstants.SN_GROUP.INSTAGRAM,
  ])

  logMentionUsed(mentionSupportedInnerMessages, originId)
  logCustomizedContent(messageToSend, originId)
  hasProductTaggingNetwork && logProductCatalog(messageToSend, originId)
  logMessageSummary(
    messageToSend,
    mentionSupportedInnerMessages,
    originId,
    memberId,
    messageToSend.publishingMode,
    summaryActionId,
    attachmentSummary,
    acceptedHashtagSuggestion,
  )

  if (isFeatureEnabledOrBeta('PUB_30941_WOOTRIC_PUBLISHING_EVENT')) {
    sendWootricEvent('messageSentOrScheduled')
  }
}
