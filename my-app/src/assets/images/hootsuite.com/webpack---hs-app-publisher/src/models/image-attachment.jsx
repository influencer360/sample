/**
 * @format
 * @preventMunge
 */

import _ from 'underscore'
import Attachment from './attachment'
import AttachmentConstants from '../constants/attachments'

// Validators throw an error if a required field is missing or a field is the wrong type
const FIELD_VALIDATION = {
  bytes: function(bytes) {
    if (!_.isNull(bytes) && !_.isUndefined(bytes) && !_.isNumber(bytes)) {
      throw new TypeError('ImageAttachment field bytes must be of type {number}')
    }
  },
  fileName: function(fileName) {
    if (!_.isNull(fileName) && !_.isUndefined(fileName) && !_.isString(fileName)) {
      throw new TypeError('ImageAttachment field fileName must be of type {string}')
    }
  },
  fileSource: function(fileSource) {
    if (!_.isNull(fileSource) && !_.isUndefined(fileSource) && !_.isString(fileSource)) {
      throw new TypeError('ImageAttachment field fileSource must be of type {string}')
    }
  },
  height: function(height) {
    if (!_.isNull(height) && !_.isUndefined(height) && !_.isNumber(height)) {
      throw new TypeError('ImageAttachment field height must be of type {number}')
    }
  },
  mimeType: function(mimeType) {
    if (!_.isNull(mimeType) && !_.isUndefined(mimeType) && !_.isString(mimeType)) {
      throw new TypeError('ImageAttachment field mimeType must be of type {string}')
    }
  },
  thumbnailUrl: function(thumbnailUrl) {
    if (!_.isString(thumbnailUrl)) {
      throw new TypeError('ImageAttachment missing required field thumbnailUrl {string}')
    }
  },
  trackingSource: function(trackingSource) {
    if (!_.isNull(trackingSource) && !_.isUndefined(trackingSource) && !_.isString(trackingSource)) {
      throw new TypeError('ImageAttachment field trackingSource must be of type {string}')
    }
  },
  url: function(url) {
    if (!_.isString(url)) {
      throw new TypeError('ImageAttachment missing required field url {string}')
    }
  },
  width: function(width) {
    if (!_.isNull(width) && !_.isUndefined(width) && !_.isNumber(width)) {
      throw new TypeError('ImageAttachment field width must be of type {number}')
    }
  },
  xhrRequest: function(xhrRequest) {
    if (!_.isNull(xhrRequest) && !_.isObject(xhrRequest)) {
      throw new TypeError('ImageAttachment field xhrRequest must be of type {object}')
    }
  },
  altText: function(altText) {
    if (altText !== null && typeof altText !== 'undefined' && typeof altText !== 'string') {
      throw new TypeError('ImageAttachment field altText must be of type {string}')
    }
  },
}

const FIELDS = Object.keys(FIELD_VALIDATION)

export default class ImageAttachment extends Attachment {
  /**
   * @param {{
   *   bytes: ?number,
   *   fileName: ?string,
   *   fileSource: ?string,
   *   height: ?number,
   *   mimeType: ?string,
   *   thumbnailUrl: string,
   *   trackingSource: ?string,
   *   url: string,
   *   width: ?number,
   *   xhrRequest: ?object,
   *   altText: ?string
   * }} data
   */
  constructor(data) {
    let attachment = data ? _.clone(data) : {}

    // Any optional properties need to be defined before the object is sealed
    attachment.fileSource = data.fileSource || null
    attachment.fileName = data.fileName || null
    attachment.bytes = data.bytes || null
    attachment.height = data.height || null
    attachment.mimeType = data.mimeType || null
    attachment.trackingSource = data.trackingSource || null
    attachment.width = data.width || null
    attachment.xhrRequest = data.xhrRequest || null
    attachment.altText = data.altText || null

    super(attachment, FIELD_VALIDATION)

    this.className = AttachmentConstants.CLASS_NAMES.IMAGE

    // Seal the object so property values can be changed, but properties can't be added/removed
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal
    Object.seal(this)
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
    this.setReadOnlyField('thumbnailUrl', v)
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
   * @returns {?object}
   */
  get xhrRequest() {
    return this.getField('xhrRequest')
  }

  /**
   * @param {?object} v
   */
  set xhrRequest(v) {
    this.setField('xhrRequest', v)
  }

  /**
   * @returns {string}
   */
  get altText() {
    return this.getField('altText')
  }

  /**
   * @param {string} v
   */
  set altText(v) {
    this.setField('altText', v)
  }

  /**
   * Gets an object with all the fields with out the prefix _. Used for making requests.
   * @return {{
   *   bytes: ?number,
   *   fileName: ?string,
   *   fileSource: ?string,
   *   mimeType: ?string,
   *   thumbnailUrl: string,
   *   url: string,
   * }}
   */
  toRequestObject() {
    let dataObject = this.toDataObject()
    delete dataObject.xhrRequest
    return dataObject
  }
}

// Expose static constants without making them mutable in the class
ImageAttachment.FIELDS = FIELDS
ImageAttachment.FIELD_VALIDATION = FIELD_VALIDATION
