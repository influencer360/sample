import $ from 'jquery';
import _ from 'underscore';
import translation from 'utils/translation';
import hsEjs from 'utils/hs_ejs';
import 'fe-vendor-dateformat';

var util = {};
//util.isIE = !!$.browser.msie; support is dropped for this in ie11

//check for ie6-11 possible future check "window.ActiveXObject || "ActiveXObject" in window"
util.isIE = !!$.browser.msie || ((navigator.appName == 'Microsoft Internet Explorer') || ((navigator.appName == 'Netscape') && (new RegExp("Trident/.*rv:([0-9]{1,}[\\.0-9]{0,})").exec(navigator.userAgent) != null)));
util.isIE7 = util.isIE && parseInt($.browser.version, 10) <= 7;	// check if browser is IE7
util.isIE8 = util.isIE && parseInt($.browser.version, 10) === 8;
util.isIE9 = util.isIE && parseInt($.browser.version, 10) === 9;
util.isIE9orBelow = util.isIE && parseInt($.browser.version, 10) <= 9;
util.isIE10orBelow = util.isIE && parseInt($.browser.version, 10) <= 10;
util.isIE11orBelow = util.isIE && parseInt($.browser.version, 10) <= 11;
util.isEdge = navigator.appName == 'Netscape' && (new RegExp("Edge/").exec(navigator.userAgent) != null);
util.isSafari = !!$.browser.safari;

// To avoid browser detection, Microsoft edge declares an empty chrome object, which should just be enabled in chrome
// therefore, just checking for variable chrome is not enough
// chrome.app.isInstalled is used to detect if the extension is installed in the browser or not
// so we make sure that variable is not undefined.. if undefined, its not chrome
util.isChrome = typeof window.chrome !== 'undefined' && typeof window.chrome.app !== 'undefined' && typeof window.chrome.app.isInstalled !== 'undefined';

// To avoid IE legacy CSS executed and browser detection, Microsoft IE11 altered it's user agent to disguise itself as firefox
// therefore $.browser.mozilla - returns true in IE11
// to avoid this we should ensure that the useragent doesn't have 'Trident' in it,
// if it does then it means it's IE11 in disguise
util.isFireFox = !!$.browser.mozilla && !navigator.userAgent.match(/Trident/);

util.isEmailValid = function (str) {
    return (/^[^@]+?@.{1,}?\..{2,}$/).test(str);	// very basic validation
};

util.isPasswordValid = function (str) {
    // legacy accounts were able to have 4 characters
    // new accounts are required to have >= 6
    return str.length >= 4;	// very basic validation
};

util.isResetPasswordValid = function (str) {
    return str.length >=8;
}

util.isGoogleAuthenticatorValid = function (str) {
    return (/^\d{6}$/).test(str);	// very basic validation
};

// jquery each2
// http://benalman.com/projects/jquery-misc-plugins/#each2
(function ($) {

    // Create a placeholder jQuery object with a length of 1. The single item
    // is completely arbitrary and will be replaced.
    var jq = $([1]);

    $.fn.each2 = function (fn) {
        var i = -1;

        while (
            // Set both the first element AND context property of the placeholder
            // jQuery object to the DOM element. When i has been incremented past the
            // end, this[++i] will return undefined and abort the while loop.
        (jq.context = jq[0] = this[++i])

            // Invoke the callback function in the context of the DOM element,
            // passing both the index and the placeholder jQuery object in. Like
            // .each, if the callback returns `false`, abort the while loop.
        && fn.call(jq[0], i, jq) !== false
            ) {
            $.noop();
        }

        // Return the initial jQuery object for chainability.
        return this;
    };

})(jQuery);

//function for swapping between two classes
//also returns the name of the new classname
$.fn.swapClass = function (c1, c2) {
    return this.each(function () {
        $(this).toggleClass(c1).toggleClass(c2);
    });
};

// function that returns all form values
// or restores form values from argument
$.fn.formValues = function (data) {
    var els = $(this).find(':input').get();

    if (typeof data != 'object') {
        // return all data
        data = {};

        $.each(els, function () {
            var nodenameregex = /select|textarea/i;
            var typeregex = /text|hidden|password/i;

            if (this.name && !this.disabled && (this.checked
                || nodenameregex.test(this.nodeName)
                || typeregex.test(this.type))) {
                data[this.name] = $(this).val();
            }
        });
        return data;
    } else {
        $.each(els, function () {
            if (this.name && data[this.name]) {
                if (this.type == 'checkbox' || this.type == 'radio') {
                    $(this).attr("checked", (data[this.name] == $(this).val()));
                } else {
                    $(this).val(data[this.name]);
                }

                $(this).change();
            }
        });
        return $(this);
    }
};

