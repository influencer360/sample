import React from 'react'
import get from 'lodash/get'
import moment from 'moment-timezone'
import { connect as reduxConnect } from 'react-redux'

import _ from 'underscore'

import DatePicker from 'fe-comp-date-picker'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { AUTO_SCHEDULE_MESSAGE, VIDEO_TRANSCODING } from 'fe-lib-entitlements'
import { get as localStorageGet } from 'fe-lib-localstorage'
import { ValidationBanner } from 'fe-pnc-comp-field-validation-item'
import {
  actions as ComposerMessageActions,
  store as composerMessageStore,
  getSelectedMessage,
} from 'fe-pnc-data-composer-message'
import { FocusManager } from 'fe-pnc-lib-focus-manager'
import translation from 'fe-pnc-lib-hs-translation'
import { jsxFromTemplate, DateUtils } from 'fe-pnc-lib-utils'
import { FIELD_VALIDATIONS, FIELD_TYPES } from 'fe-pnc-validation-error-messages'

import ComposerConstants from '@/constants/composer'
import Constants from '@/constants/constants'
import TimePickerConstants from '@/constants/time-picker'
import Message from '@/models/message'
import { RootState } from '@/redux/store'
import { Entitlements } from '@/typings/Flux'
import { buildDaysString, convertTimeInSecondsToHourString } from '@/utils/composer-date-time-utils'
import { EntitlementsUtils } from '@/utils/entitlement-utils'
import statusObject, { StatusObject } from '@/utils/status-bar'
import { track } from '@/utils/tracking'
import ValidationUtils from '@/utils/validation-utils'

import TimePicker from '../time-picker/time-picker'
import AutoScheduleImage from './autoschedule-image'
import AutoscheduleToggle from './autoschedule-toggle'
import {
  AutoScheduleInfo,
  AutoScheduleInfoBtn,
  AutoScheduleInfoBtnContainer,
  AutoScheduleInfoImageWrapper,
  AutoScheduleInfoText,
  AutoScheduleInfoTimezone,
  DateTimePicker,
  DateTimePickerWrapper,
  DoneBtnContainer,
  SendDateErrorContainer,
  SetButton,
} from './single-date-time-picker.style'
const DONE = translation._('Done')
const COMPOSE_AUTOSCHEDULE_STATE_ON = translation._('On')
const COMPOSE_AUTOSCHEDULE_STATE_OFF = translation._('Off')
const ADJUST_SETTINGS = translation._('Adjust Settings')
// prettier-ignore
const AUTOSCHEDULE_SETTINGS_DEFAULT = translation._('Hootsuite will choose a time for optimal impact based on your autoschedule settings.')
// prettier-ignore
const AUTOSCHEDULE_SETTINGS_WITH_VALUES = translation._('Hootsuite will choose a time for optimal impact between %b %s1 %/b and %b %s2 %/b on %b %s3 %/b, up to a maximum of %b %s4 posts per day%/b.')

// constants for accessing first day of week from local storage
const LAST_USED_FIRST_DAY_OF_WEEK_FILTER = 'pnc_preferences_first_day_of_week_filter'
const SUNDAY = 'SUNDAY'
const MONDAY = 'MONDAY'
const NORTH_AMERICA_WEST_TIMEZONE_EDGE = -11
const NORTH_AMERICA_EAST_TIMEZONE_EDGE = -1
const AUSTRALIA_WEST_TIMEZONE_EDGE = 8
const NZ_EAST_TIMEZONE_EDGE = 12
const NUM_MIN_IN_HOUR = 60

