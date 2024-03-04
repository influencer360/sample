import $ from 'jquery';
import _ from 'underscore';
import { getApp } from 'fe-lib-async-app';
import addressUtils from './address-utils';

// utils
import util from 'utils/util';
import hootbus from 'utils/hootbus';
import trackerDatalab from 'utils/tracker-datalab';
import coreViewUtils from './dashboard/utils/core-view';
import ReactDOM from 'react-dom';

// loaders
import automationLoader from 'automation/section-loader';
import singleMessageLoader from 'message/components/single-message-section-loader';
import snActions from 'apps/social-network/actions';
import accountManagement from 'account-management';
import plannerLoader from 'planner/components/planner-loader';
import homePageLoader from 'apps/home-page/home-page-loader';
import organizationManagementLoader from 'apps/organization-management/organization-management-loader';
import inboxLoader from 'inbox/components/inbox-loader';
import sparkcentralLoader from 'sparkcentral/components/sparkcentral-loader';
import amplifyLoader from 'amplify/components/amplify-loader';
import advertiseLoader from "advertise/components/advertise-loader";
import tagmanagerLoader from 'tagmanager/section-loader';
import contentStudioLoader from 'contentstudio/components/contentstudio-loader';
import goalsLoader from 'goals/components/goals-loader';
import trendsLoader from 'trends/components/trends-loader';
import socialRelationshipScoreLoader from 'social-relationship-score/components/social-relationship-score-loader';
import hootbioLoader from 'hootbio/components/hootbio-loader';
import organizationsSettingsLoader from 'hs-app-organizations-settings/components/loader';
import appDirectoryDashboardLoader from 'hs-app-directory-dashboard/components/loader';

import { HOOTBUS_EVENT_OPEN_COMPOSER } from 'publisher/components/publisher-component-listeners';
import { loadAnalytics } from 'fe-anl-comp-loader';
import { loadBrandwatch } from 'fe-anl-comp-loader';
import SectionLoader from './router/utils/section-loader';

import { CUSTOM_APPROVALS } from 'fe-lib-entitlements';
import { hasEntitlement } from 'fe-pnc-data-entitlements';

var previousRoute;

window.address = window.address || {};
var address = window.address;

address.init = function () {
    hootbus.on('statusObject:extraAction:internalLink', address.go);

    addressUtils.change(address.onChange);

    window.onhashchange = function (e) {
        hs.prevDashboardUrl = e.oldURL;
        hs.prevDashboardState = hs.dashboardState;
    };

    // emit the first event
    address.onChange(addressUtils.buildChangeEvent())
};

address.isPrimaryViewLoaded = coreViewUtils.isLoaded.bind(address, 'primary');
address.isInSecondaryView = coreViewUtils.isActive.bind(address);

/**
 * the function called when a route match
 * @callback routeLoader
 * @param {Object.<string, any>} params
 */

/**
 * Search for the first wildcard route in `routes`, based on `path`.
 * E.g. given `path` "a/b/c" it will search `routes` for the following wildcard paths
 * ["a/b/c*", "a/b*", "a*"], in that order, and return the first matching route (or
 * `undefined` if no match is found).
 *
 * @param {Object.<string, routeLoader>} routes
 * @param {string} path
 * @returns {routeLoader|undefined}
 */
address.getWildcardRouterByPath = function (routes, path) {
    let router = routes[path + '*'];
    if (!router) {
        const topPath = path.split('/').slice(0, -1).join('/');
        if (topPath !== '') {
            router = address.getWildcardRouterByPath(routes, topPath);
        }
    }
    return router;
};

/**
 *  This is where we handle an address (url) change in HootSuite
 *  similar to routes in Zend, we must determine which action corresponds with each path, passing query strings as parameters when neccessary
 *
 * @param {Object.<string, routeLoader)>} routes
 * @param {string} path
 * @returns {routeLoader|undefined}
 */
address.getRouterByPath = function (routes, path) {
    let router = routes[path];
    if (_.isUndefined(router) && _.isString(path)) {
        router = address.getWildcardRouterByPath(routes, path);
    }
    return router;
};

/**
 * Gets the previous path if it exists
 * @return {string|undefined}
 */
