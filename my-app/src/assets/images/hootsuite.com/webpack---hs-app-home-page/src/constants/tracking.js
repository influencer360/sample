export const TRACKING_ORIGIN_SOCIAL_SCORE = 'web.dashboard.social_score';
export const TRACKING_ORIGIN_TOP_POSTS = 'web.dashboard.top_posts';
export const TRACKING_ORIGIN_GETTING_STARTED = 'web.dashboard.getting_started_guide';
export const TRACKING_ORIGIN_PUBLISHING_REMINDERS = 'web.dashboard.publishing_reminders';
export const TRACKING_ORIGIN_TOP_PERFORMING_POSTS = 'web.dashboard.top_performing_posts';
export const TRACKING_ORIGIN_TIK_TOK = 'web.dashboard.tik_tok_homepage';
export const TRACKING_ORIGIN_CURRENT_ACCOUNTS_CONNECTED = 'web.dashboard.current_accounts_connected';
export const TRACKING_ORIGIN_CONTENT_LAB = 'web.dashboard.content_lab_homepage';
export const TRACKING_ORIGIN_BENCHMARKING = 'web.dashboard.benchmarking_homepage';
export const TRACKING_ORIGIN_OWLY_WRITER = 'web.dashboard.owly_writer_homepage';
export const TRACKING_ORIGIN_LINKTREE = 'web.dashboard.linktree_homepage';
export const TRACKING_ORIGIN_WIDGET_CONNECTED_ACCOUNTS = 'web.dashboard.homepage_widget.accounts';
export const TRACKING_ORIGIN_WIDGET_DRAFTS = 'web.dashboard.homepage_widget.drafts';
export const TRACKING_ORIGIN_WIDGET_GOAL_TRACKER = 'web.dashboard.homepage_widget.goal_tracker';
export const TRACKING_ORIGIN_WIDGET_ANNOUNCEMENTS = 'web.dashboard.homepage_widget.announcements';
export const TRACKING_ORIGIN_GOALS = 'web.dashboard.homepage.goals';
export const TRACKING_ORIGIN_ADDONS = 'web.dashboard.addons';
export const TRACKING_ORIGIN_TRENDS = 'web.dashboard.homepage.trends';
export const TRACKING_ORIGIN_SRS = 'web.dashboard.homepage.srs';
export const TRACKING_ORIGIN_SRS_BANNER = 'web.dashboard.homepage.srs_banner';

export const TRACKING_EVENT_USER_CLICK_POST = 'user_clicks_post';
export const TRACKING_EVENT_USER_CLICK_CONNECTED_ACCOUNT_LIST_ITEM = 'user_clicks_connected_account_list_item';
export const TRACKING_EVENT_USER_CLICK_ACCOUNT_LIST_PREVIOUS_BUTTON =
  'user_clicks_connected_account_list_previous_button';
export const TRACKING_EVENT_USER_CLICK_ACCOUNT_LIST_NEXT_BUTTON = 'user_clicks_connected_account_list_next_button';
export const TRACKING_EVENT_USER_CLICK_CTA_BENCHMARKING_TILE = 'user_clicks_cta_benchmarking_tile';
export const TRACKING_EVENT_USER_CLICK_CTA_OWLY_WRITER = 'user_clicks_cta_owly_writer_tile';
export const TRACKING_EVENT_USER_CLICK_TRIAL_CTA_LINKTREE = 'user_clicks_trial_cta_linktree_tile';
export const TRACKING_EVENT_USER_CLICK_NON_TRIAL_CTA_LINKTREE = 'user_clicks_non_trial_cta_linktree_tile';

// WIDGET EVENTS
export const TRACKING_EVENT_USER_CLICKS_GOAL_TRACKER_INTRODUCTION = 'user_clicks_goal_tracker_introduction_cta';
export const TRACKING_EVENT_USER_SAVES_GOAL = 'user_saves_goal';
export const TRACKING_EVENT_USER_OPENS_EDIT_GOAL = 'user_opens_edit_goal';
export const TRACKING_EVENT_USER_EXITS_EDIT_GOAL = 'user_exits_edit_goal';

//// Homepage V2 Tracking ////

// Widget Origin
export const TRACKING_ORIGIN_HOMEPAGE = 'web.dashboard.homepage';

