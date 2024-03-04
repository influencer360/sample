/**
 * An InnerMessage is the data storage for an actual message.
 * A Message is a wrapper that contains 0 or more InnerMessages.
 * A Message has no data except UI/cache, whereas InnerMessages contain the actual data of each message that will eventually be sent.
 * An InnerMessage is never edited directly; instead the Message wrapper is told about a change, and updates the InnerMessages accordingly.
 * Thus InnerMessages are very simple; they are data stores that know how to convert themselves into JSON for various endpoints.
 * The Message wrapper is responsible for ensuring the data entering an InnerMessage is valid and consistent.
 * InnerMessages never need to "apply" shared fields from the wrapper; the Message wrapper keeps them up to date as they change, so they're always ready to go.
 * A Message wrapper can ask its InnerMessages for data, such as when checking for errors. The inverse is not true: InnerMessages are not aware they are managed by a Message.
 * Message wrappers and their data are never stored long term - once the store refreshes, new ones are created.
 * Setters for InnerMessage fields handle the work of only applying the relevant fields - the wrapper can just "set" the field, and the InnerMessage will act according to what is allowed. For example,
 *   since twitter doesn't support url previews, when the Message wrapper calls set linkPreview on a twitter InnerMessage, it will be ignored, but for a facebook InnerMessage it will be stored.
 * The getters and setters of InnerMessage are the only places inside or out that should refer to the actual data (starting with underscore). Everything else should use the getters (non underscore).
 * All fields in an InnerMessage are undefined until set; there is no need to mask them to null or initial values. This makes toMPS, etc. simpler.
 */

import { cloneDeep, isEmpty, isNil, isObject } from 'lodash'
import _ from 'underscore'
import { makeToBoostRequest } from 'fe-ae-lib-boost-composer'
import { isTikTokEnabled } from 'fe-lib-darklaunch'
import { Constants } from 'fe-pnc-constants'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkType } from 'fe-pnc-constants-social-profiles'
import type { AttachmentObject, Boards } from 'fe-pnc-data-composer-message'
import { VideoAttachment } from 'fe-pnc-data-composer-message'
import type { Mentions } from 'fe-pnc-data-message-previews'
import { isFeatureEnabled, isFeatureEnabledOrBeta, getFeatureValue } from 'fe-pnc-lib-darklaunch'
import { DateUtils, LinkSettingsUtils, getIsAltTextSupported } from 'fe-pnc-lib-utils'
import { FIELD_VALIDATIONS } from 'fe-pnc-validation-error-messages'

import ComposerConstants from '@/constants/composer'
import FacebookAlbumPickerConstants from '@/constants/facebook-album-picker'
import {
  AdPromotionCreateBoostCampaignRequest,
  Attachments,
  BaseMessage,
  ComposeType,
  Errors,
  ExtendedInfo,
  FieldValidations,
  LinkSetting,
  LinkSettings,
  Location,
  PNPPlace,
  PostType,
  PublishingMode,
  Source,
  Tags,
  Targeting,
  URLPreview,
} from '@/typings/Message'
import AttachmentUtils from '@/utils/attachment-utils'
import ComposerUtils from '@/utils/composer-utils'
import deepClean from '@/utils/deep-clean'
import LinkUtils from '@/utils/link-utils'
import MessageUtils from '@/utils/message-utils'
import removeEmpty from '@/utils/remove-empty'
import removeUndefinedOrNull from '@/utils/remove-undefined-or-null'
import { getScheduledSendTimeString } from '@/utils/scheduler-utils'
import { supportsCustomThumbnail } from '@/utils/thumbnail-utils'
import ValidationUtils, { InvalidURLErrorCode } from '@/utils/validation-utils'

const {
  TWITTER,
  FACEBOOK,
  FACEBOOKGROUP,
  FACEBOOKPAGE,
  LINKEDIN,
  LINKEDINCOMPANY,
  LINKEDINGROUP,
  INSTAGRAM,
  INSTAGRAMBUSINESS,
  PINTEREST,
  TIKTOKBUSINESS,
} = SocialProfileConstants.SN_TYPES

// Can combine TIKTOK_MESSAGE_DEFAULTS & ALL_MESSAGE_DEFAULTS into LEGAL_FIELDS const and just export that when removing isTikTokEnabled
const TIKTOK_MESSAGE_DEFAULTS = {
  disableComment: false,
  disableStitch: false,
  disableDuet: false,
}

const ALL_MESSAGE_DEFAULTS = isFeatureEnabledOrBeta('PUB_28512_REELS_THUMBNAIL')
  ? {
      snId: undefined,
      snType: undefined,
      postType: undefined,
      linkPreview: undefined,
      mentions: [],
      isBoosted: false,
      boostCampaign: null,
      savedBoostCampaign: null,
      ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') ? { linkSettings: [] } : []),
      ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')
        ? {
            linkSettingsPresetId: null,
            unEditedUrlPreview: null,
            isVerifiedFbPage: undefined,
          }
        : {}),
    }
  : {
      snId: undefined,
      snType: undefined,
      linkPreview: undefined,
      mentions: [],
      isBoosted: false,
      boostCampaign: null,
      savedBoostCampaign: null,
      ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') ? { linkSettings: [] } : []),
      ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')
        ? {
            linkSettingsPresetId: null,
            unEditedUrlPreview: null,
            isVerifiedFbPage: undefined,
          }
        : {}),
    }