// ucfirst like php/perl
util.ucFirst = function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Convert an underscore style name to ClassCase ex. DATASIFT_KEYWORD to DatasiftKeyword
 * @param str
 */
util.toClassCase = function (str) {
    str = str || '';
    return str.toLowerCase().replace(
        // Find first letter in word or after _
        /(?:^|_)([a-z])/g,
        function (s, g1) {
            return g1.toUpperCase();
        }
    );
};

window.fadeSlideRemove = function (e, delay, callback) {
    if (!delay) {
        delay = 0;
    }
    $(e).animate({opacity: 1.0}, delay)
        .animate({opacity: 0.0}, 400)
        .slideUp(200, function () {
            $(e).remove();
            $.isFunction(callback) && callback();
        });
};

window.disableEnterKey = function (e) {
    var key = (window.event) ? window.event.keyCode : e.which;
    return (key != 13);
};

window.checkForEnterKey = function (e, c) {
    var key = (window.event) ? window.event.keyCode : e.which;
    if (key === 13) {
        // prevent default action (usually submit)
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        if (c !== undefined) {
            $("." + c).click();
        }
        else {
            if (hs.submitClass !== undefined) {
                $("." + hs.submitClass).click();
            }
        }
    }
};

window.getFlashMovieObject = function (movieName) {
    if (window.document[movieName]) {
        return window.document[movieName];
    }
    if (navigator.appName.indexOf("Microsoft Internet") === -1) {
        if (document.embeds && document.embeds[movieName]) {
            return document.embeds[movieName];
        }
    } else {
        return document.getElementById(movieName);
    }
};

window.truncate = function (str, length, suffix) {
    suffix = suffix || '...';
    // take suffix length into consideration
    length = length - suffix.length;
    if (!length || !str || length >= str.length) {
        return str;
    }

    var output = str.substr(0, length);
    var lastSpace = output.lastIndexOf(' ');
    if (lastSpace > -1) {
        output = output.substring(0, lastSpace);
    }
    return output + suffix;
};

// use this to resize browser popup windows
window.resizeToInner = function (w, h) {
    var _this = window.resizeToInner,
        cwidth = _this.cwidth,
        cheight = _this.cheight;

    if (cwidth && cheight) {
        window.resizeTo(w + cwidth, h + cheight);
        return;
    }

    if (window.outerWidth) {
        cwidth = _this.cwidth = window.outerWidth - $(window).width();
        cheight = _this.cheight = window.outerHeight - $(window).height();
        window.resizeTo(w + cwidth, h + cheight);
    } else {
        // move the window to the top left then resize to the maximum viewable dimension possible
        window.moveTo(0, 0);
        window.resizeTo(screen.availWidth, screen.availHeight);

        setTimeout(function () {
            // now that we have set the browser to it's biggest possible size
            // get the inner dimensions.  the offset is the difference.
            var inner = [$(document).width(), $(document).height()];
            cwidth = _this.cwidth = screen.availWidth - inner[0];
            cheight = _this.cheight = screen.availHeight - inner[1];
            // now that we have an offset value, size the browser
            window.resizeTo(w + cwidth, h + cheight);
        }, 1);
    }
};

hs.onAvatarError = function (image) {
    image.className = image.className + " icon-30" + " noAvatar";
    return true;
};

hs.replaceAvatarWithDefault = function (image) {
    image.src = hs.util.getDefaultAvatar('member');
    return true;
};

hs.reloadBrowser = function () {
    setTimeout(function () {
        try {
            window.location.reload();
        } catch (err) {
            window.location.href = hs.c.rootUrl;
        }
    }, 1);
};

jQuery.expr[':'].Contains = function (a, i, m) {
    return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
};

jQuery.expr[':'].startsWith = function (a, i, m) {
    return $.trim(jQuery(a).text().toUpperCase()).indexOf(m[3].toUpperCase()) === 0;
};

