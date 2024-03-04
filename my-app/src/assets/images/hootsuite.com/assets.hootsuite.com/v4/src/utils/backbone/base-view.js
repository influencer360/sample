import _ from 'underscore';
import Backbone from 'backbone';
import hsEjs from 'utils/hs_ejs';
import helperMixin from 'utils/mixins/helper'

/**
 * An extended Backbone view with support for EJS templates and appending children
 * @class BaseView
 * @extends Backbone.View
 */
const BaseView = function () {
    this.children = _([]);
    Backbone.View.apply(this, arguments);
};
BaseView.templateCache = {};
_.extend(BaseView.prototype, Backbone.View.prototype, /** @lends BaseView.prototype */{
    preinitialize: function() {
        if (arguments.length > 0) {
            this.options = arguments[0];
        } else {
            this.options = {}
        }
    },
    /**
     * Retrieves the specified template. Attempts to retrieve cached template first
     * @param {String} [tpl] name of a template to render (if not this.template)
     * @returns {EJS}
     */
    getTemplate: function (tpl) {
        var c = BaseView.templateCache;
        tpl = tpl || this.template;
        // if the template has a render function, it is a compiled template
        // in this case, we don't need to cache it
        if (_.isObject(tpl) && _.isFunction(tpl.render)) {
            return tpl;
        }
        return c[tpl] || (c[tpl] = hsEjs.getEjs(tpl));
    },
    /**
     * Get the data for a template (retrieves model data if exists)
     * @returns {Object}
     */
    getTmplData: function () {
        return this.model ? this.model.toJSON() : {};
    },
    /**
     * Render the specified template with default data and attach it to the DOM
     * @returns {BaseView}
     */
    render: function () {
        this.attachToDom();
        return this;
    },
    /**
     * Render a template
     * @param {String} [tpl] Name of a template the render (defaults to this.template)
     * @returns {String}
     */
    renderTemplate: function (tpl) {
        var t = this.getTemplate(tpl);
        return t.render(this.getTmplData());
    },
    /**
     * Attach the a template to the current DOM element for this view
     * By default, it replaces the contents with this.template
     *
     * @param {Boolean} [clear] Whether to clear the DOM first (default to clearing the DOM)
     */
    attachToDom: function (clear) {
        if (clear === false) {
            this.$el.append(this.renderTemplate());
        } else {
            this.$el.html(this.renderTemplate());
        }
        this.afterRender();
    },

    /**
     * Sometimes its handy to do things after you are sure that the dom is up
     * to date. Override this function to that end.
     */
    afterRender: function () {

    },

    /**
     * Sometimes a view needs to clean some things up before release
     */
    beforeRelease: function () {

    },
    
    /**
     * Add the given view to the list of children and add inverse parent relationship
     * @param {Backbone.View} view
     */
    adopt: function (view) {
        this.children.push(view);
        view.parent = this;
    },
    /**
     * Renders a given view and adds it to the list of children elements to release during cleanup
     * @param {Backbone.View} view
     */
    renderChild: function (view) {
        this.adopt(view);
        view.render();
    },
    release: function () {
        this.beforeRelease();
        this.unbind();
        this.remove();
        if (_.isFunction(this.stopListening)) {
            this.stopListening();
        }
        this.unbindModelCollection();
        this._releaseChildren();
    },
    _releaseChildren: function () {
        // Views will start removing themselves so better to clone the array
        _.each(this.children.clone(), function (view) {
            if (_.isFunction(view.release)) {
                view.release();
            }
        });
        this.children = _([]);
    },
    bindModelCollection: function () {
    },
    unbindModelCollection: function () {
    },
    initialize: function () {
        this.unbindModelCollection();
        this.bindModelCollection();
    }
});

helperMixin(BaseView);

export default BaseView;
