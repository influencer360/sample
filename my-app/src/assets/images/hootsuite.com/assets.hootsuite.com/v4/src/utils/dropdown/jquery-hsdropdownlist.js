import $ from 'jquery';

/**
 * jQuery plugin for manipulating dropdown lists created with the DropdownList module
 * @name $.hsDropdownList
 * @param {String} command Command to run
 * @example
 * var $ddlist = new DropdownList({
     *         data: { items: [ { title: 'Title 1' },{ title: 'Title 2' } ] }
     * });
 * ...
 * $ddlist.hsDropdownList('selectedElement')
 * $ddlist.hsDropdownList('selectedElements')
 * $ddlist.hsDropdownList('open'[, $anchor])
 * $ddlist.hsDropdownList('close')
 * $ddlist.hsDropdownList('option', 'optionName' [, 'optionValue'] )
 */
$.fn.hsDropdownList = function (command) {
    if (this.length === 1) {
        var $this = $(this),
            dropdownListInst = $this.data('dropdownlist');
        if (!dropdownListInst) {
            throw Error('No dropdownlist instance found');
        }

        var remap = {
                'selectedElement': 'getSelectedElement',
                'selectedElements': 'getSelectedElements',
                'selectElement': 'selectElement',
                'deselectElement': 'deselectElement',
                'selectFirstElement': 'selectFirstElement',
                'getElement': 'getElement',
                'getElementByValue': 'getElementByValue',
                'open': 'open',
                'close': 'close',
                'option': 'option',
                'options': 'options',
                'hideElements': 'hideElements',
                'countVisibleRows': 'countVisibleRows',
                'addRow': 'addRow',
                'removeRow': 'removeRow',
                'resetSearch': 'resetSearch',
                'destroy': 'destroy',
                'serialize': 'serialize',
                'serializeArray': 'serializeArray',
                'focusFirstElement': 'focusFirstElement',
                'focusNextElement': 'focusNextElement',
                'focusPreviousElement': 'focusPreviousElement',
                'handleFocusSelect': 'handleFocusSelect',
                'handleFocusTab': 'handleFocusTab'
            },
            fnToRun = remap[command];

        if (fnToRun && $.isFunction(dropdownListInst[fnToRun])) {
            var args = Array.prototype.slice.call(arguments, 1);
            return dropdownListInst[fnToRun].apply(dropdownListInst, args);
        }
    }
    return this;
};

