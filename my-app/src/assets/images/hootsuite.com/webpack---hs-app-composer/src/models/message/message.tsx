/**
 * @preventMunge
 */
import Immutable from 'immutable'
import {
  cloneDeep,
  differenceBy,
  isEmpty,
  isInteger,
  isNil,
  intersection,
  isUndefined,
  without,
  isNull,
  isObject,
  isArray,
} from 'lodash'
import twitterText from 'twitter-text'
import _ from 'underscore'

import { findBoostMessage } from 'fe-ae-lib-boost-composer'
import { isTikTokEnabled } from 'fe-lib-darklaunch'
import {
  Constants,
  ConstantMappings,
  FacebookAlbumPickerConstants,
  MediaConstants,
  MessageConstants,
} from 'fe-pnc-constants'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkGroup, SocialNetworkType } from 'fe-pnc-constants-social-profiles'
import type {
  AttachmentData,
  AttachmentObject,
  Boards,
  VideoAttachmentData,
  ImageAttachmentData,
} from 'fe-pnc-data-composer-message'
import { GifAttachment, ImageAttachment, VideoAttachment } from 'fe-pnc-data-composer-message'
import type { Mentions } from 'fe-pnc-data-message-previews'
import {
  getFeatureValue,
  isFeatureEnabled,
  isFeatureEnabledOrBeta,
  isFeatureDisabledAndNotBeta,
} from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'
import { LinkSettingsUtils } from 'fe-pnc-lib-utils'
import { FIELD_TYPES } from 'fe-pnc-validation-error-messages'

import { store } from '@/redux/store'
import {
  AdPromotionCreateBoostCampaignRequest,
  Attachments,
  BaseMessage,
  ComposeType,
  Error,
  Errors,
  ExtendedInfo,
  FieldValidations,
  LinkSettings,
  Location,
  Locations,
  PostType,
  PublishingMode,
  Source,
  Tags,
  Targeting,
  URLPreview,
  RecommendedTimesScheduledType,
  TemplateMessageData,
  TemplateMessage,
  TemplateData,
} from '@/typings/Message'
import { SocialNetwork, SocialNetworksKeyedById } from '@/typings/SocialNetwork'
import AttachmentUtils from '@/utils/attachment-utils'
import ComposerUtils from '@/utils/composer-utils'
import LinkUtils from '@/utils/link-utils'
import MessageUtils from '@/utils/message-utils'
import removeUndefinedOrNull from '@/utils/remove-undefined-or-null'
import ValidationUtils from '@/utils/validation-utils'
import InnerMessage, { LEGAL_FIELDS as INNER_MESSAGE_FIELDS, INNER_MESSAGE_DEFAULTS } from '../inner-message'

const INSTAGRAM_POST_TYPES = SocialProfileConstants.INSTAGRAM_POST_TYPES
const INVALID_POST_TYPE = translation._('Invalid postType')
const INVALID_PUBLISHING_MODE = translation._('Invalid publishingMode')
const INVALID_PUBLISHER_NOTES = translation._('Invalid publisherNotes')

const DRAFT_REQUEST_SUPPORTED_SCHEDULER_TYPE: RecommendedTimesScheduledType[] = ['disabled', 'manual']

// Validation method for fields that are always valid
const VALID_FIELD = () => {
  return { error: null, warning: null }
}

