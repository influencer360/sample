/**
 * @format
 * @preventMunge
 */

import FrontendService from './frontend-service'
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'
import AbortablePromise from 'hs-nest/lib/utils/abortable-promise'

function service() {
  return FrontendService({
    //Purpose of this service is to update Mongo to indicate a popup has been seen.
    //This service does not update hs.memberExtra
    seenPopover(postRequest) {
      if (postRequest === undefined) {
        return AbortablePromise.reject(Error('Popup seen update unsuccessful - no request provided'))
      }
      if (typeof postRequest !== 'object' || Object.keys(postRequest).length === 0) {
        return AbortablePromise.reject(Error('Popup seen update unsuccessful - invalid request provided'))
      }
      if (postRequest.a === undefined || typeof postRequest.a !== 'string' || postRequest.a.length === 0) {
        return AbortablePromise.reject(Error('Popup seen update unsuccessful - invalid action provided'))
      }
      if (postRequest.n === undefined || typeof postRequest.n !== 'string' || postRequest.n.length === 0) {
        return AbortablePromise.reject(Error('Popup seen update unsuccessful - invalid name provided'))
      }

      let options = {
        type: 'POST',
        url: '/ajax/member/popup-seen',
        data: postRequest,
      }

      return ajaxPromise(options, 'qm')
    },

    hasSeenPopover(popoverName) {
      if (typeof popoverName !== 'string' || popoverName.length === 0) {
        return AbortablePromise.reject(Error('HasSeenPopup - popoverName must be a non-empty string'))
      }

      return ajaxPromise(
        {
          url: '/ajax/member/has-seen-popup?n=' + popoverName,
          type: 'GET',
        },
        'qm',
      ).then(response => !!response.seen)
    },
  })
}

export default service
