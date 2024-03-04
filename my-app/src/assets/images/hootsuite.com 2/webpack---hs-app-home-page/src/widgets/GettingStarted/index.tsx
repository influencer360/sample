import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { hasAccessToFeature } from 'fe-lib-entitlements';
import { withI18n } from 'fe-lib-i18n';
import { withHsTheme } from 'fe-lib-theme';
import { ActionHistoryProps, getActionHistoryValue } from 'fe-pg-lib-action-history';
import createTeam from 'assets/createTeam.png';
import invitePeople from 'assets/invitePeople.png';
import GettingStartedGuide from 'components/GettingStartedGuide';
import { HAS_SEEN_GETTING_STARTED_GUIDE_COMPLETED_STATE } from 'constants/actionHistoryKeys';

import { allVideoAnnouncements } from 'constants/videos';
import { VideoAnnouncement } from 'hooks/useVideoAnnouncements';
import { RequestStatusType } from 'typings/Shared';
import { WidgetName } from 'typings/Widget';
import breakpoints from 'utils/breakpoints';

import { Vidyard } from 'widgets/VideoAnnouncements/VidyardLoader';
import AnalyticsBanner from './AnalyticsBanner';
import Congratulations from './Congratulations';
import { Widget } from './Widget';

const TEAMS_ENTITLEMENT = 'HOMEPAGE_V2_TEAMS';
const appearAnimation = keyframes`
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
`;

const WidgetContainer = styled.div<{ isCompletedStateShowing: boolean }>`
  display: ${p => (p.isCompletedStateShowing ? 'none' : 'flex')};
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  overflow: hidden;
  height: auto;

  @media only screen and (max-width: ${breakpoints.breakpointXl}) {
    flex-direction: column-reverse;
    overflow: hidden;
    height: 900px;
  }

  @media only screen and (max-width: ${breakpoints.breakpointLg}) {
    height: 780px;
  }

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    height: 660px;
  }

  @media only screen and (max-width: ${breakpoints.breakpointSm}) {
    height: 617px;
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

const Title = withHsTheme(styled.h2`
  font-weight: 600;
  font-size: 22px;
  line-height: 32px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    font-size: 20px;
  }
`);

const ImageContainer = styled.div<{ screenWidth: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 782px;

  @media only screen and (max-width: ${breakpoints.breakpointXl}) {
    width: ${p => p.screenWidth - 204}px;
  }
`;

const AnimationWrapper = styled.div`
  display: flex;
  animation-name: ${appearAnimation};
  animation-duration: 2s;
  animation-delay: 1s;
  animation-fill-mode: forwards;
  opacity: 0;

  @media only screen and (max-width: ${breakpoints.breakpointXl}) {
    flex-direction: column-reverse;
    overflow: hidden;
  }
`;

type BannerProps = {
  $i18n: {
    title: () => string;
    invitePeopleAltText: () => string;
    createTeamAltText: () => string;
  };
  $actionHistory: ActionHistoryProps;
};

type StepInfo = {
  src: string;
  type: string;
  video?: VideoAnnouncement;
  image?: string;
};

// Find Video to Display for Step
const findVideo = (videos: VideoAnnouncement[], targetId: string) =>
  videos.find((video: VideoAnnouncement) => video.id === targetId);

// Build a Static Step Info Object
const buildSteps = (announcements: VideoAnnouncement[], isTeamsOnboarding?: boolean) => {
  if (isTeamsOnboarding) {
    return {
      2: { src: 'connect-account', type: 'video', video: findVideo(announcements, 'connect-account') },
      3: { src: 'invite-people', type: 'image', image: invitePeople },
      4: { src: 'create-team', type: 'image', image: createTeam },
    };
  }
  return {
    2: { src: 'connect-account', type: 'video', video: findVideo(announcements, 'connect-account') },
    3: { src: 'draft-posts', type: 'video', video: findVideo(announcements, 'draft-posts') },
  };
};

