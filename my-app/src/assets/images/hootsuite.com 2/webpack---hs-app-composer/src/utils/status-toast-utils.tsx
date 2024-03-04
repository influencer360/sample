import { CALLOUTS } from 'fe-comp-callout'
import { add as addCallout } from 'fe-lib-async-callouts'

export const AUTO_HIDE_TIME = 5000
export const AUTO_HIDE_TIME_LONG = 7000

const createCallout = (size, title, text, type, timeout, children) => {
  return addCallout({
    calloutType: size,
    type: type,
    titleText: title,
    messageText: text,
    timeout: timeout || AUTO_HIDE_TIME,
    children,
  })
}

const StatusToastUtils = {
  createToast(title, text, type, timeout, children) {
    return createCallout(CALLOUTS.TOAST.NAME, title, text, type, timeout, children)
  },
  createStatus(title, text, type, timeout, children) {
    return createCallout(CALLOUTS.STATUS.NAME, title, text, type, timeout, children)
  },
}

export default StatusToastUtils
