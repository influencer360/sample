import { getFeatureValue } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'
const BASE_MESSAGE_ID = 1

const STATE = {
  PRECOMPOSE: 'PRECOMPOSE',
  POSTCOMPOSE: 'POSTCOMPOSE',
}

const MODE = {
  BULK_COMPOSER: 'BULK_COMPOSER',
  COMPOSER: 'COMPOSER',
} as const

const MAX_FEEDBACK_TEXT_CHARACTERS = 500

const SCHEDULE_TIME = {
  IMMEDIATE: 'IMMEDIATE',
  SCHEDULE: 'SCHEDULE',
} as const

const MEDIA_LIBRARY = {
  MEDIA_SOURCE_DEFAULT_ICON_URL: 'https://app-directory.s3.amazonaws.com/portal/images/gray-square.png',
  API_URL: '/publisher/media-discovery/mediaLibrary/sources',
  INFINITE_SCROLL_THRESHOLD: 0.95, // at 95%, we trigger a refresh
  MEDIA_PER_QUERY: 25,
  DEFAULT_THUMBNAIL_HEIGHT: 120,
  DEFAULT_THUMBNAIL_WIDTH: 200,
  CL_SOURCE_KEY: 'contentLibraryImages',
}

const APP_DIRECTORY = {
  API_URL: '/app-directory',
}

const ONBOARDING_SEEN = 'NEW_COMPOSER_ONBOARDING_SEEN'
const CAMPAIGNS_ONBOARDING_SEEN = 'NEW_COMPOSER_CAMPAIGNS_ONBOARDING_SEEN'
const CANVA_ONBOARDING_BANNER_SEEN = 'CANVA_ONBOARDING_BANNER_SEEN'
const INSTAGRAM_STORIES_IN_COMPOSER_ONBOARDING_SEEN = 'INSTAGRAM_STORIES_IN_COMPOSER_ONBOARDING_SEEN'
const OWLY_WRITER_BANNER_IN_COMPOSER_SEEN = 'OWLY_WRITER_BANNER_IN_COMPOSER_SEEN'
const CONTENT_LAB_ONBOARDING_SEEN = 'CONTENT_LAB_ONBOARDING_SEEN'

const TWITTER_MAX_IMAGE_SEEN = 'TWITTER_MAX_IMAGE_SEEN'
const PINTEREST_MAX_IMAGE_SEEN = 'PINTEREST_MAX_IMAGE_SEEN'
const LINKEDIN_MAX_IMAGE_SEEN = 'LINKEDIN_MAX_IMAGE_SEEN'
const INSTAGRAM_MAX_ASSET_SEEN = 'INSTAGRAM_MAX_ASSET_SEEN'

const MINIMUM_SCHEDULE_MINUTES = {
  DEFAULT: 5,
  VIDEO: 15,
  VIDEO_TRANSCODING: 30,
}

const SCHEDULE_INTERVAL_MINUTES = 5

const ERROR_CODES = {
  UNABLE_TO_PARSE_JSON: 1000,
  INSTAGRAM_PAIRING: 3048,
  NO_MEDIA: [3218, 4212],
  EMPTY_LINK_SCRAPE: 4001,
  INVALID_SEND_DATE: 4219,
  MESSAGE_LIMIT_REACHED: 4268,
  MESSAGE_BODY_TOO_LONG: 4214,
  MESSAGE_BODY_REQUIRED: 4201,
  INSUFFICIENT_PERMISSION_TO_REVIEW_MESSAGE: 2015,
  ISSUE_WITH_MEDIA: 3012,
}

const ERROR_LEVELS = {
  ERRORS: 'errors',
  WARNINGS: 'warnings',
  INFO: 'info',
} as const

const MAX_URL_ATTACHMENT_QUEUE = 5

const ATTACHMENT_TRACKING_SOURCE = {
  EDITING: 'EDITING',
  MEDIA_LIBRARY: 'MEDIA_LIBRARY',
  SUGGESTED: 'SUGGESTED',
  UPLOAD: 'UPLOAD',
}

const UNSUPPORTED_FIELDS = ['targeting', 'fbSponsorId', 'location']

const ORG_DEPENDANT_FIELDS = ['campaignId', 'tags']

const DUPLICATE_DRAFT = 'DUPLICATE'

