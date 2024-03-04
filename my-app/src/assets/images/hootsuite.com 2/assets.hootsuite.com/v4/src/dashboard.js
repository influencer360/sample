import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import _ from 'underscore';

import { CUSTOM_APPROVALS } from 'fe-lib-entitlements';
import { hasEntitlement } from 'fe-pnc-data-entitlements';
import { OrgSuspendedBanner } from 'fe-pnc-comp-org-suspended-banner';
import { PENDO_TARGETS } from 'fe-lib-pendo';
import { env, PRODUCTION } from 'fe-lib-env'
import { getEntitlementsByFeatureCode } from 'utils/entitlements';

import hsEjs from 'utils/hs_ejs';
import wizardHelper from 'utils/wizard';
import tooltip from 'utils/tooltip';
import tooltip2 from 'utils/tooltip2';
import memberUtil from 'utils/member';
import util from 'utils/util';
import hootbus from 'utils/hootbus';
import app from './app';
import config from 'config';
import snActions from 'apps/social-network/actions';
import translation from 'utils/translation';
import localCache from 'utils/local-cache';
import trackerDatalab from 'utils/tracker-datalab';
import serverTime from 'utils/server-time';
import darklaunch from 'utils/darklaunch';
import events from 'hs-events';
import cookie from 'utils/cookie';
import coreViewUtils from './dashboard/utils/core-view';
import domUtils from 'hs-nest/lib/utils/dom-utils';
import bulkComposerCtaPopover from 'components/publisher/bulk-composer-cta-popover/bulk-composer-cta-popover';
import ajaxHandlers from 'core/ajax-handlers';
import renderBulkComposerOptIn from 'components/publisher/render-bulk-composer-optin-modal/render-bulk-composer-optin-modal';
import PublisherConstants from 'components/publisher/constants';
import appDirectoryLoader from 'appdirectory/section-loader';
import socialNetworkActions from 'core/social-network/actions';
import socialNetworkConstants from 'core/social-network/config';
import adAccountsModalService from 'hs-app-organizations/utils/ad-accounts-modal-service';
import zIndexConstants from 'hs-nest/lib/constants/z-index';
import renderBanner from 'components/render-banner';
import renderExpirationBanner from 'social-network-expiration/components/render-expiration-banner';
import renderMobileBackendBanner from 'components/billing/render-mobile-backend-billing-banner';
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise';
import { displayOneOffBrand2020RefreshCallout } from 'publisher/components/ui-refresh-helpers';
import plans from 'plans';
import qs from 'dashboard/quick-search';
import { initSentry } from 'sentry/init';
import { initPendo } from 'apps/pendo/init';
import { init as initFullStory } from 'fullstory/init';
import { asyncStreamLoader } from 'stream/components/streams-loader';
import baseFlux from 'hs-nest/lib/stores/flux';
import { MEMBER } from 'hs-nest/lib/actions';
import settings from './settings/settings';
import { redirectToAccountSetup, shouldRedirectToAccountSetup } from './router/utils/account-setup-redirect';

import { relativeTimeInWords } from 'utils/string';
import { isTikTokEnabled } from 'fe-lib-darklaunch'
import { get, set } from 'fe-lib-localstorage';
import { types as snTypes } from 'hs-nest/lib/constants/social-networks';
import hsAppOnboardingLoader from 'apps/hs-app-onboarding/hs-app-onboarding-loader';
import { initFluxBridge } from 'dashboard/flux-bridge';

import 'components/publisher/publisher-global-less';
import 'utils/form-token'; // has a side effect: sets up a hidden input
import 'utils/user-status'; // has a side effect: sets up an hs object value

// publisher events
import { initPublisherEventListeners } from 'publisher/components/publisher-component-listeners';

import { mount as MountPublisherHeader } from 'publisher/components/publisher-header';
import { mount as MountGlobalNavigation } from 'dashboard/components/global-navigation';

import { getApp } from 'fe-lib-async-app';

import '3rd/jquery-ui';

import coreViewsApp from './dashboard/core-views-app';
import Icon from '@fp-icons/icon-base';
import SearchIcon from '@fp-icons/emblem-magnify';
import appdirectoryAppItemTemplate from '../templates/appdirectory/app-item.ejs';
import { showBulkScheduleDialog } from './message_box';
import inAppPaymentWizardInit from 'in-app-payment-wizard/components/loader';
import adComposerInit from 'hs-app-ad-composer/components/loader';

var dashboard = {};

const LATEST_ACTIVE_TAB_ID = "latestActiveTabId";

dashboard.init = function () {
    if (shouldRedirectToAccountSetup()) {
        redirectToAccountSetup();
        return;
    }

    var $container = $('#container');

    initSentry();
    initPendo();
    inAppPaymentWizardInit();
    adComposerInit();

    if(darklaunch.isFeatureEnabledOrBeta('PROM_5508_FULL_STORY')){
        initFullStory({
            devMode: env() !== PRODUCTION,
            userId: hs.memberId
        });
    }

    MountGlobalNavigation('globalNavigation');

    if (darklaunch.isFeatureEnabledOrBeta('PUB_31583_PRELOAD_PLANNER_BUNDLE')) {
        if (!window.hs?.prevDashboardUrl && window.location.hash.includes('#/planner')) {
            // Preload Planner bundle before Composer bundle when directly loading Planner.
            // The Composer bundle is loaded right after the Planner bundle in planner-loader.jsx.
            getApp('hs-app-planner');
        } else {
            // pre-load the composer bundle to improve initial load time
            getApp('hs-app-composer');
        }
    } else {
        // pre-load the composer bundle to improve initial load time
        getApp('hs-app-composer');
    }

    // Loads hs-app-onboarding and the Getting Started Guide
    if (darklaunch.isFeatureEnabled('PGR_722_HS_APP_ONBOARDING')) {
        hsAppOnboardingLoader.loadApp();
    }

    const EMAIL_DOMAIN_REGEX = /@hootsuite.com\s*$/
    const shouldLoadQAHelperApp = email => EMAIL_DOMAIN_REGEX.test(email) && localStorage.getItem('hootsuiteDevTools')
    if (shouldLoadQAHelperApp(hs.memberEmail)) {
        getApp('hs-app-qa-helper').then(function (app) {
            app.init();
        });
    }

    if (darklaunch.isFeatureEnabled('GLOB_1_NAV_PERFORMANCE_METRICS')) {
        $(window).load(function () {
            var timing = window.performance.timing;
            var basicLoad = timing.domComplete - timing.fetchStart;
            if (basicLoad >= 0) {
                hs.util.recordAction('timeToBasicLoad', {
                    value: basicLoad,
                    statType: 'timing',
                    splitByLocation: true,
                });
            }

            var basicLoadLatencyAccounted = timing.domComplete - timing.responseStart;
            if (basicLoadLatencyAccounted >= 0) {
                hs.util.recordAction('timeToBasicLoadLatencyAccounted', {
                    value: basicLoadLatencyAccounted,
                    statType: 'timing',
                    splitByLocation: true,
                });
            }
        });
    }

    hootbus.on('toggleCoreViews:primary', function () {
        window.unlockStreamScreen(true);
    });

    hootbus.on('toggleCoreViews:secondary', function () {
        pauseStreamScreen();

        const STREAMS = 'streams'
        if (hs.prevDashboardState === STREAMS && hs.dashboardState !== STREAMS) {
            // Remove Streams from the DOM when navigating to another app
            hootbus.emit("toggleCoreViews:primary", { content: '' });
        }
    });

    coreViewsApp();

    ajaxHandlers.init();

    // Define all constants
    config.init();

    // TODO: Move state variables to their respective components
    // Define state-holding globals
    hs.windowHasFocus = true;

    hs.windowWidth = $(window).width();

    hs.transferInProgress = false;

    hs.trendDescriptions = {};
    // Twitter promoted Tweets and Trends variables
    hs.promotedTrends = {};

    hs.pendingAdReload = false;
    hs.waffle = (document.location.href.substr(-6, 6) === 'waffle');

    if (hs.profiler && _.isFunction(hs.profiler.init)) {
        hs.profiler.init();
    }

    $(window)
        .focus(function () {
            if (hs.dashboardState) {
                hs.windowHasFocus = true;
            }
        })
        .blur(function () {
            hs.windowHasFocus = false;
        });

    window.address.init();

    //run local storage garbage collection at 50% probability
    if (Math.floor(Math.random() * 2) === 0) {
        setTimeout(localCache.gc, 10 * 1000);
    }

    //ping server every x minutes, so server knows if this user is active
    dashboard.startPingTimer();

    // resize to handle new fixed
    _.defer(window.resizeUpdate);

    dashboard.initDatePicker();

    tooltip.init(); //attach tooltips
    tooltip2.init();

    serverTime.init();
    trackerDatalab.init('body');


    /**
     * Binds on body element
     * to maintain [jquery .live|.delegate] behaviour
     * element must exist when function is bound thus [body]
     */
    $('body')
        .on('click', this, function () {
            if (!hs.windowHasFocus) {
                if (hs.dashboardState) {
                    hs.windowHasFocus = true;
                    document.title = 'Hootsuite';
                }
            }
        })
        .on('mouseenter', '._dragUser[title]', function () {
            window.makeUserDraggable(this);	//make all twitter usernames / profile images draggable for groups
        })
        // make all twitter username links clickable and show info popup
        .on('click', '._userInfoPopup', function (e) {
            stream.network.showUserInfo.apply(this, [e]);
            e.preventDefault();
        })
        .on('click', '._view_relationships', function (e) {
            stream.network.showRelationshipInfoPopup.apply(this, [e]);
            e.preventDefault();
        })
        .on('click', '._follow_btn', function () {
            var $this = $(this);
            var params = {};

            if ($this.hasClass('_unfollowAccount')) {
                params.on = 0;
            } else {
                params.on = 1;
            }

            params.userId = $this.attr('data-userid') ?? window.stream.network.relationshipUserId;
            params.screenName = $this.attr('data-screenname') ?? window.stream.network.relationshipUser;
            params.sid = $this.attr('data-snid');

            ajaxCall({
                type: 'POST',
                url: "/ajax/twitter/toggle-follow",
                data: params,
                success: function (data) {
                    if (data.success) {
                        var $innerLabel = $this.find('._label');

                        if (params.on === 1) {
                            $innerLabel.text(translation._("Unfollow"));
                            $this.addClass('_unfollowAccount');
                            params.on = 0;
                        } else {
                            $innerLabel.text(translation._("Follow"));
                            $this.removeClass('_unfollowAccount');
                            params.on = 1;
                        }
                    }
                },
                complete: function () {
                },
                abort: function () {
                }
            }, 'qm');
        })
        .on('click', '._companyInfoPopup', function (e) {
            stream.network.showUserInfo.apply(this, [e, 'company']);
            e.preventDefault();
        })
        // Image Preview popup, for all <img> wrapped with <a> and a has class "_imgPreviewPopup"
        .on('click', '._imgPreviewPopup', function (e) {
            e.preventDefault();
            stream.stream.showGalleryPopup({
                displayImg: 0,
                imgArray: [
                    {
                        src: $(this).attr('imgSrc')
                    }
                ]
            });
        })
        // Multiple Image Preview popup, for <a> elements of class "_imgGalleryPopup" and data-imgSrc
        .on('click', '._galleryPreviewPopup', function (e) {
            e.preventDefault();
            var $galleryElement = $(this);
            var imgArray = $galleryElement.closest('._message').data('attached-images');
            if (!_.isArray(imgArray)) {
                imgArray = $galleryElement.parent().find('._galleryPreviewPopup').map(
                    function () {
                        return ($(this).data('imgsrc'));
                    }
                ).toArray();
            }
            var imgSrc = $galleryElement.data('imgsrc');
            var displayImg = _.map(imgArray, function (img) {
                return _.isObject(img) ? _.result(img, 'src') : img;
            }).indexOf(imgSrc);

            stream.stream.showGalleryPopup({
                imgArray: imgArray,
                displayImg: displayImg > -1 ? displayImg : 0
            });
        })
        .on('click', '._addSocialNetworkWarningBtn', function () {
            snActions.add();
            ajaxCall({
                url: '/ajax/twitter/log-add-sn-warning'
            }, 'qm');
        })
        // prevent all # links from going to top
        .on('click', 'a[href=#]', function (e) {
            e.preventDefault();
        })

        // Simple Drop-down
        $('body').on('click', '._sddWrapper ._sddButton', function (e) {
            var $trigger = $(e.target);
            var $wrapper = $trigger.closest('._sddWrapper');
            var $wrapperClassList = $wrapper[0].classList.value.replace(/ /g,'');
            var $target = $wrapper.find('._sddMenu');

            if (!$target.is(':visible')) {
                setTimeout(function () {
                    $('body').unbind('click.' + $wrapperClassList).bind('click.' + $wrapperClassList, function () {
                        $('body').unbind('click.' + $wrapperClassList);
                        $target.hide();
                    });
                }, 1);
            }

            $target.toggle();
        });

    // make the on/off sliding toggle buttons
    $container
        .delegate('._slideToggle', 'click', function () {
            var $toggle = $(this),
                $left = $toggle.find('.btn-lite-sta.btn-l'),
                $right = $toggle.find('.btn-lite-sta.btn-r'),
                $activeElement = $left.is('.active') ? $left : $right,
                $inactiveElement = $left.is('.active') ? $right : $left;

            $activeElement.removeClass('active').find('span').addClass('visHide');
            $inactiveElement.addClass('active').find('span').removeClass('visHide');
        });


    $container.find('._tweet4Help').click(function () {
        var HOOTBUS_EVENT_OPEN_COMPOSER = 'composer.open';
        var params = {
            messageText: translation._('@Hootsuite_Help can you help me with ')
        };
        hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, params);
    });

    dashboard.initMessageMenus();

    // finally call post dashboard load
    dashboard.postDashboardLoad();

    // prevent firefox to close websockets on ESC
    if (window.addEventListener) {
        window.addEventListener('keydown', function (e) {
            (e.keyCode === 27 && e.preventDefault());
        });
    }

    $(window).bind("online offline", function (e) {
        if (e.type === "online") {
            hootbus.emit(hs.c.eventBrowserOnline);
        } else if (e.type === "offline") {
            hootbus.emit(hs.c.eventBrowserOffline);
        }
    });

    // Activate new service functionality
    app.init();

    // social networks related setup
    hootbus.on('socialNetwork:refresh:success', dashboard.onSocialNetworkRefresh);

    hootbus.on('boost:auth:facebook', function () {
        socialNetworkActions.authorize(socialNetworkConstants.c.FACEBOOK);
    });
    
    hootbus.on('boost:auth:facebookprofile', function (socialNetworkId) {
        adAccountsModalService.openAddAdAccountsModal(hs.memberId, socialNetworkId, socialNetworkConstants.c.FACEBOOKPAGE, function () {});
    });

    hootbus.on('boost:auth:linkedin', function () {
        socialNetworkActions.authorize(socialNetworkConstants.c.LINKEDIN);
    });

    hootbus.on('boost:auth:linkedinprofile', function (socialNetworkId) {
        adAccountsModalService.openAddAdAccountsModal(hs.memberId, socialNetworkId, socialNetworkConstants.c.LINKEDINCOMPANY, function () {});
    });

    hootbus.on('boost:auth:instagram', function () {
        socialNetworkActions.authorize(socialNetworkConstants.c.INSTAGRAMBUSINESS);
    });

    hootbus.on('boost:auth:instagramprofile', function (socialNetworkId) {
        adAccountsModalService.openAddAdAccountsModal(hs.memberId, socialNetworkId, socialNetworkConstants.c.INSTAGRAMBUSINESS, function () {});
    });


    hootbus.on('boost:auth:twitter', function () {
        socialNetworkActions.authorize(socialNetworkConstants.c.TWITTER);
    });    
    hootbus.on('boost:auth:twitterprofile', function (socialNetworkId) {
        adAccountsModalService.openAddAdAccountsModal(hs.memberId, socialNetworkId, socialNetworkConstants.c.TWITTER, function () { });
    });

    initFluxBridge();

    // Only for dispatching events in the smoke tests, import hootbus when you need it!
    window.smokebus = hootbus;

    var parent = document.getElementById('dashboardBanner');
    renderBanner(parent); // Renders the active banner, if there is one

    hootbus.on('frontend.logging', function (level, category, message, data) {
        ajaxPromise({
            method: 'POST',
            url: '/ajax/error/frontend-logging',
            data: {
                level: level,
                category: category,
                message: message,
                additionalData: data
            }
        }, 'qm');
    });

    hootbus.on('frontend.recording', function (action, options) {
        var recordingOptions = _.extend({}, options, { useEventAsName: true });
        hs.util.recordAction(action, recordingOptions, undefined);
    });

    initPublisherEventListeners();

    // Tracking for Composer New Post button
    $('.vk-NewPostButton').live('click', function () {
        trackerDatalab.trackCustom('web.dashboard.header.compose_button', 'compose_new_message_from_source_page', {
            sourcePage: hs.dashboardState
        });
    });

    document.getElementsByTagName('html')[0].classList.add('-brandRefresh');

    const orgSuspendedBanner = document.getElementById('orgSuspendedBanner');
    if (orgSuspendedBanner) {
        const onBannerShown = function () { hs.memberExtras.isOrgSuspendedBannerShown = true; }
        ReactDOM.render(
            React.createElement(OrgSuspendedBanner, {
                onBannerShown: onBannerShown,
                timezoneName: hs.timezoneName,
            }),
            orgSuspendedBanner
        );
    }

    if (cookie.read('showBillingMobileBackendBanner')) {
        const mobileBackendBillingBanner = document.getElementById('mobileBackendBillingBanner');
        renderMobileBackendBanner(mobileBackendBillingBanner);
    }
};

