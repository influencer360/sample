/** @preventMunge */
'use strict';

import { recordTiming } from 'fe-lib-recording';

const eventTypeToKinesisName = {
    EVENT_TIME_TO_FIRST_RENDER: "ttr",
    EVENT_TIME_TO_INTERACTIVE: "tti",
};

export const cttiBackend = event => {
    recordTiming(
        'fullscreencomposer.performance.ctti.' + event.name + "." + eventTypeToKinesisName[event.type],
        {
            value: event.deltaMs,
            statType: 'timing',
            splitByLocation: true,
        }
    )
};

export const windowLengthMs = 3000;
