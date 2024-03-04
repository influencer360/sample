import moment from 'moment-timezone'
import translation from 'fe-pnc-lib-hs-translation'
import Constants from '@/constants/constants'
import { DateRange } from '@/typings/TimePicker'

const DATE_AT_TIME = translation._('%s1 at %s2')
const DATE_AT_TIME_RANGE = translation._('%date (%timeStart - %timeEnd)')
const AM_STRING = translation._('AM')
const PM_STRING = translation._('PM')

/**
 * @param {number} time (seconds)
 * @returns {string}
 **/
const convertTimeInSecondsToHourString = time => {
  const hour = time / 3600
  let result = ''

  if (hour === 0 || hour === 24) {
    result = '12 ' + AM_STRING
  } else if (hour < 12) {
    result = hour + ' ' + AM_STRING
  } else if (hour === 12) {
    result = '12 ' + PM_STRING
  } else {
    result = hour - 12 + ' ' + PM_STRING
  }
  return result
}

/**
 * @param {Object} days
 * @returns {string}
 **/
const buildDaysString = days => {
  const isEquivalent = (a, b) => {
    const aProps = Object.getOwnPropertyNames(a)
    const bProps = Object.getOwnPropertyNames(b)

    if (aProps.length !== bProps.length) {
      return false
    }
    for (let i = 0; i < aProps.length; i++) {
      const propName = aProps[i]
      if (a[propName] !== b[propName]) {
        return false
      }
    }
    return true
  }

  const isAllDaysSelected = Object.values(days).every(d => d === 'true')
  const weekdaysMatch = {
    fri: 'true',
    mon: 'true',
    sat: 'false',
    sun: 'false',
    thu: 'true',
    tue: 'true',
    wed: 'true',
  }
  const weekendsMatch = {
    fri: 'false',
    mon: 'false',
    sat: 'true',
    sun: 'true',
    thu: 'false',
    tue: 'false',
    wed: 'false',
  }

  if (isAllDaysSelected) {
    return translation._('all days')
  } else if (isEquivalent(days, weekdaysMatch)) {
    return translation._('weekdays')
  } else if (isEquivalent(days, weekendsMatch)) {
    return translation._('weekends')
  } else {
    const selectedDays: Array<string> = []
    if (days.mon === 'true') {
      selectedDays.push(translation._('Monday'))
    }
    if (days.tue === 'true') {
      selectedDays.push(translation._('Tuesday'))
    }
    if (days.wed === 'true') {
      selectedDays.push(translation._('Wednesday'))
    }
    if (days.thu === 'true') {
      selectedDays.push(translation._('Thursday'))
    }
    if (days.fri === 'true') {
      selectedDays.push(translation._('Friday'))
    }
    if (days.sat === 'true') {
      selectedDays.push(translation._('Saturday'))
    }
    if (days.sun === 'true') {
      selectedDays.push(translation._('Sunday'))
    }
    return selectedDays.join(', ')
  }
}

/**
 * Formats a Date object to a human readable string.
 *
 * Usage:
 * formatDateTime(new Date(1830348300)) - returns Sat 1 Jan 2028 at 2:05PM
 *
 * @param {Date} date The date to format
 * @param {string} [timezoneName] The users timezone, always determine from the users dashboard settings in real scenarios
 * @param {string} [translationString] Optional, an alternative translation string to use (where %s1 is date and %s2 is time)
 * @return {string} A formatted date string
 */
const formatDateTime = (
  date,
  timezoneName = Constants.DATE_TIME.VANCOUVER_TIMEZONE,
  translationString = DATE_AT_TIME,
) => {
  const scheduledMoment = moment(date).tz(timezoneName)

  const format =
    scheduledMoment.year() === moment().tz(timezoneName).year() ? 'ddd, MMM D' : 'ddd, MMM D, YYYY'

  return translationString
    .replace('%s1', scheduledMoment.format(format))
    .replace('%s2', scheduledMoment.format('h:mmA'))
}

/**
 * Formats a date range, assuming start and end dates are on the same day.
 */
export const formatDateTimeRange = ({ start, end }: DateRange, timezoneName: string) => {
  const startMoment = moment(start).tz(timezoneName)
  const endMoment = moment(end).tz(timezoneName)

  const format = startMoment.year() === moment().tz(timezoneName).year() ? 'ddd, MMM D' : 'ddd, MMM D, YYYY'

  return DATE_AT_TIME_RANGE.replace('%date', startMoment.format(format))
    .replace('%timeStart', startMoment.format('h:mmA'))
    .replace('%timeEnd', endMoment.format('h:mmA'))
}

/**
 * Converts a Date to a Unix timestamp
 * @param {Date} date A Date object
 * @param {string} [timezoneName] The timezone name, defaults to Vancouver if undefined
 * @returns {number} A Unix timestamp (seconds since the Unix Epoch)
 */
const dateToUnixTimestamp = (date, timezoneName = Constants.DATE_TIME.VANCOUVER_TIMEZONE) => {
  if (!date) {
    return null
  }
  return moment.utc(date).tz(timezoneName).unix()
}

/**
 * @param sendDate The current sendDate in seconds
 * @returns Returns a Date object based on the given sendDate, or the original value if not a number
 */
const getSendDate = (sendDate?: number | undefined | null): Date | undefined | null => {
  if (typeof sendDate === 'number') {
    return new Date(sendDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS)
  }
  return sendDate
}

export { convertTimeInSecondsToHourString, buildDaysString, formatDateTime, dateToUnixTimestamp, getSendDate }
