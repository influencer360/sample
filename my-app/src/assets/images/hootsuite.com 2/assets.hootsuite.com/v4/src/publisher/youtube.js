import 'utils/ajax';

import _ from 'underscore';
import renderYouTubeCompose from 'components/publisher/render-youtube-compose';
// utils
import hootbus from 'utils/hootbus';
import {YOUTUBECHANNEL} from 'utils/social-networks';
import translation from 'utils/translation';

const FILEUPLOADS_YT_VIDEO_UPLOADED = 'messageBox:fileuploads:ytvideouploaded';
const FILEUPLOADS_YT_VIDEO_PROGRESS_CHANGE = 'messageBox:fileuploads:ytvideoprogresschange';

/**
 * Determines if the user has a YouTube account connected
 */
export const hasYouTubeConnected = (recentlyChangedSocialNetwork, recentlyChangedSocialNetworkType) => {
  const youtubeChannelJustAdded = recentlyChangedSocialNetworkType === YOUTUBECHANNEL;
  const nonLimitedYouTubeChannelPreviouslyAdded = _.filter(hs.socialNetworks, socialNetwork => {
    return socialNetwork.type === YOUTUBECHANNEL && socialNetwork.socialNetworkId !== recentlyChangedSocialNetwork && socialNetwork.permissions.SN_POST;
  }).length > 0;

  return youtubeChannelJustAdded || nonLimitedYouTubeChannelPreviouslyAdded;
}

/**
 * Gets the metadata for a video
 */
export const getVideoMetadata = (absoluteVideoFilePath, type, thumbnailUrl, signedMetadataUrl, signedThumbnailUrl, keyframesUrls, signedKeyframesUrls, signedVideoUrl, callback) => {
  fetch(signedMetadataUrl)
    .then(response => response.json())
    .then(data => {
      const responseJson = {};
      responseJson.mimeType = type;
      responseJson.bytes = data.size;
      responseJson.url = absoluteVideoFilePath;
      responseJson.signedUrl = signedVideoUrl;
      responseJson.shortUrl = absoluteVideoFilePath;
      responseJson.success = true;
      responseJson.thumbnailUrl = thumbnailUrl;
      responseJson.signedThumbnailUrl = signedThumbnailUrl;
      responseJson.type = 'video';
      responseJson.videoCodec = data['video-codec'];
      responseJson.audioCodec = data['audio-codec'];
      responseJson.width = data.width;
      responseJson.height = data.height;
      responseJson.displayAspectRatio = data['display-aspect-ratio'];
      responseJson.durationInSec = data['duration'];
      responseJson.frameRate = data['frame-rate'];
      responseJson.audioChannels = data['audio-channels'];
      responseJson.keyframesUrls = keyframesUrls;
      responseJson.signedKeyframesUrls = signedKeyframesUrls;

      if (typeof callback === 'function') {
        callback(responseJson);
      }
    })
    .catch(() => {
      const errorText = translation._('Error getting video metadata.');
      hs.statusObj.update(errorText, 'error', true);
    })
};

/**
 * Uploads a YouTube video to S3 and launches the YouTube Compose modal
 * @param {Array<File>} files An Array of files to upload. Note - only the first one will be uploaded.
 */
