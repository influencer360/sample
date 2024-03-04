import $ from 'jquery';

/**
 * Find the positions of an element in an array
 * @param {Array} array Array
 * @param {String} searchStr String to search
 * @returns Array of positions or false if no match
 */

var arrayFind = function (array, searchStr) {
    var returnArray = false;
    for (var i = 0; i < array.length; i++) {
        if ($.isFunction(searchStr)) {
            if (searchStr.test(array[i])) {
                if (!returnArray) {
                    returnArray = [];
                }
                returnArray.push(i);
            }
        } else {
            if (array[i] === searchStr) {
                if (!returnArray) {
                    returnArray = [];
                }
                returnArray.push(i);
            }
        }
    }
    return returnArray;
};

/**
 * Manage throbber/spinner buttons
 * 3 objects for the different types: 1)in-line button/throbber, 2)in-line spinner, 3)global spinner
 *
 * @constructor
 * @param {String} c The class to apply to elements that ave throbber/spinner active
 */
var ButtonManager = function (c) {
    /**
     * Array of names of all form button/anchor elements that have throbber/spinner active (class names)
     * @type Array
     */
    this.elements = [];
    /**
     * Class to apply to elements that ave throbber/spinner active
     * @type {String}
     */
    this.c = c;
    /**
     * Add element with class 'el' to array and add active 'class' to it
     * @param {String} el The class of the element to add
     */
    this.add = function (el, strLoadingText) {
        var $el = $(el);
        //if(!$el.hasClass(this.c) && this.elements.find(el) === false)
        if (!$el.hasClass(this.c) && arrayFind(this.elements, el) === false) {
            var innerHtml = $el.data('innerHtml');
            if (!innerHtml) {
                $el.data('innerHtml', $el.html());
            }

            if (strLoadingText) {
                $el.html(strLoadingText);
            } else {
                $el.css({
                    'paddingLeft': $el.width() + parseInt($el.css('paddingLeft'), 10) - 5 + 'px'
                })
                    .addClass(this.c)
                    .html('&nbsp;');
            }

            this.elements.push(el);
        }
    };
    /**
     * Bring an element to its normal state
     * @param {jQuery} $el jQuery element
     */
    this.removeHelper = function ($el) {
        var innerHtml = $el.data('innerHtml');
        if (innerHtml && innerHtml.length) {
            $el.removeClass(this.c)
                .css({'paddingLeft': ''})
                .data('innerHtml', null)	// clear
                .html(innerHtml);
        }
    };
    /**
     * remove element with class 'el' from array and remove 'class' from it
     * @param {jQuery} $el jQuery element
     */
    this.remove = function (el) {
        //var pos = this.elements.find(el);
        var pos = arrayFind(this.elements, el);
        if (pos !== false) {
            var $el = $(el);
            this.removeHelper($el);
            this.elements.splice(pos, 1);
        }
    };
    /**
     * Remove 'class' from all in elements array and then reset elements array
     */
    this.removeAll = function () {
        for (var i = 0; i < this.elements.length; i++) {
            var $el = $(this.elements[i]);
            this.removeHelper($el);
        }
        this.elements = [];
    };
};

var cssClass = 'btn-throbber'; // class to add to throbbers

// preload
$(document).ready(function () {
    $('body').append('<a style="position:absolute; top:-999px; left:0px; width: 100px; height: 30px;" class="btn-cta btn-type1 ' + cssClass + '">&nbsp;</a>');
});

var throbberMgrObj = new ButtonManager(cssClass);

hs.throbberMgrObj = throbberMgrObj;

export default throbberMgrObj;