address.getPreviousPath = function () {
    var previousPath;
    _.some(hs.routes, function (value, key) {
        if (value === previousRoute) {
            previousPath = key;
            return true;
        }
        return false;
    });
    return previousPath;
};

address.onChange = function (e) {
    if (!hs.memberId) {
        // DC: don't do any deep linking if the user is not logged in
        return;
    }

    // Remove trailing slash
    var path = e.path.length > 1 ? e.path.replace(/\/$/, '') : e.path;
    var router = address.getRouterByPath(hs.routes, path);

    // new drafts mount point
    var draftParentNode = document.getElementById('draftsMountPoint');
    if (draftParentNode) {
        if (path === '/publisher/drafts') {
            // show the new drafts right hand side
            draftParentNode.style.visibility = "visible";
        } else {
            draftParentNode.parentNode.removeChild(draftParentNode);

            ReactDOM.unmountComponentAtNode(draftParentNode);
        }
    }

    if (_.isFunction(router) || _.isObject(router)) {
        address.preRouteChange();

        hootbus.emit('address:path:change', path);

        if (_.isFunction(router)) {
            router(e.parameters, path);
        } else if (_.isObject(router)) {
            SectionLoader.loadSection(router, e, previousRoute !== router);
        }

        setTimeout(address.checkRouteLoaded, 5000);
    } else {
        address.goToDefaultUrl();
    }

    previousRoute = router;
};

// call this before running function for route
address.preRouteChange = function () {
    // close all dialogs
    $('._dialog').each(function () {
        $(this).dialog('close');
    });
    // hide tooltip
    $("#tooltip").css({ 'top': '-100px' });
    // remove overlays
    $('#sidebarOverlay').remove();
};

address.checkRouteLoaded = function () {
    // check if an error occurred and re-init dashboard if needed
    if (address.isInSecondaryView() || address.isPrimaryViewLoaded()) {
        return;
    }

    // if user is loading up a hash with a popup, don't redirect, just load up the streams behind the popup
    var redirectToMain = $('.ui-dialog').length ? false : true;
    address.initDashboardLoad(redirectToMain);
};

/**
 *    Method for visiting a local path, accepts a callback which is available in hs.route functions
 */
address.go = function (url, callback) {
    // store callback function
    address.callback.set(callback);

    if (url.length && url.charAt(0) != '#') {
        url = '#' + url;
    } // always add hash
    var currUrl = '#' + addressUtils.value();
    if (url == currUrl) {
        // just call callback
        var cb = address.callback.get();
        _.isFunction(cb) && cb();
    } else {
        setTimeout(function () {
            util.doRedirect(url);
        }, 1);
    }
};
address.callback = {};
address.callback.clear = function () {
    address.callback.fn = null;
};
address.callback.set = function (fn) {
    if ($.isFunction(fn)) {
        address.callback.fn = fn;
    } else {
        address.callback.clear();
    }
};
address.callback.get = function () {
    var fn = address.callback.fn || null;
    address.callback.clear();
    return fn;
};

// default path to visit (useful to call this on path errors, etc)
address.goToDefaultUrl = function () {
    if (showHomePage) {
        address.go('#/home');
    } else {
        address.go('#/streams');
    }
};

address.goToMemberUrl = function () {
    address.go('#/member');
};


// checks if anything is loaded in the background of primaryView if we arent going to index
address.initDashboardLoad = function (redirectToDashboard) {
    redirectToDashboard = typeof redirectToDashboard == 'undefined' ? true : redirectToDashboard;	// default true
    if (!address.isPrimaryViewLoaded()) {
        var fnRedirect = redirectToDashboard ? address.reloadStreams : function () {
            window.loadStreams();
        };		// calling address.reloadStreams redirects to /#
        setTimeout(fnRedirect, 100);
    }
};