// function that generates a date given Date() args and the timezone mins
// fn(2000, 0, 1, 480) gives Jan 1, 2000 in GMT-8
util.tzDate = function () {
    var fnMinsToMillisec = function (mins) {
            return mins * 60 * 1000;
        },
        dateArgs = Array.prototype.slice.call(arguments, 0, arguments.length - 1),
        timezoneMins = arguments[arguments.length - 1];		// GMT - <curr time> = timezoneMins, eg: 480 for Vancouver (GMT-8)
    if (arguments.length === 0 || arguments.length == 1) {
        dateArgs = [];
        timezoneMins = arguments.length ? arguments[0] : 0;
    }

    const d = new Date(...dateArgs);
    return new Date(+d + fnMinsToMillisec(d.getTimezoneOffset()) - fnMinsToMillisec(timezoneMins));
};
// wrapper function that automatically uses hootsuite user's timezone (via hs.timezoneOffset variable)
util.userDate = function () {
    var fnConvertHsTimezoneOffset = function (hsTz) {
            return hsTz / 60 * -1;
        },	// hs.timezoneOffset is seconds from GMT
        a = Array.prototype.slice.call(arguments);
    a.push(fnConvertHsTimezoneOffset(hs.timezoneOffset));	// make it the last argument
    return util.tzDate.apply(null, a);
};

util.myDate = function () {
    return new Date(new Date().getTime() + hs.timezoneOffset * 1000);
};

util.dateFromUtcTimestamp = function (utcTimestamp) {
    var d = new Date(utcTimestamp); // gives us the right datetime but wrong timezone
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()));
};

util.userDateFromUtc = function (utcTimestamp) {
    return util.userDate(+util.dateFromUtcTimestamp(utcTimestamp));		// slightly convoluted, but because we can't change the timezone, we're stuck just ignoring it
};

util.userDateHootsuiteTime = function (hsTimestamp) {
    var matches = (new Date(hsTimestamp * 1000).format('UTC:yyyy:mm:dd HH:MM:ss')).match(/(\d+):(\d+):(\d+) (\d+):(\d+):(\d+)/);
    if (!matches) {
        return null;
    }
    return new Date(matches[1], matches[2] * 1 - 1, matches[3], matches[4], matches[5], matches[6]);
};


util.isStringNumLte = function (strNum1, strNum2) {
    if (typeof strNum1 == 'string' && typeof strNum2 == 'string' && strNum1.length > strNum2.length) {
        return false;
    }
    return strNum1 <= strNum2;
};

util.numberFormat = function (str, decimals) {
    if (decimals) {
        str = parseFloat(str).toFixed(decimals);
    }
    str += '';
    var x = str.split('.'),
        x1 = x[0],
        x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
};

util.inherit = function (Child, Parent) {
    var F = function () {
    };
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.superclass = Parent.prototype;
    Child.prototype.constructor = Child;
};

/**
 * Swiped from backbone 1.0 (when you don't want to depend on Backbone for class pattern)
 *
 * @param {Object} protoProps instance methods of this sub-class
 * @param staticProps static methods on your child class
 * @returns {*} a sub-class of the applied
 */
util.extend = function (protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
        child = protoProps.constructor;
    } else {
        child = function () {
            return parent.apply(this, arguments);
        };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function () {
        this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) { _.extend(child.prototype, protoProps); }

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
};

/**
 * This function parses query string and makes hash object.
 * e.g., util.parseQueryString('?foo=bar&fizz=buzz') => {"foo": "bar", "fizz": "buzz"}
 *
 * @param query : a query string to parse
 */
util.parseQueryString = function (query) {
    var urlParams = {},
        e,
        a = /\+/g, // Regex for replacing addition symbol with a space
        r = /([^&=]+)=?([^&]*)/g,
        d = function (s) {
            return decodeURIComponent(s.replace(a, " "));
        },
        q = (0 < query.length && 0 === query.indexOf('?')) ? query.substring(1) : query;

    e = r.exec(q);
    while (e) {
        urlParams[d(e[1])] = d(e[2]);
        e = r.exec(q);
    }

    return urlParams;
};

