import React from 'react';
import ReactDOM from 'react-dom';

import { BouncingBars } from 'fe-comp-loader';
import { getApp } from 'fe-lib-async-app';
import { abortStreamRefresh } from 'hs-app-streams/lib/services/message-list';

// utils
import ajaxQueueManager from 'utils/ajax-queue-manager';
import darklaunch from 'utils/darklaunch';
import util from 'utils/util';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import AbortionError from 'hs-nest/lib/error/abortion-error';
import _ from 'underscore';

// stores
import baseFlux from 'hs-nest/lib/stores/flux';
import { ORGANIZATIONS } from 'hs-nest/lib/actions';

import { setSelectedOrganization, getState as getOrganizationState } from 'fe-pnc-data-organizations';
import { getSocialProfilesAndPopulateStore } from 'fe-pnc-data-social-profiles-v2'

// config
import NetworksConf from 'utils/networks-conf';
import PublisherConstants from 'components/publisher/constants';

// components
import LinkedInComposePopover from 'components/publisher/linkedin-compose-popover';

// callouts
import { add as addCallout } from 'fe-lib-async-callouts';
import { CALLOUTS } from 'fe-comp-callout';
import { TYPE_ERROR } from 'fe-comp-banner';

// utils
import { setOrganizations, getSortedByOwner } from 'components/publisher/utils/organization-utils';
import {
    handleLoadingError,
    handleRuntimeError,
    SESSION_STATUSES,
    updateSessionStatus,
} from '../utils/errors';
import { LCP, measureTTL, recordLoadAttempt, PLANNER_INITIAL_RENDER_TIME_START_MARK } from '../utils/metrics';

const lcpMetric = new LCP();

/**
 * helper function to exclude social profiles that are not supported in Planner
 * @returns {*}
 */
const getSocialProfilesForPlanner = () => {
    //get network types that are not supported in Planner
    const excludedNetworkTypes = NetworksConf.getExcludedNetworkTypesForComponent('PLANNER', 'COMMON');
    //condition to remove network from the array
    const isNetworkExcluded = (network) => {
        return _.some(excludedNetworkTypes, (excludedType) => excludedType === network.type);
    };

    //exclude networks that are not supported in Planner from hs.socialNetworks
    const socialNetworksArray = _.reject(hs.socialNetworks, isNetworkExcluded);

    //transform result array into object with socialNetworkIds as the properties/keys to match
    //the expected hs.socialNetworks format and return it
    return socialNetworksArray.reduce((obj, sn) => {
        obj[sn.socialNetworkId] = sn;
        return obj;
    }, {});
};

const DOM_CONTAINER_ID = 'plannerMountPoint';

const getOrganizations = () => {
    const organizationsStore = baseFlux.getStore(ORGANIZATIONS);
    const organizations = organizationsStore.getSortedByOwner(hs.memberId);

    if (organizations && Object.keys(organizations).length) {
        return Promise.resolve(organizations);
    } else {
        return baseFlux
            .getActions(ORGANIZATIONS)
            .fetch(true)
            .then(orgs => {
                if (darklaunch.isFeatureEnabledOrBeta('PUB_31667_FIX_ORG_FETCH_IN_PLANNER')) {
                    const sortedOrgs = getSortedByOwner(orgs, hs.memberId)
                    setOrganizations(sortedOrgs)
                } else {
                    return organizationsStore.getSortedByOwner(hs.memberId)
                }
            })
            .catch((e) => {
                if (!AbortionError.isAbortionError(e)) {
                    hs.statusObj.update(translation._('Unable to retrieve organizations'), 'error', true); // prettier-ignore
                }
            });
    }
};

// TODO: Remove with PUB_31667_FIX_ORG_FETCH_IN_PLANNER
const syncOrganizationStores = (organizations) => {
    const organizationsStore = baseFlux.getStore(ORGANIZATIONS);
    const shouldPopulateStore = !organizationsStore.state.initialized;

    if (shouldPopulateStore) {
        setOrganizations(organizations);
    }

    if (typeof window !== 'undefined' && !window.localStorage) {
        setSelectedOrganization(organizationsStore.getSelectedOrganization());
    }
};

