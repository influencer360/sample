/** @preventMunge */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import hootbus from 'utils/hootbus';
import hsEvents from 'hs-events';
import SSOConfig from 'fe-member-comp-sso-config';
import { OrganizationListItem } from 'fe-member-comp-org-list-item';
import Button from 'hs-nest/lib/components/buttons/button';
import SmallSectionHeader from 'hs-nest/lib/components/typography/small-section-header/small-section-header';
import ShareAccessMessage from 'hs-app-organization/lib/components/share-access-message/share-access-message';
import utilsStatic from 'utils/util_static';
import translation from 'utils/translation';
import teammanagement from 'team/management/teammanagement';
import renderLinkSettingsManagement from 'components/publisher/render-link-settings-management';
import trackingConstants from '../constants/tracking-constants';

import { ORGANIZATIONS, MEMBER } from 'hs-nest/lib/actions';

class OrganizationsList extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ssoOpened: false,
            selectedOrgId: undefined,
            selectedOrgName: undefined,
        };

        this.openSSOConfigModal = this.openSSOConfigModal.bind(this);
        this.closeSSOConfigModal = this.closeSSOConfigModal.bind(this);
    }

    componentDidUpdate() {
        hootbus.emit(hsEvents.TEAM_MANAGEMENT_ORG_LIST_RENDERED);
    }

    openSSOConfigModal({ orgId, orgName }) {
        this.setState(() => ({
            ssoOpened: true,
            selectedOrgId: orgId,
            selectedOrgName: orgName
        }))
    }

    closeSSOConfigModal() {
        this.setState(() => ({
            ssoOpened: false,
            selectedOrgId: undefined,
            selectedOrgName: undefined
        }))
    }

    render() {
        if (typeof this.props.organizations === 'undefined') {
            return null;
        }

        var blankStateSection, createOrgButton;
        var memberId = this.props.flux.getStore(MEMBER).get().memberId;
        var ownsAnOrganization = this.props.flux.getStore(ORGANIZATIONS).ownsAnOrganization(memberId);
        var freePlan = hs.memberPlan === 'FREE';

        var createOrganization = function(){
            teammanagement.createOrganizationPopup();
        };
        var styles = {
            marginLeft: 22
        };

        //only show these UI if organization list has been initialized
        if (this.props.initialized) {
            if (this.props.organizations.length === 0) {
                if (hs.canSeeNewTeamsOrgsUxReleaseTwo && hs.memberPlan !== 'TEAMS_PLAN' && hs.memberPlan !== 'TEAM3S') {
                    const showPaywall = !this.props.canShareAccessSocialNetwork;

                    var shareCallback = () => {
                        if (!showPaywall) {
                          hootbus.emit('overlay:init', 'modal', 'shareSocialNetwork', { flux: this.props.flux });
                        }
                    };

                    var blankStateImage = utilsStatic.rootifyImage('/teams/teams-overview-share-access-to-sn.png');

                    blankStateSection = (
                        <ShareAccessMessage
                          image={blankStateImage}
                          onPrimaryButtonClick={shareCallback}
                          trackingOrigin='dashboard'
                          shouldShowPaywall={showPaywall}
                        />
                    );
                } else {
                    blankStateSection = (
                        <div>
                            <SmallSectionHeader style={styles}>{translation._("Organizations that I'm a part of:")}</SmallSectionHeader>
                            <div id="createOrgSection">
                                <div className="emptyContentMessage rb-a-5">
                                    <h2>{translation._("You are not a part of any organizations")}</h2>

                                    <p>{translation._("Form teams and collaborate with others to engage audiences at every level of your organization.")}</p>

                                    <div className="icons">
                                        <div className="icon-box">
                                            <span className="icon invite" />

                                            <h3>{translation._("Invite Members")}</h3>
                                        </div>
                                        <div className="icon-box">
                                            <span className="icon create" />

                                            <h3>{translation._("Create Teams")}</h3>
                                        </div>
                                        <div className="icon-box">
                                            <span className="icon collaborate" />

                                            <h3>{translation._("Start Collaborating!")}</h3>
                                        </div>
                                    </div>
                                    <Button btnStyle='primary'
                                            onClick={createOrganization}
                                            trackingAction='create_organization' >{translation._("Start collaborating with others")}</Button>
                                </div>
                            </div>
                        </div>
                    );
                }
            } else if (!ownsAnOrganization && !freePlan) {
                createOrgButton = (
                    <Button btnStyle='standard'
                            onClick={createOrganization}
                            trackingAction='create_additional_organization'>{translation._("Create an organization")}</Button>
                )
            }
        }
        return(
            <>
                <div id='memberOrganizations' className='subContainer' data-origin-id={trackingConstants.organizationList}>
                    <div>
                        {blankStateSection}
                        <div className='content'>
                            <ul className='deck-holder'>
                                {this.props.organizations.map((organization) => {
                                    return (
                                        <OrganizationListItem
                                            flux={this.props.flux}
                                            getOrganizationLogo={utilsStatic.getOrganizationLogo}
                                            key={organization.organizationId}
                                            organization={organization}
                                            renderLinkSettingsManagement={renderLinkSettingsManagement}
                                            teamManagement={teammanagement}
                                            onSSOButtonClick={this.openSSOConfigModal}
                                        />
                                    );
                                })}
                            </ul>
                            {createOrgButton}
                        </div>
                    </div>
                </div>
                {this.state.ssoOpened && (
                    <SSOConfig
                        onClose={this.closeSSOConfigModal}
                        orgId={this.state.selectedOrgId}
                        orgName={this.state.selectedOrgName}
                    />
                )}
            </>
        );
    }
}

OrganizationsList.displayName = 'OrganizationsList';

OrganizationsList.propTypes = {
    organizations: PropTypes.array,
    initialized: PropTypes.bool,
    flux: PropTypes.object,
    canShareAccessSocialNetwork: PropTypes.bool.isRequired
};

export default OrganizationsList;
