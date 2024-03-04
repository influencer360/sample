import { CampaignsConstants } from 'fe-pnc-constants'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'

import ComposerConstants from './composer'
import Constants from './constants'

const _ytCommentingSettingToLabel = {}
_ytCommentingSettingToLabel[Constants.YOUTUBE_COMMENTING_SETTINGS.ALL] = translation._('Show all comments')
// prettier-ignore
_ytCommentingSettingToLabel[Constants.YOUTUBE_COMMENTING_SETTINGS.APPROVED_ONLY] = translation._('Only show approved comments')
// prettier-ignore
_ytCommentingSettingToLabel[Constants.YOUTUBE_COMMENTING_SETTINGS.DISABLED] = translation._('Disable comments')
const YT_COMMENT_SETTING_TO_LABEL = _ytCommentingSettingToLabel

const _ytPrivacySettingToLabel = {}
_ytPrivacySettingToLabel[Constants.YOUTUBE_PRIVACY_SETTINGS.PUBLIC] = {
  label: translation._('Public'),
  description: translation._('Anyone on YouTube can find and access'),
  icon: 'hs-targeting',
}
_ytPrivacySettingToLabel[Constants.YOUTUBE_PRIVACY_SETTINGS.UNLISTED] = {
  label: translation._('Unlisted'),
  description: translation._('Anyone who has the link can access'),
  icon: 'fa-unlock',
}
_ytPrivacySettingToLabel[Constants.YOUTUBE_PRIVACY_SETTINGS.PRIVATE] = {
  label: translation._('Private'),
  description: translation._('Only you can access'),
  icon: 'fa-lock',
}
const YT_PRIVACY_SETTING_TO_LABEL = _ytPrivacySettingToLabel

const _ytDeletionTypeToRadioDescription = {}
_ytDeletionTypeToRadioDescription[Constants.MESSAGE_DELETION_TYPE.SINGLE] = {
  // prettier-ignore
  eventOnly: translation._('The scheduled event will be removed but the video will remain on YouTube in a private state.'),
  // prettier-ignore
  eventAndVideo: translation._('The scheduled event will be removed and your video will be permanently deleted from YouTube. This can not be undone.'),
}
_ytDeletionTypeToRadioDescription[Constants.MESSAGE_DELETION_TYPE.MULTIPLE] = {
  // prettier-ignore
  eventOnly: translation._('The scheduled events will be removed but the video will remain on YouTube in their current privacy state.'),
  // prettier-ignore
  eventAndVideo: translation._('The scheduled events will be removed and your videos will be permanently deleted from YouTube. This can not be undone.'),
}
_ytDeletionTypeToRadioDescription[Constants.MESSAGE_DELETION_TYPE.MIXED] = {
  // prettier-ignore
  eventOnly: translation._('The scheduled events will be removed but the videos will remain on YouTube in their current privacy state.'),
  // prettier-ignore
  eventAndVideo: translation._('The scheduled event will be removed and your video will be permanently deleted from YouTube. This can not be undone.'),
}
const YT_DELETION_TYPE_TO_RADIO_DESCRIPTION = _ytDeletionTypeToRadioDescription

const _ytDeletionTypeToButtonText = {}
_ytDeletionTypeToButtonText[Constants.MESSAGE_DELETION_TYPE.SINGLE] = {
  eventOnly: translation._('Remove event'),
  eventAndVideo: translation._('Remove and delete video'),
}
_ytDeletionTypeToButtonText[Constants.MESSAGE_DELETION_TYPE.MULTIPLE] = {
  eventOnly: translation._('Remove events'),
  eventAndVideo: translation._('Remove and delete videos'),
}
_ytDeletionTypeToButtonText[Constants.MESSAGE_DELETION_TYPE.MIXED] = {
  eventOnly: translation._('Confirm'),
  eventAndVideo: translation._('Confirm'),
}
const YT_DELETION_TYPE_TO_BUTTON_TEXT = _ytDeletionTypeToButtonText

