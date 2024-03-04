import React from 'react'
import ReactDOM from 'react-dom'
import loadable from '@loadable/component'

import merge from 'deepmerge'
import { cloneDeep, debounce, filter, get, isEmpty, isEqual, isNil, over, pick } from 'lodash'
import moment from 'moment-timezone'
import { connect as reduxConnect } from 'react-redux'
import _ from 'underscore'

import axios from 'fe-axios'
import { TYPE_WARNING } from 'fe-comp-banner'
import { P } from 'fe-comp-dom-elements'
import { DraftJSGlobalStyle } from 'fe-draft-js'
import { DraftJSMentionGlobalStyle } from 'fe-draft-js-mention-plugin'
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
  actions as ComposerMessageActions,
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
import translation from 'fe-pnc-lib-hs-translation'
import { observeStore } from 'fe-pnc-lib-store-observer'
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
  AdPromotionCreateBoostCampaignRequest,
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
import statusObject, { StatusObject } from '@/utils/status-bar'
import StatusToastUtils from '@/utils/status-toast-utils'
import { track } from '@/utils/tracking'

import ValidationUtils, { NoPinterestBoardError, NoProfilesError } from '@/utils/validation-utils'
import {
  reloadAllPinterestBoards,
  loadAllPinterestBoards,
  handleCreateBoardComplete,
} from '../../utils/pinterest-utils'
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

const noop = () => {}

const MEDIA_UPLOAD_IN_PROGRESS_TOAST_TITLE = translation._('Media upload in progress')
// prettier-ignore
// L10N: %s can be either of these two values: scheduling or publishing
const MEDIA_UPLOAD_IN_PROGRESS_TOAST_MESSAGE = translation._("Please wait until your media has finished uploading before %s your post")
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
  composerConf?: Record<any, any>
  createDraftOnClick?: () => void
  csrf: string
  customContext?: string
  dispatch: AppDispatch
  entitlements: Entitlements
  excludedNetworkTypes?: Array<any>
  expired?: Array<any>
  facadeApiUrl: string
  fetchPreviewData?: () => void
  flux: Flux
  footer?: Record<any, any>
  header?: Record<any, any>
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
  mediaLibraryPanelHeight?: number // the media library panel height is calculated dynamically based on the other panels but it can also be set
  mediaLibrarySelectedSourceKey?: string
  memberId: number
  memberInTrial: boolean
  memberSignupDate: string
  memberName?: string
  messages: Array<Record<any, any>>
  mode: keyof typeof ComposerConstants.MODE
  onClose: () => void
  onMinimize?: () => void
  onSaveTemplate?: (templateData: any) => Promise<void>
  onSelectNewOrganization?: () => void
  onSendToAmplify?: () => void
  organizations: Array<any>
  panels?: Array<any> // change to array of composer panels when removing MODULAR_PRESETS
  pinterestBoards?: Array<any>
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
}

interface ComposerState {
  allMessagesSelected: boolean
  boostCampaign: AdPromotionCreateBoostCampaignRequest
  campaignId: string
  closeButtonHover: boolean
  editMode: string
  hasVideoInPreview: boolean
  isHashtagPanelOpen: boolean
  isMediaLibraryOpen: boolean
  isMinimized: boolean
  isPredictiveComplianceEnabled: boolean
  maxMessagesLoaded: number
  mediaLibraryPanelHeight: number
  mediaLibraryMinimizeState: boolean
  mediaUploadErrorTracked: Record<string, any>
  predictiveComplianceStatus: string
  selectedMessageIds: Array<number>
  selectedPublishTime: string
  showMediaLibrary: boolean
  shouldShowMinimizeOnboarding: boolean
  selectedMessageCount: number
  sendDate: Date
  suggestedTags: Array<unknown>
  tags: Array<unknown>
  totalScheduledMessages: number
  unmountEditComponent: boolean
}

// Initialize Composer Stores
createMessagePreviewsStore(ComposerConstants.MESSAGE_PREVIEWS_STORE_NAME)

// eslint-disable-next-line valid-jsdoc
/**
 * A Composer is a generic area for creating messages for arbitrary social profiles or collections of social profiles.
 * Composers provide a few features common to all composers (minimize, flyouts, layout, etc.), and are passed modules for custom functionality.
 * The current modules are header and footer, and the panels within compose. They are layed out as follows:
 * ---------header----------
 * |       |       |       |
 * |panel 1|  ...  |panel n|
 * |       |       |       |
 * ---------footer----------
 * Each panel gets an equal share of the width, and the composers width is *most* of the window (window minus sidebar, this may change without notice).
 * Panel height is arbitrary - Composer will ensure their content is y scrollable, and it's common to overfill the visible height of a panel.
 * Header and footer get 100% of the width, but the height is customizable.
 *
 * Currently, if you do not pass in any modules, then the default modules are used. This is the full-screen-compose experience reachable from the dashboard.
 */
export class Composer extends React.Component<ComposerProps, ComposerState> {
  readonly composerMessageActions: typeof ComposerMessageActions

  static displayName = 'Composer'

  static defaultProps = {
    addProfile: noop,
    autoScheduleSettings: {},
    bulkComposerState: undefined,
    bulkScheduleMessages: noop,
    closeComposer: noop,
    createDraftOnClick: noop,
    dispatch: action => action,
    entitlements: {},
    expired: undefined,
    fetchPreviewData: noop,
    ignoredPreviewValidationMessageCodes: [],
    isAutoScheduledEnabled: false,
    isEditMode: false,
    isSocialProfileSelectorDisabled: false,
    isUsingLATM: false,
    language: 'en',
    messages: [],
    onMinimize: noop, // optional because isMinimized is optional
    onSelectNewOrganization: noop,
    onSendToAmplify: noop,
    panels: [],
    postCompose: noop,
    preCompose: noop,
    previewDataFetchDebounceMilliseconds: 500,
    renderDraftSharingWarning: noop,
    scheduleMessage: noop,
    showAutoScheduleSettings: noop,
    showOnboarding: false,
    socialNetworks: [],
    templateData: {},
    updateDraftOnClick: noop,
    updateTotalScheduledMessages: noop,
    uploadingFiles: [],
  } as Partial<ComposerProps>

  unsubscribeObservers: Array<() => void>
  statusObject: StatusObject
  _refs: Record<string, unknown>
  _onUploadQueueComplete: () => void
  previewRequest: () => {
    fieldValidations: Array<FieldValidation>
  }
  longtaskObserver: LongtaskObserver

  constructor(props) {
    super(props)

    const selectedPublishTime = this._canSendNow(props)
      ? ComposerConstants.SCHEDULE_TIME.IMMEDIATE
      : ComposerConstants.SCHEDULE_TIME.SCHEDULE

    this.state = {
      allMessagesSelected: false,
      closeButtonHover: false,
      maxMessagesLoaded: Constants.BULK_PAGE_SIZE,
      mediaLibraryPanelHeight: props.mediaLibraryPanelHeight || 0,
      mediaLibraryMinimizeState: false,
      selectedPublishTime: selectedPublishTime,
      selectedMessageIds: [], // An array of selected message ids
      showMediaLibrary: false,
      totalScheduledMessages: -1,
      unmountEditComponent: false,
      shouldShowMinimizeOnboarding: false,
      isPredictiveComplianceEnabled: false,
      editMode: Constants.BULK_COMPOSER_EDIT_MODES.EDIT,
      selectedMessageCount: undefined,
      predictiveComplianceStatus: '',
      isMinimized: false,
      hasVideoInPreview: false,
      campaignId: undefined,
      tags: props.tags || [],
      suggestedTags: props.suggestedTags || [],
      boostCampaign: undefined,
      sendDate: undefined,
      isMediaLibraryOpen: false,
      mediaUploadErrorTracked: {},
      isHashtagPanelOpen: false,
    }

    this.unsubscribeObservers = [noop]

    // no need to handle case where header is not passed in, since header is skipping to the full version (vs the interim solution for panels)
    //eslint-disable-next-line react/no-direct-mutation-state
    this.state.header = React.cloneElement(props.header, {
      key: 'composer-header',
      onMinimize: this.onMinimize,
    })
    this._refs = {}
    this._onUploadQueueComplete = null
    this.longtaskObserver = null

    this.composerMessageActions = ComposerMessageActions

    // We want to make sure we're always using the same instance. This is important for dependency injection
    this.statusObject = statusObject

    if (this.props.previewDataFetchDebounceMilliseconds > 0) {
      this.fetchPreviewData = _.debounce(
        this.fetchPreviewData,
        this.props.previewDataFetchDebounceMilliseconds,
      )
    }

    // These events need to be defined here before the onProfileReauthorize function is triggered.
    on('socialNetwork:reauthorize:success', this.onProfileReauthSuccess)

    on('socialNetwork:addAccount:success', this.onAddAccount)

    on('composer.attachFile', this.attachFileFromSDK)

    this.boundRenderPanels = this.renderPanels.bind(this)

    this.observeStores()

    if (isFeatureEnabled('PGR_1939_KEYBOARD_SHORTCUTS')) {
      setupKeyboardShortcuts()
    }
  }

  getAbovePanels = () => [
    this.state.header,
    this.renderOrgSuspendedBanner(),
    this.renderScheduledMessagesBanner(),
    this.state.selectedMessageIds.length >= 1 ? this.renderMessageSelectionHeader() : null,
  ]

  getBelowPanels = () => [this.getFooter()]

  getSelectedMessageForEdit = (): Message => getSelectedMessage(getComposerMessageState())

  setUploadingFiles = (uploadingFiles: Array<UploadingFile>) =>
    this.props.dispatch(composerActions.setUploadingFiles(uploadingFiles))

  setIsUploading = (isUploading: boolean) => this.props.dispatch(composerActions.setIsUploading(isUploading))

  setIsSendingMessage = (isUploading: boolean) =>
    this.props.dispatch(composerActions.setIsSendingMessage(isUploading))

  setCheckPredictiveComplianceAndSend = (checkPredictiveComplianceAndSend: boolean) =>
    this.props.dispatch(composerActions.setCheckPredictiveComplianceAndSend(checkPredictiveComplianceAndSend))

  setSequentialPostingInProgress = (isSequentialPostingInProgress: boolean) =>
    this.props.dispatch(composerActions.setIsSequentialPostingInProgress(isSequentialPostingInProgress))

  setIsFetchingPinterestBoards = (isFetchingPinterestBoards: boolean) =>
    this.props.dispatch(composerActions.setIsFetchingPinterestBoards(isFetchingPinterestBoards))

  setShowOnSubmitErrors = (showOnSubmitErrors: boolean) =>
    this.props.dispatch(validationActions.setShowOnSubmitErrors(showOnSubmitErrors))

