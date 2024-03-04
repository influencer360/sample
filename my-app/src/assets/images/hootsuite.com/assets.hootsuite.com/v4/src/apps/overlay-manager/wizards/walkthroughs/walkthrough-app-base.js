import $ from 'jquery';
import _ from 'underscore';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import AppBase from 'core/app-base';
import React from 'react';
import WalkthroughStep from 'hs-nest/lib/components/popovers/walkthrough-step';
import {stepPopoverModule} from './step-popover'
import spotlight from './spotlight';
import trackerDatalab from 'utils/tracker-datalab';

/**
 * @typedef {Object} WalkthroughStepData
 * @property {String} target class selector for the target object (USE strings, not jquery selectors that run on walkthrough instantiation)
 * @property {Object} data properties for the WalkthroughStep component
 * @property {String} [classNames] classes to associated with the walkthrough popover
 * @property {Object} [tetherOptions] override options for Tether
 * @property {Function} [onOpen] callback to trigger when opening the step
 * @property {Function} [onClose] callback to trigger when closing the step
 * @property {Array<{name: String, handler: Function}>} [messageEvents] list of message events to bind to hootbus
 */

/**
 * Creates the basis for stepped walkthroughs.
 *
 * To implement:
 *  - Assign the `this.stepQueue` with an array of WalkthroughStepData items
 *  - Implement any initialization in `onInitialize`
 *  - Implement any tear-down in `onDestroy`
 *  - Implement your own `onStartWalkthrough` to kick-off the walkthrough; be sure to call `showStep` to kick off the process
 *
 *
 * @class WizardAppBase
 */
