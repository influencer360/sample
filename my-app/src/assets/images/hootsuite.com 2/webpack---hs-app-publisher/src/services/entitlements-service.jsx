/**
 * @format
 * @preventMunge
 */

import FrontendService from './frontend-service'
import AbortablePromise from 'hs-nest/lib/utils/abortable-promise'
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'
import Endpoints from '../constants/endpoints'

function service(facadeApiUrl) {
  if (facadeApiUrl === undefined || typeof facadeApiUrl !== 'string') {
    throw Error('Cannot create EntitlementsService - No facade url given')
  }

  return FrontendService({
    getEntitlementsByFeatureCode(getRequest) {
      if (getRequest === undefined) {
        return AbortablePromise.reject(Error('Entitlement cannot be retrieved - no request provided'))
      }
      if (typeof getRequest !== 'object' || Object.keys(getRequest).length === 0) {
        return AbortablePromise.reject(Error('Entitlement cannot be retrieved - invalid request provided'))
      }
      if (typeof getRequest.memberId !== 'number') {
        return AbortablePromise.reject(Error('Entitlement cannot be retrieved - invalid memberId provided'))
      }
      if (typeof getRequest.featureCode !== 'string' || getRequest.featureCode.length <= 0) {
        return AbortablePromise.reject(
          Error('Entitlement cannot be retrieved - invalid featureCode provided'),
        )
      }

      const data = {
        memberId: getRequest.memberId,
        featureCode: getRequest.featureCode,
      }

      const options = {
        type: 'GET',
        url: Endpoints.GET_ENTITLEMENTS + data.memberId + '/' + data.featureCode,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },
  })
}

export default service
