/** @preventMunge */
'use strict';

import Immutable from 'immutable';
import SOCIAL_NETWORKS_CONSTANTS from 'hs-nest/lib/constants/social-networks';
import translation from 'hs-nest/lib/utils/translation';
import baseFlux from 'hs-nest/lib/stores/flux';
import { SOCIAL_NETWORKS } from 'hs-nest/lib/actions';

import getHsAppPublisher from 'components/publisher/get-hs-app-publisher';

import trackerDataLab from 'utils/tracker-datalab';

import teamResponse from 'team/response';

const TWITTER_NEW_STYLE_REPLIES_ID = 'twitterNewStyleReplies'

/**
 * Renders the new Twitter Replies modal
 *
 * @param {number} socialNetworkId
 * @param {string} inReplyToId
 * @param {string} retweetId
 * @param {string} inReplyToUsername
 * @param {boolean} shouldRefreshStreamsTab - whether or not to refresh the active tab in streams after sending a message
 * @param {string} boxId
 * @param {string} boxType
 */
const renderTwitterNewStyleReplies = (socialNetworkId, inReplyToId, retweetId, inReplyToUsername, shouldRefreshStreamsTab, boxId, boxType) => {
    shouldRefreshStreamsTab = shouldRefreshStreamsTab || false;
    let parentNode = document.querySelector(`#${TWITTER_NEW_STYLE_REPLIES_ID}`);
    if (parentNode === null) {
        parentNode = document.createElement('div');
        parentNode.id = TWITTER_NEW_STYLE_REPLIES_ID;
        document.body.appendChild(parentNode);
    }

    const socialNetworkPermissions = [
        SOCIAL_NETWORKS_CONSTANTS.permissions.SN_POST_WITH_APPROVAL,
        SOCIAL_NETWORKS_CONSTANTS.permissions.SN_POST
    ];
    const isTeamResponseInitiated = teamResponse.isInitiated();

    // If the socialNetworkId is not defined that means we're not replying from streams.
    // In that case we'll select a default Twitter account to reply from.
    const socialNetworks = baseFlux.getStore(SOCIAL_NETWORKS).getSocialNetworksKeyedByType(socialNetworkPermissions).TWITTER;
    if (typeof socialNetworkId === 'undefined') {
        socialNetworkId = socialNetworks[0].socialNetworkId;
    }

    // The message will not be available in the store so we need to fetch it.
    ajaxCall({
        type: 'GET',
        url: '/ajax/network/get-message',
        data: {
            messageId: inReplyToId,
            socialNetworkId
        },
        success: data => {
            if (!data.viewData) {
                return;
            }
            const message = Immutable.fromJS(data.viewData.message);

            getHsAppPublisher().then(({ renderTwitterNewStyleReplies }) => {
                const props = {
                    boxId: boxId,
                    boxType: boxType,
                    csrf: hs.csrfToken,
                    facadeApiUrl: hs.facadeApiUrl ? hs.facadeApiUrl : '',
                    flux: baseFlux,
                    inReplyToId: inReplyToId,
                    inReplyToUsername: inReplyToUsername || data.viewData.message.author.username,
                    isTeamResponse: isTeamResponseInitiated ? 1 : 0,
                    trackerDataLab: trackerDataLab,
                    teamResponseTeamId: isTeamResponseInitiated ? parseInt(teamResponse.getTeamId()) : null,
                    message: message,
                    refreshStreamsTab: shouldRefreshStreamsTab,
                    socialNetworkId: parseInt(socialNetworkId),
                    socialNetworks: socialNetworks
                };
                renderTwitterNewStyleReplies(props, parentNode, TWITTER_NEW_STYLE_REPLIES_ID)
            });
        },
        error: () => {
            hs.statusObj.update(translation._('Failed to retrieve message data'), 'error', true);
        }
    }, 'qm');
};

export default renderTwitterNewStyleReplies;
