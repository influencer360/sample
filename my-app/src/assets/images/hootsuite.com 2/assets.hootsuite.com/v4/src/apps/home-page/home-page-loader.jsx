import {getApp} from 'fe-lib-async-app';
import {add as addCallout} from "fe-lib-async-callouts";
import {CALLOUTS} from "fe-comp-callout";
import {TYPE_ERROR} from "fe-comp-banner";
import Loader from 'hs-app-loader/components/loader';
import hootbus from 'utils/hootbus';
import trackerDatalab from 'utils/tracker-datalab';
import translation from 'utils/translation';
import {getPerformanceMetrics} from "fe-lib-performance-metrics";
import {logError} from "fe-lib-logging";
import darklaunch from 'utils/darklaunch';
import { PRODUCTION, STAGING, DEV, env } from 'fe-lib-env';
import { apertureApiRequest } from 'fe-comp-aperture';

const PATH = "/home";

const apertureDomains = {
    [DEV]: 'development-api-services.hootsuite.com',
    [STAGING]: 'staging-api-services.hootsuite.com',
    [PRODUCTION]: 'api-services.hootsuite.com'
  }
const DOMAIN = apertureDomains[env()];

const homepage = {
    appName: 'hs-app-home-page',
    logName: 'hs_app_homepage',
    trackOrigin: 'web.dashboard.home_page',
    loaded: 'user_loaded_home_page',
    error: 'user_failed_to_load_home_page'
};
const ecommHomepage = {
    appName: 'hs-app-ecomm-home-page',
    logName: 'hs_app_ecomm_homepage',
    trackOrigin: 'web.dashboard.ecomm_home_page',
    loaded: 'user_loaded_ecomm_home_page',
    error: 'user_failed_to_load_ecomm_home_page'
};


let appMounted = false;

function getEndpoint(memberId, flagId) {
    return `/service/optimizely/v1/members/${memberId}/flag-decisions/${flagId}`;
}

async function fetchOptimizelyFlagDecision(flagName) {
    return apertureApiRequest(DOMAIN, getEndpoint(window.hs.memberId, flagName));
}

const render = (content, params) => {
    hootbus.emit('toggleCoreViews:secondary', {content: content, params: params || {}});
}

const renderSelectedApp = (selectedAppDetails, params) => {
    render(Loader);
    getApp(selectedAppDetails.appName)
        .then(app => {
            const node = document.createElement('div');
            node.style.height = '100%';
            node.style.overflow = 'auto';
            app.mount(node, {});
            render(node, params);
            trackerDatalab.trackCustom(selectedAppDetails.trackOrigin, selectedAppDetails.loaded);
            appMounted = true;
            const cleanup = function () {
                if (!window.location.hash.startsWith(`#${PATH}`)) {
                    app.unmount(node);
                    hootbus.off("address:path:change", cleanup);
                    appMounted = false;
                }
            }

            hootbus.on("address:path:change", cleanup);
        })
        .catch(e => {
            trackerDatalab.trackCustom(selectedAppDetails.trackOrigin, selectedAppDetails.error);

            getPerformanceMetrics(selectedAppDetails.logName)
                .getCounter(
                    'load_failed', 'Counter for homepage load errors'
                )
                .inc()

            logError(
                selectedAppDetails.logName,
                'Homepage async app failed to load',
                {
                    errorMessage: JSON.stringify(e.message),
                    stack: JSON.stringify(e.stack),
                }
            )

            addCallout({
                calloutType: CALLOUTS.TOAST.NAME,
                type: TYPE_ERROR,
                messageText: translation._('Something went wrong please refresh and try again.'),
            });
            throw e;
        });
}

export default {
    handleRoute: (path, params) => {
        hs.dashboardState = 'home';
        if (!appMounted) {
            if (darklaunch.isFeatureEnabled('RPL_397_ECOMM_HOMEPAGE_EXPERIMENT')) {
                fetchOptimizelyFlagDecision('srs_ss_ecomm_homepage_1_0')
                    .then(response => response.json())
                    .then(response => {
                        const appDetails = response.enabled && response.ruleKey === 'srs_ss_ecomm_homepage_1_0' && response.variationKey === 'variation_1' ? ecommHomepage : homepage;
                        renderSelectedApp(appDetails);
                    })
                    .catch(() => renderSelectedApp(homepage, params));    
            } else {
                renderSelectedApp(homepage, params);
            }            
        }
    }
}
