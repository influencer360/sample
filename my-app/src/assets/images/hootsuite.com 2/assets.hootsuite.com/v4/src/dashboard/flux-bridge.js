import ReactDOM from 'react-dom';
import hootbus from 'utils/hootbus';
import teamResponse from 'team/response';
import serverTime from 'utils/server-time';
import trackerDatalab from 'utils/tracker-datalab';
import darklaunch from 'utils/darklaunch';
import translation from 'utils/translation';
import showSecureDialog from 'utils/dialogs/secure';
import _ from 'underscore';
import singleMessageLoader from 'message/components/single-message-section-loader';
import messageTemplate from 'publisher/message_template';
import { duplicateDraft } from 'fe-pnc-data-drafts';
import contextHeaders from 'stream/constants/context-headers';
import { renderComposer } from '../publisher/components/composer-handlers';
import { handlePendoPaywallTracking } from '../apps/pendo/utils';
import { PAYWALL_ACTIONS } from '../apps/pendo/utils';
import 'publisher/scheduler/scheduler';
import streamsFlux from 'hs-app-streams/lib/stores/flux';
import { MESSAGE_LIST, MESSAGE, COMMENT_LIST, TIMESTAMP } from 'hs-app-streams/lib/actions/types';
import { setOrganizations } from 'components/publisher/utils/organization-utils'
import baseFlux from 'hs-nest/lib/stores/flux';
import { ORGANIZATIONS, SOCIAL_NETWORKS, MEMBER } from 'hs-nest/lib/actions';
import SocialNetworkResource from 'core/social-network/resource';
import '../message_box';
import 'stream/twitter';
import streamNetwork from 'stream/network';
import instagram from 'stream/instagram';
import box from 'stream/box';
import stream from 'stream/stream';
import renderTwitterNewStyleReplies from 'components/publisher/render-twitter-new-style-replies';
import renderYouTubeCompose from 'components/publisher/render-youtube-compose';
import renderPendingCommentModal from 'components/publisher/render-pending-comment-modal';
import { createTemplate } from 'contentlab/async-actions'

const HOOTBUS_EVENT_OPEN_COMPOSER = 'composer.open';

var initializeDatalabTracker = function () {
    serverTime.init();
};

/**
 * @param {Object} data
 * @param {String} data.origin
 * @param {String} data.action
 * @param {Object} data.eventDetails
 */
var trackEvent = function (data) {
    var origin = data.origin;
    var action = data.action;
    var eventDetails = data.eventDetails;
    trackerDatalab.trackCustom(origin, action, eventDetails);
};

/**
 * @param {Object} data
 * @param {String} data.action
 * @param {Object} [data.eventDetails]
 */
var trackStreamEvent = function (data) {
    var origin = 'web.dashboard.streams';
    var action = data.action;
    var streamStyle = 'new';
    var eventDetails = _.extend(data.eventDetails || {}, { streamStyle: streamStyle });
    trackerDatalab.trackCustom(origin, action, eventDetails);
};

const initializeOrganizationsStore = function() {
    if (darklaunch.isFeatureEnabledOrBeta('PUB_31667_FIX_ORG_FETCH_IN_PLANNER')) {
        // Do not fetch the organization data when loading Planner, as it is already handled in planner-loader.jsx.
        // Including this fetch would result in two fetches, potentially causing Planner to re-render unnecessarily.
        if (!window.location.hash.includes('#/planner')) {
            baseFlux.getActions(ORGANIZATIONS).fetch().then(organizations => setOrganizations(organizations));
        }
    } else {
        baseFlux.getActions(ORGANIZATIONS).fetch().then(organizations => setOrganizations(organizations));
    }
}

var initializeMemberStore = function () {
    baseFlux.getActions(MEMBER).reset({
        memberId: hs.memberId,
        email: hs.memberEmail,
        fullName: hs.memberName,
        plan: hs.memberPlan,
        companyTitle: hs.memberCompanyTitle,
        companyName: hs.memberCompanyName,
        avatar: hs.memberAvatar,
        teams: hs.teamSocialNetworks,
        // string+boolean populated with user initials only if auto initial option is checked TODO: separate
        autoInitial: hs.memberAutoInitial
    });

    baseFlux.getActions(MEMBER).set({
        memberMaxPlanCode: hs.memberMaxPlanCode
    });

    baseFlux.getActions(MEMBER).set({
        timezoneOffset: hs.timezoneOffset || 0,
        prefs: {
            isNewRetweet: hs.prefs.isNewRetweet
        }
    });
};

