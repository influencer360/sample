import _ from 'underscore';
import darklaunch from 'hs-nest/lib/utils/darklaunch';
import { logInfo } from 'fe-lib-logging';
import sampleSize from 'lodash.samplesize';

var staticCfDistBucketSsl = 'https://assets.hootsuite.com';

import utilStatic from 'hs-nest/lib/utils/static-assets';
var options = {
    serveAssetsViaCdn: hs.serveAssetsViaCdn,
    workingVersion: hs.c.staticVersion,
    urlRoot: hs.c.rootUrl,
    imageDictionary: hs.images,
    javascriptDictionary: hs.javascripts,
    proxyUrl: hs.c.IMAGE_SSL_PROXY_URL,
    staticUrlArray: [staticCfDistBucketSsl],
    facebookGraphApiUrl: hs.fbGraphApiUrl,
    avatarFolder: hs.avatarFolder
};
utilStatic.setup(options);

hs.util = hs.util || {};

var loggingBuffer = [];
var LOGGING_BUFFER_LIMIT = 1000;
if (!isNaN(darklaunch.getFeatureValue('NGE_5166_LOGGING_BUFFER_SIZE'))) {
    LOGGING_BUFFER_LIMIT = parseInt(darklaunch.getFeatureValue('NGE_5166_LOGGING_BUFFER_SIZE'), 10);
}
var LOGGING_SAMPLE_SIZE = 10;
if (!isNaN(darklaunch.getFeatureValue('NGE_5166_LOGGING_SAMPLE_SIZE'))) {
    LOGGING_SAMPLE_SIZE = parseInt(darklaunch.getFeatureValue('NGE_5166_LOGGING_SAMPLE_SIZE'), 10);
}
var loggingSampled = false;
var logHttpUrls = function (url) {
    if(loggingSampled) {
        return
    }

    if (loggingBuffer.length >= LOGGING_BUFFER_LIMIT) {
        logInfo(
            'frontend.proxify.sampling',
            'Batch http urls proxified',
            {
                urls: JSON.stringify(sampleSize(loggingBuffer, LOGGING_SAMPLE_SIZE))
            }
        );
        loggingSampled = true;
    }

    if (_.isString(url) && (url.indexOf('http:') === 0)) {
        loggingBuffer.push(url);
    }
};

_.extend(hs.util, utilStatic);
if (darklaunch.isFeatureEnabled('NGE_5166_LOG_PROXIFY_URLS')) {
    hs.util.proxify = function (url) {
        logHttpUrls(url);
        return utilStatic.proxify(url);
    }
}

export default utilStatic;
