import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import walkthroughUtils from 'utils/walkthrough';
import { types } from 'hs-nest/lib/constants/social-networks';

var selectors = {
    SOCIAL_NETWORK_PICKER: '.vk-SocialNetworkPicker',
    SOCIAL_NETWORK_PICKER_INPUT: '.vk-SocialNetworkPicker .vk-PillsInputWrapper',
    SOCIAL_NETWORK_PICKER_LIST_ITEM: '.vk-ProfileListItemOuterWrapper',
    SOCIAL_NETWORK_PICKER_DROPDOWN: '.vk-DropDownDrawerWrapper'
};

var DISABLED_SOCIAL_NETWORK_TYPES = [types.FACEBOOK]

var hasPostableSocialNetworks = function () {
    var postableSocialNetworks = Object.keys(hs.socialNetworks).filter(function (snId) {
        var sn = hs.socialNetworks[snId];
        var canPost = sn && sn.permissions.SN_POST;
        var canPostWithApproval = sn && sn.permissions.SN_POST_WITH_APPROVAL;
        var isEnabled = sn && sn.type && DISABLED_SOCIAL_NETWORK_TYPES.indexOf(sn.type) === -1

        return isEnabled && (canPost || canPostWithApproval);
    });

    return postableSocialNetworks.length > 0;
};

var getTitle = function () {
    if (hasPostableSocialNetworks()) {
        return translation._('Select social networks');
    } else {
        return translation._('Add social networks');
    }
};

var getDescription = function () {
    if (hasPostableSocialNetworks()) {
        return translation._('Select one or more social network accounts to publish to. Publishing to multiple accounts increases your reach. We’ve selected some to get you started.');
    } else {
        return translation._('Add one or more social network accounts to publish to. Publishing to multiple accounts increases your reach.');
    }
};

var onEnter = function () {
    setTimeout(function () {
        walkthroughUtils.selectTwoSocialProfiles();
    }, 0);
};

var onExit = function () {
    hootbus.emit('composer:onboarding:walkthrough:close');
};

export default {
    target: selectors.SOCIAL_NETWORK_PICKER,
    title: getTitle,
    description: getDescription,
    placement: 'right-start',
    hidePrev: true,
    onEnter: onEnter,
    onExit: onExit,
    offset: '0, 16px',
    spotlightPadding: 8,
    spotlightPaddingTop: -22,
    spotlightPaddingBottom: 10,
    spotlightBorderRadius: 0,
    spotlightTargets: [
        {
            target: selectors.SOCIAL_NETWORK_PICKER_DROPDOWN
        }
    ],
    trackingName: 'step_1_social_networks'
};
