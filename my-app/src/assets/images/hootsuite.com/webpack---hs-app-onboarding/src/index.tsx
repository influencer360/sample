import React, { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerApp } from 'fe-lib-async-app';
import { AvailableThemes, use } from 'fe-lib-theme';
import App from './App';
import { registerEvents } from './events';

const ThemeProvider: React.FC<{ children: ReactNode; theme: AvailableThemes }> = use(AvailableThemes.BRAND2022);

const TypedThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={AvailableThemes.BRAND2022}>{children}</ThemeProvider>
);

registerApp('hs-app-onboarding', {
  init() {
    registerEvents();
  },
  mount(node: Element | null, props: Record<string, unknown>) {
    const appComponent = (
      <TypedThemeProvider>
        <App {...props} />
      </TypedThemeProvider>
    );

    if (!!node && !!appComponent) {
      createRoot(node).render(appComponent);
    }
  },
  unmount(node: Element | DocumentFragment) {
    createRoot(node).unmount();
  },
});
