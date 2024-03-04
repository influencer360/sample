import Constants from '@/constants/constants'
import ProfileUtils from '@/utils/profile-utils'

const INSTAGRAM_PUBLISHING_MODES = Constants.INSTAGRAM_PUBLISHING_MODES

// IG + IG have been selected
export default ({ selectedInstagramProfiles, isNonIGNetworkSelected }) =>
  config => {
    const newConfig = { ...config }
    if (selectedInstagramProfiles.length > 0 && !isNonIGNetworkSelected) {
      if (selectedInstagramProfiles.every(profile => ProfileUtils.hasInstagramBusinessNetwork(profile))) {
        newConfig.defaultToggleBtn = INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH
      } else {
        newConfig.defaultToggleBtn = INSTAGRAM_PUBLISHING_MODES.PUSH_PUBLISH
      }
    }
    return newConfig
  }
