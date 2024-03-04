import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import styled from 'styled-components';
import { withI18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { Gauge } from 'fe-pg-comp-gauge';
import { SocialNetworkIcon } from 'fe-social-value-comp-network-icon';
import { RecommendationTile } from 'fe-social-value-comp-recommendation-tile';
import { SocialNetworkName, GoalData, UnitType, GoalStatusData } from 'fe-social-value-lib-core';
import { TRACKING_EVENT_USER_CLICKS_VIEW_GOALS, TRACKING_ORIGIN_HOMEPAGE } from 'constants/tracking';
import { useGoals } from 'hooks/useGoals';
import { useRecommendations } from 'hooks/useRecommendations';
import { RequestStatusType } from 'typings/Shared';
import { WidgetName } from 'typings/Widget';
import { Sizes, Widget } from '../Widget';
import ProfileIcon from './ProfileIcon';

const GoalsWrapper = styled.div`
  border-radius: 8px;
  border: 1px solid #ebebeb;
  padding: 24px;
`;

const StatusContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const SocialContainer = styled.div`
  display: flex;
  height: fit-content;
  align-items: center;
`;

const GoalContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const GoalInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoLabel = styled.p`
  color: #1c1c1c;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
`;

const GoalTitle = styled.h2`
  color: #1c1c1c;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
`;

const GoalDescription = styled.p`
  margin: 0;
  color: #1c1c1c;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px;
  margin-bottom: 4px;
`;

const StatusList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  margin-bottom: 20px;
`;
const StatusChip = styled.li<{ atRisk: boolean | undefined }>`
  font-size: 14px;
  line-height: 18px;
  padding: 4px 8px;
  background-color: ${p => (p.atRisk === undefined ? '#e6eaeb' : p.atRisk ? '#FFE7C0' : '#E6F6F3')};
  color: ${p => (p.atRisk === undefined ? '#1C1C1C' : p.atRisk ? '#8C621C;' : '#01781B')};
  font-weight: 600;
  display: inline-block;
  border-radius: 2px;
  margin-right: 8px;
  &:last-child {
    margin-right: 0px;
  }
`;

const ProgressGaugeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TargetContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  bottom: 16px;
`;

const TargetTitle = styled.p`
  margin: 0;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 20px;
`;

const TargetInfo = styled.p`
  margin: -2;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
`;

const GaugeContainer = styled.div`
  position: relative;

  circle {
    transition: none;
  }

  text {
    font-weight: 600;
  }
`;

const SocialProfilesLeft = styled.div`
  display: flex;
  width: 23px;
  height: 23px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 50px;
  background: #eef1f2;
  text-align: center;
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 20px;
  border: 1px solid #fdfdfd;
`;

const SocialNetworkIconWrapper = styled.div`
  margin-right: 14px;
`;

const SocialAccountWrapper = styled.div`
  display: flex;
  > svg {
    margin-left: -6px;
  }

  > div {
    margin-left: -6px;
  }
`;

type DraftsProps = {
  $i18n: {
    title: () => string;
    subtitle: () => string;
    cta: () => string;
    create: () => string;
    lastUpdatedLabel: () => string;
    achieveByLabel: () => string;
    dateRange: () => string;
    onTrack: () => string;
    atRisk: () => string;
    goalTarget: () => string;
  };
};

const SocialValue = ({ $i18n }: DraftsProps) => {
  const dateFormat = 'MMM dd, yyyy';

  const { goals, goalsStatus: goalStatus } = useGoals(true);
  const { recommendations, status: recommendationStatus } = useRecommendations(true);
  const [status, setStatus] = useState(RequestStatusType.LOADING);

  function onCTAClick() {
    track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_VIEW_GOALS, {
      widgetName: WidgetName.SOCIAL_VALUE,
    });
    window.location.hash = '#/goals';
  }

  function formatGoalDescription(goal: GoalData) {
    let onSocialNetworkLabel: string;
    let goalTargetWithUnits: string;

    if (goal.metric.unit === UnitType.percentage) {
      goalTargetWithUnits = `${goal.targetValue}%`;
    } else {
      goalTargetWithUnits = goal.targetValue.toLocaleString();
    }

    if (!goal.metric.platform) {
      onSocialNetworkLabel = '';
    } else {
      onSocialNetworkLabel = ` on ${SocialNetworkName[goal.metric.platform]} `;
    }

    return `Increase ${goal.metric.displayName}${onSocialNetworkLabel}by ${goalTargetWithUnits} by ${format(
      new Date(goal.targetDate),
      dateFormat,
    )}.`;
  }

  function renderLastUpdatedInfo(goal: GoalData, mockDateRange: boolean) {
    /* TODO: Missing Date range as per designs. Not yet implemented by SV Devs  */

    if (mockDateRange && goal._metadata.updatedAt && goal.targetDate) {
      return (
        <InfoLabel>{`${$i18n.dateRange()}:  ${format(new Date(goal._metadata.updatedAt), dateFormat)} - ${format(
          new Date(goal.targetDate),
          dateFormat,
        )}`}</InfoLabel>
      );
    } else {
      return (
        <>
          <InfoLabel>{`${$i18n.achieveByLabel()}: ${format(new Date(goal.targetDate), dateFormat)}`}</InfoLabel>
          {goal._metadata.updatedAt && (
            <InfoLabel>{`${$i18n.lastUpdatedLabel()}: ${format(
              new Date(goal._metadata.updatedAt),
              dateFormat,
            )}`}</InfoLabel>
          )}
        </>
      );
    }
  }

  function formatPercentage(percentage: number | undefined) {
    let x;
    if (percentage) {
      x = Math.round(percentage);
    }

    return x;
  }

  function renderSocialAccounts(socialAccounts: string[]) {
    const profiles = [];
    const maxNumberOfAccounts = 3;
    let numberLeft;
    if (socialAccounts.length > maxNumberOfAccounts) {
      numberLeft = socialAccounts.length - maxNumberOfAccounts;
      for (let i = 0; i < maxNumberOfAccounts; i++) {
        profiles.push(<ProfileIcon key={socialAccounts[i]} />);
      }
      if (numberLeft) {
        profiles.push(<SocialProfilesLeft key={numberLeft}>{numberLeft}+</SocialProfilesLeft>);
      }
    } else {
      for (let i = 0; i < socialAccounts.length; i++) {
        profiles.push(<ProfileIcon key={socialAccounts[i]} />);
      }
    }

    return profiles;
  }

  useEffect(() => {
    if (recommendationStatus === RequestStatusType.LOADING || goalStatus === RequestStatusType.LOADING) {
      setStatus(RequestStatusType.LOADING);
    } else if (recommendationStatus === RequestStatusType.EMPTY || goalStatus === RequestStatusType.EMPTY) {
      setStatus(RequestStatusType.EMPTY);
    } else if (recommendationStatus === RequestStatusType.ERROR || goalStatus === RequestStatusType.ERROR) {
      setStatus(RequestStatusType.EMPTY);
    } else {
      setStatus(RequestStatusType.SUCCESS);
    }
  }, [recommendationStatus, goalStatus]);

  const latestGoal: GoalStatusData | null = goals?.length ? goals[goals.length - 1] : null;

  return (
    <Widget
      name={WidgetName.SOCIAL_VALUE}
      status={status}
      size={Sizes.MEDIUM}
      minHeight={RequestStatusType.ERROR ? '400px' : 'auto'}
      title={$i18n.title()}
      subtitle={$i18n.subtitle()}
      cta={$i18n.cta()}
      showCta={true}
      onClickCta={onCTAClick}
    >
      {latestGoal && (
        <GoalsWrapper>
          <StatusContainer>
            <SocialContainer>
              <SocialNetworkIconWrapper>
                <SocialNetworkIcon socialNetwork={latestGoal.goal.metric.platform} />
              </SocialNetworkIconWrapper>
              <SocialAccountWrapper>{renderSocialAccounts(latestGoal.goal.socialProfiles)}</SocialAccountWrapper>
            </SocialContainer>
            <StatusList>
              <StatusChip atRisk={undefined}>{latestGoal.goal.type}</StatusChip>
              <StatusChip atRisk={latestGoal?.isGoalAtRisk}>
                {latestGoal?.isGoalAtRisk ? $i18n.atRisk() : $i18n.onTrack()}
              </StatusChip>
            </StatusList>
          </StatusContainer>
          <GoalContainer>
            <GoalInfo>
              <GoalTitle>{latestGoal.goal.displayName}</GoalTitle>
              <GoalDescription>{formatGoalDescription(latestGoal.goal)}</GoalDescription>
              <div>{renderLastUpdatedInfo(latestGoal.goal, true)}</div>
            </GoalInfo>
            <ProgressGaugeContainer>
              <GaugeContainer>
                <Gauge
                  value={formatPercentage(latestGoal.progressPercentage)}
                  size={100}
                  textSize={28}
                  progressColor="#2269DD"
                  barWidth={8}
                  percentage={true}
                />
              </GaugeContainer>
              <TargetContainer>
                <TargetTitle>{$i18n.goalTarget()}</TargetTitle>
                <TargetInfo>{latestGoal.goal.targetValue}</TargetInfo>
              </TargetContainer>
            </ProgressGaugeContainer>
          </GoalContainer>
          {recommendations.length > 0 && (
            <RecommendationTile
              askForFeedback={recommendations[recommendations.length - 1]?.askForFeedback}
              ctaBtnText={recommendations[recommendations.length - 1]?.ctaBtnText}
              ctaLink={recommendations[recommendations.length - 1]?.ctaLink}
              text={recommendations[recommendations.length - 1]?.text}
            />
          )}
        </GoalsWrapper>
      )}
    </Widget>
  );
};

export default withI18n({
  title: 'Active goals',
  subtitle: 'Recently added',
  cta: 'View goals',
  lastUpdatedLabel: 'Last updated',
  achieveByLabel: 'Achieve by',
  dateRange: 'Date Range',
  onTrack: 'On Track',
  atRisk: 'At risk',
  goalTarget: 'Goal Target',
})(SocialValue);