export default {
    domContainer: DOM_CONTAINER_ID,

    handleRoute(path, params) {
        try {
            // Do not remount Planner if it's already loaded as componentWillUnmount
            // will not fire but componentDidMount will. This will cause issues as
            // event listeners will be added again causing duplicates because the
            // the previous listeners were not removed.
            if (!document.getElementById(this.domContainer)) {
                updateSessionStatus(SESSION_STATUSES.SUCCESS);
                recordLoadAttempt();
                this.loadSection();
                this.loadApp(path, params);
            }
        } catch (e) {
            if (!e.logged) {
                handleLoadingError(
                    'Failed to load planner dom node failure',
                    e
                );
                e.logged = true;
            }
            addCallout({
                calloutType: CALLOUTS.TOAST.NAME,
                type: TYPE_ERROR,
                messageText: translation._('Something went wrong please refresh and try again.'), // prettier-ignore
            });
            throw e;
        }
    },

    loadBundle(callback) {
        if (this._PlannerApp) {
            callback(this._PlannerApp);
        } else {
            getApp('hs-app-planner')
                .then((hsPlanner) => {
                    if (darklaunch.isFeatureEnabledOrBeta('PUB_31583_PRELOAD_PLANNER_BUNDLE')) {
                        // pre-load the composer bundle to improve initial load time
                        getApp('hs-app-composer');
                    }

                    this._PlannerApp = hsPlanner;

                    // Save element identifiers for LCP custom metric measurement
                    lcpMetric.setElementIdentifiers(this._PlannerApp.getElementIdentifiers())

                    callback(this._PlannerApp);
                })
                .catch((e) => {
                    hs.statusObj.update(translation._('Planner failed to load, please refresh and try again.'), 'error', true); // prettier-ignore
                    handleLoadingError('Failed to load planner bundle', e);
                });
            hootbus.on('plancreate.planner.ErrorBoundaryError', (e) =>
                handleRuntimeError(e)
            );
        }
    },

    loadSection() {
        hs.dashboardState = 'planner';
        const loadingDiv = document.createElement('div');
        ReactDOM.render(<BouncingBars />, loadingDiv);
        hootbus.emit('toggleCoreViews:secondary', { content: loadingDiv });
    },

    loadApp(path, params) {
        hs.statusObj.update(translation._('Loading') + '&hellip;', 'info');
        this._path = path;
        this._params = params;

        this.renderApp();
    },

    postLoad() {
        const urlParams = util.getURLParamsFromHash();
        if (urlParams && urlParams.showWalkthrough) {
            hootbus.emit('overlay:init', 'wizard', urlParams.showWalkthrough);
        }

        hootbus.emit('dashboard:planner:loaded');
    },

    renderApp() {
        hs.statusObj.reset();

        if (darklaunch.isFeatureEnabled('LPLAT_2324_FIX_STREAMS_ABORT_ERROR')) {
            abortStreamRefresh();
        } else {
            if (ajaxQueueManager('qstream').inProgress > 0) {
                if (darklaunch.isFeatureEnabled('PUB_25645_ABORT_ERROR_FIX')) {
                    stream.stream.abortRefreshes();
                } else {
                    ajaxQueueManager('qstream').abort();
                }
            }
        }

        // Start Planner Time to Load historgram timers which will be ended in hs-app-planner
        measureTTL();

        // Start to observe render timings of Planner's largest most important elements
        lcpMetric.observe();

        this.loadBundle((PlannerAppEntryPoint) => {
            //get only socialProfiles that are supported in Planner
            const socialNetworksForPlanner = getSocialProfilesForPlanner();

            // ensure that orgs are loaded before loading planner
            getOrganizations()
                .then((organizations) => { // TODO: Remove organizations with PUB_31667_FIX_ORG_FETCH_IN_PLANNER
                    // its possible for a user to switch to another location before the callback is called so
                    // check if we're still on planner
                    const path = window.location.href.split('#').slice(-1)[0];
                    if (/^\/planner/.test(path)) {
                        if (darklaunch.isFeatureEnabledOrBeta('PUB_31667_PREFETCH_SOCIAL_PROFILES')) {
                            getSocialProfilesAndPopulateStore(getOrganizationState().selectedOrganization?.organizationId)
                        }
                        if (!darklaunch.isFeatureEnabledOrBeta('PUB_31667_FIX_ORG_FETCH_IN_PLANNER')) {
                            syncOrganizationStores(organizations);
                        }

                        const parentNode = document.createElement('div');
                        parentNode.id = DOM_CONTAINER_ID;
                        parentNode.style.position = 'absolute';
                        parentNode.style.width = '100%';
                        parentNode.style.height = '100%';
                        hootbus.emit('toggleCoreViews:secondary', {
                            content: parentNode,
                        });

                        // Measure the render time only for direct Planner loads, once per session
                        if (darklaunch.isFeatureEnabledOrBeta('PUB_31667_PLANNER_METRICS_LOGGING') && !window.hs?.prevDashboardUrl) {
                            performance.mark(PLANNER_INITIAL_RENDER_TIME_START_MARK)
                        }

                        PlannerAppEntryPoint.renderPlanner(parentNode);

                        hootbus.on(
                            'address:path:change',
                            this.unmountIfPathChanged,
                            this
                        );

                        const isAuthedLinkedIn = (socialNetwork) => {
                            return (
                                !socialNetwork.isReauthRequired &&
                                socialNetwork.type ===
                                PublisherConstants.SN_TYPES.LINKEDINCOMPANY
                            );
                        };

                        // Show the LinkedIn popover if the user has access to at least one authed company page
                        if (
                            !hs.memberExtras.hasSeenLinkedInComposePopover &&
                            Object.values(socialNetworksForPlanner).find(
                                isAuthedLinkedIn
                            )
                        ) {
                            // Deferred to ensure everything else has been rendered and positioning will be correct
                            setTimeout(() => {
                                LinkedInComposePopover.render('.networkTitle');
                            }, 500);
                        }
                    } else {
                        this.unmountIfPathChanged(path);
                    }
                })
                .catch((e) => {
                    handleLoadingError('Failed to load planner rendering', e);
                })
                .then(this.postLoad);
        });
    },

    unmountIfPathChanged(path) {
        // Unmount component when moving to a different tab
        if (!/^\/planner/.test(path)) {
            if (this._PlannerApp) {
                const container = document.getElementById(this.domContainer);
                if (container) {
                    this._PlannerApp.unmount(container);
                    updateSessionStatus(SESSION_STATUSES.SUCCESS);
                }
            }

            hootbus.off('address:path:change', this.unmountIfPathChanged);
            LinkedInComposePopover.hide();
        }
    },
};
