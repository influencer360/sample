import { getApp } from "fe-lib-async-app";
import hootbus from "utils/hootbus";

const APP_NAME = "hs-app-in-app-payment-wizard";
const PENDO_EVENT = "pendo:openInAppPaymentWizard";

export default function () {
    hootbus.on(PENDO_EVENT, (props = {}) => {
        getApp(APP_NAME).then(function (app) {
            app.renderFullScreen(props);
        });
    });
    // We need to remove "#" from url to use searchParams.get
    const currentUrl = new URL(window.location.href.replace(/#/g, ""));
    const openInAppPaymentWizard = Boolean(
        currentUrl.searchParams.get("openInAppPaymentWizard")
    );
    if (openInAppPaymentWizard) {
        const productCode = currentUrl.searchParams.get("productCode");
        const addonCode = currentUrl.searchParams.get("addonCode");
        const couponCode = currentUrl.searchParams.get("couponCode");
        getApp(APP_NAME).then(function (app) {
            app.renderFullScreen({
                ...(productCode ? { productCode } : {}),
                ...(addonCode ? { addonCode } : {}),
                ...(couponCode ? { couponCode } : {}),
            });
        });
    }
}