var initializeSocialNetworksStore = function () {
    if (hs.socialNetworks) {
        baseFlux.getActions(SOCIAL_NETWORKS).reset(hs.socialNetworks);
    }
};

var initializeSocialNetworksBackwardCompatibility = function () {
    var snResource = new SocialNetworkResource({});
    hootbus.on('socialNetwork:updateGlobalVariables', function (data) {
        snResource.updateGlobalCache(data);
    });
};

var handleDatalabTracking = function () {
    hootbus.on('Datalab:trackEvent', function (data) {
        if (data.origin) {
            trackEvent(data);
        } else {
            trackStreamEvent(data);
        }
    });
};

var responseCallback = function (socialNetworkId, _data) {
    if (_data.success) {
        var response = _data.response;
        response.socialNetworkId = socialNetworkId;
        streamsFlux.getActions(MESSAGE).repliedTo(response);
    }
};

var handleRespondToMessage = function () {
    /**
     * @param {Object} data
     * @param {Number} data.socialNetworkId
     * @param {String} data.socialNetworkType
     * @param {String} data.text
     * @param {Number} data.id
     * @param {String} data.replyToUserName
     * @param {String} data.teamId
     */
    hootbus.on('message:respondTo', function (data) {
        var options = {
            boxId: data.boxId,
            boxType: data.boxType,
            platform: contextHeaders.PLATFORM_HEADER_WEB,
            product: contextHeaders.PRODUCT_HEADER_STREAMS
        };

        // Only init teamResponse when is a reply
        if (!data.actionType) {
            // init teamResponse to be able to create a tweet response
            teamResponse.init(data.teamId, data.socialNetworkType, data.id, data.replyToUserName, responseCallback.bind(undefined, data.socialNetworkId));
        }

        if (data.actionType !== 'quote' && data.actionType !== 'editRetweet') {
            renderTwitterNewStyleReplies(data.socialNetworkId, data.id, data.retweetId, data.replyToUserName, true, data.boxId, data.boxType);
        } else {
            // call newTweetAction with the correct params here
            if (data.actionType === 'quote') {
                if (darklaunch.isFeatureEnabled('NGE_19820_LEGACY_COMPOSE_DEPRECATION')) {
                    const params = {
                        socialNetworkId: data.socialNetworkId,
                        messageText: data.text,
                    };
                    hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, params);
                } else {
                    window.newActionTweet(data.socialNetworkId, data.text, data.id, data.replyToUserName, data.messageBoxForm, data.scheduleTimestamp, data.isKeepSchedulerOpen, data.resetCaret, getSocialNetworkContext(data), options);
                }
            } else {
                window.newActionTweet(data.socialNetworkId, data.text, data.id, data.replyToUserName, '', undefined, undefined, undefined, getSocialNetworkContext(data), options);
            }
        }

        var trackingData = {
            action: 'stream_user_clicked_send_message',
            eventDetails: {
                boxId: data.boxId,
                boxType: data.boxType,
                socialNetworkId: data.socialNetworkId,
                socialNetworkType: data.socialNetworkType,
            }
        };
        if (data.actionType) {
            trackingData.action = 'streams_message_retweet';
            trackingData.eventDetails.actionType = data.actionType;
        }
        trackStreamEvent(trackingData);
    });
};

var getSocialNetworkContext = function (data) {
    if (data && data.socialNetworkType === 'TWITTER' || data.socialNetworkSubType === 'TWITTER' || data.socialNetworkContext === 'TWITTER') {
        return 'TWITTER';
    }
    return undefined;
};

var handleMessageResponse = function () {
    hootbus.on('message:response', streamsFlux.getActions(MESSAGE).repliedTo);
};

var handleDeleteDirectMessage = function () {
    /**
     * @param {Object} data
     * @param {Number} data.divId
     * @param {Number} data.sid
     */
    hootbus.on('message:deleteDM', function (data) {
        window.deleteDMTweet(data.messageDivId, data.sid);
    });
};

var handleDeletePendingMessage = function () {
    /**
     * @param {Object} data
     * @param {Number} data.messageId
     * @param {Boolean} data.isGroupMode
     * @param {Array} data.snIds
     */
    hootbus.on('message:deletePending', function (data) {
        window.scheduler.deleteMessage(data.messageId, data.isGroupMode, data.snIds);
    });
};

