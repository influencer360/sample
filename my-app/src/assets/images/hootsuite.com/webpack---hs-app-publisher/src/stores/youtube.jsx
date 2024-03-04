/** @format */

const wisdom = require('hs-nest/lib/utils/wisdom')

class YouTubeStore extends wisdom.Store {
  constructor(flux) {
    super()

    var actionIds = flux.getActionIds('youtube')
    var socialNetworkActionIds = flux.getActionIds('socialNetworks')

    this.register(actionIds.setChannels, this._setChannels)
    this.register(actionIds.setCategories, this._setCategories)
    this.register(actionIds.reset, this._reset)

    this.register(socialNetworkActionIds.reset, this._reset)
    this.register(socialNetworkActionIds.set, this._reset)
    this.register(socialNetworkActionIds.remove, this._reset)

    this.state = {
      channels: [],
      categories: [],
    }
  }

  _setChannels(channels) {
    this.setState({ channels: channels })
  }

  _setCategories(categories) {
    this.setState({ categories: categories })
  }

  _reset() {
    this.setState({
      channels: [],
      categories: [],
    })
  }

  getChannels() {
    return this.state.channels
  }

  getCategories() {
    return this.state.categories
  }
}

export default YouTubeStore
