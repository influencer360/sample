import React, { PureComponent } from 'react'
import loadable from '@loadable/component'

import isEqual from 'lodash/isEqual'
import over from 'lodash/over'
import { connect as reduxConnect } from 'react-redux'

import styled from 'styled-components'
import { Dropdown, TOP_RIGHT } from 'fe-comp-dropdown'
import { venk } from 'fe-hoc-venkman'
import { AUTO_SCHEDULE_MESSAGE, RECOMMENDED_TIMES_TO_POST } from 'fe-lib-entitlements'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'
import { getSelectedMessageValue, store as composerMessageStore } from 'fe-pnc-data-composer-message'
import { observeStore } from 'fe-pnc-lib-store-observer'
import { DateUtils } from 'fe-pnc-lib-utils'
import ValidationErrorMessages, { CUSTOM_ERRORS, FIELD_VALIDATIONS } from 'fe-pnc-validation-error-messages'

import ComposerConstants from '@/constants/composer'
import Constants from '@/constants/constants'
import { FEATURE_UNLIMITED } from '@/constants/entitlements'
import { composerActions } from '@/redux/reducers/composer'
import { validationActions } from '@/redux/reducers/validation'
import { AppDispatch, RootState } from '@/redux/store'
import { ScheduleTime } from '@/typings/Constants'
import { Entitlements } from '@/typings/Flux'
import { RecommendedTimesScheduledType } from '@/typings/Message'
import { getSendDate } from '@/utils/composer-date-time-utils'
import { EntitlementsUtils } from '@/utils/entitlement-utils'
import {
  getAutoScheduleSettingsLocalStorage,
  setIsAutoScheduledLocalStorage,
} from '@/utils/scheduler-local-storage-utils'
import { track } from '@/utils/tracking'

import DateTimeButton from '../DateTimeButton'
import RecommendedScheduler from '../recommended-scheduler-simple'

// Lazy loaded components
const SingleDateTimePicker = loadable(
  () =>
    import(
      /* webpackChunkName: "SingleDateTimePicker" */ '@/components/date-time-picker/single-date-time-picker/single-date-time-picker'
    ),
)

export const SchedulerSelector = venk(
  withHsTheme(styled.span`
    display: flex;
    height: auto;
    margin-right: ${() => getThemeValue(t => t.spacing.spacing8)};
    align-items: center;
    font-size: ${() => getThemeValue(t => t.typography.body.size)};
    font-weight: ${() => getThemeValue(t => t.typography.label.weight)};
  `),
  'SchedulerSelector',
)
SchedulerSelector.displayName = 'SchedulerSelectorAnchor'

type SchedulerProps = {
  entitlements: Entitlements
  autoScheduleSettings: unknown
  canSendNow?: boolean
  datesEnabledForScheduling?: {
    dateFrom: Date
    dateTo: Date
  }
  dispatch: AppDispatch
  isAutoScheduledEnabled?: boolean
  isBeingScheduled?: boolean
  isBulkComposer?: boolean
  isDraft?: boolean
  isEditMode?: boolean
  isPrimary?: boolean
  isSchedulerOpen?: boolean
  isVideoMessage?: boolean
  isPinterest?: boolean
  isAmplify?: boolean
  isAmplifyEditPost?: boolean
  maxScheduledMessages?: number
  memberId: number
  memberInTrial?: boolean
  memberSignupDate?: string
  onUpdatePublishTime: (newPublishTime: ScheduleTime) => void
  onUpdateScheduleDate: (
    newDate?: Date | null,
    isAutoscheduled?: boolean | null,
    recommendedTimes?: { socialProfileId: string; time: Date }[],
    recommendedTimesScheduledType?: RecommendedTimesScheduledType,
  ) => void
  organizationId: number
  selectedPublishTime: ScheduleTime
  sendDate?: number
  showAutoScheduleSettings?: () => void
  showOnSubmitErrors?: boolean
  timezoneName: string
  totalScheduledMessages?: number
}

