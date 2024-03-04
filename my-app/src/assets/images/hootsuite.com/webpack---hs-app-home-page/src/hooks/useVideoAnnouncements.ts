import { useState, useEffect } from 'react';
import { emit } from 'fe-lib-hootbus';
import { track } from 'fe-lib-tracking';
import { getActionHistoryValue, ActionHistoryProps } from 'fe-pg-lib-action-history';
import translation from 'fe-pnc-lib-hs-translation';
import { isInFirst30DayUXExperiment } from 'App';
import { TRACKING_EVENT_USER_CLICKS_VIDEO_ANNOUNCEMENT_CARD_CTA, TRACKING_ORIGIN_HOMEPAGE } from 'constants/tracking';
import { USER_SAVED_FIRST_DRAFT, USER_FIRST_SENT_OR_SCHEDULED_POST } from '../constants/actionHistoryKeys';

const handleCTA = (id: string, title: string, location: string) => {
  track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_VIDEO_ANNOUNCEMENT_CARD_CTA, {
    id,
    title,
  });
  window.location.hash = location;
};

const handleDraftCTA = (id: string, title: string) => {
  track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_VIDEO_ANNOUNCEMENT_CARD_CTA, {
    id,
    title,
  });
  emit('composer.open');
};

export type VideoAnnouncement = {
  id: string;
  order?: number;
  title: string;
  description?: string;
  altText?: string;
  cta?: string;
  location: string;
  handleClick: (id: string, title: string, location: string) => void;
  src: string;
  duration: number;
};

const planYourFirstPost: VideoAnnouncement = {
  id: 'plan-posts',
  title: translation._('Planning your first post made simple'),
  description: translation._('See all your posts in one place and fill gaps in your content calendar.'),
  altText: translation._('Plan your first post video'),
  cta: translation._('View your calendar'),
  handleClick: handleCTA,
  src: 'Z1KSmcdiYMwZwLWnAkfb7W',
  location: '#/planner',
  duration: 20,
};

const draftAndSchedulePost: VideoAnnouncement = {
  id: 'draft-posts',
  title: translation._('Create your first knockout post'),
  description: translation._('Create a draft post, then publish now or schedule for later.'),
  cta: translation._('Start a post'),
  altText: translation._('Draft and Schedule Post video'),
  handleClick: handleDraftCTA,
  src: '85FBk53JmcwLFGdByXYd4g',
  duration: 21,
  location: '',
};

const trackAndAnalyze: VideoAnnouncement = {
  id: 'analyze-posts',
  title: translation._('Do more of what works'),
  description: translation._('Measure your performance with insights into your top performing posts and more.'),
  cta: translation._('Analyze posts'),
  altText: translation._('Track and analyze your posts video'),
  handleClick: handleCTA,
  src: '5W9G9nbacgpah5vTLvpCbk',
  duration: 19,
  location: '#/analytics',
};

const connectAccount: VideoAnnouncement = {
  id: 'connect-account',
  title: '',
  description: '',
  cta: '',
  altText: translation._('Connect social accounts video'),
  handleClick: handleCTA,
  src: 'Gy5whkS47J2fVCNVt7Ecew',
  duration: 17,
  location: '',
};

export const useVideoAnnouncements = ($actionHistory: ActionHistoryProps) => {
  const [announcements, setAnnouncements] = useState<VideoAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const draftActionHistoryValue = getActionHistoryValue(USER_SAVED_FIRST_DRAFT);
    const sentOrScheduledActionHistoryValue = getActionHistoryValue(USER_FIRST_SENT_OR_SCHEDULED_POST);
    let showPlanYourFirstPost = false;
    let showDraftAndSchedulePost = false;
    let showTrackAndAnalyze = false;
    const showConnectAccount = isInFirst30DayUXExperiment;

    // Check if user has no saved drafts and has never had any saved drafts
    if (!draftActionHistoryValue) {
      showDraftAndSchedulePost = true;
    }

    // Check if user has never posted or scheduled post
    if (!sentOrScheduledActionHistoryValue) {
      showPlanYourFirstPost = true;
    }

    // Check if Draft Post of Schedule Post videos have been added
    if (showPlanYourFirstPost || showDraftAndSchedulePost) {
      showTrackAndAnalyze = true;
    }

    // Logic to show different announcements
    const videoAnnouncements = [
      showPlanYourFirstPost ? planYourFirstPost : [],
      showDraftAndSchedulePost ? draftAndSchedulePost : [],
      showTrackAndAnalyze ? trackAndAnalyze : [],
      showConnectAccount ? connectAccount : [],
    ].flat();

    setAnnouncements(videoAnnouncements);
  }, [$actionHistory]);

  setTimeout(() => {
    setIsLoading(false);
  }, 2000);
  return { announcements, isLoading };
};
