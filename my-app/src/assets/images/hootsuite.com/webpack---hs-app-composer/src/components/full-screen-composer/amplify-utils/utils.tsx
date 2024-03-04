import { TYPE_ERROR } from 'fe-comp-banner'
import { get as localStorageGet, set as localStorageSet } from 'fe-lib-localstorage'
import translation from 'fe-pnc-lib-hs-translation'

import { showAmplifyContentWarningDialog } from '@/components/full-screen-composer/amplify-utils/components'
import { TOAST_TIMEOUT } from '@/components/full-screen-composer/full-screen-composer'
import StatusToastUtils from '@/utils/status-toast-utils'

const UNABLE_TO_OPEN_AMPLIFY_PUBLISHER_DIALOG_CHARS_LIMIT = numChars =>
  translation
    ._("Amplify has a limit of 5000 characters. You've added %d. Adjust your text to make it shorter.")
    .replace('%d', numChars)
const UNABLE_TO_OPEN_AMPLIFY_PUBLISHER_DIALOG_NO_TEXT = translation._("Oops! You haven't added any text.")

const AMPLIFY_CHARS_THRESHOLD = 5000

const getErrorMessageFromError = (e: Error | unknown) => {
  if (e instanceof Error) {
    return e?.message || null
  }
  return null
}
const getStackFromError = (e: Error | unknown) => {
  if (e instanceof Error) {
    return e?.stack || null
  }
  return null
}

const validateMessageForAmplify = (messageData): boolean => {
  // block empty message
  if (
    (!messageData.message || messageData.message.length === 0) &&
    (!messageData.attachments || messageData.attachments.length === 0)
  ) {
    StatusToastUtils.createToast(
      '',
      UNABLE_TO_OPEN_AMPLIFY_PUBLISHER_DIALOG_NO_TEXT,
      TYPE_ERROR,
      TOAST_TIMEOUT,
      null,
    )
    return false
  }

  // block message over chars limit
  if (messageData.message && messageData.message.length > AMPLIFY_CHARS_THRESHOLD) {
    StatusToastUtils.createToast(
      '',
      UNABLE_TO_OPEN_AMPLIFY_PUBLISHER_DIALOG_CHARS_LIMIT(messageData.message.length),
      TYPE_ERROR,
      TOAST_TIMEOUT,
      null,
    )
    return false
  }

  return true
}

const informAmplifyUserForMissingPNESupport = async (): Promise<boolean> => {
  const avoidWarningStorageKey = 'amplify.avoid_content_warning_dialog'
  const avoidWarningStorageValue = localStorageGet(avoidWarningStorageKey)
  const avoidWarning: boolean = avoidWarningStorageValue ? JSON.parse(avoidWarningStorageValue) : false

  if (avoidWarning) {
    return true
  }

  const { confirmed, doNotShowAgain } = await showAmplifyContentWarningDialog()
  if (doNotShowAgain) {
    localStorageSet(avoidWarningStorageKey, JSON.stringify(doNotShowAgain))
  }
  return confirmed
}

export {
  getErrorMessageFromError,
  getStackFromError,
  validateMessageForAmplify,
  informAmplifyUserForMissingPNESupport,
}
