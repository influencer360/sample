import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import Calendar from '@fp-icons/emblem-calendar'
import Clock from '@fp-icons/emblem-clock'
import AlertTriangle from '@fp-icons/symbol-alert-triangle'

import { Button } from 'fe-comp-button'
import { on, off } from 'fe-lib-hootbus'
import { ExpandedUiMixin } from 'fe-pnc-comp-composer-modal'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'

import Constants from '@/constants/constants'
import { KEYBOARD_SHORTCUTS_EVENTS } from '@/constants/events'
import TrackingConstants from '@/constants/tracking'
import { DateRange } from '@/typings/TimePicker'
import { formatDateTime, formatDateTimeRange } from '@/utils/composer-date-time-utils'
import { track } from '@/utils/tracking'
import Pill from './Pill'

const INVALID_TIME = translation._('Invalid time selected')
const SCHEDULE_FOR_LATER = translation._('Schedule for later')
const AUTOSCHEDULE_ENABLED = translation._('AutoSchedule enabled')

const StyledDateTimeButton = styled(Button)`
  ${p => !p.isPrimary && ExpandedUiMixin}
`

type DateTimeButtonProps = {
  isActive?: boolean
  isPrimary?: boolean
  isAutoscheduled?: boolean
  isBeingScheduled?: boolean
  isDraft?: boolean
  isEdit?: boolean
  hasSendDateErrors?: boolean
  onClose?: (event?: React.MouseEvent<HTMLElement>) => void
  sendDate?: Date | DateRange | null
  timezoneName?: string
}

export const DateTimeButton: React.FunctionComponent<DateTimeButtonProps> = ({
  isActive = false,
  isPrimary = false,
  isAutoscheduled = false,
  isBeingScheduled = false,
  isDraft = false,
  isEdit = false,
  hasSendDateErrors = false,
  onClose = () => {},
  sendDate = null,
  timezoneName = Constants.DATE_TIME.VANCOUVER_TIMEZONE,
}) => {
  const buttonRef = useRef(null)

  useEffect(() => {
    const handleKeyboardShortcutEvent = () => {
      if (buttonRef.current) {
        buttonRef.current.click()
      }
    }

    on(KEYBOARD_SHORTCUTS_EVENTS.SCHEDULE_POST, handleKeyboardShortcutEvent)

    return () => {
      off(KEYBOARD_SHORTCUTS_EVENTS.SCHEDULE_POST, handleKeyboardShortcutEvent)
    }
  }, [])

  const isClosable = !isEdit || isDraft

  if (!isBeingScheduled || !sendDate) {
    return (
      <StyledDateTimeButton
        ref={buttonRef}
        isPrimary={isPrimary}
        onClick={() => {
          if (isFeatureEnabled('PUB_30348_TRACK_SEND_NOW_ACTIONS')) {
            track(
              TrackingConstants.TRACKING_CONTEXT.COMPOSER,
              TrackingConstants.TRACKING_ACTIONS.NEW.NEW_COMPOSE.SCHEDULE_FOR_LATER,
            )
          }
        }}
      >
        {SCHEDULE_FOR_LATER}
      </StyledDateTimeButton>
    )
  }

  if (isAutoscheduled) {
    return (
      <Pill
        isActive={isActive}
        isClosable={isClosable}
        isPrimary={isPrimary}
        onClose={onClose}
        iconGlyph={Clock}
      >
        {AUTOSCHEDULE_ENABLED}
      </Pill>
    )
  }

  if (sendDate && !hasSendDateErrors) {
    return (
      <Pill
        isActive={isActive}
        isPrimary={isPrimary}
        isClosable={isClosable}
        onClose={onClose}
        iconGlyph={Calendar}
      >
        {sendDate instanceof Date
          ? formatDateTime(sendDate, timezoneName)
          : formatDateTimeRange(sendDate, timezoneName)}
      </Pill>
    )
  }

  return (
    <Pill
      isActive={isActive}
      isPrimary={isPrimary}
      isClosable={isClosable}
      onClose={onClose}
      iconGlyph={AlertTriangle}
      hasError={true}
    >
      {INVALID_TIME}
    </Pill>
  )
}

DateTimeButton.displayName = 'DateTimeButton'

export default DateTimeButton
