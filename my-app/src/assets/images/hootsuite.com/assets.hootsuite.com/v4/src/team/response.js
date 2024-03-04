import $ from 'jquery';

function TeamResponseManager() {
    var self = this,
    // object to store a message to be responded, init with empty
        messageData = null,
    // callback function, can be null
        callback;

    this.init = function (teamId, socialNetworkType, messageId, username, paramCallback) {
        messageData = {
            "teamId": teamId,
            "socialNetworkType": socialNetworkType,
            "messageId": messageId,
            "username": username
        };

        if ($.isFunction(paramCallback)) {
            callback = paramCallback;
        } else {
            callback = null;
        }
    };

    this.check = function (messageToCheck) {
        var formattedUsername = messageData.username.toLowerCase(),
            reUsername = new RegExp(formattedUsername, "igm");

        var isResponseMade = reUsername.test(messageToCheck);

        return isResponseMade;
    };

    this.clear = function () {
        messageData = null;
    };

    this.isInitiated = function () {
        return messageData !== null;
    };

    this.getTeamId = function () {
        return messageData.teamId;
    };

    this.getMessageData = function () {
        if (self.isInitiated()) {
            return messageData;
        } else {
            return null;
        }
    };

    this.getCallback = function () {
        if (typeof callback != "function") {
            return null;
        }

        return callback;
    };

    this.setPublishedTime = function (publishedTime) {
        messageData.publishedTime = publishedTime;
    };
}

export default new TeamResponseManager();

