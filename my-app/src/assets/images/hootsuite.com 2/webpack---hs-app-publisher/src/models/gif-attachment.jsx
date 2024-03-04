/**
 * @format
 * @preventMunge
 */

import _ from 'underscore'
import ImageAttachment from './image-attachment'
import AttachmentConstants from '../constants/attachments'

/**
 * Gif Attachments are just a wrapper of image attachments
 */
export default class GifAttachment extends ImageAttachment {
  /**
   * @param {{
   *   bytes: ?number,
   *   fileName: ?string,
   *   fileSource: ?string,
   *   mimeType: ?string,
   *   thumbnailUrl: string,
   *   url: string,
   * }} data
   */
  constructor(data) {
    const attachment = data ? _.clone(data) : {}
    super(attachment, ImageAttachment.FIELD_VALIDATION)

    this.className = AttachmentConstants.CLASS_NAMES.GIF

    // Seal the object so property values can be changed, but properties can't be added/removed
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal
    Object.seal(this)
  }
}

// Expose static constants without making them mutable in the class
GifAttachment.FIELDS = ImageAttachment.FIELDS
GifAttachment.FIELD_VALIDATION = ImageAttachment.FIELD_VALIDATION