dashboard.initDatePicker = function () {
    $.datepicker.setDefaults({
        dateFormat: 'yy-mm-dd',
        altFormat: 'yy-mm-dd',
        showAnim: 'fadeIn',
        duration: 'fast',
        showOn: "both",
        buttonImage: hs.util.rootifyImage("/icons/small_calendar.png"),
        buttonImageOnly: false,
        mandatory: true,
        initStatus: translation._("Select a Date"),
        beforeShow: $.noop,
        monthNames: translation.c.MONTH_NAMES,
        monthNamesShort: translation.c.MONTH_NAMES_SHORT,
        dayNames: translation.c.DAY_NAMES,
        dayNamesShort: translation.c.DAY_NAMES_SHORT,
        dayNamesMin: [translation._("Su"), translation._("Mo"), translation._("Tu"), translation._("We"), translation._("Th"), translation._("Fr"), translation._("Sa")],
        weekHeader: translation._("Wk"),
        currentText: translation._("Today"),
        closeText: translation._("Done"),
        prevText: translation._("Prev"),
        nextText: translation._("Next"),
        firstDay: 0,
        isRTL: false,
        showMonthAfterYear: (hs.prefs.language === 'jp'),
        onChangeMonthYear: null
    });
};

dashboard.initMessageMenus = function () {
    var fnShowMessageMenu = function () {
            if (!hs.$lastMenu && hs.stopMessageMenuEvent) {
                return;
            }

            var $messageDiv = $(this),
                $box = $messageDiv.closest('div._box'),
                boxType = $box.box('get', 'type') || '',
                $messageMenu = $box.find('._options');

            //if this is Facebook Private Messages box hide action items from main thread view (only allow in conversation view)
            if (boxType === 'F_ACTIVITY' && !$messageDiv.parent().hasClass('_inStreamCommentsBody')) {
                return;
            }

            if (!$messageMenu.length) {
                return false;
            }
            $messageMenu.show().removeClass('offScreen');

            if (hs.$lastMenu && hs.$lastMenu.length) {
                // hide the last one & remove any display classes to restore initial display
                hs.$lastMenu.css({top: '-999px'})
                    .find('._moreMenu, ._markResolved').hide();

                hs.$lastMenu = null;
            }

            if (hs.stopMessageMenuEvent) {
                return;
            }

            hs.currentMessage = $messageDiv;
            hs.currentMessageDivId = $messageDiv.attr('id');
            hs.$lastMenu = $messageMenu;

            // work with only the message menu in our column
            var offset = 5,
                top = $messageDiv.position().top,
                $fav = $messageMenu.find('._fav'),
                $sharePopupLink = $messageMenu.find('._sharePopup');

            $messageMenu.css("top", top + offset + "px");	//show the menu directly over the placeholder

            // handle favorite button
            if ($fav.length) {
                var isFav = parseInt($messageDiv.data('fav'), 10) === 1 || $messageDiv.data('fav') === true;
                var favClass;
                // handle facebook "likes"
                if (boxType.indexOf('F_') === 0 || boxType.indexOf('L_') === 0 || boxType.indexOf('I_') === 0) {
                    var favTitle = isFav ? translation._('Unlike') : translation._('Like');
                    favClass = isFav ? 'like' : 'unLike';

                    $fav.removeClass('like unLike').addClass(favClass);

                    if ($fav.hasClass('_jsTooltip')) {
                        $fav.attr('title', favTitle).data('title', favTitle);
                    }
                } else {
                    favClass = isFav ? 'favorite' : 'notFavorite';
                    $fav.find('span').removeClass('favorite notFavorite').addClass(favClass);
                }
            }

            if ($sharePopupLink.length) {
                $messageDiv.data('can-be-shared') ? $sharePopupLink.show() : $sharePopupLink.hide();
            }

            // handle promoted tweets
            if ($messageDiv.data('impressionId')) {
                $messageDiv.addClass('message-promoted');
                $messageMenu.addClass('promoMessageOptions')
                    .find('._turnOffAds').css({display: 'block'}).end()
                    .find('._turnOffAdsButton').css({display: 'block'});

            } else {
                $messageMenu.removeClass('promoMessageOptions')
                    .find('._turnOffAds').hide().end()
                    .find('._turnOffAdsButton').hide();
            }

        },
        fnHideMessageMenu = function (ev) {
            if (hs.stopMessageMenuEvent) {
                return;
            }

            var $messageDiv = $('#' + hs.currentMessageDivId);
            if (ev) {
                var relatedTarget = $(ev.relatedTarget);
                if ((relatedTarget.hasClass('_options') || relatedTarget.closest('._options').length) ||
                    (relatedTarget.hasClass('_message') || relatedTarget.closest('._message').length)) {
                    if (relatedTarget.hasClass('_message') || relatedTarget.closest('._message').length) {
                        if ($messageDiv.hasClass('message-promoted')) {
                            $messageDiv.removeClass('message-promoted');	// remove class from promoted tweets if moved off, but not for menu
                        }
                    }
                    return false;
                }
            }

            if (hs.$lastMenu && hs.$lastMenu.length > 0) {
                hs.$lastMenu.css({top: '-999px'});

                if ($messageDiv.hasClass('message-promoted')) {
                    // remove class from promoted tweets
                    $messageDiv.removeClass('message-promoted');
                }
                $messageDiv.closest('div._box')
                    .find('._options ._turnOffAds').hide().end()
                    .find('._options ._turnOffAdsButton').hide();
            }
        },
        fnShowSearchTweetMenu = function () {
            var $messageDiv = $(this);

            // Make sure this isn't a Facebook message.
            if ($messageDiv.is('.facebookMessage')) {
                return;
            }

            var messageDivId = $messageDiv.attr('id'),
                scrollTop = $messageDiv.closest('div._body').scrollTop(),
                $messageMenu = $messageDiv.closest('div._body').find('._options');

            hs.currentMessage = $messageDiv;
            hs.currentMessageDivId = messageDivId;
            hs.$lastMenu = $messageMenu;

            var top = $messageDiv.position().top + scrollTop + 8;

            $messageMenu.css({
                "top": +top + "px",
                "right": "30px"
            });   //show the menu directly over the placeholder

            var favClass = $messageDiv.data('fav') === '1' ? 'favorite' : 'notFavorite';
            $messageMenu.find('._fav span').removeClass('favorite notFavorite').addClass(favClass);

            // handle promoted tweets
            if ($messageDiv.data('impressionId')) {
                $messageDiv.addClass('message-promoted');
            }
        };

    // message menu binds
    $('#streamsContainer div._message, #twitterUserInfoPopup div._message')
        .live("mouseenter", fnShowMessageMenu)
        .live("mouseleave", fnHideMessageMenu);

    // search popup message menu binds
    $('#quickSearchPopup div._message')
        .live("mouseenter", fnShowSearchTweetMenu)
        .live("mouseleave", fnHideMessageMenu);
};

