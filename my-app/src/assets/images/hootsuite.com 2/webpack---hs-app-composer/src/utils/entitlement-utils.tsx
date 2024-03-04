import { Entitlements } from '@/typings/Flux'

/**
 * Utility for handling entitlements in composer
 */
const EntitlementsUtils = {
  /**
   * Determines if an entitlement has been set as enabled in the Entitlements Flux store
   * @param entitlements
   * @param featureName
   * @returns True if the given entitlement is enabled
   */
  isFeatureEnabled(entitlements: Entitlements, featureName: string): boolean {
    return typeof entitlements === 'object' && !!entitlements[featureName]
  },
}
export { EntitlementsUtils }
