/** @preventMunge */
'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import snActions from 'apps/social-network/actions';
import translation from 'utils/translation';
import FluxComponent from 'hs-nest/lib/components/flux-component';
import SocialProfileListItem from './social-profile-list-item';
import Button from 'hs-nest/lib/components/buttons/button';
import Icon from '@fp-icons/icon-base';
import PlusCircle from '@fp-icons/symbol-plus-circle';
import SmallSectionHeader from 'hs-nest/lib/components/typography/small-section-header/small-section-header';
import CategoryHeading from 'hs-nest/lib/components/typography/category-heading/category-heading';
import trackingConstants from '../constants/tracking-constants';
import styled from 'styled-components';

import './social-profile-list.less';
import { PENDO_TARGETS } from 'fe-lib-pendo';

const IconSpan = styled.span`
  vertical-align: middle;
`;

class SocialProfileList extends React.Component {
    renderListItem(socialNetwork, index) {
        return (
            <FluxComponent key={index} >
                <SocialProfileListItem
                    socialNetwork={socialNetwork}
                />
            </FluxComponent>
        );
    }
    render() {
        if (!this.props.socialNetworks) {
            return null;
        }
        var headerText = translation._("Private social accounts");
        var categoryHeaderText = translation._("These are the social accounts that only you can view and post to.");
        const showAddSocialNetworkPaywall = !this.props.canAddSocialNetwork
        return(
            <div className='rc-PrivateSocialProfileList' data-origin-id={trackingConstants.socialNetworkList}>
                <div>
                    <SmallSectionHeader className='-sectionHeader'>{headerText}</SmallSectionHeader>
                    <CategoryHeading className='-categoryHeader'>{categoryHeaderText}</CategoryHeading>
                    <ul className='-listContent'>
                        <li className='-actions' key={-1}>
                            <Button  {...showAddSocialNetworkPaywall?{'data-dap-target':PENDO_TARGETS.ADD_SOCIAL_NETWORK}:{}} className='_memberAddSnButton' btnStyle='standard' onClick={snActions.add.bind(null, { teamId: null, selectedDestination: { organizationId: 'private', teamId: null } })} trackingAction='add_social_network'>
                                &nbsp;
                                <IconSpan>
                                  <Icon fill='#8dc63f' size={20} glyph={PlusCircle} />
                                </IconSpan>
                                &nbsp;&nbsp;{translation._("Private account")}
                            </Button>
                        </li>
                        { _.map(this.props.socialNetworks, this.renderListItem.bind(this)) }
                    </ul>
                </div>
            </div>
        );
    }
}

SocialProfileList.displayName = 'SocialProfileList';

SocialProfileList.propTypes = {
    socialNetworks: PropTypes.array,
    canAddSocialNetwork: PropTypes.bool.isRequired
};
SocialProfileList.defaultProps = {
    canAddSocialNetwork: false
};

export default SocialProfileList;