// Validators return a string if there is a problem, or null if everything is valid
const FIELD_VALIDATION: Record<string, unknown> = {
  id: (id: string | number) => {
    const errorFn = () => {
      if (id !== null && typeof id !== 'string' && (!isInteger(id) || id < 1)) {
        return translation._('Id must be an integer greater than 0, or null or string')
      }
      return null
    }

    return { error: errorFn(), warning: null }
  },
  state: () => {
    const errorFn = () => {
      return null
    }

    return { error: errorFn(), warning: null }
  },
  albumName: () => {
    const errorFn = () => {
      return null
    }

    return { error: errorFn(), warning: null }
  },
  albumType: () => {
    const errorFn = () => {
      return null
    }

    return { error: errorFn(), warning: null }
  },
  socialNetworksKeyedById: (socialNetworksKeyedById: SocialNetworksKeyedById) => {
    const errorFn = () => {
      if (Immutable.Map.isMap(socialNetworksKeyedById)) {
        const socialNetworkIds: Array<number> = []
        socialNetworksKeyedById.map((value, key) => socialNetworkIds.push(Number(key)))
        if (socialNetworkIds.some(id => !isInteger(id) || id < 1)) {
          // prettier-ignore
          return translation._('socialNetworksKeyedById must be an object of social networks key by their ids')
        }
      } else {
        return translation._('socialNetworksKeyedById must be an Immutable OrderedMap')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')
    ? {
        unEditedUrlPreview: () => {
          return { error: null, warning: null }
        },
      }
    : {}),
  urlPreview: (preview: URLPreview) => {
    // Rename "errorFn" => "warningFn" when removing PUB_27909_LINK_GENERATE_WARNING
    const errorFn = () => {
      if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
        const { hasError, hasWarning, ...previewFields } = preview || {}
        if (
          isNull(preview) ||
          (isObject(preview) && Object.keys(preview).length === 0) ||
          (isObject(preview) && isEmpty(previewFields) && !(isUndefined(hasError) || isUndefined(hasWarning)))
        ) {
          return null
        }
      } else {
        if (preview === null || (_.isObject(preview) && Object.keys(preview).length === 0)) {
          return null
        }
      }

      if (!_.isObject(preview)) {
        return isFeatureEnabled('PUB_27909_LINK_GENERATE_WARNING')
          ? translation._('An unexpected warning occurred, please try again')
          : translation._('An unexpected error occurred, please try again')
      }
      const urlValid = _.isString(preview.url) && twitterText.isValidUrl(preview.url)
      // NOTE: We do not validate originalUrl, as it's allowed to be anything and is only used for display
      const thumbnailUrlValid =
        preview.thumbnailUrl === null ||
        preview.thumbnailUrl === undefined ||
        (_.isString(preview.thumbnailUrl) && twitterText.isValidUrl(preview.thumbnailUrl))
      const titleValid = preview.title === null || preview.title === undefined || _.isString(preview.title)
      const descriptionValid =
        preview.description === null || preview.description === undefined || _.isString(preview.description)

      if (!(urlValid && thumbnailUrlValid && titleValid && descriptionValid)) {
        return isFeatureEnabled('PUB_27909_LINK_GENERATE_WARNING')
          ? translation._('This link preview cannot be customized')
          : translation._('An unexpected error occurred, please try again')
      }

      return null
    }

    return isFeatureEnabled('PUB_27909_LINK_GENERATE_WARNING')
      ? { error: null, warning: errorFn() }
      : { error: errorFn(), warning: null }
  },
  linkSettings: (linkSettings: LinkSettings, message: Message) => {
    const errorFn = () => {
      if (!message.schedulingRequired) {
        if (linkSettings === null) {
          return null
        }

        const isLinkSettingValid = linkSettings.every(_linkSetting => {
          if (
            _linkSetting.linkShortenerId === null ||
            _linkSetting.linkTracker === null ||
            _linkSetting.previouslyComputedLink === null
          ) {
            return true
          } else if (
            _linkSetting.linkTracker &&
            (_linkSetting.linkTracker.trackingParameters === null || _linkSetting.linkTracker.type === null)
          ) {
            return true
          } else if (
            !_.isObject(_linkSetting) ||
            typeof _linkSetting.url !== 'string' ||
            !_.isObject(_linkSetting.previouslyComputedLink) ||
            (typeof _linkSetting.linkShortenerId !== 'string' &&
              typeof _linkSetting.linkShortenerId !== 'number') ||
            typeof _linkSetting.linkTracker?.type !== 'string' ||
            !_.isArray(_linkSetting.linkTracker?.trackingParameters)
          ) {
            return false
          } else {
            return true
          }
        })

        if (!isLinkSettingValid) {
          return translation._('An unexpected error occurred, please try again')
        }
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  linkSettingsPresetId: (id: number) => {
    const errorFn = () => {
      if (id !== null && (!isInteger(id) || id < 1)) {
        return translation._('linkSettingsPresetId must be an integer greater than 0')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  attachments: (attachments: Attachments) => {
    const errorFn = () => {
      if (!_.isArray(attachments)) {
        return translation._('An unexpected error occurred, please try again')
      }

      const urlsValid = attachments.every(
        attachment => _.isString(attachment.url) && twitterText.isValidUrl(attachment.url),
      )
      const thumbnailUrlsValid = attachments.every(
        attachment =>
          attachment.thumbnailUrl === null ||
          attachment.thumbnailUrl === undefined ||
          (_.isString(attachment.thumbnailUrl) && twitterText.isValidUrl(attachment.thumbnailUrl)),
      )

      if (!(urlsValid && thumbnailUrlsValid)) {
        return translation._('An unexpected error occurred, please try again')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  boards: VALID_FIELD,
  composeType: VALID_FIELD,
  tags: (tags: Tags) => {
    const errorFn = () => {
      if (!Array.isArray(tags)) {
        return translation._('Invalid tags')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  locations: (locations: Locations) => {
    const errorFn = () => {
      if (locations === null) {
        return translation._('Invalid locations')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  targeting: (targeting: Targeting) => {
    const errorFn = () => {
      if (targeting === null) {
        return translation._('Invalid targeting')
      }
      return null
    }

    return { error: errorFn(), warning: null }
  },
  schedulingRequired: (schedulingRequired: boolean) => {
    const errorFn = () => {
      if (!_.isBoolean(schedulingRequired)) {
        return translation._('Invalid schedulingRequired')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  sendDate: (date: number, message: BaseMessage) => {
    const errorFn = () => {
      if (
        (message.schedulingRequired && date === null) ||
        date === 0 ||
        (date !== null && !isInteger(date))
      ) {
        return translation._('Select a valid schedule date')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  source: (source: Source) => {
    const errorFn = () => {
      if (source !== null && !_.contains(MessageConstants.SOURCE, source)) {
        return translation._('Invalid message source')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  campaignId: (campaignId: string) => {
    const errorFn = () => {
      if (campaignId !== null && !_.isString(campaignId)) {
        return translation._('Invalid campaignId')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  isAutoScheduled: (isAutoScheduled: boolean) => {
    const errorFn = () => {
      if (!_.isBoolean(isAutoScheduled)) {
        return translation._('Invalid isAutoScheduled')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  extendedInfo: () => {
    const errorFn = () => {
      return null
    }

    return { error: errorFn(), warning: null }
  },
  messageType: (messageType: string) => {
    const errorFn = () => {
      if (
        Constants.TYPE.MESSAGE !== messageType &&
        Constants.TYPE.TEMPLATE !== messageType &&
        Constants.TYPE.DRAFT !== messageType
      ) {
        return translation._('Invalid messageType')
      }
      return null
    }
    return { error: errorFn(), warning: null }
  },
  errors: VALID_FIELD,
  fieldValidations: VALID_FIELD,
  warnings: VALID_FIELD,
  isBoosted: (isBoosted: boolean) => {
    const errorFn = () => {
      if (!_.isBoolean(isBoosted)) {
        return translation._('Invalid isBoosted')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  publishingMode: (publishingMode: PublishingMode) => ({
    error:
      !publishingMode ||
      publishingMode === Constants.INSTAGRAM_PUBLISHING_MODES.PUSH_PUBLISH ||
      publishingMode === Constants.INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH
        ? null
        : INVALID_PUBLISHING_MODE,
    warning: null,
  }),
  postType: (postType: PostType) => ({
    error: !postType || Object.values(INSTAGRAM_POST_TYPES).includes(postType) ? null : INVALID_POST_TYPE,
    warning: null,
  }),
  publisherNotes: (publisherNotes: string) => ({
    error: !publisherNotes || typeof publisherNotes === 'string' ? null : INVALID_PUBLISHER_NOTES,
    warning: null,
  }),
  snText: () => {
    return { error: null, warning: null }
  },
  snAttachments: () => {
    return { error: null, warning: null }
  },
  snMentions: () => {
    return { error: null, warning: null }
  },
  ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')
    ? {
        snLinkSettings: () => {
          return { error: null, warning: null }
        },
      }
    : {}),
  ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')
    ? {
        snLinkSettingsPresetId: () => {
          return { error: null, warning: null }
        },
      }
    : {}),
  disableStitch: (disableStitch: boolean) => {
    const errorFn = () => {
      if (!_.isBoolean(disableStitch)) {
        return translation._('Invalid disableStitch')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  disableComment: (disableComment: boolean) => {
    const errorFn = () => {
      if (!_.isBoolean(disableComment)) {
        return translation._('Invalid disableComment')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  disableDuet: (disableDuet: boolean) => {
    const errorFn = () => {
      if (!_.isBoolean(disableDuet)) {
        return translation._('Invalid disableDuet')
      }

      return null
    }

    return { error: errorFn(), warning: null }
  },
  template: (text: string) => {
    const errorFn = () => {
      if (typeof text !== 'string') {
        return translation._('Invalid template')
      }

      // Character count is validated by Authoring, but set a reasonable limit on the text that can be sent
      if (text.length > ConstantMappings.MAX_MESSAGE_LENGTH) {
        return translation._('This message is too long')
      }

      return null
    }
    return { error: errorFn(), warning: null }
  },
  oneTimeReviewerId: (id: number) => {
    const errorFn = () => {
      if (typeof id !== 'number' && !isNil(id)) {
        return translation._('Invalid oneTimeReviewerId')
      }
      return null
    }
    return { error: errorFn(), warning: null }
  },
  ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')
    ? {
        verifiedFbPageIds: (ids: number[]) => {
          const errorFn = () => {
            if (!isArray(ids) && !isNil(ids)) {
              return translation._('Invalid verifiedFbPageIds')
            }
            return null
          }
          return { error: errorFn(), warning: null }
        },
      }
    : {}),
}

// Fields that are set on Base Message
const MESSAGE_FIELDS = Object.keys(FIELD_VALIDATION)

/**
 * Initialize to constructor data if set, ignoring extra fields
 * @param field The key of a field to validate
 * @returns True if a message field
 */
const isMessageField = (field: string) => MESSAGE_FIELDS.some(messageField => messageField === field)

/**
 * A Message object is a container (wrapper) for multiple related messages. It represents the typical compose flow, where
 * you're editing multiple messages at once, one per social network, with the same data.
 * A Message object maintains an array of InnerMessages, which are the only place that peristent data lives. This data is used to send/schedule messages,
 * as well as keep track of the users changes to each message.
 * Since the Message object has no real data except for the InnerMessage, it acts like an interface to manage message; thus its responsibility
 * is to take user/server request changes and apply them correctly to InnerMessages. It should never allow external processes to modify its InnerMessages, but
 * instead expose methods that will do the work internally.
 * Examples:
 *    User changes message text -> UI tells Message to change text -> Message applies changes to InnerMessages
 *    User navigates to PNP -> UI tells Message to create PNP request -> PNP responds with changes to Message -> Message uses response to update specific InnerMessages
 *    User adds 5 images -> UI tells Message to add 5 images -> Message adds 5 images to most inner message, 4 to twitter inner message, and appends urls to linkedin inner message (slightly contrived example)
 */
export default class Message {
  /**
   * The baseMessage is the "template" message that is used to create InnerMessages.
   * Actions through the edit pane (left side) should modify all InnerMessages in the compose session.
   * However, adding new social networks creates new InnerMessages, which need the same edits, but shouldn't have
   * any unique edits to individual InnerMessages (can't just copy one of them).
   * Thus they start as a copy of the baseMessage, which only contains fields that apply to ALL InnerMessages.
   * Individual InnerMessages can diverge from the base message for other fields (on a per field basis)
   * For example, editing the message text will apply to all InnerMessages (and the baseMessage). But removing a link preview
   * is not supported for linkedin profiles, so doing so from the edit panel will update the baseMessage and a subset of InnerMessages
   * that excludes linkedin profiles.
   */
  baseMessage: BaseMessage = {
    urlPreview: null,
    linkSettings: null,
    template: '',

    /**
     * An optional string representing the composeType (pinterest, instagram, amplify_personalize) if it exists.
     */
    composeType: null,

    /**
     * An array of Attachment objects
     */
    attachments: [],

    /**
     * Specific to Instagram Stories: an object representing IG Story 'boards', only attached if we are opening
     * from 'New Story' mode. Similar to 'attachments'.
     */
    boards: [],

    /**
     * Sets whether or not the message requires scheduling
     * PUB_MESSAGE_MODEL_FUTURE_WORK - this looks like it doesn't need to be on messages or the baseMessage, as it's just a UI flag for the entire wrapper
     */
    schedulingRequired: false,

    /**
     * A string representing the currently selected album
     */
    albumName: null,

    /**
     * A string representing the currently selected album's type
     */
    albumType: null,

    /**
     * If set, this message is scheduled, otherwise it's ad-hoc
     * When set sendDate is UNIX Epoch time (seconds elapsed since 00:00:00 Thursday, 1 January 1970)
     */
    sendDate: null,

    /**
     * A string representing the source of the message
     */
    source: null,

    /**
     * A array of the tags for the messages
     */
    tags: [],

    /**
     * An object containing the locations for the messages (indexed by snType)
     */
    locations: {},

    /**
     * An object containing targeting for the messages (indexed by snType)
     * Example:
     * targeting: {
     *   linkedInV2Company: {
     *      industries: [
     *        "urn:li:industry:2",
     *        "urn:li:industry:4"
     *      ]
     *      interfacelocales: [
     *        {
     *          "country": "US",
     *          "language": "en"
     *        }
     *      ]
     *   }
     * }
     */
    targeting: {},

    /**
     * An object with string as the key and an array as the value.
     * {string: [{message: string, details: array}]}
     */
    errors: {},

    /**
     * An object with string as the key and an array as the value.
     * {string: [{message: string, details: array}]}
     */
    fieldValidations: {},

    /**
     * An object with string as the key and an array as the value.
     */
    warnings: {},

    /**
     * An object with string as the key and string as the value
     * {string: [{key: string, value: string}]}
     */
    extendedInfo: undefined,

    campaignId: null,
    linkSettingsPresetId: null,

    /**
     * Sets whether the message will get scheduled using the user's autoschedule settings
     */
    isAutoScheduled: false,

    /**
     * Sets the hootPostId
     */
    hootPostId: undefined,

    /**
     * Sets the publishingMode for Instagram posts (Push or Direct/API) {mode: 'PUBLISHING_MODE'}
     */
    publishingMode: undefined,

    /**
     * Sets the postType for Instagram posts, one of INSTAGRAM_POST_TYPES {postType: 'POST_TYPE'}
     */
    postType: undefined,

    /**
     * Sets the publisherNotes for Instagram Stories
     */
    publisherNotes: undefined,

    oneTimeReviewerId: null,

    ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') ? { unEditedUrlPreview: null } : {}),
  }

  /**
   * These are the InnerMessages that the Message wrapper maintains. They should only ever be mutated directly by the Message wrapper, and exported
   * only via toMPS, toPNPRequest, etc. This ensures message-unique changes are propagated and preserved correctly.
   * Each internal message corresponds to a selected social network. Thus in addition to potentially having any of the fields in baseMessage, it also
   * has the fields 'snId' and 'snType'
   */
  messages: Array<InnerMessage> = []

  id: number | null = null
  state: string | null = null

  /**
   * An object where the keys are the socialNetworkIds and the values are the corresponding socialNetworkObjects.
   */
  socialNetworksKeyedById: SocialNetworksKeyedById = Immutable.OrderedMap({})

  /**
   * The type is either a message, draft, or template. Message by default
   */
  messageType: string = Constants.TYPE.MESSAGE

  /**
   * PUB_12938_STATE_FARM_NC_URL_PARAMS : Only used for Statefarm to force url params on all links
   */
  stateFarmContentSourceId: number

  /**
   * PUB_12938_STATE_FARM_NC_URL_PARAMS part of Statefarm work to force url params on all links
   */
  memberEmail: string

  /**
   * PUB_LOCKED_CONTENT part of Statefarm work to enable locked templates
   */
  isLocked: boolean

  createdByMember: boolean

  /**
   * Recommended Times experiment
   */
  recommendedTimesScheduledType: RecommendedTimesScheduledType

  /**
   * An object where the keys are network groups and the values are the corresponding PNE messages
   */
  snText: Record<string, string>

  /**
   * An object where the keys are network groups and the values are the corresponding PNE mentions
   */
  snMentions: Record<string, Mentions>

  /**
   * An object where the keys are network groups and the values are the corresponding PNE attachments
   */
  snAttachments: Record<string, AttachmentData>

  /**
   * An object where the keys are network groups and the values are the corresponding PNE link settings
   */
  snLinkSettings: Record<string, LinkSettings>

  /**
   * An object where the keys are network groups and the values are the corresponding PNE link preset ids
   */
  snLinkSettingsPresetId: Record<string, number>

  /**
   * An object where the keys are network groups and the values are the corresponding privacy settings
   */
  privacy: Record<string, unknown>

  /**
   * An array where the native post external mediaUrls are hold.
   * These are retreived to be uploaded to HS S3 Bucket.
   */
  nativeMediaUrls: Record<string, string>[]

  /***
   * Tracking Sources to be added to Message origins for logs
   */
  trackingSources: []

  constructor(data) {
    data = data || {}

    /**
     * The type is either a message, draft, or template. Message by default
     */
    this.messageType = data.messageType || Constants.TYPE.MESSAGE

    /**
     * Remove this comment with PUB_30706_LINK_SETTINGS_PNE
     * For networks that do not support customizing link previews
     * when editing urlPreview, the unEditedUrlPreview remains unchanged, thus using it for networks that don't support editing
     * PUB_MESSAGE_MODEL_FUTURE_WORK  - fields like this can be managed within InnerMessages once we support them
     *   (eg: never remove the urlPreview from sns that don't allow removing it, rather than keeping this copy)
     */
    this.stateFarmContentSourceId = data.stateFarmContentSourceId || -1
    this.memberEmail = data.memberEmail || ''
    this.isLocked = data.isLocked || false
    this.createdByMember = data.createdByMember
    this.recommendedTimesScheduledType = data.recommendedTimesScheduledType || 'disabled'
    this.snText = data.snText || null
    this.snAttachments = data.snAttachments || null
    this.snMentions = data.snMentions || null
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      this.snLinkSettings = data.snLinkSettings || null
      this.snLinkSettingsPresetId = data.snLinkSettingsPresetId || null
    }
    this.privacy = data.privacy || null
    this.nativeMediaUrls = data.nativeMediaUrls || []
    this.trackingSources = data.trackingSources || []
    this._initializeConstructorData(data)
  }

  _initializeConstructorData(data) {
    // make sure social network ids and types are set first because setters for baseMessage and InnerMessages may check them
    // message fields
    Object.keys(data)
      .filter(isMessageField)
      .forEach(field => {
        this[field] = data[field]
      })

    // baseMessage fields
    if (data.baseMessage) {
      Object.keys(data.baseMessage)
        .filter(isMessageField)
        .forEach(field => {
          this[field] = data.baseMessage[field]
        })
      // Ensures base message is copied if there is a selected network group
      this.baseMessage.template = data.baseMessage.template
    }

    // Inner messages. These must be set AFTER the base message fields, otherwise the wrapper will overwrite the inner messages
    if (Object.keys(data).some(key => key === 'messages')) {
      this.messages = data.messages
    }
  }

  set extendedInfo(value: ExtendedInfo) {
    // Extended Info in base message is not cleaned.  It is up to the InnerMessage instances to clean / validate fields
    const currentExtendedInfo = this.baseMessage.extendedInfo || {}
    const newExtendedInfo = cloneDeep(value)

    this.baseMessage.extendedInfo = Object.assign(currentExtendedInfo, newExtendedInfo)
    this.messages.forEach(m => (m.extendedInfo = value))
  }

  get extendedInfo(): ExtendedInfo {
    return this.getField('extendedInfo')
  }

  /**
   * @param useShortenedLinks If true, the messageText returned will include shortened links
   * @param forceBaseMessage If true, the baseMessage will always be used to determine the message text.
   * Otherwise, the message text will be determined from the InnerMessage if a selectedNetworkGroup is set.
   * @returns The message text or an empty string if undefined
   */
  renderMessageText(useShortenedLinks = false, forceBaseMessage = false): string {
    const template = forceBaseMessage ? this.baseMessage.template : this.template
    const linkSettings = forceBaseMessage ? this.baseMessage.linkSettings : this.linkSettings

    return MessageUtils.buildMessageFromTemplate(
      template || '',
      linkSettings,
      this.mentions,
      useShortenedLinks,
    ).messageText
  }

  get selectedNetworkGroup(): SocialNetworkGroup {
    return store.getState().composer.selectedNetworkGroup || null
  }

  set linkSettingsPresetId(v: number) {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      if (this.selectedNetworkGroup && this.getSocialNetworkGroups()?.length > 1) {
        this.messages.forEach(m => {
          if (MessageUtils.isNetworkTypeInGroup(m.snType, this.selectedNetworkGroup)) {
            m.linkSettingsPresetId = v
          }
        })
      } else {
        this.baseMessage.linkSettingsPresetId = v
        this.messages.forEach(m => {
          if (!MessageUtils.hasMessageTemplateDiverged(this.baseMessage, m)) {
            m.linkSettingsPresetId = v
          }
        })
      }
    } else {
      this.baseMessage.linkSettingsPresetId = v
      this.messages.forEach(m => (m.linkSettingsPresetId = v))
    }
  }

  get linkSettingsPresetId(): number {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const innerMessage = MessageUtils.getInnerMessageFromGroup(this.messages, this.selectedNetworkGroup)
      if (!isEmpty(innerMessage?.linkSettingsPresetId)) {
        return innerMessage.linkSettingsPresetId
      }

      return this.getField('linkSettingsPresetId')
    } else {
      return this.getField('linkSettingsPresetId')
    }
  }

  set campaignId(v: string) {
    this.baseMessage.campaignId = v
    this.messages.forEach(m => (m.campaignId = v))
  }

  get campaignId(): string {
    return this.getField('campaignId')
  }

  set urlPreview(v: URLPreview | null) {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const linkPreview = cloneDeep(v)
      // reset unEditedUrlPreview if user removed link preview completely
      if (isUndefined(linkPreview?.originalUrl)) {
        this.unEditedUrlPreview = linkPreview
      }

      if (this.selectedNetworkGroup && this.getSocialNetworkGroups()?.length > 1) {
        this.messages.forEach(m => {
          if (MessageUtils.isNetworkTypeInGroup(m.snType, this.selectedNetworkGroup)) {
            m.linkPreview = linkPreview
          }
        })
      } else {
        this.messages.forEach(m => {
          // Checking against message template since preview is generated based on the message text
          if (!MessageUtils.hasMessageTemplateDiverged(this.baseMessage, m)) {
            m.linkPreview = linkPreview
          }
        })
        this.baseMessage.urlPreview = linkPreview
      }
    } else {
      this.baseMessage.urlPreview = v
      this.messages.forEach(m => {
        let linkPreview = v
        if (m.snType === SocialProfileConstants.SN_TYPES.FACEBOOKPAGE) {
          let fbPageCanCustomize = false
          if (Array.isArray(this.verifiedFbPageIds) && this.verifiedFbPageIds.length) {
            // Comparing a string (m.snId) to an int
            fbPageCanCustomize = this.verifiedFbPageIds.some(id => m.snId === `${id}`)
          }
          if (!fbPageCanCustomize) linkPreview = cloneDeep(this.unEditedUrlPreview)
        }

        m.linkPreview = linkPreview
      })
    }
  }

  get urlPreview(): URLPreview | null {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const innerMessage = MessageUtils.getInnerMessageFromGroup(this.messages, this.selectedNetworkGroup)
      if (!isEmpty(innerMessage)) {
        return innerMessage.linkPreview
      }

      return this.getField('urlPreview')
    }

    return this.getField('urlPreview')
  }

  set unEditedUrlPreview(v: URLPreview | null) {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const unEditedUrlPreview = cloneDeep(v)
      if (this.selectedNetworkGroup && this.getSocialNetworkGroups()?.length > 1) {
        this.messages.forEach(m => {
          if (MessageUtils.isNetworkTypeInGroup(m.snType, this.selectedNetworkGroup)) {
            m.unEditedUrlPreview = unEditedUrlPreview
          }
        })
      } else {
        this.messages.forEach(m => {
          if (!MessageUtils.hasMessageTemplateDiverged(this.baseMessage, m)) {
            m.unEditedUrlPreview = unEditedUrlPreview
          }
        })
        this.baseMessage.unEditedUrlPreview = unEditedUrlPreview
      }
    } else {
      this.baseMessage.unEditedUrlPreview = v
    }
  }

  get unEditedUrlPreview(): URLPreview | null {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const innerMessage = MessageUtils.getInnerMessageFromGroup(this.messages, this.selectedNetworkGroup)
      if (!isEmpty(innerMessage?.linkSettings)) {
        return innerMessage.unEditedUrlPreview
      }
      return this.getField('unEditedUrlPreview')
    } else {
      return this.getField('unEditedUrlPreview')
    }
  }

  set linkSettings(v: LinkSettings) {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      if (this.selectedNetworkGroup && this.getSocialNetworkGroups()?.length > 1) {
        this.messages.forEach(m => {
          const newLinkSettings = LinkUtils.getLinkSettingsWithComputedLinks(cloneDeep(v), m.linkSettings)
          if (MessageUtils.isNetworkTypeInGroup(m.snType, this.selectedNetworkGroup)) {
            m.linkSettings = newLinkSettings
          }
        })
      } else {
        this.baseMessage.linkSettings = cloneDeep(v)
        this.messages.forEach(m => {
          const newLinkSettings = LinkUtils.getLinkSettingsWithComputedLinks(cloneDeep(v), m.linkSettings)
          if (!MessageUtils.hasMessageTemplateDiverged(this.baseMessage, m)) {
            m.linkSettings = newLinkSettings
          }
        })
      }
    } else {
      this.messages.forEach(m => {
        let newLinkSettings = cloneDeep(v)

        if (Array.isArray(m.linkSettings) && Array.isArray(newLinkSettings)) {
          // The wrapper/user may have changed the link settings, but there is
          // InnerMessage specific data from pnp that needs to be preserved
          // If the user has just added new settings, the unchanged ones need to preserve the unique data from pnp
          // If a link setting was changed, then its data from pnp is no longer valid, so we remove it (and pnp will create new data)
          newLinkSettings = newLinkSettings.map((linkSetting, i) => {
            const hasLinkSettingChanged =
              !this.linkSettings[i] ||
              !_.isEqual(this.linkSettings[i].linkShortenerId, linkSetting.linkShortenerId)
            if (hasLinkSettingChanged) {
              // let pnp replace it; it'll see that there is none and compute a new one (see updateMessagesFromPreview in composer-message store)
              linkSetting.previouslyComputedLink = null
            } else {
              // preserve the existing previouslyComputedLink for this link setting, if it exists
              if (m.linkSettings[i] && m.linkSettings[i].previouslyComputedLink) {
                linkSetting.previouslyComputedLink = cloneDeep(m.linkSettings[i].previouslyComputedLink)
              }
            }
            return linkSetting
          })
        }
        m.linkSettings = newLinkSettings // same as newLinkSettings, except previouslyComputedLink is always null in the wrapper
      })

      this.baseMessage.linkSettings = cloneDeep(v)
    }
  }

  get linkSettings(): LinkSettings {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const innerMessage = MessageUtils.getInnerMessageFromGroup(this.messages, this.selectedNetworkGroup)
      if (!isEmpty(innerMessage?.linkSettings)) {
        return innerMessage.linkSettings
      }
      return this.getField('linkSettings')
    } else {
      return this.getField('linkSettings')
    }
  }

  set attachments(v: Attachments) {
    const { selectedNetworkGroup: selectedNetworkGroupOnUpload } =
      (Array.isArray(v) && v?.find(attachment => !_.isUndefined(attachment.selectedNetworkGroup))) || {}
    const shouldUploadToDifferentSN =
      selectedNetworkGroupOnUpload !== this.selectedNetworkGroup &&
      !_.isUndefined(selectedNetworkGroupOnUpload)
    const isUploadOnInitContent = _.isNull(selectedNetworkGroupOnUpload)

    if (isFeatureEnabled('PUB_31162_CL_TEMPLATE_ATTACHMENT')) {
      // Editing innerMessage
      if (
        this.selectedNetworkGroup &&
        MessageUtils.hasMultipleMessages(this.messages) &&
        this.getSocialNetworkGroups()?.length > 1
      ) {
        this.messages.forEach(m => {
          // Media upload was initiated on one SN tab and then different SN tab was selected
          if (shouldUploadToDifferentSN && !isUploadOnInitContent) {
            if (MessageUtils.isNetworkTypeInGroup(m.snType, selectedNetworkGroupOnUpload)) {
              const attachmentsToUpload = AttachmentUtils.retrieveUploadingAttachments(
                v,
                selectedNetworkGroupOnUpload,
              )
              AttachmentUtils.resetSelectedNetworkGroup(v)
              m.attachments = m.attachments?.concat(attachmentsToUpload)
              if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
                if (m.linkPreview) {
                  m.linkPreview = null
                }
              }
            }
            // media upload was initiated on Initial content tab and then another SN tab was selected
          } else if (isUploadOnInitContent) {
            const attachmentsToUpload = AttachmentUtils.retrieveUploadingAttachments(v, null)
            AttachmentUtils.resetSelectedNetworkGroup(v)
            this.baseMessage.attachments = this.baseMessage.attachments.concat(attachmentsToUpload)
            this.messages.forEach(m => (m.attachments = m.attachments.concat(attachmentsToUpload)))
          } else {
            if (MessageUtils.isNetworkTypeInGroup(m.snType, this.selectedNetworkGroup)) {
              AttachmentUtils.resetSelectedNetworkGroup(v)
              m.attachments = v
              if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
                if (m.linkPreview) {
                  m.linkPreview = null
                }
              }
            }
          }
        })

        if (this.messages.length <= 1) {
          AttachmentUtils.resetSelectedNetworkGroup(v)
          this.baseMessage.attachments = v
        }
        // Update inner messages and base message if uploaded an attachment
        // - without selecting any SN OR
        // - with multiple SNs of the same type selected
      } else if (
        (this.selectedNetworkGroup && this.getSocialNetworkGroups()?.length === 1) ||
        (!!this.selectedNetworkGroup && this.messages?.length === 0)
      ) {
        this.baseMessage.attachments = v
        this.messages.forEach(m => {
          m.attachments = v
        })
      } else {
        const attachmentToDelete = MessageUtils.filterOutExistingAttachmentsByUrl(
          this.baseMessage.attachments,
          v,
        )

        this.messages.forEach(m => {
          if (v.length < this.baseMessage.attachments.length) {
            // Delete occurred, need to update each inner message
            m.attachments = m.attachments.filter(
              // Check if the image on the base exists in any inner message and then remove it.
              ({ url }) =>
                MessageUtils.getURLUntilQueryParams(url) !==
                MessageUtils.getURLUntilQueryParams(attachmentToDelete[0].url),
            )
          }
          if (v.length === this.baseMessage.attachments.length) {
            // Edit occurred or reorder occurred

            const iterateUrl = (value: AttachmentObject) => {
              return value.url
            }
            // Gets the originalUrl on the attachment before it was edited
            const urlBeforeEdit = differenceBy(this.baseMessage.attachments, v, iterateUrl)[0]?.url
            // gets the newly edited attachment
            const editedAttachment = differenceBy(v, this.baseMessage.attachments, iterateUrl)
            /*
            Since the image editor does not provide a reference to what attachment it edited (it overwrites the previous
            attachment data). We need a way to determine if an attachment on the baseMessage was edited/reordered. To achieve this we leverage lodash differenceBy. This function returns the difference of the newl attachments (v)
            and the existing attachments (this.baseMessage.attachments). Once we know this difference (editedAttachment & urlBeforeEdit) we can
            reliably know if an edit or reorder happened
            */
            if (editedAttachment.length === 0) {
              // Reorder occurred
              const hasInnerMessageChanged =
                m.attachments.length !== this.baseMessage.attachments.length ||
                m.attachments?.some((attachment, index) => {
                  return (
                    attachment.url.split('?')[0] !== this.baseMessage.attachments[index].url.split('?')[0]
                  )
                })

              if (!hasInnerMessageChanged) {
                // if inner message is the same as the base we reorder the messages
                m.attachments = v
              }
            } else {
              // Edit occurred
              m.attachments = m.attachments.map(attachment =>
                MessageUtils.getURLUntilQueryParams(attachment.url) ===
                MessageUtils.getURLUntilQueryParams(urlBeforeEdit)
                  ? editedAttachment[0]
                  : attachment,
              )
            }
          } else {
            // Media upload was initiated on one SN tab and then Initial content tab was selected
            if (shouldUploadToDifferentSN) {
              if (MessageUtils.isNetworkTypeInGroup(m.snType, selectedNetworkGroupOnUpload)) {
                const attachmentsToUpload = AttachmentUtils.retrieveUploadingAttachments(
                  v,
                  selectedNetworkGroupOnUpload,
                )
                AttachmentUtils.resetSelectedNetworkGroup(v)
                m.attachments = m.attachments.concat(attachmentsToUpload)
              }
            } else {
              AttachmentUtils.resetSelectedNetworkGroup(v)
              m.attachments = m.attachments.concat(
                MessageUtils.filterOutExistingAttachmentsByUrl(v, this.baseMessage.attachments),
              )
            }
          }
        })
        if (!shouldUploadToDifferentSN) {
          AttachmentUtils.resetSelectedNetworkGroup(v)
          this.baseMessage.attachments = v
        }
      }
    } else {
      // Editing innerMessage
      if (this.selectedNetworkGroup) {
        this.messages.forEach(m => {
          // Media upload was initiated on one SN tab and then different SN tab was selected
          if (shouldUploadToDifferentSN && !isUploadOnInitContent) {
            if (MessageUtils.isNetworkTypeInGroup(m.snType, selectedNetworkGroupOnUpload)) {
              const attachmentsToUpload = AttachmentUtils.retrieveUploadingAttachments(
                v,
                selectedNetworkGroupOnUpload,
              )
              AttachmentUtils.resetSelectedNetworkGroup(v)
              m.attachments = m.attachments.concat(attachmentsToUpload)
              if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
                if (m.linkPreview) {
                  m.linkPreview = null
                }
              }
            }
            // media upload was initiated on Initial content tab and then another SN tab was selected
          } else if (isUploadOnInitContent) {
            const attachmentsToUpload = AttachmentUtils.retrieveUploadingAttachments(v, null)
            AttachmentUtils.resetSelectedNetworkGroup(v)
            this.baseMessage.attachments = this.baseMessage.attachments.concat(attachmentsToUpload)
            this.messages.forEach(m => (m.attachments = m.attachments.concat(attachmentsToUpload)))
          } else {
            if (MessageUtils.isNetworkTypeInGroup(m.snType, this.selectedNetworkGroup)) {
              AttachmentUtils.resetSelectedNetworkGroup(v)
              m.attachments = v
              if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
                if (m.linkPreview) {
                  m.linkPreview = null
                }
              }
            }
          }
        })

        if (this.messages.length <= 1) {
          AttachmentUtils.resetSelectedNetworkGroup(v)
          this.baseMessage.attachments = v
        }
      }
      // Editing baseMessage
      if (!this.selectedNetworkGroup) {
        const attachmentToDelete = MessageUtils.filterOutExistingAttachmentsByUrl(
          this.baseMessage.attachments,
          v,
        )

        this.messages.forEach(m => {
          if (v.length < this.baseMessage.attachments.length) {
            // Delete occurred, need to update each inner message
            m.attachments = m.attachments.filter(
              // Check if the image on the base exists in any inner message and then remove it.
              ({ url }) =>
                MessageUtils.getURLUntilQueryParams(url) !==
                MessageUtils.getURLUntilQueryParams(attachmentToDelete[0].url),
            )
          }
          if (v.length === this.baseMessage.attachments.length) {
            // Edit occurred or reorder occurred

            const iterateUrl = (value: AttachmentObject) => {
              return value.url
            }
            // Gets the originalUrl on the attachment before it was edited
            const urlBeforeEdit = differenceBy(this.baseMessage.attachments, v, iterateUrl)[0]?.url
            // gets the newly edited attachment
            const editedAttachment = differenceBy(v, this.baseMessage.attachments, iterateUrl)
            /*
            Since the image editor does not provide a reference to what attachment it edited (it overwrites the previous
            attachment data). We need a way to determine if an attachment on the baseMessage was edited/reordered. To achieve this we leverage lodash differenceBy. This function returns the difference of the newl attachments (v)
            and the existing attachments (this.baseMessage.attachments). Once we know this difference (editedAttachment & urlBeforeEdit) we can
            reliably know if an edit or reorder happened
            */
            if (editedAttachment.length === 0) {
              // Reorder occurred
              const hasInnerMessageChanged =
                m.attachments.length !== this.baseMessage.attachments.length ||
                m.attachments?.some((attachment, index) => {
                  return (
                    attachment.url.split('?')[0] !== this.baseMessage.attachments[index].url.split('?')[0]
                  )
                })

              if (!hasInnerMessageChanged) {
                // if inner message is the same as the base we reorder the messages
                m.attachments = v
              }
            } else {
              // Edit occurred
              m.attachments = m.attachments.map(attachment =>
                MessageUtils.getURLUntilQueryParams(attachment.url) ===
                MessageUtils.getURLUntilQueryParams(urlBeforeEdit)
                  ? editedAttachment[0]
                  : attachment,
              )
            }
          } else {
            // Media upload was initiated on one SN tab and then Initial content tab was selected
            if (shouldUploadToDifferentSN) {
              if (MessageUtils.isNetworkTypeInGroup(m.snType, selectedNetworkGroupOnUpload)) {
                const attachmentsToUpload = AttachmentUtils.retrieveUploadingAttachments(
                  v,
                  selectedNetworkGroupOnUpload,
                )
                AttachmentUtils.resetSelectedNetworkGroup(v)
                m.attachments = m.attachments.concat(attachmentsToUpload)
              }
            } else {
              AttachmentUtils.resetSelectedNetworkGroup(v)
              m.attachments = m.attachments.concat(
                MessageUtils.filterOutExistingAttachmentsByUrl(v, this.baseMessage.attachments),
              )
            }
          }
        })
        if (!shouldUploadToDifferentSN) {
          AttachmentUtils.resetSelectedNetworkGroup(v)
          this.baseMessage.attachments = v
        }
      }
    }

    if (
      isFeatureEnabledOrBeta('PUB_28787_SIMPLIFY_IG_POST_TYPES') &&
      ComposerUtils.hasInstagramBusinessNetwork(this.getSocialNetworkTypes())
    ) {
      this.postType = this.getInstagramPostType()
    }

    // Until we require updating the message model further for Instagram Stories,
    // the boards field is only used in the front end as a flag to indicate a
    // scheduled post is a story, so we can just set boards using attachments
    if (this.postType === INSTAGRAM_POST_TYPES.IG_STORY) {
      this.boards = v.map(attachment => attachment.toBoardObject({ attachment }))
    }
  }

  get attachments(): Attachments {
    return this.getField('attachments')
  }

  get boards(): Boards {
    return this.getField('boards')
  }

  // See set attachments. For now, boards is always reset to a copy of the attachment data
  set boards(v: Boards) {
    this.baseMessage.boards = v
    this.messages.forEach(m => (m.boards = v))
  }

  set composeType(v: ComposeType) {
    this.baseMessage.composeType = v
    this.messages.forEach(m => (m.composeType = v))
  }

  get composeType(): ComposeType {
    return this.getField('composeType')
  }

  set oneTimeReviewerId(v: number) {
    this.messages.forEach(m => (m.oneTimeReviewerId = v))
    this.baseMessage.oneTimeReviewerId = v
  }

  get oneTimeReviewerId(): number {
    return this.getField('oneTimeReviewerId')
  }

  set schedulingRequired(v: boolean) {
    // Remove with PUB_MESSAGE_MODEL_FUTURE_WORK, and remove from baseMessage, since this only applies to the wrapper
    this.baseMessage.schedulingRequired = v
  }

  get schedulingRequired(): boolean {
    // Remove with PUB_MESSAGE_MODEL_FUTURE_WORK, and remove from baseMessage, since this only applies to the wrapper
    return this.getField('schedulingRequired')
  }

  set albumName(v: string) {
    this.baseMessage.albumName = v
    this.messages.forEach(m => (m.albumName = v))
  }

  get albumName(): string {
    return this.getField('albumName')
  }

  set albumType(v: string) {
    this.baseMessage.albumType = v
    this.messages.forEach(m => (m.albumType = v))
  }

  get albumType(): string {
    return this.getField('albumType')
  }

  set sendDate(v: number) {
    this.baseMessage.sendDate = v
    this.messages.forEach(m => (m.sendDate = v))
  }

  get sendDate(): number {
    return this.getField('sendDate')
  }

  set source(v: Source) {
    this.baseMessage.source = v
    this.messages.forEach(m => (m.source = v))
  }

  get source(): Source {
    return this.getField('source')
  }

  set tags(v: Tags) {
    this.baseMessage.tags = v
    this.messages.forEach(m => (m.tags = v))
  }

  get tags(): Tags {
    return this.getField('tags')
  }

  set locations(v: Locations) {
    this.baseMessage.locations = v
    this.messages.forEach(m => {
      if (
        SocialProfileConstants.SN_GROUP_TO_SN_TYPES[SocialProfileConstants.SN_GROUP.TWITTER].includes(
          m.snType,
        )
      ) {
        this.setLocationField(m, v[SocialProfileConstants.SN_GROUP.TWITTER])
      }
    })
  }

  get locations(): Locations {
    return this.getField('locations')
  }

  set targeting(v: Targeting) {
    this.baseMessage.targeting = v
    this.messages.forEach(m => (m.targeting = v))
  }

  get targeting(): Targeting {
    return this.getField('targeting')
  }

  set mentions(v: Mentions) {
    this.messages.forEach(m => {
      if (this.selectedNetworkGroup) {
        if (MessageUtils.isNetworkTypeInGroup(m.snType, this.selectedNetworkGroup)) {
          m.mentions = v
        }
      }
    })

    this.baseMessage.template = MessageUtils.mapTemplateToMessageWithMentions(
      this.baseMessage.template,
      v,
    ).message
  }

  get mentions(): Mentions | undefined {
    const innerMessage = MessageUtils.getInnerMessageFromGroup(this.messages, this.selectedNetworkGroup)
    if (innerMessage?.mentions != null) {
      return innerMessage.mentions
    }
  }

  set boostCampaign(v: AdPromotionCreateBoostCampaignRequest) {
    this.messages.forEach(m => (m.boostCampaign = v))
  }

  set savedBoostCampaign(v: AdPromotionCreateBoostCampaignRequest) {
    this.messages.forEach(m => (m.savedBoostCampaign = v))
  }

  set isAutoScheduled(v: boolean) {
    this.baseMessage.isAutoScheduled = v
    this.messages.forEach(m => (m.isAutoScheduled = v))
  }

  get isAutoScheduled(): boolean {
    return this.getField('isAutoScheduled')
  }

  set fieldValidations(v: FieldValidations) {
    this.baseMessage.fieldValidations = v
    this.messages.forEach(m => (m.fieldValidations = v))
  }

  get fieldValidations(): FieldValidations {
    return this.getField('fieldValidations')
  }

  set errors(v: Errors) {
    this.baseMessage.errors = v
    this.messages.forEach(m => (m.errors = v))
  }

  get errors(): Errors {
    return this.getField('errors')
  }

  set warnings(v: Errors) {
    this.baseMessage.warnings = v
    this.messages.forEach(m => (m.warnings = v))
  }

  get warnings(): Errors {
    return this.getField('warnings')
  }

  set isBoosted(v: boolean) {
    this.messages.forEach(m => {
      // isBoosted is true when an inner message has boostCampaign settings
      m.isBoosted = !_.isEmpty(m.boostCampaign) && v
    })
  }

  get isBoosted(): boolean {
    return !!this.messages.find(m => m.isBoosted)
  }

  set hootPostId(v: string) {
    this.baseMessage.hootPostId = v
    this.messages.forEach(m => (m.hootPostId = v))
  }

  get hootPostId(): string {
    return this.getField('hootPostId')
  }

  set publishingMode(v: PublishingMode) {
    this.baseMessage.publishingMode = v
    this.messages.forEach(m => {
      m.publishingMode = v
    })
    if (isFeatureEnabledOrBeta('PUB_28787_SIMPLIFY_IG_POST_TYPES')) {
      this.postType = this.getInstagramPostType()
    }
  }

  get publishingMode(): PublishingMode {
    return this.getField('publishingMode')
  }

  set postType(v: PostType) {
    const newPostType =
      !isFeatureEnabledOrBeta('PUB_28787_SIMPLIFY_IG_POST_TYPES') || v === INSTAGRAM_POST_TYPES.IG_STORY
        ? v
        : this.getInstagramPostType(v)

    this.baseMessage.postType = newPostType

    const attachments = this.attachments
    this.boards =
      AttachmentUtils.shouldUseBoards(newPostType, this.publishingMode) && attachments
        ? attachments.map(attachment => attachment.toBoardObject({ attachment }))
        : undefined

    this.messages.forEach(m => {
      m.postType = newPostType
    })
  }

  get postType(): PostType {
    return this.getField('postType')
  }

  set publisherNotes(v: string) {
    this.baseMessage.publisherNotes = v
    this.messages.forEach(m => {
      m.publisherNotes = v
    })
  }

  get publisherNotes(): string {
    return this.getField('publisherNotes')
  }

  set disableStitch(v: boolean) {
    this.messages.forEach(m => {
      m.disableStitch = v
    })
  }

  get disableStitch(): boolean {
    return !!this.messages.find(m => m.disableStitch)
  }

  set disableComment(v: boolean) {
    this.messages.forEach(m => {
      m.disableComment = v
    })
  }

  get disableComment(): boolean {
    return !!this.messages.find(m => m.disableComment)
  }

  set disableDuet(v: boolean) {
    this.messages.forEach(m => {
      m.disableDuet = v
    })
  }

  get disableDuet(): boolean {
    return !!this.messages.find(m => m.disableDuet)
  }

  set template(v: string) {
    this.messages.forEach(m => {
      if (this.selectedNetworkGroup) {
        if (MessageUtils.isNetworkTypeInGroup(m.snType, this.selectedNetworkGroup)) {
          m.template = v
        }
      } else if (!MessageUtils.hasMessageTemplateDiverged(this.baseMessage, m)) {
        m.template = v
      }
    })

    if (!this.selectedNetworkGroup || this.getSocialNetworkGroups().length === 1) {
      this.baseMessage.template = MessageUtils.mapTemplateToMessageWithMentions(v, this.mentions).message
    }
  }

  get template(): string {
    const innerMessage = MessageUtils.getInnerMessageFromGroup(this.messages, this.selectedNetworkGroup)
    if (innerMessage?.template != null) {
      return innerMessage.template
    }
    return this.getField('template')
  }

  set verifiedFbPageIds(v: number[]) {
    this.baseMessage.verifiedFbPageIds = v
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      this.messages.forEach(m => {
        m.isVerifiedFbPage =
          m.snType === SocialProfileConstants.SN_TYPES.FACEBOOKPAGE && v?.includes(parseInt(m.snId))
      })
    }
  }

  get verifiedFbPageIds() {
    return this.getField('verifiedFbPageIds')
  }

  /**
   * @param field
   * @return Returns the value of a field
   */
  getField(field: string) {
    if (this.baseMessage) {
      return this.baseMessage[field]
    }
    return null
  }

  /**
   * Resets the fields of each inner message to the base message
   * @param fields Inner Message fields to reset to equivalent Base Message field
   */
  resetFields(...fields: Array<string>) {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      fields.forEach(field => {
        if (!isNil(this.selectedNetworkGroup)) {
          if (!INNER_MESSAGE_FIELDS.some(messageField => messageField === field)) {
            throw new TypeError(
              `Cannot reset field '${field}', property does not exist on Inner Message model`,
            )
          }
          if (Object.keys(INNER_MESSAGE_DEFAULTS).some(messageField => messageField === field)) {
            // For properties that aren't stored on the Base Message, reset to default values
            this.messages.forEach(m => {
              if (MessageUtils.isNetworkTypeInGroup(m.snType, this.selectedNetworkGroup)) {
                m.resetField(this.baseMessage, field)
              }
            })
            if (MESSAGE_FIELDS.some(messageField => messageField === field)) {
              this.messages.forEach(m => {
                if (MessageUtils.isNetworkTypeInGroup(m.snType, this.selectedNetworkGroup)) {
                  m[field] = this.baseMessage[field]
                }
              })
            }
          }
        } else {
          if (!INNER_MESSAGE_FIELDS.some(messageField => messageField === field)) {
            throw new TypeError(
              `Cannot reset field '${field}', property does not exist on Inner Message model`,
            )
          }
          if (Object.keys(INNER_MESSAGE_DEFAULTS).some(messageField => messageField === field)) {
            // For properties that aren't stored on the Base Message, reset to default values
            this.messages.forEach(m => {
              m.resetField(this.baseMessage, field)
            })
          }
          if (MESSAGE_FIELDS.some(messageField => messageField === field)) {
            this.messages.forEach(m => {
              m[field] = this.baseMessage[field]
            })
          }
        }
      })
    } else {
      fields.forEach(field => {
        if (!INNER_MESSAGE_FIELDS.some(messageField => messageField === field)) {
          throw new TypeError(`Cannot reset field '${field}', property does not exist on Inner Message model`)
        }
        if (Object.keys(INNER_MESSAGE_DEFAULTS).some(messageField => messageField === field)) {
          // For properties that aren't stored on the Base Message, reset to default values
          this.messages.forEach(m => {
            m[field] = INNER_MESSAGE_DEFAULTS[field]
          })
        }
        if (MESSAGE_FIELDS.some(messageField => messageField === field)) {
          this.messages.forEach(m => {
            m[field] = this.baseMessage[field]
          })
        }
      })
    }
  }

  /**
   * Sets the location field of a message
   * @param message An object on which to set the location field
   * @param location A location object
   */
  setLocationField(message: InnerMessage | Record<string, unknown>, location: Location) {
    if (location && location.placeId !== '' && location.placeName !== '') {
      message.location = location
    } else {
      delete message._location
    }
  }

  /**
   * Clones the entire Message wrapper with a copy of the baseMessage and InnerMessages
   * @param fieldsToOmit - a list of fields that won't be cloned, and thus will have their initial default state in the new message
   * @returns The cloned message wrapper
   */
  clone(fieldsToOmit: Array<string>): Message {
    if (!Array.isArray(fieldsToOmit)) {
      fieldsToOmit = []
    }

    const newProps = {} as Record<string, unknown>
    for (const prop in this) {
      if (this.hasOwnProperty(prop)) {
        if (prop === 'baseMessage') {
          // Remove the omitted fields from the new baseMessage
          // new Message() will only override the default baseMessage fields that are present in data.baseMessage
          newProps[prop] = removeUndefinedOrNull(_.omit(this[prop], fieldsToOmit))
        } else if (prop === 'messages') {
          newProps[prop] = this.messages.map(m => m.clone())
        } else if (fieldsToOmit.filter(f => f === prop).length === 0) {
          newProps[prop] = this[prop]
        }
      }
    }
    return new Message(removeUndefinedOrNull(newProps)) // no need to set undefined/null values on a new message that already has those in their initial state
  }

  /**
   * Clones the linkPreview inside this message safely, handling the case where urlPreview hasn't been renamed to linkPreview
   * @returns The cloned linkPreview
   */
  cloneLinkPreview(): URLPreview {
    const linkPreview = {} as URLPreview
    if (this.urlPreview.url) {
      linkPreview.url = this.urlPreview.url
    }
    if (this.urlPreview.originalUrl) {
      linkPreview.originalUrl = this.urlPreview.originalUrl
    }
    if (this.urlPreview.thumbnailUrl) {
      if (this.urlPreview.thumbnailUrls) {
        this.urlPreview.thumbnailUrls.some(thumbnailUrlObj => {
          if (thumbnailUrlObj.thumbnailUrl === this.urlPreview.thumbnailUrl) {
            if (thumbnailUrlObj.originalUrl) {
              linkPreview.thumbnailUrl = thumbnailUrlObj.originalUrl
            } else {
              linkPreview.thumbnailUrl = thumbnailUrlObj.thumbnailUrl
            }
            return true
          }
          return false
        })
      } else {
        linkPreview.thumbnailUrl = this.urlPreview.thumbnailUrl
      }
    }
    if (this.urlPreview.title) {
      linkPreview.title = this.urlPreview.title
    }
    if (this.urlPreview.description) {
      linkPreview.description = this.urlPreview.description
    }
    return linkPreview
  }

  /**
   * Creates a new inner message based on the baseMessage with the given snid and type, applying snType restrictions as necessary
   * It doesn't modify the message, but rather just constructs a new inner message and returns it
   * You shouldn't ever need to call this (except in tests): the store is the only place that needs this to update messages
   * @param {string|number} snId
   * @param {string} snType
   * @param {boolean} isBoosted
   * @param {object} templateMessageData
   * @returns {object}
   */
  // buildInnerMessage
  buildMessageFromBase(snId, snType, isBoosted = false, templateMessageData: TemplateMessageData = {}) {
    const {
      snText = null,
      snAttachments = null,
      snMentions = null,
      snLinkSettings = null,
      snLinkSettingsPresetId = null,
    } = templateMessageData
    const template = snText ?? this.baseMessage.template

    const attachments = snAttachments ?? this.baseMessage.attachments
    const linkSettings = snLinkSettings ?? this.baseMessage.linkSettings
    const linkSettingsPresetId = snLinkSettingsPresetId ?? this.baseMessage.linkSettingsPresetId

    const data = {
      snId: String(snId),
      snType, // SN must be set first
      ...(isFeatureEnabledOrBeta('PUB_28512_REELS_THUMBNAIL') ? { postType: undefined } : {}),
      ...this.baseMessage,
      template,
      isBoosted,
      boostCampaign: undefined,
      attachments,
      mentions: snMentions,
      ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && { linkSettings }),
      ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && { linkSettingsPresetId }),
    }
    if (isTikTokEnabled()) {
      if (this.privacy) {
        if (this.privacy.tiktok) {
          const p = this.privacy.tiktok
          data.disableStitch = p.disableStitch
          data.disableComment = p.disableComment
          data.disableDuet = p.disableDuet
        }
      }
    }

    if (data.urlPreview) {
      // urlPreview has been renamed to linkPreview in the InnerMessage
      data.linkPreview = data.urlPreview
    }

    const existingMessageInGroup = MessageUtils.getInnerMessageFromGroup(
      this.messages,
      SocialProfileConstants.SN_TYPE_TO_SN_GROUP[snType],
    )
    if (existingMessageInGroup) {
      data.mentions = existingMessageInGroup.mentions
      data.template = existingMessageInGroup.template

      if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
        data.linkSettings = existingMessageInGroup.linkSettings
        data.linkSettingsPresetId = existingMessageInGroup.linkSettingsPresetId
        data.linkPreview = existingMessageInGroup.linkPreview
        data.unEditedUrlPreview = existingMessageInGroup?.unEditedUrlPreview
      }
    }

    // gets the currently applied location for a given snType
    if (
      SocialProfileConstants.SN_GROUP_TO_SN_TYPES[SocialProfileConstants.SN_GROUP.TWITTER].includes(snType)
    ) {
      this.setLocationField(data, data.locations[SocialProfileConstants.SN_GROUP.TWITTER])
    }

    // Delete fields that don't exist on inner message
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      delete data.verifiedFbPageIds
    }

    delete data.locations
    delete data.urlPreview

    if (isFeatureDisabledAndNotBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      delete data.unEditedUrlPreview
    }

    delete data.schedulingRequired // Remove with PUB_MESSAGE_MODEL_FUTURE_WORK, since this will no longer be on the base message

    return new InnerMessage(data)
  }

  // Fix for: PUB-14525
  // Twitter, Instagram do not support link previews, but for Twitter we want to show the link preview until we send out the message
  supportsLinkPreviewIncludingTwitter() {
    const selectedNetworkTypes = this.getSocialNetworkTypes()

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      if (!this.selectedNetworkGroup) {
        return true
      }

      return (
        intersection(
          SocialProfileConstants.SN_GROUP_TO_SN_TYPES[this.selectedNetworkGroup],
          without(SocialProfileConstants.NON_LINK_PREVIEW_NETWORKS, SocialProfileConstants.SN_TYPES.TWITTER),
        ).length === 0
      )
    }

    if (selectedNetworkTypes.length === 0) {
      return true
    }
    return (
      _.intersection(
        selectedNetworkTypes,
        _.without(SocialProfileConstants.NON_LINK_PREVIEW_NETWORKS, SocialProfileConstants.SN_TYPES.TWITTER),
      ).length !== selectedNetworkTypes.length
    )
  }

  supportsLinkPreview() {
    const selectedNetworkTypes = this.getSocialNetworkTypes()

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      if (!this.selectedNetworkGroup) {
        return true
      }

      return (
        intersection(
          SocialProfileConstants.SN_GROUP_TO_SN_TYPES[this.selectedNetworkGroup],
          SocialProfileConstants.NON_LINK_PREVIEW_NETWORKS,
        ).length === 0
      )
    }

    if (selectedNetworkTypes.length === 0) {
      return true
    }
    return (
      _.intersection(selectedNetworkTypes, SocialProfileConstants.NON_LINK_PREVIEW_NETWORKS).length !==
      selectedNetworkTypes.length
    )
  }

  supportsMentions() {
    const selectedNetworkTypes = this.getSocialNetworkTypes()
    if (selectedNetworkTypes.length === 0) {
      return false
    }
    return selectedNetworkTypes.some(sn => SocialProfileConstants.MENTION_SUPPORTED_NETWORKS.includes(sn))
  }

  /**
   * Validates all of the wrappers baseMessage fields
   * Modifies the errors and warnings in place
   */
  validate() {
    // Some field validations depend on other fields so validate all the fields
    const { errors, warnings } = _.reduce(
      Message.MESSAGE_FIELDS,
      (acc, field) => {
        const validation = this.validateField(field)
        // validateField returns the message's whole error object
        // so in order to avoid grabbing invalid errors just grab the error for the field we're looking at
        if (validation.errors[field]) {
          acc.errors[field] = validation.errors[field]
        }
        if (validation.warnings[field]) {
          acc.warnings[field] = validation.warnings[field]
        }
        return acc
      },
      { errors: {}, warnings: {} },
    )

    this.errors = errors
    this.warnings = warnings
  }

  /**
   * Validates a single field, and returns an object representing the WHOLE message's error and warning state
   * If the object's errors and warnings fields are empty, then the field was valid
   * @param field The field to validate
   */
  validateField(field: string): FieldValidations {
    const validation = FIELD_VALIDATION[field]

    if (validation === VALID_FIELD) {
      return { errors: this.errors, warnings: this.warnings }
    }

    const validationResult = validation(this[field], this)
    const newErrors = _.clone(this.errors)
    const newWarnings = _.clone(this.warnings)

    if (validationResult.error) {
      newErrors[field] = [{ message: validationResult.error }]
    } else {
      if (newErrors[field]) {
        delete newErrors[field]
      }
    }

    if (validationResult.warning) {
      newWarnings[field] = [{ message: validationResult.warning }]
    } else {
      if (newWarnings[field]) {
        delete newWarnings[field]
      }
    }

    return { errors: newErrors, warnings: newWarnings }
  }

  /**
   * Changes the message object into the format of a php message expected by bulkSchedulePublishAction
   * Bulk does not use the InnerMessages to render, because bulk only supports 1 social network per Wrapper.
   * This will have to be revisited, especially when we update bulk parity
   * @returns {Object}
   */
  toBulkPostRequest() {
    let sendDate
    if (typeof this.sendDate === 'number') {
      sendDate = this.sendDate
    }

    const messageText: string = this.renderMessageText(true, true)

    return removeUndefinedOrNull({
      id: this.id,
      text: messageText,
      socialNetworkIds: this.getSocialNetworkIds().length > 0 ? this.getSocialNetworkIds() : undefined,
      sendDate,
      linkPreview: this.supportsLinkPreview() && this.urlPreview ? this.cloneLinkPreview() : undefined,
      attachments:
        this.attachments && this.attachments.length > 0
          ? this.attachments.map(a => a.toRequestObject())
          : undefined,
      boards: this.boards && this.boards.length > 0 ? this.boards.map(a => a.toRequestObject()) : undefined,
    })
  }

  /**
   * Retrieves the boost campaign from the array of messages.
   * @param {Array} publishedMessages List of published message data
   * @returns {Object}
   */
  toBoostRequest(publishedMessages) {
    const boostMessage = findBoostMessage(this.messages, this.messageType)
    if (!boostMessage) {
      return null
    }

    const publishedMessage = publishedMessages.find(
      n => n.socialProfile.id.toString() === boostMessage.snId.toString(),
    )
    return boostMessage.toBoostRequest({ ...publishedMessage })
  }

  /**
   * Converts the message into json that matches the api of the Message Publishing Service
   * @param {string} timezoneName https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   * @param {number} organizationId The selected organizationID to send to MPS
   * @returns {Object}
   */
  toMPSRequest({ timezoneName, organizationId }) {
    // either we are in new post mode or opening up a post that had been sent to MPS
    if (organizationId) {
      const isStateFarm =
        isFeatureEnabled('PUB_12938_STATE_FARM_NC_URL_PARAMS') && ComposerUtils.isStateFarm(organizationId)
      return {
        messages: this.messages.reduce(
          (mpsMessages, innerMessage) =>
            mpsMessages.concat(
              innerMessage.toMPSRequest({
                timezoneName: timezoneName,
                memberEmail: this.memberEmail,
                stateFarmContentSourceId: this.stateFarmContentSourceId,
                isStateFarm: isStateFarm,
              }),
            ),
          [],
        ),
        organizationId,
      }
    } else {
      return {
        messages: this.messages.reduce(
          (mpsMessages, innerMessage) =>
            mpsMessages.concat(
              innerMessage.toMPSRequest({
                timezoneName: timezoneName,
              }),
            ),
          [],
        ),
      }
    }
  }

  /**
   * Creates a request object for the message preview endpoint
   * @param {string} timezoneName The timezone the user is in
   * @param {number} organizationId The organizationId
   * @param {boolean} isBulkComposer The type of composer
   * @returns {{message: Object, socialProfileIds: (null|Array)}}
   */
  toPreviewRequest(timezoneName, organizationId, isBulkComposer) {
    const pnpMessages = this.messages.reduce((previewMessages, innerMessage) => {
      const isStateFarm =
        organizationId &&
        isFeatureEnabled('PUB_12938_STATE_FARM_NC_URL_PARAMS') &&
        ComposerUtils.isStateFarm(organizationId)

      let linkPreview: URLPreview
      if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
        linkPreview = innerMessage.linkPreview
      } else {
        linkPreview = this.urlPreview
      }

      const newPNPMessages = innerMessage.toPNPRequest(
        timezoneName,
        this.memberEmail,
        this.stateFarmContentSourceId,
        isStateFarm,
        linkPreview,
        isBulkComposer && ComposerUtils.hasInstagramNetwork(innerMessage.snType),
        // TODO: refactor this into object params, this is called "wrapper"
      ) // a single network type can result in multiple messages (eg: pinterest)

      return previewMessages.concat(newPNPMessages)
    }, [])

    if (isFeatureDisabledAndNotBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      pnpMessages.map(m => (m.verifiedFbPageIds = this.verifiedFbPageIds)) // TODO: This should be a message field or handled better somehow
    }
    return {
      messages: pnpMessages,
    }
  }

  /**
   * Transforms the message for use by the content library service in order to create or update a template
   * @param organizationId the organizationId that the draft is being created from (not needed for free users, but enterprise should have them in case they have presets / tags / campaigns associated to the draft)
   * @returns {Object}
   */
  toTemplateData(organizationId?: number) {
    const templateData: TemplateData = {}
    const templateMessage: TemplateMessage = {}

    const messageText: string = this.renderMessageText(false, true) || ''

    if (this.socialNetworksKeyedById && this.socialNetworksKeyedById.size) {
      const snIds = []
      this.socialNetworksKeyedById.forEach(sn => {
        snIds.push(sn.socialNetworkId)
      })
      templateData.selectedSocialNetworks = snIds
    }

    if (this.hasAttachments()) {
      let attachments = this.baseMessage.attachments

      // Remove PDF attachment from template data as it's not supported by Content Library
      if (isFeatureEnabledOrBeta('PUB_30723_LINKEDIN_PDF')) {
        attachments = attachments.filter(
          attachment => !MediaConstants.ACCEPTED_MIME_TYPES.PDF?.includes(attachment.mimeType),
        )
      }

      templateMessage.attachments = attachments.map(a => a.toRequestObject()) as Array<
        VideoAttachmentData | ImageAttachmentData
      >

      // map attachments to boards
      if (this.postType === INSTAGRAM_POST_TYPES.IG_STORY) {
        if (AttachmentUtils.shouldUseBoards(this.postType, this.publishingMode)) {
          templateMessage.boards =
            attachments.map(attachment => attachment.toBoardObject({ attachment })) || undefined
        }
        templateMessage.postType = INSTAGRAM_POST_TYPES.IG_STORY
      } else {
        templateMessage.boards = undefined
      }
    }

    if (this.tags && this.tags.length && organizationId) {
      templateMessage.messageTags = `[${this.tags.map(tag => tag.id).join(',')}]`
      templateData.orgID = organizationId
    }

    if (this.hasTargeting()) {
      templateMessage.targeting = this.targeting
    }

    if (this.hasLocations()) {
      templateMessage.locations = this.locations
    }

    this.albumName ? (templateMessage.albumName = this.albumName) : null
    this.albumType ? (templateMessage.albumType = this.albumType) : null

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      if (this.linkSettingsPresetId) templateMessage.linkSettingsPresetId = this.linkSettingsPresetId
    }
    if (this.publishingMode) templateMessage.publishingMode = this.publishingMode
    if (this.postType) templateMessage.postType = this.postType
    if (this.publisherNotes) templateMessage.publisherNotes = this.publisherNotes
    if (this.boards && this.boards.length > 0) templateMessage.boards = this.boards

    const snText = {}
    const snMentions = {}
    const snAttachments = {}
    const snLinkSettings = {}
    const snLinkSettingsPresetId = {}
    const privacy = {}
    let isInstagramAccountIncluded = false
    this.messages.forEach(m => {
      if (m.snType) {
        const snGroup = SocialProfileConstants.SN_TYPE_TO_SN_GROUP[m.snType]

        const messageFromTemplate = MessageUtils.buildMessageFromTemplate(
          m.template,
          m.linkSettings,
          m.mentions,
        )
        snText[snGroup] = messageFromTemplate.messageText || ''
        snMentions[snGroup] = messageFromTemplate.mentions || []

        if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
          snLinkSettings[snGroup] = messageFromTemplate.linkSettings || []
          snLinkSettingsPresetId[snGroup] = m.linkSettingsPresetId || null
        }

        // Remove PDF attachment from template data as it's not supported by Content Library
        if (isFeatureEnabledOrBeta('PUB_30723_LINKEDIN_PDF')) {
          snAttachments[snGroup] =
            m.attachments
              ?.filter(a => !MediaConstants.ACCEPTED_MIME_TYPES.PDF?.includes(a.mimeType))
              ?.map(a => a.toRequestObject()) || []
        } else {
          snAttachments[snGroup] = m.attachments?.map(a => a.toRequestObject()) || []
        }

        if (
          m.snType === SocialProfileConstants.SN_TYPES.INSTAGRAM ||
          m.snType === SocialProfileConstants.SN_TYPES.INSTAGRAMBUSINESS
        ) {
          m.postType = 'IG_FEED'
          m.publishingMode = 'IG_API'
          isInstagramAccountIncluded = true
        } else {
          m.postType = undefined
          m.publishingMode = undefined
        }
        if (isTikTokEnabled()) {
          if (m.snType === SocialProfileConstants.SN_TYPES.TIKTOKBUSINESS) {
            privacy.tiktok = {
              disableComment: m.disableComment ?? false,
              disableDuet: m.disableDuet ?? false,
              disableStitch: m.disableStitch ?? false,
            }
          }
        }
      }
    })

    if (!isInstagramAccountIncluded) {
      templateMessage.postType = undefined
      templateMessage.publishingMode = undefined
    }

    templateMessage.snText = snText
    templateMessage.snMentions = snMentions
    templateMessage.snAttachments =
      isFeatureEnabledOrBeta('PUB_27792_SNATTACHMENTS_EMPTY_FIX') && Object.keys(snAttachments).length === 0
        ? null
        : snAttachments
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      templateMessage.snLinkSettings = isEmpty(Object.keys(snLinkSettings)) ? null : snLinkSettings
      templateMessage.snLinkSettingsPresetId = isEmpty(Object.keys(snLinkSettingsPresetId))
        ? null
        : snLinkSettingsPresetId
    }
    templateMessage.privacy = privacy
    templateMessage.template = typeof messageText === 'string' ? messageText : ''

    templateMessage.linkSettings = this.linkSettings ?? undefined

    templateData.message = templateMessage

    return templateData
  }

  /**
   * Transforms the message for use by the draft service in order to create or update a draft
   * @param organizationId the organizationId that the draft is being created from (not needed for free users, but enterprise should have them in case they have presets / tags / campaigns associated to the draft)
   * @returns {Object}
   */
  toDraftRequest(organizationId?: number) {
    const MESSAGE_PROPERTIES_TO_REMOVE = ['warnings', 'errors', 'schedulingRequired', 'template']
    // Remove lines 1596 - 1598 and add properties to INNER_MESSAGE_PROPERTIES when removing isTikTokEnabled
    let INNER_MESSAGE_PROPERTIES = [
      'snId',
      'snType',
      'linkPreview',
      'linkSettings',
      'campaignId',
      'albumName',
      'albumType',
      'linkSettingsPresetId',
      'hootPostId',
      'extendedInfo',
      'sendDate',
      'source',
      'mentions',
      'isAutoScheduled',
      'isBoosted',
      'boards',
      'composeType',
      'publishingMode',
      'postType',
      'publisherNotes',
      'attachments',
    ]

    if (isTikTokEnabled()) {
      INNER_MESSAGE_PROPERTIES = [
        ...INNER_MESSAGE_PROPERTIES,
        'disableComment',
        'disableStitch',
        'disableDuet',
      ]
    }

    const draftRequest = {}

    if (this.socialNetworksKeyedById && this.socialNetworksKeyedById.size) {
      const snIds = this.socialNetworksKeyedById.map(sn => sn.socialNetworkId).toArray()
      draftRequest.socialProfileIds = snIds
    }

    if (organizationId) {
      draftRequest.organizationId = organizationId
    }

    if (this.sendDate) {
      draftRequest.scheduledDate = new Date(
        this.sendDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS,
      ).toISOString()
    }

    // copy all fields from baseMessage, and messageText
    const messageText: string = this.renderMessageText(false, true)

    const draftMessage = Object.assign(
      {
        messageType: Constants.TYPE.DRAFT,
        text: typeof messageText === 'string' ? messageText : undefined,
        state: this.state ? this.state : undefined,
        tags: Array.isArray(this.tags) && this.tags.length > 0 ? this.tags : undefined,
        publishingMode: this.publishingMode ? this.publishingMode : undefined,
        postType: this.postType ? this.postType : undefined,
        publisherNotes: this.publisherNotes ? this.publisherNotes : undefined,
      },
      this.baseMessage,
    )

    // Remove unnecessary fields
    MESSAGE_PROPERTIES_TO_REMOVE.forEach(p => {
      delete draftMessage[p]
    })

    const shouldRemoveSendDate =
      !!(draftMessage.isAutoScheduled && this.sendDate) ||
      !DRAFT_REQUEST_SUPPORTED_SCHEDULER_TYPE.includes(this.recommendedTimesScheduledType)

    if (shouldRemoveSendDate) {
      delete draftRequest.sendDate
      delete draftRequest.scheduledDate
    }

    // ensure no undefined or null values
    Object.keys(draftMessage).forEach(k => {
      if (typeof draftMessage[k] === 'undefined' || draftMessage[k] === null) {
        delete draftMessage[k]
      }
    })

    // inner messages
    // this is for the inner messages / customized part for specific social networks
    if (this.messages && this.messages.length) {
      const tikTokMessage = this.messages.find(
        ({ snType }) => snType === SocialProfileConstants.SN_TYPES.TIKTOKBUSINESS,
      )
      if (isTikTokEnabled()) {
        if (tikTokMessage) {
          draftMessage.privacy = {
            tiktok: {
              disableStitch: tikTokMessage.disableStitch ?? false,
              disableComment: tikTokMessage.disableComment ?? false,
              disableDuet: tikTokMessage.disableDuet ?? false,
            },
          }
        }
      }

      draftMessage.messages = this.messages.map(m => {
        const innerDraftMessage = {}
        INNER_MESSAGE_PROPERTIES.forEach(property => {
          if (typeof m[property] !== 'undefined') {
            if (property === 'attachments') {
              innerDraftMessage[property] = ComposerUtils.formatAttachmentsForDraft(m[property])
            } else {
              innerDraftMessage[property] = m[property]
            }
          }
        })

        const messageFromTemplate = MessageUtils.buildMessageFromTemplate(
          m.template,
          m.linkSettings,
          m.mentions,
        )

        innerDraftMessage.message = messageFromTemplate.messageText
        innerDraftMessage.mentions = messageFromTemplate.mentions

        // force delete of sendDate if message is autoscheduled, just to be sure no weirdness happens
        if (innerDraftMessage.isAutoScheduled || shouldRemoveSendDate) {
          delete innerDraftMessage.sendDate
        }

        if (isTikTokEnabled()) {
          if (tikTokMessage) {
            delete innerDraftMessage.disableComment
            delete innerDraftMessage.disableStitch
            delete innerDraftMessage.disableDuet
          }
        }

        // link settings
        if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
          let snLinkSettings = cloneDeep(m.linkSettings)
          if (!isEmpty(snLinkSettings)) {
            // Add required by Draft service properties to link settings
            snLinkSettings = LinkUtils.sanitizeLinkSettingsToDraftValues(
              snLinkSettings,
              this.stateFarmContentSourceId,
              organizationId,
              this.memberEmail,
            )

            innerDraftMessage.linkSettings = snLinkSettings
          }
          innerDraftMessage.linkSettingsPresetId = m.linkSettingsPresetId
        }

        return innerDraftMessage
      })
    }

    // attachments
    if (Array.isArray(this.baseMessage.attachments) && this.baseMessage.attachments.length) {
      draftMessage.attachments = ComposerUtils.formatAttachmentsForDraft(this.baseMessage.attachments)
    }

    // boards
    if (this.postType === INSTAGRAM_POST_TYPES.IG_STORY) {
      draftMessage.boards = this.baseMessage.boards || undefined
      draftMessage.postType = INSTAGRAM_POST_TYPES.IG_STORY
    } else {
      draftMessage.boards = undefined
    }

    // Initial content link settings
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      let initLinkSettings = cloneDeep(this.baseMessage.linkSettings)
      if (!isEmpty(initLinkSettings)) {
        draftMessage.text = MessageUtils.buildMessageFromTemplate(
          this.baseMessage.template,
          initLinkSettings,
          [],
          true,
        ).messageText
        // Add required by Draft service properties to link settings
        initLinkSettings = LinkUtils.sanitizeLinkSettingsToDraftValues(
          initLinkSettings,
          this.stateFarmContentSourceId,
          organizationId,
          this.memberEmail,
        )

        draftMessage.linkSettings = initLinkSettings
      }
      draftMessage.text = messageText
    } else {
      if (this.baseMessage.linkSettings) {
        const tempLinkSettings = this.baseMessage.linkSettings
        if (this.messages && this.messages.length > 0 && this.messages[0]._linkSettings) {
          this.messages.forEach(msg => {
            if (msg._linkSettings && msg._linkSettings.length > 0) {
              msg._linkSettings.forEach((linkSetting, index) => {
                tempLinkSettings[index].previouslyComputedLink = linkSetting.previouslyComputedLink
              })
            }
          })
          // replace the msg text with the shortened links
          let msgText = messageText
          tempLinkSettings.forEach(linkSetting => {
            if (linkSetting.previouslyComputedLink) {
              msgText = msgText.replace(
                linkSetting.previouslyComputedLink.originalUrl,
                linkSetting.previouslyComputedLink.shortenedUrl,
              )
            }
            if (
              isFeatureEnabled('PUB_12938_STATE_FARM_NC_URL_PARAMS') &&
              ComposerUtils.isStateFarm(organizationId)
            ) {
              linkSetting.memberEmailAddress = this.memberEmail
              linkSetting.linkShortenerId = parseInt(
                getFeatureValue('PUB_12938_STATE_FARM_FORCED_VANITY_URL_ID_NC'),
                10,
              )
              if (this.stateFarmContentSourceId >= 0) {
                linkSetting.contentLibraryTemplateId = this.stateFarmContentSourceId
              }
            }
          })
          draftMessage.text = msgText
        }
        draftMessage.linkSettings = tempLinkSettings
      }
    }

    draftMessage.isBoosted = this.isBoosted

    draftRequest.message = draftMessage

    if (shouldRemoveSendDate && draftRequest?.message?.sendDate) {
      delete draftRequest.message.sendDate
    }

    return draftRequest
  }

  /**
   * Returns the message in an object acceptable by the dashboard function that sends the message to Amplify
   * @returns {Object}
   */
  toAmplifyRequest() {
    const messageData: any = {}
    messageData.message = this.renderMessageText(false, true)
    messageData.messageBySocialNetworkType = {
      twitter: messageData.message,
      facebook: messageData.message,
      instagram: messageData.message,
    }
    messageData.linkSettings = this.baseMessage.linkSettings
      ? this.baseMessage.linkSettings.map(linkSetting =>
          removeUndefinedOrNull(
            LinkSettingsUtils.convertLinkSettingsToBackendFriendlyValues(cloneDeep(linkSetting)),
          ),
        )
      : null

    // Amplify will only take the first attachment since they only support one
    // Remove PDF attachment from request data as it's not supported by Amplify
    if (isFeatureEnabledOrBeta('PUB_30723_LINKEDIN_PDF')) {
      messageData.attachments = this.attachments
        .filter(attachment => !MediaConstants.ACCEPTED_MIME_TYPES.PDF?.includes(attachment.mimeType))
        .map(a => a.toRequestObject())
    } else {
      messageData.attachments = this.attachments.map(a => a.toRequestObject())
    }

    messageData.attachmentType = this.getAttachmentType()

    messageData.isAutoScheduled = false
    messageData.sendDate = ''
    messageData.isSendAlert = true
    messageData.messageTags = this.tags
    //TODO when targeting added to NC
    messageData.twitterTargeting = null
    messageData.facebookTargeting = null
    messageData.linkedinTargeting = null

    messageData.lat = ''
    messageData.long = ''

    messageData.privacyOptions = ''
    messageData.selectedSocialNetworks = []

    messageData.socialNetworksCharsOverLimit = Object.keys(
      SocialProfileConstants.SN_TYPE_TO_MAX_MESSAGE_LENGTH,
    ).reduce((acc, snType) => {
      acc[snType] =
        this.getMessageLength(snType) > SocialProfileConstants.SN_TYPE_TO_MAX_MESSAGE_LENGTH[snType]
      return acc
    }, {})

    return messageData
  }

  /**
   * Returns if a message is empty
   * A message is considered to be empty if it cannot be sent to a social network
   * Specifically it has no social networks and both of text and attachments are empty
   */
  isEmpty(): boolean {
    let emptySocialNetworks = this.socialNetworksKeyedById.size === 0
    if (this.messageType === Constants.TYPE.TEMPLATE) {
      // Templates don't need social networks to be non-empty
      emptySocialNetworks = false
    }
    const messageText = this.renderMessageText()
    const emptyText = messageText === null || messageText.trim() === ''
    const emptyAttachments = this.attachments.length === 0

    return emptySocialNetworks && emptyText && emptyAttachments
  }

  /**
   * Returns whether or not the message has any errors
   */
  hasErrors(): boolean {
    const baseMessageHasErrors = this.baseMessage.errors !== null && Object.keys(this.errors).length > 0
    const innerMessagesHaveErrors =
      this.messages.filter(m => m.errors && Object.keys(m.errors).length > 0).length > 0
    const isValid = ValidationUtils.isValid(this.fieldValidations)
    return baseMessageHasErrors || innerMessagesHaveErrors || !isValid
  }

  /**
   * Returns whether or not the message has the specific type of error
   * @param field The field we're looking for errors on
   */
  hasErrorField(field: string): boolean {
    const baseMessageHasError = this.errors !== null && this.errors[field] !== undefined
    const innerMessagesHaveError =
      this.messages.filter(m => m.errors && m.errors[field] !== undefined).length > 0
    return baseMessageHasError || innerMessagesHaveError
  }

  /**
   * Returns whether or not the message has any warnings
   */
  hasWarnings(): boolean {
    const baseMessageHasWarnings = this.warnings && Object.keys(this.warnings).length > 0
    const innerMessagesHaveWarnings =
      this.messages.filter(m => m.warnings && Object.keys(m.warnings).length > 0).length > 0
    return baseMessageHasWarnings || innerMessagesHaveWarnings
  }

  /**
   * Returns whether or not the message has the specific type of warning
   * @param field The field we're looking for warnings on
   */
  hasWarningField(field: string): boolean {
    const baseMessageHasWarning = this.warnings !== null && this.warnings[field] !== undefined
    const innerMessagesHaveWarning =
      this.messages.filter(m => m.warnings && m.warnings[field] !== undefined).length > 0
    return baseMessageHasWarning || innerMessagesHaveWarning
  }

  hasDuplicateErrors(): boolean {
    return this.hasErrorField(Message.MESSAGE_FIELDS.template) && !_.isUndefined(this.getDuplicateErrors())
  }

  /**
   * Returns whether or not the message has any thumbnail urls
   */
  hasThumbnailUrls(): boolean {
    return !!(this.urlPreview && this.urlPreview.thumbnailUrls && this.urlPreview.thumbnailUrls.length)
  }

  getDuplicateErrors(): Error {
    return _.findWhere(this.errors.template, {
      message: Constants.COMPOSER_ERROR_MESSAGE.DUPLICATE,
    })
  }

  getDuplicateLineNumbers(): Array<number> {
    const duplicateErrors = this.getDuplicateErrors()
    return duplicateErrors.details.lineNumbers as Array<number>
  }

  /**
   * Adds a duplicate error with the proper error data structure
   * @param newDuplicateIds The ids of the new duplicates
   */
  addDuplicateError(newDuplicateIds: Array<number>) {
    const duplicateError = {
      message: Constants.COMPOSER_ERROR_MESSAGE.DUPLICATE,
      details: {
        lineNumbers: newDuplicateIds.slice(0),
      },
    }
    const field = Message.MESSAGE_FIELDS.template

    const key = 'template'
    // Message has errors so need to add the duplicate error
    if (this.hasErrors()) {
      if (this.hasErrorField(field)) {
        if (this.hasDuplicateErrors()) {
          // Message already has duplicate error so we just overrite the line numbers
          const duplicateErrors = this.getDuplicateErrors()
          duplicateErrors.details.lineNumbers = newDuplicateIds.slice(0)
        } else {
          // No duplicate error so add it with this message's id and the duplicate message's id
          this.errors[field].push(duplicateError)
        }
      } else {
        // No message text errors so we need to add the error field
        _.extend(this.errors, { [key]: [duplicateError] })
      }
    } else {
      // No errors at all so add the error field with the duplicate error to the message
      _.extend(this, {
        errors: {
          [key]: [duplicateError],
        },
      })
    }
  }

  /**
   * Returns the first error that applies to this message, or null if none is found.
   */
  getFirstErrorMessage({ isBulkComposer } = {}): string | null {
    if (this.hasErrors()) {
      if (this.errors && Object.keys(this.errors).length > 0) {
        return this.errors[Object.keys(this.errors)[0]][0].message
      } else {
        const firstInnerMessageWithError = this.messages.filter(
          m => m.errors && Object.keys(m.errors).length > 0,
        )[0]
        if (firstInnerMessageWithError) {
          return firstInnerMessageWithError.errors[Object.keys(firstInnerMessageWithError.errors)[0]][0]
            .message
        } else {
          return ValidationUtils.getFirstError(this.fieldValidations, isBulkComposer)
        }
      }
    }
    return null
  }

  /**
   * Returns the first error that applies to this message, or null if none is found.
   */
  getFirstWarningMessage(): string | null {
    if (this.hasWarnings()) {
      if (this.warnings && Object.keys(this.warnings).length > 0) {
        return this.warnings[Object.keys(this.warnings)[0]][0].message
      } else {
        const firstInnerMessageWithWarning = this.messages.filter(
          m => m.warnings && Object.keys(m.warnings).length > 0,
        )[0]
        return firstInnerMessageWithWarning.warnings[Object.keys(firstInnerMessageWithWarning.warnings)[0]][0]
          .message
      }
    }
    return null
  }

  /**
   * Returns the first error for the given field, or null if none is found
   */
  getFirstErrorMessageForField(field: string): string | null {
    if (this.hasErrorField(field)) {
      if (this.errors && Object.keys(this.errors).length > 0) {
        const errorsOfField = this.errors[field]
        if (errorsOfField && errorsOfField.length > 0) {
          return errorsOfField[0].message
        }
      }
      const firstInnerMessageWithError = this.messages.filter(
        m => m.errors && Object.keys(m.errors).length > 0,
      )[0]
      const errorsOfField = firstInnerMessageWithError.errors[field]
      if (errorsOfField && errorsOfField.length > 0) {
        return errorsOfField[0].message
      }
    }
    return null
  }

  /**
   * Returns the first warning for the given field, or null if none is found
   */
  getFirstWarningMessageForField(field: string): string | null {
    if (this.hasWarningField(field)) {
      if (this.warnings && Object.keys(this.warnings).length > 0) {
        const warningsOfField = this.warnings[field]
        if (warningsOfField && warningsOfField.length > 0) {
          return warningsOfField[0].message
        }
      }
      const firstInnerMessageWithWarning = this.messages.filter(
        m => m.warnings && Object.keys(m.warnings).length > 0,
      )[0]
      const warningsOfField = firstInnerMessageWithWarning.warnings[field]
      if (warningsOfField && warningsOfField.length > 0) {
        return warningsOfField[0].message
      }
    }
    return null
  }

  /**
   * Returns the correct post type based on attachments
   */
  getInstagramPostType(p?: PostType): PostType {
    //postType should be IG_FEED by default for IG messages
    const postType = p ?? this.postType
    if (postType && this.messages?.length) {
      if (postType === INSTAGRAM_POST_TYPES.IG_STORY) return postType

      let newPostType = postType
      if (this.publishingMode === Constants.INSTAGRAM_PUBLISHING_MODES.PUSH_PUBLISH) {
        newPostType = INSTAGRAM_POST_TYPES.IG_FEED
      } else {
        const shouldBeReel = this.messages.some(
          innerMessage =>
            innerMessage.snType === 'INSTAGRAMBUSINESS' &&
            innerMessage.attachments.length === 1 &&
            VideoAttachment.isVideoAttachment(innerMessage.attachments[0]),
        )

        newPostType = shouldBeReel ? INSTAGRAM_POST_TYPES.IG_REEL : INSTAGRAM_POST_TYPES.IG_FEED
      }
      return newPostType
    } else {
      return postType
    }
  }

  /**
   * Returns the username of the specified social profile or null if not found
   */
  getSocialProfileUsernameById(profileId: number): string | null {
    let profile
    if (Immutable.Map.isMap(this.socialNetworksKeyedById)) {
      profile = _.find(this.socialNetworksKeyedById.toJS(), network => {
        return network.socialNetworkId === profileId
      })
    } else {
      profile = _.find(this.socialNetworksKeyedById, n => n.profileId === profileId)
    }

    if (profile !== undefined) {
      return profile.username
    } else {
      return null
    }
  }

  /**
   * @param profileIds
   * @returns The usernames of the specified social profiles or empty array if not found
   */
  getSocialProfileUsernamesByIds(profileIds: Array<number>): Array<string> {
    let profiles = []
    if (Immutable.Map.isMap(this.socialNetworksKeyedById)) {
      profiles = _.map(profileIds, id => {
        return _.find(this.socialNetworksKeyedById.toJS(), network => {
          return network.socialNetworkId === id
        })
      })
    } else {
      profiles = _.map(profileIds, id => {
        return _.find(this.socialNetworksKeyedById, function (network) {
          return network.profileId === id
        })
      })
    }
    return profiles.length > 0 ? _.pluck(profiles, 'username') : []
  }

  /**
   * @returns An Array of the social network types that apply to the message
   */
  getSocialNetworkTypes(): Array<string> {
    if (Immutable.Map.isMap(this.socialNetworksKeyedById)) {
      const socialNetworkTypes: Array<string> = []
      this.socialNetworksKeyedById.map(socialNetwork => socialNetworkTypes.push(socialNetwork.type))
      return _.unique(socialNetworkTypes)
    } else {
      return _.unique(_.pluck(this.socialNetworksKeyedById, 'type'))
    }
  }

  /**
   * @returns An Array of the social network groups that apply to the message
   */
  getSocialNetworkGroups(): Array<SocialNetworkGroup> {
    const selectedSocialNetworkGroups = this.getSocialNetworkTypes().map(
      networkType => SocialProfileConstants.SN_TYPE_TO_SN_GROUP[networkType],
    )
    return Array.from(new Set(selectedSocialNetworkGroups))
  }

  /**
   * @param permission
   * @returns An Array of the social networks which have a specific permission
   */
  getSocialProfilesWithPermission(permission: string): Array<SocialNetwork> {
    const socialProfiles: Array<SocialNetwork> = []
    this.socialNetworksKeyedById.forEach(profile => {
      if (profile?.permissions?.[permission]) {
        socialProfiles.push(profile)
      }
    })
    return socialProfiles
  }

  /**
   * @returns An Array of the social network ids associated with the message
   */
  getSocialNetworkIds(): Array<number> {
    if (Immutable.Map.isMap(this.socialNetworksKeyedById)) {
      const socialNetworkIds: Array<number> = []
      this.socialNetworksKeyedById.map((value, key) => socialNetworkIds.push(Number(key)))
      return socialNetworkIds
    } else {
      return _.map(_.keys(this.socialNetworksKeyedById), Number)
    }
  }

  /**
   * @returns The ids of non-private social networks or an empty array
   */
  getNonPrivateSocialNetworkIds(): Array<number> {
    if (Immutable.Map.isMap(this.socialNetworksKeyedById)) {
      const socialNetworkIds: Array<number> = []
      this.socialNetworksKeyedById.map((value, key) => {
        if (value && value.ownerType !== Constants.OWNER_TYPE.MEMBER) {
          socialNetworkIds.push(Number(key))
        }
      })
      return socialNetworkIds
    } else {
      return _.pluck(
        _.filter(this.socialNetworksKeyedById, (network: SocialNetwork) => {
          return network.ownerType !== Constants.OWNER_TYPE.MEMBER
        }),
        'socialNetworkId',
      )
    }
  }

  /**
   * Returns the number of characters considered to be in the message accord to social network type
   * Does not account for DMs or Mentions
   * @param socialNetworkType
   */
  getMessageLength(socialNetworkType: SocialNetworkType): number {
    const messageText = this.renderMessageText(true)
    const message = typeof messageText === 'string' ? messageText : ''
    let messageLength = 0
    let owlyUrlsToAppendLength = 0
    if (this.attachments.length) {
      // Calculate the length of the owly urls that will be appended to the message on send
      // (length of an image * number of images) + the number of spaces to seperate them from each other and the message
      owlyUrlsToAppendLength =
        Constants.owlyImageUrlLength * this.attachments.length + this.attachments.length
    }

    if (socialNetworkType === SocialProfileConstants.SN_TYPES.TWITTER) {
      if (isFeatureEnabled('PUB_30462_TWITTER_MESSAGE_LENGTH')) {
        const { weightedLength } = twitterText.parseTweet(message)
        messageLength = weightedLength || 0
      } else {
        messageLength = twitterText.getTweetLength(message)

        const missingLinkInTwitterMessage =
          this.urlPreview &&
          message.indexOf(this.urlPreview.url) === -1 &&
          message.indexOf(this.urlPreview.originalUrl) === -1
        if (missingLinkInTwitterMessage) {
          messageLength += Constants.twitterUrlLength
          if (message.length && message.charAt(message.length - 1) !== ' ') {
            messageLength += 1
          }
        }
      }
    } else if (
      SocialProfileConstants.SN_TYPE_TO_SN_GROUP[socialNetworkType] ===
      SocialProfileConstants.SN_GROUP.LINKEDIN
    ) {
      messageLength += message.length + owlyUrlsToAppendLength
    } else {
      messageLength = message.length
    }

    return messageLength
  }

  getHashtagCount(): number {
    const messageText = this.renderMessageText()
    const message = typeof messageText === 'string' ? messageText : ''
    return twitterText.extractHashtags(message).length
  }

  getAttachmentType(): string | null {
    if (this.hasAttachments()) {
      const firstAttachment = this.selectedNetworkGroup
        ? MessageUtils.getAttachmentsBySelectedNetwork(this.messages, this.selectedNetworkGroup)[0]
        : this.attachments[0]

      if (VideoAttachment.isVideoAttachment(firstAttachment)) {
        return FIELD_TYPES.VIDEO
      } else if (GifAttachment.isGifAttachment(firstAttachment)) {
        return FIELD_TYPES.GIF
      } else if (ImageAttachment.isImageAttachment(firstAttachment)) {
        return FIELD_TYPES.IMAGE
      }
      return null
    }
  }

  /**
   * @returns Whether or not the message has attachments
   */
  hasAttachments(checkAllAttachments?: boolean): boolean {
    if (checkAllAttachments) {
      return !_.isEmpty(this.attachments) || this.messages.some(message => !_.isEmpty(message.attachments))
    }

    if (!this.selectedNetworkGroup) {
      return !_.isEmpty(this.attachments)
    }

    return !_.isEmpty(MessageUtils.getAttachmentsBySelectedNetwork(this.messages, this.selectedNetworkGroup))
  }

  /**
   * @returns Whether or not the message has locations
   */
  hasLocations(): boolean {
    return Object.keys(this.locations).length > 0
  }

  /**
   * @returns Whether or not the message has targeting
   */
  hasTargeting(): boolean {
    return Object.keys(this.targeting).length > 0
  }

  /**
   * @returns Whether or not the message has a video attachment
   * Checks all attachments and returns true if any of them is a video
   */
  hasVideoAttachment(checkAllAttachments?: boolean): boolean {
    if (!this.hasAttachments(checkAllAttachments)) {
      return false
    }

    if (checkAllAttachments || !this.selectedNetworkGroup) {
      return (
        this.attachments?.some(attachment => VideoAttachment.isVideoAttachment(attachment)) ||
        this.messages.some(message =>
          message.attachments?.some(attachment => VideoAttachment.isVideoAttachment(attachment)),
        )
      )
    }
    const selectedNetworkAttachments = MessageUtils.getAttachmentsBySelectedNetwork(
      this.messages,
      this.selectedNetworkGroup,
    )

    return selectedNetworkAttachments?.some(attachment => VideoAttachment.isVideoAttachment(attachment))
  }

  /**
   * @returns Whether or not the message has a gif attachment
   * Assumes that with a gif attachment there is only one and it is the first
   */
  hasGifAttachment(): boolean {
    const firstAttachment = this.selectedNetworkGroup
      ? MessageUtils.getAttachmentsBySelectedNetwork(this.messages, this.selectedNetworkGroup)[0]
      : this.attachments[0]

    return this.hasAttachments() && GifAttachment.isGifAttachment(firstAttachment)
  }

  /**
   * @returns Whether or not the message has an image attachment (not including gifs)
   * Only checks the first attachment
   */
  hasImageAttachment(): boolean {
    const firstAttachment = this.selectedNetworkGroup
      ? MessageUtils.getAttachmentsBySelectedNetwork(this.messages, this.selectedNetworkGroup)[0]
      : this.attachments[0]

    return this.hasAttachments() && ImageAttachment.isImageAttachment(firstAttachment)
  }

  /**
   * @returns Whether or not the message has linkedInV2Company targeting
   */
  hasLinkedInV2Targeting(): boolean {
    return !!(this.baseMessage && this.baseMessage.targeting && this.baseMessage.targeting.linkedInV2Company)
  }

  /**
   * Return whether or not the message has applied facebookPage targeting
   */
  hasFacebookTargeting(): boolean {
    const hasFBTargeting = !!(
      this.baseMessage &&
      this.baseMessage.targeting &&
      this.baseMessage.targeting.facebookPage
    )
    return (
      hasFBTargeting &&
      !!Object.values(this.baseMessage.targeting.facebookPage).filter(
        targetOption => targetOption && (typeof targetOption === 'number' || targetOption.length),
      ).length
    )
  }

  stripUrlPreviewIfAttachmentsExist() {
    if (this.hasAttachments()) {
      this.urlPreview = null
    }
    return this
  }

  /**
   * Returns true if one of the given profile types is selected
   * @param {...string} types One or more social profile types
   * @return {boolean}
   * @deprecated - Prefer use of ComposerUtils.hasSocialProfileType directly
   */
  isSocialProfileTypeSelected(...types) {
    return ComposerUtils.hasSocialProfileType(this.getSocialNetworkTypes(), ...types)
  }

  /**
   * @returns True if any profile type is selected
   */
  isSocialProfileSelected(): boolean {
    return this.socialNetworksKeyedById.size > 0
  }

  /**
   * Takes in a preset and link settings and returns whether those links have the preset applied or not.
   * @param {object} preset An object containing the preset
   * @returns {boolean} Returns whether or not the links have that preset applied
   */
  hasPresetApplied(preset) {
    // For a preset to be applied, it's properties must be on ALL the given links.
    return _.every(this.linkSettings, linkSetting => {
      return _.isEqual(_.omit(linkSetting, ['url', 'previouslyComputedLink']), _.omit(preset, 'name'))
    })
  }

  /**
   * @returns The Boost campaign of the message if it exists
   */
  getBoostCampaign(): AdPromotionCreateBoostCampaignRequest | undefined {
    const message = this.messages.find(m => !!m.boostCampaign)
    return message && message.boostCampaign
  }

  /**
   * @returns The SOCIAL_NETWORK type of the boosted message
   */
  getBoostSocialNetwork(): SocialNetworkType {
    const message = this.messages.find(m => m.isBoosted)
    return message?.snType ? Constants.SN_TYPES_TO_BOOST_SOCIAL_NETWORK[message.snType] : null
  }

  /**
   * @returns The saved Boost campaign of the message if it exists
   */
  getSavedBoostCampaign(): AdPromotionCreateBoostCampaignRequest | undefined {
    const message = this.messages.find(m => !!m.savedBoostCampaign)
    return message && message.savedBoostCampaign
  }

  /**
   * @returns an array of error codes sorted by ascending order, duplicates removed
   */
  getErrorCodes(): Array<number> {
    if (!_.isEmpty(this.fieldValidations) && !_.isEmpty(this.fieldValidations.errors)) {
      return _.uniq(_.flatten(_.map(this.fieldValidations.errors, error => _.pluck(error, 'code')))).sort()
    }
    return []
  }

  /**
   * @param networkGroup An optional network group, if undefined mentions from all networks will be returned
   * @returns An array of mentions present in the current message with duplicates removed
   */
  getAllMentions(networkGroup?: SocialNetworkGroup | null): Mentions {
    const allMentions: Mentions = []
    if (!networkGroup) {
      // With PNE, mentions are always empty on initial content
      return allMentions
    }
    if (this.supportsMentions()) {
      const mentionsByType = {}
      // Grab the mentions for each message type, skipping duplicate types
      this.messages.forEach(m => {
        const mentionType = m.snType
        if (!networkGroup || MessageUtils.isNetworkTypeInGroup(mentionType, networkGroup)) {
          if (mentionType && !mentionsByType.hasOwnProperty(mentionType)) {
            const mentions = m?.mentions
            if (mentions?.length) {
              mentionsByType[mentionType] = mentions
              allMentions.push(...mentions)
            }
          }
        }
      })
    }
    return allMentions
  }

  /**
   * Returns a copy of this wrapper that is easily compared to other wrappers.
   * Handles issues such as wrappers having inner objects that aren't data equal but are still semantically equal.
   * @return A copy of this message that is comparable to other comparable wrappers
   */
  asComparible(): Record<string, unknown> {
    const wrapperData = MESSAGE_FIELDS.reduce((acc, next) => {
      acc[next] = this[next]

      if (next === 'attachments' && this[next]) {
        acc[next] = this[next].map(a => a.toDataObject())
      }

      return acc
    }, {})

    return Object.assign(wrapperData, {
      messages: this.messages.map(m => m.asComparible()),
    })
  }

  /**
   * Applies campaign presets to the base message link settings
   * and PNE link settings
   * @param linkSettings An object containing base message link settings and
   * PNE link settings with campaign presets
   */
  applyCampaignPresets(linkSettings: {
    baseMessage: { linkSettings: LinkSettings; linkSettingsPresetId: number }
    [snType: string]: { linkSettings: LinkSettings; linkSettingsPresetId: number }
  }): void {
    const { baseMessage } = linkSettings
    if (!isUndefined(baseMessage.linkSettings)) {
      this.baseMessage.linkSettings = baseMessage.linkSettings
    }

    if (!isUndefined(baseMessage.linkSettingsPresetId)) {
      this.baseMessage.linkSettingsPresetId = baseMessage.linkSettingsPresetId
    }

    this.messages?.forEach(m => {
      const snLinkPresets = linkSettings?.[m.snType]
      const { linkSettings: pneLinkSettings, linkSettingsPresetId } = snLinkPresets || {}
      if (!isUndefined(pneLinkSettings)) {
        m.linkSettings = pneLinkSettings
      }

      if (!isUndefined(linkSettingsPresetId)) {
        m.linkSettingsPresetId = linkSettingsPresetId
      }
    })
  }

  /**
   * Creates a random message, for testing purposes
   * @param id
   * @param isValid Whether the created message should have some validation errors
   * @param overrides Overrides for the arguments to creating the message
   * @returns A Message object
   */
  static randomMessage(id: number, isValid: boolean, overrides: Record<string, unknown>): Message {
    overrides = overrides || {}
    isValid = isValid || false

    if (id === undefined) {
      id = _.random(1000, 9000000)
    }

    const urlPreview = {
      url: 'http://static.ow.ly/photos/original/c46S5.jpg',
      thumbnailUrl: 'http://static.ow.ly/photos/original/c46S5.jpg',
      thumbnailUrls: [
        'http://static.ow.ly/photos/original/c46S5.jpg',
        'https://blog.hootsuite.com/wp-content/uploads/2016/06/rekindle-flame-280x165.jpg',
      ],
      title: 'Best Title Ever',
      description: 'Best Description Ever. ',
    }

    const attachments = [
      ComposerUtils.createAttachmentFromData({
        fileName: 'shits_on_fire_yo.jpg',
        bytes: 5062,
        mimeType: 'image/jpeg',
        thumbnailUrl: 'https://d2jhuj1whasmze.cloudfront.net/photos/thumb/ug7Jx.jpg',
        url: 'https://d2jhuj1whasmze.cloudfront.net/photos/original/ug7Jx.jpg',
      }),
    ]

    return new Message(
      _.extend(
        {
          id: id,
          schedulingRequired: true,
          socialNetworksKeyedById: Immutable.OrderedMap({
            1: {
              socialNetworkId: 1,
              ownerId: 38938,
              ownerType: 'ORGANIZATION',
              userId: '125714404',
              username: 'pantsmacgee1',
              avatar: 'http://pbs.twimg.com/profile_images/791357693/Picture_4_normal.png',
              type: 'TWITTER',
              isReauthRequired: 0,
              isSecurePost: 1,
              permissions: {
                SN_BASIC_USAGE: true,
                SN_POST_WITH_APPROVAL: false,
                SN_POST: true,
                SN_APPROVE_MESSAGE: true,
                SN_PRIVATE_STREAM: true,
                SN_MANAGE_CONTACT: true,
                SN_MANAGE_RSS: true,
                SN_MANAGE_PROFILE: true,
                SN_MANAGE_PERMISSION: true,
                SN_MANAGE_ADS: true,
              },
            },
            2: {
              socialNetworkId: 2,
              ownerId: 38938,
              ownerType: 'ORGANIZATION',
              userId: '125714404',
              username: 'pantsmacgee2',
              avatar: 'http://pbs.twimg.com/profile_images/791357693/Picture_4_normal.png',
              type: 'TWITTER',
              isReauthRequired: 0,
              isSecurePost: 1,
              permissions: {
                SN_BASIC_USAGE: true,
                SN_POST_WITH_APPROVAL: false,
                SN_POST: true,
                SN_APPROVE_MESSAGE: true,
                SN_PRIVATE_STREAM: true,
                SN_MANAGE_CONTACT: true,
                SN_MANAGE_RSS: true,
                SN_MANAGE_PROFILE: true,
                SN_MANAGE_PERMISSION: true,
                SN_MANAGE_ADS: true,
              },
            },
            3: {
              socialNetworkId: 3,
              ownerId: 38938,
              ownerType: 'ORGANIZATION',
              userId: '125714404',
              username: 'pantsmacgee3',
              avatar: 'http://pbs.twimg.com/profile_images/791357693/Picture_4_normal.png',
              type: 'FACEBOOK',
              isReauthRequired: 0,
              isSecurePost: 1,
              permissions: {
                SN_BASIC_USAGE: true,
                SN_POST_WITH_APPROVAL: false,
                SN_POST: true,
                SN_APPROVE_MESSAGE: true,
                SN_PRIVATE_STREAM: true,
                SN_MANAGE_CONTACT: true,
                SN_MANAGE_RSS: true,
                SN_MANAGE_PROFILE: true,
                SN_MANAGE_PERMISSION: true,
                SN_MANAGE_ADS: true,
              },
            },
          }),
          template: "I'm a random message! (%s)".replace('%s', String(id)),
          linkSettingsPresetId: 3,
          urlPreview: urlPreview,
          linkSettings: [
            {
              url: 'http://www.cbc.ca',
              linkShortenerId: 1,
              linkTracker: {
                type: Constants.LINK_TRACKER.ENTITLED.GA,
                trackingParameters: [
                  {
                    name: 'UTM Source',
                    type: Constants.LINK_TRACKING_PARAMS.TYPEVALUE.CUSTOM,
                    value: 'Hootsuite',
                  },
                ],
              },
              previouslyComputedLink: {
                shortenedUrl: 'http://ow.ly/52135',
              },
            },
          ],
          attachments,
          sendDate: Date.now(),
          tags: [
            {
              contextType: 'MESSAGE',
              description: null,
              id: 1,
              isArchived: false,
              name: 'a',
              ownerId: 205518,
              ownerType: 'ORGANIZATION',
            },
            {
              contextType: 'MESSAGE',
              description: null,
              id: 2,
              isArchived: false,
              name: 'b',
              ownerId: 205518,
              ownerType: 'ORGANIZATION',
            },
            {
              contextType: 'MESSAGE',
              description: null,
              id: 3,
              isArchived: false,
              name: 'c',
              ownerId: 205518,
              ownerType: 'ORGANIZATION',
            },
          ],
          albumName: 'pseudoAlbum',
          albumType: FacebookAlbumPickerConstants.ALBUM_TYPES.WALL,
          errors: isValid
            ? {}
            : {
                template: [
                  {
                    message: 'This message is too long for Twitter',
                  },
                ],
              },
          messages: [],
          selectedNetworkGroup: null,
        },
        overrides,
      ),
    )
  }

  /**
   * Updates the line number details for duplicate wrappers. Currently only used in Bulk
   * For example, one message's error field would change from:
   * errors: {
   *  template: [{
   *    message: 'This message is a duplicate of another message. Posting the same message more than once is not allowed.',
   *    details: {
   *      lineNumbers: [1, 2, 3, 4, 5, 6]
   *    }
   *  }]
   * }
   * to:
   * errors: {
   *  template: [{
   *    message: 'This message is a duplicate of another message. Posting the same message more than once is not allowed.',
   *    details: {
   *      lineNumbers: [1, 2, 3, 4, 5]
   *    }
   *  }]
   * }
   * WARNING: Modifies the passed in wrappers
   * @param messages The message wrappers
   * @param messageIdsToUpdate
   * @param messageToRemove
   * @return messages The wrappers that were passed in, now mutated
   */
  static updateDuplicateMessages(
    messages: Array<Message>,
    messageIdsToUpdate: Array<number>,
    messageToRemove: { id: number; value: string },
  ): Array<Message> {
    if (!messages || !messages.length || !messageIdsToUpdate || !messageToRemove) {
      return messages
    }

    // Ensure that the message text of the message to remove is not the same as before
    const messagesToUpdate = messages.filter(
      m => _.contains(messageIdsToUpdate, m.id) && m.id !== messageToRemove.id,
    )
    const messageHasChanged =
      messagesToUpdate.filter(m => m.renderMessageText().trim() !== messageToRemove.value.trim()).length > 0
    if (!messageHasChanged) {
      return messages
    }

    if (messageIdsToUpdate.length === 2) {
      const duplicateMessage = _.find(
        messages,
        (m: Message) => _.contains(messageIdsToUpdate, m.id) && m.id !== messageToRemove.id,
      )
      const validation = duplicateMessage.validateField(Message.MESSAGE_FIELDS.template)
      duplicateMessage.errors = validation.errors
      duplicateMessage.warnings = validation.warnings
    } else {
      messages.forEach(m => {
        if (m.id === messageToRemove.id) {
          return // continue
        }
        if (_.contains(messageIdsToUpdate, m.id)) {
          const lineNumbers = m.getDuplicateLineNumbers()
          lineNumbers.splice(lineNumbers.indexOf(messageToRemove.id), 1)
        }
      })
    }
    return messages
  }

  // Expose static constants without making them mutable in the class
  static MESSAGE_FIELDS: Record<string, string> = _.reduce(
    MESSAGE_FIELDS,
    (memo, field) => {
      memo[field] = field
      return memo
    },
    {},
  )

  static INNER_MESSAGE_FIELDS: Record<string, string> = _.reduce(
    INNER_MESSAGE_FIELDS,
    (memo, field) => {
      memo[field] = field
      return memo
    },
    {},
  )
}
