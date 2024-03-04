/** @format */

import _ from 'underscore'
import YouTubeUtils from '../utils/youtube-utils'
import Constants from '../constants/constants'

export default class YouTubeMetadata {
  constructor(data) {
    data = data || {}
    this.author = data.author || null
    this.videoId = data.videoId || null
    this.title = data.title || null
    this.description = data.description || null
    this.tags = data.tags || []
    this.privacy = data.privacy || null
    this.category = data.category || null
    this.sendDate = data.sendDate || null
    this.isScheduled = Boolean(data.isScheduled)
    this.comments = null
    this.playlist = null
  }

  // Called in dashboard/static/js/src/components/publisher/render-youtube-compose.jsx
  static fromServer(data) {
    data = data || {}
    var flattenedData = {}
    flattenedData.author = data.author ? data.author.externalSocialNetworkProfileId : null
    flattenedData.videoId = data.id ? data.id : null
    flattenedData.title = data.message ? data.message.title : null
    flattenedData.description = data.message ? data.message.body : null
    flattenedData.tags = _.pluck(data.postTags, 'name')
    flattenedData.privacy =
      data.privacy && data.privacy.youTube ? data.privacy.youTube.youTubePrivacyRestriction : null
    flattenedData.category = data.category ? data.category.id : null
    // UNIX Timestamp is seconds since 01-01-1970, but JS Date constructor is milliseconds
    flattenedData.sendDate = data.sendDate
      ? new Date(data.sendDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS)
      : null
    flattenedData.isScheduled = Boolean(data.isScheduled)
    flattenedData.comments = null
    flattenedData.playlist = null
    return new YouTubeMetadata(flattenedData)
  }

  static toMUTSFormat(youtubeMetadata, socialProfileId, url, thumbnailUrl) {
    var serverData = {}

    serverData.socialProfileId = parseInt(socialProfileId)
    serverData.url = url
    serverData.thumbnailUrl = thumbnailUrl

    serverData.message = {
      title: youtubeMetadata.title,
      body: youtubeMetadata.description,
    }

    serverData.privacy = {
      youTube: {
        youTubePrivacyRestriction: youtubeMetadata.privacy,
      },
    }

    serverData.category = {
      youTube: youtubeMetadata.category,
    }

    serverData.tags = []
    _.each(youtubeMetadata.tags, function(tag) {
      serverData.tags.push(tag)
    })

    serverData.id = youtubeMetadata.videoId

    return serverData
  }

  static toSCUMFormat(youtubeMetadata, socialProfileId, url, thumbnailUrl, timezoneName) {
    var serverData = {}

    serverData.socialProfileId = parseInt(socialProfileId)
    serverData.url = url
    serverData.thumbnailUrl = thumbnailUrl

    serverData.message = {
      title: youtubeMetadata.title,
      body: youtubeMetadata.description,
    }

    serverData.privacy = {
      youTube: {
        youTubePrivacyRestriction: youtubeMetadata.privacy,
      },
    }

    serverData.category = {
      id: youtubeMetadata.category,
    }

    serverData.tags = []
    _.each(youtubeMetadata.tags, function(tag) {
      serverData.tags.push({ name: tag })
    })

    serverData.sendDate = YouTubeUtils.toFormattedDateString(youtubeMetadata.sendDate, false, timezoneName)
    serverData.isScheduled = youtubeMetadata.isScheduled
    serverData.id = youtubeMetadata.videoId

    return serverData
  }
}
