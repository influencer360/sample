import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom'
import loadable from '@loadable/component'

import merge from 'deepmerge'
import {
  cloneDeep,
  debounce,
  filter,
  get,
  isEmpty,
  isEqual,
  isNil,
  includes,
  map,
  compact,
  clone,
  without,
  values,
  find,
  isNull,
  union,
  forEach,
  omit,
  over,
  isUndefined,
} from 'lodash'

import moment from 'moment-timezone'
import { connect as reduxConnect } from 'react-redux'
import _ from 'underscore'

import axios from 'fe-axios'
import { TYPE_WARNING } from 'fe-comp-banner'
import { P } from 'fe-comp-dom-elements'
import { DraftJSGlobalStyle } from 'fe-draft-js'
import { DraftJSMentionGlobalStyle } from 'fe-draft-js-mention-plugin'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { add as addCallout } from 'fe-lib-async-callouts'
import { AUTO_SCHEDULE_MESSAGE, LINK_SETTINGS_ADVANCED, SCHEDULE_MESSAGES } from 'fe-lib-entitlements'
import { emit, on, off } from 'fe-lib-hootbus'
import { logError, logInfo } from 'fe-lib-logging'
import { LongtaskObserver } from 'fe-lib-longtask-observer'
import { updatePendoVisitorMetadata } from 'fe-lib-pendo'
import { recordTiming } from 'fe-lib-recording'
import { uuid } from 'fe-lib-uuid'
import { targetActions as liTargetActions } from 'fe-pnc-comp-audience-targeting'
import { ComposerModal, Panel, store as composerModalStore } from 'fe-pnc-comp-composer-modal'
import { showConfirmationModal } from 'fe-pnc-comp-confirmation-modal'
import { targetActions as fbTargetActions } from 'fe-pnc-comp-facebook-targeting'
import { TwitterLocationActions } from 'fe-pnc-comp-location-area'
import { OrgSuspendedBanner } from 'fe-pnc-comp-org-suspended-banner'
import { showSecureProfileModal } from 'fe-pnc-comp-secure-profile-modal'
import { renderSuspendContextConfirmationModal } from 'fe-pnc-comp-suspend-context-confirmation-modal'
import { AttachmentConstants } from 'fe-pnc-constants'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'

