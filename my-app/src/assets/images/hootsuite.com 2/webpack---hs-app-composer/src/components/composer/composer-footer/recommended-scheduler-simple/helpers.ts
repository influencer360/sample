import moment, { Moment } from 'moment-timezone'
import translation from 'fe-pnc-lib-hs-translation'
import { DateUtils } from 'fe-pnc-lib-utils'

import Constants from '@/constants/constants'
import TimePickerConstants from '@/constants/time-picker'
import {
  SuggestedInterval,
  RecommendedTimeSuggestionsResponse,
  Recommendation,
  SelectedSocialNetwork,
} from '@/typings/Scheduler'
import { SocialNetworksKeyedById } from '@/typings/SocialNetwork'

// prettier-ignore
const ERROR_INVALID_DATE = translation._('Choose a valid date to continue')
const ERROR_EMPTY_DATE = translation._('Choose a date to continue')

export const validateDate = (date: string): string =>
  date.length > 0 ? ERROR_INVALID_DATE : ERROR_EMPTY_DATE

const getDateAtHour = (date: Date, hour: number, timezone: string): Date => {
  return moment(date).tz(timezone).startOf('day').hour(hour).toDate()
}

const FIVE_MINUTES = 5

export const recommendationToSendDate = (
  recommendation: {
    date: Date
    fromHour: number
    schedule: { socialProfileId: string; hour: number }[]
  },
  timezone: string,
): Date => {
  const singleSchedule = recommendation.schedule.length === 1

  return singleSchedule
    ? getDateAtHour(recommendation.date, recommendation.schedule[0].hour, timezone)
    : getDateAtHour(recommendation.date, recommendation.fromHour, timezone)
}

const getScheduledType = ({ isAutomatic, isStarred }: { isAutomatic: boolean; isStarred: boolean }) => {
  if (isAutomatic) {
    return 'automatic_rt'
  } else if (isStarred) {
    return 'selected_best_rt'
  } else {
    return 'selected_rt'
  }
}

export const recommendationToSchedulerValue = (
  recommendation: {
    date: Date
    fromHour: number
    toHour: number
    schedule: { socialProfileId: string; hour: number }[]
    isStarred: boolean
  },
  isAutomatic: boolean,
  timezone: string,
): {
  sendDate: Date
  sendDateEnd?: Date
  recommendations: { time: Date; socialProfileId: string }[]
  isUsingRecommendedTimes: true
  recommendedTimesScheduledType: 'selected_rt' | 'selected_best_rt' | 'automatic_rt'
} => {
  const isRange = recommendation.schedule.length > 1
  const scheduledType = getScheduledType({ isAutomatic, isStarred: recommendation.isStarred })

  return {
    sendDate: recommendationToSendDate(recommendation, timezone),
    sendDateEnd: isRange ? getDateAtHour(recommendation.date, recommendation.toHour, timezone) : undefined,
    recommendations: recommendation.schedule.map(({ socialProfileId, hour }) => ({
      socialProfileId,
      time: getDateAtHour(recommendation.date, hour, timezone),
    })),
    isUsingRecommendedTimes: true,
    recommendedTimesScheduledType: scheduledType,
  }
}

export const getStarredOrFirst = <R extends { isStarred: boolean }>(
  recommendedTimes: R[] | undefined,
): R | undefined => {
  return recommendedTimes && (recommendedTimes.find(rec => rec.isStarred) || recommendedTimes[0])
}

const findBestRecommendationIndex = (suggestedIntervals: SuggestedInterval[]) =>
  suggestedIntervals.reduce(
    ({ weight, index }, { weight: currentWeight }, currentIndex) =>
      weight < currentWeight ? { weight: currentWeight, index: currentIndex } : { weight, index },
    { weight: 0, index: 0 },
  ).index

export const mapRecommendedTimeSuggestionsResponseToRecommendations = ({
  suggestedIntervals,
}: RecommendedTimeSuggestionsResponse): Recommendation[] | undefined => {
  const starredRecommendationIndex = findBestRecommendationIndex(suggestedIntervals)
  const recommendedMapped = suggestedIntervals.map(({ date, schedule, fromHour, toHour }, currentIndex) => {
    return {
      date: new Date(date),
      fromHour,
      toHour,
      isStarred: starredRecommendationIndex === currentIndex,
      schedule: schedule.map(({ externalId, suggestion: { fromHour: hour } }) => ({
        socialProfileId: externalId,
        hour,
      })),
    }
  })
  return recommendedMapped.length === 0 ? undefined : recommendedMapped
}

export const getSelectedSocialNetworksFromMessage = (
  socialNetworksKeyedById: SocialNetworksKeyedById,
): SelectedSocialNetwork[] => {
  return socialNetworksKeyedById
    .toList()
    .toArray()
    .map(({ userId, type }) => ({
      externalId: userId,
      type,
    }))
}

