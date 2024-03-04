import React from 'react';
import styled from 'styled-components';
import { getThemeValue, withHsTheme } from 'fe-lib-theme';
import { withActionHistory, ActionHistoryProps } from 'fe-pg-lib-action-history';
import { ErrorBoundary } from 'fe-pnc-comp-error-boundary';
import { LinkButton } from 'fe-pnc-comp-link-button';
import { isInFirst30DayUXExperiment } from 'App';
import { SOCIAL_VALUE_GOALS_BANNER_IS_DISMISSED } from 'constants/actionHistoryKeys';
import { WidgetName } from 'typings/Widget';
import breakpoints from 'utils/breakpoints';
import { Banner } from '../../widgets/SocialValue/Banner';
import ErrorWidget from '../ErrorWidget';

const Header = styled.div`
  flex-shrink: 1;
  display: flex;
  padding-right: 12px;
`;

const Left = styled.div`
  flex-grow: 1;
`;

const Title = withHsTheme(styled.h2<{ showFirst30DaysExperiment: boolean }>`
  font-weight: 600;
  font-size: ${p => (p.showFirst30DaysExperiment ? '22px' : '18px')};
  line-height: ${p => (p.showFirst30DaysExperiment ? '32px' : '28px')};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    font-size: 20px;
  }
`);

const Subtitle = withHsTheme(styled.h3`
  font-weight: 400;
  color: #5c5c5c;
  font-size: 16px;
  line-height: ${() => getThemeValue(t => t.typography.subSectionTitle.lineHeight)};
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`);

const CtaLink = styled(LinkButton)`
  &&& {
    color: #1c1c1c;
  }
`;

const Body = styled.div<{ isOpen: boolean | undefined; isSecondary: boolean | undefined }>`
  display: ${p => (p.isOpen ? 'block' : 'none')};
  margin-top: 16px;
  padding: ${p => (p.isSecondary ? '0' : '16px')};
  height: 100%;
  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    margin-top: 18px;
  }
  flex-direction: column;
`;

type ErrorProps = {
  error?: Error;
  resetErrorBoundary?: (...args: Array<unknown>) => void;
};

type ErrorBoundaryWrapperProps = ErrorProps & {
  name: string;
  title: string;
  subtitle?: string;
  showCta?: boolean;
  onClickCta: () => void;
  cta: string;
  isOpen?: boolean;
  isSecondary?: boolean;
  children: React.ReactNode;
} & ActionHistoryProps;

const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = ({
  name,
  title,
  subtitle,
  showCta,
  onClickCta,
  cta,
  isOpen,
  isSecondary = true,
  children,
  $actionHistory,
}) => {
  const showFirst30DaysExperiment = isInFirst30DayUXExperiment;

  return (
    <ErrorBoundary
      FallbackComponent={props => <ErrorWidget {...props} />}
      logCategory={'homepage'}
      logMessage={`widget failed to load - ${name}`}
    >
      {name === WidgetName.SOCIAL_VALUE && !$actionHistory[SOCIAL_VALUE_GOALS_BANNER_IS_DISMISSED] && <Banner />}
      <Header>
        <Left>
          <Title className={'homepage-widget-title'} showFirst30DaysExperiment={showFirst30DaysExperiment}>
            {title}
          </Title>
          {subtitle && <Subtitle>{subtitle}</Subtitle>}
        </Left>
        {showCta !== false && <CtaLink onClick={() => onClickCta()}>{cta}</CtaLink>}
      </Header>
      <Body isOpen={isOpen} isSecondary={isSecondary} className={'homepage-widget-body'}>
        {children}
      </Body>
    </ErrorBoundary>
  );
};

export default withActionHistory(ErrorBoundaryWrapper);
