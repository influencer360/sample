import React from 'react';
import { willGetDraftBoostCampaign } from 'fe-ae-lib-boost-api';
import { TYPE_ERROR, TYPE_WARNING } from 'fe-comp-banner';
import { CALLOUTS } from 'fe-comp-callout';
import { add as addCallout } from 'fe-lib-async-callouts';
import { getDrafts } from 'fe-pnc-data-drafts';
import translation from 'fe-pnc-lib-hs-translation';

const FAILED_TO_RETRIEVE_DRAFT_DATA = translation._('Failed to retrieve draft data, please refresh and try again.');
const AUTO_HIDE_TIME = 5000;

const attachBoostCampaignData = async (contentId: any, draftContent: { draft: any }) => {
  try {
    const campaignData = await willGetDraftBoostCampaign(contentId);

    return {
      ...draftContent,
      draft: { ...draftContent?.draft, boostCampaign: campaignData },
    };
  } catch (err) {
    StatusToastUtils.createToast(
      '',
      translation._('Failed to retrieve boosted campaign draft data, please refresh and try again.'),
      TYPE_WARNING,
    );
    return draftContent;
  }
};

const createCallout = (
  size: any,
  title: string,
  text: string,
  type: string,
  timeout: number | undefined,
  children: boolean | React.ReactChild | React.ReactFragment | React.ReactPortal | null | undefined,
) =>
  addCallout({
    calloutType: size,
    type,
    titleText: title,
    messageText: text,
    timeout: timeout || AUTO_HIDE_TIME,
    children,
  }).then((remove: any) => remove);

const StatusToastUtils = {
  createToast(title: string, text: string, type: string, timeout?: number, children?: React.ReactNode) {
    return createCallout(CALLOUTS.TOAST.NAME, title, text, type, timeout, children);
  },
};

export const fetchDrafts = (content: Record<string, any>) => {
  return getDrafts(undefined, undefined, content.id)
    .then((drafts: any[]) => drafts.find(d => d.draft.id === content.id))
    .then((draftContent: any) =>
      content?.message?.isBoosted ? attachBoostCampaignData(content.id, draftContent) : draftContent,
    )
    .catch((error: Error) => {
      StatusToastUtils.createToast('', FAILED_TO_RETRIEVE_DRAFT_DATA, TYPE_ERROR);
      throw error;
    });
};
