import { handleEmoji, handleSwitchNetwork } from '@/keyboard-shortcuts/handlers'

export const eventsMapping = {
  'keyboard:shortcut:composer:switch:network': handleSwitchNetwork,
  'keyboard:shortcut:composer:toggle:emoji': handleEmoji,
}
