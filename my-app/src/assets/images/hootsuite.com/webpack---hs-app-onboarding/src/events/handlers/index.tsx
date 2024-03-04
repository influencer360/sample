import React from 'react';
import styled from 'styled-components';
import ClockStar from '@fp-icons/emblem-clock-star';
import Icon from '@fp-icons/icon-base';
import { getFeatureAccessPermission, PREPOPULATING_STREAMS, RECOMMENDED_TIMES_TO_POST } from 'fe-lib-entitlements';
import { emit } from 'fe-lib-hootbus';
import { i18n } from 'fe-lib-i18n';
import { withHsTheme, getThemeValue } from 'fe-lib-theme';
import { track } from 'fe-lib-tracking';
import { AddCalendarEventModal, ReminderModal } from 'fe-pg-comp-publishing-reminders-modals';
import { getActionHistoryValue, setActionHistoryValue } from 'fe-pg-lib-action-history';
import RemoveSocialNetworkModal from '../../components/RemoveSocialNetworkModal';
import AH from '../../constants/action-history-keys';
import SELECTORS from '../../constants/selectors';
import { TRACKING_ORIGIN_ACCOUNT_SETUP, TRACKING_ORIGIN_PUBLISHING_REMINDERS } from '../../constants/tracking';
import { isElementVisible, waitForElement } from '../../utils/dom';
import { createGoogleCalendarLink, createIcs, showModal } from '../../utils/modal';
import { closePopover, showPopover } from '../../utils/popover';

///const RemoveSocialNetworkModalFC: React.FunctionComponent = (props: RemoveSocialNetworkModalProps) => (<RemoveSocialNetworkModal {...props} />)

export async function showPopoverOrganizeStreams() {
  const hasSeenPopoverOrganizeStreams = getActionHistoryValue(AH.hasSeenPopoverOrganizeStreams);
  const createBoardButton = document.querySelector<HTMLElement>(SELECTORS.streams.createBoardButton);
  const sidebarToggleButton = document.querySelector<HTMLElement>(SELECTORS.streams.sidebarToggleButton);

  if (!hasSeenPopoverOrganizeStreams) {
    if (!isElementVisible(createBoardButton)) {
      sidebarToggleButton?.click();
    }

    const $i18n = await i18n({
      title: 'Organize your streams with boards',
      description: 'You can create multiple boards to group and organize different sets of streams.',
      next: 'Ok, got it!',
    });

    showPopover({
      target: SELECTORS.streams.createBoardButton,
      title: $i18n.title(),
      description: $i18n.description(),
      next: $i18n.next(),
      placement: 'right',
      onNext: closePopover,
      hasExitOnBackgroundClick: true,
      trackingName: 'organize_streams_with_tabs',
    });

    setActionHistoryValue(AH.hasSeenPopoverOrganizeStreams, true);
  }
}

export async function showPopoverPrepopulatedStreams() {
  const shouldSeePopoverPrepopulatedStreams = getActionHistoryValue(AH.shouldSeePopoverPrepopulatedStreams);
  const hasPrepopulatingStreamsEntitlement = await getFeatureAccessPermission(
    window.hs.memberId,
    PREPOPULATING_STREAMS,
  );

  try {
    await waitForElement(SELECTORS.streams.streamScrollBox, { timeout: 10000 });
    await waitForElement(SELECTORS.streams.navStreamsButton);
    // Check to ensure the correct action history values, we are not bucketed in the following tests, and we have the correct entitlements.
    if (shouldSeePopoverPrepopulatedStreams && hasPrepopulatingStreamsEntitlement) {
      const $i18n = await i18n({
        title: 'Your dashboard is ready, %1$s!',
        description:
          "We've set up your Streams dashboard and organized your social accounts into separate boards. This should make it easier to monitor and engage with published and scheduled content on each social account in one place. Check your boards in the Streams navigation on the left.",
        next: 'Ok, got it!',
      });

      showPopover({
        target: '._box:nth-child(1) ._header',
        spotlightTargets: [
          {
            target: '._box:nth-child(2) ._header',
            paddingBottom: 400,
          },
        ],
        spotlightPaddingBottom: 400,
        title: $i18n.title().replace('%1$s', window.hs.memberName),
        description: $i18n.description(),
        next: $i18n.next(),
        placement: 'left-start',
        onNext: closePopover,
        hasExitOnBackgroundClick: true,
        trackingName: 'prepopulatedStreamsPopover',
        width: '300px',
      });

      setActionHistoryValue(AH.shouldSeePopoverPrepopulatedStreams, false);
    }
  } catch {
    /* Do nothing */
  }
}

type ShowRTPPlannerPopoverOptions = {
  minimumSignupDate: string;
};

type SocialProfileObject = {
  username: string;
  type: string;
  avatar: string;
  socialNetworkId: string;
};

