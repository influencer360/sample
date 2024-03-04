import _ from 'underscore';
import networks from 'hs-nest/lib/constants/social-networks';

/**
 * A white list of the networks that we wish to support on
 * the new React streams.
 */
var SUPPORTED_NETWORKS = [
    networks.types.INSTAGRAM,
    networks.types.INSTAGRAMBUSINESS,
    networks.types.TWITTER,
    networks.types.FACEBOOK,
    networks.types.YOUTUBECHANNEL,
    networks.types.LINKEDIN,
    networks.types.LINKEDINCOMPANY,
    networks.types.TIKTOKBUSINESS,
];

/**
 * A black list of streams to NOT render in React, assuming that
 * the network is supported in SUPPORTED_NETWORKS.
 */
var UNSUPPORTED_STREAM_TYPES = [
];

var reactBoxChecker = {

    /**
     * Returns true if can be rendered in new React streams
     *
     * @param {string} socialNetworkType
     * @param {string} boxType
     *
     * @returns {boolean}
     */
    canRenderReactStream: function (socialNetworkType, boxType) {
        return _.contains(SUPPORTED_NETWORKS, socialNetworkType) &&
                !_.contains(UNSUPPORTED_STREAM_TYPES, boxType);
    }
};

export default reactBoxChecker;
