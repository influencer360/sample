import React from 'react';
import styled from 'styled-components';
import { LoadingSkeleton } from 'fe-social-value-comp-loading-skeleton';

const SocialPostContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  background: #fdfdfd;
  border-radius: 2px;
  border: 1px solid #e6eaeb;
`;

const AvatarWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 20px;
  && > ul {
    width: auto;
  }

  && > div {
    width: 20px;
    height: 20px;
  }
`;

const ContentWrapper = styled.div`
  flex-grow: 1;
  padding: 16px 24px 0 0;
`;

type WidgetLoadingSkeletonProps = {
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

const SocialPostLoadingSkeleton = ({
  imgProps = { height: '132px', width: '200px' },
  rowProps = { rows: 2, widths: ['100%', '100%'], heights: ['16px', '16px'], margin: '8px 0' },
}: WidgetLoadingSkeletonProps) => {
  return (
    <SocialPostContainer>
      <LoadingSkeleton type="img" imgProps={imgProps} />
      <ContentWrapper>
        <AvatarWrapper>
          <LoadingSkeleton type="avatar" />
          <LoadingSkeleton type="row" rowProps={{ rows: 1, widths: ['104px'], heights: ['20px'] }} />
        </AvatarWrapper>
        <LoadingSkeleton type="row" rowProps={rowProps} />
        <LoadingSkeleton type="row" rowProps={{ rows: 1, widths: ['110px'], heights: ['12px'] }} />
      </ContentWrapper>
    </SocialPostContainer>
  );
};

export default SocialPostLoadingSkeleton;
