import get from 'lodash/get'
import _ from 'underscore'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import { URLPreview } from '@/typings/Message'

export const getDefaultLinkPreviewFormat = (linkPreview: URLPreview): URLPreview => {
  if (_.isEmpty(linkPreview)) {
    return {
      url: '',
      originalUrl: '',
      thumbnailUrl: '',
      thumbnailUrls: [],
      title: '',
      description: '',
      ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && {
        hasError: false,
        hasWarning: false,
      }),
    }
  }

  const url = get(linkPreview, 'url', null)

  return {
    url,
    originalUrl: linkPreview.originalUrl ? linkPreview.originalUrl : '',
    thumbnailUrl: linkPreview.thumbnailUrl ? linkPreview.thumbnailUrl : null,
    thumbnailUrls: linkPreview.thumbnailUrls ? linkPreview.thumbnailUrls : [],
    title: linkPreview.title ? linkPreview.title : '',
    description: linkPreview.description ? linkPreview.description : '',
    ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && {
      hasError: linkPreview.hasError ? linkPreview.hasError : false,
      hasWarning: linkPreview.hasWarning ? linkPreview.hasWarning : false,
    }),
  }
}
