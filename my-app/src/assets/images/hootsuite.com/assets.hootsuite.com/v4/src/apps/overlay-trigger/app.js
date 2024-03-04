/**
 * This app is instanced on dashboard load and listens for different hootbus events
 * and fires relevant callbacks
 *
 */
'use strict';

import _ from 'underscore';
import hootbus from 'utils/hootbus';
import AppBase from 'core/app-base';
import memberUtil from 'utils/member';
import trackerDatalab from 'utils/tracker-datalab';
import darklaunch from 'hs-nest/lib/utils/darklaunch';
import translation from 'hs-nest/lib/utils/translation';
import util from 'utils/util';
import walkthroughUtils from 'utils/walkthrough';
import abtest from 'utils/abtest';
import { getPrepopulatingStreamsEntitlement } from 'utils/entitlements';

var SELECTORS = Object.freeze({
    addNewTabBtn: '._addNewTabBtn',
    body: 'body',
    box: '._box',
    boxAddStream: '#boxAddStream',
    composer: '.vk-ComposerModal',
    contentPromotion: '._contentpromotion',
    editPostPane: '.vk-MessagePreviewBody',
    accountMenuButton: '.-global-account-navigation-anchor',
    messageBox: '._messageBox',
    activeTab: '.tab.active',
    dashboardBanner: '#dashboardBanner',
    streamsViewWrapper: '._streamsViewWrapper',
    noStreamsView: '._noStreamsView',
    accountNavigation: '.account-navigation',
    innerNavCirclePostButton: '.vk-NewPostButton .vk-NewPostButton',
    innerNavCircleStreamsButton: '.vk-NavStreamsButton .vk-NavStreamsButton',
    notificationCenter: '.rc-NotificationCenterIcon',
    notificationCenterBell: '.notification-center-btn',
    notificationCenterSettings: '._notificationCenterSettings',
    publisherNavLink: '.vk-NavPublisherButton',
    primaryView: '#primaryView',
    settings: '._settings',
    settingsContentScrollDiv: '._settingsContentScrollDiv',
    sidebar: '.sidebar',
    streamsBox: '._streamsScroll ._box',
    streamsContainer: '#streamsContainer',
    streamsNavLink: '.vk-NavStreamsButton',
    streamsSidebarToggle: '._streamsSidebarToggle',
    streamsScroll: '#streamsScroll',
    streamsTabWrapper: '#dashboardTabs .tabsWrapper',
    streamsView: '._streamsView',
});

