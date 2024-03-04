/**
 * @format
 * @preventMunge
 */

import _ from 'underscore'
import Attachment from './attachment'
import AttachmentConstants from '../constants/attachments'

// Validators throw an error if a required field is missing or a field is the wrong type
const FIELD_VALIDATION = {
  audioChannels: function(audioChannels) {
    if (!_.isNull(audioChannels) && !_.isUndefined(audioChannels) && !_.isNumber(audioChannels)) {
      throw new TypeError('VideoAttachment field audioChannels must be of type {number}')
    }
  },
  audioCodec: function(audioCodec) {
    if (
      !_.isNull(audioCodec) &&
      !_.isUndefined(audioCodec) &&
      !_.isString(audioCodec) &&
      !_.isNull(audioCodec)
    ) {
      throw new TypeError('VideoAttachment field audioCodec must be of type {string}')
    }
  },
  bytes: function(bytes) {
    if (!_.isNull(bytes) && !_.isUndefined(bytes) && !_.isNumber(bytes)) {
      throw new TypeError('VideoAttachment field bytes must be of type {number}')
    }
  },
  displayAspectRatio: function(displayAspectRatio) {
    if (
      !_.isNull(displayAspectRatio) &&
      !_.isUndefined(displayAspectRatio) &&
      !_.isString(displayAspectRatio)
    ) {
      throw new TypeError('VideoAttachment field displayAspectRatio must be of type {string}')
    }
  },
  durationInSec: function(durationInSec) {
    if (!_.isNull(durationInSec) && !_.isUndefined(durationInSec) && !_.isNumber(durationInSec)) {
      throw new TypeError('VideoAttachment field durationInSec must be of type {number}')
    }
  },
  fileName: function(fileName) {
    if (!_.isNull(fileName) && !_.isUndefined(fileName) && !_.isString(fileName)) {
      throw new TypeError('VideoAttachment field fileName must be of type {string}')
    }
  },
  frameRate: function(frameRate) {
    if (!_.isNull(frameRate) && !_.isUndefined(frameRate) && !_.isNumber(frameRate)) {
      throw new TypeError('VideoAttachment field frameRate must be of type {number}')
    }
  },
  fileSource: function(fileSource) {
    if (!_.isNull(fileSource) && !_.isUndefined(fileSource) && !_.isString(fileSource)) {
      throw new TypeError('VideoAttachment field fileSource must be of type {string}')
    }
  },
  height: function(height) {
    if (!_.isNull(height) && !_.isUndefined(height) && !_.isNumber(height)) {
      throw new TypeError('VideoAttachment field height must be of type {number}')
    }
  },
  mimeType: function(mimeType) {
    if (!_.isString(mimeType)) {
      throw new TypeError('VideoAttachment missing required field mimeType {string}')
    }
  },
  thumbnailUrl: function(thumbnailUrl) {
    if (!_.isNull(thumbnailUrl) && !_.isUndefined(thumbnailUrl) && !_.isString(thumbnailUrl)) {
      throw new TypeError('VideoAttachment field thumbnailUrl must be of type {string}')
    }
  },
  thumbnailUrls: function(thumbnailUrls) {
    if (!_.isArray(thumbnailUrls)) {
      throw new TypeError('VideoAttachment missing required field thumbnailUrls {array}')
    } else {
      _.each(thumbnailUrls, function(thumbnail) {
        if (
          !_.isNull(thumbnail.thumbnailId) &&
          !_.isUndefined(thumbnail.thumbnailId) &&
          !_.isString(thumbnail.thumbnailId)
        ) {
          throw new TypeError('VideoAttachment field thumbnailId must be of type {string}')
        } else if (!_.isString(thumbnail.thumbnailUrl)) {
          throw new TypeError('VideoAttachment missing required field thumbnailUrl {string}')
        }
      })
    }
  },
  trackingSource: function(trackingSource) {
    if (!_.isNull(trackingSource) && !_.isUndefined(trackingSource) && !_.isString(trackingSource)) {
      throw new TypeError('VideoAttachment field trackingSource must be of type {string}')
    }
  },
  url: function(url) {
    if (!_.isString(url)) {
      throw new TypeError('VideoAttachment missing required field url {string}')
    }
  },
  userMetadata: function(userMetadata) {
    if (
      (!_.isNull(userMetadata) && !_.isUndefined(userMetadata) && !_.isObject(userMetadata)) ||
      (_.isObject(userMetadata) && !_.isString('title'))
    ) {
      throw new TypeError('VideoAttachment missing field userMetadata.title {string}')
    }
  },
  videoCodec: function(videoCodec) {
    if (!_.isNull(videoCodec) && !_.isUndefined(videoCodec) && !_.isString(videoCodec)) {
      throw new TypeError('VideoAttachment field videoCodec must be of type {string}')
    }
  },
  width: function(width) {
    if (!_.isNull(width) && !_.isUndefined(width) && !_.isNumber(width)) {
      throw new TypeError('VideoAttachment field width must be of type {number}')
    }
  },
}

