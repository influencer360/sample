/** @format */

const wisdom = require('hs-nest/lib/utils/wisdom')
import _ from 'underscore'
import findIndex from 'lodash.findindex'

class PresetsStore extends wisdom.Store {
  constructor(flux) {
    super()
    let presetsActionIds = flux.getActionIds('presets')

    this.flux = flux

    this.register(presetsActionIds.setPresets, this._setPresets)
    this.register(presetsActionIds.addPreset, this._addPreset)
    this.register(presetsActionIds.removePreset, this._removePreset)
    this.register(presetsActionIds.editPreset, this._editPreset)

    this.state = {
      presets: null,
    }
  }

  /**
   * Set presets
   * @param {Array} presets
   * @private
   */
  _setPresets(presets) {
    if (_.isEmpty(presets)) {
      this.setState({ presets: [] })
    } else {
      let presetsCopy = []
      if (_.isArray(presets) && !_.isEmpty(presets)) {
        presetsCopy = presets.map(preset => {
          let newPresets = _.clone(preset)
          return newPresets
        })
      }
      this.setState({
        presets: presetsCopy,
      })
    }
  }

  /**
   * @param {Object} presetToAdd
   */
  _addPreset(presetToAdd) {
    let newPresets = _.clone(this.state.presets) || []
    if (
      !_.isEmpty(newPresets) &&
      presetToAdd.isDefault === true &&
      _.some(newPresets, preset => {
        return preset.isDefault === true
      })
    ) {
      newPresets = _.map(newPresets, p => {
        if (p.isDefault === true) {
          p.isDefault = false
        }
        return p
      })
    }
    newPresets.push(presetToAdd)

    this.setState({ presets: newPresets })
  }

  /**
   * @param {Object} preset
   */
  _removePreset(preset) {
    let newPresets = _.clone(this.state.presets) || []
    newPresets = _.reject(newPresets, newPreset => {
      return _.isEqual(preset, newPreset)
    })

    this.setState({ presets: newPresets })
  }

  /**
   * @param {Object} presetToEdit
   */
  _editPreset(presetToEdit) {
    let newPresets = _.clone(this.state.presets) || []
    const editIndex = findIndex(newPresets, p => {
      return presetToEdit.id === p.id
    })
    newPresets = _.reject(newPresets, newPreset => {
      return _.isEqual(presetToEdit.id, newPreset.id)
    })
    if (
      !_.isEmpty(newPresets) &&
      presetToEdit.isDefault === true &&
      _.some(newPresets, preset => {
        return preset.isDefault === true
      })
    ) {
      newPresets = _.map(newPresets, p => {
        if (p.isDefault === true) {
          p.isDefault = false
        }
        return p
      })
    }
    newPresets.splice(editIndex, 0, presetToEdit)
    this.setState({ presets: newPresets })
  }

  /**
   * Get all presets
   * @returns {Array} presets
   */
  get() {
    if (!_.isEmpty(this.state.presets)) {
      return this.state.presets.map(preset => _.clone(preset))
    } else if (_.isArray(this.state.presets) && _.isEmpty(this.state.presets)) {
      return []
    } else {
      return null
    }
  }

  /**
   * Get preset id by name
   * @param {string} presetName
   * @returns {number} id
   */
  getIdByName(presetName) {
    const preset = _.findWhere(this.state.presets, { name: presetName })
    if (preset) {
      return preset.id
    } else {
      return null
    }
  }
}

export default PresetsStore
