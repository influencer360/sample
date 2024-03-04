import _ from 'underscore'
import { get as localStorageGet } from 'fe-lib-localstorage'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { InstagramPostType } from 'fe-pnc-constants-social-profiles'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import Constants from '@/constants/constants'
import InnerMessage from '@/models/inner-message'
import Message from '@/models/message'
import { isPlannerView } from '@/utils/dashboard-utils'
import { doesMessagesContainsMention, getTotalMentionCount } from '@/utils/mentions-utils'
import MessageUtils from '@/utils/message-utils'
import { track } from '@/utils/tracking'

interface MessageSummaryEventDetails {
  numProfiles: number
  numGroups: number
  types: string[] // remove with PUB_30974_TRACKING_RENAME
  socialNetworkType: string[]
  numMentions: number
  numImages: number
  numVideos: number
  numMedia: number
  hasPDF: boolean
  memberId: undefined //update value with removal of PUB_25544_MEMBER_ID_TRACKING
  publishingMode?: string
  postType?: InstagramPostType
  creativeSources: string[]
  hasCustomThumbnail: boolean
  acceptedHashtagSuggestion: boolean
  flexApproval: boolean
  hasText: boolean
}

export const logMessageSummary = (
  messageToSend: Message,
  mentionSupportedInnerMessages: Record<string, InnerMessage>,
  originId: string,
  memberId: string,
  publishingMode: string,
  summaryActionId: string,
  attachmentSummary: Record<number, number | boolean>,
  acceptedHashtagSuggestion: boolean,
) => {
  const messageSummaryDetails: MessageSummaryEventDetails = {
    numProfiles: 0,
    numGroups: 0,
    ...(isFeatureEnabledOrBeta('PUB_30974_TRACKING_RENAME') ? { socialNetworkType: [] } : { types: [] }),
    numMentions: 0,
    numImages: 0,
    numVideos: 0,
    numMedia: 0,
    hasPDF: false,
    memberId: undefined, //update value with removal of PUB_25544_MEMBER_ID_TRACKING
    publishingMode: undefined,
    postType: undefined,
    creativeSources: _.isArray(messageToSend.attachments)
      ? messageToSend?.attachments.map(attachment => attachment.trackingSource)
      : [],
    hasCustomThumbnail: false,
    acceptedHashtagSuggestion: false,
    flexApproval: false,
    hasText: false,
  }

  if (messageToSend.baseMessage?.template || messageToSend.messages?.some(message => message.template)) {
    messageSummaryDetails.hasText = true
  }

  const uniqueTypes = new Set()
  const uniqueGroups = new Set()
  for (const [, profile] of messageToSend.socialNetworksKeyedById) {
    const { type } = profile
    messageSummaryDetails.numProfiles++
    uniqueGroups.add(SocialProfileConstants.SN_TYPE_TO_SN_GROUP[type])
    if (isFeatureEnabledOrBeta('PUB_30974_TRACKING_RENAME')) {
      uniqueTypes.add(SocialProfileConstants.SN_TYPES[type])
    } else {
      uniqueTypes.add(SocialProfileConstants.SN_TYPES_ABBREVIATED[type])
    }
  }
  if (isFeatureEnabledOrBeta('PUB_30974_TRACKING_RENAME')) {
    messageSummaryDetails.socialNetworkType = [...uniqueTypes]
  } else {
    messageSummaryDetails.types = [...uniqueTypes]
  }
  messageSummaryDetails.numGroups = uniqueGroups.size || 0
  messageSummaryDetails.numMentions = doesMessagesContainsMention(mentionSupportedInnerMessages)
    ? getTotalMentionCount(mentionSupportedInnerMessages)
    : 0

  messageSummaryDetails.numImages = attachmentSummary.maxImages
  messageSummaryDetails.numVideos = attachmentSummary.maxVideos
  messageSummaryDetails.hasPDF = attachmentSummary.hasPDF
  messageSummaryDetails.numMedia = attachmentSummary.hasPDF
    ? 1
    : messageSummaryDetails.numImages + messageSummaryDetails.numVideos

  if (isFeatureEnabledOrBeta('PUB_25544_MEMBER_ID_TRACKING')) {
    messageSummaryDetails.memberId = memberId
    messageSummaryDetails.publishingMode = publishingMode
  }

  messageSummaryDetails.postType = messageToSend.postType
  messageSummaryDetails.hasCustomThumbnail = !!messageToSend.messages?.some(message =>
    MessageUtils.isThumbnailCustomized(message, SocialProfileConstants.SN_TYPE_TO_SN_GROUP[message.snType]),
  )

  messageSummaryDetails.acceptedHashtagSuggestion = acceptedHashtagSuggestion

  messageSummaryDetails.flexApproval = !!messageToSend.oneTimeReviewerId

  if (isPlannerView()) {
    try {
      const isSuggestedTimesPlaceholderClicked = JSON.parse(
        localStorageGet(Constants.COMPOSER_OPENED_FROM_SUGGESTED_POST, null),
      )
      const selectedPlannerPostMenuOption = JSON.parse(
        localStorageGet(Constants.COMPOSER_OPENED_FROM_PLANNER_POST_MENU, null),
      )

      messageSummaryDetails[Constants.COMPOSER_OPENED_FROM_SUGGESTED_POST] =
        isSuggestedTimesPlaceholderClicked
      messageSummaryDetails[Constants.COMPOSER_OPENED_FROM_PLANNER_POST_MENU] = selectedPlannerPostMenuOption
    } catch (e) {}
  }

  track(originId, summaryActionId, messageSummaryDetails)
}
