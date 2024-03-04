import React from "react";
import ReactDOM from "react-dom";
import hootbus from "utils/hootbus";
import { IgbStealDowngradeErrorModal } from "fe-chan-comp-igb-steal-downgrade-error-modal";

function openIgbStealDowngradeErrorModal(orgAndTeam) {
    const selectConnectAsInstagramBusiness = function () {
        hootbus.emit("socialNetwork:addNetwork:igbAuthProcess", orgAndTeam);
        unmountAndRemoveContainer()
    };

    var container = document.createElement("div");
    container.id = "igb_steal_downgrade_error_container";
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
        unmountAndRemoveContainer();
    };
    props.connectAsInstagramBusiness = selectConnectAsInstagramBusiness;

    ReactDOM.render(
        React.createElement(IgbStealDowngradeErrorModal, props),
        container
    );

    return {
        close: componentCloseModal,
    };
}

export default openIgbStealDowngradeErrorModal;