//ping server every x minutes
dashboard.startPingTimer = function () {
    hs.timers.pingServer = setInterval(member.pingServer, hs.c.pingServerInterval);
};

//stop pinging servers
dashboard.stopPingTimer = function () {
    if (hs.timers.pingServer != null) {
        clearTimeout(hs.timers.pingServer);
        delete hs.timers.pingServer;
    }
};
dashboard.loadPublisherAjaxCallBack = function (data, callback, bulkScheduleFeature = 1) {
    if (hs.dashboardState !== 'publisher') {
        // only proceed if the same section is still up
        return;
    }
    var $secondaryView = coreViewUtils.getjQueryElement();

    hootbus.emit('toggleCoreViews:secondary', { content: data.output });

    const showBulkScheduleDialogBtn = $secondaryView.find('._showBulkScheduleDialogBtn')


    if (bulkScheduleFeature === 0) {
        const domShowBulkScheduleDialogBtn = showBulkScheduleDialogBtn[0]
        domShowBulkScheduleDialogBtn.setAttribute("data-dap-target", PENDO_TARGETS.BULK_MESSAGE_SCHEDULING)
        showBulkScheduleDialogBtn.bind('click', () => undefined)

    } else {

        showBulkScheduleDialogBtn.bind('click', function () {
            $('body').trigger('mousedown.messageBoxCollapse');
            showBulkScheduleDialog();
        });
    }

    $secondaryView.find('._changeTimezoneBtn').bind('click', function () {
        window.loadSettings('account');
    });

    if (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_SHOW_TRY_BUTTON') || (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_SHOW_TRY_BUTTON_BETA') && darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_SHOW_TRY_BUTTON_BETA_PERCENTAGE'))) {
        var $tryBulkComposerButton = $secondaryView.find('._tryBulkComposerButton:visible');
        var $bulkComposerButton = $secondaryView.find('._bulkComposerButton:visible');
        var bulkComposerVersion = hs.memberExtras.bulkComposerVersion ? parseInt(hs.memberExtras.bulkComposerVersion, 10) : 0;

        if (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_REMOVE_BETA')) {
            var canShowPopover = true;

            if (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_FULL_ENABLE_MINIMUM_MEMBER_ID')) {
                // New users above a certain member ID should never see version popovers
                var memberIdAsInt = parseInt(hs.memberId, 10);
                var minimumMemberId = parseInt(darklaunch.getFeatureValue('PUB_BULK_COMPOSER_FULL_ENABLE_MINIMUM_MEMBER_ID'), 10);
                canShowPopover = isNaN(minimumMemberId) || memberIdAsInt < minimumMemberId;
            }

            if (canShowPopover) {
                if ($tryBulkComposerButton.length) {
                    bulkComposerCtaPopover.render($tryBulkComposerButton.get(0), hs.memberExtras.hasSeenBulkComposerCtaPopover, bulkComposerVersion >= PublisherConstants.BULK_COMPOSER.VERSION);
                } else if ($bulkComposerButton.length) {
                    bulkComposerCtaPopover.render($bulkComposerButton.get(0), true, bulkComposerVersion >= PublisherConstants.BULK_COMPOSER.VERSION);
                }

                $tryBulkComposerButton.click(function (e) {
                    e.preventDefault();
                    renderBulkComposerOptIn();
                });
            }
        } else {
            if ($tryBulkComposerButton.length) {
                bulkComposerCtaPopover.render($tryBulkComposerButton.get(0), hs.memberExtras.hasSeenBulkComposerCtaPopover, bulkComposerVersion >= PublisherConstants.BULK_COMPOSER.VERSION);
            } else if ($bulkComposerButton.length) {
                bulkComposerCtaPopover.render($bulkComposerButton.get(0), true, bulkComposerVersion >= PublisherConstants.BULK_COMPOSER.VERSION);
            }

            $tryBulkComposerButton.click(function (e) {
                e.preventDefault();
                renderBulkComposerOptIn();
            });
        }
    }

    publisher.init();

    window.updateDashboardHeight();
    window.updateDashboardWidth();
    window.stopTabRefreshTimer();
    window.stopUserInactiveTimer();

    hootbus.emit('dashboard:publisher:loaded');
    $.isFunction(callback) && callback();
};
dashboard.loadPublisher = function (section, params) {
    hs.publisher.updatePageTitle(section, params.hasCustomApprovals);

    hootbus.once('address:path:change', () => {
        const path = window.location.href.split('#').slice(-1)[0];
        if (!/^\/publisher/.test(path)) {
            document.title = 'Hootsuite';
        }
    })

    MountPublisherHeader('publisher');

    if ($('#schedulerSection').length || $('#publisherSection').length) {
        publisher.loadSection(section, params);
    } else {
        var callback = function () {
            publisher.loadSection(section, params);
        };

        if (hs.dashboardState === 'publisher') {
            $.isFunction(callback) && callback();
            return;
        }

        hs.dashboardState = 'publisher';

        ajaxCall({
            type: 'GET',
            url: "/ajax/publisher/home",
            beforeSend: function () {
                hs.statusObj.update(translation.c.LOADING, 'info');
            },
            success: function (data) {
                getEntitlementsByFeatureCode(hs.memberId, 'BULK_SCHEDULE').then(({ permission }) => {
                    dashboard.loadPublisherAjaxCallBack(data, callback, permission.value)
                }).catch(() => dashboard.loadPublisherAjaxCallBack(data, callback))
            },
            complete: function () {
                hs.statusObj.reset();
                // If we are still in publisher, display a one-off info message for UI Refresh
                if (hs.dashboardState === 'publisher') {
                    displayOneOffBrand2020RefreshCallout()
                }
            },
            abort: function () {
                hs.statusObj.reset();
            }
        }, 'abortOld');
        return false;
    }
};

dashboard.loadOrganizations = function (section, params) {

    // check if user is coming from team invitation email
    if (location.hash.indexOf('invite-accepted') > -1) {
        trackerDatalab.trackCustom('web.dashboard.member', 'accept_team_invitation_existing_user');
    }

    var postLoad = function () {
        hs.dashboardState = 'organizations';

        teammanagement.loadSection(section, params, function () {
            window.resizeUpdate();
            var urlParams = util.getURLParamsFromHash();
            if (urlParams && urlParams.showWalkthrough) {
                setTimeout(function () {
                    // This timeout was added because the walkthrough gets shifted up and off the add SN button after load
                    hootbus.emit('overlay:init', 'wizard', urlParams.showWalkthrough);
                }, 900);
            }
        });
        return false;
    };

    hs.require('teammanagement', postLoad);
};


