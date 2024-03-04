import _ from 'underscore';
import asyncLoader from 'utils/async-loader';
import 'utils/util_static';

var fileNamePrefix = 'hs/';

var startsWithFilePrefix = function (bundleName) {
    return bundleName.indexOf(fileNamePrefix) === 0;
};

/**
 * HootSuite Asynchronous JS Bundle Loader
 * @param {Array|String} name - bundle names (can be an array or a string)
 * @param {Function} [callback] - callback function
 * @param {Object} [context] - callback context (what this is going to be in the callback function)
 */
hs.require = function (name, callback, context) {

    var bundles, files, deferred;

    if (typeof name === "undefined") {
        throw Error('hs.require: please provide a bundle name');
    }

    bundles = (_.isArray(name)) ? name : [name];
    bundles = _.map(bundles, function (bundleName) {

        // it it doesn't start with the filename prefix, add it
        if (!startsWithFilePrefix(bundleName)) {
            bundleName = fileNamePrefix + bundleName;
        }

        return '/' + bundleName + '.js';
    });

    files = []
    bundles.forEach(bundlePath => {
        // See implementation of In_Util_Static::rootifyJs in src/core/components/In/Util/Static.php
        files.push(hs.util.rootifyJs(bundlePath));

        if (hs.jsToCssMap[bundlePath]) {
            const cssPath = hs.jsToCssMap[bundlePath]
            loadExternalStylesheet(hs.util.rootifyJs(cssPath), bundlePath)
        }
    });

    if (!_.isFunction(callback)) {
        callback = function () {
        };
    }

    if (typeof context === 'undefined') {
        context = null;
    }

    deferred = $.Deferred();

    var finalLoadCallback = function () {
        var args = Array.prototype.slice.call(arguments);
        callback.apply(context, args);
        deferred.resolveWith(context, args);
    };

    Promise.all(files.map(asyncLoader)).then(finalLoadCallback);


    return deferred.promise();
};

function loadExternalStylesheet(href, id) {
    if (!document.getElementById(id)) {
        const head = document.getElementsByTagName('head')[0]
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.type = 'text/css'
        link.href = href
        link.id = id
        head.appendChild(link)
    }
}
