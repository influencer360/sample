var primaryViewId = 'primaryView';
var secondaryViewId = 'secondaryView';

import CoreViewHelper from './core-view-helper';
var primaryViewHelper = new CoreViewHelper(primaryViewId);
var secondaryViewHelper = new CoreViewHelper(secondaryViewId);

/**
 * Returns the appropriate view helper
 * @param {string} [type]
 * @returns {CoreViewHelper}
 */
var getHelper = function (type) {
    if (type === 'primary') {
        return primaryViewHelper;
    }  else {
        return secondaryViewHelper;
    }
};

export default {
    /**
     * Returns the view id
     * @param {string} [type] - View type, use 'primary' for the primaryView
     * @returns the view id ('secondaryView' or 'primaryView')
     */
    getId: function (type) {
        return getHelper(type).getId();
    },
    /**
     * Returns the view selector
     * @param {string} [type] - View type, use 'primary' for the primaryView
     * @returns the view selector ('#secondaryView' or '#primaryView')
     */
    getSelector: function (type) {
        return getHelper(type).getSelector();
    },
    /**
     * Returns the view jquery element
     * @param {string} [type] - View type, use 'primary' for the primaryView
     * @returns the view jquery element ($('#secondaryView') or $('#primaryView'))
     */
    getjQueryElement: function (type) {
        return getHelper(type).getjQueryElement();
    },
    /**
     * Whether the targeted view is loaded, has content
     * @param {string} [type] - View type, use 'primary' for the primaryView
     * @returns {boolean}
     */
    isLoaded: function (type) {
        return getHelper(type).isLoaded();
    },
    /**
     * Whether the targeted view is visible
     * @param {string} [type] - View type, use 'primary' for the primaryView
     * @returns {boolean}
     */
    isVisible: function (type) {
        return getHelper(type).isVisible();
    },
    /**
     * Whether the targeted view is both visible and loaded with data
     * @param {string} [type] - View type, use 'primary' for the primaryView
     * @returns {boolean}
     */
    isActive: function (type) {
        return getHelper(type).isActive();
    }
};