const FIELDS = Object.keys(FIELD_VALIDATION)

export default class VideoAttachment extends Attachment {
  /**
   * @param {{
   *   audioChannels: ?number,
   *   audioCodec: ?string,
   *   bytes: ?number,
   *   displayAspectRatio: ?string,
   *   durationInSec: ?number,
   *   fileName: ?string,
   *   frameRate: ?number,
   *   fileSource: ?string,
   *   height: ?number,
   *   mimeType: string,
   *   thumbnailUrl: ?string,
   *   thumbnailUrls: {
   *     thumbnailId: string,
   *     thumbnailUrl: string,
   *   }[],
   *   url: string,
   *   videoCodec: ?string,
   *   width: ?number,
   *   userMetadata: ?{
   *     title: string,
   *   }
   * }} data
   */
  constructor(data) {
    let attachment = data ? _.clone(data) : {}

    // Any optional properties need to be defined before the object is sealed
    attachment.audioChannels = data.audioChannels || null
    attachment.audioCodec = data.audioCodec || null
    attachment.bytes = data.bytes || null
    attachment.displayAspectRatio = data.displayAspectRatio || null
    attachment.durationInSec = data.durationInSec || null
    attachment.durationInSec = data.durationInSec || null
    attachment.fileName = data.fileName || null
    attachment.frameRate = data.frameRate || null
    attachment.fileSource = data.fileSource || null
    attachment.height = data.height || null
    attachment.thumbnailUrl = data.thumbnailUrl || null
    attachment.thumbnailUrls = data.thumbnailUrls || []
    attachment.videoCodec = data.videoCodec || null
    attachment.width = data.width || null
    attachment.trackingSource = data.trackingSource || null
    attachment.userMetadata = data.userMetadata || null

    super(attachment, FIELD_VALIDATION)

    this.className = AttachmentConstants.CLASS_NAMES.VIDEO

    // Seal the object so property values can be changed, but properties can't be added/removed
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal
    Object.seal(this)
  }

  /**
   * @returns {number}
   */
  get audioChannels() {
    return this.getField('audioChannels')
  }

  /**
   * @param {number} v
   */
  set audioChannels(v) {
    this.setReadOnlyField('audioChannels', v)
  }

  /**
   * @returns {string}
   */
  get audioCodec() {
    return this.getField('audioCodec')
  }

  /**
   * @param {string} v
   */
  set audioCodec(v) {
    this.setReadOnlyField('audioCodec', v)
  }

  /**
   * @returns {number}
   */
  get bytes() {
    return this.getField('bytes')
  }

  /**
   * @param {number} v
   */
  set bytes(v) {
    this.setReadOnlyField('bytes', v)
  }

  /**
   * @returns {string}
   */
  get displayAspectRatio() {
    return this.getField('displayAspectRatio')
  }

  /**
   * @param {string} v
   */
  set displayAspectRatio(v) {
    this.setReadOnlyField('displayAspectRatio', v)
  }

  /**
   * @returns {number}
   */
  get durationInSec() {
    return this.getField('durationInSec')
  }

  /**
   * @param {number} v
   */
  set durationInSec(v) {
    this.setReadOnlyField('durationInSec', v)
  }

  /**
   * @returns {string}
   */
  get fileName() {
    return this.getField('fileName')
  }

