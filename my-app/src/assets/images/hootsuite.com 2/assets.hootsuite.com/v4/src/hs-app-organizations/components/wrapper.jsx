'use strict';

import React from 'react';
import FluxComponent from 'hs-nest/lib/components/flux-component';
import TeamOrgsDrilldown from './team-orgs-drilldown';
import MemberManagement from './member-management';
import trackingConstants from '../constants/tracking-constants';

class MemberManagerWrapper extends React.PureComponent {
    render() {
        return (
            <div id='memberProfileSection' data-origin-id={trackingConstants.organizationSection}>
                <TeamOrgsDrilldown />
                <FluxComponent connectToStores={['member', 'organizations']}>
                    <MemberManagement />
                </FluxComponent>
            </div>
        );
    }
}

MemberManagerWrapper.displayName = 'MemberManagerWrapper';

export default MemberManagerWrapper;
