/** @format */
let Constants = {
  COMPOSER: {},
}

Constants.STATE = {
  PRECOMPOSE: 'PRECOMPOSE',
  POSTCOMPOSE: 'POSTCOMPOSE',
}

Constants.TRACKING_CONTEXT = {
  COMPOSER: 'full_screen_composer',
  BULK_COMPOSER: 'bulk_composer',
  LINK_SETTINGS_MANAGEMENT: 'link_settings_management',
  SEND: 'send',
  SCHEDULE: 'schedule',
}

Constants.MODE = {
  BULK_COMPOSER: 'BULK_COMPOSER',
  COMPOSER: 'COMPOSER',
}

Constants.MAX_FEEDBACK_TEXT_CHARACTERS = 500

Constants.SCHEDULE_TIME = {
  IMMEDIATE: 'IMMEDIATE',
  SCHEDULE: 'SCHEDULE',
}

Constants.MEDIA_LIBRARY = {
  MEDIA_SOURCE_DEFAULT_ICON_URL: 'https://app-directory.s3.amazonaws.com/portal/images/gray-square.png',
  API_URL: '/publisher/media-discovery/mediaLibrary/sources',
  INFINITE_SCROLL_THRESHOLD: 0.95, // at 95%, we trigger a refresh
  MEDIA_PER_QUERY: 25,
  DEFAULT_THUMBNAIL_HEIGHT: 120,
  DEFAULT_THUMBNAIL_WIDTH: 200,
  FOLDER_HEIGHT: '50px',
  FOLDER_WIDTH_SPACING: 80, // amount of spacing to deduct from the width in pixels for the spacing of folders assuming 3 per row
  FOLDER_HEIGHT_SPACING: 60, // height of folder and the padding around it
  NUMBER_OF_FOLDERS_PER_ROW: 3,
  CL_SOURCE_KEY: 'contentLibraryImages',
}

Constants.APP_DIRECTORY = {
  API_URL: '/app-directory',
}

Constants.ONBOARDING_SEEN = 'NEW_COMPOSER_ONBOARDING_SEEN'
Constants.CAMPAIGNS_ONBOARDING_SEEN = 'NEW_COMPOSER_CAMPAIGNS_ONBOARDING_SEEN'

Constants.TWITTER_MAX_IMAGE_SEEN = 'TWITTER_MAX_IMAGE_SEEN'
Constants.PINTEREST_MAX_IMAGE_SEEN = 'PINTEREST_MAX_IMAGE_SEEN'

Constants.TRACKING_ACTION = {
  SCHEDULE_MESSAGES: 'schedule_messages',
  SEND_MESSAGES: 'send_messages',
}

Constants.MINIMUM_SCHEDULE_MINUTES = {
  DEFAULT: 5,
  VIDEO: 15,
}

Constants.SCHEDULE_INTERVAL_MINUTES = 5

Constants.ERROR_CODES = {
  UNABLE_TO_PARSE_JSON: 1000,
  INSTAGRAM_PAIRING: 3048,
  EMPTY_LINK_SCRAPE: 4001,
}

Constants.MAX_URL_ATTACHMENT_QUEUE = 5

Constants.ATTACHMENT_TRACKING_SOURCE = {
  EDITING: 'EDITING',
  MEDIA_LIBRARY: 'MEDIA_LIBRARY',
  SUGGESTED: 'SUGGESTED',
  UPLOAD: 'UPLOAD',
}

Constants.UNSUPPORTED_FIELDS = ['targeting', 'privacy', 'fbSponsorId', 'location']
Constants.NEW_UNSUPPORTED_FIELDS = ['targeting', 'privacy', 'fbSponsorId']

Constants.ORG_DEPENDANT_FIELDS = ['campaignId', 'tags']

Constants.DUPLICATE_DRAFT = 'DUPLICATE'

export default Constants
