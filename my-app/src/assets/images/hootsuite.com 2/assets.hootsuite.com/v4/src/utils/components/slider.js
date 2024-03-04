import $ from 'jquery';
import _ from 'underscore';

/**
 * @class SliderComponent
 * @param $el jQuery container element
 * @param options Object
 */
var SliderComponent = function ($el, options) {
    this.$el = $el;

    var data = this.$el.data();

    this.name = 'slider' + (data.sliderName || (new Date()).getTime());

    this._mouseMoveTriggered = false;

    /**
     * Segment variables {segments, segmentMin, segmentMax} are "normalized", while
     * {value, valueMin, valueMax} are calculated within the range [segmentMin..segmentMax]
     * and then multiplied by the 'step' value
     *
     * Default to 10 segments with a range of [0..10]
     */

    this._options = {
        width: data.width || "100%", // width can be in any valid measure (eg - px, %)
        segments: data.segments || 10, // total number of segments
        step: data.step || 1, // range multiplier
        value: data.value || 0, // current slider value
        segmentMin: data.segmentMin || 0, // segment range min value
        hideMarkers: data.hideMarkers || 0, // hide numeric markers if true
        noAnimation: data.noAnimation || 0, // disable control, indicator css animation
        ariaLabelledBy: data.labelledBy || null // used to add aria-labelledby to the control
    };

    // Derived values
    this._derived = {
        segmentMax: 10, // == segments + segmentMin
        segmentWidth: 10, // == 100 (percent) / # of segments

        // Normalized breakpoints used for snapping the control x-position (range: 0..1)
        segmentBreakpoints: {
            0: 0.05,
            1: 0.15,
            2: 0.25,
            3: 0.35,
            4: 0.45,
            5: 0.55,
            6: 0.65,
            7: 0.75,
            8: 0.85,
            9: 0.95
        },

        valueMin: 0, // == segmentMin * step
        valueMax: 10 // == segmentMax * step
    };

    this.$indicator = null;
    this.$control = null;

    if (options) {
        this._setOptions(options);
    }

    this._updateDerivedValues();
    this._render();
};

