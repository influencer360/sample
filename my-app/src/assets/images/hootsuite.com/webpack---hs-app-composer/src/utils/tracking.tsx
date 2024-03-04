import _ from 'underscore'
import { track as libTrack } from 'fe-lib-tracking'
import { uuid } from 'fe-lib-uuid'
import TrackingConstants from '@/constants/tracking'
import { TrackingOrigin } from '@/typings/Constants'

interface TrackingActions {
  NEW_COMPOSE: Record<string, string>
  PINTEREST: Record<string, string>
  LEGACY?: Record<string, string>
}

const SESSION_ID = 'sessionId'
const CROSS_PRODUCT_SESSION_ID = 'crossProductSessionId'

/**
 * Generates a unique ID to correlate tracking for the current Composer session
 * If a session ID already exists, it will be overwritten by the new ID
 * @returns The newly generated session ID
 */
const generateSessionId = (): string => {
  const sessionId = uuid()
  sessionStorage.setItem(SESSION_ID, sessionId)
  sessionStorage.removeItem(CROSS_PRODUCT_SESSION_ID)
  return sessionId
}

/**
 * @returns The session ID for the current Composer session
 */
const getSessionId = (): string | undefined => {
  const sessionId = sessionStorage.getItem(SESSION_ID)
  return sessionId || undefined
}

/**
 * Saves the Cross product session ID to be included in the tracking events.
 * This ID comes from the Hootbus event and is provided by other apps.
 * @param crossProductSessionId
 */
const setCrossProductSessionId = (crossProductSessionId: string): void => {
  sessionStorage.setItem(CROSS_PRODUCT_SESSION_ID, crossProductSessionId)
}

/**
 * @returns The cross product session ID for the current Composer session
 */
const getCrossProductSessionId = (): string | undefined => {
  const sessionId = sessionStorage.getItem(CROSS_PRODUCT_SESSION_ID)
  return sessionId || undefined
}

/**
 * @returns The Tracking Actions for the given message type
 */
const getTrackingActionsByMessageType = ({
  isDraft = false,
  isDuplicate = false,
  isEdit = false,
}): TrackingActions => {
  if (isDraft) {
    return TrackingConstants.TRACKING_ACTIONS.DRAFT
  } else if (isDuplicate) {
    return TrackingConstants.TRACKING_ACTIONS.DUPLICATE
  } else if (isEdit) {
    return TrackingConstants.TRACKING_ACTIONS.EDIT
  } else {
    return TrackingConstants.TRACKING_ACTIONS.NEW
  }
}

/**
 * Wrapper for fe-lib-tracking to append additional data required for Composer
 * @param trackingOrigin
 * @param event
 * @param data Additional data to send to the tracking request
 * @param useLocation Set true to append planner to the origin if Composer was opened from Planner
 */
const track = (trackingOrigin: TrackingOrigin, event: string, data = {}, useLocation = false) => {
  const location = useLocation && window.location.href.split('/').slice(-1)[0]
  const origin = `${trackingOrigin}${location === 'planner' ? '.planner' : ''}`
  const sessionId = getSessionId()
  if (sessionId) {
    data = {
      ...data,
      sessionId,
    }
  }
  const crossProductSessionId = getCrossProductSessionId()
  if (crossProductSessionId) {
    data = {
      ...data,
      crossProductSessionId,
    }
  }
  if (_.isEmpty(data)) {
    libTrack(origin, event)
  } else {
    libTrack(origin, event, data)
  }
}

export { generateSessionId, getSessionId, setCrossProductSessionId, track, getTrackingActionsByMessageType }
