import React from 'react';
import styled from 'styled-components';
import { LoadingSkeleton } from 'fe-social-value-comp-loading-skeleton';

const AvatarWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  && > ul {
    width: auto;
  }
`;

type WidgetLoadingSkeletonProps = {
  rowProps?: {
    rows: number;
    widths?: string[];
    heights?: string[];
    margin?: string;
  };
};

const SocialProfileLoadingSkeleton = ({
  rowProps = { rows: 1, widths: ['164px'], heights: ['24px'] },
}: WidgetLoadingSkeletonProps) => {
  return (
    <AvatarWrapper>
      <LoadingSkeleton type="avatar" />
      <LoadingSkeleton type="row" rowProps={rowProps} />
    </AvatarWrapper>
  );
};

export default SocialProfileLoadingSkeleton;
