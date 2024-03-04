import React from 'react';
import styled from 'styled-components';
import Icon from '@fp-icons/icon-base';
import SparklesIconOutline from '@fp-icons/symbol-sparkles-outline';
import XLight from '@fp-icons/symbol-x-light';
import { Button, ICON, SIZE_32 } from 'fe-comp-button';
import { withI18n } from 'fe-lib-i18n';
import { setActionHistoryValue } from 'fe-pg-lib-action-history';
import { TrendsColors } from 'fe-social-value-lib-core';
import { SOCIAL_VALUE_GOALS_BANNER_IS_DISMISSED } from 'constants/actionHistoryKeys';

const BannerContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 16px 16px;
  margin-bottom: 16px;
  justify-content: space-between;
  background: ${TrendsColors.owlyWriterBanner};
`;

const IconContainer = styled.div`
  display: flex;
  padding-right: 1rem;
`;

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-style: normal;
`;

const Title = styled.p`
  font-weight: 600;
  font-size: 1rem;
  line-height: 24px;
  color: ${TrendsColors.owlyWriterText};
`;
const Subtitle = styled(Title)`
  font-weight: 400;
`;

const CloseButton = styled(Button)`
  background-color: transparent;
  border-radius: none;
  align-items: flex-start;
  height: auto;
  width: auto;

  &:hover:not([disabled]):not(:active) {
    background-color: transparent;
  }

  &:focus {
    background-color: transparent;
  }

  &:active {
    background-color: transparent;
  }
`;

type BannerProps = {
  $i18n: {
    title: () => string;
    subtitle: () => string;
  };
};

const LocalizedBanner = ({ $i18n }: BannerProps) => {
  return (
    <BannerContainer>
      <IconContainer>
        <Icon glyph={SparklesIconOutline} fill={'TrendsColors.owlyWriterText'} size={25} />
      </IconContainer>
      <TextContainer>
        <Title>{$i18n.title()}</Title>
        <Subtitle>{$i18n.subtitle()}</Subtitle>
      </TextContainer>
      <CloseButton
        onClick={() => setActionHistoryValue(SOCIAL_VALUE_GOALS_BANNER_IS_DISMISSED, true)}
        type={ICON}
        height={SIZE_32}
        aria-label="Close"
      >
        <Icon glyph={XLight} size={14} fill={'#1C1C1C'} />
      </CloseButton>
    </BannerContainer>
  );
};

export const Banner = withI18n({
  title: 'New! Set and track your social goals in Hootsuite',
  subtitle: `Use this demo data to explore goals. When you're ready, create a goal and we’ll help you achieve it!`,
})(LocalizedBanner);
