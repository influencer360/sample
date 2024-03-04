import { getVideoMetadata } from 'fe-pnc-lib-api'

import $ from 'jquery';
import _ from 'underscore';
import statusObj from 'utils/status_bar';
import owly from 'owly';
import util from 'utils/util';
import hootbus from 'utils/hootbus';
import events from 'hs-events';
import loggerService from 'appdirectory/logger-service';
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise';
import { types as SocialNetworkTypes } from 'hs-nest/lib/constants/social-networks';
import darklaunch from 'utils/darklaunch';
import translation from 'utils/translation';
import hsEjs from 'utils/hs_ejs';
import jsapi from 'in_jsapi';
import { urlRegex } from 'utils/string';
import streamsFlux from 'hs-app-streams/lib/stores/flux';
import { MESSAGE_ACTION } from 'hs-app-streams/lib/actions/types';
import renderTwitterNewStyleReplies from 'components/publisher/render-twitter-new-style-replies';
import commentMenuOptionTemplate from '../templates/stream/app-comment-menu-option.ejs'
import appPostMenuOptionTemplate from '../templates/stream/app-post-menu-option.ejs'

var appapi = {};
appapi.memberAppStreams = {};
appapi.allowedOrigins = [];
appapi.deniedOrigins = [];
appapi.getMemberAppStreamsPromise = null;
appapi.getAllowedOriginsPromise = null;
appapi.waitingForPromises = false; //this is the flag to check if there are any waiting promises

const CONTENT_SOURCE_APP = 'CONTENT_SOURCE_APP';
const HOOTBUS_EVENT_OPEN_COMPOSER = 'composer.open';
const HOOTBUS_EVENT_COMPOSER_ATTACH_FILE = 'composer.attachFile';

const isComposerOpen = function () {
    return !!document.querySelector('.vk-ComposerModal');
};

//TODO wire up in the event bus
//This function is called every time an app component is added or removed
appapi.updateMemberAppStreamsList = function () {
    appapi.memberAppStreams = appapi.memberAppStreams || [];
    _.each(appapi.memberAppStreams, function (memberAppStream, key) {
        if (memberAppStream.type === "STREAM") {
            memberAppStream.initialized = false;
            appapi.memberAppStreams[key] = memberAppStream;
        }
    });
};

appapi.getMemberAppStreams = function () {
    return ajaxCall({
        url: "/ajax/appdirectory/get-member-app-streams",
        success: function (data) {
            _.each(data.result, function (result, pid) {
                if (!_.has(appapi.memberAppStreams, pid)) {
                    result.bindings = [];
                    appapi.memberAppStreams[pid] = result;
                }
            });
        },
    }, 'q1NoAbort');

};

appapi.getAllowedOrigins = function () {
    return ajaxCall({
        url: "/ajax/appdirectory/get-member-allowed-origins",
        success: function (data) {
            appapi.allowedOrigins = data.result;
        },

    }, 'q1NoAbort');
};

appapi.messageListener = function (event) {

    if (appapi.deniedOrigins.indexOf(event.origin) > -1) {
        //Silently return if the event is coming from a denied origin
        return;
    } else if (appapi.authenticate(event)) {
        appapi.eventDispatcher(event);
    } else {
        if (!appapi.waitingForPromises) {
            appapi.waitingForPromises = true;
            appapi.getMemberAppStreamsPromise = appapi.getMemberAppStreams();
            appapi.getAllowedOriginsPromise = appapi.getAllowedOrigins();
        }

        $.when(appapi.getMemberAppStreamsPromise, appapi.getAllowedOriginsPromise).done(function () {
            appapi.waitingForPromises = false;
            if (appapi.authenticate(event)) {
                appapi.eventDispatcher(event);
            } else {
                //Add to denied origin so we don't have to authenticate it again
                if (appapi.allowedOrigins.indexOf(event.origin) < 0) {
                    appapi.deniedOrigins.push(event.origin);
                }
            }
        });
    }
};

appapi.eventParser = function (event) {

    var msgObj = event.data;
    if (typeof msgObj == 'string') {
        try {
            msgObj = JSON.parse(msgObj);
        } catch (e) {
            util.recordAction('badJSONStringFromApp', {value: event.origin + ' : ' + event.data});
            return false;
        }
    }

    var windowName = msgObj.windowName;

    if (typeof windowName === 'undefined') {
        return false;
    }
    var windowNameComponents = windowName.split('_');

    if (windowNameComponents.length == 2) {
        msgObj.pid = windowNameComponents[1];
    } else if (windowNameComponents.length == 3) {
        msgObj.pid = windowNameComponents[1];
        msgObj.view = windowNameComponents[2];
    }


    return msgObj;

};

appapi.authenticate = function (event) {
    if (appapi.allowedOrigins.indexOf(event.origin) < 0) {
        //send app some responses
        //appapi.dashboardFunc.respond(pid, 'say something');
        return false;
    }

    // Only parse the event after authenticating its origin
    var msgObj = appapi.eventParser(event);
    if (msgObj === false) {
        return false;
    }

    var pid = msgObj.pid;

    if (!_.has(appapi.memberAppStreams, pid)) {
        //send app some responses
        //appapi.dashboardFunc.respond(pid, 'say something');
        return false;
    }
    return true;
};


//
// Handles calls from App to Dashboard
//
appapi.eventDispatcher = function (event) {
    var msgObj = appapi.eventParser(event);
    if (msgObj === false || typeof msgObj.pid === 'undefined') {
        return;
    }
    var params = typeof msgObj.params === 'object' ? msgObj.params : {};

    switch (msgObj.action) {
        case 'bind':
            var msgEvent = msgObj.event ? msgObj.event : params.event;
            appapi.dashboardFunc.bind(msgObj.pid, msgEvent);
            break;
        case 'publish':
            appapi.dashboardFunc.publish(msgObj);
            break;
        case 'initApp':
            appapi.dashboardFunc.initApp(msgObj);
            appapi.callBackFunc.initApp(msgObj, event.origin);
            break;
        case 'compose':
            appapi.dashboardFunc.compose(msgObj.pid, msgObj.p1, msgObj.p2);
            break;
        case 'attachfiletomessage':
            appapi.dashboardFunc.attachfiletomessage(msgObj.pid, msgObj.p1);
            break;
        case 'retweet':
            appapi.dashboardFunc.retweet(msgObj.p1, msgObj.p2);
            break;
        case 'userinfo':
            appapi.dashboardFunc.userinfo(msgObj.p1);
            break;
        case 'statusmsg':
            appapi.dashboardFunc.statusmsg(msgObj.pid, msgObj.p1, msgObj.p2);
            break;
        case 'statusmsgclear':
            appapi.dashboardFunc.statusmsgclear();
            break;
        case 'showfollowdialog':
            appapi.dashboardFunc.showfollowdialog(msgObj.p1, msgObj.p2);
            break;
        case 'customuserinfo':
            appapi.dashboardFunc.customuserinfo(msgObj.p1);
            break;
        case 'showimagepreview':
            appapi.dashboardFunc.showimagepreview(msgObj.p1, msgObj.p2);
            break;
        case 'updateplacementsubtitle':
            appapi.dashboardFunc.updateplacementsubtitle(msgObj.pid, msgObj.p1);
            break;
        case 'showCustomPopup':
            appapi.dashboardFunc.showCustomPopup(msgObj, event);
            break;
        case 'closeCustomPopup':
            appapi.dashboardFunc.closeCustomPopup(msgObj, params);
            break;
        case 'gettwitteraccounts':
            appapi.dashboardFunc.gettwitteraccounts(msgObj.pid, undefined);
            break;
        case 'getAuth':
            appapi.dashboardFunc.getAuth(msgObj.pid);
            break;
        case 'getmemberinfo':
            appapi.dashboardFunc.getMemberInfo(msgObj.pid);
            break;
        case 'savedata':
            appapi.dashboardFunc.saveData(msgObj.pid, msgObj.p1);
            break;
        case 'getdata':
            appapi.dashboardFunc.getData(msgObj.pid);
            break;
        case 'trigger':
            break;

        //SDK 3.0 (Content Library SDK) Endpoints
        case 'init':
        case 'contentsource_init':
            appapi.dashboardFunc.initApp(msgObj);
            appapi.callBackFunc.initApp(msgObj, event.origin);
            if (hs.isFeatureEnabled('APP_2_APP_HACKATHON')) {
                var appComponentList = appapi.dashboardFunc.getCurrentAppComponentList();
                _.each(appapi.memberAppStreams, function (memberAppComponent, pid) {
                    if (memberAppComponent.bindings.indexOf('app-component-list') > -1) {
                        appapi.messageSender(pid, 'app-component-list', [appComponentList]);
                    }
                });
            }
            break;
        case 'custom_popup_open':
        case 'contentsource_custom_popup_open':
            appapi.dashboardFunc.showCustomPopup(msgObj, event);
            break;
        case 'custom_popup_close':
        case 'contentsource_custom_popup_close':
            appapi.dashboardFunc.closeCustomPopup(msgObj, params);
            break;
        case 'attach_file':
        case 'contentsource_attach_file':
            appapi.dashboardFunc.attachfiletomessage(msgObj.pid, params.file);
            break;
        case 'attach_media':
            appapi.dashboardFunc.attachMedia(msgObj.pid, params.media);
            break;
        case 'send_text':
        case 'contentsource_send_text':
            var messageText = typeof params.text === 'string' ? params.text : '';
            var messageParams = typeof params.params === 'object' ? params.params : {};
            appapi.dashboardFunc.compose(msgObj.pid, messageText, messageParams);
            break;
        case 'send_request':
            if (hs.isFeatureEnabled('APP_2_APP_HACKATHON')) {
                appapi.dashboardFunc.sendRequest(msgObj, params.callbackId);
            }
            break;
        case 'show_status_msg':
        case 'contentsource_show_status_msg':
            appapi.dashboardFunc.statusmsg(msgObj.pid, params.message, params.type);
            break;
        case 'clear_status_msg':
        case 'contentsource_clear_status_msg':
            appapi.dashboardFunc.statusmsgclear();
            break;
        case 'contentsource_refresh':
            if (msgObj.view === 'default') {
                appapi.dashboardFunc.loadContentSource(msgObj.pid, 'default');
            } else if (msgObj.view === 'compose') {
                appapi.dashboardFunc.loadContentSource(msgObj.pid, 'compose');
            }
            break;
        case 'save_data':
            appapi.dashboardFunc.saveData(msgObj.pid, params.data, params.callbackId);
            break;
        case 'get_data':
            appapi.dashboardFunc.getData(msgObj.pid, params.callbackId);
            break;
        case 'twitter_retweet':
            appapi.dashboardFunc.retweet(params.data.id, params.data.screen_name);
            break;
        case 'show_user':
            appapi.dashboardFunc.userinfo(params.data.twitter_handle);
            break;
        case 'show_follow_dialog':
            appapi.dashboardFunc.showfollowdialog(params.data.twitter_handle, params.data.is_follow);
            break;
        case 'custom_user_info':
            appapi.dashboardFunc.customuserinfo(params.data);
            break;

        case 'show_image_preview':
            appapi.dashboardFunc.showimagepreview(params.data.src, params.data.external_url);
            break;
        case 'update_placement_subtitle':
            appapi.dashboardFunc.updateplacementsubtitle(msgObj.pid, params.data.name);
            break;
        case 'get_twitter_accounts':
            appapi.dashboardFunc.gettwitteraccounts(msgObj.pid, params.callbackId);
            break;
        case 'get_auth':
            appapi.dashboardFunc.getAuth(msgObj.pid, params.callbackId);
            break;
        case 'get_member_info':
            appapi.dashboardFunc.getMemberInfo(msgObj.pid, params.callbackId);
            break;
        case 'show_lightbox':
            appapi.dashboardFunc.showLightbox(params.data);
            break;
        case 'send_to_compose': {
            const messageTextV2 = typeof params.text === 'string' ? params.text : '';
            const messageParamsV2 = params.params ? params.params : {};
            appapi.dashboardFunc.sendToCompose(msgObj.pid, messageTextV2, messageParamsV2);
            break;
        }
        case 'attach_file_to_compose':
            appapi.dashboardFunc.attachFileToCompose(msgObj.pid, params.file);
            break;
        case 'attach_media_to_compose':
            appapi.dashboardFunc.attachMediaToCompose(msgObj.pid, params.media);
            break;
        case 'reply':
            appapi.dashboardFunc.reply(params.data.twitterReplyToId);
            break;
        default:
            hs.statusObj.update(translation._("Function not found"), 'error', true);
            return;
    }

    var appStream = appapi.memberAppStreams[msgObj.pid];

    //Set facade version for the memberAppStream if it has not been set yet
    if (typeof appStream.facadeVersion === 'undefined') {
        appapi.memberAppStreams[msgObj.pid]['facadeVersion'] = msgObj.facadeVersion;
    }

    loggerService.logAjaxEvent({
        pid: msgObj.pid,
        userAction: msgObj.action.toLowerCase(),
        newSDK: 1,
        appType: appStream.type,
        facadeVersion: msgObj.facadeVersion
    });
};

