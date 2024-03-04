import React, { useState } from 'react';
import styled from 'styled-components';
import { withI18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { LoadingSkeleton } from 'fe-social-value-comp-loading-skeleton';
import { isInFirst30DayUXExperiment } from 'App';
import { OUTLINED, Button } from 'components/Button';
import Dialog from 'components/SRSModel';
import {
  TRACKING_EVENT_USER_CLICKS_MORE_DETAILS_SOCIAL_RELATIONSHIP_SCORE_INTENT_TEST,
  TRACKING_ORIGIN_HOMEPAGE,
} from 'constants/tracking';
import { useSRS } from 'hooks/useSRS';
import { RequestStatusType } from 'typings/Shared';
import { MemberSRS } from 'typings/SocialRelationshipScore';
import { formatResponse, ScoreData } from './formatSRSData';
import { SRSOwlyExcellent, SRSOwlyFair, SRSOwlyGood, SRSOwlyGreat } from './OwlyScoreImages';

const SRSWidgetWrapper = styled.div<{ showFirst30DaysExperiment: boolean }>`
  box-sizing: border-box;
  background: ${p => (p.showFirst30DaysExperiment ? '#fdfdfd' : 'transparent')};
  padding: 32px 24px;
  min-height: 400px;
  border: ${p => (p.showFirst30DaysExperiment ? 'none' : '1px solid rgb(235, 235, 235)')};
  border-radius: ${p => (p.showFirst30DaysExperiment ? '16px' : '8px')};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 32px;
  @media only screen and (min-width: 992px) {
    width: calc(50% - 16px);
  }
  @media only screen and (max-width: 992px) {
    width: 100%;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
`;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding-bottom: 12px;
`;

const Title = styled.h2`
  color: #1c1c1c;
  font-family: Source Sans Pro;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
`;

const BetaTag = styled.h2`
  height: 28px;
  padding: 0 8px;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  background: #eef1f2;
  font-family: Source Sans Pro;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
  color: #1c1c1c;
`;

const ScoreContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const ScoreDataContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ScoreAssetContainer = styled.div`
  display: flex;
  justify-content: center;
  align-self: center;
  width: calc(50% - 25px);
  flex-shrink: 0;
`;

const NextUpdateText = styled.h3`
  color: #5c5c5c;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
`;

const ScoreValue = styled.div`
  color: #1c1c1c;
  text-align: center;
  font-family: Montserrat Alternates;
  font-size: 96px;
  font-style: normal;
  font-weight: 700;
  line-height: normal;
`;

const TotalScore = styled.div`
  color: #5c5c5c;
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  &::before {
    content: '/';
  }
`;

const Score = styled.div`
  display: flex;
  align-items: baseline;
  padding-top: 32px;
`;

const ScoreWrapper = styled.div`
  flex: 1;
  margin-right: 20px;
`;

const ScoreDetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 32px;
  gap: 16px;
  height: fit-content;
  align-self: stretch;
  border-radius: 4px;
  border: 1px solid #ebebeb;
`;

const ScoreDetailsText = styled.p`
  color: #1c1c1c;
  font-family: Montserrat Alternates;
  font-size: 36px;
  font-style: normal;
  font-weight: 600;
  line-height: 48px;
  margin: 0;
`;

const FormattedScoreText = styled.span<{ textColor: string }>`
  color: ${p => p.textColor};
  font-family: Montserrat Alternates;
  font-size: 36px;
  font-style: normal;
  font-weight: 600;
  line-height: 48px;
  margin: 0;
`;

const ScoreDetailsInsights = styled.p`
  color: #1c1c1c;
  font-family: Source Sans Pro;
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 24px;
  margin: 0;
`;

const ScoreDetailsButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding-top: 8px;
`;

const Overlay = styled.div<{ show: boolean }>`
  display: ${({ show }) => (show ? 'block' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.25);
  z-index: 999;
`;

const Message = styled.h3`
  text-align: center;
  font-weight: 600;
  font-size: 18px;
  color: #5c5c5c;
  line-height: 28px;
`;

type $i18nProps = {
  title: () => string;
  beta: () => string;
  nextUpdate: () => string;
  yourScoreIs: () => string;
  scoreExcellent: () => string;
  scoreGreat: () => string;
  scoreGood: () => string;
  scoreFair: () => string;
  moreDetailsBtn: () => string;
  dialogTitle: () => string;
  emptyMessage: () => string;
  errorMessage: () => string;
  scoreIncreased: ({ variationBy }: { variationBy: number }) => string;
  scoreDecreased: ({ variationBy }: { variationBy: number }) => string;
  scoreNoChange: () => string;
};

type OwlyAssetByScoreProps = {
  score: number;
};

type StyledScoreTextProps = {
  $i18n: $i18nProps;
  score: number;
};

type EmptyOrErrorProps = {
  $i18n: $i18nProps;
  isError: boolean;
};

type SocialRelationshipScoreProps = {
  $i18n: $i18nProps;
};

// In the idea of having everything for the custom SRS widget in this file, we kept the loading, error and empty states here.
// Thing will change or be removed after the experiment of the SRS in-product intent test.
const SRSLoadingSkeleton = ({ $i18n }: SocialRelationshipScoreProps) => {
  const showFirst30DaysExperiment = isInFirst30DayUXExperiment;
  return (
    <SRSWidgetWrapper showFirst30DaysExperiment={showFirst30DaysExperiment} id="homepage-widget-srs">
      <ContentWrapper>
        <ScoreWrapper>
          <HeaderContainer>
            <Title>{$i18n.title()}</Title>
            <BetaTag>{$i18n.beta()}</BetaTag>
          </HeaderContainer>
          <ScoreContainer>
            <ScoreDataContainer>
              <LoadingSkeleton type="row" rowProps={{ rows: 1, widths: ['200px'], heights: ['24px'], margin: '0' }} />
              <Score>
                <LoadingSkeleton
                  type="row"
                  rowProps={{ rows: 1, widths: ['220px'], heights: ['120px'], margin: '0' }}
                />
              </Score>
            </ScoreDataContainer>
            <ScoreAssetContainer>
              <LoadingSkeleton
                type="row"
                rowProps={{ rows: 1, widths: ['90%'], heights: ['150px'], margin: '0 0 0 8px' }}
              />
            </ScoreAssetContainer>
          </ScoreContainer>
        </ScoreWrapper>
      </ContentWrapper>
      <ScoreDetailsContainer>
        <LoadingSkeleton type="row" rowProps={{ rows: 1, widths: ['80%'], heights: ['48px'], margin: '0 0 16px 0' }} />
        <LoadingSkeleton type="row" rowProps={{ rows: 1, widths: ['100%'], heights: ['24px'], margin: '0' }} />
        <ScoreDetailsButtonContainer>
          <LoadingSkeleton
            type="row"
            rowProps={{ rows: 1, widths: ['173px'], heights: ['48px'], margin: '8px 0 0 0' }}
          />
        </ScoreDetailsButtonContainer>
      </ScoreDetailsContainer>
    </SRSWidgetWrapper>
  );
};

const SRSEmptyOrError = ({ $i18n, isError }: EmptyOrErrorProps) => {
  const showFirst30DaysExperiment = isInFirst30DayUXExperiment;
  return (
    <SRSWidgetWrapper showFirst30DaysExperiment={showFirst30DaysExperiment} id="homepage-widget-srs">
      <ContentWrapper>
        <ScoreWrapper>
          <HeaderContainer>
            <Title>{$i18n.title()}</Title>
            <BetaTag>{$i18n.beta()}</BetaTag>
          </HeaderContainer>
          <ScoreContainer>
            {isError ? <Message>{$i18n.errorMessage()}</Message> : <Message>{$i18n.emptyMessage()}</Message>}
          </ScoreContainer>
        </ScoreWrapper>
      </ContentWrapper>
    </SRSWidgetWrapper>
  );
};

const OwlyAssetByScore = ({ score }: OwlyAssetByScoreProps) => {
  if (score <= 1000 && score >= 900) {
    return <SRSOwlyExcellent />;
  } else if (score <= 899 && score >= 700) {
    return <SRSOwlyGreat />;
  } else if (score <= 699 && score >= 500) {
    return <SRSOwlyGood />;
  } else {
    return <SRSOwlyFair />;
  }
};

const StyledScoreText = ({ $i18n, score }: StyledScoreTextProps) => {
  if (score <= 1000 && score >= 900) {
    return <FormattedScoreText textColor={'#01841E'}>{$i18n.scoreExcellent()}</FormattedScoreText>;
  } else if (score <= 899 && score >= 700) {
    return <FormattedScoreText textColor={'#2269DD'}>{$i18n.scoreGreat()}</FormattedScoreText>;
  } else if (score <= 699 && score >= 500) {
    return <FormattedScoreText textColor={'#FFB333'}>{$i18n.scoreGood()}</FormattedScoreText>;
  } else {
    return <FormattedScoreText textColor={'#FF6937'}>{$i18n.scoreFair()}</FormattedScoreText>;
  }
};

const SocialRelationshipScore = ({ $i18n }: SocialRelationshipScoreProps) => {
  const showFirst30DaysExperiment = isInFirst30DayUXExperiment;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { srsStatus, srsResponse } = useSRS();

  if (srsStatus === RequestStatusType.LOADING) {
    return <SRSLoadingSkeleton $i18n={$i18n} />;
  }

  if (srsStatus === RequestStatusType.EMPTY) {
    return <SRSEmptyOrError $i18n={$i18n} isError={false} />;
  }

  if (srsStatus === RequestStatusType.ERROR) {
    return <SRSEmptyOrError $i18n={$i18n} isError={true} />;
  }

  let currentSRS: MemberSRS;
  let previousSRS: MemberSRS;

  if (srsResponse?.srs) {
    [currentSRS, previousSRS] = srsResponse.srs;
  }
  const formattedData: ScoreData = formatResponse(currentSRS, previousSRS);
  function formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  const currentSRSDate = currentSRS ? new Date(currentSRS.calculationDate) : new Date();

  const nextUpdateTime = new Date(currentSRSDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextUpdateDate = formatDate(nextUpdateTime);

  let variationText = '';
  const variationBy = Math.abs((currentSRS?.score ?? 0) - (previousSRS?.score ?? 0));
  if (currentSRS?.score && previousSRS?.score) {
    if (currentSRS.score > previousSRS.score) {
      variationText = $i18n.scoreIncreased({ variationBy: variationBy });
    } else if (currentSRS.score < previousSRS.score) {
      variationText = $i18n.scoreDecreased({ variationBy: variationBy });
    } else {
      variationText = $i18n.scoreNoChange();
    }
  } else {
    variationText = $i18n.scoreNoChange();
  }
  const scoreInsights = `${variationText}`;

  const onMoreDetailsClicked = () => {
    track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_MORE_DETAILS_SOCIAL_RELATIONSHIP_SCORE_INTENT_TEST);
  };

  const openDialog = () => {
    onMoreDetailsClicked();
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <SRSWidgetWrapper showFirst30DaysExperiment={showFirst30DaysExperiment} id="homepage-widget-srs">
      <ContentWrapper>
        <ScoreWrapper>
          <HeaderContainer>
            <Title>{$i18n.title()}</Title>
            <BetaTag>{$i18n.beta()}</BetaTag>
          </HeaderContainer>
          <ScoreContainer>
            <ScoreDataContainer>
              <NextUpdateText>
                {$i18n.nextUpdate()}
                {nextUpdateDate}
              </NextUpdateText>
              <Score>
                <ScoreValue>{currentSRS?.score ?? 0}</ScoreValue>
                <TotalScore>1000</TotalScore>
              </Score>
            </ScoreDataContainer>
            <ScoreAssetContainer>
              <OwlyAssetByScore score={currentSRS?.score ?? 0} />
            </ScoreAssetContainer>
          </ScoreContainer>
        </ScoreWrapper>
      </ContentWrapper>
      <ScoreDetailsContainer>
        <ScoreDetailsText>
          {$i18n.yourScoreIs()}
          <StyledScoreText $i18n={$i18n} score={currentSRS?.score ?? 0} />
        </ScoreDetailsText>
        <ScoreDetailsInsights>{scoreInsights}</ScoreDetailsInsights>
        <ScoreDetailsButtonContainer>
          <Button type={OUTLINED} onClick={openDialog}>
            {$i18n.moreDetailsBtn()}
          </Button>
          <Overlay show={isDialogOpen}>
            <Dialog title={$i18n.dialogTitle()} onClose={closeDialog} scoreData={formattedData} />
          </Overlay>
        </ScoreDetailsButtonContainer>
      </ScoreDetailsContainer>
    </SRSWidgetWrapper>
  );
};

export default withI18n({
  title: 'Your Social Relationship Score',
  beta: 'Beta',
  nextUpdate: 'Next update: ',
  yourScoreIs: 'Your score is ',
  scoreExcellent: 'excellent',
  scoreGreat: 'great',
  scoreGood: 'good',
  scoreFair: 'fair',
  moreDetailsBtn: 'See more insights',
  dialogTitle: 'Your Social Relationship Score',
  emptyMessage: 'Your Social Relationship Score is being calculated. Please come back soon.',
  errorMessage: 'Sorry, we couldn’t load this information.\n Reload this page or try again later.',
  scoreIncreased: 'Your score increased by {variationBy} points in the last week. Way to go!',
  scoreDecreased: 'our score decreased by {variationBy} points in the last week. Don’t worry, you’ve got this!',
  scoreNoChange: 'Your score is the same as last week. Keep going!',
})(SocialRelationshipScore);
