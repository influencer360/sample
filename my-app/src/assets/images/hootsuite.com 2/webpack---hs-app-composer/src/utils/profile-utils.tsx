import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'
import { getProfilesById } from 'fe-pnc-data-social-profiles-v2'
import type { Profile } from 'fe-pnc-data-social-profiles-v2'

import ComposerUtils from '@/utils/composer-utils'

/**
 * Utils related to data returned from the Social Profile store
 * Not compatible with data from the Flux store (e.g. socialNetworks, socialNetworksKeyedById)
 */
const ProfileUtils = {
  /**
   * Determines if there is an Instagram Business network in the given socialProfiles
   * @param socialProfiles One or more social profiles
   * @return True if an Instagram Business was found
   */
  hasInstagramBusinessNetwork(...socialProfiles: Array<Profile>): boolean {
    if (
      ComposerUtils.hasSocialProfileType(
        socialProfiles.map(profile => profile.socialProfileType),
        SocialProfileConstants.SN_TYPES.INSTAGRAMBUSINESS,
      )
    ) {
      return true
    }
    return false
  },

  /**
   * Gets the selected social network groups from the array of profiles
   * @param socialProfiles An array of social profiles
   * @param isLoadingProfiles True if the profiles are currently loading
   * @param selectedProfileIds Only return groups for the given profile IDs
   * @returns An array of the selected network groups
   */
  getSelectedNetworkGroups(
    socialProfiles: Array<Profile>,
    isLoadingProfiles: boolean,
    selectedProfileIds?: Array<number>,
  ): Array<SocialNetworkGroup> {
    if (isLoadingProfiles) {
      return []
    }
    const selectedProfiles: Array<Profile> = getProfilesById(socialProfiles, selectedProfileIds)

    const selectedSocialNetworkGroups = selectedProfiles.map(
      profile => SocialProfileConstants.SN_TYPE_TO_SN_GROUP[profile.socialProfileType],
    )
    return Array.from(new Set(selectedSocialNetworkGroups))
  },
}

export default ProfileUtils