util.toggleLoginBoxView = function (view) {
    var $loginForm = $("form[name='memberLoginForm']");
    var isPopup = false;
    if ($loginForm.length === 0) {
        $loginForm = $("form[name='memberLoginPopupForm']");
        isPopup = true;
    }

    if (view == 'sso') {
        $loginForm.find("._loginPasswordBlock").hide();
        $loginForm.find("._loginSsoBlock").show();
        $loginForm.find("#useOneLogin").val("on");
        if (isPopup) {
            $("#memberPopLoginContainer .btns ._loginPasswordBlock").hide();
            $("#memberPopLoginContainer .btns ._loginSsoBlock").show();
        }
    } else {
        $loginForm.find("._loginSsoBlock").hide();
        $loginForm.find("._loginPasswordBlock").show();
        $loginForm.find("#useOneLogin").val("");
        if (isPopup) {
            $("#memberPopLoginContainer .btns ._loginSsoBlock").hide();
            $("#memberPopLoginContainer .btns ._loginPasswordBlock").show();
        }
    }

    $loginForm.find("input._loginEmailInput").focus();

    return false;
};

(function () {
    var supportPlaceholder;
    $.fn.hsPlaceholder = function () {
        if (supportPlaceholder == null) {
            supportPlaceholder = ('placeholder' in document.createElement('input'));
        }
        var $els = $(this).find('input, textarea');
        if ($els.length === 0) {
            return;
        }
        $els.each(function () {
            var $field = $(this);
            // We now support a placeholder to be declared
            // directly in the html, so try to get the value there first
            // if it is there, put it into jquery data so we can use it
            // to compare later, else look for the value in jquery data already
            var initText = $field.attr('placeholder');
            if (initText) {
                $field.data('placeholder', initText);
            } else {
                initText = $field.data('placeholder');
            }

            // if there is no init value, return
            if (!initText) {
                return;
            }

            if (supportPlaceholder) {
                $field.attr('placeholder', initText);
            } else {
                // init our placeholder value if
                // the input has no value set
                if ($field.val() === '') {
                    $field.val(initText).addClass("phInactive");
                }

                // init our focus/blur events to set/remove
                // input value to simulate placheholder
                $field.focus(function () {
                    if ($.trim($field.val()) == $field.data('placeholder')) {
                        $field.val("").removeClass("phInactive");
                    }
                })
                    .blur(function () {
                        if ($.trim($field.val()) === "") {
                            $field.val($field.data('placeholder')).addClass("phInactive");
                        }
                    });
            }
        });
        return this;
    };
})();

// get the X and Y pos of the mouse from an event
// http://stackoverflow.com/questions/57652/how-do-i-get-javascript-to-open-a-popup-window-on-the-current-monitor/57684#57684
util.getMouseXY = function (e) {
    var left, top;
    if (typeof event !== 'undefined' && event.clientX) { // Grab the x-y pos.s if browser is IE.
        left = event.clientX + document.body.scrollLeft;
        top = event.clientY + document.body.scrollTop;
    }
    else {  // Grab the x-y pos.s if browser isn't IE.
        left = e.pageX;
        top = e.pageY;
    }
    if (left < 0) {
        left = 0;
    }
    if (top < 0) {
        top = 0;
    }

    return {
        left: left,
        top: top
    };
};

/**
 * Record user actions to statsd for rough tracking
 *
 * @param {string} action descriptor used in statsd lookup table
 * @param {Object} extraArgs additional commands for statsd route
 * @param {*} extraArgs.value
 * @param {*} extraArgs.snType
 * @param {*} extraArgs.snPicker
 * @param {*} extraArgs.statType
 * @param {*} extraArgs.splitByLocation
 * @param {int} timeOut in milliseconds
 * @return {Promise}
 */
util.recordAction = function (action, extraArgs) {
    var args = {event: action};
    if (extraArgs) {
        args = _.extend(args, _.pick(extraArgs, 'value', 'snType', 'snPicker', 'statType', 'splitByLocation', 'useEventAsName'));
    }

    var host = hs.util.getUrlRoot()

    return fetch(host + '/ajax/index/statsd?csrfToken=' + hs.csrfToken, {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(args),
    })
};

util.isCanvasSupported = function () {
    var elem = document.createElement('canvas');
    return !!(elem.getContext && elem.getContext('2d'));
};

/**
 * Takes user input as local time and create Date object that has UTC timestamp
 *
 * @param {String} date 2012-12-12
 * @param {int} hour
 * @param {int} minute
 * @param {String} amPm
 * @returns {number}
 */
