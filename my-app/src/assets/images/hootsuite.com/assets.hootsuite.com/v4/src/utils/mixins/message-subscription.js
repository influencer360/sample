import _ from 'underscore';
import hootbus from 'utils/hootbus';

/**
 * Expects initialize to be called on object creation and destroy to be called on destruction
 *
 * @name messageSubscriptionMixin
 * @type {{initialize: Function, destroy: Function, delegateMessageEvents: Function, undelegateMessageEvents: Function, subscribe: Function}}
 */
var messageSubscriptionMixin = function (enableAutoBehaviour) {
    if (enableAutoBehaviour === false) {
        return _.omit(messageSubscriptionMixin.mixins, 'initialize', 'destroy');
    } else {
        return messageSubscriptionMixin.mixins;
    }
};


messageSubscriptionMixin.mixins = {
    initialize: function () {
        this.delegateMessageEvents();
    },
    destroy: function () {
        this.undelegateMessageEvents();
    },

    /**
     * Subscribes all the 'messageEvents' for the app. Typically done during initialisation phase
     * If events map is passed in it will subscribe a different set of events
     * This always calls {@link undelegateMessageEvents}
     *
     * @param events
     * @returns {*}
     */
    delegateMessageEvents: function (events) {
        if (!(events || (events = _.result(this, 'messageEvents')))) { return this; }
        this.undelegateMessageEvents();

        _.each(events, function (handler, topic) {
            if (!_.isFunction(handler)) {
                handler = this[handler];
            }
            if (_.isFunction(handler)) {
                this.subscribe(topic, _.bind(handler, this));
            }
        }, this);

        return this;
    },
    /**
     * Unsubscribe all the 'messageEvents'
     *
     * @returns {*}
     */
    undelegateMessageEvents: function () {
        if (this._handles && _.isArray(this._handles)) {
            _.each(this._handles, function (pair) {
                hootbus.off(pair[0], pair[1]);
            });
        }
        this._handles = [];

        return this;
    },
    /**
     * Subscribe a given callback to a topic, also adds the handle to the cleanup pool
     *
     * @param {string} topic hootbus topic to which to subscribe
     * @param {Function} callback
     */
    subscribe: function (topic, callback) {
        if (_.isFunction(callback)) {
            hootbus.on(topic, callback);
            this._handles.push([topic, callback]);
        }

        return this;
    }
};

export default messageSubscriptionMixin;
