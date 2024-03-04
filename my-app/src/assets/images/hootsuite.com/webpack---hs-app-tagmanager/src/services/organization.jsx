'use strict';
var ajaxPromise = require('hs-nest/lib/utils/ajax-promise');
module.exports = {
    fetchOrgName: function (orgId) {
        return ajaxPromise({
            type: 'GET',
            url: '/ajax/organization/get-organization',
            data: {
                orgId: orgId
            }
        }, 'q1')
            .then((data) => {
            return data;
        });
    }
};
