/** @preventMunge */
'use strict';

import _ from 'underscore';

import { publisherFlux } from 'publisher/flux/store';
import { PRESETS, LINK_SHORTENERS } from 'publisher/flux/actions';
import trackerDatalab from 'utils/tracker-datalab';

// hs-nest components
import AbortionError from 'hs-nest/lib/error/abortion-error';
import domUtils from 'hs-nest/lib/utils/dom-utils';
import translation from 'hs-nest/lib/utils/translation';

import getHsAppPublisher from 'components/publisher/get-hs-app-publisher';

let presetsService;
let linkShortenersService;

getHsAppPublisher().then(({PresetsService, LinkShortenersService}) => {
    presetsService = new PresetsService(hs.facadeApiUrl);
    linkShortenersService = new LinkShortenersService(hs.facadeApiUrl);
});

const RESIZE_DEBOUNCE = 15; // time between window resize events being handled

let localOrganizationId;
let localSelectedOrganization;
let localZIndex;

const LINK_SETTINGS_MANAGEMENT_AREA_MOUNT_POINT = 'linkSettingsManagementAreaMountPoint'

const onWindowResize = _.debounce(() => {
    renderLinkSettingsManagementArea(localOrganizationId, localSelectedOrganization);
}, RESIZE_DEBOUNCE);

const closeAsync = () => {
    window.removeEventListener('resize', onWindowResize);
    presetsService.abortRequests();
    linkShortenersService.abortRequests();
};

const fetchPresets = organizationId => {
    getHsAppPublisher().then(({ LinkSettingsUtils }) => {
        presetsService.getPresets(organizationId).then(data => {
            const modifiedPresets = _.map(data.presets, preset => {
                return LinkSettingsUtils.convertLinkSettingsToFrontendFriendlyValues(preset);
            });
            publisherFlux.getActions(PRESETS).setPresets(modifiedPresets);
        }).catch(e => {
            if (!AbortionError.isAbortionError(e)) {
                hs.statusObj.update(translation._('Unable to retrieve presets'), 'error', true);
            }
        });
    });
};

const fetchLinkShorteners = organizationId => {
    getHsAppPublisher().then(() => {
        // Fetch link shorteners
        linkShortenersService.getLinkShorteners(organizationId).then(shorteners => {
            publisherFlux.getActions(LINK_SHORTENERS).setShorteners(shorteners);
        }).catch(e => {
            if (!AbortionError.isAbortionError(e)) {
                hs.statusObj.update(translation._('Unable to retrieve link shorteners'), 'error', true);
            }
        });
    });
};

const fetchLinkShortenerConfigs = organizationId => {
    getHsAppPublisher().then(() => {
        // Fetch link shortener configs
        linkShortenersService.getShortenerConfigs(organizationId).then(shorteners => {
            publisherFlux.getActions(LINK_SHORTENERS).setShortenerConfigs(shorteners);
        }).catch(e => {
            if (!AbortionError.isAbortionError(e)) {
                hs.statusObj.update(translation._('Unable to retrieve link shortener configs'), 'error', true);
            }
        });
    });
};

const renderLinkSettingsManagementArea = (organizationId, selectedOrganization) => {
    localOrganizationId = organizationId;
    localSelectedOrganization = selectedOrganization;

    let parentNode = document.querySelector(`#${LINK_SETTINGS_MANAGEMENT_AREA_MOUNT_POINT}`);
    if (parentNode === null) {
        parentNode = document.createElement('div');
        parentNode.id = LINK_SETTINGS_MANAGEMENT_AREA_MOUNT_POINT;
        document.body.appendChild(parentNode);
    }

    window.removeEventListener('resize', onWindowResize);
    window.addEventListener('resize', onWindowResize);

    fetchPresets(organizationId);
    fetchLinkShorteners(organizationId);
    fetchLinkShortenerConfigs(organizationId);

    if (typeof localZIndex !== 'number') {
        localZIndex = domUtils.provisionIndex()
    }

    getHsAppPublisher().then(({ renderLinkSettingsManagementArea }) => {
        const props = {
            facadeApiUrl: hs.facadeApiUrl ? hs.facadeApiUrl : '',
            flux: publisherFlux,
            isFullscreen: true, //false will leave 44px on the left to show the HS dashboard sidebar
            onClose: closeAsync,
            rightOffset: 0,
            trackerDatalab: trackerDatalab,
            width: window.innerWidth,
            zIndex: localZIndex,
        };
        renderLinkSettingsManagementArea({
            props,
            memberId: hs.memberId,
            localSelectedOrganization,
            parentNode,
            linkSettingsManagementAreaMountPoint: LINK_SETTINGS_MANAGEMENT_AREA_MOUNT_POINT
        });
    });
};

export default renderLinkSettingsManagementArea;