const _ytDeletionTypeToModalTitleText = {}
// prettier-ignore
_ytDeletionTypeToModalTitleText[Constants.MESSAGE_DELETION_TYPE.SINGLE] = translation._('Remove scheduled event')
// prettier-ignore
_ytDeletionTypeToModalTitleText[Constants.MESSAGE_DELETION_TYPE.MULTIPLE] = translation._('Remove scheduled events')
// prettier-ignore
_ytDeletionTypeToModalTitleText[Constants.MESSAGE_DELETION_TYPE.MIXED] = translation._('Delete selected items')
const YT_DELETION_TYPE_TO_MODAL_TITLE_TEXT = _ytDeletionTypeToModalTitleText

const _ytMaxDurationToHoursMinutes = {}
_ytMaxDurationToHoursMinutes[Constants.YOUTUBE_VIDEO_REQUIREMENTS.MAX_VIDEO_DURATION_VERIFIED] = '11 hours'
_ytMaxDurationToHoursMinutes[Constants.YOUTUBE_VIDEO_REQUIREMENTS.MAX_VIDEO_DURATION_UNVERIFIED] =
  '15 minutes'
const YT_MAX_DURATION_TO_HOURS_MINUTES = _ytMaxDurationToHoursMinutes

const _ytMetaDataErrorCodesToErrorMessages = {}
// prettier-ignore
_ytMetaDataErrorCodesToErrorMessages[Constants.YOUTUBE_ERROR_CODES.INVALID_DESCRIPTION] = translation._('Invalid description')
// prettier-ignore
_ytMetaDataErrorCodesToErrorMessages[Constants.YOUTUBE_ERROR_CODES.INVALID_TAGS] = translation._('Invalid tags')
// prettier-ignore
_ytMetaDataErrorCodesToErrorMessages[Constants.YOUTUBE_ERROR_CODES.INVALID_TITLE] = translation._('Invalid title')
const YT_METADATA_ERROR_CODES_TO_ERROR_MESSAGES = _ytMetaDataErrorCodesToErrorMessages

const _approvalsMessageTypeToLabel = {}
_approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.DRAFT] = translation._('%s1Draft%s2')
// prettier-ignore
_approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.REQUIRE_APPROVAL] = translation._('%s1Pending approval%s2 from %s1%s3%s2')
// prettier-ignore
_approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.PENDING_APPROVAL] = translation._('%s1Pending approval%s2 from %s1%s3%s2')
if (isFeatureEnabledOrBeta('PUB_NATIVE_FB_SCHEDULING')) {
  // prettier-ignore
  _approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.SCHEDULED] = translation._('%s1Scheduled%s2 by %s1%s3%s2')
} else {
  _approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.SCHEDULED] = translation._('%s1Scheduled%s2')
}
_approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.PUBLISHED] = translation._('%s1Published%s2')
_approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.EXPIRED] = translation._('%s1Expired%s2')
_approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.REJECTED] = translation._('%s1Rejected%s2 by %s1%s3%s2')
_approvalsMessageTypeToLabel[Constants.APPROVALS.FAILED] = translation._('%s1Failed to send%s2')
_approvalsMessageTypeToLabel[Constants.APPROVALS.MESSAGE_FAILED] = translation._('%Post failed%s2')
_approvalsMessageTypeToLabel[Constants.APPROVALS.COMMENT_FAILED] = translation._('%s1Comment failed%s2')
_approvalsMessageTypeToLabel[Constants.APPROVALS.REPLY_FAILED] = translation._('%s1Reply failed%s2')
const APPROVALS_MESSAGE_TYPE_TO_LABEL = _approvalsMessageTypeToLabel

