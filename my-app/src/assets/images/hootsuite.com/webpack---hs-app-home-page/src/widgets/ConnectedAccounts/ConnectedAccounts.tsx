import React, { useState } from 'react';
import styled from 'styled-components';
import { emit } from 'fe-lib-hootbus';
import { withI18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { isInFirst30DayUXExperiment } from 'App';
import { Button } from 'components/Button';
import { OPEN_ADD_NETWORK_MODAL } from 'constants/hootbus-actions';
import {
  TRACKING_EVENT_USER_CLICKS_MANAGE_CTA,
  TRACKING_EVENT_USER_CLICK_ADD_SOCIAL_BUTTON,
  TRACKING_ORIGIN_HOMEPAGE,
} from 'constants/tracking';
import useSocialProfiles from 'hooks/useSocialProfiles';
import { RequestStatusType } from 'typings/Shared';
import { WidgetName } from 'typings/Widget';
import { getEntitlementsByFeatureCode } from 'utils/entitlements';
import { Widget } from '../Widget';
import ConnectedAccountsList from './ConnectedAccountsList';

const StyledAddProfileButton = styled(Button)`
  margin-top: 24px;
`;
const TabbedLayout = styled.div``;

const Tabs = styled.ul`
  display: flex;
  justify-content: flex-start;
  flex-basis: 148px;
  height: 52px;
  box-sizing: border-box;
  border-bottom: 1px solid #c0c0c0;
  margin-bottom: 18px;
`;

const Tab = styled.button<{ isActive: boolean }>`
  font-weight: 700;
  padding: 14px 24px;
  border-bottom: 2px solid ${({ isActive }) => (isActive ? '#00463A' : 'transparent')};
`;

export type TabKeys = 'social-profiles-tab' | 'members-tab' | 'teams-tab';

export type ConnectedAccountsProps = {
  $i18n: {
    ctaText: () => string;
    title: () => string;
    subtitle: () => string;
    addSocialAccount: () => string;
    socialProfiles: () => string;
    members: () => string;
    teams: () => string;
  };
};

const onAddSocialClick = () => {
  emit(OPEN_ADD_NETWORK_MODAL);
  track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICK_ADD_SOCIAL_BUTTON, {
    widgetName: WidgetName.CONNECTED_ACCOUNTS,
  });
};

const LocalizedConnectedAccounts = ({ $i18n }: ConnectedAccountsProps) => {
  const { socialProfiles, hasError, isLoading } = useSocialProfiles();
  const [activeTab, setActiveTab] = useState<TabKeys>('social-profiles-tab');
  const showFirst30DaysExperiment = isInFirst30DayUXExperiment;

  let widgetStatus;

  if (isLoading) {
    widgetStatus = RequestStatusType.LOADING;
  } else if (hasError) {
    widgetStatus = RequestStatusType.ERROR;
  } else if (socialProfiles.allProfiles.length === 0) {
    widgetStatus = RequestStatusType.EMPTY;
  } else {
    widgetStatus = RequestStatusType.SUCCESS;
  }

  const handleTabChange = (tabKey: TabKeys) => {
    setActiveTab(tabKey);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLButtonElement>, tabKey: TabKeys) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveTab(tabKey);
    }
  };

  return (
    <Widget
      name={WidgetName.CONNECTED_ACCOUNTS}
      cta={$i18n.ctaText()}
      minHeight={showFirst30DaysExperiment ? '644px' : '240px'}
      status={widgetStatus}
      title={$i18n.title()}
      subtitle={$i18n.subtitle()}
      showCta={showFirst30DaysExperiment ? widgetStatus === RequestStatusType.SUCCESS : true}
      onClickCta={() => {
        track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_MANAGE_CTA, {
          widgetName: WidgetName.CONNECTED_ACCOUNTS,
        });
        window.location.href = '/dashboard#/member';
      }}
    >
      {/* <TabbedLayout>
        <Tabs role="tablist" aria-label="List of tab menu items">
          <Tab
            isActive={activeTab === 'social-profiles-tab'}
            onClick={() => handleTabChange('social-profiles-tab')}
            onKeyPress={event => handleKeyPress(event, 'social-profiles-tab')}
            role="tab"
            aria-selected={activeTab === 'social-profiles-tab'}
            aria-controls="social-profiles-tab"
          >
            {$i18n.socialProfiles()}
          </Tab> */}
      {/* When members and teams are ready, uncomment code block below */}
      {/* <Tab
            isActive={activeTab === 'members-tab'}
            onClick={() => handleTabChange('members-tab')}
            onKeyPress={event => handleKeyPress(event, 'members-tab')}
            role="tab"
            aria-selected={activeTab === 'members-tab'}
            aria-controls="members-tab"
          >
            {$i18n.members()}
          </Tab>

          <Tab
            isActive={activeTab === 'teams-tab'}
            onClick={() => handleTabChange('teams-tab')}
            onKeyPress={event => handleKeyPress(event, 'teams-tab')}
            role="tab"
            aria-selected={activeTab === 'teams-tab'}
            aria-controls="teams-tab"
          >
            {$i18n.teams()}
          </Tab> */}
      {/* </Tabs> */}
      <ConnectedAccountsList socialProfiles={socialProfiles} activeTab={activeTab} />
      {/* </TabbedLayout> */}

      <StyledAddProfileButton type="outlined" onClick={onAddSocialClick}>
        {$i18n.addSocialAccount()}
      </StyledAddProfileButton>
    </Widget>
  );
};

export default withI18n({
  ctaText: 'Manage accounts',
  title: 'Social accounts',
  subtitle: 'Recently added',
  addSocialAccount: 'Add a social account',
  socialProfiles: 'Social profiles',
  members: 'Members',
  teams: 'Teams',
})(LocalizedConnectedAccounts);
