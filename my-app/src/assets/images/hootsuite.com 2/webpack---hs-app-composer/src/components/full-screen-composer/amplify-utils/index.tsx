import moment from 'moment-timezone'

import { logError } from 'fe-lib-logging'
import {
  getSelectedMessage,
  getSelectedMessageValue,
  getState as getComposerMessageState,
  selectedMessageInterface as SelectedMessageState,
} from 'fe-pnc-data-composer-message'

import { showAmplifyPublisherDialog } from '@/components/full-screen-composer/amplify-utils/components'
import {
  getErrorMessageFromError,
  getStackFromError,
  validateMessageForAmplify,
  informAmplifyUserForMissingPNESupport,
} from '@/components/full-screen-composer/amplify-utils/utils'
import Constants from '@/constants/constants'
import LOGGING_CATEGORIES from '@/constants/logging-categories'

const handleSendToAmplify = async (timezoneName, organizationId, customContext, closeCallback) => {
  const messageData = SelectedMessageState.toAmplifyRequest()
  const selectedMessage = getSelectedMessage(getComposerMessageState())
  const socialNetworkGroups = selectedMessage.getSocialNetworkGroups()

  const extendedInfo = getSelectedMessageValue(getComposerMessageState(), 'extendedInfo')
  const amplifyMessage = extendedInfo && extendedInfo.amplifyMessage

  if (!validateMessageForAmplify(messageData)) {
    return
  }

  if (socialNetworkGroups.length > 1 && !(await informAmplifyUserForMissingPNESupport())) {
    return
  }

  const scheduledDate = SelectedMessageState.getSendDate()
    ? moment(SelectedMessageState.getSendDate() * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS).tz(
        timezoneName,
      )
    : null

  try {
    await showAmplifyPublisherDialog(
      messageData,
      scheduledDate,
      timezoneName,
      organizationId,
      customContext,
      amplifyMessage,
    )
    closeCallback()
  } catch (error) {
    logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during send to Amplify', {
      errorMessage: JSON.stringify(getErrorMessageFromError(error)),
      stack: JSON.stringify(getStackFromError(error)),
    })
  }
}

export { handleSendToAmplify }
