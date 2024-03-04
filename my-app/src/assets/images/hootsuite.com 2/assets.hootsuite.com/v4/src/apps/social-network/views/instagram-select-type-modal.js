import React from "react";
import ReactDOM from "react-dom";
import hootbus from "utils/hootbus";
import { SelectInstagramProfileTypeModal } from "fe-chan-comp-select-instagram-type-modal";

function openSelectInstagramProfileTypeModal(orgAndTeam) {
    const selectInstagramPersonalType = function () {
        hootbus.emit(
            "socialNetwork:authorize:command",
            "INSTAGRAM",
            orgAndTeam
        );
        unmountAndRemoveContainer()
    };

    const selectInstagramBusinessType = function () {
        hootbus.emit("socialNetwork:addNetwork:igbAuthProcess", orgAndTeam);
        unmountAndRemoveContainer()
    };
    var container = document.createElement("div");
    container.id = "select_instagram_profile_type_container";
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
    props.onClickInstagramPersonal = selectInstagramPersonalType;
    props.onClickInstagramBusiness = selectInstagramBusinessType;

    ReactDOM.render(
        React.createElement(SelectInstagramProfileTypeModal, props),
        container
    );

    return {
        close: componentCloseModal,
    };
}

export default openSelectInstagramProfileTypeModal;
