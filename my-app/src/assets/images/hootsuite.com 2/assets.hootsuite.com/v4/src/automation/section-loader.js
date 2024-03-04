import hootbus from 'utils/hootbus';

import getHsAppAutomation from './get-hs-app-automation';
import flux from 'hs-nest/lib/stores/flux';

export default {
    loadSection: function (organizationId) {
        if (hs.dashboardState === 'automation') {
            return;
        }

        hs.dashboardState = 'automation';

        getHsAppAutomation().then(({ mount, unmount }) => {
            // Initialize the facade API URL and bootstrap the Automation Manager section (kick off loading the
            // data from the backend)
            var node = document.createElement('div');
            var props = {
                flux,
                organizationId: organizationId,
                facadeApiUrl: hs.facadeApiUrl || '',
            };
            mount(node, props);
            hootbus.emit('toggleCoreViews:secondary', {content: node});

            // cleanup when path changes
            var cleanup = () => {
                var path = window.location.href.split('#').slice(-1)[0];
                if (!/^\/automation/.test(path)) {
                    unmount(node);
                    hootbus.off('address:path:change', cleanup)
                }
            };
            hootbus.on('address:path:change', cleanup)
        });
    }
};
