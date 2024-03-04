import _ from 'underscore';
import BaseView from 'utils/backbone/base-view';
import dialogFactory from 'utils/dialogfactory';
import { FocusManager } from 'fe-pnc-lib-focus-manager';

export default BaseView.extend(/** @lends BaseDialog.prototype */{
    text: {
        popupTitle: ''
    },

    params: {},

    _params: {
        resizable: false,
        draggable: true,
        closeOnEscape: true,
        focusable: false,
        width: 400
    },

    popupId: '',

    /**
     *
     * @param options
     * @param {Object} [options.data]
     * @param {Object} options.data.output HTML string to be used as content
     * @param {string} [options.template] EJS template path
     * @param {string} [options.popupId] custom id for the given popup
     * @param {Object} [options.params] params as they would be passed through to dialogFactory
     * @param {string} [options.title] custom title to use for the popup
     */
    initialize: function (options) {
        if (options) {
            _.extend(this, _.pick(options, 'data', 'template', 'popupId'));
            if (options.params) {
                _.extend(this.params, options.params);
            }
        }
    },

    render: function () {
        var params = this.getPopupParams();
        if (this.template) {
            params.content = this.getTemplate().render(this.getTmplData());
        } else if (this.data && this.data.output) {
            params.content = this.data.output;
        }

        // Makes the 'events' above bind to the popup
        this.setElement(dialogFactory.create(this.getPopupId(), params));

        if (this.className) {
            this.$el.addClass(this.className);
        }

        if(params.focusable){
            FocusManager.addElement(document.querySelector('.-modal'));
            FocusManager.safeFocus(document.querySelector('._close'));
            FocusManager.trapFocus();
        }

        if (_.isFunction(this.onRender)) {
            // Makes testing the view possible
            return this.onRender();
        }
    },

    getPopupId: function () {
        return this.popupId;
    },

    getTitle: function () {
        return this.options && this.options.title || this.text.popupTitle;
    },

    getPopupParams: function () {
        _.bindAll(this, 'onPopupClose');
        return _.extend({}, this._params, this.params, {
            title: this.getTitle(),
            close: this.onPopupClose
        });
    },

    getTmplData: function () {
        return this.model ? this.model.toJSON() : null;
    },

    close: function () {
        this.$el && this.$el.dialog('close');
    },

    /**
     * @this {BaseDialog}
     */
    onPopupClose: function () {
        if(this.params.focusable){
            FocusManager.remove(document.querySelector('.-modal'));
        }
        this.release();
    }
});


