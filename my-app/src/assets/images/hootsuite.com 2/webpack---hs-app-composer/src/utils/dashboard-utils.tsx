import { emit } from 'fe-lib-hootbus'
import { CONTENT_PLANNER_EVENTS } from '@/constants/events'

const PLANNER_HASH_URL = '#/planner'
const PLANNER_CLASS_NAME = '.rc-Planner'
const PUBLISHER_HASH_URL = '#/publisher'
const HOMEPAGE_HASH_URL = '#/home'

export const isHomepageView = () => window.location.hash.includes(HOMEPAGE_HASH_URL)

export const isPlannerView = () =>
  window.location.hash.includes(PLANNER_HASH_URL) && document.querySelector(PLANNER_CLASS_NAME)

export const isPublisherView = () => window.location.hash.includes(PUBLISHER_HASH_URL)

export const refreshContentPlannerCalendar = () => {
  if (isPlannerView()) {
    emit(CONTENT_PLANNER_EVENTS.FETCH_CONTENT)
  }
}

export const handleMessageEditInContentPlanner = messages => {
  if (isPlannerView()) {
    emit(CONTENT_PLANNER_EVENTS.CONTENT_EDITED, messages)
  }
}
