/** @format */

const wisdom = require('hs-nest/lib/utils/wisdom')

class LinkShortenersActions extends wisdom.Actions {
  /**
   * Set shorteners
   * @param {Array} shorteners
   * @returns {Array}
   */
  setShorteners(shorteners) {
    return shorteners
  }

  /**
   * Add shortener
   * @param {Object} shortener
   * @returns {Object}
   */
  addShortener(shortener) {
    return shortener
  }

  /**
   * Set shortener Configs
   * @param {Array} shortenerConfigs
   * @returns {Array}
   */
  setShortenerConfigs(shortenerConfigs) {
    return shortenerConfigs
  }
}

export default LinkShortenersActions
