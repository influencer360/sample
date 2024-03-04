/** @format */

const wisdom = require('hs-nest/lib/utils/wisdom')
import approversService from '../services/approver'

class ApproverActions extends wisdom.Actions {
  /**
   * Reset approvers
   * @returns {object}
   */
  resetApprovers() {
    return {}
  }
  /**
   * Set approvers
   * @param {object} approvers
   * @returns {object}
   */
  setApprovers(approvers) {
    return approvers
  }
  /**
   * Fetch approvers by organizationId
   * @param {int} organizationId
   * @param {int} socialNetworkId
   * @return {Promise}
   */
  fetchApproversByOrganizationId(organizationId, socialNetworkId) {
    return approversService.fetchByOrganizationId(organizationId, socialNetworkId)
  }

  /**
   * @param {string} query
   * @returns {string}
   */
  searchApprovers(query) {
    return query
  }
}

export default ApproverActions
