/** @format */

import NestConstants from 'hs-nest/lib/constants/social-networks'
import { env, PRODUCTION } from 'fe-lib-env'

// TODO: REMOVE
// NOTE: This file uses some LEGACY Social Profile constants.
// TODO: REMOVE

let Constants = {}

Constants.BULK_COMPOSER = {
  MAX_NUM_ATTACHMENTS: 4,
}

Constants.TYPE = {
  MESSAGE: 'message',
  DRAFT: 'draft',
  TEMPLATE: 'template',
}

Constants.BULK_COMPOSER_PREVIEW = {
  ATTACHMENT_LAYOUT_TYPE: {
    1: 'ONE',
    2: 'TWO',
    3: 'THREE',
    4: 'FOUR',
  },
  ATTACHMENT_ORIENTATION: {
    LANDSCAPE: 'LANDSCAPE',
    PORTRAIT: 'PORTRAIT',
  },
  LINK_PREVIEW_MEDIA_SIZE: {
    SMALL: 'SMALL',
    LARGE: 'LARGE',
  },
}

Constants.BULK_COMPOSER_EDIT_MODES = {
  ERRORS: 'ERRORS',
  QUICK_SCHEDULE: 'QUICK_SCHEDULE',
  EDIT: 'EDIT',
  PREVIEW: 'PREVIEW',
  MULTIPLE: 'MULTIPLE',
}

Constants.BULK_PAGE_SIZE = 30 // the number of messages to load per "page" of lazy loading

Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE = {
  SIMPLE_DELETE: 0,
  APPROVAL_WARNING: 1,
  CANNOT_DELETE: 2,
  SOME_MESSAGES_COULD_NOT_BE_DELETED: 3,
}

Constants.COMPOSER_ERROR_MESSAGE = {
  DUPLICATE:
    'This message is a duplicate of another message. Posting the same message more than once is not allowed.',
}

Constants.ROUTES = {
  // If we need any keys other than publisher in here, let's move this to the nest
  PUBLISHER: {
    SCHEDULED: '/publisher/scheduled',
    BULK_COMPOSER: '/publisher/bulkcomposer',
    CONTENT_SOURCE: '/publisher/contentsource',
  },
}

// Social Networks
Constants.LEGACY_SN_TYPES = Object.keys(NestConstants.types).reduce((memo, next) => {
  memo[next] = next
  return memo
}, {})

Constants.OWNER_TYPE = {
  MEMBER: 'MEMBER',
  ORGANIZATION: 'ORGANIZATION',
}

Constants.PINTEREST = {
  WIDTH: 236,
  MAX_HEIGHT: 500,
}

Constants.INSTAGRAM_PUBLISHING_MODES = {
  PUSH_PUBLISH: 'IG_PUSH',
  DIRECT_PUBLISH: 'IG_API',
}

Constants.INSTAGRAM_POST_TYPES = {
  IG_FEED: 'IG_FEED',
  IG_STORY: 'IG_STORY',
}

// Filter Container
Constants.MAX_FILTER_CONTAINER_WIDTH = 330

// Dropdown Height
Constants.MAX_DROPDOWN_HEIGHT = 300

// Tags Dropdown Width
Constants.MAX_TAG_DROPDOWN_WIDTH = 350

// Minimum number of tags required for Suggested Tags to be visible
Constants.MINIMUM_NUMBER_OF_TAGS_FOR_SUGGESTED_TAGS_TO_BE_VISIBLE = 9

// Number of suggested tags to be displayed
Constants.MAXIMUM_NUMBER_OF_SUGGESTED_TAGS = 3

// Organization Picker Truncation
Constants.ORG_NAME_MAX_LENGTH = 25

Constants.YOUTUBE_EMBED_WIDTH = 300
Constants.YOUTUBE_EMBED_HEIGHT = 168
Constants.THUMBNAIL_PICKER_BUTTON_HEIGHT = 15
Constants.CUSTOM_THUMBNAIL_BUTTON_HEIGHT = 24
Constants.BACK_BUTTON_ICON_HEIGHT = 17

// Video progress bar states
Constants.UPLOAD_STATE = {
  INITIAL: 'INITIAL',
  IN_PROGRESS: 'IN_PROGRESS',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
}

// Video validation states
Constants.VALIDATION_STATE = {
  INITIAL: 'INITIAL',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
}

