import React from 'react'
import cloneDeep from 'lodash/cloneDeep'
import filter from 'lodash/filter'
import get from 'lodash/get'
import isString from 'lodash/isString'
import uniqBy from 'lodash/uniqBy'
import moment from 'moment-timezone'
import _ from 'underscore'

import { linkedin as linkedinBoostUtils } from 'fe-ae-lib-utils'
import { logInfo } from 'fe-lib-logging'
import { ValidationBanner } from 'fe-pnc-comp-field-validation-item'
import { UPLOAD_ERROR_TYPE } from 'fe-pnc-comp-media-upload'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'
import type { FieldValidation, MessageValidationError } from 'fe-pnc-data-message-previews'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import ValidationErrorMessages, {
  CUSTOM_ERRORS,
  FIELD_VALIDATIONS,
  DISCONNECTED_NETWORK_ERROR_CODE,
} from 'fe-pnc-validation-error-messages'

import ComposerConstants from '@/constants/composer'
import Constants from '@/constants/constants'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import InnerMessage from '@/models/inner-message'
import { Error, ErrorLevel, Errors, FieldValidations } from '@/typings/Message'
import { SocialNetworksKeyedById } from '@/typings/SocialNetwork'
import { isStringUnlinkedMention } from './mentions-utils'

const { SN_TYPES, MENTION_SUPPORTED_NETWORKS, SN_TYPE_TO_SN_GROUP } = SocialProfileConstants

// Exporting for testing
export let errorsRendered = []
const NONE = 'NONE'

