import $ from 'jquery';
import _ from 'underscore';
import util from 'utils/util';
import trackerDatalab from 'utils/tracker-datalab';
/**
 * @class RedirectAuthenticator
 * @alias module:core/social-network/redirect-authenticator
 *
 * @param {String} externalService the type of social network (ie. twitter)
 * @param {Object} triggerData  Data from the backend that indicates a completed auth
 *
 * @author Gabriel Gosselin
 * @example var extAuth = new RedirectAuthenticator("twitter");
 *          extAuth.start('/ajax/twitter/get-auth-url')
 *              .done(function(authBundle, extras) { … });
 */
var RedirectAuthenticator = function (externalService, triggerData) {
    this.triggerData = triggerData || null;
};
_.extend(RedirectAuthenticator.prototype, /** @lends RedirectAuthenticator.prototype */{
    /**
     * Start Authentication
     * @param {String} authUrl the bare URL for authentication; pass data to options.data, do NOT manually encodeURIComponent
     * @param {{}} options
     * @param {Object} options.data  data to pass along with the authUrl call
     * @param {boolean} options.isComplete if the user is returning after a redirect
     */
    start: function (authUrl, options) {
        trackerDatalab.trackCustom('RedirectAuthenticator', 'start');
        options = options || {};
        this._deferred = $.Deferred();

        if (this.triggerData) {
            // Yes, resolve the promise immediately because we've already done the auth step
            this._deferred.resolveWith(this, [this.triggerData.authBundle, this.triggerData.extras]);
        } else {
            // Either a direct URL or we're requesting the URL to which to redirect (only Twitter)
            if (options.direct || authUrl.match(/^https?:\/\//)) {
                var url = authUrl;
                if (options.data) {
                    url += '?' + $.param(options.data);
                }
                util.doRedirect(url);
            } else {
                ajaxCall({
                    url: authUrl,
                    data: options.data,
                    type: 'GET'
                }, 'qm')
                    .pipe(function (data) {
                        return data.url;
                    })
                    .done(util.doRedirect)
                    .fail(this._deferred.reject);
            }
        }

        return this.promise();
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
     * Implement the implicit interface
     */
    close: $.noop
});

export default RedirectAuthenticator;