const _approvalsMessageTypeToSubLabel = {}
// prettier-ignore
_approvalsMessageTypeToSubLabel[Constants.APPROVALS.TYPE.DRAFT] = translation._('Last edited %s1 by %s2%s3%s4')
// prettier-ignore
_approvalsMessageTypeToSubLabel[Constants.APPROVALS.TYPE.REQUIRE_APPROVAL] = translation._('Approval %s1 of %s2')
// prettier-ignore
_approvalsMessageTypeToSubLabel[Constants.APPROVALS.TYPE.PENDING_APPROVAL] = translation._('Approval %s1 of %s2')
// prettier-ignore
_approvalsMessageTypeToSubLabel[Constants.APPROVALS.TYPE.SCHEDULED] = translation._('Post created by %s1%s2%s3')
// prettier-ignore
_approvalsMessageTypeToSubLabel[Constants.APPROVALS.TYPE.PUBLISHED] = translation._('Post created by %s1%s2%s3')
const APPROVALS_MESSAGE_TYPE_TO_SUB_LABEL = _approvalsMessageTypeToSubLabel

const _approvalsMessageTypeToIcon = {}
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.DRAFT] = 'fa-file-text'
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.REQUIRE_APPROVAL] = 'fa-hourglass-half'
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.PENDING_APPROVAL] = 'fa-hourglass-half'
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.SCHEDULED] = 'fa-calendar'
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.PUBLISHED] = 'hs-publisher'
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.EXPIRED] = 'fa-hourglass-end'
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.REJECTED] = 'fa-times'
_approvalsMessageTypeToIcon[Constants.APPROVALS.FAILED] = 'fa-exclamation-triangle'
const APPROVALS_MESSAGE_TYPE_TO_ICON = _approvalsMessageTypeToIcon

const _approvalActionTypeToIcon = {}
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.CREATE] = 'hs-move-object'
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.APPROVE] = 'fa-check'
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.REJECT] = 'fa-times'
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.PENDING] = 'fa-hourglass-half'
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.EDIT] = 'fa-pencil'
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.SCHEDULE] = 'fa-calendar'
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.REOPEN] = 'fa-pencil'
const APPROVAL_ACTION_TYPE_TO_ICON = _approvalActionTypeToIcon

const _approvalActionTypeToLabel = {}
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.CREATE] = '%bSent for approval%/b by %b%s1%/b'
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.APPROVE] = '%bApproved%/b by %b%s1%/b'
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.REJECT] = '%bRejected%/b by %b%s1%/b'
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.PENDING] = '%bPending%/b approval from %b%s1%/b'
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.EDIT] = '%bEdited%/b by %b%s1%/b'
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.EXPIRE] = '%bExpired%/b'
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.RESET] = '%bReset%/b by %b%s1%/b'
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.SCHEDULE] = '%Post scheduled%/b'
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.SCHEDULEFAIL] = '%Post failed to schedule%/b'
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.SENDFAIL] = '%Post failed to send%/b'
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.REOPEN] = '%bReopened%/b by %b%s1%/b'
const APPROVAL_ACTION_TYPE_TO_LABEL = _approvalActionTypeToLabel

const _approvalRejectOriginToNameWithComment = {}
_approvalRejectOriginToNameWithComment[Constants.APPROVAL_ORIGIN_TYPES.EDIT] =
  Constants.APPROVAL_TRACKING_ORIGINS.EDIT_REJECT_COMMENT
_approvalRejectOriginToNameWithComment[Constants.APPROVAL_ORIGIN_TYPES.PREVIEW] =
  Constants.APPROVAL_TRACKING_ORIGINS.PREVIEW_REJECT_COMMENT
_approvalRejectOriginToNameWithComment[Constants.APPROVAL_ORIGIN_TYPES.LIST] =
  Constants.APPROVAL_TRACKING_ORIGINS.LIST_REJECT_COMMENT
const APPROVAL_REJECT_ORIGIN_TO_NAME_WITH_COMMENT = _approvalRejectOriginToNameWithComment

