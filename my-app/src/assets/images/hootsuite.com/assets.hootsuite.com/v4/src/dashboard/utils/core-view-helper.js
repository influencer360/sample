import $ from 'jquery';

/**
 * CoreViewHelper class
 * @param elementId - The dom element id without the #
 * @constructor
 */
var CoreViewHelper = function (elementId) {
    this.elementId = elementId;
};
/**
 * Returns the view id (for example myId)
 * @returns {string}
 */
CoreViewHelper.prototype.getId = function () {
    return this.elementId;
};
/**
 * Returns the view selector (for example #myId)
 * @returns {string}
 */
CoreViewHelper.prototype.getSelector = function () {
    return '#' + this.elementId;
};
/**
 * Returns the view jquery element
 * @returns {jQuery}
 */
CoreViewHelper.prototype.getjQueryElement = function () {
    return $(this.getSelector());
};
/**
 * Returns whether the view is loaded and has children
 * @returns {boolean}
 */
CoreViewHelper.prototype.isLoaded = function () {
    return this.getjQueryElement().children().length > 0;
};
/**
 * Returns whether the view is visible
 * @returns {boolean}
 */
CoreViewHelper.prototype.isVisible = function () {
    return this.getjQueryElement().is(':visible');
};
/**
 * Returns whether the view is visible and has children
 * @returns {boolean}
 */
CoreViewHelper.prototype.isActive = function () {
    return this.isVisible() && this.isLoaded();
};

export default CoreViewHelper;
