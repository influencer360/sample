import { useEffect, useState } from 'react';
import { off, on } from 'fe-lib-hootbus';
import { track } from 'fe-lib-tracking';
import { getDrafts } from 'fe-pnc-data-drafts';
import {
  TRACKING_EVENT_RETRY_FETCH_DRAFTS,
  TRACKING_EVENT_RETRY_FETCH_DRAFTS_FAILED,
  TRACKING_EVENT_USER_FAILED_TO_FETCH_DRAFTS,
  TRACKING_EVENT_USER_FETCHED_DRAFTS,
  TRACKING_ORIGIN_WIDGET_DRAFTS,
} from 'constants/tracking';

type DraftResponse = {
  socialProfileIds: string[];
  draft: DraftMetadata;
  errors: string[];
};

type DraftMetadata = {
  id: string;
  creatorId: string;
  creatorName: string;
  creationDate: string;
  lastModifiedDate: string;
  draftMessage: DraftMessage;
  message: Message;
  expiredDate: string;
  organizationId: string;
};

type DraftMessage = {
  attachments: Attachment[];
  text: string;
};

type Attachment = {
  thumbnailUrl: string;
};

type Draft = {
  id: string;
  socialProfileIds: string[];
  attachments: string[];
  text: string;
  creatorName: string;
  lastModifiedDate: string;
};

type Message = {
  attachments: string[];
  fieldValidations: object;
  isAutoScheduled: false;
  isBoosted: false;
  locations: object;
  messageType: string;
  publishingMode: string;
  sendDate: string;
  tags: [];
  targeting: object;
  text: string;
};

type Content = {
  cardType: string;
  contentType: string;
  id: string;
  draft: DraftMetadata;
  message: Message;
  state: string;
  creator: { id: string; name: string };
  creationDate: string;
};

type ContentEvent = {
  contentType: string;
};

export type ContentMap = {
  [key: string]: Content;
};

function createContent(draftResponse: DraftResponse) {
  return {
    cardType: 'CONTENT',
    contentType: 'DRAFT',
    id: draftResponse.draft.id,
    draft: draftResponse.draft,
    message: draftResponse.draft.message,
    state: 'DRAFT',
    creator: {
      id: draftResponse.draft.creatorId,
      name: draftResponse.draft.creatorName,
    },
    creationDate: draftResponse.draft.creationDate,
    lastModifiedDate: draftResponse.draft.lastModifiedDate,
  };
}

function createDraft(draftResponse: DraftResponse) {
  return {
    id: draftResponse.draft.id,
    socialProfileIds: draftResponse.socialProfileIds,
    attachments: draftResponse.draft.draftMessage.attachments.map(a => a.thumbnailUrl),
    text: draftResponse.draft.draftMessage.text,
    creatorName: draftResponse.draft.creatorName,
    lastModifiedDate: draftResponse.draft.lastModifiedDate,
  };
}

export const useDrafts = (limit = 5) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUpdatedDrafts, setHasUpdatedDrafts] = useState(true);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [contentMap, setContentMap] = useState<ContentMap>({});
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [shouldRetry, setShouldRetry] = useState(true);

  useEffect(() => {
    const handleEvent = (e: ContentEvent) => {
      if (e?.contentType === 'DRAFT') {
        setShouldAnimate(true);
      }
    };

    on('full_screen_composer:response:message_success', handleEvent);
    on('content_planner:content_edited', handleEvent);

    return () => {
      off('full_screen_composer:response:message_success', handleEvent);
      off('content_planner:content_edited', handleEvent);
    };
  }, []);

  useEffect(() => {
    const handleEvent = (e: ContentEvent) => {
      if (e?.contentType === 'DRAFT') {
        setHasUpdatedDrafts(true);
      }
    };

    on('full_screen_composer:response:message_success', handleEvent);
    on('content_planner:content_edited', handleEvent);
    on('content_planner:content_deleted:success', handleEvent);

    return () => {
      off('full_screen_composer:response:message_success', handleEvent);
      off('content_planner:content_edited', handleEvent);
      off('content_planner:content_deleted:success', handleEvent);
    };
  }, []);

  useEffect(() => {
    const map: ContentMap = {};

    if (hasUpdatedDrafts) {
      getDrafts(undefined, limit)
        .then((newDrafts: DraftResponse[]) => {
          track(TRACKING_ORIGIN_WIDGET_DRAFTS, TRACKING_EVENT_USER_FETCHED_DRAFTS);
          setDrafts(
            newDrafts.map(d => {
              map[d.draft.id] = createContent(d);
              return createDraft(d);
            }),
          );
          setContentMap(map);
          setIsLoading(false);
        })
        .catch(() => {
          track(TRACKING_ORIGIN_WIDGET_DRAFTS, TRACKING_EVENT_USER_FAILED_TO_FETCH_DRAFTS);

          if (shouldRetry) {
            setTimeout(() => {
              track(TRACKING_ORIGIN_WIDGET_DRAFTS, TRACKING_EVENT_RETRY_FETCH_DRAFTS);
              setShouldRetry(false);
              setHasUpdatedDrafts(true);
            }, 1000);
          } else {
            track(TRACKING_ORIGIN_WIDGET_DRAFTS, TRACKING_EVENT_RETRY_FETCH_DRAFTS_FAILED);
            setHasError(true);
            setIsLoading(false);
          }
        })
        .finally(() => {
          setHasUpdatedDrafts(false);
        });
    }
  }, [hasUpdatedDrafts, limit, shouldRetry]);

  return { drafts, contentMap, isLoading, hasError, shouldAnimate };
};
