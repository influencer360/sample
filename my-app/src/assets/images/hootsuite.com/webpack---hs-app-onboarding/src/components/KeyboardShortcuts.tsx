import React from 'react';
import { useKeyboardListener } from '../hooks/useKeyboardListener';
import ShortcutsSearchBar from '../ShortcutsSearchBar';

const KeyboardShortcuts = ({ shortcutsLibraryEnabled }: { shortcutsLibraryEnabled: boolean }) => {
  useKeyboardListener();

  return shortcutsLibraryEnabled ? <ShortcutsSearchBar /> : null;
};

export default KeyboardShortcuts;
