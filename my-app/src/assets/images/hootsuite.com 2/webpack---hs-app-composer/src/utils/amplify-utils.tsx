import { baseDomain, routes } from 'fe-amp-lib-api'
import { apertureApiRequest } from 'fe-comp-aperture'
import { logError } from 'fe-lib-logging'
import LOGGING_CATEGORIES from '@/constants/logging-categories'

const API_BASE = '/service/amplify'

export const preprocessAmplifyPersonalized = async (amplifyId, messages) => {
  const preprocessReq = messages.map(({ text, fbAttachment, socialProfileId }) => ({
    text,
    url: fbAttachment?.url,
    socialProfileId,
  }))

  try {
    const response = await apertureApiRequest(
      baseDomain,
      `${API_BASE}${routes.messages.preprocessPNE(amplifyId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: preprocessReq }),
      },
    )

    if (response.ok) {
      const preprocessedMessages = await response.json()

      messages = messages.map(message => {
        const ppm = preprocessedMessages.find(
          ({ socialProfileId }) => socialProfileId == message.socialProfileId,
        )
        if (ppm) {
          message.text = ppm.text
          if (message.fbAttachment) {
            message.fbAttachment.url = ppm.url
          }
        }
        return message
      })
    }
  } catch (e) {
    logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed while preprocessing Amplify message', {
      errorMessage: JSON.stringify(e.message),
      stack: JSON.stringify(e.stack),
    })
  }

  return messages
}
