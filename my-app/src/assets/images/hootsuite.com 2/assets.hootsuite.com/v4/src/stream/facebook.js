import $ from 'jquery';
import _ from 'underscore';
import translation from 'utils/translation';
import 'utils/ajax';
import 'utils/util';
import 'stream/stream';
var facebook = {};
import contextHeaders from './constants/context-headers';
import hsEjs from 'utils/hs_ejs';
import trackerDatalab from 'utils/tracker-datalab';
import { formatDate } from 'utils/string';

/**
 * Json Key for post
 * @constant
 */
facebook.POST_KEY = 'post';

/**
 * submit Private Message/Inbox Reply
 */
facebook.submitReply = function ($commentEntry, boxType, postId, socialNetworkId) {
    var $textarea = $commentEntry.find("textarea._commentEntryArea"),
        $message = ($commentEntry.closest('._message').length) ? $commentEntry.closest('._message') : $($commentEntry.parent().parent().find('._message')[0]),
        $originalMessage = $message,
        $box = $message.closest("._box"),
        commentTxt,
        $temporaryComment = [],
        recipientId = $message.attr('recipientId'),
        fnRemoveTemporaryComment = function () {
            if ($temporaryComment.length) {
                $temporaryComment.remove();
            }
        };
    //if no box then this may be assignments popup view - try that
    if ($box.length === 0) {
        $box = $message.closest("#commentsPopup");
    }
    postId = postId || window.stream.box.parseMessageId($message.attr('id'));
    socialNetworkId = socialNetworkId || $box.data('socialNetworkId') || $message.data('socialNetworkId') || $box.data('box').get('socialNetworkId');
    recipientId = recipientId.split('|')[1];

    $textarea.focus();	// fire focus event, to get rid of any initial text
    commentTxt = $.trim($textarea.val());
    $textarea.blur();
    if (commentTxt.length === 0) {
        hs.statusObj.update(translation._("Please enter a message"), 'warning', true);
        return false;
    } else if (commentTxt.length > 2000) {
        hs.statusObj.update(translation._("Facebook allows a maximum of 2000 characters in private messages"), 'error', true);
        return false;
    }

    var temporaryCommentHtml = window.stream.box.generateTemporaryCommentHtml($originalMessage, commentTxt, false, socialNetworkId);
    $temporaryComment = $(temporaryCommentHtml).find('._deletePostComment').remove().end();

    var headers = {};
    headers[contextHeaders.PLATFORM_HEADER_KEY] = contextHeaders.PLATFORM_HEADER_WEB;
    headers[contextHeaders.PRODUCT_HEADER_KEY] = contextHeaders.PRODUCT_HEADER_STREAMS;

    ajaxCall({
        headers: headers,
        url: "/ajax/facebook/add-conversation-reply",
        data: "postId=" + postId +
            "&socialNetworkId=" + socialNetworkId +
            "&comment=" + encodeURIComponent(commentTxt) +
            "&recipientId=" + recipientId +
            "&boxType=" + boxType,
        beforeSend: function () {
            hs.statusObj.update(translation._("Submitting message to Facebook..."), 'info');
        },
        success: function (data) {
            if (data.result == 1) {
                $temporaryComment.attr("id", "post_" + $box.data("boxid") + "_" + data.messageId.replace(/[.:]/g, "_"));
                $temporaryComment.attr("externalpostid", data.messageId);
                $temporaryComment.attr("externalthreadid", data.conversationId);
                if (data.externalUserId) {
                    $temporaryComment.attr("externaluserid", "page|" + data.externalUserId);
                }
                $temporaryComment.attr("snid", data.snId);
                $temporaryComment.addClass("facebookMessage");
                $temporaryComment.insertBefore($box.find('._commentEntryBeneath'));
                hs.statusObj.reset();
                // reset textarea
                $textarea.val('');
                //remove 'no responses yet' message
                $box.find("div._inStreamCommentsBody div._message-none").remove();

                trackerDatalab.trackCustom('web.dashboard.streams.message', 'stream_user_clicked_send_message',
                    {socialNetworkId: data.snId, socialNetworkType: 'FACEBOOKPAGE',
                        boxType: boxType, message_type: 'PRIVATE_MESSAGE'});
            }
            else if (data.error) {
                if (!_.has(data.error, 'message')) {
                    data.error.message = "An error occurred, please try again later";
                }
                hs.statusObj.update(translation._(data.error.message), 'error', true);
            }
            else {
                fnRemoveTemporaryComment();
                hs.statusObj.update(translation._("There was a problem submitting your message to Facebook. Please wait for a minute and try again."), 'error', true);
            }
            return false;
        },
        error: function (data) {
            fnRemoveTemporaryComment();
            hs.util.keepErrorMessageVisible(data);
        },
        abort: function () {
            fnRemoveTemporaryComment();
            hs.statusObj.reset();
        }
    }, 'q1');
    return false;
};