const SINGLE_ERROR_TITLE = translation._("There's an issue with your post")
const SINGLE_ERROR_MESSAGE = translation._('Please review the highlighted field below')
const MULTIPLE_ERROR_TITLE = translation._('There are a few issues with your post')
const MULTIPLE_ERROR_MESSAGE = translation._('Please review the highlighted fields below')

const BOOST_CAMPAIGN = {
  VIDEO_MAX_SIZE: 209715200,
}

const COMPONENT_KEYS = {
  COMPOSER: 'COMPOSER',
  PLANNER: 'PLANNER',
  BULK_SCHEDULER: 'BULK_SCHEDULER',
  OLD_COMPOSER: 'OLD_COMPOSER',
  SCHEDULER: 'SCHEDULER',
  STREAMS: 'STREAMS',
  SOCIAL_SIGNUP: 'SOCIAL_SIGNUP',
}

const CONTEXTS = {
  COMMON: 'COMMON',
  CUSTOM: 'CUSTOM',
}

const CUSTOM_CONTEXTS = {
  PINTEREST: 'PINTEREST',
  AMPLIFY: 'AMPLIFY',
  AMPLIFY_EDIT_POST: 'AMPLIFY_EDIT_POST',
}

const COMPOSE_TYPES = {
  NEW_PIN: 'new_pin',
  EDIT_PIN: 'edit_pin',
  AMPLIFY_PERSONALIZE: 'amplify_personalize',
  AMPLIFY_EDIT_POST: 'amplify_edit_post',
}

const CONTENT_STATE = {
  SCHEDULED: 'SCHEDULED',
  SENT: 'SENT',
  SEND_FAILED_PERMANENTLY: 'SEND_FAILED_PERMANENTLY',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  EXPIRED_APPROVAL: 'EXPIRED_APPROVAL',
  REJECTED_APPROVAL: 'REJECTED_APPROVAL',
  PENDING_PRESCREEN: 'PENDING_PRESCREEN',
  REJECTED_PRESCREEN: 'REJECTED_PRESCREEN',
}

const MESSAGE_PREVIEWS_STORE_NAME = 'fe-pnc-data-composer-message-previews'

const SEARCH_DEBOUNCE_MS = parseInt(getFeatureValue('PUB_29273_MEDIA_LIBRARY_SEARCH_DEBOUNCE_VALUE'), 10)

export default {
  APP_DIRECTORY,
  ATTACHMENT_TRACKING_SOURCE,
  BASE_MESSAGE_ID,
  BOOST_CAMPAIGN,
  CAMPAIGNS_ONBOARDING_SEEN,
  COMPONENT_KEYS,
  COMPOSE_TYPES,
  CONTENT_STATE,
  CONTEXTS,
  CUSTOM_CONTEXTS,
  DUPLICATE_DRAFT,
  ERROR_CODES,
  ERROR_LEVELS,
  INSTAGRAM_STORIES_IN_COMPOSER_ONBOARDING_SEEN,
  OWLY_WRITER_BANNER_IN_COMPOSER_SEEN,
  INSTAGRAM_MAX_ASSET_SEEN,
  LINKEDIN_MAX_IMAGE_SEEN,
  CANVA_ONBOARDING_BANNER_SEEN,
  MAX_FEEDBACK_TEXT_CHARACTERS,
  MAX_URL_ATTACHMENT_QUEUE,
  MEDIA_LIBRARY,
  MESSAGE_PREVIEWS_STORE_NAME,
  MINIMUM_SCHEDULE_MINUTES,
  MODE,
  MULTIPLE_ERROR_MESSAGE,
  MULTIPLE_ERROR_TITLE,
  ONBOARDING_SEEN,
  CONTENT_LAB_ONBOARDING_SEEN,
  ORG_DEPENDANT_FIELDS,
  PINTEREST_MAX_IMAGE_SEEN,
  SCHEDULE_INTERVAL_MINUTES,
  SCHEDULE_TIME,
  SEARCH_DEBOUNCE_MS,
  SINGLE_ERROR_MESSAGE,
  SINGLE_ERROR_TITLE,
  STATE,
  TWITTER_MAX_IMAGE_SEEN,
  UNSUPPORTED_FIELDS,
}