// IMPORTANT this should only be used to connect the store or in the single spot in receivePreviewData to fix a data consistency assumption
import {
  actions as composerMessageActions,
  getMessages,
  getSelectedMessage,
  getSelectedMessageValue,
  getState as getComposerMessageState,
  ImageAttachment,
  observeSelectedMessage,
  store as composerMessageStore,
  VideoAttachment,
} from 'fe-pnc-data-composer-message'
import type { AttachmentData, AttachmentObject, VideoAttachmentData } from 'fe-pnc-data-composer-message'
import { actions as mediaLibraryActions, store as mediaLibraryStore } from 'fe-pnc-data-media-library'
import {
  createMessagePreviewsStore,
  actions as MessagePreviewsActions,
  getState as getMessagePreviewsState,
} from 'fe-pnc-data-message-previews'
import type {
  FieldValidation,
  Mentions,
  MessageValidationError,
  PreviewsState,
  SanitizedMessage,
} from 'fe-pnc-data-message-previews'
import {
  checkContent as checkPredictiveCompliance,
  isEnabled as getIsPredictiveComplianceEnabled,
  reset as resetPredictiveCompliance,
  store as complianceStore,
} from 'fe-pnc-data-predictive-compliance'
import {
  authoringCancelRequests,
  cancelPreviewRequest,
  dashboardCancelRequests,
  getMessageLimit,
  getPreview,
  getS3UrlFromExternalUrl,
  getS3UrlFromExternalVideoUrl,
  isPreviewFetchInProgress,
  mediaStreamingCancelRequests,
  toast as errorToast,
  uploadExternalVideoToS3,
} from 'fe-pnc-lib-api'
import { isFeatureEnabledOrBeta, isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import { usePrevious } from 'fe-pnc-lib-hooks'
import translation from 'fe-pnc-lib-hs-translation'
import { LinkSettingsUtils, DateUtils, NativePostId } from 'fe-pnc-lib-utils'
import { CUSTOM_ERRORS, FIELD_VALIDATIONS } from 'fe-pnc-validation-error-messages'

import MessagePreviewArea from '@/components/composer/message-preview-area'
import TrackValidationErrors from '@/components/tracking/track-validation-errors'
import ComposerConstants from '@/constants/composer'
import Constants from '@/constants/constants'
import { FEATURE_UNLIMITED } from '@/constants/entitlements'
import { CONTENT_LIBRARY_EVENTS } from '@/constants/events'
import FacebookAlbumPickerConstants from '@/constants/facebook-album-picker'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import MessageConstants from '@/constants/message'
import { IGNORED_PREVIEW_WARNINGS } from '@/constants/preview-validation-messages'
import TrackingConstants from '@/constants/tracking'
import { cleanupKeyboardShortcuts, setupKeyboardShortcuts } from '@/keyboard-shortcuts/keyboard-shortcuts'
import InnerMessage from '@/models/inner-message'
import Message from '@/models/message'
import { composerActions, INITIAL_UPLOADING_FILES_STATE } from '@/redux/reducers/composer'
import { validationActions } from '@/redux/reducers/validation'
import { AppDispatch, RootState } from '@/redux/store'
import { ScheduleTime, ComposerState as ComposerStateType, UploadingFile } from '@/typings/Constants'
import { Entitlements, Flux, Preset } from '@/typings/Flux'
import {
  RecommendedTimesScheduledType,
  PreviewData,
  Attachments,
  URLPreview,
  FieldValidations,
  LinkSettings,
  TemplateData,
} from '@/typings/Message'
import { SocialNetwork, SocialNetworksKeyedByType } from '@/typings/SocialNetwork'
import AbortionError from '@/utils/abortion-error'
import AttachmentUtils from '@/utils/attachment-utils'
import ComposerDataFetcher, { savePublisherSetting } from '@/utils/composer-data-fetcher'
import { dateToUnixTimestamp, getSendDate } from '@/utils/composer-date-time-utils'
import ComposerPreviewUtils from '@/utils/composer-preview-utils'
import ComposerUtils from '@/utils/composer-utils'
import { EntitlementsUtils } from '@/utils/entitlement-utils'
import LinkUtils from '@/utils/link-utils'
import MessageUtils from '@/utils/message-utils'
import PredictiveComplianceUtils from '@/utils/predictive-compliance-utils'
import statusObject from '@/utils/status-bar'
import StatusToastUtils from '@/utils/status-toast-utils'
import { track } from '@/utils/tracking'

import ValidationUtils, { NoPinterestBoardError, NoProfilesError } from '@/utils/validation-utils'
import {
  reloadAllPinterestBoards,
  loadAllPinterestBoards,
  handleCreateBoardComplete,
} from '../../utils/pinterest-utils'
import AIPanel from '../ai-panel'
import ComposerPreviewsLoader from '../loader/composer-previews-loader'
import MediaLibrary from '../media-library'
import { DEFAULT_POST_TYPE } from '../message-edit/post-type-toggle/post-type-toggle'
import PendoScheduledBanner from './composer-banners/pendo-scheduled-banner'
import ComposerFooter from './composer-footer/composer-footer'
import { MessageDashboard } from './composer-panels/message-dashboard'
import HashtagSuggestionPanel from './composer-panels/message-edit-area/hashtag-suggestion-area'
import MessageEditArea from './composer-panels/message-edit-area/message-edit-area'

const MessageSelectionHeader = loadable(
  () =>
    import(
      /* webpackChunkName: "MessageSelectionHeader" */ './message-selection-header/message-selection-header'
    ),
)
createMessagePreviewsStore(ComposerConstants.MESSAGE_PREVIEWS_STORE_NAME)

let globalPreviewRequest: () => { fieldValidations: Array<FieldValidation> } = null
let _onUploadQueueComplete = null
let longtaskObserver = null
const noop = () => {}

let unsubscribeObservers: Array<() => any> = [noop]

const MEDIA_UPLOAD_IN_PROGRESS_TOAST_TITLE = translation._('Media upload in progress')
// prettier-ignore
// L10N: %s can be either of these two values: scheduling or publishing
const MEDIA_UPLOAD_IN_PROGRESS_TOAST_MESSAGE = translation._('Please wait until your media has finished uploading before %s your post')
const SCHEDULING = translation._('scheduling')
const PUBLISHING = translation._('publishing')
const DISCARD_MESSAGES = translation._('Delete selection?')
const DISCARD_MESSAGE = translation._('Delete post?')
// prettier-ignore
const CONFIRM_DISCARD_MESSAGES = translation._("Your selected posts will be removed from the list and won't be scheduled.")
// prettier-ignore
const CONFIRM_DISCARD_MESSAGE = translation._("Your post will be removed from the list and won't be scheduled.")
const CANCEL = translation._('Cancel')
const DISCARD = translation._('Delete')
const INVALID_THUMBNAIL_PREVIEW_WARNING = 4112

interface ComposerProps {
  addProfile?: () => void
  autoScheduleSettings: Record<any, any>
  bulkComposerState?: {
    composerState: ComposerStateType
    selectedSocialNetworkIds: Array<number>
  }
  bulkScheduleMessages?: (messageIds: Array<number>) => Promise<Array<number>> | void
  checkPredictiveComplianceAndSend: boolean
  closeComposer?: () => void
  closeComposerConfirm?: () => void
  composerConf?: Record<any, any>
  createDraftOnClick?: () => void
  csrf: string
  customContext?: string
  dispatch: AppDispatch
  entitlements: Entitlements
  excludedNetworkTypes?: Array<any>
  expired?: Array<any>
  facadeApiUrl: string
  flux: Flux
  headerProp?: Record<any, any>
  ignoredPreviewValidationMessageCodes?: Array<string>
  canSendToAmplify: boolean
  isAutoScheduledEnabled?: boolean
  isEditMode?: boolean
  isOriginContentLab: boolean
  isSendingMessage: boolean
  isSequentialPostingInProgress: boolean
  isSocialProfileSelectorDisabled?: boolean
  isUploading: boolean
  isUsingLATM?: boolean
  language?: string
  linkShorteners?: Array<any>
  mediaLibraryPanelHeightProp?: number // the media library panel height is calculated dynamically based on the other panels but it can also be set
  mediaLibrarySelectedSourceKey?: string
  memberId: number
  memberInTrial: boolean
  memberSignupDate: string
  memberName?: string
  mode: keyof typeof ComposerConstants.MODE
  onClose: () => void
  onMinimizeProp?: () => void
  onSaveTemplate?: (templateData: any) => Promise<void>
  onSendToAmplify?: () => void
  organizations: Array<any>
  privateSocialProfiles: Array<unknown>
  postCompose?: () => void
  preCompose?: () => void
  previewDataFetchDebounceMilliseconds?: number
  renderDraftSharingWarning: (source: string) => void
  selectedOrganization: Record<any, any>
  sendMessage?: () => void
  shortenerConfigs?: Array<any>
  showAutoScheduleSettings?: () => void
  showOnboarding?: boolean
  showOnSubmitErrors: boolean
  socialNetworks: Array<SocialNetwork>
  socialProfilesKeyedByType: SocialNetworksKeyedByType
  state: keyof typeof ComposerConstants.STATE
  suggestedTags?: Array<any>
  tags?: Array<any>
  templateData?: TemplateData
  timezoneName: string
  trackingContext: typeof TrackingConstants.TRACKING_CONTEXT[keyof typeof TrackingConstants.TRACKING_CONTEXT]
  updateDraftOnClick?: (source: string) => void
  updateTotalScheduledMessages?: () => void
  uploadingFiles: Array<UploadingFile>
  zIndex?: number
  selectedMessageForEdit?: Message
  isMinimized?: boolean
  isMediaLibraryOpen: boolean
  isPredictiveComplianceEnabled: boolean
  predictiveComplianceStatus: boolean
  selectedMessageCount?: number
}

export const ComposerFunctional = ({
  addProfile = noop,
  autoScheduleSettings = {},
  bulkComposerState = undefined,
  bulkScheduleMessages = undefined,
  closeComposer = noop,
  closeComposerConfirm = noop,
  composerConf,
  createDraftOnClick = noop,
  csrf,
  customContext,
  dispatch = action => action,
  entitlements = {},
  excludedNetworkTypes,
  expired = undefined,
  facadeApiUrl,
  flux,
  headerProp,
  ignoredPreviewValidationMessageCodes = [],
  canSendToAmplify,
  isAutoScheduledEnabled = false,
  isEditMode = false,
  isOriginContentLab,
  isSendingMessage,
  isSequentialPostingInProgress,
  isSocialProfileSelectorDisabled = false,
  isUploading,
  isUsingLATM = false,
  language = 'en',
  linkShorteners,
  mediaLibraryPanelHeightProp = 0,
  memberId,
  memberInTrial,
  memberSignupDate,
  memberName,
  mode,
  onClose,
  onMinimizeProp = noop,
  onSaveTemplate,
  onSendToAmplify = noop,
  organizations,
  privateSocialProfiles,
  postCompose = noop,
  preCompose = noop,
  previewDataFetchDebounceMilliseconds = 500,
  renderDraftSharingWarning = noop,
  selectedOrganization,
  sendMessage,
  shortenerConfigs,
  showAutoScheduleSettings = noop,
  showOnboarding = false,
  showOnSubmitErrors,
  socialNetworks = [],
  socialProfilesKeyedByType,
  state,
  suggestedTags = [],
  tags,
  templateData = {},
  timezoneName,
  trackingContext,
  updateDraftOnClick = noop,
  updateTotalScheduledMessages = noop,
  uploadingFiles = [],
  zIndex,
  isMinimized,
  isMediaLibraryOpen,
  isPredictiveComplianceEnabled,
  predictiveComplianceStatus,
  selectedMessageCount,
  selectedMessageForEdit,
  checkPredictiveComplianceAndSend,
}: ComposerProps) => {
  const canSendNow = useMemo(() => {
    const isDraft = !!(selectedMessageForEdit && ComposerUtils.isDraft(selectedMessageForEdit.messageType))

    const isInSendNowEditState =
      selectedMessageForEdit &&
      (MessageUtils.isPendingState(selectedMessageForEdit.state) ||
        MessageUtils.isRejectedState(selectedMessageForEdit.state))

    return mode === ComposerConstants.MODE.COMPOSER && (!isEditMode || isInSendNowEditState || isDraft)
  }, [mode, isEditMode, selectedMessageForEdit])

  const [allMessagesSelected, setAllMessagesSelected] = useState(false)
  const [campaignId, setCampaignId] = useState(undefined)
  const [editMode, setEditMode] = useState(Constants.BULK_COMPOSER_EDIT_MODES.EDIT)
  const [isHashtagPanelOpen, setIsHashtagPanelOpen] = useState(false)
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)
  const [maxMessagesLoaded, setMaxMessagesLoaded] = useState(Constants.BULK_PAGE_SIZE)
  const [mediaLibraryPanelHeight, setMediaLibraryPanelHeight] = useState(mediaLibraryPanelHeightProp)
  const [mediaLibraryMinimizeState, setMediaLibraryMinimizeState] = useState(false)
  const [mediaUploadErrorTracked, setMediaUploadErrorTracked] = useState({})
  const [selectedMessageIds, setSelectedMessageIds] = useState([])
  const [selectedPublishTime, setSelectedPublishTime] = useState(
    canSendNow ? ComposerConstants.SCHEDULE_TIME.IMMEDIATE : ComposerConstants.SCHEDULE_TIME.SCHEDULE,
  )
  const [totalScheduledMessages, setTotalScheduledMessages] = useState(-1)
  const [unmountEditComponent, setUnmountEditComponent] = useState(false)
  const prevCampaignId = usePrevious(campaignId)

  const setSequentialPostingInProgress = (isSequentialPostingInProgress: boolean) =>
    dispatch(composerActions.setIsSequentialPostingInProgress(isSequentialPostingInProgress))

  const setUploadingFiles = (uploadingFiles: Array<UploadingFile>) =>
    dispatch(composerActions.setUploadingFiles(uploadingFiles))

  const updateProgressUploadingFile = (id: string, progress: number) =>
    dispatch(composerActions.updateProgressUploadingFile({ id, progress }))

  const setIsUploading = (isUploading: boolean) => dispatch(composerActions.setIsUploading(isUploading))

  const setIsSendingMessage = (isUploading: boolean) =>
    dispatch(composerActions.setIsSendingMessage(isUploading))

  const setCheckPredictiveComplianceAndSend = (checkPredictiveComplianceAndSend: boolean) =>
    dispatch(composerActions.setCheckPredictiveComplianceAndSend(checkPredictiveComplianceAndSend))
  const setIsFetchingPinterestBoards = (isFetchingPinterestBoards: boolean) =>
    dispatch(composerActions.setIsFetchingPinterestBoards(isFetchingPinterestBoards))

  const setShowOnSubmitErrors = (showOnSubmitErrors: boolean) =>
    dispatch(validationActions.setShowOnSubmitErrors(showOnSubmitErrors))

  const saveAutoScheduleLastSelected = async (isAutoScheduled: boolean) => {
    dispatch(composerActions.setIsAutoScheduled(isAutoScheduled))
  }

  const onMinimize = () => {
    setMediaLibraryMinimizeState(isMediaLibraryOpen)
    mediaLibraryActions.setIsMediaLibraryOpen(false)
    onMinimizeProp()
  }

  const header = useMemo(() => {
    if (headerProp) {
      return React.cloneElement(headerProp, {
        key: 'composer-header',
        onMinimize: onMinimize,
      })
    }
  }, [headerProp])

  const boostCampaign = useMemo(() => selectedMessageForEdit?.getBoostCampaign(), [selectedMessageForEdit])
  const hasVideoInPreview = useMemo(
    () => selectedMessageForEdit?.hasVideoAttachment(),
    [selectedMessageForEdit],
  )

  const getSelectedMessageForEdit = (): Message => getSelectedMessage(getComposerMessageState())

  const getFlattenedSocialProfiles = () => {
    const socialProfiles = socialProfilesKeyedByType
    const flattenedSocialProfiles = []
    if (socialProfiles) {
      SocialProfileConstants.ACCEPTED_SN_TYPES.forEach(type => {
        if (socialProfiles[type]) {
          socialProfiles[type].forEach(profile => {
            flattenedSocialProfiles.push(profile)
          })
        }
      })
    }
    return flattenedSocialProfiles
  }

  /**
   * Function to check whether any of the the selected profile(s) are deauthed or not
   * @returns {*|Array}
   */
  const getSelectedDeauthedProfiles = () => {
    return ValidationUtils.areSelectedProfilesDeauthed({
      selectedNetworkIds: (selectedMessageForEdit && selectedMessageForEdit.socialNetworksKeyedById) || [],
      socialNetworks: getFlattenedSocialProfiles(),
      privateSocialProfiles: privateSocialProfiles,
    })
  }

  /**
   * Function to remove socialProfileId from list of deauthed profile id's on profile reauth success
   * @param {Array} deauthedProfilesSelected
   * @param {string} reauthedProfileId
   * @returns {*}
   */
  const removeRecentlyAuthedProfileFromError = (deauthedProfilesSelected, reauthedProfileId) => {
    return filter(deauthedProfilesSelected, deauthedProfileId => deauthedProfileId !== reauthedProfileId)
  }

  const onUpdateFieldValidations = (fieldValidations: FieldValidations) => {
    const selectedMessageForEdit = getSelectedMessageForEdit()
    const shouldUpdateFieldValidations =
      selectedMessageForEdit && !isEqual(fieldValidations, selectedMessageForEdit.fieldValidations)

    if (shouldUpdateFieldValidations) {
      composerMessageActions.updateFieldById(
        selectedMessageForEdit.id,
        Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS,
        fieldValidations,
      )
    }
  }

  /**
   * This function is triggered from the 'socialNetwork:reauthorize:success' hootbus event and is
   * called if the reauthorize event was successful.
   * @param {Object} profileReauthorized
   */
  const onProfileReauthSuccess = profileReauthorized => {
    const updatedFieldValidations = ValidationUtils.updateCustomDeauthedProfileErrors(
      selectedMessageForEdit.fieldValidations,
      ValidationUtils.createDeauthedProfileSelectedErrors({
        deauthedSocialProfiles: removeRecentlyAuthedProfileFromError(
          getSelectedDeauthedProfiles(),
          profileReauthorized.socialNetworkId,
        ),
        expiredSocialProfiles: expired,
        memberName: memberName,
      }),
      FIELD_VALIDATIONS.SOCIAL_NETWORK,
    )

    onUpdateFieldValidations(updatedFieldValidations)

    // Need the ComposerDataFetcher in order to refresh the social profile list after the social profile
    // was successfully reauthed. This will also refresh the cache.
    const composerDataFetcher = new ComposerDataFetcher(flux, facadeApiUrl, memberId)

    const fetchPromise = composerDataFetcher.fetchSocialProfiles(selectedOrganization)
    fetchPromise.catch(e => {
      if (!AbortionError.isAbortionError(e)) {
        logError(
          LOGGING_CATEGORIES.NEW_COMPOSER,
          'Unable to fetch social profiles after successful profile reauth.',
          {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          },
        )
      }
    })
  }
  const resetLocations = () => {
    TwitterLocationActions.reset()
  }

  /**
   * This function is triggered from the 'socialNetwork:addAccount:success' hootbus event and is
   * called if the add social profile event was successful.
   */
  const onAddAccount = () => {
    // Need the ComposerDataFetcher in order to refresh the social profile list after the social profile
    // was successfully added. This will also refresh the cache.
    const composerDataFetcher = new ComposerDataFetcher(flux, facadeApiUrl, memberId)

    const fetchPromise = composerDataFetcher.fetchSocialProfiles(selectedOrganization)
    fetchPromise.catch(e => {
      if (!AbortionError.isAbortionError(e)) {
        logError(
          LOGGING_CATEGORIES.NEW_COMPOSER,
          'Unable to fetch social profiles after successful add account.',
          {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          },
        )
      }
    })
  }

  /**
   * @param attachment The attachment data that comes back from the backend
   * @param isUploadRequired To identify whether or not an attachment needs to be uploaded
   * @param currentSource The ID of the source providing the attachment. Needed for sources with auth
   */
  const determineAttachments = (selectedNetworkGroup, attachments, isReplacement) => {
    if (selectedNetworkGroup) {
      return (
        MessageUtils.getInnerMessageFromGroup(
          getSelectedMessageValue(getComposerMessageState(), 'messages', false, []),
          selectedNetworkGroup,
        )?.attachments || []
      )
    }

    if (!isReplacement && Array.isArray(attachments)) {
      return clone(attachments)
    }

    return []
  }

  /**
   * Used internally in composer for adding attachments (that are already instances of attachment)
   * @param attachments
   * @param attachment
   * @private
   */
  const _addAttachmentToMessage = (attachments: Attachments, attachment: AttachmentObject) => {
    if (!ComposerUtils.shouldReplaceAttachments([...attachments, attachment])) {
      attachment.status = AttachmentConstants.STATUS.ATTACHED
    } else {
      attachment.status = AttachmentConstants.STATUS.PENDING
    }
    attachments.push(attachment)
    const fieldsToUpdate: { attachments: Attachments; urlPreview?: URLPreview | null } = { attachments }

    if (selectedMessageForEdit.urlPreview) {
      // A message cannot have attachments and url previews, so we remove it
      fieldsToUpdate.urlPreview = null
    }

    composerMessageActions.updateFieldsById(selectedMessageForEdit.id, fieldsToUpdate)
  }

  /**
   * Used internally in composer for removing uploading attachments
   * @param {Object} attachment
   * @private
   */
  const _removeUploadingAttachment = attachment => {
    const newUploadingFiles = without(clone(uploadingFiles), attachment)
    setUploadingFiles(newUploadingFiles.length ? newUploadingFiles : [])
  }

  const _updateProgress = (attachment: AttachmentData, progress: number) => {
    updateProgressUploadingFile(attachment.id, progress)
  }

  const handleMediaLibraryUploadComplete = () => {
    if (!isUploading && typeof _onUploadQueueComplete === 'function') {
      _onUploadQueueComplete()
      setUploadingFiles(INITIAL_UPLOADING_FILES_STATE)
    }
  }

  const _fileUploadEnded = (attachment: AttachmentData) => {
    _removeUploadingAttachment(attachment)
    if (!uploadingFiles.length) {
      setIsUploading(false)
      handleMediaLibraryUploadComplete()
    }
  }
  const _postAssetUpload = (
    attachment: AttachmentData,
    isReplacement: boolean,
    selectedMessageForEdit: Message,
    uploadedAttachmentData: AttachmentData,
  ): Attachments => {
    const attachmentsArray: Attachments = selectedMessageForEdit.selectedNetworkGroup
      ? MessageUtils.getAttachmentsBySelectedNetwork(
          selectedMessageForEdit.messages,
          selectedMessageForEdit.selectedNetworkGroup,
        )
      : selectedMessageForEdit.attachments

    const uploadedAttachment = ComposerUtils.createAttachmentFromData(uploadedAttachmentData)
    // here we get the attachments again since they may have changed
    const attachments = !isReplacement && Array.isArray(attachmentsArray) ? _.clone(attachmentsArray) : []
    // Populate alt text field if the attachment has one
    if (ImageAttachment.isImageAttachment(uploadedAttachment) && attachment.altText) {
      uploadedAttachment.altText = attachment.altText
    }
    _addAttachmentToMessage(attachments, uploadedAttachment)
    _fileUploadEnded(attachment)

    return attachments
  }

  const onAddAttachment = (
    attachment: AttachmentData,
    isUploadRequired: boolean,
    currentSource?: string | null,
  ) => {
    const addAttachment = () => {
      let attachments = []
      if (isFeatureEnabledOrBeta('PUB_30310_ERROR_WHEN_ATTACHING_VIDEOS')) {
        attachments = determineAttachments(
          selectedMessageForEdit.selectedNetworkGroup,
          selectedMessageForEdit.attachments,
          false,
        )
      } else {
        if (selectedMessageForEdit.selectedNetworkGroup) {
          attachments =
            MessageUtils.getInnerMessageFromGroup(
              getSelectedMessageValue(getComposerMessageState(), 'messages', false, []),
              selectedMessageForEdit.selectedNetworkGroup,
            )?.attachments || []
        } else {
          attachments = Array.isArray(selectedMessageForEdit.attachments)
            ? clone(selectedMessageForEdit.attachments)
            : []
        }
      }

      const mediaEvent = currentSource
        ? TrackingConstants.TRACKING_ACTION.ADD_MEDIA_FROM_LIBRARY
        : TrackingConstants.TRACKING_ACTION.ADD_MEDIA_FROM_COMPUTER
      if (isFeatureEnabled('PUB_30955_TRACK_COMPOSER_MEDIA_LIBRARY_ACTIONS')) {
        track(TrackingConstants.TRACKING_ORIGINS.MEDIA_LIBRARY, mediaEvent, {
          mediaAdded: true,
          mediaRemoved: false,
        })
      }

      if (isUploadRequired) {
        const originalId = attachment.id

        if (uploadingFiles.length >= ComposerConstants.MAX_URL_ATTACHMENT_QUEUE) {
          statusObject.update(translation._('Please wait for the uploading files to finish.'), 'error', true)
        } else {
          let maybeAppId: number | null = null
          if (currentSource !== null && currentSource !== 'freeImages' && currentSource !== '1') {
            maybeAppId = Number(currentSource)
          }
          setIsUploading(true)
          const id = uuid()
          attachment.id = id
          const attachmentObject = ComposerUtils.createAttachmentFromData(attachment)
          const isVideo = attachmentObject?.mimeType?.match('video/')
          if (isFeatureEnabledOrBeta('PUB_30836_MEDIA_LIBRARY_VIDEOS') && isVideo) {
            const videoAttachment = attachment as VideoAttachmentData
            const onProgress = (progress: number) => {
              _updateProgress(videoAttachment, progress)
            }
            uploadExternalVideoToS3(videoAttachment, onProgress)
              .then(uploadedAttachmentData => {
                // Use original filename if available
                uploadedAttachmentData = {
                  ...uploadedAttachmentData,
                  fileName: videoAttachment.fileName || uploadedAttachmentData.fileName,
                }
                attachments = _postAssetUpload(
                  videoAttachment,
                  false,
                  selectedMessageForEdit,
                  uploadedAttachmentData,
                )
              })
              .catch(e => {
                logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'An error occurred during media upload', {
                  errorMessage: JSON.stringify(e.message),
                  stack: JSON.stringify(e.stack),
                })

                statusObject.update(translation._('An error occurred while uploading media.'), 'error', true)
                _fileUploadEnded(videoAttachment)
              })
          } else {
            const uploadData = {
              id,
              appId: maybeAppId,
              url: attachment.url,
              mimeTypeHint: attachment.mimeType,
            }
            const uploadFunction = isVideo ? getS3UrlFromExternalVideoUrl : getS3UrlFromExternalUrl
            uploadFunction(uploadData)
              .then(data => {
                const { url, bytes, fileName, thumbnailUrl, mimeType, height, width, productTags } = data

                let uploadedAttachmentData = {
                  id: originalId,
                  url,
                  fileName: attachment.fileName ? attachment.fileName : fileName,
                  bytes,
                  fileSource: attachment.fileSource ?? null,
                  thumbnailUrl: thumbnailUrl ?? url,
                  mimeType,
                  height,
                  width,
                  externalProvider: attachment.externalProvider ?? null,
                  productTags,
                  trackingSource: attachment.trackingSource,
                } as AttachmentData

                if (currentSource !== null && currentSource !== 'freeImages' && currentSource !== '1') {
                  uploadedAttachmentData.appId = Number(currentSource)
                }

                if (VideoAttachment.isVideoAttachment(data)) {
                  const {
                    audioChannels,
                    audioCodec,
                    audioProfile,
                    audioSampleRate,
                    displayAspectRatio,
                    durationInSec,
                    frameRate,
                    videoBitrate,
                    videoCodec,
                  } = data
                  uploadedAttachmentData = {
                    ...uploadedAttachmentData,
                    audioChannels,
                    audioCodec,
                    audioProfile,
                    audioSampleRate,
                    displayAspectRatio,
                    durationInSec,
                    frameRate,
                    videoBitrate,
                    videoCodec,
                  } as VideoAttachmentData
                  return AttachmentUtils.extractVideoThumbnails(uploadedAttachmentData as VideoAttachmentData)
                } else {
                  return uploadedAttachmentData
                }
              })
              .then((uploadedAttachmentData: AttachmentData) => {
                attachments = _postAssetUpload(
                  attachment,
                  false,
                  selectedMessageForEdit,
                  uploadedAttachmentData,
                )
              })
              .catch(e => {
                if (!axios.isCancel(e)) {
                  logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'An error occurred during media upload', {
                    errorMessage: JSON.stringify(e.message),
                    stack: JSON.stringify(e.stack),
                  })

                  statusObject.update(
                    translation._('An error occurred while uploading media.'),
                    'error',
                    true,
                  )
                }
                _fileUploadEnded(attachment)
              })
          }
          setUploadingFiles([
            ...uploadingFiles,
            { ...attachment, uploadStartTime: Date.now(), upload: { progress: 0 } }, // Used to display progress bar
          ])
        }
      } else {
        if (VideoAttachment.isVideoAttachment(attachment)) {
          AttachmentUtils.extractVideoThumbnails(attachment as VideoAttachmentData)
            .then(data => {
              attachment = ComposerUtils.createAttachmentFromData(data)
              if (isFeatureEnabledOrBeta('PUB_30310_ERROR_WHEN_ATTACHING_VIDEOS')) {
                attachments = determineAttachments(
                  selectedMessageForEdit.selectedNetworkGroup,
                  selectedMessageForEdit.attachments,
                  false,
                )
              }
              _addAttachmentToMessage(attachments, attachment)
            })
            .catch(e => {
              logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'An error occurred during media upload', {
                errorMessage: JSON.stringify(e.message),
                stack: JSON.stringify(e.stack),
              })

              statusObject.update(translation._('An error occurred while uploading media.'), 'error', true)
            })
        } else {
          attachment = ComposerUtils.createAttachmentFromData(attachment)
          _addAttachmentToMessage(attachments, attachment)
        }
      }
    }

    if (!selectedMessageForEdit) {
      return
    }
    addAttachment()
  }

  /**
   * Handle files attached via the iFrame SDK attachFileToMessageV2 method
   * @param attachment Attachment data from iFrame SDK
   */
  const attachFileFromSDK = (attachment: AttachmentData) => {
    onAddAttachment(attachment, false, null)
  }

  useEffect(() => {
    on('socialNetwork:reauthorize:success', onProfileReauthSuccess)

    on('socialNetwork:addAccount:success', onAddAccount)

    on('composer.attachFile', attachFileFromSDK)

    if (isFeatureEnabled('PGR_1939_KEYBOARD_SHORTCUTS')) {
      setupKeyboardShortcuts()
    }

    return () => {
      if (isFeatureEnabled('PUB_13776_PREDICTIVE_COMPLIANCE')) {
        resetPredictiveCompliance()
      }

      if (isFeatureEnabled('PGR_1939_KEYBOARD_SHORTCUTS')) {
        cleanupKeyboardShortcuts()
      }
      mediaLibraryActions.reset()
      resetLocations()

      dashboardCancelRequests()
      mediaStreamingCancelRequests()
      authoringCancelRequests()

      setShowOnSubmitErrors(false)
      ValidationUtils.clearErrorsRendered()

      off('socialNetwork:reauthorize:success', onProfileReauthSuccess)
      off('socialNetwork:addAccount:success', onAddAccount)
      off('composer.attachFile', attachFileFromSDK)

      setTimeout(() => {
        if (uploadingFiles.length) {
          setUploadingFiles(INITIAL_UPLOADING_FILES_STATE)
          setIsUploading(false)
        }
      }, 0)
    }
  }, [])

  const _retrieveTotalScheduledMessages = () => {
    getMessageLimit({
      logging: {
        category: LOGGING_CATEGORIES.NEW_COMPOSER,
        message: 'Failed to get total number of scheduled messages',
      },
    })
      .then(data => {
        if (get(data, ['limit', 'pendingMessageCount'], false)) {
          setTotalScheduledMessages(data.limit.pendingMessageCount)
        }
      })
      .catch(e => {
        if (!axios.isCancel(e)) {
          statusObject.update(translation._('Could not get total number of scheduled posts'), 'error', true)
        }
      })
  }

  // For each social network selected (ie. each message in the Inner Message),
  // store its array of attachments, keeping track of which social network it belongs to.
  const getAttachmentsFromEachInnerMessage = (innerMessages = []) => {
    const innerMessageAttachments = {}
    innerMessages.forEach(msg => {
      innerMessageAttachments[msg.snId] = msg.attachments
    })
    return innerMessageAttachments
  }

  const clearPreviewRequest = () => {
    globalPreviewRequest = null
  }
  const receivePreviewData = async (data: PreviewData = {}) => {
    let selectedMessageForEdit = getSelectedMessageForEdit()
    const isComposerMode = mode === ComposerConstants.MODE.COMPOSER
    const isNativePost = NativePostId.fromContent(selectedMessageForEdit?.id) instanceof NativePostId
    let attachmentWarnings = [] as Array<MessageValidationError>
    let attachmentInfo = [] as Array<MessageValidationError>

    MessagePreviewsActions.setIsFetchingPreview(false)

    if (data.sanitizedMessages) {
      // Rasterize the message of each preview message, by converting the string message into an array of elements
      // text will become text nodes, and mentions, hashtags, links, etc will become react elements
      if (mode === ComposerConstants.MODE.COMPOSER) {
        await composerMessageActions.updateMessagesFromPreview(
          selectedMessageForEdit.id,
          data,
          ComposerUtils.createAttachmentFromData.bind(ComposerUtils),
        )

        // This is a hack to fix the assumption that selectedMessageForEdit gets updated immediately after updateMessagesFromPNP
        selectedMessageForEdit = getSelectedMessageForEdit()
        data.sanitizedMessages.forEach((msg, i) => {
          const innerMessage = selectedMessageForEdit.messages?.[i]
          const { mentions, messageText } = MessageUtils.buildMessageFromTemplate(
            innerMessage?.template,
            innerMessage?.linkSettings,
            innerMessage?.mentions,
            true,
          )
          msg.mentions = mentions
          msg.message = messageText
        })
      }

      data.sanitizedMessages.forEach(msg => (msg.timezoneName = timezoneName))

      if (isFeatureEnabled('PUB_30635_REMOVE_INVALID_THUMBNAIL_URL')) {
        // If we have a warning for invalid thumnail url, remove the thumnail url preview
        if (
          data?.sanitizedMessages?.find(message =>
            message?.warnings?.find(warning => warning.code === INVALID_THUMBNAIL_PREVIEW_WARNING),
          )
        ) {
          composerMessageActions.updateFieldById(
            selectedMessageForEdit.id,
            Constants.FIELD_TO_UPDATE.URL_PREVIEW,
            {
              ...selectedMessageForEdit.urlPreview,
              thumbnailUrl: null,
            },
          )
        }
      }

      // Appends custom FE warnings to each Preview message
      data.sanitizedMessages.forEach(msg => {
        if (ComposerUtils.shouldAddVideoPreviewCodecWarning(msg.attachments)) {
          const code = CUSTOM_ERRORS.FE_VIDEO_CODEC_PREVIEW_NOT_SUPPORTED
          ComposerUtils.appendCustomValidation(msg, code, Constants.FIELD_TO_UPDATE.ATTACHMENTS)

          if (!mediaUploadErrorTracked[code]) {
            track(
              'web.publisher.' + trackingContext + `${isEditMode ? '.edit_message' : '.create_message'}`,
              'upload_video_errors',
              { logDescription: code },
            )
            setMediaUploadErrorTracked({
              ...mediaUploadErrorTracked,
              [code]: true,
            })
          }
        }
        if (ComposerUtils.shouldAddVideoPreviewCodecInfo(msg.attachments)) {
          const code = CUSTOM_ERRORS.FE_VIDEO_CODEC_PREVIEW_INCONSISTENTLY_SUPPORTED
          ComposerUtils.appendCustomValidation(
            msg,
            code,
            Constants.FIELD_TO_UPDATE.ATTACHMENTS,
            ComposerConstants.ERROR_LEVELS.INFO,
          )
        }

        // Show 'info' banner for Instagram personal profiles
        if (msg.socialProfile.type === SocialProfileConstants.SN_TYPES.INSTAGRAM) {
          ComposerUtils.appendCustomValidation(
            msg,
            CUSTOM_ERRORS.INSTAGRAM_AVATAR_NOT_AVAILABLE,
            Constants.FIELD_TO_UPDATE.ATTACHMENTS,
            ComposerConstants.ERROR_LEVELS.INFO,
          )
        }

        // Show LI_IMAGE_ASPECT_RATIO 'warnings' as 'info' type
        if (msg.warnings?.some(warning => warning.code === IGNORED_PREVIEW_WARNINGS.LI_IMAGE_ASPECT_RATIO)) {
          ComposerUtils.appendCustomValidation(
            msg,
            IGNORED_PREVIEW_WARNINGS.LI_IMAGE_ASPECT_RATIO,
            Constants.FIELD_TO_UPDATE.ATTACHMENTS,
            ComposerConstants.ERROR_LEVELS.INFO,
          )
        }

        attachmentInfo = attachmentInfo.concat(
          ComposerUtils.getAttachmentValidations(msg, ComposerConstants.ERROR_LEVELS.INFO),
        )
        attachmentWarnings = attachmentWarnings.concat(
          ComposerUtils.getAttachmentValidations(msg, ComposerConstants.ERROR_LEVELS.WARNINGS),
        )
      })

      let previewMessages: Array<SanitizedMessage>
      if (mode === ComposerConstants.MODE.COMPOSER && !customContext) {
        previewMessages = [
          ComposerPreviewUtils.getGenericPreview(selectedMessageForEdit),
          ...data.sanitizedMessages,
        ]
      } else {
        previewMessages = data.sanitizedMessages
      }

      if (isNativePost && isComposerMode) {
        previewMessages = previewMessages.map(message => {
          if (message?.attachments?.length) {
            delete message['linkPreview']
          }

          return message
        })
      }

      MessagePreviewsActions.setIsFetchingPreview(false)
      MessagePreviewsActions.setPreviews(previewMessages)

      clearPreviewRequest()
    }

    let updatedFieldValidations = selectedMessageForEdit?.fieldValidations || {}
    if (data.fieldValidations) {
      // A preview is fetched so the user must have selected a social profile.
      // If that's the case, remove the "No social profiles selected" error
      updatedFieldValidations = ValidationUtils.removeErrors(selectedMessageForEdit.fieldValidations, [
        CUSTOM_ERRORS.FE_NO_PROFILES,
      ])
      if (ValidationUtils.hasAuthoringScheduleDateError(data.fieldValidations)) {
        updatedFieldValidations = ValidationUtils.removeCustomScheduleDateErrors(updatedFieldValidations)
      }
      const hasCustomErrors = ValidationUtils.hasCustomErrorsOrPostSendValidations(
        selectedMessageForEdit.fieldValidations,
      )
      // Remove all the non custom errors then add them back in to avoid duplicate errors
      updatedFieldValidations = ValidationUtils.removeNonCustomErrorsAndNonValidPostSendValidations(
        updatedFieldValidations,
        selectedMessageForEdit.socialNetworksKeyedById,
      )
      let formattedFieldValidations = ValidationUtils.formatAuthoringFieldValidations(data.fieldValidations)
      if (mode === ComposerConstants.MODE.BULK_COMPOSER) {
        formattedFieldValidations =
          ValidationUtils.convertTranscodeableInfosToErrors(formattedFieldValidations)
      }
      const mergedFieldValidations = merge(formattedFieldValidations, updatedFieldValidations)

      updatedFieldValidations = hasCustomErrors ? mergedFieldValidations : formattedFieldValidations
    } else if (!isEmpty(selectedMessageForEdit.fieldValidations)) {
      updatedFieldValidations = ValidationUtils.removeNonCustomErrorsAndNonValidPostSendValidations(
        selectedMessageForEdit.fieldValidations,
        selectedMessageForEdit.socialNetworksKeyedById,
      )
      // A preview is fetched so the user must have selected a social profile.
      // If that's the case, remove the "No social profiles selected" error
      updatedFieldValidations = ValidationUtils.removeErrors(updatedFieldValidations, [
        CUSTOM_ERRORS.FE_NO_PROFILES,
      ])
    }
    if (attachmentInfo?.length || attachmentWarnings?.length) {
      updatedFieldValidations = ValidationUtils.addCustomValidations(
        updatedFieldValidations,
        attachmentInfo,
        Constants.FIELD_TO_UPDATE.ATTACHMENTS,
        ComposerConstants.ERROR_LEVELS.INFO,
      )
      updatedFieldValidations = ValidationUtils.addCustomValidations(
        updatedFieldValidations,
        attachmentWarnings,
        Constants.FIELD_TO_UPDATE.ATTACHMENTS,
        ComposerConstants.ERROR_LEVELS.WARNINGS,
      )
    }

    onUpdateFieldValidations(updatedFieldValidations)

    return data
  }

  const receivePreviewError = (e?) => {
    if (e && !e.logged) {
      logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during receiving preview data', {
        errorMessage: JSON.stringify(e.message),
        stack: JSON.stringify(e.stack),
      })
    }
    if (e && e.response && e.response.status === 400) {
      logInfo(LOGGING_CATEGORIES.NEW_COMPOSER, 'Previews Bad Request Investigation', {
        errorMessage: JSON.stringify(e.message),
        responseData: JSON.stringify(e.response.data),
        requestData: e.response.config ? JSON.stringify(e.response.config.data) : undefined,
      })
    }

    MessagePreviewsActions.setIsFetchingPreview(false)

    clearPreviewRequest()
  }
  let fetchPreviewData = () => {
    const includeOrganizationInPreviewRequest = mode === ComposerConstants.MODE.COMPOSER

    // Remove Invalid URl validation before fetching previews
    const updatedFieldValidations = ValidationUtils.removeErrors(
      selectedMessageForEdit?.baseMessage?.fieldValidations,
      [CUSTOM_ERRORS.FE_INVALID_URL],
    )
    onUpdateFieldValidations(updatedFieldValidations)

    let organization
    if (includeOrganizationInPreviewRequest) {
      organization = selectedOrganization
    }

    MessagePreviewsActions.setIsFetchingPreview(true)

    if (!getSelectedMessageForEdit()) {
      receivePreviewError()
      return
    }

    // PNP validation for Instagram Stories accepts either a boards or an attachment field,
    // so will fail if the attachments field is not removed. Since the frontend still uses
    // attachments for preview logic, we cache them and add them back in after toPreviewRequest()
    // converts them to boards then deletes them.
    // This is so we don't have to duplicate all the attachments preview logic code.
    const cachedAttachments = getAttachmentsFromEachInnerMessage(getSelectedMessageForEdit().messages)
    const previewRequest = getSelectedMessageForEdit()?.toPreviewRequest(
      timezoneName,
      organization ? organization.organizationId : null,
      mode === ComposerConstants.MODE.BULK_COMPOSER,
    )

    if (organization) {
      Object.assign(previewRequest, {
        organizationId: organization.organizationId,
      })
    }

    // Do not fetch preview and update selectedMessageForEdit with FE error if selected message contains invalid url
    const invalidURLValidation = previewRequest?.messages?.find(message =>
      get(message, ['fieldValidations', 'errors', 'template'])?.find(
        error => error.code === CUSTOM_ERRORS.FE_INVALID_URL,
      ),
    )

    // Update validation
    if (invalidURLValidation) {
      onUpdateFieldValidations(invalidURLValidation.fieldValidations)
      clearPreviewRequest()
      MessagePreviewsActions.setIsFetchingPreview(false)
    } else {
      if (previewRequest) {
        globalPreviewRequest = getPreview(previewRequest)
          .then(data => {
            clearPreviewRequest()
            if (data) {
              if (data.sanitizedMessages) {
                const isInstagramStory =
                  selectedMessageForEdit?.postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY
                if (isInstagramStory) {
                  data.sanitizedMessages.forEach(msg => {
                    Object.assign(msg, {
                      attachments: cachedAttachments[msg.socialProfile.socialProfileId],
                    })
                  })
                }
              }
              return receivePreviewData(data)
            }
            addCallout(errorToast())
            MessagePreviewsActions.setIsFetchingPreview(false)

            return null
          })
          .catch(e => {
            if (!axios.isCancel(e)) {
              receivePreviewError(e)
            }
          })
      }
    }
  }

  if (previewDataFetchDebounceMilliseconds > 0) {
    fetchPreviewData = debounce(fetchPreviewData, previewDataFetchDebounceMilliseconds)
  }
  const uploadExternalMediaToS3 = ({ nativeMediaUrls, id }: Message) => {
    if (nativeMediaUrls.length) {
      const imageAttachments = nativeMediaUrls.filter(({ mimeType }) => mimeType?.match('image/'))
      const videoAttachments = nativeMediaUrls.filter(({ mimeType }) => mimeType?.match('video/'))

      const imagePromises = imageAttachments.map(({ url, mimeType }) => {
        return getS3UrlFromExternalUrl({
          id: uuid(),
          appId: null,
          url,
          mimeTypeHint: mimeType,
        })
      })

      const videoPromises = videoAttachments.map(({ url, mimeType }) => {
        return getS3UrlFromExternalVideoUrl({
          id: uuid(),
          url,
          mimeTypeHint: mimeType,
        })
      })

      setIsUploading(true)
      setUploadingFiles([...imagePromises, ...videoPromises])

      Promise.all([...imagePromises, ...videoPromises])
        .then(s3Attachments => {
          const attachments = s3Attachments.map(s3Attachment => {
            if (s3Attachment?.thumbnailUrls?.length && !s3Attachment?.thumbnailUrl?.length) {
              s3Attachment.thumbnailUrl = s3Attachment?.thumbnailUrls?.[0]?.thumbnailUrl
            }

            return ComposerUtils.createAttachmentFromData(s3Attachment)
          })

          return composerMessageActions.updateFieldsById(id, {
            attachments,
          })
        })
        .then(fetchPreviewData)
        .catch(error => {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'An error occurred during media upload', {
            errorMessage: JSON.stringify(error.message),
            stack: JSON.stringify(error.stack),
          })

          statusObject.update(translation._('An error occurred while uploading media.'), 'error', true)
        })
        .finally(() => {
          setIsUploading(false)
          setUploadingFiles(INITIAL_UPLOADING_FILES_STATE)
        })
    }
  }

  useEffect(() => {
    const selectedMessageForEdit = getSelectedMessageForEdit()
    const isComposerMode = mode === ComposerConstants.MODE.COMPOSER
    const isNativePost = NativePostId.fromContent(selectedMessageForEdit?.id) instanceof NativePostId

    if (isNativePost && isComposerMode) {
      uploadExternalMediaToS3(selectedMessageForEdit)
    }

    if (isComposerMode) {
      _retrieveTotalScheduledMessages()
      updateTotalScheduledMessages(_retrieveTotalScheduledMessages)
      fetchPreviewData()
    }
  }, [mode, selectedMessageForEdit?.id])
  // Remove any IG Push Publish errors if that selected social network is deselected or
  // or the composer mounts
  const updateInstagramPairingErrors = () => {
    if (selectedMessageForEdit) {
      composerMessageActions.updateInstagramPairingErrors([])
    }
  }

  const updateDeauthedProfileFieldValidations = () => {
    if (selectedMessageForEdit) {
      const deauthedProfilesSelected = getSelectedDeauthedProfiles()

      // Checking to see if the deauthed profile field validations even need to be updated first.
      const doDeauthedProfileFieldValidationsNeedUpdating =
        ValidationUtils.checkForCustomDeauthedProfileErrors(
          selectedMessageForEdit.fieldValidations,
          deauthedProfilesSelected,
          FIELD_VALIDATIONS.SOCIAL_NETWORK,
        )
      if (doDeauthedProfileFieldValidationsNeedUpdating) {
        const updatedFieldValidations = ValidationUtils.updateCustomDeauthedProfileErrors(
          selectedMessageForEdit.fieldValidations,
          ValidationUtils.createDeauthedProfileSelectedErrors({
            memberName: memberName,
            deauthedSocialProfiles: deauthedProfilesSelected,
            expiredSocialProfiles: expired,
          }),
          FIELD_VALIDATIONS.SOCIAL_NETWORK,
        )

        onUpdateFieldValidations(updatedFieldValidations)
      }
    }
  }

  /**
   * Update the generic preview from the base message
   * @param message
   */
  const updateGenericPreview = (message: Message) => {
    // update the preview store for the generic preview when no networks are selected
    if (message?.messages?.length === 0) {
      const genericPreview = ComposerPreviewUtils.getGenericPreview(message)
      MessagePreviewsActions.setPreviews([genericPreview])
      MessagePreviewsActions.setIsFetchingPreview(false)
    }
  }

  const onChangePreset = (selectedPreset: Preset) => {
    const selectedMessageForEdit = getSelectedMessageForEdit()

    const linkSettingsPresetId: number =
      selectedPreset === null ? null : flux.getStore('presets').getIdByName(selectedPreset.name)

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const linkSettings = LinkUtils.getLinkSettingsWithPresetApplied(
        selectedMessageForEdit,
        undefined,
        linkSettingsPresetId,
      )
      composerMessageActions.applyCampaignPresets(selectedMessageForEdit.id, {
        ...linkSettings,
      })
    } else {
      composerMessageActions.updateFieldById(
        selectedMessageForEdit.id,
        Constants.FIELD_TO_UPDATE.LINK_SETTINGS_PRESET_ID,
        linkSettingsPresetId,
      )
    }
  }

  useEffect(() => {
    if (selectedMessageForEdit) {
      if (selectedMessageForEdit.getSocialNetworkTypes().length) {
        if (!isPreviewFetchInProgress()) {
          // This is triggered when a message is initially opened from drafts/CL
          updateDeauthedProfileFieldValidations()
          updateInstagramPairingErrors()
          fetchPreviewData()
        }
      } else {
        updateGenericPreview(selectedMessageForEdit)
      }

      const presets: Array<Preset> = flux.getStore('presets').get() as Array<Preset>
      const messageText = selectedMessageForEdit.renderMessageText()
      const links: LinkSettings = LinkUtils.getAllLinkSettings(selectedMessageForEdit, messageText)

      if (mode !== ComposerConstants.MODE.BULK_COMPOSER && Array.isArray(links) && links.length > 0) {
        let linkSettings = links

        if (Array.isArray(presets)) {
          let initialPreset: Preset
          if (isEditMode || ComposerUtils.isAmplifyComposer(customContext)) {
            initialPreset = presets.find(preset => preset.id === selectedMessageForEdit.linkSettingsPresetId)
          } else if (!ComposerUtils.isDraft(selectedMessageForEdit.messageType)) {
            initialPreset = presets.find(preset => preset.isDefault)
          }
          if (initialPreset) {
            onChangePreset(initialPreset)
            linkSettings = LinkSettingsUtils.applyPreset(initialPreset, links)
          }
        }

        // Rebuild the template based on the updated linkSettings
        composerMessageActions.updateFieldsById(selectedMessageForEdit.id, {
          linkSettings,
          template: MessageUtils.buildTemplateFromMessage(
            messageText,
            linkSettings,
            selectedMessageForEdit.mentions,
          ),
        })
      }
    }

    ComposerUtils.deactivateFocusTrap()
  }, [])

  const onFetchSocialProfiles = () => {
    // Need the ComposerDataFetcher in order to refresh the social profile list after the social profile
    // was successfully added. This will also refresh the cache.
    const composerDataFetcher = new ComposerDataFetcher(flux, facadeApiUrl, memberId)

    const fetchPromise = composerDataFetcher.fetchSocialProfiles(selectedOrganization)
    fetchPromise.catch(e => {
      if (!AbortionError.isAbortionError(e)) {
        logError(
          LOGGING_CATEGORIES.NEW_COMPOSER,
          'Unable to fetch social profiles after successful add account.',
          {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          },
        )
      }
    })
  }

  const previousOrganization = usePrevious(selectedOrganization)

  const hasSelectedOrganizationChanged = !ComposerUtils.areOrganizationsEqual(
    previousOrganization,
    selectedOrganization,
  )
  useEffect(() => {
    reloadAllPinterestBoards(
      customContext,
      socialNetworks,
      selectedOrganization,
      statusObject,
      onFetchSocialProfiles,
      setIsFetchingPinterestBoards,
    )

    if (isFeatureEnabled('PUB_13776_PREDICTIVE_COMPLIANCE')) {
      if (selectedOrganization && selectedOrganization.organizationId) {
        getIsPredictiveComplianceEnabled(selectedOrganization.organizationId)
      }
    }
  }, [hasSelectedOrganizationChanged])

  const previousSocialNetworks = usePrevious(socialNetworks)

  useEffect(() => {
    if (previousSocialNetworks) {
      loadAllPinterestBoards(
        socialNetworks,
        selectedOrganization,
        statusObject,
        onFetchSocialProfiles,
        setIsFetchingPinterestBoards,
      )
    }
  }, [socialNetworks?.length])

  useEffect(() => {
    // Sets a default postType if an IG network is selected. Reset postType to null if there's no IG network
    const selectedMessageForEdit = getSelectedMessageForEdit()
    if (selectedMessageForEdit) {
      const socialNetworkTypes = selectedMessageForEdit.getSocialNetworkTypes()
      const storePostType = getSelectedMessageValue(getComposerMessageState(), 'postType', false, null)
      if (ComposerUtils.hasInstagramNetwork(...socialNetworkTypes) && !storePostType) {
        composerMessageActions.updateFieldById(selectedMessageForEdit.id, 'postType', DEFAULT_POST_TYPE)
      } else if (!ComposerUtils.hasInstagramNetwork(...socialNetworkTypes)) {
        composerMessageActions.updateFieldById(selectedMessageForEdit.id, 'postType', null)
      }
    }

    if (selectedMessageCount === 0) {
      onUpdateFieldValidations({})
    }
    // This is triggerd when a user adds or remove a social profile
    updateDeauthedProfileFieldValidations()
    updateInstagramPairingErrors()
  }, [selectedMessageCount])

  const getCampaignById = campaignId => {
    const campaigns = flux.getStore('campaigns').get()
    return campaigns.find(campaign => campaign.id === campaignId)
  }

  const getAmplifyExpireDate = message => {
    const amplifyExpireDate = message?.extendedInfo?.amplifyExpireDate
    return moment(amplifyExpireDate).isValid() ? amplifyExpireDate : null
  }
  const getDatesEnabledForScheduling = message => {
    // If message from Amplify we could have also an expire date and
    // the message cannot be scheduled after that date
    if (isFeatureEnabled('CFE_859_CHECK_EXPIRE_DATE')) {
      const amplifyExpireDate = getAmplifyExpireDate(message)
      if (amplifyExpireDate) {
        return {
          dateFrom: new Date(),
          dateTo: amplifyExpireDate,
        }
      }
    }

    const selectedCampaign = getCampaignById(message?.campaignId)
    if (selectedCampaign) {
      return {
        dateFrom: DateUtils.convertTimestampToDate(selectedCampaign.dateFrom),
        dateTo: DateUtils.convertTimestampToDate(selectedCampaign.dateTo),
      }
    }

    return null
  }

  useEffect(() => {
    if (!selectedMessageForEdit || mode !== ComposerConstants.MODE.COMPOSER) {
      return null
    }

    if (campaignId === null || isNil(selectedMessageForEdit.sendDate)) {
      return onUpdateFieldValidations(
        ValidationUtils.removeCustomScheduleDateErrors(selectedMessageForEdit.fieldValidations),
      )
    }

    const sendDate = moment(
      selectedMessageForEdit.sendDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS,
    ).tz(timezoneName)

    const campaignDateError = ValidationUtils.getCampaignDateError({
      dateTime: sendDate,
      enabledDays: getDatesEnabledForScheduling(selectedMessageForEdit),
      minimumScheduleMinutes: selectedMessageForEdit.hasVideoAttachment()
        ? ComposerConstants.MINIMUM_SCHEDULE_MINUTES.VIDEO
        : ComposerConstants.MINIMUM_SCHEDULE_MINUTES.DEFAULT,
      timezoneName: timezoneName,
    })
    if (campaignDateError) {
      const updatedFieldValidations = ValidationUtils.addCustomValidations(
        selectedMessageForEdit.fieldValidations,
        [campaignDateError],
        FIELD_VALIDATIONS.SEND_DATE,
        ComposerConstants.ERROR_LEVELS.ERRORS,
      )

      return onUpdateFieldValidations(updatedFieldValidations)
    }

    const updatedFieldValidations = ValidationUtils.removeCustomScheduleDateErrors(
      selectedMessageForEdit.fieldValidations,
    )
    onUpdateFieldValidations(updatedFieldValidations)
  }, [campaignId, mode, selectedMessageForEdit])

  const previousBoostCampaign = usePrevious(boostCampaign)

  useEffect(() => {
    let updatedFieldValidations: FieldValidations
    if (!!boostCampaign || !!selectedMessageForEdit?.getSavedBoostCampaign()) {
      const fieldValidations = selectedMessageForEdit.fieldValidations
      updatedFieldValidations = ValidationUtils.validateBoostCampaign(
        fieldValidations,
        boostCampaign || selectedMessageForEdit?.getSavedBoostCampaign(),
        {
          isVideoMessage: selectedMessageForEdit.hasVideoAttachment(),
          sendDate: selectedMessageForEdit.sendDate,
          ...(selectedMessageForEdit.attachments && {
            attachment: selectedMessageForEdit.attachments[0],
          }),
        },
      )
      onUpdateFieldValidations(updatedFieldValidations)
    }
  }, [selectedMessageForEdit?.sendDate, hasVideoInPreview, boostCampaign])

  useEffect(() => {
    if (!boostCampaign && previousBoostCampaign) {
      const fieldValidations = selectedMessageForEdit.fieldValidations
      const updatedFieldValidations = ValidationUtils.validateBoostCampaign(fieldValidations, undefined, {})
      onUpdateFieldValidations(updatedFieldValidations)
    }
  }, [boostCampaign])
  /**
   * Prepares the message for the next sequential post e.g. Post and Reuse accounts
   */
  const nextSequentialPost = () => {
    // Construct a new messages array with location data removed
    const newMessages = selectedMessageForEdit.messages.map((msg: InnerMessage) => {
      msg = msg.clone()
      msg.location = undefined
      msg.attachments = []
      msg.linkSettings = undefined
      msg.linkPreview = undefined
      msg.template = ''
      msg.mentions = []
      msg.disableComment = undefined
      msg.disableDuet = undefined
      msg.disableStitch = undefined
      return msg
    })

    const NEW_MESSAGE_ID = 1
    // create a new Message object with previous social networks
    composerMessageActions.set([
      new Message({
        id: NEW_MESSAGE_ID,
        source: MessageConstants.SOURCE.WEB,
        socialNetworksKeyedById: selectedMessageForEdit.socialNetworksKeyedById,
        messages: newMessages,
        postType: DEFAULT_POST_TYPE,
        publishingMode: selectedMessageForEdit.publishingMode,
        sendDate: selectedMessageForEdit.sendDate,
      }),
    ])

    // select new Message object above
    composerMessageActions.selectById(NEW_MESSAGE_ID)

    // update base message (Initial Content)
    const updates = {
      template: '',
      locations: {},
      targeting: {},
      linkSettings: null,
    }

    composerMessageActions.updateFieldsById(NEW_MESSAGE_ID, updates)

    // Clear out location and targeting component
    resetLocations()

    liTargetActions.reset()
    fbTargetActions.reset()
  }

  const previousIsSequentialPostingInProgress = usePrevious(isSequentialPostingInProgress)
  useEffect(() => {
    if (isSequentialPostingInProgress) {
      // Add setTimeout to make sure that all observers get the change event
      setTimeout(() => setSequentialPostingInProgress(false), 0)

      if (isSequentialPostingInProgress && !previousIsSequentialPostingInProgress) {
        nextSequentialPost()
      }
    }
  }, [isSequentialPostingInProgress])
  useEffect(() => {
    if (totalScheduledMessages !== -1) {
      const maxScheduledMessagesReached = totalScheduledMessages >= entitlements.SCHEDULE_MESSAGES
      updatePendoVisitorMetadata({
        data: { has_reached_max_scheduled_messages: maxScheduledMessagesReached },
      })
    }
  }, [totalScheduledMessages])
  const hasAlbumTargetingWarning = () => {
    if (selectedMessageForEdit) {
      const { albumType } = selectedMessageForEdit
      const isCustomAlbumSelected =
        albumType && !(albumType === FacebookAlbumPickerConstants.ALBUM_TYPES.WALL)

      return selectedMessageForEdit.hasFacebookTargeting() && isCustomAlbumSelected
    } else return false
  }

  const discardSelectedMessages = () => {
    const numSelectedMesssages = selectedMessageIds.length

    track('web.publisher.' + trackingContext + '.abort_discard_message', 'discard_messages', {
      numDiscarded: numSelectedMesssages,
    })

    const newSelectedMessageIds = selectedMessageIds.slice(0)
    forEach(selectedMessageIds, messageId => {
      composerMessageActions.removeById(messageId)
      newSelectedMessageIds.splice(newSelectedMessageIds.indexOf(messageId), 1)
    })
    if (numSelectedMesssages > 1) {
      statusObject.update(translation._('Posts discarded'), 'info', true)
    } else {
      statusObject.update(translation._('Post discarded'), 'info', true)
    }
    setSelectedMessageIds(newSelectedMessageIds)
  }

  const discardMessage = messageId => {
    track('web.publisher.' + trackingContext + '.abort_discard_message', 'discard_messages', {
      numDiscarded: 1,
    })

    const newSelectedMessageIds = selectedMessageIds.slice(0)
    newSelectedMessageIds.splice(newSelectedMessageIds.indexOf(messageId), 1)
    setSelectedMessageIds(newSelectedMessageIds)
    composerMessageActions.removeById(messageId)
  }

  const showMessageDiscardModal = (messageId, hasMessagesSelected) => {
    showConfirmationModal({
      titleText: hasMessagesSelected ? DISCARD_MESSAGES : DISCARD_MESSAGE,
      bodyText: <P>{hasMessagesSelected ? CONFIRM_DISCARD_MESSAGES : CONFIRM_DISCARD_MESSAGE}</P>,
      submitButtonText: DISCARD,
      cancelButtonText: CANCEL,
      onSubmit: close => {
        if (messageId) {
          discardMessage(messageId)
        } else {
          discardSelectedMessages()
        }
        close()
      },
    })
  }
  const onDiscardSelectedMessages = () => {
    if (selectedMessageIds.length) {
      showMessageDiscardModal(null, true)
    }
  }

  const onBulkScheduleMessages = (messageIds: Array<number>) => {
    const messages = getMessages(getComposerMessageState())
    const message = messages.find(m =>
      ComposerUtils.doesAtLeastOneSocialNetworkBelongToSuspendedOrg(
        m.socialNetworksKeyedById,
        selectedOrganization,
      ),
    )
    if (message) {
      renderSuspendContextConfirmationModal({
        hasMultipleMessages: messages.length > 1,
        isScheduled: ComposerUtils.isScheduled(message, entitlements),
        onSubmit: () => bulkScheduleMessages(messageIds),
        organization: selectedOrganization,
        timezoneName,
      })
      return null
    }

    setIsSendingMessage(true)

    return bulkScheduleMessages(messageIds)
      .then(failedMessageIds => {
        setIsSendingMessage(false)
        setSelectedMessageIds(failedMessageIds)
      })
      .catch(e => {
        setIsSendingMessage(false)
        statusObject.update(translation._('An unknown error occurred. Please try again.'), 'error', true)
        if (!AbortionError.isAbortionError(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed to bulk schedule messages', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
      })
  }

  /**
   * This function either selects all messages by checking the checkbox or deselects all messages
   * by unchecking the checkbox
   */
  const onSelectAll = () => {
    const messages = getMessages(getComposerMessageState())
    const modes = Constants.BULK_COMPOSER_EDIT_MODES

    let editMode

    if (editMode === modes.MULTIPLE && allMessagesSelected) {
      editMode = selectedMessageForEdit ? modes.EDIT : modes.QUICK_SCHEDULE
    } else {
      editMode = modes.MULTIPLE
    }

    setAllMessagesSelected(!allMessagesSelected)
    setSelectedMessageIds(allMessagesSelected ? [] : messages.map(m => m.id))
    setEditMode(editMode)
  }

  const renderMessageSelectionHeader = () => {
    const messages = getMessages(getComposerMessageState())
    return (
      <MessageSelectionHeader
        key="message-selection-header"
        allMessagesSelected={allMessagesSelected}
        numberOfErrors={messages.filter(m => m.hasErrors()).length}
        numberOfMessages={messages.length} // the header is not aware that we lazy load, so we send all messages
        numberOfMessagesSelected={selectedMessageIds.length}
        onDiscardSelectedMessages={onDiscardSelectedMessages}
        onScheduleSelectedMessages={() => onBulkScheduleMessages(selectedMessageIds)}
        onSelectAll={onSelectAll}
        selectedHasErrors={messages.some(m => m.hasErrors() && selectedMessageIds.indexOf(m.id) > -1)}
      />
    )
  }

  const renderScheduledMessagesBanner = () => {
    const maxScheduledMessages = entitlements[SCHEDULE_MESSAGES]

    if (totalScheduledMessages <= 0) {
      return null
    }

    if (maxScheduledMessages === FEATURE_UNLIMITED) {
      return null
    }

    return (
      <PendoScheduledBanner
        totalScheduledMessages={totalScheduledMessages}
        maxScheduledMessages={maxScheduledMessages}
      />
    )
  }

  const renderOrgSuspendedBanner = () => {
    return <OrgSuspendedBanner {...{ timezoneName }} organization={selectedOrganization} />
  }
  const getAbovePanels = () => [
    header,
    renderOrgSuspendedBanner(),
    renderScheduledMessagesBanner(),
    selectedMessageIds.length >= 1 ? renderMessageSelectionHeader() : null,
  ]

  const toTemplateData = () => {
    return selectedMessageForEdit.toTemplateData(selectedOrganization && selectedOrganization.organizationId)
  }

  const onSendMessage = messageToSend => {
    return sendMessage(messageToSend)
      .then(sentMessageId => {
        const linkSettingsPresetId = getSelectedMessageValue(
          getComposerMessageState(),
          'linkSettingsPresetId',
        )

        setIsSendingMessage(false)
        if (sentMessageId) {
          // Update selected messages if necessary
          if (includes(selectedMessageIds, sentMessageId)) {
            const newSelectedMessageIds = selectedMessageIds.slice(0)
            newSelectedMessageIds.splice(newSelectedMessageIds.indexOf(sentMessageId), 1)
            setSelectedMessageIds(newSelectedMessageIds)
          }
          //tracking only in new compose, in bulk the selectedMessageForEdit is null so it can't log the linkSettingsPresetId
          if (linkSettingsPresetId) {
            track('web.publisher.' + trackingContext + '.send_message', 'link_preset_applied_to_message', {
              preset: selectedPreset,
            })
          }
        }
        if (EntitlementsUtils.isFeatureEnabled(entitlements, AUTO_SCHEDULE_MESSAGE)) {
          //save if autoschedule was used so we can default to that next time
          saveAutoScheduleLastSelected(messageToSend.isAutoScheduled)
        }
      })
      .catch(e => {
        setIsSendingMessage(false)
        if (!AbortionError.isAbortionError(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed to send message', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
      })
  }

  const getContentLibrary = () => {
    const orgId = selectedOrganization && selectedOrganization.organizationId
    if (orgId) {
      mediaLibraryActions.fetchContentSources(orgId)
    }
  }

  const onToggleMediaLibrary = (source?: string) => {
    if (!isMediaLibraryOpen) {
      if (isFeatureEnabled('PUB_30955_TRACK_COMPOSER_MEDIA_LIBRARY_ACTIONS')) {
        track(
          TrackingConstants.TRACKING_ORIGINS.MEDIA_LIBRARY,
          TrackingConstants.TRACKING_ACTION.ADD_MEDIA_FROM_LIBRARY,
          {
            mediaAdded: false,
            mediaRemoved: false,
            source: source || '',
          },
        )
      }

      getContentLibrary()
      track('web.publisher.' + trackingContext + '.open_media_library', 'open_media_library')
      if (isHashtagPanelOpen) {
        setIsHashtagPanelOpen(false)
      } else if (isAIPanelOpen) {
        setIsAIPanelOpen(false)
      }
    }

    mediaLibraryActions.setIsMediaLibraryOpen(!isMediaLibraryOpen)
  }

  const onToggleHashtagPanel = () => {
    const showHashtagPanel = !isHashtagPanelOpen
    if (showHashtagPanel) {
      if (isMediaLibraryOpen) {
        onToggleMediaLibrary()
        mediaLibraryActions.setIsMediaLibraryOpen(false)
      } else if (isAIPanelOpen) {
        setIsAIPanelOpen(false)
      }
      setIsHashtagPanelOpen(true)
      track(
        TrackingConstants.TRACKING_ORIGINS.CONTENT_HASHTAG_SUGGESTIONS,
        TrackingConstants.TRACKING_ACTIONS.CONTENT.OPENED_HASHTAG_PANEL,
      )
    } else {
      setIsHashtagPanelOpen(false)
    }
  }

  const onToggleAIPanel = () => {
    const showAIPanel = !isAIPanelOpen
    if (showAIPanel) {
      if (isMediaLibraryOpen) {
        onToggleMediaLibrary()
        mediaLibraryActions.setIsMediaLibraryOpen(false)
      } else if (isHashtagPanelOpen) {
        setIsHashtagPanelOpen(false)
      }
      setIsAIPanelOpen(true)
    } else {
      setIsAIPanelOpen(false)
    }
  }

  const renderSecureProfileModal = (socialNetworks, isBulk) => {
    const messages = getMessages(getComposerMessageState())
    const selectedMessageForEdit = getSelectedMessageForEdit()
    const onSend = closeSecureProfileModal => {
      setIsSendingMessage(true)
      closeSecureProfileModal()

      if (isBulk) {
        const allMessageIds = messages.map(message => {
          return message.id
        })
        onBulkScheduleMessages(allMessageIds)
      } else {
        if (selectedMessageForEdit && !ValidationUtils.isValid(selectedMessageForEdit.fieldValidations)) {
          return
        }
        onSendMessage(selectedMessageForEdit)
      }
    }

    showSecureProfileModal({
      isBulk,
      isScheduled: isBulk || (selectedMessageForEdit && !isNull(selectedMessageForEdit.sendDate)),
      messageCount: isBulk ? messages.length : 1,
      onSend,
      secureNetworks: socialNetworks.filter(sn => sn.isSecurePost),
      socialNetworks,
    })
  }

  const shouldShowSecureProfileModal = socialNetworks => {
    return socialNetworks.some(sn => sn.isSecurePost)
  }

  const scheduleAllMessages = () => {
    const messages = getMessages(getComposerMessageState())
    const allNetworks = messages.reduce((arr, message) => {
      message?.socialNetworksKeyedById.forEach(function (sn) {
        if (!arr.find(elem => elem.socialNetworkId === sn.socialNetworkId)) {
          arr.push(sn)
        }
      })

      return arr
    }, [])

    if (shouldShowSecureProfileModal(allNetworks)) {
      renderSecureProfileModal(allNetworks, true)
      return
    }

    const allMessageIds = messages.map(message => {
      return message.id
    })

    onBulkScheduleMessages(allMessageIds)
  }

  const willSendMessage = async () => {
    let selectedMessageForEdit = getSelectedMessageForEdit()

    let isMessageValid = false
    setIsSendingMessage(true)

    if (globalPreviewRequest) {
      try {
        const data = await globalPreviewRequest
        if (data) {
          if (data.fieldValidations) {
            isMessageValid = ValidationUtils.isValid(
              ValidationUtils.formatAuthoringFieldValidations(data.fieldValidations),
            )
          } else {
            isMessageValid = true
          }
        }

        clearPreviewRequest()
      } catch (e) {
        clearPreviewRequest()
        setIsSendingMessage(false)
        if (!axios.isCancel(e)) {
          logError(
            LOGGING_CATEGORIES.NEW_COMPOSER,
            'Failed waiting for preview request to finish before sending message',
            {
              errorMessage: JSON.stringify(e.message),
              stack: JSON.stringify(e.stack),
            },
          )
        }
      }
    } else {
      if (!selectedMessageForEdit.isSocialProfileSelected()) {
        const newFieldValidations = ValidationUtils.addCustomValidations(
          selectedMessageForEdit.fieldValidations,
          ComposerUtils.isPinterestComposer(customContext) ? [NoPinterestBoardError] : [NoProfilesError],
          FIELD_VALIDATIONS.SOCIAL_NETWORK,
          ComposerConstants.ERROR_LEVELS.ERRORS,
        )
        composerMessageActions.updateFieldById(
          selectedMessageForEdit.id,
          Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS,
          newFieldValidations,
        )
        isMessageValid = ValidationUtils.isValid(newFieldValidations)
      } else {
        isMessageValid = ValidationUtils.isValid(selectedMessageForEdit.fieldValidations)
      }
    }

    ValidationUtils.logErrorsAndWarnings(
      selectedMessageForEdit.fieldValidations,
      selectedMessageForEdit.toPreviewRequest(timezoneName),
    )

    if (!isMessageValid) {
      setShowOnSubmitErrors(true)
      setIsSendingMessage(false)
      // Wait a second for errors to render before doing the logging
      setTimeout(() => {
        selectedMessageForEdit = getSelectedMessageForEdit()
        return ValidationUtils.logErrorsNotRendered(
          selectedMessageForEdit,
          selectedMessageForEdit.toPreviewRequest(timezoneName),
        )
      }, 1000)
      return
    }
    if (isUploading) {
      const mediaUploadingMessage = !isNull(selectedMessageForEdit.sendDate)
        ? MEDIA_UPLOAD_IN_PROGRESS_TOAST_MESSAGE.replace('%s', SCHEDULING)
        : MEDIA_UPLOAD_IN_PROGRESS_TOAST_MESSAGE.replace('%s', PUBLISHING)
      StatusToastUtils.createToast(MEDIA_UPLOAD_IN_PROGRESS_TOAST_TITLE, mediaUploadingMessage, TYPE_WARNING)
      setIsSendingMessage(false)
      return
    }

    if (shouldShowSecureProfileModal(selectedMessageForEdit.socialNetworksKeyedById)) {
      renderSecureProfileModal(selectedMessageForEdit.socialNetworksKeyedById.toArray(), false)
      setIsSendingMessage(false)
      return
    }

    const isAllOwnerTypesPrivate: boolean = PredictiveComplianceUtils.getIsAllOwnerTypesPrivate(
      selectedMessageForEdit.socialNetworksKeyedById,
    )

    if (isFeatureEnabled('PUB_13776_PREDICTIVE_COMPLIANCE') && isAllOwnerTypesPrivate === false) {
      if (isPredictiveComplianceEnabled) {
        const organizationId = selectedOrganization ? selectedOrganization.organizationId : undefined
        const { urlPreview } = selectedMessageForEdit
        const text = selectedMessageForEdit ? selectedMessageForEdit.renderMessageText() : ''
        const complianceObj = PredictiveComplianceUtils.parseInputs({ text, urlPreview, organizationId })
        if (complianceObj && organizationId) {
          setCheckPredictiveComplianceAndSend(true)
          checkPredictiveCompliance(complianceObj)
        } else {
          setIsSendingMessage(false)
        }
        const { isRejected } = PredictiveComplianceUtils.getState(predictiveComplianceStatus)
        if (isRejected) {
          setIsSendingMessage(false)
        }
        // Do not send the message if predictive compliance enabled
        return
      }
    }
    onSendMessage(selectedMessageForEdit)
  }
  /**
   * Determines the edit mode (excluding preview)
   * @param {boolean} hasSelectedMessageForEdit
   * @param {Object[]} messages
   * @returns {undefined|string}
   * @private
   */
  const _determineEditMode = (hasSelectedMessageForEdit, messages) => {
    const modes = Constants.BULK_COMPOSER_EDIT_MODES

    if (selectedMessageIds.length >= 1) {
      return modes.MULTIPLE
    }

    if (hasSelectedMessageForEdit) {
      return editMode === modes.PREVIEW ? modes.PREVIEW : modes.EDIT
    }

    if (Array.isArray(messages) && messages.filter(m => m.hasErrors()).length > 0) {
      return modes.ERRORS
    }

    return modes.QUICK_SCHEDULE
  }

  useEffect(() => {
    if (getMessages(getComposerMessageState())?.length === 0) {
      setAllMessagesSelected(false)
      setMaxMessagesLoaded(Constants.BULK_PAGE_SIZE)
      setEditMode(Constants.BULK_COMPOSER_EDIT_MODES.QUICK_SCHEDULE)
      setSelectedMessageIds([])
      setUnmountEditComponent(false)
    } else {
      const selectedMessageForEdit = getSelectedMessageForEdit()
      setEditMode(_determineEditMode(!!selectedMessageForEdit, getMessages(getComposerMessageState())))
    }
  }, [getMessages(getComposerMessageState())?.length, selectedMessageForEdit?.id])

  useEffect(() => {
    if (!isMinimized) {
      // on Maximize re-open Media Library if it was open and perform a search
      mediaLibraryActions.setIsMediaLibraryOpen(mediaLibraryMinimizeState)

      if (mediaLibraryMinimizeState) {
        // only do the search if the media library is open

        mediaLibraryActions.fetchMedia().catch(() => {
          // don't show the error if they've closed composer since starting the request
          if (mediaLibraryMinimizeState) {
            statusObject.update(translation._('Unable to find more media.'), 'error', true)
          }
        })
      }
    }
  }, [isMinimized])

  // Remove with PUB_30706_LINK_SETTINGS_PNE
  const getLinkSettingsWithCampaignPresetApplied = (
    campaignPreset: Preset,
    linkSettings: LinkSettings,
  ): LinkSettings | null => {
    // if there's no preset or no links there's nothing todo
    if (campaignPreset && linkSettings !== null) {
      const presets = flux.getStore('presets').get() as Array<Preset>
      if (presets && presets.length) {
        const preset = find(presets, (p: Preset) => p.id === Number(campaignPreset.id))
        if (typeof preset === 'undefined') {
          return null
        }
        return LinkSettingsUtils.applyPreset(preset, linkSettings)
      }
    }
    return null
  }

  const applyCampaignSettings = (campaignId: string) => {
    const selectedCampaign = getCampaignById(campaignId)

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const presets = flux.getStore('presets').get() as Array<Preset>

      // Update base message link settings
      const { linkSettings, linkSettingsPresetId } =
        LinkUtils.applyCampaignSettings(
          selectedMessageForEdit.baseMessage?.linkSettings,
          selectedCampaign,
          presets,
          trackingContext,
        ) || {}

      // Update inner message link settings
      const pneLinkSettings = {}
      selectedMessageForEdit?.messages?.forEach(m => {
        const { linkSettings, linkSettingsPresetId } =
          LinkUtils.applyCampaignSettings(m.linkSettings, selectedCampaign, presets, trackingContext) || {}
        pneLinkSettings[m.snType] = {
          linkSettingsPresetId,
          linkSettings,
        }
      })

      composerMessageActions.applyCampaignPresets(selectedMessageForEdit.id, {
        baseMessage: {
          linkSettingsPresetId,
          linkSettings,
        },
        ...pneLinkSettings,
      })
    } else {
      const currentLinkSettings = cloneDeep(selectedMessageForEdit.linkSettings)
      const updates = {} as {
        linkSettings?: LinkSettings
        linkSettingsPresetId?: number
      }

      let campaignHasPreset = false
      if (currentLinkSettings) {
        let newLinkSettings: LinkSettings = null
        let newLinkSettingsPresetId: number = null

        if ((selectedCampaign && selectedCampaign.preset === null) || !selectedCampaign) {
          newLinkSettings = LinkSettingsUtils.applyDefaultLinkSettings(currentLinkSettings)
        } else {
          newLinkSettings = getLinkSettingsWithCampaignPresetApplied(
            selectedCampaign.preset,
            currentLinkSettings,
          )
          newLinkSettingsPresetId = selectedCampaign.preset.id

          campaignHasPreset = true
          if (!newLinkSettings) {
            newLinkSettings = currentLinkSettings
          }
        }

        updates.linkSettings = newLinkSettings
        updates.linkSettingsPresetId = newLinkSettingsPresetId
      }

      // TODO: Check for more features here (ie. tags) and apply them

      if (Object.keys(updates).length) {
        composerMessageActions.updateFieldsById(selectedMessageForEdit.id, updates)
        if (campaignHasPreset) {
          track('web.publisher.' + trackingContext + '.send_message', 'campaign_applied_link_preset')
        }
      }
    }
  }

  useEffect(() => {
    setCampaignId(selectedMessageForEdit?.campaignId)
    // prevCampaignId and campaignId are undefined only when loading a draft or CL template,
    // in that case we don't want to apply campaign preset but rather use per network preset id set on each inner message
    if (selectedMessageForEdit?.campaignId && !isUndefined(prevCampaignId) && !isUndefined(campaignId)) {
      applyCampaignSettings(selectedMessageForEdit.campaignId)
    }
  }, [selectedMessageForEdit?.campaignId])

  useEffect(() => {
    if (isFeatureEnabled('PUB_13776_PREDICTIVE_COMPLIANCE')) {
      if (checkPredictiveComplianceAndSend) {
        const { isWarning, isPending, isApproved, isInProgress } =
          PredictiveComplianceUtils.getState(predictiveComplianceStatus)
        if (!isInProgress && (isWarning || isPending || isApproved)) {
          if (isFeatureEnabled('PUB_31913_PREVENT_EMPTY_SEND')) {
            // Prevents sendMessage from being called with a 400 error in case it is invalid
            if (
              !ValidationUtils.isValid(getSelectedMessageForEdit().fieldValidations) ||
              !getSelectedMessageForEdit().isSocialProfileSelected()
            ) {
              return
            }
          }
          setIsSendingMessage(true)
          setCheckPredictiveComplianceAndSend(false)
          const selectedMessageForEdit = getSelectedMessageForEdit()
          onSendMessage(selectedMessageForEdit)
        }
      }
    }
  }, [isPredictiveComplianceEnabled, checkPredictiveComplianceAndSend, predictiveComplianceStatus])

  const _haveSelectedChannelsChanged = (prevProps, nextProps) => {
    const prevChannels = prevProps?.getSocialNetworkTypes()
    const nextChannels = nextProps?.getSocialNetworkTypes()

    return (
      prevChannels &&
      nextChannels &&
      prevChannels.length !== nextChannels.length &&
      !prevChannels.some(prevChannel => nextChannels.includes(prevChannel))
    )
  }
  const onSelectedMessageChange = (
    selectedMessage: Message,
    prevMessage: Message,
    hasMessageChanged: boolean,
  ) => {
    if (selectedMessage) {
      const haveSelectedChannelsChanged = _haveSelectedChannelsChanged(prevMessage, selectedMessage)
      const selectedChannelCount = selectedMessage.getSocialNetworkTypes().length

      const shouldUpdatePreviewData = haveSelectedChannelsChanged || hasMessageChanged

      if (haveSelectedChannelsChanged) {
        resetLocations()
      }

      if (selectedChannelCount === 0) {
        const messagePreviewState: PreviewsState = getMessagePreviewsState()
        if (
          Array.isArray(messagePreviewState.previewMessages) &&
          messagePreviewState.previewMessages.length > 0
        ) {
          MessagePreviewsActions.resetPreviews()
        }
        updateGenericPreview(selectedMessage)
      } else if (shouldUpdatePreviewData) {
        if (isPreviewFetchInProgress) {
          cancelPreviewRequest()
        }
        fetchPreviewData()

        if (showOnSubmitErrors === true) {
          setShowOnSubmitErrors(false)
        }
      }
    }
  }

  const hasMessageChanged = (prevMessage: Message, nextMessage: Message): boolean => {
    // When the previous/next selectedMessageForEdit are the same AND the
    // previous/next messages are not the same, that means previews is done fetching
    // and the composer-message store is still being updated with the messages.
    // While the action to update the messages in the composer-message store
    // is still being dispatched, this component sees that the message is still
    // different so it makes another fetch for the previews. This was causing the
    // previews to be fetched twice every time a change was made in new composer.
    if (mode === ComposerConstants.MODE.COMPOSER) {
      const hasAttachments = !!(prevMessage?.hasAttachments() && nextMessage?.hasAttachments())
      const removeThumbnailId = nextAttachments => {
        nextAttachments.forEach(attachment => {
          if (attachment.thumbnailUrls) {
            attachment.thumbnailUrls = attachment.thumbnailUrls.map(thumbnail => ({
              thumbnailUrl: thumbnail.thumbnailUrl,
              thumbnailOffset: thumbnail.thumbnailOffset,
            }))
          }
        })
      }
      if (hasAttachments) {
        removeThumbnailId(nextMessage.attachments)
      }

      if (
        (prevMessage?.messages.length &&
          nextMessage?.messages.length &&
          isEqual(
            omit(prevMessage.asComparible(), 'messages', 'fieldValidations'),
            omit(nextMessage.asComparible(), 'messages', 'fieldValidations'),
          ) &&
          !isEqual(prevMessage.messages[0].asComparible(), nextMessage.messages[0].asComparible()) &&
          !MessageUtils.hasInnerAttachmentsChanged(prevMessage.messages, nextMessage.messages)) ||
        (hasAttachments &&
          !MessageUtils.hasBaseAttachmentsChanged(prevMessage.attachments, nextMessage.attachments))
      ) {
        return false
      }
    }
    if (isFeatureEnabledOrBeta('PUB_31920_FIX_BULK_RENDER_ON_ERROR')) {
      if (mode === ComposerConstants.MODE.BULK_COMPOSER) {
        // we only compare base message on bulk as user can only edit the baseMessage
        return !isEqual(
          omit(nextMessage?.asComparible(), 'messages', 'fieldValidations'),
          omit(prevMessage?.asComparible(), 'messages', 'fieldValidations'),
        )
      }
    }

    return !_.isEqual(nextMessage?.asComparible(), prevMessage?.asComparible())
  }

  const observer = () => {
    unsubscribeObservers = [observeSelectedMessage(onSelectedMessageChange, hasMessageChanged)]
  }

  useEffect(() => {
    unsubscribeObservers?.forEach(fn => (typeof fn === 'function' ? fn() : 0))
    observer()

    return () => {
      over(unsubscribeObservers)()
    }
  }, [])

  const onLoad = () => {
    const length = getMessages(getComposerMessageState()).length
    if (maxMessagesLoaded < length) {
      setMaxMessagesLoaded(Math.min(length, maxMessagesLoaded + Constants.BULK_PAGE_SIZE))
    }
  }

  const onModeChange = () => {
    setEditMode(
      editMode === Constants.BULK_COMPOSER_EDIT_MODES.PREVIEW
        ? Constants.BULK_COMPOSER_EDIT_MODES.EDIT
        : Constants.BULK_COMPOSER_EDIT_MODES.PREVIEW,
    )

    const socialTypes = selectedMessageForEdit.getSocialNetworkTypes()

    track(
      'web.publisher.' + trackingContext + '.pnp',
      editMode === Constants.BULK_COMPOSER_EDIT_MODES.PREVIEW ? 'enter_pnp' : 'exit_pnp',
      { snType: socialTypes },
    )
  }

  /**
   * This function adds the message to the selected messages list or removes it
   * @param {int} messageId
   */
  const onSelect = messageId => {
    const modes = Constants.BULK_COMPOSER_EDIT_MODES
    let editMode
    const newSelectedMessageIds = selectedMessageIds.slice(0)
    if (!includes(selectedMessageIds, messageId)) {
      // Add message to selected messages list if doesn't exist already
      newSelectedMessageIds.push(messageId)
    } else {
      // Else just remove it from selected messages list
      newSelectedMessageIds.splice(newSelectedMessageIds.indexOf(messageId), 1)
      if (selectedMessageIds.length === 1) {
        editMode = modes.EDIT
      }
      // If the select all checkbox is selected, turn it off since not all messages are selected anymore
      setAllMessagesSelected(false)
    }
    if (editMode === modes.EDIT) {
      if (!selectedMessageForEdit) {
        // set it to quick schedule because there is no selected message for edit
        editMode = modes.QUICK_SCHEDULE
      }
    } else {
      editMode = modes.MULTIPLE
    }
    setSelectedMessageIds(newSelectedMessageIds)
    setEditMode(editMode)
  }
  const onEditSelect = messageId => {
    const id = getSelectedMessageValue(getComposerMessageState(), 'id')
    track('web.publisher.' + trackingContext + '.message_dashboard', 'select_message_to_edit')

    let idToSet = messageId

    if (id === messageId) {
      idToSet = 0 // Zero is not a valid id so the store will set the selected id to null. This is done because an action in flummox can't return null
    }

    // We 'unmount' the edit panel by using a conditional to show the edit component
    setUnmountEditComponent(true)
    composerMessageActions.selectById(idToSet)
  }

  useEffect(() => {
    // refer to "onEditSelect" in old "composer.tsx" for reasoning here
    if (unmountEditComponent) {
      setUnmountEditComponent(false)
    }
  }, [unmountEditComponent])

  const onAttachmentEdited = async (
    originalAttachment: AttachmentData,
    editedAttachmentData: AttachmentData,
  ) => {
    if (!selectedMessageForEdit) {
      return
    }

    if (originalAttachment.productTags != null) {
      editedAttachmentData.productTags = { ...originalAttachment.productTags }
    }

    if (editedAttachmentData.fileSource !== AttachmentConstants.FILESOURCE.CANVA) {
      if (originalAttachment.fileName != null) {
        editedAttachmentData.fileName = originalAttachment.fileName
      }
    }

    editedAttachmentData.trackingSource = ComposerConstants.ATTACHMENT_TRACKING_SOURCE.EDITING

    if (VideoAttachment.isVideoAttachment(editedAttachmentData)) {
      editedAttachmentData = await AttachmentUtils.extractVideoThumbnails(editedAttachmentData)
      editedAttachmentData.subtitles = originalAttachment.subtitles
      editedAttachmentData.userMetadata = originalAttachment.userMetadata
    } else if (ImageAttachment.isImageAttachment(editedAttachmentData)) {
      editedAttachmentData.altText = editedAttachmentData.altText
        ? editedAttachmentData.altText
        : originalAttachment.altText
    }

    const editedAttachment = ComposerUtils.createAttachmentFromData(editedAttachmentData)

    let newAttachments =
      (selectedMessageForEdit.selectedNetworkGroup
        ? MessageUtils.getAttachmentsBySelectedNetwork(
            getSelectedMessageValue(getComposerMessageState(), 'messages', false, []),
            selectedMessageForEdit.selectedNetworkGroup,
          )
        : selectedMessageForEdit.attachments) || []

    newAttachments = newAttachments.map(attachment => {
      if (originalAttachment.url === attachment.url) {
        return editedAttachment
      } else {
        return attachment
      }
    })

    composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.ATTACHMENTS,
      newAttachments,
    )
  }

  const onDiscardMessage = messageId => {
    showMessageDiscardModal(messageId, false)
  }

  // Remove with PUB_30706_LINK_SETTINGS_PNE
  const selectedCampaignHasValidLinkSetting = (selectedCampaignPreset, presets) => {
    return typeof presets.find(preset => preset.id === selectedCampaignPreset.id) !== 'undefined'
  }

  const getTimeToInteractive = text => {
    // Only record one TTI measurement per composer session, if longtaskObserver is set
    // then a recording is completed, or is in progress
    if (!longtaskObserver) {
      const SHORT_INITIAL_WINDOW_DURATION = 3
      const SHORT_MINIMUM_WINDOW_DURATION = 0.5
      const SHORT_ESTIMATED_TTI = -0.01 // a minimum value less than 0 allows for a 0 tti

      longtaskObserver = new LongtaskObserver()
      longtaskObserver
        .getTimeToInteractive({
          initialWindowDuration: SHORT_INITIAL_WINDOW_DURATION,
          minimumWindowDuration: SHORT_MINIMUM_WINDOW_DURATION,
          minimumEstimatedTTI: SHORT_ESTIMATED_TTI,
        })
        .then(tti => {
          if (selectedMessageForEdit && tti >= 0) {
            const charactersTyped =
              Math.abs(selectedMessageForEdit.renderMessageText().length - text.length) + 1
            if (charactersTyped > 0) {
              const ttiPerChunk = tti / charactersTyped
              const selectedNetworksCount = selectedMessageForEdit.socialNetworksKeyedById
                ? selectedMessageForEdit.socialNetworksKeyedById.size
                : 0
              recordTiming(`fullscreencomposer.performance.typing_tti.${selectedNetworksCount}`, {
                value: ttiPerChunk,
                statType: 'timing',
                splitByLocation: true,
              })
            }
          }
        })
        .catch(() => {
          // do nothing. it is expected to fail for browsers other than Chrome
        })
    }
  }

  /**
   * Tracks when a user types a message for the post content
   * @param newText The text for the message content
   */
  const trackMessageText = newText => {
    if (isFeatureEnabled('PUB_30956_TRACK_COMPOSER_TEXT_POST_TYPE_ACTIONS')) {
      track(
        TrackingConstants.TRACKING_ORIGINS.MESSAGE_TEXT_CONTENT,
        TrackingConstants.TRACKING_ACTION.TEXT_ADDED,
        {
          charactercount: newText?.length,
          numofHashtags: ComposerUtils.getHashtags(newText).length,
        },
      )
    }
  }

  const debounceTrackMessageText = debounce(trackMessageText, 1000)
  const combineLinkSettings = (urlDetected: LinkSettings, linkDiffWithPreset: LinkSettings): LinkSettings => {
    if (Array.isArray(linkDiffWithPreset) && linkDiffWithPreset.length > 0) {
      urlDetected = urlDetected.filter(link => link.url !== linkDiffWithPreset[0].url)
    }
    return union(urlDetected, linkDiffWithPreset)
  }

  /**
   *
   * @param newText The updated text as displayed in the editor e.g "Text http://www.hootsuite.com @mention"
   * @param newMentions The updated mentions, if mentions were linked
   * @param newTemplate The text with mentions in the template format e.g "Text http://www.hootsuite.com %{mention-id:0}"
   * @param selectedNetworkGroup The network group updated, or null if no network is selected
   */
  const onChangeMessageText = (
    newText: string,
    newMentions: Mentions,
    newTemplate?: string,
    selectedNetworkGroup: SocialNetworkGroup | null = null,
  ) => {
    debounceTrackMessageText(newText)

    // For now let's not collect data from Pinterest composer.
    if (!ComposerUtils.isPinterestComposer(customContext)) {
      if (newText && newText.length > 0) {
        getTimeToInteractive(newText)
      }
    }

    if (selectedMessageForEdit && mode !== ComposerConstants.MODE.BULK_COMPOSER) {
      const presets = flux.getStore('presets').get() as Array<Preset>

      const previousLinks: LinkSettings = LinkUtils.getAllLinkSettings(
        selectedMessageForEdit,
        selectedMessageForEdit.renderMessageText(),
        selectedNetworkGroup,
      )
      const urlDetected: LinkSettings = LinkUtils.getAllLinkSettings(
        selectedMessageForEdit,
        newText,
        selectedNetworkGroup,
        newMentions,
      )

      const linkDiff: LinkSettings = LinkSettingsUtils.linkDiff(urlDetected, previousLinks)
      const isMultiOrgWithLinkSettingsEntitlements =
        organizations.length > 1 && entitlements[LINK_SETTINGS_ADVANCED]
      let lastUsedLocalPreset: Preset
      if (localStorage && memberId && localStorage.getItem(Constants.LINK_PRESET_LOCAL_STORAGE)) {
        lastUsedLocalPreset = JSON.parse(localStorage.getItem(Constants.LINK_PRESET_LOCAL_STORAGE))[memberId]
      }

      let updatedLinkSettings: LinkSettings
      let updatedLinkSettingsPresetId: number = null

      const validOrganizationCheck = selectedOrganization
      const selectedCampaign = getCampaignById(selectedMessageForEdit.campaignId)

      if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
        const shouldUseLocalPreset = !!(
          lastUsedLocalPreset &&
          (isMultiOrgWithLinkSettingsEntitlements || !entitlements[LINK_SETTINGS_ADVANCED])
        )
        const innerMessage = MessageUtils.getInnerMessageFromGroup(
          selectedMessageForEdit?.messages,
          selectedMessageForEdit?.selectedNetworkGroup,
        )
        const selectedLinkSettingsPresetId = isNil(innerMessage)
          ? selectedMessageForEdit.baseMessage?.linkSettingsPresetId
          : innerMessage?.linkSettingsPresetId

        const { linkSettings, linkSettingsPresetId } = LinkUtils.updateLinkSettingsOnMessageChange(
          urlDetected,
          previousLinks,
          linkDiff,
          selectedLinkSettingsPresetId,
          selectedCampaign,
          presets,
          onChangePreset,
          !isEmpty(selectedOrganization),
          entitlements[LINK_SETTINGS_ADVANCED],
          shouldUseLocalPreset,
          lastUsedLocalPreset,
        )
        updatedLinkSettings = linkSettings
        updatedLinkSettingsPresetId = linkSettingsPresetId
      } else {
        if (
          selectedCampaign &&
          selectedCampaign.preset !== null &&
          selectedCampaignHasValidLinkSetting(selectedCampaign.preset, presets)
        ) {
          updatedLinkSettings = getLinkSettingsWithCampaignPresetApplied(selectedCampaign.preset, urlDetected)
          updatedLinkSettingsPresetId = selectedCampaign.preset.id
        } else if (previousLinks && urlDetected && previousLinks.length > urlDetected.length) {
          //If a link was removed, just return the previous link settings
          updatedLinkSettings = urlDetected
        } else if (
          validOrganizationCheck &&
          entitlements[LINK_SETTINGS_ADVANCED] &&
          presets &&
          presets.length &&
          ((isEmpty(previousLinks) && urlDetected) || (linkDiff && linkDiff.length > 0))
        ) {
          //If there are presets and a link was added, apply preset to that link, combine and return with previous set
          const defaultPreset = _.findWhere(presets, { isDefault: true })
          if (selectedMessageForEdit.linkSettingsPresetId) {
            const preset = _.findWhere(presets, {
              id: selectedMessageForEdit.linkSettingsPresetId,
            })
            const linkDiffWithPreset: LinkSettings = LinkSettingsUtils.applyPreset(preset, linkDiff)
            updatedLinkSettings = isEmpty(previousLinks)
              ? linkDiffWithPreset
              : combineLinkSettings(urlDetected, linkDiffWithPreset)
          } else if (defaultPreset) {
            onChangePreset(defaultPreset)
            const linkDiffWithPreset = LinkSettingsUtils.applyPreset(defaultPreset, linkDiff)
            updatedLinkSettings = isEmpty(previousLinks)
              ? linkDiffWithPreset
              : combineLinkSettings(urlDetected, linkDiffWithPreset)
          } else {
            updatedLinkSettings = urlDetected
          }
        } else if (
          (isMultiOrgWithLinkSettingsEntitlements &&
            lastUsedLocalPreset &&
            ((isEmpty(previousLinks) && urlDetected) || (linkDiff && linkDiff.length > 0))) ||
          (!entitlements[LINK_SETTINGS_ADVANCED] &&
            lastUsedLocalPreset &&
            ((isEmpty(previousLinks) && urlDetected) || (linkDiff && linkDiff.length > 0)))
        ) {
          //If there is local preset and a link was added, apply preset to that link, combine and return with previous set
          const linkDiffWithPreset = LinkSettingsUtils.applyPreset(lastUsedLocalPreset, linkDiff)
          updatedLinkSettings = isEmpty(previousLinks)
            ? linkDiffWithPreset
            : combineLinkSettings(urlDetected, linkDiffWithPreset)
        } else {
          updatedLinkSettings = urlDetected
        }
      }

      if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
        // Remove link preview error if message text has no links and no preview
        let linkPreviewUpdates = {}
        const linkPreview = selectedMessageForEdit?.urlPreview
        if ((isEmpty(updatedLinkSettings) || isNull(updatedLinkSettings)) && linkPreview?.hasError) {
          linkPreviewUpdates = {
            [Constants.FIELD_TO_UPDATE.UN_EDITED_URL_PREVIEW]: {
              hasError: false,
              hasWarning: false,
            },
            [Constants.FIELD_TO_UPDATE.URL_PREVIEW]: {
              hasError: false,
              hasWarning: false,
            },
          }
        }

        // If we are applying presets to the link settings that have not diverged from the base link settings,
        // we need to generate new link ids
        const innerMessage = MessageUtils.getInnerMessageFromGroup(
          selectedMessageForEdit.messages,
          selectedMessageForEdit.selectedNetworkGroup,
        )
        if (!isNil(innerMessage?.linkSettings) && !isEmpty(updatedLinkSettings)) {
          const shouldGenerateLinkSettingsIds = LinkUtils.shouldGenerateNewLinkSettingIds(
            innerMessage.linkSettings,
            selectedMessageForEdit.baseMessage.linkSettings,
            updatedLinkSettings,
          )
          if (shouldGenerateLinkSettingsIds) {
            updatedLinkSettings.forEach(updatedLinkSetting => (updatedLinkSetting.id = uuid()))
          }
        }

        const linkSettingsWithPresetApplied = LinkUtils.getLinkSettingsWithPresetApplied(
          selectedMessageForEdit,
          updatedLinkSettings,
          updatedLinkSettingsPresetId,
        )
        const template = MessageUtils.mapLinkSettingsToTemplate(newTemplate, updatedLinkSettings)
        const updates = {
          mentions: newMentions,
          template,
          ...linkPreviewUpdates,
        }

        composerMessageActions.applyCampaignPresets(selectedMessageForEdit.id, {
          ...linkSettingsWithPresetApplied,
        })
        composerMessageActions.updateFieldsById(selectedMessageForEdit.id, updates)
      } else {
        const template = MessageUtils.mapLinkSettingsToTemplate(newTemplate, updatedLinkSettings)
        const updates = {
          linkSettings: updatedLinkSettings || [],
          linkSettingsPresetId: updatedLinkSettingsPresetId,
          mentions: newMentions,
          template,
        }

        composerMessageActions.updateFieldsById(selectedMessageForEdit.id, updates)
      }
    } else if (selectedMessageForEdit && mode === ComposerConstants.MODE.BULK_COMPOSER) {
      composerMessageActions.updateFieldsById(selectedMessageForEdit.id, {
        template: newTemplate || '',
      })
    } else {
      throw new Error('Attempted to update a post when none was selected: ' + newText)
    }
  }

  const debounceOnChangeText = debounce(onChangeMessageText, 500)

  const onLinkPreviewChange = (messageId, newLinkPreview) => {
    composerMessageActions.updateFieldById(messageId, Constants.FIELD_TO_UPDATE.URL_PREVIEW, newLinkPreview)
  }

  /**
   * Updates the ignored preview validation message codes in the member's extras and in the store
   * to unset the ignored codes:
   * ajaxCall({method: 'POST', url: '/ajax/member/set-publisher-setting', json: {settingName: 'ignoredPreviewValidationMessageCodes', value: []}}, 'q1NoAbort');
   * @param {Number} code
   */
  const onAddIgnoredPreviewValidationMessageCode = async (code: string) => {
    const ignoredCodes = [...ignoredPreviewValidationMessageCodes]
    if (!includes(ignoredCodes, code)) {
      ignoredCodes.push(code)
      await savePublisherSetting('ignoredPreviewValidationMessageCodes', ignoredCodes)
      dispatch(validationActions.setIgnoredPreviewValidationMessageCodes(ignoredCodes))
    }
  }

  const onUpdatePublishTime = (newPublishTime: ScheduleTime): void => {
    setSelectedPublishTime(newPublishTime)
  }

  const translateBoostCampaignDatesAccordinglyToThePostScheduling = (boostCampaign, schedulingDate) => {
    // eslint-disable-next-line camelcase
    const { start_time, end_time } = boostCampaign
    const startDate = moment.unix(start_time)
    const endDate = moment.unix(end_time)
    const diffInSeconds = endDate.diff(startDate, 'seconds')

    return {
      ...boostCampaign,
      // eslint-disable-next-line camelcase
      start_time: moment(schedulingDate).unix().toString(),
      // eslint-disable-next-line camelcase
      end_time: moment(schedulingDate).add(diffInSeconds, 'seconds').unix().toString(),
    }
  }

  const datesEnabledForScheduling = useMemo(
    () => getDatesEnabledForScheduling(selectedMessageForEdit),
    [selectedMessageForEdit?.campaignId],
  )
  const onUpdateScheduleDate = (
    newDate?: Date | null,
    isAutoscheduled?: boolean | null,
    recommendedTimes?: { socialProfileId: string; time: Date }[],
    recommendedTimesScheduledType?: RecommendedTimesScheduledType,
  ): void => {
    // isAutoscheduled could be null so we want to force as false
    const isAutoscheduledFlag = Boolean(isAutoscheduled) && !recommendedTimes

    if (selectedMessageForEdit) {
      const boostCampaign = selectedMessageForEdit.getBoostCampaign()
      const campaignDateError = ValidationUtils.getCampaignDateError({
        dateTime: newDate,
        enabledDays: datesEnabledForScheduling,
        minimumScheduleMinutes: selectedMessageForEdit.hasVideoAttachment()
          ? ComposerConstants.MINIMUM_SCHEDULE_MINUTES.VIDEO
          : ComposerConstants.MINIMUM_SCHEDULE_MINUTES.DEFAULT,
        timezoneName,
      })
      const fieldsToUpdate: {
        isAutoScheduled: boolean
        sendDate: number
        fieldValidations?: unknown
        recommendedTimesScheduledType?: RecommendedTimesScheduledType
      } = {
        isAutoScheduled: isAutoscheduledFlag,
        sendDate: dateToUnixTimestamp(newDate, timezoneName),
      }
      if (recommendedTimesScheduledType) {
        fieldsToUpdate.recommendedTimesScheduledType = recommendedTimesScheduledType
      }

      if (!isAutoscheduledFlag && campaignDateError) {
        fieldsToUpdate.fieldValidations = ValidationUtils.addCustomValidations(
          selectedMessageForEdit.fieldValidations,
          [campaignDateError],
          FIELD_VALIDATIONS.SEND_DATE,
          ComposerConstants.ERROR_LEVELS.ERRORS,
        )
      } else {
        if (boostCampaign && newDate) {
          fieldsToUpdate[Constants.FIELD_TO_UPDATE.BOOST_CAMPAIGN] =
            translateBoostCampaignDatesAccordinglyToThePostScheduling(boostCampaign, newDate)
        }
        fieldsToUpdate.fieldValidations = ValidationUtils.removeCustomScheduleDateErrors(
          selectedMessageForEdit.fieldValidations,
        )
      }
      composerMessageActions.updateFieldsById(selectedMessageForEdit.id, fieldsToUpdate)

      // TODO: probably better to use a custom action on the `composerMessageActions` store
      if (recommendedTimes) {
        const timeBySnId = recommendedTimes.reduce(
          (scheduleMap, { socialProfileId, time }) => ({
            ...scheduleMap,
            [socialProfileId]: time,
          }),
          {} as { [snId: string]: number },
        )

        // Update inner messages individually with a specific send date
        selectedMessageForEdit.messages.forEach(innerMessage => {
          const time = timeBySnId[innerMessage.snId]
          if (time) {
            innerMessage.sendDate = dateToUnixTimestamp(time, timezoneName)
          }
        })
      }
    } else {
      throw new Error('Attempted to update a post when none was selected')
    }
  }

  const onCreateBoardComplete = ({ responses, boardName, error }) => {
    if (handleCreateBoardComplete(responses, boardName, error, statusObject)) {
      reloadAllPinterestBoards(
        customContext,
        socialNetworks,
        selectedOrganization,
        statusObject,
        onFetchSocialProfiles,
        setIsFetchingPinterestBoards,
      )
    }
  }

  const validateTemplate = templateData => {
    let isMessageValid = true
    setIsSendingMessage(true)

    const isLocked = selectedMessageForEdit.isLocked

    if (isLocked && !selectedMessageForEdit.isSocialProfileSelected()) {
      const newFieldValidations = ValidationUtils.addCustomValidations(
        selectedMessageForEdit.fieldValidations,
        [NoProfilesError],
        FIELD_VALIDATIONS.SOCIAL_NETWORK,
        ComposerConstants.ERROR_LEVELS.ERRORS,
      )
      composerMessageActions.updateFieldById(
        selectedMessageForEdit.id,
        Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS,
        newFieldValidations,
      )
      isMessageValid = ValidationUtils.isValid(newFieldValidations)
    }

    if (!isMessageValid) {
      setShowOnSubmitErrors(true)
      setIsSendingMessage(false)
      return
    } else {
      onSaveTemplate(templateData)
        .then(() => {
          setIsSendingMessage(false)
          if (isFeatureEnabledOrBeta('PUB_30395_NEW_TEMPLATE_EXPERIENCE_IN_COMPOSER')) {
            emit(CONTENT_LIBRARY_EVENTS.REFRESH_LIBRARY)
          }
          closeComposer()
        })
        .catch(e => {
          if (!AbortionError.isAbortionError(e)) {
            logError(LOGGING_CATEGORIES.NEW_COMPOSER_TEMPLATES, 'Failed during save template', {
              errorMessage: JSON.stringify(e.message),
              stack: JSON.stringify(e.stack),
            })
          }
        })
    }
  }

  const calcMediaLibraryPanelHeight = node => {
    // don't do anything if media library isn't open
    if (!isMediaLibraryOpen) {
      return
    }

    const panelHeight = node ? ReactDOM.findDOMNode(node).clientHeight : 0
    // Only update the media library panel height when:
    // - the media library is opened AND
    // - the media library prop is not set AND
    // - the composer panel node exists AND
    // - the media library panel height is 0 (which means the media library was never opened) OR the media library was opened and the composer panel height has changed
    if (
      isMediaLibraryOpen &&
      !mediaLibraryPanelHeight &&
      node &&
      (!mediaLibraryPanelHeight || (mediaLibraryPanelHeight !== 0 && mediaLibraryPanelHeight !== panelHeight))
    ) {
      setMediaLibraryPanelHeight(panelHeight)
    }
  }
  const onTrackMediaUploadError = error => {
    if (!mediaUploadErrorTracked[error.code]) {
      ComposerUtils.trackAttachmentValidationErrors(
        error,
        `web.publisher.${trackingContext}.${isEditMode ? 'edit' : 'create'}_message`,
        mediaUploadErrorTracked,
        () =>
          setMediaUploadErrorTracked({
            ...mediaUploadErrorTracked,
            [error.code]: true,
          }),
      )
    }
  }

  const renderTagManager = () => {
    emit('tagmanager.app.show', selectedOrganization)
  }

  const onUploadQueueCompleteFunc = onUploadQueueComplete => {
    _onUploadQueueComplete = onUploadQueueComplete
  }

  /**
   * @returns An array of social profile IDs associated with the currently selected message
   */
  const getSelectedProfileIds = (): Array<number> => {
    return selectedMessageForEdit ? selectedMessageForEdit.getSocialNetworkIds() : []
  }

  const renderEditPanel = () => {
    if (unmountEditComponent) {
      return []
    }

    const messages = getMessages(getComposerMessageState())

    return [
      <MessageEditArea
        isOriginContentLab={isOriginContentLab}
        addProfile={addProfile}
        closeComposerConfirm={closeComposerConfirm}
        csrf={csrf}
        customContext={customContext}
        entitlements={entitlements}
        excludedNetworkTypes={excludedNetworkTypes}
        facadeApiUrl={facadeApiUrl}
        fetchPreviewData={fetchPreviewData}
        flux={flux}
        ignoredPreviewValidationMessageCodes={ignoredPreviewValidationMessageCodes}
        isBulkComposer={mode === ComposerConstants.MODE.BULK_COMPOSER} // TODO: temporary prop until we have support for FB albums
        isEditOnly={mode === ComposerConstants.MODE.COMPOSER}
        isEditMode={isEditMode}
        isSocialProfileSelectorDisabled={isSocialProfileSelectorDisabled}
        isUsingLATM={isUsingLATM}
        language={language}
        key="messageEditArea"
        label="Edit Message Area"
        linkShorteners={linkShorteners}
        maxScheduledMessages={entitlements[SCHEDULE_MESSAGES]}
        memberId={memberId}
        messages={messages}
        mode={editMode}
        numberOfMessagesSelected={selectedMessageIds.length}
        onAddAttachment={onAddAttachment}
        onAddIgnoredPreviewValidationMessageCode={onAddIgnoredPreviewValidationMessageCode}
        onChangePreset={onChangePreset}
        onChangeText={
          mode === ComposerConstants.MODE.BULK_COMPOSER ? debounceOnChangeText : onChangeMessageText
        }
        onCreateBoardComplete={onCreateBoardComplete}
        onFetchSocialProfiles={onFetchSocialProfiles}
        onAttachmentEdited={onAttachmentEdited}
        onLinkPreviewChange={onLinkPreviewChange}
        onManageTags={renderTagManager}
        onModeChange={onModeChange}
        onScheduleAll={scheduleAllMessages}
        onToggleMediaLibrary={onToggleMediaLibrary}
        onUploadQueueComplete={onUploadQueueCompleteFunc}
        organizations={organizations}
        selectedMessageForEdit={getSelectedMessageForEdit()}
        selectedOrganization={selectedOrganization}
        selectedPublishTime={selectedPublishTime}
        selectedSocialNetworkIds={getSelectedProfileIds()}
        shortenerConfigs={shortenerConfigs} // Remove with PUB_30814_LINK_PRESETS_USE_REDUX
        socialNetworks={socialNetworks}
        suggestedTags={suggestedTags}
        tags={tags}
        timezoneName={timezoneName}
        totalScheduledMessages={totalScheduledMessages}
        trackingContext={trackingContext}
        uploadingFiles={uploadingFiles}
        hasAlbumTargetingWarning={hasAlbumTargetingWarning()}
        showOnboarding={showOnboarding}
        onTrackMediaUploadError={onTrackMediaUploadError}
        onClickHashtagButton={onToggleHashtagPanel}
        isHashtagPanelOpen={isHashtagPanelOpen}
        isAIPanelOpen={isAIPanelOpen}
        onClickAIButton={onToggleAIPanel}
      />,
    ]
  }

  const renderMediaLibraryPanel = () => {
    return (
      <MediaLibrary
        key="mediaLibrary"
        onAddAttachment={onAddAttachment}
        onClose={onToggleMediaLibrary}
        onExitComposer={onClose}
        onMinimize={onMinimize}
        selectedOrganization={selectedOrganization}
        supportDragAndDrop={false}
        showCloseOption={true}
      />
    )
  }

  const renderPreviewPanel = () => {
    if (isMediaLibraryOpen || isHashtagPanelOpen || isAIPanelOpen) {
      return null
    }
    const previewConfig = get(composerConf, 'messagePreviewArea')
    const isDisabled = previewConfig?.isDisabled

    return [
      <MessagePreviewArea
        customContext={customContext}
        ignoredPreviewValidationMessageCodes={ignoredPreviewValidationMessageCodes}
        isBulkComposer={false}
        isDisabled={isDisabled}
        key="messagePreviewArea"
        onAddIgnoredPreviewValidationMessageCode={onAddIgnoredPreviewValidationMessageCode}
      />,
    ]
  }

  const renderDashboardPanel = () => {
    const messages = getMessages(getComposerMessageState())
    const id = getSelectedMessageValue(getComposerMessageState(), 'id')

    return [
      <MessageDashboard
        allMessagesSelected={allMessagesSelected}
        key="messageDashboard"
        loadMore={onLoad}
        maxMessages={messages.length}
        messages={messages.slice(0, maxMessagesLoaded)}
        multipleSelectMode={editMode === Constants.BULK_COMPOSER_EDIT_MODES.MULTIPLE}
        numberOfErrors={messages.filter(m => m.hasErrors()).length}
        onDiscard={onDiscardMessage}
        onEditSelect={onEditSelect}
        onSelect={onSelect}
        onSelectAll={onSelectAll}
        selectedMessageForEditId={id}
        selectedMessageIds={selectedMessageIds}
        timezoneName={timezoneName}
      />,
    ]
  }

  const renderAIPanel = () => <AIPanel key="AIPanel" onClose={onToggleAIPanel} />

  const renderOnePanel = contents => {
    return (
      <Panel key="onePanel1" width="100%">
        {contents}
      </Panel>
    )
  }

  const renderTwoPanel = () => {
    const messages = getMessages(getComposerMessageState())
    let panels
    // Bulk Composer is a special case since we never want the list to go away even if there is one one message left
    if (mode === ComposerConstants.MODE.BULK_COMPOSER) {
      panels = [renderDashboardPanel(), renderEditPanel()]
    } else if (mode === ComposerConstants.MODE.COMPOSER) {
      if (messages.length > 1) {
        panels = [renderEditPanel(), renderPreviewPanel()]
      } else {
        panels = [renderEditPanel(), renderPreviewPanel()]
      }
    }

    return [
      <Panel key="twoPanel1" ref={node => calcMediaLibraryPanelHeight(node)}>
        {panels[0]}
      </Panel>,
      <Panel key="twoPanel2" maxWidth={'650px'}>
        <ComposerPreviewsLoader />
        {panels[1]}
        {isMediaLibraryOpen ? renderMediaLibraryPanel() : null}
        {isHashtagPanelOpen
          ? [<HashtagSuggestionPanel key="hashtagPanel" onToggleHashtagPanel={onToggleHashtagPanel} />]
          : null}
        {isAIPanelOpen ? renderAIPanel() : null}
      </Panel>,
    ]
  }

  const renderBulkComposer = {
    bulkComposerState: bulkComposerState,
    selectedMessageIds: selectedMessageIds,
  }
  const isBulkComposer = mode === ComposerConstants.MODE.BULK_COMPOSER
  const renderPanels = useCallback(() => {
    let panels = []

    const messages = getMessages(getComposerMessageState())
    if (messages && messages.length > 0) {
      panels = renderTwoPanel()
    } else if (state === ComposerConstants.STATE.PRECOMPOSE) {
      panels = renderOnePanel(preCompose())
    } else if (state === ComposerConstants.STATE.POSTCOMPOSE) {
      panels = renderOnePanel(postCompose())
    }

    return panels
  }, [
    isSequentialPostingInProgress,
    isBulkComposer ? unmountEditComponent : null,
    isHashtagPanelOpen,
    isMediaLibraryOpen,
    isAIPanelOpen,
    campaignId,
    mode,
    editMode,
    tags,
    suggestedTags,
    mode === ComposerConstants.MODE.BULK_COMPOSER ? getSelectedProfileIds() : null,
    mode === ComposerConstants.MODE.BULK_COMPOSER ? selectedMessageIds : null,
  ])
  const getNonPrivateSocialNetworkIds = () => {
    return selectedMessageForEdit.getNonPrivateSocialNetworkIds
  }

  const getSelectedSocialNetworksTotal = () => {
    /*
     * The number next to "Schedule" button means different things for Pinterest new composer compared to other new composes.
     * It shows the number of boards (publishing targets) a user is posting to for Pinterest, and shows the number of social networks
     * a user is posting to for other channels.  In the future we might want to generalize this for all channels with the concept
     * of publishing targets. See notes in STRAT-1035.
     */

    if (!selectedMessageForEdit) {
      return 0
    }

    let selectedSocialNetworksTotal = selectedMessageForEdit.socialNetworksKeyedById.size

    if (ComposerUtils.isPinterestComposer(customContext)) {
      const baseMessage = selectedMessageForEdit.baseMessage
      selectedSocialNetworksTotal =
        baseMessage.extendedInfo && baseMessage.extendedInfo.boards
          ? baseMessage.extendedInfo.boards.length
          : 0
    }

    return selectedSocialNetworksTotal
  }

  const getFooter = useCallback(() => {
    let selectedTwitterProfiles
    if (mode === ComposerConstants.MODE.COMPOSER && selectedMessageForEdit) {
      const selectedProfiles = _.pluck(
        values(selectedMessageForEdit.socialNetworksKeyedById.toJS()),
        'socialNetworkId',
      )
      const twitterProfiles = filter(
        socialNetworks,
        sn => sn.type === SocialProfileConstants.SN_TYPES.TWITTER,
      )
      selectedTwitterProfiles = compact(
        map(twitterProfiles, socialProfile =>
          selectedProfiles && includes(selectedProfiles, socialProfile.socialNetworkId)
            ? socialProfile
            : null,
        ),
      )
    }

    let hasErrors =
      !selectedMessageForEdit ||
      selectedMessageForEdit.hasErrors() ||
      selectedMessageForEdit.isEmpty() ||
      isSendingMessage ||
      isUploading ||
      (!isFeatureEnabled('ALLOW_TWITTER_MULTI_POST') &&
        mode === ComposerConstants.MODE.COMPOSER &&
        selectedTwitterProfiles.length > 1) ||
      (selectedTwitterProfiles && selectedTwitterProfiles.length > 0) ||
      hasAlbumTargetingWarning()

    const shouldShowFooter =
      (selectedMessageForEdit && mode === ComposerConstants.MODE.COMPOSER) ||
      (selectedMessageForEdit &&
        mode === ComposerConstants.MODE.BULK_COMPOSER &&
        selectedMessageIds.length < 1)
    let footer
    if (shouldShowFooter) {
      const selectedCampaign = getCampaignById(selectedMessageForEdit.campaignId)
      const sendDate = selectedMessageForEdit.sendDate || undefined

      if (selectedCampaign) {
        // Only allow send now if the current date is with in the campaign
        hasErrors = hasErrors || (sendDate && !selectedCampaign.isDateInCampaign(getSendDate(sendDate)))
      }

      const selectedSocialNetworksTotal = getSelectedSocialNetworksTotal()
      const selectedProfileIds = getSelectedProfileIds()

      const isDraft = !!(selectedMessageForEdit && ComposerUtils.isDraft(selectedMessageForEdit.messageType))

      const isInstagramStory =
        selectedMessageForEdit?.postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY
      footer = (
        <ComposerFooter
          autoScheduleSettings={autoScheduleSettings}
          entitlements={entitlements}
          canSendNow={
            selectedCampaign ? canSendNow && selectedCampaign.isDateInCampaign(new Date()) : canSendNow
          }
          closeComposer={closeComposer}
          createDraftOnClick={createDraftOnClick}
          datesEnabledForScheduling={datesEnabledForScheduling}
          flux={flux}
          footerConf={composerConf && composerConf.footer}
          getNonPrivateSocialNetworkIds={getNonPrivateSocialNetworkIds}
          canSendToAmplify={canSendToAmplify}
          isAutoScheduledEnabled={isAutoScheduledEnabled}
          isBulkComposer={mode === ComposerConstants.MODE.BULK_COMPOSER}
          isDisabled={hasErrors}
          isDraft={isDraft}
          isEditMode={isEditMode}
          isInstagramStory={isInstagramStory}
          isPinterest={ComposerUtils.isPinterestComposer(customContext)}
          isAmplify={ComposerUtils.isAmplifyComposer(customContext)}
          isAmplifyEditPost={ComposerUtils.isAmplifyEditPostComposer(customContext)}
          isTemplate={ComposerUtils.isTemplate(selectedMessageForEdit.messageType)}
          isUsingLATM={isUsingLATM}
          isVideoMessage={selectedMessageForEdit.hasVideoAttachment()}
          key="publisherComposerFooter"
          memberId={memberId}
          memberInTrial={memberInTrial}
          memberSignupDate={memberSignupDate}
          messageState={selectedMessageForEdit.state}
          messageType={selectedMessageForEdit.messageType}
          maxScheduledMessages={entitlements[SCHEDULE_MESSAGES]}
          onFetchSocialProfiles={onFetchSocialProfiles}
          onSaveTemplate={onSaveTemplate ? validateTemplate : null}
          onSendToAmplify={onSendToAmplify}
          onUpdatePublishTime={onUpdatePublishTime}
          onUpdateScheduleDate={onUpdateScheduleDate}
          renderDraftSharingWarning={renderDraftSharingWarning}
          selectedOrganization={selectedOrganization}
          selectedProfileIds={selectedProfileIds}
          selectedSocialNetworksTotal={selectedSocialNetworksTotal}
          sendDate={sendDate}
          willSendMessage={willSendMessage}
          shouldCheckContentLibraryAccess={true}
          showAutoScheduleSettings={showAutoScheduleSettings}
          templateData={templateData}
          timezoneName={timezoneName}
          toTemplateData={toTemplateData}
          totalScheduledMessages={totalScheduledMessages}
          updateDraftOnClick={updateDraftOnClick}
        />
      )
    }
    return footer
  }, [selectedMessageForEdit?.sendDate, datesEnabledForScheduling])
  const getBelowPanels = () => [getFooter()]

  return (
    <div className="rc-Composer">
      <TrackValidationErrors />
      <DraftJSGlobalStyle />
      <DraftJSMentionGlobalStyle />
      <ComposerModal
        getAbovePanels={getAbovePanels}
        getBelowPanels={getBelowPanels}
        onClose={onClose}
        zIndex={zIndex}
        renderBulkComposer={isBulkComposer ? renderBulkComposer : undefined} // here to force rerender for bulk composer
      >
        {renderPanels}
      </ComposerModal>
    </div>
  )
}

