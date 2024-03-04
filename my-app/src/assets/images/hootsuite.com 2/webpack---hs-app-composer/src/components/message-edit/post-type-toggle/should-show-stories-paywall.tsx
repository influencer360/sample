import { INSTAGRAM_STORIES } from 'fe-lib-entitlements'
import { EntitlementsUtils } from '@/utils/entitlement-utils'

export const shouldShowStoriesPaywall = entitlements =>
  !EntitlementsUtils.isFeatureEnabled(entitlements, INSTAGRAM_STORIES)
