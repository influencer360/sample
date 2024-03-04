import { getApp } from 'fe-lib-async-app';
import trackerDatalab from 'utils/tracker-datalab';
import hootbus from 'utils/hootbus';
import 'utils/tracker-google-analytics';
import _ from 'underscore';
import React from 'react';
import ReactDOM from 'react-dom';
import Throbber from 'hs-nest/lib/components/shared/throbbing-loader';

const accountManagement = {
    basename: '',

    setup: function (basename) {
        accountManagement.basename = basename;
        accountManagement.parentNode = document.createElement('div');
        hootbus.on('address:path:change', accountManagement.unmountAppIfPathChanged);
    },

    cleanup: function () {
        delete accountManagement.parentNode;
        accountManagement.basename = '';
        hootbus.off('address:path:change', accountManagement.unmountAppIfPathChanged);
    },

    renderLoading: function () {
        var loadingContainer = document.createElement('div');
        loadingContainer.style.margin = '100px auto';
        loadingContainer.style.textAlign = 'center';
        ReactDOM.render(React.createElement(Throbber), loadingContainer);
        hootbus.emit('toggleCoreViews:secondary', {content: loadingContainer});
    },

    loadSection: function (basename) {

        if (hs.dashboardState === 'accountmanagement') {
            return;
        }
        hs.dashboardState = 'accountmanagement';

        accountManagement.renderLoading();
        accountManagement.renderAccountManagementApp(basename, null);
    },

    renderAccountManagementApp: function (basename, container) {
        getApp('hs-app-account-management').then(function (hsAppAccountManagement) {
            if (basename) {
                // Only do setup if rendering inside of dashboard, basename implies rendering inside dashboard
                accountManagement.setup(basename);
            }

            var parent = container || accountManagement.parentNode;
            var props = _.pick(window.hs, 'facadeApiUrl', 'memberPlan', 'memberMaxPlanCode', 'memberId', 'memberName', 'memberEmail');

            let winbackProps;
            try {
                winbackProps = JSON.parse(parent.getAttribute('billingPageJsonPayload'));
            } catch (e) {
                winbackProps = null; // linter doesn't like empty blocks
            }

            _.extend(props, {
                basename: accountManagement.basename,
                hootbus: hootbus,
                trackEvent: trackerDatalab.trackCustom,
                dataLayerTrack: hs.dataLayerTrack,
                isMemberInExpired: hs.inExpired,
                isMemberInTrial: hs.inTrial,
                winbackProps
            });

            hsAppAccountManagement.renderAccountManagementApp(parent, props);

            if (basename) {
                hootbus.emit('toggleCoreViews:secondary', {content: accountManagement.parentNode});
            }
        });
    },

    unmountAppIfPathChanged: function (path) {
        if (accountManagement.basename === '' || typeof accountManagement.parentNode === 'undefined') {
            return;
        }

        // Un-mount account-management component when moving to a different tab.
        var regex = new RegExp('^' + accountManagement.basename);
        if (!regex.test(path)) {
            getApp('hs-app-account-management').then(function (hsAppAccountManagement) {
                hsAppAccountManagement.unmountComponentAtNode(accountManagement.parentNode);
                accountManagement.cleanup();
            });
        }
    }
};

export default accountManagement;
