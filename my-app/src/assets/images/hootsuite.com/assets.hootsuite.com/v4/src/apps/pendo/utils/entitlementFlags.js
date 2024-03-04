/**
 * @param {object} hs
 * @return {string[]}
 */
export const getPendoEntitlements = (hs) => ({
    has_entitlement_impact: hs.entryPoints.canAccessImpact,
    has_entitlement_amplify_composer: hs.entryPoints.canAccessAmplifyComposer,
    has_entitlement_insights_by_brandwatch:
        hs.entryPoints.canAccessInsightsByBrandwatch,
});