const _approvalRejectOriginToNameWithoutComment = {}
_approvalRejectOriginToNameWithoutComment[Constants.APPROVAL_ORIGIN_TYPES.EDIT] =
  Constants.APPROVAL_TRACKING_ORIGINS.EDIT_REJECT_NOCOMMENT
_approvalRejectOriginToNameWithoutComment[Constants.APPROVAL_ORIGIN_TYPES.PREVIEW] =
  Constants.APPROVAL_TRACKING_ORIGINS.PREVIEW_REJECT_NOCOMMENT
_approvalRejectOriginToNameWithoutComment[Constants.APPROVAL_ORIGIN_TYPES.LIST] =
  Constants.APPROVAL_TRACKING_ORIGINS.LIST_REJECT_NOCOMMENT
const APPROVAL_REJECT_ORIGIN_TO_NAME_WITHOUT_COMMENT = _approvalRejectOriginToNameWithoutComment

const _firstApproverTypeToEvent = {}
_firstApproverTypeToEvent[Constants.APPROVAL_TYPES.MEMBER] = 'publishing_approvals_saveFirstApprover_member'
_firstApproverTypeToEvent[Constants.APPROVAL_TYPES.TEAM] = 'publishing_approvals_saveFirstApprover_team'
_firstApproverTypeToEvent[Constants.APPROVAL_TYPES.ADMIN_AND_EDITOR] =
  'publishing_approvals_saveFirstApprover_role'
const FIRST_APPROVER_TYPE_TO_EVENT = _firstApproverTypeToEvent

const _secondApproverTypeToEvent = {}
_secondApproverTypeToEvent[Constants.APPROVAL_TYPES.MEMBER] = 'publishing_approvals_saveSecondApprover_member'
_secondApproverTypeToEvent[Constants.APPROVAL_TYPES.TEAM] = 'publishing_approvals_saveSecondApprover_team'
_secondApproverTypeToEvent[Constants.APPROVAL_TYPES.ADMIN_AND_EDITOR] =
  'publishing_approvals_saveSecondApprover_role'
const SECOND_APPROVER_TYPE_TO_EVENT = _secondApproverTypeToEvent

const _thirdApproverTypeToEvent = {}
_thirdApproverTypeToEvent[Constants.APPROVAL_TYPES.MEMBER] = 'publishing_approvals_savethirdApprover_member'
_thirdApproverTypeToEvent[Constants.APPROVAL_TYPES.TEAM] = 'publishing_approvals_savethirdApprover_team'
_thirdApproverTypeToEvent[Constants.APPROVAL_TYPES.ADMIN_AND_EDITOR] =
  'publishing_approvals_savethirdApprover_role'
const THIRD_APPROVER_TYPE_TO_EVENT = _thirdApproverTypeToEvent

const _groupMessageFlagsToSelector = {}
// the keys here are numbers that correspond to the 4 digit binary number that represents 4 message flags in order (isScheduled, isApproval, isDraft, and isPrescreen)
_groupMessageFlagsToSelector[4] = '#group_unscheduled_approval_'
_groupMessageFlagsToSelector[8] = '#group_'
_groupMessageFlagsToSelector[9] = '._grouped._preScreen'
_groupMessageFlagsToSelector[10] = '#group_draft_'
_groupMessageFlagsToSelector[12] = '#group_approval_'
const GROUP_MESSAGE_FLAGS_TO_SELECTOR = _groupMessageFlagsToSelector

const _approverTypeToErrorMessage = {}
_approverTypeToErrorMessage[Constants.APPROVAL_TYPES.MEMBER] = translation._('Team member is no longer valid')
_approverTypeToErrorMessage[Constants.APPROVAL_TYPES.TEAM] = translation._('Team is no longer valid')
const APPROVER_TYPE_TO_ERROR_MESSAGE = _approverTypeToErrorMessage