const AutoscheduleInfo = ({ timezoneName, autoScheduleSettings, onAdjustSettings, entitlements }) => {
  if (EntitlementsUtils.isFeatureEnabled(entitlements, AUTO_SCHEDULE_MESSAGE)) {
    let settingsText
    const offset = moment.tz(timezoneName).format('Z').slice(0, -3)
    const timeFromGMT = `${Constants.DATE_TIME.GMT}${offset} ${timezoneName}`

    if (typeof autoScheduleSettings === 'object' && Object.keys(autoScheduleSettings).length > 0) {
      settingsText = AUTOSCHEDULE_SETTINGS_WITH_VALUES.replace(
        '%s1',
        convertTimeInSecondsToHourString(autoScheduleSettings.startTime),
      )
        .replace('%s2', convertTimeInSecondsToHourString(autoScheduleSettings.endTime))
        .replace('%s3', buildDaysString(autoScheduleSettings.days))
        .replace('%s4', autoScheduleSettings.postsPerDay)
    } else {
      settingsText = AUTOSCHEDULE_SETTINGS_DEFAULT
    }
    return (
      <AutoScheduleInfo>
        <AutoScheduleInfoImageWrapper>
          <AutoScheduleImage />
        </AutoScheduleInfoImageWrapper>
        <AutoScheduleInfoText>{jsxFromTemplate(settingsText)}</AutoScheduleInfoText>
        <AutoScheduleInfoBtnContainer>
          <AutoScheduleInfoBtn onClick={onAdjustSettings}>{ADJUST_SETTINGS}</AutoScheduleInfoBtn>
          <AutoScheduleInfoTimezone>{timeFromGMT}</AutoScheduleInfoTimezone>
        </AutoScheduleInfoBtnContainer>
      </AutoScheduleInfo>
    )
  }
  return null
}

interface SingleDateTimePickerProps {
  entitlements: Entitlements
  autoScheduleSettings: Record<string, unknown>
  defaultSelectedDateTime?: Date
  enabledDays?: {
    dateFrom?: Date
    dateTo?: Date
  }
  errors?: Array<unknown>
  isAutoscheduled?: boolean
  isBulkComposer?: boolean
  isEditMode?: boolean
  isInitialOpen?: boolean
  isSchedulerOpen?: boolean
  isVideoMessage?: boolean
  memberId?: number
  minimumScheduleMinutes?: number
  onSetDateTime(...args: Array<unknown>): unknown
  selectedMessageForEdit?: Message
  showAutoScheduleSettings?(): void
  showOnSubmitErrors?: boolean
  timezoneName?: string
}

export class SingleDateTimePicker extends React.Component<SingleDateTimePickerProps> {
  readonly composerMessageActions: typeof ComposerMessageActions
  static displayName = 'SingleDateTimePicker'

  static defaultProps = {
    autoScheduleSettings: {},
    errors: [],
    isAutoscheduled: false,
    isBulkComposer: false,
    isEditMode: false,
    isInitialOpen: false,
    isSchedulerOpen: false,
    isVideoMessage: false,
    memberId: null,
    selectedMessageForEdit: null,
    showOnSubmitErrors: false,
  }

  statusObject: StatusObject

