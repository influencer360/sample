import { emit } from 'fe-lib-hootbus';
import { track } from 'fe-lib-tracking';
import translation from 'fe-pnc-lib-hs-translation';
import { TRACKING_EVENT_USER_CLICKS_VIDEO_ANNOUNCEMENT_CARD_CTA, TRACKING_ORIGIN_HOMEPAGE } from 'constants/tracking';

export const handleCTA = (id: string, title: string, location: string) => {
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

export const PLAN_POST_VIDEO: VideoAnnouncement = {
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

export const DRAFT_SCHEDULE_VIDEO: VideoAnnouncement = {
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

export const ANALYTICS_VIDEO: VideoAnnouncement = {
  id: 'analyze-posts',
  title: translation._('Analyzing Your Posts'),
  description: translation._('Measure your performance with insights into your top performing posts and more.'),
  cta: translation._('Analyze posts'),
  altText: translation._('Track and analyze your posts video'),
  handleClick: () => handleCTA(ANALYTICS_VIDEO.id, ANALYTICS_VIDEO.title, ANALYTICS_VIDEO.location),
  src: '5W9G9nbacgpah5vTLvpCbk',
  duration: 19,
  location: '#/analytics',
};

export const CONNECT_ACCOUNT_VIDEO: VideoAnnouncement = {
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

export const allVideoAnnouncements = [PLAN_POST_VIDEO, DRAFT_SCHEDULE_VIDEO, ANALYTICS_VIDEO, CONNECT_ACCOUNT_VIDEO];