window.populateAppList = function (query) {
    if (typeof window.$appDirectoryPopup === 'undefined') {
        return;
    }

    if (typeof query.section !== 'undefined') {
        if (query.section === 'app-details') {
            window.$appDirectoryPopup.find('._app_filter_controls').hide();
        } else {
            window.$appDirectoryPopup.find('._app_filter_controls').show();
        }
    }

    var $appListContainer = window.$appDirectoryPopup.find('._appList');

    //Retrieve current query criteria from the DOM attributes.
    var currentSection = window.$appDirectoryPopup.attr('section');
    var currentSearchQuery = window.$appDirectoryPopup.attr('searchQuery');
    var currentComponentType = window.$appDirectoryPopup.attr('componentType');

    //Inherit existing criteria if it is not provided
    if (typeof query.section === 'undefined') {
        query.section = currentSection;
    }
    if (typeof query.searchQuery === 'undefined') {
        query.searchQuery = currentSearchQuery;
    }
    if (typeof query.componentType === 'undefined') {
        query.componentType = currentComponentType;
    }

    //sanitize the query
    query.section = typeof query.section === 'undefined' ? '' : query.section;
    query.searchQuery = typeof query.searchQuery === 'undefined' ? '' : query.searchQuery;
    query.componentType = typeof query.componentType === 'undefined' ? '' : query.componentType;


    var fetchAppList = function (query) {
        var throbbingLoaderHTML = '<div class="rc-ThrobbingLoader _throbbingLoader" style="width: 20%; margin-left: 50%; margin-top: 20px; margin-bottom: 20px;"><div></div><div></div><div></div></div>';
        $appListContainer.find('._throbbingLoader').remove();
        $appListContainer.append(throbbingLoaderHTML);

        var fetchAppPromise = ajaxCall({
            type: 'GET',
            preventDoubleRequests: false,
            url: "/ajax/appdirectory/index",
            data: query
        }, 'qm');


        return fetchAppPromise;
    };


    if (query.section !== currentSection || query.searchQuery !== currentSearchQuery || query.componentType !== currentComponentType) {
        //Save the query in App Directory Popup DOM attributes to avoid using global variables
        //Those attributes can be converted to React State in the future.
        window.$appDirectoryPopup.attr('section', query.section);
        window.$appDirectoryPopup.attr('searchQuery', query.searchQuery);
        window.$appDirectoryPopup.attr('componentType', query.componentType);
        $appListContainer.html('');
        $appListContainer.unbind('scroll');

        query.page = 1;

        var fetchAppListInProgress = true;
        var appListCompletelyLoaded = false;


        var loadApps = function () {
            var fetchAppPromise = fetchAppList(query);

            fetchAppPromise.done(function (result) {
                if (!window.$appDirectoryPopup) {
                    return;
                }

                //If user has changed the section, keywords or component filter during the ajax request, ignore the result
                var currentSection = window.$appDirectoryPopup.attr('section');
                var currentSearchQuery = window.$appDirectoryPopup.attr('searchQuery');
                var currentComponentType = window.$appDirectoryPopup.attr('componentType');
                if (query.section !== currentSection || query.searchQuery !== currentSearchQuery || query.componentType !== currentComponentType) {
                    $appListContainer.find('._throbbingLoader').remove();
                    return;
                }

                //Handle empty list
                if (result.page.totalRecords === 0) {
                    $appListContainer.append('<div class="appNotFound">' + translation._('No apps found in this category.') + '</div>');
                    $appListContainer.find('._throbbingLoader').remove();
                    return;
                }

                var apps = result.data;
                var appItems = '';
                var isFreeUser = hs.memberMaxPlanCode === 'FREE';

                _.each(apps, function (app) {

                    if (app.creator) {
                        app.authorName = app.creator;
                    } else if (app.appProviderCompany) {
                        app.authorName = app.appProviderCompany;
                    } else if (app.appProviderName) {
                        app.authorName = app.appProviderName;
                    } else {
                        app.authorName = "--";
                    }


                    if (app.creatorUrl) {
                        app.appUrl = app.creatorUrl;
                    } else if (app.appProviderWebsite) {
                        app.appUrl = app.appProviderWebsite;
                    } else {
                        app.appUrl = "http://appdirectory.hootsuite.com/";
                    }


                    if (app.affiliateLink) {
                        app.affiliateLinkHTML = '<a href="' + app.affiliateLink + '" target="_blank">' + app.affiliateLinkCaption + '</a>';
                    } else {
                        app.affiliateLinkHTML = '';
                    }

                    app.additionalStyle = '';
                    if (app.isInstalled) {
                        app.isInstalledBadgeHTML = '<span class="icon-ribbon-check _jsTooltip" title="' + translation._('App Installed') + '"></span>';
                        app.controlHTML = '<button class="btn-lite-sta write _rateBtn">' + translation._('Rate this app') + '</button>&nbsp;<button class="btn-lite-sta _settingsBtn" onclick="">' + translation._('Settings') + '</button>&nbsp;';
                    } else if (app.isDelisted) {
                        app.isInstalledBadgeHTML = '';
                        app.controlHTML = translation._("Can't install the app");
                        app.additionalStyle = 'style="background-color: #FFB6C1;"';
                    } else {
                        app.isInstalledBadgeHTML = '';

                        var installBtnText = translation._('Install App');
                        if (app.isPaid && !app.payExemption) {
                            installBtnText = '<span class="priceTag">' + app.priceText + '</span>&nbsp;<span class="priceNote">' + translation._('monthly') + '</span>';
                        }

                        app.controlHTML = '';

                        if (!result.installsDisabled) {
                            if (app.needPlanUpdate) {
                                if (app.needPlanUpdate === 'PRO') {
                                    app.controlHTML = '<button class="btn-lite-sta _needProPlanUpdate">' + installBtnText + '</button>';
                                } else if (app.needPlanUpdate === 'ENT') {
                                    app.controlHTML = '<button class="btn-lite-sta _needEntPlanUpdate">' + installBtnText + '</button>';
                                }
                            } else if (app.isPaid && !app.payExemption && !app.purchased && isFreeUser) {
                                app.controlHTML = '<button class="btn-lite-sta _subscribeToFreePlan">' + installBtnText + '</button>';
                                if (app.trialDays) {
                                    app.controlHTML += '<span class="priceInfo">' + translation._(app.trialDays + ' day(s) free trial') + '</span>';
                                }
                            } else if (app.isPaid && !app.payExemption && !app.purchased && !isFreeUser) {
                                app.controlHTML = '<button class="btn-lite-sta _buyApp">' + installBtnText + '</button>';
                                if (app.trialDays) {
                                    app.controlHTML += '<span class="priceInfo">' + translation._(app.trialDays + ' day(s) free trial') + '</span>';
                                }
                            } else {
                                app.controlHTML = '<button class="btn-lite-sta _installBtn">' + installBtnText + '</button>';
                            }
                        }
                    }

                    if (app.videoOverviewLink) {
                        app.controlHTML = '<button class="btn-lite-sta _videoBtn" data-app-video-link="' + app.videoOverviewLink + '" >' + translation._('Video') + '</button>&nbsp;' + app.controlHTML;
                    }

                    if (app.isInstalled) {
                        var subscribed = 'no';
                        if (app.isPaid && !app.payExemption) {
                            subscribed = 'yes';
                        }
                        app.controlHTML += '<button class="btn-lite-sta btn-icon-19 _uninstallBtn" subscribed="' + subscribed + '" alt="' + translation._('Uninstall App') + '"><span class="icon-19 bi-trash"></span></button>';
                    }

                    app.componentBadgesHTML = '';
                    if (app.hasStream) {
                        app.componentBadgesHTML += '<span class="_jsTooltip icon-19 addBlock" title="' + translation._('Streams Available') + '"></span>&nbsp;';
                    }
                    if (app.hasPlugin) {
                        app.componentBadgesHTML += '<span>' + translation._('Plugins Available') + '</span>&nbsp;';
                    }
                    if (app.hasContentSource) {
                        app.componentBadgesHTML += '<span class="_jsTooltip icon-19 bi-duplicate" title="' + translation._('Content Source Available') + '"></span>&nbsp;';
                    }


                    if (app.isDelisted) {
                        app.reviewSection = '';
                        app.description = translation._('This app has been removed from the Hootsuite App Directory, if you have any questions please contact our %s1Hootsuite Support team%s2.').replace('%s1', '<a href="https://hootsuite.com/help" target="_blank">').replace('%s2', '</a>');
                    } else {
                        if (app.ratingsCount) {
                            if (app.ratingsCount > 1) {
                                app.reviewCountHtml = app.ratingsCount + ' ' + translation._('reviews');
                            } else {
                                app.reviewCountHtml = '1 ' + translation._('review');
                            }
                        } else {
                            app.reviewCountHtml = translation._('No reviews');
                        }

                        app.reviewCountHtml = '(<a>' + app.reviewCountHtml + '</a>)';

                        //render the rating stars
                        app.starsHtml = '';
                        if (!app.isDelisted) {
                            for (var i = 0; i < 10; i++) {
                                var starClassName = '';
                                if (app.starsCount > i) {
                                    starClassName = 'star-rating-on';
                                }

                                var starMarginLeft = '-8px';
                                if (i % 2 === 0) {
                                    starMarginLeft = '0px';
                                }
                                app.starsHtml += '<div class="star-rating ' + starClassName + '" style="width: 8px"><a style="margin-left:' + starMarginLeft + '"></a></div>';
                            }
                        }


                        app.reviewSection = '<div class="reviewNav ratingSelector">' + app.starsHtml + '<span class="reviewCount _reviewCount">' + app.reviewCountHtml + '</span></div>';

                    }



                    var appItemTemplate = appdirectoryAppItemTemplate;
                    appItems += appItemTemplate.render(app);
                });

                $appListContainer.append(appItems);
                $appListContainer.find('._throbbingLoader').remove();

                fetchAppListInProgress = false;
                if (result.page.currentPageNum === result.page.totalPages) {
                    appListCompletelyLoaded = true;
                }
            });
        };

        //Load first page of the app list
        loadApps();

        //Load the rest by infinite scroll
        $appListContainer.scroll(function () {
            if (domUtils.isElementScrolledToBottom($appListContainer.get(0), 500)) {
                if (!fetchAppListInProgress && !appListCompletelyLoaded) {
                    query.page++;
                    fetchAppListInProgress = true;
                    loadApps();
                }
            }
        });
    }
};


window.loadAppDirectory = function (section) {
    // section is either an object with the section (and other params)
    // or in the legacy usages simply the section string e.g. 'all-apps'
    var queryParams = section;
    if (typeof queryParams === 'string') {
        queryParams = {sectionKey: section};
    }
    appDirectoryLoader.loadSection(queryParams);
};

window.loadSettings = function (section, callback, callbackParams, sectionParams) {
    var popupId = 'settingsPopup';
    var onCompleteCallback = null;

    if (!section) {
        section = 'account';
    }

    ajaxCall({
        type: 'GET',
        url: "/ajax/settings/index?section=" + section + (sectionParams ? '&' + sectionParams : ''),
        beforeSend: function () {
            hs.statusObj.update(translation.c.LOADING, 'info');
        },
        success: function (data) {
            var $popup = $('#' + popupId);
            if (!$popup.length) {	// DialogFactory already handles dupes, but we need more control here
                var params = {
                    closeOnEscape: true,	// don't want people to accidentally close
                    modal: true,
                    width: 1000,
                    title: translation._("Account &amp; Settings"),
                    position: ['center', 25]
                };
                $popup = $.dialogFactory.create('settingsPopup', params);
                $popup.delegate('._load', 'click', function () {
                    window.loadSettings($(this).data('section'));
                });
            }

            $popup.empty().html(data.output);

            switch (section) {
                case 'account':
                    settings.initAccount(data);
                    if (callback) {
                        onCompleteCallback = callback;
                    }
                    break;
                case 'billing':
                    settings.initBilling(data);
                    if (callback) {
                        callback(callbackParams);
                    }
                    break;
                case 'preferences':
                    settings.initPreferences();
                    if (callback) {
                        callback(callbackParams);
                    }
                    break;

                case 'vanityurl':
                    settings.initVanityUrl(data);
                    break;

                case 'notifications':
                    settings.initNotifications();
                    break;

                case 'dataportability':
                    settings.initDataPortabilityArchiving(data);
                    break;

                case 'debug':
                    settings.initDebug();
                    break;

                case 'autoschedule':
                    settings.initAutoSchedule();
                    break;

                default:
                    break;
            }
            settings.currentSection = section;
        },
        complete: function () {
            hs.statusObj.reset();
            if (onCompleteCallback) {
                onCompleteCallback();
            }
        },
        abort: function () {
            hs.statusObj.reset();
        }
    }, 'q1');
    return false;
};

// set a flag to force the streams to reload the next time user visits the streams section
dashboard.forceStreamReloadOnNextLoad = function () {
    hs.forceStreamReloadOnNextLoad = true;
};

dashboard.getForceStreamReloadOnNextLoad = function () {
    var isForce = !!hs.forceStreamReloadOnNextLoad;
    hs.forceStreamReloadOnNextLoad = false;	// reset flag
    return isForce;
};

/**
 * @see SocialNetworkService#refreshNetworkCommand
 */
dashboard.onSocialNetworkRefresh = function (data) {
    hs.profileSelector.renderAll();

    if (hs.dashboardState != 'streams') {
        // we don't reload streams right away......but we want to do it the next time user goes to streams page
        dashboard.forceStreamReloadOnNextLoad();
    }

    // re-render social networks
    if (typeof teammanagement !== 'undefined') {
        teammanagement.renderProfileSocialNetworks(data);
    } else {
        hs.require('teammanagement', function () {
            teammanagement.renderProfileSocialNetworks(data);
        });
    }
};

