import hsEjs from 'utils/hs_ejs';
import 'dashboard';
import 'utils/util';

export const bootFunctions = {
    indexDashboard: function () {
        dashboard.init();

        // preload ejs templates as soon as possible
        hsEjs.loadPackage();

        // need to set a flag to let
        // dashboard.postDashboardLoad() know that a popup has been shown before
        dashboard.hasShownPopup = (
            hs.ba.showUpgradeScreen ||
            hs.ba.isShowAddStreamHelperTooltip
        );
    }
};
