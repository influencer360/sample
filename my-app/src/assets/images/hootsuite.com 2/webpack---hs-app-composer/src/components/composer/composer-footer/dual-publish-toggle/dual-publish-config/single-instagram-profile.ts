import Constants from '@/constants/constants'
import ProfileUtils from '@/utils/profile-utils'

const INSTAGRAM_PUBLISHING_MODES = Constants.INSTAGRAM_PUBLISHING_MODES

const getDefaultPublishingSelection = (isBusiness, isNonIGNetworkSelected) => {
  if (isBusiness || isNonIGNetworkSelected) {
    return INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH
  }
  return INSTAGRAM_PUBLISHING_MODES.PUSH_PUBLISH
}

// Single IG Profile selected
export default ({ selectedInstagramProfiles, isNonIGNetworkSelected }) =>
  config => {
    const newConfig = { ...config }

    if (selectedInstagramProfiles.length === 1 && !isNonIGNetworkSelected) {
      const profile = selectedInstagramProfiles[0]

      const isBusiness = ProfileUtils.hasInstagramBusinessNetwork(profile)

      newConfig.defaultToggleBtn = getDefaultPublishingSelection(isBusiness, isNonIGNetworkSelected)
    }
    return newConfig
  }
