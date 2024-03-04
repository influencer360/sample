import { findPaywallInfo } from "./paywalls";
import { getMemberId } from 'fe-lib-hs'

const getPendoPaywallGATrackEvent = async function (paywallName, action, eventLabel) {
    const memberId = await getMemberId()
    const paywall = findPaywallInfo(paywallName)?.paywall

    if (!memberId || !paywall || !action) {
        return null;
    }

    return { 
        event: 'paywall_engagement',
        action,
        userId: memberId,
        paywall,
        ...(eventLabel && {eventLabel})
    }
}

export {
    getPendoPaywallGATrackEvent
}
