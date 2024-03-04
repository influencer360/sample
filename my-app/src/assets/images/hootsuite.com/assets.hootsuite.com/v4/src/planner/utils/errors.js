import { logError } from 'fe-lib-logging';
import { recordIncrement } from 'fe-lib-recording';
import LOGGING_CATEGORIES from 'publisher/logging-categories';
import { recordLoadFailed } from './metrics';

const PLANNER_SESSION_FAILURE = 'plancreate.planner.session-errored';
export const SESSION_STATUSES = {
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR',
};
const validValues = Object.keys(SESSION_STATUSES);
let sessionStatus = SESSION_STATUSES.SUCCESS;

// For testing only
export function getSessionStatus() {
    return sessionStatus;
}

export const updateSessionStatus = (status) => {
    if (validValues.indexOf(status) !== -1) {
        sessionStatus = status;
    }
};

export function handleLoadingError(loadingErrorMsg, e) {
    if (sessionStatus === SESSION_STATUSES.ERROR) return;
    logError(LOGGING_CATEGORIES.PLANNER, loadingErrorMsg, {
        errorMessage: JSON.stringify(e.message),
        stack: JSON.stringify(e.stack),
        secondaryView: !!document.getElementById('secondaryView'),
        path: window.location.href,
    });
    recordLoadFailed();
    updateSessionStatus(SESSION_STATUSES.ERROR);
}

export const handleRuntimeError = (e) => {
    if (sessionStatus === SESSION_STATUSES.ERROR) return;
    const { error, info } = e;
    logError(LOGGING_CATEGORIES.PLANNER, '[Planner FE] Runtime error', {
        errorMessage: JSON.stringify(error.message),
        stack: JSON.stringify(error.stack),
        componentStack: info ? info.componentStack : null,
    });
    recordIncrement(PLANNER_SESSION_FAILURE);
    updateSessionStatus(SESSION_STATUSES.ERROR);
};
