import hootbus from "utils/hootbus";
import Loader from "hs-app-loader/components/loader";
import { getApp } from "fe-lib-async-app";

const PATH = "/organizations/settings";
const APP_NAME = "hs-app-organizations-settings";
const DASHBOARD_STATE = "organizations-settings";

const render = function (content) {
    hootbus.emit("toggleCoreViews:secondary", {
        content: content,
    });
};

const createAppNode = () => {
    const node = document.createElement("div");
    node.style.width = "100%";
    node.style.height = "100%";
    return node;
};

export default function () {
    render(Loader);

    hs.dashboardState = DASHBOARD_STATE;
    const rootNode = createAppNode();

    getApp(APP_NAME).then(function (app) {
        const appInstance = new app(rootNode);
        appInstance.render();

        render(rootNode);

        const cleanup = function () {
            if (!window.location.hash.startsWith(`#${PATH}`)) {
                appInstance.unmount();
                rootNode.remove();
                hootbus.off("address:path:change", cleanup);
            }
        };
        hootbus.on("address:path:change", cleanup);
    });
}
