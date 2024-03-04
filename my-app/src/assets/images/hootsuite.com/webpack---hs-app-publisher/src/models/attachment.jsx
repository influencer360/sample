/**
 * @format
 * @preventMunge
 */

import _ from 'underscore'
import cloneDeep from 'lodash.clonedeep'

/**
 * This is the base attachment class and should not be used directly
 * All subclasses of this should follow the pattern of (Video|Gif|Image)Attachment and use getters/setters
 */
export default class Attachment {
  /**
   * @param {{}} data
   * @param {{}} fieldValidation
   */
  constructor(data, fieldValidation) {
    const attachment = data ? _.clone(data) : {}

    this._fieldValidation = fieldValidation
    this._fields = Object.keys(fieldValidation)
    // Initialize to constructor data if set, ignoring extra fields
    this._fields.map(field => {
      let dataField = attachment[field]
      this[field] = dataField !== undefined ? dataField : null
    })
  }

  /**
   * Calls the validate function and then sets the given field
   * @param {string} field
   * @param {*} value
   */
  setField(field, value) {
    this._fieldValidation[field](value)
    this[`_${field}`] = value
  }

  /**
   * Allows the file to be set once (constructor) after that setting the field throws an error
   * @param {string} field
   * @param {*} value
   */
  setReadOnlyField(field, value) {
    if (_.isUndefined(this.getField(field))) {
      this.setField(field, value)
    } else {
      throw new Error(`Cannot write to field ${field} after it has been set`)
    }
  }

  /**
   * Returns the value of a field
   * @param {string} field
   * @return {*}
   */
  getField(field) {
    return this[`_${field}`]
  }

  /**
   * Clones the object, creating a new object with the same properties
   * @returns {Attachment}
   */
  clone() {
    let newProps = this.toDataObject()
    newProps = cloneDeep(newProps)
    return new this.constructor(newProps, this._fieldValidation)
  }

  /**
   * Gets an object with all the fields with out the prefix '_'.
   * @return {{}}
   */
  toDataObject() {
    return cloneDeep(
      this._fields.reduce((acc, field) => {
        acc[field] = this.getField(field)
        return acc
      }, {}),
    )
  }

  /**
   * Gets an object for making requests.
   * @return {{}}
   */
  toRequestObject() {
    return this.toDataObject()
  }
}
