import _ from 'underscore';
import helperMixin from 'utils/mixins/helper'
import messageSubscriptionMixin from 'utils/mixins/message-subscription'

var noop = function () {};
/**
 * @param {Object} options
 * @constructor
 */
var AppBase;

AppBase = function () {
    this.initialize.apply(this, arguments);
};

_.extend(AppBase.prototype, /** @lends AppBase.prototype */{
    initialize: function () {
        // From mixin, MUST be called first
        this.delegateMessageEvents();

        // Convenience method so you don't have to call AppBase.prototype.initialize.apply(this, _.array(arguments))
        // NOTE: MessageSubscription initialize won't be called if you override this method
        this.onInitialize.apply(this, _.toArray(arguments));
    },
    onInitialize: noop,
    messageEvents: {},
    /**
     * Cleanup the app so subscriptions go away
     */
    destroy: function () {
        // From mixin, manually called since initialize order matters
        this.undelegateMessageEvents();

        this.onDestroy();
    },
    onDestroy: noop
});

helperMixin(AppBase);
// Can't use the mixins property since we don't call extend at this point
AppBase.mixin(messageSubscriptionMixin(false));

export default AppBase;

