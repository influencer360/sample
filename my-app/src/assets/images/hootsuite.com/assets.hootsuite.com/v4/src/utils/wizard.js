import $ from 'jquery';
import _ from 'underscore';

/**
 * create a wizard/helper-flow with multiple bubblepops
 * each step is:
 * {
     *      target: selector/el/jquery,
     *      content: html/el/jquery,
     *      position: 'horizontal or vertical',	// default horizontal
     *      events: [{
     *          selector: string,
     *          event: string,
     *          handler: function
     *      }],
     *      close: function,
     *      autoclose: true or false (autoclose means click outside of popup to close),
     *      onOpen: function
     * }
 * @param steps
 * @param options
 */
var wizard = {
    queue: [],
    currentPosition: 0
};

wizard.init = function (steps) {
    wizard.queue = [];	// clear
    wizard.currentPosition = 0;
    _.each(steps, function (step) {

        var fnStep = function () {
            var $target = $(step.target),
                fnClose = function () {
                    _.isFunction(step.close) && step.close();
                    _.defer(wizard.show);		// auto show next
                };

            if (!$target.length) {
                wizard.clearQueue();
                return;
            }

            // bugfix: bubble popups don't open when one is already open. explicitly closing before (re)opening fixes it.
            hs.bubblePopup.close();

            var openFunction = (step.position == 'vertical') ? 'openVertical' : 'open',
                setPositionFunction = (step.position == 'vertical') ? 'setPositionVertical' : 'setPosition',
                bubblePopOptions = $.extend({autoclose: step.autoclose}, step.bubblePopOptions || {});

            if (step.position == 'vertical') {
                bubblePopOptions['isVertical'] = true;
            }

            hs.bubblePopup[openFunction]($target, null, null, function () {
                if (typeof step.autoclose === 'undefined' || step.autoclose) {
                    $.isFunction(fnClose) && $target.unbind('close.bubblepopup').bind('close.bubblepopup', fnClose);
                }

                hs.bubblePopup.setContent(step.content);

                // bind
                var $pane = $('#bubblePopPane');
                _.each(step.events, function (event) {
                    $pane.find(event.selector).bind(event.event, function () {
                        _.isFunction(event.handler) && event.handler();
                        return false;
                    });
                });

                // reposition
                _.defer(hs.bubblePopup[setPositionFunction]);

                // call the onOpen function of this step
                $.isFunction(step.onOpen) && step.onOpen();
            }, bubblePopOptions);
        };

        // if this step has an init function, it is required to return a promise.
        // if this step does not have an init function, transition to it directly.
        var fnInitStep = function () {
            if (_.isFunction(step.init)) {
                var promise = step.init();
                if (_.isFunction(promise.then)) {
                    step.init().then(fnStep);
                } else {
                    throw Error('step.init should return a promise');
                }
            } else {
                fnStep();
            }
        };

        wizard.queue.push(fnInitStep);
    });
};
wizard.show = function () {
    if (!wizard.queue.length) {
        hs.bubblePopup.close();
        return;
    }

    var next = wizard.queue[wizard.currentPosition];
    wizard.currentPosition += 1;
    _.isFunction(next) && next();
};
/**
 * Jump to a step in your wizard where position is the numerical index of the array of steps
 * eg. Steps: 1 1a 1b 2 2a 2b
 *     To jump to step 2 would mean calling wizard.jumpToStep(4)
 * @param position
 */
wizard.jumpToStep = function (position) {
    position = parseInt(position - 1);
    if (wizard.queue.length && position < wizard.queue.length && position >= 0) {
        wizard.currentPosition = position;
        wizard.show();
    }
};
wizard.clearQueue = function () {
    wizard.queue = [];
    wizard.currentPosition = 0;
};
wizard.skipToLast = function () {
    if (wizard.queue.length) {
        wizard.currentPosition = wizard.queue.length - 1;
        wizard.show();
    }
};

export default wizard;
