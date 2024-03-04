/**
 * Eventual replacement as the main entrypoint for the desktop dashboard application
 */
import coreSnInit from 'core/social-network/init';
import SocialNetworkApp from 'apps/social-network/app';
import OverlayMgrApp from 'apps/overlay-manager/app';
import OverlayTriggerApp from 'apps/overlay-trigger/app';

export default {
    init: function () {
        coreSnInit.init();
        new SocialNetworkApp();
        new OverlayMgrApp();
        new OverlayTriggerApp();
    }
};

