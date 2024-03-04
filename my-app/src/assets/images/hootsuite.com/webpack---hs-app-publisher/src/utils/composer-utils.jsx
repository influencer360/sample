/**
 * @format
 * @preventMunge
 */

import _ from 'underscore'

import MediaUploadConstants from 'hs-nest/lib/constants/media-upload'
import Constants from '../constants/constants'
import AttachmentConstants from '../constants/attachments'
import VideoAttachment from '../models/video-attachment'
import ImageAttachment from '../models/image-attachment'
import GifAttachment from '../models/gif-attachment'
import darklaunch from 'hs-nest/lib/utils/darklaunch'

const ComposerUtils = {
  /**
   * Return `true` if a given date object is >= minimumScheduleMinutes
   *
   * @param {Date} date
   * @param {Number} minimumScheduleMinutes
   * @return {Boolean}
   */
  validateDateTime(date, minimumScheduleMinutes) {
    let minutesRemaining =
      (date - new Date()) /
      Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS /
      Constants.DATE_TIME.NUM_SECONDS_IN_MINUTE
    return minutesRemaining >= minimumScheduleMinutes
  },

  /**
   * Returns if an attachment is a video
   * @param {{}} attachment
   * @returns {boolean}
   */
  isVideoAttachment(attachment) {
    if (attachment.className && attachment.className === AttachmentConstants.CLASS_NAMES.VIDEO) {
      return true
    } else {
      return (
        _.isObject(attachment) &&
        _.isString(attachment.mimeType) &&
        _.contains(MediaUploadConstants.ACCEPTED_MIME_TYPES.VIDEO, attachment.mimeType.toLowerCase())
      )
    }
  },

  /**
   * Returns if an attachment is a gif
   * @param {{}} attachment
   * @returns {boolean}
   */
  isGifAttachment(attachment) {
    if (attachment.className && attachment.className === AttachmentConstants.CLASS_NAMES.GIF) {
      return true
    } else if (_.isObject(attachment) && _.isString(attachment.mimeType)) {
      return attachment.mimeType.toLowerCase() === 'image/gif'
    } else {
      if (_.isObject(attachment) && _.isString(attachment.url)) {
        const url = attachment.url.split('?')[0]
        return url.slice(-4) === '.gif'
      } else {
        return false
      }
    }
  },

  /**
   * Returns if an attachment is a image (not including gifs)
   * @param {{}} attachment
   * @returns {boolean}
   */
  isImageAttachment(attachment) {
    if (attachment.className && attachment.className === AttachmentConstants.CLASS_NAMES.IMAGE) {
      return true
    }

    const imageMimeTypes = MediaUploadConstants.ACCEPTED_MIME_TYPES.IMAGE.filter(
      mimeType => mimeType !== 'image/gif',
    )
    if (_.isObject(attachment) && _.isString(attachment.mimeType)) {
      return _.contains(imageMimeTypes, attachment.mimeType.toLowerCase())
    } else {
      if (_.isObject(attachment) && _.isString(attachment.url)) {
        const url = attachment.url.split('?')[0]
        return imageMimeTypes.some(
          mimeType =>
            `.${mimeType.split('/')[1]}` === url.slice(-4) || `.${mimeType.split('/')[1]}` === url.slice(-5),
        )
      } else {
        return false
      }
    }
  },

  /**
   * Returns an attachment object of the right type if the data fits into one of the types
   * @param {{}} data
   * @return {null|{}}
   */
  createAttachmentFromData(data) {
    let attachment = null
    if (this.isVideoAttachment(data)) {
      attachment = new VideoAttachment(data)
    } else if (this.isGifAttachment(data)) {
      attachment = new GifAttachment(data)
    } else if (this.isImageAttachment(data)) {
      attachment = new ImageAttachment(data)
    }

    return attachment
  },

  /**
   * Returns whether or not the user is in the Statefarm org
   * @param {int} orgId
   * @return {boolean}
   */
  isStateFarm(orgId) {
    // TODO: when PUB_12938_STATE_FARM_NC_URL_PARAMS and PUB_12938_STATE_FARM_ORG_ID_PASSTHROUGH is removed, replace the below getFeatureValue with a constant value for the organizationId
    return (
      parseInt(orgId, 10) ===
      parseInt(darklaunch.getFeatureValue('PUB_12938_STATE_FARM_ORG_ID_PASSTHROUGH'), 10)
    )
  },

  isDraft(messageType) {
    return messageType === Constants.TYPE.DRAFT
  },

  isInstagramStory(postType) {
    const postTypeString = postType && typeof postType === 'object' ? postType.postType : postType
    return postTypeString === Constants.INSTAGRAM_POST_TYPES.IG_STORY
  },

  isPushPublishing(publishingMode) {
    const publishingModeString =
      publishingMode && typeof publishingMode === 'object' ? publishingMode.mode : publishingMode
    return publishingModeString === Constants.INSTAGRAM_PUBLISHING_MODES.PUSH_PUBLISH
  },
}

export default ComposerUtils
