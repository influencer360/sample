import React from 'react';
import styled from 'styled-components';
import { track } from 'fe-lib-tracking';
import EmptyWidget from 'components/EmptyWidget/EmptyWidget';
import ErrorWidget from 'components/ErrorWidget';
import LoadingWidget from 'components/LoadingWidget';
import { TRACKING_EVENT_WIDGET_FAILED_TO_LOAD, TRACKING_ORIGIN_HOMEPAGE } from 'constants/tracking';
import { RequestStatusType } from 'typings/Shared';
import { WidgetName } from 'typings/Widget';
import breakpoints from 'utils/breakpoints';
import ErrorBoundaryWrapper from './ErrorBoundary';

const Container = styled.div<{ minHeight: string }>`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: #fdfdfd;
  padding: 24px;
  overflow: auto;
  width: 100%;
  min-height: ${p => p.minHeight};
  border: none;
  border-radius: 16px;
  @media only screen and (max-width: ${breakpoints.breakpointLg}) {
    width: 100%;
  }
  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    padding: 24px;
  }
  @media only screen and (max-width: 1585px) {
    min-height: auto;
  }
`;

type WidgetProps = {
  name: WidgetName;
  children: React.ReactNode;
  status?: RequestStatusType;
  minHeight?: string;
};

const LocalizedWidget: React.FC<WidgetProps> = ({ name, children, status, minHeight = '488px' }) => {
  return (
    <Container className={`homepage-widget-${name}`} data-dap-target={`homepage-widget-${name}`} minHeight={minHeight}>
      {(() => {
        switch (status) {
          case RequestStatusType.LOADING:
            return (
              <ErrorBoundaryWrapper name={name}>
                <LoadingWidget name={name} />
              </ErrorBoundaryWrapper>
            );
          case RequestStatusType.ERROR:
            track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_WIDGET_FAILED_TO_LOAD, { name: name });
            return (
              <ErrorBoundaryWrapper name={name}>
                <ErrorWidget />
              </ErrorBoundaryWrapper>
            );
          case RequestStatusType.EMPTY:
            return (
              <ErrorBoundaryWrapper name={name}>
                <EmptyWidget name={name} />
              </ErrorBoundaryWrapper>
            );
          case RequestStatusType.SUCCESS:
          default:
            return <ErrorBoundaryWrapper name={name}>{children}</ErrorBoundaryWrapper>;
        }
      })()}
    </Container>
  );
};

export const Widget = LocalizedWidget;
