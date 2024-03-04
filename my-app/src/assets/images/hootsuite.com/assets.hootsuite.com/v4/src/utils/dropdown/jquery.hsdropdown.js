import $ from 'jquery';
import _ from 'underscore';
import DropdownList from 'utils/dropdown/dropdown-list';
import translation from 'utils/translation';

/**
 * jQuery plugin to create and manipulate dropdown objects
 * Use the same parameters as hs.DropdownList
 *
 * If you want to update the button text, add to it the class :_dropdownbtntext
 * @see hs.DropdownList
 * @example // how to create a dropdown
 * $('.btn').hsDropdown({
     *      data: {
     *          items: [
     *              { title: 'Title 1' },
     *              { title: 'Title 2' },
     *              { title: 'Title 3' }
     *          ]
     *      }
     * });
 * @example // how to programmatically select an element
 * $('.btn').hsDropdown('selectElement', 'somevalue') // compares against id key
 * $('.btn').hsDropdown('selectElement', 'Title 1', 'title')
 * @example // how to subscribe to the onchange event
 * $('.btn').hsDropdown('onchange', fn)
 * @example // how to subscribe to the onopen event
 * $('.btn').hsDropdown('onopen', fn)
 * @example // how to subscribe to the onclose event
 * $('.btn').hsDropdown('onclose', fn)
 */

$.fn.hsDropdown = function () {
    if (this.length === 1) {
        var $this = $(this),
            command = arguments[0],
            optionsList = arguments[0] || {},
            options = arguments[1] || {};

        if (typeof optionsList === 'object') {
            $this.data('hsdropdown', new Dropdown($this, optionsList, options));
        } else if (typeof command === 'string') {

            var remap = {
                    'selectedElement': 'getSelectedElement',
                    'selectedElements': 'getSelectedElements',
                    'list': 'getList',
                    'onchange': 'onchange',
                    'onclose': 'onclose',
                    'onopen': 'onopen',
                    'option': 'option',
                    'selectElement': 'selectElement',
                    'deselectElement': 'deselectElement',
                    'selectFirstElement': 'selectFirstElement',
                    'serialize': 'serialize',
                    'serializeArray': 'serializeArray',
                    'toggleState': 'toggleState',
                    'disableItem': 'disableItem',
                    'enableItem': 'enableItem',
                    'updateButton': 'updateBtn',
                    'close': 'close'
                },
                fnToRun = remap[command];

            var args = Array.prototype.slice.call(arguments, 1),
                inst = $this.data('hsdropdown');

            if (inst && $.isFunction(inst[fnToRun])) {
                return inst[fnToRun].apply(inst, args);
            }
        }
    }
    return this;
};

/**
 * Create a dropdown widget
 * @param {Object} options Configuration object
 * @see hs.DropdownList
 */
var Dropdown = function ($el, options) {
    var self = this;

    var isMultiSelect = !!options.multiselect;
    isMultiSelect && $el.addClass('multiselect');

    if (isMultiSelect) {
        options.closeOnSelect = false;
        options.resetOnSelect = false;
    }

    // force the anchor to be the button
    options.$anchor = $el;
    this.$list = new DropdownList(options);
    this.$btn = $el;

    this.selectedElements = [];

    // check disabled
    var isDisabled = !!options.disabled;
    if (isDisabled) {
        this.toggleState(false);
    }

    // check mute
    this.muteBtn(!!options.mute);

    // override button text
    if (typeof options.getTextForBtn === 'function') {
        this.getTextForBtn = options.getTextForBtn;
    }

    var eventTriggerType = 'click';

    this.$btn
        .on(eventTriggerType, function () {
            if ($(this).hasClass('disabled')) {
                return false;
            }
            if (self.$list.data('dropdownlist').o.mute) {
                return false;
            }

            if (self.$list.is(':visible')) {
                self.$list.hsDropdownList('close');
            } else {
                self.$list.hsDropdownList('open');
            }
            return false;
        })
        .on('click', function () {
            return false;
        })
        .on('dblclick', function () {
            return false;
        })
        .addClass('_hsddbtn');

    // -- Subscribe to list events
    this.$list.on('dropdownlistchange', function (event, element) {
        if (isMultiSelect) {
            var selElements = self.$list.hsDropdownList('selectedElements');

            self.updateBtn(selElements);
            self.selectedElements = selElements;
        } else {
            self.updateBtn(element);
            self.selectedElements = [element];
        }
    });

    this.$list
        .on('dropdownlistopen', function () {
            $('._hsddbtn').removeClass('active');
            self.$btn.addClass('active');
            self.$btn.attr('aria-expanded', true)
            self.$list.addClass('active');
            self.$list.hsDropdownList('focusFirstElement');
        })
        .on('dropdownlistclose', function () {
            self.$btn.removeClass('active');
            self.$btn.attr('aria-expanded', false)
            self.$list.removeClass('active');
        });

    if (options.$cb && options.$cb.length && options.$cb.is(':checkbox')) {
        var $cb = options.$cb;
        $cb.on('change', function () {
            self.toggleState($cb.is(':checked'));
        });
        this.$list.on('dropdownlistopen', function () {
            if (!$cb.is(':checked')) {
                $cb.attr('checked', 'checked').change();
            }
        });
    }
};

