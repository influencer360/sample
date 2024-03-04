import _ from 'underscore';
import hootbus from 'utils/hootbus';

function getLocationFromAddressUtilsEvent(addressEvent) {
    return {
        pathname: addressEvent.path,
        search: addressEvent.queryString,
        query: addressEvent.parameters
    };
}

var getParamsDefault = function (query) {
    return _.omit(query, ['_']);
};

var loadSection = function (route, addressEvent) {
    var coreViewType = route.coreView;
    if (!_.contains(['primary', 'secondary'], coreViewType)) {
        coreViewType = 'secondary';
    }
    var location = getLocationFromAddressUtilsEvent(addressEvent);
    var getParams = _.isFunction(route.getParams) ?  route.getParams : getParamsDefault;
    if (_.isString(route.section)) {
        hs.dashboardState = route.section;
    }

    if (route.component && _.isFunction(route.component.setup)) {
        route.component.setup({
            facadeApiUrl: hs.facadeApiUrl || ''
        });
    }

    hootbus.emit('toggleCoreViews:' + coreViewType, {
        content: route.component,
        params: getParams(location.query)
    });
};

export default {
    loadSection: loadSection
};
