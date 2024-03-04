/** @format */

const Constants = {}

// Streams
Constants.GET_TWITTER_REPLIES_API_URL = '/ajax/stream/get-conversation'

// Publishing
Constants.BATCH_MESSAGE_PUBLISHING_API_URL = '/publisher/v3.0/messages'
Constants.MPS_MESSAGES = '/publisher/messages'

// Streaming Media (uploads)
Constants.GET_S3_URL_FROM_EXTERNAL_URL = '/publisher/streaming/media/external/image'

// Link Scraping
Constants.LINK_SCRAPE_BATCH = '/publisher/link-scraper/scrape'

// Verify URL editing permissions for Facebook Pages
Constants.VERIFY_URL_EDITING_PERMISSIONS = '/publisher/authoring/urlOwnershipPermissions'

// Presets
Constants.PRESETS_API_URL = '/publisher/utm-url-builder/presets'

// Tags
Constants.GET_TAGS_API_URL = '/tags'
Constants.CREATE_TAGS_API_URL = '/tags/create'
Constants.SUGGESTED_TAGS_API_URL = '/recent/tags'

// Campaigns
Constants.CAMPAIGNS_URL = '/publisher/campaigns'
Constants.ACTIVE_CAMPAIGNS_URL = '/publisher/campaigns/active'

// Account Management
Constants.ACCOUNT_MANAGEMENT_SCHEDULE_MESSAGE_TOTAL_URL =
  '/account-management/features/schedule-messages/total'

// Entitlements
Constants.GET_ENTITLEMENTS = '/entitlements/permissions/'

// Link Shorteners
Constants.CREATE_LINK_SHORTENER = '/publisher/utm-url-builder/organizations'
Constants.GET_LINK_SHORTENERS = '/publisher/utm-url-builder/shorteners'
Constants.GET_LINK_SHORTENER_CONFIGS = '/publisher/utm-url-builder/shortenerConfigs'
Constants.LINK_SHORTENER_OAUTH = '/publisher/utm-url-builder/oauth/shortenerConfigs'

// Mentions
Constants.GET_MENTIONS = '/publisher/mentions/profiles'
Constants.GET_SUGGESTED_MENTIONS = '/publisher/mentions/profiles/suggestions'
Constants.POST_MENTIONS_VERIFY = '/publisher/mentions/profiles/verify'

export default Constants