type SchedulerState = {
  isUsingRecommendedTimes: boolean
  sendDateEnd?: Date // End of the schedule range when using recommended times
  isAutoscheduled: boolean
  autoScheduleSettings: unknown
  showOnSubmitErrors: boolean
  sendDateErrors: boolean
}

export class Scheduler extends PureComponent<SchedulerProps, SchedulerState> {
  static readonly displayName = 'SchedulerSelector'
  static readonly defaultProps = {
    autoScheduleSettings: {},
    canSendNow: false,
    datesEnabledForScheduling: null,
    isAutoScheduledEnabled: false,
    isBeingScheduled: false,
    isBulkComposer: false,
    isDraft: false,
    isEditMode: false,
    isPrimary: false,
    isSchedulerOpen: false,
    isVideoMessage: false,
    isPinterest: false,
    isAmplify: false,
    isAmplifyEditPost: false,
    maxScheduledMessages: FEATURE_UNLIMITED,
    memberInTrial: false,
    memberSignupDate: '',
    onUpdatePublishTime: () => {},
    selectedPublishTime: ComposerConstants.SCHEDULE_TIME.IMMEDIATE,
    sendDate: null,
    showAutoScheduleSettings: () => {},
    showOnSubmitErrors: false,
    totalScheduledMessages: -1,
  } as const

  hasSchedulerOpened: boolean
  unsubscribeObservers?: (() => void)[]
  datePickerDropdownUtils?: {
    openDropdown: () => void
    closeDropdown: () => void
  }

  dropdownRef: any

  constructor(props: SchedulerProps) {
    super(props)

    let defaultIsAutoscheduled = false
    let defaultAutoScheduleSettings: unknown = {}
    //set isAutoscheduled flag value where
    // 1) set to what was last stored in local storage
    // 2) override to true if isAutoScheduledEnabled has been explicitly passed in via props
    // 3) otherwise will default to false
    //AND, set autoschedule settings where
    // 1) set to what was last stored in local storage
    // 2) set to what has been explicitly passed in via props
    if (EntitlementsUtils.isFeatureEnabled(props.entitlements, AUTO_SCHEDULE_MESSAGE)) {
      if (!props.isBulkComposer) {
        if (localStorage.getItem(Constants.LAST_IS_AUTOSCHEDULED_LOCAL_STORAGE)) {
          defaultIsAutoscheduled = JSON.parse(
            localStorage.getItem(Constants.LAST_IS_AUTOSCHEDULED_LOCAL_STORAGE) ?? '{}',
          )[props.memberId]
        } else if (props.isAutoScheduledEnabled) {
          defaultIsAutoscheduled = true
        }

        if (localStorage.getItem(Constants.AUTOSCHEDULE_SETTINGS)) {
          defaultAutoScheduleSettings = getAutoScheduleSettingsLocalStorage(props.memberId)
        } else if (props.autoScheduleSettings) {
          defaultAutoScheduleSettings = props.autoScheduleSettings
        }
      }
    }

    this.hasSchedulerOpened = false

    if (defaultIsAutoscheduled) {
      track('web.dashboard.full_screen_composer.scheduler', 'autoschedule_preselected')
    }

    this.state = {
      isUsingRecommendedTimes: !props.sendDate,
      isAutoscheduled: defaultIsAutoscheduled,
      autoScheduleSettings: defaultAutoScheduleSettings,
      showOnSubmitErrors: false,
      sendDateErrors: false,
    }
  }

  isRecommendedTimesEntitlementEnabled(entitlements: Record<string, number>): boolean {
    return Boolean(EntitlementsUtils.isFeatureEnabled(entitlements, RECOMMENDED_TIMES_TO_POST))
  }

  componentDidMount() {
    SingleDateTimePicker.preload()

    this.unsubscribeObservers = [
      observeStore(
        composerMessageStore,
        sendDateErrors => this.setState({ sendDateErrors }),
        state =>
          getSelectedMessageValue(
            state,
            ['fieldValidations', 'errors', FIELD_VALIDATIONS.SEND_DATE],
            false,
            false,
          ),
        isEqual,
      ),
    ]
  }

