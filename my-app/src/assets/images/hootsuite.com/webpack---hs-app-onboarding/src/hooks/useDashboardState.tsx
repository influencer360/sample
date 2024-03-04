import { useState, useEffect } from 'react';
import { on, off } from 'fe-lib-hootbus';

export const DashboardStates = {
  HOME: 'home',
  PLANNER: 'planner',
  STREAMS: 'streams',
  AMPLIFY: 'amplify',
  INBOX: 'inbox',
  ANALYTICS: 'analytics',
  INSPIRATION: 'inspiration',
  ADVERTISE: 'advertise',
  INSIGHTS: 'insights',
  MEMBER: 'organizations',
  UNKNOWN: 'unknown',
};

export const ComposerStates = {
  OPEN: 'open',
  CLOSED: 'closed',
  MINIMIZED: 'minimized',
};

export const useDashboardState = () => {
  const [dashboardState, setDashboardState] = useState('');
  const [composerState, setComposerState] = useState('');

  const onRouteChange = () => {
    const dashboardRoute = window.location.hash.split('/')[1];

    if (Object.values(DashboardStates).includes(dashboardRoute)) {
      setDashboardState(dashboardRoute);
    } else {
      setDashboardState(DashboardStates.UNKNOWN);
    }
  };

  const onComposerAction = (selectorToWaitFor: string, state: string) => {
    let counter = 0;
    const findElementInterval = setInterval(() => {
      const expectedElement = document.querySelector(selectorToWaitFor);
      counter += 1;
      if (expectedElement) {
        setComposerState(state);
        clearInterval(findElementInterval);
      } else if (counter > 100) {
        clearInterval(findElementInterval);
      }
    }, 100);
  };

  useEffect(() => {
    window.addEventListener('hashchange', onRouteChange);
    onRouteChange();

    return () => {
      window.removeEventListener('hashchange', onRouteChange);
    };
  }, []);

  useEffect(() => {
    const onComposerOpen = () => onComposerAction('.vk-ComposerModal', ComposerStates.OPEN);
    const onComposerClose = () => setComposerState(ComposerStates.CLOSED);

    on('full_screen_composer:response:open', onComposerOpen);
    on('full_screen_composer:response:close:accept', onComposerClose);

    return () => {
      off('full_screen_composer:response:open', onComposerOpen);
      off('full_screen_composer:response:close:accept', onComposerClose);
    };
  }, []);

  // TODO: Once composer minimize/maximize hootbus events exist, add them to
  // the above useEffect and remove the following eventlistener useEffect
  useEffect(() => {
    const minimizeButton = document.querySelector('.vk-MinimizeButton');
    const maximiseButton = document.querySelector('.vk-MinimizedComposerModal');
    const onClickMinimizeButton = () => onComposerAction('.vk-MinimizedComposerModal', ComposerStates.MINIMIZED);
    const onClickMaximizeButton = () => onComposerAction('.vk-ComposerModal', ComposerStates.OPEN);

    minimizeButton?.addEventListener('click', onClickMinimizeButton);
    maximiseButton?.addEventListener('click', onClickMaximizeButton);
    on('keyboard:shortcut:composer:hide', onClickMinimizeButton);
    on('keyboard:shortcut:composer:show', onClickMaximizeButton);

    return () => {
      off('keyboard:shortcut:composer:hide', onClickMinimizeButton);
      off('keyboard:shortcut:composer:show', onClickMaximizeButton);
      minimizeButton?.removeEventListener('click', onClickMinimizeButton);
      maximiseButton?.removeEventListener('click', onClickMaximizeButton);
    };
  }, [composerState]);

  return { dashboardState, composerState };
};
