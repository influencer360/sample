import React, { ReactNode } from 'react'
import ReactDOM from 'react-dom'

import loadable from '@loadable/component'
import Immutable, { OrderedMap } from 'immutable'
import { get, isEqual, isEmpty, isNil, over, omit, isNull } from 'lodash'
import moment from 'moment-timezone'
import { connect as reduxConnect } from 'react-redux'
import ReactTimeout from 'react-timeout'
import _ from 'underscore'
import ZenScroll from 'zenscroll'
import axios from 'fe-axios'
import { CTA } from 'fe-comp-button'
import { InputBanner } from 'fe-comp-input-banner'
import { isTikTokEnabled } from 'fe-lib-darklaunch'
import {
  COMPOSER_CANVA,
  CUSTOM_APPROVALS,
  DISABLE_HASHTAG_SUGGESTIONS,
  INSTAGRAM_STORIES,
  LINKEDIN_PDF_PUBLISHING,
  MESSAGE_TAGGING,
  PRODUCT_ACCESS_HASHTAG_SUGGESTIONS,
  VIDEO_TRANSCODING,
  getFeatureAccessPermission,
} from 'fe-lib-entitlements'
import { on, off } from 'fe-lib-hootbus'
import { logError } from 'fe-lib-logging'
import { hasMemberReachedSNMax } from 'fe-lib-pendo'
import { track } from 'fe-lib-tracking'
import { uuid } from 'fe-lib-uuid'
import { AudienceTargeting } from 'fe-pnc-comp-audience-targeting'
import { FacebookTargeting } from 'fe-pnc-comp-facebook-targeting'
import { ValidationBanner, UnpairedInstagramIdsError } from 'fe-pnc-comp-field-validation-item'
import { ConnectedSocialNetworkPicker } from 'fe-pnc-comp-social-network-picker'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkGroup, SocialNetworkType } from 'fe-pnc-constants-social-profiles'
import {
  actions as ComposerMessageActions,
  getSelectedMessage,
  getSelectedMessageValue,
  getState as getComposerMessageState,
  selectedMessageInterface as SelectedMessageState,
  store as composerMessageStore,
} from 'fe-pnc-data-composer-message'
import type { AttachmentData } from 'fe-pnc-data-composer-message'
import { hasEntitlement } from 'fe-pnc-data-entitlements'
import { getStore as getMessagePreviewsStore } from 'fe-pnc-data-message-previews'
import type { Mentions, PreviewsState, SanitizedMessage } from 'fe-pnc-data-message-previews'
import { hasSeenPopover, isScrapeInProgress, linkScraperCancelRequests, scrape } from 'fe-pnc-lib-api'
import { withCTTIInstance } from 'fe-pnc-lib-ctti'
import { isFeatureEnabled, isFeatureEnabledOrBeta, isThreadsEnabled } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'
import { observeStore } from 'fe-pnc-lib-store-observer'
import { FIELD_VALIDATIONS, FIELD_TYPES } from 'fe-pnc-validation-error-messages'

import ApproverArea from '@/components/approver-area'
import PeopleHotairBalloons from '@/components/bulk-composer/glyphs/people-hotair-balloon'
import SpotClouds from '@/components/bulk-composer/glyphs/spot-clouds'
import MessagePreviewArea from '@/components/composer/message-preview-area/message-preview-area'
import MessageEditContentComponent from '@/components/message-edit/message-edit-content/message-edit-content'
import MessageEditStates, {
  MessageEditStatesCta,
  MessageEditStatesImage,
  MessageEditStatesText,
  MessageEditStatesTitle,
} from '@/components/message-edit/message-edit-states/message-edit-states'
import { shouldShowPostTypeToggle } from '@/components/message-edit/post-type-toggle'
import TagArea from '@/components/tag-area'
import ComposerConstants from '@/constants/composer'
import Constants from '@/constants/constants'
import { FEATURE_UNLIMITED } from '@/constants/entitlements'
import { KEYBOARD_SHORTCUTS_EVENTS } from '@/constants/events'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import TrackingConstants from '@/constants/tracking'
import Message from '@/models/message'
import { composerActions } from '@/redux/reducers/composer'
import { AppDispatch, RootState } from '@/redux/store'
import { EditMode, TrackingContext } from '@/typings/Constants'
import { Flux, LinkShortners, Organization, ShortenerConfigs } from '@/typings/Flux'
import {
  AdPromotionCreateBoostCampaignRequest,
  Attachments,
  ErrorType,
  FieldValidations,
  LinkSettings,
  Tag,
  URLPreview,
} from '@/typings/Message'
import { SocialNetwork, SocialNetworksKeyedById } from '@/typings/SocialNetwork'
import ComposerUtils from '@/utils/composer-utils'
import { EntitlementsUtils } from '@/utils/entitlement-utils'
import LinkUtils from '@/utils/link-utils'
import { importInstagramMobileSetup } from '@/utils/load-ig-mobile-setup'
import { doMessagesContainUnlinkedMention } from '@/utils/mentions-utils'
import MessageUtils from '@/utils/message-utils'
import statusObject, { StatusObject } from '@/utils/status-bar'
import { getSessionId } from '@/utils/tracking'
import ValidationUtils from '@/utils/validation-utils'
import EditHeader from './edit-header/edit-header'
import ExtendedInfoTextEntryDeprecated, {
  ConnectedExtendedInfoTextEntry as ExtendedInfoTextEntry,
} from './extended-info-text-entry'
import Locations from './locations'
import { MediaPicker } from './media-picker'
import {
  BannerArea,
  EditContainer,
  EditContent,
  MessageEditAreaWrapper,
  MessageSettingsContainer,
  ProfileSelectorErrorContainer,
} from './message-edit-area.style'
import PinterestBoardPicker from './pinterest-board-picker'
import PublisherNotes from './publisher-notes/publisher-notes'
import TiktokEngagementArea from './tiktok-engagement-area'

const ProfileSelector = ConnectedSocialNetworkPicker
const { SN_TYPES } = SocialProfileConstants

const BoostPost = loadable(() => import(/* webpackChunkName: "BoostPost" */ 'fe-ae-comp-composer-boost-post'))
BoostPost.displayName = 'BoostPost' // The displayName is needed for finding the component in the unit tests

AudienceTargeting.displayName = 'LinkedInAudienceTargeting'

const InstagramStoryAspectRatioInfoBanner = loadable(
  () =>
    import(
      /* webpackChunkName: "InstagramStoryAspectRatioInfoBanner " */ '../../composer-banners/instagram-story-aspect-ratio-info-banner'
    ),
)
InstagramStoryAspectRatioInfoBanner.displayName = 'InstagramStoryAspectRatioInfoBanner'

const SocialGptInfoBanner = loadable(
  () => import(/* webpackChunkName: "SocialGptInfoBanner " */ '../../composer-banners/socialgpt-info-banner'),
)
SocialGptInfoBanner.displayName = 'SocialGptInfoBanner'

const MultiNetworkMentionsInfoBanner = loadable(
  () =>
    import(
      /* webpackChunkName: "MultiNetworkMentionsInfoBanner " */ '../../composer-banners/multi-network-mentions-info-banner'
    ),
)
MultiNetworkMentionsInfoBanner.displayName = 'MultiNetworkMentionsInfoBanner'

const MultiNetworkInfoBanner = loadable(
  () =>
    import(
      /* webpackChunkName: "MultiNetworkInfoBanner " */ '../../composer-banners/multi-network-info-banner'
    ),
)

const TikTokInfoBanner = loadable(
  () => import(/* webpackChunkName: "TikTokInfoBanner " */ '../../composer-banners/tiktok-info-banner'),
)

const ProductTaggingWarningBanner = loadable(
  () =>
    import(
      /* webpackChunkName: "ProductTaggingWarningBanner" */ '../../composer-banners/product-tagging-warning-banner'
    ),
)

const InstagramReelInfoBanner = loadable(() => import('../../composer-banners/instagram-reel-info-banner'))

const InstagramStoriesInComposerInfoBanner = loadable(
  () =>
    import(
      /* webpackChunkName: "InstagramStoriesInComposerInfoBanner " */ '../../composer-banners/instagram-stories-in-composer-info-banner'
    ),
)

// prettier-ignore
const MESSAGES_READY_FOR_REVIEW = translation._('Your posts are ready to review!')
const MESSAGES_CONTAIN_ERRORS = numErrors =>
  // prettier-ignore
  translation._('%s of your posts will need a few fixes before they can be scheduled. Select a post from the list to review or edit.',)
    .replace('%s', numErrors)
const MESSAGES_READY = translation._('Your posts are ready to go!')
const SCHEDULE_ALL_MESSAGES = translation._('Schedule all posts')
const SELECT_MESSAGE = translation._('Or select a post to review or edit')
const LINK_SETTINGS_SUCCESS = translation._('Your link settings have been applied successfully.')
const ENTER_TEXT_AND_LINKS = translation._('Enter your text and links')
const MESSAGE_EDIT_TEXT_HEADER = translation._('Text')
// prettier-ignore
const IG_STORY_CLIPBOARD_TEXT_PLACEHOLDER = translation._('Enter text and links. They will be sent to your device for easy access.')
// Boost instagram warning
const BOOST_IG_CAROUSEL_WARNING = translation._(
  'Posts with more than one image or video can’t be boosted from Hootsuite.',
)
const BOOST_IG_CAROUSEL_BOOSTED_WARNING = translation._(
  'Posts with more than one image or video can’t be boosted from Hootsuite. If you keep the extra image, your boost settings will be deleted when you publish your post.',
)
// Boost LinkedIn warning
const BOOST_LI_CAROUSEL_WARNING = translation._(
  'Posts with more than one image or video can’t be boosted from Hootsuite.',
)
const BOOST_LI_CAROUSEL_BOOSTED_WARNING = translation._(
  'Posts with more than one image or video can’t be boosted from Hootsuite. If you keep the extra image, your boost settings will be deleted when you publish your post.',
)

const BOOST_LINKEDIN_OBJECTIVE_WARNING_CHANGED_TO_VIDEO = translation._(
  "You added a video to this post, so we've changed your boost objective to Video views.",
)
const BOOST_LINKEDIN_OBJECTIVE_WARNING_CHANGED_TO_ENGAGEMENT = translation._(
  "You removed the video from this post, so we've changed your boost objective to Engagement.",
)
const PINTEREST_PLACEHOLDER = translation._('Say more about this Pin (required)')
const PINTEREST_EXTENDED_INFO_PLACEHOLDER = translation._('Add the URL this Pin links to (required)')
const PINTEREST_EXTENDED_INFO_TEXT = translation._('Website')
const PINTEREST_PIN_TO = translation._('Pin To')

const defaultScrollDuration = 250
const scrollEdgeOffset = 30
const noop = () => {}

const MessageEditContent = withCTTIInstance('Composer', 'MessageEditContent', MessageEditContentComponent)
interface MessageEditAreaProps {
  addProfile?(): void
  csrf: string
  customContext?: string
  dispatch: AppDispatch
  entitlements: Record<string, number>
  extendedInfo?: Record<string, unknown>
  excludedNetworkTypes?: Array<SocialNetworkType>
  facadeApiUrl: string
  fetchPreviewData(): void
  flux: Flux
  ignoredPreviewValidationMessageCodes?: Array<string>
  isBulkComposer?: boolean
  isEditOnly?: boolean
  isEditMode?: boolean
  isLoading?: boolean
  isSchedulerOpen?: boolean
  isSendingMessage?: boolean
  isSocialProfileSelectorDisabled?: boolean
  isUsingLATM?: boolean
  showOnSubmitErrors?: boolean
  language?: string
  linkShorteners?: LinkShortners
  maxScheduledMessages: number
  memberId: number
  messages?: Array<Message>
  mode?: EditMode
  numberOfMessagesSelected?: number
  onAddAttachment(attachmentData: AttachmentData, isUploadRequired?: boolean, currentSource?: string): void
  onAddIgnoredPreviewValidationMessageCode(code: number): void
  onChangePreset(): void
  onChangeText(
    newText: string,
    newMentions: Mentions,
    newTemplate?: string,
    selectedNetworkGroup?: SocialNetworkGroup | null,
  ): void
  onCreateBoardComplete(): void
  onFetchSocialProfiles?(): void
  onAttachmentEdited: () => void
  onLinkPreviewChange(): void
  onManageTags(): void
  onModeChange(): void
  onScheduleAll(): void
  onToggleMediaLibrary?(): void
  onUploadQueueComplete?(): void
  organizations?: Array<Organization>
  selectedOrganization: Organization
  selectedPublishTime?: string
  selectedSocialNetworkIds: Array<number>
  setTimeout(): void //This prop is injected via higher order component to safely handle timeouts
  shortenerConfigs?: ShortenerConfigs // Remove with PUB_30814_LINK_PRESETS_USE_REDUX
  socialNetworks: Array<SocialNetwork>
  suggestedTags: Array<Tag>
  tags: Array<Tag>
  totalScheduledMessages: number
  trackingContext: TrackingContext
  uploadingFiles?: Array<any>
  hasAlbumTargetingWarning?: boolean
  showOnboarding?: boolean
  isSequentialPostingEnabled?: boolean
  selectedNetworkGroup?: SocialNetworkGroup
  selectedMessageForEdit: Message
  timezoneName: string
  snGroupsWithUnlinkedMention: Array<string>
  onTrackMediaUploadError?(error: ErrorType): void
  isEligibleProductAccountSelected: boolean
  onClickHashtagButton(): void
  isHashtagPanelOpen: boolean
  isOriginContentLab: boolean
  isAIPanelOpen: boolean
  onClickAIButton(): void
}

