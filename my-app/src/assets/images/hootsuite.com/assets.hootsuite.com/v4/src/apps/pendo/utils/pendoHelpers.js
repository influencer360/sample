import _ from "lodash";
import { trackGAEvent } from "fe-lib-ga-tracking";
import { getMemberId, getMemberMaxPlanCode } from "fe-lib-hs";
import {
    loadChilipiperWidget,
    emitPendoEvent,
    emitOpenSocialNetworkExpirationEvent,
} from "fe-lib-pendo";
import trackerDatalab from "utils/tracker-datalab";
import { env, PRODUCTION } from "fe-lib-env";

/**
 * Moves the Pendo Paywall inline, before a given HTML element.
 * Optionally, it applies a custom CSS to the paywall. By default, the CSS is an empty string
 *
 * **Note** The standard Pendo CSS is overridden by the given CSS. So, some properties set from
 * the Pendo UI will be overwritten (e.g. z-index)
 *
 * @examples
 *  // inline the paywall before the element #my-calendar
 *  pendoHelpers.inlinePaywallBefore(document.getElementById('my-calendar'))
 *
 *  // inline the paywall before the element #my-calendar, and add custom border
 *  pendoHelpers.inlinePaywallBefore(
 *    document.getElementById('my-calendar'),
 *    'border-bottom: 1px solid gray'
 *  )
 *
 * @param {HTMLElement} anchorElement
 * @param {string} [customCss='']
 */
const inlinePaywallBefore = (anchorElement, customCss = "") => {
    const pendoContainer = document.getElementById("pendo-base");
    anchorElement.parentElement.insertBefore(pendoContainer, anchorElement);

    const stepElement = pendoContainer.querySelector(
        "._pendo-step-container-size"
    );

    // need to override the CSS style from JS, because it seems that targeting ._pendo-step-container-size
    // from CSS does not work. Need to override all the styles, because Pendo has its own styles (like `position: fixed`, etc)
    stepElement.style.cssText = customCss;
};

/**
 * Moves the Pendo Paywall inline, inside a given HTML element.
 * Optionally, it applies a custom CSS to the paywall. By default, the CSS is an empty string
 * Optionally, can remove an loadingElement after move pendo paywall
 * **Note** The standard Pendo CSS is overridden by the given CSS. So, some properties set from
 * the Pendo UI will be overwritten (e.g. z-index)
 *
 * @examples
 *  // inline the paywall inside the element #my-empty-div
 *  pendoHelpers.inlinePaywallInside(document.getElementById('my-empty-div'))
 *
 *  // inline the paywall inside the element #my-empty-div, and add custom border
 *  pendoHelpers.inlinePaywallInside(
 *    document.getElementById('my-empty-div'),
 *    'border-bottom: 1px solid gray'
 *  )
 *
 *
 * @param {HTMLElement} anchorElement
 * @param {string} [customCss='']
 */
const inlinePaywallInside = (anchorElement, customCss = "") => {
    if (window.pendo && !window.pendo.designerEnabled) {
        const pendoContainer = document.getElementById("pendo-base");
        //we need to clone pendo paywall before move it to avoid it disappear when another paywall opens
        const pendoContainerCloned = pendoContainer.cloneNode(true);
        pendoContainer.style.display = "none";
        pendoContainerCloned.id = undefined; //avoid to have two elements with the same id
        const stepElement = pendoContainerCloned.querySelector(
            "._pendo-step-container-size"
        );
        const anchorElementChildren =
            anchorElement.children && anchorElement.children[0];
        if (anchorElementChildren) {
            anchorElementChildren.remove(); //we need it to remove loading and avoid duplicates paywall
        }
        anchorElement.append(pendoContainerCloned);

        // need to override the CSS style from JS, because it seems that targeting ._pendo-step-container-size
        // from CSS does not work. Need to override all the styles, because Pendo has its own styles (like `position: fixed`, etc)
        stepElement.style.cssText = customCss;
    }
};
/**
 *
 * @param {object} options
 *
 * @param {string} options.entrypoint - required
 *
 * @param {string} options.guideId
 * @param {string} options.guideName
 *
 * @param {string} options.paywallType - something like 'pop-up', 'banner, 'badge', etc.
 * @param {string} [options.paywallExperiment] - set it only if running an experiment
 *
 * @param {HTMLElement[]} options.acceptButtons - change these for custom guides (custom UI layout or HTML)
 * @param {HTMLElement[]} options.dismissButtons - change these for custom guides (custom UI layout or HTML)
 * @param {boolean} options.forceTrack - allow to track also in stage or dev env
 *
 * @example - usage in Pendo custom code block
 *  pendoHelpers.registerTracking({
 *    entrypoint: 'TODO', // e.g. 'composer'
 *    paywallType: 'pop-up',
 *  });
 *
 *  // For details, please read the docs:
 *  // https://hootsuite.atlassian.net/wiki/spaces/PG/pages/10822746162/Pendo+Onboarding+Guide#Events-tracking
 *
 */
