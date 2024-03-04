import { useReducer, useCallback } from 'react'

import { useDispatch as reduxUseDispatch } from 'react-redux'
import type { SCHEDULER_MODES } from 'fe-pnc-comp-form-scheduler'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import Constants from '@/constants/constants'
import { composerActions } from '@/redux/reducers/composer'
import { SchedulerMode } from '@/typings/Constants'
import {
  RecommendedSchedulerState,
  RecommendedSchedulerAction,
  Recommendation,
  InnerSchedulerValue,
} from '@/typings/Scheduler'
import { savePublisherSetting } from '@/utils/composer-data-fetcher'
import {
  getStarredOrFirst,
  recommendationToSendDate,
  isSameDayDifferentTime,
  getInternalDateForAutomaticRT,
} from '../helpers'

const useDispatch = reduxUseDispatch

const init = ({
  timezone,
  defaultDate,
  sendDate,
  isUsingRecommendedTimes,
}: {
  timezone: string
  defaultDate: Date
  sendDate?: Date
  isUsingRecommendedTimes: boolean
}): RecommendedSchedulerState => {
  const initialMode: SchedulerMode =
    isUsingRecommendedTimes && !sendDate
      ? Constants.SCHEDULER_MODE.RECOMMENDED
      : Constants.SCHEDULER_MODE.MANUAL

  return {
    timezone,
    mode: initialMode,
    internalDate: sendDate ?? undefined,
    isLoadingRecommendations: false,
    recommendations: undefined,
    isInputDateChanged: false,
    defaultDate: defaultDate,
  }
}

const reducer = (
  state: RecommendedSchedulerState,
  action: RecommendedSchedulerAction,
): RecommendedSchedulerState => {
  switch (action.type) {
    case 'setIsLoadingRecommendations': {
      return {
        ...state,
        isLoadingRecommendations: action.nextIsLoadingRecommendations,
      }
    }

    case 'setRecommendations': {
      const { internalDate } = state
      const isInternalDateEmpty = internalDate == null

      switch (state.mode) {
        case Constants.SCHEDULER_MODE.RECOMMENDED: {
          if (action.socialProfilesCount > 0) {
            if (!action.nextRecommendations) {
              return {
                ...state,
                recommendations: undefined,
                selectedRecommendation: undefined,
                isInputDateChanged: state.isInputDateChanged,
              }
            }

            return {
              ...state,
              recommendations: action.nextRecommendations,
              isInputDateChanged: false,
            }
          }
        }

        case Constants.SCHEDULER_MODE.RECOMMENDED_AUTOMATIC: {
          if (isInternalDateEmpty && action.socialProfilesCount > 0) {
            state.internalDate = state.defaultDate
          }

          if (action.socialProfilesCount > 0) {
            if (!action.nextRecommendations) {
              return {
                ...state,
                recommendations: undefined,
                selectedRecommendation: undefined,
                isInputDateChanged: state.isInputDateChanged,
              }
            }

            const selectedRecommendation = getStarredOrFirst(action.nextRecommendations)
            const internalDate = getInternalDateForAutomaticRT(
              state.internalDate,
              selectedRecommendation,
              state.timezone,
            )
            return {
              ...state,
              recommendations: action.nextRecommendations,
              selectedRecommendation,
              internalDate,
              isInputDateChanged: false,
            }
          }

          if (!action.nextRecommendations) {
            const nextValidDate = state.selectedRecommendation
              ? recommendationToSendDate(state.selectedRecommendation, state.timezone)
              : state.internalDate
            return {
              ...state,
              recommendations: undefined,
              selectedRecommendation: undefined,
              internalDate: nextValidDate,
              isInputDateChanged: state.isInputDateChanged,
            }
          }

          const selectedRecommendation = getStarredOrFirst(action.nextRecommendations)
          const internalDate = getInternalDateForAutomaticRT(
            state.internalDate,
            selectedRecommendation,
            state.timezone,
          )
          return {
            ...state,
            recommendations: action.nextRecommendations,
            selectedRecommendation,
            internalDate,
            isInputDateChanged: false,
          }
        }

        default: {
          const selectedRecommendation = getStarredOrFirst(action.nextRecommendations)
          let internalDate = state.internalDate
          if (
            (state.mode === Constants.SCHEDULER_MODE.RECOMMENDED ||
              state.mode === Constants.SCHEDULER_MODE.RECOMMENDED_AUTOMATIC) &&
            !state.isInputDateChanged
          ) {
            internalDate = getInternalDateForAutomaticRT(
              state.internalDate,
              selectedRecommendation,
              state.timezone,
            )
          }

          return {
            ...state,
            recommendations: action.nextRecommendations,
            selectedRecommendation,
            internalDate,
            isInputDateChanged: false,
          }
        }
      }
    }

    case 'innerSchedulerChanged': {
      const { nextValue } = action

      switch (nextValue.mode) {
        case Constants.SCHEDULER_MODE.MANUAL: {
          let nextMode = Constants.SCHEDULER_MODE.MANUAL

          if (state.mode === Constants.SCHEDULER_MODE.RECOMMENDED) {
            const hasTimeChanged =
              nextValue.time instanceof Date &&
              state.internalDate instanceof Date &&
              isSameDayDifferentTime(nextValue.time, state.internalDate, state.timezone)

            nextMode = hasTimeChanged ? Constants.SCHEDULER_MODE.MANUAL : state.mode
          }

          return {
            ...state,
            mode: nextMode,
            internalDate: nextValue.time,
            isInputDateChanged: false,
          }
        }
        case Constants.SCHEDULER_MODE.RECOMMENDED:
          return {
            ...state,
            mode: Constants.SCHEDULER_MODE.RECOMMENDED,
            internalDate: nextValue.selectedDate,
            selectedRecommendation: nextValue.recommendation,
            isInputDateChanged: nextValue.isInputDateChanged,
          }
      }
    }

    case 'schedulerDateChanged': {
      return {
        ...state,
        selectedDate: action.nextDate === null ? '' : action.nextDate,
        sendDate: action.nextDate === null ? null : new Date(action.nextDate),
        internalDate: action.nextDate === null ? null : new Date(action.nextDate),
        isInputDateChanged: true,
      }
    }

    case 'schedulerModeChanged': {
      return {
        ...state,
        mode: action.nextMode,
      }
    }

    case 'schedulerClosed': {
      return {
        ...state,
        isInputDateChanged: false,
      }
    }

    case 'setInternalDate': {
      return {
        ...state,
        internalDate: action.nextInternalDate,
      }
    }

    case 'schedulerCleared': {
      return {
        ...state,
        selectedDate: '',
        sendDate: null,
        internalDate: null,
        isInputDateChanged: true,
        mode: Constants.SCHEDULER_MODE.MANUAL,
      }
    }

    default:
      return state
  }
}

