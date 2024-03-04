/** @format */

import { getMemberId } from 'fe-lib-hs'
import { hasEntitlement } from 'fe-pnc-data-entitlements'

export const handleEntitlementCheck = (entitlement, callback) => {
  getMemberId()
    .then(memberId => {
      return hasEntitlement(memberId, entitlement)
    })
    .then(result => {
      callback(result)
    })
}
