import React from 'react';
import { emit } from 'fe-lib-hootbus';
import { track } from 'fe-lib-tracking';
import type { AccordionTaskListProps } from 'fe-pg-comp-accordion-task-list';
import {
  TRACKING_EVENT_GETTING_STARTED_GUIDE_DISMISS_CREATE_TEAM,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_DISMISS_INVITE_MEMBERS,
  TRACKING_ORIGIN_GETTING_STARTED,
} from './tracking';

export const TASKS: AccordionTaskListProps = {
  tasks: [
    {
      title: <>Create account</>,
      isComplete: true,
      id: 'task_create_account',
      completedTitle: 'Account created 😎',
    },
    {
      title: <>Add 2 social accounts</>,
      isComplete: false,
      id: 'task_add_social_accounts',
      completedTitle: '2 social accounts added  🎉',
      onClickTask: () => emit('socialNetwork:addNetwork:modal'),
    },
    {
      title: <>Schedule a post</>,
      isComplete: false,
      id: 'task_schedule_post',
      completedTitle: 'Post scheduled 🥇',
      onClickTask: () => emit('composer.open'),
    },
  ],
  isVariant: true,
};

export const ORGTASKS: AccordionTaskListProps = {
  tasks: [
    {
      title: <>Create account</>,
      isComplete: true,
      id: 'task_create_account',
      completedTitle: 'Account created 😎',
    },
    {
      title: <>Add 2 social accounts</>,
      isComplete: false,
      id: 'task_add_social_accounts',
      completedTitle: '2 social accounts added  🎉',
      onClickTask: () => emit('socialNetwork:addNetwork:modal'),
    },
    {
      title: <>Invite people</>,
      isComplete: false,
      id: 'task_invite_people',
      completedTitle: 'Invites sent 🔥',
      onClickTask: () =>
        emit('dashboard:gettingStarted:inviteMembersModal:show', {
          onClose: () => {
            track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_GUIDE_DISMISS_INVITE_MEMBERS);
          },
        }),
    },
    {
      title: <>Create a team</>,
      isComplete: false,
      id: 'task_create_team',
      completedTitle: 'Team created 🚀',
      onClickTask: () =>
        emit('dashboard:gettingStarted:createTeamModal:show', {
          organization: {
            id: window.hs.firstOrganization?.orgId,
            name: window.hs.firstOrganization?.name,
          },
          onClose: () => {
            track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_GUIDE_DISMISS_CREATE_TEAM);
          },
        }),
    },
  ],
  isVariant: true,
};
