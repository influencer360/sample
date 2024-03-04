import { getVariation, setVariation } from 'fe-pg-lib-abtest';
import trackerDataLab from 'utils/tracker-datalab';

// Use this object as an A/B Test helper on the client side.
var abtest = {
    getVariation,
    setVariation,

    /**
     * Track member participation in an AB test
     * @param {string} experimentId - Unique experiment id
     * @param {int} variation - Experiment variation assigned to the member
     * @param {object} details - Experiment details
     */
    trackExperiment: function (experimentId, variation, details) {
        details = details || {};

        trackerDataLab.trackCustom('web.dashboard', 'experiment_started', {
            id: experimentId,
            variation: variation,
            name: details.name,
            description: details.description,
        });
    },
};

// Exposed globally for usage in Optimizely
hs.abtest = hs.abtest || abtest;

export default abtest;
