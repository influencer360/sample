import React, { useState, useEffect } from 'react';
import { getTimezoneName, getSocialNetworks } from 'fe-lib-hs';
import { withI18n } from 'fe-lib-i18n';
import { track } from 'fe-lib-tracking';
import { store as OrganizationsStore } from 'fe-pnc-data-organizations';
import SocialPost from 'components/SocialPost/SocialPost';
import {
  TRACKING_EVENT_USER_CLICKS_DRAFT_CARD,
  TRACKING_EVENT_USER_CLICKS_POST_EXTERNAL_LINK,
  TRACKING_ORIGIN_HOMEPAGE,
  TRACKING_ORIGIN_WIDGET_DRAFTS,
} from 'constants/tracking';
import { ContentMap } from 'hooks/useDrafts';
import { Content } from 'typings/Content';
import { SocialProfile } from 'typings/SocialProfile';
import { WidgetName } from 'typings/Widget';
import { getSocialNetworkById, parseTimeStamp } from 'utils/draft';
import { editActionHandler, EditActionHandlerParams } from 'utils/draftActionHandlers';

export const NETWORK_FACEBOOK = 'FACEBOOK';
export const NETWORK_TWITTER = 'TWITTER';
export const NETWORK_INSTAGRAM = 'INSTAGRAM';
export const NETWORK_INSTAGRAM_BUSINESS = 'INSTAGRAMBUSINESS';
export const NETWORK_YOUTUBE = 'YOUTUBECHANNEL';
export const NETWORK_LINKEDIN = 'LINKEDIN';
export const NETWORK_LINKEDIN_COMPANY = 'LINKEDINCOMPANY';
export const NETWORK_PINTEREST = 'PINTEREST';
export const NETWORK_TIKTOKBUSINESS = 'TIKTOKBUSINESS';
export const NETWORK_LINKEDIN_PERSONAL = 'LINKEDINPERSONAL';
export const NETWORK_INSTAGRAM_PERSONAL = 'INSTAGRAMPERSONAL';
export const NETWORK_FACEBOOK_PERSONAL = 'FACEBOOKPERSONAL';
export const NETWORK_FACEBOOK_GROUP = 'FACEBOOKGROUP';
export const NETWORK_FACEBOOK_PAGE = 'FACEBOOKPAGE';

export type DraftProps = {
  $i18n: {
    noNetwork: () => string;
    draft: () => string;
    lastEdited: () => string;
    by: () => string;
  };
  draftId: string;
  contentMap: ContentMap;
  creatorName: string;
  socialProfileIds: string[];
  lastModifiedDate: string;
  firstDraft?: boolean;
  draftMessage: {
    attachments: string[];
    text: string;
  };
};

const handleAction = async (content: Content) => {
  const timezone = await getTimezoneName();
  const socialNetworks = await getSocialNetworks();
  const socials: SocialProfile[] = Object.values(socialNetworks);
  const selectedOrganization = OrganizationsStore.getState().selectedOrganization;

  const options: EditActionHandlerParams = {
    content,
    selectedOrganization,
    timezoneName: timezone.replace(/ /g, '_'),
    socialProfiles: socials,
  };

  editActionHandler(options);
};

const Draft = ({
  draftId,
  contentMap,
  creatorName,
  socialProfileIds,
  lastModifiedDate,
  draftMessage,
  firstDraft,
  $i18n,
}: DraftProps) => {
  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([]);

  useEffect(() => {
    const draftSocialNetworks = socialProfileIds.filter(getSocialNetworkById).map(getSocialNetworkById);
    setSocialProfiles(draftSocialNetworks);
  }, [draftMessage, socialProfileIds]);

  const handleClick = async () => {
    track(TRACKING_ORIGIN_HOMEPAGE, TRACKING_EVENT_USER_CLICKS_DRAFT_CARD, {
      widgetName: WidgetName.DRAFTS,
    });
    const content: Content = contentMap[draftId];
    await handleAction(content);
  };

  const getPostTitle = (socialProfiles: SocialProfile[]) => {
    if (socialProfiles.length > 1) {
      return $i18n.draft();
    } else if (socialProfiles.length === 1) {
      return socialProfiles[0].username;
    } else {
      return $i18n.noNetwork();
    }
  };

  const onExternalLinkClick = (draftId: string, creatorName: string) => {
    track(TRACKING_ORIGIN_WIDGET_DRAFTS, TRACKING_EVENT_USER_CLICKS_POST_EXTERNAL_LINK, {
      draftId: draftId,
      creatorName: creatorName,
    });
  };

  return (
    <SocialPost
      key={draftId}
      creationDate={lastModifiedDate}
      username={getPostTitle(socialProfiles)}
      socialNetworkTypes={socialProfiles.map(sp => {
        return sp.type;
      })}
      additionalData={`${$i18n.lastEdited()}: ${parseTimeStamp(lastModifiedDate)} ${$i18n.by()} ${creatorName}`}
      images={draftMessage.attachments}
      isDraft
      showAnimation={firstDraft}
      text={draftMessage.text}
      onClickPost={handleClick}
      onExternalUrlClick={() => onExternalLinkClick(draftId, creatorName)}
    />
  );
};

export default withI18n({
  noNetwork: 'No network',
  draft: 'Draft',
  lastEdited: 'Last edited',
  by: 'by',
})(Draft);
