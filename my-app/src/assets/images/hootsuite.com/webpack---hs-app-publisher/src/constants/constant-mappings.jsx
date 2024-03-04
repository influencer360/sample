/** @format */

import Constants from './constants'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import ComposerConstants from './composer'
import CampaignConstants from './campaigns'
import translation from 'hs-nest/lib/utils/translation'
import darklaunch from 'hs-nest/lib/utils/darklaunch'

/* fe-global */
import EmblemWorld from '@fp-icons/emblem-world'
import LockOpen from '@fp-icons/emblem-lock-open'
import Lock from '@fp-icons/emblem-lock'
import SingleFileText from '@fp-icons/emblem-single-file-text'
import HourGlass from '@fp-icons/emblem-hourglass'
import Calendar from '@fp-icons/emblem-calendar'
import LogoHootsuitePublisher from '@fp-icons/product-logo-hootsuite-publisher2020'
import XLight from '@fp-icons/symbol-x-light'
import AlertTriangle from '@fp-icons/symbol-alert-triangle'
import IconCheck from '@fp-icons/symbol-check'
import Pencil from '@fp-icons/emblem-pencil'
import BoxArrowRightOutline from '@fp-icons/box-arrow-right-outline'

const { SN_TYPES, SN_GROUP } = SocialProfileConstants

let ConstantMappings = {}

let _snGroupToAvatarSnType = {}
_snGroupToAvatarSnType[SN_GROUP.TWITTER] = SN_TYPES.TWITTER
_snGroupToAvatarSnType[SN_GROUP.FACEBOOK] = SN_TYPES.FACEBOOKPAGE
_snGroupToAvatarSnType[SN_GROUP.LINKEDIN] = SN_TYPES.LINKEDIN
_snGroupToAvatarSnType[SN_GROUP.INSTAGRAM] = SN_TYPES.INSTAGRAM
ConstantMappings.SN_GROUP_TO_AVATAR_SN_TYPE = _snGroupToAvatarSnType

let _snTypeToMaxMessageLength = {}
_snTypeToMaxMessageLength[SN_TYPES.TWITTER] = 280
_snTypeToMaxMessageLength[SN_TYPES.FACEBOOK] = 2000
_snTypeToMaxMessageLength[SN_TYPES.FACEBOOKPAGE] = 2000
_snTypeToMaxMessageLength[SN_TYPES.FACEBOOKGROUP] = 2000
_snTypeToMaxMessageLength[SN_TYPES.LINKEDIN] = 689
_snTypeToMaxMessageLength[SN_TYPES.LINKEDINCOMPANY] = 689
_snTypeToMaxMessageLength[SN_TYPES.LINKEDINGROUP] = 689
_snTypeToMaxMessageLength[SN_TYPES.INSTAGRAM] = 2200
_snTypeToMaxMessageLength[SN_TYPES.INSTAGRAMBUSINESS] = 2200
_snTypeToMaxMessageLength[SN_TYPES.PINTEREST] = 500
ConstantMappings.SN_TYPE_TO_MAX_MESSAGE_LENGTH = _snTypeToMaxMessageLength

let _ytCommentingSettingToLabel = {}
_ytCommentingSettingToLabel[Constants.YOUTUBE_COMMENTING_SETTINGS.ALL] = translation._('Show all comments')
// prettier-ignore
_ytCommentingSettingToLabel[Constants.YOUTUBE_COMMENTING_SETTINGS.APPROVED_ONLY] = translation._('Only show approved comments')
// prettier-ignore
_ytCommentingSettingToLabel[Constants.YOUTUBE_COMMENTING_SETTINGS.DISABLED] = translation._('Disable comments')
ConstantMappings.YT_COMMENT_SETTING_TO_LABEL = _ytCommentingSettingToLabel

