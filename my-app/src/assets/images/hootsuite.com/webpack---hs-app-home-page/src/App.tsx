import React from 'react';
import styled from 'styled-components';
import { compose } from 'fe-hoc-compose';
import { withI18n } from 'fe-lib-i18n';
import { getExperimentVariation } from 'fe-lib-optimizely';
import { ActionHistoryProps, getActionHistoryValue, withActionHistory } from 'fe-pg-lib-action-history';
import SRSBanner from 'components/SRSBanner';
import { useHandleSRSDisplay } from 'hooks/useHandleSRSDisplay';
import { useSRSConfig } from 'hooks/useSRSConfig';
import breakpoints from 'utils/breakpoints';
import darklaunch from 'utils/darklaunch';
import Announcements from 'widgets/Announcements';
import GettingStarted from 'widgets/GettingStarted';
import VideoAnnouncements from 'widgets/VideoAnnouncements';
import Header from './components/Header';
import DraftFirstPostExistingUsersExperiment from './components/Optimizely/DraftFirstPostExistingUsersExperiment';
import SectionHeader from './components/SectionHeader';
import StickyHeader from './components/StickyHeader';
import ConnectedAccounts from './widgets/ConnectedAccounts/ConnectedAccounts';
import Drafts from './widgets/Drafts';
// import GoalTracker from './widgets/GoalTracker/GoalTracker';
import SocialRelationshipScore from './widgets/SocialRelationshipScore';
import SocialValue from './widgets/SocialValue/';
import SocialValueTrends from './widgets/SocialValueTrends';
import TopPerformingPosts from './widgets/TopPerformingPosts';

const AppContainer = styled.div<{ isInFirst30DayUXExperiment: boolean }>`
  //Todo: Replace with theme value once rebranded
  background: ${p => (p.isInFirst30DayUXExperiment ? '#f4f5f6' : '#fdfdfd')};
  min-height: 100%;
`;

const WidgetContainer = styled.div<{ isInFirst30DayUXExperiment: boolean }>`
  display: flex;
  gap: 32px;
  max-width: 1504px;
  margin: 0 auto;
  flex-flow: wrap;
  padding: ${p => (p.isInFirst30DayUXExperiment ? '55px 40px;' : '40px')};
  box-sizing: border-box;

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    padding: 16px;
    gap: 16px;
  }
`;

const Title = styled.div`
  margin: 0 auto;
  font-weight: 600;
  font-size: 24px;
  line-height: 36px;
  padding: 10px 0 0 36px;

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    padding-left: 16px;
  }
`;

type AppProps = {
  $i18n: {
    home: () => string;
    overviewOfYourActivity: () => string;
  };
  $actionHistory: ActionHistoryProps;
};

// First 30 Days UX
export const isInFirst30DayUXExperiment =
  !!darklaunch.isFeatureEnabled('PGR_2065_HOMEPAGE_REVAMP') &&
  getExperimentVariation('grw_ss_homepage_4_0') === 'variation_1';

export const wasInDraftFirstPostNewUsersExperiment = getActionHistoryValue(
  'optimizely.experiment.grw_ss_onboarding_7_0',
);

const LocalizedApp = ({ $i18n, $actionHistory }: AppProps) => {
  const { srsConfigStatus, srsConfig, handleOpt } = useSRSConfig();

  const { showSRSBanner, showAnnouncements, showOnboardingContent } = useHandleSRSDisplay(
    srsConfig,
    srsConfigStatus,
    $actionHistory,
  );

  const goalsDashboardBeta = darklaunch.isFeatureEnabled('IMP_6306_GOALS_DASHBOARD_BETA_ACCESS');
  const trendsDashboardAccess = darklaunch.isFeatureEnabled('SV_37_TRENDS_DASHBOARD_ACCESS');
  const InTrial = !!window.hs?.inTrial;

  return (
    <AppContainer isInFirst30DayUXExperiment={isInFirst30DayUXExperiment}>
      {!wasInDraftFirstPostNewUsersExperiment && <DraftFirstPostExistingUsersExperiment />}
      {isInFirst30DayUXExperiment ? InTrial && <StickyHeader /> : <Title>{$i18n.home()}</Title>}

      <Header />
      <WidgetContainer isInFirst30DayUXExperiment={isInFirst30DayUXExperiment}>
        {showSRSBanner && <SRSBanner handleOpt={handleOpt} />}
        {isInFirst30DayUXExperiment && <GettingStarted $actionHistory={$actionHistory} />}
        {!isInFirst30DayUXExperiment && showAnnouncements && <Announcements />}
        {showOnboardingContent && !isInFirst30DayUXExperiment && <VideoAnnouncements />}
        {!isInFirst30DayUXExperiment && <SectionHeader>{$i18n.overviewOfYourActivity()}</SectionHeader>}
        {/* <GoalTracker /> */}
        {srsConfig?.optIn && <SocialRelationshipScore />}
        <Drafts />
        <ConnectedAccounts />
        <TopPerformingPosts />
        {goalsDashboardBeta && <SocialValue />}
        {trendsDashboardAccess && <SocialValueTrends />}
      </WidgetContainer>
    </AppContainer>
  );
};

export default compose(
  withI18n({
    home: 'Home',
    overviewOfYourActivity: 'Overview of your activity',
  }),
  withActionHistory,
)(LocalizedApp);
