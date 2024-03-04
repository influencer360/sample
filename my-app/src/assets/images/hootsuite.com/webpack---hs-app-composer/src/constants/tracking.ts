const MAX_DETAILS_CHARACTERS_TO_LOG = 512 // This is about 17-20 social account details we can log, depending on the length of the social account ids

const TRACKING_CONTEXT = {
  COMPOSER: 'full_screen_composer',
  BULK_COMPOSER: 'bulk_composer',
  LINK_SETTINGS_MANAGEMENT: 'link_settings_management',
  SEND: 'send',
  SCHEDULE: 'schedule',
  COMPOSER_REAUTH: 'composer_reauth',
} as const

const TRACKING_ACTION = {
  SCHEDULE_MESSAGES: 'schedule_messages',
  SEND_MESSAGES: 'send_messages',
  COMPOSER_CLOSE_BUTTON: 'composer_user_clicked_close_button',
  COMPOSER_MINIMIZE_BUTTON: 'user_clicked_minimized_composer',
  COMPOSER_VALIDATION_APPEARED: 'composer_validation_appeared',
  PLANNER_DEEP_LINK_CLICKED: 'planner_deep_link_clicked',
  PLANNER_DEEP_LINK_FORCED: 'planner_deep_link_forced',
  KNOWN_DEAUTHED_NETWORK_SELECTED: 'known_deauthed_network_selected',
  CREATE_DRAFT: 'create_draft',
  EDIT_DRAFT: 'edit_draft',
  SAVE_EDITS: 'composer_user_clicked_save_edits_button',
  PER_NETWORK_CONTENT_CUSTOMIZED: 'composer_message_sent_with_customized_content',
  PER_NETWORK_MEDIA_CUSTOMIZED: 'composer_message_sent_with_customized_media',
  SCHEDULE_MESSAGES_SUMMARY: 'schedule_messages_summary',
  SEND_MESSAGES_SUMMARY: 'send_messages_summary',
  RECONNECT_PROFILE: 'user_clicked_reconnect_composer',
  TOAST_STATUS_MESSAGE_APPEARED: 'toast_status_message_appeared',
  ADD_MEDIA_FROM_COMPUTER: 'user_clicked_add_media_from_computer_composer',
  ADD_MEDIA_FROM_LIBRARY: 'user_clicked_open_media_library_composer',
  TEXT_ADDED: 'user_added_text_composer',
  TOGGLE_POST_TYPE: 'user_toggled_post_type_composer',
  LINK_SETTINGS_SHORTENER_APPLIED: 'user_applied_link_settings_shortener',
  LINK_SETTINGS_TRACKING_APPLIED: 'user_applied_link_settings_tracking',
}

const TRACKING_ORIGINS = {
  NEW: 'web.dashboard.new_composer',
  EDIT: 'web.dashboard.new_composer_edit',
  DRAFT: 'web.dashboard.new_composer_edit_draft',
  TEMPLATE: 'web.dashboard.new_composer.template',
  CLOSE: `web.publisher.${TRACKING_CONTEXT.COMPOSER}.close`,
  MINIMIZE: `web.publisher.${TRACKING_CONTEXT.COMPOSER}.minimize`,
  SAVE_EDITS: `web.publisher.${TRACKING_CONTEXT.COMPOSER}.save_edits`,
  CONTENT_HASHTAG_SUGGESTIONS: `web.content.hashtag_suggestions`,
  RECONNECT_PROFILE: `web.publisher.${TRACKING_CONTEXT.COMPOSER}.${TRACKING_ACTION.RECONNECT_PROFILE}`,
  MEDIA_LIBRARY: `web.publisher.${TRACKING_CONTEXT.COMPOSER}.add_media`,
  MESSAGE_TEXT_CONTENT: `web.publisher.${TRACKING_CONTEXT.COMPOSER}.${TRACKING_ACTION.TEXT_ADDED}`,
  LINK_SETTINGS_TRACKING: `web.publisher.${TRACKING_CONTEXT.COMPOSER}.${TRACKING_ACTION.LINK_SETTINGS_TRACKING_APPLIED}`,
  LINK_SETTINGS_SHORTENER: `web.publisher.${TRACKING_CONTEXT.COMPOSER}.${TRACKING_ACTION.LINK_SETTINGS_SHORTENER_APPLIED}`,
}

const TRACKING_ACTIONS = {
  NEW: {
    NEW_COMPOSE: {
      CLICK_APPROVAL: 'user_clicked_ask_approval_composer',
      OPENED: 'open_new_compose',
      ERROR: 'open_new_compose_fail_no_fallback',
      MORE_PUBLISHING_OPTIONS: 'user_clicked_more_publishing_options_composer',
      POST_NOW: 'user_clicked_post_now_composer',
      SCHEDULE: 'user_clicked_schedule_post_composer',
      SCHEDULE_FOR_LATER: 'user_clicked_schedule_for_later_composer',
      SAVE_CONTENT_LIBRARY: 'user_clicked_save_to_content_library_composer',
    },
    PINTEREST: {
      OPENED: 'open_new_compose_pinterest',
    },
  },
  DUPLICATE: {
    NEW_COMPOSE: {
      OPENED: 'open_new_compose_duplicate',
      ERROR: 'open_new_compose_fail_no_fallback',
    },
    LEGACY: {
      ERROR: 'open_legacy_duplicate_on_error',
      SWITCH: 'open_legacy_duplicate_on_user_switch',
      FIELDS: 'open_legacy_duplicate_on_legacy_fields',
    },
    PINTEREST: {
      OPENED: 'open_new_compose_duplicate_pinterest',
    },
  },
  DRAFT: {
    NEW_COMPOSE: {
      OPENED: 'open_new_compose_edit',
      ERROR: 'open_new_compose_fail',
      SAVE_DRAFT: 'user_clicked_save_draft_composer',
      SAVE_AS_DRAFT: 'user_clicked_save_as_draft_composer',
    },
    PINTEREST: {
      OPENED: 'open_new_compose_edit_pinterest',
    },
  },
  EDIT: {
    NEW_COMPOSE: {
      OPENED: 'open_new_compose_edit',
      ERROR: 'open_new_compose_fail_no_fallback',
    },
    LEGACY: {
      ERROR: 'open_legacy_edit_on_error',
      SWITCH: 'open_legacy_edit_on_user_switch',
      FIELDS: 'open_legacy_edit_on_legacy_fields',
    },
    PINTEREST: {
      OPENED: 'open_new_compose_edit_pinterest',
    },
  },
  TEMPLATE: {
    OPENED_FROM_TEMPLATE_SUCCESS: 'open_new_compose_from_template',
  },
  MENTION: {
    MESSAGE_SENT_WITH_MENTION: 'composer_message_sent_with_mention',
  },
  VIDEO_WARNINGS: {
    HEVC_WARNING: 'uploaded_video_hevc_codec_warning',
    MOV_WARNING: 'uploaded_video_mov_format_warning',
  },
  PRODUCT_TAGGING: {
    PRODUCT_TAGGING_WITH_CATALOGS: 'composer_message_sent_with_catalogs',
  },
  CONTENT: {
    OPENED_HASHTAG_PANEL: 'hashtags_button_click',
  },
}

export default {
  MAX_DETAILS_CHARACTERS_TO_LOG,
  TRACKING_ACTION,
  TRACKING_ACTIONS,
  TRACKING_CONTEXT,
  TRACKING_ORIGINS,
}
