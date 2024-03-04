import React from 'react';
import styled from 'styled-components';
import { Button } from 'fe-comp-button';
import { withI18n, TranslationFunc } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { setActionHistoryValue } from 'fe-pg-lib-action-history';
import OwlyImage from '../assets/OwlySymbolLoveSaffron.gif';
import ActionHistoryKeys from '../constants/action-history-keys';
import {
  TRACKING_EVENT_GETTING_STARTED_GUIDE_DISMISS_COMPLETED_STATE,
  TRACKING_ORIGIN_GETTING_STARTED,
} from '../constants/tracking';

const CompletedStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding-top: 10px;
`;

const OwlyGif = styled.img`
  width: 188px;
`;

const StyledButton = styled(Button)`
  margin-bottom: 10px;
`;

async function onClickNotDone() {
  track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_GUIDE_DISMISS_COMPLETED_STATE);
  await setActionHistoryValue(ActionHistoryKeys.GETTING_STARTED_GUIDE_IS_COMPLETED_STATE_DISMISSED, true);
}

type CompletedStateProps = {
  $i18n: {
    finishAndClose: TranslationFunc;
    imNotDone: TranslationFunc;
  };
  onClickClose: () => void;
};

const CompletedState = ({ $i18n, onClickClose }: CompletedStateProps) => {
  return (
    <CompletedStateContainer>
      <OwlyGif src={OwlyImage} alt="" />
      <StyledButton
        type="secondary"
        onClick={() => {
          onClickNotDone();
        }}
      >
        {$i18n.imNotDone()}
      </StyledButton>
      <StyledButton
        type="cta"
        onClick={() => {
          onClickClose();
        }}
      >
        {$i18n.finishAndClose()}
      </StyledButton>
    </CompletedStateContainer>
  );
};

export default withI18n({
  finishAndClose: 'Finish & close',
  imNotDone: 'I’m not done yet',
})(CompletedState);
