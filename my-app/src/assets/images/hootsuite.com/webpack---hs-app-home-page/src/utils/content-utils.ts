import { isAfter } from 'date-fns';
import { getNow, getDateFromUTC } from 'fe-pnc-lib-date-utils';
import translation from 'fe-pnc-lib-hs-translation';
import { ContentConstants } from 'constants/content';
import { Content } from 'typings/Content';

const THUMBNAIL_SIZE = {
  LARGE: 'LARGE',
  SMALL: 'SMALL',
} as const;

export default {
  /**
   * Converts a draft to content object
   */
  transformDraftDataToPlannerContentObject({
    content,
    socialProfiles,
    timezoneName,
  }: {
    content: Record<string, any>;
    socialProfiles: Array<any>;
    timezoneName?: string;
  }): any {
    const draft = content?.draft;
    const msg = (draft && draft.message) || (draft && draft.data);
    const getValidSocialProfileId = (draftSocialProfiles: any[], socialProfilesForUser: any[]) => {
      return draftSocialProfiles.find(
        (contentSocialProfile: any) =>
          !!socialProfilesForUser.find((sp: { socialProfileId: any }) => sp.socialProfileId == contentSocialProfile),
      ); // draftSocialProfiles is number on load, string on clicking a card
    };
    // get network-specific message instead of initial content if multiple networks of the same type are selected
    const getMessageText = (messages: any[]) => {
      const isSameSNTypeSelected = this.isSameSNTypeSelected(content?.socialProfileIds, socialProfiles);
      return isSameSNTypeSelected && messages[0]?.message ? messages[0].message : msg.text;
    };

    if (msg) {
      let media = null;
      const { attachments = [], messages = [] } = msg;
      const snType = messages[0]?.snType;
      if (attachments && attachments.length > 0) {
        media = attachments.map(
          (a: {
            mimeType: any;
            thumbnailUrl: any;
            url: any;
            height: any;
            width: any;
            bytes: any;
            durationInSec: any;
            displayAspectRatio: any;
            altText: any;
            subtitles: any;
            productTags: any;
            videoCodec: any;
          }) => ({
            contentType: a.mimeType,
            thumbnailUrl: a.thumbnailUrl,
            url: a.url,
            height: a.height,
            width: a.width,
            mimeType: a.mimeType,
            bytes: a.bytes,
            durationInSec: a.durationInSec || null,
            displayAspectRatio: a.displayAspectRatio || null,
            altText: a.altText,
            subtitles: a.subtitles,
            productTags: a.productTags,
            videoCodec: a.videoCodec,
          }),
        );
      }
      let linkPreview = null;
      if (typeof msg.urlPreview === 'object' && msg.urlPreview) {
        linkPreview = {
          contentType: 'image/jpeg',
          description: msg.urlPreview.description,
          originalUrl: msg.urlPreview.originalUrl,
          // A post can only have one link preview. Also, there's no thumbnail size for
          // Twitter link previews. In that case, we default the thumbnail size to LARGE.
          thumbnailSize: messages?.[0]?.linkPreview?.thumbnailSize || THUMBNAIL_SIZE.LARGE,
          thumbnailUrl: msg.urlPreview.thumbnailUrl,
          title: msg.urlPreview.title,
          url: msg.urlPreview.url,
        };
      }
      let socialProfileId = null;
      let socialProfileIds = [];
      if (content.socialProfileIds && content.socialProfileIds.length > 0) {
        if (socialProfiles) {
          socialProfileId = getValidSocialProfileId(content.socialProfileIds, socialProfiles);
        } else {
          socialProfileId = content.socialProfileIds[0];
        }
        socialProfileIds = content.socialProfileIds;
      } else if (draft.socialProfileIds && draft.socialProfileIds.length > 0) {
        if (socialProfiles) {
          socialProfileId = getValidSocialProfileId(draft.socialProfileIds, socialProfiles);
        } else {
          socialProfileId = draft.socialProfileIds[0];
        }
        socialProfileIds = draft.socialProfileIds;
      }
      let state: string = ContentConstants.STATE.DRAFT;
      const startDate = draft.scheduledDate || content.startDate;
      if (timezoneName && startDate) {
        const currentDateTime = getNow(timezoneName);
        const startDateTime = getDateFromUTC(startDate, timezoneName);
        if (isAfter(currentDateTime, startDateTime)) {
          state = ContentConstants.STATE.PASTDRAFT;
        }
      }

      const message = {
        campaignId: msg.campaignId,
        hasProductTags: draft.hasProductTags,
        isBoosted: msg.isBoosted || false,
        linkPreview,
        media,
        message: getMessageText(messages),
        socialProfileId,
        socialProfileIds,
        state,
      };

      let mentions = [];
      if (msg.messages && msg.messages.length && msg.messages[0].mentions) {
        mentions = msg.messages[0].mentions;
      }

      const postType = this.getInstagramPostType(msg);

      return {
        attachments: media,
        boostCampaign: draft.boostCampaign || null,
        contentType: ContentConstants.TYPE.DRAFT,
        createdByMember: {
          id: draft.creatorId,
          name: draft.creatorName || translation._('Unknown'),
        },
        id: draft.id || content.id,
        linkPreview,
        mentions,
        message,
        permissions: {
          canEdit:
            content.writePermissions || content?.permissions?.canEdit || content?.draft?.permissions?.canEdit || false,
          canDelete:
            content.writePermissions ||
            content?.permissions?.canEdit ||
            content?.draft?.permissions?.canDelete ||
            false,
          canApprove: content?.draft?.permissions?.canApprove || content?.permissions?.canEdit || false,
        },
        postType,
        privacy: msg.privacy || null,
        publisherNotes: msg.publisherNotes || null,
        scheduledSendTime: startDate,
        snType,
        startDate,
        state: ContentConstants.STATE.DRAFT,
        tags: Array.isArray(msg.tags) && msg.tags.length ? msg.tags.map((t: { name: any }) => t.name) : null,
        text: msg.text,
        creator: draft.creator,
        creationDate: draft.creationDate,
      };
    }
    return {};
  },

  shouldContentRequestHistory(content: Content) {
    const state = content?.state || content?.message?.state;
    switch (state) {
      case ContentConstants.STATE.SCHEDULED:
      case ContentConstants.STATE.SENT:
      case ContentConstants.STATE.EXPIRED_APPROVAL:
      case ContentConstants.STATE.PENDING_APPROVAL:
      case ContentConstants.STATE.PENDING_PRESCREEN:
      case ContentConstants.STATE.REJECTED_PRESCREEN:
      case ContentConstants.STATE.REJECTED_APPROVAL: {
        return true;
      }
      default: {
        return false;
      }
    }
  },

  /**
   * Returns the Instagram Post type of a message
   */
  getInstagramPostType(msg: Record<string, any>): 'IG_FEED' | 'IG_STORY' | string {
    const { INSTAGRAM, INSTAGRAMBUSINESS } = ContentConstants.POST_TYPES;
    if (msg?.postTypes) {
      if (msg.postTypes[INSTAGRAM]) {
        return msg.postTypes[INSTAGRAM].postType;
      }
      if (msg.postTypes[INSTAGRAMBUSINESS]) {
        return msg.postTypes[INSTAGRAMBUSINESS].postType;
      }
    }
    // postType can be a string or nested in { postType: { postType: string }}
    if (msg?.postType && typeof msg.postType.postType === 'string') {
      return msg.postType.postType;
    }
    if (typeof msg?.postType === 'string') {
      return msg.postType;
    }
    return ContentConstants.INSTAGRAM_POST_TYPE.IG_FEED;
  },

  /**
   * Returns whether social profiles selected belong to the same SN type
   */
  isSameSNTypeSelected(socialProfileIds: Array<string>, socialProfiles: Array<any>) {
    const socialProfileTypesSelected = socialProfileIds?.map(
      sp => socialProfiles?.find(socialProfile => sp === socialProfile.socialNetworkId.toString())?.type,
    );
    return new Set(socialProfileTypesSelected).size === 1;
  },
};
