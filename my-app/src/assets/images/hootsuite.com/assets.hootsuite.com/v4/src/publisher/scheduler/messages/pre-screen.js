import _ from 'underscore';
import schedulerUtil from 'publisher/scheduler/util';
import hsEjs from 'utils/hs_ejs';
import translation from 'utils/translation';

export default {
    nonGroupTemplate: null,
    groupTemplate: null,

    getNonGroupTemplate: function () {
        if (this.nonGroupTemplate === null) {
            this.nonGroupTemplate = hsEjs.getEjs('publisher/scheduler/nongroupedrejectedmessage');
        }
        return this.nonGroupTemplate;
    },

    getGroupTemplate: function () {
        if (this.groupTemplate === null) {
            this.groupTemplate = hsEjs.getEjs('publisher/scheduler/groupedrejectedmessage');
        }
        return this.groupTemplate;
    },

    isPending: function (preScreenObj) {
        return +preScreenObj.state === 0;
    },

    isUnapproved: function (preScreenObj) {
        return preScreenObj.state == 1;
    },

    isRejected: function (preScreenObj) {
        return preScreenObj.state == 2;
    },

    isScheduled: function (preScreenObj) {
        var isScheduled = false;
        if (preScreenObj.message) {
            isScheduled = preScreenObj.message.isScheduled ? true : false;
        }
        return isScheduled;
    },

    isExpired: function (preScreenObj, nowTimestamp) {
        var expired = false;
        if (this.isScheduled(preScreenObj) && preScreenObj.message) {
            if (typeof nowTimestamp !== "number") {
                nowTimestamp = schedulerUtil.getNow();
            }
            expired = (preScreenObj.message.sendDate < nowTimestamp);
        }
        return expired;
    },

    shouldShowActions: function (preScreenObj) {
        return (this.isRejected(preScreenObj) || this.isExpired(preScreenObj));
    },

    getMessage: function (preScreenObj) {
        return preScreenObj.message;
    },

    getBannerText: function (preScreenObj) {
        var bannerText;
        if (this.isExpired(preScreenObj)) {
            bannerText = translation._("Expired");
        } else if (this.isUnapproved(preScreenObj)) {
            bannerText = translation._("Unapproved");
        } else if (this.isRejected(preScreenObj)) {
            bannerText = schedulerUtil.isInListView() ? "" : translation._("Rejected");
        }
        return bannerText;
    },

    renderGroup: function (groupHash, group) {

        var firstPreScreen = group.messages[0];

        var params = {
            groupHash: groupHash,
            group: group,
            firstMsg: this.getMessage(firstPreScreen),
            firstPreScreen: firstPreScreen,
            isScheduled: this.isScheduled(firstPreScreen),
            showActions: this.shouldShowActions(firstPreScreen),
            bannerText: this.getBannerText(firstPreScreen),
            expired: this.isExpired(firstPreScreen)
        };

        return this.getGroupTemplate().render(params);
    },

    renderNonGroup: function (preScreen) {
        var params = {
            message: this.getMessage(preScreen),
            preScreen: preScreen,
            isScheduled: this.isScheduled(preScreen),
            showActions: this.shouldShowActions(preScreen),
            bannerText: this.getBannerText(preScreen),
            expired: false
        };
        return this.getNonGroupTemplate().render(params);
    },

    getCalendarViewData: function (preScreen) {
        if (_.isObject(preScreen) && preScreen != null) {
            return {
                isPreScreen: true,
                showActions: this.shouldShowActions(preScreen),
                bannerText: this.getBannerText(preScreen)
            };
        } else {
            return {};
        }

    }

};


