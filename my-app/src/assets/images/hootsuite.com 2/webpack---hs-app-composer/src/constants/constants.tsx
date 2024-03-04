import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'

const { SN_TYPES } = SocialProfileConstants

const BULK_COMPOSER = {
  MAX_NUM_ATTACHMENTS: 4,
}

const AMPLIFY_APP_ID = {
  DOCKER_APERTURE: 74255,
  DEV: 36253,
  STAGING: 4704,
  PROD: 4509,
}

const TYPE = {
  MESSAGE: 'message',
  DRAFT: 'draft',
  TEMPLATE: 'template',
}

const BULK_COMPOSER_EDIT_MODES = {
  ERRORS: 'ERRORS',
  QUICK_SCHEDULE: 'QUICK_SCHEDULE',
  EDIT: 'EDIT',
  PREVIEW: 'PREVIEW',
  MULTIPLE: 'MULTIPLE',
}

const BULK_PAGE_SIZE = 30 // the number of messages to load per "page" of lazy loading

const ROUTES = {
  // If we need any keys other than publisher in here, let's move this to the nest
  PUBLISHER: {
    SCHEDULED: '/publisher/scheduled',
    BULK_COMPOSER: '/publisher/bulkcomposer',
    CONTENT_SOURCE: '/publisher/contentsource',
  },
}

const INSTAGRAM_PUBLISHING_MODES = {
  PUSH_PUBLISH: 'IG_PUSH',
  DIRECT_PUBLISH: 'IG_API',
}

const DUAL_PUBLISH_SETUP_TRACKING = {
  TRACKING_ORIGIN: 'full_screen_composer.dual_publish_toggle',
  TRACKING_ACTIONS: {
    PUSH_PUBLISH_SETUP: {
      CLICKED: 'mobile_device_setup_clicked',
      COMPLETE: 'mobile_device_setup_complete',
    },
    DIRECT_PUBLISH_SETUP: {
      CLICKED: 'direct_publish_setup_clicked',
      COMPLETE: 'direct_publish_setup_complete',
    },
  },
}

const OWNER_TYPE = {
  MEMBER: 'MEMBER',
  ORGANIZATION: 'ORGANIZATION',
  UNKNOWN: 'UNKNOWN',
}

const PINTEREST = {
  WIDTH: 236,
  MAX_HEIGHT: 500,
}

// Video progress bar states
const UPLOAD_STATE = {
  INITIAL: 'INITIAL',
  IN_PROGRESS: 'IN_PROGRESS',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
}

const YOUTUBE_PRIVACY_SETTINGS = {
  PUBLIC: 'public',
  UNLISTED: 'unlisted',
  PRIVATE: 'private',
}

const YOUTUBE_COMMENTING_SETTINGS = {
  ALL: 'all',
  APPROVED_ONLY: 'approved',
  DISABLED: 'disabled',
}

