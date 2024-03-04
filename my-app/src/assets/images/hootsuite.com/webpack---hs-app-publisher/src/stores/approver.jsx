/** @format */

const wisdom = require('hs-nest/lib/utils/wisdom')

import objectAssign from 'object-assign'

class ApproverStore extends wisdom.Store {
  constructor(flux) {
    super()
    var approverActionIds = flux.getActionIds('approver')

    this.flux = flux

    this.registerAsync(approverActionIds.fetchApproversByOrganizationId, null, this._setApprovers)
    this.register(approverActionIds.resetApprovers, this._resetApprovers)
    this.register(approverActionIds.setApprovers, this._setApprovers)
    this.registerAsync(approverActionIds.fetchDefaultTeamByOrganizationId, null, this._setDefaultTeam)

    this.state = {
      approvers: {},
      defaultTeams: {},
    }
  }

  /**
   * Reset approvers
   * @param {object} approvers
   * @private
   */
  _resetApprovers(approvers) {
    this.setState({
      approvers,
    })
  }

  /**
   * Set approvers
   * @param {object} approvers
   * @private
   */
  _setApprovers(approvers) {
    this.setState({
      approvers: objectAssign({}, this.state.approvers, approvers),
    })
  }

  /**
   * Get all approvers
   * @returns {object} approvers
   */
  get() {
    return this.state.approvers
  }

  /**
   * Get approvers by organizationId, or null if they are unavailable
   * @param {int} organizationId
   * @return {?object} approvers
   */
  getApproversByOrganizationId(organizationId) {
    if (this.state.approvers.hasOwnProperty(organizationId)) {
      return this.state.approvers[organizationId]
    }
    return null
  }

  /**
   * Get defaultTeam by organizationId
   * @param {int} organizationId
   * @return {object} defaultTeam
   */
  getDefaultTeamByOrganizationId(organizationId) {
    if (this.state.defaultTeams.hasOwnProperty(organizationId)) {
      return this.state.defaultTeams[organizationId]
    }
    return null
  }
}

export default ApproverStore
