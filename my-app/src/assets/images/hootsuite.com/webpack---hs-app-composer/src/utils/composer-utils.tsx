/**
 * @preventMunge
 */

import Immutable from 'immutable'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import isNil from 'lodash/isNil'
import _ from 'underscore'

import { isTikTokEnabled } from 'fe-lib-darklaunch'
import { AUTO_SCHEDULE_MESSAGE } from 'fe-lib-entitlements'
import { logError } from 'fe-lib-logging'
import { uuid } from 'fe-lib-uuid'
import { TwitterLocationActions } from 'fe-pnc-comp-location-area'
import { ComposerConstants as NewComposerConstants } from 'fe-pnc-constants'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkType } from 'fe-pnc-constants-social-profiles'
import {
  Attachment,
  GifAttachment,
  ImageAttachment,
  VideoAttachment,
  PdfAttachment,
} from 'fe-pnc-data-composer-message'
import type {
  AttachmentObject,
  ImageAttachmentData,
  VideoAttachmentData,
  PdfAttachmentData,
  AttachmentData,
} from 'fe-pnc-data-composer-message'
import type { SanitizedAttachment, SanitizedMessage } from 'fe-pnc-data-message-previews'
import { profileDisconnectedDetected } from 'fe-pnc-data-social-profiles-v2'
import { getCampaign, getTagsById } from 'fe-pnc-lib-api'
import {
  getFeatureValue,
  isFeatureEnabled,
  isFeatureEnabledOrBeta,
  isFeatureDisabledAndNotBeta,
  isThreadsEnabled,
} from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'
import {
  getComponentsForCustomContext,
  getExcludedNetworkTypesForComponent,
  getNetworkTypesExcept,
} from 'fe-pnc-lib-networks-conf'
import ValidationErrorMessages from 'fe-pnc-validation-error-messages'
import {
  DISCONNECTED_NETWORK_ERROR_CODE,
  getMPSInformation,
  mapOverlappingErrorCodes,
} from 'fe-pnc-validation-error-messages'

import ComposerConstants from '@/constants/composer'
import ComposerErrorMessages from '@/constants/composer-error-messages'
import Constants from '@/constants/constants'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import MessageConstants from '@/constants/message'
import Message from '@/models/message'
import { composerActions } from '@/redux/reducers/composer'
import { store } from '@/redux/store'
import { Entitlements } from '@/typings/Flux'
import { Error, ErrorLevel } from '@/typings/Message'
import { SocialNetwork } from '@/typings/SocialNetwork'

import { track } from '@/utils/tracking'
import { dateToUnixTimestamp } from './composer-date-time-utils'
import { EntitlementsUtils } from './entitlement-utils'
import MessageUtils from './message-utils'

const {
  SN_TYPES,
  SN_GROUP_TO_SN_TYPES,
  SN_GROUP,
  SN_TYPE_TO_SN_GROUP,
  CHARACTER_COUNTER_GROUPS,
  INSTAGRAM_POST_TYPES,
} = SocialProfileConstants

const SCHEDULE_DUPLICATE_POST_STATUS_TITLE = translation._('Your post has been scheduled!')
const SCHEDULE_DUPLICATE_POST_STATUS_TITLE_MULTIPLE = translation._('Your posts have been scheduled!')
const SEND_NOW_DUPLICATE_POST_STATUS_TITLE = translation._('Your post has been sent!')
const SEND_NOW_DUPLICATE_POST_STATUS_TITLE_MULTIPLE = translation._('Your posts have been sent!')
const SEND_NOW_DUPLICATE_POST_STATUS_PROCESSING_TITLE = translation._(
  'Your post has been submitted for processing.',
)
// prettier-ignore
const SEND_NOW_DUPLICATE_POST_STATUS_PROCESSING_TITLE_MULTIPLE = translation._('Your posts have been submitted for processing.')
const SEND_NOW_DUPLICATE_POST_STATUS_VIDEO_TITLE = translation._(
  'Your video has been submitted for processing.',
)
// prettier-ignore
const SEND_NOW_DUPLICATE_POST_STATUS_VIDEO_TITLE_MULTIPLE = translation._('Your videos have been submitted for processing.')
const POST_STATUS_TITLE_PENDING = translation._('Your post has been sent for approval')
const POST_STATUS_TITLE_MULTIPLE_PENDING = translation._('Your posts have been sent for approval')

const EDIT_DUPLICATED_POST = translation._('You can now edit your duplicated post.')
const EDIT_DUPLICATED_POSTS = translation._('You can now edit your duplicated posts.')
const POST_STATUS_DESC_PENDING_OLD = translation._('Your post is pending approval.')
const DUPLICATE_POST_STATUS_DESC_MULTIPLE_PENDING = translation._('Posts have been queued for approval.')
const POST_STATUS_DESC_REJECTED = translation._('Your post is pending review.')
const DUPLICATE_POST_STATUS_DESC_MULTIPLE_REJECTED = translation._('Posts are pending review.')
// prettier-ignore
const POST_STATUS_DESC_PROCESSING = translation._('Your post has been submitted for processing. It will appear in Planner in a few minutes.')
// prettier-ignore
const POST_STATUS_DESC_MULTIPLE_PROCESSING = translation._('Your posts have been submitted for processing. They will appear in Planner in a few minutes.')
// prettier-ignore
const VIDEO_STATUS_DESC_PROCESSING = translation._('Your video has been submitted for processing. It will appear in Planner in a few minutes.')
// prettier-ignore
const VIDEO_STATUS_DESC_MULTIPLE_PROCESSING = translation._('Your videos have been submitted for processing. They will appear in Planner in a few minutes.')
const SEND_NOW_POST_STATUS_DESC = translation._('Your post has been sent!')
const SEND_NOW_POST_STATUS_DESC_MULTIPLE = translation._('Your posts have been sent!')
// prettier-ignore
const SEND_NOW_POST_STATUS_DESC_PENDING = translation._("Once it's approved, we'll publish the post right away.")
// prettier-ignore
const SEND_NOW_POST_STATUS_DESC_MULTIPLE_PENDING = translation._("Once they're approved, we'll publish the posts right away.")
// prettier-ignore
const SEND_NOW_POST_STATUS_DESC_MULTIPLE_REJECTED = translation._('Posts sent. Some post(s) are pending review.')
const SCHEDULE_POST_STATUS_DESC = translation._('Your post has been scheduled!')
const SCHEDULE_POST_STATUS_DESC_MULTIPLE = translation._('Your %s posts have been scheduled!')
// prettier-ignore
const SCHEDULE_POST_STATUS_DESC_PENDING = translation._("Once it's approved, we'll publish the post at its scheduled time.")
// prettier-ignore
const SCHEDULE_POST_STATUS_DESC_MULTIPLE_PENDING = translation._("Once they're approved, we'll publish the posts at their scheduled time.")
// prettier-ignore
const SCHEDULE_POST_STATUS_DESC_MULTIPLE_REJECTED = translation._('Posts scheduled. Some post(s) are pending review.')
const DUPLICATE_POST_BANNER_MESSAGE_TEXT = translation._('Boost settings have been cleared.')
const SEQUENTIAL_POST_STATUS_DESC = translation._('You are ready to post again!')
// prettier-ignore
const POST_STATUS_DESC_PARTIAL_PENDING = translation._('Some of your posts were sent for approval due to limited publishing permissions.',)

const EDIT_POST = translation._('Edit post')
const EDIT_DRAFT = translation._('Edit draft')
const EDIT_TEMPLATE = translation._('Edit template')
const NEW_TEMPLATE = translation._('Create template')
const PERSONALIZE_POST = translation._('Personalize post')

const SN_TYPE_TO_MENTION_TYPE = {
  [SN_TYPES.FACEBOOKPAGE]: SN_TYPES.FACEBOOKPAGE,
  [SN_TYPES.TWITTER]: SN_TYPES.TWITTER,
  [SN_TYPES.INSTAGRAM]: SN_TYPES.INSTAGRAM,
  [SN_TYPES.LINKEDINCOMPANY]: SN_TYPES.LINKEDINCOMPANY,
  [SN_TYPES.LINKEDIN]: SN_TYPES.LINKEDINCOMPANY,
}