// YouTube Modal States
Constants.YOUTUBE_MODAL_STATE = {
  INITIAL: 'INITIAL',
  WARNING: 'WARNING',
  SHARING: 'SHARING',
}

Constants.YOUTUBE_PRIVACY_SETTINGS = {
  PUBLIC: 'public',
  UNLISTED: 'unlisted',
  PRIVATE: 'private',
}

Constants.YOUTUBE_COMMENTING_SETTINGS = {
  ALL: 'all',
  APPROVED_ONLY: 'approved',
  DISABLED: 'disabled',
}

// Youtube Upload Timeout
Constants.YOUTUBE_UPLOAD_TIMEOUT = 60 * 60 * 1000

// Youtube video validation requirements
Constants.YOUTUBE_VIDEO_REQUIREMENTS = {
  MAX_VIDEO_SIZE: 1000000000,
  MAX_VIDEO_SIZE_GR: 94000000,
  MAX_VIDEO_SIZE_GR_FOR_DISPLAY_TO_USER: 90000000,
  MAX_VIDEO_DURATION_VERIFIED: 39600,
  MAX_VIDEO_DURATION_UNVERIFIED: 900,
  MAX_VIDEO_TIME_VERIFIED: '11 hours',
  MAX_VIDEO_TIME_UNVERIFIED: '15 mins',
  VIDEO_CODEC: 'h264',
  AUDIO_CODEC: 'aac',
  MIMETYPES: ['video/mp4', 'video/m4v', 'video/x-m4v'],
}

Constants.YOUTUBE_SCHEDULER = {
  NUM_HOURS_TO_DISPLAY: 12,
  MINUTES_TO_DISPLAY: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
  MIN_MINUTES_FOR_SCHEDULING: 5,
  NEAREST_TENTH_MINUTE: 1000 * 60 * 10,
  MINIMUM_SCHEDULE_MINUTES: 5,
}

Constants.MONTHS = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
}

Constants.MONTHS_WITH_30_DAYS = [
  Constants.MONTHS.APR,
  Constants.MONTHS.JUN,
  Constants.MONTHS.SEP,
  Constants.MONTHS.NOV,
]

Constants.DATE_TIME = {
  NUM_SECONDS_IN_MILLISECONDS: 1000,
  NUM_SECONDS_IN_MINUTE: 60,
  NUM_HOURS_IN_PERIOD: 12,
  NUM_HOURS_IN_DAY: 24,
  AM: 'AM',
  PM: 'PM',
  DAY_SHORT_NAMES: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  MONTH_SHORT_NAMES: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
  GMT: 'GMT',
  STRING_FORMAT: 'YYYY-MM-DD HH:mm:ss',
}

Constants.YOUTUBE_WARNING_POPUPS = {
  PUBLISH_WARNING_MODAL: 'PUBLISHER_YOUTUBE_PUBLISH_WARNING',
  YOUTUBE_SCHEDULE_VIDEO_PRIVACY: 'YOUTUBE_SCHEDULE_VIDEO_PRIVACY',
}

Constants.YOUTUBE_REMOVE_SCHEDULED_EVENT = {
  REMOVE_EVENT_ONLY: '0',
  REMOVE_EVENT_AND_DELETE_VIDEO: '1',
}

Constants.MESSAGE_DELETION_TYPE = {
  SINGLE: 'SINGLE',
  MULTIPLE: 'MULTIPLE',
  MIXED: 'MIXED',
}

Constants.YOUTUBE_CUSTOM_THUMBNAIL_MAX_UPLOAD_SIZE = '2mb'
Constants.YOUTUBE_CUSTOM_THUMBNAIL_FILENAME_SEARCH_PARAMS = '_custom'
Constants.YOUTUBE_DEFAULT_SELECTED_THUMBNAIL_INDEX = 0

Constants.YOUTUBE_ERROR_CODES = {
  DEFAULT_LANGUAGE_NOT_SET: 17100,
  INVALID_CATEGORY_ID: 17101,
  INVALID_DESCRIPTION: 17102,
  INVALID_FILENAME: 17103,
  INVALID_PUBLISH_AT: 17104,
  INVALID_RECORDING_DETAILS: 17105,
  INVALID_TAGS: 17106,
  INVALID_TITLE: 17107,
  INVALID_VIDEO_GAME_RATING: 17108,
  INVALID_VIDEO_META_DATA: 17109,
  MEDIA_BODY_REQUIRED: 17110,
}

