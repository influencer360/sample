import _ from 'underscore';
import translation from 'utils/translation';
import ConnectorBase from 'core/social-network/connectors/base';

var ADD_URL = hs.util.getUrlRoot() + '/app/social-network/add?type=TWITTER&flowType=MODALS';
var REAUTH_URL = hs.util.getUrlRoot() + '/app/social-network/reauth?flowType=MODALS&socialProfileId=';

export default ConnectorBase.extend(/** @lends TwitterConnector.prototype */{
    cancelConnectMessage: translation._("You must sign in and allow Hootsuite to integrate with Twitter"),

    snType: 'twitter',

    /**
     * Display Twitter authentication screen to connect a new account
     */
    doConnect: function (options) {
        var authenticator;
        var promise;
        var AUTH_URL = ADD_URL;
        //with snId it is reauth/reconnect
        if (options.snId) {
            AUTH_URL = REAUTH_URL + options.snId;
        } else {
            if (options && typeof options.organizationId !== 'undefined') {
                if (options.organizationId) {
                    AUTH_URL += '&organizationId=' + options.organizationId;
                }
            }
        }
        authenticator = this.getAuthenticator(this.snType, options);
        promise = authenticator.start(AUTH_URL, {direct: true, width: 900, height: 450});

        promise.done(_.bind(this.completeAuth, this));
        return authenticator;
    },

    /**
     * Store the auth tokens to the back-end and notify of complete auth
     *
     * @param {Object} options
     * @param {{token: String, verifier: String}} authBundle
     */
    storeTokens: function (options, authBundle) {
        ajaxCall({
            url: '/ajax/twitter/get-oauth-tokens',
            data: this.prepareTokenData(authBundle, options)
        }, 'qm')
            .done(_.bind(this.completeAuth, this))
            .fail(_.bind(this.onExternalAuthFail, this));
    },

    /**
     * Combine the auth bundle and other data into parameters for the backend
     * @param {{token: String, verifier: String}} authBundle
     * @param {{snId: Number}} [extraData]
     * @returns {Object}
     */
    prepareTokenData: function (authBundle, extraData) {
        extraData = extraData || {};
        return _.extend(
            {
                ot: authBundle.token,
                ov: authBundle.verifier
            },
            _.pick(extraData, 'snId')
        );
    }
});

