import React, { ReactElement } from 'react';
import { MemberSRS } from 'typings/SocialRelationshipScore';

export type MetricData = {
  previousValue: number;
  currentValue: number;
  metricName: string;
};

export type ScoreData = {
  score: number;
  lastUpdatedScore: string;
  nextUpdateScore: string;
  nextUpdatedInsights?: ReactElement;
  contributionText?: ReactElement;
  factorsData: MetricData[];
};

export type Insights = {
  followerGrowth: MetricData;
  reach: MetricData;
  avgPostEngagement: MetricData;
};

const metricNameMapping: Record<string, string> = {
  avgPostEngagement: 'Avg post engagement rate',
  followerGrowth: 'Follower growth',
  reach: 'Page and profile reach',
};

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function getContributionText(currentSRS: MemberSRS): ReactElement {
  if (currentSRS && currentSRS.insights) {
    const bigChanges = Object.entries(currentSRS.insights).filter(([metric, { change }]) => change.includes('BIG'));
    if (bigChanges.length > 0) {
      const [metric, { change }] = bigChanges[0];

      const changeType = change.includes('INCREASE') ? 'increase' : 'decrease';
      const metricName = metricNameMapping[metric];
      return (
        <>
          <strong>{metricName}</strong> contributed most to your score {changeType}.
        </>
      );
    } else {
      return <></>;
    }
  } else {
    return <></>;
  }
}
export function formatResponse(currentSRS: MemberSRS, previousSRS: MemberSRS): ScoreData {
  const insightsKeys: Array<keyof Insights> = ['avgPostEngagement', 'followerGrowth', 'reach'];

  const currentSRSDate = currentSRS ? new Date(currentSRS.calculationDate) : new Date();
  const nextUpdateTime = new Date(currentSRSDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  function generateInsightsMessage(variationBy: number): ReactElement {
    if (variationBy > 0) {
      return (
        <>
          Your score <strong>increased by {variationBy} points</strong> in the last week. Way to go!
        </>
      );
    } else if (variationBy < 0) {
      return (
        <>
          Your score <strong>decreased by {Math.abs(variationBy)}</strong> points in the last week.
        </>
      );
    } else {
      return (
        <>
          Your score <strong>is the same</strong> as last week. Keep going!
        </>
      );
    }
  }

  let variationText = <div>Your score is the same as last week. Keep going!</div>;
  if (currentSRS?.score !== undefined && previousSRS?.score !== undefined) {
    const variationBy = currentSRS.score - previousSRS.score;
    variationText = generateInsightsMessage(variationBy);
  }

  const scoreData: ScoreData = {
    score: currentSRS?.score || 0,
    lastUpdatedScore: formatDate(currentSRSDate),
    nextUpdateScore: formatDate(nextUpdateTime),
    nextUpdatedInsights: variationText,
    contributionText: getContributionText(currentSRS),
    factorsData: insightsKeys.reduce((acc: MetricData[], subScoreName: keyof Insights) => {
      const metricName = metricNameMapping[subScoreName];

      const metricData = {
        previousValue: previousSRS?.insights[subScoreName]?.value || 0,
        currentValue: currentSRS?.insights[subScoreName]?.value || 0,
        metricName,
      };

      acc.push(metricData);
      return acc;
    }, []),
  };

  return scoreData;
}
