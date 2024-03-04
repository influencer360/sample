import $ from 'jquery';
import translation from 'utils/translation';
import _ from 'underscore';

var member = {};

window.updateMemberPreferenceWithTimer = function (type, value, timeout, callback) {
    if (!timeout) {
        timeout = hs.c.delayPrefsMember * 1000;
    }

    if (hs.timers.updateMemberPreferenceTimer != void 0) {
        clearTimeout(hs.timers.updateMemberPreferenceTimer);
        delete hs.timers.updateMemberPreferenceTimer;
    }

    hs.timers.updateMemberPreferenceTimer = setTimeout(function () {
        window.updateMemberPreference(type, value, callback);
    }, timeout);
};

window.updateMemberPreference = function (type, value, callback) {
    ajaxCall({
        url: "/ajax/member/update-preference",
        data: "type=" + encodeURIComponent(type) + "&value=" + encodeURIComponent(value),
        complete: function () {
            $.isFunction(callback) && callback();
        }
    }, 'q1');
};

window.initSignupForm = function (signupForm, selectors, callback) {
    if (signupForm.length === 0) {
        return;
    }

    var $signupForm = $('#memberSignupForm');

    $('._passwordField').keyup(function (event) {
        if (event.keyCode != 13) {
            hs.util.checkPasswordPolicy($(this));
        }
    });

    $('._submitSignup').on('click', function () {
        if (hs.util.validatePassword($('._passwordField'))) {
            hs.throbberMgrObj.add('._submitSignup');
            var promise = hs.util.checkPasswordStrength($('._passwordField').val(), 'OldFreeSignup');
            promise.then(function () {
                $signupForm.submit();
            }, function () {
                $signupForm.submit();
            });
        } else {
            if ($('._inlineErrorbubble').offset().top < $(window).scrollTop()) {
                $('html, body').animate({scrollTop: $('._sidebar').offset().top}, 500);
            }
        }
    });

    $signupForm.on('submit', function () {
        if (hs.util.validatePassword($('._passwordField'))) {
            hs.throbberMgrObj.add('._submitSignup');
            return true;
        } else {
            return false;
        }
    });

    var fnSawSignupForm = function () {
        callback();
    };

    for (var i = 0; i < selectors.length; i++) {
        signupForm.on('focus', selectors[i], fnSawSignupForm);
    }
};

member.notificationPopup = (function () {
    var openPopup = function () {
        this.$el.show();
    };
    var closePopup = function () {
        this.$el.hide();
    };
    var fire = function () {
        hs.reloadBrowser();
    };

    var title = translation._("Hootsuite has been updated!");
    var content = translation._("Refresh your browser window or click the button below to reload and update your dashboard to the latest version.");
    var button = translation._("Reload Dashboard");
    var template = '<div class="content rb-a-2"><button class="closePop _close icon-19 close">X</button> ' +
        '<h4>' + title + '</h4> <p>' + content + '</p><button class="_reloadDashboardBtn btn-lite-sta" title="' + button + '">' + button + '</button> </div>';

    return {
        init: function () {
            var self = this;
            this.$container = $('._dashboardAlerts');
            this.$anchor = $('._showNotificationPopup');
            this.$container.show();
            hs.bubblePopup.close();     // close all before showing
            hs.bubblePopup.openVertical(this.$container, null, null, null, {
                autoclose: false,
                width: 240
            });
            hs.bubblePopup.setContent($(template));

            this.$el = hs.bubblePopup.getCurrentPopup();
            this.$tip = $('.tip', this.$el);
            this.$el
                .find('._close').bind('click', function () {
                    closePopup.call(self);
                    return false;
                }).end()
                .find('._reloadDashboardBtn').bind('click', fire).end();
            this.$anchor.show()
                .bind('click', function () {
                    openPopup.call(self);
                })
                .click();

            _.defer(function () {
                //adjust the position of the pop to have padding to the right.
                self.$el.css('margin-right', 10);
                self.$tip.css('margin-left', parseInt(self.$tip.css('margin-left')) + 10);
            });
        }
    };
})();

member.pingServer = function (sleepyOwlClosed) {
    if (typeof sleepyOwlClosed == "undefined") {
        sleepyOwlClosed = false;
    }
    ajaxCall({
        type: 'GET',
        url: "/ajax/member/ping",
        data: {sleepyOwl: sleepyOwlClosed},
        success: function (data) {
            if (data && data.isForce && hs.c.jsver && data.jsver != hs.c.jsver) {
                member.notificationPopup.init();
            }
        }
    }, 'qmNoAbort');

};

/**
 * @param {string} name
 * @param {object} additionalData (optional)
 */
member.logNewUserEvent = function (name, additionalData) {
    var data = {
        name: name
    };

    if (typeof additionalData === 'object') {
        _.extend(data, additionalData);
    }

    ajaxCall({
        type: 'POST',
        url: "/ajax/log/log-new-user-event",
        data: data
    }, 'qmNoAbort');
};

window.member = member;

export default member;


