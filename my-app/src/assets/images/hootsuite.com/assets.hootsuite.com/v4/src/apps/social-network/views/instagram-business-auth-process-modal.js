import React from "react";
import ReactDOM from "react-dom";
import hootbus from "utils/hootbus";
import trackerDataLab from 'utils/tracker-datalab';
import { IgbAuthProcessModal as FeCompIgbAuthProcessModal } from "fe-chan-comp-igb-auth-process-modal";

const TRACKING_ORIGIN = 'web.dashboard.instagram_business_auth_process_modal';

function openFeCompIgbAuthProcessModal(orgAndTeam) {
    trackerDataLab.trackCustom(TRACKING_ORIGIN, 'log_in_clicked');

    const selectAddInstagramBusiness = function () {
        hootbus.emit(
            "socialNetwork:authorize:command",
            "INSTAGRAMBUSINESS",
            orgAndTeam
        );
        unmountAndRemoveContainer()
    };

    var container = document.createElement("div");
    container.id = "igb_auth_process_container";
    document.body.appendChild(container);

    // Function to close the modal from inside the component
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
        trackerDataLab.trackCustom(TRACKING_ORIGIN, 'cancel_clicked');
        unmountAndRemoveContainer();
    };

    if (hs.isFeatureEnabled('CI_3403_IGB_AUTH_PROCESS_REBRAND')) {
        props.showAuthProcessRebrand = true;
    }

    props.addInstagramBusinessAccount = selectAddInstagramBusiness;

    ReactDOM.render(
        React.createElement(FeCompIgbAuthProcessModal, props),
        container
    );

    return {
        close: componentCloseModal,
    };
}

export default openFeCompIgbAuthProcessModal;