// link to test regex: https://regexr.com/6baua
const urlMatchRegex = RegExp(
  /((?:(?:http?|ftp)[s]*:\/\/)?[a-z0-9-%\/\&=?\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?)([^\s]+)/,
  'gi',
)

export const NoProfilesError = {
  code: CUSTOM_ERRORS.FE_NO_PROFILES,
  message: 'No profile selected', // this will not be displayed to the user
  socialProfileType: NONE,
}

export const NoPinterestBoardError = {
  code: CUSTOM_ERRORS.FE_NO_PINTEREST_BOARDS,
  message: 'No board selected', // this will not be displayed to the user
  socialProfileType: NONE,
}

export const InvalidApproverSelected = {
  code: CUSTOM_ERRORS.FE_INVALID_ONE_TIME_REVIEWER_SELECTED,
  message: 'Invalid one time approver', // this will not be displayed to the user
  socialProfileType: NONE,
}

export const OutsideOfCampaignDateRangeError = message => ({
  code: CUSTOM_ERRORS.OUTSIDE_OF_CAMPAIGN_DATE_RANGE,
  message,
  socialProfileType: NONE,
})

export const OutsideOfCampaignTimeRangeError = message => ({
  code: CUSTOM_ERRORS.OUTSIDE_OF_CAMPAIGN_TIME_RANGE,
  message,
  socialProfileType: NONE,
})

export const SelectDateInFutureError = message => ({
  code: CUSTOM_ERRORS.SELECT_DATE_IN_FUTURE,
  message,
  socialProfileType: NONE,
})

export const DeauthedProfileSelectedError = (
  message,
  memberName,
  deauthedSocialProfiles,
  expiredSocialProfiles,
) => ({
  code: CUSTOM_ERRORS.DEAUTHED_SOCIAL_NETWORK_SELECTED,
  message,
  socialProfileType: NONE,
  reauthModalData: {
    memberName: memberName,
    context: deauthedSocialProfiles,
    expired: expiredSocialProfiles,
  },
})

export const InvalidBoostSettingsEndDateError = {
  code: CUSTOM_ERRORS.BOOST_CAMPAIGN_END_DATE,
  message: 'Invalid Boost Settings End Date', // this will not be displayed to the user
  socialProfileType: NONE,
}

export const InvalidBoostSettingsRequireVideoMessage = {
  code: CUSTOM_ERRORS.BOOST_CAMPAIGN_REQUIRE_VIDEO,
  message: 'Invalid Boost Settings Require Video Message', // this will not be displayed to the user
  socialProfileType: NONE,
}

export const InvalidBoostSettingsInvalidVideoObjective = {
  code: CUSTOM_ERRORS.BOOST_CAMPAIGN_INVALID_VIDEO_OBJECTIVE,
  message: 'Invalid Boost Settings Objective not valid for Video Message', // this will not be displayed to the user
  socialProfileType: NONE,
}

export const InvalidBoostSettingsVideoSize = {
  code: CUSTOM_ERRORS.BOOST_CAMPAIGN_INVALID_VIDEO_SIZE,
  message: 'Invalid Boost Settings Video Size not valid', // this will not be displayed to the user
  socialProfileType: NONE,
}

export const InvalidBoostSettingsVideoResolution = {
  code: CUSTOM_ERRORS.BOOST_CAMPAIGN_INVALID_VIDEO_RESOLUTION,
  message: 'Invalid Boost Settings Video Resolution not valid', // this will not be displayed to the user
  socialProfileType: NONE,
}

export const InvalidSubtitlesFileType = {
  code: CUSTOM_ERRORS.SUBTITLES_FILE_TYPE,
  message: 'Invalid Subtitles File Type', // this will not be displayed to the user
  socialProfileType: NONE,
}

export const InvalidSubtitlesFileName = {
  code: CUSTOM_ERRORS.SUBTITLES_FILE_NAME,
  message: 'Invalid Subtitles File Name', // this will not be displayed to the user
  socialProfileType: NONE,
}

export const InvalidSubtitlesFileFormat = {
  code: CUSTOM_ERRORS.SUBTITLES_FILE_FORMAT,
  message: 'Invalid Subtitles File Format', // this will not be displayed to the user
  socialProfileType: NONE,
}

export const InvalidSubtitlesGenericWithMsg = msg => ({
  code: CUSTOM_ERRORS.SUBTITLES_GENERIC_ERROR_WITH_MSG,
  message: 'Invalid Subtitles With Custom Message', // this will not be displayed to the user
  socialProfileType: NONE,
  vars: [{ key: 'msg', value: msg }],
})

export const InvalidSubtitlesGeneric = {
  code: CUSTOM_ERRORS.SUBTITLES_GENERIC_ERROR,
  message: 'Invalid Subtitles', // this will not be displayed to the user
  socialProfileType: NONE,
}

export const InvalidURLErrorCode = {
  code: CUSTOM_ERRORS.FE_INVALID_URL,
  message: 'Invalid URL entered', // this will not be displayed to the user
  socialProfileType: NONE,
}

const ValidationUtils = {
  /**
   * Formats the fieldValidations from the authoring format to the format we use in the frontend message model
   * @param data The field validation data that comes directly from the Authoring
   */
  formatAuthoringFieldValidations(data: Array<FieldValidation>): FieldValidations {
    return data.reduce(
      (acc, { fieldName, errors, info, warnings }) => {
        if (errors) {
          acc.errors[fieldName] = errors
        }
        if (info) {
          acc.info[fieldName] = info
        }
        if (warnings) {
          acc.warnings[fieldName] = warnings
        }
        return acc
      },
      {
        errors: {},
        info: {},
        warnings: {},
      },
    ) as FieldValidations
  },

  /**
   * Returns whether or not the data contains validation errors that are not post-send validations
   * @param {object} fieldValidations The field validation data that comes directly from the message
   * @return {boolean}
   */
  isValid(fieldValidations: FieldValidations) {
    const hasErrorValsThatAreNotPostSend = (errorVals: Errors) =>
      Object.values(errorVals).some(errValField => errValField.some(errVal => !errVal.groupedSocialProfiles))
    if (
      fieldValidations &&
      fieldValidations.errors &&
      hasErrorValsThatAreNotPostSend(fieldValidations.errors)
    ) {
      return false
    }
    return true
  },

  /**
   * Gets the first error from the fieldValidations
   * @param fieldValidations
   * @param isBulkComposer
   */
  getFirstError: (fieldValidations: FieldValidations, isBulkComposer: boolean) => {
    if (!ValidationUtils.isValid(fieldValidations) && fieldValidations) {
      let firstError = null
      Object.values(FIELD_VALIDATIONS).some(field => {
        if (ValidationUtils.hasErrorsByField(fieldValidations, field, true)) {
          firstError = (
            <ValidationBanner
              fieldValidations={fieldValidations}
              field={field}
              showOnSubmitErrors={true}
              isBulkComposer={isBulkComposer}
            />
          )
          return true
        }
        return false
      })
      return firstError
    }

    return null
  },

  /**
   * Return the validation for the given field with an optional filter
   * @param type
   * @param fieldValidations
   * @param field
   * @param [filterFn]
   */
  hasValidationByField: (
    type: ErrorLevel,
    fieldValidations: FieldValidations,
    field: string,
    filterFn: (args: any) => boolean,
  ): boolean => {
    const fieldInfo = fieldValidations?.[type]?.[field] || []

    if (filterFn && fieldInfo.length) {
      return fieldInfo.some(filterFn)
    }

    return fieldInfo.length > 0
  },

  /**
   * Returns whether or not the validation data contains errors for the given field with errors that show on submit optionally filtered out
   * @param fieldValidations
   * @param field
   * @param showOnSubmitErrors
   */
  hasErrorsByField: (
    fieldValidations: FieldValidations,
    field: string,
    showOnSubmitErrors = false,
  ): boolean => {
    let filterFn
    if (!showOnSubmitErrors) {
      filterFn = ({ code, socialProfileType, vars }) =>
        !ValidationErrorMessages.get({ code, vars, socialProfileType }).showOnSubmitOnly
    }
    return ValidationUtils.hasValidationByField(
      ComposerConstants.ERROR_LEVELS.ERRORS,
      fieldValidations,
      field,
      filterFn,
    )
  },

  /**
   * Returns true if the message has an Instagram Direct multimedia info code (4111)
   * @param fieldValidations
   */
  hasInstagramDirectInfo: (fieldValidations: FieldValidations): boolean =>
    ValidationUtils.hasValidationByField(
      ComposerConstants.ERROR_LEVELS.INFO,
      fieldValidations,
      FIELD_VALIDATIONS.ATTACHMENTS,
      ({ code }) => code === 4111,
    ),

  /**
   * Returns whether any video transcoding codes are found under the specified validations field name "info" node
   * @param fieldValidations
   */
  hasVideoTranscodingInfoForAttachments: (fieldValidations: FieldValidations): boolean =>
    ValidationUtils.hasValidationByField(
      ComposerConstants.ERROR_LEVELS.INFO,
      fieldValidations,
      FIELD_VALIDATIONS.ATTACHMENTS,
      ({ code }) => ValidationErrorMessages.videoTranscodeableErrors.includes(code),
    ),

  /**
   * Returns whether any video transcoding codes are found under the specified validations field name "error" node
   * @param fieldValidations
   */
  hasVideoTranscodingErrorForAttachments: (fieldValidations: FieldValidations): boolean =>
    ValidationUtils.hasValidationByField(
      'errors',
      fieldValidations,
      FIELD_VALIDATIONS.ATTACHMENTS,
      ({ code }) => ValidationErrorMessages.videoTranscodeableErrors.includes(code),
    ),

  /**
   * Logs the unmapped error and warning codes along with the social profile type
   * @param fieldValidations
   * @param request
   */
  logErrorsAndWarnings(fieldValidations: FieldValidations, request: Record<string, unknown>) {
    if (typeof fieldValidations === 'object') {
      const log = (fields, type) => {
        if (!_.isEmpty(fields)) {
          _.each(fields, (error, field) => {
            error.forEach(({ code, socialProfileType }) => {
              logInfo(LOGGING_CATEGORIES.NEW_COMPOSER, `${type} ${code} from authoring`, {
                field,
                code: JSON.stringify(code),
                description:
                  typeof ValidationErrorMessages[code] !== 'undefined'
                    ? ValidationErrorMessages[code].logDescription
                    : null,
                socialProfileType: socialProfileType,
                // TODO: Should the warnings go into ValidationErrorMessages and renamed to ValidationMessages?
                //       Something to figure out when the warnings are added
                unmapped: typeof ValidationErrorMessages[code] === 'undefined',
                message: JSON.stringify(request),
              })
            })
          })
        }
      }
      log(fieldValidations.errors, 'Error')
      log(fieldValidations.warnings, 'Warning')
    }
  },

  /**
   * Adds in the info from Authoring
   * @param fieldValidations
   * @param customValidations
   * @param field
   * @param errorLevel
   */
  addCustomValidations(
    fieldValidations: FieldValidations,
    customValidations: Array<MessageValidationError>,
    field: string,
    errorLevel: ErrorLevel = ComposerConstants.ERROR_LEVELS.WARNINGS,
  ): FieldValidations {
    if (!customValidations.length) {
      return fieldValidations
    }
    const newFieldValidations = (
      _.isEmpty(fieldValidations)
        ? ValidationUtils.formatAuthoringFieldValidations([])
        : cloneDeep(fieldValidations)
    ) as FieldValidations
    const existingValidations = newFieldValidations?.[errorLevel]?.[field]
      ? newFieldValidations[errorLevel][field]
      : []
    customValidations.forEach(customInfo => existingValidations.push(customInfo))
    newFieldValidations[errorLevel][field] = uniqBy(existingValidations, 'code')
    return newFieldValidations
  },

  /**
   * Adds or removes the frontend only custom deauthed profile errors.
   * @param fieldValidations
   * @param {object} newError
   * @param {string} field
   * @returns {object} newFieldValidations
   */
  updateCustomDeauthedProfileErrors(fieldValidations: FieldValidations, newError, field: string) {
    const newFieldValidations = _.isEmpty(fieldValidations)
      ? ValidationUtils.formatAuthoringFieldValidations([])
      : cloneDeep(fieldValidations)
    const existingErrors =
      newFieldValidations.errors && newFieldValidations.errors[field] ? newFieldValidations.errors[field] : []
    const hasErrorAlready = existingErrors.some(error => error.code === newError.code)
    const deauthedProfilesAreCurrentlySelected = newError.reauthModalData.context.length > 0

    if (deauthedProfilesAreCurrentlySelected) {
      if (!hasErrorAlready) {
        existingErrors.push(newError)
        newFieldValidations.errors[field] = existingErrors
      } else {
        existingErrors.forEach((error, index) => {
          if (error.code === CUSTOM_ERRORS.DEAUTHED_SOCIAL_NETWORK_SELECTED) {
            existingErrors[index] = newError
            newFieldValidations.errors[field] = existingErrors
          }
        })
      }
    } else {
      // If there are no currently selected deauthed profiles than clear all DEAUTHED_SOCIAL_NETWORK_SELECTED type errors.
      if (hasErrorAlready) {
        existingErrors.forEach((error, index) => {
          if (error.code === CUSTOM_ERRORS.DEAUTHED_SOCIAL_NETWORK_SELECTED) {
            existingErrors.splice(index, 1)
            if (existingErrors.length === 0) {
              delete newFieldValidations.errors[field]
            } else {
              newFieldValidations.errors[field] = existingErrors
            }
          }
        })
      }
    }
    return newFieldValidations
  },

  /**
   * Returns an array of unmapped error codes of the given field
   * @param {string} field
   * @param {object} errors
   * @returns {array}
   */
  getUnmappedErrorCodesByField(field, errors) {
    return _.reduce(
      errors[field],
      (acc, { code }) => {
        if (typeof ValidationErrorMessages[code] === 'undefined') {
          acc.push(code)
        }
        return acc
      },
      [],
    )
  },

  /**
   * Returns whether or not the field validations contains custom errors or post-send validations
   * @param {object} fieldValidations
   * @return {boolean}
   */
  hasCustomErrorsOrPostSendValidations(fieldValidations: FieldValidations) {
    if (get(fieldValidations, ['errors'], false)) {
      const hasCustomErrors = _.some(CUSTOM_ERRORS, customError =>
        Boolean(_.find(fieldValidations.errors, error => _.find(error, e => e.code === customError))),
      )
      const hasPostSendErrors = Boolean(
        _.find(fieldValidations.errors, error => _.find(error, (e: Error) => e.groupedSocialProfiles)),
      )
      return hasCustomErrors || hasPostSendErrors
    }
    return false
  },

  /**
   * Removes all non custom errors from the field validations
   * @param fieldValidations
   * @param socialNetworksKeyedById - socialProfiles selected
   */
  removeNonCustomErrorsAndNonValidPostSendValidations(
    fieldValidations: FieldValidations,
    socialNetworksKeyedById: SocialNetworksKeyedById,
  ): FieldValidations {
    if (!_.isEmpty(fieldValidations)) {
      const newFieldValidations = {
        errors: {},
        info: {},
        warnings: {},
      } as FieldValidations
      const getSocialNetworksFilteredByError = (socialNetworks, socialProfileIdsForError) =>
        socialNetworks &&
        socialProfileIdsForError &&
        socialNetworks
          .filter((snObj, snId) =>
            // eslint-disable-next-line eqeqeq
            socialProfileIdsForError.some(snIdForError => snId == snIdForError),
          )
          .toArray().length
      Object.entries(fieldValidations).forEach(([fieldValType, fieldValidationGroup]) => {
        let nonCustomAndPostSendFieldsRemoved = {}
        Object.entries(fieldValidationGroup).forEach(([key, fieldVal]) => {
          const fieldValsToRemain = fieldVal.filter(
            fieldV =>
              Object.keys(CUSTOM_ERRORS)?.some(
                customErrorKey => CUSTOM_ERRORS[customErrorKey] === fieldV.code,
              ) ||
              (fieldV.groupedSocialProfiles &&
                getSocialNetworksFilteredByError(socialNetworksKeyedById, fieldV.socialProfileIds)),
          )

          if (fieldValsToRemain.length) {
            nonCustomAndPostSendFieldsRemoved = {
              [key]: fieldValsToRemain,
            }
          }
        })
        if (!_.isEmpty(nonCustomAndPostSendFieldsRemoved)) {
          newFieldValidations[fieldValType] = nonCustomAndPostSendFieldsRemoved
        }
      })
      return newFieldValidations
    }
    return {}
  },

  /**
   * Removes error if the field validation has error code present in errors array
   * @param fieldValidation
   * @param errors
   * @returns
   */
  removeFieldFromFieldValidations(fieldValidation: Errors, errors: (string | number)[]) {
    return _.reduce(
      fieldValidation,
      (resultFieldValidation, field, key) => {
        const fieldRemoved = filter(field, value => !errors.includes(value.code))
        if (fieldRemoved.length) {
          resultFieldValidation[key] = fieldRemoved
        }
        return resultFieldValidation
      },
      {},
    )
  },

  /**
   * Removes given  error(s) from the field validations
   * @param fieldValidations
   * @param errors
   */
  removeErrors(fieldValidations: FieldValidations, errors: (string | number)[]): FieldValidations {
    if (!_.isEmpty(fieldValidations)) {
      const accumulator = { errors: {}, info: {}, warnings: {} } // initial value for the reduce
      return _.reduce(
        fieldValidations,
        (resultFieldValidations: FieldValidations, fieldValidation: Errors, key: string) => {
          const updatedFields = ValidationUtils.removeFieldFromFieldValidations(fieldValidation, errors)
          if (!_.isEmpty(updatedFields)) {
            resultFieldValidations[key] = updatedFields
          }
          return resultFieldValidations
        },
        accumulator,
      )
    }
    return {}
  },

  /**
   * It's possible for Authoring to return error 4219 which means the send date
   * is in the past or it's not greater than 5min for images or 15min for video.
   * In that case we need to remove the custom campaign date range errors to avoid
   * showing duplicate schedule date errors in the UI.
   * @param fieldValidations
   */
  removeCustomScheduleDateErrors(fieldValidations: FieldValidations): FieldValidations {
    return ValidationUtils.removeErrors(fieldValidations, [
      CUSTOM_ERRORS.OUTSIDE_OF_CAMPAIGN_DATE_RANGE,
      CUSTOM_ERRORS.OUTSIDE_OF_CAMPAIGN_TIME_RANGE,
      CUSTOM_ERRORS.SELECT_DATE_IN_FUTURE,
      CUSTOM_ERRORS.SELECT_DATE_N_MINS_IN_FUTURE,
    ])
  },

  /**
   * Used to exclude MessageBodyTooLongErrors from the template validation area below message text
   * TODO: make generic for other PNE-related error exclusions
   * @param fieldValidations
   */
  removeMessageBodyTooLongErrors(fieldValidations: FieldValidations): FieldValidations {
    return ValidationUtils.removeErrors(fieldValidations, [
      ComposerConstants.ERROR_CODES.MESSAGE_BODY_TOO_LONG,
    ])
  },

  /**
   * Since we are able to have multiple custom DeauthedProfileError field validations, the default removeCustomErrors
   * function is setup to remove all errors of the supplied type. So this function is setup to only remove a specific
   * field validation based on the given social profile ID.
   * @param fieldValidations
   */
  removeCustomDeauthedProfileErrors(fieldValidations: FieldValidations): FieldValidations {
    if (!_.isEmpty(fieldValidations)) {
      return _.reduce(
        fieldValidations,
        (accumulatedUpdatedFieldValidations, fields, fieldValidationType) => {
          const updatedFields = _.reduce(
            fields,
            (accumulatedUpdatedFields, field, fieldType) => {
              // This filter function will remove all errors of type 'DEAUTHED_SOCIAL_NETWORK_SELECTED'
              let filteredCustomErrors = []
              filteredCustomErrors = filter(
                field,
                f =>
                  fieldType !== FIELD_VALIDATIONS.SOCIAL_NETWORK ||
                  f.code !== CUSTOM_ERRORS.DEAUTHED_SOCIAL_NETWORK_SELECTED,
              )
              // The filteredCustomErrors object now contains only the desired remaining fieldValidations.
              if (filteredCustomErrors.length) {
                accumulatedUpdatedFields[fieldType] = filteredCustomErrors
              }
              return accumulatedUpdatedFields
            },
            {},
          )
          if (!_.isEmpty(updatedFields)) {
            accumulatedUpdatedFieldValidations[fieldValidationType] = updatedFields
          }
          return accumulatedUpdatedFieldValidations
        },
        {
          errors: {},
          info: {},
          warnings: {},
        },
      )
    }
    return {}
  },

  /**
   * Returns whether or not Authoring returns error 4219 (invalid send date)
   * @param fieldValidations Unformatted from Authoring
   */
  hasAuthoringScheduleDateError(fieldValidations: Array<FieldValidation>) {
    if (fieldValidations && fieldValidations.length) {
      return fieldValidations.some(field => {
        if (field && field.errors) {
          return field.errors.find(error => error.code === ComposerConstants.ERROR_CODES.INVALID_SEND_DATE)
        }
        return false
      })
    }
    return false
  },

  /**
   * Gets the custom campaign date error
   * @param {Date|Moment} dateTime
   * @param {Object} enabledDays
   * @param {String} timezoneName
   * @return {Object|null}
   */
  getCampaignDateError({ dateTime, enabledDays, timezoneName }) {
    let campaignDateError = null
    if (enabledDays) {
      const today = moment.tz(timezoneName)
      const selectedDate = moment(dateTime).tz(timezoneName)
      const dateFrom = moment(enabledDays.dateFrom).tz(timezoneName)
      const dateTo = moment(enabledDays.dateTo).tz(timezoneName)
      // The selected date is within the date range but it's before the current time
      if (selectedDate.isBefore(today) && selectedDate.isBetween(dateFrom, dateTo, 'day', [])) {
        if (selectedDate.date() === today.date()) {
          campaignDateError = OutsideOfCampaignTimeRangeError(
            ValidationErrorMessages[CUSTOM_ERRORS.OUTSIDE_OF_CAMPAIGN_TIME_RANGE].message,
          )
        } else {
          campaignDateError = SelectDateInFutureError(
            ValidationErrorMessages[CUSTOM_ERRORS.SELECT_DATE_IN_FUTURE].message,
          )
        }
        // The selected date is the start date but it's before the start time or the selected date is the end date but it's after the end time
      } else if (
        (selectedDate.isSame(dateFrom, 'day') && selectedDate.isBefore(dateFrom)) ||
        (selectedDate.isSame(dateTo, 'day') && selectedDate.isAfter(dateTo))
      ) {
        campaignDateError = OutsideOfCampaignTimeRangeError(
          ValidationErrorMessages[CUSTOM_ERRORS.OUTSIDE_OF_CAMPAIGN_TIME_RANGE].message,
        )
        // The selected date is not within the date range
      } else if (!selectedDate.isBetween(dateFrom, dateTo, 'day', [])) {
        campaignDateError = OutsideOfCampaignDateRangeError(
          ValidationErrorMessages[CUSTOM_ERRORS.OUTSIDE_OF_CAMPAIGN_DATE_RANGE].message,
        )
      }
    }
    return campaignDateError
  },

  /**
   * Gets the "Please select a schedule date in the future"
   * error message if the given date is in the past
   * @param {Date|Moment} dateTime
   * @param {Number} minimumScheduleMinutes
   * @param {String} timezoneName
   * @return {Object|null}
   */
  getFutureDateError({ dateTime, minimumScheduleMinutes, timezoneName }) {
    let dateError = null
    const selectDateInFutureError = SelectDateInFutureError(
      ValidationErrorMessages[CUSTOM_ERRORS.SELECT_DATE_IN_FUTURE].message,
    )
    if (dateTime === null || typeof dateTime === 'undefined') {
      return selectDateInFutureError
    }
    if (minimumScheduleMinutes) {
      const now = moment().tz(timezoneName)
      const isDateTimeValid = moment(dateTime).tz(timezoneName).diff(now, 'minutes') >= minimumScheduleMinutes
      if (!isDateTimeValid) {
        dateError = selectDateInFutureError
      }
    }
    return dateError
  },

  /**
   * Returns an array of field validation error codes
   * @param errors
   */
  getErrorCodes(errors: Errors): Array<number> {
    if (errors) {
      return _.reduce(
        errors,
        (acc: Array<number>, error: Array<Error>) => {
          error.forEach(field => acc.push(field.code))
          return acc
        },
        [],
      )
    }
    return []
  },

  /**
   * Determines the category of an error code
   */
  getCategory(code: number, errorCodes: Array<number>, warningCodes: Array<number>) {
    if (errorCodes.includes(code)) {
      return ComposerConstants.ERROR_LEVELS.ERRORS
    }
    if (warningCodes.includes(code)) {
      return ComposerConstants.ERROR_LEVELS.WARNINGS
    }
    return ComposerConstants.ERROR_LEVELS.INFO
  },

  getAllVariablesFromValidationsByCode(fieldValidations: FieldValidations, code: number): Array<number> {
    const fieldValidationVariables = []

    Object.keys(fieldValidations).forEach((fieldValidationKey: string) => {
      Object.keys(fieldValidations[fieldValidationKey]).forEach(fieldValidationsType => {
        const foundCode = fieldValidations[fieldValidationKey][fieldValidationsType].find(
          fieldValidation => fieldValidation.code === code,
        )
        if (foundCode?.vars) {
          fieldValidationVariables.push(...foundCode.vars)
        }
      })
    })

    return fieldValidationVariables
  },

  /**
   * This is specifically used for testing
   * @param errorCodes
   */
  setErrorsRendered(errorCodes: Array<number>) {
    errorsRendered = errorCodes
  },

  /**
   * Clear the errors rendered when new composer is unmounted
   */
  clearErrorsRendered() {
    errorsRendered = []
  },

  /**
   * Logs all the error codes that are not rendered in the UI
   * @param message
   * @param request
   */
  logErrorsNotRendered(message: { fieldValidations: FieldValidations }, request: Record<string, unknown>) {
    if (get(message, ['fieldValidations', 'errors'])) {
      const errorsNotRendered = _.difference(
        ValidationUtils.getErrorCodes(message.fieldValidations.errors),
        errorsRendered,
      )
      errorsNotRendered.forEach(code => {
        logInfo(LOGGING_CATEGORIES.NEW_COMPOSER, `Error code ${code} not rendered`, {
          code: JSON.stringify(code),
          description:
            typeof ValidationErrorMessages[code] !== 'undefined'
              ? ValidationErrorMessages[code].logDescription
              : null,
          message: JSON.stringify(request),
        })
      })
    }
  },

  /**
   * Function to create the custom Deauthed Profile Selected Error.
   * @param {object} socialProfile
   * @param {object} expiredSocialProfiles
   * @returns {object}
   */
  createDeauthedProfileSelectedErrors: function ({
    memberName,
    deauthedSocialProfiles,
    expiredSocialProfiles,
  }) {
    return DeauthedProfileSelectedError(
      ValidationErrorMessages[CUSTOM_ERRORS.DEAUTHED_SOCIAL_NETWORK_SELECTED].message,
      memberName,
      deauthedSocialProfiles,
      expiredSocialProfiles,
    )
  },

  /**
   * Helper function to check if the given social Profile is currently deauthed.
   * @param {string} selectedNetworkId
   * @param {object} socialNetworks
   * @param {object} privateSocialNetworks
   * @returns {object}
   */
  areSelectedProfilesDeauthed: function ({ selectedNetworkIds, socialNetworks, privateSocialProfiles }) {
    const allSocialNetworks = socialNetworks.concat(privateSocialProfiles)

    // All profiles that are currently flagged as deauthed (isReauthRequired)
    const allDeauthedProfiles = filter(
      allSocialNetworks,
      p => Boolean(p) && (p.isReauthRequired || p.isReauthRequired === 1),
    )

    // The hasDeauthedProfileSelected function is sometimes called before the selected profile has been added to
    // selectedSocialNetworksById so we look for the recentlySelectedDeauthedProfile instead.
    const selectedDeauthedProfiles = []
    allDeauthedProfiles.forEach(profile => {
      selectedNetworkIds.forEach(selectedNetworkId => {
        if (profile.socialProfileId === selectedNetworkId.socialNetworkId) {
          selectedDeauthedProfiles.push(profile.socialProfileId)
        }
      })
    })

    return selectedDeauthedProfiles
  },

  /**
   * Helper function to check if we need to add or remove a custom deauthed profile field validation.
   * @param {object} fieldValidations
   * @param {object} deauthedProfilesSelected
   * @param {string} field
   * @returns {boolean}
   */
  checkForCustomDeauthedProfileErrors(fieldValidations: FieldValidations, deauthedProfilesSelected, field) {
    const existingFieldValidations = _.isEmpty(fieldValidations)
      ? ValidationUtils.formatAuthoringFieldValidations([])
      : cloneDeep(fieldValidations)
    const existingDeauthErrors =
      existingFieldValidations.errors && existingFieldValidations.errors[field]
        ? existingFieldValidations.errors[field].filter(
            e =>
              e.code === CUSTOM_ERRORS.DEAUTHED_SOCIAL_NETWORK_SELECTED ||
              e.code === DISCONNECTED_NETWORK_ERROR_CODE,
          )
        : []

    // Should only return true if the number of deauthed profiles is different than the number of existing deauthed profile errors.
    let updateDeauthedProfileFieldValidations = true
    if (existingDeauthErrors.length > 0) {
      if (existingDeauthErrors[0].reauthModalData.context.length === deauthedProfilesSelected.length) {
        updateDeauthedProfileFieldValidations = false
      }
    } else {
      if (deauthedProfilesSelected.length === 0) {
        updateDeauthedProfileFieldValidations = false
      }
    }
    return updateDeauthedProfileFieldValidations
  },

  /**
   * Returns true is Boost campaign (end_date) is valid
   * @param {object} boostCampaign
   * @param {int} sendDate
   * @return {boolean}
   */
  isBoostCampaignEndDateValid(boostCampaign, { sendDate } = {}) {
    if (!boostCampaign) {
      return true
    }
    const sendDateAsSeconds =
      sendDate || Math.floor(Date.now() / Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS)
    // eslint-disable-next-line camelcase
    return Number(boostCampaign.end_time) > sendDateAsSeconds
  },

  /**
   * Returns true is Boost campaign is the OBJECTIVE_VIDEO_VIEW if compatible with the message type
   * @param {object} boostCampaign
   * @param {boo} isVideoMessage
   * @return {boolean}
   */
  isBoostCampaignRequireVideoMessage(boostCampaign, { isVideoMessage } = {}) {
    if (boostCampaign?.social_network === SN_TYPES.LINKEDIN) {
      const objectiveType = boostCampaign.linkedin_spec.objective_type
      return isVideoMessage === (objectiveType === linkedinBoostUtils.objective.OBJECTIVE_VIDEO_VIEW)
    }
    return true
  },

  /**
   * Returns true if the video details are compatible with the Linkedin Ads spec (size < 200mb)
   * @param {object} boostCampaign
   * @param {bool} isVideoMessage
   * @param {object} videoDetails
   * @return {boolean}
   */
  isBoostCampaignVideoSizeValid(boostCampaign, { isVideoMessage, attachment } = {}) {
    if (boostCampaign?.social_network === SN_TYPES.LINKEDIN && isVideoMessage && attachment) {
      // File size Between 75 KB and 200 MB
      return attachment.bytes <= ComposerConstants.BOOST_CAMPAIGN.VIDEO_MAX_SIZE
    }
    return true
  },

  /**
   * Returns true if the video details are compatible with the Linkedin Ads spec (aspect ratio/resolution)
   * @param {object} boostCampaign
   * @param {bool} isVideoMessage
   * @param {object} videoDetails
   * @return {boolean}
   */
  isBoostCampaignVideoResolutionValid(boostCampaign, { isVideoMessage, attachment } = {}) {
    if (boostCampaign?.social_network !== SN_TYPES.LINKEDIN) {
      return true
    }

    if (isVideoMessage && attachment) {
      const { width, height } = attachment
      switch (attachment.displayAspectRatio) {
        // Video ads created with a 1:1 aspect ratio should have a minimum resolution of 600 x 600px
        // and a maximum resolution of 1080 x 1080px.
        case '1:1':
          return height >= 600 && height <= 1080 && _.isEqual(height, width)
        // Supported pixel ratio:
        //  - 360p (480 x 360; wide 640 x 360)
        //  - 480p (640 x 480)
        //  - 720p (960 x 720; wide 1280 x 720)
        //  - 1080p (1440 x 1080; wide 1920 x 1080)
        case '16:9':
          return (
            (height === 360 && width === 640) ||
            (height === 720 && width === 1280) ||
            (height === 1080 && width === 1920)
          )
        case '4:3':
          return (
            (height === 360 && width === 480) ||
            (height === 480 && width === 640) ||
            (height === 720 && width === 960) ||
            (height === 1080 && width === 1440)
          )
        default:
          return false
      }
    }

    return true
  },

  /**
   * Helper to validate Boost campaign field and add or remove specific errors
   * @param {object} fieldValidations
   * @param {object} boostCampaign
   * @param {object} messageData
   * @return {object}
   */
  validateBoostCampaign(fieldValidations = {}, boostCampaign, messageData) {
    const cleanedValidations = this.removeErrors(fieldValidations, [
      CUSTOM_ERRORS.BOOST_CAMPAIGN_END_DATE,
      CUSTOM_ERRORS.BOOST_CAMPAIGN_REQUIRE_VIDEO,
      CUSTOM_ERRORS.BOOST_CAMPAIGN_INVALID_VIDEO_OBJECTIVE,
      CUSTOM_ERRORS.BOOST_CAMPAIGN_INVALID_VIDEO_SIZE,
      CUSTOM_ERRORS.BOOST_CAMPAIGN_INVALID_VIDEO_RESOLUTION,
    ])

    const errorMessages = [
      messageData.isVideoMessage
        ? InvalidBoostSettingsInvalidVideoObjective
        : InvalidBoostSettingsRequireVideoMessage,
      InvalidBoostSettingsVideoSize,
      InvalidBoostSettingsVideoResolution,
      InvalidBoostSettingsEndDateError,
    ]
    const errors = [
      this.isBoostCampaignRequireVideoMessage,
      this.isBoostCampaignVideoSizeValid,
      this.isBoostCampaignVideoResolutionValid,
      this.isBoostCampaignEndDateValid,
    ].reduce((acc, func, i) => {
      if (!func(boostCampaign, messageData)) {
        return this.addCustomValidations(
          acc,
          [errorMessages[i]],
          FIELD_VALIDATIONS.BOOST_CAMPAIGN,
          ComposerConstants.ERROR_LEVELS.ERRORS,
        )
      }
      return acc
    }, cleanedValidations)

    return errors
  },

  /**
   * Returns true if video message is transcodeable
   * Video message is transcodeable when transcoding is enabled, there exists transcodeable info data, and there are no other video errors
   * @param {boolean} isTranscodingEnabled - if the feature entitlement is enabled
   * @param {object} fieldValidations instead of the selectedMessageForEdit
   * @param {function} hasVideoAttachment used instead of the selectedMessageForEdit
   * @return {boolean}
   */
  isVideoTranscodeable(isTranscodingEnabled, fieldValidations, hasVideoAttachment) {
    const hasErrors = ValidationUtils.hasErrorsByField(fieldValidations, FIELD_VALIDATIONS.ATTACHMENTS)
    return (
      isTranscodingEnabled &&
      hasVideoAttachment() &&
      this.hasVideoTranscodingInfoForAttachments(fieldValidations) &&
      !hasErrors
    )
  },

  /**
   * Transforms transcodeable infos into errors. There are two use-cases for this:
   * 1. Preventing bulk composer from sending transcodeable videos as its backend (PHP) currently doesn't support transcoding
   * @param {object} fieldValidations frontend formatted fieldValidations
   * @return {*}
   */
  convertTranscodeableInfosToErrors(fieldValidations) {
    if (ValidationUtils.hasValidationByField('info', fieldValidations, FIELD_VALIDATIONS.ATTACHMENTS)) {
      const transcodeableAttachmentInfos = fieldValidations.info[FIELD_VALIDATIONS.ATTACHMENTS].filter(info =>
        ValidationErrorMessages.videoTranscodeableErrors.includes(info.code),
      )
      const attachmentInfos = fieldValidations.info[FIELD_VALIDATIONS.ATTACHMENTS].filter(
        info => !ValidationErrorMessages.videoTranscodeableErrors.includes(info.code),
      )

      // move the transcodeable infos into the errors
      fieldValidations.errors[FIELD_VALIDATIONS.ATTACHMENTS] = fieldValidations.errors[
        FIELD_VALIDATIONS.ATTACHMENTS
      ]
        ? [...fieldValidations.errors[FIELD_VALIDATIONS.ATTACHMENTS], ...transcodeableAttachmentInfos]
        : [...transcodeableAttachmentInfos]

      // replace the attachment infos with the ones remaining after moving the transcodeable ones
      if (attachmentInfos.length) {
        fieldValidations.info[FIELD_VALIDATIONS.ATTACHMENTS] = attachmentInfos
      } else {
        delete fieldValidations.info[FIELD_VALIDATIONS.ATTACHMENTS]
      }
    }
    return fieldValidations
  },

  getSubtitlesErrorType(error, xhr) {
    const subtitlesErrorMap = {
      3003: InvalidSubtitlesFileName,
      3004: InvalidSubtitlesFileFormat,
    }
    const uploadErrorsMap = {
      [UPLOAD_ERROR_TYPE.INVALID_FILE_TYPE]: InvalidSubtitlesFileType,
    }

    try {
      const errorObject = JSON.parse(xhr.responseText)
      const errorCode = get(errorObject, 'codes', [])[0]

      return subtitlesErrorMap[errorCode] || InvalidSubtitlesGeneric
    } catch (e) {
      const isErrorVisible = !xhr && isString(error)

      return isErrorVisible
        ? get(uploadErrorsMap, error, InvalidSubtitlesGenericWithMsg(error))
        : InvalidSubtitlesGeneric
    }
  },

  /**
   * returns how many post send errors and unique num of social profiles impacted; groupedSocialProfiles is for post-send errors only
   * @param {object} fieldValidations frontend formatted fieldValidations
   * @return {object}
   */
  numPostSendValidationErrorsAndSocialProfiles(fieldValidations) {
    const numPostSendValidationErrorsAndSPs = {
      errors: [],
      numUniqueSocialProfiles: 0,
    }
    if (fieldValidations.errors) {
      const postSendErrors = Object.values(fieldValidations.errors)
        .reduce((acc, field) => acc.concat(field), [])
        .filter(err => Boolean(err.groupedSocialProfiles))
      const impactedSocialProfiles = postSendErrors.reduce((acc, err) => acc.concat(err.socialProfileIds), [])
      const uniqueImpactedSocialProfiles = impactedSocialProfiles.filter(
        (snId, index) => impactedSocialProfiles.indexOf(snId) === index,
      )
      numPostSendValidationErrorsAndSPs.errors = postSendErrors.reduce((acc, err) => acc.concat(err.code), [])
      numPostSendValidationErrorsAndSPs.numUniqueSocialProfiles = uniqueImpactedSocialProfiles.length
    }
    return numPostSendValidationErrorsAndSPs
  },

  /**
   * Returns true if at least one item of the errorCodes array
   * is present in the errorCodesToCompareTo array
   * @param {array} errorCodes an array of validation error codes
   * @param {array} errorCodesToCompareTo an array of error code constants used for comparison
   * @return {boolean}
   */
  hasMatchingError(errorCodes, errorCodesToCompareTo) {
    return _.intersection(errorCodes, errorCodesToCompareTo).length > 0
  },

  /**
   *  Returns an array of Per Network validation error codes in the following format:
   *  [{ socialProfileType: 'INSTAGRAM', errorCodes: [111, 222], fieldType: 'ATTACHMENTS' }]
   *  @param {object} fieldValidations frontend formatted fieldValidations
   *  @param {boolean} showOnSubmitErrors true when on submit errors should be shown
   *  @return {array}
   */
  getPerNetworkErrorCodes(fieldValidations: FieldValidations, showOnSubmitErrors: boolean) {
    // stores validations for each network for each validation type
    const fieldValidationErrors = []
    // stores condensed array of per network errors
    const perNetworkErrors = []

    // Retrieve all validation-related errors and warnings for each network
    const getFieldValidationsByErrorLevel = (errorType: string, errorLevel: ErrorLevel, field: string) => {
      const fieldValidationPerType = get(fieldValidations, [errorLevel, field], [])

      return fieldValidationPerType.reduce((fieldValidationErrors, perTypeError) => {
        const { showOnSubmitOnly = false } =
          ValidationErrorMessages.get({
            code: perTypeError?.code,
            socialProfileType: perTypeError?.socialProfileType,
          }) || {}
        if (showOnSubmitErrors || !showOnSubmitOnly) {
          fieldValidationErrors.push({
            errorType,
            errorLevel,
            ...perTypeError,
          })
        }
        return fieldValidationErrors
      }, [])
    }
    for (const [key, value] of Object.entries(FIELD_VALIDATIONS)) {
      fieldValidationErrors.push(
        ...getFieldValidationsByErrorLevel(key, ComposerConstants.ERROR_LEVELS.ERRORS, value),
        ...getFieldValidationsByErrorLevel(key, ComposerConstants.ERROR_LEVELS.WARNINGS, value),
      )
    }

    // Aggregate validation error codes that belong to the same network type into one array
    fieldValidationErrors.forEach(fieldValidationError => {
      const duplicatedNetwork = perNetworkErrors.find(network =>
        isFeatureEnabled('PUB_28744_MSG_TAB_TOOLTIP_FIX')
          ? network.socialProfileType === fieldValidationError.socialProfileType &&
            network.errorLevel === fieldValidationError.errorLevel
          : network.socialProfileType === fieldValidationError.socialProfileType,
      )
      // If network is already present in perNetworkErrors array - add a new error code to the appropriate network type
      if (duplicatedNetwork) {
        const index = perNetworkErrors?.indexOf(duplicatedNetwork)
        const errorCodes = [...duplicatedNetwork.errorCodes, fieldValidationError.code]
        perNetworkErrors.splice(index, 1, {
          socialProfileType: fieldValidationError.socialProfileType,
          errorCodes,
          errorTypes: perNetworkErrors[index]?.errorTypes?.concat(fieldValidationError.errorType),
          errorLevel: fieldValidationError.errorLevel,
        })
        // Else - push a new error to the array
      } else {
        perNetworkErrors.push({
          socialProfileType: fieldValidationError.socialProfileType,
          errorCodes: [fieldValidationError.code],
          errorTypes: [fieldValidationError.errorType],
          errorLevel: fieldValidationError.errorLevel,
        })
      }
    })

    return perNetworkErrors
  },

  getSnGroupsWithUnlinkedMention(
    innerMessages: Record<string, InnerMessage>,
    isMentionSearchInProgress: boolean,
    selectedNetworkTypes: Array<string>,
    selectedNetworkGroup?: SocialNetworkGroup,
  ) {
    const snGroupsWithUnlinkedMention: Array<string> = []

    selectedNetworkTypes.map(networkType => {
      const networkGroup = SN_TYPE_TO_SN_GROUP[networkType]
      const message = innerMessages[networkGroup]
      if (
        !MENTION_SUPPORTED_NETWORKS.includes(networkType) ||
        snGroupsWithUnlinkedMention.includes(networkGroup) ||
        !message
      ) {
        return
      }
      const text = ValidationUtils.stripUrlFromString(message.template || '')

      const unlinkedMentionMatches = isStringUnlinkedMention(text || '')

      if (message && unlinkedMentionMatches) {
        if (!(isMentionSearchInProgress && selectedNetworkGroup === networkGroup)) {
          snGroupsWithUnlinkedMention.push(networkGroup)
        }
      }
    })
    return snGroupsWithUnlinkedMention
  },

  hasMultipleUnlinkedMentions(message: InnerMessage) {
    const unlinkedMentionMatches = isStringUnlinkedMention(message?.template || '')

    if (!unlinkedMentionMatches || unlinkedMentionMatches.length === 0) {
      return false
    }
    return unlinkedMentionMatches.length > 1
  },

  stripUrlFromString(text: string): string {
    return text.replace(urlMatchRegex, '')
  },

  getThumbnailPreviewUnavailableWarning(): MessageValidationError {
    return {
      code: CUSTOM_ERRORS.FE_PREVIEW_THUMBNAIL_UNAVAILABLE,
      message:
        'This website is preventing us from displaying image previews. Please upload a custom thumbnail.',
    }
  },

  getInvalidLinkPreviewError(): MessageValidationError {
    return {
      code: CUSTOM_ERRORS.FE_INVALID_LINK_PREVIEW,
      message: "We couldn't populate a link preview",
    }
  },
}

export default ValidationUtils
