import hootbus from 'utils/hootbus';
import snUtil from './util';

export default {
    //'socialNetwork:authorize:command': 'authorizeCommand',
    //'socialNetwork:reauthorize:command': 'reauthorizeNetworkCommand',
    //'socialNetwork:transfer:command': 'transferNetworkCommand',
    //'socialNetwork:sync:command': 'syncNetworkCommand',
    //'socialNetwork:storePreference:command': 'storePreferenceCommand'

    /**
     * @param {String} snType
     * @param {String} snType
     * @param {Object} [options]
     * @param {Number} options.organizationId If the user wants to add the account to an organization, provide the id
     * @param {boolean} options.useRedirect If we should use the redirect workflow for authentication
     * @param {Object} options.triggerData If we're finishing up the redirect auth workflow
     *
     * @see SocialNetworkService#authorizeCommand
     */
    authorize: function (snType, options) {
        hootbus.emit('socialNetwork:authorize:command', snType, options);
    },

    /**
     * Used upon return from a redirect auth scenario, triggers authentication again which effectively completes
     * the auth loop
     *
     * @param {AuthTriggerData} triggerData
     */
    triggerAuthComplete: function (triggerData) {
        var commandOptions = {
            useRedirect: true,
            triggerData: triggerData
        };
        var snType = snUtil.getSocialNetworkFromType(triggerData.source);

        this.authorize(snType, commandOptions);
    },

    /**
     *
     * @param snType
     * @param {Object} data
     * @param {boolean} [data.createTab]
     * @param {{type: String, userId: Number}} [data.socialNetwork]
     * @param {boolean} [data.follow]
     * @param {Number} [data.organizationId]
     * @param {boolean} [data.isMultiIdentity] Passed back to handlers to deal with multi-identity cases as needed
     *
     * @param callbacks
     * @param {Function} [callbacks.onSuccess]
     * @param {Function} [callbacks.onComplete]
     *
     * @see SocialNetworkService#addAccountCommand
     */
    addAccount: function (snType, data, callbacks) {
        hootbus.emit('socialNetwork:addAccount:command', snType, data, callbacks);
    },

    /**
     * Remove the single specified account
     *
     * @param {Number} snId
     * @param callbacks
     * @param {Function} [callbacks.onSuccess]
     * @param {Function} [callbacks.onComplete]
     *
     * @see SocialNetworkService#deleteAccountCommand
     */
    deleteAccount: function (snId, callbacks) {
        hootbus.emit('socialNetwork:deleteAccount:command', snId, callbacks);
    },

    /**
     * After change in the social networks, sync data from the server
     *
     * @param options
     * @param {boolean} [options.isHootlet] This is kind of hacky and as soon as we stop generating the message box
     *                                      HTML on the back end we can get rid of this
     * @param {Function} options.onSuccess For compatibility with older code
     *
     * @see SocialNetworkService#refreshNetworkCommand
     */
    refreshNetworks: function (options) {
        hootbus.emit('socialNetwork:refresh:command', options);
    }
};

