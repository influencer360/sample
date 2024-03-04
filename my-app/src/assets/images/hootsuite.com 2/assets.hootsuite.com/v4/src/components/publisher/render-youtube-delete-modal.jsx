/** @preventMunge */
'use strict';

import getHsAppPublisher from 'components/publisher/get-hs-app-publisher';
import translation from 'utils/translation';

import { CUSTOM_APPROVALS } from 'fe-lib-entitlements';
import { hasEntitlement } from 'fe-pnc-data-entitlements';

const YOUTUBE_DELETE_MODAL_ID = 'youTubeDeleteModal'

const renderParentNode = () => {
    let parentNode = document.getElementById(YOUTUBE_DELETE_MODAL_ID);

    if (!parentNode) {
        parentNode = document.createElement('div');
        parentNode.id = YOUTUBE_DELETE_MODAL_ID;
        $('body').append(parentNode);
    }

    return parentNode;
};

const renderYouTubeDeleteModal = async (messageIds, videoId, socialProfileId, scheduledTimestamp, deletionType, numVideos, onDeleteSuccess) => {
    const hasCustomApprovals = await hasEntitlement(hs.memberId, CUSTOM_APPROVALS)

    if (messageIds.length === 1) {
        ajaxCall({
            url: '/ajax/authoring/get-youtube-post',
            data: {
                youtubeVideoId: videoId,
                youtubeProfileId: socialProfileId
            },
            type: 'GET',
            beforeSend: () => {
                hs.statusObj.update(translation.c.LOADING, 'info');
            },
            success: async (data) => {
                hs.statusObj.reset();

                if (!data.success) {
                    hs.statusObj.update(translation._(data.error ? data.error : 'Failed to retrieve post data'), 'error');
                    return;
                }

                const parentNode = renderParentNode();

                const props = {
                    deletionType: deletionType,
                    isLoading: false,
                    numVideos: numVideos,
                    onDeleteSuccess: onDeleteSuccess,
                    scheduledDateTime: scheduledTimestamp,
                    videoData: data.youtubePost
                }
                if (hasCustomApprovals) {
                    props.msgIdsAndSeqNums = messageIds;
                } else {
                    props.messageIds = messageIds;
                }
                getHsAppPublisher().then(({ renderYouTubeDeleteModal }) => {
                    renderYouTubeDeleteModal(props, parentNode, YOUTUBE_DELETE_MODAL_ID)
                });
            },
            error: () => {
                hs.statusObj.update(translation._('Failed to retrieve post data'), 'warning', true);
            },
            abort: () => {
                hs.statusObj.reset();
            }
        }, 'qm');
    } else {
        const parentNode = renderParentNode();
        const props = {
            deletionType: deletionType,
            isLoading: false,
            numVideos: numVideos,
            onDeleteSuccess: onDeleteSuccess,
        }
        if (hasCustomApprovals) {
            props.msgIdsAndSeqNums = messageIds;
        } else {
            props.messageIds = messageIds;
        }
        getHsAppPublisher().then(({ renderYouTubeDeleteModal }) => {
            renderYouTubeDeleteModal(props, parentNode, YOUTUBE_DELETE_MODAL_ID)
        });
    }

};

export default renderYouTubeDeleteModal;
