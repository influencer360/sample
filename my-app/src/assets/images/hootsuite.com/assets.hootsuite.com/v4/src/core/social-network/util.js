import _ from 'underscore';
import config from './config';

export default {
    isValidSocialNetworkType: function (network) {
        return _.isString(network) && _.contains(config.c.NETWORK_TYPES, network.toUpperCase());
    },

    isMultiProfileNetwork: function (snType) {
        return _.contains(config.c.MULTI_PROFILE_NETWORKS, this.getSocialNetworkFromType(snType));
    },

    /**
     * Gets the umbrella Network Type for any social network (ie. FACEBOOK for FACEBOOKPAGE)
     *
     * @param snType
     * @returns {String|null} null if invalid type given
     */
    getSocialNetworkFromType: function (snType) {
        if (!this.isValidSocialNetworkType(snType)) {
            return null;
        }
        snType = snType.toUpperCase();

        // TODO: To delete once Instagram personal and Instagram business are fully decoupled (when INSTAGRAMBUSINESS's parentType is null in social_networks_conf.yaml)
        if (snType === "INSTAGRAMBUSINESS") {
            return snType
        }
        // Check the networks that have multiple profile types and just return a base type for them
        var multiProfileNetworks = config.c.MULTI_PROFILE_NETWORKS;
        for (var i = 0; i < multiProfileNetworks.length; i++) {
            if (snType.indexOf(multiProfileNetworks[i]) === 0) {
                return multiProfileNetworks[i];
            }
        }

        return snType;
    },

    /**
     * Helper function that has various ways of getting the original image from different social networks.
     * Currently only supports avatars from Twitter and G+.
     *
     * @param {String} avatarUrl
     * @returns {String}
     */
    getOriginalAvatar: function (avatarUrl) {
        if (avatarUrl.indexOf('twimg.com') > -1) {
            /*
             * The image that twitter gives us is a smaller version than the original, which we sometimes want to show for the best image quality.
             * To do this, this function removes "_normal" (or any size) from the url, i.e. picture_normal.jpeg -> picture.jpeg
             * https://dev.twitter.com/overview/general/user-profile-images-and-banners
             */
            return avatarUrl.replace(/_(normal|mini|bigger)(\.\w{3,})$/, '$2');
        } else {
            // we don't have any other methods of getting the original avatar yet
            return avatarUrl;
        }
    }
};