export const uploadToYouTube = (files) => {
  let mimeType = ''
  let absoluteVideoFilePath = '';
  let videoFilePath = ''

  const postVideoUploadProcessing = () => {
    // wait for 10 secs - lamda takes sometime to extract metadata
    let metaDataTimeRemaining = 10;
    let metaDataCountDownTimer = 0;

    const metaDataCountDown = () => {
      metaDataTimeRemaining--;
      if (metaDataTimeRemaining <= 0) {
        clearInterval(metaDataCountDownTimer);
        getSignedMetaDataUrl();
      }
    };

    const MAX_METADATA_TIMEOUT_IN_MS = 60000;
    const METADATA_WAIT_INTERVAL_IN_MS = 10000;
    const GET_METADATA_INTERVAL = 1000;

    let elapsedRetryTimeInMS = metaDataTimeRemaining * GET_METADATA_INTERVAL;

    const getSignedMetaDataUrl = () => {
      ajaxCall({
        url: '/ajax/scheduler/get-signed-urls-for-upload?objectKey=' + videoFilePath,
        type: 'GET',
        error: () => {
          let errorText = translation._('Error getting signed video metadata url.');
          hs.statusObj.update(errorText, 'error', true);
        },
        success: data => {
          if (data != null && data.thumbnailUrl != null && data.signedMetadataUrl && data.signedThumbnailUrl != null) {
            ajaxCall({
              url: '/ajax/scheduler/check-is-file-uploaded',
              data: { filename: data.thumbnailUrl },
              type: 'GET',
              error: () => {
                let errorText = translation._('An error occurred.');
                hs.statusObj.update(errorText, 'error', true);
              },
              success: existedData => {
                // key frame exists; proceed with fetching metadata
                if (existedData.success == 1) {
                  getVideoMetadata(absoluteVideoFilePath, mimeType, data.thumbnailUrl, data.signedMetadataUrl, data.signedThumbnailUrl, data.keyframesUrls, data.signedKeyframesUrls, data.signedVideoUrl, responseJson => {
                    hootbus.emit(FILEUPLOADS_YT_VIDEO_UPLOADED, responseJson);
                  });
                } else {
                  if (elapsedRetryTimeInMS <= MAX_METADATA_TIMEOUT_IN_MS) {
                    elapsedRetryTimeInMS += METADATA_WAIT_INTERVAL_IN_MS;
                    setTimeout(getSignedMetaDataUrl, METADATA_WAIT_INTERVAL_IN_MS);
                  } else {
                    let errorText = translation._('Error getting video keyframes. Try removing the video and upload it again.');
                    hs.statusObj.update(errorText, 'error', true);
                  }
                }
              }
            }, 'q1');
          }
        }
      }, 'q1');
    };

    metaDataCountDownTimer = setInterval(metaDataCountDown, GET_METADATA_INTERVAL);
  };

  const errorText = translation._("Failed to get signed S3 upload form");
  if (!files || !files.length) {
    hs.statusObj.update(errorText, 'error', true);
  }
  const file = files[0]
  // First we need to fetch the pre-signed upload form from ajax endpoint
  ajaxCall({
    type: 'POST',
    url: "/ajax/scheduler/s3-upload-form",
    success: data => {
      // Now we have the pre-signed upload form we can upload the video
      videoFilePath = data.filename;
      absoluteVideoFilePath = data.url + data.fileKeyPrefix + data.filename;
      mimeType = file.type

      const formData = new FormData()
      formData.append('key', data.key)
      formData.append('acl', data.acl)
      formData.append('success_action_status', '201')
      formData.append('X-Amz-Credential', data.xAmzCredential)
      formData.append('X-Amz-Algorithm', data.xAmzAlgorithm)
      formData.append('X-Amz-Date', data.xAmzDate)
      formData.append('X-Amz-Signature', data.xAmzSignature)
      formData.append('Policy', data.policy)
      formData.append('file', file) // <- This must appended last!

      // Request the data using XMLHttpRequest and track progress
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (progressEvent) => {
        if(progressEvent.lengthComputable) {
          hootbus.emit(FILEUPLOADS_YT_VIDEO_PROGRESS_CHANGE, {
            actualPercent: Math.ceil((progressEvent.loaded / progressEvent.total) * 100),
          });
        }
      });

      xhr.addEventListener('readystatechange', () => {
        if(xhr.readyState === XMLHttpRequest.DONE && (xhr.status >= 200 && xhr.status < 400)) {
          postVideoUploadProcessing()
        }
      });

      xhr.open("POST", data.url);
      xhr.send(formData);

      // We can open the YouTube Compose modal while the video is still uploading
      renderYouTubeCompose.asCreateMode(file.name);
    },
    error: () => {
      hs.statusObj.update(errorText, 'error', true);
    }
  }, 'q1');
};
