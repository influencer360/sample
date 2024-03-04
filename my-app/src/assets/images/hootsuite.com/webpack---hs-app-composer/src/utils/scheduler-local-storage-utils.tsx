import Constants from '@/constants/constants'

export const setIsAutoScheduledLocalStorage = (isAutoScheduled: boolean, memberId: number): void => {
  if (localStorage && memberId) {
    const localStorageAutoscheduled = JSON.parse(
      localStorage.getItem(Constants.LAST_IS_AUTOSCHEDULED_LOCAL_STORAGE),
    )
    if (localStorageAutoscheduled) {
      localStorageAutoscheduled[memberId] = isAutoScheduled
      localStorage.setItem(
        Constants.LAST_IS_AUTOSCHEDULED_LOCAL_STORAGE,
        JSON.stringify(localStorageAutoscheduled),
      )
    } else {
      localStorage.setItem(
        Constants.LAST_IS_AUTOSCHEDULED_LOCAL_STORAGE,
        JSON.stringify({ [memberId]: isAutoScheduled }),
      )
    }
  }
}

export const clearIsAutoSecheduledLocalStorage = (memberId: number): void => {
  setIsAutoScheduledLocalStorage(false, memberId)
}

export const getAutoScheduleSettingsLocalStorage = (memberId: number): unknown => {
  if (localStorage && memberId) {
    return JSON.parse(localStorage.getItem(Constants.AUTOSCHEDULE_SETTINGS))[memberId]
  } else {
    return {}
  }
}
