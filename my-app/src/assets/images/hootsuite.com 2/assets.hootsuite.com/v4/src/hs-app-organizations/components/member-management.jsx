'use strict';

import React from 'react';
import { OrganizationListItemHeader } from 'fe-member-comp-org-list-item';
import { hasMemberReachedSNMax } from 'fe-lib-pendo';
import FluxComponent from 'hs-nest/lib/components/flux-component';
import ProfileSummary from './member-profile-summary';
import OrganizationList from './organizations-list';
import SocialProfileList from './social-profile-list';
import trackingConstants from '../constants/tracking-constants';
import menuBuilder from '../utils/org-menu-builder';
import OverviewContainer from 'hs-app-organization/lib/components/overview/overview-container';
import teammanagement from 'team/management/teammanagement';
import utilsStatic from 'utils/util_static';
import hootbus from 'utils/hootbus';
import { ORGANIZATIONS as FEATURE_ORGANIZATIONS,getPermissionValue, DENY_ACCESS as FEATURE_DENY_ACCESS } from 'fe-lib-entitlements';
import {logError} from "fe-lib-logging";

import { ORGANIZATIONS } from 'hs-nest/lib/actions';

class MemberManagement extends React.Component {

    componentDidMount() {
        getPermissionValue(hs.memberId, FEATURE_ORGANIZATIONS)
            .then((response) => {
                const value = response || FEATURE_DENY_ACCESS
                this.setState({
                    loading:false,
                    maxAmountOfOrganizationsAllowed:value
                });
            })
        .catch((e) => {
            logError(
                `web.frontend.dashboard.member-management`,
                `member-management - failed to fetch permission for member ${hs.memberId} and feature ${FEATURE_ORGANIZATIONS}`,
                    {
                        errorMessage: JSON.stringify(e.message),
                        stack: JSON.stringify(e.stack),
                    }
            )
                            this.setState({loading:false});
        })
        .finally(()=>hootbus.emit('member:management:mount'))

    }

    UNSAFE_componentWillMount() {
        this.props.flux.getActions(ORGANIZATIONS).fetch();
    }

    constructor (props) {
        super(props);
        this._getOrganizationView =  this._getOrganizationView.bind(this);
        this.state={
            loading:true,
            maxAmountOfOrganizationsAllowed:0
        }
    } 

    render() {
        const organizationsStore = this.props.flux.getStore(ORGANIZATIONS);
        const isOrgStoreInitalized = organizationsStore.state.initialized;
        const canAddSocialNetwork = !hasMemberReachedSNMax()

        return (
            <div className='teamManagementProfilePage _teamManagementProfilePage'
                 data-origin-id={trackingConstants.memberManagement}>
                <FluxComponent connectToStores={['member']}>
                    <ProfileSummary />
                </FluxComponent>
                {/* Make sure the organizationStore is initialized before rendering the organizationView */}
                { isOrgStoreInitalized && !this.state.loading ? this._getOrganizationView() : null }
                <FluxComponent connectToStores={
                    {socialNetworks: store => ({socialNetworks: this._getOwnedSocialNetworks.bind(this)(store)})}
                }>
                    <SocialProfileList canAddSocialNetwork={canAddSocialNetwork}/>
                </FluxComponent>
            </div>
        );
    }

    _getOwnedSocialNetworks(store) {
        if (hs.canSeeNewTeamsOrgsUxReleaseTwo) {
            return store.getByOwnerWithoutPending(this.props.member.memberId, 'MEMBER');
        } else {
            return store.getOwned();
        }
    }

    _getCanShareAccessSocialNetwork(){
        return this.state.maxAmountOfOrganizationsAllowed !== FEATURE_DENY_ACCESS
    }

    _getOrganizationView() {
        const organizationsStore = this.props.flux.getStore(ORGANIZATIONS);
        const organizations = organizationsStore.getSortedByOwner(this.props.member.memberId);
        const isOrgStoreInitalized = organizationsStore.state.initialized;

        const shouldSeeOverviewContainer = hs.memberMaxPlanCode !== 'ENTERPRISE' && hs.memberMaxPlanCode !== 'EMPLOYEE' && hs.memberMaxPlanCode !== 'TEAMS_PLAN' && hs.memberMaxPlanCode !== 'TEAM3S' && Object.keys(organizations).length <= 1;
        if (shouldSeeOverviewContainer) {
            const organization = organizations[0];
            const menuItems = organization ? menuBuilder(organization, this.props.flux, { showCreateNewOrganization: true }) : [];
            const overviewContainerProps = {
                facadeApiUrl: hs.facadeApiUrl || '',
                organizationHeaderMenuItems: menuItems,
                memberId: this.props.member.memberId,
                memberPlan: hs.memberPlan,
                memberMaxPlanCode: hs.memberMaxPlanCode,
                flux: this.props.flux,
                getRoleFromPreset: teammanagement.getPermissionPresetName,
                blankStateImage: utilsStatic.rootifyImage('/teams/teams-overview-share-access-to-sn.png'),
                organization: organization,
                initialized: isOrgStoreInitalized,
                header: (
                    <OrganizationListItemHeader
                        className='rc-OrganizationHeader'
                        flux={this.props.flux}
                        getOrganizationLogo={utilsStatic.getOrganizationLogo}
                        organization={organization}
                        teamManagement={teammanagement}
                    />
                ),
                canShareAccessSocialNetwork:this._getCanShareAccessSocialNetwork()
            };
            return (<OverviewContainer {...overviewContainerProps} />);
        } else {
            return (<OrganizationList 
                        organizations={organizations} 
                        initialized={isOrgStoreInitalized} 
                        flux={this.props.flux}
                        canShareAccessSocialNetwork={this._getCanShareAccessSocialNetwork()}/>);
        }
    }
}
MemberManagement.displayName = 'MemberManagement';

export default MemberManagement;
