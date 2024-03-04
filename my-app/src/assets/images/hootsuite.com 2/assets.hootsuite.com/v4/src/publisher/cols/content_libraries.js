import _ from 'underscore';
import Backbone from 'backbone';
import ContentLibrary from 'publisher/models/content_library';
import 'utils/ajax';

var ContentLibraries = Backbone.Collection.extend(/** @lends ContentLibraries.prototype */{
    url: '/ajax/content-library/list',
    model: ContentLibrary,

    initialize: function () {
        this.on('destroy', this.onDestroy, this);
    },

    reset: function () {
        Backbone.Collection.prototype.reset.apply(this, arguments);

        // On first run we need to set the selected
        if (!this._selected) {
            this._resetSelected();
        }
    },

    /**
     * Fetches the content libraries
     * Only gets the accessible ones for the current user through the server session
     * @param {Object} options
     */
    fetch: function () {
        var self = this;
        // Behave like Backbone's fetch operation
        this.trigger('request');

        _.bindAll(this, 'onFetchSuccess');
        ajaxCall({
            url: this.url,
            type: 'GET',
            success: this.onFetchSuccess,
            failure: function () {
                self.trigger('error', this);
            },
            abort: function () {
                self.trigger('error', this);
            }
        }, 'q1');
    },

    /**
     *
     * @param data
     */
    onFetchSuccess: function (data) {
        if (data.contentLibraries) {
            this.reset(_.values(data.contentLibraries));
        } else {
            this.trigger('error', this, data);
        }
    },

    /**
     * Sets the id of the selected content library by its id
     * @param {Number} id
     */
    setSelectedById: function (id) {
        var selected = this.where({contentLibraryId: id});
        if (_.size(selected) > 0) {
            this._setSelected(_.first(selected));
        } else {
            throw new Error('Invalid item id');
        }
    },

    _resetSelected: function () {
        if (this.length > 0) {
            this._setSelected(this.first());
        } else {
            this._setSelected(null);
        }
    },

    _setSelected: function (selected) {
        this._selected = selected;
        this.trigger('change:selected', this, selected); //trigger changed:selected before loading assets so the toolbar can know that assets are loading
        if (this._selected) {
            this._selected.loadAssets();
        }
    },

    /**
     * Id of the selected library.
     * @returns {Number|null} null if no selected library
     */
    getSelectedId: function () {
        return this._selected && this._selected.id || null;
    },

    /**
     * Currently selected library
     * @returns {ContentLibrary}
     */
    getSelected: function () {
        return this._selected;
    },

    /**
     * If there is currently a selected library
     * @returns {boolean}
     */
    hasSelected: function () {
        return !!this._selected;
    },

    onDestroy: function (model) {
        if (model === this.getSelected()) {
            this._resetSelected();
        }
    }
});

export default ContentLibraries;