// private function
var prepareMenuItems = function ($target, currentActiveAppStreamsData) {
    var menuItems = [];
    var $message = $target.closest('._message');
    var $box = $target.closest('._box');
    var ptwImpressionId = $message.data('impressionId');
    var uname = $message.data('userId');
    var uid = $message.attr('externaluserid');
    var socialNetworkType = $box.data('box') && $box.data('box').socialNetworkType || null;
    var socialNetworkId = $box.data('box').socialNetworkId;
    var isCompany = $target.siblings('._companyInfoPopup').get(0);


    menuItems.push({
        title: translation._("View profile"),
        icon: "account",
        change: function (e) {


            if (isCompany) {
                stream.network.showUserInfo.apply($target[0], [e, 'company']);
            } else {
                stream.network.showUserInfo.apply($target[0], [e]);
            }
        }
    });

    if (socialNetworkType) {
        if ('TWITTER' === socialNetworkType && uname) {
            menuItems.push({
                title: translation._("Follow"),
                icon: "adduser",
                change: function () {
                    //using ajax call to retrieve author's full name, for impression tracking
                    ajaxCall({
                        type: 'GET',
                        url: "/ajax/network/user-info?userId=" + uname + "&socialNetworkId=" + socialNetworkId,
                        success: function (data) {
                            if (data.apiResult) {
                                window.toggleFollow(1, data.apiResult.screen_name, data.apiResult.id_str, null, ptwImpressionId, {fullname: data.apiResult.name});
                            }
                        }
                    }, 'single');
                }
            });

            menuItems.push({
                title: translation._("Unfollow"),
                icon: "removeuser",
                change: function () {
                    //using ajax call to retrieve author's full name, for impression tracking
                    ajaxCall({
                        type: 'GET',
                        url: "/ajax/network/user-info?userId=" + uname + "&socialNetworkId=" + socialNetworkId,
                        success: function (data) {
                            if (data.apiResult) {
                                window.toggleFollow(0, data.apiResult.screen_name, data.apiResult.id_str, null, ptwImpressionId, {fullname: data.apiResult.name});
                            }
                        }
                    }, 'single');


                }
            });

            if (uid) {
                menuItems.push({
                    title: translation._("Add To List"),
                    icon: "list",
                    change: function () {
                        stream.twitter.addUserToListPopup(uid);
                    }
                });
            }

            menuItems.push({
                title: translation._("Report Account"),
                icon: "spam",
                change: function () {

                    if ((!socialNetworkId || parseInt(socialNetworkId, 10) < 1) && $('#streamsContainer').length) {
                        // for streams section and we can't find the socialNetworkId
                        window.selectSocialNetworkPopup(function (selectedSocialNetworkId) {
                            stream.twitter.reportSpam(uname, selectedSocialNetworkId);
                        }, translation._("Which Twitter profile should report this user?"));

                    } else {
                        stream.twitter.reportSpam(uname, socialNetworkId);
                    }

                }
            });
        } else if ('INSTAGRAM' === socialNetworkType) {
            var userId = uname,
                userName = $message.data('userName');

            menuItems.push({
                title: translation._('Follow'),
                change: function () {
                    stream.instagram.follow(userId, userName);
                }
            });

            menuItems.push({
                title: translation._('Unfollow'),
                change: function () {
                    stream.instagram.unfollow(userId, userName);
                }
            });
        }
    }

    _.each(currentActiveAppStreamsData, function (appstream) {
        // Really bad encapulation so we have to define this function here where uname, socialNetworkId and
        // socialNetworkType are defined
        var onMenuItemChange = function () {
            var isNewSDK = appstream.isNewSDK ? true : false;
            window.appapi.helper.doSendToApp($message, 'sendprofiletoapp', appstream.pid, appstream.apiKey, isNewSDK);

        };

        if ("TWITTER" === socialNetworkType || "FACEBOOK" === socialNetworkType) {
            menuItems.push({
                title: appstream.title,
                image: appstream.icon,
                change: onMenuItemChange
            });
        }
    });

    return menuItems;
};

dashboard.socialProfileDropdown = function (target) {

    var $target = $(target);
    var $box = $target.closest('._box');
    var socialNetworkType = $box.data('box') && $box.data('box').socialNetworkType || null;
    var currentActiveAppStreamsData = [];
    if (typeof window.appapi != 'undefined') {
        currentActiveAppStreamsData = window.appapi.helper.getActionableAppStream('sendprofiletoapp', socialNetworkType);
    }

    if (!$target.hasClass('_dropDownCreated')) {

        var menuItems = prepareMenuItems($target, currentActiveAppStreamsData);

        //========create dropdown and binding events================
        var $link = $target.siblings('._moreMenu');
        var mouseInLinkDiv = true;
        var mouseOnAvatar = true;
        var targetCanOpenDropndown = true;

        $link.css('display', 'block');


        var $dropDownList = new hs.DropdownList({
            data: {items: menuItems},
            resetOnSelect: true,
            placement_dropdown: 'left top',
            placement_anchor: 'left bottom',
            template: 'dropdown/profile_dropdown'
        });

        $dropDownList.on('dropdownlistopen', function () {

            targetCanOpenDropndown = false;

        });

        $dropDownList.on('dropdownlistclose', function () {
            if (!mouseInLinkDiv) {
                $link.css('display', 'none');
            }
            if (!mouseOnAvatar) {
                targetCanOpenDropndown = true;
            }
        });

        $dropDownList.on('dropdownlistselect', function () {
            $link.css('display', 'none');
        });

        //Handle hover related events
        $target.bind('mouseenter', function () {
            $link.css('display', 'block');
            mouseInLinkDiv = true;
            mouseOnAvatar = true;
        });

        $target.bind('mouseleave', function () {
            mouseOnAvatar = false;
        });

        $link.bind('mouseleave', function () {
            if (!$dropDownList.is(':visible')) {
                $link.css('display', 'none');
            }
            mouseInLinkDiv = false;
        });

        $target.closest('._message').bind('mouseleave', function () {
            if (!$dropDownList.is(':visible')) {
                $link.css('display', 'none');
                mouseInLinkDiv = false;
            }
        });

        //Handle click related events
        $target.bind('mouseup', function () {

            if (targetCanOpenDropndown) {

                $dropDownList.hsDropdownList('open', $link);

            } else {
                targetCanOpenDropndown = true;
            }

        });


        $link.on('mouseup', function () {

            if (!$target.hasClass('_dragging')) {

                if ($dropDownList.is(':visible')) {
                    $dropDownList.hsDropdownList('close');
                } else {
                    $dropDownList.hsDropdownList('open', $link);
                }
            }

        });


        $target.addClass('_dropDownCreated');
    }
};

window.loadStreams = function (tabId, callback, forceLoad) {
    var postLoad = _.bind(dashboard.postLoadStreams, this, tabId, callback, forceLoad);
    hs.dashboardState = 'streams';
    hs.require('streams', postLoad);
    return false;
};

dashboard.postLoadStreams = function (tabId, callback, forceLoad) {
    hs.dashboardState = 'streams';
    var $primaryView;
    /** @type {boolean} Is the primary view loaded with content? */
    var primaryViewIsLoaded;
    var hasTabs = !!$('#dashboardTabs').find('._tab, ._welcomeTab').length;

    $primaryView = coreViewUtils.getjQueryElement('primary');
    primaryViewIsLoaded = coreViewUtils.isLoaded('primary');

    // check dirty flag
    // dirty flag means something with streams has changed (usually user has removed/add new SN or tab)
    if (dashboard.getForceStreamReloadOnNextLoad()) {
        forceLoad = true;
    }
    if (!tabId) {
        const latestActiveTabId = get(LATEST_ACTIVE_TAB_ID, null);
        if (latestActiveTabId) {
            tabId = latestActiveTabId;
        }
    }
    if (!tabId && hasTabs) {
        if (memberUtil.getActionHistoryValue('hasNewPrepopulatedStreams')) {
            memberUtil.storeActionHistoryValue('hasNewPrepopulatedStreams', false);
            var $lastTab = $('#dashboardTabs').find('._tab').last();
            if ($lastTab && $lastTab.attr('id')) {
                tabId = $lastTab.attr('id').replace('tab', '');
            }
        } else {
            var $firstTab = $('#dashboardTabs').find('._tab').first();
            if ($firstTab && $firstTab.attr('id')) {
                tabId = $firstTab.attr('id').replace('tab', '');
            }
        }
    }

    if (!forceLoad && !tabId && primaryViewIsLoaded && hasTabs) {        // if no tabId is specified, and #primaryView is not empty, and there are tabs (if there are no tabs we must load view again)
        hootbus.emit('toggleCoreViews:primary');
        window.startTabRefreshTimer();         // restart timers
        window.startUserInactiveTimer();
        window.resizeUpdate();
        $.isFunction(callback) && callback();
        return;
    }

    if (!tabId) {
        tabId = "";
    }
    ajaxCall({
        type: 'GET',
        url: "/ajax/stream/index?activeTab=" + tabId,
        beforeSend: function () {
            hs.statusObj.update(translation.c.LOADING, 'info');
        },
        success: async function (data) {
            set(LATEST_ACTIVE_TAB_ID, tabId);
            if (hs.dashboardState !== 'streams') {
                // only proceed if the same section is still up
                return;
            }
            hs.currentTabId = data.activeTab;

            baseFlux.getActions(MEMBER).setFeatures({
                canAddMessageTags: data.canAddMessageTags
            });

            hootbus.emit('toggleCoreViews:primary', { content: data.output });

            await asyncStreamLoader('streams')

            // make social network avatar clickable and show dropdown menu
            $primaryView.find('#streamsContainer').delegate('._userInfoDropdown', 'hover', function () {
                dashboard.socialProfileDropdown(this);
            });

            if (data.tabsCount > 0) {
                window.updateTabs();

                //update the column slider
                window.updateSlider();
            }

            $('#dashboard ._addNewTabBtn').bind('click', function () {
                stream.stream.addNewTab();
                trackerDatalab.trackCustom('web.dashboard.streams', 'stream_user_clicked_add_board');
            });

            // quick search init
            window.dashboard.quickSearch = qs;
            window.dashboard.quickSearch.init();


            var quickSearchIconProps = {
                fill: 'black',
                glyph: SearchIcon,
                size: '17'
            };
            var quickSearchIcon = React.createElement(Icon, quickSearchIconProps, '');

            var render = function (parent) {
                ReactDOM.render(
                    quickSearchIcon,
                    parent
                );
            };

            var parentContainer = document.getElementById('_renderQuickSearchIcon');
            if (parentContainer) {
                render(parentContainer);
            }

            // use the same 30s throttle of vertical scroll for Streams horizontal scroll
            $('#streamsContainer').unbind('scroll').bind('scroll', _.throttle(function () {
                trackerDatalab.trackCustom('web.dashboard.streams', 'stream_user_scrolled_streams');
            }, 30000));

            window.updateDashboardHeight();
            window.updateDashboardWidth();

            if ($('#boxAddStream').length) {
                // hide the stream helper if the user has minimized it, and the tab has more than one stream
                var isHide = !!(data.isShowStreamHelper === 0 && $('._box').length > 0);
                stream.streamHelper.init({
                    hidden: isHide
                });
            }

            hootbus.emit(events.STREAMS_POST_LOAD_COMPLETE);

            $.isFunction(callback) && callback(tabId);
        },
        complete: function () {
            hs.statusObj.reset();
        },
        abort: function () {
            hs.statusObj.reset();
        }
    }, 'streamTab');
};

window.loadSavedItems = () => {
    hs.dashboardState = 'saved-items';

    ajaxCall({
        type: 'GET',
        url: "/ajax/stream/saved-items",
        beforeSend: function () {
            hs.statusObj.update(translation.c.LOADING, 'info');
        },
        success: async function (data) {
            if (hs.dashboardState !== 'saved-items') {
                // only proceed if the same section is still up
                return;
            }

            hootbus.emit('toggleCoreViews:primary', { content: data.output });

            await asyncStreamLoader('streams');

            // quick search init
            window.dashboard.quickSearch = qs;
            window.dashboard.quickSearch.init();
            // Make sure the Quick Search popover is closed
            qs.close();
        },
        complete: function () {
            hs.statusObj.reset();
        },
        abort: function () {
            hs.statusObj.reset();
        }
    }, 'streamTab');
}

dashboard.showFreeTrialPromo = function (offerDaysLeft) {
    hootbus.emit('overlay:init', 'modal', 'freeTrialPromo', {offerDaysLeft: offerDaysLeft});
};

dashboard.showTwitterProfileSelectorPopup = function (fnOnSelect, forceOpen, type, isAllowSkip) {
    isAllowSkip = isAllowSkip || false;
    const params = {
            title: translation._("Select a network"),
            width: 450,
            minHeight: 100,
            modal: false,
            closeOnEscape: true,
            resizable: false
        },
        $popup = $.dialogFactory.create('socialNetworkSelectorPopup', params);

    asyncStreamLoader('selectNetworkPopup', {
        showSkipButton: isAllowSkip
    });

    _.defer(function () {
        type = typeof type === 'string' ? type : (_.isArray(type) ? type.join(' ') : 'TWITTER');	// profile selector looks for space delimited type names

        var ps = new hs.profileSelector($popup.find('._profileSelectorWidget'), {
            isNoAutoSelect: forceOpen,
            type: type
        });
        ps.bind('select', function (arrIds) {
            fnOnSelect(arrIds[0]);	// only return first
        });

        $popup.find('._profileSelectorWidget').addClass('x-popup');

        if (isAllowSkip && $popup.find('._none').length === 1) {
            $popup.find('._none').bind('click', function () {
                fnOnSelect('default_upload_sn');
            });
        }
    })
};