util.convertToUTCTimestamp = function (date, hour, minute, amPm) {
    if ('AM' == amPm && 12 == hour) {
        hour = 0;
    } else {
        hour = (amPm == 'AM' ? 0 : 1) * 12 + hour;
    }

    date = date.split("-");

    var year = date[0];
    var month = parseInt(date[1], 10) - 1;
    var day = parseInt(date[2], 10);

    return new Date(year, month, day, hour, minute);
};

/**
 * If the user is in an Enterprise or an Employee
 * Consider using FeatureAccessControl to determine if a feature should be accessible. This should only be for metrics
 * and simple cases
 *
 * @returns {boolean}
 */
util.userIsEnterprisey = function () {
    return (hs.memberMaxPlanCode === "ENTERPRISE" || hs.memberMaxPlanCode === "EMPLOYEE");
};

/**
 * Gets the URL GET parameters specified in the current web address
 * Based heavily on http://stackoverflow.com/a/7732379
 *
 * Uses the current window location
 * @return {Object.<string, string>}
 */
util.getURLParams = function () {
    var params = {};

    if (location.search && location.search.length > 1) {
        _.each(location.search.substr(1).split("&"), function (pair) {
            if (pair === "") { return; }
            var parts = pair.split("=");
            params[parts[0]] = parts[1] &&
            decodeURIComponent(parts[1].replace(/\+/g, " "));
        });
    }

    return params;
};

/**
 * Gets parameters if they appear AFTER the # in the URL
 * i.e. https://www.hootsuite.com/dashboard#/member?foo=bar returns { foo: "bar" }
 * Based heavily on http://stackoverflow.com/a/7732379
 *
 * Uses the current window location
 * @return {Object.<string, string>}
 */
util.getURLParamsFromHash = function () {
    var params = {};
    if (location.hash && location.hash.length > 1) {
        var hash_split = location.hash.split('?');
        if (hash_split.length > 1) {
            var query_string = hash_split[1];
            _.each(query_string.split("&"), function (pair) {
                if (pair === "") { return; }
                var parts = pair.split("=");
                params[parts[0]] = parts[1] &&
                decodeURIComponent(parts[1].replace(/\+/g, " "));
            });
        }
    }
    return params;
};

/**
 * Serialize a form to an associative object (instead of a URL string or nested array)
 *
 * @param {jQuery} $inputCollection a form or similar container for input elements
 * @returns {Object}
 */
util.serializeObject = function ($inputCollection) {
    var returnData = {};
    _.each($inputCollection.serializeArray(), function (bundle) {
        util.desquare(bundle.name, bundle.value, returnData);
    });

    return returnData;
};

/**
 * Takes form style square notation deeply nested property references and assigns a value within
 * the target object.
 * ie 'socialNetwork[type]' -> socialNetwork: { type: <value> }
 *
 * @param {string|array<string>} keys the nested
 * @param {*} value
 * @param {Object} target
 */
util.desquare = function (keys, value, target) {
    if (!_.isString(keys)) {
        return;
    }

    keys = keys.split(/]?\[|]/);
    // Remove last item if it's blank (the last ] is cleaned off but creates an extra entry)
    _.last(keys) === '' && keys.pop();

    var lastIndex = keys.length - 1;
    var nestedTarget = target;
    var lastIsArray = _.last(keys) === '';
    for (var i = 0; i <= lastIndex; i++) {
        var key = keys[i];
        if (i == lastIndex) {
            nestedTarget[key] = value;
        } else if (lastIsArray && i == lastIndex - 1) {
            if (!_.isArray(nestedTarget[key])) {
                nestedTarget[key] = [];
            }
            nestedTarget[key].push(value);
            break;
        } else {
            if (!Object.prototype.hasOwnProperty.call(nestedTarget, key)) {
                nestedTarget[key] = {};
            }
            nestedTarget = nestedTarget[key];
        }
    }
};

/**
 * Cast the specified values of an option hash to integer
 *
 * @param {{}} options
 * @param {...string} keys
 */
util.castOptionsToInt = function (options) {
    if (!options) { return {}; }
    _.each(_.rest(arguments), function (key) {
        if (options[key]) {
            options[key] = parseInt(options[key], 10);
        }
    });
    return options;
};

/**
 * Checks password to see if it meets our policy
 * @param password
 * @returns {Object.<string, boolean>} policies
 */
