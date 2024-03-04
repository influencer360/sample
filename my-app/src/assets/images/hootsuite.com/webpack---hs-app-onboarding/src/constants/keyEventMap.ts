import { emit } from 'fe-lib-hootbus';
import { track } from 'fe-lib-tracking';
import { KeyEventSet } from 'typings/keyEventMap';
import {
  TRACKING_EVENT_KEYBOARD_SHORTCUTS_ACTIVATES_SHORTCUT,
  TRACKING_ORIGIN_KEYBOARD_SHORTCUTS,
} from '../constants/tracking';
import { ComposerStates, DashboardStates } from '../hooks/useDashboardState';

const trackShortcut = (eventName: string, source?: string) => {
  track(TRACKING_ORIGIN_KEYBOARD_SHORTCUTS, TRACKING_EVENT_KEYBOARD_SHORTCUTS_ACTIVATES_SHORTCUT, {
    source: source,
    event: eventName,
  });
};

const closeAndHideModals = () => {
  emit('keyboard:shortcut:composer:hide');

  const addSNAccountModalContainer = document.querySelector('#add_social_account_modal_container');
  const dialogCloseButton = document.querySelector<HTMLButtonElement>('.vk-DialogCloseButton');
  addSNAccountModalContainer && dialogCloseButton?.click();
};

export const getGlobalShortcuts = (source: string): KeyEventSet => ({
  name: 'Jump To',
  priority: 1,
  keyEvents: [
    {
      id: 'composer',
      name: 'Composer',
      keywords: 'Composer, Write, Schedule, Post',
      perform: () => {
        closeAndHideModals();
        emit('composer.open', {});
        trackShortcut('composer_open', source);
      },
    },
    {
      id: 'planner',
      name: 'Planner',
      keywords: 'email',
      perform: () => {
        closeAndHideModals();
        window.location.hash = '#/planner';
        trackShortcut('jump_to_planner', source);
      },
    },
    {
      id: 'homepage',
      name: 'Homepage',
      keywords: 'home, dashboard',
      perform: () => {
        closeAndHideModals();
        window.location.hash = '#/home';
        trackShortcut('jump_to_homepage', source);
      },
    },
    {
      id: 'analytics',
      name: 'Analytics',
      keywords: 'analytics, reports, metrics, data, dashboard',
      perform: () => {
        closeAndHideModals();
        window.location.hash = '#/analytics';
        trackShortcut('jump_to_analytics', source);
      },
    },
    {
      id: 'addSocialNetwork',
      name: 'Add a social account',
      keywords: 'Add, Social, Profile, New',
      perform: () => {
        closeAndHideModals();
        emit('socialNetwork:addNetwork:modal');
        trackShortcut('open_addNetwork_modal', source);
      },
    },
  ],
});

