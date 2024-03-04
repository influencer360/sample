/**
 * @format
 * @preventMunge
 */

import _ from 'underscore'
import FrontendService from './frontend-service'
import AbortablePromise from 'hs-nest/lib/utils/abortable-promise'
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'
import Endpoints from '../constants/endpoints'
import Constants from '../constants/constants'

function service(facadeApiUrl) {
  if (facadeApiUrl === undefined || typeof facadeApiUrl !== 'string') {
    throw Error('Cannot create PresetsService - No facade url given')
  }

  return FrontendService({
    getPresets(orgId) {
      if (typeof orgId !== 'number') {
        return AbortablePromise.reject(Error('Cannot get Presets - invalid organization id provided'))
      }

      const options = {
        type: 'GET',
        data: {
          organizationId: orgId,
        },
        url: Endpoints.PRESETS_API_URL,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },

    deletePreset(id, orgId) {
      if (id === undefined) {
        return AbortablePromise.reject(Error('Preset cannot be deleted - no request provided'))
      }
      if (typeof id !== 'number') {
        return AbortablePromise.reject(Error('Preset cannot be deleted - invalid id provided'))
      }

      if (typeof orgId !== 'number') {
        return AbortablePromise.reject(Error('Preset cannot be deleted - invalid organization id provided'))
      }

      const options = {
        type: 'DELETE',
        url: `${Endpoints.PRESETS_API_URL}/${id}?organizationId=${orgId}`,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },

    createPreset(postRequest) {
      if (postRequest === undefined) {
        return AbortablePromise.reject(Error('Preset cannot be created - no request provided'))
      }
      if (typeof postRequest !== 'object' || Object.keys(postRequest).length === 0) {
        return AbortablePromise.reject(Error('Preset cannot be created - invalid request provided'))
      }
      if (typeof postRequest.name !== 'string' || postRequest.name.length <= 0) {
        return AbortablePromise.reject(Error('Preset cannot be created - invalid name provided'))
      }
      if (
        !_.isNull(postRequest.linkTracker) &&
        !_.contains(
          _.values(Constants.LINK_PRESETS_ACCEPTED_VALUES.LINK_TRACKER),
          postRequest.linkTracker.type,
        )
      ) {
        return AbortablePromise.reject(Error('Preset cannot be created - invalid link tracker provided'))
      }
      if (!_.isNull(postRequest.linkTracker) && !_.isArray(postRequest.linkTracker.trackingParameters)) {
        return AbortablePromise.reject(
          Error('Preset cannot be created - invalid tracking parameters provided'),
        )
      }

      if (!_.isNull(postRequest.organizationId) && typeof postRequest.organizationId !== 'number') {
        return AbortablePromise.reject(Error('Preset cannot be created - invalid organization id provided'))
      }

      const options = {
        type: 'POST',
        url: `${Endpoints.PRESETS_API_URL}?organizationId=${postRequest.organizationId}`,
        json: postRequest,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },

    editPreset(putRequest, linkSettingsPresetId) {
      if (putRequest === undefined) {
        return AbortablePromise.reject(Error('Preset cannot be edited - no request provided'))
      }
      if (typeof linkSettingsPresetId !== 'number') {
        return AbortablePromise.reject(Error('Preset cannot be edited - invalid id provided'))
      }
      if (typeof putRequest !== 'object' || Object.keys(putRequest).length === 0) {
        return AbortablePromise.reject(Error('Preset cannot be edited - invalid request provided'))
      }
      if (typeof putRequest.name !== 'string' || putRequest.name.length <= 0) {
        return AbortablePromise.reject(Error('Preset cannot be edited - invalid name provided'))
      }
      if (
        !_.isNull(putRequest.linkTracker) &&
        !_.contains(
          _.values(Constants.LINK_PRESETS_ACCEPTED_VALUES.LINK_TRACKER),
          putRequest.linkTracker.type,
        )
      ) {
        return AbortablePromise.reject(Error('Preset cannot be edited - invalid link tracker provided'))
      }
      if (!_.isNull(putRequest.linkTracker) && !_.isArray(putRequest.linkTracker.trackingParameters)) {
        return AbortablePromise.reject(
          Error('Preset cannot be edited - invalid tracking parameters provided'),
        )
      }

      if (!_.isNull(putRequest.organizationId) && typeof putRequest.organizationId !== 'number') {
        return AbortablePromise.reject(Error('Preset cannot be edited - invalid organization id provided'))
      }

      const options = {
        type: 'PUT',
        url: `${Endpoints.PRESETS_API_URL}/${linkSettingsPresetId}?organizationId=${putRequest.organizationId}`,
        json: putRequest,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },
  })
}

export default service
