import { on, off } from 'fe-lib-hootbus'
import { eventsMapping } from '@/keyboard-shortcuts/events'

export const setupKeyboardShortcuts = () => {
  for (const [evt, handler] of Object.entries(eventsMapping)) {
    on(evt, handler)
  }
}

export const cleanupKeyboardShortcuts = () => {
  for (const [evt, handler] of Object.entries(eventsMapping)) {
    off(evt, handler)
  }
}