type CampaignObjectiveChanged = 'changed_to_video' | 'changed_to_engagement'

interface MessageEditAreaState {
  lastScrapedUrl: string | null
  linkScrapeInProgress: boolean
  linkScrapeInvalid: boolean //Remove with PUB_30706_LINK_SETTINGS_PNE
  selectedLink: string | null
  twSpIds: Array<string>
  socialNetworksForBoost: Array<SocialNetwork>
  facebookPageProfiles: Array<number>
  linkedInCompanyProfiles: Array<number>
  previewMessages: Array<SanitizedMessage>
  fieldValidations: FieldValidations
  linkSettings: LinkSettings | null
  campaignId: string | null
  albumName: string | null
  publishingMode: string
  socialNetworksKeyedById: SocialNetworksKeyedById
  attachments: Attachments
  numOfPinterestBoardsSelected: number
  selectedNetworkTypes: Array<SocialNetworkType>
  appliedTags: Array<Tag>
  selectedSocialNetworkIds: Array<number>
  sendDate: number
  appliedPublisherNotes: string
  unpairedInstagramIds: Array<number>
  isLoading: boolean
  socialNetworkTypesForCounting: Array<SocialNetworkType>
  boostCampaign: AdPromotionCreateBoostCampaignRequest | null
  savedBoostCampaign: AdPromotionCreateBoostCampaignRequest | null
  campaignObjectiveChanged?: CampaignObjectiveChanged
  isBoosted: boolean
  isMentionSearchInProgress: boolean
  shouldShowInstagramStoriesInComposerInfoBanner: boolean
  shouldShowOwlyWriterBanner: boolean
  hasTriggeredProductTaggingSetupModal: boolean
  isPreviewChanged: boolean
  shouldShowLoadingAnimation: boolean
  isContentLabOnboardingVisible: boolean
  isHashtagAccessAllowed: boolean
  isHashtagDisabled: boolean
  isCanvaAccessAllowed: boolean
  isPdfUploadAllowed: boolean
  hasTagAccessEntitlement: boolean
  hasApprovalAccessEntitlement: boolean
}

export class MessageEditArea extends React.PureComponent<MessageEditAreaProps, MessageEditAreaState> {
  readonly composerMessageActions: typeof ComposerMessageActions
  scrollContainer: any
  zenScroller: any
  statusObject: StatusObject
  unsubscribeObservers: any[]
  twitterLocationAreaNode: any
  attachmentAreaNode: any
  messageEditTextNode: any
  profileSelectorNode: any
  tagAreaNode: any

  static displayName = 'Message Edit Area'

  static defaultProps = {
    addProfile: noop,
    fetchPreviewData: noop,
    ignoredPreviewValidationMessageCodes: [],
    isEditOnly: false,
    isEditMode: false,
    isLoading: false,
    isSchedulerOpen: false,
    isSocialProfileSelectorDisabled: false,
    isUsingLATM: false,
    language: 'en',
    showOnSubmitErrors: false,
    numberOfMessagesSelected: 0,
    maxScheduledMessages: FEATURE_UNLIMITED,
    onUploadQueueComplete: noop,
    selectedPublishTime: null,
    selectedSocialNetworkIds: [],
    setTimeout: noop,
    onChangePreset: noop,
    onManageTags: noop,
    onFetchSocialProfiles: noop,
    totalScheduledMessages: -1,
    uploadingFiles: [],
    hasAlbumTargetingWarning: false,
    showOnboarding: false,
    isSequentialPostingEnabled: false,
    selectedNetworkGroup: null,
    isEligibleProductAccountSelected: false,
  }

  constructor(props: MessageEditAreaProps) {
    super(props)

    this.composerMessageActions = ComposerMessageActions

    this.scrollContainer = null
    this.zenScroller = null
    this.unsubscribeObservers = []
    // We want to make sure we're always using the same instance. This is important for dependency injection
    this.statusObject = statusObject

    this.twitterLocationAreaNode = React.createRef()

    const selectedMessageForEditInConstructor = this.getSelectedMessageForEdit()
    this.state = {
      lastScrapedUrl: null,
      linkScrapeInProgress: false,
      linkScrapeInvalid: false, // Remove with PUB_30706_LINK_SETTINGS_PNE
      selectedLink: null,
      twSpIds: [],
      socialNetworksForBoost:
        (!props.isBulkComposer &&
          selectedMessageForEditInConstructor &&
          selectedMessageForEditInConstructor.socialNetworksKeyedById.toArray()) ||
        [],
      facebookPageProfiles: [],
      linkedInCompanyProfiles: [],
      previewMessages: [],
      fieldValidations: {},
      linkSettings: [],
      campaignId: selectedMessageForEditInConstructor && selectedMessageForEditInConstructor.campaignId,
      albumName: '',
      publishingMode:
        (selectedMessageForEditInConstructor && selectedMessageForEditInConstructor.publishingMode) ||
        Constants.INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH,
      socialNetworksKeyedById:
        (selectedMessageForEditInConstructor &&
          selectedMessageForEditInConstructor.socialNetworksKeyedById) ||
        Immutable.OrderedMap({}),
      attachments:
        (selectedMessageForEditInConstructor && selectedMessageForEditInConstructor.attachments) || [],
      numOfPinterestBoardsSelected: 0,
      selectedNetworkTypes: [],
      appliedTags: selectedMessageForEditInConstructor?.tags || [],
      selectedSocialNetworkIds: [],
      sendDate: 0,
      appliedPublisherNotes: selectedMessageForEditInConstructor?.publisherNotes || '',
      unpairedInstagramIds: [],
      isLoading: false,
      socialNetworkTypesForCounting: [],
      boostCampaign: null,
      savedBoostCampaign: null,
      campaignObjectiveChanged: undefined,
      isBoosted: false,
      isMentionSearchInProgress: false,
      shouldShowInstagramStoriesInComposerInfoBanner: false,
      shouldShowOwlyWriterBanner: false,
      hasTriggeredProductTaggingSetupModal: false,
      isPreviewChanged: false,
      shouldShowLoadingAnimation: true,
      isContentLabOnboardingVisible: false,
      isHashtagAccessAllowed: false,
      isHashtagDisabled: true,
      isCanvaAccessAllowed: false,
      isPdfUploadAllowed: false,
      hasTagAccessEntitlement: false,
      hasApprovalAccessEntitlement: false,
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps: MessageEditAreaProps) {
    if (this.props.selectedMessageForEdit && nextProps.selectedMessageForEdit) {
      if (
        this.props.selectedOrganization &&
        nextProps.selectedOrganization &&
        this.props.selectedOrganization.organizationId !== nextProps.selectedOrganization.organizationId
      ) {
        this.onDoneApplyTags([])
      }

      // want to clear info from the baseMessage in this case
      if (this.props.selectedSocialNetworkIds.length > 0 && nextProps.selectedSocialNetworkIds.length === 0) {
        this.onLocationReset(SocialProfileConstants.SN_GROUP.TWITTER)
      }
    }

    if (nextProps.showOnSubmitErrors) {
      const hasMessageEditAreaError = this.scrollToFirstError(nextProps)
      if (
        !hasMessageEditAreaError &&
        ValidationUtils.hasErrorsByField(
          this.getFieldValidations(),
          FIELD_VALIDATIONS.SEND_DATE,
          nextProps.showOnSubmitErrors,
        ) &&
        !this.props.isSchedulerOpen
      ) {
        this.props.dispatch(composerActions.setIsSchedulerOpen(true))
      }
    }
  }

  componentWillUnmount() {
    over(this.unsubscribeObservers)()

    linkScraperCancelRequests()

    if (isFeatureEnabled('PGR_1939_KEYBOARD_SHORTCUTS')) {
      off(KEYBOARD_SHORTCUTS_EVENTS.TOGGLE_HASHTAG_SUGGESTIONS, this.handleHashtagButtonClick)
    }
  }

  componentDidUpdate(prevProps: MessageEditAreaProps, prevState: MessageEditAreaState) {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (selectedMessageForEdit) {
      if (prevState.numOfPinterestBoardsSelected === 0 && this.state.numOfPinterestBoardsSelected > 0) {
        this.composerMessageActions.updateFieldById(
          selectedMessageForEdit.id,
          Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS,
          {},
        )
      }

      if (prevState.selectedNetworkTypes.length !== this.state.selectedNetworkTypes.length) {
        if (
          selectedMessageForEdit.hasLinkedInV2Targeting() &&
          !selectedMessageForEdit.isSocialProfileTypeSelected(SN_TYPES.LINKEDINCOMPANY)
        ) {
          this.onSetLinkedInTargeting(null)
        }

        if (
          selectedMessageForEdit.hasFacebookTargeting() &&
          !selectedMessageForEdit.isSocialProfileTypeSelected(SN_TYPES.FACEBOOKPAGE)
        ) {
          this.onSetFacebookTargeting(null)
        }
      }

      if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
        if (prevProps.selectedNetworkGroup !== this.props.selectedNetworkGroup) {
          const selectedMessageForEdit = this.getSelectedMessageForEdit()
          let lastScrapedUrl: string
          if (isEmpty(selectedMessageForEdit.attachments)) {
            lastScrapedUrl = selectedMessageForEdit.urlPreview?.originalUrl ?? null
          } else {
            lastScrapedUrl = null
          }

          this.setState({ lastScrapedUrl })
          linkScraperCancelRequests()
        }

        if (isEmpty(prevState.attachments) && !isEmpty(this.state.attachments)) {
          this.setState({ lastScrapedUrl: null })
        }

        if (!isEmpty(prevState.attachments) && isEmpty(this.state.attachments)) {
          this.setState({ lastScrapedUrl: null })
          this.onScrapeLink(selectedMessageForEdit.renderMessageText())
        }
      }
    }

    if (this.props.isSendingMessage != prevProps.isSendingMessage) {
      this.setState({ isLoading: this.props.isSendingMessage })
    }
  }