appapi.dashboardFunc = {};
/**
 * This function is internally used by our automated testing app
 * @param pid
 * @param action
 * @param params
 */
appapi.dashboardFunc.trigger = function (pid, action, params) {
    var apiKey = appapi.memberAppStreams[pid]['apiKey'];
    switch (action) {
        case 'refresh':
            window.appapi.callBackFunc.refresh(pid);
            break;
        case 'dropuser':
            window.appapi.callBackFunc.dropUser(pid, params.user, params.postId);
            break;
        case 'sendtoapp':
            window.appapi.helper.doSendToApp($(params.messageDiv), 'sendtoapp', pid, apiKey, true);
            break;
        case 'sendprofiletoapp':
            window.appapi.helper.doSendToApp($(params.messageDiv), 'sendprofiletoapp', pid, apiKey, true);
            break;
        case 'sendassignmentupdates':
            window.appapi.helper.propagateAssignmentUpdates(params.assignment);
            break;
    }
};


appapi.dashboardFunc.bind = function (pid, event) {
    appapi.memberAppStreams[pid].bindings.push(event);

    if (event === 'sendtoapp' || event === 'sendprofiletoapp') {
        if (appapi.memberAppStreams[pid].type === 'PLUGIN') {
            hootbus.emit('assignmentsManager:app:bindings', {
                event: event,
                pluginId: pid
            });
        }
        appapi.dashboardFunc.registerStreamMenuOptions(pid);
    }

    if (hs.isFeatureEnabled('APP_2_APP_HACKATHON')) {
        if (event === 'app-component-list') {
            var appComponentList = appapi.dashboardFunc.getCurrentAppComponentList();
            appapi.messageSender(pid, 'app-component-list', [appComponentList]);
        }
    }

    return {
        functionCall: 'appapi.memberAppStreams[pid].bindings.push(event)',
        params: {
            pid: pid,
            event: event
        }
    };

};


appapi.dashboardFunc.getCurrentAppComponentList = function () {
    if (hs.isFeatureEnabled('APP_2_APP_HACKATHON')) {
        var appComponentList = [];
        _.each(appapi.memberAppStreams, function (memberAppComponent) {
            if (memberAppComponent.initialized) {
                var appComponent = {};
                appComponent.componentId = memberAppComponent.componentId;
                appComponent.componentTitle = memberAppComponent.title;
                appComponent.componentType = memberAppComponent.type;
                appComponent.appId = memberAppComponent.appId;
                appComponent.appName = memberAppComponent.appName;
                appComponent.requestEventBinding = memberAppComponent.bindings.indexOf('request') > -1;
                appComponentList.push(appComponent);
            }
        });
        return appComponentList;
    }
};

appapi.dashboardFunc.registerStreamMenuOptions = function (pid) {
    var ma = appapi.memberAppStreams[pid];

    if (!ma.fluxAction) {
        var icon;
        if (_.isString(ma.icon)) {
            icon = {
                sourceUrl: ma.icon
            };
        } else {
            icon = {
                sourceKey: 'hs-app-dir'
            };
        }

        var item = {
            propsAdapter: function () {
                var menuText = translation._('Send to') + ' ' + ma.title;
                return {
                    onPrimaryClick: function (message, context) {
                        appapi.helper.doSendToAppWithMessageObj(pid, message, context);
                    },
                    name: menuText,
                    icon: icon
                };
            },
            predicate: function (message, context) {
                if (context.socialNetworkType === 'TWITTER') {
                    if (hs.getFeatureValue('DEVP_183_DISABLE_SEND_TO_APPS_LIST')) {
                        var disableSendtoAppIds = hs.getFeatureValue('DEVP_183_DISABLE_SEND_TO_APPS_LIST').split(',');
                        if (disableSendtoAppIds.includes(ma.appId.toString())) {
                            return;
                        }
                    }
                }
                if (context.socialNetworkType === 'LINKEDIN' || context.socialNetworkType === 'LINKEDINCOMPANY') {
                    if (hs.getFeatureValue('DEVP_175_ENABLE_LINKEDIN_SEND_TO_APP_LIST')) {
                        var enabledSendToAppIds = hs.getFeatureValue('DEVP_175_ENABLE_LINKEDIN_SEND_TO_APP_LIST').split(',');
                        if (!enabledSendToAppIds.includes(ma.appId.toString())) {
                            return;
                        }
                    }
                }
                if (context.socialNetworkType === 'TIKTOKBUSINESS') {
                    return false;
                }
                if (_.isArray(ma.sendToAppDisableList) && context.socialNetworkType) {

                    var snType = context.socialNetworkType.toLowerCase();
                    if (snType === 'youtubechannel') {
                        snType = 'youtube';
                    }
                    return ma.sendToAppDisableList.indexOf(snType) === -1;
                } else {
                    return true;
                }
            }
        };
        appapi.memberAppStreams[pid]['fluxAction'] = streamsFlux.getActions(MESSAGE_ACTION).register(1, item);
    }
};

appapi.dashboardFunc.initApp = function (msg) {
    var params = typeof msg.params === 'object' ? msg.params : {};
    appapi.memberAppStreams[msg.pid]['sendToAppDisableList'] = msg.sendToAppDisableList ? msg.sendToAppDisableList : params.sendToAppDisableList;
    appapi.memberAppStreams[msg.pid]['sendProfileToAppDisableList'] = msg.sendProfileToAppDisableList ? msg.sendProfileToAppDisableList : params.sendProfileToAppDisableList;

};

