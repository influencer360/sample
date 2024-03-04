import 'jquery';

window.scheduler = window.scheduler || {};

var stream = {
    getMessageById: function (messageId) {
        return $('._message[id$="_' + messageId + '"]');
    },
    getItemById: function (messageId) {
        return $('div[mid="' + messageId + '"]');
    }
};


scheduler.stream = stream;

export default stream;

