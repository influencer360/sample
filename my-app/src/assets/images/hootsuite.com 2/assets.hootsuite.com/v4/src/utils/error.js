import _ from 'underscore';

/**
 * JS Error Object
 * @typedef {Object} JSError
 * @property {String} errorMsg - Error message
 * @property {String} file - File URL
 * @property {Number} lineNumber - the line number where the error occurred
 * @property {Number} [colNumber] - the column number where the error occurred
 * @property {String} hash - Window location hash
 * @property {String} jsVersion - Front End staticVersion
 * @property {Number} timeStamp - JS timestamp
 * @property {Number} [elapsedTime] - time since start in seconds
 */

/**
 * JavaScript Error Log Handler
 */
var jsErrorsLogHandler = {
    defaultMsInterval: 10000,
    ajaxReportURL: '/ajax/error/report-js-error',
    consecutiveReportMax: 3,
    nonConsecutiveReportMax: 10,
    consecutiveReport: 0,
    nonConsecutiveReport: 0,
    stackMaxLines: 30,
    buffer: function (error) {
        // check if error should be logged first
        if (this.isLoggable(error)) {
            error = this._truncateStack(error);
            error = this._addElapsedTime(error);
            this.errorsData.push(error);
        }
    },
    /**
     * Check if an error with the identical errorMsg is already in the queue
     * @param {JSError} error
     * @returns {Boolean}
     */
    isAlreadyLogged: function (error) {
        return _.some(this.errorsData, function (loggedError) {
            return loggedError.errorMsg === error.errorMsg;
        });
    },
    isLoggable: function (error) {

        // check if error is an object
        if (!_.isObject(error)) { return false; }

        // check if there is a errorMsg property, and if that property is a valid String
        if (!Object.prototype.hasOwnProperty.call(error, 'errorMsg') || !_.isString(error.errorMsg)) { return false; }
        var errorMsg = error.errorMsg;

        // check if there is a file property, and if that property is a valid String
        if (!Object.prototype.hasOwnProperty.call(error, 'file') || !_.isString(error.file)) { return false; }
        var errorFile = error.file;

        if (this.isAlreadyLogged(error)) {
            return false;
        }

        // exclude IE7, IE8 errors (sometimes thrown when browser is in compatibility mode)
        if (/^Expected identifier/.test(errorMsg)) { return false; }
        if (/^Invalid character/.test(errorMsg)) { return false; }

        // Firefox only
        if (/Permission denied to access property/.test(errorMsg)) { return false; }
        if (errorMsg == ":") { return false; }
        if (/AMCore is not defined/.test(errorMsg)) { return false; }
        // Exclude error that occurs when leaving a page in Firefox before all scripts have finished loading
        if (errorMsg == "Error loading script") { return false; }
        // exclude all NS_ERROR messages (NS_ERROR_DOM_NOT_SUPPORTED_ERR|NS_ERROR_FAILURE|NS_ERROR_FILE_CORRUPTED)
        if (/NS_ERROR_/.test(errorMsg)) { return false; }

        // exclude firebug error
        if (/^Unspecified error/.test(errorMsg)) { return false; }

        // exclude NPObject (probably due to flash and the swfobject library)
        if (/NPObject/.test(errorMsg)) { return false; }

        // exclude Automation server can't create object (related to IE7 and ActiveX)
        if ("Automation server can't create object" === errorMsg) { return false; }

        // exclude all "script error" messages (same origin policy issue)
        if (/^Script error\.*$/i.test(errorMsg)) { return false; }

        // exclude errors thrown by avast 2014 plugin for IE
        if (/^Could not complete the operation due to error 8070000c/.test(errorMsg)) { return false; }
        if (errorMsg == "Invalid procedure call or argument") { return false; }

        // exclude all comet.hootsuite.com errors
        var cometUrl = 'https://comet.hootsuite.com/comet?callback';
        if (errorMsg.indexOf(cometUrl) !== -1 || errorFile.indexOf(cometUrl) !== -1) { return false; }

        // exclude chrome extensions and other external resources
        if (!/^http/.test(errorFile)) { return false; }

        // Exclude balkannews24.info (wordpress website including our own JavaScript bundles)
        if (errorFile.indexOf('http://www.balkannews24.info') === 0) { return false; }

        return true;
    },
    init: function (delay) {
        var self = this;
        this.delay = delay || this.defaultMsInterval;
        this.errorsData = [];
        // the first report should be posted quickly
        window.setTimeout(function () {
            self.report();
            // then start the timer
            self.start();
        }, 4000);
        return this;
    },
    start: function () {
        var self = this;
        this.intervalID = window.setInterval(function () {
            self.report();
        }, this.delay);
    },
    stop: function () {
        window.clearInterval(this.intervalID);
    },
    report: function () {
        if (this.errorsData.length) {
            var ajaxData = {jsErrors: this.errorsData};
            // empty the buffer
            this.errorsData = [];
            ajaxCall({
                type: 'POST',
                url: this.ajaxReportURL,
                data: ajaxData
            }, 'qm');
            // increment the number of consecutive reports
            // and check if it is higher or equal to the max
            if (++this.nonConsecutiveReport >= this.nonConsecutiveReportMax || ++this.consecutiveReport >= this.consecutiveReportMax) {
                this.stop();
            }
        } else {
            this.consecutiveReport = 0;
        }
    },
    /**
     * Truncate the stack trace string
     * @private
     * @return {JSError}
     */
    _truncateStack: function (error) {
        if (_.isString(error.stack)) {
            error.stack = error.stack.split("\n").splice(0, this.stackMaxLines).join("\n");
        }
        return error;
    },
    /**
     * Add elapsed time since the user loaded the page
     * @private
     * @return {JSError}
     */
    _addElapsedTime: function (error) {
        // log number of seconds since the page was loaded when available
        if (_.isObject(window.performance) && _.isFunction(window.performance.now)) {
            error.elapsedTime = Math.floor(window.performance.now() / 1000);
        }
        return error;
    }
};
jsErrorsLogHandler.init();


window.onerror = function (errorMsg, url, lineNumber, colNumber, error) {
    var shouldReport = (hs.memberId && hs.isReportJsErrors);

    // extend reporting to users not logged in
    if (hs.isFeatureEnabled('LOG_JS_ERRORS_LANDING_PAGES')) {
        if (!hs.memberId) {
            shouldReport = true;
        }
    }

    if (shouldReport) {
        if (errorMsg) {

            var errorObj = {
                errorMsg: errorMsg,
                file: url,
                lineNumber: lineNumber,
                hash: window.location.hash,
                jsVersion: hs.c.staticVersion,
                timeStamp: (new Date().getTime())
            };

            // log column number if available
            if (_.isNumber(colNumber)) {
                errorObj.colNumber = colNumber;
            }
            // log error.stack if available
            if (_.isObject(error) && _.isString(error.stack)) {
                errorObj.stack = error.stack;
            }

            jsErrorsLogHandler.buffer(errorObj);
        }
    }
    return false;
};

export default jsErrorsLogHandler;