dashboard.showLegacyPaywall = function (data, featureAddSuccess) {
    data.isSelf = (data.isSelf === false || data.isSelf === 0) ? 0 : 1;	// default to owner

    var fnRenderPopup = function (popupData) {
        var params = {
            title: popupData.popupTitle || "",
            width: 450,
            resizable: false,
            modal: true,
            closeOnEscape: true,
            position: ['center', 30],
            content: popupData.output,
            close: function () {
                $(document).trigger('featureAccessDeniedPopupClose');
            }
        };

        var $popup = $.dialogFactory.create('featureAccessDeniedPopup', params);
        var trackingParams = {
            label: popupData.feature.toLowerCase()
        };

        if (hs.isFeatureEnabled('CUXF_923_PRO_PAYWALL_TRACKING')) {
            trackingParams.event = 'pro_paywall';
        } else {
            trackingParams.category = 'firewall';
        }

        $popup
            .find('._billingAddFeatureBtn').click(function () {
            if (hs.isFeatureEnabled('CUXF_923_PRO_PAYWALL_TRACKING')) {
                trackerDatalab.trackCustom('web.dashboard.pro_paywall.' + trackingParams.label, 'add_feature');
                hs.dataLayerTrack($.extend({action: 'add_feature'}, trackingParams));
            } else {
                hs.trackEvent($.extend({action: 'add_feature'}, trackingParams));
            }
        }).end()
            .find('._upgradeNow').click(function () {
            if (hs.isFeatureEnabled('CUXF_923_PRO_PAYWALL_TRACKING')) {
                trackerDatalab.trackCustom('web.dashboard.pro_paywall.' + trackingParams.label, 'accept');
                hs.dataLayerTrack($.extend({action: 'accept'}, trackingParams));
            } else {
                hs.trackEvent($.extend({action: 'accept'}, trackingParams));
            }
        }).end()
            .find('._sendRequest').click(function () {
            var $form = $('#notifyOwnerFormDialog');
            ajaxCall({
                url: "/ajax/member/send-upgrade-request",
                data: $form.serialize(),
                success: function () {
                }
            }, 'q1');
            $('#featureAccessDeniedPopup').dialog('close');
            if (hs.isFeatureEnabled('CUXF_923_PRO_PAYWALL_TRACKING')) {
                trackerDatalab.trackCustom('web.dashboard.pro_paywall.' + trackingParams.label, 'notify_owner');
                hs.dataLayerTrack($.extend({action: 'notify_owner'}, trackingParams));
            } else {
                hs.trackEvent($.extend({action: 'notify_owner'}, trackingParams));
            }
        }).end()
            .find('._cancel').click(function () {
            $('#featureAccessDeniedPopup').dialog('close');
            if (hs.isFeatureEnabled('CUXF_923_PRO_PAYWALL_TRACKING')) {
                trackerDatalab.trackCustom('web.dashboard.pro_paywall.' + trackingParams.label, 'close');
                hs.dataLayerTrack($.extend({action: 'close'}, trackingParams));
            } else {
                hs.trackEvent($.extend({action: 'close'}, trackingParams));
            }
        }).end();

        $(document).trigger('featureAccessDeniedPopupOpen');

        // javascript from view owner/email-reminder
        $popup.find('#notifyOwnerFormDialog').bind('keypress', function (e) {
            return window.disableEnterKey(e);
        });
        // javascript from view report-add-credits
        $popup.find('._billingAddFeatureBtn').bind('click', function () {
            var $this = $(this),
                featureId = $this.data('feature-id'),
                isArchiving = $this.data('archiving'),
                value = $this.data('value'),
                isSeat = $this.data('seat');

            if (isArchiving) {
                billing.addFeature(featureId, $('#messageArchiving').val());
            } else if (isSeat) {
                if (value === '') {
                    value = 1;
                }
                billing.addFeature(featureId, value, featureAddSuccess);
            }

            return false;
        });


        // javascript from view report-add-credits
        if ($popup.find('#salesforceForm').length > 0) {
            setTimeout(function () {
                plans && _.isFunction(plans.initSalesForceForm) && plans.initSalesForceForm('salesforceForm', function ($form) {
                    var $iframe = $('<iframe style="position:absolute; top: -999px" src="https://www.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&' + $form.serialize() + '"></iframe>').appendTo('body');

                    $('#featureAccessDeniedPopup').dialog('close');
                    hs.statusObj.update(translation._("Thank you for your interest, you will be contacted shortly."), 'success', true);

                    setTimeout(function () {
                        $iframe.remove();
                        $iframe = undefined;
                    }, 5 * 1000);
                });
            }, 1);
        }

        // set up for Optimizely
        // add an underscore class to the popup so Optimizely can differentiate this popup
        var featureClass = '_' + (_.isString(popupData.feature) ? popupData.feature.toLowerCase() : 'generic');
        $popup.addClass(featureClass);
    };

    if (data.output) {
        fnRenderPopup(data);
    } else {
        ajaxCall({
            type: 'GET',
            url: "/ajax/member/feature-access-denied-popup?reason=" + data.reason + "&isSelf=" + (data.isOwner === 1 || data.isOwner === 0 ? data.isOwner : '1') + (data.ownerId ? "&o=" + data.ownerId : ''),
            success: function (ajaxData) {
                fnRenderPopup(ajaxData);
            }
        }, 'qm');
    }
}

dashboard.showFeatureAccessDeniedPopup = function (data, featureAddSuccess) {
    if (!data) {
        return;
    }
    // naming is inconsistent across dashboard
    var feature = data.feature || data.reason;

    if (hs.billing.useNewBilling || (hs.billing.testFeatures && hs.billing.testFeatures.indexOf(feature) >= 0)) {
        var memberFeatureInfo = {
            billingInterval: data.billingInterval,
            currencyCode: data.currencyCode,
            currentSubNum: data.currentSubNum,
            featureCost: data.featureCost,
            isPlanMaxed: data.isPlanMaxed,
            numToAdd: data.numToAdd,
            plan: data.plan || hs.memberPlan, // If plan isn't provided default to hs member plan
            limit: data.limit
        };
        getApp('hs-app-billing').then(function (hsAppBilling) {
            if (hsAppBilling.shouldRenderPaywall(feature)) {
                hsAppBilling.showPaywallModal({
                    feature,
                    hootbus,
                    memberFeatureInfo,
                    memberId: hs.memberId,
                    statusObj: hs.statusObj,
                    featureAddSuccess
                });
                return;
            }
            dashboard.showLegacyPaywall(data, featureAddSuccess);
        });
    }


};

dashboard.showLaunchMenuHelp = function () {};

// If the user is in a bad billing state, force them to the plans page
dashboard.checkAccountStatus = function () {
    ajaxCall({
        type: 'GET',
        url: "/ajax/member/check-account-status",
        success: function (data) {
            if (data.redirectUser == 1) {
                window.location.reload(true);
            }
        }
    }, 'qm');
};

//save the global for use
window.handleTimezoneChange = function (offset) {
    if (hs && Object.prototype.hasOwnProperty.call(hs, 'timezoneOffset')) {
        hs.timezoneOffset = offset;
    }
};

//get geolocation for browsers that support it
// private function
var isGeoSupported = function () {
    return !!(navigator && navigator.geolocation && 'getCurrentPosition' in navigator.geolocation);
};

hs.getGeolocation = function (callback) {
    hs.statusObj.update(translation._("Getting your location") + '...', 'info', true, 5000);
    if (isGeoSupported()) {
        //hs.statusObj.reset();

        /*
         navigator.geolocation.getCurrentPosition(function(position) {
         callback(position);
         });
         */

        navigator.geolocation.getCurrentPosition(function (position) {
            hs.statusObj.reset();
            callback(position);
        }, function (error) {
            hs.statusObj.reset();
            // handle error
            var msg = translation._("Your location could not be determined");
            if (error && error.code) {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        msg = translation._("You must allow your browser to share your location data");
                        break;
                    case error.POSITION_UNAVAILABLE:
                    case error.TIMEOUT:
                        break;
                    default:
                        break;
                }
            }
            hs.statusObj.update(msg, 'error', true);
            callback(null);
        }, {
            timeout: 5000,
            maximumAge: 600000
        });	// timeout after 5 seconds, lookup fresh location after 10 mins
    } else {
        hs.statusObj.update(translation._("Your browser does not support geolocation"), 'warning', true);
    }
};

/**
 * dashboard.showVatBillingPopup
 * Displays the VAT Billing Popup
 */
dashboard.showVatBillingPopup = function () {
    // FPLAT-381 _bottomNav removed as part of legacy global nav cleanup
    var $popupTarget = $('._bottomNav ._settings');
    var $popupContent = $(hsEjs.getEjs('dashboard/vatbillingpopup').render({}));

    $popupContent.on('click', '._loadBillingSettings', function () {
        $popupContent.off('click');
        hs.bubblePopup.close();

        // Open the Settings popup and show the Account->Billing section
        window.loadSettings('account', function () { $('#settingsPopup ._billing').addClass('active'); }, null, 'subsection=billing');
    });

    $popupContent.on('click', '._dismissBillingSettings', function () {
        // Do not show this popup again
        ajaxCall({
            url: '/ajax/member/popup-seen',
            data: 'n=VAT_BILLING_POPUP_DISMISSED',
            type: 'POST'
        }, 'qmNoAbort');

        $popupContent.off('click');
        hs.bubblePopup.close();
    });

    hs.bubblePopup.open($popupTarget, null, null, function () {
        hs.bubblePopup.setContent($popupContent);

        var $popup = hs.bubblePopup.getCurrentPopup();

        // Adjust the position of the popup to the left, so it's right beside the settings icon
        _.defer(function () { $popup.css('left', ($popup.position().left - 23) + 'px'); });
    }, {autoclose: false});
};

/**
 * dashboard functions from stream.js
 */
window.startTabRefreshTimer = function () {
    window.stopTabRefreshTimer();
    var interval = $('#editTabForm ._interval._active').attr('interval');
    if (interval > 0) {
        hs.timers.tabRefreshTimer = setInterval(window.refreshTab, interval * 60 * 1000);
    }
};

window.stopTabRefreshTimer = function () {
    if (hs.timers.tabRefreshTimer != null) {
        clearInterval(hs.timers.tabRefreshTimer);
        delete hs.timers.tabRefreshTimer;
    }
};

//if user is inactive for more than 30 mins, then lock stream screen
window.startUserInactiveTimer = function () {
    window.stopUserInactiveTimer();
    hs.timers.userInactiveTimer = setTimeout(lockStreamScreen, hs.c.userInactivityTimeout);
    $('body').click(resetUserInactiveTimer);
};

window.stopUserInactiveTimer = function () {
    if (hs.timers.userInactiveTimer != null) {
        clearTimeout(hs.timers.userInactiveTimer);
        delete hs.timers.userInactiveTimer;
    }
    $('body').unbind('click', resetUserInactiveTimer);
    hs.userInactiveTimedOut = false;
};

// private function
var resetUserInactiveTimer = function () {
    clearTimeout(hs.timers.userInactiveTimer);
    hs.timers.userInactiveTimer = setTimeout(lockStreamScreen, hs.c.userInactivityTimeout);
};

window.updateRelativeTimes = function (parent) {
    var now = Math.round(new Date().getTime() / 1000);

    $('._relativeTime', parent).each(function () {
        var $this = $(this),
            timeInWords = relativeTimeInWords($this.data('timestamp'), now);

        if (timeInWords) {
            if ($this.text() != timeInWords) {
                $this.text(timeInWords);
            }
        } else {
            $this.text($this.attr('title')).removeAttr('title').removeClass('_relativeTime');
        }
    });
};