address.reloadStreams = function () {
    var url = window.location.href;
    if (!url.match(/#\/streams/)) {
        address.go('#/streams');
    } else {
        window.loadStreams();
    }
};

var addressResourceLoader = function (resource, loader) {
    return function (params) {
        var innerLoader = _.bind(loader, this, params);
        hs.require(resource, innerLoader);
    };
};

var publisherLoader = function (path, useCallback) {
    var loader;
    if (useCallback) {
        loader = function () {
            dashboard.loadPublisher(path, { callback: address.callback.get() });
        };
    } else {
        loader = function (params) {
            dashboard.loadPublisher(path, params);
        };
    }

    return addressResourceLoader('publisher', loader);
};

var getAssignmentsUrl = function (params) {
    var urlParams = params || {};

    // Remove blank memberId
    if (urlParams.memberId && parseInt(urlParams.memberId, 10) === 0) {
        delete urlParams.memberId;
    }

    // Translate old bookmarks using orgId not organizationId as the param
    if (urlParams.orgId) {
        urlParams.organizationId = urlParams.orgId;
        delete urlParams.orgId;
    }

    return "#/assignments-new" + '?' + $.param(urlParams);
};

var addConditionalRoute = function (path, loader, pred) {
    pred = (pred == null) ? false : pred; // default to false
    if (pred) {
        hs.routes[path] = loader;
    }
};

var showHomePage = hs.entryPoints.canAccessHomePage;

/**
 *    Declare all routes here
 *    All functions which need a query string get a param in their function, handle query string validation there
 *    NOTE: no trailing slash
 */
hs.routes = {
    "/": address.goToDefaultUrl,
    "/_=_": address.goToDefaultUrl,
    '/home': function (params, path) {
        if (showHomePage) {
            homePageLoader.handleRoute(params, path);
        } else {
            address.goToDefaultUrl();
        }
    },
    "/streams": function (param) {
        if (!hs.entryPoints.canAccessStream) {
            if (hs.entryPoints.canAccessAmplify) {
                // redirect to amplify app directly if amplify user doesn't have canAccessStream entitlement
                address.go('#/amplify')
                return
            }
        }

        if (param.completeReviewBoards) {
            var callback = address.callback.get();
            window.loadStreams(null, callback);
            return;
        }
        // Unable to have this function used directly. Must wrap in function
        // since it is not loaded onto the window before it is used. Added here:
        // https://github.hootops.com/web/dashboard/blob/master/static/js/src/dashboard.js#L1783
        window.loadStreams();
    },
    "/publisher": publisherLoader('scheduled', true),
    "/publisher/scheduled": publisherLoader('scheduled', true),
    "/publisher/approvequeue": publisherLoader('approvequeue'),
    "/publisher/pendingapproval": function (params) {
        hasEntitlement(hs.memberId, CUSTOM_APPROVALS).then(hasCustomApprovals => {
            if (hasCustomApprovals) {
                return hs.require('publisher', () => {
                    params.hasCustomApprovals = hasCustomApprovals
                    dashboard.loadPublisher('pendingapproval', params)
                });
            } else {
                address.goToDefaultUrl();
            }
        })
    },
    "/publisher/expired": publisherLoader('expired'),
    "/publisher/drafts": publisherLoader('drafts'),
    "/publisher/contentlibrary": publisherLoader('contentlibrary'),
    "/publisher/pastscheduled": publisherLoader('pastscheduled'),
    "/publisher/rejected": publisherLoader('rejected'),
    "/publisher/contentsource": publisherLoader('contentsource'),
    "/publisher/bulkcomposer": publisherLoader('bulkcomposer'),

    "/assignments": addressResourceLoader('streams', function (params) {
        // Track deeplink entries from the assignment notification emails
        var urlParams = params || {};
        if (urlParams.source && urlParams.type && urlParams.organizationId) {
            trackerDatalab.trackCustom('web.assignments_manager.deeplink', 'assignment_deeplink_entry', {
                assignment_type: urlParams.type,
                organizationId: urlParams.organizationId,
            });
        }
        address.go(getAssignmentsUrl(params));
    }),

    // Leftover redirects from legacy analytics
    "/stats*": function () {
        address.go('#/analytics');
    },

    "/settings": function () {
        window.loadSettings();
    },
    "/settings/account": function () {
        window.loadSettings('account');
    },
    "/settings/preferences": function () {
        window.loadSettings('preferences');
    },
    "/settings/preferences/notifications": function () {
        window.loadSettings('notifications');
    },
    "/settings/notifications": function () {
        window.loadSettings('notifications');
    },
    "/settings/vanityurl": function () {
        window.loadSettings('vanityurl');
    },
    "/settings/genesis": function () {
        window.loadSettings('genesis');
    },
    "/settings/autoschedule": function () {
        window.loadSettings('autoschedule');
    },

    "/tabs": function (param) {
        if (param.id && !isNaN(parseInt(param.id, 10))) {
            // check callback
            var callback = address.callback.get();
            window.loadStreams(param.id, callback);
            return;
        }
        address.goToDefaultUrl();
    },

    "/saved-items": function () {
        window.loadSavedItems();
    },

    '/twitter/user-info': function (param) {
        address.go('#/network/user-info?uId=' + param.u);		// deprecated function, so just uses network/user-info
    },
    '/network/user-info': function (param) {
        var callback = null;
        if (param.uId) {
            var uId = param.uId,
                snId = param.snId,
                isHideInsights = !!snId;

            callback = function () {
                window.stream.network.showUserInfoPopup(uId, snId, (isHideInsights) ? 'facebook' : '');
            };
        }
        window.loadStreams(null, callback);
    },
    '/appdirectory': function (params) {
        // loadAppDirectory takes 3 optional params: section, sectionParams, showInstallNotification
        // - section is the section name (e.g. 'all-apps')
        // - sectionParams is only for passing in the 'appId', used if section is 'app-details'
        // - showInstallNotification is not used (?)
        // Here we use the first arg to take in all our params.
        var decodedParams = {};
        if (params) {
            Object.keys(params).forEach(function (key) {
                if (params[key]) {
                    decodedParams[key] = decodeURIComponent(params[key]);
                } else {
                    decodedParams[key] = params[key];
                }
            });
        }
        window.loadAppDirectory(decodedParams);
    },

    '/featured-apps': function () {
        window.loadAppDirectory('featured-apps');
    },

    '/app-details': function (param) {
        window.loadAppDirectory({
            appId: param.id
        });
    },

    '/member': function () {
        dashboard.loadOrganizations('home', {});
    },
    '/organization-management*': function () {
        if (hs.entryPoints.canAccessOrganizationManagement) {
            organizationManagementLoader.load()
        } else {
            address.goToMemberUrl()
        }
    },

    '/organizations': function (param) {
        if (param.id) {
            dashboard.loadOrganizations('organization', { organizationId: param.id });
        } else {
            address.goToMemberUrl();
        }
    },

    '/organizations/social-networks': function (param) {
        var organizationId = (param.id && !isNaN(parseInt(param.id, 10))) ? param.id : null,
            snid = (param.snId && !isNaN(parseInt(param.snId, 10))) ? param.snId : null,
            tab = (param.tab) ? param.tab : null;
        dashboard.loadOrganizations('socialnetworks', {
            organizationId: organizationId,
            snId: snid,
            tab: tab
        });
    },

    '/organizations/teams': function (param) {
        var organizationId = (param.id && !isNaN(parseInt(param.id, 10))) ? param.id : null,
            teamid = (param.teamId && !isNaN(parseInt(param.teamId, 10))) ? param.teamId : null,
            tab = (param.tab) ? param.tab : null;
        if (organizationId) {
            dashboard.loadOrganizations('teams', {
                organizationId: organizationId,
                teamId: teamid,
                tab: tab
            });
            return;
        }
        address.goToMemberUrl();
    },

    '/organizations/members': function (param) {
        var organizationId = (param.id && !isNaN(parseInt(param.id, 10))) ? param.id : null,
            memberid = (param.memberId && !isNaN(parseInt(param.memberId, 10))) ? param.memberId : null,
            tab = (param.tab) ? param.tab : null;
        if (organizationId) {
            dashboard.loadOrganizations('members', {
                organizationId: organizationId,
                memberId: memberid,
                tab: tab
            });
            return;
        }
        address.goToMemberUrl();
    },

    '/organizations/monitoring': function (param) {
        var organizationId = parseInt(param.id, 10) || null;
        address.go('#/automation?id=' + organizationId);
    },

    '/organizations/settings*': function (params) {
        if (!hs.entryPoints.canAccessOrganizationsSettings) {
            address.goToDefaultUrl();
            return;
        }

        if (params.id) {
            dashboard.loadOrganizations('organization', {
                organizationId: params.id,
            });
        }

        organizationsSettingsLoader();
    },

    '/addnetwork/linkedin': function () {
        snActions.add({ selectedSocialNetwork: "LINKEDIN" });
    },

    '/addnetwork': function (param) {
        snActions.add({ selectedSocialNetwork: param.network && param.network.toUpperCase() });
    },

    '/new-analytics*': function () {
        address.go('#/analytics');
    },

    '/analytics*': function () {
        loadAnalytics();
    },

    '/insights*': function () {
        loadBrandwatch();
    },

    '/account*': function () {
        accountManagement.loadSection('/account');
    },

    '/planner': function (params, path) {
        plannerLoader.handleRoute(path, params);
    },

    '/promote': function () {
        address.go('#/advertise/promoted-posts');
    },
    '/advertise*': function () {
        advertiseLoader()
    },

    '/instagram-account-overview': function () {
        window.loadStreams();
        hootbus.emit('overlay:init', 'modal', 'instagramBusinessAccountOverview');
    },

    // IDT-19
    '/twitter-account-overview': function () {
        window.loadStreams();
        hootbus.emit('overlay:init', 'modal', 'twitterAccountOverview');
    },

    // STRAT-1341
    '/facebook-group-account-overview': function () {
        window.loadStreams();
        hootbus.emit('overlay:init', 'modal', 'facebookGroupAccountOverview');
    },

    '/tags': function (param) {
        var organizationId = parseInt(param.id, 10) || null;
        if (organizationId) {
            tagmanagerLoader.loadSection(organizationId);
            return;
        }
        address.goToMemberUrl();
    },

    '/compose': function (params) {
        getApp('hs-app-composer').then(function () {
            hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, params);
        });
    },

    "/hootbio": function () {
        if (hs.entryPoints.canAccessHootbio) {
            hootbioLoader();
        } else {
            address.goToDefaultUrl();
        }
    },

    // redirect from Hootdesk to Inbox 2.0
    '/hootdesk*': function () {
        address.go('#/inbox2');
    },

    '_dummy_': function () {
    }	// just in case someone forgets a trailing comma...
};

