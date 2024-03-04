import { isEmpty } from 'lodash'
import { PLACEMENT_BOTTOM } from 'fe-hoc-tooltip'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'
import { getSelectedMessageValue, getState as getComposerMessageState } from 'fe-pnc-data-composer-message'
import translation from 'fe-pnc-lib-hs-translation'
import ComposerConstants from '@/constants/composer'
import { ErrorLevel } from '@/typings/Message'
import MessageUtils from '@/utils/message-utils'
import ValidationUtils from '@/utils/validation-utils'
import { getContentId } from '../message-edit-content/message-edit-content'
import { CONTENT, ERROR, ERRORS, WARNING, WARNINGS, INITIAL_CONTENT_TEXT } from './constants'

export const getSNIcon = (socialNetworkGroup: SocialNetworkGroup | null) => {
  if (socialNetworkGroup in SocialProfileConstants.SOCIAL_NETWORK_TABS) {
    return SocialProfileConstants.SOCIAL_NETWORK_TABS[socialNetworkGroup].icon
  }
  return
}

export const getSelectedTab = (
  selectedNetworkGroups: Array<SocialNetworkGroup>,
  selectedNetworkGroup: SocialNetworkGroup | null,
) => {
  if (selectedNetworkGroup) {
    return selectedNetworkGroup
  }
  if (!selectedNetworkGroup && selectedNetworkGroups.length === 1) {
    return selectedNetworkGroups[0]
  }
  return CONTENT
}

export const getContentTab = (selectedNetworkGroups: Array<SocialNetworkGroup>) => {
  if (selectedNetworkGroups.length === 1) {
    return {
      value: selectedNetworkGroups[0],
      ariaControls: getContentId(),
      ariaLabel: `${selectedNetworkGroups[0].charAt(0).toUpperCase()}${selectedNetworkGroups[0].slice(
        1,
      )} ${CONTENT}`,
    }
  }
  return {
    value: CONTENT,
    ariaControls: getContentId(),
    ariaLabel: INITIAL_CONTENT_TEXT,
  }
}

export const capitalizeFirstLetter = (string: string) => string.charAt(0).toUpperCase() + string.slice(1)

/**
 * @param errors An array of per network errors
 * @param errorLevel type
 * @returns A list of unique error codes for specified error type
 */
export const getErrorCodesByErrorLevel = (errors, errorLevel: ErrorLevel) => {
  const errorCodes = []
  errors.forEach(errorPerNetwork => {
    errorPerNetwork.errorCodes.forEach(errorCode => {
      if (!errorCodes.includes(errorCode)) {
        errorPerNetwork.errorLevel === errorLevel && errorCodes.push(errorCode)
      }
    })
  })
  return errorCodes
}

/**
 * @param {string} networkGroup
 * @param {boolean} shouldShowPrefix
 * @param {number} numErrorCodes
 * @param {number} numWarningCodes
 * @returns aria-label constructed based on the parameters above
 */
export const getAriaLabel = (networkGroup, shouldShowPrefix, numErrorCodes, numWarningCodes) => {
  const isPlural = number => number > 1
  const hasErrors = numErrorCodes > 0
  const hasWarnings = numWarningCodes > 0

  const ariaLabel = `${capitalizeFirstLetter(networkGroup)} ${CONTENT}`

  const ariaLabelErrorsAndWarnings = translation
    ._('%network content, there are %errorCount %errors and %warningCount %warnings with your content')
    .replace('%network', `${capitalizeFirstLetter(networkGroup)}`)
    .replace('%errorCount', numErrorCodes)
    .replace('%errors', isPlural(numErrorCodes) ? ERRORS : ERROR)
    .replace('%warningCount', numWarningCodes)
    .replace('%warnings', isPlural(numWarningCodes) ? WARNINGS : WARNING)

  const ariaLabelErrors = translation
    ._('%network content, there are %errorCount errors with your content')
    .replace('%network', `${capitalizeFirstLetter(networkGroup)}`)
    .replace('%errorCount', numErrorCodes)

  const ariaLabelError = translation
    ._('%network content, there is 1 error with your content')
    .replace('%network', `${capitalizeFirstLetter(networkGroup)}`)

  const ariaLabelWarnings = translation
    ._('%network content, there are %warningCount warnings about your content')
    .replace('%network', `${capitalizeFirstLetter(networkGroup)}`)
    .replace('%warningCount', numWarningCodes)

  const ariaLabelWarning = translation
    ._('%network content, there is 1 warning about your content')
    .replace('%network', `${capitalizeFirstLetter(networkGroup)}`)
    .replace('%warningCount', numWarningCodes)

  if (!shouldShowPrefix) {
    return ariaLabel
  }

  if (hasErrors && hasWarnings) {
    return ariaLabelErrorsAndWarnings
  } else if (hasErrors) {
    return isPlural(numErrorCodes) ? ariaLabelErrors : ariaLabelError
  } else {
    return isPlural(numWarningCodes) ? ariaLabelWarnings : ariaLabelWarning
  }
}

/**
 * @param {string} networkGroup
 * @param {number} numErrorCodes
 * @param {number} numWarningCodes
 * @returns Tooltip text constructed based on the parameters above
 */
