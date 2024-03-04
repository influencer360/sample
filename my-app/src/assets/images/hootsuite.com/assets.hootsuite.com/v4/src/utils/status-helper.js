import _ from 'underscore';
import statusObj from 'utils/status_bar';
import translation from 'utils/translation';
import darklaunch from 'utils/darklaunch';
var statusHelper = {
    _extractMessage: function (data, fallback) {
        var message = _.isString(fallback) ? fallback : translation.c.ERROR_GENERIC;
        if (data && data.message) {
            message = data.message;
        } else if (data && data.errorMessage) {
            message = data.errorMessage;
        } else if (data && data.errorMsg) {
            message = data.errorMsg;
        }
        return message;
    },
    /**
     * Will display an error message if the data object has errorMessage, errorMsg, or message defined
     *
     * @param data
     */
    displayError: function (data) {
        var message = this._extractMessage(data);
        if (darklaunch.isFeatureEnabled('CUXF_INCREASE_TOAST_TIME') && message.length > 90) {
            statusObj.update(message, 'error', true, 12000);
        } else {
            statusObj.update(message, 'error', true);
        }
    },

    /**
     * Similar to displayError, but will not show default message
     * @param data
     */
    displayErrorIfDefined: function (data) {
        if (this._extractMessage(data, '') !== '') {
            this.displayError(data);
        }
    },

    /**
     * Same displayError but with warning level set instead
     * @param data
     */
    displayWarning: function (data) {
        statusObj.update(this._extractMessage(data), 'warning', true);
    },

    /**
     * For use as an even callback function (rather than redefining all over the place)
     */
    displayLoading: function () {
        statusObj.update(translation.c.LOADING, 'info', true);
    },

    /**
     * Used often enough
     */
    displaySuccess: function () {
        statusObj.update(translation._("Success!"), 'success', true);
    }
};

_.bindAll(statusHelper, 'displayError', 'displayWarning', 'displayErrorIfDefined');

export default statusHelper;

