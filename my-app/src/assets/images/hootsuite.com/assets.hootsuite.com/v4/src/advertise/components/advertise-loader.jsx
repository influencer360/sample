import hootbus from "utils/hootbus";
import Loader from "hs-app-loader/components/loader";
import { getApp } from "fe-lib-async-app";

const PATH = "/advertise";
const APP_NAME = "hs-app-advertising-container";
const DASHBOARD_STATE = "advertise";

let appMounted = false;

const render = function (content, params) {
    hootbus.emit("toggleCoreViews:secondary", {
        content: content,
        params: params || {},
    });
};

export default function (params) {
    if (!appMounted) {
        render(Loader);

        // set a dashboard state for the async-app
        hs.dashboardState = DASHBOARD_STATE;

        getApp(APP_NAME).then(function (app) {
            var node = document.createElement("div");
            app.mount(node, {});
            render(node, params);
            appMounted = true;

            const cleanup = function () {
                if (!window.location.hash.startsWith(`#${PATH}`)) {
                    app.unmount(node);
                    hootbus.off("address:path:change", cleanup);
                    appMounted = false;
                }
            };

            hootbus.on("address:path:change", cleanup);
        });
    }
}