util.newPasswordPolicyChecker = function (password, confirmation) {
    var policies = {
        'length': (password.length >= 8),
        'upper': (password.match(/[A-Z]/) !== null),
        'lower': (password.match(/[a-z]/) !== null),
        'match': password === confirmation
    }
    return policies;
}

util.policyChecker = function (password) {
    return {
        'length': (password.length >= 8),
        'upper': (password.match(/[A-Z]/) !== null),
        'lower': (password.match(/[a-z]/) !== null)
    };
};

util.newPolicyChecker = function (password, confirmation) { 
    return {
        ...util.policyChecker(password),
        'match': password === confirmation
    }
}

/**
 * Check if a policy map has failed checks
 * @param {Object.<string, boolean>} policies
 * @returns {boolean}
 */
util.invalidPolicies = function (policies) {
    return !!_.filter(policies, function (pass) { return !pass; }).length;
};

/**
 * Maps policy boolean to policy message
 * @param policies
 * @param messages
 * @returns {Object.<string, boolean, string>} policies
 */
util.mapPolicyMessages = function (policies, messages) {
    return _.map(policies, function (pass, name) {
        return {
            name: name,
            pass: pass,
            message: messages[name]
        };
    });
};

util.checkNewPasswordPolicy = function ($input, $confirmation) {
    var password = $input.val();
    var passwordConfirmation = $confirmation.val()
    var valid = false

    if ($confirmation) {
        passwordConfirmation = $confirmation.val()
    }

    var messages = {};
    messages = {
        'length': translation._(" 8 characters long"),
        'upper': translation._(" Uppercase letter"),
        'lower': translation._(" Lowercase letter"),
        'match': translation._(" Passwords must match ")
    }

    var policies = util.newPolicyChecker(password, passwordConfirmation);
    util.clearBubbles();
    var infoBubble = hsEjs.getEjs('infoBubble').render({
        policies: util.mapPolicyMessages(policies, messages)
    });

    if (util.invalidPolicies(policies)) {
        $input.addClass('error');
        $confirmation.addClass('error')
    } else {
        $input.removeClass('error');
        $confirmation.removeClass('error')
        valid = true
    }

    $input.before(infoBubble);
    $('._inlineInfoHolder').on('click', util.clearBubbles);
    return valid;
};

/**
 * Checks string to see if it conforms with our password policy
 * @param {jQuery} $input is the form field containing the password
 *
 */

util.checkPasswordPolicy = function ($input) {
    var password = $input.val();

    util.clearBubbles();

    var messages = {};
    messages = {
        'length': translation._(" 8 characters long"),
        'upper': translation._(" Uppercase letter"),
        'lower': translation._(" Lowercase letter")
    };

    var policies = util.policyChecker(password);

    var infoBubble = hsEjs.getEjs('infoBubble').render({
        policies: util.mapPolicyMessages(policies, messages)
    });

    if (util.invalidPolicies(policies)) {
        $input.addClass('error');
    } else {
        $input.removeClass('error');
    }

    $input.before(infoBubble);
    $('._inlineInfoHolder').on('click', util.clearBubbles);
};

/**
 *  Validates string to see if it conforms with our password policy
 * @param {jQuery} $input is the form field containing the password
 * @returns {boolean}
 */
util.validatePassword = function ($input) {

    if ($input.length === 0) {
        return true;
    }

    var password = $input.val();

    var messages = {};
    messages = {
        'length': translation._("Your password must contain at least 8 characters"),
        'upper': translation._("Your password must contain at least 1 uppercase character"),
        'lower': translation._("Your password must contain at least 1 lowercase character")
    };
    var policies = util.policyChecker(password);

    util.clearBubbles();

    if (util.invalidPolicies(policies)) {
        var errorBubble = hsEjs.getEjs('errorBubble').render({
            policies: util.mapPolicyMessages(policies, messages)
        });
        $input.before(errorBubble);
        $('._inlineErrorHolder').on('click', util.clearBubbles);
        return false;
    }
    return true;
};

util.clearBubbles = function () {
    var $errorBubble = $('._inlineErrorHolder');
    var $infoBubble = $('._inlineInfoHolder');

    if ($errorBubble.length) {
        $errorBubble.remove();
    }
    if ($infoBubble.length) {
        $infoBubble.remove();
    }
};


