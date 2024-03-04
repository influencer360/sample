import { getApp } from 'fe-lib-async-app';
import trackerDatalab from 'utils/tracker-datalab';

let appMounted = false;

export default {
    loadApp: () => {
        if (!appMounted) {
            getApp('hs-app-onboarding')
            .then(app => {
                app.init();
                const container = document.createElement("div");
                container.id = "gettingStartedGuideContainer";
                document.body.appendChild(container);
                app.mount(container, {});
                appMounted = true;
            })
            .catch(e => {
                trackerDatalab.trackCustom('web.dashboard.getting_started', 'user_failed_to_load_getting_started_guide');
                throw e;
            });
        }
    }
}
