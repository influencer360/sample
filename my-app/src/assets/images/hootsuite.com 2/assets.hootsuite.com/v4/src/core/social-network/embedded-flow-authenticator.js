import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import ReactDOM from "react-dom";
import {AuthFocusModal} from "fe-chan-comp-auth-focus-modal";
import {env, DEV, PRODUCTION, STAGING} from "fe-lib-env";
import events from 'hs-events';
import serverTime from 'utils/server-time';
import trackerDatalab from 'utils/tracker-datalab';
import hootbus from 'utils/hootbus';
import util from 'utils/util';
import 'utils/ajax';
import {ajaxRequest, dashboardJsonErrorHandling} from "../../utils/ajax-promise";
import translation from 'utils/translation';


/**
 * @class EmbeddedFlowAuthenticator
 *
 * Used for WhatsApp authentication only
 *
 * @param {String} externalService the type of social network (ie. twitter)
 * @param {String} authUrl
 * @param {{}} authData
 *
 * Expanded from ExternalAuthenticator
 * @author Gabriel Gosselin
 * @author David Chan
 * @example var extAuth = new EmbeddedFlowAuthenticator("whatsapp");
 *          extAuth.start('/ajax/twitter/get-auth-url')
 *              .done(function(authBundle, extras) { … });
 p.start();
 */
var EmbeddedFlowAuthenticator = function (externalService, options) {
    this.authEventId = EmbeddedFlowAuthenticator.generateEventId(externalService);
    this.authPopup = null;
    this.userDismissedAuthPopup = false;
    this.closeAuthFocusModal = function () {};
    this.options = options || {};
};

const APP_ID = new Map([
        [PRODUCTION, "3562730700678878"],
        [STAGING, "670381344664035"],
        [DEV, "5229865537138528"]
    ]);

const CONFIGURATION_ID = new Map([
        [PRODUCTION, "1380743159498868"],
        [STAGING, "372333545248173"],
        [DEV, "873445111235576"]
    ]);

const CONFIRM_URL = hs.util.getUrlRoot() + '/whatsapp/whatsapp-auth-confirm';