  componentDidMount() {
    if (this.scrollContainer) {
      this.zenScroller = ZenScroll.createScroller(
        this.scrollContainer,
        defaultScrollDuration,
        scrollEdgeOffset,
      )
    }

    this.unsubscribeObservers = [
      observeStore(
        getMessagePreviewsStore(),
        (previewMessages: Array<SanitizedMessage>) => {
          if (Array.isArray(previewMessages)) {
            const isTextNotEmpty =
              previewMessages.map(message => message.message.length > 0).find(t => t == true) != undefined
            const isAttachmentNotEmpty =
              previewMessages
                .map(message => (message.attachments ? message.attachments.length > 0 : false))
                .find(t => t == true) != undefined
            const isPreviewChanged =
              !isEqual(this.state.previewMessages, previewMessages) &&
              (isTextNotEmpty || isAttachmentNotEmpty)
            if (!this.props.isBulkComposer) {
              this.setState({ previewMessages, isPreviewChanged }, () => {
                const socialProfiles = this.state.previewMessages.map(message => message.socialProfile)
                const twSpIds = this.getSPIdsByNetwork(
                  socialProfiles,
                  SocialProfileConstants.SN_GROUP_TO_SN_TYPES[SocialProfileConstants.SN_GROUP.TWITTER],
                )
                if (!_.isEqual(twSpIds, this.state.twSpIds)) {
                  this.setState({ twSpIds })
                }
                if (
                  !_.isEqual(
                    this.getSPIdsByNetwork(socialProfiles, [SN_TYPES.LINKEDINCOMPANY]),
                    this.state.linkedInCompanyProfiles,
                  )
                ) {
                  this.setState({
                    linkedInCompanyProfiles: this.getSPIdsByNetwork(socialProfiles, [
                      SN_TYPES.LINKEDINCOMPANY,
                    ]),
                  })
                }
                if (
                  !_.isEqual(
                    this.getSPIdsByNetwork(socialProfiles, [SN_TYPES.FACEBOOKPAGE]),
                    this.state.facebookPageProfiles,
                  )
                ) {
                  this.setState({
                    facebookPageProfiles: this.getSPIdsByNetwork(socialProfiles, [SN_TYPES.FACEBOOKPAGE]),
                  })
                }
              })
            } else {
              this.setState({ previewMessages, isPreviewChanged })
            }
          }
        },
        (state: PreviewsState) => state.previewMessages,
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        fieldValidations => this.setState({ fieldValidations }),
        state => getSelectedMessageValue(state, 'fieldValidations'),
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        campaignId => {
          if (!this.props.isBulkComposer) {
            if (this.state.campaignId !== campaignId) {
              if (campaignId === null) {
                this.onDoneApplyTags([])
              } else if (campaignId) {
                this.onDoneApplyTags(this.getCampaignOutboundTags(campaignId))
              }
            }
          }
          this.setState({ campaignId })
        },
        state => getSelectedMessageValue(state, 'campaignId'),
      ),
      observeStore(
        composerMessageStore,
        linkSettings => {
          if (!this.props.isBulkComposer && !_.isEmpty(linkSettings)) {
            if (this.scrollContainer) {
              this.zenScroller = ZenScroll.createScroller(
                this.scrollContainer,
                defaultScrollDuration,
                scrollEdgeOffset,
              )
            }
          }
          this.setState({ linkSettings })
        },
        state => getSelectedMessageValue(state, 'linkSettings'),
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        socialNetworksKeyedById => {
          this.setState({ socialNetworksKeyedById })
          if (this.props.isBulkComposer) {
            let socialProfiles = []
            if (OrderedMap.isOrderedMap(socialNetworksKeyedById)) {
              socialProfiles = socialNetworksKeyedById.toArray()
            }
            const twSpIds = this.getSPIdsByNetwork(
              socialProfiles,
              SocialProfileConstants.SN_GROUP_TO_SN_TYPES[SocialProfileConstants.SN_GROUP.TWITTER],
            )
            /* eslint-enable no-undef */

            const updatedState: any = {}
            if (!isEqual(twSpIds, this.state.twSpIds)) {
              // this.setState({ twSpIds })
              updatedState.twSpIds = twSpIds
            }
            const linkedInCompanyProfiles = this.getSPIdsByNetwork(socialProfiles, [SN_TYPES.LINKEDINCOMPANY])
            if (!isEqual(linkedInCompanyProfiles, this.state.linkedInCompanyProfiles)) {
              updatedState.linkedInCompanyProfiles = linkedInCompanyProfiles
            }
            const facebookPageProfiles = this.getSPIdsByNetwork(socialProfiles, [SN_TYPES.FACEBOOKPAGE])
            if (!isEqual(facebookPageProfiles, this.state.facebookPageProfiles)) {
              updatedState.facebookPageProfiles = facebookPageProfiles
            }
            if (Object.keys(updatedState).length) {
              this.setState(updatedState)
            }
          }
        },
        state => getSelectedMessageValue(state, 'socialNetworksKeyedById'),
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        albumName => this.setState({ albumName }),
        state => getSelectedMessageValue(state, 'baseMessage.albumName'),
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        boostCampaign => this.setState({ boostCampaign }),
        state => getSelectedMessage(state)?.getBoostCampaign(),
      ),
      observeStore(
        composerMessageStore,
        savedBoostCampaign => this.setState({ savedBoostCampaign }),
        state => getSelectedMessage(state)?.getSavedBoostCampaign(),
      ),
      observeStore(
        composerMessageStore,
        isBoosted => this.setState({ isBoosted }),
        state => getSelectedMessageValue(state, 'isBoosted'),
      ),
      observeStore(
        composerMessageStore,
        publishingMode => this.setState({ publishingMode }),
        state => getSelectedMessageValue(state, 'publishingMode'),
      ),
      observeStore(
        composerMessageStore,
        socialNetworkTypes => {
          const newSocialNetworkTypes = _.uniq(socialNetworkTypes)
          if (!isEqual(this.state.selectedNetworkTypes, newSocialNetworkTypes)) {
            this.setState({
              selectedNetworkTypes: newSocialNetworkTypes,
              socialNetworkTypesForCounting:
                ComposerUtils.getSocialNetworkTypesForCounting(socialNetworkTypes),
            })
          }
        },
        state => {
          const selectedMessageForEdit = getSelectedMessage(state)
          return (selectedMessageForEdit && selectedMessageForEdit.getSocialNetworkTypes()) || []
        },
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        sendDate => {
          const msgSendDate = sendDate
            ? sendDate
            : Math.floor(Date.now() / Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS)
          this.setState({ sendDate: msgSendDate })
        },
        state => getSelectedMessageValue(state, 'sendDate'),
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        selectedSocialNetworkIds => this.setState({ selectedSocialNetworkIds }),
        state => {
          const selectedMessageForEdit = getSelectedMessage(state)
          return (selectedMessageForEdit && selectedMessageForEdit.getSocialNetworkIds()) || []
        },
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        attachments => {
          if (
            Array.isArray(this.state.attachments) &&
            Array.isArray(attachments) &&
            attachments.length !== this.state.attachments.length
          ) {
            this.setState({ attachments })
          }
        },
        state => {
          if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
            const selectedNetworkGroup = getSelectedMessageValue(state, 'selectedNetworkGroup', false, null)

            if (selectedNetworkGroup) {
              return MessageUtils.getAttachmentsBySelectedNetwork(
                getSelectedMessageValue(state, 'messages', false, []),
                selectedNetworkGroup,
              )
            }

            return getSelectedMessageValue(state, 'attachments', false, [])
          }

          getSelectedMessageValue(state, 'attachments', false, [])
        },
      ),
      observeStore(composerMessageStore, state => {
        if (ComposerUtils.isPinterestComposer(this.props.customContext)) {
          const boards = getSelectedMessageValue(state, ['messages', 0, 'extendedInfo', 'boards'], false, [])
          if (Array.isArray(boards) && boards.length !== this.state.numOfPinterestBoardsSelected) {
            this.setState({ numOfPinterestBoardsSelected: boards.length })
          }
        }
      }),
      observeStore(
        composerMessageStore,
        appliedTags => {
          if (Array.isArray(this.state.appliedTags) && !isEqual(appliedTags, this.state.appliedTags)) {
            this.setState({ appliedTags })
          }
        },
        state => getSelectedMessageValue(state, 'tags', false, []),
      ),
      observeStore(
        composerMessageStore,
        appliedPublisherNotes => {
          if (!isEqual(appliedPublisherNotes, this.state.appliedPublisherNotes)) {
            this.setState({ appliedPublisherNotes })
          }
        },
        state => getSelectedMessageValue(state, 'publisherNotes'),
      ),
      observeStore(
        composerMessageStore,
        instagramPairingErrors =>
          this.setState({ unpairedInstagramIds: instagramPairingErrors.map(e => e.socialProfileId) }),
        state => get(state, 'instagramPairingErrors'),
      ),
    ]

    if (this.props.isBulkComposer) {
      // Add schedule date errors to field validations on initial render
      this.updateBulkComposerFieldValidations()
    }

    if (this.props.isOriginContentLab) {
      hasSeenPopover(ComposerConstants.CONTENT_LAB_ONBOARDING_SEEN).then(hasSeen => {
        this.setState({
          ...this.state,
          isContentLabOnboardingVisible: !hasSeen,
        })
      })
    }

    if (isFeatureEnabled('PUB_31645_BULK_FETCH_COMPOSER_ENTITLEMENTS')) {
      Promise.all([
        hasEntitlement(this.props.memberId, PRODUCT_ACCESS_HASHTAG_SUGGESTIONS),
        hasEntitlement(this.props.memberId, DISABLE_HASHTAG_SUGGESTIONS),
      ]).then(
        ([productAccessHashtagSuggestionsFeatureAccess, disableHashtagSuggestionsFeatureAccess]: [
          boolean,
          boolean,
        ]) => {
          this.setState({
            ...this.state,
            isHashtagAccessAllowed: productAccessHashtagSuggestionsFeatureAccess,
            isHashtagDisabled: this.props.isBulkComposer || disableHashtagSuggestionsFeatureAccess,
          })
        },
      )

      hasEntitlement(this.props.memberId, COMPOSER_CANVA).then((featureAccess: boolean) => {
        this.setState({
          ...this.state,
          isCanvaAccessAllowed: featureAccess,
        })
      })

      if (isFeatureEnabledOrBeta('PUB_30723_LINKEDIN_PDF')) {
        hasEntitlement(this.props.memberId, LINKEDIN_PDF_PUBLISHING).then((featureAccess: boolean) => {
          this.setState({
            ...this.state,
            isPdfUploadAllowed: featureAccess,
          })
        })
      }
    } else {
      Promise.all([
        getFeatureAccessPermission(this.props.memberId, PRODUCT_ACCESS_HASHTAG_SUGGESTIONS),
        getFeatureAccessPermission(this.props.memberId, DISABLE_HASHTAG_SUGGESTIONS),
      ]).then(
        ([productAccessHashtagSuggestionsFeatureAccess, disableHashtagSuggestionsFeatureAccess]: [
          boolean,
          boolean,
        ]) => {
          this.setState({
            ...this.state,
            isHashtagAccessAllowed: productAccessHashtagSuggestionsFeatureAccess,
            isHashtagDisabled: this.props.isBulkComposer || disableHashtagSuggestionsFeatureAccess,
          })
        },
      )

      getFeatureAccessPermission(this.props.memberId, COMPOSER_CANVA).then((featureAccess: boolean) => {
        this.setState({
          ...this.state,
          isCanvaAccessAllowed: featureAccess,
        })
      })

      if (isFeatureEnabledOrBeta('PUB_30723_LINKEDIN_PDF')) {
        getFeatureAccessPermission(this.props.memberId, LINKEDIN_PDF_PUBLISHING).then(
          (featureAccess: boolean) => {
            this.setState({
              ...this.state,
              isPdfUploadAllowed: featureAccess,
            })
          },
        )
      }
    }

    hasSeenPopover(ComposerConstants.INSTAGRAM_STORIES_IN_COMPOSER_ONBOARDING_SEEN).then(hasSeen => {
      this.setState({
        ...this.state,
        shouldShowInstagramStoriesInComposerInfoBanner: !hasSeen,
      })
    })

    hasSeenPopover(ComposerConstants.OWLY_WRITER_BANNER_IN_COMPOSER_SEEN).then(hasSeen => {
      this.setState({
        ...this.state,
        shouldShowOwlyWriterBanner: !hasSeen,
      })
    })

    hasEntitlement(this.props.memberId, MESSAGE_TAGGING).then(hasTagAccessEntitlement =>
      this.setState({
        ...this.state,
        hasTagAccessEntitlement,
      }),
    )

    hasEntitlement(this.props.memberId, CUSTOM_APPROVALS).then(hasApprovalAccessEntitlement =>
      this.setState({
        ...this.state,
        hasApprovalAccessEntitlement,
      }),
    )

    if (isFeatureEnabled('PGR_1939_KEYBOARD_SHORTCUTS')) {
      on(KEYBOARD_SHORTCUTS_EVENTS.TOGGLE_HASHTAG_SUGGESTIONS, this.handleHashtagButtonClick)
    }

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      // Set link preview on the first render
      const selectedMessageForEdit = this.getSelectedMessageForEdit()
      const { urlPreview = null, linkSettings = [], attachments = [] } = selectedMessageForEdit || {}

      let lastScrapedUrl: string | null = null

