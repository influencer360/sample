import nestAjax from 'hs-nest/lib/utils/ajax';
nestAjax.ajaxCallSetup({
    urlRoot: hs.util.getUrlRoot(),
    csrfToken: hs.csrfToken,
    ajaxTimeout: hs.c.ajaxTimeout
});

window.ajaxCall = nestAjax.ajaxCall;