Constants.CUSTOM_APPROVALS_MODE = {
  EDIT_MODE: 'EDIT',
  PREVIEW_MODE: 'PREVIEW',
}

Constants.APPROVAL_TYPES = {
  MEMBER: 'MEMBER',
  TEAM: 'TEAM',
  ADMIN_AND_EDITOR: 'ADMIN_AND_EDITOR',
}

Constants.CUSTOM_APPROVALS_DEFAULT_SEARCH_VALUE = 'Any Editor or Admin'

Constants.CUSTOM_APPROVALS_ANY_ADMIN_OR_EDITOR = {
  avatar: null,
  searchValue: Constants.CUSTOM_APPROVALS_DEFAULT_SEARCH_VALUE,
  teamName: Constants.CUSTOM_APPROVALS_DEFAULT_SEARCH_VALUE,
}

// Two Step Approvals
Constants.APPROVALS = {
  TYPE: {
    DRAFT: 'draft',
    REQUIRE_APPROVAL: 'approvequeue',
    PENDING_APPROVAL: 'pendingapproval',
    SCHEDULED: 'scheduled',
    PUBLISHED: 'pastscheduled',
    EXPIRED: 'expired',
    REJECTED: 'rejected',
  },
  FAILED: 'failed',
  MESSAGE_FAILED: 'MESSAGE_FAILED',
  COMMENT_FAILED: 'COMMENT_FAILED',
  REPLY_FAILED: 'REPLY_FAILED',
}

Constants.ATTACHMENT_MODES = {
  BEFORE_UPLOAD: 'BEFORE_UPLOAD',
  AFTER_UPLOAD: 'AFTER_UPLOAD',
}

Constants.LINK_PREVIEW_MODES = {
  HAS_MEDIA: 'HAS_MEDIA',
  PREVIEW: 'PREVIEW',
  EDIT: 'EDIT',
}

Constants.APPROVAL_ACTION_TYPES = {
  CREATE: 'CREATE',
  APPROVE: 'APPROVE',
  EDIT: 'EDIT',
  REJECT: 'REJECT',
  RESET: 'RESET',
  REOPEN: 'REOPEN',
  EXPIRE: 'EXPIRE',
  PENDING: 'PENDING',
  SCHEDULE: 'SCHEDULE',
  SCHEDULEFAIL: 'SCHEDULEFAIL',
  SENDFAIL: 'SENDFAIL',
}

Constants.APPROVAL_TRACKING_ORIGINS = {
  VIEW_AUDIT: 'publishing_approvals_viewAudit',
  VIEW_PREVIEW: 'publishing_approvals_viewPreview',
  PREVIEW_APPROVE: 'publishing_approvals_preview_approve',
  PREVIEW_REJECT_NOCOMMENT: 'publishing_approvals_preview_reject_noComment',
  PREVIEW_REJECT_COMMENT: 'publishing_approvals_preview_reject_comment',
  LIST_APPROVE: 'publishing_approvals_list_approve',
  LIST_REJECT_NOCOMMENT: 'publishing_approvals_list_reject_noComment',
  LIST_REJECT_COMMENT: 'publishing_approvals_list_reject_comment',
  EDIT_REJECT_NOCOMMENT: 'publishing_approvals_edit_reject_noComment',
  EDIT_REJECT_COMMENT: 'publishing_approvals_edit_reject_comment',
}

Constants.APPROVAL_ORIGIN_TYPES = {
  LIST: 'list',
  PREVIEW: 'preview',
  EDIT: 'edit',
}

Constants.picTwitterUrlLength = 24
Constants.owlyImageUrlLength = 20
Constants.twitterUrlLength = 23

Constants.SN_UPDATE_COMMENT_IN_PREVIEW = [
  Constants.LEGACY_SN_TYPES.FACEBOOK,
  Constants.LEGACY_SN_TYPES.FACEBOOKPAGE,
]

Constants.MESSAGE = {
  ENTITY: {
    HASHTAG: 'hashtag',
    LINK: 'link',
    MENTION: 'mention',
  },
}

Constants.MAX_TWITTER_ATTACHMENTS = 4
Constants.MAX_TWITTER_REPLIES = 4

Constants.FACEBOOK_PNP_IMAGE_VIEW_MODE = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
}

// Order matters in Link Related Constants, so make sure you place default value as the first one.
// Note: this is the order which it will appear in the dropdown menu