$.extend(Dropdown.prototype,
    {
        btnTextClass: '_dropdownbtntext',
        getTextForBtn: function (element) {
            if (_.isArray(element)) {
                if (element.length > this.$list.data('dropdownlist').o.multiselectDisplayLength) {
                    return element.length + translation._(" items selected");
                } else {
                    var titles = [];
                    $.each(element, function (key, val) {
                        var title = val.dd.title || this.btnTextDefault;
                        titles.push(title);
                    });

                    if (titles.length === 0) {
                        return this.btnTextDefault;
                    } else {
                        return titles.join(', ');
                    }
                }
            } else {
                return element.dd.title || this.btnTextDefault;
            }
        },
        muteBtn: function (muteBool) {
            (muteBool) ? this.$btn.addClass('mute') : this.$btn.removeClass('mute');
        },
        getBtnText: function () {
            if (this.$btnText && this.$btnText.length) {
                return this.$btnText;
            }
            var $btnText = this.$btn.find('.' + this.btnTextClass);
            if ($btnText.length) {
                this.$btnText = $btnText;
                this.btnTextDefault = $btnText.text() || '';
            }
            return $btnText;
        },
        updateBtn: function (element, forceUpdate) {
            if (this.$list.data('dropdownlist').o.resetOnSelect && !forceUpdate) {
                return;
            }
            this.getBtnText().text(this.getTextForBtn(element));
        },
        getSelectedElements: function () {
            return this.selectedElements;
        },
        getSelectedElement: function () {
            return this.selectedElements[0];
        },
        getList: function () {
            return this.$list;
        },
        onchange: function (fn) {
            this.$list.on('dropdownlistchange', fn);
        },
        onclose: function (fn) {
            this.$list.on('dropdownlistclose', fn);
        },
        onopen: function (fn) {
            this.$list.on('dropdownlistopen', fn);
        },
        selectElement: function (value, key, silent) {
            return this.$list.hsDropdownList('selectElement', value, key, silent);
        },
        option: function (optionName, optionValue) {
            if (optionName === 'mute' && typeof optionValue !== 'undefined') {
                this.muteBtn(optionValue);
            }
            return this.$list.hsDropdownList('option', optionName, optionValue);
        },
        selectFirstElement: function (silent) {
            return this.$list.hsDropdownList('selectFirstElement', silent);
        },
        serialize: function () {
            if (this.$btn.hasClass('disabled')) {
                return;
            }
            return this.$list.hsDropdownList('serialize');
        },
        serializeArray: function () {
            if (this.$btn.hasClass('disabled')) {
                return;
            }
            return this.$list.hsDropdownList('serializeArray');
        },
        deselectElement: function (value, key, silent) {
            return this.$list.hsDropdownList('deselectElement', value, key, silent);
        },
        toggleState: function (bool) {
            if (typeof bool === "undefined") {
                bool = true;
            }
            if (bool) {
                this.$btn.removeClass('disabled');
            } else {
                this.$btn.addClass('disabled');
            }
        },
        disableItem: function (key, value) {
            this.$list.data('dropdownlist').disableItem(key, value);
        },
        enableItem: function (key, value) {
            this.$list.data('dropdownlist').enableItem(key, value);
        },
        close: function () {
            this.$list.hsDropdownList('close');
        }
    });

