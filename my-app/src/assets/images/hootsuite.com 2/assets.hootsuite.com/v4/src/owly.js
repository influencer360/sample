import $ from 'jquery';

var owly = {};

owly.shortenUrl = function (url, source, callback) {
    var urls = [];
    if (typeof url === 'string') {
        urls.push(url);
    } else if ($.isArray(url)) {
        urls = url;
    }

    if (!urls.length || !$.isFunction(callback)) {
        return;
    }

    var data = "url=" + encodeURIComponent(urls.join(' ')); // space as delimiter

    if (source === "messageBox") {
        data += "&source=messageBox";
    }

    ajaxCall({
        url: '/ajax/scheduler/shorten-url',
        type: 'POST',
        data: data,
        success: callback
    }, 'q1');
};

window.owly = owly;

export default owly;

