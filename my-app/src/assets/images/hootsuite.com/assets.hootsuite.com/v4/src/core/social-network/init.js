import _ from 'underscore';
import SocialNetworkService from 'core/social-network/service';
import connectorClasses from 'core/social-network/connectors';
import SocialNetworkResource from 'core/social-network/resource';
import ExternalAuthenticator from 'core/social-network/external-authenticator';
import SocialNetworks from 'core/social-network/cols/social-networks';
import externalAuthShim from 'core/social-network/external-auth-shim';

export default {
    init: function (socialNetworksData) {
        var snResource = new SocialNetworkResource({
            snCollection: new SocialNetworks(_.values(socialNetworksData))
        });

        // Init social service and social network app
        var snService = new SocialNetworkService({
            connectorClasses: connectorClasses,
            snResource: snResource
        });

        // Keep shim as long as there are old references to popauth and the settings/<socialnetwork>.js
        // surface app can only access objects one lever below window
        // so adding a global method here
        window.externalAuthComplete = hs.externalAuthComplete = function (source, authBundle, options) {
            // Trigger both while we remove anything that used the old workflow
            ExternalAuthenticator.externalAuthComplete(source, authBundle, options);
            externalAuthShim.shim(source, authBundle, options);
        };

        return snService;
    }
};

