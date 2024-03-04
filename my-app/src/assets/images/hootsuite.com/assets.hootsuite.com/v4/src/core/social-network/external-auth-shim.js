export default {
    /**
     * A shim for old auth callback code that doesn't use ExternalAuthenticator
     *
     * @see ExternalAuthenticator#externalAuthComplete
     *
     * @param {string} source
     * @param {Object} authBundle
     * @param {Object} options
     */
    shim: function (source, authBundle, options) {
        authBundle = authBundle || {};
        options = options || {};
        hs.popauth.triggerCallback(source, authBundle.token, authBundle.verifier, options.userCancelled);
    }
};
