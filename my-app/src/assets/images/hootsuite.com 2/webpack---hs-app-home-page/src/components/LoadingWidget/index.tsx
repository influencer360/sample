import React from 'react';
import styled from 'styled-components';
import { useElementSize } from 'hooks/useElementSize';
import { LoadingSkeletonType } from 'typings/LoadingSkeletonTypes';
import { WidgetName } from 'typings/Widget';
import WidgetLoadingSkeleton from '../LoadingWidgetSkeleton';

type LoadingWidgetProps = {
  name: WidgetName;
};

const AnnouncementWidgetLoadingContainer = styled.div`
  width: 100%;
  display: flex;
  gap: 16px;
  overflow: hidden;
`;

const SocialPostWidgetLoadingContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
`;

const SocialProfileLoadingContainer = styled.div`
  display: flex;
  justify-content: space-between;
  overflow: hidden;
`;

const SocialProfileLoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 471px;
`;

const LoadingWidget = ({ name }: LoadingWidgetProps) => {
  const minColumnWidth = 333;
  const { ref, width } = useElementSize();
  const cols = Math.max(Math.floor(width / minColumnWidth), 1);
  if (name === WidgetName.ANNOUNCEMENTS) {
    return (
      <AnnouncementWidgetLoadingContainer>
        <WidgetLoadingSkeleton variant={LoadingSkeletonType.ANNOUNCEMENT_CARD_LOADING_SKELETON} />
        <WidgetLoadingSkeleton variant={LoadingSkeletonType.ANNOUNCEMENT_CARD_LOADING_SKELETON} />
        <WidgetLoadingSkeleton variant={LoadingSkeletonType.ANNOUNCEMENT_CARD_LOADING_SKELETON} />
      </AnnouncementWidgetLoadingContainer>
    );
  } else if (name === WidgetName.VIDEO_ANNOUNCEMENTS) {
    return (
      <AnnouncementWidgetLoadingContainer>
        <WidgetLoadingSkeleton variant={LoadingSkeletonType.VIDEO_ANNOUNCEMENT_LOADING_SKELETON} />
        <WidgetLoadingSkeleton variant={LoadingSkeletonType.VIDEO_ANNOUNCEMENT_LOADING_SKELETON} />
      </AnnouncementWidgetLoadingContainer>
    );
  } else if (name === WidgetName.GETTING_STARTED_GUIDE) {
    return (
      <AnnouncementWidgetLoadingContainer>
        <WidgetLoadingSkeleton variant={LoadingSkeletonType.GETTING_STARTED_GUIDE_LOADING_SKELETON} />
      </AnnouncementWidgetLoadingContainer>
    );
  } else if (name === WidgetName.CONNECTED_ACCOUNTS) {
    return (
      <SocialProfileLoadingContainer ref={ref}>
        <SocialProfileLoadingWrapper>
          <WidgetLoadingSkeleton variant={LoadingSkeletonType.SOCIAL_PROFILE_LOADING_SKELETON} />
          <WidgetLoadingSkeleton variant={LoadingSkeletonType.SOCIAL_PROFILE_LOADING_SKELETON} />
          <WidgetLoadingSkeleton variant={LoadingSkeletonType.SOCIAL_PROFILE_LOADING_SKELETON} />
        </SocialProfileLoadingWrapper>
        {cols > 1 && (
          <SocialProfileLoadingWrapper>
            <WidgetLoadingSkeleton variant={LoadingSkeletonType.SOCIAL_PROFILE_LOADING_SKELETON} />
            <WidgetLoadingSkeleton variant={LoadingSkeletonType.SOCIAL_PROFILE_LOADING_SKELETON} />
            <WidgetLoadingSkeleton variant={LoadingSkeletonType.SOCIAL_PROFILE_LOADING_SKELETON} />
          </SocialProfileLoadingWrapper>
        )}
      </SocialProfileLoadingContainer>
    );
  } else {
    return (
      <SocialPostWidgetLoadingContainer>
        <WidgetLoadingSkeleton variant={LoadingSkeletonType.SOCIAL_POST_LOADING_SKELETON} />
        <WidgetLoadingSkeleton variant={LoadingSkeletonType.SOCIAL_POST_LOADING_SKELETON} />
        <WidgetLoadingSkeleton variant={LoadingSkeletonType.SOCIAL_POST_LOADING_SKELETON} />
      </SocialPostWidgetLoadingContainer>
    );
  }
};

export default LoadingWidget;
