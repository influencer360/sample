import React from 'react';
import { differenceInCalendarDays } from 'date-fns';
import styled from 'styled-components';
import GlyphEmblemCalendar from '@fp-icons/emblem-calendar';
import Icon from '@fp-icons/icon-base';
import { Button } from 'components/Button';
import breakpoints from 'utils/breakpoints';

const StickyHeaderContainer = styled.header`
  position: sticky;
  top: 0;
  width: 100%;
  height: 66px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: #fdfdfd;
  box-shadow:
    0px 1px 1px 0px rgba(28, 28, 28, 0.16),
    0px 0px 1px 0px rgba(28, 28, 28, 0.28);
  gap: 6px;
  padding-right: 36px;
  box-sizing: border-box;
  z-index: 10;
  font-size: 20px;

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    padding-right: 16px;
  }

  @media only screen and (max-width: ${breakpoints.breakpointSm}) {
    font-size: 16px;
  }
`;

const TrialTimeContainer = styled.span`
  margin-right: 20px;
`;

const TrialTimeLabel = styled.span`
  font-weight: 600;
`;

const onClickStartSubscription = () => {
  //TODO Add start subscription CTA
};

const StickyHeader = () => {
  const DaysRemaining = differenceInCalendarDays(new Date(window.hs.memberTrialEndDate), new Date());
  const DayUnitString = DaysRemaining === 1 ? 'day' : 'days';

  return (
    <StickyHeaderContainer>
      <Icon size={20} glyph={GlyphEmblemCalendar} />
      <TrialTimeContainer>
        Trial ends in{' '}
        <TrialTimeLabel>
          {DaysRemaining} {DayUnitString}
        </TrialTimeLabel>
      </TrialTimeContainer>
      {/* <Button>Start subscription</Button> */}
    </StickyHeaderContainer>
  );
};

export default StickyHeader;
