import _ from 'underscore';
import Backbone from 'backbone';
import hootbus from 'utils/hootbus';

var previewImgForType = {
    MESSAGE: '/images/publisher/libraryitem-thumb-msg.png',
    TEXT: '/images/publisher/libraryitem-thumb-text.png',
    DOCUMENT: '/images/publisher/libraryitem-thumb-doc.png'
};


export default Backbone.Model.extend(/** @lends LibraryAsset.prototype */{
    idAttribute: 'assetId',
    // _chosen is used for filtering
    // _checked is bound to those items currently selected
    // Hackish, but better than a lot of alternatives
    defaults: {
        _chosen: true,
        _checked: false,
        name: '',
        tags: '',
        description: '',
        expiryDate: null
    },

    /**
     * @constructor
     *
     * @param attributes
     * @param options
     */
    initialize: function (attributes, options) {
        options = options || {};
        if (options.contentLibraryId) {
            this.set('_contentLibraryId', options.contentLibraryId);
        }
    },

    destroy: function () {
        var params = {
            assetId: this.id,
            contentLibraryId: this.get('_contentLibraryId')
        };

        _.bindAll(this, 'onDestroySuccess');
        ajaxCall({
            url: "/ajax/content-library/asset-delete",
            data: params,
            success: this.onDestroySuccess,
            abort: function () {
                hs.statusObj.reset();
            }
        }, 'q1');
    },

    isExpired: function () {
        var expiryDate = this.get('expiryDate');
        return expiryDate !== null && expiryDate !== 0 && (new Date()) > (new Date(expiryDate));
    },

    getPreviewImage: function () {
        var type = this.get('type');
        var imageSource = '';

        if (type === 'IMAGE') {
            imageSource = this.get('thumbImgUrl');
        } else if (previewImgForType[type]) {
            imageSource = previewImgForType[type];
        }

        return imageSource;
    },

    getContentLibraryId: function () {
        return this.get('_contentLibraryId');
    },

    onDestroySuccess: function (data) {
        var model = this;
        if (data.success) {
            model.trigger('destroy', model, model.collection);
            hootbus.emit("contentLib:asset:refreshSelected");
        } else {
            if (data.errors) {
                var error;
                if (data.errors && data.errors.teams) {
                    error = data.errors.teams;
                } else {
                    error = data.errors[0];
                }

                this.trigger('error', error);
            }
        }
    },

    /**
     * Returns all the actual attributes of this class (removes pseudo-attributes used for filtering and selection)
     *
     * @returns {Object}
     */
    toJSON: function () {
        var clone = _.clone(this.attributes);
        delete clone._chosen;
        delete clone._checked;
        delete clone._contentLibraryId;
        clone.cid = this.cid;

        return clone;
    }
});

