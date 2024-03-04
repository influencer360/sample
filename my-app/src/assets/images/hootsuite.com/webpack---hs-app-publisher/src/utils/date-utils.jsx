/** @format */

import cloneDeep from 'lodash.clonedeep'
import moment from 'moment-timezone'
import Constants from '../constants/constants'
import ComposerConstants from '../constants/composer'
import TimePickerConstants from '../constants/time-picker'

const DateUtils = {
  /**
   * Returns a correctly formatted valid timezone name that momentjs can use
   * The underscore character should be used in place of spaces for timezones- e.g. "America/Los Angeles" should be "America/Los_Angeles"
   * https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   * @param {string} timezoneName
   * @returns {string}
   */
  formatTimezoneNameString(timezoneName) {
    return timezoneName.replace(/ /g, '_')
  },

  /**
   * Get an ISO8601 moment with the given date and timezone
   * @param {number} timestamp Unix timestamp
   * @param {string} timezoneName https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   * @returns {object}
   */
  getISODateWithTimezone(timestamp, timezoneName) {
    if (typeof timezoneName === 'string') {
      timezoneName = this.formatTimezoneNameString(timezoneName)
    }

    const dateTime = moment(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss')
    return moment.tz(dateTime, moment.ISO_8601, timezoneName)
  },

  /**
   * Takes in a date and time and returns with an adjusted Date object
   * @param {Date} date
   * @param {Object} time {hour: 12, minute: 0, period: 'AM'}
   * @param {String} timezoneName name of the timezone to format to
   * @returns {Date} updatedDate
   */
  formatDateWithTimeAndTimezone(date, time, timezoneName) {
    const updatedMoment = moment(date).tz(timezoneName)
    const hour = DateUtils.convertToMilitaryHour(time.hour, time.period)

    updatedMoment.hour(hour)
    updatedMoment.minute(time.minute)

    return updatedMoment.toDate()
  },

  /**
   * Gets the timestamp based off a date and timezone.
   * @param {number} timestamp Unix timestamp
   * @param {string} timezoneName https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   * @returns {number}
   */
  getTimestampWithTimezone(timestamp, timezoneName) {
    return this.getISODateWithTimezone(timestamp, timezoneName).valueOf() / 1000
  },

  /**
   * Gets the ISO 8601 formatted string based off a date and timezone.
   * @param {number} timestamp Unix timestamp
   * @param {string} timezoneName https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
   * @returns {string}
   */
  getISOStringWithTimezone(timestamp, timezoneName) {
    return this.getISODateWithTimezone(timestamp, timezoneName).toISOString()
  },

  /**
   * Converts a Date to unix timestamp
   * @param {Date} dateTime
   * @returns {number}
   */
  convertDateTimeToUnixTimestamp(dateTime) {
    return Date.parse(dateTime) / 1000
  },

  /**
   * Converts given hour and period to military hour (ie. 4PM will return 16)
   * @param {Number} hour
   * @param {String} period
   * @returns {Number}
   */
  convertToMilitaryHour(hour, period) {
    let h = hour

    if (h === Constants.DATE_TIME.NUM_HOURS_IN_PERIOD && period === Constants.DATE_TIME.AM) {
      return 0
    } else if (h === Constants.DATE_TIME.NUM_HOURS_IN_PERIOD && period === Constants.DATE_TIME.PM) {
      return h
    } else if (period === Constants.DATE_TIME.PM) {
      return h + Constants.DATE_TIME.NUM_HOURS_IN_PERIOD
    }

    return h
  },

  /**
   * Return true if a day is in the past of another day
   * @param {Date} dayToCompare
   * @param {Date} dayToCompareWith
   * @return {Boolean}
   */
  isPastDay(dayToCompare, dayToCompareWith) {
    dayToCompareWith.setHours(0, 0, 0, 0)
    return dayToCompare < dayToCompareWith
  },

  /**
   * Takes in a date and time and returns with an adjusted Date object
   * @param {Date} date
   * @param {Object} time {hour: 12, minute: 0, period: 'AM'}
   * @returns {Date} updatedDate
   */
  formatDateWithTime(date, time) {
    const updatedDate = cloneDeep(date)
    const hour = this.convertToMilitaryHour(time.hour, time.period)

    updatedDate.setHours(hour)
    updatedDate.setMinutes(time.minute)

    return updatedDate
  },

  /**
   * Return `true` if a given date object is >= minimumScheduleMinutes
   * @param {Date} date
   * @param {Number} minimumScheduleMinutes
   * @return {Boolean}
   */
  validateDateWithMinimumScheduleMinutes(date, minimumScheduleMinutes) {
    let minutesRemaining =
      (date - new Date()) /
      Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS /
      Constants.DATE_TIME.NUM_SECONDS_IN_MINUTE
    return minutesRemaining >= minimumScheduleMinutes
  },

  /**
   * Adjusts the given timestamp with the given timezone and returns a local Date object
   * @param {Number} timestamp
   * @param {String} timezoneName
   * @returns {Date}
   */
  convertTimestampWithTimezoneNameToLocalDate(timestamp, timezoneName) {
    return new Date(
      moment
        .utc(timestamp * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS)
        .tz(timezoneName)
        .format('MMMM D, YYYY HH:mm:ss'),
    )
  },

  /**
   * Returns a unix timestamp for the given date, time, and timezone
   * @param {Date} date
   * @param {Object} time {{hour: number, minute: number, period: string}}
   * @param {String} timezoneName
   * @returns {Number}
   */
  getUnixTimestampWithDateTimeTimezone(date, time, timezoneName) {
    const hour = this.convertToMilitaryHour(time.hour, time.period)
    return moment
      .tz([date.getFullYear(), date.getMonth(), date.getDate(), hour, time.minute], timezoneName)
      .unix()
  },

  /**
   * Gets the ISO 8601 formatted string for the given timestamp
   * @param {Number} timestamp
   * @returns {String}
   */
  getISOStringWithTimestamp(timestamp) {
    return new Date(timestamp * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS).toISOString()
  },
  /**
   * Returns the next available time slot
   * @param {Date} dateTime
   * @param {bool} isVideoMessage
   * @param {bool} ignoreHour when you want the next time slot that is the minimumScheduleMinutes in the future
   *
   * @returns {{hour: number, minute: *, period: string}}
   */
  getNextTimeSlot(dateTime, isVideoMessage = false, ignoreHour = true) {
    const minimumScheduleMinutes = isVideoMessage
      ? ComposerConstants.MINIMUM_SCHEDULE_MINUTES.VIDEO
      : ComposerConstants.MINIMUM_SCHEDULE_MINUTES.DEFAULT

    const startMinute = parseInt(dateTime.getMinutes())
    let minute
    if (!ignoreHour) {
      minute = startMinute
    } else {
      minute = startMinute + minimumScheduleMinutes
    }
    minute =
      minute +
      (TimePickerConstants.SCHEDULE_INTERVAL_MINUTES -
        (minute % TimePickerConstants.SCHEDULE_INTERVAL_MINUTES))
    const overflow = minute / Constants.DATE_TIME.NUM_SECONDS_IN_MINUTE >= 1
    minute = minute % Constants.DATE_TIME.NUM_SECONDS_IN_MINUTE
    let rawHour
    if (!ignoreHour) {
      rawHour = (dateTime.getHours() + (overflow ? 2 : 1)) % Constants.DATE_TIME.NUM_HOURS_IN_DAY
    } else {
      rawHour = (dateTime.getHours() + (overflow ? 1 : 0)) % Constants.DATE_TIME.NUM_HOURS_IN_DAY
    }
    const hour = rawHour % Constants.DATE_TIME.NUM_HOURS_IN_PERIOD || Constants.DATE_TIME.NUM_HOURS_IN_PERIOD
    const period =
      rawHour < Constants.DATE_TIME.NUM_HOURS_IN_PERIOD ? Constants.DATE_TIME.AM : Constants.DATE_TIME.PM

    return {
      hour,
      minute,
      period,
    }
  },

  /**
   * Sets the seconds to zero for the given epoch timestamp
   * @param {Number} timestamp
   * @return {Number}
   */
  removeSecondsFromEpochTimestamp(timestamp) {
    const date = new Date(timestamp * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS)
    return date.setSeconds(0) / Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS
  },

  /**
   * Converts given epoch timestamp to ISO 8601 formatted string
   * @param {Number} timestamp
   * @return {String}
   */
  convertEpochTimestampToISOString(timestamp) {
    return moment(timestamp * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS).toISOString()
  },

  /**
   * Converts given epoch timestamp and timezone to a Moment object
   * @param {Number} timestamp
   * @param {String} timezoneName
   * @return {moment}
   */
  convertEpochTimestampToMoment(timestamp, timezoneName) {
    return moment(timestamp * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS).tz(timezoneName)
  },

  /**
   * Since react-day-picker only takes Date objects, we need to set
   * the date based on the moment object because the moment object
   * has the adjusted date with the user's timezone. Native Date objects
   * always takes your system's timezone so we need to adjust it in
   * order to display the correct dates in the calendar. This is a
   * hacky solution and I don't see any other way around it.
   * @param {Date} date
   * @param {moment} momentDate
   * @return {Date}
   */
  updateDateWithTimezone(date, momentDate) {
    const updatedDate = new Date(date)
    updatedDate.setFullYear(momentDate.year())
    updatedDate.setMonth(momentDate.month())
    updatedDate.setDate(momentDate.date())
    updatedDate.setHours(momentDate.hour())
    updatedDate.setMinutes(momentDate.minute())
    return updatedDate
  },
}

export default DateUtils