/**
 * deleteComment
 * @function
 */
facebook.deleteComment = window.stream.stream.deleteCommentGenerator('facebook');

/**
 * initCommentTextarea
 */
facebook.initCommentTextarea = function ($textareas) {
    window.stream.box.initCommentTextarea($textareas, null, true);
};

/**
 * getCorrectPostId
 */
facebook.getCorrectPostId = function (postId, storyId) {
    if (storyId && !isNaN(+storyId)) {
        return postId.split('_')[0] + '_' + storyId;
    }
    return postId;
};

/**
 *
 * @todo : should be private
 */
facebook.getStoryId = function (post) {
    if (!post || !post.permalink) {
        return "";
    }

    if (post.id && post.uid && post.id.indexOf(post.uid) === 0) {
        return "";
    }

    var match = post.permalink.match(/story_fbid=(\d+)/i) || post.permalink.match(/\?view=permalink&id=(\d+)/i);
    if (!match) {
        if (post.permalink.indexOf('.php') > -1) {
            var matchVideoOrPhoto = post.permalink.match(/video\.php\?v=(\d+)/i) || post.permalink.match(/photo\.php\?fbid=(\d+)/i);
            if (matchVideoOrPhoto) {
                return matchVideoOrPhoto[1];
            } else {
                return "";
            }
        }
        return post.permalink.substring(post.permalink.lastIndexOf('/') + 1);
    }
    return match[1];
};


/**
 * massageMessageDatum
 */
facebook.massageMessageDatum = function (post, data, isWithinReplyWindow) {

    //here start rendering attachment and its media
    var canBeShared = false;
    if (_.has(post, "attachment") && post.attachment) {
        var attachment = post.attachment;
        /*
         * media types from facebook
         *
         * video
         * event
         * photo
         * album
         * link ->
         *        link
         *        image
         *        video  (same as video above)
         *        music (mp3)
         */
        if (attachment.media) {
            var hasMedia = attachment.media.length > 0;
            var p = {};

            if (hasMedia && attachment.media[0].type.match(/video|swf/i)) { //covers both media.type = video or fb_object_type = video
                p.isSwf = false;
                if (attachment.media[0]) {
                    p.isSwf = attachment.media[0].swf;
                    p.thumbAlt = attachment.media[0].alt;
                    if (attachment.media[0].video) {
                        p.thumbSrc = attachment.media[0].src;
                        p.videoSourceHref = attachment.media[0].video.source_url;
                        p.videoDisplayHref = attachment.media[0].video.display_url;
                    }
                    else if (attachment.media[0].swf) {
                        p.thumbSrcl = attachment.media[0].swf.preview_img;
                        p.videoSourceHref = attachment.media[0].swf.source_url;
                    }
                    else if (attachment.media[0].src) {
                        p.thumbSrc = attachment.media[0].src;
                        p.videoSourceHref = attachment.media[0].href;
                    }
                }

                post.attachmentMediaHtml = window.stream.box.generateAttachmentHtmlVideo(p);
            }
            else if (hasMedia && attachment.media[0].type == 'music') {
                post.attachmentMediaHtml = hsEjs.getEjs('stream/facebook/music').render(attachment);
            }
            else if ((hasMedia && attachment.media[0].type == 'link') || attachment.href) {
                post.attachmentMediaHtml = hsEjs.getEjs('stream/facebook/link').render(attachment);
                //canBeShared = true;
            }
            else {
                post.attachmentMediaHtml = null;
            }
        }
    }
    post.canBeShared = canBeShared;

    var messageData = null,
        storyId = facebook.getStoryId(post);

    messageData = facebook.massageMoreMessageDatum(post, data, storyId, isWithinReplyWindow);

    return messageData;
};