// Youtube video validation requirements
const YOUTUBE_VIDEO_REQUIREMENTS = {
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

const YOUTUBE_SCHEDULER = {
  NUM_HOURS_TO_DISPLAY: 12,
  MINUTES_TO_DISPLAY: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
  MIN_MINUTES_FOR_SCHEDULING: 5,
  NEAREST_TENTH_MINUTE: 1000 * 60 * 10,
  MINIMUM_SCHEDULE_MINUTES: 5,
}

const MONTHS = {
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

const MONTHS_WITH_30_DAYS = [MONTHS.APR, MONTHS.JUN, MONTHS.SEP, MONTHS.NOV]

const DATE_TIME = {
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
  VANCOUVER_TIMEZONE: 'America/Vancouver',
}

const MESSAGE_DELETION_TYPE = {
  SINGLE: 'SINGLE',
  MULTIPLE: 'MULTIPLE',
  MIXED: 'MIXED',
}

const YOUTUBE_ERROR_CODES = {
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

const APPROVAL_TYPES = {
  MEMBER: 'MEMBER',
  TEAM: 'TEAM',
  ADMIN_AND_EDITOR: 'ADMIN_AND_EDITOR',
}

// Two Step Approvals
const APPROVALS = {
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

const LINK_PREVIEW_MODES = {
  HAS_MEDIA: 'HAS_MEDIA',
  PREVIEW: 'PREVIEW',
  EDIT: 'EDIT',
}

const APPROVAL_ACTION_TYPES = {
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

const APPROVAL_TRACKING_ORIGINS = {
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

const APPROVAL_ORIGIN_TYPES = {
  LIST: 'list',
  PREVIEW: 'preview',
  EDIT: 'edit',
}

const twitterUrlLength = 23

const MESSAGE = {
  ENTITY: {
    HASHTAG: 'hashtag',
    LINK: 'link',
    MENTION: 'mention',
  },
}

// Order matters in Link Related Constants, so make sure you place default value as the first one.
// Note: this is the order which it will appear in the dropdown menu

const LINK_SHORTENER = {
  NONE: 'None',
  OWLY: 'Ow.ly',
}

const LINK_TRACKER = {
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

const LINK_TRACKING_TYPE_DEFAULTS = {
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
const LINK_PRESETS = {
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
      linkShortenerId: LINK_SHORTENER.NONE,
      linkTracker: {
        type: LINK_TRACKER.NONE,
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
const LINK_TRACKING_PARAMS_DISPLAY = {
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

const LINK_TRACKING_PARAMS = {
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

const LINK_PRESET_LOCAL_STORAGE = 'lastUsedLinkSettingsPreset'

const LAST_SCHEDULED_TIME_LOCAL_STORAGE = 'lastScheduledTime'

const LAST_IS_AUTOSCHEDULED_LOCAL_STORAGE = 'lastIsAutoscheduled'

const AUTOSCHEDULE_SETTINGS = 'autoScheduleSettings'

const COMPOSER_OPENED_FROM_PLANNER_POST_MENU = 'pnc_composer_opened_from_planner_post_menu'
const COMPOSER_OPENED_FROM_SUGGESTED_POST = 'pnc_composer_opened_from_suggested_post'

const ORG_PERMISSIONS = {
  ORG_SUPER_ADMIN: 'ORG_SUPER_ADMIN',
  ORG_ADMIN: 'ORG_ADMIN',
}

const KEY_VALUES = {
  BACKSPACE: 'Backspace',
  TAB: 'Tab',
  ENTER: 'Enter',
  COMMA: 'Comma',
  ARROWUP: 'ArrowUp',
  ARROWDOWN: 'ArrowDown',
  SPACE: ' ',
}

// These are used by Modular Composer. In the future all panels will be dynamically passed to the composer.
// In the mean time, we're allowing panels to be specified, but also existing panels to be reused as they are
// These constants are what you pass in as a panel to re-use an existing panel
// MODULAR_COMPOSE
const MODULAR_PRESETS = {
  MESSAGE_AREA: 'MESSAGE_AREA',
}

const MENTION_REGEX = /%{unifiedProfileId:([^}]+)}/

const PINTEREST_BOARD_NAME_REGEX = /[A-z0-9_]/

const BOOST_PERMISSIONS = {
  CAN_MANAGE_ADS: 'SN_MANAGE_ADS',
}

const BOOST_CAMPAIGN_STATES = {
  ACTIVE: 'ACTIVE',
  SUBMITTED: 'SUBMITTED',
  SCHEDULED: 'HS_SCHEDULED',
}

const SEQUENTIAL_POSTS = {
  TRACKING_ORIGIN: 'full_screen_composer',
  TRACKING_ACTION: 'send_message_sequential_post',
}

const DUPLICATE_POST = {
  TRACKING_ORIGIN: 'full_screen_composer',
  TRACKING_ACTION: 'send_message_duplicate_post',
}

const GET_AUTO_SCHEDULE_MESSAGE_PAYWALL = {
  TRACKING_ORIGIN: 'full_screen_composer.auto_schedule_message_paywall',
  TRACKING_ACTION: 'click_get_auto_schedule',
}

const AUTO_SCHEDULE_MESSAGE_PAYWALL_UPGRADE = {
  TRACKING_ORIGIN: 'full_screen_composer.auto_schedule_message_paywall',
  TRACKING_ACTION: 'click_upgrade_auto_schedule_from_popover',
}

const FIELD_TO_UPDATE = {
  SOCIAL_NETWORKS_KEYED_BY_ID: 'socialNetworksKeyedById',
  FIELD_VALIDATIONS: 'fieldValidations',
  ALBUM_NAME: 'albumName',
  ALBUM_TYPE: 'albumType',
  EXTENDED_INFO: 'extendedInfo',
  LINK_SETTINGS: 'linkSettings',
  TAGS: 'tags',
  LOCATIONS: 'locations',
  TARGETING: 'targeting',
  BOOST_CAMPAIGN: 'boostCampaign',
  IS_BOOSTED: 'isBoosted',
  UN_EDITED_URL_PREVIEW: 'unEditedUrlPreview',
  URL_PREVIEW: 'urlPreview',
  ATTACHMENTS: 'attachments',
  LINK_SETTINGS_PRESET_ID: 'linkSettingsPresetId',
  ERRORS: 'errors',
  SEND_DATE: 'sendDate',
  IS_AUTO_SCHEDULED: 'isAutoScheduled',
  STATE_FARM_CONTENT_SOURCE_ID: 'stateFarmContentSourceId',
  MEMBER_EMAIL: 'memberEmail',
  SAVED_BOOST_CAMPAIGN: 'savedBoostCampaign',
  VERIFIED_FB_PAGE_IDS: 'verifiedFbPageIds',
  HOOT_POST_ID: 'hootPostId',
  IS_LOCKED: 'isLocked',
  PUBLISHER_NOTES: 'publisherNotes',
  ONE_TIME_REVIEWER_ID: 'oneTimeReviewerId',
  TEMPLATE: 'template',
}

const SCHEDULER_MODE = {
  MANUAL: 'manual',
  RECOMMENDED_AUTOMATIC: 'recommended_automatic',
  RECOMMENDED: 'recommended',
} as const

const RT_SUPPORTED_NETWORKS = [
  SN_TYPES.TWITTER,
  SN_TYPES.FACEBOOKPAGE,
  SN_TYPES.INSTAGRAMBUSINESS,
  SN_TYPES.LINKEDINCOMPANY,
  SN_TYPES.LINKEDIN,
  SN_TYPES.TIKTOKBUSINESS,
]

// Note these IG post type/publshing mode consts are needed because the BE expects an object,
// whereas the postType/publishingMode is a string in the FE
const INSTAGRAM_PUBLISHING_MODE_DEFAULT = {
  mode: INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH,
}

const INSTAGRAM_POST_TYPE_DEFAULT = {
  postType: SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_FEED,
}

export default {
  AMPLIFY_APP_ID,
  APPROVALS,
  APPROVAL_ACTION_TYPES,
  APPROVAL_ORIGIN_TYPES,
  APPROVAL_TRACKING_ORIGINS,
  APPROVAL_TYPES,
  AUTOSCHEDULE_SETTINGS,
  AUTO_SCHEDULE_MESSAGE_PAYWALL_UPGRADE,
  BOOST_CAMPAIGN_STATES,
  BOOST_PERMISSIONS,
  BULK_COMPOSER,
  BULK_COMPOSER_EDIT_MODES,
  BULK_PAGE_SIZE,
  COMPOSER_OPENED_FROM_SUGGESTED_POST,
  COMPOSER_OPENED_FROM_PLANNER_POST_MENU,
  DATE_TIME,
  DUAL_PUBLISH_SETUP_TRACKING,
  DUPLICATE_POST,
  FIELD_TO_UPDATE,
  GET_AUTO_SCHEDULE_MESSAGE_PAYWALL,
  INSTAGRAM_PUBLISHING_MODE_DEFAULT,
  INSTAGRAM_POST_TYPE_DEFAULT,
  INSTAGRAM_PUBLISHING_MODES,
  KEY_VALUES,
  LAST_IS_AUTOSCHEDULED_LOCAL_STORAGE,
  LAST_SCHEDULED_TIME_LOCAL_STORAGE,
  LINK_PRESETS,
  LINK_PRESET_LOCAL_STORAGE,
  LINK_PREVIEW_MODES,
  LINK_SHORTENER,
  LINK_TRACKER,
  LINK_TRACKING_PARAMS,
  LINK_TRACKING_PARAMS_DISPLAY,
  LINK_TRACKING_TYPE_DEFAULTS,
  MENTION_REGEX,
  MESSAGE,
  MESSAGE_DELETION_TYPE,
  MODULAR_PRESETS,
  MONTHS,
  MONTHS_WITH_30_DAYS,
  ORG_PERMISSIONS,
  OWNER_TYPE,
  PINTEREST,
  PINTEREST_BOARD_NAME_REGEX,
  ROUTES,
  SEQUENTIAL_POSTS,
  twitterUrlLength,
  TYPE,
  UPLOAD_STATE,
  YOUTUBE_COMMENTING_SETTINGS,
  YOUTUBE_ERROR_CODES,
  YOUTUBE_PRIVACY_SETTINGS,
  YOUTUBE_SCHEDULER,
  YOUTUBE_VIDEO_REQUIREMENTS,
  SCHEDULER_MODE,
  RT_SUPPORTED_NETWORKS,
}