Constants.LINK_SETTING_AREA_MODES = {
  EDIT: 'Save Changes',
  CREATE: 'Create',
  MANAGE: 'Apply',
}

Constants.LINK_SHORTENER = {
  NONE: 'None',
  OWLY: 'Ow.ly',
}

Constants.LINK_SHORTENER_THIRD_PARTY = {
  BITLY: 'Bit.ly',
}

Constants.LINK_SHORTENER_STATE = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
}

Constants.LINK_SHORTENER_AUTH_RESPONSES = {
  SUCCESS: 'shortener_install_success',
  FAIL: 'shortener_install_fail',
}

Constants.LINK_SETTING_AREA_SIDE_BAR_TYPE = {
  OWLY: 'OWLY',
  BITLY: 'BITLY',
  POST: 'POST',
  PRESET: 'PRESET',
}

Constants.LINK_TRACKER = {
  NONE: 'None',
  FREE: {
    CUSTOM: 'Custom',
  },
  ENTITLED: {
    AA: 'Adobe Analytics',
    GA: 'Google Analytics',
    CUSTOM: 'Custom',
  },
}

Constants.LINK_SETTING_DEFAULT_LINK = {
  url: 'www.hootsuite.com',
  linkShortenerId: Constants.LINK_SHORTENER.NONE,
  linkTracker: {
    type: Constants.LINK_TRACKER.NONE,
    trackingParameters: null,
  },
}

Constants.TRACKER_CUSTOM_TYPES = {
  FREE: 'Free',
  ENTITLED: 'Paid',
}

Constants.LINK_TRACKING_MAX_PARAMS = {
  FREE: {
    CUSTOM: 2,
  },
  ENTITLED: {
    AA: 100,
    GA: 5,
    CUSTOM: 100,
  },
}

Constants.LINK_TRACKING_CONCAT_DEFAULT = {
  type: 'Manual',
  typeValue: 'Custom',
  value: '',
}

Constants.LINK_TRACKING_TYPE_DEFAULTS = {
  FREE: {
    CUSTOM: [
      {
        name: 'platform',
        type: 'Manual',
        typeValue: 'Custom',
        value: 'hootsuite',
      },
      {
        name: 'utm_campaign',
        type: 'Manual',
        typeValue: 'Custom',
        value: 'HSCampaign',
      },
    ],
  },
  ENTITLED: {
    GA: [
      {
        name: 'utm_source',
        type: 'Compound',
        typeValue: 'Custom',
        compoundTracker: {
          seperator: '_',
          parameters: [
            {
              type: 'Manual',
              typeValue: 'Custom',
              value: 'hootsuite',
            },
          ],
        },
      },
      {
        name: 'utm_medium',
        type: 'Compound',
        typeValue: 'Custom',
        compoundTracker: {
          seperator: '_',
          parameters: [
            {
              type: 'Manual',
              typeValue: 'Custom',
              value: '',
            },
          ],
        },
      },
      {
        name: 'utm_term',
        type: 'Compound',
        typeValue: 'Custom',
        compoundTracker: {
          seperator: '_',
          parameters: [
            {
              type: 'Manual',
              typeValue: 'Custom',
              value: '',
            },
          ],
        },
      },
      {
        name: 'utm_content',
        type: 'Compound',
        typeValue: 'Custom',
        compoundTracker: {
          seperator: '_',
          parameters: [
            {
              type: 'Manual',
              typeValue: 'Custom',
              value: '',
            },
          ],
        },
      },
      {
        name: 'utm_campaign',
        type: 'Compound',
        typeValue: 'Custom',
        compoundTracker: {
          seperator: '_',
          parameters: [
            {
              type: 'Manual',
              typeValue: 'Custom',
              value: '',
            },
          ],
        },
      },
    ],
    CUSTOM: [
      {
        name: 'utm_source',
        type: 'Manual',
        typeValue: 'Custom',
        value: 'hootsuite',
      },
      {
        name: '',
        type: 'Manual',
        typeValue: 'Custom',
        value: '',
      },
    ],
    AA: [
      {
        name: 'cid',
        type: 'Manual',
        typeValue: 'Custom',
        value: '',
      },
    ],
  },
}

Constants.LINK_TRACKING_ENTITLED_COMPOUND = {
  AA: [
    {
      name: 'cid',
      type: 'Compound',
      typeValue: 'Custom',
      compoundTracker: {
        seperator: '_',
        parameters: [
          {
            type: 'Manual',
            typeValue: 'Custom',
            value: '',
          },
        ],
      },
    },
  ],
}

