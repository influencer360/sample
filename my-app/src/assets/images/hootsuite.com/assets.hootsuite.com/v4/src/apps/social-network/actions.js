import hootbus from 'utils/hootbus';

export default {
    /**
     * Prompt the user to add a social network to their Hootsuite dashboard
     * Replaces addSocialNetworkPopup
     *
     * @param options
     * @param {Number} options.organizationId
     * @param {Number} options.teamId id of team to preselect in the dropdown. If null is passed in, preselects 'Private Networks'
     * @param {boolean} options.createTab
     * @param {String} options.selectedSocialNetwork social network type to have selected
     * @param {Function} options.onSuccess deprecated, use success and complete event for new implementations
     * @param {Function} options.onComplete deprecated, use success and complete event for new implementations
     *
     * @see SocialNetworkApp#showAddNetworkModal
     */
    add: function (options) {
        hootbus.emit('socialNetwork:addNetwork:modal', options);
    },
    /**
     * Prompts the user to add a shared social network
     *
     * @see  OverlayApp#addSharedSocialNetwork
     */
    showAddSharedSocialNetworkModal: function (options) {
        hootbus.emit('overlay:init', 'modal', 'addSharedSocialNetwork', options);
    },
    /**
     * Prompts the user to add a shared social network
     *
     * @see  OverlayApp#addSharedSocialNetwork
     */
    showTransferSocialNetworkModal: function (options) {
        hootbus.emit('overlay:init', 'modal', 'transferSocialNetwork', options);
    },
    /**
     * Prompts the user to transfer a given social network
     *
     * @param {Number} socialNetworkId
     * @param options
     * @param {Function} options.onSuccess
     * @param {Function} options.onComplete
     * @param {boolean} options.createTab
     * @param {boolean} options.saveCheckbox
     * @param {boolean} options.isUsedForMemberAuth
     *
     *  @see SocialNetworkApp#showTransferModal
     */
    transfer: function (socialNetworkId, options) {
        hootbus.emit('socialNetwork:transfer:modal', socialNetworkId, options);
    },
    /**
     * Show social network expiration modal
     *
     * this function does more than just showing the SNE Modal it makes an ajax call to fetch all the sns with invalid tokens
     */
    showSocialNetworkExpirationModal: function () {
        hootbus.emit('socialNetwork:socialNetworkExpiration:modal');
    },
    /**
     * Remove a social network from the current user (or organisation given permission)
     *
     * @param {Number} socialNetworkId
     * @param options
     * @param {Function} options.onSuccess
     *
     * @see SocialNetworkApp#onDeleteAction
     */
    remove: function (socialNetworkId, options) {
        hootbus.emit('socialNetwork:deleteNetwork:action', socialNetworkId, options);
    },

    /**
     *
     * @param options
     * @param options.isHootlet
     *
     * NB: isReloadStream is no longer necessary, streams determines for itself whether to reload
     *
     * @see SocialNetworkService#refreshNetworkCommand
     */
    refreshNetworks: function (options) {
        hootbus.emit('socialNetwork:refresh:command', options);
    },

    /**
     * Reauthorize a social network using the usual popup method (doesn't use the redirect options)
     * @param {Object} socialNetwork
     * @param {number} socialNetwork.socialNetworkId
     * @param {boolean} [socialNetwork.isSecurePost] Already sync'd though separate AJAX call
     * @param {string} [socialNetwork.auth1] Password for WordPress
     * @param {SocialNetworkPermissionRequest} permissionRequest
     *
     * @see SocialNetworkService#reauthorizeNetworkCommand
     */
    reconnect: function (socialNetwork, permissionRequest) {
        hootbus.emit('socialNetwork:reauthorize:command', socialNetwork, {permissionRequest: permissionRequest, authType: 'rerequest'});
    },

    /**
     * Sync the icons for a single social network
     *
     * @param {Number} socialNetworkId
     * @param [callbacks]
     * @param callbacks.onSuccess
     */
    sync: function (socialNetworkId, callbacks) {
        hootbus.emit('socialNetwork:sync:action', socialNetworkId, callbacks);
    },

    /**
     * Store a user preference related to social networks
     *
     * @param {number} socialNetworkId
     * @param {string} key (pin, favorite, publisherFilter)
     * @param {boolean} value
     * @param options
     * @param {Function} options.onSuccess
     * @param {boolean} options.isSoftRefresh
     *
     * @see SocialNetworkService#storePreferenceCommand
     */
    storePreference: function (socialNetworkId, key, value, options) {
        hootbus.emit('socialNetwork:storePreference:command', socialNetworkId, key, value, options);
    }
};

