/**
 * @format
 * @preventMunge
 */

import FrontendService from './frontend-service'
import AbortablePromise from 'hs-nest/lib/utils/abortable-promise'
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'
import Endpoints from '../constants/endpoints'

function service(facadeApiUrl, memberId) {
  if (facadeApiUrl === undefined || typeof facadeApiUrl !== 'string') {
    throw Error('Cannot create TagService - No facade url given')
  }

  if (memberId === undefined || typeof memberId !== 'number') {
    throw Error('Cannot create TagService - No memberId given')
  }

  return FrontendService({
    getTagsByOrganizationId(ownerId, searchTerm) {
      if (ownerId === undefined) {
        return AbortablePromise.reject(Error('Tags cannot be retrieved - no organization id provided'))
      }
      let data = {
        contextType: 'MESSAGE',
        ownerId,
        ownerType: 'ORGANIZATION',
        isArchived: false, // only show active tags
      }

      if (typeof searchTerm === 'string') {
        data.name = searchTerm
      }

      let options = {
        type: 'GET',
        url: Endpoints.GET_TAGS_API_URL,
        data,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },

    createTag(ownerId, name, description) {
      if (ownerId === undefined) {
        return AbortablePromise.reject(Error('Tag cannot be created - no organization id provided'))
      }
      if (typeof name !== 'string' || name.length === 0) {
        return AbortablePromise.reject(Error('Tag cannot be created - no name provided'))
      }

      if (name.length > 250) {
        return AbortablePromise.reject(Error('Tag cannot be created - tag name too long'))
      }

      let data = {
        contextType: 'MESSAGE',
        ownerId,
        name,
        description: description || '',
        ownerType: 'ORGANIZATION',
        createdByMemberId: memberId,
      }

      let options = {
        type: 'POST',
        url: Endpoints.CREATE_TAGS_API_URL,
        json: data,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },

    getSuggestedTagsByOrganizationId(orgId) {
      if (orgId === undefined) {
        return AbortablePromise.reject(
          Error('Suggested Tags cannot be retrieved - no organization id provided'),
        )
      }
      let data = {
        orgId,
      }

      let options = {
        type: 'GET',
        url: Endpoints.SUGGESTED_TAGS_API_URL,
        data,
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },

    getTagsById(tagIds) {
      if (tagIds === undefined || !Array.isArray(tagIds)) {
        return AbortablePromise.reject(
          Error('Tags cannot be retrieved - no ids provided or non tagIds is not an array'),
        )
      }

      let options = {
        type: 'GET',
        url: Endpoints.GET_TAGS_API_URL,
        data: {
          ids: tagIds.join(','),
        },
        urlRoot: facadeApiUrl,
        jwt: true,
      }

      return ajaxPromise(options, 'qm')
    },
  })
}

export default service