  setIsSchedulerOpen = (isSchedulerOpen: boolean) =>
    this.props.dispatch(composerActions.setIsSchedulerOpen(isSchedulerOpen))

  componentWillUnmount() {
    const isSchedulerOpen = this.props.isSchedulerOpen

    if (isSchedulerOpen) {
      this.setIsSchedulerOpen(false)
    }
    over(this.unsubscribeObservers)()
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps: SchedulerProps) {
    if (nextProps.isSchedulerOpen && nextProps.showOnSubmitErrors) {
      this.openDatePickerDropdown(true)
    }
  }

  onClose = () => {
    this.openDatePickerDropdown(false)
  }

  onSetScheduleDate = (
    newDate?: Date | null,
    isAutoscheduled?: boolean | null,
    schedule?: { socialProfileId: string; time: Date }[],
    recommendedTimesScheduledType?: RecommendedTimesScheduledType,
  ) => {
    const { isAutoscheduled: prevIsAutoscheduled } = this.state
    setIsAutoScheduledLocalStorage(Boolean(isAutoscheduled), this.props.memberId)
    this.props.onUpdateScheduleDate(newDate, isAutoscheduled, schedule, recommendedTimesScheduledType)
    this.setState({ isAutoscheduled: Boolean(isAutoscheduled) })

    if (newDate && typeof newDate !== 'undefined') {
      this.props.onUpdatePublishTime(ComposerConstants.SCHEDULE_TIME.SCHEDULE)
    } else {
      this.props.onUpdatePublishTime(ComposerConstants.SCHEDULE_TIME.IMMEDIATE)
    }

    if (isAutoscheduled && !prevIsAutoscheduled) {
      track('web.dashboard.full_screen_composer.scheduler', 'autoschedule_enabled')
    } else if (!isAutoscheduled && prevIsAutoscheduled) {
      track('web.dashboard.full_screen_composer.scheduler', 'autoschedule_disabled')
    }
  }

  preventAllPropagation = e => {
    e.stopPropagation()
    if (e.nativeEvent && e.nativeEvent.stopImmediatePropagation) {
      e.nativeEvent.stopImmediatePropagation()
    }
  }

  getMinimumScheduledMinutes = isVideoMessage => {
    return isVideoMessage
      ? ComposerConstants.MINIMUM_SCHEDULE_MINUTES.VIDEO
      : ComposerConstants.MINIMUM_SCHEDULE_MINUTES.DEFAULT
  }

  openDatePickerDropdown(shouldOpenDatePicker: boolean) {
    const isSchedulerOpen = this.props.isSchedulerOpen

    if (this.datePickerDropdownUtils) {
      if (shouldOpenDatePicker) {
        this.datePickerDropdownUtils.openDropdown()
      } else if (isSchedulerOpen) {
        this.datePickerDropdownUtils.closeDropdown()
      }
    }
  }

  onCloseDateTime = (e?: React.MouseEvent<HTMLElement>) => {
    this.preventAllPropagation(e)
    this.openDatePickerDropdown(false)
    this.onSetScheduleDate(null, null, undefined, 'disabled') // new
  }

  getSchedulerSelector = () => {
    const { isBeingScheduled, isDraft, isEditMode, isPrimary, timezoneName } = this.props
    const { isAutoscheduled, sendDateEnd, sendDateErrors } = this.state
    const isSchedulerOpen = this.props.isSchedulerOpen

    const sendDate = getSendDate(this.props.sendDate)
    return (
      <SchedulerSelector>
        <DateTimeButton
          hasSendDateErrors={Boolean(sendDateErrors)}
          isActive={isSchedulerOpen}
          isPrimary={isPrimary}
          isAutoscheduled={isAutoscheduled}
          isBeingScheduled={isBeingScheduled}
          isEdit={isEditMode}
          isDraft={isDraft}
          onClose={this.onCloseDateTime}
          sendDate={sendDate && sendDateEnd ? { start: sendDate, end: sendDateEnd } : sendDate}
          timezoneName={timezoneName}
        />
      </SchedulerSelector>
    )
  }

