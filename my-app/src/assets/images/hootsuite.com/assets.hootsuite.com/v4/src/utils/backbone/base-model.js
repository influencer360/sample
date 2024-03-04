import _ from 'underscore';
import Backbone from 'backbone';

hs.model = hs.model || {};

hs.model.BaseModel = (function () {
    /**
     * Represents HootSuite BackBone base model
     * @class
     * @name hs.model.BaseModel
     * @augments Backbone.Model
     * @constructs
     */
    var BaseModel = function () {
        Backbone.Model.apply(this, arguments);
    };
    _.extend(BaseModel.prototype, Backbone.Model.prototype,
        {
            emulatedRestfulSync: function (method, model, options) {
                var self = this;
                var success = options.success;
                var error = options.error;

                options = _.omit(options, 'success', 'error');

                var params = {
                    url: this.requestMap[method],
                    data: {},
                    success: function (data, status, xhr) {
                        success.call(self, data, status, xhr);
                    },
                    error: function (data, status, xhr) {
                        error.call(self, data, status, xhr);
                    }
                };
                if (_.isFunction(this.getRequestData)) {
                    params.data = this.getRequestData(method);
                }

                return ajaxCall(_.extend(params, options), 'q1');
            },

            restfulSync: function (method, model, options) {
                Backbone.Model.prototype.sync(method, model, options);
            },

            getSyncMethod: function (method) {
                if (this.requestMap && Object.prototype.hasOwnProperty.call(this.requestMap, method)) {
                    return this.emulatedRestfulSync;
                } else {
                    return this.restfulSync;
                }
            },

            sync: function (method, model, options) {
                return this.getSyncMethod(method).apply(this, [method, model, options]);
            }
        });

    BaseModel.extend = Backbone.Model.extend;
    return BaseModel;
})();

export default hs.model.BaseModel;

