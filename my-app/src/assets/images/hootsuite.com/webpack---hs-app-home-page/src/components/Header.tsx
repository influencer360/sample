import React, { useEffect } from 'react';
import styled from 'styled-components';
import { withI18n } from 'fe-lib-i18n';
import { getActionHistoryValue, setActionHistoryValue } from 'fe-pg-lib-action-history';
import { isInFirst30DayUXExperiment } from 'App';
import { HOMEPAGE_NEW_USER } from 'constants/actionHistoryKeys';
import breakpoints from 'utils/breakpoints';

const Title = styled.h1<{ showFirst30DaysExperiment: boolean }>`
  color: #1c1c1c;
  font-size: ${p => (p.showFirst30DaysExperiment ? '30px' : '44px')};
  font-weight: 600;
  line-height: ${p => (p.showFirst30DaysExperiment ? '34px' : '60px')};
  margin-bottom: ${p => (p.showFirst30DaysExperiment ? '0' : '4px')};
  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    margin-bottom: 24px;
  }
`;

const MemberName = styled.span`
  margin-top: 26px;
`;

const Wrapper = styled.div`
  width: 100%;
`;

const Content = styled.div<{ showFirst30DaysExperiment: boolean }>`
  font-family: ${p =>
    p.showFirst30DaysExperiment ? 'Source Sans Pro' : 'Montserrat Alternates, Source Sans Pro, sans-serif'};
  display: flex;
  margin: 0 auto;
  box-sizing: border-box;
  width: 100%;
  padding: 55px 0 0 36px;
  max-width: 1504px;

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    padding-left: 16px;
  }
`;

const Home = styled.div`
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
`;

type HeaderProps = {
  $i18n: {
    welcomeBack: () => string;
    welcome: () => string;
    home: () => string;
  };
};

const Header: React.FunctionComponent<HeaderProps> = ({ $i18n }) => {
  const showFirst30DaysExperiment = isInFirst30DayUXExperiment;
  useEffect(() => {
    if (getActionHistoryValue(HOMEPAGE_NEW_USER) === undefined) {
      setActionHistoryValue(HOMEPAGE_NEW_USER, false);
    }
  }, []);

  return (
    <Content showFirst30DaysExperiment={showFirst30DaysExperiment}>
      <Wrapper>
        {showFirst30DaysExperiment && <Home>Home</Home>}
        <Title showFirst30DaysExperiment={showFirst30DaysExperiment}>
          {getActionHistoryValue(HOMEPAGE_NEW_USER) === undefined ? $i18n.welcome() : $i18n.welcomeBack()}
          <MemberName>{window.hs.memberName.split(' ')[0]}</MemberName>
        </Title>
      </Wrapper>
    </Content>
  );
};

export default withI18n({
  home: 'Home',
  welcomeBack: 'Welcome back, ',
  welcome: 'Welcome, ',
})(Header);
