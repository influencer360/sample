/**
 * Utility class to make access to the hs.networksConf global variable easier and consistent
 * hs.networksConf contains social networks configuration metadata useful for data-driven interfaces
 */
var NetworksConf = {
    /**
     * Function returns array of network types that are NOT in networkTypes
     * See hs.networksConf
     * @param networkTypes - Array of network types (e.g. ['PINTEREST','YOUTUBECHANNEL']), or a string ('PINTEREST')
     * @returns Array of network types. e.g. ['PINTEREST','YOUTUBECHANNEL']
     */
    getNetworkTypesExcept: function (networkTypes) {
        return Object.keys(hs.networksConf).filter(function (type) {
            return !networkTypes.includes(type);
        });
    },

    /**
     * Function returns array of network types that do not support component
     * provided in the parameter. e.g. COMPOSER, PUBLISHER
     * See hs.networksConf
     * @param componentKey
     * @param context - optional
     * @returns Array of network types. e.g. ['PINTEREST','YOUTUBECHANNEL']
     */
    getExcludedNetworkTypesForComponent: function (componentKey, context) {
        var excludedNetworkTypes = [];
        if (typeof hs.networksConf !== 'undefined' && typeof componentKey === 'string') {

            //local method for the filter
            var filterCondition = function (networkType) {

                var componentType = hs.networksConf[networkType] &&
                    hs.networksConf[networkType].components &&
                    hs.networksConf[networkType].components[componentKey];

                var isExcluded =  (typeof componentType === 'undefined' || componentType === null);
                //optionally further narrow down by context of the component if it exists
                if (context && !isExcluded) {
                    isExcluded = componentType.context !== context;
                }
                return isExcluded;
            };
            //only those installed and supporting custom Composer component
            excludedNetworkTypes = Object.keys(hs.networksConf).filter(filterCondition);
        }
        return excludedNetworkTypes;
    },

    /**
     * Function returns array of network types that do not have any configured components
     * or if they do none of them is in COMMON context.
     * This is used in existing filtering of unsupported networks in dashboard interfaces like Scheduler
     * @returns {Array}
     */
    getNetworkTypesWithNoCommonComponents: function () {
        var networkTypes = [];
        if (typeof hs.networksConf !== 'undefined') {

            //internal function for each component to filter on
            var commonComponentFilterCondition = function (component) {
                return (component.context && component.context === 'COMMON');
            };

            //main filter function for networks
            var filterCondition = function (filterFunction) {
                return function (networkType) {
                    var components = hs.networksConf[networkType] && hs.networksConf[networkType].components;
                    //if there is no components section at all it is clear
                    var hasNoCommonComponents = (typeof components === 'undefined' || components === null);

                    //if it has components, check that none of them is in COMMON context
                    if (components) {
                        hasNoCommonComponents = (Object.values(components).filter(filterFunction).length === 0);
                    }
                    return hasNoCommonComponents;
                };
            };
            //get network types that do not have components or not in COMMON context
            networkTypes = Object.keys(hs.networksConf).filter(filterCondition(commonComponentFilterCondition));
        }
        return networkTypes;
    },

    /**
     * To safely get a name of a network
     * @param networkType
     * @returns {*}
     */
    getNetworkName: function (networkType) {
        return hs.networksConf[networkType] &&
            hs.networksConf[networkType].name;
    },

    /**
     * To safely get a parentType of a network
     * @param networkType
     * @returns {*}
     */
    getParentType: function (networkType) {
        return hs.networksConf[networkType] &&
            hs.networksConf[networkType].parentType;
    },

    /**
     * To safely get a authSuccessFollowup of a network
     * @param networkType
     * @returns {*}
     */
    getAuthSuccessFollowup: function (networkType) {
        return hs.networksConf[networkType] &&
            hs.networksConf[networkType].authSuccessFollowup;
    },

    /**
     * To safely get a component context of a network if any
     * @param networkType
     * @param componentKey
     * @returns {*}
     */
    getComponentContext: function (networkType, componentKey) {
        return hs.networksConf[networkType] &&
            hs.networksConf[networkType].components &&
            hs.networksConf[networkType].components[componentKey] &&
            hs.networksConf[networkType].components[componentKey].context;
    },

    /**
     * To safely get a iconSourceKey of a network type
     * @param networkType
     * @returns {*}
     */
    getIconSourceKey: function (networkType) {
        return hs.networksConf[networkType] &&
            hs.networksConf[networkType].iconSourceKey;
    },

    /**
     * To safely get a brandColour of a network type
     * @param networkType
     * @returns {*}
     */
    getBrandColour: function (networkType) {
        return hs.networksConf[networkType] &&
            hs.networksConf[networkType].brandColour;
    },
};


export default NetworksConf;