/**
 * massageMoreMessageDatum
 */
facebook.massageMoreMessageDatum = function (post, data, storyId, isWithinReplyWindow) {
    var dataBox = data.box,
        dataBoxType = dataBox.type,
        dataBoxSocialNetworkId = dataBox.socialNetworkId;

    // Calculate some stuff first.
    var messageId = ('commentId' in post) ? post.commentId : post.id;

    var htmlId = (typeof dataBox.boxId === "undefined") ? 'popup_' : 'post_' + dataBox.boxId + "_";
    if (messageId) {
        htmlId += messageId;
    } else if (post.eid) {
        htmlId += "eid" + post.eid;
    }
    htmlId = window.stream.box.formatMessageIdForHtml(htmlId);		// facebook private messages uses . and : which are invalid jquery characters
    var externalPostId = facebook.getCorrectPostId(messageId, storyId);
    var externalUserId = post.uid;

    // Construct massaged data.
    var massagedData = {};
    massagedData.tmplData = {};

    massagedData.tmplData.boxId = (typeof dataBox.boxId === "undefined") ? 0 : dataBox.boxId;
    massagedData.tmplData.boxType = dataBoxType;
    massagedData.tmplData.IsCommentPost = (typeof post.commentId) !== "undefined";
    massagedData.tmplData.canComment = post.canComment;
    massagedData.tmplData.hackIsCommentPost = ('F_COMMENTS' == dataBoxType);
    massagedData.tmplData.hackOriginalPostPermalink = ((data.post) ? (data.post.permalink) : ("#"));

    massagedData.tmplData.repliesCount = ((post.commentsCount && post.commentsCount > 0) ? (post.commentsCount - 1) : (0));
    massagedData.tmplData.commentsNoticeText = translation._("%d replies");
    massagedData.tmplData.commentsPopupBoxType = "F_PAGE_INBOX";
    massagedData.tmplData.commentsPopupTitle = translation._("Facebook conversation");
    massagedData.tmplData.commentsPopupAjaxUrl = "/ajax/facebook/get-conversation-messages";
    massagedData.tmplData.commentsPopupAjaxSuccessCallback = "renderFacebookConversationInstream";
    massagedData.tmplData.commentsPopupAjaxData = "postId=" + externalPostId + "&socialNetworkId=" + data.box.socialNetworkId + "&boxType=F_PAGE_INBOX&numComments=" + ((post.commentsCount) ? post.commentsCount : 0);
    massagedData.tmplData.externalThreadId = (post.fbThreadId) ? (post.fbThreadId) : messageId;
    if (post.messageId) {
        massagedData.tmplData.mostRecentPostId = window.stream.box.formatMessageIdForHtml(post.messageId);
    }

    massagedData.tmplData.htmlId = htmlId;
    massagedData.tmplData.externalUserId = (externalUserId) ? post.actorType + "|" + externalUserId : false;
    massagedData.tmplData.externalUserIdInfoLookup = externalUserId;
    massagedData.tmplData.externalPostId = externalPostId;
    massagedData.tmplData.moreMessageClasses = "facebookMessage";

    massagedData.tmplData.isNewMessage = data.isNewTweet;

    massagedData.tmplData.isCommentable = post.commentsCanPost;
    massagedData.tmplData.postPermalink = post.permalink;
    massagedData.tmplData.socialNetworkId = dataBoxSocialNetworkId;
    massagedData.tmplData.socialNetworkType = 'facebook';

    massagedData.tmplData.numLikesCodeTranslated = translation.c.NUM_LIKES_CODE;
    massagedData.tmplData.numLikes = ((post.likes) ? (post.likes.count) : (0));
    massagedData.tmplData.isLikable = true;
    massagedData.tmplData.youLiked = ((post.likes) ? (post.likes.user_likes) : (false));

    massagedData.tmplData.numComments = ((post.commentsCount) ? (post.commentsCount) : (0));
    massagedData.tmplData.commentPostId = ((typeof post.commentId !== "undefined") ? (post.commentId) : (null));

    massagedData.tmplData.targetHref = ((post.target) ? (post.target[3]) : (null));
    massagedData.tmplData.targetLabel = ((post.target) ? (post.target[1]) : (null));
    massagedData.tmplData.targetType = ((post.target) ? (post.target[4]) : (null));

    massagedData.tmplData.contentType = "text";

    massagedData.tmplData.recipientName = post.recipientName;
    massagedData.tmplData.recipientId = post.actorType + "|" + post.recipientId;
    massagedData.tmplData.recipientIdInfoLookup = post.recipientId;
    massagedData.tmplData.realname = post.name;

    massagedData.tmplData.withinReplyWindow = !!isWithinReplyWindow;

    massagedData.tmplData.postDateText = formatDate(post.createdFormatted);
    massagedData.tmplData.postTimestamp = parseInt(post.created, 10) * 1000;

    if (post.message) {
        massagedData.tmplData.content = post.message;
    } else if (post.story) {
        massagedData.tmplData.content = post.story;
    } else {
        massagedData.tmplData.content = "";
    }

    if (typeof post.attachment !== 'undefined' && post.attachment) {

        massagedData.tmplData.attachments = [
            {}
        ];
        if (typeof post.attachment.href !== 'undefined') {
            massagedData.tmplData.attachments[0].attachmentHref = post.attachment.href;
        }
        if (post.type == "link" || post.type == "video") {
            if (typeof post.attachment.name !== 'undefined') {
                massagedData.tmplData.attachments[0].attachmentTitle = post.attachment.name;
            }
            if (typeof post.attachment.caption !== 'undefined' && post.attachment.caption !== null) {
                massagedData.tmplData.attachments[0].attachmentCaption = post.attachment.caption;
            } else {
                massagedData.tmplData.attachments[0].attachmentCaption = hs.util.getHostname(post.attachment.href);
            }
            if (massagedData.tmplData.attachments[0].attachmentCaption || massagedData.tmplData.attachments[0].attachmentTitle) {
                massagedData.tmplData.attachments[0].attachmentBox = true;
            }
        }
        if (typeof post.attachment.icon !== 'undefined') {
            massagedData.tmplData.attachments[0].attachmentIconHref = post.attachment.icon;
        }


        if (_.has(post.attachment, 'images') && _.isArray(post.attachment.images)) {
            massagedData.tmplData.attachedImageCount = post.attachment.images.length;
        }

    }

    if (typeof post.attachmentMediaHtml !== 'undefined' && post.attachmentMediaHtml) {
        massagedData.tmplData.attachments[0].attachmentRenderedHtml = post.attachmentMediaHtml;
    }

    // Make sure we don't have an empty attachment! (If we do, remove it.)  I.e., make sure massagedData.tmplData.attachments does NOT have a value of [{}]
    if (massagedData.tmplData.attachments) {
        if (1 === massagedData.tmplData.attachments.length && massagedData.tmplData.attachments[0]) {
            if (_.isEmpty(massagedData.tmplData.attachments[0])) {
                delete massagedData.tmplData.attachments;
            }
        }
    }

    // Make sure if we get the junk attachment when writing to wall, that we remove it. (I.e., the attachment caption and attachment title are empty strings, and we get a HootSuite icon for the attachment icon href.)
    if (massagedData.tmplData.attachments) {
        if (post.target) {
            if (1 == massagedData.tmplData.attachments.length && massagedData.tmplData.attachments[0]) {
                if (!massagedData.tmplData.attachments[0].attachmentCaption || "" === massagedData.tmplData.attachments[0].attachmentCaption) {
                    if (!massagedData.tmplData.attachments[0].attachmentTitle || "" === massagedData.tmplData.attachments[0].attachmentTitle) {
                        delete massagedData.tmplData.attachments;
                    }
                }
            }
        }
    }

    massagedData.tmplData.hasAssignment = (typeof post.assignment !== 'undefined' && post.assignment);
    massagedData.tmplData.hasResolvedAssignment = (typeof post.assignment !== 'undefined' && post.assignment && 'RESOLVED' == post.assignment.status);
    massagedData.tmplData.hasResponse = (typeof post.response !== 'undefined' && post.response);

    massagedData.tmplData.avatarHref = (typeof post.assignment != 'undefined' && post.assignment && 'RESOLVED' == post.assignment.status);

    if (typeof post.avatar !== 'undefined') {
        massagedData.tmplData.avatarHref = post.avatar;
    } else {
        massagedData.tmplData.avatarHref = hs.util.getFbAvatarUrl(post.uid, 'square');
    }

    if (typeof post.attachment != 'undefined' && post.attachment && post.attachment.properties && post.attachment.properties.length > 0) {

        massagedData.attachmentExtraRenderedHtml = "";
        $.each(post.attachment.properties, function (i, v) {
            massagedData.attachmentExtraRenderedHtml += "<div class=\"caption\">";
            if (v.name) {
                massagedData.attachmentExtraRenderedHtml += hsEjs.cleanPage(v.name) + ": ";
            }
            if (v.href) {
                massagedData.attachmentExtraRenderedHtml += "<a href=\"" + hsEjs.cleanPage(v.href) + "\" target=\"_blank\">";
            }
            if (v.text) {
                massagedData.attachmentExtraRenderedHtml += hsEjs.cleanPage(v.text);
            }
            if (v.href) {
                massagedData.attachmentExtraRenderedHtml += "</a>";
            }
            massagedData.attachmentExtraRenderedHtml += "</div>";
        });
    }

    massagedData.commentsList = [];

    if (typeof post.commentsData !== 'undefined' && post.commentsData && post.commentsData.comment_list && post.commentsData.comment_list.length > 0) {
        $.each(post.commentsData.comment_list.reverse(), function (i, c) {
            c.socialNetworkId = dataBoxSocialNetworkId;

            var newCommentData = {
                "commentId": c.id,
                "avatarHref": (c.from_pic_square || 'https://hootsuite.com/images/src.gif'),
                "realname": c.from_name,
                "externalUserId": '|' + c.fromid,
                "externalUserHref": c.from_profile_url,
                "contentType": "text",
                "content": c.text,
                "postDateText": formatDate(c.timeFormatted),
                "user_likes": c.user_likes,
                "assignment": c.assignment
            };
            massagedData.commentsList.push(newCommentData);

        });

    }

    if ('F_ACTIVITY' == dataBoxType) {
        massagedData.tmplData.updatedFormatted = formatDate(post.updatedFormatted);
        massagedData.tmplData.updatedTime = parseInt(post.updatedTime, 10);
        massagedData.tmplData.snippet = post.snippet;

        if (typeof post.updateType != "undefined") {
            massagedData.tmplData.updateType = post.updateType;
        }

        if (!_.isUndefined(post.targetUser) && !_.isNull(post.targetUser)) {
            massagedData.tmplData.targetName = post.targetUser.name;
        }
    }

    if (_.has(post, '-_-')) {
        massagedData.tmplData['-_-'] = post['-_-'];
    }

    return massagedData;
};

