import React from "react";
import ReactDOM from "react-dom";
import hootbus from "utils/hootbus";
import { TikTokBusinessPaywallModal as tikTokBusinessPaywallModal } from "fe-chan-comp-tiktokbusiness-paywall-modal";

function openTikTokBusinessPaywallModal() {
    const PAYWALL = {
        "freeUser": {
            url: "/upgrade/tiktok",
            type: "FREEUSER"
        },
        "previousTrial": {
            url: "/billing/change?to=PROFESSIONAL_PLAN&promo=xw50",
            type: "PREVIOUSTRIAL"
        }
    };

    const getPaywall = function () {
        if (hs.isFeatureEnabled("TIKTOK_PAYWALL_PREVIOUS_TRIAL")) {
            return PAYWALL.previousTrial;
        }
        return PAYWALL.freeUser;
    };

    const paywall = getPaywall();

    const plansUpgrade = function () {
        window.location.href = paywall.url;
        unmountAndRemoveContainer()
    };

    var container = document.createElement("div");
    container.id = "tiktok_business_paywall_container";
    document.body.appendChild(container);

    // Function to close modal from inside the component
    var componentCloseModal = null;

    var unmountAndRemoveContainer = function () {
        ReactDOM.unmountComponentAtNode(container);
        container.parentNode.removeChild(container);
        componentCloseModal = function () {};
        hootbus.emit('modal:close');
    };

    var props = {};

    props.onOpen = function (closeModal) {
        // Save the function to close the modal from within the component
        componentCloseModal = function () {
            closeModal();
            unmountAndRemoveContainer();
        };
        hootbus.emit('modal:open');
    };
    props.onDismiss = function () {
        // When the modal has been closed from within
        unmountAndRemoveContainer();
    };
    props.onClickUpgrade = plansUpgrade;
    props.paywallType = paywall.type;

    ReactDOM.render(
        React.createElement(tikTokBusinessPaywallModal, props),
        container
    );

    return {
        close: componentCloseModal,
    };
}

export default openTikTokBusinessPaywallModal;
