function isFeatureEnabled(code: string) {
  return window.hs?.isFeatureEnabled?.(code);
}

function isFeatureEnabledOrBeta(code: string) {
  return window.hs?.isFeatureEnabledOrBeta?.(code);
}

export default { isFeatureEnabled, isFeatureEnabledOrBeta };
