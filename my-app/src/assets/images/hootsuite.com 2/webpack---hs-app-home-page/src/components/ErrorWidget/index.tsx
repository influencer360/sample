import React from 'react';
import styled from 'styled-components';
import { withI18n } from 'fe-lib-i18n';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: center;
`;

const Text = styled.p`
  text-align: center;
  font-weight: 600;
  font-size: 18px;
  color: #5c5c5c;
  line-height: 28px;
`;

const ErrorIcon = styled.div`
  font-size: 56px;
  font-style: normal;
  font-weight: 600;
  line-height: 76px;
  transform: rotate(90deg);
  color: #5c5c5c;
  height: auto;
  width: auto;
`;

const ErrorBody = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: pre-line;
`;

type WidgetErrorProps = {
  $i18n: {
    errorMessage: () => string;
  };
};

const ErrorWidget = ({ $i18n }: WidgetErrorProps) => {
  return (
    <ErrorContainer>
      <ErrorIcon>{':('}</ErrorIcon>
      <ErrorBody>
        <Text>{$i18n.errorMessage()}</Text>
      </ErrorBody>
    </ErrorContainer>
  );
};

export default withI18n({
  errorMessage: 'Sorry, we couldn’t load this information.\n Reload this page or try again later.',
})(ErrorWidget);