var handleEditPendingMessage = function () {
    /**
     * @param {Object} data
     * @param {Number} data.messageId
     * @param {Boolean} data.isGroupMode
     * @param {Array} data.snIds
     * @param {Boolean} data.isApproval
     */
    hootbus.on('message:editPending', function (data) {
        window.scheduler.editMessagePopup({
            asset: null,
            contentLibraryId: null,
            isApproval: data.isApproval,
            isExpired: null,
            isGroupMode: data.isGroupMode,
            isLegacy: null,
            isLocked: data.isLocked,
            isNewDraft: null,
            isPreScreen: null,
            isReply: null,
            isTemplate: null,
            messageId: data.messageId,
            messageListId: data.messageListId,
            messageType: null,
            org: null,
            snIds: data.snIds,
        });
    });
};

var initializeShowSocialProfileEvent = function () {
    hootbus.on('message:showSocialProfile', function (data) {
        streamNetwork.showUserInfoPopup(data.userId, data.socialNetworkId, data.socialNetworkType, data.xPos, data.ptwImpressionId, data.type, data.userName, data.standardized);
    });
};

var handleDirectMessage = function () {
    /**
     * @param {Object} data
     * @param {Number} data.socialNetworkId
     * @param {String} data.socialNetworkType
     * @param {String} data.text
     * @param {Number} data.id
     * @param {String} data.teamId
     */
    hootbus.on('message:createDirect', function (data) {
        var trackingData = {
            action: 'streams_directMessage',
            eventDetails: {
                boxId: data.boxId,
                boxType: data.boxType,
                socialNetworkId: data.socialNetworkId,
                socialNetworkType: data.socialNetworkSubType,
            }
        };
        trackStreamEvent(trackingData);
        teamResponse.init(data.teamId, data.socialNetworkType, data.id, data.username, responseCallback.bind(undefined, data.socialNetworkId));

        if (darklaunch.isFeatureEnabled('NGE_19820_LEGACY_COMPOSE_DEPRECATION')) {
            const params = {
                socialNetworkId: data.socialNetworkId,
                messageText: data.text,
            };
            hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, params);
        } else {
            window.newActionTweet(data.socialNetworkId, data.text, data.id, data.username, '', undefined, undefined, undefined, getSocialNetworkContext(data));
        }
    });
};

var initializeShowHashtagSearchEvent = function () {
    hootbus.on('message:showHashtagSearch', function (data) {
        window.quickSearch(data.tag);
    });
};

var handleLightboxRender = function () {
    hootbus.on('message:renderLightbox', function (data) {
        window.stream.stream.showGalleryPopup({
            imgArray: data.imgArray,
            displayImg: data.displayImg > -1 ? data.displayImg : 0
        });
    });
};

var handleSendReshare = function () {
    hootbus.on('message:sendReshare', function (data) {
        instagram.resharePost(data);

        var trackingData = {
            action: 'streams_message_reshare',
            eventDetails: {
                boxId: data.boxId,
                boxType: data.boxType,
                socialNetworkId: data.socialNetworkId,
                socialNetworkType: data.socialNetworkSubType,
            }
        };
        trackStreamEvent(trackingData);
    });
};

var initializeRelativeTime = function () {
    setInterval(function () {
        streamsFlux.getActions(TIMESTAMP).set(Date.now() || new Date().getTime());
    }, 60000);
};

var handleSendToEmail = function () {

    hootbus.on('message:sendToEmail', function (data) {
        var originalText = data.originalText || '';
        var permalink = data.permalink || '';
        var socialNetworkType = data.socialNetworkType || '';
        var replyToUsername = data.replyToUsername || '';
        var attachment = data.attachment || {};

        box.sendToEmail(originalText, permalink, socialNetworkType, replyToUsername, attachment);

        var trackingData = {
            action: 'streams_message_send_to_email',
            eventDetails: {
                boxId: data.boxId,
                boxType: data.boxType,
                socialNetworkId: data.socialNetworkId,
                socialNetworkType: data.socialNetworkSubType,

            }
        };
        trackStreamEvent(trackingData);
    });
};

var handleCreateCommentStream = function () {
    hootbus.on('message:createCommentStream', function (data) {
        //postId, socialNetworkId, tabId, boxType
        window.addCommentBox(data.postId, data.socialNetworkId, data.tabId, data.boxType);
    });
};

var handleFilterStream = function () {
    hootbus.on('stream:filter', function (data) {
        if (data.keyword) {
            streamsFlux.getActions(MESSAGE_LIST).filterMessages(data.messageListId, data.keyword);
        } else if (data.followersCount) {
            streamsFlux.getActions(MESSAGE_LIST).filterMessagesByFollowersCount(data.messageListId, data.followersCount);
        }
    });
};

