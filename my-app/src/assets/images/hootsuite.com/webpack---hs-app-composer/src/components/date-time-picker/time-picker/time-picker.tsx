import React from 'react'

import _ from 'underscore'
import Gear from '@fp-icons/emblem-gear'
import Icon from '@fp-icons/icon-base'
import { Button, ICON, SIZE_28 } from 'fe-comp-button'
import { TOP_MIDDLE } from 'fe-comp-dropdown'
import { PLACEMENT_TOP, tooltip } from 'fe-hoc-tooltip'
import translation from 'fe-pnc-lib-hs-translation'

import Constants from '@/constants/constants'
import TimePickerConstants from '@/constants/time-picker'
import { Time } from '@/typings/TimePicker'

import {
  HourDropdown,
  MinuteDropdown,
  PeriodDropdown,
  StyledDropdownMenu,
  TimePickerContainer,
  TimePickerDropdownWrapper,
  Timezone,
  TimezoneContainer,
} from './time-picker.style'

const DROPDOWN_MAX_HEIGHT = '400px'
const TIME_PICKER_WIDTH = '88px'

const HOUR_LABEL = translation._('Select hour')
const MINUTE_LABEL = translation._('Select minute')
const AM_PM_LABEL = translation._('Select AM/PM')
const SETTINGS = translation._('Settings')

const SettingsButtonWithTooltip = tooltip(
  props => (
    <Button type={ICON} height={SIZE_28} aria-label={SETTINGS} {...props}>
      <Icon glyph={Gear} fill="current-color" />
    </Button>
  ),
  () => ({
    placement: PLACEMENT_TOP,
    text: SETTINGS,
  }),
)
SettingsButtonWithTooltip.displayName = 'SettingsButtonWithTooltip'

interface TimePickerProps {
  onTimeChange(...args: Array<unknown>): unknown
  selectedTime?: Time
  timeFromGMT: string
}

export default class TimePicker extends React.Component<TimePickerProps> {
  static displayName = 'TimePicker'

  static defaultProps = {
    selectedTime: TimePickerConstants.DEFAULT_TIME,
  }

  constructor(props) {
    super(props)

    this.hourDropdownNode = null
    this.minuteDropdownNode = null
    this.periodDropdownNode = null
    this.hourDropdownUtils = null
    this.minuteDropdownUtils = null
    this.periodDropdownUtils = null

    this.state = {
      selectedTime: props.selectedTime,
      isClose: true,
    }
  }

  componentDidMount() {
    window.addEventListener('click', this.onDocumentClick, true)
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.onDocumentClick, true)
  }

  onDocumentClick = e => {
    const closeDropdownIfClickedOutside = (node, utils) => {
      if (node && !node.contains(e.target) && utils && typeof utils.closeDropdown === 'function') {
        utils.closeDropdown()
      }
    }
    closeDropdownIfClickedOutside(this.hourDropdownNode, this.hourDropdownUtils)
    closeDropdownIfClickedOutside(this.minuteDropdownNode, this.minuteDropdownUtils)
    closeDropdownIfClickedOutside(this.periodDropdownNode, this.periodDropdownUtils)
  }

  /**
   * Event handler when the dropdown values change
   * @param {String} key
   * @param {String} value
   */
  handleTimeDropdownChange(key, value) {
    const newSelectedTime = _.clone(this.state.selectedTime)

    if (key === TimePickerConstants.SELECTOR.PERIOD) {
      newSelectedTime[key] = value
    } else {
      newSelectedTime[key] = parseInt(value)
    }

    this.setState({
      selectedTime: newSelectedTime,
    })
    this.props.onTimeChange(newSelectedTime)
  }

  renderTimeDropdown() {
    const { selectedTime } = this.state
    const hours = []
    _.times(Constants.YOUTUBE_SCHEDULER.NUM_HOURS_TO_DISPLAY, hour => {
      // Add 1 as hour begins at 0 and we want to display 1 to 12
      const hourString = (hour + 1).toString()
      hours.push(hourString)
    })

    const minutes = _.map(Constants.YOUTUBE_SCHEDULER.MINUTES_TO_DISPLAY, minute => {
      // Prepend 0 and take the rightmost 2 characters to form 00, 05, 10 etc. for the minutes
      return `0${minute}`.slice(-2)
    })
    const periods = [Constants.DATE_TIME.AM, Constants.DATE_TIME.PM]
    const selectedHourIndex = this.state.selectedTime.hour - 1
    const selectedMinuteIndex = this.state.selectedTime.minute / 5
    const selectedPeriodIndex = this.state.selectedTime.period === Constants.DATE_TIME.AM ? 0 : 1

    return (
      <TimePickerDropdownWrapper>
        <HourDropdown ref={node => (this.hourDropdownNode = node)}>
          <StyledDropdownMenu
            ariaLabel={HOUR_LABEL}
            attachmentPosition={TOP_MIDDLE}
            maxHeight={DROPDOWN_MAX_HEIGHT}
            width={TIME_PICKER_WIDTH}
            defaultLabel={selectedTime.hour.toString()}
            onSelect={index => this.handleTimeDropdownChange(TimePickerConstants.SELECTOR.HOUR, hours[index])}
            utils={utils => (this.hourDropdownUtils = utils)}
            selectedItem={selectedHourIndex}
          >
            {hours}
          </StyledDropdownMenu>
        </HourDropdown>
        <MinuteDropdown ref={node => (this.minuteDropdownNode = node)}>
          <StyledDropdownMenu
            ariaLabel={MINUTE_LABEL}
            attachmentPosition={TOP_MIDDLE}
            maxHeight={DROPDOWN_MAX_HEIGHT}
            width={TIME_PICKER_WIDTH}
            defaultLabel={selectedTime.minute.toString()}
            onSelect={index =>
              this.handleTimeDropdownChange(TimePickerConstants.SELECTOR.MINUTE, minutes[index])
            }
            utils={utils => (this.minuteDropdownUtils = utils)}
            selectedItem={selectedMinuteIndex}
          >
            {minutes}
          </StyledDropdownMenu>
        </MinuteDropdown>
        <PeriodDropdown ref={node => (this.periodDropdownNode = node)}>
          <StyledDropdownMenu
            ariaLabel={AM_PM_LABEL}
            attachmentPosition={TOP_MIDDLE}
            maxHeight={DROPDOWN_MAX_HEIGHT}
            width={TIME_PICKER_WIDTH}
            defaultLabel={selectedTime.period}
            onSelect={index =>
              this.handleTimeDropdownChange(TimePickerConstants.SELECTOR.PERIOD, periods[index])
            }
            utils={utils => (this.periodDropdownUtils = utils)}
            selectedItem={selectedPeriodIndex}
          >
            {periods}
          </StyledDropdownMenu>
        </PeriodDropdown>
      </TimePickerDropdownWrapper>
    )
  }

  render() {
    const { timeFromGMT } = this.props

    return (
      <TimePickerContainer>
        {this.renderTimeDropdown()}
        <TimezoneContainer>
          <Timezone>{timeFromGMT}</Timezone>
        </TimezoneContainer>
      </TimePickerContainer>
    )
  }
}
