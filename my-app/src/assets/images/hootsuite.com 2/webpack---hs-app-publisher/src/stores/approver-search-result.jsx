/** @format */

const wisdom = require('hs-nest/lib/utils/wisdom')
import stringUtils from 'hs-nest/lib/utils/string-utils'
import Bloodhound from 'typeahead.js/dist/bloodhound'
import _ from 'underscore'

/**
 * Store of teams and members able to be set as an approver for MRS messages in organizations
 */
class ApproverSearchResultStore extends wisdom.Store {
  constructor(flux) {
    super()
    var actionIds = flux.getActionIds('approver')
    this.registerAsync(actionIds.searchApprovers, null, this.searchApprovers)
    this.registerAsync(actionIds.fetchApproversByOrganizationId, this._resetEngine, this._set)
    this.register(actionIds.setApprovers, this._set)
    this.flux = flux
    this.engine = new Bloodhound({
      queryTokenizer: q => Bloodhound.tokenizers.whitespace(stringUtils.latinize(q)),
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('searchValue'),
      sorter: (a, b) => {
        if (!a.memberName && b.memberName) {
          return -1
        } else if (a.memberName && !b.memberName) {
          return 1
        }
        return 0
      },
    })
    this.state = {}
  }

  /**
   * Reset the engine and clear the state
   * @private
   */
  _resetEngine() {
    this.engine.clear()
    this.setState({
      searchOrganizationId: null,
    })
  }

  /**
   * Sets the approvers
   * @param {any} approvers
   * @private
   */
  _setApprovers(approvers) {
    this.setState({ approvers })
  }

  /**
   * Set the approvers to be used in the search engine
   * @param {array} approversByOrganization
   */
  _set(approversByOrganization) {
    var organizationId = Object.keys(approversByOrganization)[0]
    if (this.state.searchOrganizationId !== organizationId) {
      var approvers = _.map(approversByOrganization[organizationId], approver => {
        var searchValue = approver.memberName
          ? approver.memberName + ' ' + approver.teamName
          : approver.teamName
        approver.searchValue = stringUtils.replaceNonAlphanumericCharacters(stringUtils.latinize(searchValue))
        return approver
      })
      this.engine.clear()
      this.engine.add(approvers)
      this.setState({
        searchOrganizationId: organizationId,
      })
    }
  }

  /**
   * Get approver search results
   * @returns {*}
   */
  get() {
    return this.state
  }

  /**
   * Search approvers using the store engine
   * @param {string} query
   * @returns {Promise} The eventual search result
   */
  searchApprovers(query) {
    return new Promise((resolve, reject) => {
      if (this.engine.all().length) {
        if (!query || query === '') {
          resolve(this.engine.all())
        } else {
          this.engine.search(query, data => {
            resolve(data)
          })
        }
      } else {
        reject('Engine contained no data')
      }
    }).then(
      data => {
        this._setApprovers(data)
        return data
      },
      error => {
        this._resetEngine()
        return error
      },
    )
  }
}

export default ApproverSearchResultStore