appapi.dashboardFunc.sendRequest = function (msgObj, callbackId) {
    if (hs.isFeatureEnabled('APP_2_APP_HACKATHON')) {
        var senderAppComponent = appapi.memberAppStreams[msgObj.pid];

        //Determine if the sender has permission to send the request
        var senderAppComponentId = senderAppComponent.componentId;
        var senderList = hs.getFeatureValue('APP_2_APP_HACKATHON_SENDER_LIST');
        var allowedSenderComponentIds = senderList.split(",");
        var isSenderAllowed = false;
        _.each(allowedSenderComponentIds, function (allowedSenderComponentId) {
            if ($.trim(allowedSenderComponentId) == senderAppComponentId) {
                isSenderAllowed = true;
            }
        });

        if (!isSenderAllowed) {
            return;
        }

        //Determine if the receiver has permission to receive the request
        var receiverComponentId = msgObj.params.componentId;
        var receiverList = hs.getFeatureValue('APP_2_APP_HACKATHON_RECEIVER_LIST');
        var allowedReceiverComponentIds = receiverList.split(",");
        var isReceiverAllowed = false;
        _.each(allowedReceiverComponentIds, function (allowedReceiverComponentId) {
            if ($.trim(allowedReceiverComponentId) == receiverComponentId) {
                isReceiverAllowed = true;
            }
        });

        if (!isReceiverAllowed) {
            return;
        }

        var sender = {
            componentId: senderAppComponentId
        };

        var componentAvailable = false;
        _.each(appapi.memberAppStreams, function (appComponent, pid) {
            if (appComponent.componentId == receiverComponentId && appComponent.initialized) {
                var params = [{
                    request: msgObj.params,
                    sender: sender
                }];
                appapi.messageSender(pid, 'request', params);
                componentAvailable = true;
            }
        });

        if (!componentAvailable) {
            appapi.callbackSender(msgObj.pid, callbackId, [{
                errorCode: 100,
                message: 'This request cannot be sent, the receiver component cannot be found on the dashboard'
            }]);
        }
    }
};

appapi.dashboardFunc.loadContentPromotion = function (appId) {
    var data = {
        appId: appId
    };

    ajaxCall({
        type: 'GET',
        url: '/ajax/appdirectory/install-and-load-content-promotion-url',
        data: data
    }, 'q1NoAbort')
        .done(function (data) {
            $('#publisherContent').html('<iframe src="' + data.url + '" name="contentpromotion_' + data.pid + '_default" width="100%" height="100%" frameBorder="0"></iframe>');
        })
        .fail(function (jqXHR) {
            hs.statusObj.update(JSON.parse(jqXHR.responseText).error, 'error', true);
        });
};

appapi.dashboardFunc.loadContentSource = function (pid, view) {
    var data = {
        componentid: pid,
        view: view
    };

    ajaxCall({
        type: 'GET',
        url: '/ajax/appdirectory/load-content-source-url',
        data: data
    }, 'q1NoAbort')
        .done(function (data) {

            if (view === 'default') {
                $('#publisherContent').html('<iframe src="' + data.url + '" name="contentsource_' + data.pid + '_default" width="100%" height="100%" frameBorder="0"></iframe>');
            } else if (view === 'compose') {
                $('._contentSourceContent').html('<iframe src="' + data.url + '" name="contentsource_' + data.pid + '_compose" width="100%" height="250px" frameBorder="0"></iframe>');
            }
        })
        .fail(function (jqXHR) {
            hs.statusObj.update(JSON.parse(jqXHR.responseText).error, 'error', true);
        });
};

appapi.dashboardFunc.showLightbox = function (data) {
    hootbus.emit('message:renderLightbox', {
        imgArray: [appapi.helper.sanitizeURL(data.src)],
        displayImg: 0
    });
};


appapi.dashboardFunc.compose = function (pid, text, params) {

    var fnCallback = function (text, scheduleTimestamp, twitterReplyToId) {
        window.newActionTweet(null, text, twitterReplyToId, null, null, scheduleTimestamp, undefined, undefined, SocialNetworkTypes.APPDIR);
    };
    var scheduleTimestamp = (params && params.scheduleTimestamp) || null;
    var twitterReplyToId = (params && params.twitterReplyToId) || null;

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
                    var shortUrl = urlData.shortUrl;
                    text = text.replace(re, shortUrl);
                });
            }
            fnCallback(text, scheduleTimestamp, twitterReplyToId);
        };
        // call owly.shortenUrl
        owly.shortenUrl(urls, null, fnShortenCallback);
    } else {
        fnCallback(text, scheduleTimestamp, twitterReplyToId);
    }
};

appapi.dashboardFunc.sendToCompose = function (pid, text, params) {
    var messageData = {
        messageText: text
    };

    if (params && params.scheduleTimestamp) {
        const scheduleTimestamp = parseInt(params.scheduleTimestamp);
        messageData["scheduleTimestamp"] = isNaN(scheduleTimestamp) ? null : scheduleTimestamp;
    }

    hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, messageData);
}

appapi.dashboardFunc.attachFileToCompose = function (pid, file) {
    hs.statusObj.update(translation._('Attaching file...'), 'info', true);

    ajaxCall({
        url: '/ajax/appdirectory/upload',
        data: {
            url: file.url,
            name: file.name,
            extension: file.extension,
            pid: pid,
            timestamp: file.timestamp,
            token: file.token
        },
        type: 'POST'
    }, 'qm')
    .done(function (data) {
        const attachment = {
            fileName: file.name,
            mimeType: data.mimeType,
            url: data.url,
            thumbnailUrl: data.thumbnailUrl,
            source: CONTENT_SOURCE_APP,
        };

        // The upload endpoint is shared between old + new compose,
        // so we reject docs here before sending to new compose where they aren't supported
        // TODO: Remove if adding doc support
        if (data.type === 'doc') {
            hs.statusObj.update(translation._('The media attached is unsupported'), 'error', true);
            return;
        }

        if (isComposerOpen()) {
            hootbus.emit(HOOTBUS_EVENT_COMPOSER_ATTACH_FILE, attachment)
        } else {
            hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, { attachments: [attachment] });
        }

        hs.statusObj.update(translation._('File attached.'), 'success', true);
    }).fail(function (jqXHR) {
        hs.statusObj.update(JSON.parse(jqXHR.responseText).error, 'error', true);
    });
};

appapi.dashboardFunc.attachMediaToCompose = function (pid, media) {
hs.statusObj.update(translation._('Attaching file...'), 'info', true);
ajaxCall({
    url: '/ajax/appdirectory/attach-media',
    data: {
        mediaId: media.mediaId,
        pid: pid,
        token: media.token,
        timestamp: media.timestamp
    },
    type: 'POST'
}, 'qm')
    .done(function (data) {
        // Verify that metadata and thumbnails exist in S3
        $.ajax({
            url: '/ajax/scheduler/verify-video-thumbnail-and-metadata-exist',
            type: 'GET',
            data: {
                videoUrl: data.url,
            },
            error: function () {
                var errorText = translation._('Error verifying video');
                hs.statusObj.update(translation._(errorText), 'error', true);
            },
            success: function (verifyData) {
                if (verifyData.exists === true) {
                    let attachment = {
                        source: CONTENT_SOURCE_APP,
                        mimeType: data.mimeType,
                    };

                    // Get video metadata from MPS
                    getVideoMetadata({ s3Id: media.mediaId })
                        .then(metaData => {
                            attachment = {
                                ...attachment,
                                ...metaData,
                                thumbnailUrl: metaData.thumbnailUrls[0].thumbnailUrl,
                            };

                            if (isComposerOpen()) {
                                hootbus.emit(HOOTBUS_EVENT_COMPOSER_ATTACH_FILE, attachment)
                            } else {
                                hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, { attachments: [attachment] });
                            }

                            hs.statusObj.update(translation._('File attached.'), 'success', true);
                        })
                } else {
                    hs.statusObj.update(translation._('Media upload has not been successfully processed. Please try again later'), 'error', true);
                }
            }
        });
    })
    .fail(function (jqXHR) {
        hs.statusObj.update(JSON.parse(jqXHR.responseText).error, 'error', true);
    });
};

appapi.dashboardFunc.attachMedia = function (pid, media) {
    hs.statusObj.update(translation._('Attaching file...'), 'info', true);
    ajaxCall({
        url: '/ajax/appdirectory/attach-media',
        data: {
            mediaId: media.mediaId,
            pid: pid,
            token: media.token,
            timestamp: media.timestamp
        },
        type: 'POST'
    }, 'qm')
        .done(function (data) {
            var videoAttachment = {
                url: data.url,
                mimeType: data.mimeType
            };

            // Verify that metadata and thumbnails exist in S3
            $.ajax({
                url: '/ajax/scheduler/verify-video-thumbnail-and-metadata-exist',
                type: 'GET',
                data: {
                    videoUrl: data.url,
                },
                error: function () {
                    var errorText = translation._('Error verifying video');
                    hs.statusObj.update(translation._(errorText), 'error', true);
                },
                success: function (verifyData) {
                    if (verifyData.exists === true) {
                        window.newActionTweet(
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            SocialNetworkTypes.APPDIR,
                            {
                                attachments: [videoAttachment],
                                source: CONTENT_SOURCE_APP
                            }
                        );

                        hs.statusObj.update(translation._('File attached.'), 'success', true);
                    } else {
                        hs.statusObj.update(translation._('Media upload has not been successfully processed. Please try again later'), 'error', true);
                    }

                }
            });
        })
        .fail(function (jqXHR) {
            hs.statusObj.update(JSON.parse(jqXHR.responseText).error, 'error', true);
        });
};

