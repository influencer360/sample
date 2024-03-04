/** @preventMunge */
'use strict';

import { publisherFlux } from 'publisher/flux/store';
import streamsFlux from 'hs-app-streams/lib/stores/flux';
import { MESSAGE_LIST } from 'hs-app-streams/lib/actions/types';
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise';
import hootbus from 'hs-nest/lib/utils/hootbus';
import translation from 'utils/translation';

import { HOOTBUS_EVENT_OPEN_COMPOSER } from '../../publisher/components/publisher-component-listeners';
import getHsAppPublisher from 'components/publisher/get-hs-app-publisher';
import Constants from 'components/publisher/constants';

const YOUTUBE_UPLODAD_MODAL_ID = 'youtubeUploadModal'

const shareVideoToComposeBox = text => {
    hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, { messageText: text });
};

const renderYoutubeUpload = (channelData, hasSeenPublishWarning, warningModalName, isEdit, postData, onEdit, globalRelayEnabled, hasSeenScheduleVideoPrivacyNotice, filename) => {
    let parentNode = document.getElementById(YOUTUBE_UPLODAD_MODAL_ID);

    if (!parentNode) {
        parentNode = document.createElement('div');
        parentNode.id = YOUTUBE_UPLODAD_MODAL_ID;
        $('body').append(parentNode);
    }

    getHsAppPublisher().then(({ renderYoutubeUploadModal }) => {
        const props = {
            flux: publisherFlux,
            csrf: hs.csrfToken,
            edit: isEdit,
            filename: filename,
            facadeApiUrl: hs.facadeApiUrl ? hs.facadeApiUrl : '',
            globalRelayEnabled: globalRelayEnabled,
            onEdit: onEdit,
            onVideoShare: shareVideoToComposeBox,
            publishWarningShown: hasSeenPublishWarning,
            scheduleVideoPrivacyNoticeShown: hasSeenScheduleVideoPrivacyNotice,
            timezoneName: hs.timezoneName,
            videoData: postData,
            warningModalName: warningModalName
        };
        renderYoutubeUploadModal(props, parentNode, YOUTUBE_UPLODAD_MODAL_ID);
    });
};

const getOnEditFunction = (messageListId) => {
    return videoData => ajaxPromise({
        url: '/ajax/authoring/put-youtube-post',
        type: 'PUT',
        json: {
            youtubePost: videoData
        }
    }, 'qm', true, true).then(() => {
        if (messageListId) {
            streamsFlux.getActions(MESSAGE_LIST).fetch(messageListId, 'new');
        }
    });
};

const getChannelPromise = () => {
    return getHsAppPublisher().then(({ YouTubeService }) => {
        new YouTubeService(publisherFlux).initializeYouTubeStore();
    });
};

const getPopupPromise = () => {
    return ajaxPromise({
        url: '/ajax/member/has-seen-popup?n=' + Constants.YOUTUBE_WARNING_POPUPS.PUBLISH_WARNING_MODAL,
        type: 'GET'
    }, 'qm');
};

const getScheduleVideoPrivacyNoticePromise = () => {
    return ajaxPromise({
        url: '/ajax/member/has-seen-popup?n=' + Constants.YOUTUBE_WARNING_POPUPS.YOUTUBE_SCHEDULE_VIDEO_PRIVACY,
        type: 'GET'
    }, 'qm');
};

const getPostPromise = (postId, socialNetworkId) => {
    return ajaxPromise({
        url: '/ajax/authoring/get-youtube-post?youtubeVideoId=' + postId + '&youtubeProfileId=' + socialNetworkId,
        type: 'GET'
    }, 'qm');
};

const getGlobalRelayPromise = () => {
    return ajaxPromise({
        url: '/ajax/scheduler/get-global-relay-configuration',
        type: 'GET'
    });
};

const handlePromiseError = () => {
    hs.statusObj.update(translation._('Failed to retrieve post data'), 'warning', true);
};

const showLoading = () => {
    hs.statusObj.update(translation.c.LOADING, 'info');
};

const hideLoading = () => {
    hs.statusObj.reset();
};

const exportRenderYouTubeComposeModal = {
    asCreateMode: (filename) => {
        showLoading();
        Promise.all([getChannelPromise(), getPopupPromise(), getGlobalRelayPromise(), getScheduleVideoPrivacyNoticePromise()]).then(data => {
            hideLoading();
            renderYoutubeUpload(data[0], data[1].seen, Constants.YOUTUBE_WARNING_POPUPS.PUBLISH_WARNING_MODAL, false, null, null, data[2].globalRelayEnabled, data[3].seen, filename);
        }).catch(handlePromiseError);
    },
    asEditMode: (postId, socialProfileId, messageListId) => {
        getHsAppPublisher().then(({ YouTubeMetadata }) => {
            showLoading();
            Promise.all([getChannelPromise(), getPopupPromise(), getPostPromise(postId, socialProfileId), getScheduleVideoPrivacyNoticePromise()]).then(data => {
                hideLoading();
                renderYoutubeUpload(data[0], data[1].seen, Constants.YOUTUBE_WARNING_POPUPS.PUBLISH_WARNING_MODAL, true, YouTubeMetadata.fromServer(data[2].youtubePost), getOnEditFunction(messageListId), null, data[3].seen, null);
            }).catch(handlePromiseError);
        });
    }
};

export default exportRenderYouTubeComposeModal;
