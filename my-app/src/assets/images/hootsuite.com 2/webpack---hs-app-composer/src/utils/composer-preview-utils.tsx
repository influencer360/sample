import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SanitizedMessage } from 'fe-pnc-data-message-previews'
import TrackingConstants from '@/constants/tracking'
import Message from '@/models/message'
import MessageUtils from '@/utils/message-utils'
import { track } from '@/utils/tracking'

const ComposerPreviewUtils = {
  /**
   * Generic Preview isn't returned from authoring so we generate it from the base message
   * @param selectedMessageForEdit
   * @returns A Preview object for the Message Preview Store
   */
  getGenericPreview: (selectedMessageForEdit: Message): SanitizedMessage => {
    const { template, linkSettings } = selectedMessageForEdit.baseMessage
    return {
      message: template ? MessageUtils.buildMessageFromTemplate(template, linkSettings, []).messageText : '',
      attachments: selectedMessageForEdit.baseMessage.attachments.map(attachment =>
        attachment.toDataObject(),
      ),
    }
  },
  trackPreviewMediaWarning: (
    socialNetworksKeyedById,
    hasSeenVideoPreviewCodecWarning: boolean,
    hasSeenVideoPreviewMimeTypeWarning: boolean,
  ) => {
    const uniqueSocialNetworkGroups = new Set()
    for (const [, profile] of socialNetworksKeyedById) {
      const { type } = profile
      uniqueSocialNetworkGroups.add(SocialProfileConstants.SN_TYPE_TO_SN_GROUP[type])
    }

    hasSeenVideoPreviewCodecWarning &&
      track(
        `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}`,
        TrackingConstants.TRACKING_ACTIONS.VIDEO_WARNINGS.HEVC_WARNING,
        { socialNetworkGroups: [...uniqueSocialNetworkGroups] },
      )

    hasSeenVideoPreviewMimeTypeWarning &&
      track(
        `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}`,
        TrackingConstants.TRACKING_ACTIONS.VIDEO_WARNINGS.MOV_WARNING,
        { socialNetworkGroups: [...uniqueSocialNetworkGroups] },
      )
  },
}

export default ComposerPreviewUtils
