import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkGroup, SocialNetworkType } from 'fe-pnc-constants-social-profiles'
import type { Mentions } from 'fe-pnc-data-message-previews'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import MessageConstants from '@/constants/message'
import InnerMessage from '@/models/inner-message'
import Message from '@/models/message'
import { Attachments, BaseMessage, LinkSettings } from '@/typings/Message'
import LinkUtils from '@/utils/link-utils'
import { replaceURL } from '@/utils/string-utils'

const URL_MATCH_UNTIL_QUERY_PARAMS_REGEX = RegExp(/^[^?]*/)

const getURLUntilQueryParams = url => url?.match(URL_MATCH_UNTIL_QUERY_PARAMS_REGEX)[0]

const MessageUtils = {
  /**
   * Takes an array of messages, sorts it, and then returns the sorted array.
   * Messages with errors are put at the top of the list (sorted by error type) and
   * messages without errors are put at the bottom of the list (sorted by id).
   * @param messages An array of messages
   * @returns A new array of sorted messages
   */
  sortMessages(messages: Array<Message>): Array<Message> {
    // Split messages into error and non error messages
    const errorMessages: Array<Message> = []
    const warningMessages: Array<Message> = []
    const validMessages: Array<Message> = []

    messages.forEach(msg => {
      if (msg.hasErrors()) {
        errorMessages.push(msg)
      } else if (msg.hasWarnings()) {
        warningMessages.push(msg)
      } else {
        validMessages.push(msg)
      }
    })

    const sortById = (a: Message, b: Message) => {
      if (a.id && b.id) {
        if (a.id > b.id) {
          return 1
        }
        if (a.id < b.id) {
          return -1
        }
      }
      return 0
    }
    validMessages.sort(sortById)
    errorMessages.sort(sortById)
    warningMessages.sort(sortById)

    return errorMessages.concat(warningMessages, validMessages)
  },

  /**
   * @param messages An array of Inner Messages
   * @param exclude (Optional) An array of groups to exclude
   * @returns Key/value pairs with only one Inner Message of each Network Group Type
   */
  getInnerMessagesByGroup(
    messages: Array<InnerMessage>,
    excludedGroups: Array<SocialNetworkGroup> = [],
  ): Record<SocialNetworkGroup, InnerMessage> {
    return SocialProfileConstants.SN_GROUPS.reduce(
      (innerMessagesByGroup: Record<SocialNetworkGroup, InnerMessage>, networkGroup: SocialNetworkGroup) => {
        const innerMessageByGroup = MessageUtils.getInnerMessageFromGroup(messages, networkGroup)
        if (innerMessageByGroup && !excludedGroups.includes(networkGroup)) {
          innerMessagesByGroup[networkGroup] = innerMessageByGroup
        }
        return innerMessagesByGroup
      },
      {},
    )
  },

  /**
   * @param message A Message object
   * @param exclude (Optional) An array of groups to exclude
   * @returns The total network groups in the given message
   */
  getTotalNetworkGroups(message: Message, excludedGroups: Array<SocialNetworkGroup> = []): number {
    return Object.keys(MessageUtils.getInnerMessagesByGroup(message?.messages || [], excludedGroups)).length
  },

  /**
   * @param message A Message object
   * @param includeInitialContent (Default true) Include messageText from the Initial Content (Base Message)
   * @param exclude (Optional) An array of groups to exclude
   * @returns An array of all the message text for every group. Duplicates and empty text are omitted
   */
  getAllMessageText(
    message: Message,
    includeInitialContent = true,
    excludedGroups: Array<SocialNetworkGroup> = [],
  ): Array<string> {
    const allMessageText = Object.values(
      MessageUtils.getInnerMessagesByGroup(message?.messages || [], excludedGroups),
    ).reduce((allMessageText: Array<string>, innerMessage: InnerMessage) => {
      const innerMessageText = innerMessage.renderMessageText()
      if (innerMessageText && !allMessageText.includes(innerMessageText)) {
        allMessageText.push(innerMessageText)
      }
      return allMessageText
    }, [])

    const baseMessageText = message?.renderMessageText(false, true)

    if (includeInitialContent && baseMessageText && !allMessageText.includes(baseMessageText)) {
      allMessageText.unshift(baseMessageText)
    }
    return allMessageText
  },

  /**
   * @param networkGroup A network group type
   * @returns The first inner message that is a part of the given network group, or undefined if no messages match the group
   */
  getInnerMessageFromGroup(
    messages: Array<InnerMessage>,
    networkGroup: SocialNetworkGroup,
  ): InnerMessage | undefined {
    return (
      (messages?.length &&
        SocialProfileConstants.SN_GROUPS.includes(networkGroup) &&
        messages.find((m: InnerMessage) => MessageUtils.isNetworkTypeInGroup(m.snType, networkGroup))) ||
      undefined
    )
  },

  /**
   * @param networkType A social network group type
   * @param selectedNetworkGroup A social network group type
   * @returns true if the snType is in the group
   */
  isNetworkTypeInGroup(
    networkType?: SocialNetworkType,
    selectedNetworkGroup?: SocialNetworkGroup | null,
  ): boolean {
    return !!networkType && SocialProfileConstants.SN_TYPE_TO_SN_GROUP[networkType] === selectedNetworkGroup
  },

  /**
   * @returns True if any of the inner message text has diverged from the base message
   */
  isPerNetworkMessageCustomized(message: Message): boolean {
    return !!message?.messages?.find(
      innerMessage =>
        MessageUtils.hasMessageTemplateDiverged(message.baseMessage, innerMessage) ||
        LinkUtils.haveLinkSettingsDiverged(message.baseMessage, innerMessage),
    )
  },

  /**
   * Determines if attachments of an inner message has diverged from the base message
   * @param baseMessage The base message ("Initial Content")
   * @param innerMessage The inner message to compare to
   * @returns true if the media has diverged
   */
  hasMediaDiverged(baseMessage: BaseMessage, innerMessage: InnerMessage): boolean {
    const baseUrl = (url: string): string => url.split('?')[0]
    return !(
      baseMessage.attachments?.length === innerMessage.attachments?.length &&
      !baseMessage.attachments?.some(
        (attachment, index) => baseUrl(attachment.url) !== baseUrl(innerMessage.attachments[index].url),
      )
    )
  },

  /**
   * @returns True if any of the inner message media has diverged from the base message
   */
  isPerNetworkMediaCustomized(message: Message): boolean {
    return message.messages?.some(innerMessage =>
      MessageUtils.hasMediaDiverged(message.baseMessage, innerMessage),
    )
  },

  /**
   * @returns only the newAttachments that are not on the existing attachments
   */
  filterOutExistingAttachmentsByUrl(newAttachments, existingAttachments: Attachments): Attachments {
    return newAttachments.filter(
      newAttachment => !existingAttachments.find(message => message.url === newAttachment.url),
    )
  },

  hasInnerAttachmentsChanged(prevMessages, nextMessages) {
    return nextMessages.some((nextMessage, outerIndex) => {
      const prevAttachments = prevMessages?.[outerIndex]?.attachments
      const nextAttachments = nextMessage?.attachments
      return (
        prevAttachments?.length !== nextAttachments?.length ||
        nextAttachments?.some((nextAttachment, index) => {
          const hasProductTagsChanged = nextAttachment?.productTags
            ? Object.keys(nextAttachment?.productTags)?.some(snKey => {
                const prevMessagesProductTags = prevAttachments?.[index]?.productTags?.[snKey]
                return nextAttachment?.productTags[snKey]?.length !== prevMessagesProductTags?.length
              })
            : false

          const prevUrl = getURLUntilQueryParams(prevAttachments?.[index]?.url)
          const prevThumbnailOffset = prevAttachments?.[index]?.thumbnailOffset
          const nextUrl = getURLUntilQueryParams(nextAttachment?.url)
          const nextThumbnailOffset = nextAttachment?.thumbnailOffset

          let thumbnailUrlHasChanged = false
          if (isFeatureEnabled('PUB_29594_CUSTOM_THUMBNAIL_PREVIEW')) {
            const prevThumbnailUrl = getURLUntilQueryParams(prevAttachments?.[index]?.thumbnailUrl)
            const nextThumbnailUrl = getURLUntilQueryParams(nextAttachment?.thumbnailUrl)
            thumbnailUrlHasChanged = prevThumbnailUrl !== nextThumbnailUrl
          }

          return (
            prevUrl !== nextUrl ||
            nextThumbnailOffset !== prevThumbnailOffset ||
            thumbnailUrlHasChanged ||
            hasProductTagsChanged
          )
        })
      )
    })
  },

  /**
   * Determines if any of the inner message mentions have been modified.
   * @param prevMessages
   * @param nextMessages
   * @returns true if mentions have been modified
   */
  hasMentionsChanged(prevMessages, nextMessages) {
    return nextMessages.some((next, index) => {
      const prevMentions = prevMessages?.[index]?.mentions
      const nextMentions = next?.mentions
      return !isEqual(prevMentions, nextMentions)
    })
  },

  /**
   * Determines if any of the inner message link settings have been modified.
   * Particularly useful to detect changes if user posts ow.ly link(s).
   * @param prevMessages
   * @param nextMessages
   * @returns true if link settings have been modified
   */
  hasLinkSettingsChanged(prevMessages, nextMessages) {
    return nextMessages.some((next, index) => {
      const prevLinkSettings = prevMessages?.[index]?.linkSettings
      const nextLinkSettings = next?.linkSettings
      return !isEqual(prevLinkSettings, nextLinkSettings)
    })
  },

  getURLUntilQueryParams,

  getAttachmentsBySelectedNetwork(messages, selectedNetworkGroup) {
    return MessageUtils.getInnerMessageFromGroup(messages, selectedNetworkGroup)?.attachments || []
  },

  /**
   * @returns true if at least one video attachment has custom thumbnail
   */
  isThumbnailCustomized(message: InnerMessage, snGroup: SocialNetworkGroup): boolean {
    return (
      MessageUtils.hasCustomThumbnail(message) &&
      SocialProfileConstants.SN_GROUP_TO_SN_TYPES[snGroup].includes(message.snType)
    )
  },

  hasCustomThumbnail(innerMessage: InnerMessage) {
    return innerMessage?.attachments?.some(attachment => attachment?.userMetadata?.customThumbnail)
  },

  /**
   * Returns true if the message is pending approval or pre-screening
   */
  isPendingState(messageState: string) {
    return (
      messageState === MessageConstants.STATE.PENDING_APPROVAL ||
      messageState === MessageConstants.STATE.PENDING_PRESCREEN
    )
  },

  /**
   * Returns true if the message was previously rejected from approval or pre-screening
   */
  isRejectedState(messageState: string) {
    return (
      messageState === MessageConstants.STATE.REJECTED_APPROVAL ||
      messageState === MessageConstants.STATE.REJECTED_PRESCREEN
    )
  },

  /**
   * Determines if the attachment has changed
   * @param prevAttachments
   * @param nextAttachments
   * @returns True if a deep comparison of the new attachment has changed from the previous attachment
   */
  hasBaseAttachmentsChanged(prevAttachments: Attachments, nextAttachments: Attachments): boolean {
    let attachmentsHasChanged = true
    for (let i = 0; i < prevAttachments.length; i++) {
      const splitUrl = url => (url ? url.thumbnailUrl.split('?') : '')
      const prevThumbnailUrl = splitUrl(prevAttachments[i])
      const nextThumbnailUrl = splitUrl(nextAttachments[i])
      if (
        prevThumbnailUrl[0] === nextThumbnailUrl[0] &&
        prevThumbnailUrl[1] !== nextThumbnailUrl[1] &&
        prevAttachments[i]?.thumbnailOffset === nextAttachments[i]?.thumbnailOffset
      ) {
        attachmentsHasChanged = false
        break
      }
    }
    return attachmentsHasChanged
  },

  /**
   * Determines if an inner message template has diverged from the base message template
   * @param baseMessage The base message ("Initial Content")
   * @param innerMessage The inner message to compare to
   * @returns true if the template has diverged
   */
  hasMessageTemplateDiverged(baseMessage: BaseMessage, innerMessage: InnerMessage): boolean {
    return baseMessage.template !== innerMessage.template
  },

  /**
   * Returns message with link template mapped to full or shortened URLs
   * @param template e.g. "Example %{link-settings-id:0}"
   * @param linkSettings An array of link settings, optionally with shortened URLs
   * @param useShortenedLinks If true, the message returned will include shortened links
   * @returns Updated message and an array of links which were matched
   * e.g. message unshortened: "Example https://www.hootsuite.com"
   * e.g. message shortened: "Example https://ow.ly/i/nX3ty"
   */
  mapTemplateToMessageWithLinks(
    template: string,
    linkSettings: LinkSettings = [],
    useShortenedLinks = false,
  ): {
    message: string
    matchedLinkSettings: LinkSettings
  } {
    let messageWithLinks = template
    const matchedLinkSettings = []

    linkSettings?.forEach(link => {
      const url = (useShortenedLinks && link.previouslyComputedLink?.shortenedUrl) || link.url
      const template = MessageUtils.getLinkSettingTemplate(link.id)
      if (messageWithLinks.search(template) >= 0) {
        messageWithLinks = messageWithLinks.replace(template, url)
        matchedLinkSettings.push(cloneDeep(link))
      }
    })

    return { message: messageWithLinks, matchedLinkSettings }
  },

  /**
   * Returns message with mentions template mapped to display text
   * Mentions offsets are recalculated as shortened links may have changed the index
   * @param template e.g. "Example %{mention-id:0} %{mention-id:1}"
   * @param mentions An array of mentions, offsets are not required as these will be recalculated
   * @returns Updated message and mentions with recalculated offsets
   * e.g. message: "Example @twitterhandle LinkedIn Company"
   */
  mapTemplateToMessageWithMentions(
    template: string,
    mentions: Mentions = [],
  ): {
    message: string
    updatedMentions: Mentions
  } {
    let messageWithMentions = template
    const updatedMentions = []

    mentions?.forEach((mention, index) => {
      const template = MessageUtils.getMentionTemplate(index)
      const offset = messageWithMentions.indexOf(template)
      messageWithMentions = messageWithMentions.replace(template, mention.displayText)
      updatedMentions.push({
        ...mention,
        offset,
      })
    })

    return { message: messageWithMentions, updatedMentions }
  },

  /**
   * Returns message text with injected link and mentions if provided
   * @param template e.g. "Example %{link-setting-id:0} %{mention-id:0}"
   * @param linkSettings An array of link settings, optionally with shortened URLs
   * @param mentions An array of mentions, offsets are not required as these will be recalculated
   * @param useShortenedLinks If true, the messageText returned will include shortened links
   * @returns A message text in a user-friendly format
   * e.g. message unshortened: "Example https://www.hootsuite.com @mention"
   * e.g. message shortened: "Example https://ow.ly/i/nX3ty @mention"
   */
  buildMessageFromTemplate(
    template: string,
    linkSettings: LinkSettings = [],
    mentions: Mentions = [],
    useShortenedLinks = false,
  ): {
    messageText: string
    linkSettings: LinkSettings
    mentions: Mentions
  } {
    const { message: messageWithLinks, matchedLinkSettings } = MessageUtils.mapTemplateToMessageWithLinks(
      template,
      linkSettings,
      useShortenedLinks,
    )

    const { message: messageWithLinksAndMentions, updatedMentions } =
      MessageUtils.mapTemplateToMessageWithMentions(messageWithLinks, mentions)

    return {
      linkSettings: matchedLinkSettings,
      messageText: messageWithLinksAndMentions,
      mentions: updatedMentions,
    }
  },

  /**
   * Maps mentions in the message to the template format based on Mentions provided
   * The offsets/length of the mentions must match the position of the display name
   * in the text exactly or they will be ignored from the mapping.
   * @param messageText e.g. "Example @twitterhandle LinkedIn Company"
   * @param mentions An array of mentions with offsets
   * @returns The message text with mentions in the template format
   * e.g. "Example %{mention-id:0} %{mention-id:1}"
   */
  mapMentionsToTemplate(messageText = '', mentions: Mentions = []): string {
    let prevOffset = 0
    let template = ''

    mentions?.forEach((mention, index) => {
      const mentionText = messageText.slice(mention.offset, mention.offset + mention.length)
      if (mentionText === mention.displayText) {
        template += messageText.slice(prevOffset, mention.offset) + MessageUtils.getMentionTemplate(index)
        prevOffset = mention.offset + mention.length
      }
    })

    template += messageText.slice(prevOffset)

    return template
  },

  /**
   * Maps links in the message to the template format based on Link Settings provided
   * Both unshortened and shortened links will be mapped if they are present in the Link Settings
   * @param messageText e.g. "Example https://www.hootsuite.com https://ow.ly/i/oX3ty"
   * @param linkSettings An array of link settings, optionally with shortened URLs
   * @returns The message text links in the template format
   * e.g. "Example %{link-setting-id:0} %{link-setting-id:1}"
   */
  mapLinkSettingsToTemplate(messageText = '', linkSettings: LinkSettings = []): string {
    let template = messageText
    if (linkSettings?.length) {
      linkSettings.forEach(link => {
        const shortenedUrl = link.previouslyComputedLink?.shortenedUrl
        if (template.indexOf(shortenedUrl) >= 0) {
          template = template.replace(shortenedUrl, MessageUtils.getLinkSettingTemplate(link.id))
        } else {
          template = replaceURL(template, link.url, MessageUtils.getLinkSettingTemplate(link.id))
        }
      })
    }
    return template
  },

  /**
   * Returns template with link and mentions
   * @param messageText e.g. "Example https://ow.ly/i/nX3ty @mention"
   * @param linkSettings An array of link settings, optionally with shortened URLs
   * @param mentions An array of mentions with offsets
   * @returns The message text with links and mentions in the template format
   * e.g. "Example %{link-setting-id:0} %{mention-id:0}"
   */
  buildTemplateFromMessage(
    messageText = '',
    linkSettings: LinkSettings = [],
    mentions: Mentions = [],
  ): string {
    let template = messageText

    template = MessageUtils.mapMentionsToTemplate(template, mentions)
    template = MessageUtils.mapLinkSettingsToTemplate(template, linkSettings)

    return template
  },

  /**
   * Returns link setting template for provided id
   * @param id A unique linkSetting identifier
   * @returns A string template e.g. "%{link-setting-id:7cea97bc-8091-4c75-826e-38e818894711}"
   */
  getLinkSettingTemplate(id: string): string {
    return `%{link-setting-id:${id}}`
  },

  /**
   * Returns mention template for provided index
   * @param index The position of the mention in the mentions array
   * @returns A string template e.g. "%{mention-id:0}"
   */
  getMentionTemplate(index: number): string {
    return `%{mention-id:${index}}`
  },

  /**
   * Returns template with uuids replaced with linkSetting indexes, e.g.
   * "Hello %{link-setting-id:7cea97bc-8091-4c75-826e-38e818894711}" is converted to "Hello %{link-setting-id:0}"
   * @param template Message template
   * @param linkSettings Message linkSettings
   * @returns A string template
   */
  sanitizeTemplateAndLinkSettings(template: string, linkSettings: LinkSettings): string {
    let updatedTemplate = template
    linkSettings?.forEach((linkSetting, index) => {
      const linkSettingTemplate = MessageUtils.getLinkSettingTemplate(linkSetting.id)
      if (template.indexOf(linkSettingTemplate) >= 0) {
        updatedTemplate = updatedTemplate.replace(
          linkSettingTemplate,
          MessageUtils.getLinkSettingTemplate(index.toString()),
        )
      }
    })
    return updatedTemplate
  },

  hasMultipleMessages(messages: InnerMessage[]) {
    return !isEmpty(messages) && messages.length > 1
  },
}

export default MessageUtils
