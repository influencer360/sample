import _ from 'underscore';
import hootbus from 'utils/hootbus';
import Backbone from 'backbone';
import chosenCollectionMixin from 'utils/backbone/chosen_mixin';
import LibraryAsset from 'publisher/models/library_asset';

/**
 * @class LibraryAssets
 * @extends Backbone.Collection
 */
var LibraryAssets = Backbone.Collection.extend(/** @lends LibraryAssets.prototype */{
    model: LibraryAsset,
    url: "/ajax/content-library/asset-search",
    isLoading: false,

    // Pagination state
    lastAssetLoaded: 0, // not an index, but the nth asset
    pageSize: 50,
    _lastSearchOptions: {data: {}},
    hasLoadedAllInitialPages: false, // signals that we ran out of pages the last time we refreshed the page set

    // Cumulative State
    contentLibraryId: -1,
    totalAssets: -1, // remove once clv1 is removed, as these are only relevant to the last used page
    totalBytes: -1, // remove once clv1 is removed


    getDefaultFetchData: function () {
        return {
            from: this.lastAssetLoaded,
            to: this.lastAssetLoaded + this.pageSize,
            contentLibraryId: this.contentLibraryId,
            sortDirection: "DESC",
            sortItem: ["createdDate"]
        };
    },

    initialize: function (models, options) {
        options = options || {};
        _.each(['contentLibraryId', 'totalAssets', 'totalBytes'], function (prop) {
            this[prop] = _.isNumber(options[prop]) ? options[prop] : -1;
        }, this);
        _.bindAll(this, '_fetchStart', '_fetchError');
    },

    add: function (models, options) {
        options = options || {};
        options.contentLibraryId = this.contentLibraryId;
        Backbone.Collection.prototype.add.call(this, models, options);
    },

    /**
     * Checks if, according to the number of loaded assets, there are more assets on the server
     * Until totalAssets is returned from server, assumes there is more to load.
     *
     * @returns {boolean}
     */
    hasMore: function () {
        return this.totalAssets === -1 || this.length < this.totalAssets;
    },

    _fetchStart: function () {
        this.trigger('assets:loading');
        this.isLoading = true;
        this.trigger('request'); // Behave like Backbone's fetch operation
    },

    _fetchError: function () {
        this.trigger('error', this);
        this.isLoading = false;
    },

    checkIfSearchOptionsChanged: function (newOptions) {
        return !this._lastSearchOptions ||
            newOptions.tags !== this._lastSearchOptions.tags ||
            newOptions.type !== this._lastSearchOptions.type ||
            newOptions.data.sortDirection !== this._lastSearchOptions.data.sortDirection ||
            newOptions.data.sortItem !== this._lastSearchOptions.data.sortItem ||
            newOptions.data.useBoolAndTags !== this._lastSearchOptions.data.useBoolAndTags;
    },


    /**
     * Fetches a collection of assets for the given contentLibraryId
     * @param {Object} [options]
     * @param {Boolean} forceResetPaging Forces paging to start from 0, and resets the current asset list
     */
    fetch: function (options, forceResetPaging) {
        var self = this;
        var ajaxData = self.getDefaultFetchData();
        options = options || {};

        // Add/override data if provided
        if (options.data) {
            ajaxData = _.extend(ajaxData, options.data);
        }

        self._fetchStart();

        // Need to see if we want to start a new set of pages, or continue with the next page
        var isFirstFetch = self.length <= 0 || self.lastAssetLoaded === 0;
        var isRestartPagingRequired = forceResetPaging || self.checkIfSearchOptionsChanged(options) || isFirstFetch;

        // Reset pagination state
        if (isRestartPagingRequired) {
            self.lastAssetLoaded = 0;
            ajaxData.from = 0;
            ajaxData.to = self.pageSize;
            self._lastSearchOptions = options;
        }

        // Add the filter options to the actual request
        if (options.tags) {
            ajaxData = _.extend(ajaxData, {tags: options.tags});
        }

        if (options.type) {
            ajaxData = _.extend(ajaxData, {type: options.type});
        }

        // We don't know if there are still unpaged assets, so always request
        ajaxCall({
            url: self.url,
            data: ajaxData,
            type: 'GET',
            success: function (response) {
                if (response.assets) {

                    // Either we got a new set of assets, or we're adding another page
                    if (isRestartPagingRequired) {
                        self.hasLoadedAllInitialPages = false;
                        if (response.assets.length === 0) {
                            self.trigger('emptyContentLibrary'); // do nothing here, but notify UI
                        } else {
                            self.reset(response.assets, options);
                        }
                    } else {
                        if (response.assets.length !== 0) {
                            self.add(response.assets, options);
                        }
                    }

                    // If this page isn't full, record that we've loaded all pages at this time
                    if (response.assets.length < self.pageSize) {
                        self.hasLoadedAllInitialPages = true;
                    }

                    // New pageset or not, keep track of the next page
                    self.lastAssetLoaded += response.assets.length;
                    self.isLoading = false; // must set before firing the event
                    self.trigger('assets:loaded', self);
                } else if (response.errors) {
                    self.isLoading = false; // must set before firing the event
                    hootbus.emit('contentLib:errors', response.errors);
                }
            },
            failure: self._fetchError,
            abort: self._fetchError
        }, 'q1');
    },

    getSelectedAssets: function () {
        return this.where({_checked: true});
    },

    removeAssets: function (assets) {
        var params = {
            assetIds: _.pluck(assets, "id").join(","),
            contentLibraryId: assets[0].get('_contentLibraryId') //guaranteed to exist as delete is disabled until >=1 selected
        };

        ajaxCall({
            url: "/ajax/content-library/assets-delete",
            data: params,
            success: this.onAssetsDestroyedSuccessfully.bind(this, assets),
            abort: function () {
                hs.statusObj.reset();
            }
        }, 'q1');
    },

    onAssetsDestroyedSuccessfully: function (assets, data) {
        if (data.success) {
            _.each(assets, function (asset) {
                asset.trigger('destroy', asset, asset.collection);
            });
        } else {
            if (data.errors) {
                _.each(assets, function (asset) {
                    var error;
                    if (data.errors && data.errors.teams) {
                        error = data.errors.teams;
                    } else {
                        error = data.errors[0];
                    }

                    asset.trigger('error', error);
                });
            }
        }
    }
});

// Apply the chosen mixin; adds functionality to limit
chosenCollectionMixin.call(LibraryAssets.prototype);

export default LibraryAssets;
