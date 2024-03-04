import 'stream/stream';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
var instagram = {};

var HOOTBUS_EVENT_OPEN_COMPOSER = 'composer.open';

instagram.resharePost = function (messageData) {
    var postText = messageData.postText;
    var username = messageData.username;
    var imgSrc = messageData.src;
    var socialNetworkId = messageData.socialNetworkId;

    hs.statusObj.update(translation._("Loading..."), 'info', true, 8000);
    ajaxCall({
        url: '/ajax/scheduler/attachment-from-remote-image',
        data: {
            src: imgSrc,
            socialNetworkId: socialNetworkId
        },
        success: function (data) {
            if (username) {
                postText += " \uD83D\uDCF7: @" + username;
            }

            var attachment = {
                url: data.url,
                thumbnailUrl: data.thumbnailUrl,
                mimeType: data.mimeType,
            };

            var params = {
                attachments: [attachment],
                messageText: postText,
                socialNetworkId: socialNetworkId,
            };

            hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, params);
        },
        complete: function () {
            hs.statusObj.reset();
        }
    }, 'qm');
};

window.stream = window.stream || {};
window.stream.instagram = instagram;

export default instagram;
