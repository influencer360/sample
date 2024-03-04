import React, { MouseEventHandler, useEffect, useState, Dispatch } from 'react';
import styled from 'styled-components';
import { track } from 'fe-lib-tracking';
import { setActionHistoryValue, ActionHistoryProps, getActionHistoryValue } from 'fe-pg-lib-action-history';
import { TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_GETTING_STARTED_USER_COMPLETED_GUIDE } from 'constants/tracking';
import {
  GETTING_STARTED_GUIDE_ADD_SOCIAL_ACCOUNTS,
  GETTING_STARTED_GUIDE_INVITE_PEOPLE,
  GETTING_STARTED_GUIDE_CREATE_TEAM,
  USER_POSTED_OR_SCHEDULED_POST,
  HAS_SEEN_GETTING_STARTED_GUIDE_COMPLETED_STATE,
} from '../../constants/actionHistoryKeys';
import { TEAMTASKS, TASKS } from './gettingStartedGuideConstants';
import TaskListItem from './TaskListItem';

const TaskListWrapper = styled.ul`
  display: flex;
  flex-wrap: wrap;
  margin: 12px 0 0 0;
  padding: 0;
`;

const getTaskCompletionList = (canManageOrg: boolean | undefined) => {
  if (canManageOrg) {
    return [
      true,
      !!getActionHistoryValue(GETTING_STARTED_GUIDE_ADD_SOCIAL_ACCOUNTS),
      !!getActionHistoryValue(GETTING_STARTED_GUIDE_INVITE_PEOPLE),
      !!getActionHistoryValue(GETTING_STARTED_GUIDE_CREATE_TEAM),
    ];
  } else {
    return [
      true,
      !!getActionHistoryValue(GETTING_STARTED_GUIDE_ADD_SOCIAL_ACCOUNTS),
      !!getActionHistoryValue(USER_POSTED_OR_SCHEDULED_POST),
    ];
  }
};

const checkConnectedSocialNetworkLength = (): boolean => {
  if (window.hs.socialNetworks) {
    return Object.keys(window.hs.socialNetworks).length >= 2;
  }
  return false;
};

type Task = {
  title: React.ReactNode;
  content?: {
    description: string;
    buttonText: string;
  };
  isComplete: boolean;
  id: string | number;
  isOpen?: boolean;
  isDisabled?: boolean;
  onClickTask?: MouseEventHandler;
  completedTitle?: string;
};

export type AccordionTaskListProps = {
  tasks: Array<Task>;
};

type GettingStartedGuideProps = {
  isTeamsOnboarding?: boolean;
  setActiveStep: Dispatch<number>;
  setIsCompleted: Dispatch<boolean>;
  $actionHistory: ActionHistoryProps;
};

const GettingStartedGuide = ({
  isTeamsOnboarding,
  setActiveStep,
  setIsCompleted,
  $actionHistory,
}: GettingStartedGuideProps) => {
  const [tasks, setTasks] = useState<Array<Task>>([]);

  useEffect(() => {
    if (checkConnectedSocialNetworkLength()) {
      setActionHistoryValue(GETTING_STARTED_GUIDE_ADD_SOCIAL_ACCOUNTS, true);
    }
  }, []);

  useEffect(() => {
    const taskCompletionList = getTaskCompletionList(isTeamsOnboarding);
    const tasks = isTeamsOnboarding ? TEAMTASKS : TASKS;
    const tasksStatus = tasks.tasks.map((t, index) => {
      return { ...t, isComplete: taskCompletionList[index] };
    });

    if (!taskCompletionList.includes(false)) {
      setIsCompleted(true);
      setTimeout(() => {
        setActionHistoryValue(HAS_SEEN_GETTING_STARTED_GUIDE_COMPLETED_STATE, true);
      }, 7000);
      track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_GETTING_STARTED_USER_COMPLETED_GUIDE);
    } else {
      setIsCompleted(false);
    }

    setTasks(tasksStatus);
  }, [$actionHistory, isTeamsOnboarding, setIsCompleted]);

  return (
    <TaskListWrapper>
      {tasks.map((task, index) => (
        <TaskListItem
          key={task.id || index}
          title={task.title}
          isComplete={task.isComplete}
          completedTitle={task.completedTitle}
          onClickTask={task.onClickTask}
          step={index + 1}
          content={task.content}
          isPreviousComplete={tasks[index - 1]?.isComplete}
          setActiveStep={setActiveStep}
        />
      ))}
    </TaskListWrapper>
  );
};

export default GettingStartedGuide;
