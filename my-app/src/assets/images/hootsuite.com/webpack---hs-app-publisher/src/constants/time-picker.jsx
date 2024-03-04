/** @format */

import Constants from './constants'

const TimePickerConstants = {}

TimePickerConstants.SELECTOR = {
  HOUR: 'hour',
  MINUTE: 'minute',
  PERIOD: 'period',
}

TimePickerConstants.DEFAULT_TIME = {
  hour: 12,
  minute: 0,
  period: Constants.DATE_TIME.PM,
}

TimePickerConstants.SCHEDULE_INTERVAL_MINUTES = 5

export default TimePickerConstants