addConditionalRoute(
    '/inbox',
    inboxLoader,
    hs.entryPoints.canAccessInbox
);

addConditionalRoute(
    '/automation',
    function (param) {
        var organizationId = parseInt(param.id, 10) || null;
        if (organizationId) {
            automationLoader.loadSection(organizationId);
            return;
        }
        address.goToMemberUrl();
    },
    !hs.entryPoints.canAccessUnifiedInbox || hs.entryPoints.canAccessInbox
)

addConditionalRoute(
    '/inbox2*',
    sparkcentralLoader,
    hs.entryPoints.canAccessUnifiedInbox
);

addConditionalRoute(
    '/contentstudio',
    contentStudioLoader,
    hs.entryPoints.canAccessContentStudio
);

addConditionalRoute(
    '/inspiration*',
    contentStudioLoader,
    hs.entryPoints.canAccessContentStudio
);

addConditionalRoute(
    '/goals',
    goalsLoader,
    hs.entryPoints.canAccessGoals
);

addConditionalRoute(
    '/trends',
    trendsLoader,
    hs.entryPoints.canAccessTrends
);

addConditionalRoute(
    '/social-relationship-score*',
    socialRelationshipScoreLoader,
    hs.entryPoints.canAccessSocialRelationshipScore
);

addConditionalRoute(
    '/app-directory*',
    appDirectoryDashboardLoader,
    hs.entryPoints.canAccessAppDirectoryDashboard
);

addConditionalRoute(
    '/amplify*',
    amplifyLoader,
    hs.entryPoints.canAccessAmplify
);

addConditionalRoute(
    '/message',
    function (params) {
        var socialNetworkId = parseInt(params.socialNetworkId, 10) || null;
        var messageId = params.messageId;
        var commentId = params.commentId;
        var messageType = params.messageType;

        // TODO: fix single post view modal after ui refresh
        // singleMessageLoader.showMessageModal({socialNetworkId: socialNetworkId, messageId: messageId, commentId: commentId, messageType: messageType});
        singleMessageLoader.loadSection(socialNetworkId, messageId, commentId, messageType);
    },
    hs.entryPoints.canAccessNotificationCenter
);

export default address;
