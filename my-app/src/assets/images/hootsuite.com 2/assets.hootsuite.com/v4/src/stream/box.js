import $ from 'jquery';
import _ from 'underscore';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import util from 'utils/util';
import hsEjs from 'utils/hs_ejs';
import teamResponse from 'team/response';
import twemoji from 'twemoji';
import trackerDatalab from 'utils/tracker-datalab';
import streamsFlux from 'hs-app-streams/lib/stores/flux';
import { MESSAGE } from 'hs-app-streams/lib/actions/types';
import 'team/organizationdropdown';

import jsapi from '../in_jsapi';
import attributionTemplate from '../../internal/templates/stream/twitter/metadata/attribution.ejs';
import {
    formatTweetText,
    fixEmojiIndices,
    makeUsernameClickable,
    unescapeAmpersand,
    unescapeAngleBrackets,
    nl2br,
} from 'utils/string';
import { asyncStreamLoader } from './components/streams-loader';

import moment from 'moment-timezone';
import darklaunch from 'utils/darklaunch';
import StreamResponseTemplate from '../../templates/stream/response.ejs';
import StreamStandardTemplate from '../../templates/stream/standard-message.ejs';
import StreamShareStreamPopupTemplate from '../../templates/stream/share-stream-popup.ejs';

const HOOTBUS_EVENT_OPEN_COMPOSER = 'composer.open';

var box = {};

/**
 * formatTweetText
 */
box.formatTweetText = formatTweetText;

/**
 * formatTweet
 */
