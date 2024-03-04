import NestConstants from 'hs-nest/lib/constants/social-networks';
import darklaunch from 'hs-nest/lib/utils/darklaunch';

const Constants = {};

Constants.ROUTES = {
    // If we need any keys other than publisher in here, let's move this to the nest
    PUBLISHER: {
        SCHEDULED: '/publisher/scheduled',
        BULK_COMPOSER: '/publisher/bulkcomposer'
    }
};

Constants.TYPE = {
    MESSAGE: 'message',
    DRAFT: 'draft',
    TEMPLATE: 'template',
};

Constants.OWNER_TYPE = {
    MEMBER: 'MEMBER',
    ORGANIZATION: 'ORGANIZATION'
};

Constants.FEATURE_CODES = {
    LINK_SETTINGS: 'LINK_SETTINGS_ADVANCED',
    SCHEDULE_MESSAGES: 'SCHEDULE_MESSAGES'
};

Constants.SN_GROUP = {
    TWITTER: 'twitter',
    FACEBOOK: 'facebook',
    LINKEDIN: 'linkedIn',
    INSTAGRAM: 'instagram'
};

Constants.SINGLE_SEARCH_SN_GROUPS = [
    Constants.SN_GROUP.TWITTER,
    Constants.SN_GROUP.FACEBOOK,
    Constants.SN_GROUP.INSTAGRAM,
];

Constants.SN_GROUPS = [
    Constants.SN_GROUP.TWITTER,
    Constants.SN_GROUP.FACEBOOK,
    Constants.SN_GROUP.LINKEDIN,
    Constants.SN_GROUP.INSTAGRAM
];

Constants.SN_GROUP_TO_ICON_CLASS = {
    [Constants.SN_GROUP.TWITTER]: 'fa-twitter',
    [Constants.SN_GROUP.FACEBOOK]: 'hs-facebook-pages',
    [Constants.SN_GROUP.LINKEDIN]: 'fa-linkedin',
    [Constants.SN_GROUP.INSTAGRAM]: 'fa-instagram'
};

Constants.SN_TYPES = Object.keys(NestConstants.types).reduce((memo, next) => {
    memo[next] = next;
    return memo;
}, {});

Constants.SN_GROUP_TO_SN_TYPES = {
    [Constants.SN_GROUP.TWITTER]: [Constants.SN_TYPES.TWITTER],
    [Constants.SN_GROUP.FACEBOOK]: [Constants.SN_TYPES.FACEBOOK, Constants.SN_TYPES.FACEBOOKGROUP, Constants.SN_TYPES.FACEBOOKPAGE],
    [Constants.SN_GROUP.LINKEDIN]: [Constants.SN_TYPES.LINKEDIN, Constants.SN_TYPES.LINKEDINCOMPANY],
    [Constants.SN_GROUP.INSTAGRAM]: [Constants.SN_TYPES.INSTAGRAM, Constants.SN_TYPES.INSTAGRAMBUSINESS]
};

Constants.SN_TYPE_TO_SN_GROUP = {
    [Constants.SN_TYPES.TWITTER]: Constants.SN_GROUP.TWITTER,
    [Constants.SN_TYPES.FACEBOOK]: Constants.SN_GROUP.FACEBOOK,
    [Constants.SN_TYPES.FACEBOOKPAGE]: Constants.SN_GROUP.FACEBOOK,
    [Constants.SN_TYPES.FACEBOOKGROUP]: Constants.SN_GROUP.FACEBOOK,
    [Constants.SN_TYPES.LINKEDIN]: Constants.SN_GROUP.LINKEDIN,
    [Constants.SN_TYPES.LINKEDINCOMPANY]: Constants.SN_GROUP.LINKEDIN,
    [Constants.SN_TYPES.INSTAGRAM]: Constants.SN_GROUP.INSTAGRAM,
    [Constants.SN_TYPES.INSTAGRAMBUSINESS]: Constants.SN_GROUP.INSTAGRAM
};

Constants.BULK_COMPOSER = {
    VERSION: 5
};
Constants.COMPOSER = {
    VERSION: 3
};

if (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_REMOVE_BETA')) {
    Constants.BULK_COMPOSER.VERSION = 6;
}

Constants.ONBOARDING_SEEN = 'NEW_COMPOSER_ONBOARDING_SEEN';
Constants.CAMPAIGNS_ONBOARDING_SEEN = 'NEW_COMPOSER_CAMPAIGNS_ONBOARDING_SEEN';

Constants.MAX_GIPHY_DROPDOWN_HEIGHT = 500;

