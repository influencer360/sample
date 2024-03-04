import { paywalls } from "../paywalls"

export const findPaywallInfo = (paywallName) => {
    return paywalls.find(({paywallPrefix}) => {
        return paywallMeetsNomenclatureStandard(paywallName,paywallPrefix)
    })
}

/**
 * paywall name must begin with a paywall name specified under pendo/paywalls.js
 * only alphanumeric characters, spaces, underscores and hyphens are acceptable in paywall suffix
 */
export const paywallMeetsNomenclatureStandard = (paywallName, paywallPrefix) => {
    const escapedPaywallPrefix = paywallPrefix.replace(/\|/g, "\\|");
    //eslint-disable-next-line
    const acceptablePaywallName = new RegExp(`^${escapedPaywallPrefix}[-_a-zA-Z0-9\s]*$`);
    return acceptablePaywallName.test(paywallName)
}