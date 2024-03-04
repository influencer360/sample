import React from 'react';
import styled from 'styled-components';
import GlyphEmblemSingleEdit from '@fp-icons/emblem-single-edit';
import Icon from '@fp-icons/icon-base';
import { Button, SECONDARY } from 'fe-comp-button';
import { withI18n } from 'fe-lib-i18n';
import { getThemeValue, withHsTheme } from 'fe-lib-theme';
import { track } from 'fe-lib-tracking';
import { Lottie } from 'fe-pg-comp-lottie';
import { default as emptyAnimation } from 'assets/animations/top-posts-empty-state-animation.lottie.json';
import { TRACKING_EVENT_SCHEDULE_POST, TRACKING_ORIGIN_TOP_PERFORMING_POSTS } from 'constants/tracking';
import { openComposer } from 'utils/composer';

const EmptyStateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 32px;
`;

const Description = withHsTheme(styled.p`
  text-align: center;
  font-size: ${() => getThemeValue(t => t.typography.body.size)};
  font-weight: ${() => getThemeValue(t => t.typography.body.weight)};
  line-height: ${() => getThemeValue(t => t.typography.body.lineHeight)};
  color: ${() => getThemeValue(t => t.colors.darkGrey)};
  margin: 24px 0 52px 0;
`);

const IconWrapper = styled.div`
  margin-right: 8px;
  display: flex;
  justify-items: center;
`;

type HeaderProps = {
  $i18n: {
    description: () => string;
    buttonText: () => string;
  };
};

const EmptyTopPerformingPosts = ({ $i18n }: HeaderProps) => {
  const handleSchedulePost = () => {
    openComposer({}, {}, TRACKING_ORIGIN_TOP_PERFORMING_POSTS);
    track(TRACKING_ORIGIN_TOP_PERFORMING_POSTS, TRACKING_EVENT_SCHEDULE_POST);
  };

  return (
    <EmptyStateWrapper>
      <Lottie animationData={emptyAnimation} loop={false} width="170px" height="auto" />
      <Description data-testid="tpp-empty-tile-description">{$i18n.description()}</Description>
      <Button type={SECONDARY} width="304px" onClick={handleSchedulePost}>
        <IconWrapper>
          <Icon glyph={GlyphEmblemSingleEdit} size={16} fill="currentColor" />
        </IconWrapper>
        <span>{$i18n.buttonText()}</span>
      </Button>
    </EmptyStateWrapper>
  );
};

export default withI18n({
  description: 'Stay active on social media to view your top 3 performing posts.',
  buttonText: 'Schedule a post',
})(EmptyTopPerformingPosts);
