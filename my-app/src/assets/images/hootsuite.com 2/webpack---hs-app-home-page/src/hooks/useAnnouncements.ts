import { useState, useEffect, useRef } from 'react';
import { track } from 'fe-lib-tracking';
import { GoalStatusData } from 'fe-social-value-lib-core';
import {
  TRACKING_EVENT_USER_CLICKS_ANNOUNCEMENT_CARD,
  TRACKING_ORIGIN_HOMEPAGE,
  TRACKING_EVENT_USER_CLICKS_ADD_ADVANCED_PUBLISHING,
  TRACKING_ORIGIN_ADDONS,
  TRACKING_EVENT_USER_SEES_ADDON_CARD,
} from 'constants/tracking';
import { RequestStatusType } from 'typings/Shared';
import addonsImage from '../assets/addonsImage.png';
import gtmAnnouncementImage from '../assets/gtm-owly.png';
import goalsAtRisk from '../assets/sv-goals-atrisk.png';
import goalsOnTrack from '../assets/sv-goals-ontrack.png';
import goalsNone from '../assets/sv-goals-start.png';
import { useAddons } from './useAddons';
import { useGoals } from './useGoals';

export type Announcement = {
  id: string;
  order: number;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  cta: string;
  location: string;
  openInNewTab?: boolean;
  handleClick: (id: string, title: string, location: string, openInNewTab?: boolean) => void;
};

const handleCTA = (id: string, title: string, location: string, openInNewTab?: boolean) => {
  const openLinkInNewTab = !!openInNewTab;
  track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_ANNOUNCEMENT_CARD, {
    id,
    title,
  });
  if (openLinkInNewTab) {
    window.open(location, '_blank');
  } else {
    window.location.href = location;
  }
};

const handleClickPublishingAddon = (id: string, title: string, location: string) => {
  track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_ADD_ADVANCED_PUBLISHING, {
    id,
    title,
  });
  window.pendoHelpers.emitPendoEvent('openInAppPaymentWizard', { addonCode: 'ADDON_ADVANCED_PUBLISHING' });
};

const staticAnnouncements: Announcement[] = [
  {
    id: 'owlyWriter',
    order: 3,
    title: 'Introducing OwlyWriter AI for busy social media pros',
    description: 'Save time with our AI writing tool. Give it a whirl – it’s free for a limited time!',
    image:
      'https://images.ctfassets.net/ta4ffdi8h2om/46vS6k9oAQd6DaXazMIrKP/13f1d1e464463e03fc9ca19fa0eaa17d/Rectangle_118__2_.png',
    imageAlt: 'owly writer',
    cta: 'Try it now',
    location: '#/inspiration',
    handleClick: handleCTA,
  },
];

const gtmAnnouncement: Announcement = {
  id: 'gtmMoment',
  order: 1,
  title: 'Harmony is here',
  description:
    'Smoother workflows. Smarter automation. Discover Harmony — our newest updates to help your team stress less and work smarter.',
  image: gtmAnnouncementImage,
  imageAlt: '',
  cta: 'Discover Harmony',
  location:
    'https://www.hootsuite.com/updates/harmony-users?utm_campaign=all-tier_1_campaigns-releases_-_harmony-glo-none---homepage----q4_2023&utm_source=in-product&utm_medium=owned_content&utm_content=',
  handleClick: handleCTA,
  openInNewTab: true,
};

const publishingAddonsAnnouncement: Announcement = {
  id: 'publishingAddon',
  order: 2,
  title: 'Hit your account limit?',
  description: 'Unlock more engagement across as many accounts as you want with the Unlimited social accounts add-on.',
  image: addonsImage,
  imageAlt: '',
  cta: 'Get unlimited accounts',
  location: '',
  handleClick: handleClickPublishingAddon,
};

const goalsAtRiskAnnouncement: Announcement = {
  id: 'goalsAtRisk',
  order: 4,
  title: 'Get back on track',
  description: 'Use our tips and recommendations to get your goals back on track.',
  image: goalsAtRisk,
  imageAlt: 'goals at risk',
  cta: 'View recommendations',
  location: '#/goals',
  handleClick: handleCTA,
};

const goalsEmptyAnnouncement: Announcement = {
  id: 'goalsEmpty',
  order: 4,
  title: 'Create your first goal',
  description: 'Set goals to measure, improve, and celebrate your progress on social.',
  image: goalsNone,
  imageAlt: 'empty goals',
  cta: 'Create a goal',
  location: '#/goals',
  handleClick: handleCTA,
};

const goalsOnTrackAnnouncement: Announcement = {
  id: 'goalsOnTrack',
  order: 4,
  title: 'Keep up the great work',
  description: `You're on track to achieve your goals. Review your progress and keep it up.`,
  image: goalsOnTrack,
  imageAlt: 'goals on track',
  cta: 'Review your progress',
  location: '#/goals',
  handleClick: handleCTA,
};

const getGoalAnnouncement = (goals: GoalStatusData[]) => {
  if (goals.length < 1) {
    return goalsEmptyAnnouncement;
  }

  const goalsAtRisk = goals.filter(goal => goal.isGoalAtRisk);
  if (goalsAtRisk.length > 0) {
    return goalsAtRiskAnnouncement;
  }

  return goalsOnTrackAnnouncement;
};

export const useAnnouncements = (showGoalCard: boolean, showAddonsCard: boolean, showGtmCard: boolean) => {
  const tempAnnouncementsArray = useRef<Announcement[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(staticAnnouncements);
  const [isLoading, setIsLoading] = useState(true);
  const { goals, goalsStatus } = useGoals(showGoalCard);
  const { addonsStatus, memberAddons, availableAddons } = useAddons(showAddonsCard);

  useEffect(() => {
    tempAnnouncementsArray.current.push(...staticAnnouncements);
    if (showGtmCard) {
      tempAnnouncementsArray.current.push(gtmAnnouncement);
    }
  }, []);

  useEffect(() => {
    if (
      showAddonsCard &&
      addonsStatus !== RequestStatusType.LOADING &&
      memberAddons.filter(addonObj => addonObj?.code === 'ADDON_ADVANCED_PUBLISHING').length === 0 &&
      availableAddons.filter(addonObj => addonObj?.productCode === 'ADDON_ADVANCED_PUBLISHING').length > 0
    ) {
      tempAnnouncementsArray.current.push(publishingAddonsAnnouncement);
      track(TRACKING_ORIGIN_ADDONS, TRACKING_EVENT_USER_SEES_ADDON_CARD);
    }
  }, [addonsStatus]);

  useEffect(() => {
    if (showGoalCard && goalsStatus !== RequestStatusType.LOADING) {
      const goalCard = getGoalAnnouncement(goals);
      tempAnnouncementsArray.current.push(goalCard);
    }
  }, [goalsStatus]);

  useEffect(() => {
    if (goalsStatus !== RequestStatusType.LOADING && addonsStatus !== RequestStatusType.LOADING) {
      setIsLoading(false);
      setAnnouncements(
        tempAnnouncementsArray.current.sort((a, b) => {
          return a.order - b.order;
        }),
      );
    }
  }, [addonsStatus, goalsStatus]);

  return { announcements, isLoading };
};
