/** @preventMunge */
'use strict';

import _ from 'underscore';

import getHsAppTagManager from 'tagmanager/get-hs-app-tagmanager';
import { publisherFlux } from 'publisher/flux/store';
import { PRESETS, LINK_SHORTENERS, CAMPAIGNS } from 'publisher/flux/actions';
import trackerDatalab from 'utils/tracker-datalab';

// logging
import { logError } from 'fe-lib-logging';
import LOGGING_CATEGORIES from 'publisher/logging-categories';

// callouts
import { add as addCallout } from 'fe-lib-async-callouts'
import { CALLOUTS } from 'fe-comp-callout'
import { TYPE_ERROR } from 'fe-comp-banner'

// hs-nest components
import AbortionError from 'hs-nest/lib/error/abortion-error';
import domUtils from 'hs-nest/lib/utils/dom-utils';
import translation from 'hs-nest/lib/utils/translation';

import getHsAppPublisher from 'components/publisher/get-hs-app-publisher';
import { renderLoadingModal, closeLoadingModal } from './modals/loading-modal';

const CAMPAIGN_MOUNT_POINT = 'createCampaignMountPoint'

const renderAppCampaigns = (organizationId, orgName, view, canManageTags = false) => {
    let parentNode = document.querySelector(`#${CAMPAIGN_MOUNT_POINT}`);
    if (parentNode === null) {
        parentNode = document.createElement('div');
        parentNode.id = CAMPAIGN_MOUNT_POINT;
        parentNode.style.position = 'absolute';
        parentNode.style.top = '0';
        document.body.appendChild(parentNode);
    }

    getHsAppPublisher().then(async ({ renderAppCampaigns, LinkSettingsUtils, LinkShortenersService, TagService, PresetsService, CampaignsService, CampaignUtils }) => {

        const fetchPresets = async (orgId) => {
            const presetsService = new PresetsService(hs.facadeApiUrl);

            let presets;
            try {
                const presetsData = await presetsService.getPresets(orgId);
                presets = presetsData.presets;
                const modifiedPresets = _.map(presets, preset => {
                    return LinkSettingsUtils.convertLinkSettingsToFrontendFriendlyValues(preset);
                });
                publisherFlux.getActions(PRESETS).setPresets(modifiedPresets);
            } catch (e) {
                if (!AbortionError.isAbortionError(e)) {
                    addCallout({
                        calloutType: CALLOUTS.TOAST.NAME,
                        type: TYPE_ERROR,
                        messageText: translation._('Unable to retrieve link setting presets'),
                    });
                    logError(
                        LOGGING_CATEGORIES.CAMPAIGNS,
                        'Campaigns failed during fetchPresets',
                        {
                            errorMessage: JSON.stringify(e.message),
                            stack: JSON.stringify(e.stack),
                            orgId: organizationId,
                            view: view
                        },
                    )
                }
            }

            return presets;
        };

        const fetchLinkShorteners = async (orgId) => {
            const linkShortenersService = new LinkShortenersService(hs.facadeApiUrl);
            // Fetch link shorteners
            let shorteners;
            try {
                shorteners = await linkShortenersService.getLinkShorteners(orgId);
                if (shorteners) {
                    publisherFlux.getActions(LINK_SHORTENERS).setShorteners(shorteners);
                }
            } catch (e) {
                if (!AbortionError.isAbortionError(e)) {
                    addCallout({
                        calloutType: CALLOUTS.TOAST.NAME,
                        type: TYPE_ERROR,
                        messageText: translation._('Unable to retrieve link shorteners'),
                    });
                    logError(
                        LOGGING_CATEGORIES.CAMPAIGNS,
                        'Campaigns failed during fetchLinkShorteners',
                        {
                            errorMessage: JSON.stringify(e.message),
                            stack: JSON.stringify(e.stack),
                            orgId: organizationId,
                            view: view
                        },
                    )
                }
            }

            return shorteners;
        };

        const fetchLinkShortenerConfigs = async (orgId) => {
            const linkShortenersService = new LinkShortenersService(hs.facadeApiUrl);
            let shortenerConfigs;
            try {
                shortenerConfigs = await linkShortenersService.getShortenerConfigs(orgId);
                if (shortenerConfigs) {
                    publisherFlux.getActions(LINK_SHORTENERS).setShortenerConfigs(shortenerConfigs);
                }
            } catch (e) {
                if (!AbortionError.isAbortionError(e)) {
                    addCallout({
                        calloutType: CALLOUTS.TOAST.NAME,
                        type: TYPE_ERROR,
                        messageText: translation._('Unable to retrieve link shortener configs'),
                    });
                    logError(
                        LOGGING_CATEGORIES.CAMPAIGNS,
                        'Campaigns failed during fetchLinkShortenerConfigs',
                        {
                            errorMessage: JSON.stringify(e.message),
                            stack: JSON.stringify(e.stack),
                            orgId: organizationId,
                            view: view
                        },
                    )
                }
            }

            return shortenerConfigs
        };

         const fetchTags = async (orgId) => {
            const tagService = new TagService(hs.facadeApiUrl, hs.memberId);
            const { flux, fluxActions } = await getHsAppTagManager();

            let tags
            let suggestedTags
            try {
                [tags, suggestedTags] = await Promise.all([
                    tagService.getTagsByOrganizationId(orgId),
                    tagService.getSuggestedTagsByOrganizationId(orgId),
                ]);

                if (tags && Array.isArray(tags)) {
                    flux.getActions(fluxActions.TAGS).setTags(tags);
                }

                if (suggestedTags && suggestedTags.recentTags && Array.isArray(suggestedTags.recentTags)) {
                    flux.getActions(fluxActions.TAGS).setSuggestedTags(suggestedTags.recentTags);
                }
            } catch (e) {
                if (!AbortionError.isAbortionError(e)) {
                    addCallout({
                        calloutType: CALLOUTS.TOAST.NAME,
                        type: TYPE_ERROR,
                        messageText: translation._('Unable to retrieve tags and suggested tags'),
                    });
                    logError(
                        LOGGING_CATEGORIES.CAMPAIGNS,
                        'Campaigns failed during fetchTags',
                        {
                            errorMessage: JSON.stringify(e.message),
                            stack: JSON.stringify(e.stack),
                            orgId: organizationId,
                            view: view
                        },
                    )
                }
            }

            return { tags, suggestedTags };
        };

        const fetchCampaigns = async (orgId) => {
            const campaignsService = new CampaignsService(hs.facadeApiUrl);

            let campaignsData;
            try {
                campaignsData = await campaignsService.getCampaignsByOrganizationId(orgId);
            } catch (e) {
                if (!AbortionError.isAbortionError(e)) {
                    addCallout({
                        calloutType: CALLOUTS.TOAST.NAME,
                        type: TYPE_ERROR,
                        messageText: translation._('Unable to retrieve campaigns'),
                    });
                    logError(
                        LOGGING_CATEGORIES.CAMPAIGNS,
                        'Campaigns failed during fetchCampaigns',
                        {
                            errorMessage: JSON.stringify(e.message),
                            stack: JSON.stringify(e.stack),
                            orgId: organizationId,
                            view: view
                        },
                    )
                }
            }

            return campaignsData;
        };

        try {
            renderLoadingModal();
            const promiseData = await Promise.all([
                fetchCampaigns(organizationId),
                fetchPresets(organizationId),
                fetchTags(organizationId),
                fetchLinkShorteners(organizationId),
                fetchLinkShortenerConfigs(organizationId),
            ]);
            const campaignsData = promiseData[0];
            const presets = promiseData[1];
            const tagsData = promiseData[2];
            if (campaignsData && campaignsData.campaigns && Array.isArray(campaignsData.campaigns)) {
                const newCampaigns = campaignsData.campaigns.map(campaign =>
                    CampaignUtils.createCampaignResponseToCampaign(campaign, {
                        presets,
                        tags: tagsData.tags,
                    }),
                );
                publisherFlux.getActions(CAMPAIGNS).setCampaigns(newCampaigns)
            }
            closeLoadingModal();

            const props = {
                canManageTags: canManageTags,
                facadeApiUrl: hs.facadeApiUrl ? hs.facadeApiUrl : '',
                flux: publisherFlux,
                initialView: view,
                isLoading: false,
                organizationId: organizationId,
                organizationName: orgName,
                timezoneName: hs.timezoneName.replace(/ /g, '_'),
                trackerDatalab: trackerDatalab,
                zIndex: domUtils.provisionIndex(),
            };
            renderAppCampaigns(props, parentNode, CAMPAIGN_MOUNT_POINT);
        } catch (e) {
            if (!AbortionError.isAbortionError(e)) {
                addCallout({
                    calloutType: CALLOUTS.TOAST.NAME,
                    type: TYPE_ERROR,
                    messageText: translation._('An unexpected error occurred, please refresh and try again.'),
                });
                logError(
                    LOGGING_CATEGORIES.CAMPAIGNS,
                    'Campaigns failed to render',
                    {
                        errorMessage: JSON.stringify(e.message),
                        stack: JSON.stringify(e.stack),
                        orgId: organizationId,
                        view: view
                    },
                )
            }
        }
    });
};

export default renderAppCampaigns;
