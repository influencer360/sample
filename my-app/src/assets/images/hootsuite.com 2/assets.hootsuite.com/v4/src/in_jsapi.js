import $ from 'jquery';
import _ from 'underscore';
import owly from 'owly';
import trackerDataLab from 'utils/tracker-datalab';
import hsEjs from 'utils/hs_ejs';
import translation from 'utils/translation';
import loggerService from 'appdirectory/logger-service';
import { urlRegex } from 'utils/string';

// internal calls to work with the JS Api
// @TODO: comment out this code and don't uncomment until an APP box is added

var jsapi = {};

jsapi.apps = {};
jsapi.lastAuthRequest = {};
jsapi.authRequestTries = {};
jsapi.appSelectorList = {};

// some helpers to proxy communication back to the app
var fnFormatUrl = function (receiverUrl, action, p1, p2, apiKey, pid) {
        // return the hash url
        return receiverUrl + '#?' + 'action=' + encodeURIComponent(action) + '&p1=' + encodeURIComponent(p1) + '&p2=' + encodeURIComponent(p2) + '&key=' + encodeURIComponent(apiKey) + '&pid=' + encodeURIComponent(pid);
    },
    fnMakeCallToApp = function (apiKey, pid, action, p1, p2, forceNewIframe) {
        if (!apiKey || !jsapi || !jsapi.apps || !jsapi.apps[apiKey] || !jsapi.apps[apiKey][pid]) {
            return;
        }

        var framename = apiKey + '_' + pid + '_proxy',
            f = document.getElementById(framename),
            receiverUrl = jsapi.apps[apiKey][pid].receiverUrl;
        // for some browsers we may have to kill the iframe from time to time
        // @TODO: randomly force new iframe?
        if (f && forceNewIframe) {
            document.body.removeChild(f);
            f = null;
        }

        if (!f || (f && f.src.indexOf(receiverUrl) < 0)) {
            // create
            f = document.createElement('iframe');
            f.id = f.name = framename;
            f.style.cssText = 'width: 1px; height: 1px; display: none; position: absolute; top: -999;';
            document.body.appendChild(f);
        }
        f.src = fnFormatUrl(receiverUrl, action, p1, p2, apiKey, pid);

        // log the event
        loggerService.logAjaxEvent({
            pid: pid,
            userAction: action
        });
    };


/***
 * Incoming actions (called from dc_receiver.html)
 */

jsapi.newActionTweet = function (text, params) {
    var fnCallback = function (text, scheduleTimestamp, twitterReplyToId) {
            window.newActionTweet(null, text, twitterReplyToId, null, null, scheduleTimestamp);
        },
        scheduleTimestamp = (params && params.scheduleTimestamp) || null,
        twitterReplyToId = (params && params.twitterReplyToId) || null;

    var urls = [];
    if ('shortenLinks' in params && (params.shortenLinks === 1 || params.shortenLinks === true || params.shortenLinks === 'true')) {
        // parse links
        urlRegex.lastIndex = 0;

        var match = urlRegex.exec(text);
        while (match) {
            urls.push(match[0]);
            match = urlRegex.exec(text);
        }
        urlRegex.lastIndex = 0;
    }

    urls = _.uniq(urls);

    if (urls.length !== 0) {
        // create callback
        var fnShortenCallback = function (data) {
            if (data && data.output && data.output.results) {
                $.each(data.output.results, function (i, urlData) {
                    var sourceURL = urls[i];
                    sourceURL = sourceURL.replace(/\./g, '\\.').replace(/\?/g, '\\?');
                    var re = new RegExp(sourceURL, 'ig');
                    var shortUrl;
                    shortUrl = urlData.shortUrl;
                    if (data.shortenerType == 'OWLY') {		//if owly type then use default shortener domain instead for case where user has vanity url
                        shortUrl = data.defaultUrlShortener + '/' + urlData.hash;
                    }
                    text = text.replace(re, shortUrl);
                });
            }
            fnCallback(text, scheduleTimestamp);
        };
        // call owly.shortenUrl
        owly.shortenUrl(urls, null, fnShortenCallback);
    } else {
        fnCallback(text, scheduleTimestamp, twitterReplyToId);
    }
};


jsapi.showTrends = function () {
    dashboard.quickSearch.showTrendingTopics();
};

jsapi.initApp = function (apiKey, pid, receiverUrl, r) {
    // store apiKey & recevierURL in a dictionary on the dom
    // (the iframe should already have name/id of the apiKey)
    jsapi.apps[apiKey] = jsapi.apps[apiKey] || {};
    jsapi.apps[apiKey][pid] = {"receiverUrl": receiverUrl};

    r && fnMakeCallToApp(apiKey, pid, 'trigger_phonehome', r, null, true);	// force new iframe for phone home

};

jsapi.callingBack = function (apiKey, pid) {
    fnMakeCallToApp(apiKey, pid, 'trigger_callingback', 'success');

};

jsapi.getTwitterAccounts = function (apiKey, pid) {
    var t = [];
    $.each(hs.socialNetworksKeyedByType['TWITTER'], function (i, v) {
        t.push(v.username);
    });
    fnMakeCallToApp(apiKey, pid, 'trigger_gettwitteraccounts', t.join());
};

