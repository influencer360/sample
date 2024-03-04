/** @format */

const wisdom = require('hs-nest/lib/utils/wisdom')

class YoutubeActions extends wisdom.Actions {
  setChannels(youtubeChannels) {
    return youtubeChannels
  }

  setCategories(youtubeCategories) {
    return youtubeCategories
  }

  reset() {
    return {}
  }
}

export default YoutubeActions