const ConnectedComposer = compose(
  reduxConnect(({ composer, validation }: RootState) => ({
    checkPredictiveComplianceAndSend: composer.checkPredictiveComplianceAndSend,
    isSendingMessage: composer.isSendingMessage,
    isSequentialPostingInProgress: composer.isSequentialPostingInProgress,
    isUploading: composer.isUploading,
    uploadingFiles: composer.uploadingFiles,
    ignoredPreviewValidationMessageCodes: validation.ignoredPreviewValidationMessageCodes,
    showOnSubmitErrors: validation.showOnSubmitErrors,
  })),
  connect(composerMessageStore, state => ({
    fieldValidations: getSelectedMessageValue(state, 'fieldValidations', false, {}),
    selectedMessageForEdit: getSelectedMessage(state),
    selectedMessageCount: getSelectedMessageValue(state, 'messages', false, []).length,
  })),
  connect(composerModalStore, state => ({
    isMinimized: state.isMinimized,
  })),
  connect(mediaLibraryStore, state => ({
    isMediaLibraryOpen: state.isMediaLibraryOpen,
  })),
  connect(complianceStore, state => ({
    predictiveComplianceStatus: state.status,
    isPredictiveComplianceEnabled: state.isEnabled,
  })),
)(ComposerFunctional)

export default ConnectedComposer
