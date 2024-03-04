import _ from 'underscore';
import ConnectorBase from 'core/social-network/connectors/base';
import translation from 'utils/translation';
var ADD_URL = hs.util.getUrlRoot() + '/app/social-network/add?type=TIKTOKBUSINESS&flowType=MODALS';
var REAUTH_URL = hs.util.getUrlRoot() + '/app/social-network/reauth?flowType=MODALS&socialProfileId=';

export default ConnectorBase.extend({
    cancelConnectMessage: translation._("You must sign in and allow Hootsuite to integrate with TikTok"),

    snType: 'tiktokbusiness',

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
        var promise = authenticator.start(AUTH_URL, {direct: true, width: 670, height: 660});
        promise.done(_.bind(this.completeAuth, this));

        return authenticator;
    }
});
