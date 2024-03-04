/*
 Constant list for hootbus Events
 author: Rafael Jacinto (rafael.jacinto@hootsuite.com)
 */

var events = {
    // Publisher Events
    AMPLIFY_SEND_SUCCESS: 'amplify:send:success',
    MESSAGE_SEND_SUCCESS: 'message:send:success',
    MESSAGE_SCHEDULER_OPENED: 'message:scheduler:opened',
    MESSAGE_SCHEDULE_SUCCESS: 'message:schedule:success',
    MESSAGE_SEND_CANCEL: 'message:send:cancel',
    MESSAGE_SEND_ERROR: 'message:send:error',
    MESSAGE_EDIT_SUCCESS: 'message:edit:success',
    MESSAGE_DELETE_SUCCESS: 'message:delete:success',
    MESSAGE_APPROVE_SUCCESS: 'message:approve:success',
    MESSAGE_SHRINK_LINK_SUCCESS: 'message:shrinkLink:success',
    PUBLISHER_CLICK: 'publisher:click',
    PUBLISHER_SCHEDULED_MESSAGES_OPENED: 'publisher:scheduledMessages:opened',
    PUBLISHER_SCHEDULED_MESSAGES_INSERTED: 'publisher:scheduledMessages:inserted',

    // Social Network Events
    SOCIAL_NETWORK_ADD_SUCCESS: 'socialNetwork:addAccount:success',
    SOCIAL_NETWORK_ADD_TRANSFER: 'socialNetwork:addAccount:transfer',
    SOCIAL_NETWORK_ADD_ERROR: 'socialNetwork:addAccount:error',
    SOCIAL_NETWORK_TRANSFER_SUCCESS: 'socialNetwork:transfer:success',
    SOCIAL_NETWORK_TRANSFER_ERROR: 'socialNetwork:transfer:error',
    SOCIAL_NETWORK_DELETE_SUCCESS: 'socialNetwork:delete:success',
    SOCIAL_NETWORK_REFRESH_SUCCESS: 'socialNetwork:refresh:success',
    SOCIAL_NETWORKS_CHANGE: 'socialNetwork:change',
    SOCIAL_NETWORK_REAUTH_SUCCESS: 'socialNetwork:reauthorize:success',
    SOCIAL_NETWORK_REAUTH_ERROR: 'socialNetwork:reauthorize:error',
    ADD_SOCIAL_NETWORK_MODAL_RENDERED: 'socialNetwork:addNetworkModal:render',
    ADD_SOCIAL_NETWORKS: 'socialNetwork:add',
    SELECT_ADD_TO_SOCIAL_NETWORKS: 'socialNetwork:select:addTo',

    // Stream Events
    STREAM_VIEW: 'stream:view',
    NEW_STREAM_ADDED: 'stream:new:add',
    ADD_TREND_STREAM: 'stream:trend:add',
    GO_BACK: 'navigate:back',
    STREAM_SN_CHANGED: 'stream:sn:changed',
    STREAM_SN_CLOSED: 'stream:sn:closed',
    STREAM_BUTTONS_TRANSITION_COMPLETE: 'stream:button:transition:complete',
    STREAM_OPTIONS_OVERLAY_TOGGLED: 'stream:options:overlay:toggled',
    STREAMS_POST_LOAD_COMPLETE: 'stream:postLoad:complete',
    STREAMS_WELCOME_MESSAGE_RENDERED: 'stream:welcomeMessage:rendered',

    //Team and Org Management Events
    TEAM_MANAGEMENT_ORG_LIST_RENDERED: 'team:management:org:list:rendered',
    TEAM_MANAGEMENT_ORG_LIST_ITEM_RENDERED: 'team:management:org:list:item:rendered',

    // Stream Message Detail Events
    MESSAGE_DETAIL_VIEW: 'messageDetail:view',

    // Mobile Web Page Events
    MOBILE_WEB_LOAD_COMPLETE: 'mobileWeb:load:complete',

    // Mobile Web UI Interaction Events
    MOBILEWEB_SIDEBAR_LINK_CLICK: 'mobilewebSidebarLink:click',
    CLOSED_ADD_STREAM: 'ui:addStream:closed',
    SN_SELECTOR_CHANGED: 'ui:snPicker:change',

    // Mobile Web Promoted Tweet Tracking
    PROMOTED_TWEET_INTERACT: 'promotedTweet:interact',

    // Dashboard paywall
    DASHBOARD_PAYWALL_SHOW: 'dashboard:paywall:show',

    // Mobile Web Compose Events
    PHOTO_UPLOAD_ADD: "photoUpload:add",
    PHOTO_UPLOAD_DELETE: "photoUpload:delete",
    PHOTO_UPLOAD_SEND: "photoUpload:send",
    PHOTO_UPLOAD_SCHEDULE: "photoUpload:schedule",

    // Pendo Events
    PENDO_READY: "pendo:ready",
    PENDO_GUIDES_LOADED: "pendo:guidesLoaded",
    PENDO_GUIDES_FAILED: "pendo:guidesFailed",

    // Optimizely Events
    OPTIMIZELY_EXPERIMENT_STARTED: "optimizely:experiment:started"
};

/**
 * @deprecated Don't use hs.events globally, import the events bundle instead
 */
hs.events = events;

export default events;
