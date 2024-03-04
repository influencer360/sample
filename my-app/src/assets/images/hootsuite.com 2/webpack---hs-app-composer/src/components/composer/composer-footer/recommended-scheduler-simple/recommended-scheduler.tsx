import React, { useEffect, useMemo } from 'react'
import get from 'lodash/get'
import moment from 'moment-timezone'
import { connect as reduxConnect } from 'react-redux'
import { createSelector } from 'reselect'
import { A } from 'fe-comp-dom-elements'
import { InputBanner } from 'fe-comp-input-banner'
import { connect } from 'fe-hoc-connect'
import { VIDEO_TRANSCODING } from 'fe-lib-entitlements'
import { ValidationBanner } from 'fe-pnc-comp-field-validation-item'
import Scheduler from 'fe-pnc-comp-form-scheduler'
import type { SCHEDULER_MODES } from 'fe-pnc-comp-form-scheduler'
import type { InstagramPublishingMode } from 'fe-pnc-constants'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { InstagramPostType, SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'
import {
  store as composerMessageStore,
  getSelectedMessage,
  getSelectedMessageValue,
} from 'fe-pnc-data-composer-message'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import { useConst, useDebounce } from 'fe-pnc-lib-hooks'
import translation from 'fe-pnc-lib-hs-translation'

import { FIELD_VALIDATIONS, FIELD_TYPES } from 'fe-pnc-validation-error-messages'
import ComposerConstants from '@/constants/composer'
import Constants from '@/constants/constants'
import Message from '@/models/message'
import { RootState } from '@/redux/store'
import { Entitlements } from '@/typings/Flux'
import { RecommendedTimesScheduledType } from '@/typings/Message'
import { SelectedSocialNetwork } from '@/typings/Scheduler'
import { SocialNetworksKeyedById } from '@/typings/SocialNetwork'
import { EntitlementsUtils } from '@/utils/entitlement-utils'
import { getEnabledSchedulableDates } from '@/utils/scheduler-utils'
import ValidationUtils from '@/utils/validation-utils'

import {
  getSelectedSocialNetworksFromMessage,
  validateDate,
  getDefaultDate,
  roundUpToNearest5Minutes,
} from './helpers'
import usePreviousOrDefault from './hooks/use-previous-or-default'
import useRecommendations from './hooks/use-recommendations'
import useRecommendedSchedulerState from './hooks/use-recommended-scheduler-state'

type Schedule = {
  time: Date
  socialProfileId: string
}

type RecommendedSchedulerValue = {
  sendDate?: Date
  sendDateEnd?: Date // In case the user selects a range, this is the end of the range.
  isUsingRecommendedTimes: boolean
  recommendations?: Schedule[]
  recommendedTimesScheduledType: RecommendedTimesScheduledType
}

type RecommendedSchedulerProps = {
  timezone: string
  entitlements: Entitlements
  isEditMode?: boolean
  isVideoMessage?: boolean
  memberId: number
  enabledDays?: {
    dateFrom: Date
    dateTo: Date
  }
  value: {
    sendDate?: Date
    isUsingRecommendedTimes: boolean
  }
  isOpen?: boolean
  areRecommendationsEnabled?: boolean
  isRecommendedTimesEntitlementEnabled?: boolean
  defaultRecommendedTimesMode?: SCHEDULER_MODES
  onDone?: () => void
  onChange?: (nextValue: RecommendedSchedulerValue) => void
  onDateChange?: (date: string) => void
  organizationId: number
  showOnSubmitErrors: boolean
  selectedNetworkGroup?: SocialNetworkGroup
  selectedMessageForEdit: Message
  selectedSocialNetworks: SelectedSocialNetwork[]
  postType?: InstagramPostType
  publishingMode: InstagramPublishingMode
}

const getSocialNetworksKeyedById = (state: unknown): SocialNetworksKeyedById =>
  getSelectedMessage(state).socialNetworksKeyedById

const getSelectedSocialNetworks = createSelector(
  [getSocialNetworksKeyedById],
  (snsById: SocialNetworksKeyedById) => getSelectedSocialNetworksFromMessage(snsById),
)

const unexpectedMode = (mode: string) => new Error(`Unexpected mode ${mode}`)

const ERROR_TIMEOUT_DELAY = isFeatureEnabled('PUB_28677_RT_BUG_FIXES') ? 500 : 1000

const RecommendedScheduler: React.FunctionComponent<RecommendedSchedulerProps> = ({
  timezone,
  entitlements,
  isEditMode = false,
  isVideoMessage = false,
  memberId,
  enabledDays,
  value,
  isOpen = false,
  areRecommendationsEnabled = false,
  isRecommendedTimesEntitlementEnabled = false,
  defaultRecommendedTimesMode,
  onDone = () => undefined,
  onChange = () => {},
  onDateChange,
  organizationId,
  showOnSubmitErrors,
  selectedNetworkGroup,
  selectedMessageForEdit,
  selectedSocialNetworks,
  postType,
  publishingMode,
}) => {
  const defaultDate = useConst(() =>
    getDefaultDate({
      isEditMode,
      isVideoMessage,
      timezoneName: timezone,
      defaultSelectedDateTime: value.sendDate,
      enabledDays,
    }),
  )

  const recommendationsEnabled = useMemo(() => {
    if (
      selectedNetworkGroup === SocialProfileConstants.SN_GROUP.INSTAGRAM &&
      postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY &&
      (isFeatureEnabled('PUB_29694_INSTAGRAM_DIRECT_STORY_RECOMMENDED_TIMES')
        ? publishingMode === Constants.INSTAGRAM_PUBLISHING_MODES.PUSH_PUBLISH
        : true)
    ) {
      return false
    }
    return areRecommendationsEnabled
  }, [areRecommendationsEnabled, selectedNetworkGroup, postType, publishingMode])

  const prevIsOpen = usePreviousOrDefault(isOpen, false)
  const prevselectedSocialNetworks = usePreviousOrDefault(selectedSocialNetworks)
  const prevSendDate = usePreviousOrDefault(value.sendDate)

  const [
    { mode, internalDate, isLoadingRecommendations, recommendations, selectedRecommendation },
    {
      setIsLoadingRecommendations,
      setRecommendations,
      schedulerDateChanged,
      schedulerModeChanged,
      schedulerClosed,
      setInternalDate,
      schedulerCleared,
    },
  ] = useRecommendedSchedulerState({
    timezone,
    defaultDate,
    sendDate: value.sendDate,
    isUsingRecommendedTimes: value.isUsingRecommendedTimes,
    isOpen,
  })

  const hasVideo = selectedMessageForEdit && selectedMessageForEdit.hasVideoAttachment(true)
  const isTranscodeableVideo =
    hasVideo &&
    ValidationUtils.isVideoTranscodeable(
      EntitlementsUtils.isFeatureEnabled(entitlements, VIDEO_TRANSCODING),
      selectedMessageForEdit.fieldValidations,
      () => selectedMessageForEdit.hasAttachments(true),
    )

  const hasCampaignSelected = enabledDays != null
  const enabledSchedulableDates = getEnabledSchedulableDates(
    hasCampaignSelected,
    enabledDays?.dateFrom.toUTCString(),
    enabledDays?.dateTo.toUTCString(),
    timezone,
    hasVideo,
    isTranscodeableVideo,
  )
  const earliestSchedulableDate = enabledSchedulableDates.earliestSchedulableDate
  const farthestSchedulableDate = enabledSchedulableDates.farthestSchedulableDate
  const isEnabledDaysScheduleable = enabledSchedulableDates.isEnabledDaysScheduleable

  useRecommendations(
    isFeatureEnabled('PUB_28677_RT_BUG_FIXES') ? value.sendDate || defaultDate : value.sendDate,
    organizationId,
    memberId,
    timezone,
    selectedSocialNetworks,
    recommendationsEnabled,
    setIsLoadingRecommendations,
    setRecommendations,
    isTranscodeableVideo,
    hasCampaignSelected,
    earliestSchedulableDate,
    farthestSchedulableDate,
    isEnabledDaysScheduleable,
  )

  useEffect(() => {
    if (hasCampaignSelected) {
      if (
        moment(internalDate).isBefore(earliestSchedulableDate) ||
        moment(internalDate).isAfter(farthestSchedulableDate)
      ) {
        setInternalDate(moment(earliestSchedulableDate).tz(timezone).toDate())
      }
    }
  }, [
    hasCampaignSelected,
    earliestSchedulableDate,
    farthestSchedulableDate,
    internalDate,
    setInternalDate,
    timezone,
  ])

  useEffect(() => {
    if (!Object.values(Constants.SCHEDULER_MODE).some(value => value === mode)) {
      throw unexpectedMode(mode)
    }
  }, [mode])

  // Sync internal value externally
  useEffect(() => {
    if (mode === Constants.SCHEDULER_MODE.MANUAL || !selectedRecommendation) {
      onDateChange(internalDate instanceof Date ? internalDate?.toISOString() : internalDate)
    } else if (
      mode === Constants.SCHEDULER_MODE.RECOMMENDED_AUTOMATIC ||
      mode === Constants.SCHEDULER_MODE.RECOMMENDED
    ) {
      if (recommendations !== undefined) {
        onDateChange(internalDate instanceof Date ? internalDate?.toISOString() : internalDate)
      }
    }
  }, [mode, internalDate, onDateChange, recommendations, selectedRecommendation])

  // Trigger scheduler opened/closed from outside
  useEffect(() => {
    if (!prevIsOpen && isOpen) {
      if (
        isFeatureEnabled('PUB_29075_RT_DEFAULT_VALUE_BUG')
          ? !internalDate || moment(defaultDate).isAfter(moment(internalDate))
          : moment(defaultDate).isAfter(moment(internalDate))
      ) {
        const timeInFiveMinutes = moment(defaultDate).add(5, 'm')
        const validatedSendDate = roundUpToNearest5Minutes(timeInFiveMinutes).toDate()

        onDateChange(validatedSendDate.toISOString())
        schedulerDateChanged(validatedSendDate.toISOString())
      }
    } else if (prevIsOpen && !isOpen) {
      schedulerClosed()
    }
  }, [defaultDate, internalDate, isOpen, onDateChange, prevIsOpen, schedulerClosed, schedulerDateChanged])

  useEffect(() => {
    if (prevSendDate && !value.sendDate) {
      schedulerCleared()
    }
  }, [prevSendDate, value.sendDate, schedulerCleared])

  // When no SNs are selected, reset "Schedule for Later" button.
  useEffect(() => {
    if (prevselectedSocialNetworks.length > 0 && selectedSocialNetworks.length === 0) {
      if (isFeatureEnabled('PUB_29079_CLEARING_SNS_CLEARS_TIME')) {
        onChange({
          recommendedTimesScheduledType: 'disabled',
          isUsingRecommendedTimes: false,
          recommendations: undefined,
        })
      } else {
        onDateChange(null)

        onChange({
          recommendedTimesScheduledType: 'disabled',
          isUsingRecommendedTimes: false,
          recommendations: undefined,
          sendDate: undefined,
        })
        setInternalDate(undefined)
      }
    }
  }, [
    prevselectedSocialNetworks,
    selectedSocialNetworks,
    onChange,
    setInternalDate,
    selectedRecommendation,
    onDateChange,
  ])

  useEffect(() => {
    if (value.sendDate) {
      onDateChange(value.sendDate.toISOString())
      setInternalDate(value.sendDate)
    }
  }, [onDateChange, value.sendDate, setInternalDate])

  const renderErrors = () => (
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

  const hasNoRecommendedTimes = recommendations === undefined && !isLoadingRecommendations

  const showNoRecommendationsErrorBanner = useDebounce(
    recommendationsEnabled &&
      hasNoRecommendedTimes &&
      !isLoadingRecommendations &&
      mode === Constants.SCHEDULER_MODE.RECOMMENDED &&
      selectedSocialNetworks.length > 0,
    isFeatureEnabled('PUB_29075_RT_DEFAULT_VALUE_BUG') ? ERROR_TIMEOUT_DELAY : 0,
  )

  const getError = (): string | React.ReactNode | undefined => {
    if (typeof internalDate === 'string') {
      return validateDate(internalDate)
    } else if (showNoRecommendationsErrorBanner) {
      return (
        <InputBanner>
          <span>
            {translation._('There are no recommended times available. Manually set the time for this post.')}{' '}
            <A
              href="https://help.hootsuite.com/hc/en-us/articles/4404937701147"
              rel="noopener noreferrer"
              target="_blank"
            >
              {translation._('Learn more')}
            </A>
          </span>
        </InputBanner>
      )
    } else {
      const hasSendDateErrors = get(
        selectedMessageForEdit,
        ['fieldValidations', 'errors', FIELD_VALIDATIONS.SEND_DATE],
        false,
      )
      if (Boolean(hasSendDateErrors)) {
        return renderErrors()
      }
    }
  }

  const showErrors = useDebounce(isOpen && showNoRecommendationsErrorBanner, ERROR_TIMEOUT_DELAY)

  let schedulerValue
  let defaultMode

  if (isFeatureEnabled('PUB_28677_RT_BUG_FIXES')) {
    schedulerValue =
      (internalDate instanceof Date ? internalDate?.toISOString() : internalDate) || defaultDate.toISOString()
    defaultMode = recommendationsEnabled ? defaultRecommendedTimesMode : Constants.SCHEDULER_MODE.MANUAL
  } else {
    schedulerValue = internalDate instanceof Date ? internalDate?.toISOString() : internalDate
  }

  return (
    <div style={{ width: 304 }}>
      <Scheduler
        enabledDays={{
          dateFrom: earliestSchedulableDate || moment().tz(timezone).toISOString(),
          dateTo: farthestSchedulableDate,
        }}
        recommendedTimes={recommendations}
        timezone={timezone}
        value={schedulerValue}
        onDone={onDone}
        onDateChange={schedulerDateChanged}
        onModeChange={schedulerModeChanged}
        defaultMode={defaultMode}
        isOpen={isOpen}
        recommendationsEnabled={
          isFeatureEnabled('PUB_28677_RT_BUG_FIXES')
            ? recommendationsEnabled && selectedSocialNetworks.length > 0
            : recommendationsEnabled && selectedSocialNetworks.length > 0 && recommendations !== undefined
        }
        showRecommendedTimesPaywall={!isRecommendedTimesEntitlementEnabled}
        isLoading={isLoadingRecommendations}
        dateError={
          isFeatureEnabled('PUB_28677_RT_BUG_FIXES')
            ? (isFeatureEnabled('PUB_29075_RT_DEFAULT_VALUE_BUG') ? isOpen : showErrors) && getError()
            : () => {
                setTimeout(() => getError(), ERROR_TIMEOUT_DELAY)
              }
        } // TODO: use same frontend date validation as in DateTimeButton and display a proper error
      />
    </div>
  )
}

const RecommendedSchedulerComposerState = reduxConnect(({ composer, validation }: RootState) => ({
  showOnSubmitErrors: validation.showOnSubmitErrors,
  selectedNetworkGroup: composer.selectedNetworkGroup,
  defaultRecommendedTimesMode: composer.defaultRecommendedTimesMode,
}))(RecommendedScheduler)

const RecommendedSchedulerComposerAndMessageState = connect(composerMessageStore, (state): {
  selectedMessageForEdit: Message
  selectedSocialNetworks: SelectedSocialNetwork[]
  postType?: InstagramPostType
  publishingMode?: InstagramPublishingMode
} => ({
  selectedMessageForEdit: getSelectedMessage(state),
  selectedSocialNetworks: getSelectedSocialNetworks(state),
  postType: getSelectedMessageValue(state, 'postType', false, undefined),
  publishingMode: getSelectedMessageValue(state, 'publishingMode', false, undefined),
}))(RecommendedSchedulerComposerState)

export default RecommendedSchedulerComposerAndMessageState
