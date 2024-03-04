import Constants from '@/constants/constants'

const AutoScheduleSettings = {
  setSettings: (settings, memberId) => {
    if (localStorage && memberId) {
      const localStorageAutoscheduled = JSON.parse(localStorage.getItem(Constants.AUTOSCHEDULE_SETTINGS))
      if (localStorageAutoscheduled) {
        localStorageAutoscheduled[memberId] = settings
        localStorage.setItem(Constants.AUTOSCHEDULE_SETTINGS, JSON.stringify(localStorageAutoscheduled))
      } else {
        localStorage.setItem(Constants.AUTOSCHEDULE_SETTINGS, JSON.stringify({ [memberId]: settings }))
      }
    }
  },
}

export default AutoScheduleSettings
