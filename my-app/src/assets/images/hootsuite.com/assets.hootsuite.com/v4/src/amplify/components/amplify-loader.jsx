import hootbus from 'utils/hootbus';
import Loader from 'hs-app-loader/components/loader';
import { getApp } from 'fe-lib-async-app';

const PATH = '/amplify';
const APP_NAME = 'hs-app-amplify';
const DASHBOARD_STATE = 'amplify'

const render = function (content, params) {
    hootbus.emit('toggleCoreViews:secondary', { content: content, params: params || {} });
};

export default function (params) {
    render(Loader);

    // set a dashboard state for the async-app
    hs.dashboardState = DASHBOARD_STATE;

    getApp(APP_NAME)
        .then(function (app) {
            var node = document.createElement('div');
            app.mount(node, {});
            render(node, params);

            const cleanup = function () {
                if (!app.isPath(PATH)) {
                    app.unmount(node);
                    hootbus.off('address:path:change', cleanup);
                }
            };

            hootbus.on('address:path:change', cleanup);
        });
}
