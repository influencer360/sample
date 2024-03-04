import hootbus from 'utils/hootbus';

// function to call all our various analytics
hs.track = function (path) {
    // google analytics
    try {
        typeof(window._gaq) !== 'undefined' && window._gaq.push(['_trackPageview', path]);
    } catch (err) {
        // silent catch
    }
};

// function to track events
hs.trackEvent = function (params) {

    var category;
    var values = {};
    // check arguments
    if (arguments.length > 1) {
        var limit = Math.max(arguments.length, 4);
        for (var i = 0; i < limit; i++) {
            if (i === 0) {
                category = arguments[i];
            } else if (i == 1) {
                values.action = arguments[i];
            } else if (i == 2) {
                values.label = arguments[i];
            } else if (i == 3) {
                values.value = arguments[i];
            }
        }
    } else {
        if ('category' in params) {
            category = params.category;
        }
        if ('action' in params) {
            values.action = params.action;
        }
        if ('label' in params) {
            values.label = params.label;
        }
        if ('value' in params) {
            values.value = params.value;
        }
    }

    // google analytics
    try {
        typeof(window._gaq) !== 'undefined' && window._gaq.push(['_trackEvent', category, values.action, values.label, values.value]);
    } catch (err) {
        // silent catch
    }
};

hs.dataLayerTrack = function (params) {
    if (hs.env === "production" || hs.env === "staging") {
        window.dataLayer.push(params);
    }
};

hootbus.on('googleAnalytics:trackEvent', function (params) {
    hs.trackEvent(params);
});
