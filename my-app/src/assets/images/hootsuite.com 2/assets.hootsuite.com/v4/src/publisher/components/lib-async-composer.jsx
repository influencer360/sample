import { getApp } from 'fe-lib-async-app';
import { recordIncrement } from "fe-lib-recording"
import { OPEN_COMPOSER_ATTEMPT, OPEN_COMPOSER_FAILED } from 'publisher/components/metric-names';
import { logError } from "fe-lib-logging";
import LOGGING_CATEGORIES from 'publisher/logging-categories';

export const getAppComposer = async () => {
    try {
        recordIncrement(OPEN_COMPOSER_ATTEMPT);
        return await getApp('hs-app-composer');
    } catch (e) {
        if (!e.logged) {
            logError(
                LOGGING_CATEGORIES.NEW_COMPOSER,
                'Composer - failed to fetch bundle',
                {
                    errorMessage: JSON.stringify(e.message),
                    stack: JSON.stringify(e.stack),
                },
            );
        }
        recordIncrement(OPEN_COMPOSER_FAILED)
    }
};
