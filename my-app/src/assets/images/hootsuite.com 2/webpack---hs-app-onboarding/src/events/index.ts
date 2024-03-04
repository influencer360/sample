import { on } from 'fe-lib-hootbus';
import { customEvents } from './customEvents';
import { events } from './events';

export function registerEvents() {
  events.forEach(([event, handler]) => {
    on(event, handler);
  });

  customEvents.forEach(([event, handler]) => {
    window.addEventListener(event, handler);
  });
}