Constants.LINK_TRACKING_COMPOUND_AA_NEW_PARAMETER = {
  name: '',
  type: 'Compound',
  typeValue: 'Custom',
  compoundTracker: {
    seperator: '_',
    parameters: [
      {
        type: 'Manual',
        typeValue: 'Custom',
        value: '',
      },
    ],
  },
}

Constants.LINK_PRESETS_ACCEPTED_VALUES = {
  LINK_SHORTENER: {
    NONE: null,
    OWLY: 'Owly',
  },
  LINK_TRACKER: {
    NONE: null,
    AA: 'Adobe Analytics',
    GA: 'Google Analytics',
    FREE_CUSTOM: 'Free',
    ENTITLED_CUSTOM: 'Paid',
  },
}

Constants.LINK_PRESET_STATES = {
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
}

Constants.LINK_PRESETS = {
  OPTIONS: {
    MANAGE_PRESETS: {
      name: 'Manage link presets',
    },
    CREATE_PRESET: {
      name: '+ Create a new preset',
    },
    LAST_USED: {
      name: 'Last Used Preset',
    },
    NONE: {
      name: 'No Preset',
      linkShortenerId: Constants.LINK_SHORTENER.NONE,
      linkTracker: {
        type: Constants.LINK_TRACKER.NONE,
        trackingParameters: null,
      },
    },
  },
  STATE: {
    active: 'Active',
    archived: 'Archived',
    deleted: 'Deleted',
  },
  ERROR_CODES: {
    DUPLICATE_PRESET_FOR_ORG: '3008',
  },
}

Constants.ADMIN_FILTER_OPTIONS = {
  PRESETS: {
    all: 'View All',
    active: 'Active',
    archived: 'Archived',
  },
  CAMPAIGNS: {
    all: 'View All',
    active: 'Active',
    completed: 'Completed',
  },
  SHORTENERS: {
    all: 'View All',
    active: 'Active',
    pending: 'Pending',
  },
}

Constants.LINK_DROPDOWN = {
  MODE: {
    LINK_SHORTENER: 'linkShortener',
    LINK_TRACKER: 'linkTracker',
  },
}

Constants.LINK_TRACKING_PARAMS_DISPLAY = {
  DYNAMIC: {
    DYNAMIC: 'DYNAMIC',
    SOCIALNETWORK: 'Social Network',
    SOCIALPROFILE: 'Social Profile',
    POSTID: 'Post ID',
  },
  MANUAL: {
    MANUAL: 'MANUAL',
    CUSTOM: 'Custom',
  },
  MENU: {
    DYNAMIC: 'DYNAMIC',
    MANUAL: 'MANUAL',
  },
  NAME: {
    SOCIALNETWORK: 'utm_medium',
    SOCIALPROFILE: 'utm_profileid',
    POSTID: 'utm_postid',
  },
  DYNAMIC_PLACEHOLDER: {
    SOCIALNETWORK: 'twitter',
    SOCIALPROFILE: 'edt2',
    POSTID: '271723',
  },
}

Constants.LINK_TRACKING_PARAMS = {
  FIELD: {
    NAME: 'name',
  },
  TYPE: {
    COMPOUND: 'Compound',
    DYNAMIC: 'Dynamic',
    MANUAL: 'Manual',
  },
  TYPEVALUE: {
    CUSTOM: 'Custom',
    SOCIALNETWORK: 'SocialNetwork',
    SOCIALPROFILE: 'SocialProfileUsername',
    POSTID: 'HootPostId',
  },
}

Constants.LINK_SHORTENER_AUTH_TYPES = {
  OAUTH: 'Oauth2',
  APIKEY: 'ApiKey',
  BASICAUTH: 'BasicAuth',
}

Constants.LINK_SHORTENER_ID_OWLY = 1

Constants.LINK_PRESET_LOCAL_STORAGE = 'lastUsedLinkSettingsPreset'

Constants.LAST_SCHEDULED_TIME_LOCAL_STORAGE = 'lastScheduledTime'

Constants.ORG_PERMISSIONS = {
  ORG_SUPER_ADMIN: 'ORG_SUPER_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
}

Constants.REPLY_TO_LIST_POPOVERSIZE = {
  WIDTH: 350,
}

