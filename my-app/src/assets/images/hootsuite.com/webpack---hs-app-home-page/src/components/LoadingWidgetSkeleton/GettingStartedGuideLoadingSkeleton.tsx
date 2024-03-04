import React from 'react';
import styled from 'styled-components';
import { LoadingSkeleton } from 'fe-social-value-comp-loading-skeleton';
import breakpoints from 'utils/breakpoints';

const mobileImgProps = { height: '275px', width: '368px' };
const mobileRowProps = {
  rows: 3,
  widths: ['80%', '80%', '80%'],
  heights: ['48px', '48px', '48px'],
  margin: '24px 0',
};

const VideoLoaderContainer = styled.div<{ width: number }>`
  display: flex;
  flex-direction: column;
  width: 782px;
  background: #fdfdfd;

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    display: none;
  }
`;

const GuideLoaderContainer = styled.div<{ width: number }>`
  display: flex;
  flex-direction: column;
  width: 40%;
  background: #fdfdfd;

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    display: none;
  }
`;

const MobileLoaderContainer = styled.div<{ width: number }>`
  display: none;
  flex-direction: column;
  width: 100%;
  background: #fdfdfd;

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    display: flex;
    flex-direction: column;
  }
`;

type WidgetLoadingSkeletonProps = {
  width: number;
};

const GettingStartedLoadingSkeleton = ({ width = 600 }: WidgetLoadingSkeletonProps) => {
  const titleRow = {
    rows: 1,
    widths: ['100%'],
    heights: ['24px'],
    margin: '0 0 24px 0',
  };
  const taskRowsProps = {
    rows: 3,
    widths: ['60%', '60%', '60%'],
    heights: ['48px', '48px', '48px'],
    margin: '24px 0',
  };
  const videoProps = { height: '438px', width: '100%' };

  return (
    <>
      <GuideLoaderContainer width={width}>
        <LoadingSkeleton type="row" rowProps={titleRow} />
        <LoadingSkeleton type="row" rowProps={taskRowsProps} />
      </GuideLoaderContainer>
      <VideoLoaderContainer width={width}>
        <LoadingSkeleton type="img" imgProps={videoProps} />
      </VideoLoaderContainer>
      <MobileLoaderContainer width={width}>
        <LoadingSkeleton type="img" imgProps={mobileImgProps} />
        <LoadingSkeleton type="row" rowProps={mobileRowProps} />
      </MobileLoaderContainer>
    </>
  );
};

export default GettingStartedLoadingSkeleton;
