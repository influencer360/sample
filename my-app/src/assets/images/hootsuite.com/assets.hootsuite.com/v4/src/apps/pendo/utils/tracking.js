import { getPendoPaywallGATrackEvent } from "./getPendoGATrackingEvent"
import trackerDatalab from 'utils/tracker-datalab';
import { trackGAEvent } from "fe-lib-ga-tracking";
import { findPaywallInfo } from "./paywalls";

const PAYWALL_ACTIONS = {
    IMPRESSION: 'impression',
    DISMISSED: 'dismissed',
    ACCEPT: 'accept'
}

const DEFAULT_TRACKING_DATA = {
    plan: hs.memberPlan,
    host: 'pendo'
}

const trackEvent = function (eventName, origin, additionalData) {
    const trackingData = { ...DEFAULT_TRACKING_DATA, ...additionalData }

    trackerDatalab.trackCustom(origin, eventName, trackingData);
}

const handlePendoPaywallTracking = async function (guide, action, eventLabel) {
    switch (action) {
        case PAYWALL_ACTIONS.IMPRESSION:
            await handlePaywallImpressionTracking(guide, eventLabel)
            break;

        case PAYWALL_ACTIONS.DISMISSED:
            handlePaywallDismissedTracking(guide)
            break;

        case PAYWALL_ACTIONS.ACCEPT:
            await handlePaywallConversionTracking(guide, eventLabel)
            break;

    }
}

const getPaywallTrackingOrigin = function(guide) {
    if(guide && guide.name) {
        return findPaywallInfo(guide.name)?.TRACKING_ORIGIN
    }
}

const handlePaywallImpressionTracking = async function (guide, eventLabel) {
    const event = await getPendoPaywallGATrackEvent(guide.name, PAYWALL_ACTIONS.IMPRESSION, eventLabel)
        if(event) {
            trackGAEvent(event);
        }
    trackEvent('paywall_opened', getPaywallTrackingOrigin(guide), { paywallId: guide.id });
}

const handlePaywallDismissedTracking = function (guide) {
    trackEvent('paywall_close_clicked', getPaywallTrackingOrigin(guide));
}

const handlePaywallConversionTracking = async function (guide, eventLabel) {
    const event = await getPendoPaywallGATrackEvent(guide.name, PAYWALL_ACTIONS.ACCEPT, eventLabel)
    if(event) {
        trackGAEvent(event);
    }
    trackEvent('paywall_upgrade_clicked', getPaywallTrackingOrigin(guide));
}

export {
    handlePendoPaywallTracking,
    PAYWALL_ACTIONS,
    DEFAULT_TRACKING_DATA
}