// private
var lockStreamScreen = function () {
    var params = {
            modal: true,
            width: 650,
            closeOnEscape: true,
            zIndexOffset: zIndexConstants.provisioning.ranges.blocker,
            draggable: true,
            title: translation._("Snoozing..."),
            close: function () {
                ajaxCall(
                    {
                        type: 'POST',
                        url: "/ajax/member/check-session-on-wakeup"
                    },
                    'qmNoAbort'
                ).done(function () {
                        // The member's session is still valid, restart services
                        window.unlockStreamScreen();
                        dashboard.startPingTimer();
                        member.pingServer(true);
                        hootbus.emit(hs.c.eventWake);
                    });
            },
            position: ['center', 100]
        },
        $popup = $.dialogFactory.create('lockStreamScreenPopup', params);

    var lockscreenHtml = hsEjs.getEjs('dashboard/lockscreen').render({});  // no data

    //stop ping when streams are locked and member is inactive
    dashboard.stopPingTimer();

    $popup.html(lockscreenHtml).find('._close').click(function (e) {
        e.preventDefault();
        $popup.dialog('close');
    });

    pauseStreamScreen();

    hs.userInactiveTimedOut = true;

    hootbus.emit(hs.c.eventSleep);
};

// private function
var pauseStreamScreen = function () {
    window.stopTabRefreshTimer();
    window.stopUserInactiveTimer();
};

window.unlockStreamScreen = function (doNotRefreshTabs) {
    !doNotRefreshTabs && hootbus.emit('streams:board:refresh');
    window.startUserInactiveTimer();
    dashboard.checkAccountStatus();

    _.defer(function () {
        var $lockStreamPopup = $('#lockStreamScreenPopup');

        if ($lockStreamPopup.length) {
            $lockStreamPopup.dialog('close');
        }
    });
};

window.makeUserDraggable = function (container) {
    var $item = $(container);
    if ($item.attr('is-draggable')) {
        return;
    }
    $item.draggable({
        appendTo: 'body',
        helper: returnGroupHelper,
        addClasses: false,
        hoverClass: 'hover',
        cursor: 'move',
        revert: 'invalid',
        cursorAt: {
            left: 10,
            top: 10
        },
        iframeFix: true,
        zIndex: 2000,
        start: function () {
            $item.addClass('_dragging');
        },
        stop: function () {
            $item.removeClass('_dragging');
        }
    }).attr('is-draggable', 1);
};

// private function
var returnGroupHelper = function () {
    var clone = $(this).siblings('img').clone();
    clone.wrap("<div class='draggable-user rb-a-3'></div>");
    clone.parent().append("<span class=\"icon-19 block _icon\"></span>");
    return clone.parent();
};

dashboard.postDashboardLoad = function (callback) {
    var forceShowReAuthModal = document.location.href && document.location.href.includes('social-networks/reauth');
    var socialNetworkExpirationShowModalCookie;
    if (forceShowReAuthModal) {
        // ignore the cookie because we are forcing the auth modal
        socialNetworkExpirationShowModalCookie = true;
    } else {
        socialNetworkExpirationShowModalCookie = !cookie.read('hideSocialNetworkExpirationModal');
    }
    var includeDismissed = socialNetworkExpirationShowModalCookie;
    var prioritizeActionableProfiles = socialNetworkExpirationShowModalCookie;
    var includeExpired = socialNetworkExpirationShowModalCookie;

    ajaxCall({
        type: 'GET',
        data: "showReAuthModal=" + forceShowReAuthModal + "&includeExpired=" + includeExpired + "&includeDismissed=" + includeDismissed + "&prioritizeActionableProfiles=" + prioritizeActionableProfiles,
        url: "/ajax/index/post-dashboard-load",
        success: function (data) {
            if (data.userAccountIsDisabled) {
                window.location = hs.util.getUrlRoot() + '/logout';
                return false;
            }

            // first, append view output to body
            // the view output is usually just tracking code we deferred
            if (data.output) {
                $('body').append(data.output);
            }

            var onlyShowOnePopup = dashboard.hasShownPopup ? 1 : 0; //set this var to 1 when any popup is seen, this way we can make sure we only show one popup to users at a time.

            // Bypasses the isShowAddStreamHelperTooltip flag for re-auth modal
            if (dashboard.hasShownPopup && hs.ba && hs.ba.isShowAddStreamHelperTooltip && socialNetworkExpirationShowModalCookie && data.showExpiryPopup && data.invalidSocialNetworkRecords && data.invalidSocialNetworkRecords.length > 0) {
                onlyShowOnePopup = hs.ba.showUpgradeScreen ? 1 : 0;
            }

            if (onlyShowOnePopup === 0) {
                var oneDayTimeMillis = 1000 * 60 * 60 * 24;
                onlyShowOnePopup = (Date.now() - new Date(hs.memberSignupDate) < oneDayTimeMillis) ? 1 : 0;
            }

            var hasExpiredNetworks = data.showExpiryPopup && data.invalidSocialNetworkRecords && data.invalidSocialNetworkRecords.length > 0;
            // Determine if the user needs to see the social network expiration popup (only if we got here via a deep-link)
            if (forceShowReAuthModal && hasExpiredNetworks && onlyShowOnePopup === 0) {
                dashboard.showSocialNetworkExpiryPopup(data);
                onlyShowOnePopup = 1;
            } else if (!darklaunch.isFeatureEnabledOrBeta('PGM_565_PENDO_ENABLE_DISCONNECTION_GUIDES')) {
                // Determine if we should show the social network expiration banner (other notification banners override the expiration banner)
                var notAlreadyShowingBanner = hs.memberExtras.hasSeenDashboardNotificationBanner;
                if (!hs.memberExtras.isOrgSuspendedBannerShown && socialNetworkExpirationShowModalCookie && hasExpiredNetworks && notAlreadyShowingBanner) {
                    renderExpirationBanner(document.getElementById('dashboardBanner'), data.invalidSocialNetworkRecords);
                }
            }

            var params;

            if (data.appPlugins) {
                $('body').append('<div id="_appPlugin" style="display: none;"></div>');
                var $appPlugin = $('#_appPlugin');

                $.each(data.appPlugins, function (i, el) {

                    $appPlugin.append(window.appendAppPluginIFrame(el));

                });

            }

            if (data.showEnterpriseLogo) {
                // FPLAT-381: ._accountTypeEnterprise element was removed with the legacy global nav
                $('._accountTypeEnterprise').show();
            } else if (data.showProLogo) {
                $('._accountTypePro').show();
            }

            hs.sa = data.memberHasPromotedTweets ? 1 : 0;		// this MUST be an int of 1 or 0, not a bool

            _.isFunction(callback) && callback(data);

            // Determine if the user needs to confirm their email address
            if (memberUtil.checkUserEmail() && onlyShowOnePopup === 0) {
                onlyShowOnePopup = 1;
                setTimeout(dashboard.showCompleteProfilePopup, 2000);
            }

            //Determine if the user needs to see a popup asking them to enter their billing information
            if (data.billingInfoNeededDaysLeft && onlyShowOnePopup === 0) {

                var billingInfoNeeded = hsEjs.getEjs('dashboard/billinginfoneeded').render({days: data.billingInfoNeededDaysLeft});
                params = {
                    modal: true,
                    draggable: false,
                    closeOnEscape: true,
                    width: 487,
                    title: translation._("Your free trial is ending soon"),
                    content: billingInfoNeeded,
                    position: ['center', 35]
                };

                //Show Billing upgrade popup
                $.dialogFactory.create('billingInfoNeeded', params);
                onlyShowOnePopup = 1;
            }

            // Determine whether the user needs to see a popup prompting them to enter their VAT Number
            if (data.showVatBillingInformation && onlyShowOnePopup === 0) {
                dashboard.showVatBillingPopup();
                onlyShowOnePopup = 1;
            }

            if (data.showSnReauthRequiredAlert) {
                dashboard.showSnReauthRequiredAlert();
            }
            var postLoad = function () {
                // The marketo requirement callback created a deferred object
                // and stored it on hs.marketo.initDefer
                // The defer is going to be resolved as soon as marketo api is available
                // so identify the user when the defer is resolved
                hs.marketo.initDefer.done(function () {
                    hs.marketo.identify(data.marketo.member, data.marketo.hash);
                });
            };

            if (data.marketo) {
                hs.require('marketo', postLoad);
            }

            if (hs.memberExtras && hs.memberExtras.publisherSettings && !Object.prototype.hasOwnProperty.call(hs.memberExtras.publisherSettings, 'autoScheduleLastSelected')) {
                hs.memberExtras.publisherSettings.autoScheduleLastSelected = (data.autoSchedule === 1);
            }

            // Once a user has sent or scheduled a message, set the action history so the walkthrough does not trigger again
            hootbus.once('full_screen_composer:response:message_success', function () {
                memberUtil.storeActionHistoryValue('postScheduledOrSent', true);
            });

            const handleComposerMessageState = (data) => {
                // Drafting Message
                if (data?.contentType === 'DRAFT') {
                    memberUtil.storeActionHistoryValue('first_draft_saved', true);
                } // Posting or Scheduling Message
                else if (data?.messageState === 'SENT' || data?.messageState === 'SCHEDULED') {
                    memberUtil.storeActionHistoryValue('first_post_sent_or_scheduled', true);
                }
            }

            if(darklaunch.isFeatureEnabledOrBeta('PGR_2044_HOMEPAGE_ONBOARDING_CONTENT')){
                if(!memberUtil.getActionHistoryValue('first_draft_saved') || !memberUtil.getActionHistoryValue('first_post_sent_or_scheduled')){
                    hootbus.on('full_screen_composer:response:message_success', data => {
                        handleComposerMessageState(data)
                    });
                }
            }




            hootbus.emit('dashboard:load:finished');
        }
    }, 'qmNoAbort');
};

window.appendAppPluginIFrame = function (el) {

    if (!el) {
        return;
    }

    var combinedName = el.apiKey + '_' + el._id;

    var url = el.plugInURL;

    if (!url || url == 'null') {
        return '';
    }

    var $iFrameToAppend = $(
        '<iframe	name="' + combinedName + '" id="' + combinedName + '" icon="' + el.icon + '" title="' + el.menuText + '"' +
        'apikey="' + el.apiKey + '" pid="' + el._id + '" maid="' + el.memberAppId + '" src="" baseurl="" ></iframe>' +
        '<script>' +
        'jsapi.setAppUrl("' + el.apiKey + '", "' + el._id + '", "' + url + '");' +
        '</script>'
    );
    return $iFrameToAppend;

};