var WalkthroughAppBase = AppBase.extend({
    walkthroughCallback: null,
    walkthroughId: null,
    trackingWalkthroughName: null,
    isNestedWalkthrough: false,
    stepQueue: [],
    currentPosition: 0,
    stepIsOpen: false,
    debounceTime: 300,
    spotlight: null,
    stepPopover: null,
    preventClickExclusions: [],
    interceptClickCallback: null,
    messageEvents: {
        'walkthrough:close': 'destroy'
    },

    /**
     *
     */
    onWindowResize: function () {
        this.spotlight.reapply();
    },

    /**
     * Initialize App. Override in class extensions to populate steps.
     * @param options
     */
    initialize: function (options) {
        _.bindAll(this, 'onWindowResize', 'exitWalkthrough', 'showNextStep');
        options = options || {};

        if (options.walkthroughInit) {
            options.walkthroughInit();
        }

        if (_.isFunction(options.walkthroughCallback)) {
            this.walkthroughCallback = options.walkthroughCallback;
        }

        this.isNestedWalkthrough = !!options.isNestedWalkthrough;
        this.spotlight = Object.create(spotlight);
        this.stepPopover = Object.create(stepPopoverModule);

        this.defaultPopoverProps = {
            hasCloseButton: true,
            onRequestHide: this.exitWalkthrough
        };

        this.defaultTetherOptions = {
            attachment: 'top right',
            targetAttachment: 'top left',
            offset: '12px 0'
        };

        // MUST have two number placeholders
        this.stepProgressString = translation._('Step %d of %d');

        this.showCurrentStepText = false;
        this.isTrackingOn = true;

        //Throttle the frequency onWindowResize can fire
        this.onWindowResize = _.debounce(this.onWindowResize, this.debounceTime);
        //Reapply the spotlight on resizing the window
        window.addEventListener('resize', this.onWindowResize);

        AppBase.prototype.initialize.apply(this, _.toArray(arguments));

        // override stepQueue after onInitialize
        if (options.customStepQueueIds)  {
            this.filterStepQueue(options.customStepQueueIds);
        }
    },

    /**
     * Given an array of customStepQueueIds, we rewrite stepQueue by picking those step ids from the existing stepQueue
     * The order of the new stepQueue will match the order of the customStepQueueIds
     * @param customStepQueueIds
     */
    filterStepQueue: function (customStepQueueIds) {
        var newStepQueue = [];
        _.each(customStepQueueIds, _.bind(function (stepId) {
            var step = this.getStepById(stepId);
            if (step) {
                newStepQueue.push(step);
            }
        }, this));
        this.stepQueue = newStepQueue;
    },

    getStepById: function (stepId) {
        return _.findWhere(this.stepQueue, {id: stepId});
    },

    /**
     * Kicks off the walkthrough
     */
    startWalkthrough: function () {
        // stop the sleepy-owl timer, it conflicts with the overlay and leaves the dashboard unusable
        window.stopUserInactiveTimer();

        if (_.isFunction(this.onStartWalkthrough)) {
            if (this.isTrackingOn) {
                trackerDatalab.trackCustom(this.originId, 'walkthrough_opened', {name: this.trackingWalkthroughName});
            }

            this.onStartWalkthrough.apply(this, _.toArray(arguments));
        }
    },

    /**
     * Move to the next step in sequence.
     *
     * @this {WalkthroughAppBase} already bound in initialize
     */
    showNextStep: function () {
        this.showStep(this.currentPosition + 1);
    },

    /**
     * Go to the step in the walkthrough for a specified id
     *
     * @param {string} id
     */
    jumpToStep: function (id) {
        var stepIndex = this.stepQueue.map(function (step) {return step.id; }).indexOf(id);
        this.showStep(stepIndex);
    },

    /**
     * Shows a specific step
     * @param stepNum
     */
    showStep: function (stepNum) {
        // Don't track the "previous" step close event if we're on the first step
        var trackEvent = stepNum !== undefined;
        this.closeCurrentStep(trackEvent);

        //Default to showing the current position step if none is passed.
        stepNum = stepNum || this.currentPosition;

        var step = this.getStep(stepNum);

        this.currentPosition = stepNum;

        if (step) {
            if (step.data) {
                var popoverProps = this.combineStepProps(step.data);
                var tetherOptions = _.extend({}, this.defaultTetherOptions, step.tetherOptions);

                this.renderStepPopover(step, popoverProps, tetherOptions);
            }

            if (step.isCongratulatoryStep) {
                // Remove the congratulatory step when the user clicks on something
                $('body').on('click.closeWalkthrough', function () {
                    this.exitWalkthrough({showPopover: false, isComplete: true});
                }.bind(this));

                this.completeTask();
            }

            //Bind any bus events associated with the step
            this.toggleStepEventListeners(step.messageEvents, true);
            this.stepIsOpen = true;
            //Call onOpen method if one is present
            _.isFunction(step.onOpen) && step.onOpen.call(this);
        } else {
            // we just finished the last step
            this.exitWalkthrough({isComplete: true});
        }
    },

    /**
     * Update the popover and/or tethered element(s)
     * @param updatedPopoverProps - (optional) React component props
     * @param updatedTetherOptions - (optional) Tethered Element options
     */
    updateStepPopover: function (updatedPopoverProps, updatedTetherOptions) {
        updatedPopoverProps = updatedPopoverProps || {};
        updatedTetherOptions = updatedTetherOptions || {};

        var step = this.getStep(this.currentPosition);

        if (step && step.data) {
            // Remove the previous popover
            this.stepPopover.close();

            // Overwrite the default popover props with what's passed in
            var popoverProps = this.combineStepProps(step.data);
            _.extend(popoverProps, updatedPopoverProps);

            // Overwrite the default options with what's passed in
            var tetherOptions = _.extend({}, this.defaultTetherOptions, step.tetherOptions, updatedTetherOptions);

            this.renderStepPopover(step, popoverProps, tetherOptions);
        }
    },

    /**
     * Render the step popover component
     * @param step - Walkthrough step
     * @param popoverProps - React component props
     * @param tetherOptions - Tethered Element options
     */
    renderStepPopover: function (step, popoverProps, tetherOptions) {
        var reactElement;

        if (_.isFunction(step.renderStep)) {
            reactElement = step.renderStep(popoverProps);
        } else {
            reactElement = React.createElement(WalkthroughStep, popoverProps);
        }

        this.stepPopover.open($(step.target), reactElement, tetherOptions);
    },

    /**
     * Creates a string indicating the user's progress in the current walkthrough
     * Ignores Steps that don't have data (ie. intermeditate/transition steps)
     *
     * @param stepData
     * @returns {string}
     */
    getProgressText: function (stepData) {
        if (!this.countedStepsData) {
            // Only include steps that have data, and where isStepCounted is true or undefined
            this.countedStepsData = this.stepQueue
                .filter(function (step) { return (step.data && step.isStepCounted !== false); })
                .map(function (step) { return step.data; });
        }
        var stepIndex = this.countedStepsData.indexOf(stepData);

        if (stepIndex >= 0) {
            return this.stepProgressString
                .replace('%d', stepIndex + 1)
                .replace('%d', this.countedStepsData.length);
        } else {
            return '';
        }
    },

    /**
     * Creates a React element given stepData
     *
     * @param {object} stepData
     * @param {object} overrideProps any valid properties for the WalkthroughStep element
     * @returns {{children: Element, content: String, currentStepText: string, footerButtonAction: function, titleText: string}}
     */
    combineStepProps: function (stepData) {
        var stepText = this.getProgressText(stepData),
            content;

        if (typeof stepData.content === "function") {
            content = stepData.content();
        } else {
            content = stepData.content;
        }

        var calculatedProps = {
            children: React.createElement('p', null, content),
            // Also supply un-wrapped content for alternate render functions
            content: content,
            // CUXF-1656: this line is commented to remove "Step X of Y" until we add support for unusual cases such as nested walkthroughs
            // currentStepText: stepText,
            titleText: stepData.title,
            width: stepData.popoverWidth // If provided, override popover width value
        };

        if (this.showCurrentStepText) {
            calculatedProps = _.extend(calculatedProps, {currentStepText: stepText});
        }

        if (stepData.footerButtonText) {
            calculatedProps.footerButtonAction = this.showNextStep;
        }

        return _.extend({}, this.defaultPopoverProps, calculatedProps, stepData);
    },

    /**
     * Bind on/off any hootbus event listeners.
     * @param stepNum
     * @param isOn
     */
    toggleStepEventListeners: function (messageEvents, isOn) {
        if (messageEvents && messageEvents.length) {
            _.each(messageEvents, function (event) {
                if (event.name && event.handler) {
                    if (isOn) {
                        hootbus.on(event.name, event.handler);
                    } else {
                        hootbus.off(event.name, event.handler);
                    }
                }
            });
        }
    },

    /**
     * Convenience methods for getting specific steps.
     * @returns {WalkthroughStepData}
     */
    getCurrentStep: function () { return this.getStep(this.currentPosition); },

    /**
     * Gets a step, given the id of the position in the queue.
     * @param stepNum
     * @returns {WalkthroughStepData}
     */
    getStep: function (stepNum) {
        if (!_.isUndefined(this.stepQueue[stepNum])) {
            return this.stepQueue[stepNum];
        }
        return null;
    },

    /**
     * Closes a current step and calls it's onClose method
     */
    closeCurrentStep: function () {
        var currentStep = this.getCurrentStep();
        if (currentStep) {
            if (!hs.isFeatureEnabled('CUXF_1857_TRACKING_CLOSE_FIX') || this.stepIsOpen) {
                //Unbind any hootbus event listeners
                this.toggleStepEventListeners(currentStep.messageEvents, false);
                this.stepIsOpen = false;
                _.isFunction(currentStep.onClose) && currentStep.onClose.call(this);
            }
        }

        this.stepPopover.close();
    },

    /**
     * Dynamically inserts a new step before another specific step.
     * @param newStep
     * @param atStepId
     * @param isAfter - true: insert newStep after specified step, false: insert before
     */
    insertStep: function (newStep, atStepId, isAfter) {
        //If there is a duplicate step, then just exit.
        if (this.stepQueue.map(function (step) {return step.id; }).indexOf(newStep.id) > -1) {
            return;
        }

        //Get the array idx of the step that we're inserting before.
        var idx = Math.max(_.map(this.stepQueue, function (step) {
            return step.id || '';
        }).indexOf(atStepId), 0);

        //Get the name of the current step, so we can re-calc currentPosition after the insert.
        var currentStepId = this.getCurrentStep() ? this.getCurrentStep().id : null;

        //Insert the new step.
        this.stepQueue.splice(idx + (isAfter ? 1 : 0), 0, newStep);

        //Reset the current position value now the array has been spliced.
        this.currentPosition = Math.max(_.map(this.stepQueue, function (step) {
            return step.id || '';
        }).indexOf(currentStepId), 0);
    },

    /**
     * Removes step with id:stepId from the stepQueue
     * @param stepId
     */
    removeStep: function (stepId) {
        this.stepQueue = this.stepQueue.filter(function (step) { return step.id !== stepId; });
    },

    /**
     * Resets the current step position
     * @param stepId
     */
    setCurrentStep: function (stepId) {
        this.currentPosition = _.map(this.stepQueue, function (step) {
            return step.id || '';
        }).indexOf(stepId);
    },

    /**
     * Perform any necessary cleanup and close the wizard.
     *
     * @this {WalkthroughAppBase} already bound in initialize
     * @params options.isComplete will not display popover if walkthrough is completed
     * @params options.showPopover display or skip displaying the popover
     */
    exitWalkthrough: function (options) {
        var defaultOptions = {
            showPopover: true,
            trackExit: true
        };

        options = _.extend(defaultOptions, options);

        this.closeCurrentStep();
        this.spotlight.hide();

        this.destroy();
        if (options.isComplete) {
            if (_.isFunction(this.walkthroughCallback)) {
                this.walkthroughCallback();
            }
        }
    },

    /**
     * Binds a click event handler to all children of each parentElem, which will fire before any other bound click handling.
     * Clicks on these child elems will call preventClick(). Elems passed in exceptions will be excluded.
     * You can either pass an array of specific elements, or you can pass parent containers and optionally specify an exclusion list.
     * Note: Probably won't work on react components.
     * @param {Array} parentElems
     * @param {Array} exclusions
     */
    disallowClicks: function (parentElems, exclusions) {
        this.preventClickExclusions = exclusions || [];
        this.toggleDisallowClicks(parentElems, true);
    },

    /**
     * Clears all click interceptions previously set on a specific elem container.
     * @param {Array} parentElems
     */
    clearDisallowClicks: function (parentElems) {
        this.toggleDisallowClicks(parentElems, false);
    },

    /**
     * Helper method for disallowClicks and clearDisallowClicks.
     * @param {Array} parentElems
     * @param {Boolean} disallow
     */
    toggleDisallowClicks: function (parentElems, disallow) {
        _.each(parentElems, _.bind(function (parentElem) {
            _.each($(parentElem).find('*').andSelf(), _.bind(function (elem) {
                // Only bother with anchor, button elements OR have click events bound to them
                var inNodeList = _.contains(['A', 'BUTTON'], elem.nodeName);

                if (inNodeList || ($._data(elem, 'events') && ($._data(elem, 'events').click || $._data(elem, 'events').mousedown || $._data(elem, 'events').mouseup))) {
                    disallow ? this.bindInterceptClick(elem) : this.unbindInterceptClick(elem);
                }

                // If this is a specified node, deal with the inline click event (if it exists)
                if (inNodeList) {
                    var $elem = $(elem);

                    if (disallow && $elem.attr('onclick')) {
                        // Store the onclick value
                        $elem.attr('data-stored-on-click-value', $elem.attr('onclick'));
                        $elem.removeAttr('onclick');
                    } else if (!disallow && $elem.attr('data-stored-on-click-value')) {
                        // Restore the onclick value
                        $elem.attr('onclick', $elem.attr('data-stored-on-click-value'));
                        $elem.removeAttr('data-stored-on-click-value');
                    }
                }
            }, this));
        }, this));
    },

    /**
     * Called whenever the user clicks on a clickable element within the area flagged to intercept clicks.
     * Determines whether the click is an invalid action and prevents propagation if so.
     * @param e
     */
    interceptClick: function (e) {
        // this condition should always be true now because first check in bindInterceptClick
        // but still keeping it here for safe measures
        if (e.target && !this.isInExclusionList(e.target)) {
            e.stopImmediatePropagation();
            e.preventDefault();

            this.shakeStepPopover(this);
        }
    },

    isInExclusionList: function (elem) {
        return $(elem).is(this.preventClickExclusions.join());
    },

    /**
     * Binds a click event to the start of the click event stack.
     * @param elem
     */
    bindInterceptClick: function (elem) {
        var $elem = $(elem);

        // don't touch the element if it is prevented
        if ($elem.is(this.preventClickExclusions.join())) {
            return;
        }

        if (this.interceptClickCallback == null) {
            this.interceptClickCallback = this.interceptClick.bind(this);
        }

        _.each(['click', 'mousedown'], _.bind(function (eventType) {
            $(elem).on(eventType, this.interceptClickCallback);

            var events = $._data(elem, "events")[eventType];
            //Only bother with elements that already have eventType events bound to them.
            if (events.length > 0) {
                events.unshift(events.pop());
                $._data(elem, "events")[eventType] = events;
            }
        }, this));
    },

    /**
     * Unbind all previously-set click interceptions.
     * @param elem
     */
    unbindInterceptClick: function (elem) {
        $(elem).off('click mousedown', this.interceptClickCallback);
    },

    /**
     * Triggers a nested walkthrough, which has slightly different behaviours
     * @param walkthroughName
     * @param options
     */
    triggerNestedWalkthrough: function (walkthroughName, options) {
        options = options || {};
        options.isNestedWalkthrough = true;
        hootbus.emit('overlay:init', 'wizard', walkthroughName, options);
    },

    /**
     * Calls the current popover to 'shake'. Used when users attempt to perform invalid actions.
     */
    shakeStepPopover: _.debounce(function (context) {
        if (context.stepPopover) {
            //@todo: Add endpoint for triggering shake on step-popover class
            $('.-popoverPanel').removeClass('x-shake').addClass('x-shake');
            setTimeout(function () {
                $('.-popoverPanel').removeClass('x-shake');
            }, 250);
        }
    }, 300, true),

    /**
     * Non-visual teardown of the walkthrough class
     */
    destroy: function () {
        //Unbind event listeners
        this.closeCurrentStep();
        window.removeEventListener('resize', this.onWindowResize);
        $('body').off('click.closeWalkthrough');
        this.stepPopover && this.stepPopover.destroy();
        this.spotlight && this.spotlight.hide();

        // Restore the inactivity timer that we deactivated at walkthrough start
        window.startUserInactiveTimer();

        // Trigger onDestroy method and cleanup AppBase
        AppBase.prototype.destroy.call(this);

        hootbus.emit('notify:overlay:closed', 'wizard', this.walkthroughId);
    }

});

export default WalkthroughAppBase;
