import { isNumber } from 'lodash'
import moment, { Moment } from 'moment-timezone'
import { Constants } from 'fe-pnc-constants'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import { DateUtils } from 'fe-pnc-lib-utils'
import ComposerConstants from '@/constants/composer'
import { Recommendation } from '@/typings/Scheduler'

const DEFAULT_RECOMMENDATION_MINIMUM_START_TIME_MINUTES = 20

export const getDateRoundedToNearest5MinuteMark = (date: Moment): Moment => {
  const remainder = 5 - (date.minute() % 5)
  return remainder === 5 ? date : date.add(remainder, 'minutes')
}

export const getRecommendationsStartDate = (
  maybeStartDate: Moment,
  timezone: string,
  isVideoTranscodingRequired: boolean,
): Moment => {
  let defaultStartDate = moment()
    .tz(timezone)
    .add(DEFAULT_RECOMMENDATION_MINIMUM_START_TIME_MINUTES, 'minutes')

  if (isVideoTranscodingRequired) {
    defaultStartDate = moment()
      .tz(timezone)
      .add(ComposerConstants.MINIMUM_SCHEDULE_MINUTES.VIDEO_TRANSCODING, 'minutes')
  }

  if (maybeStartDate.isBefore(defaultStartDate)) {
    return defaultStartDate
  }
  return maybeStartDate
}

export const getEnabledSchedulableDates = (
  isEnabledDayActive: boolean,
  enabledStartDate: string | undefined,
  enabledEndDate: string | undefined,
  timezone: string,
  hasVideo: boolean,
  isTranscodeableVideo: boolean,
): {
  earliestSchedulableDate: string | null
  farthestSchedulableDate: string | null
  isEnabledDaysScheduleable: boolean
} => {
  if (isEnabledDayActive) {
    let earliestSchedulableDate
    const now = moment().tz(timezone)
    const startDate = moment(enabledStartDate).tz(timezone)
    const endDate = moment(enabledEndDate).tz(timezone)

    let minutesNeeded = ComposerConstants.MINIMUM_SCHEDULE_MINUTES.DEFAULT

    if (hasVideo) {
      minutesNeeded = ComposerConstants.MINIMUM_SCHEDULE_MINUTES.VIDEO
      if (isTranscodeableVideo) {
        minutesNeeded = ComposerConstants.MINIMUM_SCHEDULE_MINUTES.VIDEO_TRANSCODING
      }
    }

    const canScheduleOnStartDate = now.clone().add(minutesNeeded, 'minutes').isSameOrBefore(startDate)

    if (canScheduleOnStartDate) {
      earliestSchedulableDate = startDate
    } else {
      if (isFeatureEnabled('PUB_30636_INVALID_SCHEDULED_DATE')) {
        earliestSchedulableDate = getDateRoundedToNearest5MinuteMark(now.clone()).add(
          minutesNeeded,
          'minutes',
        )
      } else {
        earliestSchedulableDate = now.clone().add(minutesNeeded, 'minutes')
      }
    }

    const isEnabledDaysScheduleable = earliestSchedulableDate.isBefore(endDate) && endDate.isAfter(now)

    return {
      earliestSchedulableDate: earliestSchedulableDate.set({ seconds: 0, milliseconds: 0 }).toISOString(),
      farthestSchedulableDate: endDate.set({ seconds: 0, milliseconds: 0 }).toISOString(),
      isEnabledDaysScheduleable: isEnabledDaysScheduleable,
    }
  } else {
    return { earliestSchedulableDate: null, farthestSchedulableDate: null, isEnabledDaysScheduleable: false }
  }
}

export const getRecommendationsWithinDateRange = (
  fromDate: string,
  toDate: string,
  recommendations: Recommendation[] | undefined,
  timezone: string,
) => {
  if (!recommendations) {
    return
  }
  const now = moment().tz(timezone)
  const startDate = moment(fromDate).tz(timezone)
  const endDate = moment(toDate).tz(timezone)

  const result: Recommendation[] = recommendations.filter(recommendation => {
    const fromRecommendedDate = moment(recommendation.date).tz(timezone).hour(recommendation.fromHour)
    const toRecommendedDate = moment(recommendation.date).tz(timezone).hour(recommendation.toHour)

    const isFromRecommendedDateInCampaign = fromRecommendedDate.isSameOrAfter(startDate)
    const isToRecommendedDateInCampaign =
      toRecommendedDate.isSameOrBefore(endDate) && toRecommendedDate.isSameOrAfter(startDate)
    return (
      isFromRecommendedDateInCampaign && isToRecommendedDateInCampaign && toRecommendedDate.isSameOrAfter(now)
    )
  })
  return result
}

export const getScheduledSendTimeString = (date): string => {
  if (!isNumber(date)) return null

  const sendDate = DateUtils.removeSecondsFromEpochTimestamp(date)
  return new Date(sendDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS).toISOString()
}