var handleStreamDeletion = function () {
    hootbus.on('stream:delete', function (boxId) {
        streamsFlux.getActions(MESSAGE_LIST).cleanUp(boxId);
        var reactStreamContainer = document.querySelector('#box' + boxId + ' ._messages');
        if (reactStreamContainer) {
            ReactDOM.unmountComponentAtNode(reactStreamContainer);
        }
    });
};

var handleStreamRefreshSuccess = function () {
    hootbus.on('stream:refreshSuccess', function (data) {
        stream.stream.applyFilter(data);
    });
};

var handleShowSecurePostDialog = function () {
    hootbus.on('message:showSecurePostDialog', function (data) {
        var sn = baseFlux.getStore(SOCIAL_NETWORKS).get(data.socialNetworkId);
        showSecureDialog([sn], function () {
            streamsFlux.getActions(MESSAGE).sendRetweet(data);
        });
    });
};

var handleShowSocialNetworkPicker = function () {
    hootbus.on('message:showSocialNetworkPicker', function (fn) {
        window.selectSocialNetworkPopup(fn, translation._('Which Twitter network should retweet this tweet?'));
    });
};

var handleEditYoutubeVideo = function () {
    hootbus.on('message:editYoutubeVideo', function (data) {
        renderYouTubeCompose.asEditMode(data.postId, data.socialNetworkId, data.messageListId);
    });
};

var handlePendingCommentModalRender = function () {
    hootbus.on('publisher:renderPendingCommentModal', function (data) {
        hs.statusObj.update(translation.c.LOADING, 'info');

        var promiseArray = [];
        var promisePost = streamsFlux.getActions(MESSAGE).fetchMessage(data);
        promiseArray.push(promisePost);

        if (data.pendingComment && data.pendingComment.rootId) {
            var parentId = data.pendingComment.parentId;
            var parentUid = data.socialNetworkType.toLowerCase() + '_' + parentId;
            var newData = _.clone(data);
            _.extend(newData, { messageId: parentId });
            _.extend(data, { commentId: parentId });
            var promiseComment = streamsFlux.getActions(MESSAGE).fetchMessage(newData);
            var promiseReplies = streamsFlux.getActions(COMMENT_LIST).fetch({
                messageListId: parentUid,
                parentContext: {
                    boxType: data.boxType,
                    messageListId: parentUid,
                    socialNetworkId: data.socialNetworkId
                },
                parentId: parentId,
                parentUid: parentUid,
                objectType: 'comment'
            });
            promiseArray.push(promiseComment, promiseReplies);
        }

        Promise.all(promiseArray).then(function () {
            hs.statusObj.reset();
            renderPendingCommentModal(data);
        }).catch(function () {
            hs.statusObj.update(translation._('Failed to retrieve comments and replies data'), 'warning', true);
        });
    });
};

var handleStreamSinglePostView = function () {
    hootbus.on('stream:showViewPost', function (data) {
        singleMessageLoader.showMessageModal(data);
    });
};

const handleSavedItemSinglePostView = function () {
    hootbus.on('stream:savedItem:viewPost', function ({savedItem, container}) {
        if (container) {
            singleMessageLoader.showSavedItemContainer(savedItem, container);
        } else {
            singleMessageLoader.showSavedItemModal(savedItem);
        }
    });
}

var handleMessageTagAddPopup = function () {
    hootbus.on('message:tag:add:popup', function (anchor, data) {
        var $anchor = $(anchor);
        if ($anchor.length) {
            hs.bubblePopup.open($anchor, null, null, function () {
                hs.bubblePopup.setContent(data.output);
                window.stream.box.initializeMessageTagPopup(data.organizations);
            });
        }
    });
};

var handleNewRepliesSecureWarning = function () {
    hootbus.on('message:showSecureNewReplyDialog', function (sn, postReplyFn) {
        showSecureDialog([sn], postReplyFn);
    });
};

var handleSelectPendingSocialNetworkId = function () {
    hootbus.on('socialNetwork:addPending:command', function (socialNetworkId) {
        baseFlux.getActions(SOCIAL_NETWORKS).addPendingSocialNetworkId(socialNetworkId);
    });
};

