import _ from 'underscore';

// taken out from login.js for re-use
/** @namespace */
hs.recaptcha = {};

hs.recaptcha.onLoad = function () {
    window.grecaptcha.render('recaptchaWidgetV2', { 'sitekey': hs.reCaptchaV2PublicKey });
    $('.recaptchaWidgetLoading').remove();
};

hs.recaptcha.init = function (login) {
    if ($('#recaptchaWidget').length) {
        var recaptchaCallbackScript = document.createElement('script');
        recaptchaCallbackScript.innerHTML = "var recaptchaCallback = hs.recaptcha.onLoad;";
        recaptchaCallbackScript.defer = true;
        document.body.appendChild(recaptchaCallbackScript);

        var recaptchaScript = document.createElement('script');
        recaptchaScript.src = "https://www.google.com/recaptcha/api.js?onload=recaptchaCallback&render=explicit";
        recaptchaScript.defer = true;
        document.body.appendChild(recaptchaScript);
    }

    $('._recaptchaReload').click(function (e) {
        e.preventDefault();
        var target = this;
        _.debounce(function () {
            window.Recaptcha.reload();
            if (typeof login !== 'undefined') {
                login.setSubmitBtnEnabled(false, target);
            }
        }, 100)();
    });

    $('._recaptchaSwitchType').click(function (e) {
        e.preventDefault();
        window.Recaptcha.switch_type($(this).data('type'));
    });

    $('._recaptchaShowHelp').click(function (e) {
        e.preventDefault();
        window.Recaptcha.showhelp();
    });
};
