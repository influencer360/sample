/**
 * @format
 * @preventMunge
 */

import FrontendService from './frontend-service'
import AbortablePromise from 'hs-nest/lib/utils/abortable-promise'
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'
import { store as OrganizationStore } from 'fe-pnc-data-organizations'

function service(facadeApiUrl) {
  if (facadeApiUrl === undefined || typeof facadeApiUrl !== 'string') {
    throw Error('Cannot create FeedbackService - No facade url given')
  }

  return FrontendService({
    submitFeedback(postRequest) {
      if (postRequest === undefined) {
        return AbortablePromise.reject(Error('Feedback cannot be submitted - no request provided'))
      }
      if (typeof postRequest !== 'object' || Object.keys(postRequest).length === 0) {
        return AbortablePromise.reject(Error('Feedback cannot be submitted - invalid request provided'))
      }

      if (postRequest.rating === undefined || postRequest.rating < 1) {
        return AbortablePromise.reject(Error('Feedback cannot be submitted - invalid rating provided'))
      }

      if (postRequest.feedback !== undefined && typeof postRequest.feedback !== 'string') {
        return AbortablePromise.reject(Error('Feedback cannot be submitted - invalid feedback provided'))
      }

      postRequest.orgId = OrganizationStore.getState().selectedOrganization
        ? OrganizationStore.getState().selectedOrganization.organizationId
        : null

      const options = {
        type: 'post',
        url: '/ajax/scheduler/submit-opt-out-survey-response',
        json: postRequest,
      }

      return ajaxPromise(options, 'qm')
    },
  })
}

export default service
