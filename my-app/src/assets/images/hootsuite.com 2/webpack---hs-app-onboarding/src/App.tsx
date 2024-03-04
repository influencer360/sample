import React, { useEffect, useState } from 'react';
import { KBarProvider, Action } from 'kbar';
import { on, off } from 'fe-lib-hootbus';
import { getExperimentVariation } from 'fe-lib-optimizely';
import { getActionHistoryValue } from 'fe-pg-lib-action-history';
import ComposeOptionsModal from './components/ComposeOptions/ComposeOptionsModal';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import { getGlobalShortcuts } from './constants/keyEventMap';
import GettingStartedGuide from './GettingStartedGuide';
import DarklaunchUtils from './utils/darklaunch';
import { getEntitlementsByFeatureCode } from './utils/entitlements';

const GLOBAL_SHORTCUTS = getGlobalShortcuts('kbar');

const NavigationalActionsSection = {
  name: GLOBAL_SHORTCUTS.name,
  priority: GLOBAL_SHORTCUTS.priority || 1,
};

const actions: Action[] = GLOBAL_SHORTCUTS.keyEvents.map(keyEvent => {
  const action: Action = keyEvent;
  action.section = NavigationalActionsSection;
  return action;
});

const App = (props: Record<string, unknown>) => {
  const [hasKeyboardShortcutsEntitlement, setHasKeyboardShortcutsEntitlement] = useState(false);
  const [showComposeOptions, setShowComposeOptions] = useState(false);
  useEffect(() => {
    getEntitlementsByFeatureCode(parseInt(window.hs.memberId), 'KEYBOARD_SHORTCUTS').then(response => {
      setHasKeyboardShortcutsEntitlement(!!response);
    });
  }, []);

  useEffect(() => {
    const eventName = 'dashboard:composeOptions:open';
    const triggerComposeOptions = () => setShowComposeOptions(true);
    on(eventName, triggerComposeOptions);

    return () => {
      off(eventName, triggerComposeOptions);
    };
  }, []);

  const canUseKeyboardShortcuts = !!DarklaunchUtils.isFeatureEnabled('PGR_1939_KEYBOARD_SHORTCUTS');
  const shortcutsLibraryEnabled = !!DarklaunchUtils.isFeatureEnabled('PGR_2023_SHORTCUTS_SEARCH_BAR');
  const shouldRenderGuide = !!window.hs?.entryPoints?.canAccessHomePage;
  const canSeeGSG =
    getActionHistoryValue('getting_started.can_see_getting_started_guide_v2') &&
    !(
      !!DarklaunchUtils.isFeatureEnabled('PGR_2065_HOMEPAGE_REVAMP') &&
      getExperimentVariation('grw_ss_homepage_4_0') === 'variation_1'
    );
  const canSeeComposeOptionsModal =
    !!DarklaunchUtils.isFeatureEnabled('PGR_2072_COMPOSE_OPTIONS') &&
    getExperimentVariation('grw_ss_onboarding_8_0') === 'variation_1';

  return (
    <>
      {canUseKeyboardShortcuts &&
        hasKeyboardShortcutsEntitlement &&
        (shortcutsLibraryEnabled ? (
          <KBarProvider actions={actions}>
            <KeyboardShortcuts shortcutsLibraryEnabled={shortcutsLibraryEnabled} />
          </KBarProvider>
        ) : (
          <KeyboardShortcuts shortcutsLibraryEnabled={shortcutsLibraryEnabled} />
        ))}
      {shouldRenderGuide && canSeeGSG && <GettingStartedGuide {...props} />}
      {canSeeComposeOptionsModal && showComposeOptions && (
        <ComposeOptionsModal onClose={() => setShowComposeOptions(false)} />
      )}
    </>
  );
};

export default App;