const getComposerShortcuts = (source: string): KeyEventSet => ({
  name: 'Composer Shortcuts',
  canAccessName: 'canAccessComposer',
  keyEvents: [
    {
      id: 'toggleCanva',
      name: 'Toggle Canva library',
      keyCombo: 'Modifier+Shift+c',
      perform: () => {
        emit('keyboard:shortcut:composer:toggle:canva');
        trackShortcut('composer_toggle_canva', source);
      },
      keywords: 'canva',
      shortcut: ['⌘⇧C'],
    },
    {
      id: 'toggleMediaLibrary',
      name: 'Toggle media library',
      keyCombo: 'Modifier+Shift+l',
      perform: () => {
        emit('keyboard:shortcut:composer:toggle:mediaLibrary');
        trackShortcut('composer_toggle_mediaLibrary', source);
      },
      keywords: 'media library, images, giphy, gifs, jpgs',
      shortcut: ['⌘⇧L'],
    },
    {
      id: 'toggleEmoji',
      name: 'Toggle emoji picker',
      keyCombo: 'Modifier+;',
      perform: () => {
        emit('keyboard:shortcut:composer:toggle:emoji');
        trackShortcut('composer_toggle_emoji', source);
      },
      keywords: 'emoji, emote, smiley',
      shortcut: ['⌘;'],
    },
    {
      id: 'hashtagSuggestions',
      name: 'Toggle hashtag suggestions',
      keyCombo: 'Modifier+Shift+,',
      perform: () => {
        emit('keyboard:shortcut:composer:toggle:hashtag:suggestions');
        trackShortcut('composer_toggle_hashtag_suggestions', source);
      },
      keywords: 'hashtags, tags, suggested, suggestions',
      shortcut: ['⌘⇧,'],
    },
    {
      id: 'prevNetworkTab',
      name: 'Previous network tab',
      keyCombo: 'Modifier+Shift+arrowleft',
      perform: () => {
        emit('keyboard:shortcut:composer:switch:network', { direction: 'left' });
        trackShortcut('composer_switch_network_left', source);
      },
      keywords: 'tab, left, switch, previous, network',
      shortcut: ['⌘⇧←'],
    },
    {
      id: 'nextNetworkTab',
      name: 'Next network tab',
      keyCombo: 'Modifier+Shift+arrowright',
      perform: () => {
        emit('keyboard:shortcut:composer:switch:network', { direction: 'right' });
        trackShortcut('composer_switch_network_right', source);
      },
      keywords: 'tab, right, switch, next, network',
      shortcut: ['⌘⇧→'],
    },
    {
      id: 'postNow',
      name: 'Post now',
      keyCombo: 'Modifier+Shift+p',
      perform: () => {
        emit('keyboard:shortcut:composer:postNow');
        trackShortcut('composer_postNow', source);
      },
      keywords: 'post, live',
      shortcut: ['⌘⇧P'],
    },
    {
      id: 'schedulePost',
      name: 'Schedule post',
      keyCombo: 'Modifier+Shift+s',
      perform: () => {
        emit('keyboard:shortcut:composer:schedulePost');
        trackShortcut('composer_schedulePost', source);
      },
      keywords: 'schedule, post',
      shortcut: ['⌘⇧S'],
    },
    {
      id: 'scheduleReuse',
      name: 'Schedule and reuse',
      keyCombo: 'Modifier+Shift+g',
      perform: () => {
        emit('keyboard:shortcut:composer:schedulePost:reuse');
        trackShortcut('composer_schedulePost_reuse', source);
      },
      keywords: 'reuse, schedule',
      shortcut: ['⌘⇧G'],
    },
    {
      id: 'saveDraft',
      name: 'Save draft',
      keyCombo: 'Modifier+Shift+d',
      perform: () => {
        emit('keyboard:shortcut:composer:save:draft');
        trackShortcut('composer_save_draft', source);
      },
      keywords: 'save, drafts',
      shortcut: ['⌘⇧D'],
    },
    {
      id: 'minimize',
      name: 'Minimize Composer',
      keyCombo: 'Modifier+Shift+m',
      perform: () => {
        emit('keyboard:shortcut:composer:hide');
        trackShortcut('composer_hide', source);
      },
      keywords: 'minimize, hide',
      shortcut: ['⌘⇧M'],
    },
  ],
});

const getMinimizedComposerShortcuts = (source: string): KeyEventSet => ({
  name: 'Composer Shortcuts',
  canAccessName: 'canAccessComposer',
  keyEvents: [
    {
      id: 'maximize',
      name: 'Maximize Composer',
      keyCombo: 'Modifier+Shift+m',
      perform: () => {
        emit('keyboard:shortcut:composer:show');
        trackShortcut('composer_show', source);
      },
      keywords: 'maximize, show',
      shortcut: ['⌘⇧M'],
    },
  ],
});

const getPlannerShortcuts = (): KeyEventSet => ({
  name: 'Planner Shortcuts',
  canAccessName: 'canAccessPlanner',
  keyEvents: [],
});

const getDashboardStateToKeyEventSet = () => ({
  [DashboardStates.PLANNER]: getPlannerShortcuts(),
});

export const getContextualShortcuts = (
  composerState: string,
  dashboardState: string,
  source: string,
): KeyEventSet[] => {
  if (composerState === ComposerStates.OPEN) {
    return [getComposerShortcuts(source)];
  }

  const contextualShortcuts = [];
  if (composerState === ComposerStates.MINIMIZED) {
    contextualShortcuts.push(getMinimizedComposerShortcuts(source));
  }

  if (getDashboardStateToKeyEventSet()[dashboardState]) {
    contextualShortcuts.push(getDashboardStateToKeyEventSet()[dashboardState]);
  }

  return contextualShortcuts;
};
