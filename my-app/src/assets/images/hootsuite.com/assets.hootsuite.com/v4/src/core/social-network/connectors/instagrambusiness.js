import _ from 'underscore';
import translation from 'utils/translation';
import ConnectorBase from 'core/social-network/connectors/base';
import hootbus from 'utils/hootbus';
import events from 'hs-events';


var ADD_URL = hs.util.getUrlRoot() + '/app/social-network/add?type=INSTAGRAMBUSINESS&flowType=MODALS';
var REAUTH_URL = hs.util.getUrlRoot() + '/app/social-network/reauth?flowType=MODALS&socialProfileId=';

/**
 * ConnectSN
 * Step 2b: Show pop-up that calls out to InstagramBusiness to obtain OAuth token/verifier
 * Step 2d: On return, pass the tokens to the back-end
 *
 * @class InstagramBusinessConnector
 * @extends SocialNetworkConnector
 */
var InstagrambusinessConnector = ConnectorBase.extend(/** @lends InstagramBusinessConnector.prototype */{
    cancelConnectMessage: translation._("You must sign in and allow Hootsuite to integrate with Facebook"),

    snType: 'instagrambusiness',

    /**
     * Display InstagramBusiness authentication screen to connect a new account
     */
    doConnect: function (options) {
        var authenticator;
        var promise;
        var snType = this.snType;
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
        authenticator = this.getAuthenticator(snType, options);
        promise = authenticator.start(AUTH_URL, {direct: true, width: 900, height: 450});
        promise.done(_.bind(this.completeAuth, this));
        // Propagate add success callback from Authenticator.
        window.onAddSocialNetworkSuccess = function (socialNetworkResponse) {
            hootbus.emit(events.SOCIAL_NETWORK_ADD_SUCCESS, socialNetworkResponse, snType);
        };

        return authenticator;
    }
});

export default InstagrambusinessConnector;