// Defaults for fields that are only set on Inner Messages
// All other fields will default to the values specified in Message.baseMessage
export const INNER_MESSAGE_DEFAULTS = ALL_MESSAGE_DEFAULTS

// All fields that are possible on an InnerMessage.
// If you add to this, you need to update the other methods in this file, such as toMPSRequest
export const LEGAL_FIELDS = [
  ...Object.keys(INNER_MESSAGE_DEFAULTS),
  'template',
  'linkSettings',
  'campaignId',
  'attachments',
  'albumName',
  'albumType',
  ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')
    ? []
    : ['linkSettingsPresetId', 'isVerifiedFbPage']),
  'hootPostId',
  'extendedInfo',
  'sendDate',
  'source',
  'tags',
  'targeting',
  'location',
  'isAutoScheduled',
  'errors',
  'fieldValidations',
  'warnings',
  'boards',
  'composeType',
  'publishingMode',
  ...(isFeatureEnabledOrBeta('PUB_28512_REELS_THUMBNAIL') ? [] : ['postType']),
  'publisherNotes',
  'oneTimeReviewerId',
]

const highToleranceHashtagRegex = /#[^\s\';:\"\*\&\$\[\{\]\}\@\#\!\,\.]+/

export default class InnerMessage {
  _attachments?: Attachments
  _boards?: Boards
  _albumName?: string
  _albumType?: string
  _boostCampaign?: AdPromotionCreateBoostCampaignRequest | null
  _campaignId?: string
  _composeType?: ComposeType
  _errors?: Errors
  _extendedInfo?: ExtendedInfo
  _fieldValidations?: FieldValidations
  _hootPostId?: string
  _isAutoScheduled?: boolean
  _isBoosted?: boolean
  _linkPreview?: URLPreview | null
  _unEditedUrlPreview?: URLPreview | null
  _linkSettings?: LinkSettings | null
  _linkSettingsPresetId?: number
  _location?: Location
  _mentions?: Mentions
  _publishingMode?: PublishingMode
  _postType?: PostType
  _publisherNotes?: string
  _savedBoostCampaign?: AdPromotionCreateBoostCampaignRequest | null
  _sendDate?: number
  _snId?: string
  _snType?: SocialNetworkType
  _source?: Source
  _tags?: Tags
  _targeting?: Targeting
  _warnings?: Errors
  _disableStitch?: boolean
  _disableComment?: boolean
  _disableDuet?: boolean
  _hasCatalogs?: boolean
  _template?: string
  _oneTimeReviewerId?: number | undefined
  _isVerifiedFbPage?: boolean | false

  /**
   * @param {object} data The object of fields to set on the new message
   */
  constructor(data) {
    if (isTikTokEnabled()) {
      LEGAL_FIELDS.push(...Object.keys(TIKTOK_MESSAGE_DEFAULTS))
    }

    Object.keys(data).forEach(field => {
      //Keep the data clean so it is predictable, and changes are well handled
      if (!LEGAL_FIELDS.find(f => f === field)) {
        throw new TypeError(`Cannot create an InnerMessage with field '${field}'`)
      }

      if (!data.snId) {
        throw new TypeError('Cannot create an InnerMessage without an snId')
      }

      if (!data.snType) {
        throw new TypeError('Cannot create an InnerMessage without an snType')
      }

      // do not store empty fields, only real data. This will prevent annoying undefined/null values getting into JSON
      if (typeof data[field] === 'undefined' || data[field] === null) {
        return
      }

      // Set the field. This actually uses the setters, so things like cloning or sn-specific support are handled automatically
      this[field] = data[field]
    })
  }

  /**
   * Safely clones the innerMessage
   * @returns The InnerMessage
   */
  clone(): InnerMessage {
    const data = LEGAL_FIELDS.reduce((acc, next) => {
      if (typeof this[next] !== 'undefined') {
        acc[next] = this[next] // the constructor will clone any fields, if necessary
      }
      return acc
    }, {})

    return new InnerMessage(data)
  }

  /**
   * @returns The InnerMessage converted into an object that can be deep compared for equality to another comparible InnerMessage
   */
  asComparible(): Record<string, unknown> {
    return LEGAL_FIELDS.reduce((acc, next) => {
      if (typeof this[next] !== 'undefined') {
        acc[next] = this[next]
      }

      if (next === 'attachments' && this[next]) {
        acc[next] = this[next].map(a => a.toDataObject())
      }

      return acc
    }, {})
  }

  set snId(v: string | undefined) {
    this._snId = v
  }

  get snId(): string | undefined {
    return this._snId
  }

  set snType(v: SocialNetworkType | undefined) {
    this._snType = v
  }

  get snType(): SocialNetworkType | undefined {
    return this._snType
  }

