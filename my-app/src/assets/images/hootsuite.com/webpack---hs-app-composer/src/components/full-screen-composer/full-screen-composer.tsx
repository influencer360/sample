import React, { memo } from 'react'
import Immutable, { List } from 'immutable'
import get from 'lodash/get'
import { connect as reduxConnect } from 'react-redux'
import styled from 'styled-components'
import _ from 'underscore'

import {
  v2,
  willDeleteDraftCampaign,
  willSaveDraftCampaign,
  willUpdateDraftCampaign,
} from 'fe-ae-lib-boost-api'
import { interana } from 'fe-ae-lib-boost-tracking'
import axios from 'fe-axios'
import { TYPE_SUCCESS, TYPE_ERROR } from 'fe-comp-banner'
import { A, P } from 'fe-comp-dom-elements'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { useTheme } from 'fe-hoc-theme'
import { venk } from 'fe-hoc-venkman'
import { AUTO_SCHEDULE_MESSAGE, SCHEDULE_MESSAGES } from 'fe-lib-entitlements'
import { emit, on, off } from 'fe-lib-hootbus'
import { get as localStorageGet, set as localStorageSet } from 'fe-lib-localstorage'
import { logError, logInfo } from 'fe-lib-logging'
import { showConfirmationModal } from 'fe-pnc-comp-confirmation-modal'
import { GroupedProfiles } from 'fe-pnc-comp-grouped-profiles'
import { showLoadingModal, removeLoadingModal } from 'fe-pnc-comp-loading-modal'
import { CFIConstants } from 'fe-pnc-constants'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkType } from 'fe-pnc-constants-social-profiles'
import {
  actions as ComposerMessageActions,
  getSelectedMessage,
  getSelectedMessageValue,
  getState as getComposerMessageState,
  selectedMessageInterface as SelectedMessageState,
} from 'fe-pnc-data-composer-message'
import { actions as MessagePreviewsActions } from 'fe-pnc-data-message-previews'
import { actions as pinterestActions } from 'fe-pnc-data-pinterest'
import { isEnabled as isPredictiveComplianceEnabled } from 'fe-pnc-data-predictive-compliance'
import { store as socialProfileStore } from 'fe-pnc-data-social-profiles-v2'
import type { SocialProfileState, Profile } from 'fe-pnc-data-social-profiles-v2'
import {
  createBatchMessages,
  editMessage,
  hasSeenPopover,
  mpsCancelRequests,
  seenPopover,
} from 'fe-pnc-lib-api'
import { isFeatureEnabled, isFeatureEnabledOrBeta, isFeatureDisabled } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'

import ValidationErrorMessages from 'fe-pnc-validation-error-messages'
import ComposerConstants from '@/constants/composer'
import ComposerErrorMessages from '@/constants/composer-error-messages'
import Constants from '@/constants/constants'
import { SHOW_SCHEDULED_MESSAGE_LIMIT_PAYWALL } from '@/constants/events'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import PopupConstants from '@/constants/popups'
import TrackingConstants from '@/constants/tracking'
import { maybeShowMessageStatusModal } from '@/handlers/post-message-create'
import Message from '@/models/message'
import { composerActions } from '@/redux/reducers/composer'
import { AppDispatch, RootState } from '@/redux/store'
import {
  AutoScheduleSettings,
  Entitlements,
  Flux,
  Organization,
  Organizations,
  PublisherSettings,
} from '@/typings/Flux'
import { Tag, TemplateData } from '@/typings/Message'
import { SocialNetwork, SocialNetworksKeyedByType } from '@/typings/SocialNetwork'
import { preprocessAmplifyPersonalized } from '@/utils/amplify-utils'
import { goToBoostToastElement } from '@/utils/boost-toasts'
import { dispatchFromPublisherSettings } from '@/utils/composer-data-fetcher'
import ComposerUtils from '@/utils/composer-utils'
import {
  handleMessageEditInContentPlanner,
  isPlannerView,
  isPublisherView,
  refreshContentPlannerCalendar,
  isHomepageView,
} from '@/utils/dashboard-utils'
import { EntitlementsUtils } from '@/utils/entitlement-utils'
import MessageUtils from '@/utils/message-utils'
import {
  clearIsAutoSecheduledLocalStorage,
  setIsAutoScheduledLocalStorage,
} from '@/utils/scheduler-local-storage-utils'
import statusObject, { StatusObject } from '@/utils/status-bar'
import StatusToastUtils, { AUTO_HIDE_TIME_LONG } from '@/utils/status-toast-utils'
import { track } from '@/utils/tracking'
import { twitterBaggageHeaders } from '@/utils/twitter-headers'
import ValidationUtils from '@/utils/validation-utils'
import Composer from '../composer/composer'
import ComposerFunctional from '../composer/composer-functional'
import ComposerHeader from '../composer/composer-header'
import DraftSharingWarning from '../draft-sharing-warning'
import { handleSendToAmplify } from './amplify-utils'
import { logMessageSent } from './composer-message-tracking'

const { trackComposeCampaignPublicationSucceeded, trackComposeCampaignPublicationFailed } = interana
const {
  willPublishCampaign: willPublishCampaignV2,
  willDeleteScheduledCampaign: willDeleteScheduledCampaignV2,
} = v2

export const TOAST_TIMEOUT = 10000
const SUCCESS_TOAST_MAX_TIMEOUT = 30000
const LOADING_MODAL_TIMEOUT = 2000

const SUCCESS_CREATE_BOOST_CAMPAIGN = translation._('We have successfully boosted your post!')
// prettier-ignore
const UNABLE_TO_CREATE_BOOST_CAMPAIGN_MANUAL_FIX = translation._('We were not able to create your Boost campaign. Please manually boost your post in streams.')
// prettier-ignore
const UNABLE_TO_CREATE_BOOST_CAMPAIGN_PLANNER_FIX = translation._('We were not able to create your Boost campaign. You can review your post in planner.')
const UNABLE_TO_DELETE_BOOST_CAMPAIGN = translation._('We were not able to delete your Boost campaign.')
const UNABLE_TO_UPDATE_BOOST_CAMPAIGN = translation._('We were not able to update your Boost campaign.')
// prettier-ignore
const UNABLE_TO_CREATE_BOOST_CAMPAIGN_DRAFT = translation._('We were not able to create your Boost campaign draft.')
// prettier-ignore
const UNABLE_TO_UPDATE_BOOST_CAMPAIGN_DRAFT = translation._('We were not able to update your Boost campaign draft.')
// prettier-ignore
const UNABLE_TO_DELETE_BOOST_CAMPAIGN_DRAFT = translation._('We were not able to delete your Boost campaign draft.')
const STAY_HERE = translation._('Stay here')
const LEAVE_COMPOSER = translation._('Leave composer')
const LEAVE_COMPOSER_QUESTION = translation._('Leave composer?')
const MESSAGE_DISCARDED = translation._('Your post will be discarded. Are you sure you want to leave?')
const CANCEL = translation._('Cancel')
const CONFIRM = translation._('Confirm')
const CONTINUE = translation._('Continue')
const VIEW_IN_PLANNER = translation._('View in Planner')

// eslint-disable-next-line react-hooks/rules-of-hooks
const HeaderLabel = useTheme(styled.div`
  font-size: ${p => (p.draftHeader ? '18px' : '14px')};
  font-weight: ${p => p.$theme(t => t.typography.weight.semi)};
  margin-top: -2px;
  margin-left: ${p => (p.hasIcon ? '6px' : '20px')};
`)

const HeaderLabelContainer = styled.div`
  display: flex;
  margin-left: 20px;
`

export const ErrorToastMessage = styled.div`
  white-space: pre-line;
`

const SUCCESS_TOAST_PROFILE_GROUPS_WIDTH = 392
const GroupedProfilesContainer = styled.div`
  width: ${SUCCESS_TOAST_PROFILE_GROUPS_WIDTH}px;
`

const GroupedProfilesSuccess = venk(
  props => (
    <GroupedProfilesContainer>
      <GroupedProfiles>{props.children}</GroupedProfiles>
    </GroupedProfilesContainer>
  ),
  'GroupedProfilesSuccess',
)

HeaderLabel.displayName = 'HeaderLabel'
HeaderLabelContainer.displayName = 'HeaderLabelContainer'
ErrorToastMessage.displayName = 'ErrorToastMessage'
GroupedProfilesSuccess.displayName = 'GroupedProfilesSuccess'

const getSocialNetworkSpec = boostRequest => {
  const { social_network: socialNetwork } = boostRequest
  return `${socialNetwork.toLowerCase()}_spec`
}

const willPublishCampaign = boostRequest => {
  const specKey = getSocialNetworkSpec(boostRequest)
  const { [specKey]: spec, social_network: socialNetwork, ...sharedInfo } = boostRequest
  return willPublishCampaignV2(socialNetwork, sharedInfo, spec)
}

const parseTrackingInfo = boostRequest => {
  // it's ok to have some false positives about instagram usage
  const { [getSocialNetworkSpec(boostRequest)]: spec, social_network: socialNetwork } = boostRequest
  const {
    audience_type: audienceType,
    objective,
    targeting,
    objective_type: objectiveType,
    dsa_beneficiary: dsaBeneficiary = '',
    dsa_payor: dsaPayor = '',
  } = spec
  return {
    socialNetwork: socialNetwork,
    facebook: {
      isInstagramEnabled: targeting ? targeting.indexOf('instagram') > 0 : undefined,
      audienceType,
      objective,
      hasDsaValues: Boolean(dsaBeneficiary || dsaPayor),
    },
    instagram: {
      isFacebookEnabled: targeting ? targeting.indexOf('facebook') > 0 : undefined,
      audienceType,
      objective,
      hasDsaValues: Boolean(dsaBeneficiary || dsaPayor),
    },
    linkedin: {
      objectiveType,
    },
  }
}

type TrackingCloseAction = 'saveChanges' | 'discardChanges' | 'saveDraft' | 'discardPost' | 'close'

const trackCloseAction = (action: TrackingCloseAction): void => {
  if (isFeatureEnabledOrBeta('PUB_30350_TRACK_MINIMIZE_CLOSE')) {
    track(TrackingConstants.TRACKING_ORIGINS.CLOSE, TrackingConstants.TRACKING_ACTION.COMPOSER_CLOSE_BUTTON, {
      action,
    })
  }
}