let _ytPrivacySettingToLabel = {}
_ytPrivacySettingToLabel[Constants.YOUTUBE_PRIVACY_SETTINGS.PUBLIC] = {
  label: translation._('Public'),
  description: translation._('Anyone on YouTube can find and access'),
  icon: EmblemWorld,
}
_ytPrivacySettingToLabel[Constants.YOUTUBE_PRIVACY_SETTINGS.UNLISTED] = {
  label: translation._('Unlisted'),
  description: translation._('Anyone who has the link can access'),
  icon: LockOpen,
}
_ytPrivacySettingToLabel[Constants.YOUTUBE_PRIVACY_SETTINGS.PRIVATE] = {
  label: translation._('Private'),
  description: translation._('Only you can access'),
  icon: Lock,
}
ConstantMappings.YT_PRIVACY_SETTING_TO_LABEL = _ytPrivacySettingToLabel

let _ytDeletionTypeToRadioDescription = {}
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
ConstantMappings.YT_DELETION_TYPE_TO_RADIO_DESCRIPTION = _ytDeletionTypeToRadioDescription

let _ytDeletionTypeToButtonText = {}
_ytDeletionTypeToButtonText[Constants.MESSAGE_DELETION_TYPE.SINGLE] = {
  eventOnly: translation._('Remove Event'),
  eventAndVideo: translation._('Remove and Delete Video'),
}
_ytDeletionTypeToButtonText[Constants.MESSAGE_DELETION_TYPE.MULTIPLE] = {
  eventOnly: translation._('Remove Events'),
  eventAndVideo: translation._('Remove and Delete Videos'),
}
_ytDeletionTypeToButtonText[Constants.MESSAGE_DELETION_TYPE.MIXED] = {
  eventOnly: translation._('Confirm'),
  eventAndVideo: translation._('Confirm'),
}
ConstantMappings.YT_DELETION_TYPE_TO_BUTTON_TEXT = _ytDeletionTypeToButtonText

let _ytDeletionTypeToModalTitleText = {}
// prettier-ignore
_ytDeletionTypeToModalTitleText[Constants.MESSAGE_DELETION_TYPE.SINGLE] = translation._('Remove Scheduled Event')
// prettier-ignore
_ytDeletionTypeToModalTitleText[Constants.MESSAGE_DELETION_TYPE.MULTIPLE] = translation._('Remove Scheduled Events')
// prettier-ignore
_ytDeletionTypeToModalTitleText[Constants.MESSAGE_DELETION_TYPE.MIXED] = translation._('Delete Selected Items')
ConstantMappings.YT_DELETION_TYPE_TO_MODAL_TITLE_TEXT = _ytDeletionTypeToModalTitleText

let _ytMaxDurationToHoursMinutes = {}
_ytMaxDurationToHoursMinutes[Constants.YOUTUBE_VIDEO_REQUIREMENTS.MAX_VIDEO_DURATION_VERIFIED] = '11 hours'
_ytMaxDurationToHoursMinutes[Constants.YOUTUBE_VIDEO_REQUIREMENTS.MAX_VIDEO_DURATION_UNVERIFIED] =
  '15 minutes'
ConstantMappings.YT_MAX_DURATION_TO_HOURS_MINUTES = _ytMaxDurationToHoursMinutes

let _ytMetaDataErrorCodesToErrorMessages = {}
// prettier-ignore
_ytMetaDataErrorCodesToErrorMessages[Constants.YOUTUBE_ERROR_CODES.INVALID_DESCRIPTION] = translation._('Invalid description')
// prettier-ignore
_ytMetaDataErrorCodesToErrorMessages[Constants.YOUTUBE_ERROR_CODES.INVALID_TAGS] = translation._('Invalid tags')
// prettier-ignore
_ytMetaDataErrorCodesToErrorMessages[Constants.YOUTUBE_ERROR_CODES.INVALID_TITLE] = translation._('Invalid title')
ConstantMappings.YT_METADATA_ERROR_CODES_TO_ERROR_MESSAGES = _ytMetaDataErrorCodesToErrorMessages

