import darklaunch from 'hs-nest/lib/utils/darklaunch';

export const getPendoDarklaunchFlags = () =>
    keepOnlyPendoDarklaunchFlagCodes(getActiveDarklaunchFlags());

/**
 * @return {string[]}
 */
export const getActiveDarklaunchFlags = () => {
    return darklaunch
        .getFeatures()
        .map((feature) => feature.c)
        .filter((featureCode) => darklaunch.isFeatureEnabled(featureCode));
};

/**
 * @param {string[]} allCodes
 * @return {string[]}
 */
export const keepOnlyPendoDarklaunchFlagCodes = (allCodes) =>
    allCodes.filter((code) => code.includes('PENDO'));