  set linkPreview(v: URLPreview | null | undefined) {
    v = cloneDeep(v)
    switch (this.snType) {
      case TWITTER:
      case INSTAGRAM:
      case INSTAGRAMBUSINESS:
        return
      case FACEBOOK:
      case FACEBOOKGROUP:
        // some networks allow removing or changing the thumbnail, but not any metadata
        if (v !== null && typeof v === 'object') {
          delete v.title
          delete v.description
        }
        this._linkPreview = v
        return
      case LINKEDIN:
      case LINKEDINCOMPANY:
        if (!isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
          // linkedin allows changing (but not removing) the thumbnail, and editing the title but not the description
          // most support for linkedin profiles is temporary - eventually they will be like facebook profiles
          if (v !== null && typeof v === 'object') {
            if (v.thumbnailUrl === null && this.linkPreview && this.linkPreview.thumbnailUrl !== null) {
              v.thumbnailUrl = this.linkPreview.thumbnailUrl // disallow removing the thumbnail by setting the "new" one to the old one if the new one doesn't exist
            }
          }
        }
        this._linkPreview = v
        return
      case LINKEDINGROUP:
        // Move this case up under the LINKEDIN/LINKEDINCOMPANY
        // when PUB_31031_UPLOAD_LI_THUMBNAILS is removed
        if (isFeatureEnabled('PUB_31031_UPLOAD_LI_THUMBNAILS')) {
          this._linkPreview = v
        }
        return
      case FACEBOOKPAGE:
        if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
          if (!this.isVerifiedFbPage) {
            this._linkPreview = this._unEditedUrlPreview
          } else {
            this._linkPreview = v
          }
        } else {
          this._linkPreview = v
        }
        return
      case PINTEREST:
      default:
        // Break nicely for unknown social networks by assuming it supports everything. PNP will be the source of truth
        // Pinterest is currently not using link previews, but we're supporting them on the model for now
        // Facebook Page will either use the uneditedUrlPreview or a customized preview if it is verified
        this._linkPreview = v
        return
    }
  }

  get linkPreview(): URLPreview | null | undefined {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      if (!this.isVerifiedFbPage && this.snType === SocialProfileConstants.SN_TYPES.FACEBOOKPAGE) {
        return cloneDeep(this._unEditedUrlPreview)
      }
    }
    return cloneDeep(this._linkPreview)
  }

  set unEditedUrlPreview(v: URLPreview | null | undefined) {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const unEditedUrlPreview = cloneDeep(v)
      switch (this.snType) {
        case FACEBOOK:
        case FACEBOOKGROUP:
          if (!isNil(unEditedUrlPreview) && isObject(unEditedUrlPreview)) {
            delete unEditedUrlPreview.title
            delete unEditedUrlPreview.description
          }
          this._unEditedUrlPreview = unEditedUrlPreview
          return
        case FACEBOOKPAGE:
        case LINKEDIN:
        case LINKEDINCOMPANY:
        case LINKEDINGROUP:
          this._unEditedUrlPreview = unEditedUrlPreview
          return
        default:
          this._unEditedUrlPreview = this.linkPreview
          return
      }
    }
  }

  get unEditedUrlPreview(): URLPreview | null | undefined {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      return cloneDeep(this._unEditedUrlPreview)
    }
  }

  set linkSettings(v: LinkSettings | undefined) {
    this._linkSettings = cloneDeep(v)
  }

  get linkSettings(): LinkSettings | undefined {
    return cloneDeep(this._linkSettings)
  }

  set campaignId(v: string | undefined) {
    this._campaignId = v
  }

  get campaignId(): string | undefined {
    return this._campaignId
  }

  set linkSettingsPresetId(v: number | undefined) {
    this._linkSettingsPresetId = v
  }

  get linkSettingsPresetId(): number | undefined {
    return this._linkSettingsPresetId
  }

  set attachments(v: Attachments | undefined) {
    this._attachments = v?.map((attachment: AttachmentObject) => {
      const newAttachment: AttachmentObject = attachment.clone()

      const isVideo = VideoAttachment.isVideoAttachment(newAttachment)
      if (isVideo) {
        const doesNetworkSupportCustomThumbnail = supportsCustomThumbnail(this.snType, this.postType)
        // The if below handles the case when video thumbnails were customized before
        // selecting any social profile. In this case attachments array gets set on each selected network.
        // We have to manually set customThumbnail to false for each network that doesn't support custom thumbnails
        if (!!newAttachment.userMetadata) {
          if (doesNetworkSupportCustomThumbnail) {
            newAttachment.userMetadata = attachment.userMetadata
          } else if (this.snType === SocialProfileConstants.SN_TYPES.INSTAGRAMBUSINESS) {
            newAttachment.userMetadata = {
              ...attachment.userMetadata,
              customThumbnail: !!attachment.thumbnailOffset,
            }
          } else {
            newAttachment.userMetadata = {
              ...attachment.userMetadata,
              customThumbnail: false,
            }
          }
        }

        // thumbnailOffset is null meaning that the thumbnail might have been uploaded on Initial content tab.
        // In this case thumbnailUrl has to be reset to default value for all networks that don't support thumbnail upload.
        if (!attachment.thumbnailOffset && !doesNetworkSupportCustomThumbnail) {
          newAttachment.thumbnailUrl = attachment.thumbnailUrls[0]?.thumbnailUrl || attachment?.thumbnailUrl
        }
      }

      if (newAttachment.productTags != null) {
        this.hasCatalogs = true
      }

      if (!this.hasCatalogs) {
        newAttachment.productTags = null
      }
      return newAttachment
    })
    return
  }

  get attachments(): Attachments | undefined {
    return this._attachments ? this._attachments.map(a => a.clone()) : undefined
  }

  set boards(v: Boards | undefined) {
    this._boards = v
    return
  }

  get boards(): Boards | undefined {
    return this._boards
  }

  set albumName(v: string | undefined) {
    if (ComposerUtils.hasFacebookNetwork(this.snType)) {
      this._albumName = v
    }
  }

  get albumName(): string | undefined {
    return this._albumName
  }

  set albumType(v: string | undefined) {
    if (ComposerUtils.hasFacebookNetwork(this.snType)) {
      this._albumType = v
    }
  }

  get albumType(): string | undefined {
    return this._albumType
  }

  set hootPostId(v: string | undefined) {
    this._hootPostId = v
  }

  get hootPostId(): string | undefined {
    return this._hootPostId
  }

  set publishingMode(v: PublishingMode | undefined) {
    if (ComposerUtils.hasInstagramNetwork(this.snType)) {
      this._publishingMode = v
    }
  }

  get publishingMode(): PublishingMode | undefined {
    return this._publishingMode
  }

  set postType(v: PostType | undefined) {
    if (ComposerUtils.hasInstagramNetwork(this.snType)) {
      this._postType = v
    }
  }

  get postType(): PostType | undefined {
    return this._postType
  }

  set publisherNotes(v: string | undefined) {
    if (ComposerUtils.hasInstagramNetwork(this.snType)) {
      this._publisherNotes = v
    }
  }

  get publisherNotes(): string | undefined {
    return this._publisherNotes
  }

  set extendedInfo(v: ExtendedInfo) {
    if (v === null || v === undefined || typeof v !== 'object') {
      this._extendedInfo = {}
    } else {
      const currentExtendedInfo = this._extendedInfo || {}
      const newExtendedInfo = cloneDeep(v)
      const mergedExtendedInfo = Object.assign(currentExtendedInfo, newExtendedInfo)

      if (this.snType === PINTEREST) {
        if (v.boards) {
          // only store the boards associated with this message
          mergedExtendedInfo.boards = v.boards.filter(b => `${b.socialNetworkId}` === `${this.snId}`)
        }
      }

      this._extendedInfo = deepClean(mergedExtendedInfo)
    }
  }

  get extendedInfo(): ExtendedInfo {
    return cloneDeep(this._extendedInfo)
  }

  set sendDate(v: number | undefined) {
    this._sendDate = v
  }

  get sendDate(): number | undefined {
    return this._sendDate
  }

  set source(v: Source | undefined) {
    this._source = v
  }

  get source(): Source | undefined {
    return this._source
  }

  set mentions(v: Mentions) {
    if (isFeatureEnabled('PUB_29580_LINKEDIN_PERSONAL_MENTION_BUG')) {
      /* LinkedIn mentions support is defined as:
       * selectedNetwork === LINKEDINCOMPANY -> user can mention LINKEDINCOMPANY or LINKEDIN (PERSONAL ACCOUNT)
       * selectedNetwork === LINKEDIN -> user can mention LINKEDINCOMPANY only
       */
      if (this.snType === LINKEDIN) {
        this._mentions = v.map(m => (m.snType === LINKEDINCOMPANY ? cloneDeep(m) : null)).filter(m => m)
      } else if (this.snType === LINKEDINCOMPANY) {
        this._mentions = v
          .map(m => (m.snType === LINKEDIN || m.snType === LINKEDINCOMPANY ? cloneDeep(m) : null))
          .filter(m => m)
      } else {
        this._mentions = v.map(m => (this.snType === m.snType ? cloneDeep(m) : null)).filter(m => m)
      }
    } else {
      // LinkedIn profiles are an exceptional case for mentions- where the mention snType does not match the message snType
      // We allow LinkedIn profiles to use LINKEDINCOMPANY mentions, so we check for mentions of that type instead and add them to the inner message
      if (this.snType === LINKEDIN) {
        this._mentions = v.map(m => (m.snType === LINKEDINCOMPANY ? cloneDeep(m) : null)).filter(m => m)
      } else {
        this._mentions = v.map(m => (this.snType === m.snType ? cloneDeep(m) : null)).filter(m => m)
      }
    }
  }

  get mentions(): Mentions {
    return cloneDeep(this._mentions)
  }

  set boostCampaign(v: AdPromotionCreateBoostCampaignRequest) {
    if (!v) {
      this._boostCampaign = null
    } else if (this.snId?.toString() === v.social_profile_id) {
      this._boostCampaign = cloneDeep(v)
    }
  }

  get boostCampaign(): AdPromotionCreateBoostCampaignRequest {
    return cloneDeep(this._boostCampaign)
  }

  set savedBoostCampaign(v: AdPromotionCreateBoostCampaignRequest) {
    if (!v) {
      this._savedBoostCampaign = null
    } else if (this.snId?.toString() === v.social_profile_id) {
      this._savedBoostCampaign = cloneDeep(v)
    }
  }

  get savedBoostCampaign(): AdPromotionCreateBoostCampaignRequest {
    return cloneDeep(this._savedBoostCampaign)
  }

  set tags(v: Tags) {
    this._tags = cloneDeep(v)
  }

  get tags(): Tags {
    return cloneDeep(this._tags)
  }

  set targeting(v: Targeting) {
    this._targeting = cloneDeep(v)
  }

  get targeting(): Targeting {
    return cloneDeep(this._targeting)
  }

  set location(v: Location | undefined) {
    this._location = cloneDeep(v)
  }

  get location(): Location | undefined {
    return cloneDeep(this._location)
  }

  set isAutoScheduled(v: boolean) {
    this._isAutoScheduled = v
  }

  get isAutoScheduled(): boolean {
    return cloneDeep(this._isAutoScheduled)
  }

  set errors(v: Errors) {
    this._errors = cloneDeep(v)
  }

  get errors(): Errors {
    return cloneDeep(this._errors)
  }

  set fieldValidations(v: FieldValidations) {
    this._fieldValidations = cloneDeep(v)
  }

  get fieldValidations(): FieldValidations {
    return cloneDeep(this._fieldValidations)
  }

  set warnings(v: Errors) {
    this._warnings = cloneDeep(v)
  }

  get warnings(): Errors {
    return cloneDeep(this._warnings)
  }

  set isBoosted(v: boolean) {
    this._isBoosted = v
  }

  get isBoosted(): boolean {
    return cloneDeep(this._isBoosted)
  }

  set composeType(v: ComposeType) {
    this._composeType = v
  }

  set disableStitch(v: boolean) {
    if (ComposerUtils.hasTikTokNetwork(this.snType)) {
      this._disableStitch = v
    }
  }

  get disableStitch(): boolean {
    return cloneDeep(this._disableStitch)
  }

  set disableComment(v: boolean) {
    if (ComposerUtils.hasTikTokNetwork(this.snType)) {
      this._disableComment = v
    }
  }

  get disableComment(): boolean {
    return cloneDeep(this._disableComment)
  }

  set disableDuet(v: boolean) {
    if (ComposerUtils.hasTikTokNetwork(this.snType)) {
      this._disableDuet = v
    }
  }

  get disableDuet(): boolean {
    return cloneDeep(this._disableDuet)
  }

  set hasCatalogs(v: boolean) {
    this._hasCatalogs = v
  }

  get oneTimeReviewerId(): number | undefined {
    return this._oneTimeReviewerId || undefined
  }

  set oneTimeReviewerId(v: number | undefined) {
    this._oneTimeReviewerId = v
  }

  get template(): string {
    return this._template || ''
  }

  set template(v: string) {
    this._template = v
  }

  get hasCatalogs(): boolean {
    return this._hasCatalogs || false
  }

  set isVerifiedFbPage(v: boolean) {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      this._isVerifiedFbPage = v
    }
  }

  get isVerifiedFbPage(): boolean {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      return this._isVerifiedFbPage
    }
  }

  /**
   * @returns The message text or an empty string if undefined
   */
  renderMessageText(): string {
    return this._template
      ? MessageUtils.buildMessageFromTemplate(this._template, this._linkSettings, this._mentions).messageText
      : ''
  }

  getPublicUrlForHashtag(hashtag: string) {
    switch (this.snType) {
      case TWITTER:
        return `https://twitter.com/hashtag/${encodeURIComponent(hashtag.slice(1))}/`
      case INSTAGRAM:
      case INSTAGRAMBUSINESS:
        return `https://www.instagram.com/explore/tags/${encodeURIComponent(hashtag.slice(1))}/`
      case FACEBOOK:
      case FACEBOOKGROUP:
      case FACEBOOKPAGE:
        return `https://www.facebook.com/hashtag/${encodeURIComponent(hashtag.slice(1))}`
      case LINKEDIN:
      case LINKEDINCOMPANY:
        return `https://www.linkedin.com/feed/hashtag/?keywords=${encodeURIComponent(hashtag)}`
      default:
        return ''
    }
  }

  getHashtagRegex(): RegExp {
    switch (this.snType) {
      default:
        // allows many potentially poor hashtags, but lets the user determine validity instead of us trying to
        return highToleranceHashtagRegex
    }
  }

  getHashtags(): Array<string> {
    const regex = this.getHashtagRegex()
    const getRemainingHashtags = (remainingText = '', hashtags = [], lengthSlicedSoFar = 0) => {
      const match = regex.exec(remainingText)
      if (!match) return hashtags

      const hashtag = {
        offset: lengthSlicedSoFar + match.index,
        text: match[0],
        publicUrl: this.getPublicUrlForHashtag(match[0]),
      }
      const numCharactersProcessed = match.index + hashtag.text.length

      return getRemainingHashtags(
        remainingText.slice(numCharactersProcessed),
        hashtags.concat([hashtag]),
        lengthSlicedSoFar + numCharactersProcessed,
      )
    }

    return getRemainingHashtags(this.renderMessageText())
  }

  getSelectedThumbnailUrl(linkPreview?: URLPreview | null) {
    linkPreview = typeof linkPreview === 'object' ? linkPreview : this.linkPreview // allow the message to select thumbails from external linkPreviews, such as from the wrapper

    if (!linkPreview) {
      return undefined
    }

    // There might just be the default thumbnailUrl, so start with that
    let thumbnailUrl = linkPreview.thumbnailUrl

    // If we allow selecting from multiple thumbnails, then linkPreview.thumbnailUrl will be equal to one of the available thumbnailUrls
    // We want to search for it and use the orginalUrl if avaialble; otherwise we'll fall back to the thumbnailUrl
    if (thumbnailUrl && Array.isArray(linkPreview.thumbnailUrls)) {
      const selectedThumbnailUrlObj = linkPreview.thumbnailUrls.find(o => o.thumbnailUrl === thumbnailUrl)
      if (selectedThumbnailUrlObj && selectedThumbnailUrlObj.originalUrl) {
        thumbnailUrl = selectedThumbnailUrlObj.originalUrl
      }
    }

    return thumbnailUrl
  }

  getBoardsFromAttachments() {
    let boards
    if (this.boards?.length > 0) {
      boards = this.boards
    } else {
      if (this.attachments) {
        boards = this.attachments.map(attachment => attachment.toBoardObject({ attachment }))
      }
    }
    return boards
  }

  /**
   * Converts this InnerMessage into an array of messages for MPS. It's an array because some networks (like PINTEREST),
   * have multiple messages per social profile (multiple boards per profile for pinterest).
   * @param {number} id the message id
   * @param {string} memberEmail STATEFARM: uses this to always use it for custom link url params
   * @param {int} stateFarmContentSourceId STATEFARM: uses this to track the content source for custom link url params
   * @param {boolean} isStateFarm STATEFARM: if the user is in a Statefarm org
   * @returns {Object[]|Object} The array of json object that can be sent to MPS; multiple arrays from different Inner Messages can be merged.
   *                            If an id is given, a json object is returned
   */
  toMPSRequest({ id, memberEmail = '', stateFarmContentSourceId = -1, isStateFarm = false }) {
    const hasLinkSettings = _.some(this.linkSettings, link => {
      if (isFeatureEnabled('PUB_12938_STATE_FARM_NC_URL_PARAMS') && isStateFarm) {
        return !_.isUndefined(link)
      }
      return (
        link.id ||
        link.linkShortenerId !== Constants.LINK_SHORTENER.NONE ||
        link.linkTracker.type !== Constants.LINK_TRACKER.NONE ||
        link.linkTracker.trackingParameters !== null
      )
    })
    let mpsLinkSettings =
      hasLinkSettings && this.linkSettings
        ? this.linkSettings.map(linkSetting => {
            if (isFeatureEnabled('PUB_12938_STATE_FARM_NC_URL_PARAMS') && isStateFarm) {
              linkSetting.memberEmailAddress = memberEmail
              linkSetting.linkShortenerId = parseInt(
                getFeatureValue('PUB_12938_STATE_FARM_FORCED_VANITY_URL_ID_NC'),
                10,
              )
              if (stateFarmContentSourceId >= 0) {
                linkSetting.contentLibraryTemplateId = stateFarmContentSourceId
              }
            }
            return linkSetting
          })
        : undefined

    const messageFromTemplate = MessageUtils.buildMessageFromTemplate(
      this.template,
      mpsLinkSettings,
      this.mentions,
      true,
    )
    const mpsText: string = messageFromTemplate.messageText
    const mpsMentions: Mentions = messageFromTemplate.mentions

    // Need to sanitize linkSettings before sending to MPS
    mpsLinkSettings = messageFromTemplate.linkSettings.map(linkSetting => {
      return removeUndefinedOrNull(
        LinkSettingsUtils.convertLinkSettingsToBackendFriendlyValues(cloneDeep(linkSetting)),
      ) as LinkSetting
    })

    let scheduledSendTime
    if (isFeatureEnabled('PUB_30636_INVALID_SCHEDULED_DATE')) {
      scheduledSendTime = getScheduledSendTimeString(this.sendDate)
    } else {
      if (typeof this.sendDate === 'number') {
        const sendDate = DateUtils.removeSecondsFromEpochTimestamp(this.sendDate)
        scheduledSendTime = new Date(sendDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS).toISOString()
      }
    }

    let mediaUrls
    if (this.attachments && this.attachments.length > 0) {
      mediaUrls = this.attachments.map(a => {
        const item = a.toRequestObject()
        if (!getIsAltTextSupported(this.snType, item.mimeType)) {
          delete item.altText
        }
        return item
      })
    }
    let albumName
    if (isFeatureEnabled('PUB_28990_DESELECT_ALBUM')) {
      albumName =
        this.albumName !== FacebookAlbumPickerConstants.STATIC_ALBUM_OPTIONS.FACEBOOK_NO_SELECTION
          ? this.albumName
          : undefined
    } else {
      albumName = this.albumName || undefined
    }

    let linkPreview: URLPreview
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const preview = cloneDeep(this.linkPreview)

      if (!isObject(preview) || isEmpty(preview)) {
        linkPreview = undefined
      } else {
        delete preview?.hasError
        delete preview?.hasWarning

        linkPreview = !isEmpty(preview)
          ? removeUndefinedOrNull({
              url: this.linkPreview.url || undefined,
              originalUrl: this.linkPreview.originalUrl || undefined,
              image: {
                src: this.getSelectedThumbnailUrl(),
              },
              title: this.linkPreview.title || undefined,
              description: this.linkPreview.description || undefined,
            })
          : undefined
      }
    } else {
      linkPreview = this.linkPreview
        ? removeUndefinedOrNull({
            url: this.linkPreview.url || undefined,
            originalUrl: this.linkPreview.originalUrl || undefined,
            image: {
              src: this.getSelectedThumbnailUrl(),
            },
            title: this.linkPreview.title || undefined,
            description: this.linkPreview.description || undefined,
          })
        : undefined
    }

    const mpsMessage = {
      text: mpsText,
      socialProfileId: parseInt(this.snId || '', 10), // an InnerMessage doesn't exist until it's created with an snId
      scheduledSendTime,
      source: this.source || undefined,
      albumName,
      tagIds: this.tags ? this.tags.map(tag => tag.id) : undefined,
      targeting: this.targeting || undefined,
      location: this.location || undefined,
      campaignId: this.campaignId || undefined,
      linkSettingsPresetId: this.linkSettingsPresetId || undefined,
      fbAttachment: linkPreview,
      mediaUrls: mediaUrls || undefined,
      hootPostId: this.hootPostId || undefined,
      linkSettings: mpsLinkSettings?.length ? mpsLinkSettings : undefined,
      mentions: mpsMentions || undefined,
      extendedInfo: this.extendedInfo || undefined,
      isAutoScheduled: this.isAutoScheduled || undefined,
      isBoosted: this.isBoosted || undefined,
      publishingMode: this.publishingMode ? { mode: this.publishingMode } : undefined,
      postType: this.postType ? { postType: this.postType } : undefined,
      publisherNotes: this.publisherNotes ? this.publisherNotes : undefined,
      privacy:
        this.snType == TIKTOKBUSINESS
          ? {
              tiktok: {
                disableStitch: this.disableStitch ?? false,
                disableComment: this.disableComment ?? false,
                disableDuet: this.disableDuet ?? false,
              },
            }
          : undefined,
      oneTimeReviewerId: this._oneTimeReviewerId || undefined,
    }

    if (this.snType === PINTEREST) {
      // Truncate all image attachments other than the first one.  See STRAT-997.
      this.truncateMediaAttachments(mpsMessage, 0, 1)
    }

    const useBoards = AttachmentUtils.shouldUseBoards(this.postType, this.publishingMode)

    if (useBoards) {
      const boards = this.getBoardsFromAttachments()
      // Ensure that the mpsText is available on each board as mobile uses this value to determine clipboard text
      mpsMessage.boards = boards.map(board => ({
        ...board,
        text: mpsText,
      }))

      // Set the mediaUrls to the empty array, since only one of boards or mediaUrls needs to be present
      mpsMessage.mediaUrls = []
    } else {
      mpsMessage.boards = undefined
    }

    // We don't show fbAttachment link previews if attachments (mediaUrls) are present
    if (mpsMessage.mediaUrls) {
      mpsMessage.fbAttachment = undefined
    }

    // Editing a Draft will have the draftId as the id which will need to be reset
    if (ComposerUtils.isDraft(mpsMessage.messageType)) {
      mpsMessage.id = 1
      id = null
    }
    // If the id is passed in that means the message is being edited.
    // Editing will only ever have 1 inner-message in the wrapper
    if (id) {
      // need to make sure the id is an integer for MPS
      if (typeof id !== 'number') {
        id = parseInt(id, 10)
      }
      mpsMessage.id = id
      if (this.snType === PINTEREST) {
        return removeEmpty(removeUndefinedOrNull(this.splitMessageRequest(mpsMessage)[0]))
      }
      return removeEmpty(removeUndefinedOrNull(mpsMessage))
    }

    const mpsMessages = this.splitMessageRequest(mpsMessage)
    return mpsMessages.map(removeUndefinedOrNull).map(removeEmpty)
  }

  truncateMediaAttachments(message, begin, end) {
    message.mediaUrls = message.mediaUrls ? message.mediaUrls.slice(begin, end) : message.mediaUrls
  }

  // Convert original message into 1 or more messages depending on whether the channel supports multiple posts per profile
  // Currently only Pinterest supports this
  // Works with any message type (MPS and PNP)
  splitMessageRequest(message) {
    switch (this.snType) {
      case PINTEREST: {
        return this.splitPinterestMessageIntoMultipleMessages(message)
      }
      default: {
        return [message]
      }
    }
  }

  splitPinterestMessageIntoMultipleMessages(message) {
    // if there are no boards, it means the profile wasn't selected and we shouldn't generate a message for it
    let messages: Array<InnerMessage> = []
    if (this.extendedInfo && Array.isArray(this.extendedInfo.boards)) {
      messages = this.extendedInfo.boards.map(board => {
        return Object.assign({}, message, {
          extendedInfo: {
            boardId: board.boardId,
            boardName: board.boardName,
            destinationUrl: this.extendedInfo.destinationUrl,
          },
        })
      })
    }
    return messages
  }

  /**
   * Converts this InnerMessage into an array of messages for PNP. It's an array because some networks (like PINTEREST),
   * have multiple messages per social profile (multiple boards per profile for pinterest).
   * @param {string} timezoneName https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   * @param {string} messageBoxText The text of the message exactly as the user composed it. PNP will render it
   * @param {string} memberEmail STATEFARM: uses this to always use it for custom link url params
   * @param {int} stateFarmContentSourceId STATEFARM: uses this to track the content source for custom link url params
   * @param {boolean} isStateFarm
   * @param {Object} urlPreview the urlPreview passed in from the baseMessage
   * @param {boolean} shouldSetDefaultPostType true if fetching Instagram previews for bulk composer
   * @returns {Object[]} The array of json object that can be sent to PNP; multiple arrays from different Inner Messages can be merged
   */
  toPNPRequest(
    timezoneName,
    memberEmail = '',
    stateFarmContentSourceId = -1,
    isStateFarm = false,
    urlPreview,
    shouldSetDefaultPostType,
  ) {
    let updatedFieldValidations = {}
    let template
    let previewLinkSettings = this.linkSettings
      ? this.linkSettings.map(linkSetting => {
          if (isFeatureEnabled('PUB_12938_STATE_FARM_NC_URL_PARAMS') && isStateFarm) {
            linkSetting.memberEmailAddress = memberEmail
            linkSetting.linkShortenerId = parseInt(
              getFeatureValue('PUB_12938_STATE_FARM_FORCED_VANITY_URL_ID_NC'),
              10,
            )
            if (stateFarmContentSourceId >= 0) {
              linkSetting.contentLibraryTemplateId = stateFarmContentSourceId
            }
          }
          return linkSetting
        })
      : undefined

    let linkPreview: URLPreview
    let thumbnailUrl: string
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      linkPreview = urlPreview
      thumbnailUrl = this.getSelectedThumbnailUrl(urlPreview)
    } else {
      linkPreview = this.linkPreview
      thumbnailUrl = this.getSelectedThumbnailUrl()
    }

    // Replace mention templates with displayText before sending template to PNP
    template = MessageUtils.mapTemplateToMessageWithMentions(this.template, this.mentions).message

    // Only send the matched Link Settings for each message to PNP
    previewLinkSettings = MessageUtils.mapTemplateToMessageWithLinks(
      template,
      previewLinkSettings,
    ).matchedLinkSettings

    // Replace linkSetting uuid in template with indexes 0->n
    template = MessageUtils.sanitizeTemplateAndLinkSettings(template, previewLinkSettings)
    previewLinkSettings = previewLinkSettings.map(linkSetting => {
      return removeUndefinedOrNull(
        LinkSettingsUtils.convertLinkSettingsToBackendFriendlyValues(cloneDeep(linkSetting)),
      )
    })

    if (previewLinkSettings?.find(linkSetting => LinkUtils.doesUrlHaveInvalidCharacters(linkSetting.url))) {
      updatedFieldValidations = ValidationUtils.addCustomValidations(
        this.fieldValidations,
        [InvalidURLErrorCode],
        FIELD_VALIDATIONS.TEMPLATE,
        ComposerConstants.ERROR_LEVELS.ERRORS,
      )
    }

    let sendDate
    if (typeof this.sendDate === 'number') {
      sendDate = this.sendDate
    }

    let publishingMode
    let postType
    if (shouldSetDefaultPostType) {
      publishingMode = Constants.INSTAGRAM_PUBLISHING_MODE_DEFAULT
      postType = Constants.INSTAGRAM_POST_TYPE_DEFAULT
    } else {
      publishingMode = this.publishingMode ? { mode: this.publishingMode } : undefined
      postType = this.postType ? { postType: this.postType } : undefined
    }

    const previewMessage = {
      template,
      socialProfileId: parseInt(this.snId || '', 10),
      sendDate,
      linkPreview:
        this.supportsLinkPreview() && linkPreview
          ? removeUndefinedOrNull({
              url: linkPreview.url || undefined,
              originalUrl: linkPreview.originalUrl || undefined,
              thumbnailUrl,
              title: linkPreview.title || undefined,
              description: linkPreview.description || undefined,
            })
          : undefined,
      attachments: this.attachments ? this.attachments.map(a => a.toRequestObject()) : undefined,
      hootPostId: this.hootPostId || undefined,
      linkSettings: previewLinkSettings?.length ? previewLinkSettings : undefined,
      extendedInfo: this.extendedInfo || undefined,
      place: this.convertLocationToPNPPlace(this.location || null),
      publishingMode,
      postType,
      fieldValidations: updatedFieldValidations ? { ...updatedFieldValidations } : undefined,
    }

    const previewMessages = this.splitMessageRequest(previewMessage)

    previewMessages.forEach(pnpMessage => {
      if (urlPreview && this.snType === SocialProfileConstants.SN_TYPES.TWITTER) {
        // Twitter doesn't support link previews, but it will do it's own scrape and link preview
        // Currently authoring doesn't do this scrape to verify, which means we need to send a sample scrape from the front end
        // Thus, for all twitter networks, if there is a urlPreview in the base message, send it to pnp so that it looks like pnp is actually scraping
        pnpMessage.linkPreview = removeUndefinedOrNull({
          url: urlPreview.url || undefined,
          originalUrl: urlPreview.originalUrl || undefined,
          thumbnailUrl: this.getSelectedThumbnailUrl(urlPreview), // sharedUrlPreview / sharedBoards
          title: urlPreview.title || undefined,
          description: urlPreview.description || undefined,
        })
      }

      const useBoards = AttachmentUtils.shouldUseBoards(pnpMessage.postType?.postType, this.publishingMode)

      if (useBoards) {
        const boards = this.getBoardsFromAttachments()
        pnpMessage.boards = boards || undefined
        delete pnpMessage.attachments
      }
    })

    return previewMessages.map(removeUndefinedOrNull).map(removeEmpty)
  }

  /**
   * Updates the message boost information into json that matches the api of Boost's Ad Promotion Service
   * @param {Object} publishedMessage Published message data (includes message id and external message id)
   * @returns {Object}
   */
  toBoostRequest(publishedMessage) {
    return makeToBoostRequest({
      boostCampaign: this.boostCampaign,
      savedBoostCampaign: this.savedBoostCampaign,
      attachmentsLength: this.attachments?.length,
    })(publishedMessage)
  }

  convertLocationToPNPPlace(location: Location | null): PNPPlace | undefined {
    if (
      location !== null &&
      typeof location === 'object' &&
      typeof location.placeId === 'string' &&
      typeof location.placeName === 'string'
    ) {
      return { id: location.placeId, name: location.placeName }
    } else {
      return undefined
    }
  }

  supportsLinkPreview(): boolean {
    return SocialProfileConstants.NON_LINK_PREVIEW_NETWORKS.filter(t => t === this.snType).length === 0
  }

  /**
   * Resets message field to either default value or a corresponding base message field value.
   * Handles the case where the same field is named differently on inner and base message,
   * e.g., linkPreview field on inner message is the same as urlPreview on the base message.
   * @param baseMessage
   * @param field A message field to reset
   */
  resetField(baseMessage: BaseMessage, field: string) {
    switch (field) {
      case 'linkPreview':
        this[field] = baseMessage.urlPreview
        break
      case 'unEditedUrlPreview':
        this[field] = baseMessage.unEditedUrlPreview
        break
      default:
        this[field] = INNER_MESSAGE_DEFAULTS[field]
    }
  }
}
