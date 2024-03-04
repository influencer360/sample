import util from 'utils/util';
import {isFeatureEnabledOrBeta} from 'fe-pnc-lib-darklaunch';

/**
 * Redirects the user to the `/account-setup`.
 * Appends orgId queryParam if the user is invited to an organization.
 * @returns {void}
 */
export function redirectToAccountSetup() {
    const hostName = util.getHostname(window.location.href);
    if (!hostName) return;

    const invitedOrg = getOrganizationOfAdminInvitation();

    if (invitedOrg) {
        util.doRedirect('/account-setup' + `?orgId=${invitedOrg.id}`);
        return;
    }

    util.doRedirect('/account-setup');
}

/**
 * @returns {boolean} Boolean telling if user should be redirected to account setup
 */
export function shouldRedirectToAccountSetup() {
    const invitedOrg = getOrganizationOfAdminInvitation();
    const hasProvisioningEnabled = isFeatureEnabledOrBeta('PROM_5410_AUTOMATED_PROVISIONING');
    const hasOnboardingWizardEntitlement = window.hs.entryPoints.canAccessOnboardingWizard;

    return hasProvisioningEnabled && hasOnboardingWizardEntitlement && Boolean(invitedOrg);
}

/**
 * Checks if the user is newly invited to an organization and if they are an admin of that organization.
 *
 * @typedef {Object} Organization
 * @property {number} id - The organization ID
 *
 * @returns {Organization|null} Return the organization that the user is invited to or null if none is found.
 */
function getOrganizationOfAdminInvitation() {
    const isInvited = window.location.href.includes('invite-accepted');
    if (!isInvited) return null;

    // User is not member of any organization
    if (!window.hs.organizations || !window.hs.organizations.length) {
        return null;
    }

    const searchParams = new URLSearchParams(window.location.pathname + window.location.hash);
    const orgIdParam = searchParams.get('orgId');
    // If we don't have an orgId param, we should chose the first org that the user is part of.
    // This happens when the user is coming from an onboarding mail which means they have only one org.
    if (!orgIdParam) return window.hs.organizations[0];

    const org = window.hs.organizations.find((org) => String(org.id) === orgIdParam);

    // User is not part of the organization corresponding to the orgId param
    if (!org) return null;

    return org;
}
