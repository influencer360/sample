import { uuid } from 'fe-lib-uuid'
import { add as addToMessageStatusModal } from 'fe-pnc-app-message-status-modal'

import { MESSAGE_STATE } from '@/constants/message'

export const STATUS_COMPLETED = 'COMPLETED'

export const maybeShowMessageStatusModal = (mpsResponseMessages = [], socialNetworks = [], isMinimized) => {
  const messages = [...mpsResponseMessages]
  const transcodingMessages = messages.filter(message => message.state === MESSAGE_STATE.TRANSCODING)
  if (transcodingMessages.length) {
    const getProfileInfo = profileId => {
      const profile = socialNetworks.find(sn => sn.socialNetworkId === profileId)
      return {
        socialProfileName: profile.username,
        avatar: profile.avatar,
        socialProfileType: profile.type,
      }
    }
    const messageGroup = {
      id: uuid(),
      messageGroupText: messages[0].text,
      scheduledSendTime: messages[0].scheduledSendTime,
      messages: messages.map(message => {
        const updatedMessage = {
          socialProfileId: message.socialProfile.id,
          ...getProfileInfo(message.socialProfile.id),
          messageId: message.id,
          needsTranscoding: message.state === MESSAGE_STATE.TRANSCODING,
        }
        if (message.state !== MESSAGE_STATE.TRANSCODING) {
          updatedMessage.status = STATUS_COMPLETED
        }
        return updatedMessage
      }),
    }
    addToMessageStatusModal({ isMinimized, messageGroups: messageGroup })
  }
}