const GettingStarted = ({ $i18n, $actionHistory }: BannerProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [widgetStatus, setWidgetStatus] = useState<RequestStatusType>();
  const [isLoading, setIsLoading] = useState(true);
  const [isTeamsOnboarding, setIsTeamsOnboarding] = useState();
  const [currentStep, setCurrentStep] = useState<StepInfo>();
  const [steps, setSteps] = useState<Record<string, any>>();
  const [screenWidth, setScreenWidth] = useState<number>(window.innerWidth);

  // Window Resize Handler Steps
  useEffect(() => {
    const updateWindowDimensions = () => {
      const newWidth = window.innerWidth;
      setScreenWidth(newWidth);
    };

    window.addEventListener('resize', updateWindowDimensions);

    return () => window.removeEventListener('resize', updateWindowDimensions);
  }, []);

  // Build Steps
  useEffect(() => {
    setSteps(buildSteps(allVideoAnnouncements, isTeamsOnboarding));
  }, [isTeamsOnboarding]);

  // Save the Current Step
  useEffect(() => {
    if (steps) {
      setCurrentStep(steps[activeStep]);
    }
  }, [activeStep, steps]);

  // Check if Teams User or Pro User
  useEffect(() => {
    (async () => {
      const hasTeamsEntitlement = await hasAccessToFeature(window.hs.memberId, TEAMS_ENTITLEMENT);

      setIsTeamsOnboarding(hasTeamsEntitlement);
      setIsLoading(false);
    })();
  }, []);

  // Set Loading State
  useEffect(() => {
    if (isLoading) {
      setWidgetStatus(RequestStatusType.LOADING);
    } else {
      setWidgetStatus(RequestStatusType.SUCCESS);
    }
  }, [isLoading]);

  return (
    <Widget name={WidgetName.GETTING_STARTED_GUIDE} status={widgetStatus}>
      <WidgetContainer
        isCompletedStateShowing={isCompleted && !getActionHistoryValue(HAS_SEEN_GETTING_STARTED_GUIDE_COMPLETED_STATE)}
      >
        {/* Getting Started Guide*/}
        {!isCompleted && (
          <>
            <LeftContainer>
              <Title>{$i18n.title()}</Title>
              <GettingStartedGuide
                isTeamsOnboarding={isTeamsOnboarding}
                setActiveStep={setActiveStep}
                setIsCompleted={setIsCompleted}
                $actionHistory={$actionHistory}
              />
            </LeftContainer>
            <VideoContainerWrapper>
              {currentStep?.video && currentStep?.type === 'video' && (
                <VideoContainer screenWidth={screenWidth}>
                  <Vidyard video={currentStep.video} key={activeStep} />
                </VideoContainer>
              )}
            </VideoContainerWrapper>
            {currentStep?.type === 'image' && (
              <ImageContainer screenWidth={screenWidth}>
                <img
                  alt={activeStep === 3 ? $i18n.invitePeopleAltText() : $i18n.createTeamAltText()}
                  src={currentStep.image}
                />
              </ImageContainer>
            )}
          </>
        )}
        {/* Analytics Banner*/}
        {isCompleted && getActionHistoryValue(HAS_SEEN_GETTING_STARTED_GUIDE_COMPLETED_STATE) && (
          <AnimationWrapper>
            <AnalyticsBanner screenWidth={screenWidth} />
          </AnimationWrapper>
        )}
      </WidgetContainer>

      {/* Completion Transition */}
      {isCompleted && !getActionHistoryValue(HAS_SEEN_GETTING_STARTED_GUIDE_COMPLETED_STATE) && (
        <AnimationWrapper>
          <Congratulations />
        </AnimationWrapper>
      )}
    </Widget>
  );
};

export default withI18n({
  title: 'Our social media expert is here to help you get started!',
  invitePeopleAltText: 'Invite people image',
  createTeamAltText: 'Create team image',
})(GettingStarted);
