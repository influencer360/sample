import React, { useEffect } from 'react';
import styled from 'styled-components';
import { emit } from 'fe-lib-hootbus';
import { withI18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { isInFirst30DayUXExperiment } from 'App';
import account_circle_icon from 'assets/account_circle_icon.png';
import auto_graph_icon from 'assets/auto_graph_icon.png';
import drafts_icon from 'assets/drafts_icon.png';
import social_value_icon from 'assets/social_value_icon.png';
import { OPEN_ADD_NETWORK_MODAL, OPEN_COMPOSER } from 'constants/hootbus-actions';
import {
  TRACKING_EVENT_USER_CLICK_ADD_SOCIAL_BUTTON,
  TRACKING_EVENT_USER_CLICKS_CREATE_A_DRAFT,
  TRACKING_EVENT_SCHEDULE_POST,
  TRACKING_ORIGIN_HOMEPAGE,
  TRACKING_EVENT_EMPTY_STATE_SEEN,
  TRACKING_EVENT_USER_CLICK_DRAFT_CTA_OWLY_WRITER,
  TRACKING_EVENT_EMPTY_STATE_CTA_CLICK,
  TRACKING_EVENT_CREATE_A_GOAL,
} from 'constants/tracking';
import { WidgetName } from 'typings/Widget';
import breakpoints from 'utils/breakpoints';
import { Button, OUTLINED } from '../Button';

const Container = styled.div<{ showFirst30DaysExperiment: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 0 auto;
  padding: ${p => (p.showFirst30DaysExperiment ? '0 50px 0 50px' : '32px 50px 0 50px')};
  height: ${p => (p.showFirst30DaysExperiment ? '100%' : '172px')};

  @media only screen and (max-width: ${breakpoints.breakpointXl}) {
    padding-left: 10px;
    padding-right: 10px;
  }
`;

const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TextContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Text = styled.p`
  text-align: center;
  font-weight: 600;
  font-size: 18px;
  color: #5c5c5c;
  line-height: 28px;
  white-space: pre-line;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
`;

const StyledButton = styled(Button)`
  margin: 0 8px;
  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    margin-bottom: 6px;
  }
`;

type I18n = {
  emptyAccounts: () => string;
  emptyTopPosts: () => string;
  emptyDrafts: () => string;
  draftCta1: () => string;
  draftCta2: () => string;
  accountsCta: () => string;
  topPostsCta: () => string;
  emptySocialValue: () => string;
  socialValueCta: () => string;
  emptySocialValueTrends: () => string;
};

type WidgetContent = {
  imgSrc: string;
  emptyMsg: (i18n: I18n) => string;
  buttonMsg: Array<(i18n: I18n) => string>;
  buttonOnClick: (() => void)[];
};

type EmptyWidgetProps = {
  name: WidgetName;
  $i18n: {
    emptyAccounts: () => string;
    emptyTopPosts: () => string;
    emptyDrafts: () => string;
    draftCta1: () => string;
    draftCta2: () => string;
    accountsCta: () => string;
    topPostsCta: () => string;
    emptySocialValue: () => string;
    socialValueCta: () => string;
    emptySocialValueTrends: () => string;
  };
};

const defaultWidgetContent: WidgetContent = {
  imgSrc: '', // default image src here
  emptyMsg: (i18n: I18n) => '',
  buttonMsg: [], // no button by default
  buttonOnClick: [], // no button actions by default
};

const widgetContentMap: Record<WidgetName, WidgetContent> = {
  [WidgetName.CONNECTED_ACCOUNTS]: {
    imgSrc: account_circle_icon,
    emptyMsg: (i18n: I18n) => i18n.emptyAccounts(),
    buttonMsg: [(i18n: I18n) => i18n.accountsCta()],
    buttonOnClick: [
      () => {
        emit(OPEN_ADD_NETWORK_MODAL);
        track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_EMPTY_STATE_CTA_CLICK, {
          widgetName: WidgetName.CONNECTED_ACCOUNTS,
          cta: TRACKING_EVENT_USER_CLICK_ADD_SOCIAL_BUTTON,
        });
      },
    ],
  },
  [WidgetName.DRAFTS]: {
    imgSrc: drafts_icon,
    emptyMsg: (i18n: I18n) => i18n.emptyDrafts(),
    buttonMsg: [(i18n: I18n) => i18n.draftCta1(), (i18n: I18n) => i18n.draftCta2()],
    buttonOnClick: [
      () => {
        emit(OPEN_COMPOSER);
        track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_EMPTY_STATE_CTA_CLICK, {
          widgetName: WidgetName.DRAFTS,
          cta: TRACKING_EVENT_USER_CLICKS_CREATE_A_DRAFT,
        });
      },
      () => {
        track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_EMPTY_STATE_CTA_CLICK, {
          widgetName: WidgetName.DRAFTS,
          cta: TRACKING_EVENT_USER_CLICK_DRAFT_CTA_OWLY_WRITER,
        });
        window.location.hash = '#/contentstudio';
      },
    ],
  },
  [WidgetName.TOP_PERFORMING_POSTS]: {
    imgSrc: auto_graph_icon,
    emptyMsg: (i18n: I18n) => i18n.emptyTopPosts(),
    buttonMsg: [(i18n: I18n) => i18n.topPostsCta()],
    buttonOnClick: [
      () => {
        emit(OPEN_COMPOSER);
        track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_EMPTY_STATE_CTA_CLICK, {
          widgetName: WidgetName.TOP_PERFORMING_POSTS,
          cta: TRACKING_EVENT_SCHEDULE_POST,
        });
      },
    ],
  },

  [WidgetName.SOCIAL_VALUE]: {
    imgSrc: social_value_icon,
    emptyMsg: (i18n: I18n) => i18n.emptySocialValue(),
    buttonMsg: [(i18n: I18n) => i18n.socialValueCta()],
    buttonOnClick: [
      () => {
        track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_EMPTY_STATE_CTA_CLICK, {
          widgetName: WidgetName.SOCIAL_VALUE,
          cta: TRACKING_EVENT_CREATE_A_GOAL,
        });
        window.location.hash = '#/goals';
      },
    ],
  },

  [WidgetName.SOCIAL_VALUE_TRENDS]: {
    imgSrc: social_value_icon,
    emptyMsg: (i18n: I18n) => i18n.emptySocialValueTrends(),
    buttonMsg: [],
    buttonOnClick: [],
  },

  // Must use enums to satisfy TS
  [WidgetName.GOAL_TRACKER]: defaultWidgetContent,
  [WidgetName.NOTIFICATIONS]: defaultWidgetContent,
  [WidgetName.HIGHLIGHTS]: defaultWidgetContent,
  [WidgetName.ANNOUNCEMENTS]: defaultWidgetContent,
  [WidgetName.VIDEO_ANNOUNCEMENTS]: defaultWidgetContent,
  [WidgetName.GETTING_STARTED_GUIDE]: defaultWidgetContent,
};

const EmptyWidget = ({ name, $i18n }: EmptyWidgetProps) => {
  const showFirst30DaysExperiment = isInFirst30DayUXExperiment;
  useEffect(() => {
    track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_EMPTY_STATE_SEEN, { widgetName: name });
  }, [name]);

  const widgetContent = widgetContentMap[name];
  const { imgSrc, emptyMsg, buttonMsg, buttonOnClick } = widgetContent;

  return (
    <Container showFirst30DaysExperiment={showFirst30DaysExperiment}>
      <ImageContainer>
        <img alt={`${name}+-icon`} src={imgSrc} />
      </ImageContainer>
      <TextContainer>
        <Text>{emptyMsg($i18n)}</Text>
      </TextContainer>
      <ButtonContainer>
        {buttonMsg.map((getMessage: (i18n: I18n) => string, index: number) => (
          <StyledButton key={index} type={OUTLINED} onClick={buttonOnClick[index]}>
            {getMessage($i18n)}
          </StyledButton>
        ))}
      </ButtonContainer>
    </Container>
  );
};

export default withI18n({
  emptyAccounts:
    "You haven't added any social accounts.\n Connect your accounts to Hootsuite to save time managing your social media.",
  emptyTopPosts: "You haven't published any posts lately.\n Publish a few posts to see these insights.",
  emptyDrafts: "You haven't created any drafts.\n Start drafting content to edit and publish whenever you'd like.",
  draftCta1: 'Create a draft',
  draftCta2: 'Draft post with AI',
  accountsCta: 'Add a social account',
  topPostsCta: 'Create a post with AI',
  emptySocialValue: `You don't have any goals yet`,
  socialValueCta: 'Create a goal',
  emptySocialValueTrends: "There's no trending content at the moment.",
})(EmptyWidget);
