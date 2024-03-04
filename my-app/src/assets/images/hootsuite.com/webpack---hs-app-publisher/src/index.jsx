/** @format */

import { appName, getAppUrl } from './utils/app-utils'

/**
 * this file is used as an entry point to create your bundle
 * as well as register your app in dashboard
 * only expose methods in this file
 *
 *
 * DO NOT EXPORT CLASSES for react components
 * as this code will be compiled and those jsx components won't be available as jsx in dashboard
 *
 * @format
 */

// webpack closure variable
// Used so webpack knows where to get the modules from
// eg. You're on production
__webpack_public_path__ = getAppUrl() // eslint-disable-line

import { register } from 'fe-lib-async-app'
import renderAppCampaigns from './components/renderComponents/renderAppCampaigns'
import renderCounterBanner from './components/renderComponents/renderCounterBanner'
import renderCustomApproval from './components/renderComponents/renderCustomApproval'
import renderInlineRedirectNotification from './components/renderComponents/renderInlineRedirectNotification'
import renderLinkSettingsDialog from './components/renderComponents/renderLinkSettingsDialog'
import renderLinkSettingsManagementArea from './components/renderComponents/renderLinkSettingsManagementArea'
import renderMessageActions from './components/renderComponents/renderMessageActions'
import renderMessageApprovalHistoryModal from './components/renderComponents/renderMessageApprovalHistoryModal'
import renderMessageBulkDeleteModal from './components/renderComponents/renderMessageBulkDeleteModal'
import renderMessageDeleteModal from './components/renderComponents/renderMessageDeleteModal'
import renderMessagePreviewBanner from './components/renderComponents/renderMessagePreviewBanner'
import renderMessageRejectModal from './components/renderComponents/renderMessageRejectModal'
import renderOptInModal from './components/renderComponents/renderOptInModal'
import renderOptOutSurveyModal from './components/renderComponents/renderOptOutSurveyModal'
import renderTwitterNewStyleReplies from './components/renderComponents/renderTwitterNewStyleReplies'
import renderUnscheduledApprovalsListBanner from './components/renderComponents/renderUnscheduledApprovalsListBanner'
import renderYoutubeCTA from './components/renderComponents/renderYoutubeCTA'
import renderYouTubeDeleteModal from './components/renderComponents/renderYouTubeDeleteModal'
import renderYouTubePreviewModal from './components/renderComponents/renderYouTubePreviewModal'
import renderYoutubePrivacyIndicator from './components/renderComponents/renderYoutubePrivacyIndicator'
import renderYoutubeUploadModal from './components/renderComponents/renderYoutubeUploadModal'
import TetheredMessagePreviewModal from './components/message-preview-modal/tethered-message-preview-modal'

// services
import PublisherSettingsService from './services/publisher-settings-service'
import PresetsService from './services/presets-service'
import EntitlementsService from './services/entitlements-service'
import TagService from './services/tag-service'
import CampaignsService from './services/campaigns-service'
import LinkShortenersService from './services/link-shorteners-service'
import FeedbackService from './services/feedback-service'
import PopupService from './services/popup-service'
import YouTubeService from './services/youtube-service'

// utils
import CampaignUtils from './utils/campaigns-utils'
import LinkSettingsUtils from './utils/link-settings-utils'
import PresetsActions from './actions/presets'
import PresetsStore from './stores/presets'
import EntitlementsActions from './actions/entitlements'
import EntitlementsStore from './stores/entitlements'
import ApproverStore from './stores/approver'
import ApproverActions from './actions/approver'
import ApproverSearchResultStore from './stores/approver-search-result'
import CampaignsActions from './actions/campaigns'
import CampaignsStore from './stores/campaigns'
import LinkShortenersActions from './actions/link-shorteners'
import LinkShortenersStore from './stores/link-shorteners'
import YouTubeStore from './stores/youtube'
import YouTubeActions from './actions/youtube'

// models
import YouTubeMetadata from './models/youtube-metadata'

const myApp = {
  renderAppCampaigns,
  renderCounterBanner,
  renderCustomApproval,
  renderInlineRedirectNotification,
  renderLinkSettingsDialog,
  renderLinkSettingsManagementArea,
  renderMessageActions,
  renderMessageApprovalHistoryModal,
  renderMessageBulkDeleteModal,
  renderMessageDeleteModal,
  renderMessagePreviewBanner,
  renderMessageRejectModal,
  renderOptInModal,
  renderOptOutSurveyModal,
  renderTwitterNewStyleReplies,
  renderUnscheduledApprovalsListBanner,
  renderYoutubeCTA,
  renderYouTubeDeleteModal,
  renderYouTubePreviewModal,
  renderYoutubePrivacyIndicator,
  renderYoutubeUploadModal,
  TetheredMessagePreviewModal,
  PublisherSettingsService,
  PresetsService,
  EntitlementsService,
  TagService,
  CampaignsService,
  LinkShortenersService,
  FeedbackService,
  PopupService,
  YouTubeService,
  CampaignUtils,
  LinkSettingsUtils,
  PresetsActions,
  PresetsStore,
  EntitlementsActions,
  EntitlementsStore,
  ApproverStore,
  ApproverActions,
  ApproverSearchResultStore,
  CampaignsActions,
  CampaignsStore,
  LinkShortenersActions,
  LinkShortenersStore,
  YouTubeStore,
  YouTubeActions,
  YouTubeMetadata,
}

register(appName, myApp)
