import type { InstagramPostType } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkType } from 'fe-pnc-constants-social-profiles'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import ComposerUtils from '@/utils/composer-utils'

export const supportsCustomThumbnail = (snType: SocialNetworkType, postType?: InstagramPostType) => {
  if (isFeatureEnabledOrBeta('PUB_28512_REELS_THUMBNAIL')) {
    if (
      (snType === SocialProfileConstants.SN_TYPES.INSTAGRAMBUSINESS &&
        ComposerUtils.isInstagramReel(postType)) ||
      snType === SocialProfileConstants.SN_TYPES.FACEBOOKPAGE
    ) {
      return true
    }
  } else {
    if (snType === SocialProfileConstants.SN_TYPES.FACEBOOKPAGE) {
      return true
    }
  }
  return false
}