facebook.generateFacebookPostPreviewHTML = function (data) {
    var facebookMessagePreviewEjsTemplate = hsEjs.getEjs('hsads/facebook/post-preview');
    return facebookMessagePreviewEjsTemplate.render({
        postInfo: data.postInfo,
        adsHtml: data.adsHtml
    });
};

facebook.commentspopup = {};

facebook.commentspopup.generateCommentsOptions = function (data) {
    var htmlOutput = "<button class='_jsTooltip _fav icon-19 unLike' title='" + translation._("Like / Unlike") + "'>&nbsp;</button>";
    // if is page
    if (data.isPage) {
        htmlOutput += " <button class='_jsTooltip _deletePostComment icon-19 close' title='" + translation._("Delete Comment") + "'>&nbsp;</button>";
    }
    return htmlOutput;
};

facebook.autocomplete = {};
facebook.autocomplete.query = _.debounce(function (type, query, callback, options) {
    var data = {
        type: type,
        query: query,
        options: options
    };

    ajaxCall({
        url: '/ajax/facebook/get-targeting',
        data: data,
        success: function (result) {
            var list = [];
            if (result && result.data && result.data.length) {
                list = _.map(result.data, function (item) {
                    return $.extend({}, item, {label: item.name});
                });
            }

            $.isFunction(callback) && callback(list);
        }
    }, 'qm');
}, 250);

window.stream = window.stream || {};
window.stream.facebook = facebook;

export default facebook;