/** Video Announcements */
export const TRACKING_EVENT_USER_COLLAPSES_VIDEO_ANNOUNCEMENTS = 'user_collapse_video_announcements';
export const TRACKING_EVENT_USER_EXPANDS_VIDEO_ANNOUNCEMENTS = 'user_expands_video_announcements';
export const TRACKING_EVENT_USER_CLICKS_VIDEO_ANNOUNCEMENT_CARD_CTA = 'user_clicks_video_announcement_card';
export const TRACKING_EVENT_USER_PLAYS_VIDEO = 'user_plays_video_announcement_card';
export const TRACKING_EVENT_USER_COMPLETES_VIDEO = 'user_completes_video_announcement_card';

/** Announcements */
export const TRACKING_EVENT_USER_COLLAPSES_ANNOUNCEMENTS = 'user_collapse_announcements';
export const TRACKING_EVENT_USER_EXPANDS_ANNOUNCEMENTS = 'user_expands_announcements';
export const TRACKING_EVENT_USER_CLICKS_ANNOUNCEMENT_CARD = 'user_clicks_announcement_card';
export const TRACKING_EVENT_USER_CLICKS_GO_TO_NEXT_GROUP = 'user_clicks_go_to_next_group';
export const TRACKING_EVENT_USER_CLICKS_GO_TO_PREVIOUS_GROUP = 'user_clicks_go_to_previous_group';

/** Getting Started Guide Widget */
export const TRACKING_EVENT_GETTING_STARTED_GUIDE_CREATE_TEAM = 'user_open_create_team';
export const TRACKING_EVENT_GETTING_STARTED_GUIDE_DISMISS_CREATE_TEAM = 'user_dismiss_create_team';
export const TRACKING_EVENT_GETTING_STARTED_GUIDE_INVITE_MEMBERS = 'user_open_invite_members';
export const TRACKING_EVENT_GETTING_STARTED_GUIDE_DISMISS_INVITE_MEMBERS = 'user_dismiss_invite_members';
export const TRACKING_EVENT_GETTING_STARTED_GUIDE_INVITE_MEMBERS_SUCCESS = 'user_invite_members_success';
export const TRACKING_EVENT_GETTING_STARTED_GUIDE_CREATE_TEAM_SUCCESS = 'user_create_team_success';
export const TRACKING_EVENT_GETTING_STARTED_SCHEDULE_POST_SUCCESS = 'user_schedule_post_success';
export const TRACKING_EVENT_GETTING_STARTED_CLICKS_ADD_SOCIAL_ACCOUNTS = 'user_clicks_add_social_accounts_cta';
export const TRACKING_EVENT_GETTING_STARTED_CLICKS_SCHEDULE_POST = 'user_clicks_schedule_post_cta';
export const TRACKING_EVENT_GETTING_STARTED_USER_COMPLETED_GUIDE = 'user_completes_getting_started_guide';
export const TRACKING_EVENT_GETTING_STARTED_CLICKS_ANALYTICS_BANNER_CTA = 'user_clicks_analyze_posts_cta';
export const TRACKING_EVENT_GETTING_STARTED_USER_SEES_ANALYTICS_BANNER = 'user_sees_analytics_banner';

/** Drafts */
export const TRACKING_EVENT_USER_CLICKS_SEE_ALL_DRAFTS = 'user_clicks_see_all_drafts';
export const TRACKING_EVENT_USER_CLICKS_CREATE_A_DRAFT = 'user_clicks_create_a_draft';
export const TRACKING_EVENT_USER_CLICK_DRAFT_CTA_OWLY_WRITER = 'user_clicks_drafts_cta_owly_writer';
export const TRACKING_EVENT_USER_CLICKS_DRAFT_CARD = 'user_clicks_draft_card';

/** Connected Accounts */
export const TRACKING_EVENT_USER_CLICKS_MANAGE_CTA = 'user_clicks_manage_cta';
export const TRACKING_EVENT_USER_CLICK_ADD_SOCIAL_BUTTON = 'user_clicks_add_social_profile_button';

/** Social Value */
export const TRACKING_EVENT_USER_CLICKS_VIEW_GOALS = 'user_clicks_view_goals';
export const TRACKING_EVENT_CREATE_A_GOAL = 'user_clicks_create_a_goal';

/** Social Value Trends */
export const TRACKING_EVENT_USER_CLICKS_VIEW_TRENDS = 'user_clicks_view_trends';

/** Social Relationship Score Intent Test */
export const TRACKING_EVENT_USER_CLICKS_OPT_IN_SOCIAL_RELATIONSHIP_SCORE_INTENT_TEST =
  'user_clicks_opt_in_social_relationship_score_intent_test';
export const TRACKING_EVENT_USER_CLICKS_DISMISS_SOCIAL_RELATIONSHIP_SCORE_INTENT_TEST =
  'user_clicks_dismiss_social_relationship_score_intent_test';
