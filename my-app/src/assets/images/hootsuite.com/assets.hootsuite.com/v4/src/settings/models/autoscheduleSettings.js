import _ from 'underscore';
import Backbone from 'backbone';

/**
 * @class AutoScheduleSettings
 * Representation of an Auto Schedule Setting
 *
 * @author - Chris Noble @noblezilla, Andrew Draper @andrewdraper
 * Copyright (C) 2014  HootSuite Media
 */
const AutoScheduleSettings =
    Backbone.Model.extend({
        idAttribute: '_id',
        url: '/ajax/settings',

        defaults: {
            postsPerDay: null,
            startTime: null,
            endTime: null,
            days: null
        },

        /**
         * sync
         * Override of the sync function to work with our backend
         * @param method - The CRUD method ("create", "read", "update", or "delete")
         * @param model - The model to be saved
         * @param options - Success and error callbacks, and all other jQuery request options

         */
        sync: function (method, model, options) {
            var self = this;
            var data = {};
            var url = this.url;
            var type = 'GET';
            switch (method) {
                case 'read':
                    url += '/get-auto-schedule-settings';
                    this.trigger('fetch', self);
                    break;

                case 'create':
                case 'update':
                    url += '/save-auto-schedule-settings';
                    type = 'POST';
                    data = model.toJSON();
                    this.trigger('save', self);
                    break;
                default:
                    throw new Error(method + 'method not yet implemented');
            }

            //Overwrite the default success and errors
            var success = options.success;
            if (options.success) {
                delete options.success;
            }

            var error = options.error;
            if (options.error) {
                delete options.error;
            }

            //Set the params
            var params = {
                url: url,
                data: data,
                type: type,
                success: function (data, status, xhr) {
                    if (data.success === 1) {
                        self.set('loaded', true);
                        //Call the callback
                        success.call(self, data.data, status, xhr);
                    } else if (data.error) {
                        self.set('loaded', false);
                        error.call(self, data, status, xhr);
                    }
                },
                error: function (data, status, xhr) {
                    self.set('loaded', false);
                    error.call(self, data, status, xhr);
                },
                abort: function (data, status, xhr) {
                    self.set('loaded', false);
                    options.error.call(self, data, status, xhr);
                }
            };

            return ajaxCall(_.extend(params, options), 'q1');
        }
    });

export default AutoScheduleSettings;