appapi.dashboardFunc.attachfiletomessage = function (pid, file) {
    hs.statusObj.update(translation._('Attaching file...'), 'info', true);
    ajaxCall({
        url: '/ajax/appdirectory/upload',
        data: {
            url: file.url,
            name: file.name,
            extension: file.extension,
            pid: pid,
            timestamp: file.timestamp,
            token: file.token
        },
        type: 'POST'
    }, 'qm')
        .done(function (data) {
            var options = {
                source: CONTENT_SOURCE_APP
            };

            if (data.type == 'photo') {
                var attachment = {
                    mimeType: data.mimeType,
                    url: data.url,
                    thumbnailUrl: data.thumbnailUrl
                };

                options.attachment = attachment;

                window.newActionTweet(
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    SocialNetworkTypes.APPDIR,
                    {
                        attachments: [attachment],
                        source: CONTENT_SOURCE_APP
                    }
                );
            } else if (data.type == 'doc') {
                window.newActionTweet(
                    undefined,
                    data.shortUrl,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    SocialNetworkTypes.APPDIR,
                    { source: CONTENT_SOURCE_APP }
                );
            }

            hs.statusObj.update(translation._('File attached.'), 'success', true);
        })

        .fail(function (jqXHR) {
            hs.statusObj.update(JSON.parse(jqXHR.responseText).error, 'error', true);
        });
};

appapi.dashboardFunc.retweet = function (messageId, username) {
    window.stream.twitter.showRetweetPopupApp(messageId, username);
    return {
        functionCall: 'window.stream.twitter.showRetweetPopupApp(messageId, username)',
        params: {
            messageId: messageId,
            username: username
        }
    };
};

appapi.dashboardFunc.reply = function (twitterReplyToId) {
    renderTwitterNewStyleReplies(undefined, twitterReplyToId, "", "", false, "", "");
};

appapi.dashboardFunc.userinfo = function (username) {
    window.stream.network.showUserInfoPopup(username);
    return {
        functionCall: 'window.stream.network.showUserInfoPopup(username)',
        params: {
            username: username
        }
    };
};
appapi.dashboardFunc.statusmsg = function (pid, p1, p2) {
    if (p1.length > 140) {
        p1 = p1.substring(0, 140);
    }
    var type = 'info';
    if (p2.match(/^(success|info|warning|error)$/i)) {
        type = p2.toLowerCase();
    }

    var msg = p1;
    if (type == 'error') {
        var appStream = appapi.memberAppStreams[pid];
        if (typeof appStream != 'undefined') {
            msg = appStream.appName + ' ' + appStream.title + ': ' + p1;

        }
    }
    msg = appapi.helper.sanitizeInput(msg);
    window.hs.statusObj.update(msg, type);

    //For closing New Compose after sending to Amplify
    if (msg == "Success! Sent to Amplify") {
        //Emit event that NC is listening for in full-screen-composer
        hootbus.emit(events.AMPLIFY_SEND_SUCCESS);
    }
    // Clear status message after 3 seconds
    setTimeout(appapi.dashboardFunc.statusmsgclear, 3000);

    return {
        functionCall: 'window.hs.statusObj.update(msg, type)',
        params: {
            msg: msg,
            type: type
        }
    };


};
appapi.dashboardFunc.statusmsgclear = function () {
    window.hs.statusObj.reset();
    return {
        functionCall: 'window.hs.statusObj.reset()',
        params: {}
    };
};
appapi.dashboardFunc.showfollowdialog = function (p1, p2) {
    var isFollow = (p2 === true || p2 === 'true' || p2 === '1') ? 1 : 0;
    var sanitizedTwitterHandle = appapi.helper.sanitizeInput(p1);
    window.toggleFollow(isFollow, sanitizedTwitterHandle);
    return {
        functionCall: 'window.toggleFollow(isFollow, sanitizedTwitterHandle)',
        params: {
            isFollow: isFollow,
            p1: sanitizedTwitterHandle
        }
    };
};
appapi.dashboardFunc.customuserinfo = function (dataStr) {
    if (!dataStr) {
        return;
    }

    var data = null;

    if (typeof dataStr === 'object') {
        data = dataStr;
    } else {
        try {
            data = JSON.parse(dataStr);
        } catch (err) {
            // Do nothing
        }

        if (!data) {
            return;
        }
    }

    // modify to take title/image/text, then extras
    // but keep existing fields
    data.url = data.url || null;
    data.title = appapi.helper.sanitizeInput(data.title || (data.fullName ? data.fullName : '') + ' ' + (data.screenName ? '(' + data.screenName + ')' : ''));
    data.image = data.image || data.avatar;
    data.text = data.text || data.bio;

    var boxTitle = data.title || translation._("App popup");
    var html = hsEjs.getEjs('dashboard/userinfopopup').render(data);
    var params = {
        height: 'auto',
        width: 528,
        title: boxTitle,
        modal: false,
        draggable: true,
        closeOnEscape: true,
        content: html
    };

    $.dialogFactory.create('twitterUserInfoPopup', params);
    return {
        functionCall: '$.dialogFactory.create(name, params)',
        params: {
            name: 'twitterUserInfoPopup',
            params: params
        }
    };
};
appapi.dashboardFunc.showimagepreview = function (src, externalUrl) {
    var data = {
        type: 'image',
        imgSrc: appapi.helper.sanitizeInput(src),
        clickUrl: appapi.helper.sanitizeURL(externalUrl)
    };
    window.stream.stream.showPreviewPopup(data);
    return {
        functionCall: 'window.stream.stream.showPreviewPopup(data)',
        params: {
            data: data
        }
    };
};

appapi.dashboardFunc.updateplacementsubtitle = function (pid, str) {
    var id = appapi.memberAppStreams[pid].apiKey + '_' + pid;
    var $box = $('#' + id).closest('._box');
    str = str || '';
    str = window.truncate(str, 35);
    $box.find('._header .subTitle').text(str);

    return {
        functionCall: '$box.find(\'._header .subTitle\').text(str)',
        params: {
            str: str
        }
    };
};

appapi.dashboardFunc.showCustomPopup = function (msg, event) {
    var pid = msg.pid;
    var url;
    var title;
    var w;
    var h;

    if (msg.p1) {
        var parameterEnum = JSON.parse(msg.p1);
        url = parameterEnum.url;
        title = parameterEnum.title;
        w = parameterEnum.w;
        h = parameterEnum.h;
    } else {
        url = msg.params.url;
        title = msg.params.title;
        w = msg.params.w;
        h = msg.params.h;
    }

    title = appapi.helper.sanitizeInput(title);

    if (!url) {
        return;
    }

    w = parseInt(w, 10);
    h = parseInt(h, 10);

    var box_w,
        box_h,
        max_w = 900,
        max_h = 500,
        min_w = 300,
        min_h = 225,
        default_w = 640,
        default_h = 445,
        p_width = 96, // side padding and border of ui-dialog-content (added modal padding for ui refresh)
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
    var $iframe = $('<iframe scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:' + w + 'px; height:' + h + 'px; background-color: #fff;" allowTransparency="true" allow="geolocation ' + url + '"></iframe>');
    $iframe.attr('src', url);
    $iframe.attr('name', 'appdirectorypopup_' + pid); //So that when popup send event to dashboard with the SDK, we can determine its parent app component pid

    var boxTitle = title;
    var parameters = {
        height: box_h,//480
        width: box_w,//600
        title: boxTitle,
        modal: true,
        draggable: true,
        closeOnEscape: true,
        content: $iframe,
        close: function () {
            appapi.callBackFunc.closepopup(pid);
        }
    };
    var name = 'appCustomPopup_' + appapi.memberAppStreams[pid].apiKey + '_' + pid;
    $.dialogFactory.create(name, parameters);

    appapi.customPopUpStack = appapi.customPopUpStack || [];
    var callbackId = msg.params ? msg.params.callbackId : false;
    var popupDetail = {
        pid: pid,
        from: msg.windowName,
        callbackId: callbackId,
        fromOrigin: event.origin
    };
    appapi.customPopUpStack.push(popupDetail);

    //Massage parameters to send back to the test runner
    delete parameters['close'];
    delete parameters['content'];
    parameters.close = {
        functionCall: 'appapi.callBackFunc.closepopup',
        pid: pid
    };

    return {
        functionCall: '$.dialogFactory.create(name, params)',
        params: {
            name: name,
            parameters: parameters
        }
    };
};
appapi.dashboardFunc.closeCustomPopup = function (msg, params) {

    var pid = msg.pid;
    var popupDetail = appapi.customPopUpStack.pop();

    if (typeof popupDetail !== 'undefined' && popupDetail.callbackId !== false) {
        if (popupDetail.pid !== pid) {
            hs.statusObj.update(translation._('Cannot send callback to the app.'), 'error', true);
            return;
        } else {
            var windowElement = document.getElementsByName(popupDetail.from);
            var targetWindow = windowElement[0].contentWindow;
            var msgObj = {
                callbackId: popupDetail.callbackId,
                params: [params]
            };
            targetWindow.postMessage(msgObj, popupDetail.fromOrigin);
        }
    }

    var id = '#' + 'appCustomPopup_' + appapi.memberAppStreams[pid].apiKey + '_' + pid;
    $(id).remove();

    return {
        functionCall: '$(id).remove()',
        params: {
            id: id
        }
    };

};
appapi.dashboardFunc.gettwitteraccounts = function (pid, callbackId) {
    var t = [];
    $.each(hs.socialNetworksKeyedByType['TWITTER'], function (i, v) {
        t.push(v.userId);
    });

    if (typeof callbackId === 'undefined') {
        appapi.messageSender(pid, 'gettwitteraccounts', [t]);
    } else {
        appapi.callbackSender(pid, callbackId, [t]);
    }
};

