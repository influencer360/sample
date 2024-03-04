import { init, Integrations, ModuleMetadata, setUser, BrowserTracing, Replay } from '@sentry/browser';
import { scopeAndHandleSentryCapturedException } from '../stream/utils/errors';
import get from 'lodash/get'

/**
 * Function to filter breadcrumbs, for further details about the event object visit
 * [sentry dev doc]{@link https://develop.sentry.dev/sdk/event-payloads/breadcrumbs}
 */
const beforeBreadcrumb = event => {
    if (!(event.category === 'xhr' || event.category === 'fetch')) {
        return event;
    }

    const regExps = [
        /rs\.fullstory\.com/,
        /clarity\.ms/,
        /cdn\.cookielaw\.org/,
        /ekr\.zdassets\.com/,
        /hootsuite\.com\/async-apps\/.*\.txt/,
        /kinesis.*\.amazonaws\.com/,
        /.*\/ejs-package.js/
    ];

    for (const regExp of regExps) {
        if (event.data.url.match(regExp)) {
            return null;
        }
    }

    return event;
}

const getAsyncAppMetadata = (event) => {
    const frames = get(event, 'exception.values[0].stacktrace.frames', []);

    const [metadata] = frames
        .filter(frame =>
            frame.in_app &&
            frame.module_metadata &&
            frame.module_metadata.appName &&
            frame.module_metadata.release
        )
        // We take the last element to identify the nearest async-app
        .slice(-1)
        .map(({module_metadata}) => module_metadata);

    return metadata ? ({
        asyncApp: metadata.appName,
        'asyncApp.release': metadata.release,
    }) : null;
}

const getAsyncAppMetadataBestEffort = (event) => {
    const exceptions = event.exception && event.exception.values || [];
    let asyncAppName = null;

    exceptions.find(function (exception) {
        const frames = exception.stacktrace && exception.stacktrace.frames || [];

        return Boolean(frames.find(function (frame) {
            const match = /async-apps\/(hs-app-[a-z-]+)\//.exec(frame.filename)
            if (match) {
                asyncAppName = match[1]
            }

            return Boolean(match)
        }));
    });

    return asyncAppName ? {
        asyncApp: asyncAppName
    }: null;
}

const beforeSend = event => {
    const metadata = getAsyncAppMetadata(event) || getAsyncAppMetadataBestEffort(event) || []

    event.tags = { ...(event.tags || {}), ...metadata }

    handleRejections(event);
    // Scope and log Streams exceptions
    scopeAndHandleSentryCapturedException(event);

    return event;
}

/**
 * Handling errors when no stacktrace is found or message does not contain further details, therefore,
 * we have to rely on request url since no fingerprint rule can be created
 */
const handleRejections = event => {
    const exceptions = event.exception && event.exception.values || [];

    exceptions.find(e => {
        if (e.type === 'UnhandledRejection') {
            handleRejectionsByRequestUrl(event);
            return true;
        }

        return false;
    });
}

const handleRejectionsByRequestUrl = event => {
    const url = event.request.url;
    let bundledApp;
    event.tags = event.tags || {}

    if (url.includes('#/streams')) {
        bundledApp = 'hs-app-streams';
    }

    event.tags['bundledApp'] = bundledApp;
}

/**
 * ### WARNING IF YOU UPGRADE SENTRY
 *
 * We are using the ModuleMetadata integration which reads data from the Webpack Sentry Plugin.
 * In our hs-app-scripts Webpack base config, we send data through the _experiments key in the
 * config object. The documentation says:
 *
 * Options that are considered experimental and subject to change.
 * This option does not follow semantic versioning and may change in any release.
 *
 * So, if we upgrade Sentry, please check if the events are tagged properly or if we have
 * to change the configuration in Webpack
 */
export const initSentry = () => {
    setUser({
        id: hs.memberId
    });
    init({
        dsn: 'https://2bea6ab5bb164c528a8532db0d4921c6@o3805.ingest.sentry.io/5493994',
        environment: hs.env,
        integrations: [
            new BrowserTracing(),
            new Integrations.Breadcrumbs({
                console: false,
            }),
            new ModuleMetadata(),
            new Replay({
                beforeErrorSampling: (error) => {
                    if (hs.env === "production" && error.request?.url?.includes("dashboard#/inbox2")) {
                        return true;
                    }
                    return false;
                },
            })
        ],
        sampleRate: 0.25,
        tracesSampleRate: 0.0025,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0.01,
        beforeBreadcrumb,
        beforeSend
    });
}
