import TrackingConstants from '@/constants/tracking'
import Message from '@/models/message'
import MessageUtils from '@/utils/message-utils'
import { track } from '@/utils/tracking'

export const logCustomizedContent = (message: Message, originId: string) => {
  if (MessageUtils.isPerNetworkMessageCustomized(message)) {
    track(originId, TrackingConstants.TRACKING_ACTION.PER_NETWORK_CONTENT_CUSTOMIZED)
  }
  if (MessageUtils.isPerNetworkMediaCustomized(message)) {
    track(originId, TrackingConstants.TRACKING_ACTION.PER_NETWORK_MEDIA_CUSTOMIZED)
  }
}
