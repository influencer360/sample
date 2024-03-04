import { env, DEV, STAGING, PRODUCTION } from 'fe-lib-env';
import { emit, on, off } from 'fe-lib-hootbus';
import { track } from 'fe-lib-tracking';
import { Constants } from 'fe-pnc-constants';
import { getDateFromUTC, getUnixTimestampInMilliseconds } from 'fe-pnc-lib-date-utils';
import { ContentConstants } from '../constants/content';
import { Organization } from '../typings/Organization';

const COMPOSER_SESSION_STORAGE_KEY = 'sessionId';
const FACADE_API_URL_BY_ENV = {
  [DEV]: 'https://development-api-auth.hootdev.com',
  [STAGING]: 'https://staging-api-auth.hootsuite.com',
  [PRODUCTION]: 'https://api-auth.hootsuite.com',
};

const MESSAGE_EDIT_FROM_CONTENT_PLANNER = 'message:edit:content_planner';
const NUM_MILLISECONDS_IN_SECONDS = 1000;

const getComposerSessionId = () => {
  const sessionId = sessionStorage.getItem(COMPOSER_SESSION_STORAGE_KEY);
  return sessionId || undefined;
};

export const openComposer = (composerData = {}, trackingData = {}, trackingOrigin: string) => {
  const handleComposerOpen = () => {
    off('full_screen_composer:response:open', handleComposerOpen);
    track(trackingOrigin, 'user_opened_composer', {
      sessionId: getComposerSessionId(),
      ...trackingData,
    });
  };

  on('full_screen_composer:response:open', handleComposerOpen);
  emit('composer.open', composerData);
};

export const uploadImage = async (imageUrl: string) => {
  const requestUrl = `${FACADE_API_URL_BY_ENV[env()]}/publisher/streaming/media/external/image`;

  const response = await fetch(requestUrl, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl }),
  });

  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`Error uploading image ${imageUrl}`);
  }
};

export const isContentPreScreen = (content: Record<string, any>) =>
  content?.reviewers?.[0]?.type === ContentConstants.REVIEWER_TYPES.SYSTEM &&
  content?.reviewers?.[0]?.name === ContentConstants.REVIEWER_NAMES.NEXGATE;

export const openComposerInEditMode = ({
  content,
  selectedOrganization,
  timezoneName,
}: {
  content: Record<string, any>;
  selectedOrganization: Organization;
  timezoneName: string;
}) => {
  const isPreScreen = isContentPreScreen(content);
  let messageType: string | null = null; // Used for displaying the type of message in the legacy edit modal. Ie: Scheduled, Expired, Rejected
  let editNewDraft = false;
  const scheduledTime = content.scheduledSendTime || content.startDate;

  switch (content.state) {
    case ContentConstants.STATE.SCHEDULED:
      messageType = Constants.APPROVALS.TYPE.SCHEDULED;
      break;
    case ContentConstants.STATE.PENDING_APPROVAL:
      // No way to determine whether the message is requiring my approval or pending approval,
      // so setting it to require my approval for now
      messageType = Constants.APPROVALS.TYPE.REQUIRE_APPROVAL;
      break;
    case ContentConstants.STATE.EXPIRED_APPROVAL:
      messageType = Constants.APPROVALS.TYPE.EXPIRED;
      break;
    case ContentConstants.STATE.REJECTED_APPROVAL:
      messageType = Constants.APPROVALS.TYPE.REJECTED;
      break;
    case ContentConstants.STATE.SEND_FAILED_PERMANENTLY:
      messageType = Constants.APPROVALS.FAILED;
      break;
    case ContentConstants.STATE.DRAFT:
      messageType = Constants.APPROVALS.TYPE.DRAFT;
      editNewDraft = true;
      break;
    default:
      break;
  }

  const isExpired =
    scheduledTime &&
    Math.floor(
      getUnixTimestampInMilliseconds(getDateFromUTC(scheduledTime, timezoneName), timezoneName) /
        NUM_MILLISECONDS_IN_SECONDS,
    ) <= Math.floor(Date.now() / NUM_MILLISECONDS_IN_SECONDS);

  emit(MESSAGE_EDIT_FROM_CONTENT_PLANNER, {
    asset: null,
    contentLibraryId: null,
    isApproval:
      content.state === ContentConstants.STATE.PENDING_APPROVAL ||
      content.state === ContentConstants.STATE.REJECTED_APPROVAL ||
      content.state === ContentConstants.STATE.EXPIRED_APPROVAL,
    isAutoSaved: false,
    isDraft: false, // Old Drafts do not show in planner
    isExpired,
    isGroupMode: false, // Group messages do not show in Planner
    isLegacy: false,
    isLocked: content.lockStatus && content.lockStatus.isLocked,
    isNewDraft: editNewDraft,
    isPreScreen,
    isTemplate: false,
    messageId: content.id,
    messageListId: null,
    messageType,
    org: selectedOrganization,
    socialProfileIds:
      (content.socialProfile && content.socialProfile.socialProfileId && [content.socialProfile.socialProfileId]) || [],
  });
};
