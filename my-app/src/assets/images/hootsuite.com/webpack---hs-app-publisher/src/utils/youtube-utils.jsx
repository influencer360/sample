/** @format */

import translation from 'hs-nest/lib/utils/translation'
import Constants from '../constants/constants'
import ConstantMappings from '../constants/constant-mappings'
import _ from 'underscore'
import moment from 'moment-timezone'

const DEFAULT_TIMEZONE = 'UTC'

const YouTubeUtils = {
  formatSizeUnits(bytes) {
    var finalBytes = 0
    if (bytes >= 1000000000) {
      finalBytes = translation._('%s1 GB').replace('%s1', (bytes / 1000000000).toFixed(2))
    } else if (bytes >= 1000000) {
      finalBytes = translation._('%s1 MB').replace('%s1', (bytes / 1000000).toFixed(2))
    } else if (bytes >= 1000) {
      finalBytes = translation._('%s1 KB').replace('%s1', (bytes / 1000).toFixed(2))
    } else if (bytes === 1) {
      finalBytes = translation._('%s1 byte').replace('%s1', bytes)
    } else {
      finalBytes = translation._('%s1 bytes').replace('%s1', bytes)
    }
    return finalBytes
  },

  checkAspectRatio(aspectArr) {
    // It doesn't matter if the video is portrait or landscape,
    // so to simplify we can take the higher value as the width
    var videoWidth = Math.max(...aspectArr)
    var videoHeight = Math.min(...aspectArr)
    var videoRatio = videoWidth / videoHeight

    // videoRatio will be 1 if it is a square, e.g. 1:1 which is not valid
    if (videoRatio === 1) {
      return false
    }

    var widescreenRatio = 16 / 9
    var standardRatio = 4 / 3
    // Allow up to 1% difference when comparing video ratio against standard and widescreen ratio
    var standardRatioMargin = Math.abs((1 - videoRatio / widescreenRatio) * 100)
    var widescreenRatioMargin = Math.abs((1 - videoRatio / standardRatio) * 100)
    // If the video ratio does not fall within 1% of the standard or widescreen ratios, it fails
    return standardRatioMargin <= 1 || widescreenRatioMargin <= 1
  },

  validateVideoData(data, options) {
    options = options || {}

    var errorObject = {
      type: 'YOUTUBECHANNELS',
      errors: [],
      warnings: [],
    }

    var MAX_VIDEO_DURATION = options.isUserVerified
      ? Constants.YOUTUBE_VIDEO_REQUIREMENTS.MAX_VIDEO_DURATION_VERIFIED
      : Constants.YOUTUBE_VIDEO_REQUIREMENTS.MAX_VIDEO_DURATION_UNVERIFIED
    var MAX_VIDEO_DURATION_HOURS_MINS = ConstantMappings.YT_MAX_DURATION_TO_HOURS_MINUTES[MAX_VIDEO_DURATION]
    var MAX_VIDEO_SIZE = options.globalRelayEnabled
      ? Constants.YOUTUBE_VIDEO_REQUIREMENTS.MAX_VIDEO_SIZE_GR
      : Constants.YOUTUBE_VIDEO_REQUIREMENTS.MAX_VIDEO_SIZE
    var MAX_VIDEO_SIZE_FOR_DISPLAY_TO_USER = options.globalRelayEnabled
      ? Constants.YOUTUBE_VIDEO_REQUIREMENTS.MAX_VIDEO_SIZE_GR_FOR_DISPLAY_TO_USER
      : Constants.YOUTUBE_VIDEO_REQUIREMENTS.MAX_VIDEO_SIZE

    var displayAspectRatio = data.displayAspectRatio
    var bytes = data.bytes
    var durationInSec = data.durationInSec

    var isDurationValid = durationInSec <= MAX_VIDEO_DURATION
    var isSizeValid = bytes <= MAX_VIDEO_SIZE
    var isAudioCodecValid = data.audioCodec === Constants.YOUTUBE_VIDEO_REQUIREMENTS.AUDIO_CODEC
    var isVideoCodecValid = data.videoCodec === Constants.YOUTUBE_VIDEO_REQUIREMENTS.VIDEO_CODEC
    var isMimeTypeValid = _.contains(Constants.YOUTUBE_VIDEO_REQUIREMENTS.MIMETYPES, data.mimeType)

    // Must be a valid aspect ratio - needs 2 values to validate it
    var displayAspectRatioArray = displayAspectRatio ? displayAspectRatio.split(':') : null
    if (!displayAspectRatioArray || displayAspectRatioArray.length < 2) {
      errorObject.errors.push({
        message: translation._('Invalid aspect ratio.'),
      })
    } else {
      // Aspect Ratio format is correct- check that the ratio itself is valid
      var isAspectRatioValid = this.checkAspectRatio(displayAspectRatioArray)

      if (!isAspectRatioValid) {
        errorObject.warnings.push({
          // prettier-ignore
          message: translation._('Aspect Ratio is %s1, YouTube recommends an aspect ratio of 4:3 or 16:9.').replace('%s1', displayAspectRatio)
        })
      }
    }

    if (!isSizeValid) {
      var formattedBytes = this.formatSizeUnits(bytes)
      var formattedMaxBytes
      formattedMaxBytes = this.formatSizeUnits(MAX_VIDEO_SIZE_FOR_DISPLAY_TO_USER)

      var sizeErrorMessage
      if (options.globalRelayEnabled) {
        sizeErrorMessage = translation._('This video is too large to be archived (%s1); maximum size is %s2')
      } else {
        sizeErrorMessage = translation._('This video is too large (%s1); maximum size is %s2')
      }
      errorObject.errors.push({
        message: sizeErrorMessage.replace('%s1', formattedBytes).replace('%s2', formattedMaxBytes),
      })
    }

    if (!isDurationValid) {
      var errorMessageTemplate
      var secondsInHour = Constants.DATE_TIME.NUM_SECONDS_IN_MINUTE * 60
      var durationText =
        durationInSec > secondsInHour
          ? (durationInSec / secondsInHour).toFixed(1) + ' ' + translation._('hours')
          : (durationInSec / Constants.DATE_TIME.NUM_SECONDS_IN_MINUTE).toFixed(1) +
            ' ' +
            translation._('minutes')
      if (options.isUserVerified) {
        errorMessageTemplate = translation._('Video length is %s1, YouTube allows at most %s2.')
      } else {
        // prettier-ignore
        errorMessageTemplate = translation._('Video length is %s1, YouTube allows at most %s2 for unverified accounts.')
      }
      errorObject.errors.push({
        message: errorMessageTemplate
          .replace('%s1', durationText)
          .replace('%s2', MAX_VIDEO_DURATION_HOURS_MINS),
      })
    }

    if (!isAudioCodecValid) {
      // prettier-ignore
      var audioErrorMessage = translation._("We can't recognize the audio format for this file. See %s1YouTube's recommended upload settings%s2.")
      errorObject.warnings.push({
        message: {
          __html: audioErrorMessage
            .replace(
              '%s1',
              '<a href="https://support.google.com/youtube/answer/1722171?hl=en" target="_blank">',
            )
            .replace('%s2', '</a>'),
        },
      })
    }

    if (!isVideoCodecValid) {
      errorObject.errors.push({
        // prettier-ignore
        message: translation._('Video codec is %s1, YouTube recommends %s2.').replace('%s1', data.videoCodec).replace('%s2', Constants.YOUTUBE_VIDEO_REQUIREMENTS.VIDEO_CODEC)
      })
    }

    if (!isMimeTypeValid) {
      errorObject.errors.push({
        // prettier-ignore
        message: translation._('Video mimetype is %s1, Hootsuite supports video/m4v, video/mp4 or video/x-m4v.').replace('%s1', data.mimeType)
      })
    }

    return errorObject
  },

  getYouTubeIdFromUrl(url) {
    var isYoutubeUrl = /youtube\.com|youtu\.be/i.test(url)

    if (isYoutubeUrl) {
      // See: http://stackoverflow.com/questions/3452546/javascript-regex-how-to-get-youtube-video-id-from-url
      var youtubeIdRegex = /.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/
      var match = url.match(youtubeIdRegex)
      if (match && match[1].length === 11) {
        return match[1]
      }
    }

    return false
  },

  /**
   * Formats a Date object to a human readable string or
   * a database readable string.
   *
   * Usage:
   * toFormattedDateString(new Date('January 1, 2000 00:00:00')) - returns '2000-01-01 00:00:00'
   * toFormattedDateString(new Date('January 1, 2000 00:00:00'), true) - returns 'Jan 1, 2000 12:00AM'
   *
   * @param  {Date}    date     The date to format
   * @param  {Boolean} isOnPage Whether or not we're displaying the date and time on the page
   * @param  {String} timezoneName
   * @return {String}
   */
  toFormattedDateString(date, isOnPage, timezoneName = DEFAULT_TIMEZONE) {
    const dateMoment = moment(date).tz(timezoneName)

    if (isOnPage) {
      return dateMoment.format('MMM D, YYYY @ h:mmA')
    }

    return dateMoment.format('YYYY-MM-DD HH:mm:ss')
  },

  /**
   * Returns the timestamp in local time
   * @param {number} unixTimestamp (seconds)
   * @returns {number} timestamp (milliseconds)
   **/
  getLocalTimestamp(unixTimestamp) {
    var date = new Date(unixTimestamp * 1000)
    return (
      date.getTime() +
      date.getTimezoneOffset() *
        Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS *
        Constants.DATE_TIME.NUM_SECONDS_IN_MINUTE
    )
  },

  createTitleFromFilename(filename) {
    if (typeof filename !== 'string') {
      return ''
    }

    var result = filename

    var startOfFileExtension = result.indexOf('.')

    if (startOfFileExtension > 0) {
      result = result.substring(0, startOfFileExtension)
    }

    // Replace underscores and dashes with spaces
    result = result.replace(/-|_/g, ' ')

    // Title case the string
    result = result.replace(/(\s|^)([a-z])/g, x => x.toUpperCase())

    return result.trim()
  },
}

export default YouTubeUtils