  constructor(props) {
    super(props)

    // We want to make sure we're always using the same instance. This is important for dependency injection
    this.statusObject = statusObject
    this.composerMessageActions = ComposerMessageActions

    const today = moment().tz(props.timezoneName)
    let defaultDateTime = today.toDate()
    let selectedTime = TimePickerConstants.DEFAULT_TIME

    if (_.isNull(props.defaultSelectedDateTime)) {
      if (props.enabledDays) {
        const dateFrom = props.enabledDays.dateFrom
        const dateTo = props.enabledDays.dateTo
        if (moment().isAfter(dateFrom) && moment().isBetween(dateFrom, dateTo, 'day', [])) {
          defaultDateTime = today.toDate()
        } else {
          defaultDateTime = dateFrom
        }
      }
      if (props.minimumScheduleMinutes) {
        selectedTime = DateUtils.getNextTimeSlot(defaultDateTime, this.props.isVideoMessage)
      }
    } else {
      if (props.minimumScheduleMinutes) {
        selectedTime = this.dateTimeToTimeSlot(props.defaultSelectedDateTime)
      }
      defaultDateTime = props.defaultSelectedDateTime
    }

    if (!this.props.isEditMode && _.isNull(props.defaultSelectedDateTime)) {
      let localStorageTime
      let selectedTimeMinimumMinutes = selectedTime
      const currentTime = moment().tz(props.timezoneName).toDate()
      if (
        localStorage &&
        this.props.memberId &&
        localStorage.getItem(Constants.LAST_SCHEDULED_TIME_LOCAL_STORAGE)
      ) {
        localStorageTime = JSON.parse(localStorage.getItem(Constants.LAST_SCHEDULED_TIME_LOCAL_STORAGE))[
          this.props.memberId
        ]
        if (props.minimumScheduleMinutes) {
          // returns next valid time slot without the additional hour
          selectedTimeMinimumMinutes = DateUtils.getNextTimeSlot(currentTime, this.props.isVideoMessage, true)
        }
        let isValidCampaignTime = true
        if (props.enabledDays) {
          const dateFrom = props.enabledDays.dateFrom
          const dateTo = props.enabledDays.dateTo
          if (!moment(localStorageTime).isBetween(dateFrom, dateTo, 'day', [])) {
            isValidCampaignTime = false
          }
        }
        const currentValidTime = DateUtils.formatDateWithTimeAndTimezone(
          currentTime,
          selectedTimeMinimumMinutes,
          props.timezoneName,
        )

        if (
          localStorageTime &&
          props.timezoneName &&
          moment(localStorageTime).isAfter(currentValidTime) &&
          isValidCampaignTime
        ) {
          defaultDateTime = new Date(localStorageTime)
          selectedTime = this.dateTimeToTimeSlot(defaultDateTime)
        } else {
          // localStorage is invalid - remove it and use the next valid date
          localStorage.removeItem(Constants.LAST_SCHEDULED_TIME_LOCAL_STORAGE)
          // Initial defaultDateTime value has current minutes/seconds (ie. now) but should get set to
          //   selectedTimeMinimumMinutes, like if user were to click today's date.
          defaultDateTime = DateUtils.formatDateWithTimeAndTimezone(
            defaultDateTime,
            selectedTimeMinimumMinutes,
            props.timezoneName,
          )
          selectedTime = selectedTimeMinimumMinutes
        }
      } else {
        // Initial defaultDateTime value has current minutes/seconds (now) but should get set to
        //   selectedTimeMinimumMinutes, like if user were to click today's date.
        defaultDateTime = DateUtils.formatDateWithTimeAndTimezone(
          defaultDateTime,
          selectedTime,
          props.timezoneName,
        )
      }

      props.onSetDateTime(defaultDateTime, props.isAutoscheduled)
    }

    this.state = {
      selectedDate: defaultDateTime,
      selectedTime,
      isShowGetAutoSchedulePopover: false,
    }
  }

  componentDidMount() {
    if (this.props.isSchedulerOpen && this.singleDateTimePickerNode) {
      this.focusSingleDateTimePicker()
    }
  }

  componentWillUnmount() {
    if (this.props.isSchedulerOpen) {
      this.removeSingleDateTimePickerFocus()
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.singleDateTimePickerNode) {
      if (!this.props.isSchedulerOpen && nextProps.isSchedulerOpen) {
        this.focusSingleDateTimePicker()
      } else if (this.props.isSchedulerOpen && !nextProps.isSchedulerOpen) {
        this.removeSingleDateTimePickerFocus()
      }
    }
  }

  isKeyDownInDatePicker = target => target && target.className && target.className.includes('DayPicker-Day')

  onKeyDown = event => {
    if (event.key === Constants.KEY_VALUES.ENTER && !this.isKeyDownInDatePicker(event.target)) {
      event.stopPropagation()
    }
  }

  focusSingleDateTimePicker = () => {
    this.singleDateTimePickerNode.addEventListener('keydown', this.onKeyDown)
    FocusManager.addElement(this.singleDateTimePickerNode)
    FocusManager.focus()
    FocusManager.trapFocus()
  }

  removeSingleDateTimePickerFocus = () => {
    this.singleDateTimePickerNode.removeEventListener('keydown', this.onKeyDown)
    FocusManager.remove(this.singleDateTimePickerNode)
  }

  showGetAutoSchedulePopover = () => {
    this.setState({
      isShowGetAutoSchedulePopover: true,
    })
    track(
      Constants.GET_AUTO_SCHEDULE_MESSAGE_PAYWALL.TRACKING_ORIGIN,
      Constants.GET_AUTO_SCHEDULE_MESSAGE_PAYWALL.TRACKING_ACTION,
    )
  }

