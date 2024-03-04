import _ from 'underscore';

var status = {};

status.isNewUser = function () {
    var accountCreatedDate = new Date(hs.memberSignupDate);
    var daysToSuppressPopups = 8;

    var newUserEndDate = accountCreatedDate.setDate(accountCreatedDate.getDate() + daysToSuppressPopups);

    return newUserEndDate > new Date();
};

status.userState = function () {
    return {
        isNewUser: status.isNewUser()
    };
};

hs.userStatus = hs.userStatus || {};
_.extend(hs.userStatus, status);

