/** @format */

import _ from 'underscore'
import cloneDeep from 'lodash.clonedeep'
import moment from 'moment'

// hs-nest utils
import DateTimeUtils from 'hs-nest/lib/utils/date-time'
import translation from 'hs-nest/lib/utils/translation'

// constants
import CampaignsConstants from '../constants/campaigns'

// utils
import DateUtils from '../utils/date-utils'

// Validators return a string if there is a problem, or null if everything is valid
const FIELD_VALIDATION = {
  id: id => {
    if (!_.isNull(id) && !_.isUndefined(id) && !_.isString(id)) {
      return translation._('id field must be of type {string}')
    }
    return null
  },
  orgId: orgId => {
    if (!_.isNull(orgId) && !_.isUndefined(orgId) && !_.isString(orgId)) {
      return translation._('orgId field must be of type {string}')
    }
    return null
  },
  name: name => {
    if (!_.isNull(name) && !_.isUndefined(name) && !_.isString(name)) {
      return translation._('name field must be of type {string}')
    } else if (!_.isNull(name) && name.length > CampaignsConstants.MAX_CHARACTER_NAME_LIMIT) {
      // prettier-ignore
      return translation._('Campaign name must not exceed %s1 characters').replace('%s1', CampaignsConstants.MAX_CHARACTER_NAME_LIMIT)
    }
    return null
  },
  description: description => {
    if (!_.isNull(description) && !_.isUndefined(description) && !_.isString(description)) {
      return translation._('summary field must be of type {string}')
    } else if (
      !_.isNull(description) &&
      description.length > CampaignsConstants.MAX_CHARACTER_DESCRIPTION_LIMIT
    ) {
      // prettier-ignore
      return translation._('Campaign summary must not exceed %s1 characters').replace('%s1', CampaignsConstants.MAX_CHARACTER_DESCRIPTION_LIMIT)
    }
    return null
  },
  dateFrom: dateFrom => {
    if (!_.isNull(dateFrom) && !_.isUndefined(dateFrom) && !_.isNumber(dateFrom)) {
      return translation._('dateFrom field must be of type {number}')
    }
    return null
  },
  dateTo: dateTo => {
    if (!_.isNull(dateTo) && !_.isUndefined(dateTo) && !_.isNumber(dateTo)) {
      return translation._('dateTo field must be of type {number}')
    }
    return null
  },
  preset: preset => {
    if (!_.isNull(preset) && !_.isUndefined(preset) && !_.isObject(preset)) {
      return translation._('preset field must be of type {object}')
    }
    return null
  },
  tags: tags => {
    if (!_.isNull(tags) && !_.isUndefined(tags) && !_.isArray(tags)) {
      return translation._('tags field must be of type {array}')
    }
    return null
  },
  state: state => {
    if (!_.isNull(state) && !_.isUndefined(state) && !_.isString(state)) {
      return translation._('state field must be of type {string}')
    }
    return null
  },
}

const FIELDS = Object.keys(FIELD_VALIDATION)