  updateScheduleDate() {
    const { isBulkComposer, isVideoMessage, onUpdateScheduleDate, sendDate } = this.props
    if (!sendDate && isBulkComposer) {
      const today = new Date()

      const nextAvailableTime = DateUtils.formatDateWithTime(
        today,
        DateUtils.getNextTimeSlot(today, isVideoMessage),
      )

      onUpdateScheduleDate(nextAvailableTime)
    }
  }

  onDropdownShow = () => {
    this.setIsSchedulerOpen(true)
    this.updateScheduleDate()
    this.hasSchedulerOpened = true
    track('web.dashboard.full_screen_composer.scheduler', 'recommended_times.show_scheduler')
  }

  setShowOnSubmitErrors = (showOnSubmitErrors: boolean) =>
    this.props.dispatch(validationActions.setShowOnSubmitErrors(showOnSubmitErrors))

  onDropdownHide = () => {
    this.setIsSchedulerOpen(false)
    this.setShowOnSubmitErrors(false)
    track('web.dashboard.full_screen_composer.scheduler', 'recommended_times.hide_scheduler')
  }

  handleShowAutoScheduleSettings = () => {
    const { showAutoScheduleSettings } = this.props

    track('web.dashboard.full_screen_composer.scheduler', 'autoschedule_settings_opened')

    showAutoScheduleSettings && showAutoScheduleSettings()
  }

  /**
   * Focus the dropdown when the render has completed
   */
  focusDropdown = () => {
    requestAnimationFrame(() => {
      this.dropdownRef.focus()
    })
  }

  handleRecommendedOnChange = (nextValue: {
    sendDate?: Date
    recommendations?: { socialProfileId: string; time: Date }[]
    isUsingRecommendedTimes: boolean
    sendDateEnd?: Date
    recommendedTimesScheduledType: RecommendedTimesScheduledType
  }) => {
    this.onSetScheduleDate(
      nextValue.sendDate,
      false,
      nextValue.recommendations,
      nextValue.recommendedTimesScheduledType,
    )

    this.setState({
      isUsingRecommendedTimes: nextValue.isUsingRecommendedTimes,
      sendDateEnd: nextValue.sendDateEnd,
    })
  }

  handleRecommendedOnDateChange = (nextDate: string) => {
    this.focusDropdown()

    if (!nextDate || nextDate === 'undefined' || nextDate === new Date(null).toISOString()) {
      this.onSetScheduleDate(null)
    } else {
      this.onSetScheduleDate(new Date(nextDate))
    }
  }

  renderStandardScheduler = () => {
    const {
      datesEnabledForScheduling,
      isBulkComposer,
      isEditMode,
      isVideoMessage,
      memberId,
      selectedPublishTime,
      sendDate,
      timezoneName,
      entitlements,
    } = this.props
    const { isAutoscheduled, autoScheduleSettings } = this.state

    const minimumScheduleMinutes = this.getMinimumScheduledMinutes(isVideoMessage)
    const isInitialOpen = selectedPublishTime === ComposerConstants.SCHEDULE_TIME.IMMEDIATE
    const defaultSelectedDateTime = getSendDate(sendDate)

    return (
      <SingleDateTimePicker
        entitlements={entitlements}
        autoScheduleSettings={autoScheduleSettings}
        dateOutsideDateRangeErrorMessage={
          ValidationErrorMessages[CUSTOM_ERRORS.OUTSIDE_OF_CAMPAIGN_DATE_RANGE].message
        }
        defaultSelectedDateTime={defaultSelectedDateTime}
        enabledDays={datesEnabledForScheduling}
        invalidScheduleDateErrorMessage={ValidationErrorMessages[CUSTOM_ERRORS.SELECT_DATE_IN_FUTURE].message}
        isAutoscheduled={isAutoscheduled}
        isBulkComposer={isBulkComposer}
        isEditMode={isEditMode}
        isInitialOpen={isInitialOpen}
        isVideoMessage={isVideoMessage}
        memberId={memberId}
        minimumScheduleMinutes={minimumScheduleMinutes}
        minimumScheduleMinutesErrorMessage={
          ValidationErrorMessages[CUSTOM_ERRORS.SELECT_DATE_N_MINS_IN_FUTURE].message
        }
        onClose={this.onClose}
        onSetDateTime={this.onSetScheduleDate}
        showAutoScheduleSettings={this.handleShowAutoScheduleSettings}
        timeOutsideTimeRangeErrorMessage={
          ValidationErrorMessages[CUSTOM_ERRORS.OUTSIDE_OF_CAMPAIGN_DATE_RANGE].message
        }
        timezoneName={timezoneName}
      />
    )
  }

