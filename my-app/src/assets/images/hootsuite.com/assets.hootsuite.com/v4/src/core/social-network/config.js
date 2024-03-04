import NetworksConf from 'utils/networks-conf';
import translation from 'utils/translation';


var constants = {
    NETWORK_TYPES: [],
    NETWORK_NAMES: {},
    MULTI_PROFILE_NETWORKS: [],
};

Object.keys(hs.networksConf).forEach(function(networkType) {
    constants[networkType] = networkType;
    constants.NETWORK_TYPES.push(networkType);

    var parentType = NetworksConf.getParentType(networkType);
    if(parentType && constants.MULTI_PROFILE_NETWORKS.indexOf(parentType) < 0) {
        constants.MULTI_PROFILE_NETWORKS.push(parentType);
    }

    var name = NetworksConf.getNetworkName(networkType);
    constants.NETWORK_NAMES[networkType] = translation._(name);
});

export default {
    c: constants
};

