import React, { useEffect } from 'react'
import { PENDO_TARGETS } from 'fe-lib-pendo'

const PENDO_SCHEDULED_MESSAGE_LIMIT_BANNER = 'pendo-scheduled-message-limit-banner-composer'
const PENDO_SCHEDULED_MESSAGE_COUNTER_BANNER = 'pendo-scheduled-message-counter-banner-composer'
const PENDO_SCHEDULED_MESSAGE_BANNER = 'pendo-scheduled-message-banner-composer'

const PendoScheduledBanner = ({ totalScheduledMessages, maxScheduledMessages }) => {
  useEffect(() => {
    const idElementToClick =
      totalScheduledMessages >= maxScheduledMessages
        ? PENDO_SCHEDULED_MESSAGE_LIMIT_BANNER
        : PENDO_SCHEDULED_MESSAGE_COUNTER_BANNER

    setTimeout(() => {
      document.getElementById(idElementToClick).click()
    }, 500)
    return function cleanup() {
      //eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      window?.pendo?.getActiveGuide()?.guide?.hide()
    }
  }, [totalScheduledMessages, maxScheduledMessages])

  return (
    <>
      <div
        id={PENDO_SCHEDULED_MESSAGE_BANNER}
        data-msg-count={totalScheduledMessages}
        data-msg-limit={maxScheduledMessages}
      />
      <div
        id={PENDO_SCHEDULED_MESSAGE_COUNTER_BANNER}
        data-dap-target={PENDO_TARGETS.SCHEDULED_MESSAGE_COUNTER_BANNER_COMPOSER}
      />
      <div
        id={PENDO_SCHEDULED_MESSAGE_LIMIT_BANNER}
        data-dap-target={PENDO_TARGETS.SCHEDULED_MESSAGE_LIMIT_BANNER_COMPOSER}
      />
    </>
  )
}

export default PendoScheduledBanner
