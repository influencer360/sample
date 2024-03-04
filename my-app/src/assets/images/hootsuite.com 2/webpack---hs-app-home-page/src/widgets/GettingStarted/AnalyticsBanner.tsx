import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Icon } from '@fp-icons/icon-base';
import { withI18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { ANALYTICS_VIDEO, handleCTA } from 'constants/videos';
import breakpoints from 'utils/breakpoints';
import { Button, OUTLINED } from '../../components/Button';
import {
  TRACKING_EVENT_GETTING_STARTED_USER_SEES_ANALYTICS_BANNER,
  TRACKING_ORIGIN_HOMEPAGE,
} from '../../constants/tracking';
import { Vidyard } from '../VideoAnnouncements/VidyardLoader';

const VideoContainer = styled.div<{ screenWidth: number }>`
  position: relative;
  width: 782px;
  border-radius: 16px;
  align-self: center;

  @media only screen and (max-width: ${breakpoints.breakpointXl}) {
    width: ${p => p.screenWidth - 204}px;
  }
`;

const LeftContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 570px;
  gap: 16px;
  margin-right: 40px;
  @media only screen and (max-width: ${breakpoints.breakpointLg}) {
    margin-top: 24px;
    margin-right: 0px;
    width: 100%;
  }
`;

const AnalyticsTitle = styled.h2`
  color: #1c1c1c;
  font-size: 22px;
  font-weight: 600;
  line-height: 30px;
`;

const Subtitle = styled.p`
  color: #1c1c1c;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  margin: 0;
`;

const FeatureList = styled.div`
  flex: 1;
`;

const FeatureIcon = styled.div`
  flex: 0 0 32px;
`;
const FeatureItem = styled.div`
  display: flex;
  gap: 16px;
  height: 72px;
  padding: 0px 16px;
  margin-bottom: 16px;
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FeatureDetails = styled.div`
  line-height: 1em;
`;

const ItemTitle = styled.p`
  color: #1c1c1c;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
  margin: 0;
`;
const ItemDescription = styled(ItemTitle)`
  color: #5c5c5c;
  font-weight: 400;
`;

const StyledButton = styled(Button)`
  @media only screen and (max-width: ${breakpoints.breakpointXl}) {
    margin-top: 24px;
  }
`;

const VideoContainerWrapper = styled.div`
  @media only screen and (max-width: ${breakpoints.breakpointXl}) {
    display: flex;
    height: -webkit-fill-available;
    height: -moz-available;
    height: fill-available;
    align-self: center;
  }
`;

type AnalyticsBannerProps = {
  $i18n: {
    analyticsTitle: () => string;
    analyticsSubtitle: () => string;
    analyticsItem1Title: () => string;
    analyticsItem1Description: () => string;
    analyticsItem2Title: () => string;
    analyticsItem2Description: () => string;
    analyticsItem3Title: () => string;
    analyticsItem3Description: () => string;
    analyticsCta: () => string;
  };
  screenWidth: number;
};

const AnalyticsBanner = ({ $i18n, screenWidth }: AnalyticsBannerProps) => {
  useEffect(() => {
    track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_GETTING_STARTED_USER_SEES_ANALYTICS_BANNER);
  }, []);

  const analyticsItems = [
    { iconName: 'schedule', title: $i18n.analyticsItem1Title(), description: $i18n.analyticsItem1Description() },
    { iconName: 'trending_up', title: $i18n.analyticsItem2Title(), description: $i18n.analyticsItem2Description() },
    { iconName: 'verified', title: $i18n.analyticsItem3Title(), description: $i18n.analyticsItem3Description() },
  ];

  return (
    <>
      <LeftContainer>
        <AnalyticsTitle>{$i18n.analyticsTitle()}</AnalyticsTitle>
        <ContentWrapper>
          <Subtitle>{$i18n.analyticsSubtitle()}</Subtitle>
          <FeatureList>
            {analyticsItems.map(feature => {
              return (
                <FeatureItem key={feature.iconName}>
                  <FeatureIcon>
                    <Icon name={feature.iconName} size="32px" />
                  </FeatureIcon>
                  <FeatureDetails>
                    <ItemTitle>{feature.title}</ItemTitle>
                    <ItemDescription>{feature.description}</ItemDescription>
                  </FeatureDetails>
                </FeatureItem>
              );
            })}
          </FeatureList>
        </ContentWrapper>
        <StyledButton
          type={OUTLINED}
          onClick={() => handleCTA(ANALYTICS_VIDEO.id, ANALYTICS_VIDEO.title, ANALYTICS_VIDEO.location)}
          width="169px"
        >
          {$i18n.analyticsCta()}
        </StyledButton>
      </LeftContainer>
      <VideoContainerWrapper>
        <VideoContainer screenWidth={screenWidth}>
          <Vidyard video={ANALYTICS_VIDEO} />
        </VideoContainer>
      </VideoContainerWrapper>
    </>
  );
};

export default withI18n({
  analyticsTitle: 'Hootsuite Analytics',
  analyticsSubtitle: 'Reporting tools that do the math for you',
  analyticsItem1Title: 'Best time to post',
  analyticsItem1Description: 'Find the best time to publish to achieve your business goals.',
  analyticsItem2Title: 'Best performing posts',
  analyticsItem2Description: 'Identify top-performing posts in seconds and adjust your strategy.',
  analyticsItem3Title: 'Best in class',
  analyticsItem3Description: 'Reports that compare your performance against your industry peers or competitors.',
  analyticsCta: 'Explore Analytics',
})(AnalyticsBanner);
