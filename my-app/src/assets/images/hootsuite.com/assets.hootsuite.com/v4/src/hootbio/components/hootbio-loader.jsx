import hootbus from 'utils/hootbus';
import Loader from 'hs-app-loader/components/loader';
import { getApp } from 'fe-lib-async-app';

const PATH = '/hootbio';
const APP_NAME = 'hs-app-link-bio';
const DASHBOARD_STATE = 'hootbio';

const render = function (content, params) {
    hootbus.emit('toggleCoreViews:secondary', {
        content: content,
        params: params || {},
    });
};

export default function (params) {
    render(Loader);

    hs.dashboardState = DASHBOARD_STATE;

    getApp(APP_NAME).then(function (app) {
        const node = document.createElement('div');
        app.mount(node, {});
        render(node, params);

        const cleanup = function () {
            if (!window.location.hash.startsWith(`#${PATH}`)) {
                app.unmount(node);
                hootbus.off('address:path:change', cleanup);
            }
        };

        hootbus.on('address:path:change', cleanup);
    });
}
