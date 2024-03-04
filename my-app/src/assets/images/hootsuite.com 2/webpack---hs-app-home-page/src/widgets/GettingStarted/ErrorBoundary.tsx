import React from 'react';
import styled from 'styled-components';
import { withActionHistory, ActionHistoryProps } from 'fe-pg-lib-action-history';
import { ErrorBoundary } from 'fe-pnc-comp-error-boundary';
import ErrorWidget from '../../components/ErrorWidget';

const Body = styled.div`
  display: block;
  height: 100%;
  flex-direction: column;
`;

type ErrorProps = {
  error?: Error;
  resetErrorBoundary?: (...args: Array<unknown>) => void;
};

type ErrorBoundaryWrapperProps = ErrorProps & {
  name: string;
  children: React.ReactNode;
} & ActionHistoryProps;

const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = ({ name, children }) => (
  <ErrorBoundary
    FallbackComponent={props => <ErrorWidget {...props} />}
    logCategory={'homepage'}
    logMessage={`widget failed to load - ${name}`}
  >
    <Body className={'homepage-widget-body'}>{children}</Body>
  </ErrorBoundary>
);

export default withActionHistory(ErrorBoundaryWrapper);