Constants.KEY_CODES = {
  BACKSPACE: 8,
  TAB: 9,
  ENTER: 13,
  COMMA: 188,
  ARROWUP: 38,
  ARROWDOWN: 40,
}

Constants.KEY_VALUES = {
  BACKSPACE: 'Backspace',
  TAB: 'Tab',
  ENTER: 'Enter',
  COMMA: 'Comma',
  ARROWUP: 'ArrowUp',
  ARROWDOWN: 'ArrowDown',
}

Constants.BANNER_TYPE = {
  INFO: 'info',
  WARNING: 'warning',
}

Constants.MAX_PLAN_TYPE = {
  ENTERPRISE: 'ENTERPRISE',
  EMPLOYEE: 'EMPLOYEE',
}

// These are used by Modular Composer. In the future all panels will be dynamically passed to the composer.
// In the mean time, we're allowing panels to be specified, but also existing panels to be reused as they are
// These constants are what you pass in as a panel to re-use an existing panel
// MODULAR_COMPOSE
Constants.MODULAR_PRESETS = {
  MESSAGE_AREA: 'MESSAGE_AREA',
}

Constants.PINTEREST_BOARD_NAME_REGEX = /[A-z0-9_]/

Constants.PINTEREST_ERROR_MESSAGES = {
  DESCRIPTION_MISSING_ERROR_CODE: 4201,
  DESCRIPTION_MISSING_TITLE: "Oops! You haven't added a description yet",
  DESCRIPTION_MISSING_TEXT: 'A short description is required to save to Pinterest',

  DESCRIPTION_LONG_ERROR_CODE: 4214,
  DESCRIPTION_LONG_TITLE: 'Your description is too long',
  DESCRIPTION_LONG_TEXT: 'Pinterest descriptions have a maximum character count of 500.',

  DESTINATION_URL_MISSING_ERROR_CODE: 3223,
  DESTINATION_URL_MISSING_TITLE: "Oops! You haven't added a link yet",
  DESTINATION_URL_MISSING_TEXT: 'A valid URL is required to save to Pinterest',

  DESTINATION_URL_INVALID_ERROR_CODE: 4243,
  DESTINATION_URL_INVALID_TITLE: "Oops! This doesn't appear to be a valid URL",
  DESTINATION_URL_INVALID_TEXT: 'A valid URL is required to save to Pinterest',

  DESTINATION_URL_REDIRECT_ERROR_CODE: 4244,
  DESTINATION_URL_REDIRECT_TITLE: 'Uh oh! It looks like this link redirects to another location',
  DESTINATION_URL_REDIRECT_TEXT: 'Pinterest does not allow redirects or URL Shorteners (ow.ly, bit.ly, etc)',

  MEDIA_MISSING_ERROR_CODE: 4212,
  MEDIA_MISSING_TITLE: "Oops! You haven't attached an image yet",
  MEDIA_MISSING_DESCRIPTION: 'An image is required to save to Pinterest',
}

Constants.MAX_LOCATION_RESULTS = 5

Constants.FEATURE_UNLIMITED = -1

Constants.FEATURE_CODES = {
  LINK_SETTINGS: 'LINK_SETTINGS_ADVANCED',
  SCHEDULE_MESSAGES: 'SCHEDULE_MESSAGES',
}

const assetsHost = env() === PRODUCTION ? 'https://i.hootsuite.com' : 'https://staging-i.hootsuite.com'

Constants.DEFAULT_INSTAGRAM_AVATAR_URL = `${assetsHost}/assets/channel-integrations/default_avatar_ig_personal.svg`
Constants.DEFAULT_AVATAR_URL =
  'https://assets.hootsuite.com/v2/images/dashboard/avatars/member-default-100.8e9a4075.png'

Constants.TWITTER_NEW_REPLIES_TRACKING_ORIGIN = 'web.publisher.twitter_new_style_replies'

Constants.TWITTER_NEW_REPLIES_PM_BUTTON_ACTION = 'user_clicked_send_pm_button'

Constants.URL_REGEX = /(https?:\/\/([\w\d_\-=/|+#~%]|[.,:?!](?!\s|$|[.,:?!]+)|(&amp;|&(?!amp;))(?!\s|$))+)/gi

Constants.LINK_TEMPLATE = "<a href='$1' target='_blank' rel='nofollow'>$2</a>"

Constants.HTTP_REGEX = /^https?:\/\//i

export default Constants