let _approvalsMessageTypeToLabel = {}
_approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.DRAFT] = translation._('%s1Draft%s2')
// prettier-ignore
_approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.REQUIRE_APPROVAL] = translation._('%s1Pending approval%s2 from %s1%s3%s2')
// prettier-ignore
_approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.PENDING_APPROVAL] = translation._('%s1Pending approval%s2 from %s1%s3%s2')
if (darklaunch.isFeatureEnabledOrBeta('PUB_NATIVE_FB_SCHEDULING')) {
  // prettier-ignore
  _approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.SCHEDULED] = translation._('%s1Scheduled%s2 by %s1%s3%s2')
} else {
  _approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.SCHEDULED] = translation._('%s1Scheduled%s2')
}
_approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.PUBLISHED] = translation._('%s1Published%s2')
_approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.EXPIRED] = translation._('%s1Expired%s2')
_approvalsMessageTypeToLabel[Constants.APPROVALS.TYPE.REJECTED] = translation._('%s1Rejected%s2 by %s1%s3%s2')
_approvalsMessageTypeToLabel[Constants.APPROVALS.FAILED] = translation._('%s1Failed to send%s2')
_approvalsMessageTypeToLabel[Constants.APPROVALS.MESSAGE_FAILED] = translation._('%s1Message Failed%s2')
_approvalsMessageTypeToLabel[Constants.APPROVALS.COMMENT_FAILED] = translation._('%s1Comment Failed%s2')
_approvalsMessageTypeToLabel[Constants.APPROVALS.REPLY_FAILED] = translation._('%s1Reply Failed%s2')
ConstantMappings.APPROVALS_MESSAGE_TYPE_TO_LABEL = _approvalsMessageTypeToLabel

let _approvalsMessageTypeToSubLabel = {}
// prettier-ignore
_approvalsMessageTypeToSubLabel[Constants.APPROVALS.TYPE.DRAFT] = translation._('Last edited %s1 by %s2%s3%s4')
// prettier-ignore
_approvalsMessageTypeToSubLabel[Constants.APPROVALS.TYPE.REQUIRE_APPROVAL] = translation._('Approval %s1 of %s2')
// prettier-ignore
_approvalsMessageTypeToSubLabel[Constants.APPROVALS.TYPE.PENDING_APPROVAL] = translation._('Approval %s1 of %s2')
// prettier-ignore
_approvalsMessageTypeToSubLabel[Constants.APPROVALS.TYPE.SCHEDULED] = translation._('Message created by %s1%s2%s3')
// prettier-ignore
_approvalsMessageTypeToSubLabel[Constants.APPROVALS.TYPE.PUBLISHED] = translation._('Message created by %s1%s2%s3')
ConstantMappings.APPROVALS_MESSAGE_TYPE_TO_SUB_LABEL = _approvalsMessageTypeToSubLabel

let _approvalsMessageTypeToIcon = {}
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.DRAFT] = SingleFileText
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.REQUIRE_APPROVAL] = HourGlass
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.PENDING_APPROVAL] = HourGlass
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.SCHEDULED] = Calendar
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.PUBLISHED] = LogoHootsuitePublisher
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.EXPIRED] = HourGlass
_approvalsMessageTypeToIcon[Constants.APPROVALS.TYPE.REJECTED] = XLight
_approvalsMessageTypeToIcon[Constants.APPROVALS.FAILED] = AlertTriangle
ConstantMappings.APPROVALS_MESSAGE_TYPE_TO_ICON = _approvalsMessageTypeToIcon

let _approvalActionTypeToIcon = {}
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.CREATE] = BoxArrowRightOutline
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.APPROVE] = IconCheck
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.REJECT] = XLight
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.PENDING] = HourGlass
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.EDIT] = Pencil
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.SCHEDULE] = Calendar
_approvalActionTypeToIcon[Constants.APPROVAL_ACTION_TYPES.REOPEN] = Pencil
ConstantMappings.APPROVAL_ACTION_TYPE_TO_ICON = _approvalActionTypeToIcon