const registerTracking = async ({
    entrypoint,
    paywallType,
    paywallVariation,
    paywallExperiment,
    acceptButtons = [document.querySelector("._pendo-button-primaryButton")],
    dismissButtons = [
        document.querySelector("._pendo-button-tertiaryButton"),
        document.querySelector("._pendo-close-guide"),
    ],
    product_area,
    guideName = getPendoActiveGuideName(),
    guideId = getPendoActiveGuideId(),
    forceTrack,
}) => {
    const shouldTrack = Boolean(forceTrack) || env() === PRODUCTION;

    // We don't want track stage and dev env to avoid to get dirty tracking data
    if (!shouldTrack) {
        return;
    }

    const paywallName = extractPaywallNameFromGuideName(guideName);
    const trackingOrigin = `web.paywalls.${entrypoint}`;
    const userId = await getMemberId();
    const userMaxPlan = await getMemberMaxPlanCode();

    /**
     * @param {'impression' | 'accept' | 'dismissed'} action
     */
    const trackPaywallGAEvent = (action) => {
        trackGAEvent({
            event: "paywall_engagement",
            action,
            userId: userId,
            paywall: paywallName,
        });
    };

    /**
     * @param {'paywall_impression' | 'paywall_clicked' | 'paywall_dismissed'} action
     */
    const trackPaywallProductEvent = (action) => {
        trackerDatalab.trackCustom(trackingOrigin, action, {
            guide_id: guideId,
            guide_segment: getPendoActiveSegment(),
            user_plan_type: userMaxPlan,
            entrypoint: entrypoint,
            paywall_name: paywallName,
            paywall_type: paywallType,
            paywall_experiment: paywallExperiment,
            product_area: product_area,
            paywall_variation: paywallVariation,
        });
    };

    trackPaywallGAEvent("impression");
    trackPaywallProductEvent("paywall_impression");

    acceptButtons.forEach((acceptButton) => {
        acceptButton &&
            acceptButton.addEventListener("click", () => {
                trackPaywallGAEvent("accept");
                trackPaywallProductEvent("paywall_clicked");
            });
    });

    dismissButtons.forEach((dismissButton) => {
        dismissButton &&
            dismissButton.addEventListener("click", () => {
                trackPaywallGAEvent("dismissed");
                trackPaywallProductEvent("paywall_dismissed");
            });
    });
};

/**
 * @param {string} guideName - in the format `Paywall|<paywall_name>|<group>`
 * @return {string} - the paywall name
 */
function extractPaywallNameFromGuideName(guideName) {
    return guideName.split("|")[1] || guideName;
}

const getPendoActiveGuide = () => {
    return window.pendo && window.pendo.getActiveGuide();
};

const getPendoActiveGuideName = () => {
    const activeGuide = getPendoActiveGuide();
    return activeGuide && activeGuide.guide.name;
};

const getPendoActiveGuideId = () => {
    const activeGuide = getPendoActiveGuide();
    return activeGuide && activeGuide.guide.id;
};

const getPendoActiveSegment = () => {
    const activeGuide = getPendoActiveGuide();

    if (!activeGuide) {
        return undefined;
    }

    const audience = _.get(activeGuide, ["guide", "audience"], []);
    const segment = audience.find((el) => el.segment);

    return _.get(segment, ["segment", "id"], undefined);
};

export const pendoHelpers = {
    inlinePaywallBefore,
    inlinePaywallInside,
    registerTracking,
    loadChilipiperWidget,
    emitPendoEvent,
    emitOpenSocialNetworkExpirationEvent,
};
