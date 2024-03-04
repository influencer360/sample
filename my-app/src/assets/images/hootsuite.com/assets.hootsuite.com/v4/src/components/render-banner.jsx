/** @preventMunge */
'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import translation from 'utils/translation';
import hootbus from 'utils/hootbus';
import trackerDatalab from 'utils/tracker-datalab';
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise';
import { Banner, TYPE_INFO } from 'fe-comp-banner';

export default (parent) => {
    var onClose = () => {
        ReactDOM.unmountComponentAtNode(parent);
        hootbus.emit('fixedHeader:resizeHeader');
        ajaxPromise({
            url: '/ajax/member/popup-seen',
            data: 'n=' + hs.memberExtras.dashboardNotificationBannerPopupSeenHash + '&a=click',
            type: 'POST'
        }, 'qm');

        hs.memberExtras.hasSeenDashboardNotificationBanner = true;
        trackerDatalab.trackCustom('web.dashboard.' + hs.memberExtras.dashboardNotificationBannerName, hs.memberExtras.dashboardNotificationBannerName + '_dismissed');
    };

    var bannerContent = null;

    if (!hs.memberExtras.hasSeenDashboardNotificationBanner) {
        var dashboardState = hs.memberExtras.dashboardNotificationState;
        if (!dashboardState || (dashboardState && dashboardState == hs.dashboardState)) {
            bannerContent = (
                <Banner titleText={translation._(hs.memberExtras.dashboardNotificationBannerTitle || '')}
                        type={hs.memberExtras.dashboardNotificationBannerType || TYPE_INFO}
                        closeAction={onClose}>
                    <div>{translation._(hs.memberExtras.dashboardNotificationBannerMessage || '')}
                        <a
                            href={hs.memberExtras.dashboardNotificationBannerLinkUrl || ''}
                            target={hs.memberExtras.dashboardNotificationBannerLinkTarget || '_blank'}
                            data-tracking-origin={'web.dashboard.' + hs.memberExtras.dashboardNotificationBannerName}
                            data-tracking-action={hs.memberExtras.dashboardNotificationBannerName + '_link_actioned'}
                        >
                            {hs.memberExtras.dashboardNotificationBannerLinkText || ''}
                        </a>
                    </div>
                </Banner>
            );
        }
    }

    if (bannerContent) {
        trackerDatalab.trackCustom('web.dashboard.' + hs.memberExtras.dashboardNotificationBannerName, hs.memberExtras.dashboardNotificationBannerName + '_seen');
        ReactDOM.render(bannerContent, parent);
    }
};
