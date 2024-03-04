'use strict';
var orgService = require('../services/organization');
var wisdom = require('hs-nest/lib/utils/wisdom');
class HeaderActions extends wisdom.Actions {
    /**
     * Fetches all tags for an organization
     * @param {int} orgId
     * @return {Promise}
     */
    fetchOrgName(orgId) {
        return orgService.fetchOrgName(orgId);
    }
}
module.exports = HeaderActions;