let _approvalActionTypeToLabel = {}
// prettier-ignore
// L10N: %b%s1%/b is a name. Example output: Sent for approval by John Doe
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.CREATE] = translation._('%bSent for approval%/b by %b%s1%/b')
// prettier-ignore
// L10N: %b%s1%/b is a name. Example output: Approved by John Doe
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.APPROVE] = translation._('%bApproved%/b by %b%s1%/b')
// prettier-ignore
// L10N: %b%s1%/b is a name. Example output: Rejected by John Doe
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.REJECT] = translation._('%bRejected%/b by %b%s1%/b')
// prettier-ignore
// L10N: %b%s1%/b is a name. Example output: Pending approval from John Doe
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.PENDING] = translation._('%bPending%/b approval from %b%s1%/b')
// L10N: %b%s1%/b is a name. Example output: Edited by John Doe
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.EDIT] = translation._('%bEdited%/b by %b%s1%/b')
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.EXPIRE] = translation._('%bExpired%/b')
// L10N: %b%s1%/b is a name. Example output: Reset by John Doe
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.RESET] = translation._('%bReset%/b by %b%s1%/b')
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.SCHEDULE] = translation._('%bMessage scheduled%/b')
// prettier-ignore
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.SCHEDULEFAIL] = translation._('%bMessage failed to schedule%/b')
// prettier-ignore
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.SENDFAIL] = translation._('%bMessage failed to send%/b')
// prettier-ignore
// L10N: %b%s1%/b is a name. Example output: Reopened by John Doe
_approvalActionTypeToLabel[Constants.APPROVAL_ACTION_TYPES.REOPEN] = translation._('%bReopened%/b by %b%s1%/b')
ConstantMappings.APPROVAL_ACTION_TYPE_TO_LABEL = _approvalActionTypeToLabel

let _approvalRejectOriginToNameWithComment = {}
_approvalRejectOriginToNameWithComment[Constants.APPROVAL_ORIGIN_TYPES.EDIT] =
  Constants.APPROVAL_TRACKING_ORIGINS.EDIT_REJECT_COMMENT
_approvalRejectOriginToNameWithComment[Constants.APPROVAL_ORIGIN_TYPES.PREVIEW] =
  Constants.APPROVAL_TRACKING_ORIGINS.PREVIEW_REJECT_COMMENT
_approvalRejectOriginToNameWithComment[Constants.APPROVAL_ORIGIN_TYPES.LIST] =
  Constants.APPROVAL_TRACKING_ORIGINS.LIST_REJECT_COMMENT
ConstantMappings.APPROVAL_REJECT_ORIGIN_TO_NAME_WITH_COMMENT = _approvalRejectOriginToNameWithComment

let _approvalRejectOriginToNameWithoutComment = {}
_approvalRejectOriginToNameWithoutComment[Constants.APPROVAL_ORIGIN_TYPES.EDIT] =
  Constants.APPROVAL_TRACKING_ORIGINS.EDIT_REJECT_NOCOMMENT
_approvalRejectOriginToNameWithoutComment[Constants.APPROVAL_ORIGIN_TYPES.PREVIEW] =
  Constants.APPROVAL_TRACKING_ORIGINS.PREVIEW_REJECT_NOCOMMENT
_approvalRejectOriginToNameWithoutComment[Constants.APPROVAL_ORIGIN_TYPES.LIST] =
  Constants.APPROVAL_TRACKING_ORIGINS.LIST_REJECT_NOCOMMENT
ConstantMappings.APPROVAL_REJECT_ORIGIN_TO_NAME_WITHOUT_COMMENT = _approvalRejectOriginToNameWithoutComment

let _firstApproverTypeToEvent = {}
_firstApproverTypeToEvent[Constants.APPROVAL_TYPES.MEMBER] = 'publishing_approvals_saveFirstApprover_member'
_firstApproverTypeToEvent[Constants.APPROVAL_TYPES.TEAM] = 'publishing_approvals_saveFirstApprover_team'
_firstApproverTypeToEvent[Constants.APPROVAL_TYPES.ADMIN_AND_EDITOR] =
  'publishing_approvals_saveFirstApprover_role'
ConstantMappings.FIRST_APPROVER_TYPE_TO_EVENT = _firstApproverTypeToEvent

let _secondApproverTypeToEvent = {}
_secondApproverTypeToEvent[Constants.APPROVAL_TYPES.MEMBER] = 'publishing_approvals_saveSecondApprover_member'
_secondApproverTypeToEvent[Constants.APPROVAL_TYPES.TEAM] = 'publishing_approvals_saveSecondApprover_team'
_secondApproverTypeToEvent[Constants.APPROVAL_TYPES.ADMIN_AND_EDITOR] =
  'publishing_approvals_saveSecondApprover_role'