  /**
   * Returns an object formatted for the TimePicker dropdown
   * @param {Date} dateTime
   * @returns {{hour: number, minute: number, period: string}}
   */
  dateTimeToTimeSlot(dateTime) {
    const m = moment(dateTime).tz(this.props.timezoneName)
    return {
      hour: m.hour() % Constants.DATE_TIME.NUM_HOURS_IN_PERIOD || Constants.DATE_TIME.NUM_HOURS_IN_PERIOD,
      minute:
        Math.ceil(parseInt(m.minute()) / TimePickerConstants.SCHEDULE_INTERVAL_MINUTES) *
          TimePickerConstants.SCHEDULE_INTERVAL_MINUTES || 0,
      period:
        m.hour() >= Constants.DATE_TIME.NUM_HOURS_IN_PERIOD ? Constants.DATE_TIME.PM : Constants.DATE_TIME.AM,
    }
  }

  /**
   * Event handler when the user clicks on a day cell
   * @param {Date} day
   * @param {Object} modifiers
   */
  handleDayClick = (day, modifiers) => {
    const selectedHour =
      this.state.selectedTime.period === Constants.DATE_TIME.PM &&
      this.state.selectedTime.hour !== Constants.DATE_TIME.NUM_HOURS_IN_PERIOD
        ? this.state.selectedTime.hour + Constants.DATE_TIME.NUM_HOURS_IN_PERIOD
        : this.state.selectedTime.hour

    // Because the DayPicker is always in *local* time, convert here to Hootsuite Time
    const selectedDate = moment.tz(this.props.timezoneName)
    selectedDate
      .year(day.getFullYear())
      .month(day.getMonth())
      .date(day.getDate())
      .hour(selectedHour)
      .minute(this.state.selectedTime.minute)
      .second(0)
      .millisecond(0)
    if (!this.props.enabledDays) {
      // Do nothing if a disabled day is clicked
      if (modifiers.disabled) {
        return
      }
    }

    this.setState(
      {
        selectedDate: selectedDate.toDate(),
      },
      () => this.saveCurrentDate(false),
    )
  }

  /**
   * Event handler for when the user clicks the Set/Done button
   */
  handleSetButtonClick = () => {
    this.props.onClose()
  }

  /**
   * Saves the current state to local storage
   */
  saveToLocalStorage = () => {
    if (
      !this.props.isEditMode // don't override the scheduled date if editing
    ) {
      const date = this.state.selectedDate
      if (localStorage && this.props.memberId) {
        if (JSON.parse(localStorage.getItem(Constants.LAST_SCHEDULED_TIME_LOCAL_STORAGE))) {
          const localStorageTime = JSON.parse(
            localStorage.getItem(Constants.LAST_SCHEDULED_TIME_LOCAL_STORAGE),
          )
          localStorageTime[this.props.memberId] = date
          localStorage.setItem(Constants.LAST_SCHEDULED_TIME_LOCAL_STORAGE, JSON.stringify(localStorageTime))
        } else {
          localStorage.setItem(
            Constants.LAST_SCHEDULED_TIME_LOCAL_STORAGE,
            JSON.stringify({ [this.props.memberId]: date }),
          )
        }
      }
    }
  }

  /**
   * Event handler for when the user updates the time
   * @param {Object} time
   */
  onTimeChange = time => {
    this.setState(
      {
        selectedTime: time,
        selectedDate: DateUtils.formatDateWithTimeAndTimezone(
          this.state.selectedDate,
          time,
          this.props.timezoneName,
        ),
      },
      () => this.saveCurrentDate(false),
    )
  }

  /**
   * Saves the current state date
   * @param {bool} isAutoscheduled
   */
  saveCurrentDate(isAutoscheduled) {
    this.saveToLocalStorage()
    this.props.onSetDateTime(this.state.selectedDate, isAutoscheduled)
  }

