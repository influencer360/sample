// Composer manager dashboard dependencies
import { getAppComposer } from 'publisher/components/lib-async-composer';
import appapi from '../../appapi.js';
import FluxComponent from 'hs-nest/lib/components/flux-component';
import getHsAppTagmanager from '../../tagmanager/get-hs-app-tagmanager';
import { publisherFlux as flux } from 'publisher/flux/store';
import ajaxQueueManager from 'utils/ajax-queue-manager';
import { abortStreamRefresh } from 'hs-app-streams/lib/services/message-list';

import { logError } from 'fe-lib-logging';
import LOGGING_CATEGORIES from 'publisher/logging-categories';
import { recordTiming } from 'fe-lib-recording';
import darklaunch from 'utils/darklaunch';
import { emit } from 'fe-lib-hootbus';

import { createCTTIInstance, deleteCTTIInstances } from 'fe-pnc-lib-ctti'
import { cttiBackend, windowLengthMs } from '../../components/publisher/ctti-instrumentation'

// the below functions were taken from render-full-screen-composer
// TODO: QA and pass in as common context
let didAbortStreams = false;
const handleStreamsOnOpen = () => {
    if (ajaxQueueManager('qstream').inProgress > 0) {
        if (darklaunch.isFeatureEnabled('PUB_25645_ABORT_ERROR_FIX')) {
            stream.stream.abortRefreshes();
        } else {
            ajaxQueueManager('qstream').abort();
        }
        didAbortStreams = true;
    }
};

const handleStreamsRefresh = () => {
    if (didAbortStreams) {
        emit('streams:board:refresh');
        didAbortStreams = false;
    }
};

const showAutoScheduleFn = () => {
    window.loadSettings('autoschedule')
};

const LOAD_MARK_START = 'full-screen-composer-fetch';
const LOAD_MARK_END = 'full-screen-composer-loaded';
const LOAD_MEASURE = 'full-screen-composer-loading-performance'; // used in hs-app-composer


// this function consumes different props depending on what kind of composer is to be opened
// for the most part there will be a message/draft/template object with associated data
// (an empty message object for new post) andits corresponding messageId/draftId/templateId,
// it grabs any dashboard dependencies needed by all composers and sends them through to the
// composer manager in hs-app-composer
export const renderComposer = ({ ...props }) => {

    hs.statusObj.reset();

    if (darklaunch.isFeatureEnabled('LPLAT_2324_FIX_STREAMS_ABORT_ERROR')) {
        abortStreamRefresh();
    } else {
        handleStreamsOnOpen();
    }

    const commonContextFromDashboard = {
        onDataLoaded: handleStreamsRefresh,
        saveToAmplify: appapi.dashboardFunc.saveMessageFromNC,
        isAppEnabled: appapi.dashboardFunc.isAppEnabled,
        showAutoScheduleSettings: showAutoScheduleFn,
        flux,
        FluxComponent,
    }

    // This starts CTTI tracking for FullScreenComposer and sets the start time
    deleteCTTIInstances();
    createCTTIInstance({ namespace: 'Composer', backend: cttiBackend, timer: performance, windowLengthMs: windowLengthMs });

    performance.mark(LOAD_MARK_START);
    getAppComposer().then(async ({ renderComposerV2 }) => {
        //making sure tagmanager flux store has been loaded
        await getHsAppTagmanager();

        try {
            performance.mark(LOAD_MARK_END);
            performance.clearMeasures(LOAD_MEASURE);
            performance.measure(LOAD_MEASURE, LOAD_MARK_START, LOAD_MARK_END); // used in hs-app-composer
            const measure = performance.getEntriesByName(LOAD_MEASURE);
            if (measure && Array.isArray(measure) && measure.length) {
                if (measure[0].duration > 0) {
                    recordTiming('fullscreencomposer.performance.bundleLoaded', {
                        value: measure[0].duration,
                        statType: 'timing',
                        splitByLocation: true,
                    })
                }
            }
            performance.clearMarks(LOAD_MARK_END);
            performance.clearMarks(LOAD_MARK_START);
        } catch (e) {
            // If there's a error with measuring performance its non-critical and can be ignored.
            // It's likely other code clearing all marks or the performance buffer filling up.
        }
        renderComposerV2({
            ...commonContextFromDashboard,
            ...props
        }).catch(e => {
            if (!e.logged) {
                logError(
                    LOGGING_CATEGORIES.NEW_COMPOSER,
                    `New Composer - failed to render`,
                    {
                        errorMessage: JSON.stringify(e.message),
                        stack: JSON.stringify(e.stack),
                    },
                );
                e.logged = true
            }

            if (darklaunch.isFeatureEnabled('LPLAT_2324_FIX_STREAMS_ABORT_ERROR')) {
                emit('streams:board:refresh');
            } else {
                handleStreamsRefresh();
            }
        })
    });
}
