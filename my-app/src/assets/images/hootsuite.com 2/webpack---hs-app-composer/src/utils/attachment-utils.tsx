import _ from 'underscore'
import { AttachmentConstants, Constants } from 'fe-pnc-constants'
import type { SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import {
  Attachment,
  GifAttachment,
  ImageAttachment,
  VideoAttachment,
  PdfAttachment,
} from 'fe-pnc-data-composer-message'
import type { ThumbnailsObject, VideoAttachmentData } from 'fe-pnc-data-composer-message'
import { extractThumbnails } from 'fe-pnc-lib-api'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import { Attachments, PostType, PublishingMode } from '@/typings/Message'

const AttachmentUtils = {
  /**
   * Groups the images (jpgs and pngs) together
   * in its own array then moves that array to
   * the front of the given attachments
   * @param {Array} attachments
   * @returns {Array}
   */
  groupImagesInAttachments(attachments) {
    const images = attachments.filter(attachment => ImageAttachment.isImageAttachment(attachment))
    const updatedAttachments = attachments.filter(
      attachment => !ImageAttachment.isImageAttachment(attachment),
    )
    if (images.length) {
      updatedAttachments.unshift(images)
    }
    return updatedAttachments
  },

  /**
   * Returns true if the media limit indicator should be displayed for the specifed social network
   * @param {Object[]} mediaAttachments An array of media attachments
   * @param {string} socialNetworkType
   * @param {number} offset Offset from media limit required, defaults to 0
   * @returns {boolean}
   */
  shouldDisplayMediaIndicator(mediaAttachments, socialNetworkType, offset = 0) {
    const mediaLimit = AttachmentConstants.MEDIA_LIMIT[socialNetworkType]
    if (mediaAttachments.length < mediaLimit + offset) {
      return false
    }
    return !!mediaAttachments[mediaLimit - 1]?.thumbnailUrl
  },

  /**
   * Returns the number of image attachments in an attachments array
   * @param {Object[]} attachments An array of media attachments
   * @returns {number}
   */
  getNumImages(attachments: Array<Attachment>): number {
    let numImages = 0
    attachments.forEach(attachment => {
      ImageAttachment.isImageAttachment(attachment) && numImages++
    })
    return numImages
  },

  /**
   * Returns the number of video or gif attachments in an attachments array
   * @param {Object[]} attachments An array of media attachments
   * @returns {number}
   */
  getNumVideos(attachments: Array<Attachment>): number {
    let numVideos = 0
    attachments.forEach(attachment => {
      if (VideoAttachment.isVideoAttachment(attachment) || GifAttachment.isGifAttachment(attachment)) {
        numVideos++
      }
    })
    return numVideos
  },

  /**
   * Returns true if only attachment is PDF
   * @param {Object[]} attachments An array of media attachments
   * @returns {number}
   */
  hasPdf(attachments: Array<Attachment>): boolean {
    //Only 1 PDF is allowed and no mixed media
    const hasPdf = isFeatureEnabledOrBeta('PUB_30723_LINKEDIN_PDF')
      ? !!(attachments && PdfAttachment.isPdfAttachment(attachments[0]))
      : undefined
    return hasPdf
  },
  /**
   * Set selectedNetworkGroup on attachment to undefined after it is attached to SN.
   * It's done to differentiate existing attachments from the ones that are being uploaded
   * @param {Object[]} attachments An array of media attachments
   */
  resetSelectedNetworkGroup(attachments: Attachments): void {
    Array.isArray(attachments) &&
      attachments?.forEach(attachment => {
        if (typeof attachment === 'object') {
          if (attachment.selectedNetworkGroup !== undefined) {
            attachment.selectedNetworkGroup = undefined
          }
        }
      })
  },

  /**
   * Returns the number of video or gif attachments in an attachments array
   * @param {Object[]} attachments An array of media attachments
   * @param {string} selectedNetworkGroupOnUpload A social network group that was selected on media upload start
   * @returns {Object[]} Array of attachments that are being uploaded
   */
  retrieveUploadingAttachments(
    attachments: Attachments,
    selectedNetworkGroupOnUpload: SocialNetworkGroup,
  ): Attachments {
    return attachments.filter(attachment =>
      _.isNull(selectedNetworkGroupOnUpload)
        ? _.isNull(attachment.selectedNetworkGroup)
        : attachment.selectedNetworkGroup === selectedNetworkGroupOnUpload,
    )
  },

  /**
   * Returns video attachment with thumbnails
   * @param {Object} attachment Video attachment
   */
  async extractVideoThumbnails(attachment: VideoAttachmentData): Promise<VideoAttachmentData> {
    const thumbnailUrls = []
    await extractThumbnails({ videoUrl: attachment.url, offsetsInMilliseconds: [0] }).then(
      ({ thumbnails }: ThumbnailsObject) => {
        thumbnails.forEach(thumbnail => {
          thumbnailUrls.push({
            thumbnailOffset: thumbnail.offset,
            thumbnailUrl: thumbnail.url,
          })
        })
      },
    )
    return _.extend(attachment, {
      thumbnailUrls: thumbnailUrls ?? null,
      thumbnailUrl: thumbnailUrls?.[0]?.thumbnailUrl ?? null,
    })
  },

  /**
   * Determines if media should be stored and sent as boards
   * Boards should only used by Instagram Stories with Push Publishing
   */
  shouldUseBoards(postType: PostType, publishingMode: PublishingMode) {
    return (
      postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY &&
      publishingMode === Constants.INSTAGRAM_PUBLISHING_MODES.PUSH_PUBLISH
    )
  },
}

export default AttachmentUtils
