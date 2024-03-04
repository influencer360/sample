import { fetchDrafts } from 'api/Api';
import { ContentConstants } from 'constants/content';
import { Content } from 'typings/Content';
import { Organization } from 'typings/Organization';
import { SocialProfile } from 'typings/SocialProfile';
import { openComposerInEditMode } from './composer';
import ContentUtils from './content-utils';

export interface EditActionHandlerParams {
  content: Content;
  selectedOrganization: Organization;
  timezoneName: string;
  socialProfiles: Array<SocialProfile>;
}

interface HandleActionParams {
  content: Content;
  callback: (content: Record<string, any>) => void;
  timezoneName: string;
  socialProfiles: Array<SocialProfile>;
}

export const editActionHandler = ({
  content,
  selectedOrganization,
  timezoneName,
  socialProfiles,
}: EditActionHandlerParams) => {
  const editAction = (content: Record<string, any>) => {
    openComposerInEditMode({
      content,
      selectedOrganization,
      timezoneName,
    });
  };

  return handleAction({ callback: editAction, content, timezoneName, socialProfiles });
};

export const handleAction = ({ content, callback, timezoneName, socialProfiles }: HandleActionParams) => {
  return fetchDrafts(content).then((content: Content) => {
    const transformedContent =
      content?.draft?.draftMessage?.messageType === ContentConstants.DRAFT_MESSAGE_TYPE
        ? ContentUtils.transformDraftDataToPlannerContentObject({
            content,
            socialProfiles,
            timezoneName,
          })
        : content;
    callback(transformedContent);
  });
};
