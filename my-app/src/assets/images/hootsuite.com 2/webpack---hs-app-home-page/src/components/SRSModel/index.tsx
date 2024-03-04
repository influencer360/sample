import React, { useEffect } from 'react';
import styled from 'styled-components';
import { withI18n } from 'fe-lib-i18n';
import close from 'assets/close.png';
import { ScoreData } from '../../widgets/SocialRelationshipScore/formatSRSData';
import Score from '../Score';
import ScoreScale from '../ScoreScale';
import SubScoreFactors from '../SubScoreFactors';

type I18nObject = {
  contentText: () => string;
  closeBtn: () => string;
  factorsTitle: () => string;
  insightsTitle: () => string;
  insightsSubTitle: () => string;
  scoreScaleText: () => string;
  lastUpdatedText: () => string;
  nextUpdateText: () => string;
};

type DialogProps = {
  $i18n: I18nObject;
  title: string;
  onClose: () => void;
  scoreData: ScoreData;
};

const DialogWrapper = styled.div<{ show: boolean }>`
  display: ${({ show }) => (show ? 'block' : 'none')};
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  z-index: 1000;
  width: 90%;
  max-width: 729px;
`;

const Dialogheader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px 0 40px;
`;

const DialogTitle = styled.div`
  margin: 0;
  color: #1c1c1c;
  font-size: 22px;
  font-weight: 600;
`;

const CloseIcon = styled.img`
  cursor: pointer;
`;

const DialogContent = styled.div`
  padding-bottom: 30px;
  height: 768;
  padding: 0px 40px 0px 40px;
`;

const DialogFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  height: 80px;
  padding: 16px;
  box-sizing: border-box;
`;

const CloseButton = styled.button`
  background: #012b3a;
  color: #fdfdfd;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  padding: 8px 24px;
`;

const CloseIconWrapper = styled.button`
  background: none;
  border: none;
  cursor: pointer;
`;

const FactorsTitle = styled.div`
  color: black;
  font-size: 14px;
  font-family: Source Sans Pro;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 16px;
`;

const ScoreScaleWrapper = styled.div`
  margin: 0 0 24px 0;
  width: calc(50% - 8px); //From 16px gap between elements
  min-width: fit-content;
  flex-shrink: 0;
`;

const InsightsTitle = styled.div`
  color: black;
  font-size: 14px;
  font-family: Source Sans Pro;
  font-weight: 600;
  text-transform: uppercase;
  line-height: 20px;
  margin-bottom: 8px;
`;

const ScoreWapper = styled.div`
  display: flex;
  gap: 16px;
`;

const DialogScrolledPart = styled.div`
  max-height: calc(100vh - 210px);
  overflow-y: auto;
`;

const InsightsWrapperContent = styled.div`
  color: black;
  font-size: 16px;
  font-family: Source Sans Pro;
  font-weight: 400;
  &:first-child {
    margin-bottom: 8px;
  }
`;

const ScoreScaleText = styled.div`
  color: black;
  font-size: 14px;
  font-family: Source Sans Pro;
  font-weight: 600;
  text-transform: uppercase;
`;

const InsightsSubTitle = styled.div`
  color: black;
  font-size: 16px;
  font-family: Source Sans Pro;
  font-weight: 400;
  line-height: 24px;
  word-wrap: break-word;
  margin-bottom: 4px;
`;

const ScoreUpdate = styled.div<{ space?: boolean }>`
  color: #5c5c5c;
  font-size: 16px;
  font-family: Source Sans Pro;
  font-weight: 400;
  line-height: 24px;
  word-wrap: break-word;
  margin: ${({ space }) => (space ? '16px 0 4px 0' : '0')};
  span {
    &::before {
      content: ': ';
    }
  }
`;

const Dialog = ({ title, onClose, $i18n, scoreData }: DialogProps) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <DialogWrapper show>
      <DialogScrolledPart>
        <Dialogheader>
          <DialogTitle>{title}</DialogTitle>
          <CloseIconWrapper onClick={onClose}>
            <CloseIcon src={close} alt="close icon" aria-label={$i18n.closeBtn()} />
          </CloseIconWrapper>
        </Dialogheader>
        <DialogContent>
          <Score score={scoreData.score} />
          <ScoreWapper>
            <ScoreScaleWrapper>
              <ScoreScaleText>{$i18n.scoreScaleText()}</ScoreScaleText>
              <ScoreScale score={scoreData.score} />
            </ScoreScaleWrapper>
            <div>
              <InsightsTitle>{$i18n.insightsTitle()}</InsightsTitle>
              <InsightsWrapperContent>
                <InsightsSubTitle>{scoreData.nextUpdatedInsights}</InsightsSubTitle>
                <InsightsSubTitle>{scoreData.contributionText}</InsightsSubTitle>
                <ScoreUpdate space>
                  {$i18n.lastUpdatedText()}
                  <span>{scoreData.lastUpdatedScore}</span>
                </ScoreUpdate>
                <ScoreUpdate>
                  {$i18n.nextUpdateText()}
                  <span>{scoreData.nextUpdateScore}</span>
                </ScoreUpdate>
              </InsightsWrapperContent>
            </div>
          </ScoreWapper>
          <FactorsTitle>{$i18n.factorsTitle()}</FactorsTitle>
          <SubScoreFactors metrics={scoreData.factorsData} />
        </DialogContent>
      </DialogScrolledPart>
      <DialogFooter>
        <CloseButton onClick={onClose} aria-label={$i18n.closeBtn()}>
          {$i18n.closeBtn()}
        </CloseButton>
      </DialogFooter>
    </DialogWrapper>
  );
};

export default withI18n({
  contentText: 'Content',
  closeBtn: 'Close',
  factorsTitle: 'Top contributing factors',
  insightsTitle: 'Insights',
  insightsSubTitle: 'Your score increased by 10 points. That’s a big increase!',
  scoreScaleText: 'Where you stand',
  lastUpdatedText: 'Last updated',
  nextUpdateText: 'Next update',
})(Dialog);
