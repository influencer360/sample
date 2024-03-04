import $ from 'jquery';
import _ from 'underscore';
import darklaunch from 'utils/darklaunch';
import localQueue from 'utils/local-queue';
import serverTime from 'utils/server-time';
import KinesisClient from 'utils/aws/kinesis-producer-client';
import jsErrorsLogHandler from 'utils/error';
import hootbus from 'utils/hootbus';

var QUEUE_STREAM_NAME = "datalab-events";
var MAX_EVENTS_PER_QUEUE_TO_LOAD = 500;

// dev and staging share a Kinesis stream; production has its own
var KINESIS_STREAM_NAME;

if (hs.env === 'production') {
    KINESIS_STREAM_NAME = 'events.us-east-1';
} else if (hs.env === 'staging') {
    KINESIS_STREAM_NAME = 'frontend.staging';
} else {
    KINESIS_STREAM_NAME = 'dashboard-frontend.dev';
}

var trackClickEvent = function (jqEvent) {
    // Get the DOM element being clicked
    var $target = $(jqEvent.currentTarget);

    // Extract any tracking data from the event
    var originId = $target.data("tracking-origin");
    var actionId = $target.data("tracking-action");

    var event = {
        actor: hs.memberId,
        action: actionId,
        origin: originId,
        timestamp: darklaunch.isFeatureEnabled('DATA_588_ADD_UX_EVENT_MILLISECONDS') ? serverTime.now().dateString("yyyy-MM-dd'T'HH:mm:ss.SSS") : serverTime.now()
    };

    recordGAEventIfNotLoggedIn(event);

    // Do not add an event if member id doesn't exist
    if (hs.memberId === null) { return; }

    // Add the click event to a record queue
    localQueue.putRecord(QUEUE_STREAM_NAME, event);
};

/**
 * Logs a custom front end event to the AWS Kinesis events stream
 *
 * @param originId - String
 * @param actionId - String
 * @param eventDetails - Object (optional) If eventDetails is greater that > 2 Kb
 * it will be removed from the event and only the originId and actionId will be logged.
 */
var trackCustomEvent = function (originId, actionId, eventDetails) {

    var event = {
        actor: hs.memberId,
        action: actionId,
        origin: originId,
        timestamp: serverTime.now()
    };

    recordGAEventIfNotLoggedIn(event);

    // Do not add an event if member id doesn't exist
    if (hs.memberId === null) { return; }

    var asJsonString = function (obj) {
        return JSON ? JSON.stringify(obj) : "";
    };

    // If additional tracking details are included, add them to the event
    if (hs.isFeatureEnabled('DT_2387_INCREASE_EVENT_DETAIL_SIZE')) {
        var MAX_DETAILS_LENGTH = 2048;

        if (!_.isUndefined(eventDetails)) {

            var detailsExceedMaxLength = asJsonString(eventDetails).length > MAX_DETAILS_LENGTH;

            if (!detailsExceedMaxLength) {

                event['details'] = eventDetails;

            } else {

                event['details'] = { "max_frontend_size_exceeded": "TRUE" };

                jsErrorsLogHandler.buffer({
                    errorMsg: "Custom event details exceeded max length of " + MAX_DETAILS_LENGTH + ". Origin was " + originId + " and action was " + actionId,
                    lineNumber: 1,
                    file: 'dashboard/static/js/src/utils/tracker-datalab.js'
                });
            }
        }

        localQueue.putRecord(QUEUE_STREAM_NAME, event);
    } else {
        var MAX_DETAILS_LENGTH_OLD = 512;

        if (!_.isUndefined(eventDetails)) {

            var detailsExceedOldMaxLength = asJsonString(eventDetails).length > MAX_DETAILS_LENGTH_OLD;

            if (!detailsExceedOldMaxLength) {

                event['details'] = eventDetails;

            } else {
                jsErrorsLogHandler.buffer({
                    errorMsg: "Custom event details removed - exceeded max length of " + MAX_DETAILS_LENGTH_OLD + ". Origin was " + originId + " and action was " + actionId,
                    lineNumber: 1,
                    file: 'dashboard/static/js/src/utils/tracker-datalab.js'
                });
            }
        }

        localQueue.putRecord(QUEUE_STREAM_NAME, event);
    }

};

var uploadEvents = function () {
    // Read events from the queue
    var events = localQueue.getRecords(QUEUE_STREAM_NAME, MAX_EVENTS_PER_QUEUE_TO_LOAD);

    // We can safely return if there are no events to process.
    if (events.length === 0) {
        return;
    }

    // Convert the events to Kinesis records
    var records = _.map(events, function (event) {
        return KinesisClient.createRecord(event, event.actor);
    });

    // Send the records to Kinesis
    KinesisClient.putRecords(KINESIS_STREAM_NAME, records);
};

var recordGAEventIfNotLoggedIn = function (event) {
    if (hs && !hs.memberId && hs.dataLayerTrack) {
        hs.dataLayerTrack({
            event: 'google_analytics_auto_tagging_event',
            event_category: 'datalab',
            event_action: event.action,
            event_label: event.origin
        });
    }
};
/**
 * Listens for hootbus event that indicates a custom event has occurred, and tracks the event. Event passed to hootbus should contain origin, action, and data.
 */
var trackCustomEventsFromHootbus = function () {
    hootbus.on('hs.app.web.tracked_event_occurred', function (origin, action, data) {
        trackCustomEvent(origin, action, data);
    });
};

var trackerDatalab = {
    init: function (containerElement, attachTrackingListenerElements = true) {
        if (attachTrackingListenerElements) {
            var $containerElement = $(containerElement);
            var selector = 'a[data-tracking-origin],button[data-tracking-origin]';
    
            // Ensure init is only run at most once per element.
            if ($containerElement.data('tracking-listener-attached')) {
                return;
            }
    
            $containerElement.on('click', selector,  trackClickEvent);
            $containerElement.data('tracking-listener-attached', true);
        }

        // Run upload every 3 seconds.
        setInterval(uploadEvents, 3000);

        trackCustomEventsFromHootbus();
    },

    track: trackClickEvent,
    trackCustom: trackCustomEvent
};

hs.trackerDatalab = trackerDatalab;

export default trackerDatalab;