  /**
   * returns the first day of the week Sunday/Monday
   * If the first day of the week is not set (the user has never visited publisher)
   * it will return the day according to whatever the user's current timezone is
   * This will also be what the first day is when the user enters publisher
   * for the first time
   * @returns {string}
   */
  getFirstDayOfWeekFromLocalStorage() {
    const { timezoneName } = this.props
    const initialFirstDayOfWeek = localStorageGet(LAST_USED_FIRST_DAY_OF_WEEK_FILTER, null)
    if (initialFirstDayOfWeek === null) {
      if (this.isNorthAmericaTimezone(timezoneName)) {
        return SUNDAY
      }
      return MONDAY
    }
    return initialFirstDayOfWeek
  }

  isNorthAmericaTimezone(timezoneName) {
    const timeZoneAreaRelativeToUTC = moment().tz(timezoneName).utcOffset() / NUM_MIN_IN_HOUR
    return (
      (timeZoneAreaRelativeToUTC > NORTH_AMERICA_WEST_TIMEZONE_EDGE &&
        timeZoneAreaRelativeToUTC < NORTH_AMERICA_EAST_TIMEZONE_EDGE) ||
      (timeZoneAreaRelativeToUTC >= AUSTRALIA_WEST_TIMEZONE_EDGE &&
        timeZoneAreaRelativeToUTC <= NZ_EAST_TIMEZONE_EDGE)
    )
  }

  renderCalendar() {
    const { enabledDays, timezoneName } = this.props
    const today = moment.tz(timezoneName)

    const selectedDate = moment(this.state.selectedDate).tz(timezoneName)
    let modifiers = {}

    // campaigns
    if (enabledDays) {
      const dateFrom = enabledDays.dateFrom

      if (moment(dateFrom).isBefore(today, 'day')) {
        const yesterday = moment.tz(timezoneName)
        yesterday.date(today.date() - 1)

        modifiers = {
          excluded: {
            from: dateFrom,
            to: yesterday.toDate(),
          },
        }
      }
    }
    const selectedDays = new Date(
      selectedDate.year(),
      selectedDate.month(),
      selectedDate.date(),
      selectedDate.hour(),
      selectedDate.minute(),
      0,
      0,
    )
    const firstDayOfWeek = this.getFirstDayOfWeekFromLocalStorage()

    /**
     * ensure that there is no divergence from current functionality
     * using darklaunch code in `getFirstDayOfWeekFromLocalStorage`
     * @returns {jsx}
     */
    return (
      <DatePicker
        timezoneName={timezoneName}
        weekStartDay={firstDayOfWeek}
        fromMonth={moment.tz(timezoneName).toDate()}
        enabledDays={enabledDays ? enabledDays : false}
        modifiers={modifiers}
        onClick={this.handleDayClick}
        selectedDays={selectedDays}
      />
    )
  }

  renderTimeRangeSelector() {
    const { timezoneName } = this.props
    const offset = moment.tz(timezoneName).format('Z').slice(0, -3)
    const timeFromGMT = `${Constants.DATE_TIME.GMT}${offset} ${timezoneName}`

    return (
      <div>
        <TimePicker
          onTimeChange={this.onTimeChange}
          selectedTime={this.state.selectedTime}
          timeFromGMT={timeFromGMT}
        />
      </div>
    )
  }

  renderErrors() {
    const { selectedMessageForEdit, showOnSubmitErrors, entitlements } = this.props
    const hasVideo = selectedMessageForEdit && selectedMessageForEdit.hasVideoAttachment(true)
    const isTranscodeableVideo = ValidationUtils.isVideoTranscodeable(
      EntitlementsUtils.isFeatureEnabled(entitlements, VIDEO_TRANSCODING),
      selectedMessageForEdit.fieldValidations,
      () => selectedMessageForEdit.hasAttachments(true),
    )
    const error = (
      <ValidationBanner
        fieldValidations={selectedMessageForEdit.fieldValidations}
        showOnSubmitErrors={showOnSubmitErrors}
        field={FIELD_VALIDATIONS.SEND_DATE}
        type={FIELD_TYPES.SEND_DATE}
        isBulkComposer={false}
        errorProps={{
          minimumScheduleMinutes: selectedMessageForEdit.hasVideoAttachment(true)
            ? ComposerConstants.MINIMUM_SCHEDULE_MINUTES.VIDEO
            : ComposerConstants.MINIMUM_SCHEDULE_MINUTES.DEFAULT,
          hasVideo,
          isTranscodeableVideo,
          shouldHideTitle: true,
        }}
      />
    )

    if (this.hasSendDateErrors()) {
      return <SendDateErrorContainer>{error}</SendDateErrorContainer>
    }
    return null
  }

