import React, { useState } from 'react'

import { A } from 'fe-comp-dom-elements'
import { BOTTOM, Popover, WINDOW } from 'fe-comp-popover'
import { AUTO_SCHEDULE_MESSAGE } from 'fe-lib-entitlements'
import translation from 'fe-pnc-lib-hs-translation'

import Constants from '@/constants/constants'
import { EntitlementsUtils } from '@/utils/entitlement-utils'
import {
  AutoScheduleHelpWrapper,
  AutoScheduleInputToggle,
  AutoScheduleSelector,
  AutoScheduleSelectorHelpIcon,
  AutoScheduleSelectorLabel,
  AutoScheduleSelectorToggle,
  PopoverTitle,
} from './autoschedule-toggle.style'

const AUTOSCHEDULE_HELP_HEADING = translation._('What is AutoSchedule?')
// prettier-ignore
const AUTOSCHEDULE_HELP_TEXT = translation._('Hootsuite will choose an optimal time to post, allowing you to easily schedule posts with one click.')
const AUTOSCHEDULE_HELP_LINK_TEXT = translation._('Learn more')
const AUTOSCHEDULE_HELP_ICON_CLASS = 'composerAutoScheduleHelpButton'

const AUTOSCHEDULE_TOGGLE_LABEL = translation._('AutoSchedule')

export const AutoscheduleHelpPopover = ({ visible, onDismiss }) => (
  <Popover
    boundariesElement={WINDOW}
    isOpen={visible}
    target={`.${AUTOSCHEDULE_HELP_ICON_CLASS}`}
    popTo={BOTTOM}
    closeOnClickOutside={true}
    onExitClick={onDismiss}
  >
    <PopoverTitle>{AUTOSCHEDULE_HELP_HEADING}</PopoverTitle>
    {AUTOSCHEDULE_HELP_TEXT}&nbsp;
    <A
      href="https://help.hootsuite.com/hc/en-us/articles/204586040#2"
      rel="noopener noreferrer"
      target="_blank"
    >
      {AUTOSCHEDULE_HELP_LINK_TEXT}
    </A>
  </Popover>
)

const AutoscheduleToggle = ({ isInitialOpen, inputLabel, onToggleAutoschedule, isChecked, entitlements }) => {
  const [helpPopoverVisible, setHelpPopoverVisible] = useState(false)

  const toggleHelpPopover = e => {
    e.stopPropagation()
    if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation()
    }

    setHelpPopoverVisible(!helpPopoverVisible)
  }
  const handleAutoScheduleSelectorHelpIconKeyPress = e => {
    if (e.key === Constants.KEY_VALUES.ENTER) {
      toggleHelpPopover(e)
    }
  }
  const handleAutoScheduleInputToggleKeyPress = e => {
    if (e.key === Constants.KEY_VALUES.ENTER) {
      typeof onToggleAutoschedule === 'function' && onToggleAutoschedule(e)
    }
  }

  if (EntitlementsUtils.isFeatureEnabled(entitlements, AUTO_SCHEDULE_MESSAGE)) {
    return (
      <AutoScheduleSelector initialOpen={isInitialOpen}>
        <AutoScheduleSelectorLabel>{AUTOSCHEDULE_TOGGLE_LABEL}</AutoScheduleSelectorLabel>
        <AutoScheduleSelectorHelpIcon
          aria-haspopup="true"
          className={AUTOSCHEDULE_HELP_ICON_CLASS}
          onClick={toggleHelpPopover}
          onKeyPress={handleAutoScheduleSelectorHelpIconKeyPress}
          role="button"
          tabIndex="0"
        />
        <AutoScheduleHelpWrapper>
          <AutoscheduleHelpPopover visible={helpPopoverVisible} onDismiss={toggleHelpPopover} />
        </AutoScheduleHelpWrapper>
        <AutoScheduleSelectorToggle>
          <AutoScheduleInputToggle
            label={inputLabel}
            onChange={onToggleAutoschedule}
            onKeyPress={handleAutoScheduleInputToggleKeyPress}
            checked={isChecked}
          />
        </AutoScheduleSelectorToggle>
      </AutoScheduleSelector>
    )
  }

  return null
}

export default AutoscheduleToggle