export default class Campaign {
  /**
   * @param {{}} data
   */
  constructor(data) {
    data = data ? _.clone(data) : {}

    // Initialize with default values
    const campaign = {
      id: data.id || null,
      orgId: data.orgId || null,
      name: data.name || null,
      description: data.description || null,
      dateFrom: data.dateFrom || null,
      dateTo: data.dateTo || null,
      preset: data.preset || null,
      tags: data.tags || [],
      state: data.state || null,
    }

    // Format some of the data to the internal campaigns format
    if (campaign.orgId && _.isNumber(campaign.orgId)) {
      campaign.orgId = campaign.orgId.toString()
    }

    if (campaign.id && _.isNumber(campaign.id)) {
      campaign.id = campaign.id.toString()
    }

    if (campaign.description && _.isNumber(campaign.description)) {
      campaign.description = campaign.description.toString()
    }

    if (campaign.dateFrom && _.isString(campaign.dateFrom)) {
      const dateFrom = new Date(campaign.dateFrom)
      if (!isNaN(dateFrom)) {
        campaign.dateFrom = DateUtils.convertDateTimeToUnixTimestamp(dateFrom)
      }
    }

    if (campaign.dateTo && _.isString(campaign.dateTo)) {
      const dateTo = new Date(campaign.dateTo)
      if (!isNaN(dateTo)) {
        campaign.dateTo = DateUtils.convertDateTimeToUnixTimestamp(dateTo)
      }
    }

    this._fieldValidation = FIELD_VALIDATION
    this._fields = Object.keys(FIELD_VALIDATION)

    // Initialize to constructor data if set, ignoring extra fields
    this._fields.map(field => {
      const dataField = campaign[field]
      this[field] = dataField !== undefined ? dataField : null
    })

    // Seal the object so property values can be changed, but properties can't be added/removed
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal
    Object.seal(this)
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
   * Allows the field to be set once in the constructor after that setting the field throws an error
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
   * @param {string} v
   */
  set id(v) {
    this.setField('id', v)
  }

  /**
   * @returns {string}
   */
  get id() {
    return this.getField('id')
  }

  /**
   * @param {string} v
   */
  set orgId(v) {
    this.setReadOnlyField('orgId', v)
  }

  /**
   * @returns {string}
   */
  get orgId() {
    return this.getField('orgId')
  }

  /**
   * @param {string} v
   */
  set name(v) {
    this.setField('name', v)
  }

  /**
   * @returns {string}
   */
  get name() {
    return this.getField('name')
  }

  /**
   * @param {string} v
   */
  set description(v) {
    this.setField('description', v)
  }

  /**
   * @returns {string}
   */
  get description() {
    return this.getField('description')
  }

  /**
   * @param {number} v
   */
  set dateFrom(v) {
    this.setField('dateFrom', v)
  }

  /**
   * @returns {number}
   */
  get dateFrom() {
    return this.getField('dateFrom')
  }

  /**
   * @param {number} v
   */
  set dateTo(v) {
    this.setField('dateTo', v)
  }

  /**
   * @returns {number}
   */
  get dateTo() {
    return this.getField('dateTo')
  }

  /**
   * @param {object} v
   */
  set preset(v) {
    this.setField('preset', v)
  }

  /**
   * @returns {object}
   */
  get preset() {
    return this.getField('preset')
  }

  /**
   * @param {Array} v
   */
  set tags(v) {
    this.setField('tags', v)
  }

  /**
   * @returns {Array}
   */
  get tags() {
    return this.getField('tags')
  }

  /**
   * @param {string} v
   */
  set state(v) {
    this.setField('state', v)
  }

  /**
   * @returns {string}
   */
  get state() {
    return this.getField('state')
  }

  getSettings() {
    const settings = []
    if (this.preset) {
      settings.push({
        settingType: CampaignsConstants.SETTING_TYPES.LINK,
        reference: String(this.preset.id),
      })
    }
    if (this.tags.length) {
      this.tags.forEach(tag =>
        settings.push({
          settingType: CampaignsConstants.SETTING_TYPES.TAG,
          reference: String(tag.id),
        }),
      )
    }
    return settings
  }

  hasDates() {
    return this.dateFrom !== null && this.dateTo !== null
  }

  /**
   * Returns whether or not the campaign has any errors
   * @returns {boolean}
   */
  hasErrors() {
    const errors = _.reduce(
      FIELDS,
      (acc, field) => {
        const validation = this.validateField(field)
        if (validation) {
          acc[field] = validation
        }
        return acc
      },
      {},
    )

    return errors !== null && Object.keys(errors).length > 0
  }

  /**
   * Returns whether or not the campaign has the mandatory fields filled in
   * @returns {boolean}
   */
  isEmpty() {
    return _.isEmpty(this.name) || _.isNull(this.dateFrom) || _.isNull(this.dateTo)
  }

  /**
   * Returns whether or not the selected date is within the campaign's date range
   * @param {Date} date
   * @returns {Boolean}
   */
  isDateInCampaign(date) {
    const dateFrom = DateTimeUtils.convertTimestampToDate(this.dateFrom)
    const dateTo = DateTimeUtils.convertTimestampToDate(this.dateTo)
    return moment(date).isBetween(dateFrom, dateTo, 'minute', [])
  }

  /**
   * Converts the campaign into json that matches the api
   * @returns {{orgId: string, name: string, dateFrom: string, dateTo: string, settings: Array}}
   */
  toPostRequest() {
    const dateFrom = DateUtils.convertEpochTimestampToISOString(this.dateFrom)
    const dateTo = DateUtils.convertEpochTimestampToISOString(this.dateTo)
    return {
      orgId: this.orgId,
      name: this.name,
      description: this.description,
      dateFrom,
      dateTo,
      settings: this.getSettings(),
    }
  }

  /**
   * Converts the campaign into json that matches the api
   * @returns {{orgId: string, name: string, dateFrom: string, dateTo: string, settings: Array}}
   */
  toPutRequest() {
    const dateFrom = DateUtils.convertEpochTimestampToISOString(this.dateFrom)
    const dateTo = DateUtils.convertEpochTimestampToISOString(this.dateTo)
    return {
      id: this.id,
      orgId: this.orgId,
      name: this.name,
      description: this.description,
      dateFrom,
      dateTo,
      settings: this.getSettings(),
    }
  }

  /**
   * Gets an object with all the fields without the prefix '_'.
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
   * Clones the object, creating a new object with the same properties
   * @returns {Campaign}
   */
  clone() {
    let newProps = this.toDataObject()
    newProps = cloneDeep(newProps)
    return new this.constructor(newProps)
  }

  /**
   * Validate the given field
   * @param {String} field
   * @returns {String|null}
   */
  validateField(field) {
    return FIELD_VALIDATION[field](this[field], this)
  }
}

// Expose static constants without making them mutable in the class
Campaign.FIELDS = FIELDS
Campaign.FIELD_VALIDATION = FIELD_VALIDATION