  renderRecommendedScheduler = (
    areRecommendationsEnabled: boolean,
    isRecommendedTimesEntitlementEnabled: boolean,
  ) => {
    const {
      datesEnabledForScheduling,
      isEditMode,
      isVideoMessage,
      memberId,
      organizationId,
      sendDate,
      timezoneName,
      entitlements,
    } = this.props
    const { isUsingRecommendedTimes } = this.state
    const isSchedulerOpen = this.props.isSchedulerOpen
    const defaultSelectedDateTime = getSendDate(sendDate)

    return (
      <RecommendedScheduler
        entitlements={entitlements}
        isEditMode={isEditMode}
        isVideoMessage={isVideoMessage}
        memberId={memberId}
        enabledDays={datesEnabledForScheduling}
        isOpen={isSchedulerOpen}
        value={{
          sendDate: defaultSelectedDateTime,
          isUsingRecommendedTimes,
        }}
        onDone={this.onClose}
        onChange={this.handleRecommendedOnChange}
        onDateChange={this.handleRecommendedOnDateChange}
        timezone={timezoneName}
        areRecommendationsEnabled={areRecommendationsEnabled}
        isRecommendedTimesEntitlementEnabled={isRecommendedTimesEntitlementEnabled}
        organizationId={organizationId}
      />
    )
  }

  render() {
    const { isBulkComposer, isPinterest, isAmplify, isAmplifyEditPost, entitlements } = this.props

    const isSchedulerOpen = this.props.isSchedulerOpen

    const showOnSubmitErrors = this.props.showOnSubmitErrors

    if (isSchedulerOpen && showOnSubmitErrors) {
      this.openDatePickerDropdown(true)
    }
    const isComposer = !isPinterest && !isAmplify && !isBulkComposer && !isAmplifyEditPost
    const isRecommendedTimesEntitlementEnabled = this.isRecommendedTimesEntitlementEnabled(entitlements)

    const shouldShowRecommendedScheduler = isComposer || isPinterest

    const shouldRenderScheduler = this.hasSchedulerOpened

    const areRecommendationsEnabled = isComposer && isRecommendedTimesEntitlementEnabled

    const renderScheduler = () =>
      shouldShowRecommendedScheduler
        ? this.renderRecommendedScheduler(areRecommendationsEnabled, isRecommendedTimesEntitlementEnabled)
        : this.renderStandardScheduler()

    return (
      <Dropdown
        Anchor={this.getSchedulerSelector}
        attachmentPosition={TOP_RIGHT}
        hasAttachmentPositionOverride={true}
        isClosedOnContentClick={false}
        onHide={this.onDropdownHide}
        onShow={this.onDropdownShow}
        utils={utils => (this.datePickerDropdownUtils = utils)}
        getDrawerRef={ref => {
          this.dropdownRef = ref
        }}
      >
        {shouldRenderScheduler && renderScheduler()}
      </Dropdown>
    )
  }
}

const DefaultExport = reduxConnect(({ composer, validation }: RootState) => ({
  isSchedulerOpen: composer.isSchedulerOpen,
  showOnSubmitErrors: validation.showOnSubmitErrors,
}))(Scheduler)

export default DefaultExport