const _attachmentSourceToRemovalEvent = {}
_attachmentSourceToRemovalEvent[ComposerConstants.ATTACHMENT_TRACKING_SOURCE.MEDIA_LIBRARY] =
  'remove_attached_file_from_library'
_attachmentSourceToRemovalEvent[ComposerConstants.ATTACHMENT_TRACKING_SOURCE.UPLOAD] = 'remove_attached_file'
_attachmentSourceToRemovalEvent[ComposerConstants.ATTACHMENT_TRACKING_SOURCE.SUGGESTED] =
  'remove_attached_file'
const ATTACHMENT_SOURCE_TO_REMOVAL_EVENT = _attachmentSourceToRemovalEvent

const _trackingParamsTypeValueToDynamicPlaceholderValue = {}
_trackingParamsTypeValueToDynamicPlaceholderValue[
  Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.SOCIALNETWORK
] = Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC_PLACEHOLDER.SOCIALNETWORK
_trackingParamsTypeValueToDynamicPlaceholderValue[
  Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.SOCIALPROFILE
] = Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC_PLACEHOLDER.SOCIALPROFILE
_trackingParamsTypeValueToDynamicPlaceholderValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.POSTID] =
  Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC_PLACEHOLDER.POSTID
const TRACKING_PARAMS_TYPEVALUE_TO_DYNAMIC_PLACEHOLDER_VALUE =
  _trackingParamsTypeValueToDynamicPlaceholderValue

const _trackingParamsTypeValueToDefaultNameValue = {}
_trackingParamsTypeValueToDefaultNameValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.SOCIALNETWORK] =
  Constants.LINK_TRACKING_PARAMS_DISPLAY.NAME.SOCIALNETWORK
_trackingParamsTypeValueToDefaultNameValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.SOCIALPROFILE] =
  Constants.LINK_TRACKING_PARAMS_DISPLAY.NAME.SOCIALPROFILE
_trackingParamsTypeValueToDefaultNameValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.POSTID] =
  Constants.LINK_TRACKING_PARAMS_DISPLAY.NAME.POSTID
const TRACKING_PARAMS_TYPEVALUE_TO_DEFAULT_NAME_VALUE = _trackingParamsTypeValueToDefaultNameValue

const _trackingParamsTypeValueToBackendTypeValue = {}
_trackingParamsTypeValueToBackendTypeValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.SOCIALNETWORK] =
  Constants.LINK_TRACKING_PARAMS.TYPEVALUE.SOCIALNETWORK
_trackingParamsTypeValueToBackendTypeValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.SOCIALPROFILE] =
  Constants.LINK_TRACKING_PARAMS.TYPEVALUE.SOCIALPROFILE
_trackingParamsTypeValueToBackendTypeValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.POSTID] =
  Constants.LINK_TRACKING_PARAMS.TYPEVALUE.POSTID
const TRACKING_PARAMS_TYPEVALUE_TO_BACKEND_TYPEVALUE = _trackingParamsTypeValueToBackendTypeValue

const _campaignDropdownSelectorValueToLabel = {}
// prettier-ignore
_campaignDropdownSelectorValueToLabel[CampaignsConstants.DROPDOWN_SELECTOR.NO_CAMPAIGN] = translation._('No campaign')
const CAMPAIGN_DROPDOWN_SELECTOR_VALUE_TO_LABEL = _campaignDropdownSelectorValueToLabel

const _linkTrackerToTrackingTypeDefaultsFree = {}
_linkTrackerToTrackingTypeDefaultsFree[Constants.LINK_TRACKER.FREE.CUSTOM] =
  Constants.LINK_TRACKING_TYPE_DEFAULTS.FREE.CUSTOM
const LINK_TRACKER_TO_TRACKING_TYPE_DEFAULTS_FREE = _linkTrackerToTrackingTypeDefaultsFree

const _linkTrackerToTrackingTypeDefaultsEntitled = {}
_linkTrackerToTrackingTypeDefaultsEntitled[Constants.LINK_TRACKER.ENTITLED.CUSTOM] =
  Constants.LINK_TRACKING_TYPE_DEFAULTS.ENTITLED.CUSTOM
