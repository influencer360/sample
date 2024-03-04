import streamsFlux from 'hs-app-streams/lib/stores/flux';
import { MESSAGE_LIST } from 'hs-app-streams/lib/actions/types';
import hootbus from 'utils/hootbus';
import hsEvents from 'hs-events';
import translation from 'utils/translation';

export default {
    /**
     * Persist box data
     *
     * @param data
     * @returns {Promise}
     */
    save: function (data) {
        return ajaxCall({
            url: "/ajax/stream/save-box",
            data: data
        }, 'q1').then(function (data) {
            if (data && data.boxData) {
                streamsFlux.getActions(MESSAGE_LIST).saveMessageListContext(data.boxData);
            }
        });
    },

    saveTwitterSearchStream: function (title, terms, snId, tabName) {
        var boxData;
        title = title || '';

        tabName = tabName || translation._('New Tab');

        this.createNewTab(tabName).then(function (data) {
            var newTabId = data.tabId;
            boxData = {
                saveTitle: 1,
                box: {
                    tabId: newTabId,
                    terms: terms,
                    socialNetworkId: snId,
                    title: title,
                    type: 'SEARCH'
                }
            };
            this.save(boxData).then(function (streamData) {
                hootbus.emit(hsEvents.NEW_STREAM_ADDED, streamData);
            });
        }.bind(this));
    },

    createNewTab: function (tabName) {
        tabName = tabName || translation._('New Tab');

        return ajaxCall({
            url: "/ajax/stream/add-tab",
            data: {
                refreshInterval: 10,
                title: tabName
            }
        }, 'q1');
    }
};
