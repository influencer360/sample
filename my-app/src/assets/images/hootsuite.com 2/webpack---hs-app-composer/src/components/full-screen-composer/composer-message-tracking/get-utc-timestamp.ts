import moment from 'moment'

// Mixpanel recommends formatting dates this way: https://help.mixpanel.com/hc/en-us/articles/115004547203-Manage-Timezones-for-Projects-in-Mixpanel
export default () => moment().toISOString()
