/** @format */

import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'

export default {
  /**
   * Fetches approvers data from the API
   *
   * @param {int} organizationId
   * @param {int} socialNetworkId
   * @returns {Promise}
   */
  fetchByOrganizationId: function(organizationId, socialNetworkId) {
    return ajaxPromise(
      {
        type: 'GET',
        url: '/ajax/message-review/get-approvers',
        data: {
          organizationId,
          socialNetworkId,
        },
      },
      'q1',
    ).then(function(data) {
      var result = {}
      result[organizationId] = data.approvers
      return result
    })
  },
}
