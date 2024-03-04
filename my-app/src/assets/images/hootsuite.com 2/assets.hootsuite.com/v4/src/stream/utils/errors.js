import { captureException } from "@sentry/browser"
import { logError } from 'fe-lib-logging'
import { recordIncrement } from 'fe-lib-recording'

const SESSION_STATUSES = {
    SUCCESS: "SUCCESS",
    ERROR: "ERROR",
};
const validValues = Object.keys(SESSION_STATUSES);
const PRODUCT_NAME = "streams";
const SESSION_FAILURE = "engage.streams.session-errored";
const STREAMS_FILENAME_REGEX = /stream\//
const STREAMS_ASYNC_APP_FILENAME_REGEX = /async-apps\/hs-app-streams-async\//
const STREAMS_APP_FILENAME_REGEX = /hs-app-streams\//

let sessionStatus = SESSION_STATUSES.SUCCESS;

function updateSessionStatus(status) {
    if (validValues.indexOf(status) !== -1) {
        sessionStatus = status;
    } else {
        // eslint-disable-next-line no-console
        console.error('Streams session status "' + status + '" is not supported. Supported values: ' + validValues.toString())
    }
}

function recordError(e, logData) {
    e.tags = e.tags || {}
    e.tags['product'] = PRODUCT_NAME;
    captureException(e); // send error to Sentry

    // report the first front-end error from a Streams session to Sumo and Prometheus.
    // subsequent errors from the same session won't be reported.
    if (sessionStatus === SESSION_STATUSES.ERROR) return;
    logError(PRODUCT_NAME, "[Streams] error", logData); // log error to Sumo logic
    recordIncrement(SESSION_FAILURE); // send error to Prometheus
    updateSessionStatus(SESSION_STATUSES.ERROR);
}

/**
 * Handle Sentry captured exceptions
 */
export function handleException(e, additionalData = {}) {
    const exceptionList = e.exception && e.exception.values || [];
    const exception = exceptionList[0] || {}
    const logData = {
        errorMessage: JSON.stringify(exception.value),
        level: e.level,
        event_id: e.event_id,
        stack: JSON.stringify(exception.stacktrace),
        additionalData: JSON.stringify(additionalData),
    };

    recordError(e, logData);
}

/**
 * Handle async errors that Sentry is not able to capture.
 * Use it in the rejection callback or catch block of a Promise object, or in a setTimeout function.
 */
export function handleError(e) {
    const logData = {
        errorMessage: e.message,
        stack: e.stack,
        level: 'error'
    };
    recordError(e, logData);
}

export function scopeAndHandleSentryCapturedException(e) {
    const exceptions = e.exception && e.exception.values || [];

    exceptions.find(function (exception) {
        const frames = exception.stacktrace && exception.stacktrace.frames || [];

        return Boolean(frames.find(function (frame) {
            const match = STREAMS_FILENAME_REGEX.exec(frame.filename)
                || STREAMS_ASYNC_APP_FILENAME_REGEX.exec(frame.filename)
                || STREAMS_APP_FILENAME_REGEX.exec(frame.filename);
            if (match) {
                handleException(e)
            }

            return Boolean(match);
        }));
    });
}