_.extend(EmbeddedFlowAuthenticator.prototype, {
    customErrorMessage: translation._("Unable to complete this operation at this time. Please try again later."),

    /**
     * Start Authentication
     * @param {String} authUrl the bare URL for authentication; pass data to options.data, do NOT manually encodeURIComponent
     * @param {{}} options
     * @param {Object} options.data  data to pass along with the authUrl call
     * @param {Boolean} options.direct
     */
    start: function (authUrl, options) {
        this._deferred = $.Deferred();
        this.selectedProfile = null;
        options = options || {};
        _.bindAll(this, 'onAuthComplete', 'onAuthError');

        serverTime.init();
        trackerDatalab.init('body');

        // define a callback which does some cleanup, before calling the target callback
        $(document)
            .off(this.authEventId)
            .on(this.authEventId, this.onAuthComplete);

        this.configureAndLoadSDK();

        // Setup listener for Embedded Flow events
        window.addEventListener('message', this.embeddedFlowListener.bind(this));

        // Maintain call to social-network/add to maintain validation and tracking
        const trackingPromise = dashboardJsonErrorHandling(
            ajaxRequest(authUrl, "POST", {
                data: options,
            })
        );

        trackingPromise.then(response => {
            if (response.status === 200) {
                // Firefox currently doesn't allow tabs to be focused programmatically. In full-screen mode,
                // new windows open as tabs, so do not open the AuthFocusModal for FF in full-screen.
                var shouldOpenModal = !(util.isFireFox && window.fullScreen); // NOTE: window.fullScreen _only_ exists in Firefox
                if (shouldOpenModal) {
                    this.openAuthFocusModal();
                }
                this.waitFor('FB', this.whatsAppEmbeddedLogin.bind(this));
            }
        }).catch(() => {
            this.onAuthError({userClosed: false, userDismissedAuthPopup: this.userDismissedAuthPopup, customErrorMessage: this.customErrorMessage});
        })

        return this.promise();
    },

    /**
     * Loads Javascript SDK asynchronously
     * See https://developers.facebook.com/docs/whatsapp/embedded-signup/embed-the-flow/
     */
    loadSDK: function () {
        var script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.crossOrigin = "anonymous";
        script.src = "https://connect.facebook.net/en_US/sdk.js";
        document.getElementsByTagName('body')[0].prepend(script);
    },

    /**
     * Initializes SDK configuration and setup
     * See https://developers.facebook.com/docs/whatsapp/embedded-signup/embed-the-flow/
     */
    initializeSDKConfig: function () {
        window.fbAsyncInit = function () {
            // JavaScript SDK configuration and setup. FB object is loaded from SDK
            // eslint-disable-next-line no-undef
            FB.init({
                appId:    APP_ID.get(env()),
                cookie:   true, // enable cookies
                xfbml:    true, // parse social plugins on this page
                version:  'v18.0' //Graph API version
            });
        };
    },

    /**
     * Helper method to prevent race conditions dependent on global object availability
     * @param variable
     * @param callback
     */
    waitFor: function (variable, callback) {
        var interval = setInterval(function() {
            if (window[variable]) {
                clearInterval(interval);
                callback();
            }
        }, 200);
    },

    configureAndLoadSDK: function () {
        let self = this;

        if (!window.fbAsyncInit) {
            if (document.readyState === "complete" || document.readyState === "loaded") {
                self.initializeSDKConfig();
                self.loadSDK();
            } else {
                document.addEventListener('DOMContentLoaded', function() {
                    self.initializeSDKConfig();
                    self.loadSDK();
                })
            }
        }
    },

    /**
     * Event listener for Embedded Flow session logging
     * See https://developers.facebook.com/docs/whatsapp/embedded-signup/embed-the-flow/
     */
    embeddedFlowListener: function (event) {
        if (event.origin !== "https://www.facebook.com") return;
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'WA_EMBEDDED_SIGNUP') {
                if (data.event === 'FINISH') {
                    // This is the external id of the profile selected within the Embedded Login flow. We use this value later on to filter the returned SocialProfileInfos
                    this.selectedProfile = data.data['phone_number_id'];
                }
                if (data.event === 'CANCEL') {
                    // User exited Auth flow early
                    // Note: We have access to data.data.current_step if we wish to track the step in which the user is exiting the embedded flow
                    // https://developers.facebook.com/docs/whatsapp/embedded-signup/embed-the-flow/#step-7--optional---session-logging
                    this.onAuthError({userClosed: true, userDismissedAuthPopup: this.userDismissedAuthPopup})
                }
            }
        } catch {
            // Received a non-JSON response from the Event Listener. Consider this a generic Auth Error but handle it in the try-catch of the confirmAuthPromise instead
        }
    },

    /**
     * Handles social profile auth via Embedded Login Flow (Note: FB object is loaded from SDK)
     * Step 1 - Check current connection status: 'connected' means user logged-in and has authorized app. If status is 'connected', we must logout in order to receive fresh auth code for reauthorization
     * Step 2 - Determine login configuration values (auth vs reauth): If reauth, use featureType setting that only requires user to select the WABA associated with the profile, instead of the phone number itself. This is a workaround for phone numbers that are registered (a requirement to receive webhook messages) and cannot be re-selected in the embedded auth flow. Unregistering a phone number is a setting that can only be undone by manually deleting the phone number from the WABA
     * Step 3 - Initiate embedded login flow and handle authentication response - Embedded flow handles authentication of user and provides auth code. We must exchange the auth code for access tokens, fetch social profiles, then add the selected profile
     * See https://developers.facebook.com/docs/whatsapp/embedded-signup/embed-the-flow/ for additional info
     */
    whatsAppEmbeddedLogin: function () {
        let self = this;

        // Step 1: Check current connection status
        // eslint-disable-next-line no-undef
        FB.getLoginStatus(function(response) {
            if (response.status === 'connected') {
                // eslint-disable-next-line no-undef
                FB.logout();
            }
        });

       // Step 2: Determine login config values
        let loginExtras = {
            "feature": "whatsapp_embedded_signup",
            "version": 2,
            "sessionInfoVersion": 2
        }
        if (!!self.options['snId']) {
            // Indicates flow is reauth
            loginExtras["featureType"] = "only_waba_sharing";
        }

        // Step 3: Initiate embedded login flow and handle authorization response
        // eslint-disable-next-line no-undef
        FB.login(function (response) {
            if (response.authResponse) {
                const code = response.authResponse.code;
                const confirmAuthUrl = !!self.selectedProfile ? CONFIRM_URL + `?code=${code}&extId=${self.selectedProfile}` : CONFIRM_URL + `?code=${code}`;
                const confirmAuthPromise = ajaxRequest(confirmAuthUrl, "GET");

                confirmAuthPromise.then(response => {
                    EmbeddedFlowAuthenticator.embeddedAuthComplete(response['data']['source'], response['data']['authBundle'], response['data']['options'])
                }).catch(() => {
                    // Failed to complete auth and add profile
                    self.onAuthError({userClosed: false, userDismissedAuthPopup: self.userDismissedAuthPopup, customErrorMessage: self.customErrorMessage});
                })
            } else {
                // Failed to receive authentication code through FB login
                self.onAuthError({userClosed: true, userDismissedAuthPopup: self.userDismissedAuthPopup, customErrorMessage: self.customErrorMessage})
            }
        }, {
            "config_id": CONFIGURATION_ID.get(env()),
            "response_type": "code",    // must be set to 'code' for System User access token
            "override_default_response_type": true, // when true, any response types passed in the "response_type" will take precedence over the default types
            "extras": loginExtras
        })
    },

    /**
     * Get the promise from the current deferred, if it exists
     *
     * @returns {Promise|null}
     */
    promise: function () {
        return this._deferred && this._deferred.promise();
    },

    /**
     * Note: Newer auth sequences don't return the tokens
     * @param e
     * @param {Object} [authBundle] Tokens passed form the third-party
     * @param {Object} [extras] Meta-data like if user cancelled the auth process
     *
     * @this {EmbeddedFlowAuthenticator}
     */
    onAuthComplete: function (e, authBundle, extras) {
        $(document).off(this.authEventId);
        this.postAuthCleanup();
        this._deferred.resolveWith(this, [authBundle, extras]);
    },
    onAuthError: function (data) {
       this.postAuthCleanup();
        //Reject Auth
        this._deferred.rejectWith(this, [data]);
    },
    postAuthCleanup: function () {
        // Close Auth Focus Modal
        this.selectedProfile = null;
        this.closeAuthFocusModal();
        this.closeAuthFocusModal = function () {};

        // Remove event listener on FB messages
        window.removeEventListener('message', this.embeddedFlowListener.bind(this));
    },
    close: function () {
        /*
         We don't have access to the authentication window to close, but we need to maintain this function to prevent a type error when method is referenced in ConnectorBase
         */
    },
    openAuthFocusModal: function () {
        this.userDismissedAuthPopup = false;
        var container = document.createElement('div');
        container.id = 'auth_focus_modal_container';
        document.body.appendChild(container);

        var self = this;

        var unmountAndRemoveContainer = function () {
            ReactDOM.unmountComponentAtNode(container);
            container.parentNode.removeChild(container);
            self.closeAuthFocusModal = function () {};
        };

        ReactDOM.render(React.createElement(AuthFocusModal, {
            onOpen: function (closeModal) {
                self.closeAuthFocusModal = function () {
                    closeModal();
                    unmountAndRemoveContainer();
                };
            },
            onResume: function () {
                // TO-DO: We can't actually resume to focus on the 3rd party pop-up, we need to modify Auth Focus Modal
            },
            onDismiss: function () {
                hootbus.emit(events.SOCIAL_NETWORK_REAUTH_ERROR, {socialNetwork: {socialNetworkId: self.options.snId}});
                util.recordAction('social_network.auth.ui.dismiss', {useEventAsName: true});
                self.userDismissedAuthPopup = true;
                self.onAuthError({userClosed: true, userDismissedAuthPopup: self.userDismissedAuthPopup})
            }
        }), container);
    }
});

EmbeddedFlowAuthenticator.generateEventId = function (service) {
    return service && "extAuth_" + service || "extAuth_general";
};

/**
 * Signal authentication from a third-party is complete
 *
 * @param {String} authSource
 * @param {Object} authBundle Bundle of authentication credentials
 * @param {String} authBundle.token
 * @param {String} authBundle.verifier
 * @param {Object} extras Options passed depending on the social network
 *
 * @see EmbeddedFlowAuthenticator#onAuthComplete
 */
EmbeddedFlowAuthenticator.embeddedAuthComplete = function (authSource, authBundle, extras) {
    if (extras['errorMessage']) {
        EmbeddedFlowAuthenticator.prototype.customErrorMessage = extras['errorMessage'];
    }

    $(document).triggerHandler(EmbeddedFlowAuthenticator.generateEventId(authSource), [authBundle, extras]);
};

export default EmbeddedFlowAuthenticator;
