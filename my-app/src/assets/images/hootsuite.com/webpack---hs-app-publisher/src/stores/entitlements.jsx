/** @format */

const wisdom = require('hs-nest/lib/utils/wisdom')
const _ = require('underscore')

class EntitlementsStore extends wisdom.Store {
  constructor(flux) {
    super()
    const entitlementsActionIds = flux.getActionIds('entitlements')
    this.flux = flux
    this.register(entitlementsActionIds.addEntitlement, this._addEntitlement)

    this.state = {
      entitlements: {},
    }
  }

  /**
   * @param {Object} entitlement
   */
  _addEntitlement(entitlement) {
    const newEntitlements = _.clone(this.state.entitlements) || {}
    this.setState({ entitlements: _.extend(newEntitlements, entitlement) })
  }

  /**
   * Get all entitlements
   * @returns {Object} entitlements
   */
  get() {
    if (!_.isEmpty(this.state.entitlements)) {
      return _.clone(this.state.entitlements)
    } else {
      return {}
    }
  }

  /**
   * Get entitlement by feature code
   * @param {String} featureCode
   * @returns {Boolean} isEntitled
   */
  getEntitlementValueByFeatureCode(featureCode) {
    let entitlementValue = null
    if (!_.isEmpty(this.state.entitlements)) {
      if (this.state.entitlements[featureCode]) {
        entitlementValue = this.state.entitlements[featureCode]
      }
    }
    return entitlementValue
  }
}

export default EntitlementsStore
