import {FACEBOOKPAGE} from 'utils/social-networks';
import {FACEBOOKGROUP} from 'utils/social-networks';
import {INSTAGRAMBUSINESS} from 'utils/social-networks';
import {TWITTER} from 'utils/social-networks';
import {LINKEDINCOMPANY} from 'utils/social-networks';
import {LINKEDIN} from 'utils/social-networks';
import {INSTAGRAM} from 'utils/social-networks';

import trackerDataLab from 'utils/tracker-datalab';

var selectors = {
    SOCIAL_NETWORK_PICKER_INPUT: '.vk-SocialNetworkPicker .vk-PillsInputWrapper',
    SOCIAL_NETWORK_PICKER_LIST_ITEM: '.vk-ProfileListItemOuterWrapper',
};

var walkthrough = {};

walkthrough.pollForElement = function (selector, callback, interval, timeout, returnAll) {
    var element = returnAll ? document.querySelectorAll(selector) : document.querySelector(selector);

    if ((returnAll && element.length > 0) || (!returnAll && element)) {
        callback(element);
    } else {
        if (timeout > 0) {
            setTimeout(function () {
                walkthrough.pollForElement(selector, callback, interval, timeout - interval, returnAll);
            }, interval);
        }
    }
};

walkthrough.openSocialNetworkPicker = function () {
    var event;
    var profileSelectorDropdown = document.querySelector(selectors.SOCIAL_NETWORK_PICKER_INPUT);

    // The social network picker doesn't respond to programmatic clicks, so
    // we trigger a mousedown event as a workaround
    try {
        event = new MouseEvent("mousedown", {
            "view": window,
            "bubbles": true,
            "cancelable": false
        });
    } catch (e) {
        // Fallback for IE
        event = document.createEvent('MouseEvent');
        event.initEvent("mousedown", true, false);
    }

    profileSelectorDropdown && profileSelectorDropdown.dispatchEvent(event);
};

walkthrough.selectTwoSocialProfiles = function () {
    walkthrough.openSocialNetworkPicker();

    walkthrough.pollForElement(selectors.SOCIAL_NETWORK_PICKER_LIST_ITEM, function (spListItems) {
        //This array defines the SNs we want to try and default to and in what order
        var snTypesToSelect  = [
            FACEBOOKPAGE,
            FACEBOOKGROUP,
            INSTAGRAMBUSINESS,
            TWITTER,
            LINKEDINCOMPANY,
            LINKEDIN,
            INSTAGRAM,
        ];

        var selectedNetworks = [];
        var visitedNetworks = [];

        // For each of the social profile types we want to try to add, in the order we want to prefer them
        snTypesToSelect.forEach(function (snType) {
            if (selectedNetworks.length < 2) {
                // Search through the social picker list items, and find profiles of the given social network type (snType),
                // where an attempt to select that type hasn't already been made.
                var spListItem = Array.from(spListItems).find(function (listItem) {
                    return (listItem.dataset["snType"] === snType && !visitedNetworks.includes(listItem));
                });

                // If true, we have found an item that we wish to default to, of a type we have not yet used.
                if (spListItem) {
                    visitedNetworks.push(spListItem);

                    var spListItemCheckbox = spListItem.querySelector('input[type=checkbox]');

                    if (spListItemCheckbox) {
                        selectedNetworks.push(spListItem);

                        if (!spListItemCheckbox.checked) {
                            spListItem.click();
                        }
                    }
                }
            }
        });

        trackerDataLab.trackCustom('web.dashboard.walkthrough.composer', 'composer_preselect_profiles', {
            profileCount: selectedNetworks.length,
            profileTypes: selectedNetworks.map(function (listItem) {
                return listItem.dataset['snType'];
            }),
        });

    }, 100, 5000, true);
}

export default walkthrough;
