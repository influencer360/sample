import { captureException } from "@sentry/browser"
import { logError } from 'fe-lib-logging'
import { recordIncrement } from 'fe-lib-recording'

export const SESSION_STATUSES = {
    SUCCESS: "SUCCESS",
    ERROR: "ERROR",
};
const validValues = Object.keys(SESSION_STATUSES);
const APP_NAME = "hs-app-inbox";
const OPEN_INBOX_FAILURE = "engage.inbox.inbox-open-failure"; // engage.inbox. is added for consistency with how timings are accessed, and better scoping of counts
const SESSION_FAILURE = "engage.inbox.session-errored";


var sessionStatus = SESSION_STATUSES.SUCCESS;

export function getSessionStatus() {
    return sessionStatus;
}

export function updateSessionStatus(status) {
    if (validValues.indexOf(status) !== -1) {
        sessionStatus = status;
    } else {
        // eslint-disable-next-line no-console
        console.error('Inbox session status "' + status + '" is not supported. Supported values: ' + validValues.toString())
    }
}

function recordError(msg, e, product) {
    if (!e.logged) {
        logError(APP_NAME, msg, {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
        });
        e.tags = e.tags || {}
        e.tags['product'] = product;
        captureException(e);
    }
}

export function handleLoadingError(e, product) {
    if (sessionStatus === SESSION_STATUSES.ERROR) return;
    recordError("[Inbox] Loading error", e, product);
    recordIncrement(OPEN_INBOX_FAILURE);
    updateSessionStatus(SESSION_STATUSES.ERROR);
}

export function handleRuntimeError(e, product) {
    if (sessionStatus === SESSION_STATUSES.ERROR) return;
    recordError("[Inbox] Runtime error", e, product);
    recordIncrement(SESSION_FAILURE);
    updateSessionStatus(SESSION_STATUSES.ERROR);
}