appapi.dashboardFunc.getMemberInfo = function (pid, callbackId) {
    if (_.isUndefined(appapi.memberAppStreams[pid]) || _.isUndefined(appapi.memberAppStreams[pid]['appId'])) {
        hs.statusObj.update(translation._('Unable to get app information'), 'error', true);
        return;
    }
    var memberInfo = {};
    ajaxCall({
        url: '/ajax/appdirectory/get-member-info',
        type: 'GET'
    }, 'appdirectoryQm')
        .done(function (data) {
            memberInfo.userId = data.result.userId;
            memberInfo.teamIds = data.result.teamIds;

            if (typeof callbackId === 'undefined') {
                appapi.messageSender(pid, 'getmemberinfo', [memberInfo]);
            } else {
                appapi.callbackSender(pid, callbackId, [memberInfo]);
            }
        })
        .fail(function (jqXHR) {
            hs.statusObj.update(JSON.parse(jqXHR.responseText).error, 'error', true);
        });
};

appapi.dashboardFunc.getAuth = function (pid, callbackId) {
    var auth = {};
    if (_.isUndefined(appapi.memberAppStreams[pid]) || _.isUndefined(appapi.memberAppStreams[pid]['appId'])) {
        hs.statusObj.update(translation._('Unable to get app information'), 'error', true);
        return;
    }
    ajaxCall({
        url: '/ajax/appdirectory/get-auth',
        data: {appId: appapi.memberAppStreams[pid]['appId']},
        type: 'GET'
    }, 'qm')
        .done(function (data) {
            auth.i = data.i;
            auth.ts = data.ts;
            auth.token = data.token;

            if (typeof callbackId === 'undefined') {
                appapi.messageSender(pid, 'getauth', [auth]);
            } else {
                appapi.callbackSender(pid, callbackId, [auth]);
            }
        })
        .fail(function (jqXHR) {
            hs.statusObj.update(JSON.parse(jqXHR.responseText).error, 'error', true);
        });
};

appapi.dashboardFunc.saveData = function (pid, dataToSave, callbackId) {

    ajaxCall({
        url: '/ajax/appdirectory/set-stream-saved-data',
        data: {
            pid: pid,
            data: dataToSave
        },
        type: 'POST'
    }, 'qm')
        .done(function (data) {
            if (typeof callbackId === 'undefined') {
                appapi.messageSender(pid, 'savedata', [data.result]);
            } else {
                appapi.callbackSender(pid, callbackId, [data.result]);
            }
        })
        .fail(function (jqXHR) {
            hs.statusObj.update(JSON.parse(jqXHR.responseText).error, 'error', true);
        });
};

appapi.dashboardFunc.getData = function (pid, callbackId) {

    ajaxCall({
        url: '/ajax/appdirectory/get-stream-saved-data',
        data: {
            pid: pid
        },
        type: 'GET'
    }, 'qm')
        .done(function (data) {
            if (typeof callbackId === 'undefined') {
                appapi.messageSender(pid, 'getdata', [data.result]);
            } else {
                appapi.callbackSender(pid, callbackId, [data.result]);
            }
        })
        .fail(function (jqXHR) {
            hs.statusObj.update(JSON.parse(jqXHR.responseText).error, 'error', true);
        });
};

appapi.dashboardFunc.saveMessage = function (pid, messageData) {

    var message = {};
    message.message = messageData['message[message]'];
    message.messageBySocialNetworkType = messageData['message[messageBySocialNetworkType]'];
    message.attachments = messageData['message[attachments]'];
    message.schedule = {};
    message.schedule.isAutoScheduled = messageData['message[isAutoScheduled]'] ? true : false;
    message.schedule.sendDate = messageData['message[sendDate]'];
    message.schedule.isSendAlert = messageData['message[isSendAlert]'] ? true : false;
    message.schedule.timezone = hs.timezoneOffset / 3600;
    message.schedule.timezoneName = hs.timezoneName;
    message.messageTags = messageData['message[messageTags]'];
    message.twitterTargeting = messageData['message[targeting][TWITTER]'];
    message.facebookTargeting = messageData['message[targeting][FACEBOOK]'];
    message.linkedinTargeting = messageData['message[targeting][LINKEDIN]'];

    message.geoLocation = {};
    message.geoLocation.lat = messageData['message[lat]'];
    message.geoLocation.long = messageData['message[long]'];


    message.privacyOptions = messageData['message[privacyOptions]'];
    message.selectedSocialNetworks = messageData['selectedSocialNetworks'];
    appapi.messageSender(pid, 'savemessagetoapp', [message]);
    hs.statusObj.update(translation._('Saving message to the app...'), 'success', true, 6000);
};

/**
 * Used as a prop for new compose in order to support Save to Amplify.
 * Although this is being used for save to amplify, it could be used for other apps as well if a different appid
 * is passed in and the appstream associated with the appId supports postMessage called in appapi.messageSender.
 * @param appId - The id of the app to send this message to
 * @param messageData - Message contents
 * @see render-full-screen-composer.jsx (Where the prop is passed to hs-app-composer)
 */
appapi.dashboardFunc.saveMessageFromNC = function (appId, messageData) {
    var message = {};
    message.message = messageData.message;
    message.messageBySocialNetworkType = messageData.messageBySocialNetworkType;
    message.attachments = messageData.attachments;
    message.schedule = {};
    message.schedule.isAutoScheduled = messageData.isAutoScheduled;
    message.schedule.sendDate = messageData.sendDate;
    message.schedule.isSendAlert = messageData.isSendAlert;
    message.schedule.timezone = hs.timezoneOffset / 3600;
    message.schedule.timezoneName = hs.timezoneName;
    message.messageTags = messageData.messageTags;
    message.twitterTargeting = messageData.twitterTargeting;
    message.facebookTargeting = messageData.facebookTargeting;
    message.linkedinTargeting = messageData.linkedinTargeting;
    message.linkSettings = messageData.linkSettings;

    message.geoLocation = {};
    message.geoLocation.lat = messageData.lat;
    message.geoLocation.long = messageData.long;

    message.privacyOptions = messageData.privacyOptions;
    message.selectedSocialNetworks = messageData.selectedSocialNetworks;
    var id = {};
    if (typeof window.appapi !== 'undefined' && typeof window.appapi.memberAppStreams !== 'undefined') {
        _.each(window.appapi.memberAppStreams, function (memberAppStream, pid) {
            if (!id.pid) {
                var bindings = memberAppStream.bindings;
                if (typeof bindings !== 'undefined') {
                    if (bindings.indexOf('savemessagetoapp') > -1) {
                        if (memberAppStream.appId == appId) {
                            id.pid = pid;
                        }
                    }
                }
            }
        });
    }

    /*
     * Attachments from NC are signed and expire after an hour.
     * We resign them here since Amplify doesn't do any signing/processing on their end.
     * The urls will expire after a year. (They should be sent to the social networks by then)
     */
    if (message.attachments.length > 0) {
        var imgArray = [];
        //Amplify only supports a single attachment but may support more in the future.
        imgArray.push(message.attachments[0].url);
        ajaxPromise({
            method: "POST",
            url: "/ajax/scheduler/legacy-batch-sign-urls",
            json: {
                urls: imgArray,
                expiry: 525600
            }
        }, 'qm', true, true).then(function (response) {
            if (response) {
                message.attachments[0].url = response.urls[0];
                appapi.messageSender(id.pid, 'savemessagetoapp', [message]);
            }
        });
    }
    else {
        appapi.messageSender(id.pid, 'savemessagetoapp', [message]);
    }
};

appapi.dashboardFunc.isAppEnabled = function (appId) {
    var flag = false;
    if (typeof window.appapi !== 'undefined' && typeof window.appapi.memberAppStreams !== 'undefined') {
        _.each(window.appapi.memberAppStreams, function (memberAppStream) {
            if (!flag) {
                var bindings = memberAppStream.bindings;
                if (typeof bindings !== 'undefined') {
                    if (bindings.indexOf('savemessagetoapp') > -1) {
                        if (memberAppStream.appId == appId) {
                            flag = true;
                        }
                    }
                }
            }
        });
    }
    return flag;
};

