import React from 'react';
import ReactDOM from 'react-dom';
import translation from 'utils/translation';
import hootbus from 'utils/hootbus';
import snActions from 'apps/social-network/actions';
import {Banner, TYPE_WARNING} from 'fe-comp-banner';
import trackerDataLab from "../../utils/tracker-datalab";

const ONE_DAY_IN_MS = 86400000;

let isFirstRender = true;

export default (parent, expiredProfiles) => {

    const trackingEventData = {
        totalNumberOfProfiles: expiredProfiles.length,
        profilesWithPermission: expiredProfiles.filter(sn => !!sn.permissionToReauth).length,
        profilesSoonToExpire: expiredProfiles.filter(sn => !!sn.daysToExpiry).length
    }

    const onClose = () => {
        // snooze the banner for 1 day
        document.cookie = 'hideSocialNetworkExpirationModal=1;expires=' + new Date(Date.now() + ONE_DAY_IN_MS).toUTCString();
        trackerDataLab.trackCustom('web.dashboard.expiration_banner', 'modal_close', trackingEventData);
        ReactDOM.unmountComponentAtNode(parent);
        hootbus.emit('fixedHeader:resizeHeader');
    };

    const showModal = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        trackerDataLab.trackCustom('web.dashboard.expiration_banner', 'clicked_show_reauth_modal', trackingEventData);
        snActions.showSocialNetworkExpirationModal();
        ReactDOM.unmountComponentAtNode(parent);
        hootbus.emit('fixedHeader:resizeHeader');
    };

    const getBannerTitle = (impactedPostsCount) => {
        let bannerTitle = 'Reconnection Required'

        if (impactedPostsCount) {
            const postImpact = impactedPostsCount === 1 ? `1 scheduled post` : `${impactedPostsCount} scheduled posts`;
            if (expiredProfiles.length === 1) {
                bannerTitle += `: Impacts ${postImpact} across 1 account`
            } else {
                bannerTitle += `: Impacts ${postImpact} across ${expiredProfiles.length} accounts`
            }
        }
        return bannerTitle;
    }

    const getImpactedPosts = (expiredProfiles) => {
        let scheduledPostCount = 0;

        expiredProfiles.forEach(profile => {
            scheduledPostCount += Object.prototype.hasOwnProperty.call(profile, "scheduledMessages") ? profile['scheduledMessages'] : 0
        })
        return scheduledPostCount;
    }

    const bannerTitle = getBannerTitle(getImpactedPosts(expiredProfiles))


    const bannerContent =
        <Banner titleText={translation._(bannerTitle)} type={TYPE_WARNING} closeAction={onClose}>
            <div>
                {translation._("Some of your accounts are no longer publishing or collecting data, or may stop in the near future.")}&nbsp;
                <a onClick={showModal}>{translation._('Click to reconnect your social accounts')}</a>
            </div>
        </Banner>;

    if (isFirstRender) {
        trackerDataLab.trackCustom('web.dashboard.expiration_banner', 'banner_load', trackingEventData);
        isFirstRender = false
    }
    ReactDOM.render(bannerContent, parent);
};
