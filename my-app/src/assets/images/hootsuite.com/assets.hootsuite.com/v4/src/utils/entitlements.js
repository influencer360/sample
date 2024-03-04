import ajaxPromise from 'hs-nest/lib/utils/ajax-promise';

var FEATURE_PREPOPULATING_STREAMS = "PREPOPULATING_STREAMS"

export const getPrepopulatingStreamsEntitlement = function(memberId, callback) {
    getEntitlementsByFeatureCode(memberId, FEATURE_PREPOPULATING_STREAMS).then(function(data) {
        callback(data && data.permission && data.permission.value > 0);
    });
}

export const getEntitlementsByFeatureCode = function (memberId, featureCode) {
    return ajaxPromise({
        type: 'GET',
        urlRoot: hs.facadeApiUrl,
        url: '/entitlements/permissions/' + memberId + '/' + featureCode,
        jwt: true
    }, 'qm');
};

