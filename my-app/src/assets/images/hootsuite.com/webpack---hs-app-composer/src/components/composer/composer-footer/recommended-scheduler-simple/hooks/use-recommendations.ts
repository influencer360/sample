import { useEffect } from 'react'

import moment from 'moment-timezone'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import { getRecommendedTimes, cancelRecommendedTimesRequest } from 'fe-pnc-lib-api'

import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import Constants from '@/constants/constants'
import { Recommendation, RecommendedTimeSuggestionsRequest, SelectedSocialNetwork } from '@/typings/Scheduler'
import { getRecommendationsStartDate, getRecommendationsWithinDateRange } from '@/utils/scheduler-utils'
import { track } from '@/utils/tracking'

import { mapRecommendedTimeSuggestionsResponseToRecommendations } from '../helpers'
import usePreviousOrDefault from './use-previous-or-default'

const { SN_TYPES } = SocialProfileConstants

const getLICompanyExternalId = (rawExternalId: string): string =>
  rawExternalId.split('|').pop() ?? rawExternalId

const getSupportedSn = (selectedSocialNetworks: SelectedSocialNetwork[]): SelectedSocialNetwork[] => {
  return selectedSocialNetworks
    .filter(({ type }) => Constants.RT_SUPPORTED_NETWORKS.includes(type))
    .map(selectedSN => ({
      ...selectedSN,
      type: selectedSN.type === SN_TYPES.INSTAGRAMBUSINESS ? SN_TYPES.INSTAGRAM : selectedSN.type,
      externalId:
        selectedSN.type !== SN_TYPES.LINKEDINCOMPANY
          ? selectedSN.externalId
          : getLICompanyExternalId(selectedSN.externalId),
    }))
}

const getRecommendations = (
  request: RecommendedTimeSuggestionsRequest,
): Promise<Recommendation[] | undefined> =>
  getRecommendedTimes(request).then(mapRecommendedTimeSuggestionsResponseToRecommendations)

// If future date selected, calculate from start of that day (00:00), else use current dateTime.
const getRecommendationsCalcDate = (recommendationsDate, timezone) => {
  const nowPlus5Mins = moment().tz(timezone).add(5, 'minutes')
  const recDate = moment(recommendationsDate).tz(timezone)

  return recDate.day() !== nowPlus5Mins.day() ? recDate.startOf('date') : nowPlus5Mins
}

const useRecommendations = (
  recommendationsDate: Date | string,
  organizationId: number | undefined,
  memberId: number,
  timezone: string,
  selectedSocialNetworks: SelectedSocialNetwork[],
  areRecommendationsEnabled: boolean,
  setIsLoading: (nextIsLoading: boolean) => void,
  setRecommendations: (
    nextRecommendations: Recommendation[] | undefined,
    socialProfilesCount: number,
  ) => void,
  isVideoTranscodingRequired: boolean,
  isEnabledDayActive: boolean,
  dateFrom: string | null,
  dateTo: string | null,
  isEnabledDaysScheduleable?: boolean,
): void => {
  const previousDate = usePreviousOrDefault(recommendationsDate)
  const hasDateChanged = isFeatureEnabled('PUB_28677_RT_BUG_FIXES')
    ? moment(previousDate).date() !== moment(recommendationsDate).date()
    : moment(previousDate).day() !== moment(recommendationsDate).day()

  useEffect(() => {
    const isCampaignSelected = isEnabledDayActive && dateFrom && dateTo
    const supportedSocialNetworks = getSupportedSn(selectedSocialNetworks)

    if (supportedSocialNetworks.length === 0 || !areRecommendationsEnabled) {
      setRecommendations(undefined, selectedSocialNetworks.length)
      return
    }
    setIsLoading(true)

    let startDate = moment(recommendationsDate).tz(timezone).startOf('day')
    let endDate = moment(recommendationsDate).tz(timezone).add('1', 'day').startOf('day').hour(12)

    // Check if campaign is active and scheduleable then change start, end date to campaign time
    if (isCampaignSelected) {
      if (!isEnabledDaysScheduleable) {
        setRecommendations(undefined, selectedSocialNetworks.length)
        setIsLoading(false)
        return
      }
      // Adjust the start date if it's not between the campaign
      if (!startDate.isBetween(moment(dateFrom).tz(timezone), moment(dateTo).tz(timezone), undefined, '[]')) {
        startDate = moment(dateFrom).tz(timezone)
      }
      endDate = moment(dateTo).tz(timezone)

      const isCampaignMoreThanAWeek = endDate.diff(startDate, 'week', true) > 1
      // RT only support a date range of 7 days max
      if (isCampaignMoreThanAWeek) {
        endDate = startDate.clone().add(1, 'week').startOf('hour')
      }
    } else {
      const calculatedStartDate = getRecommendationsCalcDate(recommendationsDate, timezone)

      startDate = getRecommendationsStartDate(calculatedStartDate, timezone, isVideoTranscodingRequired)
      endDate = calculatedStartDate.clone().add(1, 'day').endOf('day').hour(12)
    }

    const setRecommendationsAndTrack = (recommendations: Recommendation[] | undefined) => {
      let recommendationsResult = recommendations

      if (isCampaignSelected && isEnabledDaysScheduleable) {
        // recommendations returns a date range `fromHour` to `toHour`, the date range needs to be within the campaign
        recommendationsResult = getRecommendationsWithinDateRange(dateFrom, dateTo, recommendations, timezone)
      }

      setRecommendations(recommendationsResult, selectedSocialNetworks.length)
      track(
        'web.dashboard.full_screen_composer.scheduler',
        recommendationsResult === undefined
          ? 'recommended_times.no_rt_available'
          : 'recommended_times.rt_available',
      )
    }

    // NOTE: Linter suggests recommendationsDate dependency, doing so breaks recommendation selection as we only fetch
    // recommendations when recommendationsDate changes day value.
    getRecommendations({
      ...(organizationId && { orgId: String(organizationId) }),
      memberId: String(memberId),
      socialProfiles: supportedSocialNetworks,
      attribute: 'POST_ENGAGEMENT',
      timeZone: timezone,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    })
      .then(setRecommendationsAndTrack)
      .catch(() => {
        setRecommendationsAndTrack(undefined)
      })
      .finally(() => {
        setIsLoading(false)
      })
    return () => cancelRecommendedTimesRequest()
  }, [
    areRecommendationsEnabled,
    selectedSocialNetworks,
    hasDateChanged,
    organizationId,
    memberId,
    timezone,
    setIsLoading,
    setRecommendations,
    dateFrom,
    dateTo,
    isVideoTranscodingRequired,
    isEnabledDayActive,
    isEnabledDaysScheduleable,
  ])
}

export default useRecommendations