//
// Handles calls from App to Dashboard
//
appapi.callBackFunc = {};
appapi.callBackFunc.respond = function (pid, msg) {
    appapi.messageSender(pid, 'initapp', [msg]);
};
appapi.callBackFunc.initApp = function (msgObj, origin) {

    var pid = msgObj.pid;
    var windowName = msgObj.windowName;

    if (!pid || !windowName) {
        return false;
    }

    var appIFrame = document.getElementsByName(windowName);
    if (appIFrame) {
        var appIFrameWindow = appIFrame[0]['contentWindow'];
        appapi.memberAppStreams[pid].window = appIFrameWindow;
        appapi.memberAppStreams[pid].origin = origin;
        appapi.memberAppStreams[pid].initialized = true;
        appapi.memberAppStreams[pid].sdkVersion = msgObj.sdkVersion ? msgObj.sdkVersion : 'old';
        if (parseInt(appapi.memberAppStreams[pid].sdkVersion) >= 3) {
            if (typeof msgObj.params === 'object') {
                if (typeof msgObj.params.callbackId !== 'undefined') {
                    appapi.callbackSender(pid, msgObj.params.callbackId, ['No Error']);
                }
            }
        } else {
            appapi.callBackFunc.respond(pid, 'No Error');
        }

    } else {
        statusObj.update(translation._(
            'iFrame window with id: ' + appapi.memberAppStreams.apiKey + '_' + pid + ' does not exist'),
            'error',
            true);
    }
};

/**
 * This function is internally used by our automated testing app
 * @param pid
 * @param functionCall
 */
appapi.callBackFunc.echo = function (pid, functionCall) {
    appapi.messageSender(pid, 'echo', [functionCall]);
};

appapi.callBackFunc.dropUser = function (pid, username, tweetId) {
    var params = [username, tweetId];
    appapi.messageSender(pid, 'dropuser', params);
};
appapi.callBackFunc.sendtoapp = function (pid, msg) {
    var params = [msg];
    appapi.messageSender(pid, 'sendtoapp', params);
};
appapi.callBackFunc.sendcommenttoapp = function (pid, msg) {
    var params = [msg];
    appapi.messageSender(pid, 'sendcommenttoapp', params);
};
appapi.callBackFunc.sendprofiletoapp = function (pid, profile) {
    var params = [profile];
    appapi.messageSender(pid, 'sendprofiletoapp', params);
};
appapi.callBackFunc.refresh = function (pid) {
    appapi.messageSender(pid, 'refresh', []);
};
appapi.callBackFunc.closepopup = function (pid) {
    appapi.messageSender(pid, 'closepopup', []);
};
appapi.callBackFunc.sendassignmentupdates = function (pid, assignment) {
    appapi.messageSender(pid, 'sendassignmentupdates', [assignment]);
};

/**
 * @param pid integer
 * @param event string
 * @param params array
 */
appapi.messageSender = function (pid, event, params) {

    if (typeof appapi.memberAppStreams !== 'object' || !(appapi.allowedOrigins instanceof Array)) {
        return;
    }

    var appStream = appapi.memberAppStreams[pid];
    if (appStream && appStream.initialized) {
        var appWindow = appStream.window;
        var appOrigin = appStream.origin;
        var msgObj = {
            event: event,
            params: params
        };

        if (parseInt(appStream.sdkVersion) >= 3) {
            appWindow.postMessage(msgObj, appOrigin);
        } else {
            var msgString = JSON.stringify(msgObj);
            appWindow.postMessage(msgString, appOrigin);
        }

        // log the event
        loggerService.logAjaxEvent({
            pid: pid,
            userAction: 'trigger_' + event,
            newSDK: 1,
            appType: appStream.type,
            facadeVersion: appStream.facadeVersion
        });
    }
};

appapi.callbackSender = function (pid, callbackId, params) {
    if (typeof appapi.memberAppStreams !== 'object' || !(appapi.allowedOrigins instanceof Array)) {
        return;
    }

    if (appapi.memberAppStreams[pid]) {
        var appWindow = appapi.memberAppStreams[pid].window;
        var appOrigin = appapi.memberAppStreams[pid].origin;
        var msgObj = {
            callbackId: callbackId,
            params: params
        };
        appWindow.postMessage(msgObj, appOrigin);
    }

};


appapi.helper = {};
appapi.helper.propagateAssignmentUpdates = function (assignment) {

    if (!(assignment.socialNetworkType == 'APPDIR' || assignment.messageType == 'APP_DEFAULT')) {
        return;
    }

    var appId = assignment.assignedSnMessage && assignment.assignedSnMessage.appId ? assignment.assignedSnMessage.appId : null;
    var param = {
        status: assignment.status,
        messageId: _.isUndefined(assignment.assignedSnMessage.originalMessageId) ? assignment.assignedSnMessageId : assignment.assignedSnMessage.originalMessageId,
        assignmentId: assignment.teamAssignmentId,
        toName: assignment.toMemberName ? assignment.toMemberName : assignment.teamName,
        createdDate: assignment.createdDate,
        modifiedDate: assignment.modifiedDate
    };

    _.each(appapi.memberAppStreams, function (appStream, pid) {
        if (appId == appStream.appId) {
            appapi.callBackFunc.sendassignmentupdates(pid, param);
        }
    });

};


appapi.helper.sendCommentToAppBind = function ($menu, model) {
    $menu.find("._sendCommentToApp").remove();

    var appStreamsToBind = appapi.helper.getActionableAppStream('sendcommenttoapp');

    if (!_.isEmpty(appStreamsToBind)) {
        var template = commentMenuOptionTemplate;
        var menuItemsToAppend = '';

        _.each(appStreamsToBind, function (appStream) {
            menuItemsToAppend += template.render(appStream);
        });

        $menu.append(menuItemsToAppend);

        $menu.off('click', '._sendCommentToApp').on('click', '._sendCommentToApp', function () {
            var pid = $(this).attr('pid');

            var message = {};
            message.username = model.get('from_name');
            message.useravatar = model.get('from_pic_square');
            message.userid = model.get('fromid');

            message.commentid = model.get('id');
            message.postid = model.get('post_id');
            message.postlink = model.get('post_permalink');

            message.likes = model.get('likes');
            message.type = model.get('type');
            message.text = model.get('text');
            message.timestamp = model.get('time');
            appapi.callBackFunc.sendcommenttoapp(pid, message);
        });

    }
};

appapi.helper.sendToAppBind = function (el, $messageDiv) {

    //Prepare variables
    var $el = $(el);
    var $menu = $el.closest('._options').find('._moreMenu');

    var socialNetwork = appapi.helper.getMessageSocialNetwork($messageDiv);
    if (socialNetwork != 'twitter' && socialNetwork != 'facebook') {
        return;
    }


    //Dropdown is shared by all the posts in the same stream, therefore remove it first
    $menu.find("._sendToApp").remove();

    var appStreamsToBind = appapi.helper.getActionableAppStream('sendtoapp', socialNetwork);

    //Append a link to the dropdown menu
    if (!_.isEmpty(appStreamsToBind)) {
        var template = appPostMenuOptionTemplate;
        var menuItemsToAppend = '';

        _.each(appStreamsToBind, function (appStream) {
            menuItemsToAppend += template.render(appStream);
        });

        $menu.append(menuItemsToAppend);

        //bind function
        $menu.off('click', '._sendToApp').on('click', '._sendToApp', function () {
            var pid = $(this).attr('pid');
            var apiKey = $(this).attr('key');
            var isNewSDK = parseInt($(this).attr('isnewsdk'), 10) == 1;
            appapi.helper.doSendToApp($messageDiv, 'sendtoapp', pid, apiKey, isNewSDK);
        });
    }
};


appapi.helper.getMessageSocialNetwork = function ($messageDiv) {
    var $box = $messageDiv.closest('._box');
    var socialNetworkType = $box.box('get', 'socialNetworkType');
    var socialNetwork = '';

    if (null !== socialNetworkType && socialNetworkType.match(/TWITTER_SEARCH|TWITTER|FACEBOOK/i)) {
        if (-1 != socialNetworkType.toLowerCase().indexOf("twitter")) {
            socialNetwork = "twitter";
        } else if (-1 != socialNetworkType.toLowerCase().indexOf("facebook")) {
            socialNetwork = "facebook";
        }
    }

    return socialNetwork;
};

// Helper function for Passthrough DL based on App ID (if appID is in the DL values list, it will pass)
var isAppIdPartOfDarklaunch = function (appId, darkLaunchCode)  {
    // We shouldn't ever get here with an undefined appId, but check it to be on the safe side.
    if (!appId) {
        return false;
    }

    var allowedAppIds = darklaunch.getFeatureValue(darkLaunchCode);
    return allowedAppIds && allowedAppIds.split(',').includes(appId.toString());
};

