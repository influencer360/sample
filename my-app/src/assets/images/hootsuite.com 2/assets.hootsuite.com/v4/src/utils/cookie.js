import $ from 'jquery';
/**
 * Cookie Manager Constructor
 *
 * @constructor
 * @class CookieManager
 * @param {String} [_domain] Cookie domain name
 *
 * @author quirksmode.org (http://www.quirksmode.org/js/cookies.html) modified by David Chan
 */
window.CookieManager = function (_domain) {
    /**
     * Create a cookie
     *
     * @param {String} name Name of the cookie
     * @param {String} value Value of the cookie
     * @param {Number} [days] Days before cookie expires
     */
    this.create = function (name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        }
        document.cookie = name + "=" + value + expires + "; path=/;" + (_domain ? " domain=" + _domain : "");
    };
    /**
     * Read a cookie
     *
     * @param {String} name The name of the cookie
     * @returns {null|String} The value of the cookie or null
     */
    this.read = function (name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
        return null;
    };
    /**
     * Remove a cookie
     *
     * @param {String} name The name of the cookie to remove
     */
    this.remove = function (name) {
        this.create(name, "", -1);
    };
};

/**
 * $.cookie is CookieManager instance
 * @type CookieManager
 */
$.cookie = new window.CookieManager(document.domain);

hs.getSessionId = function () {
    return $.cookie.read(hs.c.SESSION_COOKIE) || $.cookie.read(hs.c.SESSION_COOKIE_DEFAULT);
};

export default $.cookie;
