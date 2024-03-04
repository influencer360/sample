import React from 'react';
import { createRoot } from 'react-dom/client';
import { register } from 'fe-lib-async-app';
import { createBoundProvider } from 'fe-lib-optimizely';
import App from 'App';

const OptimizelyProvider = createBoundProvider();

const root = (node: Element) => createRoot(node);

register('hs-app-home-page', {
  mount(node: Element, props: Record<string, unknown>) {
    root(node).render(
      <OptimizelyProvider>
        <App {...props} />
      </OptimizelyProvider>,
    );
  },

  unmount(node: Element) {
    root(node).unmount();
  },
});
