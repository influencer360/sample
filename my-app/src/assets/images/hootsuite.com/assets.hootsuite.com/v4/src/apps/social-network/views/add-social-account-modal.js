import { captureMessage, captureException } from "@sentry/browser";

import _ from "underscore";
import hootbus from "utils/hootbus";
import { getApp } from "fe-lib-async-app";
import { getEntitlementsByFeatureCode } from 'utils/entitlements';
import statusHelper from "utils/status-helper";
import translation from "utils/translation";
import { isTikTokEnabled } from 'fe-lib-darklaunch';

const TIKTOK_PAYWALL_ENTITLEMENT = "TIKTOK";

function addSocialAccount(socialAccountType, orgAndTeam) {
    const organizationsCount = Number(hs.organizations && hs.organizations.length);

    if (socialAccountType == "INSTAGRAM") {
        hootbus.emit("socialNetwork:addNetwork:instagramType", orgAndTeam);
    }
    //TODO: Remove isTikTokEnabled DL after release.
    else if (socialAccountType == "TIKTOKBUSINESS" && isTikTokEnabled()) {
        checkTikTokBusinessEntitlement(orgAndTeam, organizationsCount);
    } else {
        hootbus.emit(
            "socialNetwork:authorize:command",
            socialAccountType,
            orgAndTeam
        );
    }
}

function checkTikTokBusinessEntitlement(orgAndTeam, organizationsCount) {
    getEntitlementsByFeatureCode(hs.memberId, TIKTOK_PAYWALL_ENTITLEMENT).then(function (paywallEntitlement) {
        const shouldDisplayPaywall = paywallEntitlement
            && paywallEntitlement.permission
            && paywallEntitlement.permission.value < 1
            && organizationsCount === 0;
        if (shouldDisplayPaywall) {
            hootbus.emit("socialNetwork:showPaywall:tiktokbusiness", orgAndTeam);
        } else {
            hootbus.emit(
                "socialNetwork:authorize:command",
                "TIKTOKBUSINESS",
                orgAndTeam
            );
        }
    }).catch((e) => {
        if (hs.isFeatureEnabled("CI_2548_ENTITLEMENT_CHECK_METRICS")) {
            captureMessage(`Entitlements check failed at checkTikTokBusinessEntitlement: ${e}`)
            captureException(e);
        }
        statusHelper.displayError({
            message: translation._("Sorry, we couldn't connect your TikTok account.")
        });
    })
}

export default function(data, options) {
    const container = document.createElement("div");
    container.id = "add_social_account_modal_container";
    document.body.appendChild(container);

    const unmountAndRemoveContainer = function () {
        getApp("hs-app-auth-modals").then(function (hsAppAuthModals) {
            hsAppAuthModals.unmount(container);
        });
        container.parentNode.removeChild(container);
        hootbus.emit('modal:close');
    };

    // Build the props object that will be passed to the component
    var props = _.pick(options, [
        "showPrivateNetworkDestination",
        "socialNetworks",
        "selectedDestination",
    ]);
    props.onDismiss = function () {
        // When the modal has been closed from within
        unmountAndRemoveContainer();
    };
    props.addAccount = addSocialAccount;
    var organizations = data.organizations
        ? Object.values(data.organizations)
        : [];
    var teams = data.teams ? Object.values(data.teams) : [];
    props.dashboardOrganizationsAndTeams = organizations.concat(teams);
    if (options.organizationId && !options.selectedDestination) {
        props.selectedDestination = {
            organizationId: options.organizationId,
        };
    }
    if (options.hidePicker) {
        props.hideDestinationPicker = options.hidePicker;
    }

    getApp("hs-app-auth-modals").then(function (hsAppAuthModals) {
        hsAppAuthModals.mountAddSocialAccountModal(container, props);
        hootbus.emit('modal:open');
    });

    return {
        close: unmountAndRemoveContainer,
    };
}
