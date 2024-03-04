'use strict';
var wisdom = require('hs-nest/lib/utils/wisdom');
const { TAG_HEADER } = require('../actions/types');
class HeaderStore extends wisdom.Store {
    constructor(flux) {
        super();
        var actions = flux.getActionIds(TAG_HEADER);
        this.registerAsync(actions.fetchOrgName, null, this._fetchOrgName, null);
        this.state = {
            orgName: ''
        };
    }
    getOrgName() {
        return this.state.orgName;
    }
    _fetchOrgName(data) {
        this.setState({
            orgName: data.orgInfo.name
        });
    }
}
module.exports = HeaderStore;