export const TRACKING_EVENT_USER_CLICKS_MORE_DETAILS_SOCIAL_RELATIONSHIP_SCORE_INTENT_TEST =
  'user_clicks_more_details_social_relationship_score_intent_test';

/** Top Performing Posts */
export const TRACKING_EVENT_USER_CLICKS_VIEW_MORE_DETAILS_CTA = 'user_clicks_cta_view_more_details';
export const TRACKING_EVENT_SCHEDULE_POST = 'user_clicks_cta_schedule_a_post';
export const TRACKING_EVENT_USER_CLICKS_POST_EXTERNAL_LINK = 'user_clicks_post_external_link';

// All common events
export const TRACKING_EVENT_EMPTY_STATE_SEEN = 'user_sees_empty_state_on_widget';
export const TRACKING_EVENT_EMPTY_STATE_CTA_CLICK = 'user_clicks_cta_on_empty_widget';
export const TRACKING_EVENT_WIDGET_FAILED_TO_LOAD = 'widget_failed_to_load';

// Hook events
export const TRACKING_EVENT_USER_FETCH_TOP_POSTS = 'user_fetched_top_posts';
export const TRACKING_EVENT_USER_FAILED_TO_FETCH_TOP_POSTS = 'user_failed_to_fetch_top_posts';

export const TRACKING_EVENT_USER_FETCHED_SOCIAL_ACCOUNTS = 'user_fetched_social_accounts';
export const TRACKING_EVENT_USER_FAILED_TO_FETCH_SOCIAL_ACCOUNTS = 'user_failed_to_fetch_social_accounts';

export const TRACKING_EVENT_USER_FETCHED_DRAFTS = 'user_fetched_drafts';
export const TRACKING_EVENT_USER_FAILED_TO_FETCH_DRAFTS = 'user_failed_to_fetch_drafts';
export const TRACKING_EVENT_RETRY_FETCH_DRAFTS = 'retry_fetch_drafts';
export const TRACKING_EVENT_RETRY_FETCH_DRAFTS_FAILED = 'retry_fetch_drafts_failed';

export const TRACKING_EVENT_USER_FETCHED_GOALS = 'user_fetched_goals';
export const TRACKING_EVENT_USER_FAILED_TO_FETCH_GOALS = 'user_failed_to_fetch_goals';

export const TRACKING_EVENT_USER_FETCHED_MEMBER_ADDONS = 'user_fetched_member_addons';
export const TRACKING_EVENT_USER_FETCHED_AVAILABLE_ADDONS = 'user_fetched_available_addons';
export const TRACKING_EVENT_USER_FAILED_TO_FETCH_MEMBER_ADDONS = 'user_failed_to_fetch_member_addons';
export const TRACKING_EVENT_USER_FAILED_TO_FETCH_AVAILABLE_ADDONS = 'user_failed_to_fetch_available_addons';
export const TRACKING_EVENT_USER_CLICKS_ADD_ADVANCED_PUBLISHING = 'user_clicks_add_advanced_publishing';
export const TRACKING_EVENT_USER_SEES_ADDON_CARD = 'user_sees_addon_card';

export const TRACKING_EVENT_USER_FETCHED_TRENDS = 'user_fetched_trends';
export const TRACKING_EVENT_USER_FAILED_TO_FETCH_TRENDS = 'user_failed_to_fetch_trends';
export const TRACKING_EVENT_USER_FETCHED_TRENDS_POST = 'user_fetched_trends_post';
export const TRACKING_EVENT_USER_FAILED_TO_FETCH_TRENDS_POST = 'user_failed_to_fetch_trends_post';
export const TRACKING_EVENT_USER_FETCHED_TRENDS_TOP_WORDS = 'user_fetched_trends_top_words';
export const TRACKING_EVENT_USER_FAILED_TO_FETCH_TRENDS_TOP_WORDS = 'user_failed_to_fetch_trends_top_words';

export const TRACKING_EVENT_USER_FETCHED_SRS = 'user_fetched_srs';
export const TRACKING_EVENT_USER_FETCHED_SRS_CONFIG = 'user_fetched_srs_config';
export const TRACKING_EVENT_USER_POSTED_SRS_CONFIG = 'user_posted_srs_config';
export const TRACKING_EVENT_USER_FAILED_TO_FETCH_SRS = 'user_failed_to_fetch_srs';
export const TRACKING_EVENT_USER_FAILED_TO_FETCH_SRS_CONFIG = 'user_failed_to_fetch_srs_config';
export const TRACKING_EVENT_USER_FAILED_TO_POST_SRS_CONFIG = 'user_failed_to_post_srs_config';