dashboard.showWizardOrgManagementDialog = function () {

    var fnStartTour = function () {
        var step1 = '<h4>' + translation._("Drag-and-Drop") + '</h4><button class="icon-19 close closePop _close"></button>' +
                '<p>' + translation._("Simply drag-and-drop Members and Social Networks here to create new Teams.") + '</p>' +
                '<button class="btn-lite-sta _next">' + translation._("Next") + ' &raquo;</button>',
            step2 = '<h4>' + translation._("Drag-to-Select") + ' &nbsp;&nbsp; - 2/3</h4><button class="icon-19 close closePop _close"></button>' +
                '<p>' + translation._("To select multiple Members or Social Networks, click and drag the area around them. The Members and Social Networks you select with then be highlighted.") + '</p>' +
                '<button class="btn-lite-sta _next">' + translation._("Next") + ' &raquo;</button>',
            step3 = '<h4>' + translation._("Double Click to View Details") + ' &nbsp;&nbsp; - 3/3</h4><button class="icon-19 close closePop _close"></button>' +
                '<p>' + translation._("Double click on a Member, Social Network or Team to view more information about it.") + '</p>' +
                '<button class="btn-lite-sta _next">' + translation._("Done") + '</button>',
            step4 = '<p>' + translation._("You can access these tips anytime from this button.") + '</p>' +
                '<button class="btn-lite-sta _close">' + translation._("Close") + '</button>';

        var closeEvent = {
            selector: '._close',
            event: 'click',
            handler: function () {
                hs.bubblePopup.close();

                if ($('._teamManagementOrganizationPage ._help').length) {
                    wizardHelper.skipToLast();
                }

                wizardHelper.clearQueue();

            }
        };

        var steps = [
            {
                target: '._teamsContainer ._plusAction',
                content: step1,
                autoclose: false,
                events: [
                    {
                        selector: '._next',
                        event: 'click',
                        handler: function () {
                            hs.bubblePopup.close();
                            wizardHelper.show();
                        }
                    },
                    closeEvent
                ]
            },
            {
                target: '._membersContainer .header strong',
                'content': step2,
                autoclose: false,
                events: [
                    {
                        selector: '._next',
                        event: 'click',
                        handler: function () {
                            hs.bubblePopup.close();
                            wizardHelper.show();
                        }
                    },
                    closeEvent
                ]
            },
            {
                target: '._membersContainer ._listItem:first',
                'content': step3,
                autoclose: true,
                events: [
                    {
                        selector: '._next',
                        event: 'click',
                        handler: function () {
                            _.defer(hs.bubblePopup.close);
                        }
                    },
                    closeEvent
                ]
            },
            {
                target: '._teamManagementOrganizationPage ._help',
                'content': step4,
                autoclose: true,
                events: [
                    {
                        selector: '._next',
                        event: 'click',
                        handler: function () {
                            hs.bubblePopup.close();
                        }
                    },
                    closeEvent
                ]
            }
        ];

        wizardHelper.init(steps);

        setTimeout(wizardHelper.show, 100);
    };

    var params = {
            modal: true,
            width: 520,
            closeOnEscape: true,
            draggable: true,
            close: function () {
                fnStartTour();
                ajaxCall({
                    type: 'POST',
                    url: "/ajax/member/disable-wizard",
                    data: 'field=isShowOrgManagement'
                }, 'qm');
            },
            position: ['center', 100],
            noChrome: true
        },
        $popup = $.dialogFactory.create('wizardOrgManagement', params);

    var html = hsEjs.getEjs('dashboard/wizardorgmanagement').render({});	// no data

    $popup.html(html).find('._startTour').click(function (e) {
        e.preventDefault();
        $popup.dialog('close');
    });

    hs.bubblePopup.close();

};

dashboard.getSkipReason = function () {
    var reason = null;
    if (!_.values(hs.socialNetworks).length) {
        reason = 'no-social-networks';
    } else if (!$('#boxAddStream').is(':visible')) {
        reason = 'add-stream-not-visible';
    } else if ($('._box').length > 0) {
        reason = 'user-has-tabs';
    }

    return reason;
};


// FPLAT-381: this function had a reference to the legacy nav, maybe no longer used
dashboard.showSnReauthRequiredAlert = function () {
    if ($('._dialog').length) {
        return; // do not show if there are any dialogs open
    }
    var $anchor = $('._organizations');
    if ($anchor.hasClass('active')) {
        return;
    }
    hs.bubblePopup.open($anchor, null, null, null, {autoclose: false});

    var popupHtml = '';
    popupHtml += '<div class="" style="width:215px">';
    // popupHtml += '  <div class="header"><div class="title"><span class="icon-13 alert"></span><h4>' + translation._("heading") + '</h4></div></div>';
    popupHtml += '  <div class="content">';
    popupHtml += '    <button class="icon-19 close closePop _close"></button>';
    // popupHtml += '    <span class="icon-13 alert" style="position:absolute;top:20px;left:0px;"></span>';
    popupHtml += '    <p style="padding-right:15px;"> ' + translation._("You have LinkedIn Companies that need to be re-authenticated.") + '</p>';
    popupHtml += '  </div>';
    popupHtml += '</div>';

    var $popupContent = $(popupHtml);

    $popupContent.find('._close').click(function () {
        hs.bubblePopup.close();
    });

    hs.bubblePopup.setContent($popupContent);

    // $anchor.append('<span class="icon-13 alert" style="position:absolute;top:-2px;left:5px;"></span>');
};

dashboard.showCompleteProfilePopup = function () {
    var updateProfileEmail = function (email) {
        email = encodeURIComponent(email);
        ajaxCall({
            url: "/ajax/member/update-email",
            data: 'email=' + email,
            success: function (data) {
                if (data.success === 1) {
                    hs.statusObj.update(translation._("Saved! Reloading..."), 'success');
                    hs.reloadBrowser();
                } else {
                    if (data.userExists === 1) {
                        hs.statusObj.update(translation._("Looks like that email address already exists in Hootsuite. Please use a new email address."), 'error', true, 3000);
                    } else {
                        hs.statusObj.update(translation._("Invalid email address"), 'error', true, 3000);
                    }
                }
            }
        }, 'q1');
    };

    // create the bubble popup notification
    var $dashboardCompleteProfileEmailPopup = $('._dashboardCompleteProfileEmailPopup');
    var $completeProfilePopupEmailAnchor = $('._toggleCompleteProfileEmailPopup');
    var completeProfilePopupEmailOptions = {
        width: 300,
        cssClass: 'completeProfileEmail'
    };
    var $completeProfilePopupEmailHtml = $(hsEjs.getEjs('dashboard/completeprofileemailpopup').render());
    var toggleCompleteProfileEmailPopup = function () {
        // the bubblePopup.open function already determines if the completeProfilePopup
        // should be toggled for the current anchor context
        hs.bubblePopup.openVertical($completeProfilePopupEmailAnchor, null, null, function () {
            hs.bubblePopup.setContent($completeProfilePopupEmailHtml);
        }, completeProfilePopupEmailOptions);

        $completeProfilePopupEmailHtml.find('._close').click(hs.bubblePopup.close);
        $completeProfilePopupEmailHtml.find('._next').click(function () {
            updateProfileEmail($completeProfilePopupEmailHtml.find('._completeProfileEmail').val());
        });
        $completeProfilePopupEmailHtml.find('._completeProfileEmail').keypress(_.debounce(function (e) {
            if (e.which === 13) { // enter key
                updateProfileEmail($(this).val());
            }
        }, 200));
    };

    $dashboardCompleteProfileEmailPopup.show();
    $completeProfilePopupEmailAnchor.click(toggleCompleteProfileEmailPopup);

    var cookieName = "hideEmailPrompt";
    var cookieValue = cookie.read(cookieName);
    if (!(cookieValue === "undefined" || cookieValue === null)) {
        toggleCompleteProfileEmailPopup();
    } else {
        var closeCheckEmailSetIgnoreCookie = function () {
            var value = "";
            var date = new Date();
            date.setTime(date.getTime() + (60 * 24 * 60 * 60 * 1000)); // set expiry date to 60 days
            var expires = "; expires=" + date.toGMTString();
            document.cookie = cookieName + "=" + value + expires + "; path=/";
        };

        var params = {
            width: 360,
            resizable: false,
            draggable: true,
            closeonEscape: false,
            position: ['center', 100],
            modal: true,
            title: translation._("Complete Registration"),
            close: closeCheckEmailSetIgnoreCookie
        };

        var $dialog = $.dialogFactory.create('completeProfileEmail', params);

        $dialog.html(hsEjs.getEjs('dashboard/completeprofileemaildialog').render());

        $dialog.find('._next').click(function () {
            updateProfileEmail($dialog.find('._completeProfileEmail').val());
        });
    }
};

dashboard.showSocialNetworkExpiryPopup = function (data) {
    hootbus.emit('overlay:init', 'modal', 'socialNetworkExpirationModal', {data: data});
};

dashboard.showVideoPopup = function (videoLink, thumbnail, scrubTo, videoSubtitlesUrl, videoSubtitlesLang, socialNetworkType = '') {

    var content = async function(videoSubtitlesUrl) {
        hs.bubblePopup.close();

        scrubTo = parseFloat(scrubTo) || 0;

        const isTikTok = socialNetworkType === snTypes.TIKTOKBUSINESS
        const height = $(window).height() - 100 // Add 100px padding to the bottom of the dialog, so it looks centered on the screen
        const width = height * 0.5625 // 0.5625 is the 9/16 aspect ratio that TikTok videos have

        const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS);

        var html = hsEjs.getEjs('dashboard/videopopup').render({
            'videoLink': videoLink,
            'thumbnail': thumbnail,
            'videoSubtitlesUrl': videoSubtitlesUrl,
            'videoSubtitlesLang': videoSubtitlesLang,
            'socialNetworkType': isTikTokEnabled() ? socialNetworkType : '',
            'width': isTikTokEnabled() && isTikTok ? width : 625,
            'height':isTikTokEnabled() && isTikTok ? height : 350,
            hasCustomApprovals: hasCustomApprovals,
        });
        var params = {};
        var $popup;

        if (hasCustomApprovals) {
            params = {
                draggable: false,
                width: isTikTokEnabled() && isTikTok ? width : 625,
                height: isTikTokEnabled() && isTikTok ? height : 350,
                modal: true,
                closeOnEscape: true,
                resizable: false,
                noChrome: true,
                content: html,
                title: translation._("Video"),
                position: ['center', 40],
                isMedia: true,
                isVideo: true
            };
        } else {
            params = {
                draggable: false,
                width: isTikTokEnabled() && isTikTok ? width : 720,
                height: isTikTokEnabled() && isTikTok ? height : 475,
                modal: true,
                closeOnEscape: true,
                resizable: false,
                noChrome: true,
                content: html,
                title: translation._("Video"),
                position: ['center', 40]
            };
        }

        $popup = $.dialogFactory.create('videoPopup', params);

        $popup
            .find('._close').click(function () {
                $popup.dialog('close');
                return false;
            }).end();

        var $videoPlayer = $('.videoPlayer');

        $videoPlayer.on('loadedmetadata', function () {
            this.currentTime = scrubTo;
        });

        $videoPlayer.get(0) && typeof $videoPlayer.get(0).play === 'function' && $videoPlayer.get(0).play(); //Auto play video
    }

    content(videoSubtitlesUrl)

};

dashboard.showYoutubeVideoPopup = async function (videoLink) {
    hs.bubblePopup.close();

    const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

    var html = hsEjs.getEjs('dashboard/youtubevideopopup').render({
        'videoLink' : videoLink,
        hasCustomApprovals: hasCustomApprovals,
    });
    var params = {};
    var $popup;

    if (hasCustomApprovals) {
        params = {
            draggable: false,
            width: 720,
            height: 475,
            modal: true,
            closeOnEscape: true,
            resizable: false,
            noChrome: true,
            content: html,
            title: translation._("Video"),
            position: ['center', 40],
            isMedia: true,
            isVideo: true
        };
    } else {
        params = {
            draggable: false,
            width: 720,
            height: 475,
            modal: true,
            closeOnEscape: true,
            resizable: false,
            noChrome: true,
            content: html,
            title: translation._("Video"),
            position: ['center', 40]
        };
    }

    $popup = $.dialogFactory.create('videoPopup', params);

    $popup
        .find('._close').click(function () {
            $popup.dialog('close');
            return false;
        }).end();
};

dashboard.showModal = function (options) {
    options = options || {};
    if (options.bodyHTML) {
        options.bodyText = React.createElement('div', {
            dangerouslySetInnerHTML: {__html: options.bodyHTML}
        });
    }
    hootbus.emit('overlay:init', 'modal', 'confirmationModal', options);
};

dashboard.hideModal = function () {
    hootbus.emit('modals:confirmation:modal:destroy');
};

window.dashboard = dashboard;

export default dashboard;
