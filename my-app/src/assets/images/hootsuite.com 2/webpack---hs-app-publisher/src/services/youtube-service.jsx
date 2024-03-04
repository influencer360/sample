/**
 * @format
 * @preventMunge
 */

import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'

export default class YouTubeService {
  constructor(flux) {
    this.flux = flux
  }

  fetchYouTubeChannelsPlaylistsAndCategories() {
    return ajaxPromise(
      {
        type: 'GET',
        url: '/ajax/authoring/get-publishable-youtube-channels-playlists-and-categories',
      },
      'qm',
    )
  }

  initializeYouTubeStore() {
    if (!this.flux) {
      throw new Error("Service wasn't initialized with flux, and therefore cannot fulfill this request")
    }
    var youtubeStore = this.flux.getStore('youtube')
    if (youtubeStore.getChannels().length > 1 || youtubeStore.getCategories().length > 1) {
      return
    }
    this.fetchYouTubeChannelsPlaylistsAndCategories().then(channelsAndCategories => {
      var youtubeActions = this.flux.getActions('youtube')
      youtubeActions.setChannels(channelsAndCategories.channels)
      youtubeActions.setCategories(channelsAndCategories.categories)
    })
  }
}
