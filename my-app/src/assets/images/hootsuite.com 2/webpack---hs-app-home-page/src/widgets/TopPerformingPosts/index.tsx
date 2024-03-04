import React from 'react';
import { withI18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { isInFirst30DayUXExperiment } from 'App';
import { ANALYTICS_POST_PERFORMANCE_LINK } from 'constants/navigation';
import { TRACKING_EVENT_USER_CLICKS_VIEW_MORE_DETAILS_CTA, TRACKING_ORIGIN_HOMEPAGE } from 'constants/tracking';
import useTopPerformingPosts from 'hooks/useTopPerformingPosts';
import { RequestStatusType } from 'typings/Shared';
import { WidgetName } from 'typings/Widget';
import { Sizes, Widget } from 'widgets/Widget';
import TopPosts from './TopPosts';

type TopPerformingPostsProps = {
  $i18n: {
    title: () => string;
    subtitle: () => string;
    cta: () => string;
  };
};

const TopPerformingPosts = ({ $i18n }: TopPerformingPostsProps) => {
  const showFirst30DaysExperiment = isInFirst30DayUXExperiment;
  const topPostsToRetrieve = 3;
  const { posts, status } = useTopPerformingPosts(topPostsToRetrieve);

  return (
    <Widget
      name={WidgetName.TOP_PERFORMING_POSTS}
      size={Sizes.MEDIUM}
      cta={$i18n.cta()}
      status={status}
      title={$i18n.title()}
      subtitle={$i18n.subtitle()}
      showCta={showFirst30DaysExperiment ? status === RequestStatusType.SUCCESS : true}
      minHeight={showFirst30DaysExperiment ? '644px' : '400px'}
      onClickCta={() => {
        track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_VIEW_MORE_DETAILS_CTA, {
          widgetName: WidgetName.TOP_PERFORMING_POSTS,
        });
        window.location.href = ANALYTICS_POST_PERFORMANCE_LINK;
      }}
    >
      <TopPosts posts={posts} />
    </Widget>
  );
};

export default withI18n({
  title: 'Top performing posts',
  subtitle: 'Last 30 days',
  cta: 'Analyze results',
})(TopPerformingPosts);
