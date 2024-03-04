import _ from 'underscore';

/**
 * A mixin for Backbone collections that adds behaviour for 'choosing' specific elements within a collection for display
 *
 * Model must define defaults: { _chosen: true } if you want everything ot be visible to start
 * View must listen for 'change:_chosen' and bind to a show/hide function
 *
 * Functional mixin pattern used from http://javascriptweblog.wordpress.com/2011/05/31/a-fresh-look-at-javascript-mixins/
 *
 * @example chosenCollectionMixin.call(MyCollection.prototype)
 */
var chosenCollectionMixin = (function () {
    return function () {
        /**
         * Non-destructive filtering, sets a flag on the model
         * Defaults to resetting (applying the selector to the whole set) but
         * {reset: false} will apply the selection to previously chosen set
         *
         * @param {Function} evaluator
         * @param {Object} [options]
         * @config {Boolean} reset
         *
         * @example
         *  collection.choose(function(m, i) {
             *      return m.get('sent') > testDate;
             *  }
         */
        this.choose = function (evaluator, options) {
            var reset = options && options.reset || true,
                collection = reset ? this : this.getChosen();
            collection.each(function (m, i) {
                m.set('_chosen', evaluator(m, i));
            });

            this.trigger('chosen', this);
        };
        /**
         * Get all currently chosen items in a Backbone collection
         * @returns {Array<Backbone.Model>}
         */
        this.getChosen = function () {
            return this.where({_chosen: true});
        };
        /**
         * Resets the collection so that getChosen will return all items
         */
        this.resetChosen = function () {
            this.each(function (m) {
                m.set('_chosen', true);
            });
            this.trigger('chosen', this);
        };
        /**
         * Size of the current chosen set
         * @returns {int}
         */
        this.sizeChosen = function () {
            return _.size(this.getChosen());
        };

        return this;
    };
})();

export default chosenCollectionMixin;
