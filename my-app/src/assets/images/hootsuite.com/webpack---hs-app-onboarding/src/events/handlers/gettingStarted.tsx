import { emit } from 'fe-lib-hootbus';
import { i18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { getActionHistoryValue, setActionHistoryValue } from 'fe-pg-lib-action-history';

import CreateTeamModalWrapper from '../../components/CreateTeamModalWrapper';
import InviteMembersModalWrapper from '../../components/InviteMembersModalWrapper';
import actionHistoryKeys from '../../constants/action-history-keys';
import SELECTORS from '../../constants/selectors';
import {
  TRACKING_ORIGIN_GETTING_STARTED,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_OPENED,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_CLOSED,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_CREATE_TEAM,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_INVITE_MEMBERS_SUCCESS,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_CREATE_TEAM_SUCCESS,
  TRACKING_EVENT_GETTING_STARTED_GUIDE_INVITE_MEMBERS,
  TRACKING_EVENT_GETTING_STARTED_SCHEDULE_POST_SUCCESS,
  TRACKING_EVENT_GETTING_STARTED_ADD_SOCIAL_ACCOUNTS_SUCCESS,
} from '../../constants/tracking';
import { waitForElement } from '../../utils/dom';
import { showModalInCenter } from '../../utils/modal';
import { showPopover } from '../../utils/popover';

type ShowCreateTeamModalProps = {
  organization: string;
  onClose: () => void;
};

export function handleOpenGettingStartedGuide() {
  setActionHistoryValue(actionHistoryKeys.GETTING_STARTED_GUIDE_IS_OPEN, true);
  track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_GUIDE_OPENED);
}

export function handleCloseGettingStartedGuide() {
  setActionHistoryValue(actionHistoryKeys.GETTING_STARTED_GUIDE_IS_OPEN, false);
  track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_GUIDE_CLOSED);
}

export function showCreateTeamModal({ organization, onClose }: ShowCreateTeamModalProps) {
  showModalInCenter(CreateTeamModalWrapper, {
    organization: organization,
    onClose: onClose,
  });
  track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_GUIDE_CREATE_TEAM);
}

export function showInviteMembersModal({ onClose }: { onClose: () => void }) {
  showModalInCenter(InviteMembersModalWrapper, {
    onClose: onClose,
    onComplete: () => {
      emit('dashboard:gettingStarted:inviteMembersModal:success');
    },
  });
  track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_GUIDE_INVITE_MEMBERS);
}

export function handleInviteMembersTask() {
  setActionHistoryValue(actionHistoryKeys.GETTING_STARTED_GUIDE_INVITE_PEOPLE, true);
  track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_GUIDE_INVITE_MEMBERS_SUCCESS);
}

export function handleCreateTeamTask() {
  setActionHistoryValue(actionHistoryKeys.GETTING_STARTED_GUIDE_CREATE_TEAM, true);
  track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_GUIDE_CREATE_TEAM_SUCCESS);
}

export function handleAddSocialAccountsTask(data: { socialNetworks: { [key: string]: object } }) {
  if (data?.socialNetworks && Object.keys(data.socialNetworks).length >= 2) {
    setActionHistoryValue(actionHistoryKeys.GETTING_STARTED_GUIDE_ADD_SOCIAL_ACCOUNTS, true);
    track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_ADD_SOCIAL_ACCOUNTS_SUCCESS);
  }
}

export function handleSchedulePostTask() {
  setActionHistoryValue(actionHistoryKeys.GETTING_STARTED_GUIDE_SCHEDULE_POST, true);
  track(TRACKING_ORIGIN_GETTING_STARTED, TRACKING_EVENT_GETTING_STARTED_SCHEDULE_POST_SUCCESS);
}

export async function showPopoverGetStartedGuideNavPopover() {
  const hasSeenNavPopover = getActionHistoryValue(actionHistoryKeys.GETTING_STARTED_GUIDE_HAS_SEEN_NAV_POPOVER);

  if (!hasSeenNavPopover) {
    const $i18n = await i18n({
      copy: 'Access your getting started guide from the help menu at anytime',
    });
    waitForElement(SELECTORS.help.navHelpButton, { timeout: 500 })
      .then(() => {
        showPopover({
          description: $i18n.copy(),
          hasExitOnBackgroundClick: true,
          hideNext: true,
          placement: 'right',
          showSpotlight: false,
          spotlightBorderRadius: 50,
          spotlightPadding: 0,
          target: SELECTORS.help.navHelpButton,
          trackingName: 'getting_started_guide_popover',
        });
      })
      .catch(() => {
        waitForElement(SELECTORS.seeMore.navSeeMoreButton, { timeout: 500 }).then(() => {
          showPopover({
            description: $i18n.copy(),
            hasExitOnBackgroundClick: true,
            hideNext: true,
            placement: 'right',
            showSpotlight: false,
            spotlightBorderRadius: 50,
            spotlightPadding: 0,
            target: SELECTORS.seeMore.navSeeMoreButton,
            trackingName: 'getting_started_guide_popover',
          });
        });
      });
    setActionHistoryValue(actionHistoryKeys.GETTING_STARTED_GUIDE_HAS_SEEN_NAV_POPOVER, true);
  }
}