jsapi.customUserInfo = function (dataStr) {
    if (!dataStr) {
        return;
    }

    var data = null;

    try {
        data = JSON.parse(dataStr);
    } catch (err) {
        // Do nothing
    }

    if (!data) {
        return;
    }

    // modify to take title/image/text, then extras
    // but keep existing fields
    data.url = data.url || null;
    data.title = data.title || (data.fullName ? data.fullName : '') + ' ' + (data.screenName ? '(' + data.screenName + ')' : '');
    data.image = data.image || data.avatar;
    data.text = data.text || data.bio;

    trackerDataLab.trackCustom('web.dashboard.stream', 'user_profile_opened', {profileType: 'Twitter'});

    var boxTitle = data.title || translation._("App popup"),
        html = hsEjs.getEjs('dashboard/userinfopopup').render(data),
        params = {
            height: 'auto',
            width: 528,
            title: boxTitle,
            modal: false,
            draggable: true,
            closeOnEscape: true,
            content: html
        };
    $.dialogFactory.create('twitterUserInfoPopup', params);
};

jsapi.showCustomPopup = function (parameterEnumString, apiKey, pid) {
    if (!parameterEnumString) {
        return;
    }

    var parameterEnum = JSON.parse(parameterEnumString);

    if (!parameterEnum.url) {
        return;
    }

    var title = (parameterEnum.title) ? parameterEnum.title : translation._("App popup");

    var w = parseInt(parameterEnum.w, 10),
        h = parseInt(parameterEnum.h, 10);

    var box_w,
        box_h,
        max_w = 900,
        max_h = 500,
        min_w = 300,
        min_h = 225,
        default_w = 640,
        default_h = 445,
        p_width = 30, // side padding and border of ui-dialog-content
        p_height = 56; // outer height of the dialog title and padding from the bottom of ui-dialog-content

    if (!h) {
        h = default_h;
    } else if (h < min_h) {
        h = min_h;
    } else if (h > max_h) {
        h = max_h;
    }

    if (!w) {
        w = default_w;
    } else if (w < min_w) {
        w = min_w;
    } else if (w > max_w) {
        w = max_w;
    }

    box_w = w + p_width;
    box_h = h + p_height;

    // needs sanitization
    var $iframe = $('<iframe  scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:' + w + 'px; height:' + h + 'px; background-color: #fff;" allowTransparency="true"></iframe>');
    $iframe.attr('src', parameterEnum.url);

    trackerDataLab.trackCustom('web.dashboard.stream', 'user_profile_opened', {profileType: 'App'});

    var params = {
            height: box_h,//480
            width: box_w,//600
            title: title,
            modal: true,
            draggable: true,
            closeOnEscape: true,
            content: $iframe,
            close: function () {
                jsapi.closePopUp(apiKey, pid);
            }
        };
    $.dialogFactory.create('appCustomPopup_' + apiKey + '_' + pid, params);
};

jsapi.closeCustomPopup = function (apiKey, pid) {
    $('#' + 'appCustomPopup_' + apiKey + '_' + pid).remove();
};

jsapi.showImagePreview = function (src, externalUrl) {
    var data = {
        type: 'image',
        imgSrc: src,
        clickUrl: externalUrl
    };
    stream.stream.showPreviewPopup(data);
};

jsapi.reloadApp = function (apiKey, pid) {
    var id = apiKey + '_' + pid;
    var $frame = $('#' + id);
    var url = $frame.attr('baseurl');
    jsapi.setAppUrl(apiKey, pid, url);
};

jsapi.updatePlacementSubtitle = function (str, apiKey, pid) {
    var id = apiKey + '_' + pid,
        $box = $('#' + id).closest('._box'),
        maxLength = 35;
    str = str || '';
    str = window.truncate(str, maxLength);
    $box.find('._header .subTitle').text(str);		// @TODO: do we wrap the text with parenthesis?
};

/***
 * Outgoing actions (called from dashboard)
 */
/*
 jsapi.sendMessage = function(apiKey, pid, text, scheduleTimestamp) {
 //var scheduleTimestamp = (params && params.scheduleTimestamp) || '';
 fnMakeCallToApp(apiKey, pid, 'trigger_messagesend', text, scheduleTimestamp);
 };
 */
jsapi.refresh = function (apiKey, pid) {
    fnMakeCallToApp(apiKey, pid, 'trigger_refresh');
};
jsapi.dropUser = function (apiKey, pid, username, postId) {
    fnMakeCallToApp(apiKey, pid, 'trigger_dropuser', username, postId);
};

jsapi.closePopUp = function (apiKey, pid) {
    fnMakeCallToApp(apiKey, pid, 'trigger_closepopup');
};

jsapi.sendToApp = function (apiKey, pid, message) {
    fnMakeCallToApp(apiKey, pid, 'trigger_sendtoapp', message);
};
jsapi.sendProfileToApp = function (apiKey, pid, profile) {
    fnMakeCallToApp(apiKey, pid, 'trigger_sendprofiletoapp', profile);
};
jsapi.sendAssignmentUpdates = function (apiKey, pid, updates) {
    fnMakeCallToApp(apiKey, pid, 'trigger_sendassignmentupdates', updates);
};

/***
 * Private functions used only by dashboard
 */
jsapi.setAppUrl = function (apiKey, pid, url) {
    if (!apiKey || !pid || !url || url == 'null') {
        return;
    }

    var requestMethod = 'post';
    if (hs.isFeatureEnabled('APP_STREAM_GET')) {
        requestMethod = 'get';
    }

    var $form = $('<form>').attr({
        action: url,
        method: requestMethod,
        target: apiKey + '_' + pid
    }).appendTo('body');
    _.defer(function () {
        $form.submit().remove();
    });
};

window.jsapi = jsapi;

export default jsapi;