  uploadExternalMediaToS3 = ({ nativeMediaUrls, id }: Message) => {
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

      this.setIsUploading(true)
      this.setUploadingFiles([...imagePromises, ...videoPromises])

      Promise.all([...imagePromises, ...videoPromises])
        .then(s3Attachments => {
          const attachments = s3Attachments.map(s3Attachment => {
            if (s3Attachment?.thumbnailUrls?.length && !s3Attachment?.thumbnailUrl?.length) {
              s3Attachment.thumbnailUrl = s3Attachment?.thumbnailUrls?.[0]?.thumbnailUrl
            }

            return ComposerUtils.createAttachmentFromData(s3Attachment)
          })

          return this.composerMessageActions.updateFieldsById(id, {
            attachments,
          })
        })
        .then(this.fetchPreviewData)
        .catch(error => {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'An error occurred during media upload', {
            errorMessage: JSON.stringify(error.message),
            stack: JSON.stringify(error.stack),
          })

          this.statusObject.update(translation._('An error occurred while uploading media.'), 'error', true)
        })
        .finally(() => {
          this.setIsUploading(false)
          this.setUploadingFiles(INITIAL_UPLOADING_FILES_STATE)
        })
    }
  }

  componentDidMount() {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const isComposerMode = this.props.mode === ComposerConstants.MODE.COMPOSER
    const isNativePost = NativePostId.fromContent(selectedMessageForEdit?.id) instanceof NativePostId

    if (isNativePost && isComposerMode) {
      this.uploadExternalMediaToS3(selectedMessageForEdit)
    }

    const { fetchPreviewData, mode, updateTotalScheduledMessages } = this.props
    if (mode === ComposerConstants.MODE.COMPOSER) {
      this._retrieveTotalScheduledMessages()
      updateTotalScheduledMessages(this._retrieveTotalScheduledMessages)
      fetchPreviewData(this.fetchPreviewData)
    }

    reloadAllPinterestBoards(
      this.props.customContext,
      this.props.socialNetworks,
      this.props.selectedOrganization,
      this.statusObject,
      this.onFetchSocialProfiles,
      this.setIsFetchingPinterestBoards,
    )

    if (selectedMessageForEdit) {
      // If we loading for the first time and have a message with social networks just go and get the preview
      // Don't rely on componentWillReceiveProps for initial load as it can lead to timing issues
      if (selectedMessageForEdit.getSocialNetworkTypes().length) {
        if (!isPreviewFetchInProgress()) {
          // This is triggered when a message is initially opened from drafts/CL
          this.updateDeauthedProfileFieldValidations()
          this.updateInstagramPairingErrors()
          this.fetchPreviewData()
        }
      } else {
        this.updateGenericPreview(selectedMessageForEdit)
      }

      const presets: Array<Preset> = this.props.flux.getStore('presets').get() as Array<Preset>
      const messageText = selectedMessageForEdit.renderMessageText()
      const links: LinkSettings = LinkUtils.getAllLinkSettings(selectedMessageForEdit, messageText)

      if (
        this.props.mode !== ComposerConstants.MODE.BULK_COMPOSER &&
        Array.isArray(links) &&
        links.length > 0
      ) {
        let linkSettings = links

        if (Array.isArray(presets)) {
          let initialPreset: Preset
          if (this.props.isEditMode || ComposerUtils.isAmplifyComposer(this.props.customContext)) {
            initialPreset = presets.find(preset => preset.id === selectedMessageForEdit.linkSettingsPresetId)
          } else if (!ComposerUtils.isDraft(selectedMessageForEdit.messageType)) {
            initialPreset = presets.find(preset => preset.isDefault)
          }
          if (initialPreset) {
            this.onChangePreset(initialPreset)
            linkSettings = LinkSettingsUtils.applyPreset(initialPreset, links)
          }
        }

        // Rebuild the template based on the updated linkSettings
        this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, {
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
  }

  observeStores = () => {
    this.unsubscribeObservers = [
      observeStore(
        composerModalStore,
        isMinimized => this.setState({ isMinimized }, this.onIsMinimizedChange),
        state => state.isMinimized,
      ),
      observeStore(
        composerMessageStore,
        this.onMessagesCountChange,
        state => (state && state.messages.length) || 0,
      ),
      observeStore(
        composerMessageStore,
        (selectedMessageCount: number) => this.setState({ selectedMessageCount }),
        state => getSelectedMessageValue(state, 'messages', false, []).length,
      ),
      observeStore(composerMessageStore, this.onCampaignIdChange, this.selectCampaignIdFromSelectedMessage),
      observeStore(
        mediaLibraryStore,
        (isMediaLibraryOpen: boolean) => this.setState({ isMediaLibraryOpen }),
        state => state.isMediaLibraryOpen,
      ),
      observeStore(
        complianceStore,
        this.onComplianceStoreChange,
        state => pick(state, ['isEnabled', 'status']),
        isEqual,
      ),
      observeSelectedMessage(this.onSelectedMessageChange, this._hasMessageChanged),
      observeStore(
        composerMessageStore,
        (sendDate: Date) => this.setState({ sendDate }),
        state => getSelectedMessageValue(state, 'sendDate'),
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        (message: Message) => {
          message && this.setState({ boostCampaign: message.getBoostCampaign() })
        },
        state => getSelectedMessageValue(state),
        (nextMsg: Message, currMsg: Message) =>
          isEqual(nextMsg?.getBoostCampaign(), currMsg?.getBoostCampaign()),
      ),
      observeStore(
        composerMessageStore,
        (message: Message) => {
          message && this.setState({ hasVideoInPreview: message.hasVideoAttachment() })
        },
        state => getSelectedMessage(state),
        (nextMsg: Message, currMsg: Message) =>
          isEqual(nextMsg?.hasVideoAttachment(), currMsg?.hasVideoAttachment()),
      ),
    ]
  }

  componentDidUpdate(prevProps: ComposerProps, prevState: ComposerState) {
    const hasSelectedOrganizationChanged = !ComposerUtils.areOrganizationsEqual(
      prevProps.selectedOrganization,
      this.props.selectedOrganization,
    )
    if (hasSelectedOrganizationChanged) {
      this.unsubscribeObservers.forEach(fn => (typeof fn === 'function' ? fn() : 0))
      this.observeStores()

      reloadAllPinterestBoards(
        this.props.customContext,
        this.props.socialNetworks,
        this.props.selectedOrganization,
        this.statusObject,
        this.onFetchSocialProfiles,
        this.setIsFetchingPinterestBoards,
      )

      if (isFeatureEnabled('PUB_13776_PREDICTIVE_COMPLIANCE')) {
        if (this.props.selectedOrganization && this.props.selectedOrganization.organizationId) {
          getIsPredictiveComplianceEnabled(this.props.selectedOrganization.organizationId)
        }
      }
    }

    const haveSocialNetworksChanged = prevProps.socialNetworks.length !== this.props.socialNetworks.length
    if (haveSocialNetworksChanged) {
      loadAllPinterestBoards(
        this.props.socialNetworks,
        this.props.selectedOrganization,
        this.statusObject,
        this.onFetchSocialProfiles,
        this.setIsFetchingPinterestBoards,
      )
    }

    const haveSelectedSocialProfilesChanged =
      prevState.selectedMessageCount !== this.state.selectedMessageCount

    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (haveSelectedSocialProfilesChanged) {
      // Sets a default postType if an IG network is selected. Reset postType to null if there's no IG network
      if (selectedMessageForEdit) {
        const socialNetworkTypes = selectedMessageForEdit.getSocialNetworkTypes()
        const storePostType = getSelectedMessageValue(getComposerMessageState(), 'postType', false, null)
        if (ComposerUtils.hasInstagramNetwork(...socialNetworkTypes) && !storePostType) {
          this.composerMessageActions.updateFieldById(
            selectedMessageForEdit.id,
            'postType',
            DEFAULT_POST_TYPE,
          )
        } else if (!ComposerUtils.hasInstagramNetwork(...socialNetworkTypes)) {
          this.composerMessageActions.updateFieldById(selectedMessageForEdit.id, 'postType', null)
        }
      }

      if (this.state.selectedMessageCount === 0) {
        this.onUpdateFieldValidations({})
      }
      // This is triggerd when a user adds or remove a social profile
      this.updateDeauthedProfileFieldValidations()
      this.updateInstagramPairingErrors()
    }

    const haveCampaignsChanged = prevState.campaignId !== this.state.campaignId
    let updatedFieldValidations
    if (selectedMessageForEdit && this.props.mode === ComposerConstants.MODE.COMPOSER) {
      if (haveCampaignsChanged) {
        if (this.state.campaignId !== null && selectedMessageForEdit.sendDate !== null) {
          const sendDate = moment(
            selectedMessageForEdit.sendDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS,
          ).tz(this.props.timezoneName)
          const campaignDateError = ValidationUtils.getCampaignDateError({
            dateTime: sendDate,
            enabledDays: this.getDatesEnabledForScheduling(selectedMessageForEdit),
            minimumScheduleMinutes: selectedMessageForEdit.hasVideoAttachment()
              ? ComposerConstants.MINIMUM_SCHEDULE_MINUTES.VIDEO
              : ComposerConstants.MINIMUM_SCHEDULE_MINUTES.DEFAULT,
            timezoneName: this.props.timezoneName,
          })
          if (campaignDateError) {
            updatedFieldValidations = ValidationUtils.addCustomValidations(
              selectedMessageForEdit.fieldValidations,
              [campaignDateError],
              FIELD_VALIDATIONS.SEND_DATE,
              ComposerConstants.ERROR_LEVELS.ERRORS,
            )
          } else {
            updatedFieldValidations = ValidationUtils.removeCustomScheduleDateErrors(
              selectedMessageForEdit.fieldValidations,
            )
          }
        } else {
          updatedFieldValidations = ValidationUtils.removeCustomScheduleDateErrors(
            selectedMessageForEdit.fieldValidations,
          )
        }
      }

      const boostCampaign = prevState.boostCampaign
      const newBoostCampaign = this.state.boostCampaign
      if (!!newBoostCampaign || !!selectedMessageForEdit.getSavedBoostCampaign()) {
        const isSendDateChanged = !_.isEqual(prevState.sendDate, this.state.sendDate)
        const isVideoAttachmentUpdated = prevState.hasVideoInPreview !== this.state.hasVideoInPreview
        const isCampaignUpdated = !_.isEqual(JSON.stringify(boostCampaign), JSON.stringify(newBoostCampaign))
        if (isCampaignUpdated || isSendDateChanged || isVideoAttachmentUpdated) {
          const fieldValidations = updatedFieldValidations || selectedMessageForEdit.fieldValidations
          updatedFieldValidations = ValidationUtils.validateBoostCampaign(
            fieldValidations,
            newBoostCampaign || selectedMessageForEdit.getSavedBoostCampaign(),
            {
              isVideoMessage: selectedMessageForEdit.hasVideoAttachment(),
              sendDate: this.state.sendDate,
              ...(selectedMessageForEdit.attachments && {
                attachment: selectedMessageForEdit.attachments[0],
              }),
            },
          )
        }
      }

      if (!newBoostCampaign && boostCampaign) {
        const fieldValidations = updatedFieldValidations || selectedMessageForEdit.fieldValidations
        updatedFieldValidations = ValidationUtils.validateBoostCampaign(fieldValidations, undefined, {})
      }

      if (updatedFieldValidations) {
        this.onUpdateFieldValidations(updatedFieldValidations)
      }
    }

    const isSequentialPostingInProgress = this.props.isSequentialPostingInProgress

    // once the new empty message is created and the state is reset, then turn off sequential posting flag
    if (isSequentialPostingInProgress) {
      // Add setTimeout to make sure that all observers get the change event
      setTimeout(() => this.setSequentialPostingInProgress(false), 0)
    }
    if (this.props.header !== prevProps.header) {
      this.setHeader()
    }

    if (this.state.totalScheduledMessages !== -1) {
      const maxScheduledMessages = this.props.entitlements.SCHEDULE_MESSAGES
      const maxScheduledMessagesReached = this.state.totalScheduledMessages >= maxScheduledMessages
      updatePendoVisitorMetadata({
        data: { has_reached_max_scheduled_messages: maxScheduledMessagesReached },
      })
    }

    if (isSequentialPostingInProgress && !prevProps.isSequentialPostingInProgress) {
      this.nextSequentialPost()
    }
  }

  setHeader = () => {
    this.setState({
      header: React.cloneElement(this.props.header, {
        key: 'composer-header',
        onMinimize: this.onMinimize,
      }),
    })
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(newProps) {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const editMode = this._determineEditMode(!!selectedMessageForEdit, getMessages(getComposerMessageState()))
    if (editMode !== this.state.editMode) {
      this.setState({
        editMode,
      })
    }

    if (
      (Array.isArray(newProps.tags) && this.state.tags.length !== newProps.tags.length) ||
      !isEqual(this.state.tags, newProps.tags)
    ) {
      this.setState({ tags: newProps.tags })
    }
    if (
      (Array.isArray(newProps.suggestedTags) &&
        this.state.suggestedTags.length !== newProps.suggestedTags.length) ||
      !isEqual(this.state.suggestedTags, newProps.suggestedTags)
    ) {
      this.setState({ suggestedTags: newProps.suggestedTags })
    }
  }

  componentWillUnmount() {
    over(this.unsubscribeObservers)()

    if (isFeatureEnabled('PUB_13776_PREDICTIVE_COMPLIANCE')) {
      resetPredictiveCompliance()
    }

    if (isFeatureEnabled('PGR_1939_KEYBOARD_SHORTCUTS')) {
      cleanupKeyboardShortcuts()
    }

    mediaLibraryActions.reset()

    this.resetLocations()

    dashboardCancelRequests()
    mediaStreamingCancelRequests()
    authoringCancelRequests()

    this.setShowOnSubmitErrors(false)
    ValidationUtils.clearErrorsRendered()

    off('socialNetwork:reauthorize:success', this.onProfileReauthSuccess)
    off('socialNetwork:addAccount:success', this.onAddAccount)
    off('composer.attachFile', this.attachFileFromSDK)

    const uploadingFiles = this.props.uploadingFiles

    // Add timeout to fix issue where uploadingFiles state
    // was not being set back to empty array
    setTimeout(() => {
      if (uploadingFiles.length) {
        this.setUploadingFiles(INITIAL_UPLOADING_FILES_STATE)
        this.setIsUploading(false)
      }
    }, 0)
  }

  onMessagesCountChange = (messageCount: number) => {
    if (messageCount === 0) {
      this.setState({
        allMessagesSelected: false,
        closeButtonHover: false,
        maxMessagesLoaded: Constants.BULK_PAGE_SIZE,
        editMode: Constants.BULK_COMPOSER_EDIT_MODES.QUICK_SCHEDULE,
        selectedMessageIds: [], // An array of selected message ids
        unmountEditComponent: false,
      })
    } else {
      const selectedMessageForEdit = this.getSelectedMessageForEdit()
      this.setState({
        editMode: this._determineEditMode(!!selectedMessageForEdit, getMessages(getComposerMessageState())),
      })
    }
  }

  onIsMinimizedChange = () => {
    // When isMinimized is removed from composer remove the connection to the store in full-screen-composer
    if (!this.state.isMinimized) {
      // on Maximize re-open Media Library if it was open and perform a search
      mediaLibraryActions.setIsMediaLibraryOpen(this.state.mediaLibraryMinimizeState)

      if (this.state.mediaLibraryMinimizeState) {
        // only do the search if the media library is open

        mediaLibraryActions.fetchMedia().catch(() => {
          // don't show the error if they've closed composer since starting the request
          if (this.state.mediaLibraryMinimizeState) {
            this.statusObject.update(translation._('Unable to find more media.'), 'error', true)
          }
        })
      }
    }
  }

  onCampaignIdChange = campaignId => {
    this.setState({ campaignId }, () => {
      if (campaignId) {
        this.applyCampaignSettings(campaignId)
      }
    })
  }

  selectCampaignIdFromSelectedMessage = state => getSelectedMessageValue(state, 'campaignId')

  onSelectedMessageChange = (selectedMessage: Message, prevMessage: Message, hasMessageChanged: boolean) => {
    if (selectedMessage) {
      const haveSelectedChannelsChanged = this._haveSelectedChannelsChanged(prevMessage, selectedMessage)
      const selectedChannelCount = selectedMessage.getSocialNetworkTypes().length

      const shouldUpdatePreviewData = haveSelectedChannelsChanged || hasMessageChanged

      if (haveSelectedChannelsChanged) {
        this.resetLocations()
      }

      if (selectedChannelCount === 0) {
        const messagePreviewState: PreviewsState = getMessagePreviewsState()
        if (
          Array.isArray(messagePreviewState.previewMessages) &&
          messagePreviewState.previewMessages.length > 0
        ) {
          MessagePreviewsActions.resetPreviews()
        }
        this.updateGenericPreview(selectedMessage)
      } else if (shouldUpdatePreviewData) {
        if (isPreviewFetchInProgress) {
          cancelPreviewRequest()
        }
        this.fetchPreviewData()

        const showOnSubmitErrors = this.props.showOnSubmitErrors
        if (showOnSubmitErrors === true) {
          this.setShowOnSubmitErrors(false)
        }
      }
    }
  }

  onComplianceStoreChange = ({ isEnabled, status }) => {
    if (isFeatureEnabled('PUB_13776_PREDICTIVE_COMPLIANCE')) {
      this.setState(
        {
          isPredictiveComplianceEnabled: isEnabled,
          predictiveComplianceStatus: status,
        },
        () => {
          const checkPredictiveComplianceAndSend = this.props.checkPredictiveComplianceAndSend
          if (checkPredictiveComplianceAndSend) {
            const { isWarning, isPending, isApproved, isInProgress } = PredictiveComplianceUtils.getState(
              this.state.predictiveComplianceStatus,
            )
            if (!isInProgress && (isWarning || isPending || isApproved)) {
              this.setIsSendingMessage(true)
              this.setCheckPredictiveComplianceAndSend(false)
              const selectedMessageForEdit = this.getSelectedMessageForEdit()
              this.onSendMessage(selectedMessageForEdit)
            }
          }
        },
      )
    }
  }

  /**
   * Prepares the message for the next sequential post e.g. Post and Reuse accounts
   */
  nextSequentialPost = () => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
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
    this.composerMessageActions.set([
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
    this.composerMessageActions.selectById(NEW_MESSAGE_ID)

    // update base message (Initial Content)
    const updates = {
      template: '',
      locations: {},
      targeting: {},
      linkSettings: null,
    }

    this.composerMessageActions.updateFieldsById(NEW_MESSAGE_ID, updates)

    // Clear out location and targeting component
    this.resetLocations()

    liTargetActions.reset()
    fbTargetActions.reset()
  }

  _canSendNow({ isEditMode = false, mode }) {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const isDraft = !!(selectedMessageForEdit && ComposerUtils.isDraft(selectedMessageForEdit.messageType))

    const isInSendNowEditState =
      selectedMessageForEdit &&
      (MessageUtils.isPendingState(selectedMessageForEdit.state) ||
        MessageUtils.isRejectedState(selectedMessageForEdit.state))

    return mode === ComposerConstants.MODE.COMPOSER && (!isEditMode || isInSendNowEditState || isDraft)
  }

  _retrieveTotalScheduledMessages = () => {
    getMessageLimit({
      logging: {
        category: LOGGING_CATEGORIES.NEW_COMPOSER,
        message: 'Failed to get total number of scheduled messages',
      },
    })
      .then(data => {
        if (get(data, ['limit', 'pendingMessageCount'], false)) {
          this.setState({ totalScheduledMessages: data.limit.pendingMessageCount })
        }
      })
      .catch(e => {
        if (!axios.isCancel(e)) {
          this.statusObject.update(
            translation._('Could not get total number of scheduled posts'),
            'error',
            true,
          )
        }
      })
  }

  hasAlbumTargetingWarning() {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (selectedMessageForEdit) {
      const { albumType } = selectedMessageForEdit
      const isCustomAlbumSelected =
        albumType && !(albumType === FacebookAlbumPickerConstants.ALBUM_TYPES.WALL)

      return selectedMessageForEdit.hasFacebookTargeting() && isCustomAlbumSelected
    } else {
      return false
    }
  }

  /**
   * Determines the edit mode (excluding preview)
   * @param {boolean} hasSelectedMessageForEdit
   * @param {Object[]} messages
   * @returns {undefined|string}
   * @private
   */
  _determineEditMode(hasSelectedMessageForEdit, messages) {
    const modes = Constants.BULK_COMPOSER_EDIT_MODES

    if (this.state.selectedMessageIds.length >= 1) {
      return modes.MULTIPLE
    }

    if (hasSelectedMessageForEdit) {
      return this.state.editMode === modes.PREVIEW ? modes.PREVIEW : modes.EDIT
    }

    if (Array.isArray(messages) && messages.filter(m => m.hasErrors()).length > 0) {
      return modes.ERRORS
    }

    return modes.QUICK_SCHEDULE
  }

  resetLocations = () => {
    TwitterLocationActions.reset()
  }

  // For each social network selected (ie. each message in the Inner Message),
  // store its array of attachments, keeping track of which social network it belongs to.
  getAttachmentsFromEachInnerMessage = (innerMessages = []) => {
    const innerMessageAttachments = {}
    innerMessages.forEach(msg => {
      innerMessageAttachments[msg.snId] = msg.attachments
    })
    return innerMessageAttachments
  }

  fetchPreviewData = () => {
    const includeOrganizationInPreviewRequest = this.props.mode === ComposerConstants.MODE.COMPOSER
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    // Remove Invalid URl validation before fetching previews
    const updatedFieldValidations = ValidationUtils.removeErrors(
      selectedMessageForEdit?.baseMessage?.fieldValidations,
      [CUSTOM_ERRORS.FE_INVALID_URL],
    )
    this.onUpdateFieldValidations(updatedFieldValidations)

    let organization
    if (includeOrganizationInPreviewRequest) {
      organization = this.props.selectedOrganization
    }

    MessagePreviewsActions.setIsFetchingPreview(true)

    if (!selectedMessageForEdit) {
      this.receivePreviewError()
      return
    }

    // PNP validation for Instagram Stories accepts either a boards or an attachment field,
    // so will fail if the attachments field is not removed. Since the frontend still uses
    // attachments for preview logic, we cache them and add them back in after toPreviewRequest()
    // converts them to boards then deletes them.
    // This is so we don't have to duplicate all the attachments preview logic code.
    const cachedAttachments = this.getAttachmentsFromEachInnerMessage(selectedMessageForEdit.messages)
    const previewRequest = selectedMessageForEdit.toPreviewRequest(
      this.props.timezoneName,
      organization ? organization.organizationId : null,
      this.props.mode === ComposerConstants.MODE.BULK_COMPOSER,
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
      this.onUpdateFieldValidations(invalidURLValidation.fieldValidations)
      this.clearPreviewRequest()
      MessagePreviewsActions.setIsFetchingPreview(false)
    } else {
      this.previewRequest = getPreview(previewRequest)
        .then(data => {
          this.clearPreviewRequest()
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
            return this.receivePreviewData(data)
          }
          addCallout(errorToast())
          MessagePreviewsActions.setIsFetchingPreview(false)

          return null
        })
        .catch(e => {
          if (!axios.isCancel(e)) {
            this.receivePreviewError(e)
          }
        })
    }
  }

  receivePreviewData = async (data: PreviewData = {}) => {
    const { mode, timezoneName, customContext } = this.props
    let selectedMessageForEdit = this.getSelectedMessageForEdit()
    const isComposerMode = this.props.mode === ComposerConstants.MODE.COMPOSER
    const isNativePost = NativePostId.fromContent(selectedMessageForEdit?.id) instanceof NativePostId
    let attachmentWarnings = [] as Array<MessageValidationError>
    let attachmentInfo = [] as Array<MessageValidationError>

    MessagePreviewsActions.setIsFetchingPreview(false)

    if (data.sanitizedMessages) {
      // Rasterize the message of each preview message, by converting the string message into an array of elements
      // text will become text nodes, and mentions, hashtags, links, etc will become react elements
      if (mode === ComposerConstants.MODE.COMPOSER) {
        await this.composerMessageActions.updateMessagesFromPreview(
          selectedMessageForEdit.id,
          data,
          ComposerUtils.createAttachmentFromData.bind(ComposerUtils),
        )

        // This is a hack to fix the assumption that selectedMessageForEdit gets updated immediately after updateMessagesFromPNP
        selectedMessageForEdit = this.getSelectedMessageForEdit()
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
          this.composerMessageActions.updateFieldById(
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

          if (!this.state.mediaUploadErrorTracked[code]) {
            track(
              'web.publisher.' +
                this.props.trackingContext +
                `${this.props.isEditMode ? '.edit_message' : '.create_message'}`,
              'upload_video_errors',
              { logDescription: code },
            )
            this.setState({
              mediaUploadErrorTracked: {
                ...this.state.mediaUploadErrorTracked,
                [code]: true,
              },
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

      this.clearPreviewRequest()
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
    } else if (!_.isEmpty(selectedMessageForEdit.fieldValidations)) {
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

    this.onUpdateFieldValidations(updatedFieldValidations)

    return data
  }

  clearPreviewRequest = () => {
    this.previewRequest = null
  }

  receivePreviewError = (e?) => {
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

    this.clearPreviewRequest()
  }

  /**
   * This function is triggered from the 'socialNetwork:addAccount:success' hootbus event and is
   * called if the add social profile event was successful.
   */
  onAddAccount = () => {
    // Need the ComposerDataFetcher in order to refresh the social profile list after the social profile
    // was successfully added. This will also refresh the cache.
    const composerDataFetcher = new ComposerDataFetcher(
      this.props.flux,
      this.props.facadeApiUrl,
      this.props.memberId,
    )

    const fetchPromise = composerDataFetcher.fetchSocialProfiles(this.props.selectedOrganization)
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

  onFetchSocialProfiles = () => {
    // Need the ComposerDataFetcher in order to refresh the social profile list after the social profile
    // was successfully added. This will also refresh the cache.
    const composerDataFetcher = new ComposerDataFetcher(
      this.props.flux,
      this.props.facadeApiUrl,
      this.props.memberId,
    )

    const fetchPromise = composerDataFetcher.fetchSocialProfiles(this.props.selectedOrganization)
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
   * This function is triggered from the 'socialNetwork:reauthorize:success' hootbus event and is
   * called if the reauthorize event was successful.
   * @param {Object} profileReauthorized
   */
  onProfileReauthSuccess = profileReauthorized => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    const updatedFieldValidations = ValidationUtils.updateCustomDeauthedProfileErrors(
      selectedMessageForEdit.fieldValidations,
      ValidationUtils.createDeauthedProfileSelectedErrors({
        deauthedSocialProfiles: this.removeRecentlyAuthedProfileFromError(
          this.getSelectedDeauthedProfiles(),
          profileReauthorized.socialNetworkId,
        ),
        expiredSocialProfiles: this.props.expired,
        memberName: this.props.memberName,
      }),
      FIELD_VALIDATIONS.SOCIAL_NETWORK,
    )

    this.onUpdateFieldValidations(updatedFieldValidations)

    // Need the ComposerDataFetcher in order to refresh the social profile list after the social profile
    // was successfully reauthed. This will also refresh the cache.
    const composerDataFetcher = new ComposerDataFetcher(
      this.props.flux,
      this.props.facadeApiUrl,
      this.props.memberId,
    )

    const fetchPromise = composerDataFetcher.fetchSocialProfiles(this.props.selectedOrganization)
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

  /**
   * Function to remove socialProfileId from list of deauthed profile id's on profile reauth success
   * @param {Array} deauthedProfilesSelected
   * @param {string} reauthedProfileId
   * @returns {*}
   */
  removeRecentlyAuthedProfileFromError(deauthedProfilesSelected, reauthedProfileId) {
    return filter(deauthedProfilesSelected, deauthedProfileId => deauthedProfileId !== reauthedProfileId)
  }

  /**
   * Function to check whether any of the the selected profile(s) are deauthed or not
   * @returns {*|Array}
   */
  getSelectedDeauthedProfiles() {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    return ValidationUtils.areSelectedProfilesDeauthed({
      selectedNetworkIds: (selectedMessageForEdit && selectedMessageForEdit.socialNetworksKeyedById) || [],
      socialNetworks: this.getFlattenedSocialProfiles(),
      privateSocialProfiles: this.props.privateSocialProfiles,
    })
  }

  /**
   * Update the generic preview from the base message
   * @param message
   */
  updateGenericPreview = (message: Message) => {
    // update the preview store for the generic preview when no networks are selected
    if (message?.messages?.length === 0) {
      const genericPreview = ComposerPreviewUtils.getGenericPreview(message)
      MessagePreviewsActions.setPreviews([genericPreview])
      MessagePreviewsActions.setIsFetchingPreview(false)
    }
  }

  /**
   * Determines if the message has changed
   * @param prevMessage
   * @param nextMessage
   * @returns True if a deep comparison of the new message has changed from the previous message
   */
  _hasMessageChanged = (prevMessage: Message, nextMessage: Message): boolean => {
    // When the previous/next selectedMessageForEdit are the same AND the
    // previous/next messages are not the same, that means previews is done fetching
    // and the composer-message store is still being updated with the messages.
    // While the action to update the messages in the composer-message store
    // is still being dispatched, this component sees that the message is still
    // different so it makes another fetch for the previews. This was causing the
    // previews to be fetched twice every time a change was made in new composer.
    if (this.props.mode === ComposerConstants.MODE.COMPOSER) {
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
          _.isEqual(
            _.omit(prevMessage.asComparible(), 'messages', 'fieldValidations'),
            _.omit(nextMessage.asComparible(), 'messages', 'fieldValidations'),
          ) &&
          !_.isEqual(prevMessage.messages[0].asComparible(), nextMessage.messages[0].asComparible()) &&
          !MessageUtils.hasInnerAttachmentsChanged(prevMessage.messages, nextMessage.messages)) ||
        (hasAttachments &&
          !MessageUtils.hasBaseAttachmentsChanged(prevMessage.attachments, nextMessage.attachments))
      ) {
        return false
      }
    }
    return !_.isEqual(nextMessage?.asComparible(), prevMessage?.asComparible())
  }

  _haveSelectedChannelsChanged(prevProps, nextProps) {
    const prevChannels = prevProps?.getSocialNetworkTypes()
    const nextChannels = nextProps?.getSocialNetworkTypes()

    return (
      prevChannels &&
      nextChannels &&
      prevChannels.length !== nextChannels.length &&
      !prevChannels.some(prevChannel => nextChannels.includes(prevChannel))
    )
  }

  discardSelectedMessages = () => {
    const numSelectedMesssages = this.state.selectedMessageIds.length

    track('web.publisher.' + this.props.trackingContext + '.abort_discard_message', 'discard_messages', {
      numDiscarded: numSelectedMesssages,
    })

    const newSelectedMessageIds = this.state.selectedMessageIds.slice(0)
    _.each(this.state.selectedMessageIds, messageId => {
      this.composerMessageActions.removeById(messageId)
      newSelectedMessageIds.splice(newSelectedMessageIds.indexOf(messageId), 1)
    })
    this.setState(
      {
        selectedMessageIds: newSelectedMessageIds,
      },
      () => {
        if (numSelectedMesssages > 1) {
          this.statusObject.update(translation._('Posts discarded'), 'info', true)
        } else {
          this.statusObject.update(translation._('Post discarded'), 'info', true)
        }
      },
    )
  }

  discardMessage = messageId => {
    track('web.publisher.' + this.props.trackingContext + '.abort_discard_message', 'discard_messages', {
      numDiscarded: 1,
    })

    const newSelectedMessageIds = this.state.selectedMessageIds.slice(0)
    newSelectedMessageIds.splice(newSelectedMessageIds.indexOf(messageId), 1)
    this.setState(
      {
        selectedMessageIds: newSelectedMessageIds,
      },
      () => {
        this.composerMessageActions.removeById(messageId)
        this.statusObject.update(translation._('Post discarded.'), 'info', true)
      },
    )
  }

  onLoad = () => {
    const length = getMessages(getComposerMessageState()).length
    if (this.state.maxMessagesLoaded < length) {
      this.setState({
        maxMessagesLoaded: Math.min(length, this.state.maxMessagesLoaded + Constants.BULK_PAGE_SIZE),
      })
    }
  }

  onModeChange = () => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    this.setState({
      editMode:
        this.state.editMode === Constants.BULK_COMPOSER_EDIT_MODES.PREVIEW
          ? Constants.BULK_COMPOSER_EDIT_MODES.EDIT
          : Constants.BULK_COMPOSER_EDIT_MODES.PREVIEW,
    })

    const socialTypes = selectedMessageForEdit.getSocialNetworkTypes()

    track(
      'web.publisher.' + this.props.trackingContext + '.pnp',
      this.state.editMode === Constants.BULK_COMPOSER_EDIT_MODES.PREVIEW ? 'enter_pnp' : 'exit_pnp',
      { snType: socialTypes },
    )
  }

  /**
   * This function either selects all messages by checking the checkbox or deselects all messages
   * by unchecking the checkbox
   */
  onSelectAll = () => {
    const messages = getMessages(getComposerMessageState())
    const modes = Constants.BULK_COMPOSER_EDIT_MODES
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    let editMode

    if (this.state.editMode === modes.MULTIPLE && this.state.allMessagesSelected) {
      editMode = selectedMessageForEdit ? modes.EDIT : modes.QUICK_SCHEDULE
    } else {
      editMode = modes.MULTIPLE
    }
    this.setState({
      allMessagesSelected: !this.state.allMessagesSelected,
      selectedMessageIds: this.state.allMessagesSelected ? [] : messages.map(m => m.id),
      editMode,
    })
  }

  /**
   * This function adds the message to the selected messages list or removes it
   * @param {int} messageId
   */
  onSelect = messageId => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    const modes = Constants.BULK_COMPOSER_EDIT_MODES
    let editMode
    const newSelectedMessageIds = this.state.selectedMessageIds.slice(0)
    if (!_.contains(this.state.selectedMessageIds, messageId)) {
      // Add message to selected messages list if doesn't exist already
      newSelectedMessageIds.push(messageId)
    } else {
      // Else just remove it from selected messages list
      newSelectedMessageIds.splice(newSelectedMessageIds.indexOf(messageId), 1)
      if (this.state.selectedMessageIds.length === 1) {
        editMode = modes.EDIT
      }
      // If the select all checkbox is selected, turn it off since not all messages are selected anymore
      this.setState({
        allMessagesSelected: false,
      })
    }
    if (editMode === modes.EDIT) {
      if (!selectedMessageForEdit) {
        // set it to quick schedule because there is no selected message for edit
        editMode = modes.QUICK_SCHEDULE
      }
    } else {
      editMode = modes.MULTIPLE
    }
    this.setState({
      selectedMessageIds: newSelectedMessageIds,
      editMode,
    })
  }

  onDiscardSelectedMessages = () => {
    if (this.state.selectedMessageIds.length) {
      this.showMessageDiscardModal(null, true)
    }
  }

  onEditSelect = messageId => {
    const id = getSelectedMessageValue(getComposerMessageState(), 'id')
    track('web.publisher.' + this.props.trackingContext + '.message_dashboard', 'select_message_to_edit')

    let idToSet = messageId

    if (id === messageId) {
      idToSet = 0 // Zero is not a valid id so the store will set the selected id to null. This is done because an action in flummox can't return null
    }

    // We 'unmount' the edit panel by using a conditional to show the edit component
    this.setState(
      {
        unmountEditComponent: true,
      },
      () => {
        this.composerMessageActions.selectById(idToSet)
        this.setState({
          unmountEditComponent: false,
        })
      },
    )
  }

  onToggleMediaLibrary = (source?: string) => {
    const isMediaLibraryOpen = this.state.isMediaLibraryOpen
    const showMediaLibrary = !isMediaLibraryOpen
    let updatedState: any = {
      isMediaLibraryOpen: showMediaLibrary,
    }
    if (showMediaLibrary) {
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

      this.getContentLibrary()
      track('web.publisher.' + this.props.trackingContext + '.open_media_library', 'open_media_library')
      if (this.state.isHashtagPanelOpen) {
        updatedState = { ...updatedState, isHashtagPanelOpen: false }
      }
    }

    mediaLibraryActions.setIsMediaLibraryOpen(showMediaLibrary)
    this.setState(updatedState)
  }

  onToggleHashtagPanel = () => {
    const isHashtagPanelOpen = this.state.isHashtagPanelOpen
    const showHashtagPanel = !isHashtagPanelOpen
    if (showHashtagPanel) {
      if (this.state.isMediaLibraryOpen) {
        this.onToggleMediaLibrary()
        this.setState({ isMediaLibraryOpen: false, isHashtagPanelOpen: true })
      } else {
        this.setState({ isHashtagPanelOpen: true })
      }
      track(
        TrackingConstants.TRACKING_ORIGINS.CONTENT_HASHTAG_SUGGESTIONS,
        TrackingConstants.TRACKING_ACTIONS.CONTENT.OPENED_HASHTAG_PANEL,
      )
    } else {
      this.setState({ isHashtagPanelOpen: false })
    }
  }

  scheduleAllMessages = () => {
    const messages = getMessages(getComposerMessageState())
    const allNetworks = messages.reduce((arr, message) => {
      message.socialNetworksKeyedById.forEach(function (sn) {
        if (!arr.find(elem => elem.socialNetworkId === sn.socialNetworkId)) {
          arr.push(sn)
        }
      })

      return arr
    }, [])

    if (this.shouldShowSecureProfileModal(allNetworks)) {
      this.renderSecureProfileModal(allNetworks, true)
      return
    }

    const allMessageIds = messages.map(message => {
      return message.id
    })

    this.onBulkScheduleMessages(allMessageIds)
  }

  onSendMessage = messageToSend => {
    const { entitlements } = this.props
    return this.props
      .sendMessage(messageToSend)
      .then(sentMessageId => {
        const linkSettingsPresetId = getSelectedMessageValue(
          getComposerMessageState(),
          'linkSettingsPresetId',
        )

        this.setIsSendingMessage(false)
        if (sentMessageId) {
          // Update selected messages if necessary
          if (_.contains(this.state.selectedMessageIds, sentMessageId)) {
            const newSelectedMessageIds = this.state.selectedMessageIds.slice(0)
            newSelectedMessageIds.splice(newSelectedMessageIds.indexOf(sentMessageId), 1)
            this.setState({
              selectedMessageIds: newSelectedMessageIds,
            })
          }
          //tracking only in new compose, in bulk the selectedMessageForEdit is null so it can't log the linkSettingsPresetId
          if (linkSettingsPresetId) {
            track(
              'web.publisher.' + this.props.trackingContext + '.send_message',
              'link_preset_applied_to_message',
              {
                preset: this.props.selectedPreset,
              },
            )
          }
        }
        if (EntitlementsUtils.isFeatureEnabled(entitlements, AUTO_SCHEDULE_MESSAGE)) {
          //save if autoschedule was used so we can default to that next time
          this.saveAutoScheduleLastSelected(messageToSend.isAutoScheduled)
        }
      })
      .catch(e => {
        this.setIsSendingMessage(false)
        if (!AbortionError.isAbortionError(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed to send message', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
      })
  }

  onBulkScheduleMessages = (messageIds: Array<number>) => {
    const { bulkScheduleMessages, entitlements, selectedOrganization, timezoneName } = this.props
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

    this.setIsSendingMessage(true)

    return this.props
      .bulkScheduleMessages(messageIds)
      .then(failedMessageIds => {
        this.setIsSendingMessage(false)
        this.setState({
          selectedMessageIds: failedMessageIds,
        })
      })
      .catch(e => {
        this.setIsSendingMessage(false)
        this.statusObject.update(translation._('An unknown error occurred. Please try again.'), 'error', true)
        if (!AbortionError.isAbortionError(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed to bulk schedule messages', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
      })
  }

  onAttachmentEdited = async (originalAttachment: AttachmentData, editedAttachmentData: AttachmentData) => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

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

    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.ATTACHMENTS,
      newAttachments,
    )
  }

  /**
   * Used internally in composer for adding attachments (that are already instances of attachment)
   * @param attachments
   * @param attachment
   * @private
   */
  _addAttachmentToMessage = (attachments: Attachments, attachment: AttachmentObject) => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (!ComposerUtils.shouldReplaceAttachments([...attachments, attachment])) {
      attachment.status = AttachmentConstants.STATUS.ATTACHED
    } else {
      attachment.status = AttachmentConstants.STATUS.PENDING
    }
    attachments.push(attachment)
    const fieldsToUpdate: {
      attachments: Attachments
      urlPreview?: URLPreview | null
    } = { attachments }

    if (selectedMessageForEdit.urlPreview) {
      // A message cannot have attachments and url previews, so we remove it
      fieldsToUpdate.urlPreview = null
    }

    this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, fieldsToUpdate)
  }

  /**
   * Used internally in composer for removing uploading attachments
   * @param {Object} attachment
   * @private
   */
  _removeUploadingAttachment = attachment => {
    const uploadingFiles = this.props.uploadingFiles
    const newUploadingFiles = _.without(_.clone(uploadingFiles), attachment)
    this.setUploadingFiles(newUploadingFiles.length ? newUploadingFiles : [])
  }

  handleMediaLibraryUploadComplete() {
    const isUploading = this.props.isUploading
    if (!isUploading && typeof this._onUploadQueueComplete === 'function') {
      this._onUploadQueueComplete()
      this.setUploadingFiles(INITIAL_UPLOADING_FILES_STATE)
    }
  }

  /**
   * @param attachment The attachment data that comes back from the backend
   * @param isUploadRequired To identify whether or not an attachment needs to be uploaded
   * @param currentSource The ID of the source providing the attachment. Needed for sources with auth
   */
  determineAttachments = (selectedNetworkGroup, attachments, isReplacement) => {
    if (selectedNetworkGroup) {
      return (
        MessageUtils.getInnerMessageFromGroup(
          getSelectedMessageValue(getComposerMessageState(), 'messages', false, []),
          selectedNetworkGroup,
        )?.attachments || []
      )
    }

    if (!isReplacement && Array.isArray(attachments)) {
      return _.clone(attachments)
    }

    return []
  }

  _postAssetUpload = (
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
    if (attachment.altText) {
      uploadedAttachment.altText = attachment.altText
    }
    this._addAttachmentToMessage(attachments, uploadedAttachment)
    this._fileUploadEnded(attachment)

    return attachments
  }

  _fileUploadEnded = (attachment: AttachmentData) => {
    this._removeUploadingAttachment(attachment)
    const uploadingFiles = this.props.uploadingFiles
    if (!uploadingFiles.length) {
      this.setIsUploading(false)
      this.handleMediaLibraryUploadComplete()
    }
  }

  onAddAttachment = (attachment: AttachmentData, isUploadRequired: string, currentSource?: string | null) => {
    const addAttachment = (isReplacement: boolean) => {
      const selectedMessageForEdit = this.getSelectedMessageForEdit()
      const uploadingFiles = this.props.uploadingFiles

      let attachments = []
      if (isFeatureEnabledOrBeta('PUB_30310_ERROR_WHEN_ATTACHING_VIDEOS')) {
        attachments = this.determineAttachments(
          selectedMessageForEdit.selectedNetworkGroup,
          selectedMessageForEdit.attachments,
          isReplacement,
        )
      } else {
        if (selectedMessageForEdit.selectedNetworkGroup) {
          attachments =
            MessageUtils.getInnerMessageFromGroup(
              getSelectedMessageValue(getComposerMessageState(), 'messages', false, []),
              selectedMessageForEdit.selectedNetworkGroup,
            )?.attachments || []
        } else {
          attachments =
            !isReplacement && Array.isArray(selectedMessageForEdit.attachments)
              ? _.clone(selectedMessageForEdit.attachments)
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
        attachment = ComposerUtils.createAttachmentFromData(attachment)
        if (uploadingFiles.length >= ComposerConstants.MAX_URL_ATTACHMENT_QUEUE) {
          this.statusObject.update(
            translation._('Please wait for the uploading files to finish.'),
            'error',
            true,
          )
        } else {
          let maybeAppId: number | null = null
          if (currentSource !== null && currentSource !== 'freeImages' && currentSource !== '1') {
            maybeAppId = Number(currentSource)
          }
          this.setIsUploading(true)
          const id = uuid()
          const originalId = attachment.id
          attachment.id = id
          const uploadData = {
            id,
            appId: maybeAppId,
            url: attachment.url,
            mimeTypeHint: attachment.mimeType,
          }
          const isVideo = attachment?.mimeType?.match('video/')
          if (isFeatureEnabledOrBeta('PUB_30836_MEDIA_LIBRARY_VIDEOS') && isVideo) {
            const videoAttachment = attachment as VideoAttachmentData
            uploadExternalVideoToS3(videoAttachment)
              .then(uploadedAttachmentData => {
                attachments = this._postAssetUpload(
                  attachment,
                  isReplacement,
                  selectedMessageForEdit,
                  uploadedAttachmentData,
                )
              })
              .catch(e => {
                logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'An error occurred during media upload', {
                  errorMessage: JSON.stringify(e.message),
                  stack: JSON.stringify(e.stack),
                })

                this.statusObject.update(
                  translation._('An error occurred while uploading media.'),
                  'error',
                  true,
                )
                this._fileUploadEnded(attachment)
              })
          } else {
            const uploadFunction = isVideo ? getS3UrlFromExternalVideoUrl : getS3UrlFromExternalUrl
            attachment.xhrRequest = uploadFunction(uploadData)
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
                attachments = this._postAssetUpload(
                  attachment,
                  isReplacement,
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

                  this.statusObject.update(
                    translation._('An error occurred while uploading media.'),
                    'error',
                    true,
                  )
                }
                this._fileUploadEnded(attachment)
              })
          }
          if (isReplacement) {
            uploadingFiles.forEach(uploadingAttachment => {
              uploadingAttachment.xhrRequest.abortAndReject('User triggered abortion.')
            })
            this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, {
              attachments: [],
            })
          }
          this.setUploadingFiles([...uploadingFiles, attachment])
        }
      } else {
        if (VideoAttachment.isVideoAttachment(attachment)) {
          AttachmentUtils.extractVideoThumbnails(attachment as VideoAttachmentData)
            .then(data => {
              attachment = ComposerUtils.createAttachmentFromData(data)
              if (isFeatureEnabledOrBeta('PUB_30310_ERROR_WHEN_ATTACHING_VIDEOS')) {
                attachments = this.determineAttachments(
                  selectedMessageForEdit.selectedNetworkGroup,
                  selectedMessageForEdit.attachments,
                  isReplacement,
                )
              }
              this._addAttachmentToMessage(attachments, attachment)
            })
            .catch(e => {
              logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'An error occurred during media upload', {
                errorMessage: JSON.stringify(e.message),
                stack: JSON.stringify(e.stack),
              })

              this.statusObject.update(
                translation._('An error occurred while uploading media.'),
                'error',
                true,
              )
            })
        } else {
          attachment = ComposerUtils.createAttachmentFromData(attachment)
          this._addAttachmentToMessage(attachments, attachment)
        }
      }
    }

    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    if (!selectedMessageForEdit) {
      return
    }
    addAttachment(false)
  }

  /**
   * Handle files attached via the iFrame SDK attachFileToMessageV2 method
   * @param attachment Attachment data from iFrame SDK
   */
  attachFileFromSDK = (attachment: unknown) => {
    this.onAddAttachment(attachment, false, null)
  }

  showMessageDiscardModal(messageId, hasMessagesSelected) {
    showConfirmationModal({
      titleText: hasMessagesSelected ? DISCARD_MESSAGES : DISCARD_MESSAGE,
      bodyText: <P>{hasMessagesSelected ? CONFIRM_DISCARD_MESSAGES : CONFIRM_DISCARD_MESSAGE}</P>,
      submitButtonText: DISCARD,
      cancelButtonText: CANCEL,
      onSubmit: close => {
        if (messageId) {
          this.discardMessage(messageId)
        } else {
          this.discardSelectedMessages()
        }
        close()
      },
    })
  }

  onDiscardMessage = messageId => {
    this.showMessageDiscardModal(messageId, false)
  }

  onChangePreset = (selectedPreset: Preset) => {
    const id = getSelectedMessageValue(getComposerMessageState(), 'id', false, null)

    const linkSettingsPresetId: number =
      selectedPreset === null ? null : this.props.flux.getStore('presets').getIdByName(selectedPreset.name)

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const selectedMessageForEdit = this.getSelectedMessageForEdit()
      const linkSettings = LinkUtils.getLinkSettingsWithPresetApplied(
        selectedMessageForEdit,
        undefined,
        linkSettingsPresetId,
      )
      this.composerMessageActions.applyCampaignPresets(selectedMessageForEdit.id, {
        ...linkSettings,
      })
    } else {
      this.composerMessageActions.updateFieldById(
        id,
        Constants.FIELD_TO_UPDATE.LINK_SETTINGS_PRESET_ID,
        linkSettingsPresetId,
      )
    }
  }

  // Remove with PUB_30706_LINK_SETTINGS_PNE
  selectedCampaignHasValidLinkSetting(selectedCampaignPreset, presets) {
    return typeof presets.find(preset => preset.id === selectedCampaignPreset.id) !== 'undefined'
  }

  getTimeToInteractive = text => {
    // Only record one TTI measurement per composer session, if this.longtaskObserver is set
    // then a recording is completed, or is in progress
    if (!this.longtaskObserver) {
      const SHORT_INITIAL_WINDOW_DURATION = 3
      const SHORT_MINIMUM_WINDOW_DURATION = 0.5
      const SHORT_ESTIMATED_TTI = -0.01 // a minimum value less than 0 allows for a 0 tti

      this.longtaskObserver = new LongtaskObserver()
      this.longtaskObserver
        .getTimeToInteractive({
          initialWindowDuration: SHORT_INITIAL_WINDOW_DURATION,
          minimumWindowDuration: SHORT_MINIMUM_WINDOW_DURATION,
          minimumEstimatedTTI: SHORT_ESTIMATED_TTI,
        })
        .then(tti => {
          const selectedMessageForEdit = this.getSelectedMessageForEdit()

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
  trackMessageText(newText) {
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

  debounceTrackMessageText = debounce(this.trackMessageText, 1000)

  /**
   *
   * @param newText The updated text as displayed in the editor e.g "Text http://www.hootsuite.com @mention"
   * @param newMentions The updated mentions, if mentions were linked
   * @param newTemplate The text with mentions in the template format e.g "Text http://www.hootsuite.com %{mention-id:0}"
   * @param selectedNetworkGroup The network group updated, or null if no network is selected
   */
  onChangeMessageText = (
    newText: string,
    newMentions: Mentions,
    newTemplate?: string,
    selectedNetworkGroup: SocialNetworkGroup | null = null,
  ) => {
    const { mode, flux, organizations, entitlements, memberId, selectedOrganization } = this.props
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    this.debounceTrackMessageText(newText)

    // For now let's not collect data from Pinterest composer.
    if (!ComposerUtils.isPinterestComposer(this.props.customContext)) {
      if (newText && newText.length > 0) {
        this.getTimeToInteractive(newText)
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
      const selectedCampaign = this.getCampaignById(selectedMessageForEdit.campaignId)

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
          this.onChangePreset,
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
          this.selectedCampaignHasValidLinkSetting(selectedCampaign.preset, presets)
        ) {
          updatedLinkSettings = this.getLinkSettingsWithCampaignPresetApplied(
            selectedCampaign.preset,
            urlDetected,
          )
          updatedLinkSettingsPresetId = selectedCampaign.preset.id
        } else if (previousLinks && urlDetected && previousLinks.length > urlDetected.length) {
          //If a link was removed, just return the previous link settings
          updatedLinkSettings = urlDetected
        } else if (
          validOrganizationCheck &&
          entitlements[LINK_SETTINGS_ADVANCED] &&
          presets &&
          presets.length &&
          ((_.isEmpty(previousLinks) && urlDetected) || (linkDiff && linkDiff.length > 0))
        ) {
          //If there are presets and a link was added, apply preset to that link, combine and return with previous set
          const defaultPreset = _.findWhere(presets, { isDefault: true })
          if (selectedMessageForEdit.linkSettingsPresetId) {
            const preset = _.findWhere(presets, {
              id: selectedMessageForEdit.linkSettingsPresetId,
            })
            const linkDiffWithPreset: LinkSettings = LinkSettingsUtils.applyPreset(preset, linkDiff)
            updatedLinkSettings = _.isEmpty(previousLinks)
              ? linkDiffWithPreset
              : this.combineLinkSettings(urlDetected, linkDiffWithPreset)
          } else if (defaultPreset) {
            this.onChangePreset(defaultPreset)
            const linkDiffWithPreset = LinkSettingsUtils.applyPreset(defaultPreset, linkDiff)
            updatedLinkSettings = _.isEmpty(previousLinks)
              ? linkDiffWithPreset
              : this.combineLinkSettings(urlDetected, linkDiffWithPreset)
          } else {
            updatedLinkSettings = urlDetected
          }
        } else if (
          (isMultiOrgWithLinkSettingsEntitlements &&
            lastUsedLocalPreset &&
            ((_.isEmpty(previousLinks) && urlDetected) || (linkDiff && linkDiff.length > 0))) ||
          (!entitlements[LINK_SETTINGS_ADVANCED] &&
            lastUsedLocalPreset &&
            ((_.isEmpty(previousLinks) && urlDetected) || (linkDiff && linkDiff.length > 0)))
        ) {
          //If there is local preset and a link was added, apply preset to that link, combine and return with previous set
          const linkDiffWithPreset = LinkSettingsUtils.applyPreset(lastUsedLocalPreset, linkDiff)
          updatedLinkSettings = _.isEmpty(previousLinks)
            ? linkDiffWithPreset
            : this.combineLinkSettings(urlDetected, linkDiffWithPreset)
        } else {
          updatedLinkSettings = urlDetected
        }
      }

      if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
        // Remove link preview if message text has no links
        let linkPreviewUpdates = {}
        if (isEmpty(updatedLinkSettings)) {
          linkPreviewUpdates = {
            [Constants.FIELD_TO_UPDATE.URL_PREVIEW]: {
              hasError: false,
              hasWarning: false,
            },
            [Constants.FIELD_TO_UPDATE.UN_EDITED_URL_PREVIEW]: {
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

        this.composerMessageActions.applyCampaignPresets(selectedMessageForEdit.id, {
          ...linkSettingsWithPresetApplied,
        })
        this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, updates)
      } else {
        const template = MessageUtils.mapLinkSettingsToTemplate(newTemplate, updatedLinkSettings)
        const updates = {
          linkSettings: updatedLinkSettings || [],
          linkSettingsPresetId: updatedLinkSettingsPresetId,
          mentions: newMentions,
          template,
        }

        this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, updates)
      }
    } else if (selectedMessageForEdit && mode === ComposerConstants.MODE.BULK_COMPOSER) {
      this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, {
        template: newTemplate || '',
      })
    } else {
      throw new Error('Attempted to update a post when none was selected: ' + newText)
    }
  }

  debounceOnChangeText = debounce(this.onChangeMessageText, 500)

  // Remove with PUB_30706_LINK_SETTINGS_PNE
  combineLinkSettings = (urlDetected: LinkSettings, linkDiffWithPreset: LinkSettings): LinkSettings => {
    if (Array.isArray(linkDiffWithPreset) && linkDiffWithPreset.length > 0) {
      urlDetected = urlDetected.filter(link => link.url !== linkDiffWithPreset[0].url)
    }
    return _.union(urlDetected, linkDiffWithPreset)
  }

  onLinkPreviewChange = (messageId, newLinkPreview) => {
    this.composerMessageActions.updateFieldById(
      messageId,
      Constants.FIELD_TO_UPDATE.URL_PREVIEW,
      newLinkPreview,
    )
  }

  /**
   * Updates the ignored preview validation message codes in the member's extras and in the store
   * to unset the ignored codes:
   * ajaxCall({method: 'POST', url: '/ajax/member/set-publisher-setting', json: {settingName: 'ignoredPreviewValidationMessageCodes', value: []}}, 'q1NoAbort');
   * @param {Number} code
   */
  onAddIgnoredPreviewValidationMessageCode = async (code: string) => {
    const ignoredCodes = [...this.props.ignoredPreviewValidationMessageCodes]
    if (!_.contains(ignoredCodes, code)) {
      ignoredCodes.push(code)
      await savePublisherSetting('ignoredPreviewValidationMessageCodes', ignoredCodes)
      this.props.dispatch(validationActions.setIgnoredPreviewValidationMessageCodes(ignoredCodes))
    }
  }

  saveAutoScheduleLastSelected = async (isAutoScheduled: boolean) => {
    this.props.dispatch(composerActions.setIsAutoScheduled(isAutoScheduled))
  }

  onUpdateFieldValidations(fieldValidations: FieldValidations) {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    const shouldUpdateFieldValidations =
      selectedMessageForEdit && !isEqual(fieldValidations, selectedMessageForEdit.fieldValidations)

    if (shouldUpdateFieldValidations) {
      this.composerMessageActions.updateFieldById(
        selectedMessageForEdit.id,
        Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS,
        fieldValidations,
      )
    }
  }

  onUpdatePublishTime = (newPublishTime: ScheduleTime): void => {
    this.setState({ selectedPublishTime: newPublishTime })
  }

  /**
   * Store the date as unix timestamp
   * @param {Date} newDate
   * @param {Boolean} isAutoscheduled
   * @param {{ socialNetworkId: string; time: Date }[]} recommendedTimes - Specific schedule by social network id
   */
  onUpdateScheduleDate = (
    newDate?: Date | null,
    isAutoscheduled?: boolean | null,
    recommendedTimes?: {
      socialProfileId: string
      time: Date
    }[],
    recommendedTimesScheduledType?: RecommendedTimesScheduledType,
  ): void => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const { timezoneName } = this.props
    // isAutoscheduled could be null so we want to force as false
    const isAutoscheduledFlag = Boolean(isAutoscheduled) && !recommendedTimes

    if (selectedMessageForEdit) {
      const boostCampaign = selectedMessageForEdit.getBoostCampaign()
      const campaignDateError = ValidationUtils.getCampaignDateError({
        dateTime: newDate,
        enabledDays: this.getDatesEnabledForScheduling(selectedMessageForEdit),
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
            this.translateBoostCampaignDatesAccordinglyToThePostScheduling(boostCampaign, newDate)
        }
        fieldsToUpdate.fieldValidations = ValidationUtils.removeCustomScheduleDateErrors(
          selectedMessageForEdit.fieldValidations,
        )
      }
      this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, fieldsToUpdate)

      // TODO: probably better to use a custom action on the `composerMessageActions` store
      if (recommendedTimes) {
        const timeBySnId = recommendedTimes.reduce(
          (scheduleMap, { socialProfileId, time }) => ({
            ...scheduleMap,
            [socialProfileId]: time,
          }),
          {} as {
            [snId: string]: number
          },
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

  translateBoostCampaignDatesAccordinglyToThePostScheduling(boostCampaign, schedulingDate) {
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

  shouldShowSecureProfileModal = socialNetworks => {
    return socialNetworks.some(sn => sn.isSecurePost)
  }

  getContentLibrary = () => {
    const orgId = this.props.selectedOrganization && this.props.selectedOrganization.organizationId
    if (orgId) {
      mediaLibraryActions.fetchContentSources(orgId)
    }
  }

  renderSecureProfileModal = (socialNetworks, isBulk) => {
    const messages = getMessages(getComposerMessageState())
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    const onSend = closeSecureProfileModal => {
      this.setIsSendingMessage(true)
      closeSecureProfileModal()

      if (isBulk) {
        const allMessageIds = messages.map(message => {
          return message.id
        })
        this.onBulkScheduleMessages(allMessageIds)
      } else {
        if (selectedMessageForEdit && !ValidationUtils.isValid(selectedMessageForEdit.fieldValidations)) {
          return
        }
        this.onSendMessage(selectedMessageForEdit)
      }
    }

    showSecureProfileModal({
      isBulk,
      isScheduled: isBulk || (selectedMessageForEdit && !_.isNull(selectedMessageForEdit.sendDate)),
      messageCount: isBulk ? messages.length : 1,
      onSend,
      secureNetworks: socialNetworks.filter(sn => sn.isSecurePost),
      socialNetworks,
    })
  }

  onCreateBoardComplete = ({ responses, boardName, error }) => {
    if (handleCreateBoardComplete(responses, boardName, error, this.statusObject)) {
      reloadAllPinterestBoards(
        this.props.customContext,
        this.props.socialNetworks,
        this.props.selectedOrganization,
        this.statusObject,
        this.onFetchSocialProfiles,
        this.setIsFetchingPinterestBoards,
      )
    }
  }

  validateTemplate = templateData => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const { closeComposer, onSaveTemplate } = this.props
    let isMessageValid = true
    this.setIsSendingMessage(true)

    const isLocked = selectedMessageForEdit.isLocked

    if (isLocked && !selectedMessageForEdit.isSocialProfileSelected()) {
      const newFieldValidations = ValidationUtils.addCustomValidations(
        selectedMessageForEdit.fieldValidations,
        [NoProfilesError],
        FIELD_VALIDATIONS.SOCIAL_NETWORK,
        ComposerConstants.ERROR_LEVELS.ERRORS,
      )
      this.composerMessageActions.updateFieldById(
        selectedMessageForEdit.id,
        Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS,
        newFieldValidations,
      )
      isMessageValid = ValidationUtils.isValid(newFieldValidations)
    }

    if (!isMessageValid) {
      this.setShowOnSubmitErrors(true)
      this.setIsSendingMessage(false)
      return
    } else {
      onSaveTemplate(templateData)
        .then(() => {
          this.setIsSendingMessage(false)
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

  willSendMessage = async () => {
    let selectedMessageForEdit = this.getSelectedMessageForEdit()
    const isUploading = this.props.isUploading

    const { selectedOrganization, timezoneName } = this.props
    let isMessageValid = false
    this.setIsSendingMessage(true)

    if (this.previewRequest) {
      try {
        const data = await this.previewRequest
        if (data) {
          if (data.fieldValidations) {
            isMessageValid = ValidationUtils.isValid(
              ValidationUtils.formatAuthoringFieldValidations(data.fieldValidations),
            )
          } else {
            isMessageValid = true
          }
        }
        this.clearPreviewRequest()
      } catch (e) {
        this.clearPreviewRequest()
        this.setIsSendingMessage(false)
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
          ComposerUtils.isPinterestComposer(this.props.customContext)
            ? [NoPinterestBoardError]
            : [NoProfilesError],
          FIELD_VALIDATIONS.SOCIAL_NETWORK,
          ComposerConstants.ERROR_LEVELS.ERRORS,
        )
        this.composerMessageActions.updateFieldById(
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
      this.setShowOnSubmitErrors(true)
      this.setIsSendingMessage(false)
      // Wait a second for errors to render before doing the logging
      setTimeout(() => {
        selectedMessageForEdit = this.getSelectedMessageForEdit()
        return ValidationUtils.logErrorsNotRendered(
          selectedMessageForEdit,
          selectedMessageForEdit.toPreviewRequest(timezoneName),
        )
      }, 1000)
      return
    }
    if (isUploading) {
      const mediaUploadingMessage = !_.isNull(selectedMessageForEdit.sendDate)
        ? MEDIA_UPLOAD_IN_PROGRESS_TOAST_MESSAGE.replace('%s', SCHEDULING)
        : MEDIA_UPLOAD_IN_PROGRESS_TOAST_MESSAGE.replace('%s', PUBLISHING)
      StatusToastUtils.createToast(MEDIA_UPLOAD_IN_PROGRESS_TOAST_TITLE, mediaUploadingMessage, TYPE_WARNING)
      this.setIsSendingMessage(false)
      return
    }

    if (this.shouldShowSecureProfileModal(selectedMessageForEdit.socialNetworksKeyedById)) {
      this.renderSecureProfileModal(selectedMessageForEdit.socialNetworksKeyedById.toArray(), false)
      this.setIsSendingMessage(false)
      return
    }

    const isAllOwnerTypesPrivate: boolean = PredictiveComplianceUtils.getIsAllOwnerTypesPrivate(
      selectedMessageForEdit.socialNetworksKeyedById,
    )

    if (isFeatureEnabled('PUB_13776_PREDICTIVE_COMPLIANCE') && isAllOwnerTypesPrivate === false) {
      if (this.state.isPredictiveComplianceEnabled) {
        const organizationId = selectedOrganization ? selectedOrganization.organizationId : undefined
        const { urlPreview } = selectedMessageForEdit
        const text = selectedMessageForEdit ? selectedMessageForEdit.renderMessageText() : ''
        const complianceObj = PredictiveComplianceUtils.parseInputs({ text, urlPreview, organizationId })
        if (complianceObj && organizationId) {
          this.setCheckPredictiveComplianceAndSend(true)
          checkPredictiveCompliance(complianceObj)
        } else {
          this.setIsSendingMessage(false)
        }
        const { isRejected } = PredictiveComplianceUtils.getState(this.state.predictiveComplianceStatus)
        if (isRejected) {
          this.setIsSendingMessage(false)
        }
        // Do not send the message if predictive compliance enabled
        return
      }
    }
    this.onSendMessage(selectedMessageForEdit)
  }

  calcMediaLibraryPanelHeight(node) {
    // don't do anything if media library isn't open
    const isMediaLibraryOpen = this.state.isMediaLibraryOpen
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
      !this.props.mediaLibraryPanelHeight &&
      node &&
      (!this.state.mediaLibraryPanelHeight ||
        (this.state.mediaLibraryPanelHeight !== 0 && this.state.mediaLibraryPanelHeight !== panelHeight))
    ) {
      this.setState({ mediaLibraryPanelHeight: panelHeight })
    }
  }

  getCampaignById(campaignId) {
    const campaigns = this.props.flux.getStore('campaigns').get()
    return campaigns.find(campaign => campaign.id === campaignId)
  }

  // Remove with PUB_30706_LINK_SETTINGS_PNE
  getLinkSettingsWithCampaignPresetApplied(
    campaignPreset: Preset,
    linkSettings: LinkSettings,
  ): LinkSettings | null {
    // if there's no preset or no links there's nothing todo
    if (campaignPreset && linkSettings !== null) {
      const presets = this.props.flux.getStore('presets').get() as Array<Preset>
      if (presets && presets.length) {
        const preset = _.find(presets, (p: Preset) => p.id === Number(campaignPreset.id))
        if (typeof preset === 'undefined') {
          return null
        }
        return LinkSettingsUtils.applyPreset(preset, linkSettings)
      }
    }
    return null
  }

  applyCampaignSettings(campaignId: number) {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const selectedCampaign = this.getCampaignById(campaignId)

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const presets = this.props.flux.getStore('presets').get() as Array<Preset>

      // Update base message link settings
      const { linkSettings, linkSettingsPresetId } =
        LinkUtils.applyCampaignSettings(
          selectedMessageForEdit.baseMessage?.linkSettings,
          selectedCampaign,
          presets,
          this.props.trackingContext,
        ) || {}

      // Update inner message link settings
      const pneLinkSettings = {}
      selectedMessageForEdit?.messages?.forEach(m => {
        const { linkSettings, linkSettingsPresetId } =
          LinkUtils.applyCampaignSettings(
            m.linkSettings,
            selectedCampaign,
            presets,
            this.props.trackingContext,
          ) || {}
        pneLinkSettings[m.snType] = {
          linkSettingsPresetId,
          linkSettings,
        }
      })

      this.composerMessageActions.applyCampaignPresets(selectedMessageForEdit.id, {
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
          newLinkSettings = this.getLinkSettingsWithCampaignPresetApplied(
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
        this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, updates)
        if (campaignHasPreset) {
          track(
            'web.publisher.' + this.props.trackingContext + '.send_message',
            'campaign_applied_link_preset',
          )
        }
      }
    }
  }

  updateDeauthedProfileFieldValidations() {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (selectedMessageForEdit) {
      const deauthedProfilesSelected = this.getSelectedDeauthedProfiles()

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
            memberName: this.props.memberName,
            deauthedSocialProfiles: deauthedProfilesSelected,
            expiredSocialProfiles: this.props.expired,
          }),
          FIELD_VALIDATIONS.SOCIAL_NETWORK,
        )

        this.onUpdateFieldValidations(updatedFieldValidations)
      }
    }
  }

  // Remove any IG Push Publish errors if that selected social network is deselected or
  // or the composer mounts
  updateInstagramPairingErrors() {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (selectedMessageForEdit) {
      this.composerMessageActions.updateInstagramPairingErrors([])
    }
  }

  getFlattenedSocialProfiles() {
    const socialProfiles = this.props.socialProfilesKeyedByType
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

  onTrackMediaUploadError = error => {
    if (!this.state.mediaUploadErrorTracked[error.code]) {
      ComposerUtils.trackAttachmentValidationErrors(
        error,
        `web.publisher.${this.props.trackingContext}.${this.props.isEditMode ? 'edit' : 'create'}_message`,
        this.state.mediaUploadErrorTracked,
        () =>
          this.setState({
            mediaUploadErrorTracked: {
              ...this.state.mediaUploadErrorTracked,
              [error.code]: true,
            },
          }),
      )
    }
  }

  renderTagManager = () => {
    emit('tagmanager.app.show', this.props.selectedOrganization)
  }

  onUploadQueueCompleteFunc = onUploadQueueComplete => {
    this._onUploadQueueComplete = onUploadQueueComplete
  }

  renderScheduledMessagesBanner() {
    const maxScheduledMessages = this.props.entitlements[SCHEDULE_MESSAGES]

    if (this.state.totalScheduledMessages <= 0) {
      return null
    }

    if (maxScheduledMessages === FEATURE_UNLIMITED) {
      return null
    }

    return (
      <PendoScheduledBanner
        totalScheduledMessages={this.state.totalScheduledMessages}
        maxScheduledMessages={maxScheduledMessages}
      />
    )
  }

  renderEditPanel() {
    const uploadingFiles = this.props.uploadingFiles

    if (this.state.unmountEditComponent) {
      return []
    }

    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const messages = getMessages(getComposerMessageState())

    return [
      <MessageEditArea
        isOriginContentLab={this.props.isOriginContentLab}
        addProfile={this.props.addProfile}
        closeComposerConfirm={this.props.closeComposerConfirm}
        csrf={this.props.csrf}
        customContext={this.props.customContext}
        entitlements={this.props.entitlements}
        excludedNetworkTypes={this.props.excludedNetworkTypes}
        facadeApiUrl={this.props.facadeApiUrl}
        fetchPreviewData={this.fetchPreviewData}
        flux={this.props.flux}
        ignoredPreviewValidationMessageCodes={this.props.ignoredPreviewValidationMessageCodes}
        isBulkComposer={this.props.mode === ComposerConstants.MODE.BULK_COMPOSER} // TODO: temporary prop until we have support for FB albums
        isEditOnly={this.props.mode === ComposerConstants.MODE.COMPOSER}
        isEditMode={this.props.isEditMode}
        isSocialProfileSelectorDisabled={this.props.isSocialProfileSelectorDisabled}
        isUsingLATM={this.props.isUsingLATM}
        language={this.props.language}
        key="messageEditArea"
        label="Edit Message Area"
        linkShorteners={this.props.linkShorteners}
        maxScheduledMessages={this.props.entitlements[SCHEDULE_MESSAGES]}
        memberId={this.props.memberId}
        messages={messages}
        mode={this.state.editMode}
        numberOfMessagesSelected={this.state.selectedMessageIds.length}
        onAddAttachment={this.onAddAttachment}
        onAddIgnoredPreviewValidationMessageCode={this.onAddIgnoredPreviewValidationMessageCode}
        onChangePreset={this.onChangePreset}
        onChangeText={
          this.props.mode === ComposerConstants.MODE.BULK_COMPOSER
            ? this.debounceOnChangeText
            : this.onChangeMessageText
        }
        onCreateBoardComplete={this.onCreateBoardComplete}
        onFetchSocialProfiles={this.onFetchSocialProfiles}
        onAttachmentEdited={this.onAttachmentEdited}
        onLinkPreviewChange={this.onLinkPreviewChange}
        onManageTags={this.renderTagManager}
        onModeChange={this.onModeChange}
        onScheduleAll={this.scheduleAllMessages}
        onToggleMediaLibrary={this.onToggleMediaLibrary}
        onUploadQueueComplete={this.onUploadQueueCompleteFunc}
        organizations={this.props.organizations}
        selectedMessageForEdit={selectedMessageForEdit}
        selectedOrganization={this.props.selectedOrganization}
        selectedPublishTime={this.state.selectedPublishTime}
        selectedSocialNetworkIds={this.getSelectedProfileIds()}
        shortenerConfigs={this.props.shortenerConfigs}
        socialNetworks={this.props.socialNetworks}
        suggestedTags={this.state.suggestedTags}
        tags={this.state.tags}
        timezoneName={this.props.timezoneName}
        totalScheduledMessages={this.state.totalScheduledMessages}
        trackingContext={this.props.trackingContext}
        uploadingFiles={uploadingFiles}
        hasAlbumTargetingWarning={this.hasAlbumTargetingWarning()}
        showOnboarding={this.props.showOnboarding}
        onTrackMediaUploadError={this.onTrackMediaUploadError}
        onClickHashtagButton={this.onToggleHashtagPanel}
        isHashtagPanelOpen={this.state.isHashtagPanelOpen}
      />,
    ]
  }

  renderMediaLibraryPanel() {
    return (
      <MediaLibrary
        key="mediaLibrary"
        onAddAttachment={this.onAddAttachment}
        onClose={this.onToggleMediaLibrary}
        onExitComposer={this.props.onClose}
        onMinimize={this.onMinimize}
        selectedOrganization={this.props.selectedOrganization}
        supportDragAndDrop={false}
        showCloseOption={true}
      />
    )
  }

  renderPreviewPanel() {
    if (this.state.isMediaLibraryOpen) {
      return null
    }
    if (this.state.isHashtagPanelOpen) {
      return null
    }
    const previewConfig = get(this.props, 'composerConf.messagePreviewArea')
    const isDisabled = previewConfig?.isDisabled

    return [
      <MessagePreviewArea
        customContext={this.props.customContext}
        ignoredPreviewValidationMessageCodes={this.props.ignoredPreviewValidationMessageCodes}
        isBulkComposer={false}
        isDisabled={isDisabled}
        key="messagePreviewArea"
        onAddIgnoredPreviewValidationMessageCode={this.onAddIgnoredPreviewValidationMessageCode}
      />,
    ]
  }

  renderDashboardPanel() {
    const messages = getMessages(getComposerMessageState())
    const id = getSelectedMessageValue(getComposerMessageState(), 'id')

    return [
      <MessageDashboard
        allMessagesSelected={this.state.allMessagesSelected}
        key="messageDashboard"
        loadMore={this.onLoad}
        maxMessages={messages.length}
        messages={messages.slice(0, this.state.maxMessagesLoaded)}
        multipleSelectMode={this.state.editMode === Constants.BULK_COMPOSER_EDIT_MODES.MULTIPLE}
        numberOfErrors={messages.filter(m => m.hasErrors()).length}
        onDiscard={this.onDiscardMessage}
        onEditSelect={this.onEditSelect}
        onSelect={this.onSelect}
        onSelectAll={this.onSelectAll}
        selectedMessageForEditId={id}
        selectedMessageIds={this.state.selectedMessageIds}
        timezoneName={this.props.timezoneName}
      />,
    ]
  }

  renderOnePanel(contents) {
    return (
      <Panel key="onePanel1" width="100%">
        {contents}
      </Panel>
    )
  }

  renderTwoPanel() {
    const messages = getMessages(getComposerMessageState())
    let panels
    // Bulk Composer is a special case since we never want the list to go away even if there is one one message left
    if (this.props.mode === ComposerConstants.MODE.BULK_COMPOSER) {
      panels = [this.renderDashboardPanel(), this.renderEditPanel()]
    } else if (this.props.mode === ComposerConstants.MODE.COMPOSER) {
      if (messages.length > 1) {
        panels = [this.renderEditPanel(), this.renderPreviewPanel()]
      } else {
        panels = [this.renderEditPanel(), this.renderPreviewPanel()]
      }
    }

    return [
      <Panel key="twoPanel1" ref={node => this.calcMediaLibraryPanelHeight(node)}>
        {panels[0]}
      </Panel>,
      <Panel key="twoPanel2" maxWidth={'650px'}>
        <ComposerPreviewsLoader />
        {panels[1]}
        {this.state.isMediaLibraryOpen ? this.renderMediaLibraryPanel() : null}
        {this.state.isHashtagPanelOpen
          ? [<HashtagSuggestionPanel key="hashtagPanel" onToggleHashtagPanel={this.onToggleHashtagPanel} />]
          : null}
      </Panel>,
    ]
  }

  renderPanels() {
    let panels = []

    const messages = getMessages(getComposerMessageState())

    if (messages && messages.length > 0) {
      panels = this.renderTwoPanel()
    } else if (this.props.state === ComposerConstants.STATE.PRECOMPOSE) {
      panels = this.renderOnePanel(this.props.preCompose())
    } else if (this.props.state === ComposerConstants.STATE.POSTCOMPOSE) {
      panels = this.renderOnePanel(this.props.postCompose())
    }

    return panels
  }

  renderMessageSelectionHeader() {
    const messages = getMessages(getComposerMessageState())
    return (
      <MessageSelectionHeader
        key="message-selection-header"
        allMessagesSelected={this.state.allMessagesSelected}
        numberOfErrors={messages.filter(m => m.hasErrors()).length}
        numberOfMessages={messages.length} // the header is not aware that we lazy load, so we send all messages
        numberOfMessagesSelected={this.state.selectedMessageIds.length}
        onDiscardSelectedMessages={this.onDiscardSelectedMessages}
        onScheduleSelectedMessages={() => this.onBulkScheduleMessages(this.state.selectedMessageIds)}
        onSelectAll={this.onSelectAll}
        selectedHasErrors={messages.some(
          m => m.hasErrors() && this.state.selectedMessageIds.indexOf(m.id) > -1,
        )}
      />
    )
  }

  renderOrgSuspendedBanner = () => {
    const { selectedOrganization, timezoneName } = this.props
    return <OrgSuspendedBanner {...{ timezoneName }} organization={selectedOrganization} />
  }

  onMinimize = () => {
    const isMediaLibraryOpen = this.state.isMediaLibraryOpen
    this.setState({ mediaLibraryMinimizeState: isMediaLibraryOpen, isMediaLibraryOpen }) // not needed if we can deal with the loop // find out more about this
    mediaLibraryActions.setIsMediaLibraryOpen(false)
    this.props.onMinimize()
  }

  getAmplifyExpireDate(message) {
    const amplifyExpireDate = message.extendedInfo?.amplifyExpireDate
    return moment(amplifyExpireDate).isValid() ? amplifyExpireDate : null
  }

  getDatesEnabledForScheduling(message) {
    // If message from Amplify we could have also an expire date and
    // the message cannot be scheduled after that date
    if (isFeatureEnabled('CFE_859_CHECK_EXPIRE_DATE')) {
      const amplifyExpireDate = this.getAmplifyExpireDate(message)
      if (amplifyExpireDate) {
        return {
          dateFrom: new Date(),
          dateTo: amplifyExpireDate,
        }
      }
    }

    const selectedCampaign = this.getCampaignById(message.campaignId)
    if (selectedCampaign) {
      return {
        dateFrom: DateUtils.convertTimestampToDate(selectedCampaign.dateFrom),
        dateTo: DateUtils.convertTimestampToDate(selectedCampaign.dateTo),
      }
    }

    return null
  }

  toTemplateData = () => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const { selectedOrganization } = this.props
    return selectedMessageForEdit.toTemplateData(selectedOrganization && selectedOrganization.organizationId)
  }

  getNonPrivateSocialNetworkIds = () => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    return selectedMessageForEdit.getNonPrivateSocialNetworkIds
  }

  /**
   * @returns An array of social profile IDs associated with the currently selected message
   */
  getSelectedProfileIds = (): Array<number> => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    return selectedMessageForEdit ? selectedMessageForEdit.getSocialNetworkIds() : []
  }

  getSelectedSocialNetworksTotal = () => {
    /*
     * The number next to "Schedule" button means different things for Pinterest new composer compared to other new composes.
     * It shows the number of boards (publishing targets) a user is posting to for Pinterest, and shows the number of social networks
     * a user is posting to for other channels.  In the future we might want to generalize this for all channels with the concept
     * of publishing targets. See notes in STRAT-1035.
     */
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    if (!selectedMessageForEdit) {
      return 0
    }

    let selectedSocialNetworksTotal = selectedMessageForEdit.socialNetworksKeyedById.size

    if (ComposerUtils.isPinterestComposer(this.props.customContext)) {
      const baseMessage = selectedMessageForEdit.baseMessage
      selectedSocialNetworksTotal =
        baseMessage.extendedInfo && baseMessage.extendedInfo.boards
          ? baseMessage.extendedInfo.boards.length
          : 0
    }

    return selectedSocialNetworksTotal
  }

  getFooter = () => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const isSendingMessage = this.props.isSendingMessage
    const isUploading = this.props.isUploading

    let selectedTwitterProfiles
    if (this.props.mode === ComposerConstants.MODE.COMPOSER && selectedMessageForEdit) {
      const selectedProfiles = _.pluck(
        _.values(selectedMessageForEdit.socialNetworksKeyedById.toJS()),
        'socialNetworkId',
      )
      const twitterProfiles = filter(
        this.props.socialNetworks,
        sn => sn.type === SocialProfileConstants.SN_TYPES.TWITTER,
      )
      selectedTwitterProfiles = _.compact(
        _.map(twitterProfiles, socialProfile =>
          selectedProfiles && _.contains(selectedProfiles, socialProfile.socialNetworkId)
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
        this.props.mode === ComposerConstants.MODE.COMPOSER &&
        selectedTwitterProfiles.length > 1) ||
      (selectedTwitterProfiles && selectedTwitterProfiles.length > 0) ||
      this.hasAlbumTargetingWarning()

    const shouldShowFooter =
      (selectedMessageForEdit && this.props.mode === ComposerConstants.MODE.COMPOSER) ||
      (selectedMessageForEdit &&
        this.props.mode === ComposerConstants.MODE.BULK_COMPOSER &&
        this.state.selectedMessageIds.length < 1)
    let footer
    if (shouldShowFooter) {
      const datesEnabledForScheduling = this.getDatesEnabledForScheduling(selectedMessageForEdit)
      let canSendNow = this._canSendNow(this.props)

      const selectedCampaign = this.getCampaignById(selectedMessageForEdit.campaignId)
      const sendDate = selectedMessageForEdit.sendDate || undefined

      if (selectedCampaign) {
        // Only allow send now if the current date is with in the campaign
        canSendNow = canSendNow && selectedCampaign.isDateInCampaign(new Date())
        hasErrors = hasErrors || (sendDate && !selectedCampaign.isDateInCampaign(getSendDate(sendDate)))
      }

      const selectedSocialNetworksTotal = this.getSelectedSocialNetworksTotal()
      const selectedProfileIds = this.getSelectedProfileIds()

      const isDraft = !!(selectedMessageForEdit && ComposerUtils.isDraft(selectedMessageForEdit.messageType))

      const onSaveTemplate = this.props.onSaveTemplate ? this.validateTemplate : null
      const isInstagramStory =
        selectedMessageForEdit?.postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY
      footer = (
        <ComposerFooter
          autoScheduleSettings={this.props.autoScheduleSettings}
          entitlements={this.props.entitlements}
          canSendNow={canSendNow}
          closeComposer={this.props.closeComposer}
          createDraftOnClick={this.props.createDraftOnClick}
          datesEnabledForScheduling={datesEnabledForScheduling}
          flux={this.props.flux}
          footerConf={this.props.composerConf && this.props.composerConf.footer}
          getNonPrivateSocialNetworkIds={this.getNonPrivateSocialNetworkIds}
          canSendToAmplify={this.props.canSendToAmplify}
          isAutoScheduledEnabled={this.props.isAutoScheduledEnabled}
          isBulkComposer={this.props.mode === ComposerConstants.MODE.BULK_COMPOSER}
          isDisabled={hasErrors}
          isDraft={isDraft}
          isEditMode={this.props.isEditMode}
          isInstagramStory={isInstagramStory}
          isPinterest={ComposerUtils.isPinterestComposer(this.props.customContext)}
          isAmplify={ComposerUtils.isAmplifyComposer(this.props.customContext)}
          isAmplifyEditPost={ComposerUtils.isAmplifyEditPostComposer(this.props.customContext)}
          isTemplate={ComposerUtils.isTemplate(selectedMessageForEdit.messageType)}
          isUsingLATM={this.props.isUsingLATM}
          isVideoMessage={selectedMessageForEdit.hasVideoAttachment()}
          key="publisherComposerFooter"
          memberId={this.props.memberId}
          memberInTrial={this.props.memberInTrial}
          memberSignupDate={this.props.memberSignupDate}
          messageState={selectedMessageForEdit.state}
          messageType={selectedMessageForEdit.messageType}
          maxScheduledMessages={this.props.entitlements[SCHEDULE_MESSAGES]}
          onFetchSocialProfiles={this.onFetchSocialProfiles}
          onSaveTemplate={onSaveTemplate}
          onSendToAmplify={this.props.onSendToAmplify}
          onUpdatePublishTime={this.onUpdatePublishTime}
          onUpdateScheduleDate={this.onUpdateScheduleDate}
          renderDraftSharingWarning={this.props.renderDraftSharingWarning}
          selectedOrganization={this.props.selectedOrganization}
          selectedProfileIds={selectedProfileIds}
          selectedSocialNetworksTotal={selectedSocialNetworksTotal}
          sendDate={sendDate}
          willSendMessage={this.willSendMessage}
          shouldCheckContentLibraryAccess={true}
          showAutoScheduleSettings={this.props.showAutoScheduleSettings}
          templateData={this.props.templateData}
          timezoneName={this.props.timezoneName}
          toTemplateData={this.toTemplateData}
          totalScheduledMessages={this.state.totalScheduledMessages}
          updateDraftOnClick={this.props.updateDraftOnClick}
        />
      )
    }
    return footer
  }

  render() {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const selectedSocialNetworksTotal = this.getSelectedSocialNetworksTotal()

    const scheduledTime = selectedMessageForEdit ? selectedMessageForEdit.sendDate : undefined
    const isBulkComposer = this.props.mode === ComposerConstants.MODE.BULK_COMPOSER
    const renderBulkComposer = {
      bulkComposerState: this.props.bulkComposerState,
      selectedMessageIds: this.state.selectedMessageIds,
    }

    return (
      <div className="rc-Composer">
        <TrackValidationErrors />
        <DraftJSGlobalStyle />
        <DraftJSMentionGlobalStyle />
        <ComposerModal
          getAbovePanels={this.getAbovePanels}
          getBelowPanels={this.getBelowPanels}
          onClose={this.props.onClose}
          scheduledTime={scheduledTime}
          zIndex={this.props.zIndex}
          isMediaLibraryOpen={this.state.isMediaLibraryOpen}
          totalScheduledMessages={this.state.totalScheduledMessages} // here to force rerender when totalScheduledMessages change
          tags={this.state.tags} // here to force rerender when tags change
          suggestedTags={this.state.suggestedTags} // here to force rerender when suggestedTags change
          renderBulkComposer={isBulkComposer ? renderBulkComposer : undefined} // here to force rerender for bulk composer
          campaignId={this.state.campaignId} // here to force rerender when campaign changes
          socialNetworksCount={this.props.socialNetworks.length} // here to force rerender when socialNetworks changes
          selectedSocialNetworksTotal={selectedSocialNetworksTotal} // here to force rerender when selectedSocialNetworksTotal changes
          isHashtagPanelOpen={this.state.isHashtagPanelOpen}
        >
          {this.boundRenderPanels}
        </ComposerModal>
      </div>
    )
  }
}

const ConnectedComposer = reduxConnect(({ composer, validation }: RootState) => ({
  checkPredictiveComplianceAndSend: composer.checkPredictiveComplianceAndSend,
  isSendingMessage: composer.isSendingMessage,
  isSequentialPostingInProgress: composer.isSequentialPostingInProgress,
  isUploading: composer.isUploading,
  uploadingFiles: composer.uploadingFiles,
  ignoredPreviewValidationMessageCodes: validation.ignoredPreviewValidationMessageCodes,
  showOnSubmitErrors: validation.showOnSubmitErrors,
}))(Composer)

export default ConnectedComposer