const dateTimeToTimeSlot = (
  dateTime: Date,
  timezoneName: string,
): {
  hour: number
  minute: number
  period: string
} => {
  const m = moment(dateTime).tz(timezoneName)
  return {
    hour: m.hour() % Constants.DATE_TIME.NUM_HOURS_IN_PERIOD || Constants.DATE_TIME.NUM_HOURS_IN_PERIOD,
    minute:
      Math.ceil(m.minute() / TimePickerConstants.SCHEDULE_INTERVAL_MINUTES) *
        TimePickerConstants.SCHEDULE_INTERVAL_MINUTES || 0,
    period:
      m.hour() >= Constants.DATE_TIME.NUM_HOURS_IN_PERIOD ? Constants.DATE_TIME.PM : Constants.DATE_TIME.AM,
  }
}

export const getDefaultDate = ({
  timezoneName,
  defaultSelectedDateTime,
  enabledDays,
  isVideoMessage,
  isEditMode,
  now = () => new Date(),
}: {
  timezoneName: string
  defaultSelectedDateTime?: Date
  enabledDays?: {
    dateFrom: Date
    dateTo: Date
  }
  isVideoMessage: boolean
  isEditMode: boolean
  now?: () => Date
}) => {
  const today = moment(now()).tz(timezoneName)
  let defaultDateTime = today.toDate()
  let selectedTime = TimePickerConstants.DEFAULT_TIME

  if (defaultSelectedDateTime) {
    selectedTime = dateTimeToTimeSlot(defaultSelectedDateTime, timezoneName)
    defaultDateTime = defaultSelectedDateTime
  } else {
    if (enabledDays) {
      const dateFrom = enabledDays.dateFrom
      const dateTo = enabledDays.dateTo
      if (moment(now()).isAfter(dateFrom) && moment(now()).isBetween(dateFrom, dateTo, 'day', '[]')) {
        defaultDateTime = today.toDate()
      } else {
        defaultDateTime = dateFrom
      }
    }
    selectedTime = DateUtils.getNextTimeSlotTimezone(defaultDateTime, timezoneName, { isVideoMessage })
  }

  if (!isEditMode && !defaultSelectedDateTime) {
    let selectedTimeMinimumMinutes = selectedTime
    const currentTime = moment(now()).tz(timezoneName).toDate()
    // returns next valid time slot without the additional hour
    selectedTimeMinimumMinutes = DateUtils.getNextTimeSlotTimezone(currentTime, timezoneName, {
      isVideoMessage,
      ignoreHour: true,
    })
    if (enabledDays) {
      const dateFrom = enabledDays.dateFrom
      const dateTo = enabledDays.dateTo
      if (!moment(selectedTimeMinimumMinutes).isBetween(dateFrom, dateTo, 'day', '[]')) {
        selectedTimeMinimumMinutes = DateUtils.getNextTimeSlotTimezone(dateFrom, timezoneName, {
          isVideoMessage,
        })
      }
    }
    // Initial defaultDateTime value has current minutes/seconds (ie. now) but should get set to
    //   selectedTimeMinimumMinutes, like if user were to click today's date.
    defaultDateTime = DateUtils.formatDateWithTimeAndTimezone(
      defaultDateTime,
      selectedTimeMinimumMinutes,
      timezoneName,
    )
    selectedTime = selectedTimeMinimumMinutes
  }

  // Initial defaultDateTime value has current minutes/seconds (now) but should get set to
  //   selectedTimeMinimumMinutes, like if user were to click today's date.
  return DateUtils.formatDateWithTimeAndTimezone(defaultDateTime, selectedTime, timezoneName)
}

export const isSameDayDifferentTime = (dateA: Date, dateB: Date, timezone: string): boolean => {
  const momentA = moment(dateA).tz(timezone)
  const momentB = moment(dateB).tz(timezone)

  return !momentA.isSame(momentB) && momentA.isSame(momentB, 'day')
}

export const roundUpToNearest5Minutes = (startDate: Moment): Moment => {
  const remainder = FIVE_MINUTES - (startDate.minute() % FIVE_MINUTES)
  return startDate.add(remainder, 'minutes').set({ seconds: 0, milliseconds: 0 })
}

export const getInternalDateForAutomaticRT = (
  internalDate: Date | string,
  selectedRecommendation: Recommendation | undefined,
  timezone,
): Date => {
  if (internalDate == null && selectedRecommendation?.date) {
    return recommendationToSendDate(selectedRecommendation, timezone)
  } else if (
    internalDate &&
    selectedRecommendation?.date &&
    !isSameDayDifferentTime(
      internalDate instanceof Date ? internalDate : new Date(internalDate),
      selectedRecommendation?.date,
      timezone,
    )
  ) {
    return recommendationToSendDate(selectedRecommendation, timezone)
  }
  return new Date(internalDate)
}
