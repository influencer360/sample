function isFeatureEnabled(code) {
  return window.hs?.isFeatureEnabled?.(code);
}

function isFeatureEnabledOrBeta(code) {
  return window.hs?.isFeatureEnabledOrBeta?.(code);
}

function isFeatureDisabled(code) {
  if (typeof code !== 'string') {
    return true;
  }

  return !isFeatureEnabled(code);
}

export default { isFeatureEnabled, isFeatureDisabled, isFeatureEnabledOrBeta };