ConstantMappings.SECOND_APPROVER_TYPE_TO_EVENT = _secondApproverTypeToEvent

let _thirdApproverTypeToEvent = {}
_thirdApproverTypeToEvent[Constants.APPROVAL_TYPES.MEMBER] = 'publishing_approvals_savethirdApprover_member'
_thirdApproverTypeToEvent[Constants.APPROVAL_TYPES.TEAM] = 'publishing_approvals_savethirdApprover_team'
_thirdApproverTypeToEvent[Constants.APPROVAL_TYPES.ADMIN_AND_EDITOR] =
  'publishing_approvals_savethirdApprover_role'
ConstantMappings.THIRD_APPROVER_TYPE_TO_EVENT = _thirdApproverTypeToEvent

let _groupMessageFlagsToSelector = {}
// the keys here are numbers that correspond to the 4 digit binary number that represents 4 message flags in order (isScheduled, isApproval, isDraft, and isPrescreen)
_groupMessageFlagsToSelector[4] = '#group_unscheduled_approval_'
_groupMessageFlagsToSelector[8] = '#group_'
_groupMessageFlagsToSelector[9] = '._grouped._preScreen'
_groupMessageFlagsToSelector[10] = '#group_draft_'
_groupMessageFlagsToSelector[12] = '#group_approval_'
ConstantMappings.GROUP_MESSAGE_FLAGS_TO_SELECTOR = _groupMessageFlagsToSelector

let _approverTypeToErrorMessage = {}
_approverTypeToErrorMessage[Constants.APPROVAL_TYPES.MEMBER] = translation._('Team member is no longer valid')
_approverTypeToErrorMessage[Constants.APPROVAL_TYPES.TEAM] = translation._('Team is no longer valid')
ConstantMappings.APPROVER_TYPE_TO_ERROR_MESSAGE = _approverTypeToErrorMessage

let _attachmentSourceToRemovalEvent = {}
_attachmentSourceToRemovalEvent[ComposerConstants.ATTACHMENT_TRACKING_SOURCE.MEDIA_LIBRARY] =
  'remove_attached_file_from_library'
_attachmentSourceToRemovalEvent[ComposerConstants.ATTACHMENT_TRACKING_SOURCE.UPLOAD] = 'remove_attached_file'
_attachmentSourceToRemovalEvent[ComposerConstants.ATTACHMENT_TRACKING_SOURCE.SUGGESTED] =
  'remove_attached_file'
ConstantMappings.ATTACHMENT_SOURCE_TO_REMOVAL_EVENT = _attachmentSourceToRemovalEvent

let _trackingParamsTypeValueToDynamicPlaceholderValue = {}
_trackingParamsTypeValueToDynamicPlaceholderValue[
  Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.SOCIALNETWORK
] = Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC_PLACEHOLDER.SOCIALNETWORK
_trackingParamsTypeValueToDynamicPlaceholderValue[
  Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.SOCIALPROFILE
] = Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC_PLACEHOLDER.SOCIALPROFILE
_trackingParamsTypeValueToDynamicPlaceholderValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.POSTID] =
  Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC_PLACEHOLDER.POSTID
ConstantMappings.TRACKING_PARAMS_TYPEVALUE_TO_DYNAMIC_PLACEHOLDER_VALUE =
  _trackingParamsTypeValueToDynamicPlaceholderValue

let _trackingParamsTypeValueToDefaultNameValue = {}
_trackingParamsTypeValueToDefaultNameValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.SOCIALNETWORK] =
  Constants.LINK_TRACKING_PARAMS_DISPLAY.NAME.SOCIALNETWORK
_trackingParamsTypeValueToDefaultNameValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.SOCIALPROFILE] =
  Constants.LINK_TRACKING_PARAMS_DISPLAY.NAME.SOCIALPROFILE
_trackingParamsTypeValueToDefaultNameValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.POSTID] =
  Constants.LINK_TRACKING_PARAMS_DISPLAY.NAME.POSTID
ConstantMappings.TRACKING_PARAMS_TYPEVALUE_TO_DEFAULT_NAME_VALUE = _trackingParamsTypeValueToDefaultNameValue

