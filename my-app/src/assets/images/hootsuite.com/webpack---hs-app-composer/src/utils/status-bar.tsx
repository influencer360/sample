import _ from 'underscore'
import { TYPE_ERROR, TYPE_INFO, TYPE_SUCCESS, TYPE_WARNING } from 'fe-comp-banner'
import { CALLOUTS } from 'fe-comp-callout'
import { add as addCallout } from 'fe-lib-async-callouts'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import TrackingConstants from '@/constants/tracking'
import { track } from '@/utils/tracking'

/**
 * Status message object
 * - really simple right now, holds one message and it's config info
 * - to change the status call update: pass in type (error, warning, success) and the message content
 * - to clear the status/set to defaults call reset
 * - error messages stay up with a close button, others close after 5 seconds on their own
 * @constructor
 */
export class StatusObject {
  errorClass: string
  warningClass: string
  successClass: string

  constructor() {
    this.errorClass = 'error'
    this.warningClass = 'warning'
    this.successClass = 'success'
  }

  /**
   * @param message     the message to display
   * @param type        one of: error, warning, success, info
   * @param hideTimeout specify the timeout length
   */
  callOutFromStatusUpdate(
    message: string,
    type: 'error' | 'warning' | 'success' | 'info',
    hideTimeout?: number,
  ) {
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
   * @param message     the message to display
   * @param type        one of: error, warning, success, info
   * @param isAutoHide  unused parameter
   * @param hideTimeout specify the timeout length
   */
  update(
    message: string,
    type: 'error' | 'warning' | 'success' | 'info',
    isAutoHide?: boolean,
    hideTimeout?: number,
  ) {
    if (isFeatureEnabled('PUB_30004_TRACK_TOAST_ERRORS')) {
      track(
        `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}`,
        TrackingConstants.TRACKING_ACTION.TOAST_STATUS_MESSAGE_APPEARED,
        { message, type },
      )
    }
    this.callOutFromStatusUpdate(message, type, hideTimeout)
  }
}
// instantiate it
const inst = new StatusObject()

export default inst