// Two Step Approvals
Constants.APPROVALS = {
    TYPE: {
        DRAFT: 'draft',
        REQUIRE_APPROVAL: 'approvequeue',
        PENDING_APPROVAL: 'pendingapproval',
        SCHEDULED: 'scheduled',
        PUBLISHED: 'pastscheduled',
        EXPIRED: 'expired',
        REJECTED: 'rejected'
    },
    FAILED: 'failed',
    MESSAGE_FAILED: 'MESSAGE_FAILED',
    COMMENT_FAILED: 'COMMENT_FAILED',
    REPLY_FAILED: 'REPLY_FAILED'
};

Constants.SN_UPDATE_COMMENT_IN_PREVIEW = [
    Constants.SN_TYPES.FACEBOOK,
    Constants.SN_TYPES.FACEBOOKPAGE
];

Constants.COLLAPSIBLE_LIST_TYPES = {
    UNSCHEDULED_MESSAGES: 'unscheduledMessages',
    COMMENTS_REPLIES: 'commentsAndReplies',
    FAILED_MESSAGES: 'failedMessages'
};

Constants.COLLAPSIBLE_LIST_TYPE_TO_CLASS = {
    [Constants.COLLAPSIBLE_LIST_TYPES.UNSCHEDULED_MESSAGES]: '_unscheduled',
    [Constants.COLLAPSIBLE_LIST_TYPES.COMMENTS_REPLIES]: '_commentsRepliesList',
    [Constants.COLLAPSIBLE_LIST_TYPES.FAILED_MESSAGES]: '_failedMessagesList'
};

Constants.VIEW = {
    CREATE: 'CREATE',
    MANAGE: 'MANAGE'
};

Constants.YOUTUBE_WARNING_POPUPS = {
    PUBLISH_WARNING_MODAL: 'PUBLISHER_YOUTUBE_PUBLISH_WARNING',
    YOUTUBE_SCHEDULE_VIDEO_PRIVACY: 'YOUTUBE_SCHEDULE_VIDEO_PRIVACY'
};

// Video progress bar states
Constants.UPLOAD_STATE = {
    INITIAL: 'INITIAL',
    IN_PROGRESS: 'IN_PROGRESS',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED'
};

// Video validation states
Constants.VALIDATION_STATE = {
    INITIAL: 'INITIAL',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
};

Constants.VIDEO_SUPPORTED_NETWORKS = [
    Constants.SN_TYPES.FACEBOOK,
    Constants.SN_TYPES.FACEBOOKGROUP,
    Constants.SN_TYPES.FACEBOOKPAGE,
    Constants.SN_TYPES.INSTAGRAM,
    Constants.SN_TYPES.INSTAGRAMBUSINESS,
    Constants.SN_TYPES.TWITTER,
    Constants.SN_TYPES.LINKEDINCOMPANY
];

Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE = {
    SIMPLE_DELETE: 0,
    APPROVAL_WARNING: 1,
    CANNOT_DELETE: 2,
    SOME_MESSAGES_COULD_NOT_BE_DELETED: 3
};

// These are used by Modular Composer. In the future all panels will be dynamically passed to the composer.
// In the mean time, we're allowing panels to be specified, but also existing panels to be reused as they are
// These constants are what you pass in as a panel to re-use an existing panel
// MODULAR_COMPOSE
Constants.MODULAR_PRESETS = {
    MESSAGE_AREA: 'MESSAGE_AREA'
};

Constants.LIST_VIEW_MAX_DISPLAY_LENGTH = 240;
Constants.SECTION_SCHEDULED = 'scheduled';

Constants.FEATURE_UNLIMITED = -1;

Constants.COUNTER_BANNER_TRACKING = {
    PUBLISHER: 'publisher_list_view_link',
    OLD_COMPOSE: 'scheduler_old_compose_link'
};

Constants.SOURCE = {
    WEB: 'WEB',
};

const LONG_INITIAL_WINDOW_DURATION = 10;
const LONG_ESTIMATED_TTI = 5;
const SHORT_INITIAL_WINDOW_DURATION = 3;
const SHORT_MINIMUM_WINDOW_DURATION = 0.5;
const SHORT_ESTIMATED_TTI = 0;

Constants.SHORT_TTI_CONFIG = {
    initialWindowDuration: SHORT_INITIAL_WINDOW_DURATION,
    minimumWindowDuration : SHORT_MINIMUM_WINDOW_DURATION,
    minimumEstimatedTTI : SHORT_ESTIMATED_TTI
};

Constants.LONG_TTI_CONFIG = {
    initialWindowDuration: LONG_INITIAL_WINDOW_DURATION,
    minimumEstimatedTTI : LONG_ESTIMATED_TTI
};

export default Constants;
