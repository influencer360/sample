import _ from 'underscore';
import hootbus from 'utils/hootbus';
import Backbone from 'backbone';
import LibraryAssets from 'publisher/cols/library_assets';
import LibraryAsset from 'publisher/models/library_asset';

var ContentLibrary = Backbone.Model.extend(/** @lends ContentLibrary.prototype */{
    idAttribute: 'contentLibraryId',
    defaults: {
        name: '',
        teams: null,
        tags: []
    },
    /**
     * @type {LibraryAssets}
     */
    assets: null,

    initialize: function () {
        // Get the library asset collection
        this.assets = new LibraryAssets(null, {contentLibraryId: this.id});
        // If you set the object in defaults the same teams object is shared between instances
        this.set('teams', {});
        this.set("_searchOptions", {
            expiryFilter: "ALL",
            tags: null,
            type: "ALL",
            sortDirection: "DESC",
            sortItem: ["createdDate"],
            useBoolAndTags: true
        });
    },

    /**
     * @param {string} assetType the type of item to filter
     */
    filterAssetsByType: function (assetType) {
        if (assetType === 'ALL') {
            this.assets.resetChosen();
        } else {
            this.assets.choose(function (m) {
                return m.get('type') === assetType;
            });
        }

        this.trigger('filterBy', assetType);
    },

    addTeam: function (teamData) {
        this.attributes.teams[teamData.teamId] = teamData;
    },

    removeTeam: function (teamId) {
        delete this.attributes.teams[teamId];
    },


    deleteSelectedAssets: function () {
        var selectedAssets = this.assets.getSelectedAssets();
        this.assets.removeAssets(selectedAssets);
    },

    getSelectedAssets: function () {
        return this.assets.where({_checked: true});
    },

    parse: function (resp) {
        return resp.contentLibrary;
    },

    sync: function (method, model, options) {
        var self = this;
        var url = '/ajax/content-library/';
        var data = {
            contentLibraryId: model.id
        };

        switch (method) {
            case 'delete':
                url += 'delete';
                break;
            case 'create':
            case 'update':
                url += 'edit';
                if (model.has('teams')) {
                    data.teamIds = _.keys(model.get('teams'));
                }
                data.name = model.get('name');
                break;
            default:
                throw new Error(method + 'method not yet implemented');
        }
        var success = options.success;
        if (options.success) {
            delete options.success;
        }

        var params = {
            url: url,
            data: data,
            success: function (data, status, xhr) {
                if (data.success === 1) {
                    success.call(self, data, status, xhr);
                } else if (data.errors) {
                    hootbus.emit('contentLib:errors', data.errors);
                }
            },
            abort: function () {
                hs.statusObj.reset();
            }
        };

        return ajaxCall(_.extend(params, options), 'q1');
    },

    addAsset: function (assetData, autoSelectAfterAdd) {
        var asset = new LibraryAsset(assetData, {contentLibraryId: this.id});
        this.assets.add(asset, {prepend: true, autoSelect: autoSelectAfterAdd});
    },

    /**
     * Load the assets from server
     * @param {Object} [options]
     * @param {string} [options.tags] Array of tag ids to filter
     * @param {string} [options.type] the type of item to filter
     * @param {Boolean} [force] Old: forces a reload even if assets is empty
     * @param {Boolean} [force] New: forces paging to restart, instead of loading the next page (eg: when new asset added)
     */
    loadAssets: function (options, force) {
        options = {};
        // Fixes the case when assets was initialised before ContentLibrary is defined
        if (this.assets.contentLibraryId === -1) {
            this.assets.contentLibraryId = this.id;
        }

        if (this.assets || force) {
            // Add current filter options to the fetch
            var searchOptions = this.get("_searchOptions", {silent: true});
            options.type = searchOptions.type;
            options.tags = searchOptions.tags;

            options.data = {
                sortDirection: searchOptions.sortDirection,
                sortItem: searchOptions.sortItem,
                useBoolAndTags: searchOptions.useBoolAndTags,
                expiryFilter: searchOptions.expiryFilter, // eg: UPCOMING
            };

            // Because of paging, and because we don't know if there are assets remaining, always do a fetch
            this.assets.fetch(options, force);
            this.trigger('filterBy', options.type); // Update UI
        }
    }
});

ContentLibrary.CONTENT_TYPE_IMAGE = "IMAGE";
ContentLibrary.CONTENT_TYPE_MESSAGE = "MESSAGE";
ContentLibrary.CONTENT_TYPE_DOCUMENT = "DOCUMENT";
ContentLibrary.CONTENT_TYPE_TEXT = "TEXT";


export default ContentLibrary;