let _trackingParamsTypeValueToBackendTypeValue = {}
_trackingParamsTypeValueToBackendTypeValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.SOCIALNETWORK] =
  Constants.LINK_TRACKING_PARAMS.TYPEVALUE.SOCIALNETWORK
_trackingParamsTypeValueToBackendTypeValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.SOCIALPROFILE] =
  Constants.LINK_TRACKING_PARAMS.TYPEVALUE.SOCIALPROFILE
_trackingParamsTypeValueToBackendTypeValue[Constants.LINK_TRACKING_PARAMS_DISPLAY.DYNAMIC.POSTID] =
  Constants.LINK_TRACKING_PARAMS.TYPEVALUE.POSTID
ConstantMappings.TRACKING_PARAMS_TYPEVALUE_TO_BACKEND_TYPEVALUE = _trackingParamsTypeValueToBackendTypeValue

let _campaignDropdownSelectorValueToLabel = {}
// prettier-ignore
_campaignDropdownSelectorValueToLabel[CampaignConstants.DROPDOWN_SELECTOR.NO_CAMPAIGN] = translation._('No campaign')
ConstantMappings.CAMPAIGN_DROPDOWN_SELECTOR_VALUE_TO_LABEL = _campaignDropdownSelectorValueToLabel

let _linkTrackerToTrackingTypeDefaultsFree = {}
_linkTrackerToTrackingTypeDefaultsFree[Constants.LINK_TRACKER.FREE.CUSTOM] =
  Constants.LINK_TRACKING_TYPE_DEFAULTS.FREE.CUSTOM
ConstantMappings.LINK_TRACKER_TO_TRACKING_TYPE_DEFAULTS_FREE = _linkTrackerToTrackingTypeDefaultsFree

let _linkTrackerToTrackingTypeDefaultsEntitled = {}
_linkTrackerToTrackingTypeDefaultsEntitled[Constants.LINK_TRACKER.ENTITLED.CUSTOM] =
  Constants.LINK_TRACKING_TYPE_DEFAULTS.ENTITLED.CUSTOM
_linkTrackerToTrackingTypeDefaultsEntitled[Constants.LINK_TRACKER.ENTITLED.GA] =
  Constants.LINK_TRACKING_TYPE_DEFAULTS.ENTITLED.GA
_linkTrackerToTrackingTypeDefaultsEntitled[Constants.LINK_TRACKER.ENTITLED.AA] =
  Constants.LINK_TRACKING_ENTITLED_COMPOUND.AA
ConstantMappings.LINK_TRACKER_TO_TRACKING_TYPE_DEFAULTS_ENTITLED = _linkTrackerToTrackingTypeDefaultsEntitled

let _linkTrackerValueToTypeEntitled = {}
_linkTrackerValueToTypeEntitled[Constants.LINK_TRACKER.ENTITLED.AA] = 'AA'
_linkTrackerValueToTypeEntitled[Constants.LINK_TRACKER.ENTITLED.GA] = 'GA'
_linkTrackerValueToTypeEntitled[Constants.LINK_TRACKER.ENTITLED.CUSTOM] = 'CUSTOM'
ConstantMappings.LINK_TRACKER_VALUE_TO_TYPE_ENTITLED = _linkTrackerValueToTypeEntitled

let _linkTrackerValueToTypeFree = {}
_linkTrackerValueToTypeFree[Constants.LINK_TRACKER.FREE.CUSTOM] = 'CUSTOM'
ConstantMappings.LINK_TRACKER_VALUE_TO_TYPE_FREE = _linkTrackerValueToTypeFree

let _snGroupToMentionWarning = {}
// prettier-ignore
_snGroupToMentionWarning[SN_GROUP.FACEBOOK] = translation._('To support privacy changes with Facebook, mentioning Facebook Pages in posts is not currently available.')
// prettier-ignore
_snGroupToMentionWarning[SN_GROUP.INSTAGRAM] = translation._('To support privacy changes with Instagram, searching for users is no longer available. You can still type the full username to mention someone.')
ConstantMappings.SN_GROUP_TO_MENTION_WARNING = _snGroupToMentionWarning

export default ConstantMappings
