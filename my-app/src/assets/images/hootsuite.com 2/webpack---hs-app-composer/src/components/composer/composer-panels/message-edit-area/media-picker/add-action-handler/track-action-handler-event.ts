import { ComposerConstants } from 'fe-pnc-constants'
import type { AttachmentObject } from 'fe-pnc-data-composer-message'
import { track } from '@/utils/tracking'

export const VALIDATION_BANNER_ACTION_OPEN_CROP_IMAGE_CLICKED = 'crop_image_clicked'
const USER_TOOK_VALIDATION_BANNER_ACTION = 'user_took_validation_banner_action'

type ValidationBannerActionEvent = {
  payload: AttachmentObject
  action: 'crop_image_clicked'
}

export const trackActionHandlerEvent = (event: ValidationBannerActionEvent) => {
  const ORIGIN = `web.publisher.${ComposerConstants.TRACKING_CONTEXT.COMPOSER}`
  const EVENT = USER_TOOK_VALIDATION_BANNER_ACTION

  const { action } = event

  switch (action) {
    case VALIDATION_BANNER_ACTION_OPEN_CROP_IMAGE_CLICKED:
      track(ORIGIN, EVENT, {
        action: action,
        creativeSource: event.payload.trackingSource,
      })
      break
  }
}
