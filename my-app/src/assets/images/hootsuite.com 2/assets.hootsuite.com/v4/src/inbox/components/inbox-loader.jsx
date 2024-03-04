import hootbus from 'utils/hootbus'
import Loader from 'hs-app-loader/components/loader'
import { getApp } from 'fe-lib-async-app'
import { recordIncrement } from 'fe-lib-recording'
import {
  setPerformanceMark,
  createPerformanceMeasure,
  getPerformanceMeasure,
  clearPerformanceMeasure,
  recordHistogramTiming,
  addTimingToMetricsTrace,
  generateWorkflowId,
  BUCKET_SIZE_10_SEC_MAX,
} from 'fe-inbox-lib-performance'

import {
    SESSION_STATUSES,
    updateSessionStatus,
    handleLoadingError,
    handleRuntimeError
} from '../utils/errors'

const PATH = '/inbox'
const APP_NAME = 'hs-app-inbox'
/**
 * Some of these constants are being mirrored in hs-app-inbox to record TTI. If variable names need to change
 * please update the names in hs-app-inbox to prevent loss of timings.
 */
const BUNDLE_FETCH_MEASURE = 'inbox-bundle-fetch'
const BUNDLE_FETCH_MEASURE_START = 'inbox-bundle-fetch-start'
const BUNDLE_FETCH_MEASURE_END = 'inbox-bundle-fetch-end'
const BUNDLE_FETCH_TIMING = 'inboxBundleFetchTime'
const OPEN_INBOX_ATTEMPT = 'engage.inbox.inbox-open-attempted' // engage.inbox. is added for consistency with how timings are accessed, and better scoping of counts

const render = (content, params) => {
    hootbus.emit('toggleCoreViews:secondary', { content: content, params: params || {} })
}

const recordBundleFetchTime = () => {
    const bundleFetchMeasure = getPerformanceMeasure(BUNDLE_FETCH_MEASURE)

    if (bundleFetchMeasure && bundleFetchMeasure.duration > 0) {
        const startTime = bundleFetchMeasure.startTime
        const duration =  bundleFetchMeasure.duration
        const endTime = startTime + duration

        addTimingToMetricsTrace(BUNDLE_FETCH_TIMING, duration, startTime, endTime)
        recordHistogramTiming(BUNDLE_FETCH_TIMING, duration, BUCKET_SIZE_10_SEC_MAX)
    }
}

export default function (params) {
    try {
        // Creates a object on the window for tracking timings of network calls and JS functions for SLO use
        generateWorkflowId()
        recordIncrement(OPEN_INBOX_ATTEMPT)
        clearPerformanceMeasure(BUNDLE_FETCH_MEASURE)
        setPerformanceMark(BUNDLE_FETCH_MEASURE_START)
        render(Loader)

        hs.dashboardState = 'inbox'

        getApp(APP_NAME)
            .then( app => {
                setPerformanceMark(BUNDLE_FETCH_MEASURE_END)
                createPerformanceMeasure(BUNDLE_FETCH_MEASURE, BUNDLE_FETCH_MEASURE_START, BUNDLE_FETCH_MEASURE_END)
                recordBundleFetchTime()
                var node = document.createElement('div')
                updateSessionStatus(SESSION_STATUSES.SUCCESS)
                app.mount(node, {})
                render(node, params)

                const cleanup = () => {
                    if (!app.isPath(PATH)) {
                        app.unmount(node)
                        updateSessionStatus(SESSION_STATUSES.SUCCESS)
                        hootbus.off('address:path:change', cleanup)
                    }
                }

                hootbus.on('address:path:change', cleanup)
            })
            .catch(e => handleLoadingError(e, APP_NAME))

        hootbus.on('inbox.errors.ErrorBoundaryError', e => handleRuntimeError(e.error, APP_NAME))
    } catch (e) {
      handleLoadingError(e, APP_NAME)
    }
}
