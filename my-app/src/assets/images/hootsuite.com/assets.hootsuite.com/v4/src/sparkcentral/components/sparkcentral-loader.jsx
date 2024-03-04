import hootbus from "utils/hootbus";
import Loader from "hs-app-loader/components/loader";
import { getApp } from "fe-lib-async-app";
import {
    SESSION_STATUSES,
    updateSessionStatus,
    handleLoadingError,
    handleRuntimeError,
} from "../utils/errors";

const PATH = "/inbox2";
const APP_NAME = "hs-app-sparkcentral";

const render = (content, params) => {
    hootbus.emit("toggleCoreViews:secondary", {
        content: content,
        params: params || {},
    });
};

export default function (params) {
    try {
        render(Loader);

        hs.dashboardState = "sparkcentral";

        getApp(APP_NAME)
            .then((app) => {
                const node = document.createElement("div");
                app.mount(node, {});
                render(node, params);
                const cleanup = () => {
                    if (!app.isPath(PATH)) {
                        app.unmount(node);
                        updateSessionStatus(SESSION_STATUSES.SUCCESS);
                        hootbus.off("address:path:change", cleanup);
                    }
                };
                hootbus.on("address:path:change", cleanup);
            })
            .catch((e) => handleLoadingError(e, APP_NAME));

        hootbus.on("sparkcentral.errors.ErrorBoundaryError", (e) =>
            handleRuntimeError(e.error, APP_NAME)
        );
    } catch (e) {
        handleLoadingError(e, APP_NAME);
    }
}
