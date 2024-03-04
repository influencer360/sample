import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { withI18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { TrendCard } from 'fe-social-value-comp-trend-card';
import { TRACKING_EVENT_USER_CLICKS_VIEW_TRENDS, TRACKING_ORIGIN_HOMEPAGE } from 'constants/tracking';
import { usePosts } from 'hooks/useTrendPosts';
import { useTrends } from 'hooks/useTrends';
import { useWords } from 'hooks/useTrendWords';
import { RequestStatusType } from 'typings/Shared';
import { Trend, TrendProps } from 'typings/Trends';
import { WidgetName } from 'typings/Widget';
import { Sizes, Widget } from '../Widget';

const TrendsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  padding: 0.125rem;
  gap: 1.25rem;
`;

type TrendCardsProps = {
  trends: TrendProps[];
};

type SocialValueTrendsProps = {
  $i18n: {
    title: () => string;
    subtitle: () => string;
    cta: () => string;
  };
};

const TrendCards = ({ trends }: TrendCardsProps) => {
  return (
    <TrendsWrapper>
      {trends.map((trend: TrendProps) => (
        <TrendCard key={trend.id} {...trend} />
      ))}
    </TrendsWrapper>
  );
};

const SocialValueTrends = ({ $i18n }: SocialValueTrendsProps) => {
  const { trends, trendIds, status: trendStatus } = useTrends(true, '3');
  const { words, status: wordStatus } = useWords(true, trendIds, '10');
  const { posts, status: postStatus } = usePosts(true, trendIds, '1');
  const [latestTrends, setLatestTrends] = useState<TrendProps[] | null>(null);
  const [status, setStatus] = useState(RequestStatusType.LOADING);

  function onCTAClick() {
    track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_VIEW_TRENDS, {
      widgetName: WidgetName.SOCIAL_VALUE_TRENDS,
    });
    window.location.hash = '#/trends';
  }

  useEffect(() => {
    if (
      trendStatus === RequestStatusType.LOADING ||
      wordStatus === RequestStatusType.LOADING ||
      postStatus === RequestStatusType.LOADING
    ) {
      setStatus(RequestStatusType.LOADING);
    } else if (
      trendStatus === RequestStatusType.EMPTY ||
      wordStatus === RequestStatusType.EMPTY ||
      postStatus === RequestStatusType.EMPTY
    ) {
      setStatus(RequestStatusType.EMPTY);
    } else if (
      trendStatus === RequestStatusType.ERROR ||
      wordStatus === RequestStatusType.ERROR ||
      postStatus === RequestStatusType.ERROR
    ) {
      setStatus(RequestStatusType.EMPTY);
    } else {
      setStatus(RequestStatusType.SUCCESS);
    }
  }, [postStatus, trendStatus, wordStatus]);

  useEffect(() => {
    setStatus(RequestStatusType.LOADING);
    if (trends.length && words.length && posts.length) {
      const trendCards = trends.map((trend: Trend, index: number) => {
        return {
          ...trend,
          words: words[index],
          post: posts[index][0],
        };
      });
      setLatestTrends(trendCards);
      setStatus(RequestStatusType.SUCCESS);
    } else {
      setLatestTrends([]);
      setStatus(RequestStatusType.EMPTY);
    }
  }, [trends, words, posts]);

  return (
    <Widget
      name={WidgetName.SOCIAL_VALUE_TRENDS}
      status={status}
      size={Sizes.LARGE}
      minHeight={RequestStatusType.ERROR ? '400px' : 'auto'}
      title={$i18n.title()}
      subtitle={$i18n.subtitle()}
      cta={$i18n.cta()}
      showCta={true}
      onClickCta={onCTAClick}
    >
      {latestTrends && <TrendCards trends={latestTrends} />}
    </Widget>
  );
};

export default withI18n({
  title: 'Discover the trends that made waves',
  subtitle: 'Last 7 days',
  cta: 'See more trending content',
})(SocialValueTrends);