/** @lends OverlayTriggerApp.prototype */
export default AppBase.extend({
    // Make sure you add a test for each message event verifying that your function is getting triggered
    messageEvents: {
        'address:path:change': 'addressPathChanged',
        'composer:clicked': 'composerClicked',
        'dashboard:load:finished': 'dashboardLoadFinished',
        'socialNetwork:addAccount:success': 'socialNetworkAddedSuccess',
        'socialNetwork:transfer:success': 'socialNetworkTransferSuccess',
        'socialNetwork:addNetwork:modal': 'socialNetworkAddNetworkModal',
        'socialNetwork:addNetworkModal:close': 'socialNetworkAddNetworkModalClose',
        'messageBox:addSn:clicked': 'messageBoxAddSnClicked',

        'message:create': 'messageCreate',

        'sidepanel:stream:added': 'sidepanelStreamAdded',

        'stream:postLoad:complete': 'streamPostLoadComplete',
        'stream:new:add': 'streamNewAdd',
        'streams:onboarding:complete': 'streamsOnboardingComplete',

        // billing paywall events
        'dashboard:paywall:show': 'dashboardPaywallShow',

        // notification center events
        'notificationcenter:notification:new': 'notificationcenterNotificationNew',
        'notificationcenter:settings:clicked': 'notificationcenterSettingsClicked',
        'notificationcenter:notificatonfilters:loaded': 'notificationcenterNotificatonfiltersLoaded',

        // Streams
        'dashboard:streamBuilder:myPostsAndMentions:show' : 'showStreamBuilderMyPostsAndMentions',

        // Onboarding Popovers
        'full_screen_composer:response:message_success': 'handleSuccessfulPost',
    },

    addSnFromMessageBoxClicked: false,
    userClickedNotificationSettings: false,

    notificationcenterSettingsClicked: function () {
        this.userClickedNotificationSettings = true;
    },

    notificationcenterNotificatonfiltersLoaded: function () {
        if (this.userClickedNotificationSettings) {
            // if there is no timeout, you can see a flicker as component is still rendering
            // so just leaving some time for component to render
            setTimeout(this._scrollToNotificationSettings.bind(this), 200);
        }
        this.userClickedNotificationSettings = false;
    },

    _scrollToNotificationSettings: function () {
        var $container = document.querySelector(SELECTORS.settingsContentScrollDiv);
        var $scrollTo = document.querySelector(SELECTORS.notificationCenterSettings);
        if ($container && $scrollTo) {
            var scrollTo = $scrollTo.offsetTop - $container.offsetTop + window.pageYOffset;
            window.scrollTo({ top: scrollTo, behavior: 'smooth' })
        }
    },

    dashboardPaywallShow: function (data) {
        dashboard.showFeatureAccessDeniedPopup(data);
    },

    composerClicked: function () {
    },

    _hideStreamSetup: function (tabId) {
        if (hs.currentTabId === tabId) {
            var $noStreamsView = document.querySelector(SELECTORS.noStreamsView);
            var $streamsView = document.querySelector(SELECTORS.streamsView);
            $noStreamsView.classList.add('u-displayNone');
            $streamsView.classList.remove('u-displayNone');
        }
    },

    socialNetworkAddedSuccess: function () {
        getPrepopulatingStreamsEntitlement(hs.memberId, function (hasEntitlement) {
            if (hasEntitlement && hs.dashboardState === 'streams') {
                memberUtil.storeActionHistoryValue('hasNewPrepopulatedStreams', true);
            }
        });
    },

    socialNetworkTransferSuccess: function () {
    },

    socialNetworkAddNetworkModal: function () {
        // Always reset this on add sn open, to capture the next open event correctly
        this.addSnFromMessageBoxClicked = false;
    },

    socialNetworkAddNetworkModalClose: function () {
        // This is to cover the case if sn transfer happens without opening the add sn modal
        // if not deferred the variables will reset as soon as the add sn modal closes
        // and that will trigger the walkthrough even if triggered through messagebox
        _.defer(function () {
            this.addSnFromMessageBoxClicked = false;
        }.bind(this));
    },

    messageBoxAddSnClicked: function () {
        this.addSnFromMessageBoxClicked = true;
    },

    messageCreate: function () {
    },

    streamNewAdd: function (data) {
        if (data && data.newBoxData) {
            this._hideStreamSetup(data.newBoxData.tabId);
        }
    },

    _checkAndLoadInvites: function () {
        if (hs && hs.memberExtras && hs.memberExtras.hasPendingBoxesToBeCloned) {
            ajaxCall({
                url: '/ajax/member/get-streams-to-be-cloned',
                success: function (data) {
                    if (_.size(data.memberInviteBoxes)) {
                        hootbus.emit('overlay:init', 'modal', 'acceptCloneStreams', {
                            memberInviteBoxes: _.values(data.memberInviteBoxes),
                            senderAvatar: data.senderAvatar
                        });
                    }
                }
            }, 'qm');
        }
    },
    dashboardLoadFinished: function () {
        this._checkAndLoadInvites();
        var oneDayTimeMillis = 1000*60*60*24;
        if ((Date.now() - new Date(hs.memberSignupDate) > oneDayTimeMillis)) {
            this._showOnboardingVideo();
        }

        var urlParams = util.getURLParamsFromHash();
        if (urlParams && urlParams.showStreamBuilder) {
            this.showStreamBuilderMyPostsAndMentions()
        }
    },

    notificationcenterNotificationNew: function () {
        // CUXF-3182: Track events where user has new notifications and the number of users who have seen the
        // bell light up
        trackerDatalab.trackCustom('web.dashboard.notification_center', 'user_has_new_notifications');
        this._showNotificationCenterPopover();
    },

    _showNotificationCenterPopover: function () {
        if (!hs.shouldSeeNotificationCenter) {
            return;
        }

        if (memberUtil.getActionHistoryValue('hasSeenNotificationCenterPopoverV1')) {
            return;
        }

        var disallowedStates = [
            'ads',
            'analytics',
            'newAssignments',
            'ubervu',
        ];

        if (_.contains(disallowedStates, hs.dashboardState)) {
            return;
        }

        memberUtil.storeActionHistoryValue('hasSeenNotificationCenterPopoverV1', 1);
        var popoverParams = {
            content: {
                arrowPosition: {horizontal: '94%'},
                children: translation._('Try our new Notification Center. ' +
                    'Stay up to date on incoming mentions across Twitter, Facebook, and Instagram. ' +
                    'You’ll also be notified about any messages that require your approval.'
                ),
                footer: {
                    footerButtonText: translation._('OK, Got it')
                },
                titleText: translation._('Try the new Notification Center!'),
            },
            followTarget: true,
            hideOnClickSelectors: SELECTORS.notificationCenterBell,
            popoverName: 'popoverNotificationCenter',
            popoverProps: {
                width: 300
            },
            targetElementClass: SELECTORS.notificationCenter,
            tetherOptions: {
                attachment: 'top center',
                targetAttachment: 'bottom center',
                offset: '-5 132',
            },
            tracking: {
                origin: 'web.dashboard.notification_center',
                action: 'popover_dismissed'
            }
        };
        hootbus.emit('overlay:init', 'popover', 'popoverGeneric', popoverParams);
    },

    addressPathChanged: function () {
        // delete current tab id and hideNoStreamView on address path change..
        delete this.currentTabId;
        delete this.hideNoStreamsView;
    },

    streamPostLoadComplete: function () {
        if(!darklaunch.isFeatureEnabled('PGR_722_HS_APP_ONBOARDING')){
            if (
                memberUtil.getActionHistoryValue('shouldSeePrepopulatedStreamsPopover')
            ) {
                var self = this;
                getPrepopulatingStreamsEntitlement(hs.memberId, function (hasEntitlement) {
                    if (hasEntitlement) {
                        self._showPopoverPrepopulatedStreams();
                    }
                });
            }
        }

        // Once streams have finished loading, trigger onboarding if it's in the url
        var urlParams = util.getURLParamsFromHash();
        if (urlParams && urlParams.showWalkthrough) {
            hootbus.emit('overlay:init', 'wizard', urlParams.showWalkthrough);
        }

        if (darklaunch.isFeatureEnabled('PGR_722_HS_APP_ONBOARDING')
            && darklaunch.isFeatureEnabled('PGR_976_RTP_DISCOVERABILITY_STREAMS_POPOVER')
        ) {
            hootbus.emit('dashboard:streamsBuilder:RTPPopover:show', {minimumSignupDate: darklaunch.getFeatureValue('PGR_976_RTP_DISCOVERABILITY_MINIMUM_SIGNUP_DATE')});
        }
    },

    _hideStreamsWelcomePopover: function () {
        hootbus.emit('walkthrough:popover:close');
    },

    _showPopoverPrepopulatedStreams: function () {
        var self = this;

        var popoverCopy = translation._('We\'ve set up your Streams dashboard and organized your social accounts into separate boards. This should make it easier to monitor and engage with published and scheduled content on each social account in one place. Check your boards in the Streams navigation on the left.');
        walkthroughUtils.pollForElement(SELECTORS.streamsBox, function() {
            walkthroughUtils.pollForElement(SELECTORS.streamsNavLink, function() {
                var options = {
                    target: '._box:nth-child(1) ._header',
                    spotlightTargets: [
                        {
                            target: '._box:nth-child(2) ._header',
                            paddingBottom: 400,
                        }
                    ],
                    spotlightPaddingBottom: 400,
                    title: translation._('Your dashboard is ready, %1$s!').replace('%1$s', hs.memberName),
                    description: popoverCopy,
                    placement: 'left-start',
                    hidePrev: true,
                    next: translation._('Ok, got it'),
                    onNext: self._hidePopoverPrepopulatedStreams.bind(self),
                    onExit: self._hidePopoverPrepopulatedStreams.bind(self),
                    showSteps: false,
                    showSpotlight: true,
                    hasExit: false,
                    trackingName: 'prepopulatedStreamsPopover',
                    width: '300px',
                }

                hootbus.emit('overlay:init', 'popover', 'walkthroughPopover', options);
                memberUtil.storeActionHistoryValue('shouldSeePrepopulatedStreamsPopover', false);
            }, 200, 5000);
        }, 200, 5000);
    },

    _hidePopoverPrepopulatedStreams: function () {
        hootbus.emit('walkthrough:popover:close');
    },

    showStreamBuilderMyPostsAndMentions: function () {
        if (hs.dashboardState !== 'streams') {
            window.address.reloadStreams();
        }
        var params = {
            currentStepName: 'multiselect_social_network_type',
            stepCount: 1,
            flow: 'my_posts_and_mentions'
        };
        hootbus.emit('overlay:init', 'wizard', 'streamBuilder', params);
    },

    sidepanelStreamAdded: function (data) {
        if (data) {
            switch (data.flow) {
                // For now, all flows show the same two popovers
                case 'expand_your_audience':
                case 'engage_with_your_audience':
                case 'my_posts_and_mentions':
                case 'my_industry':
                    memberUtil.storeActionHistoryValue('hasCompletedEngagementWalkthrough', 1);
                    break;
            }
        }
    },

    _hideBoostTooltip: function () {
        memberUtil.storeActionHistoryValue('hasSeenBoostTooltip', 1);
        hootbus.emit('popover:generic:close');
    },

    _showOnboardingVideo: function () {
        if (!darklaunch.isFeatureEnabled('VOL_712_ONBOARDING_VIDEO_1') && !darklaunch.isFeatureEnabled('VOL_712_ONBOARDING_VIDEO_2')) {
            return;
        }

        if (memberUtil.getActionHistoryValue('hasSeenOnboardingVideo')) {
            return;
        }

        var variation = darklaunch.isFeatureEnabled('VOL_712_ONBOARDING_VIDEO_1') ? 1 : 2;
        hootbus.emit('overlay:init', 'modal', 'onboardingVideo', {variation: variation});
    },

    handleSuccessfulPost: function (postMessageData) {
        const isFirstPost = !memberUtil.getActionHistoryValue('postScheduledOrSent');

        memberUtil.storeActionHistoryValue('postScheduledOrSent', true);

        if (darklaunch.isFeatureEnabled('PGR_688_FIRST_POST_POPOVER')) {
            if (isFirstPost && postMessageData && postMessageData.messageState) {
                if (document.querySelector(SELECTORS.composer)) {
                    var self = this;
                    hootbus.once('full_screen_composer:response:close:accept', function(){
                        self.triggerFirstPostBehaviour(postMessageData);
                    });
                } else {
                    this.triggerFirstPostBehaviour(postMessageData);
                }
            }
        }
    },

    triggerFirstPostBehaviour: function (postMessageData) {
        var self = this;

        switch (postMessageData.messageState) {
            case "SENT" :
                var postsMetadata = postMessageData.postsMetadata;

                if (postsMetadata) {
                    var postsMetadataBySn = {};

                    postsMetadata.forEach(function (m) {
                        postsMetadataBySn[m.socialProfileId] = m;
                    });

                    var socialProfileIds = Object.keys(postsMetadataBySn);

                    ajaxCall({
                        type: 'GET',
                        url: '/ajax/stream/first-tab-with-sn-post-box?snIds=' +
                        socialProfileIds.join(',')
                    }, 'qm')
                        .done(function (response) {
                            if (response && response.tabId && response.boxId) {
                                var metadata = postsMetadataBySn[response.snId];

                                // No popover if first post is via Instagram mobile notification
                                if (metadata.publishingMode !== 'IG_PUSH') {
                                    //Don't show pre-populated streams popover
                                    memberUtil.storeActionHistoryValue('shouldSeePrepopulatedStreamsPopover', false);

                                    window.address.go('/tabs?id=' + response.tabId, function () {
                                        if (response.boxType === 'L_MY_UPDATES' ||
                                            metadata.hasMedia && response.boxType === 'F_POSTS' ||
                                            metadata.hasMedia && response.boxType === 'L_C_UPDATES' ||
                                            response.boxType === 'SENT'
                                        ) {
                                            //PostId and postUrl are incorrect in these scenarios. Remove this when fixed.
                                            metadata.postId = null;
                                            metadata.postUrl = null;
                                        }

                                        self._showStreamsFirstPostPopover(response.boxId, metadata.postId, metadata.postUrl);
                                    });
                                }
                            }
                        });
                }
                break;
            case "SCHEDULED":
                var messageSendTime = postMessageData.messageSendTime;
                var messageId = postMessageData.messageId;
                var plannerRedirectUrl = '#/planner?date=' + messageSendTime + '&messageId=' + messageId;

                // DL added as a temporary fix to avoid deep linking when already in planner: https://hootsuite.slack.com/archives/C01R0NHAMK6/p1647987277451039.
                if(darklaunch.isFeatureEnabled('PGR_1144_DISABLE_FIRST_POST_ONBOARDING')) {
                    if (hs.dashboardState !== 'planner') {
                        messageSendTime && messageId && util.doRedirect(plannerRedirectUrl);
                        hootbus.once('dashboard:planner:loaded', function(){
                            self._showPopoverFirstPostPlanner(messageId);
                        });
                    }
                } else {
                    messageSendTime && messageId && util.doRedirect(plannerRedirectUrl);
                    if (hs.dashboardState === 'planner') {
                        this._showPopoverFirstPostPlanner(messageId);
                    } else {
                        hootbus.once('dashboard:planner:loaded', function(){
                            self._showPopoverFirstPostPlanner(messageId);
                        });
                    }
                }
                break;
            default:
                break;
        }
    },

    _showPopoverFirstPostPlanner: function (messageId) {
        var messageSelector = function (messageId) {
            if (messageId) {
                return '.vk-TimeSlot [data-message-id="' + messageId + '"]';
            } else {
                return '.vk-TimeSlot [data-message-id]';
            }
        };

        walkthroughUtils.pollForElement('.vk-MessagePreview', function () {
            walkthroughUtils.pollForElement(messageSelector(messageId), function (messageEl) {
                var messageEls = Array.from(messageEl.parentElement.querySelectorAll(messageSelector()));
                var messageIds = messageEls.map(function (el) {
                   return el.dataset.messageId;
                });

                var firstMessageId = messageIds.shift();
                var spotlightTargets = messageIds.map(function (messageId) {
                    return {
                        target: messageSelector(messageId),
                        paddingTop: 8,
                        paddingLeft: 8,
                    };
                });
                let firstName = hs.memberName.split(' ')[0];
                var plannerPopOverTitle = translation._('Post successfully scheduled, %1$s').replace('%1$s', firstName);
                var plannerPopOverDescription = (
                    translation._('Review or edit any of your scheduled posts before they\'re set to go live in your Planner. While you\'re here, another easy way to schedule a post is by selecting a new time in the calendar.')
                );

                var options = {
                    target: messageSelector(firstMessageId),
                    title: plannerPopOverTitle,
                    description: plannerPopOverDescription,
                    next: translation._('OK'),
                    placement: 'right-start',
                    hidePrev: true,
                    showSteps: false,
                    onNext: function () {
                        hootbus.emit('walkthrough:popover:close');
                        // Experiment: Start PGR-1225 / GRW_SS_ENG_PUB_2 Start
                        abtest.getVariation('GRW_SS_ENG_PUB_2', 'PGR_1225_PUBLISHING_REMINDERS') > 0 &&
                            hootbus.emit('dashboard:onboarding:publishingReminders:ctaModal:show')
                    },
                    onExit: function () {
                        // Experiment: Start PGR-1225 / GRW_SS_ENG_PUB_2 Start
                        abtest.getVariation('GRW_SS_ENG_PUB_2', 'PGR_1225_PUBLISHING_REMINDERS') > 0 &&
                            hootbus.emit('dashboard:onboarding:publishingReminders:ctaModal:show')
                    },
                    showSpotlight: true,
                    spotlightPaddingTop: 8,
                    spotlightPaddingLeft: 8,
                    spotlightTargets: spotlightTargets,
                    hasExit: false,
                    trackingName: 'planner_first_post_popover',
                };

                hootbus.emit('overlay:init', 'popover', 'walkthroughPopover', options);
            }, 250, 10000);
        }, 250, 10000);
    },

    /**
     * Show First Popover in streams.
     * If both postId or postUrl is null, render popover for first post the given boxId.
     * @param boxId
     * @param postId - Optional
     * @param postUrl - Optional
     * @private
     */
    _showStreamsFirstPostPopover: function (boxId, postId, postUrl) {
        if (boxId) {
            //Select first message in stream
            var firstPostSelector = '#box' + boxId + ' .rc-MessageContext:first-of-type';

            if (postUrl) {
                firstPostSelector = 'a[href*="' + postUrl + '"]';
            }
            //Twitter posts do not have postUrl
            else if (postId) {
                firstPostSelector = 'a[href*="' + postId + '"]';
            }

            walkthroughUtils.pollForElement(firstPostSelector, function () {
                if (postId || postUrl) {
                    //Attach class to first post element
                    document.querySelector(firstPostSelector).closest('.rc-MessageContext').classList.add('firstPost');
                    firstPostSelector = '.firstPost';
                }

                var streamsPopOverTitle = translation._('Post successfully published, %1$s!').replace('%1$s', hs.memberName)
                var streamsPopOverDescription = (translation._('You\'ve officially published your first post with Hootsuite!') +
                    '\n\n' +
                    translation._('Keep track of your published posts and respond to comments here in Streams.') +
                    '\n\n' +
                    translation._('Next, try scheduling your first post. It\'s a great way to save time while keeping your social presence active.')
                );

                var options = {
                    target: firstPostSelector,
                    title: streamsPopOverTitle,
                    description: streamsPopOverDescription,
                    placement: 'right-start',
                    hidePrev: true,
                    next: translation._('OK'),
                    onNext: function () {
                        hootbus.emit('walkthrough:popover:close');
                        // Experiment: Start PGR-1225 / GRW_SS_ENG_PUB_2 Start
                        abtest.getVariation('GRW_SS_ENG_PUB_2', 'PGR_1225_PUBLISHING_REMINDERS') > 0 &&
                            hootbus.emit('dashboard:onboarding:publishingReminders:ctaModal:show')
                    },
                    onExit: function () {
                        // Experiment: Start PGR-1225 / GRW_SS_ENG_PUB_2 Start
                        abtest.getVariation('GRW_SS_ENG_PUB_2', 'PGR_1225_PUBLISHING_REMINDERS') > 0 &&
                            hootbus.emit('dashboard:onboarding:publishingReminders:ctaModal:show')
                    },
                    showSteps: false,
                    showSpotlight: true,
                    hasExit: false,
                    trackingName: 'streams_first_live_post_popover',
                };

                hootbus.emit('overlay:init', 'popover', 'walkthroughPopover', options);
            }, 250, 10000);
        }
    },
});