interface FullScreenComposerProps {
  DataDrafts: Record<string, unknown>
  FluxComponent(...args: Array<unknown>): unknown
  autoScheduleSettings: AutoScheduleSettings
  campaigns?: List<unknown>
  composerConf?: Record<string, unknown>
  csrf: string
  customContext?: string
  dispatch: AppDispatch
  entitlements: Entitlements
  excludedNetworkTypes?: Array<SocialNetworkType>
  expiredProfiles?: Array<Profile>
  facadeApiUrl: string
  flux: Flux
  ideaId?: string
  canSendToAmplify: boolean
  isAutoScheduledEnabled?: boolean
  isDraftAutoScheduled?: boolean
  isDevOrStaging?: boolean
  isDuplicatingPost: false
  isEditMode?: boolean
  isInCustomContext?: boolean
  isSequentialPostingEnabled: false
  isUsingLATM?: boolean
  language?: string
  linkShorteners?: Array<unknown>
  memberEmail?: string
  memberId: number
  memberInTrial?: boolean
  memberName?: string
  memberSignupDate: string
  onClose(): void
  onMinimize?(): void
  onSaveTemplate?(): void
  onSelectNewOrganization?: (organization: Organization) => void
  origin: string
  organizations?: Organizations
  privateSocialProfiles?: Array<Profile>
  publisherSettings: PublisherSettings
  saveToAmplify?(): void
  selectedOrganization?: Record<string, unknown>
  shortenerConfigs?: Array<unknown>
  showAutoScheduleSettings?(): void
  showCampaignsOnboarding?: boolean
  showOnboarding?: boolean
  socialNetworks: SocialNetwork[]
  socialProfilesKeyedByType?: SocialNetworksKeyedByType
  stateFarmContentSourceId?: number
  suggestedTags?: Tag[]
  tags?: Tag[]
  templateData?: TemplateData
  timezoneName: string
  zIndex?: number
  acceptedHashtagSuggestion?: boolean
}

export class FullScreenComposer extends React.PureComponent<FullScreenComposerProps> {
  readonly composerMessageActions: typeof ComposerMessageActions
  static displayName = 'Full Screen Composer'

  static defaultProps = {
    autoScheduleSettings: {},
    campaigns: Immutable.List(),
    dispatch: action => action,
    entitlements: {},
    expiredProfiles: [],
    canSendToAmplify: false,
    isAutoScheduledEnabled: false,
    isDraftAutoScheduled: false,
    isDuplicatingPost: false,
    isEditMode: false,
    isInCustomContext: false,
    isSequentialPostingEnabled: false,
    isUsingLATM: false,
    language: 'en',
    linkShorteners: [],
    memberEmail: '',
    memberInTrial: false,
    onMinimize: () => {}, // optional because isMinimized is optional
    onSelectNewOrganization: () => {},
    privateSocialProfiles: [],
    publisherSettings: {},
    saveToAmplify: () => {},
    selectedOrganization: {},
    showAutoScheduleSettings: () => {},
    showCampaignsOnboarding: false,
    showOnboarding: false,
    socialNetworks: [],
    stateFarmContentSourceId: -1,
    suggestedTags: [],
    tags: [],
    templateData: {},
  } as Partial<FullScreenComposerProps>

  statusObject: StatusObject

  constructor(props: FullScreenComposerProps) {
    super(props)

    // Here we populate the message store with a message so Full Screen Composer jumps right into the editing
    this.composerMessageActions = ComposerMessageActions

    this._tetheredElement = null
    this._retrieveTotalScheduledMessages = null
    this._fetchPreviewData = null

    // We want to make sure we're always using the same instance. This is important for dependency injection
    this.statusObject = statusObject

    this.onCloseButtonClick = this.onCloseButtonClick.bind(this)
    this.handleSendToAmplify = this.handleSendToAmplify.bind(this)

    if (isFeatureEnabled('PUB_13776_PREDICTIVE_COMPLIANCE')) {
      if (this.props.selectedOrganization && this.props.selectedOrganization.organizationId) {
        isPredictiveComplianceEnabled(this.props.selectedOrganization.organizationId)
      }
    }

    if (EntitlementsUtils.isFeatureEnabled(props.entitlements, AUTO_SCHEDULE_MESSAGE)) {
      // If autoschedule flag passed in at start save it to state and local storage so all stuff works as expected
      const isAutoscheduled = this.props.isAutoScheduledEnabled || this.props.isDraftAutoScheduled
      if (isAutoscheduled) {
        this.setState({
          isAutoscheduled,
        })
        setIsAutoScheduledLocalStorage(isAutoscheduled, this.props.memberId)
      }
    }

    // always allow composer to close on first open
    this.setSequentialPostingEnabled(false)
    this.setIsDuplicatingPost(false)
  }