// For new streams
appapi.helper.doSendToAppWithMessageObj = function (pid, msgObj, contextObj) {
    var author = msgObj.author;
    var message = {};
    var appId = appapi.memberAppStreams[pid].appId;
    message.post = appapi.helper.getPostObjFromMessageObj(msgObj, appId);

    if (message.post.network === 'PENDING' && contextObj.socialNetworkType) {
        message.post.network = contextObj.socialNetworkType.toUpperCase();
    }

    //Get related conversations
    var conversationPromise;
    if (!_.isEmpty(message.post)) {
        var params = {};
        switch (message.post.network) {
            case "FACEBOOK":
                message.post.conversation = [];
                params.socialNetworkId = contextObj.socialNetworkId;
                params.parentId = msgObj.id;

                if (msgObj.parentId) {
                    params.objectType = 'comment';
                    params.grandParentId = msgObj.parentId;
                } else {
                    params.objectType = 'post';
                }

                conversationPromise = ajaxCall({
                    type: 'GET',
                    url: "/ajax/network/get-comments",
                    data: params,
                    success: function (data) {
                        var comments = data.result && data.result.comments ? data.result.comments : [];
                        message.post.conversation = appapi.helper.massageConversationData(comments);
                    }
                }, 'qm');

                break;
            case "TWITTER":
                params.statusId = msgObj.id;
                params.socialNetworkId = contextObj.socialNetworkId;
                break;
            default:
                break;
        }
    }

    if (!conversationPromise) {
        conversationPromise = $.Deferred();
        conversationPromise.resolve();
    }

    //Get user profiles
    var userProfilePromise;
    if (author.id) {
        var userId = author.id;
        if (message.post.network === 'TWITTER') {
            userId = author.username;
        }
        userProfilePromise = ajaxCall({
            type: 'GET',
            url: "/ajax/network/user-info?userId=" + userId + "&socialNetworkId=" + contextObj.socialNetworkId,
            success: function (data) {
                var appId = appapi.memberAppStreams[pid].appId;
                message.profile = appapi.helper.getProfileObjFromApiResult(message.post.network, data.apiResult, appId);
                if (isAppIdPartOfDarklaunch(appId, 'DEVP_1506_MODIFY_SENDTOAPP_EVENT_FOR_APP_IDS') && data.metadata) {
                    message.context = {
                        socialNetworkId: data.metadata.externalSocialNetworkId
                    };
                }
            }
        }, 'qm');
    }

    if (!userProfilePromise) {
        userProfilePromise = $.Deferred();
        userProfilePromise.resolve();
    }

    $.when(userProfilePromise, conversationPromise).done(function () {
        var memberAppComponent = appapi.memberAppStreams[pid];
        if (memberAppComponent.bindings.indexOf('sendtoapp') > -1) {
            window.appapi.callBackFunc.sendtoapp(pid, message);
        } else if (memberAppComponent.bindings.indexOf('sendprofiletoapp') > -1) {
            var profileObj = _.extend({}, message.profile);
            profileObj.post = message.post;
            profileObj.profile = message.profile;
            window.appapi.callBackFunc.sendprofiletoapp(pid, profileObj);
        }
    });
};

appapi.helper.massageConversationData = function (comments) {
    var conversations = [];
    _.each(comments, function (commentObj) {
        var comment = {};
        var metadata = commentObj.metadata;
        comment.id = commentObj.id;

        comment.user = {};
        comment.user.id = commentObj.author ? commentObj.author.id : '';
        comment.user.name = commentObj.author ? commentObj.author.name : '';
        comment.user.username = commentObj.author ? commentObj.author.username : '';

        comment.datetime = metadata ? metadata.createdAt : '';
        comment.source = metadata ? metadata.source : '';
        comment.geo = metadata ? metadata.location : '';
        if (comment.source === 'twitter') {
            comment.retweetcount = metadata.counts ? metadata.counts.likes : '';
        }
        comment.text = commentObj.text;
        conversations.push(comment);
    });

    return conversations;
};


appapi.helper.getProfileObjFromApiResult = function (source, apiResult, appId) {
    var profileData = {};
    profileData.network = source.toUpperCase();
    if (apiResult) {
        switch (source) {
            case 'TWITTER':
                profileData.id = apiResult.id_str;
                if (isAppIdPartOfDarklaunch(appId, 'CI_1728_EXTENDED_TWITTER_PROFILE_INFO')) {
                    // it seems we have access to the fields in the 'User' object
                    //  https://developer.twitter.com/en/docs/twitter-api/v1/data-dictionary/object-model/user
                    profileData.id_str = apiResult.id_str;
                    profileData.lang = apiResult.lang;

                    profileData.name = apiResult.name;
                    profileData.username = apiResult.screen_name;
                    profileData.screen_name = apiResult.screen_name;
                    profileData.verified = apiResult.verified;
                }
                break;
            case 'FACEBOOK':
                profileData.bio = apiResult.bio;
                profileData.first_name = apiResult.first_name;
                profileData.gender = apiResult.gender;
                profileData.id = apiResult.id;
                profileData.last_name = apiResult.last_name;
                profileData.link = apiResult.link;
                profileData.locale = apiResult.locale;
                profileData.location = apiResult.location;
                profileData.name = apiResult.name;
                profileData.picture = apiResult.picture;
                profileData.website = apiResult.website;
                break;
            case 'INSTAGRAM':
                profileData.id = apiResult.id;
                profileData.username = apiResult.username;
                profileData.full_name = apiResult.full_name;
                profileData.profile_picture = apiResult.profile_picture;
                profileData.bio = apiResult.bio;
                profileData.website = apiResult.website;
                break;
            case 'YOUTUBE':
                profileData.id = apiResult.id;
                profileData.name = apiResult.name;
                profileData.first_name = apiResult.firstName;
                profileData.last_name = apiResult.lastName;
                profileData.avatar_url = apiResult.avatarUrl;
                profileData.description = apiResult.description;
                break;
            default:
            //nothing
        }

        return profileData;
    }
};

appapi.helper.getPostObjFromMessageObj = function (msgObj, appId) {
    var post = {};
    post.network = msgObj.metadata.source.toUpperCase();
    post.id = msgObj.id;
    var created_at = new Date(msgObj.metadata.createdAt * 1000);
    var item;

    if (post.network === 'TWITTER') {
        post.user = {};
        post.user.userid = msgObj.author.id;

        if (isAppIdPartOfDarklaunch(appId, 'CI_1728_EXTENDED_TWITTER_PROFILE_INFO')) {
            post.href = msgObj.metadata.url;
            post.parentId = msgObj.parentId || null;
            post.source = msgObj.metadata.application ? msgObj.metadata.application.name : '';
            post.content = {};
            post.content.body = msgObj.text;
            post.content.bodyhtml = msgObj.text;
            post.datetime = created_at.toISOString();
            post.user.username = msgObj.author.username ? msgObj.author.username : msgObj.author.name;

            post.attachments = [];
            // duplicate code, will refactor if we decide to keep this functionality
            _.each(msgObj.entities, function (entity) {
                if (entity.type == "link") {
                    item = {};
                    item.type = entity.type;
                    item.url = entity.url;
                    item.title = entity.title;
                    var thumbnailURL = '';
                    if (typeof entity.media != 'undefined' && entity.media) {
                        thumbnailURL = entity.media.thumbnailUrl;
                    }
                    item.thumbnail = thumbnailURL;

                    //compatible fields
                    item.items = {};
                    item.items.target = entity.url;
                    item.items.thumbnailsrc = thumbnailURL;
                    //compatible fields

                    post.attachments.push(item);
                } else if (entity.type == "image" || entity.type == "video") {
                    item = {};
                    item.type = entity.type;
                    item.url = entity.url;
                    item.thumbnail = entity.thumbnailUrl;
                    item.title = '';

                    //compatible fields
                    item.items = {};
                    item.items.target = item.url;
                    item.items.thumbnailsrc = item.thumbnail;
                    //compatible fields

                    item.indices = entity.indices;

                    post.attachments.push(item);
                }
            });
        }
    } else {
        post.source = msgObj.metadata.application ? msgObj.metadata.application.name : '';
        post.href = msgObj.metadata.url;
        post.parentId = msgObj.parentId || null;
        post.counts = msgObj.metadata.counts;
        post.datetime = created_at.toISOString();

        post.content = {};
        post.content.body = msgObj.text;
        post.content.bodyhtml = msgObj.text;

        post.user = {};
        post.user.userid = msgObj.author.id;
        post.user.username = msgObj.author.username ? msgObj.author.username : msgObj.author.name;

        post.attachments = [];
        _.each(msgObj.entities, function (entity) {
            if (entity.type == "link") {
                item = {};
                item.type = entity.type;
                item.url = entity.url;
                item.title = entity.title;
                var thumbnailURL = '';
                if (typeof entity.media != 'undefined' && entity.media) {
                    thumbnailURL = entity.media.thumbnailUrl;
                }
                item.thumbnail = thumbnailURL;

                //compatible fields
                item.items = {};
                item.items.target = entity.url;
                item.items.thumbnailsrc = thumbnailURL;
                //compatible fields

                post.attachments.push(item);
            } else if (entity.type == "image" || entity.type == "video") {
                item = {};
                item.type = entity.type;
                item.url = entity.url;
                item.thumbnail = entity.thumbnailUrl;
                item.title = '';

                //compatible fields
                item.items = {};
                item.items.target = item.url;
                item.items.thumbnailsrc = item.thumbnail;
                //compatible fields

                item.indices = entity.indices;

                post.attachments.push(item);
            }
        });
    }

    return post;
};

