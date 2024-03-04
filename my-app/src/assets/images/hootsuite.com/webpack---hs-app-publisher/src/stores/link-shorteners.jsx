/** @format */

const wisdom = require('hs-nest/lib/utils/wisdom')
const _ = require('underscore')
import cloneDeep from 'lodash.clonedeep'

class LinkShortenersStore extends wisdom.Store {
  constructor(flux) {
    super()
    const linkShortenersActionIds = flux.getActionIds('linkShorteners')
    this.flux = flux
    this.register(linkShortenersActionIds.setShorteners, this._setShorteners)
    this.register(linkShortenersActionIds.setShortenerConfigs, this._setShortenerConfigs)
    this.register(linkShortenersActionIds.addShortener, this._addShortener)

    this.state = {
      shorteners: [],
      shortenerConfigs: [],
    }
  }

  /**
   * @param {Array} newShortenerConfigs
   */
  _setShortenerConfigs(newShortenerConfigs) {
    this.setState({ shortenerConfigs: newShortenerConfigs })
  }

  /**
   * @param {Array} newShorteners
   */
  _setShorteners(newShorteners) {
    this.setState({ shorteners: newShorteners })
  }

  /**
   * @param {Object} shortenerToAdd
   */
  _addShortener(shortenerToAdd) {
    let newShorteners = _.clone(this.state.shorteners) || []
    newShorteners.push(shortenerToAdd)
    this.setState({ shorteners: newShorteners })
  }

  /**
   * Get all shorteners
   * @returns {Array} shorteners
   */
  get() {
    if (!_.isEmpty(this.state.shorteners)) {
      return cloneDeep(this.state.shorteners)
    } else {
      return []
    }
  }

  /**
   * Get all shortener Configs
   * @returns {Array} shortenerConfigs
   */
  getConfigs() {
    if (!_.isEmpty(this.state.shortenerConfigs)) {
      return cloneDeep(this.state.shortenerConfigs)
    } else {
      return []
    }
  }

  /**
   * Get shortener name by id
   * @param {int} shortenerID
   * @returns {string} value
   */
  getNameByID(shortenerID) {
    const shortener = _.findWhere(this.state.shorteners, { id: shortenerID })
    if (shortener) {
      return shortener.displayName
    } else {
      return ''
    }
  }

  /**
   * Get shortener by id
   * @param {int} shortenerID
   * @returns {Object} shortener
   */
  getShortenerByID(shortenerID) {
    const shortener = _.findWhere(this.state.shorteners, { id: shortenerID })
    return cloneDeep(shortener)
  }
}

export default LinkShortenersStore
