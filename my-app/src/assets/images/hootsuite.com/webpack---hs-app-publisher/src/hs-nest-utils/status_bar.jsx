/** @format */

import _ from 'underscore'
import { add as addCallout } from 'fe-lib-async-callouts'
import { CALLOUTS } from 'fe-comp-callout'
import { TYPE_ERROR, TYPE_SUCCESS, TYPE_INFO, TYPE_WARNING } from 'fe-comp-banner'

/**
 * Status message object
 * - really simple right now, holds one message and it's config info
 * - to change the status call update: pass in type (error, warning, success) and the message content
 * - to clear the status/set to defaults call reset
 * - error messages stay up with a close button, others close after 5 seconds on their own
 * @constructor
 */
class StatusObject {
  constructor() {
    this.errorClass = 'error'
    this.warningClass = 'warning'
    this.successClass = 'success'
  }

  /**
   * @param {String}  message     the message to display
   * @param {String}  type        one of: error, warning, success, info
   * @param {Number?} hideTimeout specify the timeout length
   */
  callOutFromStatusUpdate(message, type, hideTimeout) {
    if (_.isNaN(hideTimeout)) {
      hideTimeout = 5000
    }

    let bannerType = TYPE_INFO
    switch (type) {
      case this.errorClass:
        bannerType = TYPE_ERROR
        break
      case this.warningClass:
        bannerType = TYPE_WARNING
        break
      case this.successClass:
        bannerType = TYPE_SUCCESS
        break
      default:
        bannerType = TYPE_INFO
        break
    }

    addCallout({
      calloutType: CALLOUTS.STATUS.NAME,
      type: bannerType,
      messageText: message,
      timeout: hideTimeout,
    })
  }

  /**
   * @param {String}   message     the message to display
   * @param {String}   type        one of: error, warning, success, info
   * @param {Boolean?} isAutoHide  unused parameter
   * @param {Number?}  hideTimeout specify the timeout length
   */
  update(message, type, isAutoHide, hideTimeout) {
    this.callOutFromStatusUpdate(message, type, hideTimeout)
  }
}
// instantiate it
const inst = new StatusObject()

export default inst
