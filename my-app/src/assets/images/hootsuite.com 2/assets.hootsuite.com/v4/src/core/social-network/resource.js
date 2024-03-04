import _ from 'underscore';
import objectAssign from 'object-assign';

/**
 * @typedef {Object} SocialNetworkData
 * @property {number} socialNetworkId
 * @property {string} username
 * @property {string} type
 * @property {string} avatar
 * @property {boolean} isReauthRequired
 * @property {boolean} isSecurePost
 * @property {number} ownerId
 * @property {string} ownerType
 * @property {number} socialIntegrationAccountId
 * @property {(number|string)} userId
 */

/**
 * @class SocialNetworkResource
 * @param options
 */
var SocialNetworkResource = function (options) {
    this.snCollection = options.snCollection;
    // TODO: get rid of global when we have a good decoupled way of retrieving it
    hs.snCollection = this.snCollection;
};

/**
 * Keys for social network-related data cached on the hs.* namespace
 * @type {string[]}
 */
SocialNetworkResource.cacheKeys = [
    'socialNetworks',
    'socialNetworksKeyedByType',
    'pinnedSns',
    'favoritedSns',
    'publisherFilterSns'
];

/**
 *
 * @type {Object.<string, string>}
 */
SocialNetworkResource.cacheKeyMap = {
    'pin': 'pinnedSns',
    'favorite': 'favoritedSns',
    'publisherFilter': 'publisherFilterSns'
};

_.extend(SocialNetworkResource.prototype, /** @lends SocialNetworkResource.prototype */{
    /**
     * Updates the resource container with updated social network data
     *
     * @param {SocialNetworkData} [data.socialNetwork]
     * @param {SocialNetworkData[]} [data.socialNetworks]
     *
     * @see module#updateCacheData
     */
    update: function (data) {
        this.updateCacheData(data);

        if (data.socialNetworks) {
            this.snCollection.set(_.values(data.socialNetworks));
        } else if (data.socialNetwork) {
            var sn = data.socialNetwork;
            var model = this.snCollection.get(sn.socialNetworkId);
            if (model) {
                model.set(sn);
            }
        }
    },

    /**
     * Update caches data for socialNetworks and related preferences
     * @param data
     * @param {SocialNetworkData[]} [data.socialNetworks]
     * @param {Object.<string, SocialNetworkData[]>} [data.socialNetworksKeyedByType]
     * @param {number[]} [data.pinnedSns] Social networks the user has pinned
     * @param {number[]} [data.favoritedSns] Social networks the user has favourited (appears closer to top)
     * @param {number[]} [data.publisherFilterSns]
     */
    updateCacheData: function (data) {
        if (!data) { return; }
        _.each(_.pick(data, SocialNetworkResource.cacheKeys), function (value, key) {
            hs[key] = value;
        });

        if (data.socialNetworks) {
            // Clear sorted cache
            hs.socialNetworksSorted = null;
        }
    },

    /**
     * Update a single preference item in cache
     *
     * @param {number} socialNetworkId
     * @param {string} key
     * @param {boolean} value
     */
    updateCacheItem: function (socialNetworkId, key, value) {
        var updateKey = SocialNetworkResource.cacheKeyMap[key];

        if (updateKey && socialNetworkId) {
            hs[updateKey] = _.without(hs[updateKey], socialNetworkId);
            // Re-add the snId to preference collection value is really true
            if (value) {
                hs[updateKey].push(socialNetworkId);
            }
        }
    },

    getSocialNetworkData: function (snId, asModel) {
        if (asModel) {
            return this.snCollection.get(snId);
        } else {
            return hs.socialNetworks[snId] || null;
        }
    },

    /**
     * Update the social networks global variables (hs.socialNetworks, ...)
     *
     * @param {object} data
     * @param {object} [data.socialNetwork] - A Social Network object
     * @param {object} [data.socialNetworks] - A Social Network Dictionary
     */
    updateGlobalCache: function (data) {
        if (_.isObject(data)) {
            // Create the initial state of the object we'll pass to the update function
            var updatedData = {
                socialNetworks: hs.socialNetworks
            };
            // are we updating only one social network or several?
            if (_.isObject(data.socialNetwork) && data.socialNetwork.socialNetworkId) {
                if (!updatedData.socialNetworks[data.socialNetwork.socialNetworkId]) {
                    updatedData.socialNetworks[data.socialNetwork.socialNetworkId] = data.socialNetwork;
                } else {
                    objectAssign(updatedData.socialNetworks[data.socialNetwork.socialNetworkId], data.socialNetwork);
                }
                this.updateCacheData(updatedData);
            } else if (data.socialNetworks) {
                objectAssign(updatedData.socialNetworks, data.socialNetworks);
                this.updateCacheData(updatedData);
            }
        }
    }
});

export default SocialNetworkResource;
