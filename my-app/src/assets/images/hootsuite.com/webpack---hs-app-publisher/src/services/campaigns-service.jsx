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
    throw Error('Cannot create CampaignsService - No facade url given')
  }

  return FrontendService({
    createCampaign(postRequest) {
      if (postRequest === undefined) {
        return AbortablePromise.reject(Error('Campaign cannot be created - no request provided'))
      }
      if (typeof postRequest !== 'object' || Object.keys(postRequest).length === 0) {
        return AbortablePromise.reject(Error('Campaign cannot be created - invalid request provided'))
      }

      const options = {
        type: 'POST',
        url: Endpoints.CAMPAIGNS_URL,
        json: postRequest,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },

    updateCampaign(postRequest) {
      if (postRequest === undefined) {
        return AbortablePromise.reject(Error('Campaign cannot be updated - no request provided'))
      }
      if (typeof postRequest !== 'object' || Object.keys(postRequest).length === 0) {
        return AbortablePromise.reject(Error('Campaign cannot be updated - invalid request provided'))
      }

      const options = {
        type: 'PUT',
        url: `${Endpoints.CAMPAIGNS_URL}/${postRequest.id}`,
        json: postRequest,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },

    getCampaign(id) {
      if (id === undefined || typeof id !== 'string') {
        return AbortablePromise.reject(Error('Campaign cannot be retrieved - invalid id given'))
      }

      const options = {
        type: 'GET',
        url: `${Endpoints.CAMPAIGNS_URL}/${id}`,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },

    getCampaignsByOrganizationId(id) {
      if (typeof id === 'number') {
        id = id.toString()
      }

      if (typeof id !== 'string') {
        return AbortablePromise.reject(Error('Organization id must be a string'))
      }

      const options = {
        type: 'GET',
        url: Endpoints.CAMPAIGNS_URL,
        data: {
          organizationId: id,
        },
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },

    getActiveCampaignsByOrganizationId(id) {
      if (typeof id === 'number') {
        id = id.toString()
      }

      if (typeof id !== 'string') {
        return AbortablePromise.reject(Error('Organization id must be a string'))
      }

      const options = {
        type: 'GET',
        url: Endpoints.ACTIVE_CAMPAIGNS_URL,
        data: {
          organizationId: id,
        },
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },
  })
}

export default service