var handleEditMessageFromContentPlanner = function () {
    hootbus.on('message:edit:content_planner', function (data) {
        window.scheduler.editMessagePopup({
            asset: data.asset,
            contentLibraryId: data.contentLibraryId,
            isApproval: data.isApproval,
            isExpired: data.isExpired,
            isGroupMode: data.isGroupMode,
            isLegacy: data.isLegacy,
            isLocked: data.isLocked,
            isNewDraft: data.isNewDraft,
            isPreScreen: data.isPreScreen,
            isReply: null,
            isTemplate: data.isTemplate,
            messageId: data.messageId,
            messageListId: data.messageListId,
            messageType: data.messageType, // Used for displaying the type of message in the edit modal. Ie: Scheduled, Expired, Rejected
            org: data.org,
            snIds: data.socialProfileIds,
        });
    });
};

var handleDuplicateDraftFromContentPlanner = function () {
    hootbus.on('draft:duplicate:content_planner', function (data) {
        duplicateDraft(data.draftId)
            .then(function (data) {
                if (Array.isArray(data.errors) && data.errors.length === 0 && Array.isArray(data.drafts)) {
                    // open composer in duplicate draft mode
                    renderComposer({ draft: data.drafts[0], isDuplicateDraft: true });
                }
            }).catch(function () {
                hs.statusObj.update(translation._('Failed to create a duplicate draft'), 'error', true);
            });
    });
};

var handleDuplicatePostFromContentPlanner = function () {
    hootbus.on('content_planner:content_duplicated', function (data) {
        // open composer in duplicate scheduled post mode
        renderComposer({ duplicateId: data.messageId });
    });
};

// This should be removed after we replace it with a new Save To Content Library modal
var handleCreateTemplateFromNewCompose = function () {
    hootbus.on('message:create:template', function (data, callback) {
        if (darklaunch.isFeatureEnabled('PUB_30395_NEW_TEMPLATE_EXPERIENCE_IN_COMPOSER') && data?.useNewEndpoint) {
            // Call hs-app-contentLab to save the template
            createTemplate({data, callback});
        } else {
            messageTemplate.create(null, true, data, callback);
        }
    });
};

var initPendoPaywallTracking = function() {
    var pendo = window['pendo'];

    const handleTracking = function(action) {

        return function(data) {
            const id = data && data.detail?.id;
            const eventLabel = data && data.detail?.eventLabel;
            let guide = null;

            if (id) {
                guide = pendo.guides.find(function(guide){
                    return guide.id === id
                })
            }

            if(guide) {
                handlePendoPaywallTracking(guide, action, eventLabel)
            }
        }
    }

    if (pendo) {
        window.addEventListener('pendoPaywallOpened', handleTracking(PAYWALL_ACTIONS.IMPRESSION));
        window.addEventListener('pendoPaywallCtaClicked', handleTracking(PAYWALL_ACTIONS.ACCEPT))
        window.addEventListener('pendoPaywallDismissed', handleTracking(PAYWALL_ACTIONS.DISMISSED))
    }
}

// hs-app-user-preferences dashboard integration
var handleUserSettingsPreferencesUpdate = function () {
    hootbus.on('userSettings:preferences:updated', function (preferences) {
        baseFlux.getActions(MEMBER).set({
            prefs: {
                isNewRetweet: preferences && preferences.isNewRetweet
            }
        });
    });
}

// end hs-app-user-preferences dashboard integration

export function initFluxBridge() {
    initializeOrganizationsStore();
    initializeMemberStore();
    initializeSocialNetworksStore();
    initializeSocialNetworksBackwardCompatibility();
    initializeDatalabTracker();
    initializeRelativeTime();
    initializeShowSocialProfileEvent();
    initializeShowHashtagSearchEvent();
    handleRespondToMessage();
    handleDirectMessage();
    handleDeleteDirectMessage();
    handleDeletePendingMessage();
    handleEditPendingMessage();
    handleLightboxRender();
    handleSendReshare();
    handleSendToEmail();
    handleDatalabTracking();
    handleFilterStream();
    handleStreamRefreshSuccess();
    handleStreamDeletion();
    handleCreateCommentStream();
    handleShowSecurePostDialog();
    handleShowSocialNetworkPicker();
    handleEditYoutubeVideo();
    handleMessageResponse();
    handlePendingCommentModalRender();
    handleStreamSinglePostView();
    handleSavedItemSinglePostView();
    handleMessageTagAddPopup();
    initPendoPaywallTracking();

    handleNewRepliesSecureWarning();
    handleSelectPendingSocialNetworkId();

    handleEditMessageFromContentPlanner();

    handleDuplicateDraftFromContentPlanner();
    handleDuplicatePostFromContentPlanner();
    handleCreateTemplateFromNewCompose();

    // hs-app-user-settings dashboard integration
    handleUserSettingsPreferencesUpdate();
    // end hs-app-user-settings dashboard integration
}
