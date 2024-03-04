/**
 * @format
 * @preventMunge
 */

import _ from 'underscore'
import FrontendService from './frontend-service'
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'
import AbortablePromise from 'hs-nest/lib/utils/abortable-promise'
import Endpoints from '../constants/endpoints'
import Constants from '../constants/constants'

function service(facadeApiUrl) {
  if (facadeApiUrl === undefined || typeof facadeApiUrl !== 'string') {
    throw Error('Cannot create LinkShortenersService - No facade url given')
  }

  return FrontendService({
    getLinkShorteners(orgID) {
      const url = `${Endpoints.GET_LINK_SHORTENERS}?organizationId=${orgID}`

      const options = {
        type: 'GET',
        url,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm').then(data => {
        return data.shorteners
      })
    },

    getShortenerConfigs(orgID) {
      const url = `${Endpoints.GET_LINK_SHORTENER_CONFIGS}?organizationId=${orgID}`

      const options = {
        type: 'GET',
        url,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm').then(data => {
        return data.shortenerConfigs
      })
    },

    createLinkShortener(orgId, postRequest) {
      if (orgId === undefined || typeof orgId !== 'number') {
        return AbortablePromise.reject(Error('Cannot create LinkShortener - No organization Id given'))
      }
      if (postRequest.shortenerConfigId === undefined || typeof postRequest.shortenerConfigId !== 'number') {
        return AbortablePromise.reject(Error('Cannot create LinkShortener - No shortener config Id given'))
      }

      if (
        postRequest.authType === undefined ||
        typeof postRequest.authType !== 'string' ||
        !_.contains(Constants.LINK_SHORTENER_AUTH_TYPES, postRequest.authType)
      ) {
        return AbortablePromise.reject(Error('Cannot create LinkShortener - Incorrect AuthType given'))
      }
      if (
        postRequest.shortenerName === undefined ||
        typeof postRequest.shortenerName !== 'string' ||
        (typeof postRequest.shortenerName === 'string' && postRequest.shortenerName.length === 0)
      ) {
        return AbortablePromise.reject(Error('Cannot create LinkShortener - No shortener name given'))
      }

      const url = `${Endpoints.CREATE_LINK_SHORTENER}/${orgId}/shorteners`

      const options = {
        type: 'POST',
        url,
        json: postRequest,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },
  })
}

export default service