export const getTooltipText = (networkGroup, numErrorCodes, numWarningCodes) => {
  const isPlural = number => number > 1
  const hasErrors = numErrorCodes > 0
  const hasWarnings = numWarningCodes > 0

  const tooltipTextErrorsAndWarnings = translation
    ._('%network content has %errorCount %errors and %warningCount %warnings')
    .replace('%network', capitalizeFirstLetter(networkGroup))
    .replace('%errorCount', numErrorCodes)
    .replace('%errors', isPlural(numErrorCodes) ? ERRORS : ERROR)
    .replace('%warningCount', numWarningCodes)
    .replace('%warnings', isPlural(numWarningCodes) ? WARNINGS : WARNING)

  const tooltipTextErrors = translation
    ._('%network content has %errorCount %errors')
    .replace('%network', capitalizeFirstLetter(networkGroup))
    .replace('%errorCount', numErrorCodes)
    .replace('%errors', isPlural(numErrorCodes) ? ERRORS : ERROR)

  const tooltipTextWarnings = translation
    ._('%network content has %warningCount %warnings')
    .replace('%network', capitalizeFirstLetter(networkGroup))
    .replace('%warningCount', numWarningCodes)
    .replace('%warnings', isPlural(numWarningCodes) ? WARNINGS : WARNING)

  return hasErrors && hasWarnings
    ? tooltipTextErrorsAndWarnings
    : hasErrors
    ? tooltipTextErrors
    : tooltipTextWarnings
}

export const getTabs = (
  isBulkComposer,
  selectedNetworkGroups,
  perNetworkErrorCodes,
  snGroupsWithUnlinkedMention: Array<string>,
  showOnSubmitErrors,
) => {
  const contentTab = [getContentTab(selectedNetworkGroups)]

  if (!isBulkComposer && selectedNetworkGroups.length > 1) {
    const networkTabs = selectedNetworkGroups
      .filter(
        networkGroup => Object.keys(SocialProfileConstants.SOCIAL_NETWORK_TABS).indexOf(networkGroup) !== -1,
      )
      .map((networkGroup: SocialNetworkGroup | null) => {
        const hasAttachments =
          MessageUtils.getAttachmentsBySelectedNetwork(
            getSelectedMessageValue(getComposerMessageState(), 'messages', false, []),
            networkGroup,
          )?.length > 0

        const errorsAndWarningsPerNetwork = perNetworkErrorCodes?.filter(
          errorCode =>
            errorCode?.socialProfileType &&
            MessageUtils.isNetworkTypeInGroup(errorCode?.socialProfileType, networkGroup),
        )

        // Separate errors from warnings
        const errorPerNetwork = errorsAndWarningsPerNetwork.find(
          error => error.errorLevel === ComposerConstants.ERROR_LEVELS.ERRORS,
        )
        const warningPerNetwork = errorsAndWarningsPerNetwork.find(
          warning => warning.errorLevel === ComposerConstants.ERROR_LEVELS.WARNINGS,
        )

        // Error takes priority if both errors and warnings are present
        const perNetworkErrorCode = errorPerNetwork || warningPerNetwork

        // Calculate number of error codes and warning codes to build tooltip text and aria-label
        const errorCodes = getErrorCodesByErrorLevel(
          errorsAndWarningsPerNetwork,
          ComposerConstants.ERROR_LEVELS.ERRORS,
        )
        const warningCodes = getErrorCodesByErrorLevel(
          errorsAndWarningsPerNetwork,
          ComposerConstants.ERROR_LEVELS.WARNINGS,
        )

        const showAttachmentError =
          !isEmpty(perNetworkErrorCode?.errorCodes) &&
          perNetworkErrorCode?.errorTypes?.includes('ATTACHMENTS') &&
          (hasAttachments || showOnSubmitErrors)

        const hasError =
          ValidationUtils.hasMatchingError(perNetworkErrorCode?.errorCodes, [
            ComposerConstants.ERROR_CODES.MESSAGE_BODY_TOO_LONG,
            ComposerConstants.ERROR_CODES.MESSAGE_BODY_REQUIRED,
          ]) ||
          snGroupsWithUnlinkedMention.includes(networkGroup) ||
          showAttachmentError ||
          false

        // Unlinked mentions warning doesn't get included in fieldValidations, so we have to manually add it to the number of warnings
        const numWarnings = snGroupsWithUnlinkedMention.includes(networkGroup)
          ? warningCodes?.length + 1
          : warningCodes?.length

        const tooltipText = getTooltipText(networkGroup, errorCodes?.length, numWarnings)
        const ariaLabel = getAriaLabel(networkGroup, hasError, errorCodes?.length, numWarnings)

        return {
          value: networkGroup,
          hasError,
          ariaControls: getContentId(networkGroup),
          ariaLabel,
          errorLevel: perNetworkErrorCode?.errorLevel,
          ...(hasError && {
            tooltipProps: {
              text: tooltipText,
              placement: PLACEMENT_BOTTOM,
              zIndex: 4,
            },
          }),
        }
      })
    return [...contentTab, ...networkTabs]
  }
  return contentTab
}