box.formatTweet = function (tweetData) {
    var tweetEntities = tweetData.entities;
    var tweetText = tweetData.full_text ? tweetData.full_text : tweetData.text;
    var originalTweet = tweetData.full_text ? tweetData.full_text : tweetData.text; // need to decode to work with Twitter's indices, but seems like no longer needed in Aug2011

    if (!tweetEntities || typeof tweetEntities.urls === "undefined") {
        // no entities, fallback to formatTweetText
        return box.formatTweetText(tweetText);
    }

    var entities = [],
        includeUserMentions = (typeof tweetEntities.user_mentions !== "undefined"),
        linkMediaTemplate = "<a href='[[url]]' target='_blank'  rel='noopener noreferrer'>[[text]]</a>",
        hashTemplate = '<button class="_quickSearchPopup hash" title="[[text]]">#[[text]]</button>',
        mentionsTemplate = "@<button class='_userInfoPopup _twitter' title='[[text]]'>[[text]]</button>",
        fnGetHtml = function (type, text, url, _media) {
            var html = '';
            switch (type) {
                case 'url':
                case 'media':
                    url = url.replace(/('|")/g, ' ');	// replace any type of quote with string in a url that twitter gives us
                    html = linkMediaTemplate;
                    html = html.replace(/\[\[url\]\]/g, url).replace(/\[\[text\]\]/g, text);
                    break;
                case 'hash':
                    html = hashTemplate.replace(/\[\[text\]\]/g, text);
                    break;
                case 'user':
                    html = mentionsTemplate.replace(/\[\[text\]\]/g, text);
                    break;
                default:
                    break;
            }
            return html;
        };

    // build entities
    // offset indices for HS-2426
    var indexOffset = 0,
        fnFixIndices = function (indices) {
            return _.map(indices, function (i) {
                return i - indexOffset;
            });
        };
    var item;
    var displayUrl;

    if (includeUserMentions && tweetEntities.user_mentions.length) {
        var firstMention = tweetEntities.user_mentions[0],
            strAtIndex = tweetText.substring(firstMention.indices[0], firstMention.indices[1]);
        if (strAtIndex.toLowerCase() !== '@' + firstMention.screen_name.toLowerCase()) {
            indexOffset = 6 + firstMention.screen_name.length;		// offset considers "RT @......: "
        }

        for (var i = 0; i < tweetEntities.user_mentions.length; i++) {
            item = tweetEntities.user_mentions[i];
            indexOffset = fixEmojiIndices(tweetText, item, i);
            entities.push({
                type: 'user',
                indices: fnFixIndices(item.indices),
                data: item.screen_name
            });
        }
    }

    if (typeof tweetEntities.urls != "undefined") {
        for (var u = 0; u < tweetEntities.urls.length; u++) {
            item = tweetEntities.urls[u];
            indexOffset = fixEmojiIndices(tweetText, item, u);
            displayUrl = item.display_url || item.url;
            entities.push({
                type: 'url',
                indices: fnFixIndices(item.indices),
                data: (item.url.indexOf('http') === 0) ? item.url : 'http://' + item.url,
                text: displayUrl
            });
        }
    }
    if (typeof tweetEntities.media != "undefined") {
        for (var m = 0; m < tweetEntities.media.length; m++) {
            item = tweetEntities.media[m];
            indexOffset = fixEmojiIndices(tweetText, item, m),
            displayUrl = item.display_url || item.url;
            entities.push({
                type: 'media',
                indices: fnFixIndices(item.indices),
                data: item.url,
                text: displayUrl,
                media: item.media_url
            });
        }
    }
    if (typeof tweetEntities.hashtags != "undefined") {
        for (var h = 0; h < tweetEntities.hashtags.length; h++) {
            item = tweetEntities.hashtags[h];
            indexOffset = fixEmojiIndices(tweetText, item, h),
                entities.push({
                    type: 'hash',
                    indices: fnFixIndices(item.indices),
                    data: item.text
                });
        }
    }

    // sort entities
    if (!entities.length) {
        tweetText = tweetText.replace(/\n/g, '<br/>');
        return makeUsernameClickable(tweetText);
    } else {
        entities = entities.sort(function (a, b) {
            return b['indices'][0] - a['indices'][0];
        });
    }

    // loop through entities
    var pastIndices = [];
    for (var e = 0, entitiesLength = entities.length; e < entitiesLength; e++) {
        item = entities[e];
        var idx = item.indices,
            textToReplace = originalTweet.substring(idx[0], idx[1]),	//item.type == 'url' ? item.text : originalTweet.substring(idx[0], idx[1]),
            idxStart = parseInt(idx[0], 10),
            idxEnd = parseInt(idx[1], 10),
            pre = tweetText.substring(0, idxStart),
            post = tweetText.substring(idxEnd),
            html = "";

        if (item.type == 'media') {
            html = fnGetHtml(item.type, item.text, item.data, item.media);
        } else if (item.type == 'url') {
            html = fnGetHtml(item.type, item.text, item.data);
        } else {
            html = fnGetHtml(item.type, item.data, textToReplace);
        }

        /* in some cases, an entity will be listed twice, as two different types, keyed to the same indices.
         * we need to ensure we do not double-replace the string.
         */
        if (!_.contains(pastIndices, idxStart)) {
            pastIndices.push(idxStart);
            tweetText = pre + html + post;	// replace
        }
    }

    tweetText = tweetText.replace(/\n/g, '<br/>');
    return (includeUserMentions) ? tweetText : makeUsernameClickable(tweetText);
};

/**
 * formatTweetSource
 */
box.formatTweetSource = function (string) {
    if (!string || !string.length) {
        return '';
    }

    if (string.toLowerCase() == 'web') {
        return 'Web';
    }

    // remove html tags
    if (string.indexOf("&amp;") > -1) {
        string = unescapeAmpersand(string);
    }
    if (string.indexOf("&lt;") > -1) {
        string = unescapeAngleBrackets(string);
    }
    string = string.replace(/<[^>]+>/g, '');
    return string;

};

/**
 * generateResponseHtml
 */
box.generateResponseHtml = function (r) {
    box.generateResponseHtml.template = (box.generateResponseHtml.template) ?
        box.generateResponseHtml.template : StreamResponseTemplate;

    const responseMoment = moment(r.responseDate).utc();
    const timestamp = responseMoment.unix();
    const formattedDate = responseMoment.tz(hs.timezoneName).format('MMM DD, YYYY, h:mma');
    const responseSnMessage = _.escape(r.responseSnMessage);

    return box.generateResponseHtml.template.render({
      ...r,
      timestamp,
      formattedDate,
      responseSnMessage
    });
};

/// end helpers and smarty modifiers

/**
 * box.generateAttachmentHtmlPhotoOrVideo
 */
box.generateAttachmentHtmlPhotoOrVideo = function (data, totalItemsBeingRendered) {
    if (data.type) {
        switch (data.type) {
            case "photo":
                return box.generateAttachmentHtmlPhoto(data, totalItemsBeingRendered);

            case "video":
                return box.generateAttachmentHtmlVideo(data, totalItemsBeingRendered);

            default:
                // Nothing here.
                break;
        }
    }
};

/**
 * box.generateAttachmentHtmlPhoto
 */
box.generateAttachmentHtmlPhoto = function (data, totalItemsBeingRendered) {
    var p = {
        "tmplData": data,
        'totalItemsBeingRendered': totalItemsBeingRendered
    };

    var renderedHtml = hsEjs.getEjs('stream/attachment/photo').render(p);

    return renderedHtml;
};

/**
 * box.generateAttachmentHtmlCheckin
 */
box.generateAttachmentHtmlCheckin = function (data) {
    var p = {"tmplData": data};

    var renderedHtml = hsEjs.getEjs('stream/attachment/checkin').render(p);

    return renderedHtml;
};

/**
 * box.generateAttachmentHtmlPhotoAlbum
 */
box.generateAttachmentHtmlPhotoAlbum = function (data) {
    var p = {"tmplData": data};

    var renderedHtml = hsEjs.getEjs('stream/attachment/photoalbum').render(p);

    return renderedHtml;
};

/**
 * box.generateAttachmentHtmlBlockquote
 */
box.generateAttachmentHtmlBlockquote = function (data) {
    var p = { "tmplData": data, nl2br };

    var renderedHtml = hsEjs.getEjs('stream/attachment/blockquote').render(p);

    return renderedHtml;
};

/**
 * box.generateAttachmentHtmlVideo
 */
box.generateAttachmentHtmlVideo = function (data, totalItemsBeingRendered) {
    var p = {
        "tmplData": data,
        'totalItemsBeingRendered': totalItemsBeingRendered
    };
    var renderedHtml = hsEjs.getEjs('stream/attachment/video').render(p);

    return renderedHtml;
};

/**
 * generateMessagesHtml
 */
box.generateMessagesHtml = function (data) {
    var socialNetworkType = data.box.socialNetworkType,
        messagesHtml = '';
    switch (socialNetworkType.toLowerCase()) {
        case 'facebook':
            messagesHtml = box.initFacebookMessagesHtml(data);
            break;
        default:
            // 'TWITTER' to 'Twitter'
            socialNetworkType = socialNetworkType.replace(
                /(.)(.*)/, function (_, a, b) {
                    return a + b.toLowerCase();
                });
            var method = 'generateMessagesHtml' + socialNetworkType;
            return box[method](data);
    }

    return messagesHtml;
};

/**
 * generateMessagesHtmlFacebook
 */
box.generateMessagesHtmlFacebook = function (data) {
    // choose EJS template for message.

    var msgs = [];

    $.each(data.messages, function (index, post) {

        var s = '';

        // check if has response, if so, wrap the message in the div
        if (post.response) {
            s += box.generateResponseHtml(post.response);
        }

        // --- ejs
        var messageData = window.stream.facebook.massageMessageDatum(post, data);
        if (messageData.tmplData.contentType && messageData.tmplData.content) {
          var contentType = messageData.tmplData.contentType;
          var content = messageData.tmplData.content;

          if (contentType === "htmlish") {
            content = nl2br(content);
          } else if (contentType !== 'html') {
            content = nl2br(formatTweetText(content));
          }
          messageData.tmplData.content = content;
        }

        messageData.isFacebook = true;
        messageData.renderComments = false;

        var ejsData = $.extend(true, messageData, {
            attributionTemplate: attributionTemplate,
            tmplData: {
                lazyLoadingOff: true,
            }
        });

        var messageHtml = StreamStandardTemplate.render(ejsData);

        s += messageHtml;

        var $s = $(twemoji.parse($('<div>').html(s).get(0))).children();
        $s.data('fav', post.favorited);
        $s.data('userId', post.actorType + '|' + post.uid);
        $s.data('timestamp', post.created);
        $s.data('can-be-shared', post.canBeShared);

        if (_.has(post, '-_-')) {
            if (_.has(post['-_-'], 'entities') && !!(post['-_-'].entities)) {
                var media = post['-_-'].entities.reduce(function (previousValue, currentValue) {
                    if (['image', 'video', 'gif'].indexOf(currentValue.type) !== -1) {
                        previousValue.push(currentValue);
                    }
                    return previousValue;
                }, []);

                $s.data('attached-images', formatMediaForLightbox(media));
            }
        }

        Array.prototype.push.apply(msgs, $s.get());

        $s.data('msgData', post['-_-']);

        $s.data('commentsData', post.commentsData);

    });

    var $msgs = $(msgs);
    window.stream.facebook.initCommentTextarea($msgs.find('._commentEntryArea'));

    return $msgs;
};

box.initFacebookMessagesHtml = data => data.messages.map((post) => {
    let messageData = window.stream.facebook.massageMessageDatum(post, data);

    messageData.isFacebook = true;
    messageData.renderComments = true;

    Object.assign(messageData.tmplData,
        {lazyLoadingOff: true}
    );

    let messageContainer = document.createElement('div');

    asyncStreamLoader('facebookPrivateMessage',
        {
            containerElement: messageContainer,
            id: messageData.htmlId,
            data: messageData,
            assignment: post.assignment,
            response: post.response,
        })
    return messageContainer
})

/**
 * Formats standardized media objects into lightbox template data
 *
 * @param media
 * @returns {*}
 */
var formatMediaForLightbox = function (media) {
    if (!_.isArray(media) || !media.length) {
        return media;
    }

    return _.map(media, function (m) {
        var lightboxMedia = {
            src: m.url
        };

        if (m.source) {
            lightboxMedia.linkSource = m.source;
            lightboxMedia.linkHref = m.sourceUrl ? m.sourceUrl : null;
            lightboxMedia.linkText = "View on " + m.source.charAt(0).toUpperCase() + m.source.slice(1);
        }

        return lightboxMedia;
    });
};

box.bindShareStreamPopupFunctionality = function (boxId, $popup, data) {
    $popup.find('._teamSelectorWidgetBtn').hsDropdownTeams('populate', _.values(data.teams), {
        change: function (selected) {
            $popup.find('._teamId').val(selected.teamId);
        }
    });

    $popup.find('._submit').click(function () {
        var teamId = $popup.find('._teamId').val();
        if (!teamId) {
            hs.statusObj.update(translation._("Please select a team to share this stream"), 'warning', true);
            return;
        }

        ajaxCall({
            url: '/ajax/stream/save-team-stream',
            data: {
                teamId: teamId,
                boxId: boxId
            },
            success: function (data) {
                if (data.success) {
                    hs.statusObj.update(translation._("Success!"), 'success', true);
                    $popup.dialog('close');
                    var template = hsEjs.getEjs('stream/streamhelper/sharedstreamrow'),
                      $box = $('#boxAddStream'),
                      $container = $box.find('._sharedList');
                    $container.append(template.render({
                        ...data.teamSharedBox,
                        u_escape: _.escape
                    }));
                } else {
                    hs.statusObj.update(data.errorMsg, 'error', true);
                }
            }
        }, 'qm');
    }).end().find('._cancel').click(function () {
        $popup.dialog('close');
    });
}

/**
 * showSharingPopup
 * assignment related functions in the boxes
 */
box.showSharingPopup = function (boxId, socialNetworkId) {
    hs.statusObj.update(translation.c.LOADING, 'info');
    ajaxCall({
        type: 'GET',
        url: '/ajax/stream/get-sharable-teams',
        data: {
            socialNetworkId: socialNetworkId
        },
        success: function (data) {
            hs.statusObj.reset();
            if (data.success) {
                var params = {
                        modal: true,
                        resizable: false,
                        draggable: true,
                        closeOnEscape: true,
                        width: 500,
                        title: translation._("Share stream with team"),
                        position: ['center', 100],
                        content: StreamShareStreamPopupTemplate.render({})
                    },
                    $popup = $.dialogFactory.create('shareStreamPopup', params);

                if (darklaunch.isFeatureEnabled('NGE_18348_SHARE_SEARCH_STREAM_MIGRATION')) {
                    asyncStreamLoader('shareStreamPopup', {}).then(() => {
                        box.bindShareStreamPopupFunctionality(boxId, $popup, data)
                    })
                } else {
                    box.bindShareStreamPopupFunctionality(boxId, $popup, data)
                }
            } else {
                hs.statusObj.update(data.errorMsg, 'warning', true, 5000);
            }

        }
    }, 'q1');
};

/* Message Tagging */

box.showMessageTagPopup = function (anchor) {
    var $anchor = $(anchor);
    var externalUserId, externalMsgId, boxId;

    externalUserId = $anchor.attr('externaluserid');
    externalMsgId = $anchor.attr('externalpostid');
    boxId = $anchor.closest('._box').attr('data-boxid');

    var callback = function () {
        var messageData = {
            externalMessageId: externalMsgId,
            externalUserId: externalUserId,
            boxId: boxId,
            productArea: 'streams'
        };
        streamsFlux.getActions(MESSAGE).addMessageTag(messageData, 'q1').then(function (data) {
            hs.bubblePopup.setContent(data.output);
            //add events to the popup content
            box.initializeMessageTagPopup(data.organizations);
        });
    };

    hs.bubblePopup.open($anchor, null, null, callback);

};

box.initializeMessageTagPopup = function (organizations) {
    var $html = $('#messageTagPopup');

    //get the organization data that we will use
    var orgDropdownData = [];
    $.each(organizations, function (i, v) {
        orgDropdownData.push(v);
    });

    //if there is only one organization, then we don't need to initialize the org picker drop down at all
    var $orgDropdownList = null;
    if (orgDropdownData.length == 1) {
        $html.find('._orgId').val(orgDropdownData[0].organizationId).end() //change the input value for orgId
            .find('._tagInputContainer').show().end()// show the input field for message tags
            .find('._submitAddMessageTagForm').removeClass('disabled');// enable the add button

        //trigger a call to get the message tag list
        box.messageTag.createTagSelector($html);
    } else if (orgDropdownData.length > 1) {
        //show the org picker
        $html.find('._orgPickerContainer').show();

        $orgDropdownList = new hs.DropdownList({
            data: {items: orgDropdownData},
            adapter: {title: 'name'},
            change: function (element, _event) {
                //clear the input field when we switch orgs, only if there was not default data
                if ($html.find('._hasDefaultData').length) {
                    //the first time we open up the window, we do not want a change in org to remove inputs.
                    //however, we want all subsequent changes to remove inputs.
                    $html.find('._hasDefaultData').remove();
                } else {
                    $html.find('input[name="messageTags"]').val('');
                }

                $html.find('._orgPickerContainer ._orgPicker ._dropDownTxt').text(element.name).end() //change the display text
                    .find('._orgId').val(element.organizationId); //change the input value for orgId

                box.messageTag.createTagSelector($html);
                //enable the add button
                $html.find('._submitAddMessageTagForm').removeClass('disabled');
            }
        });

        $html.find('._orgPicker').bind('click', function () {
            $orgDropdownList.hsDropdownList('open', $html.find('._orgPicker'));
        });

        var handleFocus = (event) => {
            if (event.originalEvent.code === 'Space' || event.originalEvent.code === "Enter") {
                $orgDropdownList.hsDropdownList('open', $html.find('._orgPicker'));
            }
        }
        $html.find('._orgPicker').bind('keydown',handleFocus);

        //check if there is default data, if there is then load the correct org
        if ($html.find('._hasDefaultData').length) {
            $orgDropdownList.hsDropdownList('selectElement', $html.find('._hasDefaultData').attr('orgId'), 'organizationId');
        }
    }

    //add in the button controls for cancel and submit
    $html.find('._cancel').click(function () {
        hs.bubblePopup.close();
        trackerDatalab.trackCustom('web.dashboard.message_tagging_inbound.add_tags_popup', 'message_tagging_inbound_add_tags_popup_closed');
    }).end()
        .find('._submitAddMessageTagForm').click(function () {
        if ($(this).is('.disabled')) {
            return false;
        }

        //find out what the currently selected tags are, and update the input with them
        var currentTags = $html.find('._tagWidgetContainer').hsTagSelector('tags');

        var tagIds = [];
        $.each(currentTags, function (i, v) {
            tagIds.push(v.value);
        });

        tagIds = _.values(tagIds).length ? JSON.stringify(tagIds) : '';
        $html.find('input[name="messageTags"]').val(tagIds);

        //serialize the data to submit

        var tagData = util.serializeObject($html.find('#addMessageTagForm'));
        if (tagData.assignmentId) {
            hootbus.emit('message:tag:add:popup:close', tagData);
            return;
        }
        streamsFlux.getActions(MESSAGE).saveMessageTag(tagData, 'qm').then(function (data) {
            if (data.success) {
                hs.statusObj.update(translation._("Message Tags have been updated"), 'info', true);
                trackerDatalab.trackCustom('web.dashboard.message_tagging_inbound.add_tags_popup', 'message_tagging_inbound_message_tagged');
            } else {
                hs.statusObj.update(translation._("Unable to tag the message", "error", true));
            }

            hs.bubblePopup.close();
        });
    });
};

box.messageTag = {};
box.messageTag.createTagSelector = function ($popup) {
    var orgId = $popup.find('._orgId').val();

    var messageData = {
        orgId: orgId
    };
    streamsFlux.getActions(MESSAGE).getMessageTag(messageData, 'qm').then(function (data) {
        trackerDatalab.trackCustom('web.dashboard.message_tagging_inbound.add_tags_popup', 'message_tagging_inbound_organization_selected');

        if (data.tags) {
            var $tagWidgetContainer = $popup.find('._tagWidgetContainer');

            // need tag.value set to tag.id for the message_tag_list_dropdown.ejs template to work properly
            data.tags.forEach(function (tag) {
                if (tag.id && tag.name) {
                    tag.value = tag.id;
                    tag.label = tag.name;
                }
            });

            //create the tag selector
            $tagWidgetContainer.hsTagSelector({
                tags: data.tags,
                canCreate: data.isManageTags,
                canDelete: data.isManageTags,
                create: tagListCreateFunction,
                src: 'streams'
            });

            //check if we should have some preset values in the tag selector
            var messageTagVal = $popup.find('input[name="messageTags"]').val();
            if (messageTagVal) {
                var tags = JSON.parse(messageTagVal);
                $tagWidgetContainer.hsTagSelector('addTags', tags, 'value');
            }

            $popup.find('._tagInputContainer').show(); //show the input field for message tags
            keepOnScreenMessageTagPopup();
        }
    });

    var keepOnScreenMessageTagPopup = function () {
        var $bubblePopPane = $('#bubblePopPane');
        if (!$bubblePopPane.length) {
            return;
        }

        var left = parseInt($bubblePopPane.css('left'));
        var top = parseInt($bubblePopPane.css('top'));

        var bubblePopPaneHeight = $bubblePopPane.outerHeight();
        var bubblePopPaneWidth = $bubblePopPane.outerWidth();

        var $window = $(window);
        var windowHeight = $window.height();
        var windowWidth = $window.width();

        var minLeft = 0;
        var maxLeft = windowWidth - bubblePopPaneWidth;

        if (left < minLeft) {
            left = minLeft;
        } else if (left > maxLeft) {
            left = maxLeft;
        }

        var minTop = 0;
        var maxTop = windowHeight - bubblePopPaneHeight;

        if (top < minTop) {
            top = minTop;
        } else if (top > maxTop) {
            top = maxTop;
        }

        $bubblePopPane.css({
            left: left,
            top: top
        });

    };

    var tagListCreateFunction = function (tag, createCallback) {
        var orgId = $popup.find('._orgId').val();

        var tagData = {
            tagName: tag,
            orgId: orgId
        };
        streamsFlux.getActions(MESSAGE).createMessageTag(tagData, 'qm').then(function (data) {
            if (data && data.tag) {
                if (data.tag.id && data.tag.name) {
                    data.tag.value = data.tag.id;
                    data.tag.label = data.tag.name;
                }
                trackerDatalab.trackCustom('web.dashboard.message_tagging_inbound.add_tags_popup', 'message_tagging_inbound_tag_created');
                createCallback(data.tag);
            }
        });
    };
};
/* End Message Tagging */

box.showPromotedMessage = function (divId) {
    if (!divId) {
        return;
    }
    var $message = $('#' + divId);
    $message.addClass('promoted');
};

/**
 * updateRespondedMessage
 */
box.updateRespondedMessage = function (messageId, responseData) {

    var formattedMessageId = box.formatMessageIdForHtml(messageId).replace(/(\$)/g, "\\$1");

    var $messageDivs = $("div[id$=_" + formattedMessageId + "], div[commentid$=" + formattedMessageId + "]");
    if (!$messageDivs.length) {
        return false;
    }

    var $message = $messageDivs.filter("._message, ._comment"),
        $response = $messageDivs.filter("._response"),
        isInAssignmentView = !!$messageDivs.closest('._assignmentMessage').length;

    if (!isInAssignmentView) {
        if ($response.length) {
            // already responded?  remove old
            $response.remove();
        }
        var responseHtml = box.generateResponseHtml(responseData);
        $message.addClass("hasResponse _hasResponse").before(responseHtml);
        window.updateRelativeTimes($message.prev());
    }

    return true;
};

/**
 * toggleFilter
 */
box.toggleFilter = function (boxId, filters) {
    var $box = $("#box" + boxId),
        $boxFilter = $box.find("._boxFilter"),
        $followersSlider = $boxFilter.find("._followersRangeSlider"),
        thisToggleFilter = box.toggleFilter,
        fnResetFilter = function () {
            $boxFilter.find("._values :input").each(function () {
                $(this).val('');
            });
            if ($followersSlider.length) {
                $followersSlider.slider("value", 0);
            }

            window.stream.stream.removeFilter(boxId);	// clear
        };


    if ($boxFilter.is(":visible")) {
        $boxFilter.hide();
        fnResetFilter();
        window.stream.stream.resetFilter(boxId);
        window.stream.stream.saveFilters(boxId);
    } else {
        fnResetFilter();

        $box.find("._body").scrollTop(0);	// back to top
        if ($followersSlider.length) {
            $followersSlider.slider({
                max: 5000,
                min: 0,
                value: 0,
                slide: function (event, ui) {
                    var text = ui.value;
                    if (ui.value === 5000) {
                        text = '5000+';
                    } else {
                        text = (ui.value - (ui.value % 250)) + '+';
                    }
                    $(ui.handle).closest('._followers').find('input').val(text).trigger('keyup');
                }
            });
        }

        // init
        $boxFilter
            .show()
            .find(':input').unbind();
        $boxFilter.find('select._filters').bind('change', function () {
            var value = $(this).val();

            if (!$boxFilter.find("._" + value).length) {
                $(this).val("keyword");	// reset back to keyword
                return;
            }

            $boxFilter
                .find("._values > span").hide().end()
                .find("._" + value).show().find(':input').focus();

            if (value === 'followers') {
                $followersSlider.show();
            }

            fnResetFilter();
            window.stream.stream.saveFilters(boxId);
        });
        $boxFilter.find('._values :input').bind('keyup', function () {
            // do search
            if (thisToggleFilter.r_timeout) {
                clearTimeout(thisToggleFilter.r_timeout);
            }
            thisToggleFilter.r_timeout = setTimeout(function () {
                window.stream.stream.applyFilter(boxId);
                window.stream.stream.saveFilters(boxId);
            }, 500);
        }).end()
            .find('._values span:visible :input').focus();

        if (!_.isEmpty(filters)) {
            var filterType = '';

            if (filters.followers && $followersSlider.length) {
                filterType = 'followers';

                _.defer(function () {
                    $followersSlider.slider('option', 'value', parseInt(filters.followers, 10));
                });
            }

            if (filters.keyword) {
                filterType = 'keyword';
            }

            $boxFilter
                .find('select._filters')
                .val(filterType)
                .trigger('change');

            $boxFilter
                .find("._values :input")
                .each(function () {
                    if (filterType === 'followers') {
                        $(this).val(filters[filterType] + '+');
                    } else {
                        $(this).val(filters[filterType]);
                    }
                });

            window.stream.stream.applyFilter(boxId);
        }
    }
};


/**
 * return message id from message division id
 */
box.parseMessageId = function (messageDivId) {
    var $messageDiv = $('#' + messageDivId.replace(/(\$)/g, "\\$1"));
    if ($messageDiv.length && $messageDiv.attr('externalpostid')) {
        return $messageDiv.attr('externalpostid');		// the externalpostid is really the same thing
    }
    // the id starts from second underscore, but some id's only have 1 underscore
    var firstUnderscoreIndex = messageDivId.indexOf('_'),
        secondUnderscoreIndex = messageDivId.indexOf('_', firstUnderscoreIndex + 1),
        index = secondUnderscoreIndex,
        id;

    if (secondUnderscoreIndex < 0) {
        index = firstUnderscoreIndex;
    }
    id = messageDivId.substr(index + 1);

    // special check for promoted tweets (and other random ids)
    // id is in the form of <message_id>-<random_number>
    var parts = id.split('-');
    id = parts[0];	// first part is our message_id

    return id;
};

/**
 * conversationPopupMessageOptionsButtonHandler
 *
 * Mostly a duplication of box.messageOptionsButtonHandler though it was necessary
 * to split this for the purposes of the Facebook conversation popup to not rely on
 * the JS box class data that is initialized for each stream. Previously, the popup used
 * box data to fulfill the actions below, but it was causing bug NGE-17486.
 */
box.conversationPopupMessageOptionsButtonHandler = function (el, $messageDiv) {
    var $el = $(el), socialNetworkType = 'FACEBOOK'

    if ($el.hasClass('_more')) {
        var $menu = $el.closest('._conversationPopupOptions').find('._moreMenu');
        if ($menu.is(":visible")) {
            $menu.hide();
        } else {
            // reset margin top
            $menu.css('margin-top', '').show();	//.fadeIn('fast');

            // make sure this box can't disappear beneath the window
            var menuHeight = $menu.outerHeight(),
              menuTop = $menu.offset().top,
              windowHeight = $(window).height();

            if (menuTop + menuHeight > (windowHeight - 10)) {
                $menu.css('margin-top', (menuTop + menuHeight - windowHeight + 10) * -1 + 'px');
            }

        }
    }
    else if ($el.hasClass('_sendToEmail')) {
        var replyToUsername = $messageDiv.find('._username').eq(0).attr('title');
        var originalText = $.trim($messageDiv.find('._baseTweetText').text().replace(/\s+/g, " "));
        var attachmentLink = $messageDiv.find('._postAttachment ._attachmentItem').attr('href') ||
          $messageDiv.find('._postAttachment .attachedLink').attr('href') ||
          '';
        var attachmentLinkTitle = $.trim($messageDiv.find('._postAttachment ._postAttachmentTitle').text().replace(/\s+/g, " ")) || '';
        var attachmentText = $.trim($messageDiv.find('._postAttachment p').text().replace(/\s+/g, " ")) || '';
        var permalink = $messageDiv.find('.date').attr('href') || $messageDiv.find('._postTime').attr('href');

        box.sendToEmail(originalText, permalink, socialNetworkType, replyToUsername, {
            link: attachmentLink,
            linkTitle: attachmentLinkTitle,
            text: attachmentText
        });
    }
    else if ($el.hasClass('_addMessageTags')) {
        box.showMessageTagPopup($messageDiv);
    }

    return false;
}


/**
 * messageOptionsButtonHandler
 */
box.messageOptionsButtonHandler = function (el, $messageDiv) {
    // For legacy reasons.
    if (typeof $messageDiv == 'string') {
        $messageDiv = $('#' + $messageDiv);
    }
    var messageDivId = $messageDiv.attr('id'),
        messageId = box.parseMessageId(messageDivId),
        $el = $(el),
        $box = $messageDiv.closest('._box'),	//the box id current message button is clicked within
        boxType = $box.box('get', 'type'),		//$box.children("input[name='type']").val();
    //isShared = $box.box('get', 'isShared'),	//$box.children("input._isShared").val();
        isAssignable = $box.box('get', 'isAssignable'),
        ptwImpressionId = $messageDiv.data('impressionId'),
        boxData = ($box.data() || {}),
        assignmentTeamId = $messageDiv.prev('._assignment').data('teamid') || null,
        replyToUsername,
        socialNetworkType = (boxData.box && boxData.box.socialNetworkType ? boxData.box.socialNetworkType : null)

    // newActionTweet needs context for if the action is actually coming from twitter
    var isTwitter = $messageDiv.find('._username._twitter').length;
    var socialNetworkContext = isTwitter ? 'TWITTER' : undefined;

    //find socialNetworkId bottom-up, from current message division to box division
    //columns like Search/Brand won't have socialNetworkId, columns like HOME, DM have one single socialNetworkId
    //on the column level. columns like cobo streams will have socialNetworkId per message level

    var socialNetworkId = $messageDiv.data('socialNetworkId') || $box.box('get', 'socialNetworkId');
    if (!socialNetworkId && $messageDiv.closest(document.documentElement).length) {
        socialNetworkId = $messageDiv.siblings('.message-original').data('socialNetworkId');
    }

    var text = '';
    var messageData = {};
    var $userInfo;
    var userName;
    var userId;
    var latestNoteDate;
    var originalText;

    if ($el.is('._retweet, ._reply, ._dm, ._replyAll, ._sendToEmail')) {
        replyToUsername = $messageDiv.find('._username').eq(0).attr('title');

        // for RT, reply, dm, or Reply all, init a TeamResponse
        if ((isAssignable == '1' || isAssignable) && $el.is('._reply, ._dm, ._replyAll')) {

            teamResponse.init(assignmentTeamId, socialNetworkType, messageId, replyToUsername);

            /*
             * if the column is shared, check the current message to see if there are any assignment updates
             */
            var assignmentUpdateCallback = function (data) {
                var warningMsg = null;

                $.each(data.assignments, function (i, assignment) {
                    if (assignment.notes.length) {
                        warningMsg = translation._("There was a change in assignment for this message: ") + assignment.notes[0].systemNote;		// @TODO: better message
                    }
                    return false;	// just do the first one
                });
                $.each(data.responses, function (i, response) {
                    if (response.responseMemberName) {
                        warningMsg = translation._("This message has been responded to by ") + response.responseMemberName;		// @TODO: better message
                    }
                    return false;	// just do the first one
                });
                if (warningMsg) {
                    hs.statusObj.update(warningMsg, 'warning', true);
                }
            };
            latestNoteDate = null;
            if ($messageDiv.is("._hasAssignment")) {
                latestNoteDate = $messageDiv.prev("._assignment").find("._latestNoteDate").val();
            }
            window.assignment.checkMessagesForAssignment('', socialNetworkType, [messageId], assignmentUpdateCallback, latestNoteDate);
            ////////////// end check current message for assignment updates
        }
    }

    if ($el.hasClass('_retweet')) {
        // DC-new retweets:  check pref variable
        var fnOldTwitterRetweet = function () {
            if (socialNetworkType == 'TWITTER') {
                if (!socialNetworkId) {
                    var keys = _.keys(hs.socialNetworksKeyedByType[socialNetworkType]);
                    if (keys.length > 0) {
                        socialNetworkId = hs.socialNetworksKeyedByType[socialNetworkType][keys[0]].socialNetworkId;
                    } else {
                        hs.statusObj.update(translation._("No valid Twitter profiles to retweet from"), 'error', true);
                        return;
                    }
                }

                // Ajax call to get tweet we want to old style retweet
                var reqData = 'socialNetworkId=' + socialNetworkId + '&messageId=' + messageId;
                ajaxCall({
                    type: "POST",
                    url: "/ajax/network/get-message",
                    data: reqData,
                    success: function (data) {
                        if (data.success == '1') {
                            const standardizedMessage = data.viewData.message
                            var text = '';

                            switch (socialNetworkType) {
                                case 'TWITTER':
                                    text = text + 'RT @' + standardizedMessage.author.name + ': ';
                                    break;
                            }

                            text = text + $.trim(standardizedMessage.text.replace(/<&#91;^>&#93;*>/g, "")) + hs.memberAutoInitial + ' ';

                            window.newActionTweet(socialNetworkId, text, '', '', undefined, undefined, undefined, socialNetworkContext);
                        } else {
                            // error getting tweet
                            hs.statusObj.update(data.error, 'error', true);
                        }
                    },
                    error: function () {
                        hs.statusObj.update(translation.c.ERROR_GENERIC, 'error', true);
                    }
                }, 'qm');
            } else {
                var $baseTweet = $messageDiv.find('._baseTweetText').clone(),
                    text;
                $baseTweet.find("a:not(._previewLink, ._bubblePopup, ._userInfoPopup, ._quickSearchPopup)").each(function () {
                    if ($(this).attr("href").indexOf("http://t.co/") === 0 && $(this).text().indexOf("ow.ly/") !== 0) {
                        $(this).text($(this).attr("href"));
                    }
                });
                var textwn = $('<p>').html($baseTweet.html().replace(/<br>|<br\/>/g, '\n')).text();
                text = $.trim(textwn.replace(/<&#91;^>&#93;*>/g, ""));
                $baseTweet.find('a:not(._bubblePopup, ._userInfoPopup)').each(function () {
                    var anchorText = $(this).text();
                    if (!(/^(http:\/\/|https:\/\/|#|@)/.test(anchorText))) {
                        text = text.replace(anchorText, 'http://' + $(this).text());
                    }
                });
                if ($messageDiv.data('attachedMediaUrl')) {
                    text = text + " " + $messageDiv.data('attachedMediaUrl');
                }
                text = replyToUsername + ': ' + text + hs.memberAutoInitial + ' ';

                window.newActionTweet(socialNetworkId, text, '', '', '', undefined, undefined, undefined, socialNetworkContext);
            }
            var origin = 'web.dashboard.streams';
            var action = 'streams_message_retweet';
            var eventDetails = {
                actionType: 'edit',
                streamStyle: 'old'
            };
            trackerDatalab.trackCustom(origin, action, eventDetails);
        };
        var fnNewTwitterRetweet = function (messageId) {
            if (!socialNetworkId) {
                var keys = _.keys(hs.socialNetworksKeyedByType['TWITTER']);
                if (keys.length > 0) {
                    socialNetworkId = hs.socialNetworksKeyedByType['TWITTER'][keys[0]].socialNetworkId;
                } else {
                    hs.statusObj.update(translation._("No valid Twitter profiles to retweet from"), 'error', true);
                    return;
                }
            }

            // Ajax call to get tweet we want to old style retweet
            var reqData = 'socialNetworkId=' + socialNetworkId + '&messageId=' + messageId;
            ajaxCall({
                type: "POST",
                url: "/ajax/network/get-message",
                data: reqData,
                success: function (data) {
                    if (data.success == '1') {
                        const standardizedMessage = data.viewData.message

                        // Old style retweet
                        var text = 'RT @' + standardizedMessage.author.name + ': ' + standardizedMessage.text.replace(/<&#91;^>&#93;*>/g, "") + hs.memberAutoInitial + ' ';
                        window.newActionTweet(socialNetworkId, text, '', '', undefined, undefined, undefined, undefined, socialNetworkContext);
                    } else {
                        // error getting tweet
                        hs.statusObj.update(data.error, 'error', true);
                    }
                },
                error: function () {
                    hs.statusObj.update(translation.c.ERROR_GENERIC, 'error', true);
                }
            }, 'qm');
        };
        var fnTwitterQuote = function () {
            const permalink = $messageDiv.find("._postTime").attr("href");

            if (darklaunch.isFeatureEnabled('NGE_19820_LEGACY_COMPOSE_DEPRECATION')) {
                const params = {
                    messageText: permalink,
                    socialNetworkId
                };
                hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, params);
            } else {
                const oldPermalink = ' ' + permalink;
                window.newActionTweet(socialNetworkId, oldPermalink, '', '', '', false, false, true, socialNetworkContext);
            }

            var origin = 'web.dashboard.streams';
            var action = 'streams_message_retweet';
            var eventDetails = {
                actionType: 'quote',
                streamStyle: 'old'
            };
            trackerDatalab.trackCustom(origin, action, eventDetails);
        };

        if (hs.prefs.isNewRetweet) {
            streamsFlux.getActions(MESSAGE).retweetMessage({
                anchor: $el,
                socialNetworkId: socialNetworkId,
                messageId: messageId,
                impressionId: ptwImpressionId,
                fnOldRetweet: fnOldTwitterRetweet,
                fnNewRetweet: fnNewTwitterRetweet,
                fnTwitterQuote: fnTwitterQuote
            });
        } else {
            fnOldTwitterRetweet();
        }
        if ($messageDiv.data('advertiserName')) {
            hs.trackEvent('PromoTweets' + (boxType == 'HOME' ? 'Home' : ''), (hs.prefs.isNewRetweet ? 'retweet_new' : 'retweet_old'), $messageDiv.data('advertiserName') + ' | @' + $messageDiv.data('advertiserScreenName'));
        }
    }
    else if ($el.hasClass('_reply')) {
        text = '@' + replyToUsername + hs.memberAutoInitial + ' ';
        messageData = {
            socialNetworkId: socialNetworkId,
            socialNetworkType: socialNetworkType,
            text: text,
            id: messageId,
            replyToUserName: replyToUsername,
            teamId: assignmentTeamId
        };
        messageData.socialNetworkContext = socialNetworkContext;
        streamsFlux.getActions(MESSAGE).respondTo(messageData);
        if ($messageDiv.data('advertiserName')) {
            hs.trackEvent('PromoTweets' + (boxType == 'HOME' ? 'Home' : ''), 'reply', $messageDiv.data('advertiserName') + ' | @' + $messageDiv.data('advertiserScreenName'));
        }
    }
    else if ($el.hasClass('_dm')) {
        text = 'd ' + replyToUsername + hs.memberAutoInitial + ' ';
        messageData = {
            socialNetworkId: socialNetworkId,
            text: text
        };
        messageData.socialNetworkContext = socialNetworkContext;
        streamsFlux.getActions(MESSAGE).createDirectMessage(messageData);
    }
    else if ($el.hasClass('_fav')) {
        if (socialNetworkId && socialNetworkId > 0) {
            window.stream.network.toggleFavorite(messageDivId, socialNetworkId, ptwImpressionId);
        } else if ($el.parent().hasClass('_instagram')) {
            window.selectSocialNetworkPopup(function (selectedSocialNetworkId) {
                window.stream.network.toggleFavorite(messageDivId, selectedSocialNetworkId, ptwImpressionId);
            }, translation._('Instagram network to apply the action to:'), null, ['INSTAGRAM']);
        } else {
            window.selectSocialNetworkPopup(function (selectedSocialNetworkId) {
                window.stream.network.toggleFavorite(messageDivId, selectedSocialNetworkId, ptwImpressionId);
            }, translation._("Which Twitter network should like this tweet?"));
        }
        if ($messageDiv.data('advertiserName')) {
            hs.trackEvent('PromoTweets' + (boxType == 'HOME' ? 'Home' : ''), 'favorite', $messageDiv.data('advertiserName') + ' | @' + $messageDiv.data('advertiserScreenName'));
        }
    }
    else if ($el.hasClass('_deleteDMTweet')) {
        if (confirm(translation._("Are you sure you want to permanently delete this DM from Twitter?"))) {
            messageData = {
                messageDivId: messageDivId,
                sid: socialNetworkId
            };
            streamsFlux.getActions(MESSAGE).deleteDirectMessage(messageData);
        }
        return false;
    }
    else if ($el.hasClass('_deletePostComment')) {
        if (confirm(translation._("Are you sure you want to permanently delete this comment?"))) {
            window.stream.facebook.deleteComment(messageId, socialNetworkId, function () {
                window.fadeSlideRemove('#' + messageDivId, null, function () {
                });
            });
        }
        return false;
    }
    else if ($el.hasClass('_more')) {
        var $menu = $el.closest('._options').find('._moreMenu');
        if ($menu.is(":visible")) {
            $menu.hide();
        } else {
            if ($messageDiv.is("._isRetweet")) {
                $menu.find("._promotePost").hide();
            } else {
                $menu.find("._promotePost").show();
            }

            if (!boxType) {
                boxType = $box.children("input[name='type']").val();
            }

            window.appapi.helper.sendToAppBind(el, $messageDiv);

            // reset margin top
            $menu.css('margin-top', '').show();	//.fadeIn('fast');

            // make sure this box can't disappear beneath the window
            var menuHeight = $menu.outerHeight(),
                menuTop = $menu.offset().top,
                windowHeight = $(window).height();

            if (menuTop + menuHeight > (windowHeight - 10)) {
                $menu.css('margin-top', (menuTop + menuHeight - windowHeight + 10) * -1 + 'px');
            }

        }
    }
    else if ($el.hasClass('_replyAll')) {
        originalText = $messageDiv.find('._baseTweetText').text();

        // find if this is a mention, if it is, find the column's username so we don't add it to the list twice
        var isSelfStream = boxType && boxType.match(/home|mention/i), //!!$box.children("input[name='type']").val().match(/home|mention/i),
            selfUsername = "";
        if (isSelfStream) {
            selfUsername = $box.find("._handle .subTitle").text().replace(/[^\d\w]/g, "");	// column owner's Twitter name
        }

        // add in other user names from tweet
        var users = "";

        var re = /@([\w\d]+(\s|$))/g;
        var matches = originalText.match(re);
        var usernameMatch = '';
        if (matches && _.isArray(matches) && matches.length) {
            for (var i = 0; i < matches.length; i++) {
                usernameMatch = $.trim(matches[i].replace('@', ''));
                if ((usernameMatch.toLowerCase() != replyToUsername.toLowerCase()) && //don't add tweet owner again
                    (!isSelfStream || selfUsername != usernameMatch)) { //don't add yourself
                    users += " @" + usernameMatch;
                }
            }
        }

        text = '@' + replyToUsername + users + hs.memberAutoInitial + ' ';
        messageData = {
            socialNetworkId: socialNetworkId,
            socialNetworkType: socialNetworkType,
            text: text,
            id: messageId,
            replyToUserName: replyToUsername,
            teamId: assignmentTeamId
        };
        messageData.socialNetworkContext = socialNetworkContext;
        streamsFlux.getActions(MESSAGE).respondTo(messageData);
    } else if ($el.hasClass('_follow')) {
        $userInfo = $messageDiv.find('._userInfoDropdown');
        userName = $userInfo.attr('title');
        userId = $userInfo.attr('userid');

        if (socialNetworkType == 'INSTAGRAM') {
            window.stream.instagram.follow(userId, userName);
        }
    } else if ($el.hasClass('_unfollow')) {
        $userInfo = $messageDiv.find('._userInfoDropdown');
        userName = $userInfo.attr('title');
        userId = $userInfo.attr('userid');

        if (socialNetworkType == 'INSTAGRAM') {
            window.stream.instagram.unfollow(userId, userName);
        }
    } else if ($el.hasClass('_sendToApp')) {

        var $targetBox = $('#box' + $el.attr('boxId'));

        if ($targetBox.length > 0) {
            var $iframe = $targetBox.find('._body iframe'),
                apiKey = $iframe.attr('apikey'),
                pid = $iframe.attr('pid');
            socialNetworkType = $box.box('get', 'socialNetworkType');

            apiKey && jsapi.sendToApp(apiKey, pid, socialNetworkType + "|" + messageId, $messageDiv.find('._baseTweetText').text());
        }
    } else if ($el.hasClass('_sendToEmail')) {
        originalText = $.trim($messageDiv.find('._baseTweetText').text().replace(/\s+/g, " "));
        var attachmentLink = $messageDiv.find('._postAttachment ._attachmentItem').attr('href') ||
            $messageDiv.find('._postAttachment .attachedLink').attr('href') ||
            '';
        var attachmentLinkTitle = $.trim($messageDiv.find('._postAttachment ._postAttachmentTitle').text().replace(/\s+/g, " ")) || '';
        var attachmentText = $.trim($messageDiv.find('._postAttachment p').text().replace(/\s+/g, " ")) || '';
        var permalink = $messageDiv.find('.date').attr('href') || $messageDiv.find('._postTime').attr('href');

        box.sendToEmail(originalText, permalink, socialNetworkType, replyToUsername, {
            link: attachmentLink,
            linkTitle: attachmentLinkTitle,
            text: attachmentText
        });
    } else if ($el.hasClass('_createCommentStream')) {
        box.setupCommentsBox($messageDiv);
        $el.closest('._options').find('._moreMenu').hide();

        util.recordAction('streamFacebookCreateCommentStream');
    }
    // message menu for pending tweets
    else if ($el.hasClass('_editMessage')) {	// snmPermisssion needs to be > 0 to edit or delete
        messageData = {
            messageId: messageId,
            isGroupMode: false,
            snIds: [socialNetworkId],
            isApproval: false
        };
        streamsFlux.getActions(MESSAGE).editPendingMessage(messageData);
    }
    else if ($el.hasClass('_deletePendingMessage')) {
        messageData = {
            messageId: messageId,
            isGroupMode: false,
            snIds: [socialNetworkId]
        };
        streamsFlux.getActions(MESSAGE).deletePendingMessage(messageData);
    } else if ($el.hasClass('_addMessageTags')) {
        box.showMessageTagPopup($messageDiv);
    }

    return false;
};

/**
 * setupCommentsBox
 */
box.setupCommentsBox = function ($messageDiv) {
    $messageDiv = $($messageDiv);
    if (!$messageDiv.is('._message')) {
        $messageDiv = $messageDiv.closest('._message');
    }
    var $box = $messageDiv.closest('._box'),
        messageDivId = $messageDiv.attr("id"),
        postId = box.parseMessageId(messageDivId),
        socialNetworkId = $messageDiv.attr("snid") || $box.box('get', 'socialNetworkId'),
        tabId = $('#dashboardTabs ._tab.active').attr('id').replace(/[^\d]/g, ''),
        createBoxType = $messageDiv.closest('._messages').attr('createboxtype');

    // A kind of hacky fix to make sure we know when it is a Facebook Comment box that's being created.
    if (!createBoxType) {
        if ($messageDiv.hasClass("facebookMessage")) {
            createBoxType = 'F_COMMENTS';
        }
    }


    // Handle weird post ids here.. This should really be standardized.
    postId = $messageDiv.attr("externalpostid");

    if (postId && $messageDiv.data('nocomments') != 'true') {
        hs.statusObj.update(translation._("Loading..."), 'info');
        window.addCommentBox(postId, socialNetworkId, tabId, createBoxType);
    } else {
        alert(translation._("Cannot create a comment stream on this post."));
    }
};

/**
 * initCommentTextarea
 */
box.initCommentTextarea = function ($textareas, callback, needShift) {
    if (typeof needShift === 'undefined') {
        needShift = false;
    }
    $textareas.each(function (i, e) {
        var $textarea = $(e),
            initText = $textarea.data('placeholder'),
            $btns = $textarea.closest('._commentEntry').find('._btns'),
            $boxBody = $textarea.closest('._body');
        if (!initText) {
            return;
        }
        $textarea.val(initText).focus(function () {
                // trimming just the val was breaking in multi-byte languages, trimming both is more consistent
                if ($.trim($textarea.val()) === $.trim(initText)) {
                    $textarea.val("");
                }
            })
            .focus(function () {
                $textarea.addClass('focus');
                $btns.show();
                //handle if this is in-stream comment/reply entry or assigned FB private message which is at the bottom
                if (($textarea.closest('._inStreamCommentsBody').length === 1 ||
                    $boxBody.data('autoScrollOnFocus')) &&
                    $textarea.parent().parent().next().length === 0) {
                    $boxBody.scrollTop($boxBody.prop('scrollHeight') - $boxBody.height());
                }
            })
            .blur(function () {
                if ($.trim($textarea.val()) === "") {
                    $textarea.val(initText);
                }
                setTimeout(function () {
                    $textarea.removeClass('focus');
                    $btns.hide();
                }, 200);
            })
            .bind('keypress', function (e) {
                var key = (window.event) ? window.event.keyCode : e.which,
                    cond = function () {
                        return needShift ? (13 == key && e.shiftKey) : (13 == key);
                    };
                if (cond()) {
                    if ($.isFunction(callback)) {
                        callback($textarea);
                    }
                    return false;
                }
            });
    });
};

box.getSocialNetworkModule = function (socialNetworkType) {
    var socialNetwork;
    if (socialNetworkType === 'FACEBOOKPAGE') {
        socialNetwork = 'facebook';
    } else if (socialNetworkType === 'FACEBOOKGROUP') {
        socialNetwork = 'facebook';
    } else if (socialNetworkType === 'LINKEDINCOMPANY') {
        socialNetwork = 'linkedin';
    } else {
        socialNetwork = socialNetworkType.toLowerCase();
    }

    return socialNetwork in window.stream && window.stream[socialNetwork];
};

box.generateTemporaryCommentHtml = function ($message, text, isInline, snId) {
    var socialNetworkId = snId || $message.attr('snid');

    var userData = hs.socialNetworks[socialNetworkId];

    var commentData = {
        avatarHref: userData.avatar,
        commentId: '000',
        externalUserHref: '#',
        //externalUserId
        realname: userData.username,
        contentType: 'htmlish',
        content: _.escape(text),
        postDateText: translation._("less than a minute ago")
    };

    var ejsData = isInline ? Object.assign({}, commentData, {
        attributionTemplate: attributionTemplate
    }) : $.extend(true, {tmplData: commentData}, {
        attributionTemplate: attributionTemplate,
        tmplData: {
            lazyLoadingOff: true,
            moreMessageClasses: '_temporaryComment'
        }
    });

    return StreamStandardTemplate.render(ejsData);
};


// remove special characters from external message IDs
box.formatMessageIdForHtml = function (messageId) {
    if (!$.isFunction(messageId.replace)) {
        // not a string-y object passed in, can't do formatting
        return messageId;
    }
    if (hs.isFeatureEnabled('PLAT_13257_ENCODE_SLASHES_IN_MESSAGE_IDS')) {
        // The real problem here is lack of proper encoding. It seems that not every user of those ids
        // calls this function because originally it was only needed for facebook private messages.
        // I added encoding of slashes for app directory (app developer provided ids) but we should fix
        // this properly eventually.
        return messageId.replace(/(\.|:)/g, '_').replace('\\', '__bslash__').replace('/', '__fslash__');
    } else {
        return messageId.replace(/(\.|:)/g, '_');
    }
};

box.toggleImages = function (id, showImages, anchor, networkType, boxType) {
    var $box = $('#box' + id),
        layout = window.stream.stream.getLayout(id);

    if (showImages == null) {
        showImages = _.isBoolean(layout.showImages) ? !layout.showImages : !!layout.showImages;
    }

    var selectedLayout = showImages ? 'Text + Images' : 'Text Only';
    trackerDatalab.trackCustom('web.dashboard.streams.stream', 'layout_option_clicked', {selectedLayout: selectedLayout, networkType: networkType, boxType: boxType});

    layout.showImages = showImages;

    $box.find('._message ._close').trigger('click');

    $box.box('set', 'layout', layout);

    window.stream.stream.saveLayout(id);

    $box
        .find('._layoutOptionsGroup button')
        .removeClass('optionSelected');

    if (anchor) {
        $(anchor).addClass('optionSelected');
    }

    $box
        .toggleClass('hideImages', !showImages)
        .find('.mediaGallery')
        .removeAttr('style')
        .end()
        .find('.-messageMetadata ._imageToggle').each(function () {
            var $imageToggle = $(this);
            $imageToggle.text(translation._('Show image' + ($imageToggle.data('count') == 1 ? '' : 's')));
        })
        .end();

    hootbus.emit('streams:resize');
};

box.sendToEmail = function (originalText, permalink, socialNetworkType, replyToUsername, attachment) {
    var encodedBodyText = '';
    var subject;
    var bodyText;
    var attachmentLink = attachment.link || '';
    var attachmentLinkTitle = attachment.linkTitle || '';
    var maxMailtoLength = 1500; // mailto links have a character limit.

    subject = hs.memberName + " " + translation._("wants to share this story");

    // if the message has no content (e.g. facebook photo), use the attachment title if possible
    if (!originalText && attachmentLinkTitle.length > 0) {
        originalText = attachmentLinkTitle;
    }

    bodyText = replyToUsername + ': ' + originalText;

    if (originalText.indexOf(replyToUsername) === 0) {
        bodyText = originalText;
    }

    // add the message author's name to the message
    encodedBodyText = encodeURIComponent(bodyText) + '%0A%0A';

    // currently adding a @ before the original message author's name in the social share link only
    originalText = '@' + replyToUsername + ': "' + originalText + '"';

    // if the mailto link is too large, truncate the message body
    if ((encodedBodyText + subject).length > maxMailtoLength) {
        encodedBodyText = encodeURIComponent(window.truncate(decodeURIComponent(encodedBodyText), 500)) + '%0A%0A';
    }

    if (permalink) {
        encodedBodyText += encodeURIComponent(permalink) + '%0A%0A';
    }

    if (attachmentLink.length > 0 && !permalink) {
        encodedBodyText += encodeURIComponent(attachmentLink) + '%0A%0A';
    }

    //open the temporary window before ajax call in order to avoid popup blocker
    hs.temporaryEmailWindow = window.open(hs.util.getUrlRoot() + '/network/network-popup-preloader', '', 'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=1,width=800,height=450');

    /** If the temporary window is redirected, the timeout will never complete, and the window will remain open.
     *  If the temporary window opens an external app without redirecting, it will be closed.
     */
    hs.temporaryEmailWindow.setTimeout(function () {
        hs.temporaryEmailWindow.close();
    }, 1000);

    hs.temporaryEmailWindow.location = 'mailto:?body=' + encodedBodyText + '&subject=' + subject;

    util.recordAction('streamSocialShare', {snType: socialNetworkType});
};

hootbus.on('assignment:receive:error', function (error, assignment) {
    if (error) {
        hs.statusObj.update(error, 'error', true);
    } else {
        hs.statusObj.update(translation._("Error adding assignment, please try again"), 'error', true);
    }

    if (assignment && assignment.assignedSnMessage) {
        var apiKey = assignment.assignedSnMessage.apiKey;
        var messageId = assignment.assignedSnMessageId;

        if (apiKey && jsapi.apps) {
            _.each(jsapi.apps[apiKey], function (stream, pid) {
                if (jsapi.apps[apiKey][pid].userbound && jsapi.apps[apiKey][pid].userbound.sendassignmentupdates) {
                    var result = {};
                    result.action = 'ASSIGN';
                    result.success = 0;
                    result.errorMessage = error ? error : translation._("Error adding assignment, please try again");
                    result.messageId = messageId;
                    result.toMemberId = assignment.toMemberId;
                    result.toMemberName = assignment.toMemberName;
                    jsapi.sendAssignmentUpdates(apiKey, pid, JSON.stringify(result));
                }
            });
        }
    }
});

hootbus.on('box:delete', function (boxId) {
    if (boxId) {
      window.deleteBox(boxId);
    }
});

window.stream = window.stream || {};
window.stream.box = box;

export default box;
