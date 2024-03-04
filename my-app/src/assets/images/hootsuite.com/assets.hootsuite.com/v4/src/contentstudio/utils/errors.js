import { captureException } from "@sentry/browser";
import { logError } from "fe-lib-logging";

export const SESSION_STATUSES = {
    SUCCESS: "SUCCESS",
    ERROR: "ERROR",
};
const validValues = Object.keys(SESSION_STATUSES);

var sessionStatus = SESSION_STATUSES.SUCCESS;

export function updateSessionStatus(status) {
    if (validValues.indexOf(status) !== -1) {
        sessionStatus = status;
    } else {
        // eslint-disable-next-line no-console
        console.error(
            'Content studio session status "' +
                status +
                '" is not supported. Supported values: ' +
                validValues.toString()
        );
    }
}

function recordError(msg, e, product) {
    if (!e.logged) {
        logError(product, msg, {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
        });
        captureException(e);
    }
}

export function handleLoadingError(e, product) {
    recordError("[Content studio] Loading error", e, product);
}

export function handleRuntimeError(e, product) {
    if (sessionStatus === SESSION_STATUSES.ERROR) return;
    recordError("[Content studio] Runtime error", e, product);
    updateSessionStatus(SESSION_STATUSES.ERROR);
}
