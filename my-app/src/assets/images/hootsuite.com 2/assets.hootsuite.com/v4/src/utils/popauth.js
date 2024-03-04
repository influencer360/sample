import translation from 'utils/translation';
/**
 * hs popup authentification helper
 * @constructor
 *
 * @param {String} instanceName the type of social network (ie. twitter)
 * @param {String} authUrl
 * @param {Function} callback - Success Callback
 * @param {Function} errorCallback - Error Callback
 * @param beforeStart
 * @param {Function} cancelCallback - Cancel Callback
 *
 * @author David Chan
 * @example var p = new popauth("twitter", '/ajax/twitter/get-auth-url', function(e, ot, ov) { $.get('ajax/twitter/debug-get-oauth-tokens?ot='+ot+'&ov='+ov); });
 p.start();
 */
window.popauth = function (instanceName, authUrl, callback, errorCallback, beforeStart, cancelCallback) {
    /**
     * scope
     * @private
     */
    var __self = this;
    /**
     * Oauth url callback
     * @type String
     * @private
     */
    var _instanceName = "popauth_" + instanceName || "popauth_instance";

    this.r_popup = null;


    /**
     * Start Authentication
     * @param options
     * @param [options.keepPopupAfterSuccess]
     * @param [options.direct]
     */
    this.start = function (options) {
        options = options || {};

        // define a callback which does some cleanup, before calling the target callback
        var fn = function (e, oauthToken, oauthVerifier, userCancel) {
            $(document).unbind(_instanceName);	// unbind

            // close popup
            if (!options.keepPopupAfterSuccess) {
                if (__self.r_popup && !__self.r_popup.closed) {
                    __self.r_popup.close();
                }
            }

            if (userCancel && $.isFunction(cancelCallback)) {
                cancelCallback();
            } else {
                // call the callback with oauthToken and (optional) oauthVerifier
                if ($.isFunction(callback)) {
                    callback(e, oauthToken, oauthVerifier);
                }
            }
        };
        $(document).unbind(_instanceName).bind(_instanceName, fn);

        // Open window to page bypassing temp pre loader page
        // For Twitter, use this in conjunction with server side redirect to go to correct auth url
        if (options.direct) {
            __self.r_popup = window.open(authUrl, '', 'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=1,width=800,height=450');
            return;
        }

        // open a temporary window, this is done to bypass the popup blocker
        // if we delay the opening of the popup window to the ajax callback, it will be blocked.
        __self.r_popup = window.open(hs.util.getUrlRoot() + '/network/network-popup-preloader', '', 'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=1,width=800,height=450');

        // make a call to get the authentication url
        var fnGotoExternalLoginPage = function (url) {
            setTimeout(function () {
                __self.r_popup.document.location = url;
            }, 100);
            __self.r_popup.focus();
        };

        var fnStartLogic = function () {
            if (authUrl.match(/^https?:\/\//)) {
                fnGotoExternalLoginPage(authUrl);
            } else {
                ajaxCall({
                    url: authUrl,
                    success: function (data) {
                        if (data.url) {
                            // we have the auth url now, set our already-open popup to it
                            fnGotoExternalLoginPage(data.url);
                        }
                        else {
                            __self.r_popup.close();
                            hs.statusObj.update(translation._("An error occurred while connecting to external API. Please try again later") + " Code: " + data.errorCode, 'error', true, 6000);
                            $.isFunction(errorCallback) && errorCallback();
                        }
                    }
                }, 'qm');
            }
        };


        // we have the popup open, do something
        if (beforeStart && $.isFunction(beforeStart)) {
            beforeStart(fnStartLogic);
        } else {
            fnStartLogic();
        }
    };

    /**
     * Resize the auth popup
     * @param {Number} w - Width
     * @param {Number} h - Height
     */
    this.resize = function (w, h) {
        __self.r_popup.window.resizeTo(w + 20, h + 100);
    };
};

/** @namespace */
hs.popauth = hs.popauth || {};
/**
 * used to trigger a popauth callbac instance, not called manually
 * @example set the callback url of your auth to: IN_URLROOT.'/network/popauth-finished?instance=twitter'; (replace twitter with your instance name)
 */
hs.popauth.triggerCallback = function (instanceName, oauthToken, oauthVerifier, fbUserCancel) {
    if (typeof instanceName != "string" || !instanceName.length) {
        if (fbUserCancel) {
            $(document).triggerHandler("popauth_facebookgraph", [null, null, 1]);
        }
        return;
    }
    var params = [oauthToken, oauthVerifier];
    $(document).triggerHandler("popauth_" + instanceName, params);	// popauth always binds events on document
};

export default window.popauth;

