import Constants from '@/constants/constants'
const INSTAGRAM_PUBLISHING_MODES = Constants.INSTAGRAM_PUBLISHING_MODES

// IG + Another SN have been selected
export default ({ selectedInstagramProfiles, isNonIGNetworkSelected }) =>
  config => {
    const newConfig = { ...config }
    if (selectedInstagramProfiles.length > 0 && isNonIGNetworkSelected) {
      newConfig.defaultToggleBtn = INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH
    }
    return newConfig
  }