  preventAllPropagation = e => {
    e.stopPropagation()
    if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation()
    }
  }

  onToggleAutoschedule = e => {
    const { isAutoscheduled } = this.props
    const nextIsAutoScheduled = !isAutoscheduled

    this.preventAllPropagation(e)

    this.setState(
      {
        lastSelectedDate: nextIsAutoScheduled ? this.state.selectedDate : null,
        selectedDate: nextIsAutoScheduled ? null : this.state.lastSelectedDate,
      },
      () => this.saveCurrentDate(nextIsAutoScheduled),
    )
  }

  /**
   * Event handler for when the user clicks the Autoschedule 'Adjust Settings' button
   */
  handleAutoscheduleSettingsButtonClick = () => {
    this.props.showAutoScheduleSettings()
  }

  handleAutoscheduleDirectButtonClick = event => {
    const { isAutoscheduled, onClose } = this.props

    if (!isAutoscheduled) {
      this.onToggleAutoschedule(event)
    }
    onClose()
  }

  hasSendDateErrors() {
    return get(
      this.props.selectedMessageForEdit,
      ['fieldValidations', 'errors', FIELD_VALIDATIONS.SEND_DATE],
      false,
    )
  }

  render() {
    const {
      isAutoscheduled,
      autoScheduleSettings,
      isBulkComposer,
      isInitialOpen,
      timezoneName,
      entitlements,
    } = this.props
    const isAutoScheduleMessageEnabled = EntitlementsUtils.isFeatureEnabled(
      entitlements,
      AUTO_SCHEDULE_MESSAGE,
    )
    return (
      <DateTimePickerWrapper
        ref={node => {
          this.singleDateTimePickerNode = node
        }}
        tabIndex="-1"
      >
        {!isBulkComposer && isAutoScheduleMessageEnabled && (
          <AutoscheduleToggle
            isInitialOpen={isInitialOpen}
            inputLabel={isAutoscheduled ? COMPOSE_AUTOSCHEDULE_STATE_ON : COMPOSE_AUTOSCHEDULE_STATE_OFF}
            onToggleAutoschedule={this.onToggleAutoschedule}
            isChecked={isAutoscheduled}
            entitlements={entitlements}
            showGetAutoSchedulePopover={this.showGetAutoSchedulePopover}
          />
        )}
        <DateTimePicker>
          <div className={`${isAutoscheduled ? 'hidden' : ''}`}>
            {this.renderErrors()}
            {this.renderCalendar()}
            {this.renderTimeRangeSelector()}
          </div>
          <div className={`${!isAutoscheduled ? 'hidden' : ''}`}>
            <AutoscheduleInfo
              timezoneName={timezoneName}
              autoScheduleSettings={autoScheduleSettings}
              onAdjustSettings={this.handleAutoscheduleSettingsButtonClick}
              entitlements={entitlements}
            />
          </div>
          <DoneBtnContainer>
            {
              <SetButton onClick={this.handleSetButtonClick} isAutoscheduled={isAutoscheduled}>
                {DONE}
              </SetButton>
            }
          </DoneBtnContainer>
        </DateTimePicker>
      </DateTimePickerWrapper>
    )
  }
}

export default compose(
  reduxConnect(({ composer, validation }: RootState) => ({
    isSchedulerOpen: composer.isSchedulerOpen,
    showOnSubmitErrors: validation.showOnSubmitErrors,
  })),
  connect(composerMessageStore, state => ({
    selectedMessageForEdit: getSelectedMessage(state),
  })),
)(SingleDateTimePicker)