/**
 * Make fail meaningful again. For the places we don't properly use HTTP.
 * !!!
 * You MUST check that your endpoint returns success = 0/false for a fail scenario, otherwise this won't work!
 * !!!
 *
 * @param {Promise} ajaxPromise
 * @param [context] the this context for the then/done/fail functions called from this
 * @returns {Promise}
 */
util.promiseRealSuccess = function (ajaxPromise, context) {
    context = context || ajaxPromise;
    var deferred = $.Deferred();

    var failFn = function (jqXHR, textStatus, errorThrown, data) {
        deferred.rejectWith(context, [jqXHR, textStatus, errorThrown, data]);
    };
    ajaxPromise
        .done(function (data, textStatus, jqXHR) {
            if (data.success == '0' || data.error) {
                failFn(jqXHR, textStatus, '', data);
            } else {
                deferred.resolveWith(context, [data]);
            }
        })
        .fail(failFn);

    return deferred.promise();
};

/**
 * Using this makes your code easier to unit test
 *
 * @param newUrl
 */
util.doRedirect = function (newUrl, params) {
    if (params) {
        util._redirect(newUrl + '?' + $.param(params));
    } else {
        util._redirect(newUrl);
    }
};

util._redirect = function (newUrl) {
    window.location.href = newUrl;
};

util.getHostname = function (url) {
    var l = document.createElement("a");
    l.href = url;
    return l.hostname;
};

util.doNewTab = function (url) {
    window.open(url);
};

/**
 * Pass in a list of keys to convert to server-safe boolean values, modifies the object in-place
 *
 * @param {Object} input
 * @param {...String} args
 */
util.boolToForm = function (input) {
    var keys = _.rest(arguments);
    _.each(keys, function (key) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
            input[key] = input[key] ? 1 : 0;
        }
    });
};

util.keepErrorMessageVisible = function (data) {
    hs.statusObj.reset(); // reset everything

    // data not guaranteed to be json string
    try {
        var response = JSON.parse(data.responseText);

        if ("error" in response && "leaveErrorMessage" in response.error && response.error.leaveErrorMessage) {
            hs.statusObj.update(response.error.message, 'error', true); // put message back up
        }
    } catch (exception) {
        // silent catch
    }
};

/**
 * Check password strength and log score for individual flow and aggregate scores
 * @param {string} password
 * @param {string} signupFlow identifier. MUST match key in ajax/index/statsd
 * @returns {*|Promise|null}
 */
util.checkPasswordStrength = function (password, signupFlow) {
    var deferred = new $.Deferred();
    hs.require('password-validation', function () {
        var result = hs.util.zxcvbn(password);

        var passwordStrengthMap = {
            0 : 'passwordStrengthZero',
            1 : 'passwordStrengthOne',
            2 : 'passwordStrengthTwo',
            3 : 'passwordStrengthThree',
            4 : 'passwordStrengthFour'
        };

        var passwordStrengthOfFlow = passwordStrengthMap[result.score];
        passwordStrengthOfFlow = passwordStrengthOfFlow + signupFlow;
        util.recordAction(passwordStrengthOfFlow, {}, 1000).done(
            util.recordAction(passwordStrengthMap[result.score], {}, 1000)
                        .done(deferred.resolve)
                        .fail(deferred.reject)
            );
    });

    return deferred.promise();
};

/**
 * Window proxy to call functions from string
 * @param {string} function name to be called
 * @param {array} array of prams to be passed to the function
 * @param {sting} context for the function to run
 */
util.dashboardWindowProxy = function (strFnToRun, arrArgs, context) {

    // loop through the function to run to get the actual function reference
    var ref = _.reduce(strFnToRun.split('.'), function (memo, name) {
        return memo[name];
    }, window);

    if (_.isFunction(ref)) {
        return ref.apply(context, arrArgs);
    }
};

/**
 * Get the current URL that the user is on within the dashboard for logging purposes
 * @returns {string}
 */
util.getContextPathUrl = function () {
    // https://hootsuite.com/dashboard#/publisher/expired => dashboard#/publisher/expired
    var url = window.location.href.split('/').slice(3).join('/');
    // remove the tab id query string
    if (url.match(/tabs\?id=\d+/i)) {
        url = url.replace(/tabs\?id=\d+/, 'tabs');
    }
    return url;
};

hs.util = hs.util || {};
_.extend(hs.util, util);

export default util;
