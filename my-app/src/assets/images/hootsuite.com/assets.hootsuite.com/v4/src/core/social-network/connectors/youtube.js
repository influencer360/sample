import _ from 'underscore';
import translation from 'utils/translation';
import ConnectorBase from 'core/social-network/connectors/base';
var ADD_URL = hs.util.getUrlRoot() + '/app/social-network/add?type=YOUTUBECHANNEL&flowType=MODALS';
var REAUTH_URL = hs.util.getUrlRoot() + '/app/social-network/reauth?flowType=MODALS&socialProfileId=';

export default ConnectorBase.extend(/** @lends YoutubeConnector.prototype */{
    cancelConnectMessage: translation._("You must sign in and allow Hootsuite to integrate with YouTube"),

    snType: 'youtubechannel',

    /**
     * Display Youtube authentication screen to connect a new account
     */
    doConnect: function (options) {
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
        var authenticator = this.getAuthenticator(this.snType, options);
        var promise = authenticator.start(AUTH_URL, {direct: true, width: 900, height: 450});
        promise.done(_.bind(this.completeAuth, this));

        return authenticator;
    }
});