const useRecommendedSchedulerState = ({
  timezone,
  defaultDate,
  sendDate,
  isUsingRecommendedTimes,
  isOpen,
}: {
  timezone: string
  defaultDate: Date
  sendDate?: Date
  isUsingRecommendedTimes: boolean
  isOpen: boolean
}) => {
  const [state, dispatch] = useReducer(
    reducer,
    {
      timezone,
      defaultDate,
      sendDate,
      isUsingRecommendedTimes,
    },
    init,
  )
  const reduxDispatch = useDispatch()

  // Actions
  const setIsLoadingRecommendations = useCallback(
    (nextIsLoading: boolean) =>
      dispatch({ type: 'setIsLoadingRecommendations', nextIsLoadingRecommendations: nextIsLoading }),
    [dispatch],
  )
  const setRecommendations = useCallback(
    (nextRecommendations: Recommendation[] | undefined, socialProfilesCount: number) =>
      dispatch({ type: 'setRecommendations', nextRecommendations, socialProfilesCount }),
    [dispatch],
  )
  const innerSchedulerChanged = useCallback(
    (nextValue: InnerSchedulerValue) => dispatch({ type: 'innerSchedulerChanged', nextValue }),
    [dispatch],
  )
  const schedulerDateChanged = useCallback(
    (nextDate: string) => dispatch({ type: 'schedulerDateChanged', nextDate: nextDate }),
    [dispatch],
  )
  const schedulerModeChanged = useCallback(
    (nextMode: SCHEDULER_MODES) => {
      if (isFeatureEnabled('PUB_28677_RT_BUG_FIXES')) {
        if (isOpen) {
          reduxDispatch(composerActions.setDefaultRecommendedTimesMode(nextMode))

          savePublisherSetting('defaultRecommendedTimesMode', nextMode)
        }
      }
      return dispatch({ type: 'schedulerModeChanged', nextMode: nextMode })
    },
    [dispatch, isOpen, reduxDispatch],
  )
  const schedulerClosed = useCallback(() => dispatch({ type: 'schedulerClosed' }), [dispatch])
  const setInternalDate = useCallback(
    (nextInternalDate: Date | undefined) =>
      dispatch({ type: 'setInternalDate', nextInternalDate: nextInternalDate }),
    [dispatch],
  )
  const schedulerCleared = useCallback(() => dispatch({ type: 'schedulerCleared' }), [dispatch])

  return [
    state,
    {
      setIsLoadingRecommendations,
      setRecommendations,
      innerSchedulerChanged,
      schedulerDateChanged,
      schedulerModeChanged,
      schedulerClosed,
      setInternalDate,
      schedulerCleared,
    },
  ] as const
}

export default useRecommendedSchedulerState