const ComposerUtils = {
  isGifMimeType(mimeType: string) {
    return mimeType?.toLowerCase() === 'image/gif'
  },
  /**
   * Returns an attachment object of the right type if the data fits into one of the types
   * TODO: move to the attachment object
   * @param data
   * @param status ATTACHED|PENDING
   */
  createAttachmentFromData(data: any, status: string | null = null): AttachmentObject | null {
    let attachment: AttachmentObject | null = null
    if (status) {
      data.status = status
    }
    if (VideoAttachment.isVideoAttachment(data)) {
      attachment = new VideoAttachment(data as VideoAttachmentData)
    } else if (GifAttachment.isGifAttachment(data)) {
      attachment = new GifAttachment(data as ImageAttachmentData)
    } else if (ImageAttachment.isImageAttachment(data)) {
      attachment = new ImageAttachment(data as ImageAttachmentData)
    } else if (PdfAttachment.isPdfAttachment(data)) {
      attachment = new PdfAttachment(data as PdfAttachmentData)
    }
    return attachment
  },

  /**
   * Determines the title to display for a successfully posted/scheduled message
   * @param {{ messageToSend, responseMessages, isDuplicatingPost, entitlements }}
   */
  determineSuccessTitle({
    messageToSend,
    responseMessages,
    isDuplicatingPost,
    entitlements,
  }: {
    messageToSend: Message
    responseMessages: Array<{ state: string }>
    isDuplicatingPost: boolean
    entitlements: Entitlements
  }): string {
    let statusTitle = ''
    let isScheduled
    if (EntitlementsUtils.isFeatureEnabled(entitlements, AUTO_SCHEDULE_MESSAGE)) {
      isScheduled =
        !_.isNull(messageToSend.sendDate) ||
        (!_.isNull(messageToSend.isAutoScheduled) && messageToSend.isAutoScheduled)
    } else {
      isScheduled = !_.isNull(messageToSend.sendDate)
    }

    const pendingMessages = responseMessages.filter(message => MessageUtils.isPendingState(message.state))
    const hasPendingMessage = pendingMessages.length > 0
    const hasRejectedMessage = responseMessages.some(message => MessageUtils.isRejectedState(message.state))

    const isMultipleSocialNetworks = responseMessages.length > 1
    // Instagram Carousels sent via API live need to go through MUTS and therefore won't appear in planner right away.
    // This ensures users see a toast detailing why it won't appear immediately similar to transcoding
    const socialNetworkTypes = []
    messageToSend.socialNetworksKeyedById.map(sn => {
      socialNetworkTypes.push(sn.type)
    })
    const isInstagramDirectCarousel = ComposerUtils.isInstagramDirectCarousel(
      socialNetworkTypes,
      messageToSend.attachments,
      messageToSend.postType,
      messageToSend.publishingMode,
    )

    if (isDuplicatingPost) {
      if (isScheduled) {
        statusTitle = isMultipleSocialNetworks
          ? SCHEDULE_DUPLICATE_POST_STATUS_TITLE_MULTIPLE
          : SCHEDULE_DUPLICATE_POST_STATUS_TITLE
      } else if (hasPendingMessage) {
        if (pendingMessages.length === responseMessages.length) {
          // For simplicity, display status title only if all posts are pending.
          statusTitle =
            pendingMessages.length > 1 ? POST_STATUS_TITLE_MULTIPLE_PENDING : POST_STATUS_TITLE_PENDING
        } else {
          statusTitle = isMultipleSocialNetworks
            ? DUPLICATE_POST_STATUS_DESC_MULTIPLE_PENDING
            : POST_STATUS_DESC_PENDING_OLD
        }
      } else if (hasRejectedMessage) {
        statusTitle = isMultipleSocialNetworks
          ? DUPLICATE_POST_STATUS_DESC_MULTIPLE_REJECTED
          : POST_STATUS_DESC_REJECTED
      } else if (isInstagramDirectCarousel) {
        statusTitle = isMultipleSocialNetworks
          ? SEND_NOW_DUPLICATE_POST_STATUS_PROCESSING_TITLE_MULTIPLE
          : SEND_NOW_DUPLICATE_POST_STATUS_PROCESSING_TITLE
      } else if (
        messageToSend.hasVideoAttachment() &&
        !ComposerUtils.isPushPublishing(messageToSend.publishingMode)
      ) {
        statusTitle = isMultipleSocialNetworks
          ? SEND_NOW_DUPLICATE_POST_STATUS_VIDEO_TITLE_MULTIPLE
          : SEND_NOW_DUPLICATE_POST_STATUS_VIDEO_TITLE
      } else {
        statusTitle = isMultipleSocialNetworks
          ? SEND_NOW_DUPLICATE_POST_STATUS_TITLE_MULTIPLE
          : SEND_NOW_DUPLICATE_POST_STATUS_TITLE
      }
    } else if (hasPendingMessage && pendingMessages.length === responseMessages.length) {
      statusTitle =
        pendingMessages.length > 1 ? POST_STATUS_TITLE_MULTIPLE_PENDING : POST_STATUS_TITLE_PENDING
    }
    return statusTitle
  },

  /**
   * Determines the message to display for a successfully scheduled message
   * @param messageToSend The message that was sent
   * @param responseMessages The message(s) returned by the service
   * @param isSequentialPosting Was this a sequential post?
   * @param isDuplicatingPost
   * @param entitlements
   * @return {
   */
  determineSuccessMessage(
    messageToSend: Message,
    responseMessages: Array<{ state: string }>,
    isSequentialPosting: boolean,
    isDuplicatingPost = false,
    entitlements: Entitlements,
  ) {
    let statusMessage = ''
    let isScheduled
    if (EntitlementsUtils.isFeatureEnabled(entitlements, AUTO_SCHEDULE_MESSAGE)) {
      isScheduled =
        !_.isNull(messageToSend.sendDate) ||
        (!_.isNull(messageToSend.isAutoScheduled) && messageToSend.isAutoScheduled)
    } else {
      isScheduled = !_.isNull(messageToSend.sendDate)
    }
    const isMultipleSocialNetworks = responseMessages.length > 1

    const pendingMessages = responseMessages.filter(message => MessageUtils.isPendingState(message.state))
    const hasPendingMessage = pendingMessages.length > 0
    const hasRejectedMessage = responseMessages.some(message => MessageUtils.isRejectedState(message.state))

    const socialNetworkTypes = []
    messageToSend.socialNetworksKeyedById.map(sn => {
      socialNetworkTypes.push(sn.type)
    })

    const isInstagramDirectCarousel = ComposerUtils.isInstagramDirectCarousel(
      socialNetworkTypes,
      messageToSend.attachments,
      messageToSend.postType,
      messageToSend.publishingMode,
    )

    if (isScheduled) {
      if (hasPendingMessage) {
        if (pendingMessages.length !== responseMessages.length) {
          // Some of the posts are pending for approval while the others are scheduled
          statusMessage = POST_STATUS_DESC_PARTIAL_PENDING
        } else {
          statusMessage =
            pendingMessages.length > 1
              ? SCHEDULE_POST_STATUS_DESC_MULTIPLE_PENDING
              : SCHEDULE_POST_STATUS_DESC_PENDING
        }
      } else if (hasRejectedMessage) {
        statusMessage = isMultipleSocialNetworks
          ? SCHEDULE_POST_STATUS_DESC_MULTIPLE_REJECTED
          : POST_STATUS_DESC_REJECTED
      } else {
        statusMessage = isMultipleSocialNetworks
          ? SCHEDULE_POST_STATUS_DESC_MULTIPLE.replace('%s', responseMessages.length)
          : SCHEDULE_POST_STATUS_DESC
      }
    } else {
      if (hasPendingMessage) {
        if (pendingMessages.length !== responseMessages.length) {
          // Some of the posts are pending for approval while the others are sent
          statusMessage = POST_STATUS_DESC_PARTIAL_PENDING
        } else {
          statusMessage =
            pendingMessages.length > 1
              ? SEND_NOW_POST_STATUS_DESC_MULTIPLE_PENDING
              : SEND_NOW_POST_STATUS_DESC_PENDING
        }
      } else if (isInstagramDirectCarousel) {
        statusMessage = isMultipleSocialNetworks
          ? POST_STATUS_DESC_MULTIPLE_PROCESSING
          : POST_STATUS_DESC_PROCESSING
      } else if (
        messageToSend.hasVideoAttachment() &&
        !ComposerUtils.isPushPublishing(messageToSend.publishingMode)
      ) {
        statusMessage = isMultipleSocialNetworks
          ? VIDEO_STATUS_DESC_MULTIPLE_PROCESSING
          : VIDEO_STATUS_DESC_PROCESSING
      } else if (hasRejectedMessage) {
        statusMessage = isMultipleSocialNetworks
          ? SEND_NOW_POST_STATUS_DESC_MULTIPLE_REJECTED
          : POST_STATUS_DESC_REJECTED
      } else {
        statusMessage = isMultipleSocialNetworks
          ? SEND_NOW_POST_STATUS_DESC_MULTIPLE
          : SEND_NOW_POST_STATUS_DESC
      }
    }

    if (isSequentialPosting) {
      statusMessage = `${statusMessage} ${SEQUENTIAL_POST_STATUS_DESC}`
    }

    if (isDuplicatingPost) {
      statusMessage = `${isMultipleSocialNetworks ? EDIT_DUPLICATED_POSTS : EDIT_DUPLICATED_POST}`
      if (messageToSend.isBoosted) {
        statusMessage += ` ${DUPLICATE_POST_BANNER_MESSAGE_TEXT}`
      }
    }

    return statusMessage
  },

  /**
   * @param {Message} messageToSend
   * @param {Array} errors
   * @return {string}
   */
  determineErrorMessages(messageToSend, errors) {
    const errorMessages = []

    errors.forEach(error => {
      if (typeof error === 'object' && typeof error.socialProfileId !== 'undefined') {
        const socialProfileId = error.socialProfileId.toString()
        const socialProfile = messageToSend.socialNetworksKeyedById.get(socialProfileId)
        const socialProfileName = socialProfile.username
        const socialProfileType = socialProfile.type

        let socialProfileErrorMessages = Immutable.Set()
        error.codes &&
          error.codes.forEach(errorCode => {
            if (isFeatureEnabled('PUB_30000_DEPRECATE_ERROR_SOURCES')) {
              if (ValidationErrorMessages[errorCode].title) {
                socialProfileErrorMessages = socialProfileErrorMessages.add(
                  `${ValidationErrorMessages[errorCode].title}`,
                )
              }
            } else {
              if (ComposerErrorMessages[errorCode]) {
                socialProfileErrorMessages = socialProfileErrorMessages.add(
                  `${ComposerErrorMessages.get(errorCode)}`,
                )
              }
            }
          })
        if (socialProfileErrorMessages.size <= 0) {
          if (isFeatureEnabled('PUB_30000_DEPRECATE_ERROR_SOURCES')) {
            socialProfileErrorMessages = socialProfileErrorMessages.add(
              `${ValidationErrorMessages.default.title}`,
            )
          } else {
            socialProfileErrorMessages = socialProfileErrorMessages.add(
              `${ComposerErrorMessages.defaultFailureReason}`,
            )
          }
        }

        // prettier-ignore
        const statusMessageBase = translation._('Unable to %s1 to %n (%t) account. %s2:')
           .replace('%s1', messageToSend.sendDate === null ? 'send' : 'schedule')
           .replace('%s2', socialProfileErrorMessages.size > 1 ? 'Errors' : 'Error')
        const socialNetworkErrorMessage = statusMessageBase
          .replace('%n', socialProfileName)
          .replace('%t', socialProfileType)
        errorMessages.push(
          `${socialNetworkErrorMessage}\r\n\t${Array.from(socialProfileErrorMessages).join('\r\n\t')}`,
        )
      } else if (typeof error === 'object' && Array.isArray(error.codes)) {
        error.codes.forEach(code =>
          errorMessages.push(
            isFeatureEnabled('PUB_30000_DEPRECATE_ERROR_SOURCES')
              ? ValidationErrorMessages[code].title
              : ComposerErrorMessages.get(code),
          ),
        )
      } else if (typeof error === 'number') {
        if (isFeatureEnabled('PUB_30000_DEPRECATE_ERROR_SOURCES')) {
          if (typeof ValidationErrorMessages[error] !== 'undefined') {
            errorMessages.push(ValidationErrorMessages[error].title)
          }
        } else {
          if (typeof ComposerErrorMessages[error] !== 'undefined') {
            errorMessages.push(ComposerErrorMessages.get(error))
          }
        }
      }
    })
    if (errorMessages.length) {
      return errorMessages.join('\r\n\r\n')
    } else {
      return isFeatureEnabled('PUB_30000_DEPRECATE_ERROR_SOURCES')
        ? ValidationErrorMessages.default.title
        : ComposerErrorMessages.default
    }
  },

  /**
   * Returns an array of attachments that can be used when composing a new Message
   *
   * @param {{
   *   url: string,
   *   fileName: ?string,
   *   bytes: ?number,
   *   isLoading: ?boolean,
   *   thumbnailUrl: ?string,
   *   mimeType: ?string
   * }[]} attachments - an array of data used to create the Attachments
   */
  createAttachments(attachments): Array<AttachmentObject> {
    if (!attachments || !attachments.length) {
      return []
    }

    // eslint-disable-next-line consistent-return
    return attachments.map(attachment => {
      // Skip if already a model instance
      if (attachment instanceof Attachment) {
        return attachment
      }

      if (attachment.image?.imageData) {
        return ComposerUtils.createAttachmentFromData({
          fileName: attachment.name || '',
          bytes: parseInt(attachment.image.imageData.sizeBytes, 10) || 0,
          mimeType: attachment.image.mimeType || undefined,
          thumbnailUrl: attachment.image.thumbnail.url || attachment.image.imageData.url || undefined,
          url: attachment.image.imageData.url || undefined,
          height: parseInt(attachment.image.imageData.height, 10) || 0,
          width: parseInt(attachment.image.imageData.width, 10) || 0,
          altText: attachment.image.altText || undefined,
        })
      }

      if (attachment.video?.thumbnail) {
        return ComposerUtils.createAttachmentFromData({
          fileName: attachment.name || '',
          bytes: parseInt(attachment.bytes, 10) || 0,
          mimeType: 'video/mp4',
          thumbnailOffset: attachment.thumbnailOffset || null,
          thumbnailUrl: attachment.video.thumbnail.url || undefined,
          url: attachment.video.url || undefined,
          height: parseInt(attachment.video.thumbnail.height, 10) || 0,
          width: parseInt(attachment.video.thumbnail.width, 10) || 0,
          subtitles: ComposerUtils.hydrateVideoSubtitlesList(attachment.video.subtitles),
        })
      }

      if (attachment.url) {
        return ComposerUtils.createAttachmentFromData({
          fileName: attachment.fileName || '',
          bytes: parseInt(attachment.bytes, 10) || 0,
          mimeType: attachment.mimeType || undefined,
          thumbnailOffset: attachment.thumbnailOffset || null,
          thumbnailUrl: attachment.thumbnailUrl || undefined,
          thumbnailUrls: attachment.thumbnailUrls || [],
          url: attachment.url || undefined,
          height: parseInt(attachment.height, 10) || 0,
          width: parseInt(attachment.width, 10) || 0,
          altText: attachment.altText || undefined,
          subtitles: ComposerUtils.hydrateVideoSubtitlesList(attachment.subtitles),
          audioCodec: attachment.audioCodec || undefined,
          videoCodec: attachment.videoCodec || undefined,
          audioProfile: attachment.audioProfile || undefined,
          audioSampleRate: attachment.audioSampleRate || undefined,
          displayAspectRatio: attachment.displayAspectRatio || undefined,
          durationInSec: attachment.durationInSec || undefined,
          fileSource: attachment.fileSource || undefined,
          frameRate: attachment.frameRate || undefined,
          rotation: attachment.rotation || undefined,
          status: attachment.status || undefined,
          trackingSource: attachment.trackingSource || undefined,
          userMetadata: VideoAttachment.metadataFromRequestObject(attachment),
          videoBitrate: attachment.videoBitrate || undefined,
        })
      }
    })
  },

  /**
   * @param attachments
   */
  shouldReplaceAttachments(attachments: Array<AttachmentObject>) {
    let numImages = 0
    let numGifs = 0
    let numVideos = 0
    attachments.forEach(attachment => {
      if (ImageAttachment.isImageAttachment(attachment as ImageAttachment)) {
        numImages++
      } else if (GifAttachment.isGifAttachment(attachment as ImageAttachment)) {
        numGifs++
      } else if (VideoAttachment.isVideoAttachment(attachment as VideoAttachment)) {
        numVideos++
      }
    })
    if (
      (numImages > 0 && (numGifs > 0 || numVideos > 0)) ||
      numGifs > 1 ||
      numVideos > 1 ||
      (numGifs && numVideos)
    ) {
      return true
    }
    return false
  },

  /**
   * @param {{
   *   originalUrl: String,
   *   description: ?String,
   *   title: ?String,
   *   errors: ?Array,
   *   thumbnailUrls: [String]
   * }} linkScrapeResponse
   * @return {{
   *   originalUrl: String,
   *   url: String,
   *   description: ?String,
   *   title: ?String,
   *   thumbnailUrl: ?String,
   *   thumbnailUrls: [{
   *    thumbnailUrl: string,
   *    originalUrl: null
   *    hasError: ?boolean,
   *    hasWarning: ?boolean
   *   }]
   * }}
   */
  getLinkPreviewFromLinkScrapeResponse(linkScrapeResponse) {
    const isEmpty = linkScrapeResponse.description === null && linkScrapeResponse.title === null
    const emptyImages =
      linkScrapeResponse.thumbnailUrls === null ||
      (linkScrapeResponse.thumbnailUrls &&
        Array.isArray(linkScrapeResponse.thumbnailUrls) &&
        linkScrapeResponse.thumbnailUrls.length === 0)
    const hasEmptyError =
      linkScrapeResponse.errors &&
      Array.isArray(linkScrapeResponse.errors) &&
      _.contains(linkScrapeResponse.errors, ComposerConstants.ERROR_CODES.EMPTY_LINK_SCRAPE)
    if ((isEmpty && emptyImages) || hasEmptyError) {
      if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
        return {
          hasError: true,
          hasWarning: false,
        }
      }
      return null
    }

    const hasImages = linkScrapeResponse.thumbnailUrls?.length

    let thumbnailUrls = []
    if (hasImages) {
      thumbnailUrls = linkScrapeResponse.thumbnailUrls.map(imageUrl => {
        return {
          thumbnailUrl: imageUrl,
          originalUrl: null,
        }
      })
    }

    const thumbnailUrl = hasImages ? thumbnailUrls[0].thumbnailUrl : null
    const url =
      linkScrapeResponse.originalUrl && linkScrapeResponse.originalUrl.toLowerCase().indexOf('http') === -1
        ? `http://${linkScrapeResponse.originalUrl}`
        : linkScrapeResponse.originalUrl
    return {
      url,
      originalUrl: linkScrapeResponse.originalUrl,
      thumbnailUrl,
      thumbnailUrls,
      title: linkScrapeResponse.title || null,
      description: linkScrapeResponse.description || null,
      ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && {
        hasError: false,
        hasWarning: false,
      }),
    }
  },

  /**
   * Returns the social network types to exclude.
   * @param {*} customContext key for the context that the customer composer was opened in
   * @return {string[]}
   */
  async getSocialNetworkTypesToExclude(customContext) {
    let networkTypesToExclude
    // for AMPLIFY, we need to consider every available network
    if (customContext && !ComposerUtils.isAmplifyComposer(customContext)) {
      const exceptTypes = [customContext]
      networkTypesToExclude = await getNetworkTypesExcept(exceptTypes)
    } else {
      networkTypesToExclude = await getExcludedNetworkTypesForComponent('COMPOSER', 'COMMON')
      // networksConf has been updated to exclude FACEBOOK from COMPOSER.
      // We still want to show FACEBOOK (personal profiles) in Composer,
      // so we need to exclude it from networkTypesToExclude.
      networkTypesToExclude = networkTypesToExclude.filter(type => type !== SN_TYPES.FACEBOOK)
    }

    if (!isThreadsEnabled()) {
      networkTypesToExclude.push(SN_TYPES.THREADS)
    }

    return networkTypesToExclude
  },

  /**
   * Returns true if one of the given profile types is selected
   * @param {string[]} socialNetworks The socialNetworks(s)
   * @param {...string} types One or more social profile types
   * @return {boolean}
   */
  hasSocialProfileType(socialNetworks, ...types) {
    return socialNetworks.some(sn => types.includes(sn))
  },

  /**
   * Returns true if only the given profile types are selected
   * @param {string[]} socialNetworks The socialNetworks(s)
   * @param {...string} types One or more social profile types
   * @return {boolean}
   */
  hasOnlySocialProfileType(socialNetworks, ...types) {
    return socialNetworks.length ? socialNetworks.every(sn => types.includes(sn)) : false
  },

  /**
   * Determines if there is a LinkedIn network in the given socialNetworks
   * @param {...string} socialNetworks One or more social networks
   * @return {boolean}
   */
  hasLinkedInNetwork(...socialNetworks) {
    return this.hasSocialProfileType(socialNetworks, ...SN_GROUP_TO_SN_TYPES[SN_GROUP.LINKEDIN])
  },

  /**
   * Determines if there is a Facebook network in the given socialNetworks
   * @param {...string} socialNetworks One or more social networks
   * @return {boolean}
   */
  hasFacebookNetwork(...socialNetworks) {
    return this.hasSocialProfileType(socialNetworks, ...SN_GROUP_TO_SN_TYPES[SN_GROUP.FACEBOOK])
  },

  /**
   * Determines if there is an Instagram or Instagram Business network in the given socialNetworks
   * @param {...string} socialNetworks One or more social networks
   * @return {boolean}
   */
  hasInstagramNetwork(...socialNetworks) {
    return this.hasSocialProfileType(socialNetworks, ...SN_GROUP_TO_SN_TYPES[SN_GROUP.INSTAGRAM])
  },

  /**
   * Determines if there is a Threads network in the given socialNetworks
   * @param {...string} socialNetworks One or more social networks
   * @return {boolean}
   */
  hasThreadsNetwork(...socialNetworks) {
    return this.hasSocialProfileType(socialNetworks, ...SN_GROUP_TO_SN_TYPES[SN_GROUP.THREADS])
  },

  /**
   * Determines if there is a Twitter network in the given socialNetworks
   * @param {...string} socialNetworks One or more social networks
   * @return {boolean}
   */
  hasTwitterNetwork(...socialNetworks) {
    return this.hasSocialProfileType(socialNetworks, ...SN_GROUP_TO_SN_TYPES[SN_GROUP.TWITTER])
  },

  /**
   * Determines if there is a Twitter network in the given socialNetworks
   * @param {...string} socialNetworks One or more social networks
   * @return {boolean}
   */
  hasTikTokNetwork(...socialNetworks) {
    return this.hasSocialProfileType(
      socialNetworks,
      ...SocialProfileConstants.SN_GROUP_TO_SN_TYPES[SocialProfileConstants.SN_GROUP.TIKTOK],
    )
  },

  hasInstagramPersonalNetwork(socialNetworks) {
    return this.hasSocialProfileType(socialNetworks, SN_TYPES.INSTAGRAM)
  },

  hasInstagramPersonalNetworkBulkComposer(socialProfilesKeyedByType, selectedSocialNetworkIds) {
    const instagramPersonalIds =
      socialProfilesKeyedByType?.[SN_TYPES.INSTAGRAM]?.map(socialProfile => socialProfile.socialProfileId) ??
      []
    return instagramPersonalIds.some(id => selectedSocialNetworkIds.includes(id))
  },

  hasInstagramBusinessNetwork(socialNetworks) {
    return this.hasSocialProfileType(socialNetworks, SN_TYPES.INSTAGRAMBUSINESS)
  },

  isInstagramReel(postType) {
    return postType == INSTAGRAM_POST_TYPES.IG_REEL
  },

  isInstagramStory(postType) {
    return postType == INSTAGRAM_POST_TYPES.IG_STORY
  },

  /**
   * Appends a few properties to the attachments and binds Attachment types to each attachment
   */
  formatAttachments(attachments: Array<AttachmentData>, draftDataForLogging): Array<AttachmentObject> {
    if (!attachments) {
      return [] as Array<AttachmentObject>
    }
    return attachments
      .map(media => {
        const newMedia = {}
        Object.keys(media).forEach(key => {
          if (media.hasOwnProperty(key) && key.startsWith('_')) {
            newMedia[key.substring(1)] = media[key]
          } else {
            newMedia[key] = media[key]
          }
        })
        media.thumbnailUrl = newMedia.signedThumbnailUrl || newMedia.thumbnailUrl
        media.url = newMedia.signedUrl || newMedia.url

        newMedia.subtitles = ComposerUtils.hydrateVideoSubtitlesList(newMedia.subtitles)
        try {
          return ComposerUtils.createAttachmentFromData(newMedia)
        } catch (e: any) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed to format draft attachment', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
            draftId: draftDataForLogging?.draft?.id,
            draftCreationDate: draftDataForLogging?.draft?.creationDate,
            draftLastModifiedDate: draftDataForLogging?.draft?.lastModifiedDate,
            requestData: JSON.stringify(newMedia),
          })
          return
        }
      })
      .filter(attachment => attachment)
  },

  /**
   * Formats an attachment object for the draft service, by removing _ prefixes
   */
  formatAttachmentsForDraft(attachments: Array<AttachmentObject>): Array<AttachmentObject> {
    return attachments.map(attachment => {
      const newAttachment = {}
      Object.keys(attachment).forEach(key => {
        if (attachment.hasOwnProperty(key) && key.startsWith('_')) {
          newAttachment[key.substring(1)] = attachment[key]
        } else {
          newAttachment[key] = attachment[key]
        }
      })
      return newAttachment
    }) as Array<AttachmentObject>
  },

  /**
   * Converts from a GET message in MPS to a message object
   * @param {object} draft
   * @param {string} timezoneName
   * @param {object} socialNetworks
   * @return {Message}
   */
  messageFromDraft(draft, timezoneName, socialNetworks) {
    const d = draft.draft
    const m = d.message

    // set up messageData object
    const messageData: Partial<Message> = {
      messageType: Constants.TYPE.DRAFT,
    }

    // get draft properties
    Object.assign(messageData, _.pick(d, ['id', 'state', 'isAutoScheduled']))

    // get social network profiles keyed by id
    messageData.socialNetworksKeyedById = draft.socialProfileIds
      ? Immutable.OrderedMap(
          draft.socialProfileIds.map(snId =>
            typeof socialNetworks[snId] !== 'undefined' ? [snId, socialNetworks[snId]] : undefined,
          ),
        )
      : undefined

    // get draft message properties
    Object.assign(
      messageData,
      _.pick(m, [
        'source',
        'campaignId',
        'albumName',
        'albumType',
        'tags',
        'linkSettings',
        'linkSettingsPresetId',
        'extendedInfo',
        'locations',
        'targeting',
        'composeType',
        'boards',
        'postType',
        'publishingMode',
        'publisherNotes',
      ]),
    )
    const isDuplicate = messageData.id === ComposerConstants.DUPLICATE_DRAFT

    // message text including link settings if any
    const text = m.text
    if (text) {
      // Generate linkSettings uuids if not available
      const linkSettingsWithIds = messageData?.linkSettings?.map(linkSetting => {
        if (!linkSetting.id) {
          linkSetting.id = uuid()
        }

        if (!linkSetting.linkTracker) {
          linkSetting.linkTracker = {
            type: Constants.LINK_TRACKER.NONE,
            trackingParameters: null,
          }
        }
        linkSetting.linkShortenerId = linkSetting.linkShortenerId ?? Constants.LINK_SHORTENER.NONE

        return linkSetting
      })
      messageData.template = MessageUtils.buildTemplateFromMessage(text, linkSettingsWithIds, [])
      messageData.linkSettings = linkSettingsWithIds
    }

    // send date
    messageData.sendDate = dateToUnixTimestamp(d.scheduledDate, timezoneName)

    // link preview
    const linkPreview = cloneDeep(m.urlPreview)
    if (linkPreview) {
      linkPreview.thumbnailPreview = get(d, ['message', 'urlPreview', 'image', 'src'])
      messageData.urlPreview = linkPreview
      messageData.unEditedUrlPreview = linkPreview
    }

    // attachments
    messageData.attachments = this.formatAttachments(m.attachments, draft)

    // boards
    messageData.boards = m.boards ? m.boards : undefined

    messageData.postType = m.postType ? m.postType : undefined
    messageData.publishingMode = m.publishingMode ? m.publishingMode : undefined

    messageData.publisherNotes = m.publisherNotes ? m.publisherNotes : undefined

    const message = new Message(messageData)

    if (
      isFeatureEnabled('PUB_12938_STATE_FARM_NC_URL_PARAMS') &&
      ComposerUtils.isStateFarm(d.organizationId)
    ) {
      if (message.linkSettings?.length) {
        message.memberEmail = message.linkSettings[0].memberEmailAddress
        message.stateFarmContentSourceId = message.linkSettings[0].contentLibraryTemplateId || -1
      }
    }

    // set up messages array
    message.messages = messageData.socialNetworksKeyedById
      .map(({ socialNetworkId, type }) => {
        const msg = message.buildMessageFromBase(socialNetworkId, type)
        const innerMessageDataFromDraft = m.messages.find(
          innerMsg => `${innerMsg.snId}` === `${socialNetworkId}`,
        )

        if (innerMessageDataFromDraft && Array.isArray(innerMessageDataFromDraft.attachments)) {
          msg.attachments = this.formatAttachments(innerMessageDataFromDraft.attachments, draft)
        }

        // set text and linkSettings
        if (innerMessageDataFromDraft) {
          const {
            hootPostId,
            message,
            linkSettings: snLinkSettings,
            linkSettingsPresetId,
            linkPreview,
          } = innerMessageDataFromDraft
          const { linkSettings } = m
          let perNetworkMentions
          // Mentions are temporary disabled for Twitter
          // https://hootsuite.atlassian.net/browse/PUB-30451
          if (isFeatureEnabled('PUB_30451_DISABLE_TWITTER_MENTIONS_SEARCH')) {
            if (msg.snType === SN_TYPES.TWITTER) {
              perNetworkMentions = []
            } else {
              perNetworkMentions = innerMessageDataFromDraft.mentions
            }
          } else {
            perNetworkMentions = innerMessageDataFromDraft.mentions
          }

          if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
            msg.hootPostId = hootPostId
            msg.linkSettings = snLinkSettings
            msg.template = MessageUtils.buildTemplateFromMessage(message, snLinkSettings, perNetworkMentions)
            msg.linkSettingsPresetId = linkSettingsPresetId
            msg.linkPreview = linkPreview
            msg.unEditedUrlPreview = linkPreview
          } else {
            msg.template = MessageUtils.buildTemplateFromMessage(message, linkSettings, perNetworkMentions)
          }
        }

        // set locations
        if (typeof msg.location === 'object') {
          const { placeName, placeId, latitude, longitude } = msg.location
          if (this.hasTwitterNetwork(type)) {
            TwitterLocationActions.setLocationValue(placeName)
            TwitterLocationActions.setLatitude(latitude)
            TwitterLocationActions.setLongitude(longitude)
            TwitterLocationActions.setLocationId(placeId)
          }
        }

        if (isFeatureDisabledAndNotBeta('PUB_30706_LINK_SETTINGS_PNE')) {
          // set link settings
          if (innerMessageDataFromDraft) {
            const { linkSettings, hootPostId } = innerMessageDataFromDraft
            msg._linkSettings = linkSettings
            msg._hootPostId = hootPostId
          }
        }

        // set mentions
        if (innerMessageDataFromDraft?.mentions && innerMessageDataFromDraft?.mentions.length > 0 && type) {
          // add the sn type back into the mentions. Any that are no longer valid will be rendered as plain text as usual
          innerMessageDataFromDraft.mentions.forEach(mention => {
            mention.snType = SN_TYPE_TO_MENTION_TYPE[type]
            mention.completedWithText = mention.displayText
          })

          // Mentions are temporary disabled for Twitter
          // https://hootsuite.atlassian.net/browse/PUB-30451
          if (isFeatureEnabled('PUB_30451_DISABLE_TWITTER_MENTIONS_SEARCH')) {
            if (msg.snType === SN_TYPES.TWITTER) {
              msg.mentions = []
            } else {
              msg.mentions = innerMessageDataFromDraft.mentions
            }
          } else {
            msg.mentions = innerMessageDataFromDraft.mentions
          }
        }

        // set privacy fields to inner message
        if (isTikTokEnabled()) {
          if (m.privacy?.tiktok) {
            Object.assign(msg, { ...m.privacy.tiktok })

            delete msg.privacy
          }
        }

        // parse isBoosted flag and add it to the model
        msg.isBoosted = !isDuplicate && Boolean(innerMessageDataFromDraft?.isBoosted)

        return msg
      })
      .toArray()

    // Need to set selectedNetworkGroup for MessageEditor to extract mentions on render
    // Only need this when 1 SN selected. Otherwise, composer should show Initial Content tab
    const selectedNetworkGroup =
      message.messages.length === 1 ? SN_TYPE_TO_SN_GROUP[message.messages[0].snType] : null

    store.dispatch(composerActions.setSelectedNetworkGroup(selectedNetworkGroup))

    return message
  },

  hydrateVideoSubtitles(subtitlesData) {
    return {
      url: subtitlesData.url,
      filename: subtitlesData.filename || undefined,
      mimeType: subtitlesData.mimeType || undefined,
      bytes: parseInt(subtitlesData.bytes, 10) || undefined,
    }
  },

  hydrateVideoSubtitlesList(maybeSubtitlesDataList) {
    return Array.isArray(maybeSubtitlesDataList)
      ? maybeSubtitlesDataList.map(ComposerUtils.hydrateVideoSubtitles)
      : undefined
  },

  /**
   * Converts from a GET message in MPS to a message object
   * @param {object} data
   * @param {string} timezoneName
   * @param {object} socialNetworks
   * @return {Message}
   */
  messageFromMPSGetMessage(data, timezoneName, socialNetworks) {
    const messageData = {}
    if (data.id) {
      messageData.id = data.id
    }

    if (data.state) {
      messageData.state = data.state
    }

    if (data.campaignId) {
      messageData.campaignId = data.campaignId
    }

    let socialProfile
    if (data.socialProfile) {
      socialProfile = socialNetworks[data.socialProfile.id]
      messageData.socialNetworksKeyedById = Immutable.OrderedMap({
        [data.socialProfile.id.toString()]: socialProfile,
      })
    }

    if (data.scheduledSendTime) {
      messageData.sendDate = dateToUnixTimestamp(data.scheduledSendTime, timezoneName)
    }

    if (data.boards) {
      messageData.boards = [...data.boards]
    }

    if (data.nativeMediaUrls) {
      messageData.nativeMediaUrls = [...data.nativeMediaUrls]
    }

    // As part of preventing duplicating code around handling displaying attachments (ie. mediaUrls) in the frontend,
    // each board's attachment is converted to mediaUrls format so they can be used the same way.
    const mediaUrlsFromBoards = messageData.boards
      ? messageData.boards.map(b => b.attachment).filter(a => a)
      : []

    if (data.mediaUrls || mediaUrlsFromBoards) {
      const mediaUrls = data.mediaUrls ? data.mediaUrls : mediaUrlsFromBoards
      messageData.attachments = mediaUrls.map(media => {
        media.thumbnailUrl = media.signedThumbnailUrl || media.thumbnailUrl
        media.url = media.signedUrl || media.url
        return ComposerUtils.createAttachmentFromData(media)
      })
    }

    if (data.album?.name) {
      messageData.albumName = data.album.name
    }

    if (data.tagData) {
      messageData.tags = data.tagData
    }

    if (data.fbAttachment) {
      const linkPreview = cloneDeep(data.fbAttachment)

      if (linkPreview.image?.src) {
        linkPreview.thumbnailUrl = linkPreview.image.src
      }

      messageData.unEditedUrlPreview = linkPreview
      messageData.urlPreview = linkPreview
    }

    const snType = socialNetworks[data.socialProfile.id].type

    store.dispatch(composerActions.setSelectedNetworkGroup(SN_TYPE_TO_SN_GROUP[snType]))

    if (data.location) {
      messageData.locations = {}

      if (this.hasFacebookNetwork(snType)) {
        messageData.locations[SN_GROUP.FACEBOOK] = data.location
      } else if (this.hasInstagramNetwork(snType)) {
        messageData.locations[SN_GROUP.INSTAGRAM] = data.location
      } else if (this.hasTwitterNetwork(snType)) {
        messageData.locations[SN_GROUP.TWITTER] = data.location
      }
    }

    if (data.targeting) {
      messageData.targeting = data.targeting
    }

    if (data.linkSettings) {
      let linkSettings = cloneDeep(data.linkSettings)
      // assumes that message text is set above (because how would you have linkSettings without text?)
      let msgText = data.text

      linkSettings = linkSettings.map(linkSetting => {
        if (!linkSetting.linkTracker) {
          linkSetting.linkTracker = {
            type: Constants.LINK_TRACKER.NONE,
            trackingParameters: null,
          }
        }
        if (linkSetting.previouslyComputedLink) {
          msgText = msgText.replace(
            linkSetting.previouslyComputedLink.shortenedUrl,
            linkSetting.previouslyComputedLink.originalUrl,
          )
        }
        // Generate linkSettings uuids if not available
        if (!linkSetting.id) {
          linkSetting.id = uuid()
        }

        return linkSetting
      })

      messageData.linkSettings = linkSettings
    }

    // Mentions are temporary disabled for Twitter
    // https://hootsuite.atlassian.net/browse/PUB-30451
    if (isFeatureEnabled('PUB_30451_DISABLE_TWITTER_MENTIONS_SEARCH')) {
      if (data?.mentions && socialProfile.type === SN_TYPES.TWITTER) {
        data.mentions = []
      }
    }

    if (data.text) {
      messageData.template = MessageUtils.buildTemplateFromMessage(
        data.text,
        messageData.linkSettings,
        data?.mentions,
      )
    }

    if (data.linkSettingsPresetId) {
      messageData.linkSettingsPresetId = data.linkSettingsPresetId
    }

    messageData.postType = data.postType?.postType || undefined
    messageData.publishingMode = data.publishingMode?.mode || undefined
    messageData.publisherNotes = data.publisherNotes || undefined

    messageData.oneTimeReviewerId = data.oneTimeReviewerId

    const message = new Message(messageData)
    message.messages = messageData.socialNetworksKeyedById
      .map(sn => {
        const msg = message.buildMessageFromBase(sn.socialNetworkId.toString(), sn.type, data.isBoosted)
        if (data.extendedInfo && data.socialProfile && sn.type === SN_TYPES.PINTEREST) {
          msg.extendedInfo = Object.assign(
            {},
            {
              boards: [
                {
                  boardId: data.extendedInfo.boardId,
                  boardName: data.extendedInfo.boardName,
                  socialNetworkId: data.socialProfile.id,
                  username: data.socialProfile.username,
                },
              ],
              destinationUrl: data.extendedInfo.destinationUrl,
            },
          )
        }
        return msg
      })
      .toArray()

    // Mentions are not stored on the wrapper, so building from baseMessage will never propagate them
    // Thus we add them here, after the innerMessages are created
    if (data.mentions && socialProfile && SN_TYPE_TO_MENTION_TYPE[socialProfile.type]) {
      // add the sn type back into the mentions. Any that are no longer valid will be rendered as plain text as usual
      data.mentions.forEach(m => {
        m.snType = SN_TYPE_TO_MENTION_TYPE[socialProfile.type]
        m.completedWithText = m.displayText
      })
      message.mentions = data.mentions
    }

    if (data.createdByMember) {
      message.createdByMember = data.createdByMember
    }

    if (isTikTokEnabled()) {
      if (data.privacy) {
        message.messages = message.messages.map(msg => {
          if (msg.snType === SocialProfileConstants.SN_TYPES.TIKTOKBUSINESS) {
            msg.disableComment = data.privacy?.tiktok?.disableComment ?? false
            msg.disableStitch = data.privacy?.tiktok?.disableStitch ?? false
            msg.disableDuet = data.privacy?.tiktok?.disableDuet ?? false
          }
          return msg
        })
      }
    }

    return message
  },

  /**
   * Returns whether or not the mps message data has populated fields unsupported by new compose
   * @param {object} mpsMessageData
   * @param {object} socialNetworks
   * @return {Array}
   */
  mpsMessageGetUnsupportedFields(mpsMessageData, socialNetworks) {
    const legacyFields = []
    const UNSUPPORTED_FIELDS = ComposerConstants.UNSUPPORTED_FIELDS

    const hasLegacyMention =
      !!mpsMessageData.template && Constants.MENTION_REGEX.test(mpsMessageData.template)
    if (hasLegacyMention) {
      legacyFields.push('legacyMentions')
    }

    UNSUPPORTED_FIELDS.forEach(field => {
      if (!ComposerUtils.isFieldSupported(field, mpsMessageData, socialNetworks)) {
        legacyFields.push(field)
      }
    })

    return legacyFields
  },

  /**
   * Returns whether or not the legacy field is now supported and consequently, will show up on new compose
   * @param {string} field
   * @param {object} mpsMessageData
   * @param {object} socialNetworks
   * @return {boolean}
   */
  isFieldSupported(field, mpsMessageData, socialNetworks) {
    let isFieldSupported = true
    if (field === 'location') {
      if (!ComposerUtils.isUndefinedOrNull(mpsMessageData.location)) {
        ComposerUtils.setLocationField(mpsMessageData, socialNetworks)
      }
    } else if (field === 'targeting') {
      if (!ComposerUtils.isUndefinedOrNull(mpsMessageData.targeting)) {
        // Targeting field can only be supported if it has 'linkedInV2Company' or 'facebookPage' targets
        isFieldSupported =
          !ComposerUtils.isUndefinedOrNull(mpsMessageData.targeting.linkedInV2Company) ||
          !ComposerUtils.isUndefinedOrNull(mpsMessageData.targeting.facebookPage)
      }
    } else {
      // Any other field can be ignored (and supported) if it is empty.
      isFieldSupported = ComposerUtils.isUndefinedOrNull(mpsMessageData[field])
    }
    return isFieldSupported
  },

  /**
   * Sets the location field's corresponding values from the mpsMessageData so it's added to new compose
   * @param {object} mpsMessageData
   * @param {object} socialNetworks
   */
  setLocationField(mpsMessageData, socialNetworks) {
    /* eslint-disable-next-line no-undef */
    const snType = socialNetworks[mpsMessageData.socialProfile.id].type

    const hasPlaceId = !ComposerUtils.isUndefinedOrNull(mpsMessageData.location.placeId)
    const hasPlaceName = !ComposerUtils.isUndefinedOrNull(mpsMessageData.location.placeName)
    const hasLatitude = !ComposerUtils.isUndefinedOrNull(mpsMessageData.location.latitude)
    const hasLongtude = !ComposerUtils.isUndefinedOrNull(mpsMessageData.location.longitude)

    // these extra checks are because we want locations added only through new compose to open up via new compose
    if (hasPlaceId && hasPlaceName && hasLatitude && hasLongtude && this.hasTwitterNetwork(snType)) {
      TwitterLocationActions.setLatitude(mpsMessageData.location.latitude)
      TwitterLocationActions.setLongitude(mpsMessageData.location.longitude)
      TwitterLocationActions.setLocationId(mpsMessageData.location.placeId)
      TwitterLocationActions.setLocationValue(mpsMessageData.location.placeName)
    }
  },

  /**
   * Returns whether or not the message has populated fields that depend on an org being selected
   * @param {Message} message
   * @return {boolean}
   */
  hasOrgDependantData(message) {
    return !ComposerConstants.ORG_DEPENDANT_FIELDS.every(
      field => message[field] === null || message[field] === undefined || _.isEmpty(message[field]),
    )
  },

  /**
   * Returns whether or not the user is in the Statefarm org
   * @param {number} orgId
   * @return {boolean}
   */
  isStateFarm(orgId) {
    // TODO: when PUB_12938_STATE_FARM_NC_URL_PARAMS and PUB_12938_STATE_FARM_ORG_ID_PASSTHROUGH is removed, replace the below getFeatureValue with a constant value for the organizationId
    return parseInt(orgId, 10) === parseInt(getFeatureValue('PUB_12938_STATE_FARM_ORG_ID_PASSTHROUGH'), 10)
  },

  /**
   * Merge backend errors into frontend errors
   * @param {object} [feErrors] frontend errors
   * @param {object} [beErrors] backend errors
   * @return {object} [mergedErrors] merged version of frontend errors and backend errors
   */
  mergeErrors(feErrors, beErrors) {
    let mergedErrors = feErrors

    if (typeof beErrors !== 'undefined') {
      if (typeof feErrors === 'undefined') {
        mergedErrors = beErrors
      } else {
        const mergedKeys = _.union(Object.keys(feErrors), Object.keys(beErrors))
        const sameKeys = _.intersection(Object.keys(feErrors), Object.keys(beErrors))

        mergedKeys.forEach(element => {
          if (_.contains(sameKeys, element)) {
            //concat the two arrays
            if (!_.isEqual(feErrors[element], beErrors[element])) {
              mergedErrors[element] = _.union(feErrors[element], beErrors[element])
            }
          } else if (!_.contains(Object.keys(feErrors), element)) {
            mergedErrors[element] = beErrors[element]
          }
        })
      }
    }

    return mergedErrors
  },

  async determineOrgFromData(facadeApiUrl, memberId, message, orgs, currentlySelectedOrg) {
    let selectedOrg
    if (currentlySelectedOrg) {
      selectedOrg = currentlySelectedOrg
    } else {
      selectedOrg = orgs[Object.keys(orgs)[0]]
    }

    const orgId = message.socialNetworksKeyedById.reduce((acc, sn) => {
      if (sn.ownerType === Constants.OWNER_TYPE.ORGANIZATION) {
        if (acc === undefined) {
          return sn.ownerId
        } else {
          if (acc !== sn.ownerId) {
            return false
          }
          return acc
        }
      }
      return undefined
    }, undefined)

    if (orgId && orgs[orgId]) {
      return orgs[orgId]
    }

    if (message.campaignId) {
      const campaignData = await getCampaign(message.campaignId)
      if (campaignData?.orgId) {
        selectedOrg = orgs[campaignData.orgId]
      }

      return selectedOrg
    }

    if (message.tags) {
      let tagsData
      if (message.tags.every(tag => tag.hasOwnProperty('ownerId') && tag.hasOwnProperty('ownerType'))) {
        tagsData = message.tags
      } else {
        tagsData = await getTagsById(message.tags.map(tag => tag.id))
      }
      tagsData.some(tag => {
        if (tag.ownerType === 'ORGANIZATION') {
          selectedOrg = orgs[tag.ownerId]
          return true
        }
        return false
      })

      return selectedOrg
    }

    return selectedOrg
  },

  getAvailableProfiles(channelProfiles, organization = null, type = null) {
    return channelProfiles
      .filter(this.doesProfileHaveId)
      .filter(profile => !type || this.isChannelType(profile, type))
      .filter(
        profile =>
          this.isPrivateProfile(profile) ||
          // only check organization if the organization is defined
          !organization ||
          this.doesProfileBelongToOrganization(profile, organization),
      )
  },

  /**
   * Append a custom warning to preview messages
   * @param message
   * @param code
   * @param errorLevel
   */
  appendCustomValidation(
    message: SanitizedMessage,
    code: number,
    field: string,
    errorLevel: ErrorLevel = ComposerConstants.ERROR_LEVELS.WARNINGS,
  ) {
    if (message && code) {
      const existingValidations = (message[errorLevel] ? message[errorLevel] : []) as Array<Error>
      const hasValidationAlready = existingValidations.some(validation => validation.code === code)
      if (!hasValidationAlready) {
        existingValidations.push({
          message: '',
          code,
          field,
        })
        message[errorLevel] = existingValidations
      }
    }
  },

  isPrivateProfile(profile) {
    return profile.ownerType === Constants.OWNER_TYPE.MEMBER
  },

  doesProfileBelongToOrganization(profile, organization) {
    return !!organization && organization.organizationId === profile.ownerId
  },

  isChannelType(profile, channelType) {
    return profile.type === channelType
  },

  doesProfileHaveId(profile) {
    return !!profile.socialNetworkId
  },

  areOrganizationsEqual(organization, otherOrganization) {
    // both organizations are undefined
    if (!organization && !otherOrganization) {
      return true
    }
    // one organization is undefined
    if (!organization || !otherOrganization) {
      return false
    }

    return !!(
      organization &&
      otherOrganization &&
      organization.organizationId === otherOrganization.organizationId
    )
  },
  isMessage(messageType) {
    return messageType === Constants.TYPE.MESSAGE
  },
  isDraft(messageType) {
    return messageType === Constants.TYPE.DRAFT
  },
  isTemplate(messageType) {
    return messageType === Constants.TYPE.TEMPLATE
  },
  isUndefinedOrNull(item) {
    return item === null || item === undefined
  },

  /**
   * Returns true if any video attachments contain MPEG-4/H.265 video codec. At least one SN profile must be selected.
   * @param attachments An array of attachments
   */
  shouldAddVideoPreviewCodecWarning(attachments: Array<SanitizedAttachment>) {
    return (
      Array.isArray(attachments) &&
      attachments.some(
        attachment =>
          VideoAttachment.isVideoAttachment(attachment as VideoAttachment) &&
          NewComposerConstants.PREVIEW_UNSUPPORTED_CODECS.VIDEO.includes(
            (attachment as VideoAttachment)?.videoCodec?.toLowerCase(),
          ),
      )
    )
  },

  /**
   * Returns true if any video attachments contain HEVC/H.265 video codec. At least one SN profile must be selected.
   * @param attachments An array of attachments
   */
  shouldAddVideoPreviewCodecInfo(attachments: Array<SanitizedAttachment>) {
    return (
      Array.isArray(attachments) &&
      attachments.some(
        attachment =>
          VideoAttachment.isVideoAttachment(attachment as VideoAttachment) &&
          NewComposerConstants.PREVIEW_BROWSER_INCONSISTENTLY_SUPPORTED_CODECS.VIDEO.includes(
            (attachment as VideoAttachment)?.videoCodec?.toLowerCase(),
          ),
      )
    )
  },

  /**
   * Returns whether or not the post is being scheduled
   * @param {Message} messageToSend
   * @param {Entitlements} entitlements
   * @return {boolean}
   */
  isScheduled(messageToSend, entitlements) {
    if (EntitlementsUtils.isFeatureEnabled(entitlements, AUTO_SCHEDULE_MESSAGE)) {
      return (
        !_.isNull(messageToSend.sendDate) ||
        (!_.isNull(messageToSend.isAutoScheduled) && messageToSend.isAutoScheduled)
      )
    }
    return !_.isNull(messageToSend.sendDate)
  },

  /**
   * Returns the ComposerConf, used to determine what components and header text to display
   * @param {*} customContext key for the context that the customer composer was opened in
   * @param {boolean} isEdit
   * @param {string} messageType
   * @return {Object}
   */
  async createComposerConf(customContext, isEdit, messageType, templateData) {
    let composerConf
    // For now we are using Instagram Stories and Amplify in common context, overriding common components where necessary
    if (
      customContext &&
      !ComposerUtils.isAmplifyComposer(customContext) &&
      !ComposerUtils.isAmplifyEditPostComposer(customContext)
    ) {
      composerConf =
        (await getComponentsForCustomContext(customContext, ComposerConstants.COMPONENT_KEYS.COMPOSER)) || {}
    } else {
      composerConf = {}
    }

    if (!composerConf.header) {
      composerConf.header = {}
    }

    if (isEdit) {
      composerConf.header.label = EDIT_POST
      if (messageType) {
        if (messageType === Constants.TYPE.DRAFT) {
          composerConf.header.label = EDIT_DRAFT
        } else if (messageType === Constants.TYPE.TEMPLATE) {
          composerConf.header.label = EDIT_TEMPLATE
        }
      }
    } else {
      if (
        isFeatureEnabledOrBeta('PUB_30395_NEW_TEMPLATE_EXPERIENCE_IN_COMPOSER') &&
        this.isTemplate(messageType) &&
        !templateData?.templateId
      ) {
        composerConf.header.label = NEW_TEMPLATE
        composerConf.header.orgPicker = {
          isDisabled: true,
        }
      }
    }

    if (ComposerUtils.isAmplifyComposer(customContext)) {
      composerConf.header.label = PERSONALIZE_POST
    } else if (ComposerUtils.isAmplifyEditPostComposer(customContext)) {
      composerConf.header.label = EDIT_POST
    }

    return composerConf
  },

  /**
   * Create a new Composer Message, optionally based on initial message data
   * @param {object} [messageData] Data used to build the message
   * @returns {Message} A new message object
   */
  createMessage(messageData) {
    if (!messageData) {
      return new Message({
        id: ComposerConstants.BASE_MESSAGE_ID,
        source: MessageConstants.SOURCE.WEB,
      })
    }

    return new Message(messageData)
  },

  /**
   * Builds a new Composer Message from initial message data
   */
  buildMessage({
    messageData,
    timezoneName,
    socialNetworks,
    socialNetworkTypesToExclude,
    isEdit = false,
  }: {
    messageData
    timezoneName: string
    socialNetworks: Array<SocialNetwork>
    socialNetworkTypesToExclude: Array<SocialNetworkType>
    isEdit?: boolean
  }): Message {
    const composerMessage = ComposerUtils.createMessage(messageData)

    if (messageData) {
      if (messageData.id) {
        composerMessage.id = messageData.id
      } else {
        composerMessage.id = ComposerConstants.BASE_MESSAGE_ID
      }
      if (messageData.source) {
        composerMessage.source = messageData.source
      }
      if (messageData.createdByMember) {
        composerMessage.createdByMember = messageData.createdByMember
      }

      // Send Date
      let unixSendDate
      if (messageData.scheduledDate) {
        unixSendDate = dateToUnixTimestamp(messageData.scheduledDate, timezoneName)
      } else if (messageData.scheduleTimestamp) {
        unixSendDate = messageData.scheduleTimestamp
      }
      if (unixSendDate) {
        composerMessage.sendDate = unixSendDate
      }

      // Base Message
      if (messageData.template) {
        composerMessage.baseMessage.template = messageData.template
      } else if (messageData.messageText) {
        composerMessage.baseMessage.template = MessageUtils.buildTemplateFromMessage(
          messageData.messageText,
          messageData.linkSettings,
        )
      }

      if (messageData.attachments) {
        composerMessage.baseMessage.attachments = ComposerUtils.createAttachments(messageData.attachments)
      }

      if (messageData.postType === INSTAGRAM_POST_TYPES.IG_STORY) {
        // Set postType on the message wrapper so drafts can open back up in Stories mode
        composerMessage.baseMessage.postType = INSTAGRAM_POST_TYPES.IG_STORY
      }

      if (messageData.boards?.length) {
        // Reset the boards with proper attachment data; this is necessary when opening an Edited Template
        composerMessage.baseMessage.boards = messageData.attachments.map((attachment: Attachment) =>
          attachment.toBoardObject({ attachment }),
        )
      }

      if (messageData?.trackingSources?.length) {
        composerMessage.trackingSources = messageData.trackingSources
      }

      if (
        isFeatureEnabled('CFE_130_AMPLIFY_COMPOSER_PERSONALIZE') &&
        ComposerUtils.isOpenedFromAmplify(messageData.composeType)
      ) {
        // print a debug message, to be removed in next tasks
        console.debug('Composer opened from Amplify') // eslint-disable-line no-console
      }

      // Social Networks
      if (socialNetworks && socialNetworkTypesToExclude) {
        if (messageData.snIds?.length > 0 || messageData.socialNetworkId) {
          const snMap = {}
          const snIds = messageData.snIds || []
          const socialNetworkId = messageData.socialNetworkId

          if (socialNetworkId && !snIds.includes(socialNetworkId)) {
            snIds.push(socialNetworkId)
          }

          snIds.forEach(snId => {
            const sn = socialNetworks[snId]
            if (sn && !socialNetworkTypesToExclude.includes(sn.type)) {
              snMap[snId] = sn
              const snGroup = SN_TYPE_TO_SN_GROUP[sn.type]

              const mentions = messageData.snMentions?.[snGroup]
              let snText: string | null
              if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
                const linkSettings = messageData.snLinkSettings?.[snGroup]
                snText = messageData.snText?.[snGroup]
                  ? MessageUtils.buildTemplateFromMessage(messageData.snText[snGroup], linkSettings, mentions)
                  : null
              } else {
                snText = messageData.snText?.[snGroup]
                  ? MessageUtils.buildTemplateFromMessage(
                      messageData.snText[snGroup],
                      messageData.linkSettings,
                      mentions,
                    )
                  : null
              }

              const snAttachments = messageData.snAttachments?.[snGroup]
              const attachments = snAttachments ? ComposerUtils.createAttachments(snAttachments) : null
              composerMessage.messages.push(
                composerMessage.buildMessageFromBase(sn.socialNetworkId, sn.type, false, {
                  snText: snText,
                  snAttachments: attachments,
                  snMentions: mentions,
                  ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && {
                    snLinkSettings: messageData.snLinkSettings?.[snGroup],
                  }),
                  ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && {
                    snLinkSettingsPresetId: messageData.snLinkSettingsPresetId?.[snGroup],
                  }),
                }),
              )

              if (isFeatureEnabled('PUB_31153_FIX_IG_NULL_POST_TYPE')) {
                /**
                 * "Post" from Planner with filtered IGB account and other social networks
                 * caused postType to be null (SBE-6009) thus the IGB post failed to send.
                 *
                 * Setting the default postType to FEED if the initial message data:
                 * 1. has seleted IG or IGB account, and
                 * 2. postType is undefined or null.
                 */
                if (snGroup === SN_GROUP.INSTAGRAM && !composerMessage.postType) {
                  composerMessage.postType = INSTAGRAM_POST_TYPES.IG_FEED
                }
              }
            }
          })

          composerMessage.socialNetworksKeyedById = Immutable.OrderedMap(snMap)
        }
      }

      // Select direct publishing if all selected social networks are Instagram Business
      if (
        isFeatureEnabled('PUB_31157_IG_PUBLISHING_MODE_FIX') &&
        !isEdit &&
        socialNetworks &&
        (messageData.snIds?.length > 0 || messageData.socialNetworkId)
      ) {
        const hasIGB =
          messageData.snIds?.some(
            (snId: number) => socialNetworks[snId]?.type === SN_TYPES.INSTAGRAMBUSINESS,
          ) ?? socialNetworks[messageData.socialNetworkId]?.type === SN_TYPES.INSTAGRAMBUSINESS
        const doesNotHaveIG =
          !messageData.snIds?.some((snId: number) => socialNetworks[snId]?.type === SN_TYPES.INSTAGRAM) ??
          socialNetworks[messageData.socialNetworkId]?.type !== SN_TYPES.INSTAGRAM
        if (hasIGB && doesNotHaveIG) {
          composerMessage.baseMessage.publishingMode = Constants.INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH
        }
      }
    }

    return composerMessage
  },

  /**
   * Creates a Composer message, based on template data
   * @param {string} id
   * @param {Object} templateData
   * @return {Message}
   */
  createMessageFromTemplate({ id, templateData }) {
    const {
      attachments = [],
      messageText = '',
      targeting = {},
      sendDate,
      albumName,
      albumType,
      locations,
      isLocked,
      snIds = [],
      snAttachments = null,
      snText = null,
      snMentions = null,
      snLinkSettings = null,
      snLinkSettingsPresetId = null,
      socialProfiles = [],
      publishingMode,
      postType,
      publisherNotes,
      message, // Only necessary for compose new from template
      composeType,
      privacy,
      linkSettings,
      linkSettingsPresetId,
    } = templateData || undefined

    const msgAttachments = this.createAttachments(attachments)

    const messageTextValues = {
      template: MessageUtils.buildTemplateFromMessage(messageText, linkSettings),
    }

    // Mentions are temporary disabled for Twitter
    // https://hootsuite.atlassian.net/browse/PUB-30451
    const allMentions = isNil(snMentions) ? message?.snMentions || null : snMentions
    if (isFeatureEnabled('PUB_30451_DISABLE_TWITTER_MENTIONS_SEARCH')) {
      if (allMentions?.[SN_GROUP.TWITTER]) {
        delete allMentions[SN_GROUP.TWITTER]
      }
    }
    const composerMessage = new Message({
      id,
      source: MessageConstants.SOURCE.WEB,
      messageType: Constants.TYPE.TEMPLATE,
      baseMessage: Object.assign({
        ...messageTextValues,
        attachments: msgAttachments,
        boards: message ? message.boards : undefined,
        targeting,
        sendDate,
        albumName,
        albumType,
        locations: locations || {},
        publishingMode: message ? message.publishingMode : publishingMode,
        postType: message ? message.postType : postType,
        publisherNotes: message ? message.publisherNotes : publisherNotes,
        composeType,
        linkSettings: message ? message.linkSettings : linkSettings,
        ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && {
          linkSettingsPresetId: message ? message.linkSettingsPresetId : linkSettingsPresetId,
        }),
      }),
      // message.snText, message.snAttachments, message.snLinkSettings, message.snLinkSettingsPresetId are available when composing post from template
      snText: isNil(snText) ? message?.snText || null : snText,
      snAttachments: isNil(snAttachments) ? message?.snAttachments || null : snAttachments,
      snMentions: allMentions,
      ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && {
        snLinkSettings: isNil(snLinkSettings) ? message?.snLinkSettings || null : snLinkSettings,
      }),
      ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && {
        snLinkSettingsPresetId: isNil(snLinkSettingsPresetId)
          ? message?.snLinkSettingsPresetId || null
          : snLinkSettingsPresetId,
      }),
      isLocked: isLocked,
      privacy: privacy,
    })
    composerMessage.messages = []

    let snIdsFromSocialProfiles = []
    if (!snIds?.length && socialProfiles?.length) {
      snIdsFromSocialProfiles = socialProfiles.map(profile => profile.id)
    }
    composerMessage.snIds = snIds?.concat(snIdsFromSocialProfiles.filter(item => snIds.indexOf(item) < 0))
    return composerMessage
  },

  /**
   * Returns the custom context type (PINTEREST, AMPLIFY) based on postType for Instagram or composeType for Pinterest/Amplify
   * @param {Object} data message data
   * @return {string} customContext key for the context that the customer composer was opened in
   */
  getCustomContextType(data) {
    let composeType
    if (data?.draft?.message?.composeType) {
      // Open a draft in its custom context mode
      composeType = data.draft.message.composeType
    } else if (data?.extendedInfo?.destinationUrl || data?.draft?.message?.extendedInfo?.destinationUrl) {
      // Open scheduled pinterest post or pinterest draft
      composeType = ComposerConstants.COMPOSE_TYPES.EDIT_PIN
    } else if (data?.composeType) {
      composeType = data.composeType
    }
    switch (composeType) {
      case ComposerConstants.COMPOSE_TYPES.NEW_PIN:
      case ComposerConstants.COMPOSE_TYPES.EDIT_PIN:
        return ComposerConstants.CUSTOM_CONTEXTS.PINTEREST
      case ComposerConstants.COMPOSE_TYPES.AMPLIFY_PERSONALIZE:
        return ComposerConstants.CUSTOM_CONTEXTS.AMPLIFY
      case ComposerConstants.COMPOSE_TYPES.AMPLIFY_EDIT_POST:
        return ComposerConstants.CUSTOM_CONTEXTS.AMPLIFY_EDIT_POST
      default:
        return undefined
    }
  },

  /**
   * Returns true if the composer is not in a custom context
   * @param {string} customContext key for the context that the customer composer was opened in
   * @return {boolean}
   */
  isBaseComposer(customContext) {
    return !(
      ComposerUtils.isPinterestComposer(customContext) ||
      ComposerUtils.isAmplifyComposer(customContext) ||
      ComposerUtils.isAmplifyEditPostComposer(customContext)
    )
  },

  /**
   * Returns true if the composer is in the Pinterest context
   * @param {string} customContext key for the context that the customer composer was opened in
   * @return {boolean}
   */
  isPinterestComposer(customContext) {
    return customContext === ComposerConstants.CUSTOM_CONTEXTS.PINTEREST
  },

  /**
   * Returns true if the composer is in the Amplify context
   * @param {string} customContext key for the context that the customer composer was opened in
   * @return {boolean}
   */
  isAmplifyComposer(customContext) {
    return customContext === ComposerConstants.CUSTOM_CONTEXTS.AMPLIFY
  },

  /**
   * Returns true if the composer is in the Amplify context
   * @param {string} customContext key for the context that the customer composer was opened in
   * @return {boolean}
   */
  isAmplifyEditPostComposer(customContext) {
    return customContext === ComposerConstants.CUSTOM_CONTEXTS.AMPLIFY_EDIT_POST
  },

  /**
   * Returns true if the composer is in Push Publishing mode (Instagram only)
   * @param {string} publishingMode A valid Instagram publishing mode
   * @return {boolean}
   */
  isPushPublishing(publishingMode) {
    return publishingMode === Constants.INSTAGRAM_PUBLISHING_MODES.PUSH_PUBLISH
  },

  /**
   * Returns true if the composer is in Direct Publishing mode (Instagram only)
   * @param {string} publishingMode A valid Instagram publishing mode
   * @return {boolean}
   */
  isDirectPublishing(publishingMode) {
    return publishingMode === Constants.INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH
  },

  /**
   * Returns the array of social network to show in the counter of the text field.
   * Eg: if the args is [FACEBOOK, FACEBOOKGROUP, FACEBOOKPAGE], the function return [FACEBOOK]
   * because we show only 1 counter for each type of Social Network.
   * @param {array} socialNetworks
   * @return {array}
   */
  getSocialNetworkTypesForCounting(socialNetworks) {
    return _.unique(
      socialNetworks.reduce((acc, socialNetwork) => {
        const snGroup = SN_TYPE_TO_SN_GROUP[socialNetwork]
        if (_.contains(CHARACTER_COUNTER_GROUPS, snGroup)) {
          acc.push(SN_GROUP_TO_SN_TYPES[snGroup][0])
        }
        return acc
      }, []),
    )
  },

  isOpenedFromAmplify(composeType) {
    return (
      composeType === ComposerConstants.COMPOSE_TYPES.AMPLIFY_PERSONALIZE ||
      composeType === ComposerConstants.COMPOSE_TYPES.AMPLIFY_EDIT_POST
    )
  },

  /**
   * Returns true if at least one social network belongs to a suspended organization
   * @param {object} socialNetworks is an Immutable OrderedMap
   * @param {object} organization
   * @returns {boolean}
   */
  doesAtLeastOneSocialNetworkBelongToSuspendedOrg(socialNetworks, organization) {
    if (organization?.suspendStatus?.isSuspended && socialNetworks?.size) {
      return socialNetworks.some(socialNetwork => socialNetwork.ownerId === organization.organizationId)
    }
    return false
  },

  /**
   * For Comprehensive Failure Information - uses MPS errors to create fieldValidations to display using pre-send framework
   * @param {{
   *  "socialProfileId": number,
   *  "codes": [number]
   * }[]} errorsFromMPS - an array of errors
   * @param {OrderedMap} socialNetworksKeyedById - socialProfiles
   * @param {Object[]} expired - disconnected socialProfiles
   * @param {string} memberName - name of the member
   * @returns {Array<fieldValidations>}
   */
  createFieldValidationsFromMPS(errorsFromMPS, socialNetworksKeyedById, expired, memberName) {
    const NONE = 'NONE'
    const sortByType = (a, b) => {
      if (a.type > b.type) {
        return 1
      }
      if (a.type < b.type) {
        return -1
      }
      return 0
    }
    const groupUsernamesByType = (acc, cur) =>
      Object.assign({}, acc, {
        [cur.type]: (acc[cur.type] || []).concat(
          cur.type === SN_TYPES.TWITTER ? `@${cur.username}` : cur.username,
        ),
      })
    const assembleSocialNetworksForError = socialNetworks =>
      socialNetworks.sort(sortByType).reduce(groupUsernamesByType, {})
    const getSocialNetworksFilteredByErrorCode = (socialNetworks, socialProfileIdsForError) =>
      socialNetworks
        .filter(
          (snObj, snId) =>
            // eslint-disable-next-line eqeqeq
            socialProfileIdsForError.filter(snIdForError => snId == snIdForError).length,
        )
        .toArray()
    const convertedErrorsFromMPS = errorsFromMPS.map(field => ({
      socialProfileId: field.socialProfileId,
      codes: field.codes?.map(code => mapOverlappingErrorCodes(code)),
    }))

    const allUniqueErrorCodes = _.unique(
      convertedErrorsFromMPS.reduce((acc, currErr) => acc.concat(currErr.codes), []),
    )
    const allFieldNames = _.unique(allUniqueErrorCodes.map(code => getMPSInformation(code).errorLocation))
    const getAllCodesForFieldName = (fieldName, errorCodes) =>
      errorCodes.filter(errCode => getMPSInformation(errCode).errorLocation === fieldName)
    const getAllSocialProfileIdsForError = (errorCode, errs) =>
      errs.map(error => (error.codes?.includes(errorCode) ? error.socialProfileId : null)).filter(err => err)

    const createErrorsForFieldName = (fieldName, errors, uniqueErrorCodes) =>
      getAllCodesForFieldName(fieldName, uniqueErrorCodes).map(errCode => {
        let groupedSocialProfiles
        let socialProfilesForError = []
        if (socialNetworksKeyedById) {
          socialProfilesForError = getAllSocialProfileIdsForError(errCode, errors)
          const groupedSocialProfilesForError = getSocialNetworksFilteredByErrorCode(
            socialNetworksKeyedById,
            socialProfilesForError,
          )
          groupedSocialProfiles = assembleSocialNetworksForError(groupedSocialProfilesForError)
        }
        let reauthModalData
        if (errCode === DISCONNECTED_NETWORK_ERROR_CODE) {
          profileDisconnectedDetected(socialProfilesForError)

          reauthModalData = {
            memberName: memberName,
            context: socialProfilesForError,
            expired: expired,
          }
        }
        return {
          groupedSocialProfiles,
          code: errCode,
          socialProfileType: NONE,
          socialProfileIds: socialProfilesForError,
          order: getMPSInformation(errCode).order,
          reauthModalData,
        }
      })

    return allFieldNames.map(fieldName => ({
      fieldName,
      errors: createErrorsForFieldName(fieldName, convertedErrorsFromMPS, allUniqueErrorCodes),
    }))
  },

  isInstagramDirectCarousel(socialNetworkTypes = [], attachments, postType, publishingMode) {
    if (!socialNetworkTypes || !attachments || !postType || !publishingMode) return false
    const isInstagramSelected = socialNetworkTypes.some(sn =>
      SocialProfileConstants.SN_GROUP_TO_SN_TYPES[SocialProfileConstants.SN_GROUP.INSTAGRAM].includes(
        sn.toUpperCase(),
      ),
    )
    const isInstagramDirectCarousel = !!(
      isInstagramSelected &&
      attachments?.length > 1 &&
      postType === INSTAGRAM_POST_TYPES.IG_FEED &&
      publishingMode === Constants.INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH
    )
    return isInstagramDirectCarousel
  },

  /**
   * Sends tracking event if media attachment error belongs to the list below
   * @param {Object} error
   * @param {string} trackingContext
   * @param {Object} mediaUploadErrorTracked - stores media attachment errors that have been tracked already
   * @param {function} updateErrorTracked - updates mediaUploadErrorTracked with new error code
   */
  trackAttachmentValidationErrors(error, trackingContext, mediaUploadErrorTracked, updateErrorTracked) {
    const { logDescription = '' } = ValidationErrorMessages.get({ code: error.code })
    let eventType
    let isMediaUploadError = false
    switch (error.code) {
      case 4239: // Image has an unsupported aspect ratio
      case 4256: // Image has an unsupported dimension
      case 4258: // Image has an unsupported resolution
      case 4208: // Image file size is too large
      case 4257: // {actual} image file is not supported
        eventType = 'upload_image_errors'
        isMediaUploadError = true
        break
      case 4225: // Video file size is too large
      case 4231: // Video is too long
      case 4232: // Video is too short
      case 4233: // Video frame rate is too high
      case 4234: // Video frame rate is too low
      case 4235: // Video has too many audio channels
      case 4236: // {actual} video codec is not supported
      case 4237: // {actual} audio codec is not supported
      case 4230: // Video has an unsupported aspect ratio
      case 4254: // {actual} video file is not supported
        eventType = 'upload_video_errors'
        isMediaUploadError = true
        break
      default:
        break
    }
    if (!mediaUploadErrorTracked[error.code] && isMediaUploadError) {
      track(trackingContext, eventType, {
        ...(logDescription && { error: logDescription }),
        ...(error?.vars && { actual: error.vars.find(prop => prop.key === 'actual')?.value }),
      })
      updateErrorTracked(error.code)
    }
  },

  /**
   * Returns number of Instagram Business accounts selected
   * @param {Object[]} previewMessages
   * @return {number}
   */
  getNumIGBusinessAccountsSelected(previewMessages: Array<SanitizedMessage>) {
    const instagramBusinessPreviews = previewMessages.filter(
      previewMessage => previewMessage?.socialProfile?.type === SN_TYPES.INSTAGRAMBUSINESS,
    )
    return instagramBusinessPreviews?.length || 0
  },

  /**
   * Determines the Attachment Validations to display from the Preview Message
   */
  getAttachmentValidations(
    message: SanitizedMessage,
    errorLevel: ErrorLevel = ComposerConstants.ERROR_LEVELS.WARNINGS,
  ) {
    return (
      message?.[errorLevel]?.filter(
        (validation: Error) => validation?.field === Constants.FIELD_TO_UPDATE.ATTACHMENTS,
      ) || []
    )
  },

  /**
   * Deactivate focus trap when opening Composer from Analytics
   * This is a temporary fix to resolve a crash in DraftJS when opening Composer from Analytics:
   * https://hootsuite.slack.com/archives/C022X56Q7LH/p1667475623424969
   *
   * Remove when Composer has been migrated away from DraftJS, which is now deprecated.
   */
  deactivateFocusTrap() {
    if (isFeatureEnabledOrBeta('PUB_27887_ANALYTICS_COMPOSER_FOCUS_FIX')) {
      const isAnalytics = window.location.hash.startsWith('#/analytics/')

      if (isAnalytics) {
        // Emits a keyboard event to deactivate focus trap
        // https://github.com/focus-trap/focus-trap#what-it-does
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      }
    }
  },

  getHashtags(text: string): string[] {
    // We want to support most languages so we're detecting what a hashtag can't be rather than listing just [a-z0-9]
    // eslint-disable-next-line no-useless-escape
    const hashtagRegexp = /#[^\s!@#$%^&*()=+.\/,\[{\]};:'"?><]+/gim
    return text.match(hashtagRegexp) || []
  },
}

export default ComposerUtils
