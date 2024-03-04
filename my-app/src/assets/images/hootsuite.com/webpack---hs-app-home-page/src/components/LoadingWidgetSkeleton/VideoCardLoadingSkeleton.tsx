import React from 'react';
import styled from 'styled-components';
import { LoadingSkeleton } from 'fe-social-value-comp-loading-skeleton';
import breakpoints from 'utils/breakpoints';

const mobileImgProps = { height: '275px', width: '368px' };
const mobileRowProps = {
  rows: 3,
  widths: ['100%', '75%', '100%'],
  heights: ['24px', '24px', '48px'],
  margin: '8px 0',
};

const LoaderContainer = styled.div<{ width: number }>`
  display: flex;
  flex-direction: column;
  width: 50%;
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

const PaddingWrapper = styled.div`
  padding: 16px;
  && > ul {
    width: auto;

    > * {
      &&:first-child {
        margin-top: 0px;
      }

      &:last-child {
        margin-top: 50px;
        float: right;
      }
    }
  }
`;

const MobilePaddingWrapper = styled.div`
  padding: 16px;
  && > ul {
    width: auto;

    > * {
      &&:first-child {
        margin-top: 0px;
      }

      &:last-child {
        margin-top: 16px;
        float: right;
      }
    }
  }
`;

type WidgetLoadingSkeletonProps = {
  width: number;
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

const VideoCardLoadingSkeleton = ({
  width = 600,
  imgProps = { height: '343px', width: '100%' },
  rowProps = { rows: 3, widths: ['100%', '80%', '119px'], heights: ['24px', '24px', '48px'], margin: '8px 0' },
}: WidgetLoadingSkeletonProps) => {
  return (
    <>
      <LoaderContainer width={width}>
        <LoadingSkeleton type="img" imgProps={imgProps} />
        <PaddingWrapper>
          <LoadingSkeleton type="row" rowProps={rowProps} />
        </PaddingWrapper>
      </LoaderContainer>
      <MobileLoaderContainer width={width}>
        <LoadingSkeleton type="img" imgProps={mobileImgProps} />
        <MobilePaddingWrapper>
          <LoadingSkeleton type="row" rowProps={mobileRowProps} />
        </MobilePaddingWrapper>
      </MobileLoaderContainer>
    </>
  );
};

export default VideoCardLoadingSkeleton;
