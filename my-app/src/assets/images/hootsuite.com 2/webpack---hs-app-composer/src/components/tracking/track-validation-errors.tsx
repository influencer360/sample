import { useEffect, memo } from 'react'
import { uniq } from 'lodash'
import { connect as reduxConnect } from 'react-redux'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import type { SocialNetworkType } from 'fe-pnc-constants-social-profiles'
import {
  store as composerMessageStore,
  getSelectedMessageValue,
  getSelectedMessage,
} from 'fe-pnc-data-composer-message'

import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import ValidationErrorMessages from 'fe-pnc-validation-error-messages'
import TrackingConstants from '@/constants/tracking'
import { validationActions } from '@/redux/reducers/validation'
import { RootState, AppDispatch } from '@/redux/store'
import { FieldValidations } from '@/typings/Message'
import { track } from '@/utils/tracking'
import ValidationUtils from '@/utils/validation-utils'

interface FetchProductTagsProps {
  errorCodesSeen: Array<number>
  fieldValidations: FieldValidations
  showOnSubmitErrors: boolean
  socialNetworkTypes: Array<SocialNetworkType>
  socialProfileIds: Array<number>
  dispatch: AppDispatch
}

export const TrackValidationErrors = ({
  errorCodesSeen = [],
  fieldValidations,
  showOnSubmitErrors = false,
  socialNetworkTypes = [],
  socialProfileIds = [],
  dispatch = (): any => {},
}: FetchProductTagsProps) => {
  useEffect(() => {
    dispatch(validationActions.resetErrorCodesSeen())
  }, [])

  // tracks new errors that have appeared
  useEffect(() => {
    const errorCodes = ValidationUtils.getErrorCodes(fieldValidations?.errors)
    const warningCodes = ValidationUtils.getErrorCodes(fieldValidations?.warnings)
    const infoCodes = ValidationUtils.getErrorCodes(fieldValidations?.info)

    const codes = uniq([...errorCodes, ...warningCodes, ...infoCodes])

    let unseenCodes = []
    for (const code of codes) {
      if (Number.isInteger(code) && !errorCodesSeen.includes(code) && ValidationErrorMessages[code]) {
        const { showOnSubmitOnly, trackingName, userError, specificity, difficultyToResolve, action } =
          ValidationErrorMessages[code]

        if (!showOnSubmitErrors && showOnSubmitOnly) {
          continue
        }

        unseenCodes = [...unseenCodes, code]

        if (isFeatureEnabled('PUB_30649_TRACK_DIFFICULTY_TO_RESOLVE_PROPERTY')) {
          track(
            'web.publisher.full_screen_composer',
            TrackingConstants.TRACKING_ACTION.COMPOSER_VALIDATION_APPEARED,
            {
              snTypes: socialNetworkTypes,
              profileIds: socialProfileIds,
              code: code,
              vars: ValidationUtils.getAllVariablesFromValidationsByCode(fieldValidations, code),
              category: ValidationUtils.getCategory(code, errorCodes, warningCodes),
              userError,
              trackingName,
              isActionable: !!action,
              specificity,
              difficultyToResolve,
            },
          )
        } else {
          track(
            'web.publisher.full_screen_composer',
            TrackingConstants.TRACKING_ACTION.COMPOSER_VALIDATION_APPEARED,
            {
              snTypes: socialNetworkTypes,
              profileIds: socialProfileIds,
              code: code,
              vars: ValidationUtils.getAllVariablesFromValidationsByCode(fieldValidations, code),
              category: ValidationUtils.getCategory(code, errorCodes, warningCodes),
              userError,
              trackingName,
              specificity,
            },
          )
        }
      }
    }
    if (unseenCodes.length > 0) {
      dispatch(validationActions.setErrorCodes([...errorCodesSeen, ...unseenCodes]))
    }
  }, [fieldValidations, errorCodesSeen, showOnSubmitErrors, socialNetworkTypes, socialProfileIds])

  // tracks errors that have been resolved
  useEffect(() => {
    const errorCodes = ValidationUtils.getErrorCodes(fieldValidations?.errors)
    const warningCodes = ValidationUtils.getErrorCodes(fieldValidations?.warnings)
    const infoCodes = ValidationUtils.getErrorCodes(fieldValidations?.info)

    const codes = uniq([...errorCodes, ...warningCodes, ...infoCodes])

    const newSeenCodes = errorCodesSeen.filter(codeSeen => {
      if (codes.includes(codeSeen)) {
        return true
      }

      if (ValidationErrorMessages[codeSeen]) {
        const { trackingName, userError } = ValidationErrorMessages[codeSeen]

        track('web.publisher.full_screen_composer', 'composer_validation_resolved', {
          snTypes: socialNetworkTypes,
          profileIds: socialProfileIds,
          code: codeSeen,
          vars: ValidationUtils.getAllVariablesFromValidationsByCode(fieldValidations, codeSeen),
          category: ValidationUtils.getCategory(codeSeen, errorCodes, warningCodes),
          userError,
          trackingName,
        })
      }

      return false
    })

    if (newSeenCodes?.length < errorCodesSeen.length) {
      dispatch(validationActions.setErrorCodes(newSeenCodes))
    }
  }, [fieldValidations, errorCodesSeen, showOnSubmitErrors, socialNetworkTypes, socialProfileIds])

  return null
}

export default memo(
  compose(
    reduxConnect(({ validation }: RootState) => ({
      showOnSubmitErrors: validation.showOnSubmitErrors,
      errorCodesSeen: validation.errorCodesSeen,
    })),
    connect(composerMessageStore, state => ({
      fieldValidations: getSelectedMessageValue(state, 'fieldValidations', false, {}),
      socialNetworkTypes: getSelectedMessage(state)?.getSocialNetworkTypes() ?? [],
      socialProfileIds: getSelectedMessage(state)?.getSocialNetworkIds() ?? [],
    })),
  )(TrackValidationErrors),
)
