import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Icon from '@fp-icons/icon-base';
import XLight from '@fp-icons/symbol-x-light';
import { hasAccessToFeature, ORGANIZATION_ONBOARDING_WIZARD } from 'fe-lib-entitlements';
import { emit } from 'fe-lib-hootbus';
import { withI18n, TranslationFunc } from 'fe-lib-i18n';
import { withHsTheme, getThemeValue } from 'fe-lib-theme';
import { track } from 'fe-lib-tracking';
import { AccordionTaskList } from 'fe-pg-comp-accordion-task-list';
import type { AccordionTaskListProps } from 'fe-pg-comp-accordion-task-list';
import { SteppedProgressBar } from 'fe-pg-comp-stepped-progress-bar';
import { useActionHistory, setActionHistoryValue } from 'fe-pg-lib-action-history';
import ActionHistoryKeys from '../constants/action-history-keys';
import { ORGTASKS, TASKS } from '../constants/gettingStartedGuide';
import {
  TRACKING_ORIGIN_GETTING_STARTED,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_CLOSED,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_SHOWN,
} from '../constants/tracking';
import CompletedState from './CompletedState';

//TODO: export types from fe-pg-lib-action-history
export type MemberActionHistory = {
  [key: string]: MemberActionHistoryValue | undefined;
};

export type MemberActionHistoryValue = string | number | boolean;

const Container = withHsTheme(styled.div`
  position: absolute;
  bottom: 0;
  left: 90px;
  width: 329px;
  height: 333px;
  padding: 16px;
  background: ${() => getThemeValue(t => t.colors.lightGrey10)};
  font-size: 16px;
  box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.25);
  z-index: 2;
`);

const StepLabel = withHsTheme(styled.p`
  font-size: ${() => getThemeValue(t => t.typography.timestamp.size)};
  line-height: ${() => getThemeValue(t => t.typography.timestamp.lineHeight)};
  font-weight: ${() => getThemeValue(t => t.typography.fontWeight.bold)};
  color: ${() => getThemeValue(t => t.colors.darkGrey80)};
  height: 18px;
  margin-top: 16px;
  text-transform: uppercase;
`);

const CloseButton = withHsTheme(styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  height: 16px;
  width: 16px;
  color: ${() => getThemeValue(t => t.colors.primary)};

  :hover {
    color: ${() => getThemeValue(t => t.colors.button.activeBackground)};
  }
`);

async function OnClickDismissGuide() {
  track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_GUIDE_CLOSED);
  emit('dashboard:gettingStarted:showPopover');
  await setActionHistoryValue(ActionHistoryKeys.GETTING_STARTED_GUIDE_IS_OPEN, false);
}

function getTaskCompletionList(ah: MemberActionHistory, canManageOrg: boolean) {
  if (canManageOrg) {
    return [
      true,
      !!ah[ActionHistoryKeys.GETTING_STARTED_GUIDE_ADD_SOCIAL_ACCOUNTS],
      !!ah[ActionHistoryKeys.GETTING_STARTED_GUIDE_INVITE_PEOPLE],
      !!ah[ActionHistoryKeys.GETTING_STARTED_GUIDE_CREATE_TEAM],
    ];
  } else {
    return [
      true,
      !!ah[ActionHistoryKeys.GETTING_STARTED_GUIDE_ADD_SOCIAL_ACCOUNTS],
      !!ah[ActionHistoryKeys.GETTING_STARTED_GUIDE_SCHEDULE_POST],
    ];
  }
}

const checkConnectedSocialNetworkLength = (): boolean => {
  if (window.hs.socialNetworks) {
    return Object.keys(window.hs.socialNetworks).length >= 2;
  }
  return false;
};

const getTasksData = (ah: MemberActionHistory, canManageOrg: boolean): AccordionTaskListProps => {
  const taskCompletionList = getTaskCompletionList(ah, canManageOrg);
  const tasks = canManageOrg ? ORGTASKS : TASKS;
  const tasksStatus = tasks.tasks.map((t, index) => {
    return { ...t, isComplete: taskCompletionList[index] };
  });

  return {
    tasks: tasksStatus,
    isVariant: true,
  };
};

type GettingStartedGuideProps = {
  $i18n: {
    completed: TranslationFunc;
    completedHeader: TranslationFunc;
    header: TranslationFunc;
  };
};

const GettingStartedGuide = ({ $i18n }: GettingStartedGuideProps): JSX.Element | null => {
  const [step, setStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isOrganizationOnboarding, setIsOrganizationOnboarding] = useState(false);
  const actionHistory = useActionHistory();
  const guideIsOpen: boolean | undefined = actionHistory[ActionHistoryKeys.GETTING_STARTED_GUIDE_IS_OPEN];

  const isCompletedStateDismissed: boolean | undefined =
    actionHistory[ActionHistoryKeys.GETTING_STARTED_GUIDE_IS_COMPLETED_STATE_DISMISSED];

  useEffect(() => {
    (async () => {
      const hasOrganizationOnboardingEntitlement = await hasAccessToFeature(
        window.hs.memberId,
        ORGANIZATION_ONBOARDING_WIZARD,
      );

      setIsOrganizationOnboarding(hasOrganizationOnboardingEntitlement);
    })();
  }, []);

  useEffect(() => {
    if (checkConnectedSocialNetworkLength()) {
      setActionHistoryValue(ActionHistoryKeys.GETTING_STARTED_GUIDE_ADD_SOCIAL_ACCOUNTS, true);
    }
  }, []);

  useEffect(() => {
    const taskCompletionList = getTaskCompletionList(actionHistory, isOrganizationOnboarding);
    setStep(taskCompletionList.filter(item => item).length);

    if (!taskCompletionList.includes(false)) {
      setIsCompleted(true);
    }
  }, [actionHistory, isOrganizationOnboarding]);

  useEffect(() => {
    if (guideIsOpen) {
      track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_GUIDE_SHOWN);
    }
  }, [guideIsOpen]);

  if (guideIsOpen) {
    const totalSteps = getTasksData(actionHistory, isOrganizationOnboarding).tasks.length;
    return (
      <Container>
        <CloseButton aria-label="dismiss guide" onClick={OnClickDismissGuide}>
          <Icon width={16} height={16} fill="currentColor" glyph={XLight} />
        </CloseButton>
        {isCompleted ? <h2>{$i18n.completedHeader()}</h2> : <h2>{$i18n.header()}</h2>}
        <StepLabel>
          {step}/{totalSteps} {$i18n.completed()}
        </StepLabel>
        <SteppedProgressBar currentStep={step} stepCount={totalSteps} isBarSegmented={true} />
        {isCompleted && !isCompletedStateDismissed ? (
          <CompletedState onClickClose={OnClickDismissGuide} />
        ) : (
          <AccordionTaskList {...getTasksData(actionHistory, isOrganizationOnboarding)} />
        )}
      </Container>
    );
  }

  return null;
};

export default withI18n({
  completed: 'Completed',
  completedHeader: 'Congratulations, you did it!',
  header: 'Get started guide',
})(GettingStartedGuide);
