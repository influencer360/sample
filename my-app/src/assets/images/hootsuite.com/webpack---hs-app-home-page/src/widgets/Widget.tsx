import React from 'react';
import styled from 'styled-components';
import { track } from 'fe-lib-tracking';
import { isInFirst30DayUXExperiment } from 'App';
import EmptyWidget from 'components/EmptyWidget/EmptyWidget';
import ErrorBoundaryWrapper from 'components/ErrorBoundaryWrapper';
import ErrorWidget from 'components/ErrorWidget';
import LoadingWidget from 'components/LoadingWidget';
import { TRACKING_EVENT_WIDGET_FAILED_TO_LOAD, TRACKING_ORIGIN_HOMEPAGE } from 'constants/tracking';
import { RequestStatusType } from 'typings/Shared';
import { WidgetName } from 'typings/Widget';
import breakpoints from 'utils/breakpoints';

const Container = styled.div<{
  size: number;
  minHeight: string;
  isSecondary: boolean;
  showFirst30DaysExperiment: boolean;
}>`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: ${p => (p.showFirst30DaysExperiment ? '#fdfdfd' : p.isSecondary ? '#F7F8F9' : 'transparent')}};
  padding: ${p => (p.showFirst30DaysExperiment ? '24px' : '28px 16px')};
  overflow: auto;
  width: ${p => `calc(100%/${p.size} - ${32 - 32 / p.size}px)`};
  min-height: ${p => p.minHeight};
  border: ${p => (p.isSecondary || p.showFirst30DaysExperiment ? 'none' : `1px solid #ebebeb`)};
  border-radius: ${p => (p.showFirst30DaysExperiment ? '16px' : p.isSecondary ? '0' : `8px`)};
  @media only screen and (max-width: ${breakpoints.breakpointLg}) {
    width: 100%;
  }
  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    padding: 24px;
  }
`;

//These sizes determine how many widgets could fit in a single row
const Sizes = {
  SMALL: 3,
  MEDIUM: 2,
  LARGE: 1,
};

type WidgetProps = {
  name: WidgetName;
  title: string;
  subtitle?: string;
  onClickCta: () => void;
  cta: string;
  showCta?: boolean;
  children: React.ReactNode;
  minHeight?: string;
  size?: number;
  status?: RequestStatusType;
  isSecondary?: boolean;
  isOpen?: boolean;
};

const LocalizedWidget: React.FC<WidgetProps> = ({
  name,
  title,
  subtitle,
  onClickCta,
  cta,
  showCta,
  children,
  minHeight,
  size,
  status,
  isSecondary = false,
  isOpen = true,
}) => {
  const showFirst30DaysExperiment = isInFirst30DayUXExperiment;
  return (
    <Container
      isSecondary={isSecondary}
      showFirst30DaysExperiment={showFirst30DaysExperiment}
      size={size || Sizes.MEDIUM}
      minHeight={`${minHeight}` || 'auto'}
      className={`homepage-widget-${name}`}
      data-dap-target={`homepage-widget-${name}`}
    >
      {(() => {
        switch (status) {
          case RequestStatusType.LOADING:
            return (
              <ErrorBoundaryWrapper
                name={name}
                title={title}
                subtitle={subtitle}
                showCta={showCta}
                onClickCta={onClickCta}
                cta={cta}
                isOpen={isOpen}
                isSecondary={isSecondary}
              >
                <LoadingWidget name={name} />
              </ErrorBoundaryWrapper>
            );
          case RequestStatusType.ERROR:
            track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_WIDGET_FAILED_TO_LOAD, { name: name });
            return (
              <ErrorBoundaryWrapper
                name={name}
                title={title}
                subtitle={subtitle}
                showCta={showCta}
                onClickCta={onClickCta}
                cta={cta}
                isOpen={isOpen}
                isSecondary={isSecondary}
              >
                <ErrorWidget />
              </ErrorBoundaryWrapper>
            );
          case RequestStatusType.EMPTY:
            return (
              <ErrorBoundaryWrapper
                name={name}
                title={title}
                subtitle={subtitle}
                showCta={showCta}
                onClickCta={onClickCta}
                cta={cta}
                isOpen={isOpen}
                isSecondary={isSecondary}
              >
                <EmptyWidget name={name} />
              </ErrorBoundaryWrapper>
            );
          case RequestStatusType.SUCCESS:
          default:
            return (
              <ErrorBoundaryWrapper
                name={name}
                title={title}
                subtitle={subtitle}
                showCta={showCta}
                onClickCta={onClickCta}
                cta={cta}
                isOpen={isOpen}
                isSecondary={isSecondary}
              >
                {children}
              </ErrorBoundaryWrapper>
            );
        }
      })()}
    </Container>
  );
};

export const Widget = LocalizedWidget;
export { Sizes };
