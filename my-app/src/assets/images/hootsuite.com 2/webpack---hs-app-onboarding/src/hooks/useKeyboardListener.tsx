import { useEffect } from 'react';
import { VisualState, useKBar } from 'kbar';
import { KeyEventMap, KeyEventSet } from 'typings/keyEventMap';
import * as Shortcuts from '../constants/keyEventMap';
import { useDashboardState } from './useDashboardState';

const getKeyCombination = (event: KeyboardEvent): string => {
  const keys = [];

  if (event.metaKey || event.ctrlKey) {
    keys.push('Modifier'); // Add 'Modifier' if either metaKey or ctrlKey is used
  }
  if (event.shiftKey) {
    keys.push('Shift');
  }
  if (event.altKey) {
    keys.push('Alt');
  }

  // Add event.key if it's not a modifier key
  if (event.key && event.key !== 'Meta' && event.key !== 'Control' && event.key !== 'Shift' && event.key !== 'Alt') {
    keys.push(event.key.toLowerCase());
  }

  return keys.join('+');
};

export const useKeyboardListener = () => {
  const { dashboardState, composerState } = useDashboardState();
  const { query } = useKBar();

  useEffect(() => {
    const contextualShortcuts = Shortcuts.getContextualShortcuts(composerState, dashboardState, 'keyboard-listener');

    const hasPermission = (keyEventSet: KeyEventSet, keyEvent: KeyEventMap): boolean => {
      if (keyEvent.canAccessName) {
        return window.hs?.entryPoints[keyEvent.canAccessName];
      }
      if (keyEventSet.canAccessName) {
        return window.hs?.entryPoints[keyEventSet.canAccessName];
      }
      return true;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const combination = getKeyCombination(event);

      contextualShortcuts.forEach(keyEventSet => {
        keyEventSet.keyEvents.forEach(keyEvent => {
          if (keyEvent.keyCombo === combination && hasPermission(keyEventSet, keyEvent)) {
            event.stopPropagation();
            event.preventDefault();
            query?.setVisualState(VisualState.hidden);
            keyEvent.perform();
          }
        });
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dashboardState, composerState, query]);
};
