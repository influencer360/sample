import React from 'react';
import styled from 'styled-components';
import { LoadingSkeleton } from 'fe-social-value-comp-loading-skeleton';
import breakpoints from 'utils/breakpoints';

const mobileImgProps = { height: '275px', width: '368px' };
const mobileRowProps = {
  rows: 3,
  widths: ['100%', '269px', '119px'],
  heights: ['24px', '24px', '48px'],
  margin: '8px 0',
};

const LoaderContainer = styled.div<{ width: number }>`
  display: flex;
  flex-direction: row;
  gap: 16px;
  width: ${p => p.width}px;
  background: #fdfdfd;
  padding: 16px;

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    display: none;
  }

  && > ul {
    width: auto;

    > * {
      &:first-child {
        margin-top: 0px;
      }

      &:last-child {
        margin-top: 16px;
      }
    }
  }
`;

const MobileLoaderContainer = styled.div<{ width: number }>`
  display: none;
  flex-direction: row;
  gap: 16px;
  width: ${p => p.width}px;
  background: #fdfdfd;
  padding: 16px;

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    display: flex;
    flex-direction: column;
  }

  && > ul {
    width: auto;

    > * {
      &:first-child {
        margin-top: 0px;
      }

      &:last-child {
        margin-top: 16px;
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

const CardLoadingSkeleton = ({
  width = 600,
  imgProps = { height: '200px', width: '267px' },
  rowProps = { rows: 3, widths: ['285px', '250px', '119px'], heights: ['24px', '24px', '48px'], margin: '8px 0' },
}: WidgetLoadingSkeletonProps) => {
  return (
    <>
      <LoaderContainer width={width}>
        <LoadingSkeleton type="img" imgProps={imgProps} />
        <LoadingSkeleton type="row" rowProps={rowProps} />
      </LoaderContainer>
      <MobileLoaderContainer width={width}>
        <LoadingSkeleton type="img" imgProps={mobileImgProps} />
        <LoadingSkeleton type="row" rowProps={mobileRowProps} />
      </MobileLoaderContainer>
    </>
  );
};

export default CardLoadingSkeleton;