_linkTrackerToTrackingTypeDefaultsEntitled[Constants.LINK_TRACKER.ENTITLED.GA] =
  Constants.LINK_TRACKING_TYPE_DEFAULTS.ENTITLED.GA
_linkTrackerToTrackingTypeDefaultsEntitled[Constants.LINK_TRACKER.ENTITLED.AA] =
  Constants.LINK_TRACKING_TYPE_DEFAULTS.ENTITLED.AA
const LINK_TRACKER_TO_TRACKING_TYPE_DEFAULTS_ENTITLED = _linkTrackerToTrackingTypeDefaultsEntitled

const _linkTrackerValueToTypeEntitled = {}
_linkTrackerValueToTypeEntitled[Constants.LINK_TRACKER.ENTITLED.AA] = 'AA'
_linkTrackerValueToTypeEntitled[Constants.LINK_TRACKER.ENTITLED.GA] = 'GA'
_linkTrackerValueToTypeEntitled[Constants.LINK_TRACKER.ENTITLED.CUSTOM] = 'CUSTOM'
const LINK_TRACKER_VALUE_TO_TYPE_ENTITLED = _linkTrackerValueToTypeEntitled

const _linkTrackerValueToTypeFree = {}
_linkTrackerValueToTypeFree[Constants.LINK_TRACKER.FREE.CUSTOM] = 'CUSTOM'
const LINK_TRACKER_VALUE_TO_TYPE_FREE = _linkTrackerValueToTypeFree

export default {
  YT_COMMENT_SETTING_TO_LABEL,
  YT_PRIVACY_SETTING_TO_LABEL,
  YT_DELETION_TYPE_TO_RADIO_DESCRIPTION,
  YT_DELETION_TYPE_TO_BUTTON_TEXT,
  YT_DELETION_TYPE_TO_MODAL_TITLE_TEXT,
  YT_MAX_DURATION_TO_HOURS_MINUTES,
  YT_METADATA_ERROR_CODES_TO_ERROR_MESSAGES,
  APPROVALS_MESSAGE_TYPE_TO_LABEL,
  APPROVALS_MESSAGE_TYPE_TO_SUB_LABEL,
  APPROVALS_MESSAGE_TYPE_TO_ICON,
  APPROVAL_ACTION_TYPE_TO_ICON,
  APPROVAL_ACTION_TYPE_TO_LABEL,
  APPROVAL_REJECT_ORIGIN_TO_NAME_WITH_COMMENT,
  APPROVAL_REJECT_ORIGIN_TO_NAME_WITHOUT_COMMENT,
  FIRST_APPROVER_TYPE_TO_EVENT,
  SECOND_APPROVER_TYPE_TO_EVENT,
  THIRD_APPROVER_TYPE_TO_EVENT,
  GROUP_MESSAGE_FLAGS_TO_SELECTOR,
  APPROVER_TYPE_TO_ERROR_MESSAGE,
  ATTACHMENT_SOURCE_TO_REMOVAL_EVENT,
  TRACKING_PARAMS_TYPEVALUE_TO_DYNAMIC_PLACEHOLDER_VALUE,
  TRACKING_PARAMS_TYPEVALUE_TO_DEFAULT_NAME_VALUE,
  TRACKING_PARAMS_TYPEVALUE_TO_BACKEND_TYPEVALUE,
  CAMPAIGN_DROPDOWN_SELECTOR_VALUE_TO_LABEL,
  LINK_TRACKER_TO_TRACKING_TYPE_DEFAULTS_FREE,
  LINK_TRACKER_TO_TRACKING_TYPE_DEFAULTS_ENTITLED,
  LINK_TRACKER_VALUE_TO_TYPE_ENTITLED,
  LINK_TRACKER_VALUE_TO_TYPE_FREE,
}
