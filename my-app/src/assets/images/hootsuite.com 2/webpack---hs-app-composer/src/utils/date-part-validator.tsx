import Constants from '@/constants/constants'

class DatePartValidator {
  /**
   * Creates a new validator instance, treating the given time as the minimum time for dates to be valid
   * @param {Date} minimumTime The minimum time dates need to be to be considered valid
   */
  constructor(minimumTime) {
    this.minimumTime = minimumTime
  }

  isValidYear(year) {
    return year > 1970
  }

  isValidMonth(month) {
    return !isNaN(month) && month >= 1 && month <= 12
  }

  isValidDay(day, month, year) {
    if (day === undefined || month === undefined || year === undefined) {
      return false
    }

    if (isNaN(parseInt(day, 10))) {
      return false
    }

    if (day < 1) {
      return false
    }

    if (day < 29) {
      return true
    }

    if (Constants.MONTHS_WITH_30_DAYS.reduce((acc, m) => acc || m === month, false)) {
      return day <= 30
    } else if (month === Constants.MONTHS.FEB) {
      return day <= 28 + (year % 4 === 0 ? 1 : 0)
    } else {
      return day <= 31
    }
  }

  isValidHour(hour) {
    return hour >= 0 && hour <= 23
  }

  isValidMinute(minute) {
    return minute >= 0 && minute <= 59
  }

  isDateInFuture(date) {
    return date instanceof Date && date.getTime() - this.minimumTime.getTime() > 0
  }

  isValidDateOrErrorMessage(year, month, day, hour, min) {
    if (!this.isValidYear(year)) {
      return 'Invalid Date: Year is invalid'
    }

    if (!this.isValidMonth(month)) {
      return 'Invalid Date: Month is invalid'
    }

    if (!this.isValidDay(day, month, year)) {
      return 'Invalid Date: Day is invalid'
    }

    if (!this.isValidHour(hour)) {
      return 'Invalid Date: Hour is invalid'
    }

    if (!this.isValidMinute(min)) {
      return 'Invalid Date: Minute is invalid'
    }

    if (!this.isDateInFuture(new Date(Date.UTC(year, month - 1, day, hour, min)))) {
      return 'Invalid Date: Date must be in the future'
    }

    return true
  }
}

export default DatePartValidator