export async function showRTPPlannerPopoverStreams(params: ShowRTPPlannerPopoverOptions) {
  const hasSeenRTPPlannerPopoverStreams = getActionHistoryValue(AH.hasSeenRTPPlannerPopoverStreams);
  const hasEntitlement = await getFeatureAccessPermission(window.hs.memberId, RECOMMENDED_TIMES_TO_POST);
  await waitForElement(SELECTORS.planner.navPlannerButton);

  if (
    new Date(window.hs.memberSignupDate) < new Date(params.minimumSignupDate) &&
    !hasSeenRTPPlannerPopoverStreams &&
    hasEntitlement
  ) {
    const $i18n = await i18n({
      title: 'Your recommended times are ready',
      description: `Schedule your next post based on your audience's peak engagement times. No analysis required, we've got that handled.`,
      next: 'Review times',
    });

    const IconWrapper = withHsTheme(styled.div`
      width: 48px;
      height: 48px;
      border-radius: 50%;
      color: ${() => getThemeValue(t => t.colors.primary)};
      background-color: ${() => getThemeValue(t => t.colors.complementaryOrange40)};
      display: grid;
      place-content: center;
    `);

    const TitleWrapper = function () {
      return (
        <div>
          <IconWrapper>
            <Icon glyph={ClockStar} size={28} fill="currentColor" />
          </IconWrapper>
          <div>{$i18n.title()}</div>
        </div>
      );
    };

    showPopover({
      target: SELECTORS.planner.navPlannerButton,
      title: <TitleWrapper />,
      description: $i18n.description(),
      next: $i18n.next(),
      placement: 'right',
      onNext: () => {
        window.location.href = '#/planner';
        closePopover();
      },
      hasExitOnBackgroundClick: true,
      trackingName: 'RTPPlannerPopover',
      width: '324px',
    });

    setActionHistoryValue(AH.hasSeenRTPPlannerPopoverStreams, true);
  }
}

export async function showContentCalendarPopover() {
  const hasSeenContentCalendarPopover = getActionHistoryValue(AH.hasSeenContentCalendarPopover);

  if (!hasSeenContentCalendarPopover) {
    await waitForElement(SELECTORS.planner.contentCalendar);
    const $i18n = await i18n({
      title: 'Unsure what to post?',
      descriptionOne:
        "Discover new ideas with content suggestions. We'll help you get started by recommending holidays you can celebrate with your audience. We'll even give you templates and hashtags!",
      descriptionTwo: "Maybe a quick tip is all you need? We've got those too. Point to any tip to learn more.",
      next: 'OK',
    });

    const Block = styled.div`
      margin-bottom: 8px;
    `;

    const DescriptionWrapper = function () {
      return (
        <div>
          <Block>{$i18n.descriptionOne()}</Block>
          <Block>{$i18n.descriptionTwo()}</Block>
        </div>
      );
    };

    showPopover({
      target: SELECTORS.planner.contentCalendar,
      title: $i18n.title(),
      description: <DescriptionWrapper />,
      next: $i18n.next(),
      placement: 'left',
      onNext: () => {
        closePopover();
      },
      hasExitOnBackgroundClick: true,
      trackingName: 'contentCalendarPopover',
      width: '388px',
    });

    setActionHistoryValue(AH.hasSeenContentCalendarPopover, true);
  }
}

export async function showPublishingRemindersCtaModal() {
  // This modal will only be appearing once per user, after one of their first "post now" or "schedule" flows.
  const hasSeenPublishingRemindersModal = getActionHistoryValue(AH.hasSeenPublishingRemindersModal);
  if (!hasSeenPublishingRemindersModal) {
    showModal(ReminderModal, {
      imageUrl: 'https://i.hootsuite.com/assets/product-growth/publishing-reminders/modal-image-1.png',
      onClose: () => {
        track(TRACKING_ORIGIN_PUBLISHING_REMINDERS, 'user_closes_modal_1');
      },
      onClickOk: () => {
        // Show the reminders modal if the user clicks OK.
        emit('dashboard:onboarding:publishingReminders:reminderModal:show');
        track(TRACKING_ORIGIN_PUBLISHING_REMINDERS, 'user_clicks_ok_modal_1');
      },
      onClickNoThanks: () => {
        track(TRACKING_ORIGIN_PUBLISHING_REMINDERS, 'user_clicks_no_thanks_modal_1');
      },
    });
    setActionHistoryValue(AH.hasSeenPublishingRemindersModal, true);
    track(TRACKING_ORIGIN_PUBLISHING_REMINDERS, 'user_sees_modal_1');
  }
}

export async function showPublishingRemindersModal() {
  // The action buttons are wrapped in an anchor tag that achieves the desired file download / linkback functionality.
  // Because of this, the onClick is only here for event tracking purposes.
  showModal(AddCalendarEventModal, {
    onClose: () => {
      track(TRACKING_ORIGIN_PUBLISHING_REMINDERS, 'user_closes_modal_2');
    },
    onClickDone: () => {
      track(TRACKING_ORIGIN_PUBLISHING_REMINDERS, 'user_clicks_done_modal_2');
    },
    onClickGoogle: () => {
      track(TRACKING_ORIGIN_PUBLISHING_REMINDERS, 'user_clicks_google_modal_2');
    },
    onClickApple: () => {
      track(TRACKING_ORIGIN_PUBLISHING_REMINDERS, 'user_clicks_apple_modal_2');
    },
    onClickMicrosoft: () => {
      track(TRACKING_ORIGIN_PUBLISHING_REMINDERS, 'user_clicks_microsoft_modal_2');
    },
    icsFile: createIcs(),
    googleCalendarLink: createGoogleCalendarLink(),
  });
  track(TRACKING_ORIGIN_PUBLISHING_REMINDERS, 'user_sees_modal_2');
}

export async function showRemoveSocialNetworkModal(profile: SocialProfileObject) {
  showModal(RemoveSocialNetworkModal, {
    onClickOk: () => {
      emit('socialNetwork:deleteNetwork:action', profile.socialNetworkId);
      track(TRACKING_ORIGIN_ACCOUNT_SETUP, 'user_removes_profile_in_account_setup', profile.socialNetworkId);
    },
    profile: {
      username: profile.username,
      type: profile.type,
      avatar: profile.avatar,
    },
  });
  track(TRACKING_ORIGIN_ACCOUNT_SETUP, 'user_opens_remove_social_network_modal');
}
