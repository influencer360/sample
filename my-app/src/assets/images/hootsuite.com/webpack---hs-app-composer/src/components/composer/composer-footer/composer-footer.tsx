import React, { PureComponent } from 'react'
import isEqual from 'lodash/isEqual'
import over from 'lodash/over'
import { connect as reduxConnect } from 'react-redux'
import { createSelector } from 'reselect'
import styled from 'styled-components'

import { Banner, TYPE_WARNING } from 'fe-comp-banner'
import { Button } from 'fe-comp-button'
import { P } from 'fe-comp-dom-elements'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { venk } from 'fe-hoc-venkman'
import { AUTO_SCHEDULE_MESSAGE } from 'fe-lib-entitlements'
import { emit, off, on } from 'fe-lib-hootbus'
import { getExperimentVariation } from 'fe-lib-optimizely'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'
import { ExpandedUiMixin } from 'fe-pnc-comp-composer-modal'
import { PostButton } from 'fe-pnc-comp-composer-post-button'

import { showConfirmationModal } from 'fe-pnc-comp-confirmation-modal'
import { renderSuspendContextConfirmationModal } from 'fe-pnc-comp-suspend-context-confirmation-modal'
import type { InstagramPostType } from 'fe-pnc-constants-social-profiles'
import type { AttachmentObject } from 'fe-pnc-data-composer-message'
import {
  actions as composerMessageActions,
  getSelectedMessage,
  getSelectedMessageValue,
  getState as getComposerMessageState,
  store as composerMessageStore,
  PdfAttachment,
} from 'fe-pnc-data-composer-message'
import { actions as mediaLibraryActions, store as mediaLibraryStore } from 'fe-pnc-data-media-library'
import { store as complianceStore } from 'fe-pnc-data-predictive-compliance'
import { InvisibleH3 } from 'fe-pnc-lib-a11y'
import { hasSeenPopover } from 'fe-pnc-lib-api'
import { isFeatureEnabled, isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'
import { observeStore } from 'fe-pnc-lib-store-observer'

import ComposerConstants from '@/constants/composer'
import Constants from '@/constants/constants'
import { FEATURE_UNLIMITED } from '@/constants/entitlements'
import { KEYBOARD_SHORTCUTS_EVENTS, ONBOARDING_WALKTHROUGH_EVENTS } from '@/constants/events'
import PopupConstants from '@/constants/popups'
import TrackingConstants from '@/constants/tracking'
import { composerActions } from '@/redux/reducers/composer'
import { AppDispatch, RootState } from '@/redux/store'
import { ScheduleTime } from '@/typings/Constants'
import { Entitlements } from '@/typings/Flux'
import { FieldValidations, RecommendedTimesScheduledType, TemplateData } from '@/typings/Message'
import ComposerUtils from '@/utils/composer-utils'
import { EntitlementsUtils } from '@/utils/entitlement-utils'
import MessageUtils from '@/utils/message-utils'
import PredictiveComplianceUtils from '@/utils/predictive-compliance-utils'
import { track } from '@/utils/tracking'
import ValidationUtils from '@/utils/validation-utils'

import {
  BannerContainer,
  EditPostNextButton,
  NewTemplateButton,
  SaveDraftButton,
  StyledComposerBar,
} from './composer-footer.style'
import { ConnectedDualPublishWrapper } from './dual-publish-toggle/dual-publish-wrapper'
import Scheduler from './scheduler/scheduler'

const { INSTAGRAM_PUBLISHING_MODES } = Constants

const DualPublishWrapperWithSocialProfiles = ConnectedDualPublishWrapper

const getContentSourceFolders = state => state.contentFolders
const getWritableContentLibraries = createSelector([getContentSourceFolders], folders =>
  folders.filter(f => f.directory.permissions.includes('WRITE')),
)

const noop = () => {}

const SAVE_CHANGES = translation._('Save changes')
const NEW_TEMPLATE = translation._('Continue to add metadata')
const SCHEDULING_OPTIONS = translation._('Scheduling Options')
const SAVE_AS_DRAFT = translation._('Save as draft')

const INSTAGRAM_DIRECT_INFO_TITLE = translation._('Only 1 image or video will publish')
// prettier-ignore
const INSTAGRAM_DIRECT_INFO_MESSAGE = translation._('Only the first media asset will publish to Instagram when direct publishing is selected.')
// prettier-ignore
const INSTAGRAM_DIRECT_INFO_BODY = translation._("To publish all of your media attachments in one post, select 'Keep editing' and then select 'Publish via mobile notification'.")
const INSTAGRAM_DIRECT_INFO_SUBMIT = translation._('Post only the first asset')
const INSTAGRAM_DIRECT_INFO_CANCEL = translation._('Keep editing')
const SAVE_TEMPLATE_WITHOUT_PDF_TITLE = translation._('Save without attachment?')
// prettier-ignore
const SAVE_TEMPLATE_WITHOUT_PDF_BODY = translation._("You can't save posts with PDF attachments. You can still save the post to your content library, but the PDF attachment will be removed.",)
const SAVE_TEMPLATE_WITHOUT_PDF_CANCEL = translation._('Cancel')
const SAVE_TEMPLATE_WITHOUT_PDF_SUBMIT = translation._('Save')
const SEND_TO_AMPLIFY_WITHOUT_PDF_TITLE = translation._('Send without attachment?')
// prettier-ignore
const SEND_TO_AMPLIFY_WITHOUT_PDF_BODY = translation._("Amplify doesn't support PDF attachments. You can still send the post to Amplify, but the PDF attachment will be removed.",)
const SEND_TO_AMPLIFY_WITHOUT_PDF_CANCEL = SAVE_TEMPLATE_WITHOUT_PDF_CANCEL
const SEND_TO_AMPLIFY_WITHOUT_PDF_SUBMIT = translation._('Send')

const NEXT = translation._('Next')

type ComposerFooterState = {
  fieldValidations: FieldValidations
  isLoading?: boolean
  isOnboardingOpen?: boolean
  isPredictiveComplianceEnabled?: boolean
  mediaAttachments: Array<AttachmentObject>
  postType: InstagramPostType
  predictiveComplianceStatus?: string
  selectedMessageCount: number
  selectedMessageId?: string | number
  selectedPublishTime: ScheduleTime
}

interface ComposerFooterProps {
  dispatch: AppDispatch
  entitlements: Entitlements
  autoScheduleSettings: Record<string, unknown>
  canSendNow?: boolean
  closeComposer?(): void
  datesEnabledForScheduling?: {
    dateFrom?: Date
    dateTo?: Date
  }
  footerConf?: Record<string, unknown>
  getNonPrivateSocialNetworkIds(): Array<number>
  canSendToAmplify: boolean
  isAutoScheduledEnabled?: boolean
  isBulkComposer?: boolean
  isDisabled?: boolean
  isDraft?: boolean
  isEditMode?: boolean
  isLoading?: boolean
  isPredictiveComplianceEnabled?: boolean
  isDuplicatingPost?: boolean
  isSequentialPostingEnabled?: boolean
  isSequentialPostingInProgress?: boolean
  isTemplate?: boolean
  isUploading?: boolean
  isUsingLATM?: boolean
  isVideoMessage?: boolean
  isOnboardingOpen?: boolean
  maxScheduledMessages?: number
  memberId?: number
  memberInTrial?: boolean
  memberSignupDate?: string
  messageState?: string
  onFetchSocialProfiles(): void
  onSaveTemplate?(data: Record<string, unknown>): void
  onSendToAmplify?(): void
  onUpdatePublishTime: (newPublishTime: ScheduleTime) => void
  onUpdateScheduleDate: (
    newDate?: Date | null,
    isAutoScheduled?: boolean | null,
    recommendedTimes?: { socialProfileId: string; time: Date }[],
    recommendedTimesScheduledType?: RecommendedTimesScheduledType,
  ) => void
  predictiveComplianceStatus?: string
  renderDraftSharingWarning(source: string): void
  selectedOrganization?: Record<string, unknown>
  selectedProfileIds: Array<number>
  selectedSocialNetworksTotal?: number
  sendDate?: number
  willSendMessage(): Promise<void>
  shouldCheckContentLibraryAccess?: boolean
  showAutoScheduleSettings?(): void
  templateData?: TemplateData
  timezoneName?: string
  toTemplateData(organizationId?: number): TemplateData
  totalScheduledMessages?: number
  updateDraftOnClick?: (source: string) => void
  writableContentLibraries: Array<{
    id?: string
    directory?: {
      parentId?: string
      permissions?: Array<string>
    }
  }>
}

export class ComposerFooter extends PureComponent<ComposerFooterProps, ComposerFooterState> {
  static displayName = 'ComposerFooter'

  static defaultProps = {
    autoScheduleSettings: {},
    canSendNow: false,
    closeComposer: noop,
    datesEnabledForScheduling: null,
    getNonPrivateSocialNetworkIds: noop,
    canSendToAmplify: false,
    isAutoScheduledEnabled: false,
    isBulkComposer: false,
    isDisabled: false,
    isDraft: false,
    isDuplicatingPost: false,
    isEditMode: false,
    isLoading: false,
    isTemplate: false,
    isUploading: false,
    isUsingLATM: false,
    isVideoMessage: false,
    isPredictiveComplianceEnabled: false,
    isSequentialPostingEnabled: false,
    isOnboardingOpen: false,
    isAmplifyEditPost: false,
    maxScheduledMessages: FEATURE_UNLIMITED,
    memberId: null,
    memberInTrial: false,
    memberSignupDate: '',
    messageState: null,
    predictiveComplianceStatus: '',
    onUpdatePublishTime: noop,
    renderDraftSharingWarning: noop,
    selectedOrganization: null,
    sendDate: null,
    showAutoScheduleSettings: noop,
    totalScheduledMessages: -1,
    updateDraftOnClick: noop,
    writableContentLibraries: [],
  }

  unsubscribeObservers: Array<() => void>

  constructor(props: ComposerFooterProps) {
    super(props)

    let selectedPublishTime
    if (EntitlementsUtils.isFeatureEnabled(props.entitlements, AUTO_SCHEDULE_MESSAGE)) {
      selectedPublishTime =
        props.canSendNow && !props.sendDate && !props.isAutoScheduledEnabled
          ? ComposerConstants.SCHEDULE_TIME.IMMEDIATE
          : ComposerConstants.SCHEDULE_TIME.SCHEDULE
      // set up initial message autoschedule state
      if (!props.isBulkComposer && props.isAutoScheduledEnabled) {
        this.props.onUpdateScheduleDate(null, props.isAutoScheduledEnabled)
      }
    } else {
      selectedPublishTime =
        props.canSendNow && !props.sendDate
          ? ComposerConstants.SCHEDULE_TIME.IMMEDIATE
          : ComposerConstants.SCHEDULE_TIME.SCHEDULE
    }

    this.state = {
      selectedPublishTime,
      selectedMessageCount: 0,
      mediaAttachments: [],
      fieldValidations: {},
      postType: null,
    }

    this.unsubscribeObservers = [noop]

    on(ONBOARDING_WALKTHROUGH_EVENTS.OPEN, this.onOnboardingOpen)
    on(ONBOARDING_WALKTHROUGH_EVENTS.CLOSE, this.onOnboardingClose)
    on(KEYBOARD_SHORTCUTS_EVENTS.SAVE_DRAFT, this.createDraftClicked)
    on(KEYBOARD_SHORTCUTS_EVENTS.POST_NOW, this.onPostButtonClick)
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps: ComposerFooterProps) {
    if (nextProps.canSendNow !== this.props.canSendNow) {
      //default setting of the selectedPublishTime based on canSendNow prop
      const selectedPublishTime = nextProps.canSendNow
        ? ComposerConstants.SCHEDULE_TIME.IMMEDIATE
        : ComposerConstants.SCHEDULE_TIME.SCHEDULE

      this.setState({ selectedPublishTime })
    }

    // Content Libraries are organization based, so we need to refresh them when the organization is switched
    if (this.props.selectedOrganization && nextProps.selectedOrganization) {
      if (this.props.selectedOrganization.organizationId !== nextProps.selectedOrganization.organizationId) {
        mediaLibraryActions.fetchContentSources(nextProps.selectedOrganization.organizationId)
      }
    }
  }

  componentDidMount() {
    if (this.props.selectedOrganization && this.props.selectedOrganization.organizationId) {
      mediaLibraryActions.fetchContentSources(this.props.selectedOrganization.organizationId)
    }

    this.unsubscribeObservers = [
      observeStore(
        composerMessageStore,
        selectedMessageCount => this.setState({ selectedMessageCount }),
        state => getSelectedMessageValue(state, 'messages', false, []).length,
      ),
      observeStore(
        composerMessageStore,
        selectedMessageId => this.setState({ selectedMessageId }),
        state => state.selectedMessageId,
      ),
      observeStore(
        complianceStore,
        predictiveComplianceStatus => this.setState({ predictiveComplianceStatus }),
        state => state.status,
      ),
      observeStore(
        complianceStore,
        isPredictiveComplianceEnabled => this.setState({ isPredictiveComplianceEnabled }),
        state => state.isEnabled,
      ),
      observeStore(
        composerMessageStore,
        mediaAttachments => this.setState({ mediaAttachments }),
        state => getSelectedMessageValue(state, 'attachments', false, []),
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        fieldValidations => this.setState({ fieldValidations }),
        state => getSelectedMessageValue(state, 'fieldValidations', false, {}),
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        postType => this.setState({ postType }),
        state => getSelectedMessageValue(state, 'postType', false, {}),
        isEqual,
      ),
    ]
  }

  componentDidUpdate(prevProps: ComposerFooterProps, prevState: ComposerFooterState) {
    if (this.props.isSequentialPostingInProgress && !prevProps.isSequentialPostingInProgress) {
      this.setState({ selectedPublishTime: ComposerConstants.SCHEDULE_TIME.IMMEDIATE })
    }

    if (this.state.selectedPublishTime === 'SCHEDULE' && prevState.selectedPublishTime !== 'SCHEDULE') {
      on(KEYBOARD_SHORTCUTS_EVENTS.SCHEDULE_AND_REUSE, this.onDuplicatePostClick)
    }

    if (this.state.selectedPublishTime === 'IMMEDIATE' && prevState.selectedPublishTime !== 'IMMEDIATE') {
      off(KEYBOARD_SHORTCUTS_EVENTS.SCHEDULE_AND_REUSE, this.onDuplicatePostClick)
    }
  }

  componentWillUnmount() {
    over(this.unsubscribeObservers)()
    off(KEYBOARD_SHORTCUTS_EVENTS.SAVE_DRAFT, this.createDraftClicked)
    off(KEYBOARD_SHORTCUTS_EVENTS.POST_NOW, this.onPostButtonClick)
    off(KEYBOARD_SHORTCUTS_EVENTS.SCHEDULE_AND_REUSE, this.onDuplicatePostClick)
  }

  /**
   * This function is triggered from the 'composer:onboarding:walkthrough:open' hootbus event and is
   * called when the composer walkthrough is shown
   */
  onOnboardingOpen = () => {
    this.setState({
      isOnboardingOpen: true,
    })
  }

  /**
   * This function is triggered from the 'composer:onboarding:walkthrough:close' hootbus event and is
   * called when the composer walkthrough is closed
   */
  onOnboardingClose = () => {
    this.setState({
      isOnboardingOpen: false,
    })
  }

  onUpdatePublishTime = (option: ScheduleTime) => {
    this.props.onUpdatePublishTime(option)
    this.setState({ selectedPublishTime: option })
  }

  showPdfNotSupportedModal = ({
    titleText,
    bodyText,
    cancelText,
    submitText,
    onSubmitCb,
  }: {
    titleText: string
    bodyText: string
    cancelText: string
    submitText: string
    onSubmitCb: () => void
  }) => {
    showConfirmationModal({
      titleText: titleText,
      bodyText: <P>{bodyText}</P>,
      submitButtonText: submitText,
      cancelButtonText: cancelText,
      onSubmit: (close: () => void) => {
        onSubmitCb()
        close()
      },
    })
  }

  createTemplate = () => {
    const templateData = this.props.toTemplateData()
    emit('message:create:template', templateData, this.props.closeComposer)
    if (isFeatureEnabled('PUB_30348_TRACK_SEND_NOW_ACTIONS')) {
      track(
        TrackingConstants.TRACKING_CONTEXT.COMPOSER,
        TrackingConstants.TRACKING_ACTIONS.NEW.NEW_COMPOSE.SAVE_CONTENT_LIBRARY,
      )
    }
  }

  onCreateTemplateClick = () => {
    if (isFeatureEnabledOrBeta('PUB_30723_LINKEDIN_PDF')) {
      const { mediaAttachments } = this.state
      const hasPdfAttachment = mediaAttachments.some(a => PdfAttachment.isPdfAttachment(a))
      if (hasPdfAttachment) {
        this.showPdfNotSupportedModal({
          titleText: SAVE_TEMPLATE_WITHOUT_PDF_TITLE,
          bodyText: SAVE_TEMPLATE_WITHOUT_PDF_BODY,
          cancelText: SAVE_TEMPLATE_WITHOUT_PDF_CANCEL,
          submitText: SAVE_TEMPLATE_WITHOUT_PDF_SUBMIT,
          onSubmitCb: this.createTemplate,
        })
      } else {
        this.createTemplate()
      }
    } else {
      this.createTemplate()
    }
  }

  createTemplateInContentLibrary = () => {
    const templateData = this.props.toTemplateData()
    const contentLibraryId = this.props.templateData.contentLibraryId.toString()
    const data = {
      useNewEndpoint: true, // Remove with PUB_30395_NEW_TEMPLATE_EXPERIENCE_IN_COMPOSER
      template: { contentLibraryId },
      ...templateData,
    }
    emit('message:create:template', data, this.props.closeComposer)
    if (isFeatureEnabled('PUB_30348_TRACK_SEND_NOW_ACTIONS')) {
      track(
        TrackingConstants.TRACKING_CONTEXT.COMPOSER,
        TrackingConstants.TRACKING_ACTIONS.NEW.NEW_COMPOSE.SAVE_CONTENT_LIBRARY,
      )
    }
  }

  createTemplateInContentLibraryOnClick = () => {
    if (isFeatureEnabledOrBeta('PUB_30723_LINKEDIN_PDF')) {
      const { mediaAttachments } = this.state
      const hasPdfAttachment = mediaAttachments.some(a => PdfAttachment.isPdfAttachment(a))
      if (hasPdfAttachment) {
        this.showPdfNotSupportedModal({
          titleText: SAVE_TEMPLATE_WITHOUT_PDF_TITLE,
          bodyText: SAVE_TEMPLATE_WITHOUT_PDF_BODY,
          cancelText: SAVE_TEMPLATE_WITHOUT_PDF_CANCEL,
          submitText: SAVE_TEMPLATE_WITHOUT_PDF_SUBMIT,
          onSubmitCb: this.createTemplateInContentLibrary,
        })
      } else {
        this.createTemplateInContentLibrary()
      }
    } else {
      this.createTemplateInContentLibrary()
    }
  }

  shouldSaveButtonBeDisabled() {
    const { isUsingLATM } = this.props
    const isUploading = this.props.isUploading

    return isUploading || isUsingLATM
  }

  shouldPostButtonBeDisabled() {
    if (isFeatureEnabled('PUB_30459_FIX_POST_NOW_LOADING_STATE')) {
      return this.props.isLoading
    } else {
      return this.state.isLoading
    }
  }

  isBeingAutoScheduled = () => {
    let isAutoScheduled = false
    const { entitlements } = this.props
    if (EntitlementsUtils.isFeatureEnabled(entitlements, AUTO_SCHEDULE_MESSAGE)) {
      // Find current autoschedule state, if it exists in local store. if not see if an initial state was passed in
      if (
        localStorage &&
        this.props.memberId &&
        localStorage.getItem(Constants.LAST_IS_AUTOSCHEDULED_LOCAL_STORAGE)
      ) {
        isAutoScheduled = JSON.parse(localStorage.getItem(Constants.LAST_IS_AUTOSCHEDULED_LOCAL_STORAGE))[
          this.props.memberId
        ]
      } else if (this.props.isAutoScheduledEnabled) {
        isAutoScheduled = true
      }
    }
    return isAutoScheduled
  }

  isBeingScheduled = () => {
    return this.props.onSaveTemplate
      ? false
      : this.state.selectedPublishTime === ComposerConstants.SCHEDULE_TIME.SCHEDULE ||
          this.isBeingAutoScheduled()
  }

  sendMessageNow = () => {
    const { entitlements, isUsingLATM, selectedOrganization, willSendMessage, timezoneName } = this.props
    const selectedMessageForEdit = getSelectedMessage(getComposerMessageState())

    if (
      ComposerUtils.doesAtLeastOneSocialNetworkBelongToSuspendedOrg(
        selectedMessageForEdit.socialNetworksKeyedById,
        selectedOrganization,
      )
    ) {
      renderSuspendContextConfirmationModal({
        isScheduled: ComposerUtils.isScheduled(selectedMessageForEdit, entitlements),
        onSubmit: willSendMessage,
        organization: selectedOrganization,
        timezoneName,
      })
      return
    }

    if (ValidationUtils.hasInstagramDirectInfo(this.state.fieldValidations)) {
      showConfirmationModal({
        titleText: INSTAGRAM_DIRECT_INFO_TITLE,
        bodyText: (
          <BannerContainer>
            <Banner type={TYPE_WARNING} messageText={INSTAGRAM_DIRECT_INFO_MESSAGE} />
            <P>{INSTAGRAM_DIRECT_INFO_BODY}</P>
          </BannerContainer>
        ),
        submitButtonText: INSTAGRAM_DIRECT_INFO_SUBMIT,
        cancelButtonText: INSTAGRAM_DIRECT_INFO_CANCEL,
        width: '615px',
        onSubmit: close => {
          if (!isUsingLATM) {
            willSendMessage()
          }
          close()
        },
      })
      return
    }

    if (!isUsingLATM) {
      willSendMessage()
    }
  }

  createDraftClicked = () => {
    const { createDraftOnClick, renderDraftSharingWarning, getNonPrivateSocialNetworkIds } = this.props
    const publisherPopupsSeen =
      (localStorage && JSON.parse(localStorage.getItem(PopupConstants.LOCALSTORAGE_POPUP_OBJECT))) || {}
    // eslint-disable-next-line dot-notation
    if (publisherPopupsSeen && publisherPopupsSeen[PopupConstants.POPUPS.DRAFT_SHARED_WARNING]) {
      createDraftOnClick('footer')
    } else {
      hasSeenPopover(PopupConstants.POPUPS.DRAFT_SHARED_WARNING).then(hasSeen => {
        const hasNonPrivateSocialNetworks = getNonPrivateSocialNetworkIds().length > 0
        if (!hasSeen && hasNonPrivateSocialNetworks) {
          renderDraftSharingWarning('footer')
        } else {
          createDraftOnClick('footer')
        }
      })
    }
    if (isFeatureEnabled('PUB_30348_TRACK_SEND_NOW_ACTIONS')) {
      track(
        TrackingConstants.TRACKING_CONTEXT.COMPOSER,
        TrackingConstants.TRACKING_ACTIONS.DRAFT.NEW_COMPOSE.SAVE_DRAFT,
      )
    }
  }

  setIsDuplicatingPost = (isDuplicating: boolean) =>
    new Promise(resolve => {
      this.props.dispatch(composerActions.setIsDuplicatingPost(isDuplicating))
      resolve(isDuplicating)
    })

  setSequentialPostingEnabled = (isSequentialPostingEnabled: boolean) =>
    new Promise(resolve => {
      this.props.dispatch(composerActions.setIsSequentialPostingEnabled(isSequentialPostingEnabled))
      resolve(isSequentialPostingEnabled)
    })

  onSequentialClick = () => {
    const handleSequentialClick = () => this.setSequentialPostingEnabled(true).then(this.sendMessageNow)
    const isDuplicatingPost = this.props.isDuplicatingPost

    if (isDuplicatingPost) {
      this.setIsDuplicatingPost(false).then(handleSequentialClick)
    } else {
      handleSequentialClick()
    }
    track(Constants.SEQUENTIAL_POSTS.TRACKING_ORIGIN, Constants.SEQUENTIAL_POSTS.TRACKING_ACTION)
  }

  onDuplicatePostClick = () => {
    const handleDuplicatePostClick = () => this.setIsDuplicatingPost(true).then(this.sendMessageNow)
    const isSequentialPostingEnabled = this.props.isSequentialPostingEnabled

    if (isSequentialPostingEnabled) {
      this.setSequentialPostingEnabled(false).then(handleDuplicatePostClick)
    } else {
      handleDuplicatePostClick()
    }
    track(Constants.DUPLICATE_POST.TRACKING_ORIGIN, Constants.DUPLICATE_POST.TRACKING_ACTION)
  }

  isMessageInReview = () => {
    const { messageState } = this.props

    return MessageUtils.isPendingState(messageState)
  }

  onPostButtonClick = () => {
    const { isEditMode, isDraft } = this.props

    const isReview = this.isMessageInReview()

    if ((isEditMode && !isDraft) || isReview) {
      track(TrackingConstants.TRACKING_ORIGINS.SAVE_EDITS, TrackingConstants.TRACKING_ACTION.SAVE_EDITS)
    }

    const isSequentialPostingEnabled = this.props.isSequentialPostingEnabled

    const isDuplicatingPost = this.props.isDuplicatingPost

    if (isSequentialPostingEnabled) {
      this.setSequentialPostingEnabled(false).then(this.sendMessageNow)
    } else if (isDuplicatingPost) {
      this.setIsDuplicatingPost(false).then(this.sendMessageNow)
    } else {
      if (isFeatureEnabled('PUB_30348_TRACK_SEND_NOW_ACTIONS')) {
        track(
          TrackingConstants.TRACKING_CONTEXT.COMPOSER,
          this.state.selectedPublishTime === ComposerConstants.SCHEDULE_TIME.IMMEDIATE
            ? TrackingConstants.TRACKING_ACTIONS.NEW.NEW_COMPOSE.POST_NOW
            : TrackingConstants.TRACKING_ACTIONS.NEW.NEW_COMPOSE.SCHEDULE,
        )
      }
      this.sendMessageNow()
    }
  }

  onSaveTemplateClick = () => {
    if (isFeatureEnabledOrBeta('PUB_30723_LINKEDIN_PDF')) {
      const { mediaAttachments } = this.state
      const hasPdfAttachment = mediaAttachments.some(a => PdfAttachment.isPdfAttachment(a))
      if (hasPdfAttachment) {
        this.showPdfNotSupportedModal({
          titleText: SAVE_TEMPLATE_WITHOUT_PDF_TITLE,
          bodyText: SAVE_TEMPLATE_WITHOUT_PDF_BODY,
          cancelText: SAVE_TEMPLATE_WITHOUT_PDF_CANCEL,
          submitText: SAVE_TEMPLATE_WITHOUT_PDF_SUBMIT,
          onSubmitCb: this.saveTemplate,
        })
      } else {
        this.saveTemplate()
      }
    } else {
      this.saveTemplate()
    }
  }

  saveTemplate = () => {
    const { onSaveTemplate, selectedOrganization, toTemplateData } = this.props
    const contentLibraryId = this.props.templateData?.contentLibraryId?.toString()
    const templateData = toTemplateData(selectedOrganization && selectedOrganization.organizationId)
    const data = {
      ...templateData,
      template: { contentLibraryId },
    }
    onSaveTemplate(data)
  }

  onChangePublishingMode = publishingMode => {
    const selectedMessageId = this.state.selectedMessageId
    composerMessageActions.updateFieldById(selectedMessageId, 'publishingMode', publishingMode)
    // Reset instagram pairing errors if switching to Direct Publish mode
    if (publishingMode === Constants.INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH) {
      composerMessageActions.updateInstagramPairingErrors([])
    }
    emit('composer:change:publishingMode', publishingMode)
  }

  onDropdownToggle = isOpen => {
    if (isOpen) {
      track(
        TrackingConstants.TRACKING_CONTEXT.COMPOSER,
        TrackingConstants.TRACKING_ACTIONS.NEW.NEW_COMPOSE.MORE_PUBLISHING_OPTIONS,
        { isOpen },
      )
    }
  }

  onSelectDirectPublish = () => this.onChangePublishingMode(INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH)

  onSelectPushPublish = () => this.onChangePublishingMode(INSTAGRAM_PUBLISHING_MODES.PUSH_PUBLISH)

  /**
   * Refetches social profiles and clears errors when a new device is paired
   */
  onDevicePairDetected = () => {
    this.props.onFetchSocialProfiles()
    composerMessageActions.updateInstagramPairingErrors([])
    track(
      Constants.DUAL_PUBLISH_SETUP_TRACKING.TRACKING_ORIGIN,
      Constants.DUAL_PUBLISH_SETUP_TRACKING.TRACKING_ACTIONS.PUSH_PUBLISH_SETUP.COMPLETE,
    )
  }

  onAmplifyClick = () => {
    const { onSendToAmplify } = this.props
    if (isFeatureEnabledOrBeta('PUB_30723_LINKEDIN_PDF')) {
      const { mediaAttachments } = this.state
      const hasPdfAttachment = mediaAttachments.some(a => PdfAttachment.isPdfAttachment(a))
      if (hasPdfAttachment) {
        this.showPdfNotSupportedModal({
          titleText: SEND_TO_AMPLIFY_WITHOUT_PDF_TITLE,
          bodyText: SEND_TO_AMPLIFY_WITHOUT_PDF_BODY,
          cancelText: SEND_TO_AMPLIFY_WITHOUT_PDF_CANCEL,
          submitText: SEND_TO_AMPLIFY_WITHOUT_PDF_SUBMIT,
          onSubmitCb: onSendToAmplify,
        })
      } else {
        onSendToAmplify()
      }
    } else {
      onSendToAmplify()
    }
  }

  render() {
    const {
      autoScheduleSettings,
      canSendNow,
      datesEnabledForScheduling,
      footerConf,
      canSendToAmplify,
      isAutoScheduledEnabled,
      isBulkComposer,
      isDraft,
      isEditMode,
      isTemplate,
      isVideoMessage,
      maxScheduledMessages,
      memberId,
      memberInTrial,
      memberSignupDate,
      onSaveTemplate,
      onUpdateScheduleDate,
      selectedOrganization,
      selectedSocialNetworksTotal,
      sendDate,
      showAutoScheduleSettings,
      templateData,
      timezoneName,
      totalScheduledMessages,
      updateDraftOnClick,
      writableContentLibraries,
      entitlements,
      messageType,
      isInstagramStory,
      isPinterest,
      isAmplify,
      isAmplifyEditPost,
    } = this.props

    const isBeingScheduled = this.isBeingScheduled()
    const isSaveButtonDisabled = this.shouldSaveButtonBeDisabled()

    const isSequentialPostingEnabled = this.props.isSequentialPostingEnabled
    const isDuplicatingPost = this.props.isDuplicatingPost
    const isPredictiveComplianceEnabled = this.state.isPredictiveComplianceEnabled
    const predictiveComplianceStatus = this.state.predictiveComplianceStatus
    let showLoading = this.shouldPostButtonBeDisabled()

    if (isFeatureEnabled('PUB_13776_PREDICTIVE_COMPLIANCE')) {
      showLoading =
        showLoading ||
        (isPredictiveComplianceEnabled &&
          PredictiveComplianceUtils.getState(predictiveComplianceStatus).isInProgress)
    }

    let saveButton
    let shouldHideScheduler = footerConf && footerConf.PUBLISH_MENU && footerConf.PUBLISH_MENU.isDisabled
    let shouldHidePostButton = false
    const isNewTemplate =
      isFeatureEnabled('PUB_30395_NEW_TEMPLATE_EXPERIENCE_IN_COMPOSER') &&
      !isEditMode &&
      ComposerUtils.isTemplate(messageType) &&
      !templateData?.templateId

    if (isEditMode && ComposerUtils.isDraft(messageType)) {
      const onSaveDraftButtonClick = () => updateDraftOnClick('footer')
      saveButton = (
        <SaveDraftButton disabled={isSaveButtonDisabled} onClick={onSaveDraftButtonClick}>
          {SAVE_CHANGES}
        </SaveDraftButton>
      )
    } else if (isAmplifyEditPost) {
      saveButton = <EditPostNextButton onClick={this.onAmplifyClick}>{NEXT}</EditPostNextButton>
    } else if (isNewTemplate) {
      saveButton = (
        <NewTemplateButton
          disabled={isSaveButtonDisabled}
          onClick={this.createTemplateInContentLibraryOnClick}
        >
          {NEW_TEMPLATE}
        </NewTemplateButton>
      )
      shouldHideScheduler = true
      shouldHidePostButton = true
    }

    if (onSaveTemplate) {
      // You cannot schedule templates, so you should not see the calendar
      shouldHideScheduler = true
    }
    if (isAmplifyEditPost) {
      shouldHideScheduler = true
      shouldHidePostButton = true
    }

    const shouldShowSaveToContentLib =
      writableContentLibraries.length > 0 && (!isEditMode || isTemplate) && !isInstagramStory

    const draftFirstPostNewUsersExperimentEnabled =
      getExperimentVariation('grw_ss_onboarding_7_0') === 'variation_1'
    const draftFirstPostExistingUsersExperimentEnabled =
      getExperimentVariation('grw_ss_onboarding_7_1') === 'variation_1'
    const shouldShowSaveAsDraftInFooter =
      isFeatureEnabled('PGR_2050_DRAFT_FIRST_POST') &&
      (draftFirstPostNewUsersExperimentEnabled || draftFirstPostExistingUsersExperimentEnabled) &&
      !shouldHidePostButton &&
      !Boolean(onSaveTemplate) &&
      !isEditMode

    const scheduleButton = !shouldHidePostButton && (
      <PostButton
        {...{
          isBulkComposer,
          isDraft,
          isDuplicatingPost,
          isPredictiveComplianceEnabled,
          isSequentialPostingEnabled,
          selectedSocialNetworksTotal,
        }}
        canCreateTemplate={shouldShowSaveToContentLib}
        canSendToAmplify={canSendToAmplify}
        isDisabled={this.shouldSaveButtonBeDisabled()}
        isEdit={isEditMode}
        isLoading={showLoading}
        isReview={this.isMessageInReview()}
        isScheduled={this.isBeingScheduled()}
        isTemplate={Boolean(onSaveTemplate)}
        onAmplifyClick={this.onAmplifyClick}
        onCreateTemplateClick={this.onCreateTemplateClick}
        onDraftClick={this.createDraftClicked}
        onDuplicateClick={this.onDuplicatePostClick}
        onPostButtonClick={this.onPostButtonClick}
        onSaveTemplate={this.onSaveTemplateClick}
        onSequentialClick={this.onSequentialClick}
        onDropdownToggle={isFeatureEnabled('PUB_30348_TRACK_SEND_NOW_ACTIONS') ? this.onDropdownToggle : null}
      />
    )

    const dualPublishingToggle =
      !isBulkComposer && this.state.selectedMessageId ? (
        <DualPublishWrapperWithSocialProfiles
          postType={this.state.postType}
          isOnboardingOpen={this.state.isOnboardingOpen}
          onDevicePairDetected={this.onDevicePairDetected}
          onSelectDirectPublish={this.onSelectDirectPublish}
          onSelectPushPublish={this.onSelectPushPublish}
          selectedProfileIds={this.props.selectedProfileIds}
          shouldRender={!!this.state.selectedMessageCount}
        />
      ) : null

    const SaveAsDraftButton = venk(
      withHsTheme(styled(Button)`
        margin-right: ${() => getThemeValue(t => t.spacing.spacing8)};
        ${ExpandedUiMixin};
      `),
      'SaveAsDraftButton',
    )

    const onClickSaveAsDraftButton = () => {
      track(
        TrackingConstants.TRACKING_CONTEXT.COMPOSER,
        TrackingConstants.TRACKING_ACTIONS.DRAFT.NEW_COMPOSE.SAVE_AS_DRAFT,
      )
      this.createDraftClicked()
    }

    return (
      <StyledComposerBar>
        {dualPublishingToggle}
        {shouldShowSaveAsDraftInFooter && (
          <SaveAsDraftButton onClick={onClickSaveAsDraftButton}>{SAVE_AS_DRAFT}</SaveAsDraftButton>
        )}
        {shouldHideScheduler ? (
          <span /> // Render empty span to preserve footer layout
        ) : (
          <>
            <InvisibleH3>{SCHEDULING_OPTIONS}</InvisibleH3>
            <Scheduler
              {...{
                entitlements,
                autoScheduleSettings,
                canSendNow,
                datesEnabledForScheduling,
                footerConf,
                isAutoScheduledEnabled,
                isBeingScheduled,
                isBulkComposer,
                isDraft,
                isEditMode,
                isVideoMessage,
                isPinterest,
                isAmplify,
                isAmplifyEditPost,
                maxScheduledMessages,
                memberId,
                memberInTrial,
                memberSignupDate,
                onUpdateScheduleDate,
                sendDate,
                showAutoScheduleSettings,
                timezoneName,
                totalScheduledMessages,
              }}
              isPrimary={shouldShowSaveAsDraftInFooter}
              onUpdatePublishTime={this.onUpdatePublishTime}
              selectedPublishTime={this.state.selectedPublishTime}
              organizationId={selectedOrganization?.organizationId}
            />
          </>
        )}
        {saveButton}
        {scheduleButton}
      </StyledComposerBar>
    )
  }
}

const ConnectedComposerFooter = compose(
  reduxConnect(({ composer }: RootState) => ({
    isDuplicatingPost: composer.isDuplicatingPost,
    isSequentialPostingEnabled: composer.isSequentialPostingEnabled,
    isSequentialPostingInProgress: composer.isSequentialPostingInProgress,
    isUploading: composer.isUploading,
    isLoading: composer.isSendingMessage,
  })),
  connect(mediaLibraryStore, state => ({
    writableContentLibraries: getWritableContentLibraries(state),
  })),
)(ComposerFooter)

export default ConnectedComposerFooter
