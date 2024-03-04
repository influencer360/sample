/** @format */

const wisdom = require('hs-nest/lib/utils/wisdom')

class PresetsActions extends wisdom.Actions {
  /**
   * Set presets
   * @param {Array} presets
   * @returns {Array}
   */
  setPresets(presets) {
    return presets
  }
  /**
   * Add preset
   * @param {Object} preset
   * @returns {Object}
   */
  addPreset(preset) {
    return preset
  }
  /**
   * Remove preset
   * @param {Object} preset
   * @returns {Object}
   */
  removePreset(preset) {
    return preset
  }
  /**
   * Edit preset
   * @param {Object} preset
   * @returns {Object}
   */
  editPreset(preset) {
    return preset
  }
}

export default PresetsActions