_.extend(SliderComponent.prototype, {
    /**
     * Public getter/setter for value
     */
    value: function (value) {
        if (!_.isUndefined(value) && value !== this._options.value) {
            this._setValue(value);
            this.$el.trigger({
                type: 'sliderValueUpdated',
                value: value,
                initializing: false,
                mouseMoving: this._mouseMoveTriggered
            });
        }

        return this._options.value;
    },
    /**
     * Public getter for slider segment max value
     */
    segmentMax: function () {
        return this._derived.segmentMax;
    },
    /**
     * Public getter/setter for options
     */
    options: function (options) {
        if (!_.isUndefined(options)) {
            // Remove the previous slider object
            this.destroy();

            // Update the options
            this._setOptions(options);

            // Update the derived values
            this._updateDerivedValues();

            // Render the new slider object
            this._render();
        }

        return this._options;
    },
    /**
     * Stop all drag-related events
     */
    stopDrag: function () {
        // This will trigger the mouse up on the control
        $(document).trigger('mouseup.' + this.name);
    },
    /**
     * Destructor
     */
    destroy: function () {
        // Clean up event listeners and attributes
        this.$el
            .removeClass('modSlider')
            .attr({
                'tabindex': '-1',
                'aria-hidden': true
            })
            .off();

        this.$control.off();

        // Remove generated elements
        this.$el.empty();
    },
    _render: function () {
        var classes = 'modSlider' + (this._options.noAnimation ? ' x-noAnimation' : '');

        this.$el
            .addClass(classes)
            .css('width', this._options.width)
            .attr({
                'tabindex': '0',
                'aria-hidden': false
            })
            .on('click.' + this.name, _.bind(this._updateSliderMouse, this))
            .on('keydown.' + this.name, _.bind(this._updateSliderKeyboard, this))
            .data('sliderWidget', this);

        if (!this._options.hideMarkers) {
            // The first segment shows the segmentMin value on the left side
            for (var i = (this._options.segmentMin + 1); i <= this._derived.segmentMax; i++) {
                this._addSegment(i);
            }
        }

        // Initialize the indicator and control objects
        this.$indicator = this._addIndicator();
        this.$control = this._addControl();

        // Broadcast the current value
        this.$el.trigger({
            type: 'sliderValueUpdated',
            value: this._options.value,
            initializing: true,
            mouseMoving: false
        });

        // Show the slider
        this.$el.css('visibility', 'visible');
    },
    _addSegment: function (index) {
        var $segment = $('<span class="-segment"></span>')
            .attr('data-segment', index * this._options.step)
            .css('width', this._derived.segmentWidth + '%');

        // Check if we're adding the first segment
        if (index === this._options.segmentMin + 1) {
            $segment.attr('data-start-index', this._derived.valueMin);
        }

        return $segment.appendTo(this.$el);
    },
    _addIndicator: function () {
        var $indicator = $('<span class="-indicator _sliderIndicator"></span>')
            .css('width', (this._options.value / this._options.step - this._options.segmentMin) * this._derived.segmentWidth + '%');

        return $indicator.appendTo(this.$el);
    },
    _addControl: function () {
        var $control = $('<span class="-control _sliderControl"></span>')
            .css('left', (this._options.value / this._options.step - this._options.segmentMin) * this._derived.segmentWidth + '%')
            .attr({
                'role': 'slider',
                'aria-valuemin': this._derived.valueMin,
                'aria-valuemax': this._derived.valueMax,
                'aria-valuenow': this.value()
            });

        if (this._options.ariaLabelledBy !== null) {
            $control.attr('aria-labelledby', this._options.ariaLabelledBy);
        }

        $control.on('mousedown.' + this.name, _.bind(this._initSliderUpdate, this));

        return $control.appendTo(this.$el);
    },
    _initSliderUpdate: function () {
        this._mouseMoveTriggered = false;

        var $document = $(document)
            .on('mousemove.' + this.name, _.bind(function (e) {
                this._mouseMoveTriggered = true;
                this._updateSliderMouse(e);
            }, this))
            .on('mouseup.' + this.name, _.bind(function () {
                $document.off('mousemove.' + this.name);
                $document.off('mouseup.' + this.name);

                // Broadcast the current value
                this.$el.trigger({
                    type: 'sliderValueUpdated',
                    value: this._options.value,
                    initializing: false,
                    mouseMoving: false
                });
            }, this));
    },
    _updateSliderMouse: function (e) {
        // Prevent click event directly after a mouseup event occurs
        if (this._mouseMoveTriggered && e.type === 'click') {
            this._mouseMoveTriggered = false;
            return;
        }

        var currValue = this.value();

        // Left offset value of slider widget, relative to the document; "|| 3" is necessary
        // as IE8 returns 'medium' as the border, regardless of what it's set to
        var leftOffset = this.$el.offset().left + (parseInt(this.$el.css('border-left-width'), 10) || 3);

        var normalizedMouseX = (e.pageX - leftOffset) / this.$el.width();
        var key = 0;
        var newValue;

        // Determine which segment the mouse cursor is currently in
        while (normalizedMouseX > this._derived.segmentBreakpoints[key]) {
            key++;
        }

        newValue = (this._options.segmentMin + key) * this._options.step;

        if (newValue !== currValue) {
            // Update the current state of the slider
            this._updateSliderState(newValue);
        }
    },
    _updateSliderKeyboard: function (e) {
        var currValue = this.value();
        var key = currValue / this._options.step;
        var newValue;

        switch (e.keyCode) {
            case 38: // up arrow
            case 39: // right arrow
                // Prevent arrow keys from moving the browser window on focus
                e.preventDefault();
                key++;
                key = Math.min(key, this._derived.segmentMax);
                break;
            case 37: // left arrow
            case 40: // down arrow
                // Prevent arrow keys from moving the browser window on focus
                e.preventDefault();
                key--;
                key = Math.max(key, this._options.segmentMin);
                break;
        }

        newValue = key * this._options.step;

        if (newValue !== currValue) {
            // Update the current state of the slider
            this._updateSliderState(newValue);
        }
    },
    /**
     * Update the state of the slider
     * @param value Integer
     */
    _updateSliderState: function (value) {
        var newValue = this.value(value);
        var newValueAsPercent = (newValue / this._options.step - this._options.segmentMin) * this._derived.segmentWidth + '%';

        this.$indicator.css('width', newValueAsPercent);
        this.$control.css('left', newValueAsPercent);
    },
    /**
     * Setter for 'value' property
     * @param value Number
     */
    _setValue: function (value) {
        var rangeMin = this._options.segmentMin * this._options.step;
        var rangeMax = this._derived.segmentMax * this._options.step;

        if (value < rangeMin) {
            value = rangeMin;
        }

        if (value > rangeMax) {
            value = rangeMax;
        }

        this._options.value = value;
        this.$control.attr('aria-valuenow', value);

        // Update the current state of the slider
        this._updateSliderState(value);
    },
    /**
     * Setter for 'options' property
     * @param options Object
     */
    _setOptions: function (options) {
        // _setOptions is called with a hash of all options that are changing
        _.extend(this._options, options);
    },
    /**
     * Setter for 'derived' property
     */
    _updateDerivedValues: function () {
        this._derived.segmentMax = this._options.segmentMin + this._options.segments;
        this._derived.segmentWidth = 100 / this._options.segments;

        this._derived.valueMin = this._options.segmentMin * this._options.step;
        this._derived.valueMax = this._derived.segmentMax * this._options.step;

        // Reset the segment breakpoints
        this._derived.segmentBreakpoints = {};

        // Convert segment width to decimal and divide by two
        var breakpointFirst = (this._derived.segmentWidth / 100) / 2;
        var breakpointOffset = breakpointFirst * 2;

        for (var i = 0; i < this._options.segments; i++) {
            this._derived.segmentBreakpoints[i] = breakpointFirst + i * breakpointOffset;
        }
    }
});

export default SliderComponent;