      if (isEmpty(attachments)) {
        if (urlPreview?.originalUrl) {
          lastScrapedUrl = urlPreview.originalUrl
        } else if (!isEmpty(linkSettings)) {
          lastScrapedUrl = linkSettings[linkSettings.length - 1]?.url
        }
      }
      this.setState({ lastScrapedUrl })
    }
  }

  hasVideoTranscodingEntitlement = entitlements => {
    return entitlements && entitlements[VIDEO_TRANSCODING] > 0
  }

  renderInputBanner(title, description) {
    return <InputBanner titleText={title} messageText={description} />
  }

  onReconnectCallback = socialProfileType => {
    const sessionId = getSessionId()
    if (sessionId) {
      track(
        TrackingConstants.TRACKING_ORIGINS.RECONNECT_PROFILE,
        TrackingConstants.TRACKING_ACTION.RECONNECT_PROFILE,
        {
          sessionId,
          socialNetwork: socialProfileType,
        },
      )
    }
  }

  getFieldValidations = () => (this.state ? this.state.fieldValidations : {})

  getFieldValidationErrors = () => get(this.state, ['fieldValidations', 'errors'], null)

  getExtendedInfo = () => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const extendedInfo = get(selectedMessageForEdit, ['extendedInfo'], undefined)
    return extendedInfo
  }

  getNumOfErrors() {
    let errors = []

    if (this.props.messages) {
      errors = _.filter(this.props.messages, message => message.hasErrors())
    }

    return errors.length
  }

  scrollToTagArea = () => {
    if (this.tagAreaNode && this.zenScroller) {
      this.zenScroller.center(ReactDOM.findDOMNode(this.tagAreaNode), 150)
    }
  }

  scrollToField(node) {
    if (node && this.zenScroller) {
      this.zenScroller.center(ReactDOM.findDOMNode(node), 150)
    }
  }

  scrollToFirstError(props) {
    const { showOnSubmitErrors } = props
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    let hasMessageEditAreaError = true

    if (!selectedMessageForEdit) {
      return false
    }

    if (
      ValidationUtils.hasErrorsByField(
        this.getFieldValidations(),
        FIELD_VALIDATIONS.SOCIAL_NETWORK,
        showOnSubmitErrors,
      )
    ) {
      this.scrollToField(this.profileSelectorNode)
    } else if (
      ValidationUtils.hasErrorsByField(
        this.getFieldValidations(),
        FIELD_VALIDATIONS.TEMPLATE,
        showOnSubmitErrors,
      )
    ) {
      this.scrollToField(this.messageEditTextNode)
    } else if (
      ValidationUtils.hasErrorsByField(
        this.getFieldValidations(),
        FIELD_VALIDATIONS.ATTACHMENTS,
        showOnSubmitErrors,
      )
    ) {
      this.scrollToField(this.attachmentAreaNode)
    } else if (
      ValidationUtils.hasErrorsByField(
        this.getFieldValidations(),
        FIELD_VALIDATIONS.PLACE,
        showOnSubmitErrors,
      )
    ) {
      const locationErrors = get(this.getFieldValidations(), ['errors', FIELD_VALIDATIONS.PLACE], null)
      if (Array.isArray(locationErrors) && locationErrors.length) {
        const { socialProfileType } = locationErrors[0]
        if (socialProfileType === SN_TYPES.TWITTER) {
          this.scrollToField(this.twitterLocationAreaNode)
        }
      }
    } else {
      hasMessageEditAreaError = false
    }

    return hasMessageEditAreaError
  }

  resetPreviewArea = (hasError: boolean, hasWarning: boolean) => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, {
      [Constants.FIELD_TO_UPDATE.UN_EDITED_URL_PREVIEW]: {
        hasWarning,
        hasError,
      },
      [Constants.FIELD_TO_UPDATE.URL_PREVIEW]: {
        hasWarning,
        hasError,
      },
    })
  }

  onScrapeLink = (text: string) => {
    let linkSettings = this.state.linkSettings

    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      linkSettings = this.getSelectedMessageForEdit().linkSettings
      const supportsLinkPreview = selectedMessageForEdit.supportsLinkPreviewIncludingTwitter()
      const isLinkPreviewValid =
        selectedMessageForEdit &&
        selectedMessageForEdit.urlPreview &&
        linkSettings &&
        linkSettings.filter(linkSetting => linkSetting.url === selectedMessageForEdit.urlPreview.originalUrl)
          .length > 0

      if (
        (!supportsLinkPreview ||
          (!isLinkPreviewValid &&
            ComposerUtils.hasOnlySocialProfileType(
              selectedMessageForEdit.getSocialNetworkTypes(),
              SN_TYPES.TWITTER,
            ))) &&
        selectedMessageForEdit.urlPreview &&
        text.indexOf(selectedMessageForEdit.urlPreview.url) === -1
      ) {
        this.composerMessageActions.updateFieldById(
          selectedMessageForEdit.id,
          Constants.FIELD_TO_UPDATE.URL_PREVIEW,
          null,
        )
        return
      }
    }

    if (selectedMessageForEdit) {
      let shouldScrape: boolean
      if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
        const hasNoPreview = isEmpty(omit(selectedMessageForEdit?.urlPreview, 'hasError', 'hasWarning'))
        shouldScrape = hasNoPreview && this.state.attachments.length === 0 && !isScrapeInProgress()
      } else {
        shouldScrape =
          !selectedMessageForEdit.urlPreview && this.state.attachments.length === 0 && !isScrapeInProgress()
      }

      if (shouldScrape) {
        let urls: string[]
        const mentions = selectedMessageForEdit.supportsMentions()
          ? selectedMessageForEdit.getAllMentions(this.props.selectedNetworkGroup)
          : []
        if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
          urls = text ? LinkUtils.getUrlsWithoutMentionOverlaps(text, mentions) : []
        } else {
          urls = text ? LinkUtils.getUrlsWithoutMentionOverlapsOld(text, mentions) : []
        }
        if (urls.length > 0) {
          const urlToScrape = urls[urls.length - 1]
          if (this.state.lastScrapedUrl === urlToScrape) {
            return
          }

          this.setState({
            lastScrapedUrl: urlToScrape,
            linkScrapeInvalid: false, // Remove with PUB_30706_LINK_SETTINGS_PNE
          })

          if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
            this.resetPreviewArea(false, false)
          }

          this.setState({ linkScrapeInProgress: true })

          scrape([urlToScrape], this.props.socialNetworks)
            .then(data => {
              // data.scrapeResults is an object with keys equal to the urls we sent
              if (
                !data.scrapeResults ||
                typeof data.scrapeResults !== 'object' ||
                data.scrapeResults[urlToScrape] === undefined
              ) {
                throw new Error('Scrape had an error, or the url was invalid')
              }

              const scrapeResult = data.scrapeResults[urlToScrape]

              const linkPreview = ComposerUtils.getLinkPreviewFromLinkScrapeResponse(scrapeResult)

              if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
                if (linkPreview?.hasError) {
                  throw new Error('Scrape had an error, or the url was invalid')
                }
              } else {
                if (!linkPreview) {
                  throw new Error('Scrape had an error, or the url was invalid')
                }
              }

              if (isFeatureEnabled('PUB_31031_UPLOAD_LI_THUMBNAILS')) {
                // Remove any link preview validation errors
                if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
                  this.resetPreviewArea(false, false)
                } else {
                  this.setState({
                    linkScrapeInvalid: false,
                  })
                }

                // Upload link preview thumbnail to S3 if LinkedIn SN is currently selected
                // and
                // Refresh the URL preview
                if (
                  selectedMessageForEdit
                    .getSocialNetworkGroups()
                    .includes(SocialProfileConstants.SN_GROUP.LINKEDIN)
                ) {
                  const thumbnailPreviewUnavailableWarning =
                    ValidationUtils.getThumbnailPreviewUnavailableWarning()
                  const updatedFieldValidations = ValidationUtils.addCustomValidations(
                    this.getFieldValidations(),
                    [thumbnailPreviewUnavailableWarning],
                    FIELD_VALIDATIONS.LINK_PREVIEW,
                    ComposerConstants.ERROR_LEVELS.WARNINGS,
                  )

                  if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
                    LinkUtils.updateMessageURLPreviewWithS3ThumbnailURL(
                      selectedMessageForEdit.id,
                      linkPreview,
                      this.composerMessageActions.updateFieldsById,
                    )
                  } else {
                    LinkUtils.updateMessageURLPreviewWithS3ThumbnailURL(
                      selectedMessageForEdit.id,
                      linkPreview,
                      this.composerMessageActions.updateFieldsById,
                      updatedFieldValidations,
                    )
                  }
                } else {
                  if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
                    this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, {
                      unEditedUrlPreview: {
                        ...linkPreview,
                        hasWarning: false,
                        hasError: false,
                      },
                      urlPreview: {
                        ...linkPreview,
                        hasWarning: false,
                        hasError: false,
                      },
                    })
                  } else {
                    this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, {
                      unEditedUrlPreview: linkPreview,
                      urlPreview: linkPreview,
                    })
                  }
                }
              } else {
                this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, {
                  unEditedUrlPreview: linkPreview,
                  urlPreview: linkPreview,
                })
              }
              this.props.fetchPreviewData()

              this.setState({ linkScrapeInProgress: false })
            })
            .catch(e => {
              this.setState({
                linkScrapeInProgress: false,
                linkScrapeInvalid: true, // Remove with PUB_30706_LINK_SETTINGS_PNE
              })
              if (!axios.isCancel(e)) {
                logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed to scrape link', {
                  errorMessage: JSON.stringify(e.message),
                  stack: JSON.stringify(e.stack),
                })
              }
              if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
                this.resetPreviewArea(true, false)
              }
            })
        } else {
          // already does not have a url, so unset if there is no link preview
          if (!selectedMessageForEdit.urlPreview) {
            this.composerMessageActions.updateFieldById(
              selectedMessageForEdit.id,
              Constants.FIELD_TO_UPDATE.UN_EDITED_URL_PREVIEW,
              null,
            )
          }
        }
      } else {
        // Remove entire else block with removal of "PUB_30706_LINK_SETTINGS_PNE"
        if (!isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
          // get linkSettings directly from the message because the state hasn't updated them yet coming from composer's onChangeMessageText
          linkSettings = this.getSelectedMessageForEdit().linkSettings
          const supportsLinkPreview = selectedMessageForEdit.supportsLinkPreviewIncludingTwitter()
          const isLinkPreviewValid =
            selectedMessageForEdit &&
            selectedMessageForEdit.urlPreview &&
            linkSettings &&
            linkSettings.filter(
              linkSetting => linkSetting.url === selectedMessageForEdit.urlPreview.originalUrl,
            ).length > 0

          if (
            (!supportsLinkPreview ||
              (!isLinkPreviewValid &&
                ComposerUtils.hasOnlySocialProfileType(
                  selectedMessageForEdit.getSocialNetworkTypes(),
                  SN_TYPES.TWITTER,
                ))) &&
            selectedMessageForEdit.urlPreview &&
            text.indexOf(selectedMessageForEdit.urlPreview.url) === -1
          ) {
            this.composerMessageActions.updateFieldById(
              selectedMessageForEdit.id,
              Constants.FIELD_TO_UPDATE.URL_PREVIEW,
              null,
            )
          }
        }
      }
    }
  }

  getSelectedBoards = () => {
    if (!ComposerUtils.isPinterestComposer(this.props.customContext)) {
      return []
    }
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (selectedMessageForEdit && ComposerUtils.isDraft(selectedMessageForEdit.messageType)) {
      // Pinterest Draft can have multiple selected boards
      return selectedMessageForEdit.baseMessage.extendedInfo.boards
    } else {
      // editing a Pinterest message can only have one selected board
      return get(selectedMessageForEdit, ['messages', 0, 'extendedInfo', 'boards'], [])
    }
  }

  onProfileSelected = async id => {
    let selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (selectedMessageForEdit) {
      const isLinkedInSelected = selectedMessageForEdit
        .getSocialNetworkGroups()
        .includes(SocialProfileConstants.SN_GROUP.LINKEDIN)
      let selectedSocialNetworksKeyedById = selectedMessageForEdit.socialNetworksKeyedById
      const selectedNetworkTypes = []
      if (!Array.isArray(id)) {
        const idStr = id.toString()
        if (!_.isEmpty(selectedSocialNetworksKeyedById) && selectedSocialNetworksKeyedById.get(idStr)) {
          selectedSocialNetworksKeyedById = selectedSocialNetworksKeyedById.delete(idStr)

          // Remove the message from the message wrapper
          this.composerMessageActions.removeMessageFromWrapper(selectedMessageForEdit.id, idStr)

          if (isFeatureEnabledOrBeta('PUB_27624_ALBUM_PICKER_VANISHING_FIX')) {
            // Remove ID from facebookNetworkIds, if present
            this.setState({ facebookPageProfiles: this.state.facebookPageProfiles.filter(i => i !== +idStr) })
          }
        } else {
          selectedSocialNetworksKeyedById = selectedSocialNetworksKeyedById.set(
            idStr,
            _.find(this.props.socialNetworks, sn => sn.socialNetworkId === id),
          )
          selectedNetworkTypes.push(selectedSocialNetworksKeyedById.get(idStr).type)
          // Add the new message to the message wrapper
          this.composerMessageActions.addNewMessageToWrapper(
            selectedMessageForEdit.id,
            idStr,
            selectedSocialNetworksKeyedById.get(idStr).type,
          )
        }
      } else {
        const idArray = id
        const isNetworksEmpty = _.isEmpty(selectedSocialNetworksKeyedById)
        const needToRemove = idArray.filter(
          i => !isNetworksEmpty && selectedSocialNetworksKeyedById.get(i.toString()),
        )

        const needToAdd = idArray.filter(i => {
          return isNetworksEmpty || !selectedSocialNetworksKeyedById.get(i.toString())
        })

        needToRemove.forEach(i => {
          const idStr = i.toString()
          selectedSocialNetworksKeyedById = selectedSocialNetworksKeyedById.delete(idStr)
          // Remove the message from the message wrapper
          this.composerMessageActions.removeMessageFromWrapper(selectedMessageForEdit.id, idStr)
        })

        needToAdd.forEach(i => {
          const idStr = i.toString()
          selectedSocialNetworksKeyedById = selectedSocialNetworksKeyedById.set(
            idStr,
            _.find(this.props.socialNetworks, sn => sn.socialNetworkId === i),
          )
          selectedNetworkTypes.push(selectedSocialNetworksKeyedById.get(idStr).type)
          // Add the new message to the message wrapper
          this.composerMessageActions.addNewMessageToWrapper(
            selectedMessageForEdit.id,
            idStr,
            selectedSocialNetworksKeyedById.get(idStr).type,
          )
        })
      }

      await this.composerMessageActions.updateFieldById(
        selectedMessageForEdit.id,
        Constants.FIELD_TO_UPDATE.SOCIAL_NETWORKS_KEYED_BY_ID,
        selectedSocialNetworksKeyedById,
      )

      // get the updated selectedMessageForEdit
      selectedMessageForEdit = this.getSelectedMessageForEdit()

      const facebookTypes = [SN_TYPES.FACEBOOK, SN_TYPES.FACEBOOKPAGE, SN_TYPES.FACEBOOKGROUP]

      const hasFacebookNetworkIds = selectedMessageForEdit.isSocialProfileTypeSelected(...facebookTypes)

      if (_.isEmpty(selectedSocialNetworksKeyedById.toJS()) || !hasFacebookNetworkIds) {
        const fieldsToUpdate = {
          [Constants.FIELD_TO_UPDATE.ALBUM_NAME]: null,
          [Constants.FIELD_TO_UPDATE.ALBUM_TYPE]: null,
        }
        this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, fieldsToUpdate)
      }

      if (selectedMessageForEdit.urlPreview) {
        if (isFeatureEnabled('PUB_31031_UPLOAD_LI_THUMBNAILS')) {
          // Upload link preview thumbnail to S3 if LinkedIn is among the added SNs and LinkedIn SN hasn't been previously selected
          // and
          // Refresh the URL preview
          const isSelectingLinkedInSN = selectedNetworkTypes.some(networkType =>
            MessageUtils.isNetworkTypeInGroup(networkType, SocialProfileConstants.SN_GROUP.LINKEDIN),
          )

          const thumbnailPreviewUnavailableWarning = ValidationUtils.getThumbnailPreviewUnavailableWarning()
          const updatedFieldValidations = ValidationUtils.addCustomValidations(
            this.getFieldValidations(),
            [thumbnailPreviewUnavailableWarning],
            FIELD_VALIDATIONS.LINK_PREVIEW,
            ComposerConstants.ERROR_LEVELS.WARNINGS,
          )
          if (isSelectingLinkedInSN && !isLinkedInSelected) {
            if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
              LinkUtils.updateMessageURLPreviewWithS3ThumbnailURL(
                selectedMessageForEdit.id,
                selectedMessageForEdit.urlPreview,
                this.composerMessageActions.updateFieldsById,
              )
            } else {
              LinkUtils.updateMessageURLPreviewWithS3ThumbnailURL(
                selectedMessageForEdit.id,
                selectedMessageForEdit.urlPreview,
                this.composerMessageActions.updateFieldsById,
                updatedFieldValidations,
              )
            }
          } else {
            // Refresh the URL preview to account for customization differences between network types
            this.composerMessageActions.updateFieldById(
              selectedMessageForEdit.id,
              Constants.FIELD_TO_UPDATE.URL_PREVIEW,
              selectedMessageForEdit.urlPreview,
            )
          }
        } else {
          // Refresh the URL preview to account for customization differences between network types
          this.composerMessageActions.updateFieldById(
            selectedMessageForEdit.id,
            Constants.FIELD_TO_UPDATE.URL_PREVIEW,
            selectedMessageForEdit.urlPreview,
          )
        }
      }
    }
  }

  onProfilesRemoved = () => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    this.composerMessageActions.removeAllMessagesFromWrapper(selectedMessageForEdit.id)
    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.SOCIAL_NETWORKS_KEYED_BY_ID,
      OrderedMap({}),
    )
    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.ALBUM_NAME,
      null,
    )
    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.ALBUM_TYPE,
      null,
    )

    // If there are no social profiles selected, remove all SOCIAL_NETWORK type field validations.
    const updatedFieldValidations = ValidationUtils.removeCustomDeauthedProfileErrors(
      this.getFieldValidations(),
    )
    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS,
      updatedFieldValidations,
    )
  }

  renderErrorState() {
    return (
      <MessageEditStates>
        <>
          <MessageEditStatesTitle>{MESSAGES_READY_FOR_REVIEW}</MessageEditStatesTitle>
          <MessageEditStatesText>{MESSAGES_CONTAIN_ERRORS(this.getNumOfErrors())}</MessageEditStatesText>
        </>
      </MessageEditStates>
    )
  }

  renderQuickSchedule() {
    const { isUsingLATM, onScheduleAll } = this.props
    // if member is logged in via latm, disable the schedule button
    const onClick = isUsingLATM ? noop : onScheduleAll
    const isLoading = this.state.isLoading
    const isDisabled = isUsingLATM || isLoading
    return (
      <MessageEditStates>
        <>
          <MessageEditStatesImage glyph={PeopleHotairBalloons} viewBox="0 0 311.6 548" />
          <MessageEditStatesTitle>{MESSAGES_READY}</MessageEditStatesTitle>
          <MessageEditStatesCta {...{ isLoading, onClick }} disabled={isDisabled} type={CTA}>
            {SCHEDULE_ALL_MESSAGES}
          </MessageEditStatesCta>
          <MessageEditStatesText>{SELECT_MESSAGE}</MessageEditStatesText>
        </>
      </MessageEditStates>
    )
  }

  renderMultiple() {
    return (
      <MessageEditStates noBackground={true}>
        <MessageEditStatesImage glyph={SpotClouds} viewBox="0 0 162.3 88.1" />
      </MessageEditStates>
    )
  }

  onChangeBoardsSelected = obj => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    if (selectedMessageForEdit) {
      let selectedSocialNetworksKeyedById = selectedMessageForEdit.socialNetworksKeyedById

      const currentSocialNetworksIdStrs = _.keys(selectedMessageForEdit.socialNetworksKeyedById.toJS())
      /*
       * Keys of selectedMessageForEdit.socialNetworksKeyedById are of strings, but socialNetworkId fields of
       * obj.boards are numbers.  Make sure both IDs are of type string for the sake of comparison.
       */
      const newSocialNetworksIdStrs = _.uniq(obj.boards.map(board => board.socialNetworkId.toString()))

      /*
       * We want to make the logic for adding and removing messages from wrappers the same for Pinterset and other social
       * networks.  But Pinterest is special because we do not have a profile selector to allow users to explicitly select
       * and deselect social profiles (see onProfileSelected).  We need to infer the selection and deselection of social
       * profiles from the boards user selected and deselected.
       */
      const socialNetworksIdsToAdd = _.difference(newSocialNetworksIdStrs, currentSocialNetworksIdStrs)
      const socialNetworksIdsToDelete = _.difference(currentSocialNetworksIdStrs, newSocialNetworksIdStrs)

      _.each(socialNetworksIdsToAdd, idStr => {
        this.composerMessageActions.addNewMessageToWrapper(
          selectedMessageForEdit.id,
          idStr,
          SN_TYPES.PINTEREST,
        )

        selectedSocialNetworksKeyedById = selectedSocialNetworksKeyedById.set(
          idStr,
          _.find(this.props.socialNetworks, sn => sn.socialNetworkId === parseInt(idStr, 10)),
        )
      })

      _.each(socialNetworksIdsToDelete, idStr => {
        this.composerMessageActions.removeMessageFromWrapper(selectedMessageForEdit.id, idStr)

        selectedSocialNetworksKeyedById = selectedSocialNetworksKeyedById.delete(idStr)
      })

      this.composerMessageActions.updateFieldById(
        selectedMessageForEdit.id,
        Constants.FIELD_TO_UPDATE.SOCIAL_NETWORKS_KEYED_BY_ID,
        selectedSocialNetworksKeyedById,
      )
    }

    this.onChangeExtendedInfo(obj)
  }

  onChangeExtendedInfo = obj => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.EXTENDED_INFO,
      _.clone(obj),
    )
  }

  onApplyLinkSettings = (
    linkSettings: LinkSettings,
    trackingData?: { shortener?: number; tracking?: string },
  ) => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      // If we are applying presets to the link settings that have not diverged from the base link settings,
      // we need to generate new link ids
      const innerMessage = MessageUtils.getInnerMessageFromGroup(
        selectedMessageForEdit.messages,
        selectedMessageForEdit.selectedNetworkGroup,
      )
      if (!isNil(innerMessage?.linkSettings) && !isEmpty(linkSettings)) {
        const shouldGenerateLinkSettingsIds = LinkUtils.shouldGenerateNewLinkSettingIds(
          innerMessage.linkSettings,
          selectedMessageForEdit.baseMessage.linkSettings,
          linkSettings,
        )
        if (shouldGenerateLinkSettingsIds) {
          linkSettings.forEach(updatedLinkSetting => (updatedLinkSetting.id = uuid()))
        }

        const template = MessageUtils.buildTemplateFromMessage(
          innerMessage.renderMessageText(),
          linkSettings,
          innerMessage.mentions,
        )

        // Need to update message template with new link setting ids
        this.composerMessageActions.updateFieldById(
          selectedMessageForEdit.id,
          Constants.FIELD_TO_UPDATE.TEMPLATE,
          template,
        )
      }

      const linkSettingsWithPresetApplied = LinkUtils.getLinkSettingsWithPresetApplied(
        selectedMessageForEdit,
        linkSettings,
        undefined,
      )
      this.composerMessageActions.applyCampaignPresets(selectedMessageForEdit.id, {
        ...linkSettingsWithPresetApplied,
      })
    } else {
      this.composerMessageActions.updateFieldById(
        selectedMessageForEdit.id,
        Constants.FIELD_TO_UPDATE.LINK_SETTINGS,
        linkSettings,
      )
    }

    if (isFeatureEnabledOrBeta('PUB_30765_LINK_SETTINGS_DIALOG_REVAMP')) {
      const { tracking = null, shortener = null } = trackingData || {}
      if (!isNull(tracking)) {
        track(
          TrackingConstants.TRACKING_ORIGINS.LINK_SETTINGS_TRACKING,
          TrackingConstants.TRACKING_ACTION.LINK_SETTINGS_TRACKING_APPLIED,
          { tracking },
        )
      }

      if (!isNull(shortener)) {
        track(
          TrackingConstants.TRACKING_ORIGINS.LINK_SETTINGS_SHORTENER,
          TrackingConstants.TRACKING_ACTION.LINK_SETTINGS_SHORTENER_APPLIED,
          { shortener },
        )
      }
    }

    this.statusObject.update(LINK_SETTINGS_SUCCESS, 'success', true)
  }

  onLinkScrapeCancel = (prevUrlPreview: URLPreview) => {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      const lastScrapedUrl = prevUrlPreview?.originalUrl ?? null

      this.setState({
        ...(this.state.linkScrapeInProgress && { linkScrapeInProgress: false }),
        lastScrapedUrl,
      })
    } else {
      this.setState({ linkScrapeInProgress: false })
    }
  }

  getSelectedMessageForEdit = () => getSelectedMessage(getComposerMessageState())

  getSocialNetworkIdsFunc = () => this.getSelectedMessageForEdit().getSocialNetworkIds()
  getSocialProfileUsernameByIdFunc = id => this.getSelectedMessageForEdit().getSocialProfileUsernameById(id)
  getSocialProfileUsernamesByIdsFunc = ids =>
    this.getSelectedMessageForEdit().getSocialProfileUsernamesByIds(ids)
  getSocialNetworkTypesFunc = () => this.getSelectedMessageForEdit().getSocialNetworkTypes()
  hasAttachmentsFunc = () => this.getSelectedMessageForEdit().hasAttachments()
  getAttachmentTypeFunc = () => this.getSelectedMessageForEdit().getAttachmentType()
  hasVideoAttachmentFunc = () => this.getSelectedMessageForEdit().hasVideoAttachment()
  getFirstErrorMessageForFieldFunc = field =>
    this.getSelectedMessageForEdit().getFirstErrorMessageForField(field)
  getFirstWarningMessageForFieldFunc = field =>
    this.getSelectedMessageForEdit().getFirstWarningMessageForField(field)
  isSocialProfileTypeSelectedFunc = (...type) =>
    this.getSelectedMessageForEdit().isSocialProfileTypeSelected(...type)
  hasThumbnailUrlsFunc = () => this.getSelectedMessageForEdit().hasThumbnailUrls()
  supportsLinkPreviewFunc = () => this.getSelectedMessageForEdit().supportsLinkPreview()

  isInstagramBusinessDirectPublishing = () =>
    ComposerUtils.hasOnlySocialProfileType(this.state.selectedNetworkTypes, SN_TYPES.INSTAGRAMBUSINESS) &&
    ComposerUtils.isDirectPublishing(this.state.publishingMode)

  renderMediaBanners = () => {
    return (
      <BannerArea>
        {isTikTokEnabled() && this.renderTikTokInfoBanners()}
        {this.renderInstagramReelInfoBanner()}
        {isFeatureEnabledOrBeta('PUB_29578_ASPECT_RATIO_BANNER_INSTA_STORY') &&
          this.renderInstagramStoryAspectRatioInfoBanner()}
      </BannerArea>
    )
  }

  handlePreviewCustomize = (nextLinkPreview: URLPreview) => {
    // Remove thumbnail warning if it's currently shown and new preview has thumbnail url
    if (!isEmpty(nextLinkPreview.thumbnailUrl) || !isEmpty(nextLinkPreview.thumbnailUrls)) {
      nextLinkPreview.hasWarning = false
    }

    this.setState({ lastScrapedUrl: nextLinkPreview.originalUrl })
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    ComposerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      [Constants.FIELD_TO_UPDATE.URL_PREVIEW],
      nextLinkPreview,
    )
    this.props.fetchPreviewData()
  }

  renderMedia = () => {
    const { entitlements, showOnboarding: isComposerOnboardingVisible } = this.props
    const isTranscodingEnabled = this.hasVideoTranscodingEntitlement(entitlements)
    const selectedMessageForEdit = this.getSelectedMessageForEdit()

    return (
      <MediaPicker
        ref={node => (this.attachmentAreaNode = node)}
        albumName={this.state.albumName}
        attachments={this.state.attachments}
        csrf={this.props.csrf}
        facadeApiUrl={this.props.facadeApiUrl}
        flux={this.props.flux} // used by multiple stores
        fieldValidations={this.getFieldValidations()}
        getAttachmentType={this.getAttachmentTypeFunc}
        getFirstErrorMessageForField={this.getFirstErrorMessageForFieldFunc}
        getFirstWarningMessageForField={this.getFirstWarningMessageForFieldFunc}
        getSocialNetworkIds={this.getSocialNetworkIdsFunc}
        getSocialNetworkTypes={this.getSocialNetworkTypesFunc}
        getSocialProfileUsernameById={this.getSocialProfileUsernameByIdFunc}
        getSocialProfileUsernamesByIds={this.getSocialProfileUsernamesByIdsFunc}
        hasAlbumTargetingWarning={this.props.hasAlbumTargetingWarning}
        hasAttachments={this.hasAttachmentsFunc}
        hasThumbnailUrls={this.hasThumbnailUrlsFunc}
        hasVideoAttachment={this.hasVideoAttachmentFunc}
        hideAltText={
          !!ComposerUtils.isPinterestComposer(this.props.customContext) ||
          this.props.selectedNetworkGroup === SocialProfileConstants.SN_GROUP.INSTAGRAM
        }
        ignoredMediaOverlimitPopups={this.props.ignoredMediaOverlimitPopups}
        isBulkComposer={this.props.isBulkComposer}
        isCanvaAccessAllowed={this.state.isCanvaAccessAllowed}
        isPdfUploadAllowed={this.state.isPdfUploadAllowed}
        isEditMode={this.props.isEditMode}
        isEditOnly={this.props.isEditOnly}
        isSocialProfileTypeSelected={this.isSocialProfileTypeSelectedFunc}
        isTranscodingEnabled={isTranscodingEnabled}
        linkScrapeInProgress={this.state.linkScrapeInProgress}
        linkScrapeInvalid={this.state.linkScrapeInvalid}
        linkSettings={this.state.linkSettings}
        messageId={selectedMessageForEdit && selectedMessageForEdit.id}
        messages={this.props.messages}
        onAddAttachment={this.props.onAddAttachment}
        onAttachmentEdited={this.props.onAttachmentEdited}
        onLinkPreviewChange={this.props.onLinkPreviewChange}
        onLinkScrapeCancel={this.onLinkScrapeCancel}
        onToggleMediaLibrary={this.props.onToggleMediaLibrary}
        onTrackMediaUploadError={this.props.onTrackMediaUploadError}
        onUploadQueueComplete={this.props.onUploadQueueComplete}
        socialNetworks={this.props.socialNetworks}
        socialNetworksKeyedById={this.state.socialNetworksKeyedById}
        supportsLinkPreview={this.supportsLinkPreviewFunc}
        trackingContext={this.props.trackingContext}
        urlPreview={selectedMessageForEdit && selectedMessageForEdit.urlPreview}
        unEditedUrlPreview={selectedMessageForEdit && selectedMessageForEdit.unEditedUrlPreview}
        verifiedFbPageIds={selectedMessageForEdit && selectedMessageForEdit.verifiedFbPageIds}
        customContext={this.props.customContext}
        showOnboarding={isComposerOnboardingVisible}
        onPreviewCustomize={this.handlePreviewCustomize}
      />
    )
  }

  onDoneApplyTags = tags => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.TAGS,
      tags,
    )
  }

  onDoneApplyPublisherNotes = publisherNotes => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.PUBLISHER_NOTES,
      publisherNotes,
    )
  }

  onDoneApplyLocations = (
    snType: string,
    locationId: string,
    locationName: string,
    locationLat = null,
    locationLong = null,
  ) => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const locations = selectedMessageForEdit.locations || []

    if (
      SocialProfileConstants.SN_GROUP_TO_SN_TYPES[SocialProfileConstants.SN_GROUP.TWITTER].includes(snType)
    ) {
      locations[SocialProfileConstants.SN_GROUP.TWITTER] = {
        latitude: locationLat,
        longitude: locationLong,
        placeId: locationId,
        placeName: locationName,
      }
    }

    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.LOCATIONS,
      locations,
    )
  }

  onLocationReset = (snType: string) => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const locations = selectedMessageForEdit.locations || {}

    if (snType === SocialProfileConstants.SN_GROUP.TWITTER) {
      delete locations[SocialProfileConstants.SN_GROUP.TWITTER]
    }

    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.LOCATIONS,
      locations,
    )
  }

  onSetLinkedInTargeting = linkedInTargeting => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const targeting = selectedMessageForEdit.targeting || {}
    if (linkedInTargeting) {
      targeting.linkedInV2Company = linkedInTargeting
    } else {
      delete targeting.linkedInV2Company
    }
    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.TARGETING,
      targeting,
    )
  }

  onSetFacebookTargeting = facebookTargeting => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const targeting = selectedMessageForEdit.targeting || {}
    if (facebookTargeting) {
      targeting.facebookPage = facebookTargeting
    } else {
      delete targeting.facebookPage
    }
    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.TARGETING,
      targeting,
    )
  }

  getCampaignOutboundTags(campaignId) {
    const campaigns = this.props.flux.getStore('campaigns').get()
    const selectedCampaign = campaigns.find(campaign => campaign.id === campaignId)
    return selectedCampaign ? selectedCampaign.tags : []
  }

  renderExtendedInfoTextEntry = () => {
    if (isFeatureEnabled('PUB_31498_3_FILES_FUNCTIONAL_CONVERSION')) {
      return (
        <ExtendedInfoTextEntry
          extendedInfo={SelectedMessageState.extendedInfoFromInnerMessage()} // the destinationUrl is the same for all messages
          extendedInfoKey={'destinationUrl'}
          getSelectedBoards={this.getSelectedBoards}
          onChange={this.onChangeExtendedInfo}
          placeHolder={PINTEREST_EXTENDED_INFO_PLACEHOLDER}
          text={PINTEREST_EXTENDED_INFO_TEXT}
          validationError={this.getFieldValidationErrors}
          fieldValidations={this.getFieldValidations()}
        />
      )
    }
    return (
      <ExtendedInfoTextEntryDeprecated
        extendedInfo={SelectedMessageState.extendedInfoFromInnerMessage()} // the destinationUrl is the same for all messages
        extendedInfoKey={'destinationUrl'}
        iconSourceKey={'fa-link'}
        getSelectedBoards={this.getSelectedBoards}
        onChange={this.onChangeExtendedInfo}
        placeHolder={PINTEREST_EXTENDED_INFO_PLACEHOLDER}
        text={PINTEREST_EXTENDED_INFO_TEXT}
        validationError={this.getFieldValidationErrors}
        fieldValidations={this.getFieldValidations()}
      />
    )
  }

  renderTags = () => {
    const {
      customContext,
      facadeApiUrl,
      flux,
      memberId,
      onManageTags,
      organizations,
      selectedOrganization,
      suggestedTags,
      tags,
    } = this.props
    const { hasTagAccessEntitlement } = this.state

    const canViewTags =
      typeof organizations !== 'undefined' &&
      this.hasSelectedOrgAndOrgId() &&
      hasTagAccessEntitlement &&
      (selectedOrganization.permissions.ORG_MANAGE_MESSAGE_TAGS || tags?.length > 0)

    if (!canViewTags || ComposerUtils.isPinterestComposer(customContext)) {
      return null
    }
    let organizationId: number
    let canManageTags: boolean
    if (selectedOrganization) {
      organizationId = selectedOrganization.organizationId
      canManageTags = get(selectedOrganization, 'permissions.ORG_MANAGE_MESSAGE_TAGS', false)
    }
    return (
      // All the other sections (location, audience, promotion) are wrapped in a div.
      // This div is important to overwrite main css (.hs-app-composer .rc-TagArea).
      // In message-edit-area there's style linked to the direct child of messageSettingsContainer,
      // without this extra div this style is overwritten by CSS.
      <div>
        <TagArea
          appliedTags={this.state.appliedTags}
          canManageTags={canManageTags}
          facadeApiUrl={facadeApiUrl}
          flux={flux}
          isComposeMode={true}
          memberId={memberId}
          onDone={this.onDoneApplyTags}
          onManageTags={onManageTags}
          organizationId={organizationId}
          ref={node => (this.tagAreaNode = node)}
          scrollToParent={this.scrollToTagArea}
          suggestedTags={suggestedTags}
          tagsToSelect={tags}
          shouldShowInstagramWarning={ComposerUtils.isPushPublishing(this.state.publishingMode)}
        />
      </div>
    )
  }

  renderProfileSelector = (hasInstagramPairingErrors: boolean): ReactNode => {
    const {
      addProfile,
      facadeApiUrl,
      customContext,
      excludedNetworkTypes,
      isEditMode,
      isSocialProfileSelectorDisabled,
      onCreateBoardComplete,
      onFetchSocialProfiles,
      selectedOrganization,
      showOnSubmitErrors,
      socialNetworks,
    } = this.props
    const isPinterest = ComposerUtils.isPinterestComposer(customContext)
    const shouldShowPaywall = hasMemberReachedSNMax()

    if (isPinterest) {
      return (
        <PinterestBoardPicker
          extendedInfoKey={'boards'}
          iconSourceKey={'fa-pinterest'}
          text={PINTEREST_PIN_TO}
          errors={this.getFieldValidationErrors}
          fieldValidations={this.getFieldValidations()}
          onChange={this.onChangeBoardsSelected}
          isDraft={ComposerUtils.isDraft(SelectedMessageState.messageType)}
          selectedBoards={this.getSelectedBoards()} // we can only edit a pinterest message with one board selected unless it's a draft
          extendedInfo={this.getExtendedInfo()}
          addProfile={addProfile}
          facadeApiUrl={facadeApiUrl}
          isEditMode={isEditMode}
          socialNetworks={socialNetworks}
          onCreateBoardComplete={onCreateBoardComplete}
          selectedOrganization={selectedOrganization}
          onFetchSocialProfiles={onFetchSocialProfiles}
          shouldShowPaywall={shouldShowPaywall}
        />
      )
    }
    const orgId = this.hasSelectedOrgAndOrgId() ? selectedOrganization.organizationId : null
    return (
      <ProfileSelector
        onProfileSelected={this.onProfileSelected}
        onProfilesRemoved={this.onProfilesRemoved}
        onFetchSocialProfiles={onFetchSocialProfiles}
        selectedSocialNetworkIds={this.state.selectedSocialNetworkIds}
        organizationId={orgId}
        excludedNetworkTypes={excludedNetworkTypes}
        isDisabledState={isSocialProfileSelectorDisabled}
        isErrorState={
          hasInstagramPairingErrors ||
          ValidationUtils.hasErrorsByField(
            this.getFieldValidations(),
            FIELD_VALIDATIONS.SOCIAL_NETWORK,
            showOnSubmitErrors,
          )
        }
        ref={node => (this.profileSelectorNode = node)}
        shouldShowPaywall={shouldShowPaywall}
        onReconnectCallback={this.onReconnectCallback}
      />
    )
  }

  renderPublisherNotes = () => {
    if (
      ComposerUtils.isPushPublishing(this.state.publishingMode) &&
      this.props.selectedNetworkGroup === SocialProfileConstants.SN_GROUP.INSTAGRAM
    ) {
      return (
        <PublisherNotes
          appliedPublisherNotes={this.state.appliedPublisherNotes}
          onDoneApplyPublisherNotes={this.onDoneApplyPublisherNotes}
        />
      )
    }
    return null
  }

  getSPIdsByNetwork = (socialProfiles, networkTypes) => {
    return socialProfiles.filter(sn => networkTypes.includes(sn?.type)).map(sn => sn.socialProfileId)
  }

  updateBulkComposerFieldValidations() {
    const { timezoneName } = this.props
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (selectedMessageForEdit) {
      const sendDate = selectedMessageForEdit.sendDate
        ? moment(selectedMessageForEdit.sendDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS).tz(
            timezoneName,
          )
        : null
      const dateError = ValidationUtils.getFutureDateError({
        dateTime: sendDate,
        minimumScheduleMinutes: selectedMessageForEdit.hasVideoAttachment()
          ? ComposerConstants.MINIMUM_SCHEDULE_MINUTES.VIDEO
          : ComposerConstants.MINIMUM_SCHEDULE_MINUTES.DEFAULT,
        timezoneName,
      })
      if (dateError) {
        const updatedFieldValidations = ValidationUtils.addCustomValidations(
          this.getFieldValidations(),
          [dateError],
          FIELD_VALIDATIONS.SEND_DATE,
          ComposerConstants.ERROR_LEVELS.ERRORS,
        )
        this.composerMessageActions.updateFieldById(
          selectedMessageForEdit.id,
          Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS,
          updatedFieldValidations,
        )
      }
    }
  }

  //LinkedIn Targeting
  renderAudienceTargeting() {
    if (this.props.isBulkComposer || this.state.linkedInCompanyProfiles.length === 0) {
      return null
    }
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const appliedTargetingObj =
      selectedMessageForEdit && selectedMessageForEdit.hasLinkedInV2Targeting()
        ? selectedMessageForEdit.baseMessage.targeting.linkedInV2Company
        : null

    if (this.props.selectedNetworkGroup === SocialProfileConstants.SN_GROUP.LINKEDIN) {
      return (
        <AudienceTargeting
          hsLanguage={this.props.language}
          linkedInCompanyProfiles={this.state.linkedInCompanyProfiles}
          onApplyTargeting={this.onSetLinkedInTargeting}
          appliedTargetingObj={appliedTargetingObj}
        />
      )
    }
    return null
  }

  renderFacebookTargeting() {
    if (this.props.isBulkComposer || this.state.facebookPageProfiles.length === 0) {
      return null
    }

    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const appliedTargetingObj =
      selectedMessageForEdit && selectedMessageForEdit.hasFacebookTargeting()
        ? selectedMessageForEdit.baseMessage.targeting.facebookPage
        : null

    const isSequentialPostingEnabled = this.props.isSequentialPostingEnabled

    if (this.props.selectedNetworkGroup === SocialProfileConstants.SN_GROUP.FACEBOOK) {
      return (
        <FacebookTargeting
          facebookPages={this.state.facebookPageProfiles}
          onApplyTargeting={this.onSetFacebookTargeting}
          appliedTargetingObj={appliedTargetingObj}
          isSequentialPostingEnabled={isSequentialPostingEnabled}
        />
      )
    }
    return null
  }

  renderHeader() {
    if (this.props.isEditOnly) {
      return null
    }

    return <EditHeader mode={this.props.mode} onModeChange={this.props.onModeChange} />
  }

  hasSelectedOrgAndOrgId() {
    return this.props.selectedOrganization && this.props.selectedOrganization.organizationId
  }

  onChangeBoostCampaign = campaignData => {
    // Update separately as it could be `undefined`
    // and otherwise `updateFieldsById` will complain
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    this.composerMessageActions.updateFieldById(
      selectedMessageForEdit.id,
      Constants.FIELD_TO_UPDATE.BOOST_CAMPAIGN,
      campaignData,
    )

    const fieldsToUpdate = {
      [Constants.FIELD_TO_UPDATE.IS_BOOSTED]: !_.isEmpty(campaignData),
    }
    this.composerMessageActions.updateFieldsById(selectedMessageForEdit.id, fieldsToUpdate)
  }

  renderMultiNetworkInfoBanner() {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const hasBaseMessage = selectedMessageForEdit?.baseMessage?.template

    if (
      hasBaseMessage &&
      MessageUtils.getTotalNetworkGroups(selectedMessageForEdit) > 1 &&
      !this.props.selectedNetworkGroup
    ) {
      return <MultiNetworkInfoBanner />
    }
    return null
  }

  // Info banner explaining Instagram stories recommended aspect ratio
  renderInstagramStoryAspectRatioInfoBanner() {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (ComposerUtils.isInstagramStory(selectedMessageForEdit?.postType)) {
      return <InstagramStoryAspectRatioInfoBanner />
    }
  }

  // Info banner suggesting the use of SocialGPT to create message text content
  renderSocialGPTInfoBanner() {
    if (
      isFeatureEnabledOrBeta('PUB_28802_SOCIALGPT_BANNER') &&
      this.state.shouldShowOwlyWriterBanner &&
      !this.props.isBulkComposer
    ) {
      return <SocialGptInfoBanner closeComposerConfirm={this.props.closeComposerConfirm} />
    }
  }

  getMultiNetworkMentionSnTypes(): Array<string> {
    const { isBulkComposer } = this.props
    const { selectedNetworkTypes } = this.state
    const isInstagramNetworkSelected = ComposerUtils.hasInstagramNetwork(...selectedNetworkTypes)
    const isTwitterNetworkSelected = ComposerUtils.hasTwitterNetwork(...selectedNetworkTypes)
    const isThreadsNetworkSelected =
      isThreadsEnabled() && ComposerUtils.hasThreadsNetwork(...selectedNetworkTypes)

    const instagramMessageContainsUnlinkedMention = doMessagesContainUnlinkedMention(
      this.getSelectedMessageForEdit()?.messages.filter(({ snType }) =>
        SocialProfileConstants.SN_GROUP_TO_SN_TYPES[SocialProfileConstants.SN_GROUP.INSTAGRAM].includes(
          snType,
        ),
      ) || [],
    )
    const twitterMessageContainsUnlinkedMention = doMessagesContainUnlinkedMention(
      this.getSelectedMessageForEdit()?.messages.filter(({ snType }) =>
        SocialProfileConstants.SN_GROUP_TO_SN_TYPES[SocialProfileConstants.SN_GROUP.TWITTER].includes(snType),
      ) || [],
    )
    const threadsMessageContainsUnlinkedMention = doMessagesContainUnlinkedMention(
      this.getSelectedMessageForEdit()?.messages.filter(({ snType }) =>
        SocialProfileConstants.SN_GROUP_TO_SN_TYPES[SocialProfileConstants.SN_GROUP.THREADS].includes(snType),
      ) || [],
    )

    const selectedSNs: string[] = []

    if (isInstagramNetworkSelected && instagramMessageContainsUnlinkedMention) {
      selectedSNs.push(SocialProfileConstants.SN_TYPE_TO_DISPLAY_NAME[SN_TYPES.INSTAGRAM])
    }
    if (isThreadsNetworkSelected && threadsMessageContainsUnlinkedMention) {
      selectedSNs.push(SocialProfileConstants.SN_TYPE_TO_DISPLAY_NAME[SN_TYPES.THREADS])
    }
    if (isBulkComposer) {
      if (isTwitterNetworkSelected && twitterMessageContainsUnlinkedMention) {
        selectedSNs.push(SocialProfileConstants.SN_TYPE_TO_DISPLAY_NAME[SN_TYPES.TWITTER])
      }
    }
    return selectedSNs
  }

  renderTikTokInfoBanners() {
    if (this.props.selectedNetworkGroup === SocialProfileConstants.SN_GROUP.TIKTOK) {
      const isBulkComposer = this.props.isBulkComposer
      if (isBulkComposer) {
        return (
          <>
            <TikTokInfoBanner />
            <TikTokInfoBanner isBulkComposer={isBulkComposer} />
          </>
        )
      }
      return <TikTokInfoBanner />
    }
  }

  renderInstagramReelInfoBanner() {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (
      shouldShowPostTypeToggle(this.props.selectedNetworkGroup, this.props.isBulkComposer) &&
      ComposerUtils.hasInstagramBusinessNetwork(this.state.selectedNetworkTypes) &&
      ComposerUtils.isInstagramReel(selectedMessageForEdit.postType)
    ) {
      return <InstagramReelInfoBanner />
    }
  }

  renderInstagramStoriesInComposerInfoBanner(entitlements) {
    // Do not show the banner for Free users
    const hasStoriesEntitlement = EntitlementsUtils.isFeatureEnabled(entitlements, INSTAGRAM_STORIES)
    if (
      !this.props.isBulkComposer &&
      hasStoriesEntitlement &&
      this.state.shouldShowInstagramStoriesInComposerInfoBanner
    ) {
      return <InstagramStoriesInComposerInfoBanner />
    }
    return null
  }

  getMessageEditTextPlaceHolder() {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const isInstagramStory =
      selectedMessageForEdit?.postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY
    if (
      this.props.selectedNetworkGroup === SocialProfileConstants.SN_GROUP.INSTAGRAM &&
      isInstagramStory &&
      ComposerUtils.isPushPublishing(this.state.publishingMode)
    ) {
      return IG_STORY_CLIPBOARD_TEXT_PLACEHOLDER
    }
    if (ComposerUtils.isPinterestComposer(this.props.customContext)) {
      return PINTEREST_PLACEHOLDER
    }
    return ENTER_TEXT_AND_LINKS
  }

  renderUnpairedInstagramProfiles() {
    // Using socialNetworks as socialProfilesKeyedByType is not currently updated to contain private IG networks
    return this.state.unpairedInstagramIds.map(instagramId => {
      const instagramProfile = this.props.socialNetworks.find(sn => sn.socialNetworkId === instagramId)
      if (instagramProfile) {
        const { socialNetworkId, username } = instagramProfile
        return (
          <UnpairedInstagramIdsError
            key={`ig-pairing-error-${socialNetworkId}`}
            username={username}
            onLinkClick={() => importInstagramMobileSetup(socialNetworkId)}
          />
        )
      } else {
        return null
      }
    })
  }

  renderPromotionTab = () => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (!selectedMessageForEdit) {
      return null
    }

    const { boostCampaign, savedBoostCampaign, isBoosted, campaignObjectiveChanged } = this.state

    if (!boostCampaign && savedBoostCampaign) {
      this.onChangeBoostCampaign(savedBoostCampaign)
    }
    if (!boostCampaign) {
      this.setState({ campaignObjectiveChanged: null })
    }

    const { showOnSubmitErrors, isBulkComposer } = this.props

    const fieldValidations = this.getFieldValidations()

    const availableNetworks = [SN_TYPES.FACEBOOKPAGE, SN_TYPES.LINKEDINCOMPANY, SN_TYPES.INSTAGRAMBUSINESS]

    const selectedSocialNetworks: SocialNetwork[] = get(this.state, 'socialNetworksKeyedById', []).toArray()

    const isInstagramStory =
      selectedMessageForEdit?.postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY

    const socialNetworkWithPermission = selectedSocialNetworks
      .filter(sn => Boolean(sn?.permissions?.[Constants.BOOST_PERMISSIONS.CAN_MANAGE_ADS]))
      .filter(sn => availableNetworks.includes(sn.type))
    const showPromotionTab = socialNetworkWithPermission.length > 0 && !isInstagramStory
    const hasIGBusinessCarousel =
      selectedMessageForEdit.attachments.length > 1 &&
      socialNetworkWithPermission.some(sn => sn.type === SN_TYPES.INSTAGRAMBUSINESS) &&
      (socialNetworkWithPermission.length === 1 ||
        (boostCampaign && boostCampaign.social_network === SN_TYPES.INSTAGRAM))

    const isLinkedIn = sn =>
      sn === SN_TYPES.LINKEDIN || sn === SN_TYPES.LINKEDINCOMPANY || sn === SN_TYPES.LINKEDINGROUP

    const hasLinkedInCarousel =
      selectedMessageForEdit.attachments.length > 1 &&
      socialNetworkWithPermission.some(sn => isLinkedIn(sn.type)) &&
      (socialNetworkWithPermission.length === 1 ||
        (boostCampaign && isLinkedIn(boostCampaign.social_network)))

    const boostableSocialNetworks =
      selectedMessageForEdit.attachments.length > 1
        ? socialNetworkWithPermission.filter(sn => sn.type !== SN_TYPES.INSTAGRAMBUSINESS)
        : socialNetworkWithPermission

    const isLinkedinSelected =
      selectedSocialNetworks.filter(({ type }) => type === SN_TYPES.LINKEDINCOMPANY).length > 0

    const linkedInWarningLabel: { [key in CampaignObjectiveChanged]: string } = {
      changed_to_video: BOOST_LINKEDIN_OBJECTIVE_WARNING_CHANGED_TO_VIDEO,
      changed_to_engagement: BOOST_LINKEDIN_OBJECTIVE_WARNING_CHANGED_TO_ENGAGEMENT,
    }

    // Checking if boostCampaign exists is insufficient because it can be populated with other SN boosted values.
    // It's safer to go deeply and check if boostCampaign.linkedin_spec exists
    if (isLinkedinSelected && boostCampaign && boostCampaign.linkedin_spec) {
      if (
        selectedMessageForEdit.hasVideoAttachment() &&
        boostCampaign.linkedin_spec.objective_type !== 'VIDEO_VIEW'
      ) {
        boostCampaign.linkedin_spec.objective_type = 'VIDEO_VIEW'
        boostCampaign.linkedin_spec.optimization_target_type = 'MAX_VIDEO_VIEW'
        this.onChangeBoostCampaign(boostCampaign)
        this.setState({ campaignObjectiveChanged: 'changed_to_video' })
      }

      if (
        !selectedMessageForEdit.hasVideoAttachment() &&
        boostCampaign.linkedin_spec.objective_type === 'VIDEO_VIEW'
      ) {
        boostCampaign.linkedin_spec.objective_type = 'ENGAGEMENT'
        boostCampaign.linkedin_spec.optimization_target_type = 'MAX_CLICK'
        this.onChangeBoostCampaign(boostCampaign)
        this.setState({ campaignObjectiveChanged: 'changed_to_engagement' })
      }
    }

    if (showPromotionTab) {
      return (
        <div>
          <BoostPost
            disabled={Boolean(hasIGBusinessCarousel || hasLinkedInCarousel)}
            campaignSettings={boostCampaign || savedBoostCampaign}
            isBoosted={isBoosted && !hasIGBusinessCarousel && !hasLinkedInCarousel}
            isVideoPost={selectedMessageForEdit.hasVideoAttachment()}
            hasErrors={ValidationUtils.hasErrorsByField(
              fieldValidations,
              FIELD_VALIDATIONS.BOOST_CAMPAIGN,
              showOnSubmitErrors,
            )}
            fieldErrors={
              <ValidationBanner
                field={FIELD_VALIDATIONS.BOOST_CAMPAIGN}
                type={FIELD_TYPES.BOOST_CAMPAIGN}
                showOnSubmitErrors={showOnSubmitErrors}
                isBulkComposer={isBulkComposer}
                fieldValidations={fieldValidations}
              />
            }
            memberId={String(this.props.memberId)}
            sendDateAsSeconds={this.state.sendDate}
            socialNetworks={boostableSocialNetworks}
            onChangeBoostCampaign={this.onChangeBoostCampaign}
            language={this.props.language}
            onEdit={() => this.setState({ campaignObjectiveChanged: undefined })}
          />
          {campaignObjectiveChanged && (
            <InputBanner type="warning">{linkedInWarningLabel[campaignObjectiveChanged]}</InputBanner>
          )}
          {hasIGBusinessCarousel && (
            <InputBanner type="warning">
              {isBoosted && (boostCampaign || savedBoostCampaign).social_network === SN_TYPES.INSTAGRAM
                ? BOOST_IG_CAROUSEL_BOOSTED_WARNING
                : BOOST_IG_CAROUSEL_WARNING}
            </InputBanner>
          )}
          {hasLinkedInCarousel && (
            <InputBanner type="warning">
              {isBoosted && (boostCampaign || savedBoostCampaign).social_network === SN_TYPES.LINKEDIN
                ? BOOST_LI_CAROUSEL_BOOSTED_WARNING
                : BOOST_LI_CAROUSEL_WARNING}
            </InputBanner>
          )}
        </div>
      )
    }
  }

  onMentionSearchProgressChange = (isMentionSearchInProgress = false) => {
    this.setState({ isMentionSearchInProgress })
  }

  getSnGroupsWithUnlinkedMention = () => {
    const selectedMessages = this.getSelectedMessageForEdit()?.messages || []
    return ValidationUtils.getSnGroupsWithUnlinkedMention(
      MessageUtils.getInnerMessagesByGroup(selectedMessages, [SocialProfileConstants.SN_GROUP.INSTAGRAM]),
      this.state.isMentionSearchInProgress,
      this.state.selectedNetworkTypes,
      this.props.selectedNetworkGroup,
    )
  }

  hasSingleNetworkAndMultipleUnlinkedMentions = (snGroupsWithUnlinkedMention: Array<string>) => {
    if (snGroupsWithUnlinkedMention.length === 1) {
      const selectedMessages = this.getSelectedMessageForEdit()?.messages
      if (this.props.selectedNetworkGroup && !_.isEmpty(selectedMessages)) {
        return ValidationUtils.hasMultipleUnlinkedMentions(
          MessageUtils.getInnerMessagesByGroup(selectedMessages)[this.props.selectedNetworkGroup],
          this.props.selectedNetworkGroup,
        )
      }
    }
    return false
  }

  handleHashtagButtonClick = () => {
    if (!this.props.isHashtagPanelOpen) {
      this.setState({ isPreviewChanged: false })
    }
    this.props.onClickHashtagButton()
  }

  handleAIButtonClick = () => {
    if (!this.props.isAIPanelOpen) {
      this.setState({ isPreviewChanged: false })
    }
    this.props.onClickAIButton()
  }

  onApproverSelected = memberId => {
    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    if (selectedMessageForEdit) {
      this.composerMessageActions.updateFieldById(
        selectedMessageForEdit.id,
        Constants.FIELD_TO_UPDATE.ONE_TIME_REVIEWER_ID,
        memberId,
      )
    }
  }

  renderApproverTab = () => {
    const { selectedSocialNetworkIds, hasApprovalAccessEntitlement } = this.state
    const { isEditMode, memberId, isBulkComposer } = this.props

    const canRenderApproverTab =
      !isBulkComposer && selectedSocialNetworkIds.length > 0 && hasApprovalAccessEntitlement

    const isDraft = ComposerUtils.isDraft(SelectedMessageState.messageType())
    const createdByMember = SelectedMessageState.createdByMember()
    const isCreator = createdByMember && createdByMember.id === memberId

    // Disable the field for scheduled posts - an editor who is not the creator cannot edit the selected approver.
    // One-time approver field is enabled for drafts editing but we do NOT save the selected approver for drafts.
    const isApproverLocked = isEditMode && !isCreator && !isDraft

    return canRenderApproverTab ? (
      <ApproverArea
        memberId={memberId}
        socialProfileIds={selectedSocialNetworkIds}
        onApproverSelected={this.onApproverSelected}
        isDisabledState={isApproverLocked}
      />
    ) : null
  }

  renderEdit() {
    const { previewMessages } = this.state
    const { customContext, isBulkComposer, showOnSubmitErrors, selectedNetworkGroup } = this.props

    const selectedMessageForEdit = this.getSelectedMessageForEdit()
    const isInstagramStory =
      selectedMessageForEdit?.postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY
    const isPinterest = ComposerUtils.isPinterestComposer(customContext)

    const hasInstagramPairingErrors = this.state.unpairedInstagramIds.length > 0

    const numInstagramBusinessAccountsSelected =
      ComposerUtils.getNumIGBusinessAccountsSelected(previewMessages)

    const showUserEdProductTaggingBanner =
      !isPinterest &&
      !isInstagramStory &&
      !isBulkComposer &&
      numInstagramBusinessAccountsSelected > 1 &&
      this.props.isEligibleProductAccountSelected

    const fieldValidations = this.getFieldValidations()
    const hasFieldValidations = !_.isEmpty(fieldValidations)
    const errors = (
      <ValidationBanner
        fieldValidations={fieldValidations}
        field={FIELD_VALIDATIONS.SOCIAL_NETWORK}
        type={FIELD_TYPES.SOCIAL_NETWORK}
        showOnSubmitErrors={showOnSubmitErrors}
        isBulkComposer={isBulkComposer}
      />
    )

    const multiNetworkMentionSnTypes = this.getMultiNetworkMentionSnTypes()
    const snGroupsWithUnlinkedMention = this.getSnGroupsWithUnlinkedMention()

    const showTikTokEngagementFields =
      isTikTokEnabled() && !isBulkComposer
        ? selectedNetworkGroup === SocialProfileConstants.SN_GROUP.TIKTOK
        : false

    return (
      <EditContainer className="-editContainer">
        {this.renderHeader()}
        <EditContent className="-editContent" ref={node => (this.scrollContainer = node)}>
          {this.renderProfileSelector(hasInstagramPairingErrors)}
          {hasFieldValidations && <ProfileSelectorErrorContainer>{errors}</ProfileSelectorErrorContainer>}
          {hasInstagramPairingErrors && (
            <ProfileSelectorErrorContainer>
              {this.renderUnpairedInstagramProfiles()}
            </ProfileSelectorErrorContainer>
          )}
          {!isPinterest && (
            <BannerArea>
              {this.renderInstagramStoriesInComposerInfoBanner(this.props.entitlements)}
              {showUserEdProductTaggingBanner && <ProductTaggingWarningBanner />}
              {this.renderSocialGPTInfoBanner()}
              {!isBulkComposer && this.renderMultiNetworkInfoBanner()}
            </BannerArea>
          )}
          {isPinterest && this.renderExtendedInfoTextEntry()}
          {isFeatureEnabled('PUB_31215_CONVERT_COMPOSER_TO_FUNCTIONAL') ? (
            selectedMessageForEdit && (
              <MessageEditContent
                ref={node => (this.messageEditTextNode = node)}
                campaignId={this.state.campaignId}
                memberId={this.props.memberId}
                entitlements={this.props.entitlements}
                fetchPreviewData={this.props.fetchPreviewData}
                flux={this.props.flux}
                isBulkComposer={this.props.isBulkComposer}
                labelText={MESSAGE_EDIT_TEXT_HEADER}
                linkShortenersDeprecated={this.props.linkShorteners} // Remove with PUB_30814_LINK_PRESETS_USE_REDUX
                hasSingleNetworkAndMultipleUnlinkedMentions={this.hasSingleNetworkAndMultipleUnlinkedMentions(
                  snGroupsWithUnlinkedMention,
                )}
                multiNetworkMentionSnTypes={multiNetworkMentionSnTypes}
                onApplyLinkSettings={this.onApplyLinkSettings}
                onChangePreset={this.props.onChangePreset}
                onChangeText={(
                  newText: string,
                  newMentions: Mentions,
                  newTemplate?: string,
                  selectedNetworkGroup?: string,
                ) => {
                  if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
                    // Reset lastScrapedUrl if it no longer exists in the text
                    if (isEmpty(selectedMessageForEdit?.linkSettings)) {
                      this.setState({ lastScrapedUrl: null })
                    }
                  } else {
                    // Reset lastScrapedUrl if it no longer exists in the text
                    if (newText.indexOf(selectedMessageForEdit?.urlPreview?.url) < 0) {
                      this.setState({ lastScrapedUrl: null })
                    }
                  }
                  this.props.onChangeText(newText, newMentions, newTemplate, selectedNetworkGroup)
                }}
                onScrapeLink={this.onScrapeLink}
                organizations={this.props.organizations}
                placeholder={this.getMessageEditTextPlaceHolder()}
                socialNetworksKeyedById={this.state.socialNetworksKeyedById}
                selectedOrganization={this.props.selectedOrganization}
                shortenerConfigsDeprecated={this.props.shortenerConfigs} // Remove with PUB_30814_LINK_PRESETS_USE_REDUX, also remove "shortenerConfigs" prop from MessageEditArea
                snGroupsWithUnlinkedMention={snGroupsWithUnlinkedMention}
                socialNetworkTypesForCounting={this.state.socialNetworkTypesForCounting}
                trackingContext={this.props.trackingContext}
                onMentionSearchProgressChange={this.onMentionSearchProgressChange}
                isInstagramStory={isInstagramStory}
                onClickHashtagButton={this.handleHashtagButtonClick}
                onClickAIButton={this.handleAIButtonClick}
                isPreviewChanged={
                  this.state.isPreviewChanged && !this.props.isHashtagPanelOpen && !this.props.isAIPanelOpen
                }
                isHashtagAccessAllowed={this.state.isHashtagAccessAllowed}
                isHashtagDisabled={this.state.isHashtagDisabled}
                isPinterest={isPinterest}
              >
                {this.renderMedia()}
              </MessageEditContent>
            )
          ) : (
            <MessageEditContent
              ref={node => (this.messageEditTextNode = node)}
              campaignId={this.state.campaignId}
              memberId={this.props.memberId}
              entitlements={this.props.entitlements}
              fetchPreviewData={this.props.fetchPreviewData}
              flux={this.props.flux}
              isBulkComposer={this.props.isBulkComposer}
              labelText={MESSAGE_EDIT_TEXT_HEADER}
              linkShorteners={this.props.linkShorteners}
              hasSingleNetworkAndMultipleUnlinkedMentions={this.hasSingleNetworkAndMultipleUnlinkedMentions(
                snGroupsWithUnlinkedMention,
              )}
              multiNetworkMentionSnTypes={multiNetworkMentionSnTypes}
              onApplyLinkSettings={this.onApplyLinkSettings}
              onChangePreset={this.props.onChangePreset}
              onChangeText={this.props.onChangeText}
              onScrapeLink={this.onScrapeLink}
              organizations={this.props.organizations}
              placeholder={this.getMessageEditTextPlaceHolder()}
              socialNetworksKeyedById={this.state.socialNetworksKeyedById}
              selectedOrganization={this.props.selectedOrganization}
              shortenerConfigs={this.props.shortenerConfigs}
              snGroupsWithUnlinkedMention={snGroupsWithUnlinkedMention}
              socialNetworkTypesForCounting={this.state.socialNetworkTypesForCounting}
              trackingContext={this.props.trackingContext}
              onMentionSearchProgressChange={this.onMentionSearchProgressChange}
              isInstagramStory={isInstagramStory}
              onClickHashtagButton={this.handleHashtagButtonClick}
              onClickAIButton={this.handleAIButtonClick}
              isPreviewChanged={
                this.state.isPreviewChanged && !this.props.isHashtagPanelOpen && !this.props.isAIPanelOpen
              }
              isHashtagAccessAllowed={this.state.isHashtagAccessAllowed}
              isHashtagDisabled={this.state.isHashtagDisabled}
              isPinterest={isPinterest}
            >
              {this.renderMedia()}
            </MessageEditContent>
          )}
          {this.renderMediaBanners()}
          {showTikTokEngagementFields && <TiktokEngagementArea />}
          <MessageSettingsContainer className="-messageSettingsContainer">
            {this.renderApproverTab()}
            {this.renderPromotionTab()}
            {this.renderTags()}
            {this.renderPublisherNotes()}
            <Locations
              selectedNetworkGroup={selectedNetworkGroup}
              twSpIds={this.state.twSpIds}
              isBulkComposer={isBulkComposer}
              showOnSubmitErrors={showOnSubmitErrors}
              onDoneApplyLocations={this.onDoneApplyLocations}
              onLocationReset={this.onLocationReset}
              fieldValidations={this.getFieldValidations()}
            />
            {this.renderAudienceTargeting()}
            {this.renderFacebookTargeting()}
          </MessageSettingsContainer>
        </EditContent>
      </EditContainer>
    )
  }

  renderPreview() {
    return (
      <EditContainer className="-editContainer">
        {this.renderHeader()}
        <MessagePreviewArea
          ignoredPreviewValidationMessageCodes={this.props.ignoredPreviewValidationMessageCodes}
          isBulkComposer={this.props.isBulkComposer}
          onAddIgnoredPreviewValidationMessageCode={this.props.onAddIgnoredPreviewValidationMessageCode}
          previewMessages={this.state.previewMessages}
        />
      </EditContainer>
    )
  }

  render() {
    const { mode } = this.props
    let content
    switch (mode) {
      case Constants.BULK_COMPOSER_EDIT_MODES.EDIT:
        content = this.renderEdit()
        break
      case Constants.BULK_COMPOSER_EDIT_MODES.PREVIEW:
        content = this.renderPreview()
        break
      case Constants.BULK_COMPOSER_EDIT_MODES.ERRORS:
        content = this.renderErrorState()
        break
      case Constants.BULK_COMPOSER_EDIT_MODES.QUICK_SCHEDULE:
        content = this.renderQuickSchedule()
        break
      case Constants.BULK_COMPOSER_EDIT_MODES.MULTIPLE:
        content = this.renderMultiple()
        break
      default:
        content = <div />
    }

    return (
      <MessageEditAreaWrapper data-testid="MessageEditArea" className="rc-MessageEditArea">
        {content}
      </MessageEditAreaWrapper>
    )
  }
}

const ConnectedMessageEditArea = ReactTimeout(
  reduxConnect(({ composer, validation }: RootState) => ({
    isEligibleProductAccountSelected: composer.isEligibleProductAccountSelected,
    isSchedulerOpen: composer.isSchedulerOpen,
    isSendingMessage: composer.isSendingMessage,
    isSequentialPostingEnabled: composer.isSequentialPostingEnabled,
    selectedNetworkGroup: composer.selectedNetworkGroup,
    showOnSubmitErrors: validation.showOnSubmitErrors,
  }))(MessageEditArea),
)

export default ConnectedMessageEditArea
