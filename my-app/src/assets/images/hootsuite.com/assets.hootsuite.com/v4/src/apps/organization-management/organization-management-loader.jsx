import {getApp} from 'fe-lib-async-app';
import {add as addCallout} from "fe-lib-async-callouts";
import {CALLOUTS} from "fe-comp-callout";
import {TYPE_ERROR} from "fe-comp-banner";
import hootbus from 'utils/hootbus';
import trackerDatalab from 'utils/tracker-datalab';
import translation from 'utils/translation';
import { getPerformanceMetrics } from 'fe-lib-performance-metrics';
import { logError } from 'fe-lib-logging';

const PATH = "/organization-management";

let appMounted = false;

const render = (content, params) => {
    hootbus.emit('toggleCoreViews:secondary', {content: content, params: params || {}});
}

export default {
    load: () => {
        hs.dashboardState = 'organization-management';
        if (!appMounted) {
        
            getApp('hs-app-organization-management')
            .then((app) => {
                
                const node = document.createElement('div');
                    node.style.height = '100%';
                    node.style.overflow = 'auto'; 
                    app.mount(node, {});
                    render(node);

                    const cleanup = function () {
                        if (!window.location.hash.startsWith(`#${PATH}`)) {
                            app.unmount(node);
                            hootbus.off("address:path:change", cleanup);
                            appMounted = false;
                        }
                    }

                    hootbus.on("address:path:change", cleanup);
            })
            .catch((e) => {
                trackerDatalab.trackCustom("web.dashboard.organization_management", "user_failed_to_load_organization_management");

                    getPerformanceMetrics('hs_app_organization_management')
                        .getCounter(
                            'load_failed'
                        )
                        .inc()

                    logError(
                        'hs_app_organization_management',
                        'Organization management async app failed to load',
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
    }
}
