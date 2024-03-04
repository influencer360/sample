import React from 'react';
import { LoadingSkeletonType } from 'typings/LoadingSkeletonTypes';
import CardLoadingSkeleton from './CardLoadingSkeleton';
import GettingStartedLoadingSkeleton from './GettingStartedGuideLoadingSkeleton';
import SocialPostLoadingSkeleton from './SocialPostLoadingSkeleton';
import SocialProfileLoadingSkeleton from './SocialProfileLoadingSkeleton';
import VideoCardLoadingSkeleton from './VideoCardLoadingSkeleton';

type WidgetLoadingSkeletonProps = {
  variant: LoadingSkeletonType;
  width?: number;
  imgProps?: {
    height: string;
    width: string;
  };
  rowProps?: {
    rows: number;
    widths?: string[];
    heights?: string[];
    margin?: string;
  };
};

const WidgetLoadingSkeleton = ({ variant, width = 600, imgProps, rowProps }: WidgetLoadingSkeletonProps) => {
  if (variant === LoadingSkeletonType.ANNOUNCEMENT_CARD_LOADING_SKELETON) {
    return <CardLoadingSkeleton width={width} imgProps={imgProps} rowProps={rowProps} />;
  }
  if (variant === LoadingSkeletonType.VIDEO_ANNOUNCEMENT_LOADING_SKELETON) {
    return <VideoCardLoadingSkeleton width={width} imgProps={imgProps} rowProps={rowProps} />;
  }
  if (variant === LoadingSkeletonType.SOCIAL_POST_LOADING_SKELETON) {
    return <SocialPostLoadingSkeleton imgProps={imgProps} rowProps={rowProps} />;
  }
  if (variant === LoadingSkeletonType.GETTING_STARTED_GUIDE_LOADING_SKELETON) {
    return <GettingStartedLoadingSkeleton width={width} />;
  }

  return <SocialProfileLoadingSkeleton rowProps={rowProps} />;
};

export default WidgetLoadingSkeleton;
