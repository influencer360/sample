import Constants from '@/constants/constants'
import { track } from '@/utils/tracking'
import getUtcTimestamp from '../full-screen-composer/composer-message-tracking/get-utc-timestamp'

const BULK_COMPOSER_TRACKING_ORIGIN = 'web.publisher.bulk_composer.schedule'
const BULK_COMPOSER_TRACKING_ACTION_SCHEDULE_SINGLE_MESSAGE = 'schedule_single_message'
const BULK_COMPOSER_TRACKING_ACTION_SCHEDULE_MESSAGES = 'schedule_messages'

const getScheduledSendTime = messageToSend => {
  return new Date(
    messageToSend?.baseMessage.sendDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS,
  ).toISOString()
}

export const trackSingleBulkComposerMessage = messageToSend => {
  const scheduleSingleMessageTrackingDetails = {
    utcTimestamp: getUtcTimestamp(),
    to_be_published_time: getScheduledSendTime(messageToSend),
  }
  track(
    BULK_COMPOSER_TRACKING_ORIGIN,
    BULK_COMPOSER_TRACKING_ACTION_SCHEDULE_SINGLE_MESSAGE,
    scheduleSingleMessageTrackingDetails,
  )
}

export const trackBulkComposerScheduleMessages = (messageIdsToSchedule, messagesToPost) => {
  const scheduledSendTimes = messagesToPost.map(message => getScheduledSendTime(message))

  track(BULK_COMPOSER_TRACKING_ORIGIN, BULK_COMPOSER_TRACKING_ACTION_SCHEDULE_MESSAGES, {
    number: messageIdsToSchedule.length,
    utcTimestamp: getUtcTimestamp(),
    to_be_published_time: scheduledSendTimes,
  })
}