  setIsDuplicatingPost = (isDuplicating: boolean) =>
    this.props.dispatch(composerActions.setIsDuplicatingPost(isDuplicating))
  setSequentialPostingEnabled = (isSequentialPostingEnabled: boolean) =>
    this.props.dispatch(composerActions.setIsSequentialPostingEnabled(isSequentialPostingEnabled))

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps: FullScreenComposerProps) {
    if (
      this.props.selectedOrganization &&
      nextProps.selectedOrganization &&
      this.props.selectedOrganization.organizationId !== nextProps.selectedOrganization.organizationId &&
      isFeatureEnabled('PUB_12938_STATE_FARM_NC_URL_PARAMS') &&
      ComposerUtils.isStateFarm(nextProps.selectedOrganization.organizationId)
    ) {
      // when the org is changed to the valid Statefarm org, ensure the memberEmail and stateFarmContentSourceId are available on the message wrapper
      if (nextProps.stateFarmContentSourceId < 0) {
        this.composerMessageActions.updateFieldById(
          SelectedMessageState.messageId(),
          Constants.FIELD_TO_UPDATE.STATE_FARM_CONTENT_SOURCE_ID,
          this.props.stateFarmContentSourceId,
        )
      }
      this.composerMessageActions.updateFieldById(
        SelectedMessageState.messageId(),
        Constants.FIELD_TO_UPDATE.MEMBER_EMAIL,
        this.props.memberEmail,
      )
    }

    if (
      this.props.selectedOrganization &&
      nextProps.selectedOrganization &&
      this.props.selectedOrganization.organizationId !== nextProps.selectedOrganization.organizationId &&
      EntitlementsUtils.isFeatureEnabled(this.props.entitlements, AUTO_SCHEDULE_MESSAGE)
    ) {
      // when the org is changed ensure the previously-set isAutoScheduled flag is available again on the message wrapper
      this.composerMessageActions.updateFieldById(
        SelectedMessageState.messageId(),
        Constants.FIELD_TO_UPDATE.IS_AUTO_SCHEDULED,
        SelectedMessageState.isAutoScheduled(),
      )
    }
  }

  componentDidMount() {
    const {
      dispatch,
      isInCustomContext,
      memberEmail,
      origin,
      publisherSettings,
      selectedOrganization,
      showOnboarding,
    } = this.props

    if (SelectedMessageState.messagesCount() === 0) {
      this.composerMessageActions.set([ComposerUtils.createMessage()])
      this.composerMessageActions.selectById(ComposerConstants.BASE_MESSAGE_ID)
    }

    dispatchFromPublisherSettings(publisherSettings, dispatch)

    if (
      isFeatureEnabled('PUB_12938_STATE_FARM_NC_URL_PARAMS') &&
      ComposerUtils.isStateFarm(selectedOrganization?.organizationId)
    ) {
      const stateFarmContentSourceId = SelectedMessageState.stateFarmContentSourceId()
      const selectedBaseMessage = SelectedMessageState.getBaseMessage()
      // When editing a message that has contentLibraryTemplateId we need to preserve it by taking the value from the linkSettings and place it on the message wrapper
      if (Array.isArray(selectedBaseMessage.linkSettings) && selectedBaseMessage.linkSettings.length > 0) {
        if (
          stateFarmContentSourceId < 0 &&
          parseInt(selectedBaseMessage.linkSettings[0].contentLibraryTemplateId, 10) > 0
        ) {
          this.composerMessageActions.updateFieldById(
            SelectedMessageState.messageId(),
            Constants.FIELD_TO_UPDATE.STATE_FARM_CONTENT_SOURCE_ID,
            selectedBaseMessage.linkSettings[0].contentLibraryTemplateId,
          )
        }
      } else {
        // when creating a message from a content source set the stateFarmContentSourceId
        if (SelectedMessageState.stateFarmContentSourceId() < 0) {
          this.composerMessageActions.updateFieldById(
            SelectedMessageState.messageId(),
            Constants.FIELD_TO_UPDATE.STATE_FARM_CONTENT_SOURCE_ID,
            stateFarmContentSourceId,
          )
        }
      }
      this.composerMessageActions.updateFieldById(
        SelectedMessageState.messageId(),
        Constants.FIELD_TO_UPDATE.MEMBER_EMAIL,
        memberEmail,
      )
    }

    if (!isInCustomContext && showOnboarding) {
      _.defer(() => {
        emit('overlay:init', 'wizard', 'walkthroughComposer', { origin })
      })
    }

    on('full_screen_composer:action:close', this.onChangeToBulkCompose)
    on('amplify:send:success', this.close)
  }

  componentWillUnmount() {
    mpsCancelRequests()
    off('full_screen_composer:action:close', this.onChangeToBulkCompose)
    off('amplify:send:success', this.close)
  }

  close = (shouldRefreshContentPlanner = true) => {
    // clear the sequential posting flag
    this.setSequentialPostingEnabled(false)
    this.setIsDuplicatingPost(false)

    this.props.dispatch(composerActions.setAcceptedHashtagSuggestion(false))

    this.props.onClose() // close first, as this will stop the component from listening to state changes
    this.composerMessageActions.reset() // this is a state change, so will trigger a re-render if the component was open

    MessagePreviewsActions.resetPreviews()

    this.clearAutoScheduleState(this.props.memberId)

    pinterestActions.resetPinterestBoards()

    if (shouldRefreshContentPlanner) {
      refreshContentPlannerCalendar()
    }

    emit('full_screen_composer:response:close:accept')

    try {
      if (JSON.parse(localStorageGet(Constants.COMPOSER_OPENED_FROM_SUGGESTED_POST, null))) {
        localStorageSet(Constants.COMPOSER_OPENED_FROM_SUGGESTED_POST, false)
      }
      if (JSON.parse(localStorageGet(Constants.COMPOSER_OPENED_FROM_PLANNER_POST_MENU, null))) {
        localStorageSet(Constants.COMPOSER_OPENED_FROM_PLANNER_POST_MENU, false)
      }
    } catch (e) {}
  }

  createBoostCampaign(data, messageToSend, boostRequest) {
    const isScheduled = !_.isNull(messageToSend.baseMessage.sendDate)
    const { socialNetwork, ...spec } = parseTrackingInfo(boostRequest)

    return willPublishCampaign(boostRequest)
      .then(() => {
        StatusToastUtils.createToast(
          '',
          SUCCESS_CREATE_BOOST_CAMPAIGN,
          TYPE_SUCCESS,
          TOAST_TIMEOUT,
          goToBoostToastElement(boostRequest),
        )
        trackComposeCampaignPublicationSucceeded(socialNetwork, spec)
        return data // eslint-disable-line consistent-return
      })
      .catch(e => {
        trackComposeCampaignPublicationFailed(socialNetwork, spec)

        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during publishing Boost campaign', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
          const errorText = isScheduled
            ? UNABLE_TO_CREATE_BOOST_CAMPAIGN_PLANNER_FIX
            : UNABLE_TO_CREATE_BOOST_CAMPAIGN_MANUAL_FIX
          StatusToastUtils.createToast('', errorText, TYPE_ERROR, TOAST_TIMEOUT)
        }
        return data // eslint-disable-line consistent-return
      })
  }

  removeBoostDraft(data, draftId) {
    // Ensure that no orphan boost drafts are left on the db
    return willDeleteDraftCampaign(draftId)
      .then(() => data)
      .catch(e => {
        logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed boost draft delete during the post publishing', {
          errorMessage: JSON.stringify(e.message),
          stack: JSON.stringify(e.stack),
        })
        return data
      })
  }

  deleteDraft(draftId, messageToSend, messages, statusMessage) {
    const { DataDrafts } = this.props
    DataDrafts.deleteDraftById(draftId)
      .then(resp => {
        if (resp) {
          // Refresh the Planner view by deleting the draft
          if (document.querySelector('.rc-Planner')) {
            const content = {
              id: messageToSend.id,
              startDate: messageToSend.sendDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS || null,
              contentType: 'DRAFT',
            }
            emit('content_planner:content_deleted', content)
          }
          this.statusObject.update(statusMessage, 'success', true)
          return messageToSend.id
        }
        return messageToSend.id
      })
      .then(() => {
        this.deleteDraftCampaignByDraftId(draftId, messageToSend.isBoosted)
      })
      .catch(e => {
        this.statusObject.update(
          translation._('Your post(s) were sent correctly, but unable to delete draft'),
          'success',
          true,
        )
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER_DRAFTS, 'Failed during delete draft by id', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
        return messageToSend.id
      })
    this.emitMessageSuccess(messages)
    this.close()
  }

  showGroupedProfilesSuccessToast(messages, messageToSend, statusMessage) {
    const { id, scheduledSendTime } = messages[0]
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
      Object.assign({}, acc, { [cur.type]: (acc[cur.type] || []).concat(cur.username) })

    const successfulSnIds = messages.map(msg => msg?.socialProfile?.id)
    // Formula for success toast timeout is AUTO_HIDE_TIME_LONG plus one second for each additional message
    // up to a maximum 30 seconds timeout
    const { isDuplicatingPost } = this.props
    const successToastTimeout =
      isDuplicatingPost && messageToSend.isBoosted
        ? AUTO_HIDE_TIME_LONG
        : Math.min(AUTO_HIDE_TIME_LONG + (messages.length - 1) * 1000, SUCCESS_TOAST_MAX_TIMEOUT)
    const excludedViews = isPublisherView() || isPlannerView()
    const shouldForceViewPlanner =
      isFeatureEnabledOrBeta('PUB_28399_FORCE_VIEW_IN_PLANNER') &&
      !isFeatureEnabledOrBeta('PUB_28399_FORCE_VIEW_IN_PLANNER_EXCLUSIONS') &&
      !excludedViews
    const plannerURL = `#/planner?date=${scheduledSendTime}&messageId=${id}`
    StatusToastUtils.createToast(
      ComposerUtils.determineSuccessTitle({
        messageToSend,
        responseMessages: messages,
        isDuplicatingPost,
        entitlements: this.props.entitlements,
      }),
      statusMessage,
      TYPE_SUCCESS,
      successToastTimeout,
      <>
        <GroupedProfilesSuccess>
          {messageToSend.socialNetworksKeyedById
            .toArray()
            .filter(msg => successfulSnIds.find(m => m === msg.socialNetworkId))
            .sort(sortByType)
            .reduce(groupUsernamesByType, {})}
        </GroupedProfilesSuccess>
        {scheduledSendTime && !shouldForceViewPlanner && (
          <A
            onClick={() => {
              track(
                `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.schedule`,
                TrackingConstants.TRACKING_ACTION.PLANNER_DEEP_LINK_CLICKED,
              )
              window.location.hash = plannerURL
            }}
          >
            {VIEW_IN_PLANNER}
          </A>
        )}
      </>,
    )

    if (scheduledSendTime && shouldForceViewPlanner) {
      track(
        `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.schedule`,
        TrackingConstants.TRACKING_ACTION.PLANNER_DEEP_LINK_FORCED,
      )
      window.location.hash = plannerURL
    }
  }

  showPendingApprovalSuccessToast(messages, messageToSend, statusMessage) {
    const { id, scheduledSendTime } = messages[0]

    // Formula for success toast timeout is AUTO_HIDE_TIME_LONG plus one second for each additional message
    // up to a maximum 30 seconds timeout
    const { isDuplicatingPost } = this.props
    const successToastTimeout =
      isDuplicatingPost && messageToSend.isBoosted
        ? AUTO_HIDE_TIME_LONG
        : Math.min(AUTO_HIDE_TIME_LONG + (messages.length - 1) * 1000, SUCCESS_TOAST_MAX_TIMEOUT)
    const excludedViews = isPublisherView() || isPlannerView()
    const shouldForceViewPlanner =
      isFeatureEnabledOrBeta('PUB_28399_FORCE_VIEW_IN_PLANNER') &&
      !isFeatureEnabledOrBeta('PUB_28399_FORCE_VIEW_IN_PLANNER_EXCLUSIONS') &&
      !excludedViews
    const plannerURL = `#/planner?date=${scheduledSendTime}&messageId=${id}`

    StatusToastUtils.createToast(
      ComposerUtils.determineSuccessTitle({
        messageToSend,
        responseMessages: messages,
        isDuplicatingPost,
        entitlements: this.props.entitlements,
      }),
      statusMessage,
      TYPE_SUCCESS,
      successToastTimeout,
      scheduledSendTime && !shouldForceViewPlanner && (
        <A
          onClick={() => {
            track(
              `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.schedule`,
              TrackingConstants.TRACKING_ACTION.PLANNER_DEEP_LINK_CLICKED,
            )
            window.location.hash = plannerURL
          }}
        >
          {VIEW_IN_PLANNER}
        </A>
      ),
    )

    if (scheduledSendTime && shouldForceViewPlanner) {
      track(
        `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.schedule`,
        TrackingConstants.TRACKING_ACTION.PLANNER_DEEP_LINK_FORCED,
      )
      window.location.hash = plannerURL
    }
  }

  createFieldValidationsFromPostSendErrors(errors, socialNetworksKeyedById) {
    if (errors) {
      const fieldVals = ComposerUtils.createFieldValidationsFromMPS(errors, socialNetworksKeyedById)
      const validatedFieldVals = ValidationUtils.formatAuthoringFieldValidations(fieldVals)
      const id = getSelectedMessageValue(getComposerMessageState(), 'id')
      if (validatedFieldVals) {
        const postSendErrorsToTrack =
          ValidationUtils.numPostSendValidationErrorsAndSocialProfiles(validatedFieldVals)
        if (postSendErrorsToTrack.errors?.length) {
          track(CFIConstants.TRACK_CFI, CFIConstants.TRACKING_ACTIONS.RECEIVED_MPS_ERROR, {
            errors: postSendErrorsToTrack.errors,
            numUniqueSocialProfiles: postSendErrorsToTrack.numUniqueSocialProfiles,
          })
        }
      }

      if (id) {
        this.composerMessageActions.updateFieldById(
          id,
          Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS,
          validatedFieldVals,
        )
      }
    }
  }

  removeSuccessfulProfilesAndMessages(messages, messageToSend) {
    if (messages) {
      const successfulSnIds = messages.map(msg => msg?.socialProfile?.id)
      let selectedSocialNetworksKeyedById = messageToSend.socialNetworksKeyedById
      const needToRemoveSocialNetworks = successfulSnIds.filter(i =>
        selectedSocialNetworksKeyedById.get(i.toString()),
      )
      needToRemoveSocialNetworks.forEach(socialNetworkId => {
        const idStr = socialNetworkId.toString()
        selectedSocialNetworksKeyedById = selectedSocialNetworksKeyedById.delete(idStr)
        // Remove the message from the message wrapper
        this.composerMessageActions.removeMessageFromWrapper(messageToSend.id, idStr)
      })
      this.composerMessageActions.updateFieldById(
        messageToSend.id,
        Constants.FIELD_TO_UPDATE.SOCIAL_NETWORKS_KEYED_BY_ID,
        selectedSocialNetworksKeyedById,
      )
    }
  }

  handleSequentialOrDuplicatePosts(
    isSequentialPostingEnabled: boolean,
    isDuplicatingPost: boolean,
    messageToSend: Message,
  ) {
    if (isSequentialPostingEnabled || isDuplicatingPost) {
      if (
        typeof this._retrieveTotalScheduledMessages === 'function' &&
        ComposerUtils.isScheduled(messageToSend, this.props.entitlements)
      ) {
        this._retrieveTotalScheduledMessages()
      }
    }
    if (isSequentialPostingEnabled) {
      this.props.dispatch(composerActions.setIsSequentialPostingInProgress(true))
    }

    if (isDuplicatingPost) {
      this.setIsDuplicatingPost(true)
      if (messageToSend.isBoosted) {
        this.removeBoostCampaign()
      }
      if (
        Array.isArray(messageToSend.messages) &&
        messageToSend.messages.length &&
        messageToSend.messages[0].hootPostId
      ) {
        this.composerMessageActions.updateFieldById(
          messageToSend.id,
          Constants.FIELD_TO_UPDATE.HOOT_POST_ID,
          undefined,
        )
        if (typeof this._fetchPreviewData === 'function') {
          this._fetchPreviewData()
        }
      }
    }
  }

  handleMPSErrors(e, socialNetworksKeyedById) {
    const errorsToExclude = [3048]
    const DEFAULT_ERROR = 4205
    const createSocialNetworksErrorObjects = (codes = [DEFAULT_ERROR]) =>
      socialNetworksKeyedById
        .map(s => ({
          socialProfileId: s.socialNetworkId,
          codes,
        }))
        .toArray()
    let errors = []
    if (e.response?.data?.errors?.[0]?.socialProfileId) {
      errors =
        e.response.data.errors.filter(err => !err.codes.some(code => errorsToExclude.includes(code))) || []
    } else if (Number.isInteger(e.response?.data?.errors?.[0])) {
      errors = createSocialNetworksErrorObjects(e.response.data.errors)
    }

    if (errors.length) {
      this.createFieldValidationsFromPostSendErrors(errors, socialNetworksKeyedById)
    }
    const errorCodes = this.getErrorCodesFromResponse(e)
    if (errorCodes.codes?.length) {
      this.triggerInstagramPairingOnError(errorCodes.codes)
    }
    // default to 4205 for all other errors
    if (!(errors.length || errorCodes.codes?.length)) {
      const socialNetworksErrorObjects = createSocialNetworksErrorObjects()
      this.createFieldValidationsFromPostSendErrors(socialNetworksErrorObjects, socialNetworksKeyedById)
    }
  }

  async createBatchMessages(messageToSend: Message, statusMessage: string, draftId?: number) {
    const { isDuplicatingPost, isSequentialPostingEnabled } = this.props

    if (isSequentialPostingEnabled || isDuplicatingPost) {
      showLoadingModal()
    }

    // Erase Boost data before message creation in case of Instagram or LinkedIn carousel o
    const isLinkedIn = sn =>
      sn === SocialProfileConstants.SN_TYPES.LINKEDIN ||
      sn === SocialProfileConstants.SN_TYPES.LINKEDINCOMPANY ||
      sn === SocialProfileConstants.SN_TYPES.LINKEDINGROUP
    const boostCampaign = messageToSend.getBoostCampaign() || messageToSend.getSavedBoostCampaign()
    if (
      messageToSend.attachments.length > 1 &&
      messageToSend.isBoosted &&
      (boostCampaign.social_network === SocialProfileConstants.SN_TYPES.INSTAGRAM ||
        isLinkedIn(boostCampaign.social_network))
    ) {
      messageToSend.isBoosted = false
      messageToSend.boostCampaign = undefined
      messageToSend.savedBoostCampaign = undefined
    }

    const mpsRequests =
      this.props.selectedOrganization && this.props.selectedOrganization.organizationId
        ? messageToSend.toMPSRequest({
            timezoneName: this.props.timezoneName,
            organizationId: this.props.selectedOrganization.organizationId,
          })
        : messageToSend.toMPSRequest({ timezoneName: this.props.timezoneName })

    if (ComposerUtils.isOpenedFromAmplify(SelectedMessageState.getBaseMessage().composeType)) {
      const { amplifyId } = SelectedMessageState.getBaseMessage().extendedInfo
      mpsRequests.messages = await preprocessAmplifyPersonalized(amplifyId, mpsRequests.messages)
    }

    const params = {
      config: {
        headers: twitterBaggageHeaders(),
      },
      request: mpsRequests,
    }

    this.composerMessageActions.updateFieldById(
      SelectedMessageState.messageId(),
      Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS,
      {
        errors: {},
        info: {},
        warnings: {},
      },
    )

    return createBatchMessages(params)
      .then(data => {
        const boostRequest = (data && messageToSend.toBoostRequest(data.messages)) || false
        if (boostRequest) {
          return this.createBoostCampaign(data, messageToSend, boostRequest)
        } else if (draftId) {
          return this.removeBoostDraft(data, draftId)
        }
        return data
      })
      .then(data => {
        if (data) {
          const messages = data.messages
          let successMessage
          let hasPendingMessage

          if (messages && messages.length) {
            successMessage = ComposerUtils.determineSuccessMessage(
              messageToSend,
              messages,
              isSequentialPostingEnabled,
              isDuplicatingPost,
              this.props.entitlements,
            )
            statusMessage = successMessage
            hasPendingMessage = messages.some(message => MessageUtils.isPendingState(message.state))
            if (isFeatureEnabledOrBeta('PUB_25544_MEMBER_ID_TRACKING')) {
              let igPublishingMode: string
              _.each(messages, message => {
                if (message.publishingMode) {
                  igPublishingMode = message.publishingMode.mode
                }
              })
              messageToSend.publishingMode = igPublishingMode
            }
            logMessageSent(
              messageToSend,
              messages,
              !!draftId,
              this.props.memberId,
              this.props.origin,
              this.props.ideaId,
              this.props.acceptedHashtagSuggestion,
            )
            maybeShowMessageStatusModal(
              messages,
              this.props.socialNetworks,
              isSequentialPostingEnabled || isDuplicatingPost,
            )
          }
          if (Array.isArray(data.errors)) {
            const hasReachedMessageLimit = data.errors.some(error =>
              error.codes?.includes(ComposerConstants.ERROR_CODES.MESSAGE_LIMIT_REACHED),
            )
            if (hasReachedMessageLimit) {
              removeLoadingModal()
              emit(SHOW_SCHEDULED_MESSAGE_LIMIT_PAYWALL, {
                maxMessagesAllowed: this.props.entitlements[SCHEDULE_MESSAGES],
              })
              return
            }

            this.createFieldValidationsFromPostSendErrors(data.errors, messageToSend.socialNetworksKeyedById)

            if (!(isSequentialPostingEnabled || isDuplicatingPost)) {
              this.removeSuccessfulProfilesAndMessages(messages, messageToSend)
            }

            if (messages) {
              this.showGroupedProfilesSuccessToast(
                messages.filter(msg => msg?.socialProfile?.id),
                messageToSend,
                successMessage,
              )
            }
            if (isSequentialPostingEnabled || isDuplicatingPost) {
              this.removeLoadingOverlay()
            }

            const hasInsufficientPermissionToReview = data.errors.some(
              error =>
                typeof error === 'number' &&
                error === ComposerConstants.ERROR_CODES.INSUFFICIENT_PERMISSION_TO_REVIEW_MESSAGE,
            )
            if (hasInsufficientPermissionToReview) {
              statusMessage = ComposerUtils.determineErrorMessages(messageToSend, data.errors)
              StatusToastUtils.createToast('', statusMessage, TYPE_ERROR, TOAST_TIMEOUT, null)
            }

            if (isFeatureEnabledOrBeta('PUB_30419_MPS_ERROR_TOASTS')) {
              const hasIssueWithMedia = data.errors.some(error =>
                error.codes?.some(
                  code => typeof code === 'number' && code === ComposerConstants.ERROR_CODES.ISSUE_WITH_MEDIA,
                ),
              )
              if (hasIssueWithMedia) {
                statusMessage = ComposerUtils.determineErrorMessages(messageToSend, data.errors)
                StatusToastUtils.createToast('', statusMessage, TYPE_ERROR, TOAST_TIMEOUT, null)
              }
            }

            return
          } else {
            // if draftId is populated then the edited draft consumed by MPS and will need to be deleted from drafts
            if (draftId) {
              this.deleteDraft(draftId, messageToSend, messages, statusMessage)
              return null // eslint-disable-line consistent-return
            } else {
              if (hasPendingMessage) {
                // Pending approval success toast doesn't show grouped profiles
                this.showPendingApprovalSuccessToast(messages, messageToSend, statusMessage)
              } else {
                this.showGroupedProfilesSuccessToast(messages, messageToSend, statusMessage)
              }

              if (messageToSend?.fieldValidations) {
                const postSendErrorsToTrack = ValidationUtils.numPostSendValidationErrorsAndSocialProfiles(
                  messageToSend.fieldValidations,
                )
                if (postSendErrorsToTrack.errors?.length) {
                  const sendOrScheduleAction = messageToSend.sendDate
                    ? CFIConstants.TRACKING_ACTIONS.SCHEDULE
                    : CFIConstants.TRACKING_ACTIONS.SEND_NOW
                  track(CFIConstants.TRACK_CFI, sendOrScheduleAction, {
                    errors: postSendErrorsToTrack.errors,
                    numUniqueSocialProfiles: postSendErrorsToTrack.numUniqueSocialProfiles,
                  })
                }
              }

              // don't close here if the "posting sequentially" or "duplicating post" flag is set
              if (!isSequentialPostingEnabled && !isDuplicatingPost) {
                this.close()
              } else {
                this.handleSequentialOrDuplicatePosts(
                  isSequentialPostingEnabled,
                  isDuplicatingPost,
                  messageToSend,
                )
              }
              this.emitMessageSuccess(messages)
              this.removeLoadingOverlay()
              return messageToSend.id // eslint-disable-line consistent-return
            }
          }
        }

        StatusToastUtils.createToast('', statusMessage, TYPE_ERROR, TOAST_TIMEOUT)
        this.removeLoadingOverlay()
        return null // eslint-disable-line consistent-return
      })
      .catch(e => {
        if (!messageToSend.sendDate) {
          // only produce CFI post-send errors on Send now
          this.handleMPSErrors(e, messageToSend.socialNetworksKeyedById)
        } else {
          const errorCodes = this.getErrorCodesFromResponse(e)
          if (errorCodes.codes?.length) {
            this.triggerInstagramPairingOnError(errorCodes.codes)
            statusMessage = isFeatureEnabled('PUB_30000_DEPRECATE_ERROR_SOURCES')
              ? ValidationErrorMessages[errorCodes.firstCode].title
              : ComposerErrorMessages.get(errorCodes.firstCode)
          }
          this.statusObject.update(statusMessage, 'error', true)
        }
        if (!axios.isCancel(e)) {
          const errorCodes = this.getErrorCodesFromResponse(e)
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during create batch messages', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
            errorCodes: JSON.stringify(errorCodes.codes),
          })
        }
        this.removeLoadingOverlay()
      })
  }

  deleteDraftCampaignByDraftId(draftId, isBoosted) {
    if (isBoosted) {
      try {
        willDeleteDraftCampaign(draftId)
      } catch (e) {
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during deleting Boost campaign draft', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
          StatusToastUtils.createToast('', UNABLE_TO_DELETE_BOOST_CAMPAIGN_DRAFT, TYPE_ERROR, TOAST_TIMEOUT)
        }
      }
    }
  }

  async editBoostCampaign(message: Message, publishedMessages) {
    const isBoosted = message.isBoosted
    const savedCampaign = message.getSavedBoostCampaign()
    const newCampaign = message.toBoostRequest(publishedMessages)

    // If previous campaign exists and either Boost is deselected or user has created a new Boost campaign,
    // delete previous Boost campaign
    if (savedCampaign && (!isBoosted || newCampaign)) {
      try {
        // The default value 'FACEBOOK' is for back compatibility
        const socialNetwork = savedCampaign.social_network || 'FACEBOOK'
        await willDeleteScheduledCampaignV2(socialNetwork, message.id)
      } catch (e) {
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during deleting Boost campaign', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
          const errorText = isBoosted ? UNABLE_TO_UPDATE_BOOST_CAMPAIGN : UNABLE_TO_DELETE_BOOST_CAMPAIGN
          StatusToastUtils.createToast('', errorText, TYPE_ERROR, TOAST_TIMEOUT)
        }
      }
    }

    if (isBoosted && newCampaign) {
      try {
        // We are not calling `trackComposeCampaignPublicationSucceeded`
        // to avoid tracking editing as newly published campaigns
        // (this will cause some statistical noise when the user changes
        // tracked stuff such as the objective)
        await willPublishCampaign(newCampaign)
      } catch (e) {
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during updating Boost campaign', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
          StatusToastUtils.createToast('', UNABLE_TO_UPDATE_BOOST_CAMPAIGN, TYPE_ERROR, TOAST_TIMEOUT)
        }
      }
    }
  }

  emitMessageSuccess(messages) {
    const payload = {
      messageIds: Array.isArray(messages) ? messages.map(m => m.id) : [],
      messageState: Array.isArray(messages) && messages.length ? messages[0].state : null,
    }

    if (isFeatureEnabled('PGR_688_FIRST_POST_POPOVER') && Array.isArray(messages)) {
      payload.postsMetadata = messages
        .filter(m => m.socialProfile && m.socialProfile.id)
        .map(m => ({
          campaignId: m.campaignId,
          socialProfileId: m.socialProfile.id,
          postId: m.postId,
          postUrl: m.postUrl,
          hasMedia: !!m.media,
          publishingMode: m.publishingMode ? m.publishingMode.mode : null,
        }))
    }

    if (Array.isArray(messages) && messages.length) {
      const messageId = messages[0].id
      const messageSendTime = messages[0].scheduledSendTime
      emit('full_screen_composer:response:message_success', {
        ...payload,
        messageId,
        messageSendTime,
      })
    } else {
      emit('full_screen_composer:response:message_success', payload)
    }
  }

  editMessage(messageToSend: Message, statusMessage: string) {
    const { selectedOrganization, timezoneName } = this.props
    let mpsRequest
    if (selectedOrganization && selectedOrganization.organizationId) {
      mpsRequest = messageToSend.toMPSRequest({
        timezoneName: timezoneName,
        organizationId: selectedOrganization.organizationId,
      })
    } else {
      mpsRequest = messageToSend.toMPSRequest({ timezoneName: timezoneName })
    }

    return editMessage(mpsRequest, messageToSend.id.toString())
      .then(async response => {
        await this.editBoostCampaign(messageToSend, response.messages)
        return response
      })
      .then(response => {
        if (
          response &&
          typeof response.messages !== 'undefined' &&
          Array.isArray(response.messages) &&
          (typeof response.errors === 'undefined' || response.errors === null)
        ) {
          this.statusObject.update(translation._('Your changes have been saved'), 'success', true)

          maybeShowMessageStatusModal(response.messages, this.props.socialNetworks)

          // Refresh the Publisher view
          const publisherRefreshButton = document.querySelector('#schedulerSection ._filter ._refresh')
          if (publisherRefreshButton) {
            publisherRefreshButton.click()
          }

          handleMessageEditInContentPlanner(response.messages)

          emit('full_screen_composer:response:message_success')
          this.close()

          return messageToSend.id
        } else if (Array.isArray(response.errors) && response.errors.length > 0) {
          statusMessage = ComposerUtils.determineErrorMessages(messageToSend, response.errors)
          StatusToastUtils.createToast(
            '',
            '',
            TYPE_ERROR,
            TOAST_TIMEOUT,
            <ErrorToastMessage>{statusMessage}</ErrorToastMessage>,
          )
          return null
        }

        this.statusObject.update(statusMessage, 'error', true)
        return null
      })
      .catch(e => {
        const errorCodes = this.getErrorCodesFromResponse(e)
        if (errorCodes.codes.length) {
          this.triggerInstagramPairingOnError(errorCodes.codes)
          statusMessage = ComposerUtils.determineErrorMessages(messageToSend, errorCodes.codes)
          StatusToastUtils.createToast(
            '',
            '',
            TYPE_ERROR,
            TOAST_TIMEOUT,
            <ErrorToastMessage>{statusMessage}</ErrorToastMessage>,
          )
          return
        }
        this.statusObject.update(statusMessage, 'error', true)
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during edit message', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
      })
  }

  getErrorCodesFromResponse(error) {
    let response = null
    let errorCodes = []
    response = error?.response || null
    if (response) {
      errorCodes = response?.data?.errors || []
    }
    let errorCode = null
    if (errorCodes.length) {
      if (errorCodes[0].codes && errorCodes[0].codes[0]) {
        errorCode = errorCodes[0].codes[0] // only show the first error until we have a better way of displaying multiple errors
      } else {
        errorCode = errorCodes[0]
      }
    }

    if (isFeatureEnabled('PUB_30000_DEPRECATE_ERROR_SOURCES')) {
      // Translate these codes from BE to match up with the errors in fe-pnc-validation-error-messages
      // Ticket https://hootsuite.atlassian.net/browse/PUB-29999 provides more context on why this was done
      const translateCodes = {
        4204: 994204,
        4205: 994205,
        4206: 994206,
        1022: 4219,
      }

      return {
        codes: errorCodes.map(code => translateCodes[code] ?? code),
        firstCode: translateCodes[errorCode] ?? errorCode,
      }
    }

    return {
      codes: errorCodes,
      firstCode: errorCode,
    }
  }

  // get the profiles that need push set up and set up an error banner under the social profile picker
  // indicating which accounts need push set up
  triggerInstagramPairingOnError(errorCodes) {
    const instagramPairingErrors = errorCodes.filter(
      ({ codes }) => codes && codes.indexOf(ComposerConstants.ERROR_CODES.INSTAGRAM_PAIRING) > -1,
    )

    if (instagramPairingErrors.length > 0) {
      // The pairing flow should be accessed from a banner beneath the SN picker,
      // with an individual pairing event triggered for each profile that needs pairing
      this.composerMessageActions.updateInstagramPairingErrors(instagramPairingErrors)
    }
  }

  sendMessage = messageToSend => {
    const { entitlements } = this.props
    let isScheduled
    if (EntitlementsUtils.isFeatureEnabled(entitlements, AUTO_SCHEDULE_MESSAGE)) {
      isScheduled =
        !_.isNull(messageToSend.sendDate) ||
        (!_.isNull(messageToSend.isAutoScheduled) && messageToSend.isAutoScheduled)
    } else {
      isScheduled = !_.isNull(messageToSend.sendDate)
    }
    const isMultipleSocialNetworks = messageToSend.socialNetworksKeyedById.size > 1
    let statusMessage = isMultipleSocialNetworks
      ? translation._('Your posts could not be sent')
      : translation._('Your post could not be sent')
    if (isScheduled) {
      statusMessage = isMultipleSocialNetworks
        ? translation._('Your posts could not be scheduled')
        : translation._('Your post could not be scheduled')
    }

    this.trackKnownDeauthedNetworksSelected(messageToSend, isScheduled)

    if (this.props.isEditMode) {
      if (ComposerUtils.isDraft(SelectedMessageState.messageType())) {
        return this.createBatchMessages(messageToSend, statusMessage, SelectedMessageState.messageId())
      } else {
        return this.editMessage(messageToSend, statusMessage)
      }
    } else {
      return this.createBatchMessages(messageToSend, statusMessage)
    }
  }

  trackKnownDeauthedNetworksSelected = (messageToSend, isScheduled) => {
    const socialNetworksSelected = messageToSend.socialNetworksKeyedById
    socialNetworksSelected.map(network => {
      if (network.isReauthRequired === 1 || network.isReauthRequired === true) {
        track(
          `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.send_message`,
          TrackingConstants.TRACKING_ACTION.KNOWN_DEAUTHED_NETWORK_SELECTED,
          { isScheduled: isScheduled, socialNetworkType: network.type },
        )

        logInfo(
          LOGGING_CATEGORIES.NEW_COMPOSER,
          'Message scheduled or sent with a known deauthed network selected',
          {
            errorMessage: '',
            stack: '',
          },
        )
      }
    })
  }

  onChangeToBulkCompose = () => {
    this.renderLeaveComposeDialog({
      titleText: translation._('Open Bulk Composer'),
      descriptionText: translation._('Your currently minimized Composer session will be closed. Progress will be lost. Do you wish to continue?'), // prettier-ignore
      cancelButtonText: CANCEL,
      okButtonText: CONTINUE,
    })
  }

  renderLeaveComposeDialog = ({
    titleText,
    descriptionText,
    cancelButtonText,
    okButtonText,
    onOk,
    onCancel,
    closeOnSecondaryAction = false,
    disableCloseAndAlternativePopup = false,
  }) => {
    const closeComposer = () => {
      if (!disableCloseAndAlternativePopup) {
        this.close()
      }
    }

    // NOTE: the onOk function can also be a Promise, to allow network calls to complete
    // before calling abortRequests() in componentWillUnmount()
    const onOkClicked = async () => {
      try {
        await onOk()
      } catch (e) {
        logError(
          LOGGING_CATEGORIES.NEW_COMPOSER,
          'New Composer - Failed while acknowledging a dialog box when trying to exit',
          {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          },
        )

        StatusToastUtils.createStatus(
          'Error!',
          'An unknown error has occurred. Please try again.',
          TYPE_ERROR,
        )
      }

      closeComposer()
    }

    const onCancelClicked = () => {
      if (closeOnSecondaryAction) {
        const selectedMessageForEdit = getSelectedMessage(getComposerMessageState())
        if (selectedMessageForEdit?.fieldValidations) {
          const postSendErrorsToTrack = ValidationUtils.numPostSendValidationErrorsAndSocialProfiles(
            selectedMessageForEdit.fieldValidations,
          )
          if (postSendErrorsToTrack.errors?.length) {
            track(CFIConstants.TRACK_CFI, CFIConstants.TRACKING_ACTIONS.CLOSE_COMPOSER, {
              errors: postSendErrorsToTrack.errors,
              numUniqueSocialProfiles: postSendErrorsToTrack.numUniqueSocialProfiles,
            })
          }
        }

        if (onCancel) {
          onCancel()
        }

        this.close(false)
      } else {
        emit('full_screen_composer:response:close:cancel')
      }
    }

    showConfirmationModal({
      titleText: titleText || LEAVE_COMPOSER_QUESTION,
      bodyText: <P>{descriptionText || MESSAGE_DISCARDED}</P>,
      submitButtonText: okButtonText || LEAVE_COMPOSER,
      cancelButtonText: cancelButtonText || STAY_HERE,
      onSubmit: close => {
        onOkClicked()
        close()
      },
      onCancel: onCancelClicked,
    })
  }

  renderDraftSharingWarning = (source, overrideDraftRedirect) => {
    let isDontShowAgainCheckboxChecked = false

    const onOkClicked = closeModal => {
      this.createDraftOnClick(source, overrideDraftRedirect) // overrideDraftRedirect used for PUB_28802_SOCIALGPT_BANNER
      trackCloseAction('saveDraft')
      if (isDontShowAgainCheckboxChecked) {
        // prevent seeing it in future sessions
        seenPopover({ a: 'seen', n: PopupConstants.POPUPS.DRAFT_SHARED_WARNING })
        if (localStorage) {
          const publisherPopupsSeen = localStorage.getItem(PopupConstants.LOCALSTORAGE_POPUP_OBJECT) || {}
          publisherPopupsSeen[PopupConstants.POPUPS.DRAFT_SHARED_WARNING] = true // eslint-disable-line dot-notation
          localStorage.setItem('publisherPopupsSeen', JSON.stringify(publisherPopupsSeen))
        }
      }
      closeModal()
    }

    const ONE_NONPRIVATE_NETWORK = 1
    const nonPrivateSNIds = SelectedMessageState.getNonPrivateSocialNetworkIds()
    let bodyText = ''
    let titleText = ''
    const socialNetwork = SelectedMessageState.socialNetworksKeyedById().get(nonPrivateSNIds[0].toString())
    if (nonPrivateSNIds.length === ONE_NONPRIVATE_NETWORK) {
      // prettier-ignore
      bodyText = translation._('Just a reminder that any other users that have access to this social account may be able to view and edit this draft.')
      // prettier-ignore
      titleText = translation._('%s1 is a shared account')
        .replace(
          '%s1',
          `${socialNetwork.username} (${SocialProfileConstants.SN_TYPE_TO_DISPLAY_NAME[socialNetwork.type]})`,
        )
    } else {
      // prettier-ignore
      bodyText = translation._('Just a reminder that any other users that have access to these social accounts may be able to view and edit this draft.')
      // prettier-ignore
      titleText = translation._('%s1 others are shared networks')
        .replace(
          '%s1',
          `${socialNetwork.username} (${SocialProfileConstants.SN_TYPE_TO_DISPLAY_NAME[socialNetwork.type]
          }) +${nonPrivateSNIds.length - ONE_NONPRIVATE_NETWORK}`,
        )
    }

    const onChange = () => {
      isDontShowAgainCheckboxChecked = !isDontShowAgainCheckboxChecked
    }
    showConfirmationModal({
      titleText,
      bodyText: (
        <DraftSharingWarning
          bodyText={bodyText}
          onChange={onChange}
          isDontShowAgainCheckboxChecked={isDontShowAgainCheckboxChecked}
        />
      ),
      submitButtonText: CONFIRM,
      cancelButtonText: CANCEL,
      onSubmit: onOkClicked,
      onCancel: () => {
        emit('full_screen_composer:response:close:cancel')
      },
    })
  }

  shouldShowLeaveComposeDialog() {
    // source is set internally so we can ignore it
    const selectedMessageForEdit = getSelectedMessage(getComposerMessageState())

    const message = this.props.message

    const fields = _.omit(
      Message.MESSAGE_FIELDS,
      'id',
      'errors',
      'fieldValidations',
      'warnings',
      'source',
      'schedulingRequired',
    )

    if (!selectedMessageForEdit) {
      return false
    }

    // ensure that re-opened drafts or templates don't trigger a dialog when you don't make any changes
    if (message) {
      const base1 = _.pick(message.asComparible(), Object.keys(fields))
      const base2 = _.pick(selectedMessageForEdit.asComparible(), Object.keys(fields))
      const messageDidNotChange = _.isEqual(base1, base2)

      if (messageDidNotChange) {
        return false
      }
    }

    // Returns true if a field is not empty or it's a number (sendDate) otherwise it returns false
    return _.some(fields, f => {
      const value = selectedMessageForEdit[f]
      if (f === 'messageType') {
        return false
      }
      if (Immutable.Map.isMap(value)) {
        return value.size > 0
      } else {
        return !_.isEmpty(value) || _.isNumber(value)
      }
    })
  }

  async saveDraftBoostCampaign(draftId) {
    const boostCampaign = SelectedMessageState.getBoostCampaign()

    if (boostCampaign) {
      try {
        // default to FACEBOOK to continue support v1
        const socialNetworkType = boostCampaign.social_network || SocialProfileConstants.SN_TYPES.FACEBOOK
        await willSaveDraftCampaign(socialNetworkType, draftId, boostCampaign)
      } catch (e) {
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during saving Boost campaign draft', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
          StatusToastUtils.createToast('', UNABLE_TO_CREATE_BOOST_CAMPAIGN_DRAFT, TYPE_ERROR, TOAST_TIMEOUT)
        }
      }
    }
  }

  createDraftOnClick = (source, overrideDraftRedirect = false) => {
    // overrideDraftRedirect used for PUB_28802_SOCIALGPT_BANNER
    const { DataDrafts } = this.props
    const draftRequest = getSelectedMessage(getComposerMessageState()).toDraftRequest(
      this.props.selectedOrganization && this.props.selectedOrganization.organizationId,
    )
    DataDrafts.createDraft(draftRequest, this.props.memberName)
      .then(async response => {
        const {
          draft: { id: draftId },
        } = response
        await this.saveDraftBoostCampaign(draftId)
        return response
      })
      .then(async response => {
        if (draftRequest.message?.fieldValidations) {
          const postSendErrorsToTrack = ValidationUtils.numPostSendValidationErrorsAndSocialProfiles(
            draftRequest.message.fieldValidations,
          )
          if (postSendErrorsToTrack.errors?.length) {
            track(CFIConstants.TRACK_CFI, CFIConstants.TRACKING_ACTIONS.SAVE_AS_DRAFT, {
              errors: postSendErrorsToTrack.errors,
              numUniqueSocialProfiles: postSendErrorsToTrack.numUniqueSocialProfiles,
            })
          }
        }
        this.close()
        const isScheduled = !_.isNull(SelectedMessageState.getSendDate())

        track(
          `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.draft`,
          TrackingConstants.TRACKING_ACTION.CREATE_DRAFT,
          {
            source,
            isScheduled,
          },
        )

        emit('full_screen_composer:response:message_success', this.draftDataToPlannerContent(response))

        const draftId = response.draft.id
        const scheduledDate = response?.draft?.scheduledDate
        const dateQuery = scheduledDate ? `&date=${scheduledDate}` : ''
        const draftsLink = `#/planner?view=drafts&messageId=${draftId}${dateQuery}`
        const excludedViews = isPublisherView() || isPlannerView() || isHomepageView()

        const shouldForceViewPlanner =
          !overrideDraftRedirect && // Used for PUB_28802_SOCIALGPT_BANNER to navigate to SocialGPT
          isFeatureEnabledOrBeta('PUB_28399_FORCE_VIEW_IN_PLANNER') &&
          !isFeatureEnabledOrBeta('PUB_28399_FORCE_VIEW_IN_PLANNER_EXCLUSIONS') &&
          !excludedViews
        let child

        if (shouldForceViewPlanner) {
          track(
            `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.draft`,
            TrackingConstants.TRACKING_ACTION.PLANNER_DEEP_LINK_FORCED,
          )
          window.location.href = draftsLink
        } else {
          child = (
            <A
              onClick={() => {
                track(
                  `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.draft`,
                  TrackingConstants.TRACKING_ACTION.PLANNER_DEEP_LINK_CLICKED,
                )
                window.location.hash = draftsLink
              }}
            >
              {translation._('View drafts')}
            </A>
          )
        }

        StatusToastUtils.createStatus(
          'Success!',
          'Your draft has been saved.',
          TYPE_SUCCESS,
          AUTO_HIDE_TIME_LONG,
          child,
        )
      })
      .catch(e => {
        StatusToastUtils.createStatus('Error!', 'An error occurred while creating your draft', TYPE_ERROR)
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER_DRAFTS, 'Failed during create draft', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
      })
  }

  draftDataToPlannerContent(content) {
    const draft = content.draft
    const msg = draft && draft.message
    if (msg) {
      let media = null
      const { attachments = [] } = msg
      if (attachments && attachments.length > 0) {
        media = attachments.map(a => ({
          contentType: a.mimeType,
          thumbnailUrl: a.thumbnailUrl,
          url: a.url,
        }))
      }
      let linkPreview = null
      if (typeof msg.urlPreview === 'object' && msg.urlPreview) {
        linkPreview = {
          contentType: 'image/jpeg',
          description: msg.urlPreview.description,
          originalUrl: msg.urlPreview.originalUrl,
          thumbnailUrl: msg.urlPreview.thumbnailUrl,
          title: msg.urlPreview.title,
          url: msg.urlPreview.url,
        }
      }
      let socialProfileId = null
      let socialProfileIds = []
      if (content.socialProfileIds && content.socialProfileIds.length > 0) {
        socialProfileId = content.socialProfileIds[0]
        socialProfileIds = content.socialProfileIds
      }
      const message = {
        campaignId: msg.campaignId,
        media,
        linkPreview,
        socialProfileId,
        message: msg.text,
        state: 'DRAFT',
        socialProfileIds,
      }
      return {
        id: draft.id,
        startDate: draft.scheduledDate,
        message: message,
        contentType: 'DRAFT',
        state: 'DRAFT',
        permissions: {
          canEdit: content.writePermissions || false,
          canDelete: content.writePermissions || false,
          canApprove: false,
        },
      }
    }
    return {}
  }

  async updateDraftBoostCampaign(draftId) {
    const isBoosted = SelectedMessageState.isBoosted()
    const previousBoostCampaignExists = !_.isEmpty(SelectedMessageState.getSavedBoostCampaign())
    const boostCampaign = SelectedMessageState.getBoostCampaign()

    // If previous campaign exists and Boost is deselected:
    // delete previous Boost campaign draft
    if (previousBoostCampaignExists && !isBoosted) {
      try {
        await willDeleteDraftCampaign(draftId)
      } catch (e) {
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during deleting Boost campaign draft', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
          StatusToastUtils.createToast('', UNABLE_TO_DELETE_BOOST_CAMPAIGN_DRAFT, TYPE_ERROR, TOAST_TIMEOUT)
        }
      }
    }

    // If Boost is selected and a Boost campaign exists
    if (isBoosted && !_.isEmpty(boostCampaign)) {
      try {
        // default to FACEBOOK to continue support v1
        const socialNetworkType = boostCampaign.social_network || SocialProfileConstants.SN_TYPES.FACEBOOK
        // If we a previous Boost campaign exists we will update it
        if (previousBoostCampaignExists) {
          await willUpdateDraftCampaign(socialNetworkType, draftId, boostCampaign)
        } else {
          // We create a new Boost campaign
          await willSaveDraftCampaign(socialNetworkType, draftId, boostCampaign)
        }
      } catch (e) {
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during updating Boost campaign draft', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
          const errorText = previousBoostCampaignExists
            ? UNABLE_TO_UPDATE_BOOST_CAMPAIGN_DRAFT
            : UNABLE_TO_CREATE_BOOST_CAMPAIGN_DRAFT
          StatusToastUtils.createToast('', errorText, TYPE_ERROR, TOAST_TIMEOUT)
        }
      }
    }
  }

  updateDraftOnClick = source => {
    const { DataDrafts } = this.props
    const draftRequest = getSelectedMessage(getComposerMessageState()).toDraftRequest(
      this.props.selectedOrganization && this.props.selectedOrganization.organizationId,
    )
    draftRequest.id = SelectedMessageState.messageId()
    DataDrafts.editDraft(draftRequest, this.props.memberName)
      .then(async response => {
        const {
          draft: { id: draftId },
        } = response
        const boostCampaignPromise = this.updateDraftBoostCampaign(draftId)

        return Promise.all([boostCampaignPromise, response])
      })
      .then(async ([, response]) => {
        // Refresh the Planner view

        if (document.querySelector('.rc-Planner') || isHomepageView()) {
          emit('content_planner:content_edited', this.draftDataToPlannerContent(response))
        }

        const draftId = response.draft.id
        const isScheduled = !_.isNull(SelectedMessageState.getSendDate())
        const scheduledDate = response?.draft?.scheduledDate
        const dateQuery = scheduledDate ? `&date=${scheduledDate}` : ''
        const draftsLink = `#/planner?view=drafts&messageId=${draftId}${dateQuery}`

        const shouldForceViewPlanner =
          !isHomepageView &&
          isFeatureEnabledOrBeta('PUB_28399_FORCE_VIEW_IN_PLANNER') &&
          !isFeatureEnabledOrBeta('PUB_28399_FORCE_VIEW_IN_PLANNER_EXCLUSIONS')

        let child

        if (shouldForceViewPlanner && !isPlannerView()) {
          track(
            `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.draft`,
            TrackingConstants.TRACKING_ACTION.PLANNER_DEEP_LINK_FORCED,
          )
          window.location.href = draftsLink
        } else {
          child = (
            <A
              onClick={() => {
                track(
                  `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.draft`,
                  TrackingConstants.TRACKING_ACTION.PLANNER_DEEP_LINK_CLICKED,
                )
                window.location.hash = draftsLink
              }}
            >
              {translation._('View drafts')}
            </A>
          )
        }

        StatusToastUtils.createStatus(
          'Success!',
          'Your draft has been saved.',
          TYPE_SUCCESS,
          AUTO_HIDE_TIME_LONG,
          child,
        )

        track(
          `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.draft`,
          TrackingConstants.TRACKING_ACTION.EDIT_DRAFT,
          {
            source,
            isScheduled,
          },
        )

        this.close()
      })
      .catch(e => {
        StatusToastUtils.createStatus('Error!', 'An error occurred while saving your draft', TYPE_ERROR)
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER_DRAFTS, 'Failed during edit draft', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
      })
  }

  //force clearing of autoschedule state, and from local storage, just to make sure it's really gone
  clearAutoScheduleState(memberId) {
    const { entitlements } = this.props
    if (EntitlementsUtils.isFeatureEnabled(entitlements, AUTO_SCHEDULE_MESSAGE)) {
      clearIsAutoSecheduledLocalStorage(memberId)
    }
  }

  closeComposer = (overrideDraftRedirect = false) => {
    // overrideDraftRedirect used for PUB_28802_SOCIALGPT_BANNER
    const { isEditMode } = this.props
    const selectedMessageId = SelectedMessageState.messageId()
    const selectedMessageType = SelectedMessageState.messageType()

    if (!selectedMessageId || !this.shouldShowLeaveComposeDialog()) {
      this.close()
      return
    }

    let titleText: string
    let descriptionText: string
    let cancelButtonText: string
    let okButtonText: string
    let onOk: () => void
    let onCancel: () => void

    const selectedBaseMessage = SelectedMessageState.getBaseMessage()
    const isEditingTemplate = ComposerUtils.isTemplate(selectedMessageType) && isEditMode
    const isEditingScheduledMessage = ComposerUtils.isMessage(selectedMessageType) && isEditMode
    const isDraft = ComposerUtils.isDraft(selectedMessageType)
    const isDuplicateDraft = selectedMessageId === ComposerConstants.DUPLICATE_DRAFT
    const hasTextOrAttachment = Boolean(
      selectedBaseMessage.attachments?.length || selectedBaseMessage.template,
    )

    if (isDraft && !isDuplicateDraft) {
      // only way to get messageType of draft is by editing a draft
      titleText = translation._('Save your changes?')
      descriptionText = translation._(
        'You have made changes to this draft. Do you want to leave without saving?',
      )
      cancelButtonText = translation._('Discard changes')
      okButtonText = translation._('Save changes')
      onOk = () => {
        this.updateDraftOnClick('close_composer')
        trackCloseAction('saveChanges')
      }
      onCancel = () => {
        trackCloseAction('discardChanges')
      }

      this.renderLeaveComposeDialog({
        titleText,
        descriptionText,
        cancelButtonText,
        okButtonText,
        onOk,
        onCancel,
        closeOnSecondaryAction: true,
      })
    } else if (isEditingScheduledMessage) {
      // editing an already-scheduled message
      titleText = translation._('Save your changes?')
      descriptionText = translation._(
        'You have made changes to this post. Do you want to leave without saving?',
      )
      cancelButtonText = translation._('Discard changes')
      okButtonText = translation._('Save changes')
      onOk = () => {
        trackCloseAction('saveChanges')
        if (isFeatureEnabled('PUB_30564_COMPOSER_ON_SAVE_FIX')) {
          return this.sendMessage(getSelectedMessage(getComposerMessageState()))
        }
        this.sendMessage(getSelectedMessage())
      }
      onCancel = () => {
        trackCloseAction('discardChanges')
      }
      this.renderLeaveComposeDialog({
        titleText,
        descriptionText,
        cancelButtonText,
        okButtonText,
        onOk,
        onCancel,
        closeOnSecondaryAction: true,
      })
    } else if (hasTextOrAttachment && !isEditMode && !isEditingTemplate) {
      // a new message
      titleText = translation._('Save a draft?')
      // prettier-ignore
      descriptionText = translation._(`It looks like you've started working on a new post. You can save it as a draft and find it later in the Planner.`)
      cancelButtonText = translation._('Discard post')
      okButtonText = translation._('Save draft')

      const hasSocialNetworks = SelectedMessageState.getNonPrivateSocialNetworkIds().length > 0
      const publisherPopupsSeen =
        (localStorage && JSON.parse(localStorage.getItem(PopupConstants.LOCALSTORAGE_POPUP_OBJECT))) || {}
      if (
        publisherPopupsSeen &&
        publisherPopupsSeen[PopupConstants.POPUPS.DRAFT_SHARED_WARNING] &&
        hasSocialNetworks
      ) {
        onOk = () => {
          trackCloseAction('saveDraft')
          this.createDraftOnClick('close_composer', overrideDraftRedirect) // overrideDraftRedirect used for PUB_28802_SOCIALGPT_BANNER
        }
        onCancel = () => {
          trackCloseAction('discardPost')
        }
        this.renderLeaveComposeDialog({
          titleText,
          descriptionText,
          cancelButtonText,
          okButtonText,
          onOk,
          onCancel,
          closeOnSecondaryAction: true,
        })
      } else {
        hasSeenPopover(PopupConstants.POPUPS.DRAFT_SHARED_WARNING).then(hasSeen => {
          if (!hasSeen && hasSocialNetworks) {
            onOk = () => {
              trackCloseAction('saveDraft')
              this.renderDraftSharingWarning('close_composer', overrideDraftRedirect) // overrideDraftRedirect used for PUB_28802_SOCIALGPT_BANNER
            }
            onCancel = () => {
              trackCloseAction('discardPost')
            }
            this.renderLeaveComposeDialog({
              titleText,
              descriptionText,
              cancelButtonText,
              okButtonText,
              onOk,
              onCancel,
              closeOnSecondaryAction: true,
              disableCloseAndAlternativePopup: true,
            })
          } else {
            onOk = () => {
              trackCloseAction('saveDraft')
              this.createDraftOnClick('close_composer', overrideDraftRedirect) // overrideDraftRedirect used for PUB_28802_SOCIALGPT_BANNER
            }
            onCancel = () => {
              trackCloseAction('discardPost')
            }
            this.renderLeaveComposeDialog({
              titleText,
              descriptionText,
              cancelButtonText,
              okButtonText,
              onOk,
              onCancel,
              closeOnSecondaryAction: true,
            })
          }
        })
      }
    } else if (hasTextOrAttachment) {
      // editing a message or template
      onOk = () => {
        this.close()
        trackCloseAction('saveChanges')
      }
      onCancel = () => {
        trackCloseAction('discardChanges')
      }
      this.renderLeaveComposeDialog({
        titleText: null,
        descriptionText: null,
        cancelButtonText: null,
        okButtonText: null,
        onOk,
        onCancel,
      })
    } else {
      trackCloseAction('close')
      this.close(false)
    }
  }

  hasMessageChanged = () => {
    const selectedBaseMessage = SelectedMessageState.getBaseMessage()
    const hasMessageText = Boolean(selectedBaseMessage.messageText)
    return (
      hasMessageText ||
      SelectedMessageState.socialNetworksKeyedById().size > 0 ||
      selectedBaseMessage.campaignId ||
      selectedBaseMessage.tags.length > 0 ||
      selectedBaseMessage.attachments.length > 0
    )
  }

  removeBoostCampaign() {
    const selectedMessageId = SelectedMessageState.messageId()
    // Update separately as it could be `undefined` and otherwise `updateFieldsById` will complain
    this.composerMessageActions.updateFieldById(
      selectedMessageId,
      Constants.FIELD_TO_UPDATE.BOOST_CAMPAIGN,
      undefined,
    )
    const fieldsToUpdate = {
      [Constants.FIELD_TO_UPDATE.IS_BOOSTED]: false,
    }
    this.composerMessageActions.updateFieldsById(selectedMessageId, fieldsToUpdate)
  }

  removeLoadingOverlay() {
    // Adding a timeout because we want to show the success/error
    // toast before removing the loading overlay
    setTimeout(() => removeLoadingModal(), LOADING_MODAL_TIMEOUT)
  }

  getDataForMinimize() {
    const { selectedMessageForEdit } = this.props

    let thumbnailUrl
    let messageText
    let scheduledTime

    if (selectedMessageForEdit) {
      if (selectedMessageForEdit.attachments && selectedMessageForEdit.attachments.length) {
        thumbnailUrl = selectedMessageForEdit.attachments[0].thumbnailUrl
      }
      messageText = selectedMessageForEdit.renderMessageText() || null
      scheduledTime = selectedMessageForEdit.sendDate
    }

    return { thumbnailUrl, messageText, scheduledTime }
  }

  getIsSocialProfileSelectorDisabled() {
    // If message is from Amplify the selected social profiles cannot be edited
    if (isFeatureDisabled('CNN_241_ENABLE_SOCIAL_PROFILE_WHEN_AMPLIFY')) {
      if (ComposerUtils.isOpenedFromAmplify(SelectedMessageState.getBaseMessage().composeType)) {
        return true
      }
    }

    const createdByMember = SelectedMessageState.createdByMember()
    if (createdByMember) {
      const isReviewMessage =
        MessageUtils.isPendingState(SelectedMessageState.messageState()) ||
        MessageUtils.isRejectedState(SelectedMessageState.messageState())
      const isCreator = createdByMember.id === this.props.memberId
      return isReviewMessage && !isCreator
    }

    return false
  }

  onCloseButtonClick() {
    if (isFeatureDisabled('PUB_30350_TRACK_MINIMIZE_CLOSE')) {
      track(TrackingConstants.TRACKING_ORIGINS.CLOSE, TrackingConstants.TRACKING_ACTION.COMPOSER_CLOSE_BUTTON)
    }
    this.closeComposer()
  }

  handleSendToAmplify() {
    const { timezoneName, customContext, selectedOrganization } = this.props
    handleSendToAmplify(timezoneName, selectedOrganization?.organizationId || null, customContext, this.close)
  }

  renderHeader() {
    const {
      composerConf,
      organizations,
      selectedOrganization,
      isEditMode,
      facadeApiUrl,
      flux,
      FluxComponent,
      memberId,
      onSelectNewOrganization,
      timezoneName,
      customContext,
    } = this.props
    const selectedMessageType = SelectedMessageState.messageType()
    const isDraft = ComposerUtils.isDraft(selectedMessageType)
    const isEditingTemplate = ComposerUtils.isTemplate(selectedMessageType) && isEditMode
    const isOrgPickerDisabled = get(composerConf, ['header', 'orgPicker', 'isDisabled'], false)
    const canViewOrgPicker =
      (!isOrgPickerDisabled &&
        organizations &&
        organizations.length > 1 &&
        selectedOrganization &&
        !isEditMode) ||
      false

    return (
      <ComposerHeader
        {...{
          canViewOrgPicker,
          composerConf,
          organizations,
          selectedOrganization,
          isDraft,
          isEditingTemplate,
          isEditMode,
          facadeApiUrl,
          flux,
          FluxComponent,
          memberId,
          onSelectNewOrganization,
          timezoneName,
          customContext,
        }}
        hasMessageChanged={this.hasMessageChanged}
        headerConf={composerConf && composerConf.header}
        mode={ComposerConstants.MODE.COMPOSER}
        onClose={this.onCloseButtonClick}
      />
    )
  }

  render() {
    if (SelectedMessageState.messagesCount() === 0) {
      // Don't render anything until full-screen has initialized
      // The componentDidMount of full-screen-composer creates the initial message
      return <div className="rc-FullScreenComposer" />
    }

    // outer div is used to properly scope the css since its all scoped under .hs-app-planner
    // postcss-transform.js

    return (
      <div className="hs-app-composer">
        <div className="rc-FullScreenComposer">
          {isFeatureEnabled('PUB_31215_CONVERT_COMPOSER_TO_FUNCTIONAL') ? (
            <ComposerFunctional
              isOriginContentLab={this.props.origin === 'contentLab'}
              autoScheduleSettings={this.props.autoScheduleSettings}
              closeComposerConfirm={this.closeComposer}
              closeComposer={this.close}
              composerConf={this.props.composerConf}
              createDraftOnClick={this.createDraftOnClick}
              customContext={this.props.customContext}
              csrf={this.props.csrf}
              entitlements={this.props.entitlements}
              excludedNetworkTypes={this.props.excludedNetworkTypes}
              facadeApiUrl={this.props.facadeApiUrl}
              fetchPreviewData={fetchPreviewData => {
                this._fetchPreviewData = fetchPreviewData
              }}
              flux={this.props.flux}
              headerProp={this.renderHeader()}
              canSendToAmplify={this.props.canSendToAmplify}
              isAutoScheduledEnabled={this.props.isAutoScheduledEnabled || this.props.isDraftAutoScheduled}
              isEditMode={this.props.isEditMode}
              isSocialProfileSelectorDisabled={this.getIsSocialProfileSelectorDisabled()}
              isUsingLATM={this.props.isUsingLATM}
              language={this.props.language}
              linkShorteners={this.props.linkShorteners}
              memberEmail={this.props.memberEmail}
              memberSignupDate={this.props.memberSignupDate}
              memberName={this.props.memberName}
              memberId={this.props.memberId}
              memberInTrial={this.props.memberInTrial}
              mode={ComposerConstants.MODE.COMPOSER}
              onClose={this.closeComposer}
              onMinimizeProp={this.props.onMinimize}
              onSaveTemplate={this.props.onSaveTemplate}
              onSelectNewOrganization={this.props.onSelectNewOrganization}
              onSendToAmplify={this.handleSendToAmplify}
              organizations={this.props.organizations}
              privateSocialProfiles={this.props.privateSocialProfiles}
              renderDraftSharingWarning={this.renderDraftSharingWarning}
              updateTotalScheduledMessages={retrieveTotalScheduledMessages => {
                this._retrieveTotalScheduledMessages = retrieveTotalScheduledMessages
              }}
              selectedOrganization={this.props.selectedOrganization}
              sendMessage={this.sendMessage}
              shortenerConfigs={this.props.shortenerConfigs} // Remove with PUB_30814_LINK_PRESETS_USE_REDUX
              showAutoScheduleSettings={this.props.showAutoScheduleSettings}
              socialNetworks={this.props.socialNetworks}
              socialProfilesKeyedByType={this.props.socialProfilesKeyedByType}
              state={ComposerConstants.STATE.PRECOMPOSE}
              stateFarmContentSourceId={this.props.stateFarmContentSourceId}
              statusMessage={this.props.statusMessage}
              suggestedTags={this.props.suggestedTags}
              tags={this.props.tags}
              templateData={this.props.templateData}
              timezoneName={this.props.timezoneName}
              trackingContext={TrackingConstants.TRACKING_CONTEXT.COMPOSER}
              updateDraftOnClick={this.updateDraftOnClick}
              zIndex={this.props.zIndex}
              addProfile={channelType => {
                // you can't specify options without the selectedSocialNetwork - it throws an error :(
                if (channelType) {
                  const organizationId = this.props.selectedOrganization && this.props.organizationId
                  emit('socialNetwork:addNetwork:modal', {
                    organizationId,
                    selectedSocialNetwork: channelType,
                  })
                } else {
                  emit('socialNetwork:addNetwork:modal')
                }
              }}
              showOnboarding={this.props.showOnboarding}
              expired={this.props.expiredProfiles}
            />
          ) : (
            <Composer
              isOriginContentLab={this.props.origin === 'contentLab'}
              autoScheduleSettings={this.props.autoScheduleSettings}
              closeComposerConfirm={this.closeComposer}
              closeComposer={this.close}
              composerConf={this.props.composerConf}
              createDraftOnClick={this.createDraftOnClick}
              customContext={this.props.customContext}
              csrf={this.props.csrf}
              entitlements={this.props.entitlements}
              excludedNetworkTypes={this.props.excludedNetworkTypes}
              facadeApiUrl={this.props.facadeApiUrl}
              fetchPreviewData={fetchPreviewData => {
                this._fetchPreviewData = fetchPreviewData
              }}
              flux={this.props.flux}
              header={this.renderHeader()}
              canSendToAmplify={this.props.canSendToAmplify}
              isAutoScheduledEnabled={this.props.isAutoScheduledEnabled || this.props.isDraftAutoScheduled}
              isEditMode={this.props.isEditMode}
              isSocialProfileSelectorDisabled={this.getIsSocialProfileSelectorDisabled()}
              isUsingLATM={this.props.isUsingLATM}
              language={this.props.language}
              linkShorteners={this.props.linkShorteners}
              memberEmail={this.props.memberEmail}
              memberSignupDate={this.props.memberSignupDate}
              memberName={this.props.memberName}
              memberId={this.props.memberId}
              memberInTrial={this.props.memberInTrial}
              mode={ComposerConstants.MODE.COMPOSER}
              onClose={this.closeComposer}
              onMinimize={this.props.onMinimize}
              onSaveTemplate={this.props.onSaveTemplate}
              onSelectNewOrganization={this.props.onSelectNewOrganization}
              onSendToAmplify={this.handleSendToAmplify}
              organizations={this.props.organizations}
              privateSocialProfiles={this.props.privateSocialProfiles}
              renderDraftSharingWarning={this.renderDraftSharingWarning}
              updateTotalScheduledMessages={retrieveTotalScheduledMessages => {
                this._retrieveTotalScheduledMessages = retrieveTotalScheduledMessages
              }}
              selectedOrganization={this.props.selectedOrganization}
              sendMessage={this.sendMessage}
              shortenerConfigs={this.props.shortenerConfigs}
              showAutoScheduleSettings={this.props.showAutoScheduleSettings}
              socialNetworks={this.props.socialNetworks}
              socialProfilesKeyedByType={this.props.socialProfilesKeyedByType}
              state={ComposerConstants.STATE.PRECOMPOSE}
              stateFarmContentSourceId={this.props.stateFarmContentSourceId}
              statusMessage={this.props.statusMessage}
              suggestedTags={this.props.suggestedTags}
              tags={this.props.tags}
              templateData={this.props.templateData}
              timezoneName={this.props.timezoneName}
              trackingContext={TrackingConstants.TRACKING_CONTEXT.COMPOSER}
              updateDraftOnClick={this.updateDraftOnClick}
              zIndex={this.props.zIndex}
              addProfile={channelType => {
                // you can't specify options without the selectedSocialNetwork - it throws an error :(
                if (channelType) {
                  const organizationId = this.props.selectedOrganization && this.props.organizationId
                  emit('socialNetwork:addNetwork:modal', {
                    organizationId,
                    selectedSocialNetwork: channelType,
                  })
                } else {
                  emit('socialNetwork:addNetwork:modal')
                }
              }}
              showOnboarding={this.props.showOnboarding}
              expired={this.props.expiredProfiles}
            />
          )}
        </div>
      </div>
    )
  }
}

const ConnectedFullScreenComposer = memo(
  compose(
    reduxConnect(({ composer }: RootState) => ({
      isAutoScheduledEnabled: composer.isAutoScheduled,
      acceptedHashtagSuggestion: composer.acceptedHashtagSuggestion,
      isDuplicatingPost: composer.isDuplicatingPost,
      isSequentialPostingEnabled: composer.isSequentialPostingEnabled,
    })),
    connect(socialProfileStore, (state: SocialProfileState) => ({
      expiredProfiles: state.expired,
      privateSocialProfiles: state.private,
    })),
  )(FullScreenComposer),
)

export default ConnectedFullScreenComposer
