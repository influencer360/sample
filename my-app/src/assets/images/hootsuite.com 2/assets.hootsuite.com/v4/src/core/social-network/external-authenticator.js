import $ from 'jquery';
import _ from 'underscore';
import util from 'utils/util';
import UiContexts from './ui-contexts';
import React from 'react';
import ReactDOM from 'react-dom';
import { AuthFocusModal } from 'fe-chan-comp-auth-focus-modal';
import hootbus from 'utils/hootbus';
import events from 'hs-events';
import serverTime from 'utils/server-time';
import trackerDatalab from 'utils/tracker-datalab';

import 'utils/ajax';
/**
 * @class ExternalAuthenticator
 *
 * @param {String} externalService the type of social network (ie. twitter)
 * @param {String} authUrl
 * @param {{}} authData
 *
 * @author Gabriel Gosselin
 * @author David Chan
 * @example var extAuth = new ExternalAuthenticator("twitter");
 *          extAuth.start('/ajax/twitter/get-auth-url')
 *              .done(function(authBundle, extras) { … });
 p.start();
 */
var ExternalAuthenticator = function (externalService, options) {
    this.authEventId = ExternalAuthenticator.generateEventId(externalService);
    this.authPopup = null;
    this.userDismissedAuthPopup = false;
    this.closeAuthFocusModal = function () {};
    this.options = options || {};
};
_.extend(ExternalAuthenticator.prototype, {
    defaultFeatures: {
        location: "0",
        menubar: "0",
        resizable: "1",
        scrollbars: "1",
        statusbar: "0",
        toolbar: "0",
        width: "800",
        height: "450"
    },
    customErrorMessage: null,
    placeholderUrl: hs.util.getUrlRoot() + '/network/network-popup-preloader',
    /**
     * Start Authentication
     * @param {String} authUrl the bare URL for authentication; pass data to options.data, do NOT manually encodeURIComponent
     * @param {{}} options
     * @param {Object} options.data  data to pass along with the authUrl call
     * @param {Boolean} options.direct
     */
    start: function (authUrl, options) {
        this._deferred = $.Deferred();
        options = options || {};
        _.bindAll(this, 'redirectExternalLoginPage', 'onAuthComplete', 'onAuthRedirectUrlFail');

        serverTime.init();
        trackerDatalab.init('body');

        // define a callback which does some cleanup, before calling the target callback
        $(document)
            .off(this.authEventId)
            .on(this.authEventId, this.onAuthComplete);

        var windowFeatures = this.prepareWindowFeatures(options);

        // Open window to page bypassing temp pre loader page
        // For Twitter, use this in conjunction with server side redirect to go to correct auth url
        if (options.direct || authUrl.match(/^https?:\/\//)) {
            var directUrl = authUrl + (options.data ? '?' + $.param(options.data) : '');
            this.authPopup = window.open(directUrl, this.authEventId, windowFeatures);
        } else {
            this.authPopup = window.open(this.placeholderUrl, this.authEventId, windowFeatures);
            ajaxCall({
                url: authUrl,
                data: options.data,
                type: 'GET'
            }, 'qm')
                .pipe(function (data) {
                    return data.url;
                })
                .done(this.redirectExternalLoginPage)
                .fail(this.onAuthRedirectUrlFail);
        }
        // Firefox currently doesn't allow tabs to be focused programmatically. In full-screen mode,
        // new windows open as tabs, so do not open the AuthFocusModal for FF in full-screen.
        var shouldOpenModal = !(util.isFireFox && window.fullScreen); // NOTE: window.fullScreen _only_ exists in Firefox
        if (shouldOpenModal) {
            this.openAuthFocusModal();
        }
        this._pollTimer = window.setInterval(this.checkIfUserClosedPopup.bind(this), 200);

        return this.promise();
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
                util.recordAction('social_network.auth.ui.focus', {useEventAsName: true});
                self.authPopup.focus();
            },
            onDismiss: function () {
                hootbus.emit(events.SOCIAL_NETWORK_REAUTH_ERROR, {socialNetwork: {socialNetworkId: self.options.snId}});
                util.recordAction('social_network.auth.ui.dismiss', {useEventAsName: true});
                self.authPopup.close();
                self.userDismissedAuthPopup = true;
            }
        }), container);
    },

    checkIfUserClosedPopup: function () {

        // authPopup can be closed by success / error as well
        // if it is closed, the interval check is not needed anymore
        if (!this.authPopup) {
            this.closeAuthFocusModal();
            window.clearInterval(this._pollTimer);
            return;
        }

        if (this.authPopup.closed !== false) {
            this.closeAuthFocusModal();
            window.clearInterval(this._pollTimer);

            if (this.authEventId.toLowerCase() === 'extauth_instagram') {
                trackerDatalab.trackCustom('web.dashboard.add_social_network', 'close_popup');
            }

            this._deferred.rejectWith(this, [{userClosed: true, userDismissedAuthPopup: this.userDismissedAuthPopup, customErrorMessage: this.customErrorMessage}]);
        }
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
     * Setup the window features for the popup. Centers the popup in the current screen.
     * @param {Object} [options]
     * @param {int} options.width
     * @param {int} options.height
     * @returns {String} 'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=1,width=800,height=450,left=0,top=0'
     */
    prepareWindowFeatures: function (options) {
        options = options || {};
        var features = _.extend({}, this.defaultFeatures, _.pick(options, 'width', 'height'));

        // Center the window in the current screen
        features.left = ((window.outerWidth / 2) - (parseInt(features.width, 10) / 2)) + window.screenLeft;
        features.top = ((window.outerHeight / 2) - (parseInt(features.height, 10) / 2)) + window.screenTop;

        return _.map(features, function (value, key) {
            return key + '=' + value;
        })
            .join(',');
    },

    close: function () {
        this.authPopup && this.authPopup.close();
    },

    /**
     * Resize the auth popup
     * @param {Number} w - Width
     * @param {Number} h - Height
     */
    resize: function (w, h) {
        this.authPopup && this.authPopup.window.resizeTo(w + 20, h + 100);
    },

    /**
     * @param {String} url
     *
     * @this {ExternalAuthenticator}
     */
    redirectExternalLoginPage: function (url) {
        // use window.location instead
        // http://stackoverflow.com/questions/7857878/window-location-vs-document-location
        this.authPopup.location = url;
        this.authPopup.focus();
    },

    /**
     * @param {Object} [data]
     *
     * @this {ExternalAuthenticator}
     */
    onAuthRedirectUrlFail: function (data) {
        this._deferred.rejectWith(this, [data]);

        // Only close after, we don't want onPopupClose to trigger default reject first
        this.close();
        this.authPopup = null;
    },

    /**
     * Note: Newer auth sequences don't return the tokens
     * @param e
     * @param {Object} [authBundle] Tokens passed form the third-party
     * @param {Object} [extras] Meta-data like if user cancelled the auth process
     *
     * @this {ExternalAuthenticator}
     */
    onAuthComplete: function (e, authBundle, extras) {
        $(document).off(this.authEventId);

        // Resolve before close so we can't trigger reject in onPopupClose
        this._deferred.resolveWith(this, [authBundle, extras]);

        if (hs.isFeatureEnabled('ADS_707_ACTIVATE_TWITTER') && this.options.uiContext === UiContexts.ADS) {
            return;
        }

        if (this.options.redirectUrl) {
            this.authPopup.location.href = this.options.redirectUrl;
        } else {
            this.authPopup && this.authPopup.close();
            this.authPopup = null;
        }
    }
});

ExternalAuthenticator.generateEventId = function (service) {
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
 * @see ExternalAuthenticator#onAuthComplete
 */
ExternalAuthenticator.externalAuthComplete = function (authSource, authBundle, extras) {
    if (extras.errorMessage) {
        ExternalAuthenticator.prototype.customErrorMessage = extras.errorMessage;
    }

    $(document).triggerHandler(ExternalAuthenticator.generateEventId(authSource), [authBundle, extras]);
};

export default ExternalAuthenticator;
