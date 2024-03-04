import hootbus from 'utils/hootbus';
import getHsAppTagmanager from './get-hs-app-tagmanager';

export default {
    loadSection: function (organizationId) {
        if (hs.dashboardState == 'tags') {
            return;
        }

        hs.dashboardState = 'tags';

        getHsAppTagmanager().then(({ mountTagPermission, unmount }) => {
            var node = document.createElement('div');
            var props = {
                id: organizationId
            };
            mountTagPermission(node, props);
            hootbus.emit('toggleCoreViews:secondary', {content: node});

            // cleanup when path changes
            var cleanup = () => {
                var path = window.location.href.split('#').slice(-1)[0];
                if (!/^\/tags/.test(path)) {
                    unmount(node);
                    hootbus.off('address:path:change', cleanup)
                }
            };
            hootbus.on('address:path:change', cleanup)
        });
    }
};
