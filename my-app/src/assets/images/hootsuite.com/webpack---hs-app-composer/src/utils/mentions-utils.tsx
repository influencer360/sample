import _ from 'underscore'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import InnerMessage from '@/models/inner-message'

const unlinkedMentionRegex = RegExp(/(@{1})(\S){3,}/g)

export const isStringUnlinkedMention = (string: string): RegExpMatchArray => {
  return string.match(unlinkedMentionRegex)
}

export const doesMessagesContainsMention = (innerMessages: Record<string, InnerMessage>): boolean => {
  return _.some(innerMessages, (message: InnerMessage) => {
    return message.mentions && message.mentions.length > 0
  })
}

export const doMessagesContainUnlinkedMention = (innerMessages: Record<string, InnerMessage>): boolean =>
  Object.values(innerMessages).some(({ template = '' }) => isStringUnlinkedMention(template)?.length > 0)

export const getTotalMentionCount = (innerMessages: Record<string, InnerMessage>): number => {
  let totalMentions = 0

  _.each(innerMessages, (message: InnerMessage) => {
    if (message.mentions && message.mentions.length > 0) {
      totalMentions += message.mentions.length
    }
  })
  return totalMentions
}

export const getMentionCountsPerNetworkGroup = (
  innerMessages: Record<string, InnerMessage>,
): Record<string, number> => {
  const mentionCounts: Record<string, number> = {}

  _.each(innerMessages, (message: InnerMessage) => {
    if (message.mentions && message.mentions.length > 0) {
      const { mentions } = message
      const uniqueMentionIds = new Set<string>()
      mentions.forEach(mention => {
        if (mention.externalId) {
          uniqueMentionIds.add(mention.externalId)
        }
      })
      const snGroup = SocialProfileConstants.SN_TYPE_TO_SN_GROUP[message.snType]
      if (mentionCounts[snGroup]) {
        mentionCounts[snGroup] = mentionCounts[snGroup] + uniqueMentionIds.size
      } else {
        mentionCounts[snGroup] = uniqueMentionIds.size
      }
    }
  })
  return mentionCounts
}