  /**
   * @param {string} v
   */
  set fileName(v) {
    this.setReadOnlyField('fileName', v)
  }

  /**
   * @returns {number}
   */
  get frameRate() {
    return this.getField('frameRate')
  }

  /**
   * @param {number} v
   */
  set frameRate(v) {
    this.setReadOnlyField('frameRate', v)
  }

  /**
   * @returns {?string}
   */
  get fileSource() {
    return this.getField('fileSource')
  }

  /**
   * @param {?string} v
   */
  set fileSource(v) {
    this.setField('fileSource', v)
  }

  /**
   * @returns {number}
   */
  get height() {
    return this.getField('height')
  }

  /**
   * @param {number} v
   */
  set height(v) {
    this.setReadOnlyField('height', v)
  }

  /**
   * @returns {string}
   */
  get mimeType() {
    return this.getField('mimeType')
  }

  /**
   * @param {string} v
   */
  set mimeType(v) {
    this.setReadOnlyField('mimeType', v)
  }

  /**
   * @returns {string}
   */
  get thumbnailUrl() {
    return this.getField('thumbnailUrl')
  }

  /**
   * @param {string} v
   */
  set thumbnailUrl(v) {
    this.setField('thumbnailUrl', v)
  }

  /**
   * @returns {{
   *   thumbnailId: string,
   *   thumbnailUrl: string,
   * }[]} v
   */
  get thumbnailUrls() {
    return this.getField('thumbnailUrls')
  }

  /**
   * @param {{
   *   thumbnailId: string,
   *   thumbnailUrl: string,
   * }[]} v
   */
  set thumbnailUrls(v) {
    this.setField('thumbnailUrls', v)
  }

  /**
   * @returns {?string}
   */
  get trackingSource() {
    return this.getField('trackingSource')
  }

  /**
   * @param {?string} v
   */
  set trackingSource(v) {
    this.setField('trackingSource', v)
  }

  /**
   * @returns {string}
   */
  get url() {
    return this.getField('url')
  }

  /**
   * @param {string} v
   */
  set url(v) {
    this.setReadOnlyField('url', v)
  }

  /**
   * @returns {string}
   */
  get videoCodec() {
    return this.getField('videoCodec')
  }

  /**
   * @param {string} v
   */
  set videoCodec(v) {
    this.setReadOnlyField('videoCodec', v)
  }

  /**
   * @returns {number}
   */
  get width() {
    return this.getField('width')
  }

  /**
   * @param {number} v
   */
  set width(v) {
    this.setReadOnlyField('width', v)
  }

  /**
   * @returns {?{
   *   title: string,
   * }} v
   */
  get userMetadata() {
    return this.getField('userMetadata')
  }

  /**
   * @param {?{
   *   title: string,
   * }} v
   */
  set userMetadata(v) {
    this.setField('userMetadata', v)
  }

  /**
   * Gets an object with all the fields with out the prefix _. Used for making requests.
   * @return {{
   *   audioChannels: ?number,
   *   audioCodec: ?string,
   *   bytes: ?number,
   *   displayAspectRatio: ?string,
   *   durationInSec: ?number,
   *   fileName: ?string,
   *   frameRate: ?number,
   *   fileSource: ?string,
   *   height: ?number,
   *   mimeType: string,
   *   thumbnailUrl: ?string,
   *   thumbnailUrls: {
   *     thumbnailId: string,
   *     thumbnailUrl: string,
   *   }[],
   *   trackingSource: ?string,
   *   url: string,
   *   videoCodec: ?string,
   *   width: ?number,
   *   videoOptions: ?{
   *     facebook: {
   *       title: string
   *     }
   *   }
   * }}
   */
  toRequestObject() {
    const data = this.toDataObject()
    data.videoOptions = data.userMetadata
    if (data.videoOptions) {
      data.videoOptions.facebook = { title: data.videoOptions.title }
      delete data.videoOptions.title
    }
    delete data.userMetadata
    return data
  }
}

// Expose static constants without making them mutable in the class
VideoAttachment.FIELDS = FIELDS
VideoAttachment.FIELD_VALIDATION = FIELD_VALIDATION
