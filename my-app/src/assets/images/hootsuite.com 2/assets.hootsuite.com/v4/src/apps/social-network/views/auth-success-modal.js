import { getApp } from "fe-lib-async-app";
import { logError } from 'fe-lib-logging';
import hootbus from "utils/hootbus";

function getModalContainer(id) {
    try {
        let container = document.getElementById(id);
        if (!container) {
            const newContainer = document.createElement("div");
            newContainer.id = id;
            document.body.appendChild(newContainer);
            container = document.getElementById(id);
        }
        // resize and center window if not mobile
        var isMobile = window.innerWidth < 480;
        if (!isMobile) {
            var modalWidth = 720;
            var modalHeight = 736;

            const topOffset = ((window.outerHeight-modalHeight)/2);
            const leftOffset = ((window.innerWidth-modalWidth)/2);

            container.style.position = "absolute";
            container.style.width = modalWidth.toString() + "px";
            container.style.height = modalHeight.toString() + "px";
            container.style.top = ((topOffset/window.outerHeight)*100).toString() + "%";
            container.style.left = ((leftOffset/window.innerWidth)*100).toString() + "%";
        }
        return container;
    } catch(e) {
        const errorDetails = {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack)
        }
        logError(
            'auth_success_modal',
            'Could not return container for mounting Auth Success Modal',
                errorDetails)
        return null;
    }
}

function launchAuthSuccessModal(data) {
    const container = getModalContainer( "auth_success_modal_container");

    // Exit early if we have no mount container
    if (!container) {
        return;
    }

    const unmountAndRemoveContainer = function () {
        getApp("hs-app-auth-modals").then(function (hsAppAuthModal) {
            hsAppAuthModal.unmount(container);
        });
        container.parentNode.removeChild(container);
        hootbus.emit('modal:close');
    };

    const props = {};
    props.onClose = function () {
        unmountAndRemoveContainer();
    };

    var group = data.organizationName ?? "private social accounts";
    props.socialAccounts = [{
        "name": data.username,
        "avatar": data.avatar,
        "group": group,
        "socialNetwork": data.profileType,
        "socialNetworkId": data.socialNetworkId
    }];

    getApp("hs-app-auth-modals").then(function (hsAppAuthModal) {
        hsAppAuthModal.mountAuthSuccessModal(container, props);
        hootbus.emit('modal:open');
    });
}

export default function(data) {
    if (document.readyState === "complete" || document.readyState === "loaded") {
        launchAuthSuccessModal(data);
    } else {
        document.addEventListener('DOMContentLoaded', () => launchAuthSuccessModal(data), { once: true });
    }
}