// For old streams
appapi.helper.doSendToApp = function ($messageDiv, action, pid, apiKey, isNewSDK) {

    var $box = $messageDiv.closest('._box');
    var socialNetworkType = $box.box('get', 'socialNetworkType'); //Upper case
    var socialNetworkId = $messageDiv.closest('._box').box('get', 'socialNetworkId');

    var messageObj = {};
    //conversation and user profile need to be fetched asynchronously, so we use promise to manage the callbacks in a cleaner way
    var conversationPromise;
    var userProfilePromise;


    messageObj.post = {};
    var msgData = $messageDiv.data('msgData');

    if (typeof msgData != 'undefined') {
        var appId = appapi.memberAppStreams[pid].appId;
        messageObj.post = appapi.helper.getPostObjFromMessageObj(msgData, appId);
    }

    if (!_.isEmpty(messageObj.post)) {
        switch (messageObj.post.network) {
            case "TWITTER":
                if ($messageDiv.find('._replyToStatus').length || $messageDiv.find('._closeReplyTo').length) {
                    var tweet_id = $messageDiv.data('tweetId');
                    if (null == tweet_id || null == socialNetworkId) {
                        break;
                    }
                }
                break;

            case "FACEBOOK":
                var commentsData = $messageDiv.data('commentsData');
                if (typeof commentsData != 'undefined' && typeof commentsData.comment_list != 'undefined') {
                    _.each(commentsData.comment_list, function (item) {
                        var comment = {};

                        var createdAt = new Date(item.time * 1000);
                        comment.datetime = createdAt.toISOString();
                        comment.id = item.id;
                        comment.name = item.from_name;
                        comment.likes = item.likes;
                        comment.text = item.text;
                        comment.uid = item.fromid;

                        messageObj.post.conversation.push(comment);
                    });
                }

                break;

            default:
                break;
        }
    }

    var userId = '';
    if (socialNetworkType == 'TWITTER') {
        userId = $messageDiv.find('._userInfoDropdown').attr('title');
    } else if (socialNetworkType == 'FACEBOOK') {
        userId = $messageDiv.data('userId');

        //Facebook page comments temporary fix PLAT-4568
        if (!userId) {
            userId = $messageDiv.attr('externaluserid');
        }

        if (userId && userId.indexOf('|')) {
            var userIdComponents = userId.split('|');
            userId = userIdComponents[1];

            var streamType = userIdComponents[0];
            if (streamType == 'page') {
                messageObj.post.network = socialNetworkType;
                var $postLink = $messageDiv.find('._postPermalink');
                messageObj.post.href = $postLink.attr('href');
                messageObj.post.datetime = $postLink.attr('datetime');

                messageObj.post.content = {};
                var $postText = $messageDiv.find('._postText');
                messageObj.post.content.body = $.trim($postText.text());
                messageObj.post.content.bodyhtml = $postText.html();

                messageObj.post.user = {};
                messageObj.post.user.userid = userId;
                messageObj.post.user.username = $messageDiv.find('._username').attr('title');

                messageObj.post.id = "";
                messageObj.post.attachments = [];
                messageObj.post.conversation = [];
                messageObj.post.counts = {};

            }
        }
        //Facebook page comments temporary fix PLAT-4568
    }

    if (userId) {
        userProfilePromise = ajaxCall({
            type: 'GET',
            url: "/ajax/network/user-info?userId=" + userId + "&socialNetworkId=" + socialNetworkId,
            success: function (data) {
                var appId = appapi.memberAppStreams[pid].appId;
                messageObj.profile = appapi.helper.getProfileObjFromApiResult(socialNetworkType.toUpperCase(), data.apiResult, appId);
                if (isAppIdPartOfDarklaunch(appId, 'DEVP_1506_MODIFY_SENDTOAPP_EVENT_FOR_APP_IDS') && data.metadata) {
                    messageObj.context = {
                        socialNetworkId: data.metadata.externalSocialNetworkId
                    };
                }
            }
        }, 'qm');
    }

    if (!userProfilePromise) {
        userProfilePromise = $.Deferred();
        userProfilePromise.resolve();
    }

    if (!conversationPromise) {
        conversationPromise = $.Deferred();
        conversationPromise.resolve();
    }

    var sendToAppAction = function (action) {

        var MessageObjString = '';
        var profileObj = {};
        var profileObjString = '';

        if (action == 'sendtoapp') {
            MessageObjString = JSON.stringify(messageObj);
            if (isNewSDK) {
                window.appapi.callBackFunc.sendtoapp(pid, messageObj);
            } else {
                jsapi.sendToApp(apiKey, pid, MessageObjString);
            }
        } else if (action == 'sendprofiletoapp') {

            profileObj = _.extend({}, messageObj.profile);
            profileObj.post = messageObj.post;
            profileObj.profile = messageObj.profile;
            profileObjString = JSON.stringify(profileObj);

            if (isNewSDK) {
                window.appapi.callBackFunc.sendprofiletoapp(pid, profileObj);
            } else {
                jsapi.sendProfileToApp(apiKey, pid, profileObjString);
            }
        }

        //track sendTo event
        ajaxCall({
            type: 'GET',
            url: "/ajax/appdirectory/stats?pid=" + pid + "&event=sendToApp"

        }, 'qm');

    };

    $.when(userProfilePromise, conversationPromise).done(function () {
        sendToAppAction(action);
    });

};

appapi.helper.getActionableAppStream = function (event, socialNetworkType) {
    //Get all the app streams and plugins within the actionable scope
    var appStreamsInTheScope = [];
    _.each($('#streamsContainer ._box'), function (stream) {
        var $stream = $(stream);
        if ($stream.data('box').type != 'APP_DEFAULT') {
            return;
        }

        var $boxFrame = $stream.find('iframe');
        if ($boxFrame.length === 0) {
            return;
        }
        var boxData = $stream.data('box');
        var iframeId = $boxFrame.attr('id');

        var appStream = {};
        appStream.icon = boxData.icon30Url;
        appStream.title = 'Send to ' + boxData.title;
        if (appStream.title.length > 20) {
            appStream.title = appStream.title.substring(0, 17) + '...';
        }
        appStream.pid = boxData.memberAppStreamId;
        appStream.apiKey = iframeId.split('_')[0];

        appStreamsInTheScope.push(appStream);

    });
    _.each($('#_appPlugin iframe'), function (iframe) {
        var $iframe = $(iframe);

        var appStream = {};
        appStream.icon = $iframe.attr('icon');
        appStream.title = $iframe.attr('title');
        if (appStream.title.length > 20) {
            appStream.title = appStream.title.substring(0, 17) + '...';
        }
        appStream.pid = $iframe.attr('pid');
        appStream.apiKey = $iframe.attr('apikey');

        appStreamsInTheScope.push(appStream);
    });

    //Further filter out all the app streams and plugins that don't have the event bound
    var appStreamsToBind = [];
    _.each(appStreamsInTheScope, function (appStream) {
        var pid = appStream.pid;
        var apiKey = appStream.apiKey;

        if (typeof window.appapi !== 'undefined' && window.appapi.memberAppStreams[pid] && _.indexOf(window.appapi.memberAppStreams[pid].bindings, event) > -1) {

            if (event == 'sendtoapp') {
                if (window.appapi.memberAppStreams[pid]['sendToAppDisableList']) {
                    if (_.indexOf(window.appapi.memberAppStreams[pid]['sendToAppDisableList'], socialNetworkType.toLowerCase()) > -1) {
                        return;
                    }
                }
            } else if (event == 'sendprofiletoapp') {
                if (window.appapi.memberAppStreams[pid]['sendProfileToAppDisableList']) {
                    if (_.indexOf(window.appapi.memberAppStreams[pid]['sendProfileToAppDisableList'], socialNetworkType.toLowerCase()) > -1) {
                        return;
                    }
                }
            }

            appStream.isNewSDK = 1;
            appStreamsToBind.push(appStream);
        } else {
            if (jsapi.apps[apiKey] && jsapi.apps[apiKey][pid]) {
                if (jsapi.apps[apiKey][pid].userbound && jsapi.apps[apiKey][pid].userbound[event]) {
                    appStream.isNewSDK = 0;
                    appStreamsToBind.push(appStream);
                }
            }
        }
    });

    return appStreamsToBind;
};

// used to help prevent XSS
appapi.helper.sanitizeInput = function (input) {
    // sanitize input based on https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet#RULE_.231_-_HTML_Escape_Before_Inserting_Untrusted_Data_into_HTML_Element_Content
    if (!input || typeof input !== 'string') {
        return input;
    }
    input = input.replace(/&/g, '&amp;');
    input = input.replace(/</g, '&lt;');
    input = input.replace(/>/g, '&gt;');
    input = input.replace(/"/g, '&quot;');
    input = input.replace(/\\/g, '&#x27;');
    input = input.replace(/\//g, '&#x2F;');
    return input;
};

appapi.helper.sanitizeURL = function (input) {
    if (!input || typeof input !== 'string') {
        return '';
    }
    input = input.replace(/[^-A-Za-z0-9+&@#/%?=~_|!:,.;()]/g, '');
    return input;
};

//
// Init
//
if (window.addEventListener) {
    window.addEventListener("message", appapi.messageListener, false);
} else {
    window.attachEvent('onmessage', appapi.messageListener);
}

window.appapi = appapi;
export default appapi;
