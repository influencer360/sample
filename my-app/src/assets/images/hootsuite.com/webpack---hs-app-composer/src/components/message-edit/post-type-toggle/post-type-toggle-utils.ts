import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'

export const shouldShowPostTypeToggle = (
  selectedNetworkGroup: SocialNetworkGroup | null = null,
  isBulkComposer: boolean,
): boolean => {
  return !!(selectedNetworkGroup === SocialProfileConstants.SN_GROUP.INSTAGRAM && !isBulkComposer)
}
