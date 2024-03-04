import React from 'react';
import styled from 'styled-components';
import { Button } from 'fe-comp-button';
import { withI18n } from 'fe-lib-i18n';
import SRSBannerImage from './SRSBannerImage';

const IntentTestWrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding: 40px;
  gap: 50px;
  border-radius: 20px;
  background: #eaffe9;
`;

const ScoreView = styled.div`
  display: flex;
  width: calc(50% - 25px);
  flex-shrink: 0;
`;

const IntentTestContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h2`
  color: #000;
  font-family: Montserrat Alternates;
  font-size: 36px;
  font-style: normal;
  font-weight: 600;
  line-height: 48px;
`;

const Text = styled.p`
  color: #012b3a;
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 34px;
  padding: 10px 0;
`;

const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 24px;
`;

const OptInButton = styled(Button)`
  && {
    border-radius: 8px;
    background-color: #012b3a;
    color: #fdfdfd;

    &&:hover {
      background-color: #55717b;
    }
  }
`;

const OptOutButton = styled(Button)`
  && {
    border-radius: 8px;
    border: 1px solid #1c1c1c;
    background-color: rgba(253, 253, 253, 0);

    &&:hover {
      background-color: #f7f8f9;
    }
  }
`;

type SRSBannerProps = {
  $i18n: {
    title: () => string;
    text1: () => string;
    text2: () => string;
    cta: () => string;
    dismiss: () => string;
  };
  handleOpt: (optValue: boolean) => void;
};

const SRSBanner = ({ $i18n, handleOpt }: SRSBannerProps) => {
  function onCTAClick(optValue: boolean) {
    handleOpt(optValue);
  }

  return (
    <IntentTestWrapper id="homepage-banner-srs" role="region" aria-label="Social Relationship Score banner">
      <ScoreView>
        <SRSBannerImage />
      </ScoreView>
      <IntentTestContent>
        <Title>{$i18n.title()}</Title>
        <Text>{$i18n.text1()}</Text>
        <Text>{$i18n.text2()}</Text>
        <ButtonsWrapper>
          <OptInButton onClick={() => onCTAClick(true)}>{$i18n.cta()}</OptInButton>
          <OptOutButton onClick={() => onCTAClick(false)}>{$i18n.dismiss()}</OptOutButton>
        </ButtonsWrapper>
      </IntentTestContent>
    </IntentTestWrapper>
  );
};

export default withI18n({
  title: 'Join our early beta',
  text1:
    'We’re working on a Social Relationship Score, a pro feature that shows a weekly snapshot of your social media performance.',
  text2:
    "As an exclusive beta member, take the chance to try it out before anyone else. In exchange, we hope you'll enjoy being part of a brand-new solution for social media pros.",
  cta: 'Join our beta',
  dismiss: 'Dismiss',
})(SRSBanner);
