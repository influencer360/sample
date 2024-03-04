import { emit } from 'fe-lib-hootbus';
import { track } from 'fe-lib-tracking';
import translation from 'fe-pnc-lib-hs-translation';
import {
  TRACKING_EVENT_GETTING_STARTED_CLICKS_ADD_SOCIAL_ACCOUNTS,
  TRACKING_EVENT_GETTING_STARTED_CLICKS_SCHEDULE_POST,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_CREATE_TEAM,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_DISMISS_CREATE_TEAM,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_DISMISS_INVITE_MEMBERS,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_INVITE_MEMBERS,
  TRACKING_ORIGIN_HOMEPAGE,
} from '../../constants/tracking';
import type { AccordionTaskListProps } from './index';

export const TASKS: AccordionTaskListProps = {
  tasks: [
    {
      title: translation._('Create account'),
      isComplete: true,
      id: 'task_create_account',
      completedTitle: translation._('Account created 😎'),
    },
    {
      title: translation._('Add 2 social accounts'),
      isComplete: false,
      id: 'task_add_social_accounts',
      completedTitle: translation._('2 social accounts added  🎉'),
      onClickTask: () => {
        track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_GETTING_STARTED_CLICKS_ADD_SOCIAL_ACCOUNTS);
        emit('socialNetwork:addNetwork:modal');
      },
      content: {
        description: translation._('Start managing all your social media in one place.'),
        buttonText: translation._('Add a social account'),
      },
    },
    {
      title: translation._('Schedule a post'),
      isComplete: false,
      id: 'task_schedule_post',
      completedTitle: translation._('Post scheduled 🥇'),
      onClickTask: () => {
        track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_GETTING_STARTED_CLICKS_SCHEDULE_POST);
        emit('composer.open');
      },
      content: {
        description: translation._('Draft your first knockout post, then publish now or schedule for later.'),
        buttonText: translation._('Create a post'),
      },
    },
  ],
};

export const TEAMTASKS: AccordionTaskListProps = {
  tasks: [
    {
      title: translation._('Create account'),
      isComplete: true,
      id: 'task_create_account',
      completedTitle: translation._('Account created 😎'),
    },
    {
      title: translation._('Add 2 social accounts'),
      isComplete: false,
      id: 'task_add_social_accounts',
      completedTitle: translation._('2 social accounts added  🎉'),
      onClickTask: () => {
        track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_GETTING_STARTED_CLICKS_ADD_SOCIAL_ACCOUNTS);
        emit('socialNetwork:addNetwork:modal');
      },
      content: {
        description: translation._('Start managing all your social media in one place.'),
        buttonText: translation._('Add a social account'),
      },
    },
    {
      title: translation._('Invite people'),
      isComplete: false,
      id: 'task_invite_people',
      completedTitle: translation._('Invites sent 🔥'),
      content: {
        description: translation._('You can invite 2 team members to your Hootsuite account.'),
        buttonText: translation._('Invite a team member'),
      },
      onClickTask: () => {
        track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_GETTING_STARTED_GUIDE_INVITE_MEMBERS);
        emit('dashboard:gettingStarted:inviteMembersModal:show', {
          onClose: () => {
            track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_GETTING_STARTED_GUIDE_DISMISS_INVITE_MEMBERS);
          },
        });
      },
    },
    {
      title: translation._('Create a team'),
      isComplete: false,
      id: 'task_create_team',
      completedTitle: translation._('Team created 🚀'),
      content: {
        description: translation._('Collaborate and manage workflows easily.'),
        buttonText: translation._('Create a team'),
      },
      onClickTask: () => {
        track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_GETTING_STARTED_GUIDE_CREATE_TEAM);
        emit('dashboard:gettingStarted:createTeamModal:show', {
          organization: {
            id: window.hs.firstOrganization?.orgId,
            name: window.hs.firstOrganization?.name,
          },
          onClose: () => {
            track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_GETTING_STARTED_GUIDE_DISMISS_CREATE_TEAM);
          },
        });
      },
    },
  ],
};
