import Constants from './constants'

const SELECTOR = {
  HOUR: 'hour',
  MINUTE: 'minute',
  PERIOD: 'period',
}

const DEFAULT_TIME = {
  hour: 12,
  minute: 0,
  period: Constants.DATE_TIME.PM,
}

const SCHEDULE_INTERVAL_MINUTES = 5

export default {
  SELECTOR,
  DEFAULT_TIME,
  SCHEDULE_INTERVAL_MINUTES,
}
