import extractDomain from 'extract-domain'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles/dist/constants'
import { cloneDeep, compact, filter, isEqual, isEmpty, isNil, omit, isUndefined, union } from 'lodash'
import twitterText from 'twitter-text'
import _ from 'underscore'
import { logError } from 'fe-lib-logging'
import { uuid } from 'fe-lib-uuid'
import type { SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'
import type { Mentions } from 'fe-pnc-data-message-previews'
import { getS3UrlFromExternalUrl } from 'fe-pnc-lib-api'
import { isFeatureEnabled, isFeatureEnabledOrBeta, getFeatureValue } from 'fe-pnc-lib-darklaunch'
import { doesRangeIntersect } from 'fe-pnc-lib-mentions'

import { LinkSettingsUtils } from 'fe-pnc-lib-utils'
import { CUSTOM_ERRORS } from 'fe-pnc-validation-error-messages'
import Constants from '@/constants/constants'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import InnerMessage from '@/models/inner-message'
import Message from '@/models/message'
import { Campaign, Preset } from '@/typings/Flux'
import { BaseMessage, FieldValidations, LinkSettings, ThumbnailURLs, URLPreview } from '@/typings/Message'
import ComposerUtils from '@/utils/composer-utils'
import MessageUtils from '@/utils/message-utils'
import { track } from '@/utils/tracking'
import ValidationUtils from '@/utils/validation-utils'

// Based on the discussion here https://stackoverflow.com/a/7109208
const URL_ALLOWED_CHARACTERS_REGEX = /[-a-zA-Z0-9@:%_+.~#?&\\\/=(),!';$*]+$/

const LinkUtils = {
  /**
   * @deprecated Use getUrlsWithoutMentionOverlaps instead
   * @param text The text to search
   * @param  mentions An array of mentions
   * @return An array of urls in the message, after removing urls that overlap with mentions
   * If a mention contains a url- it should be treated as a mention, and not be scraped or have link settings applied
   */
  getUrlsWithoutMentionOverlapsOld(text = '', mentions?: Mentions | null): Array<string> {
    if (mentions?.length) {
      const excludedRanges = mentions.map(({ offset, length }) => ({
        offset,
        length,
      }))

      return twitterText
        .extractUrlsWithIndices(text)
        .filter(
          u =>
            !doesRangeIntersect({
              offset: u.indices[0],
              length: u.indices[1] - u.indices[0],
              excludedRanges,
            }),
        )
        .map(u => u.url)
    }
    return twitterText.extractUrls(text)
  },

  /**
   * @param text The text to search
   * @param  mentions An array of mentions
   * @return An array of urls in the message, after removing urls that overlap with mentions
   * If a mention contains url - it should be treated as a mention, and not be scraped or have link settings applied
   */
  getUrlsWithoutMentionOverlaps(text = '', mentions?: Mentions | null): Array<string> {
    const textWithoutMentions = MessageUtils.mapMentionsToTemplate(text, mentions)
    return twitterText.extractUrls(textWithoutMentions)
  },

  /**
   * Replace the text with the original links
   * @param text
   * @param linkSettings
   */
  replaceShortenedURLs(text: string, linkSettings: LinkSettings) {
    linkSettings.forEach(({ previouslyComputedLink }) => {
      if (previouslyComputedLink) {
        const { shortenedUrl, originalUrl } = previouslyComputedLink
        text = text.replace(shortenedUrl, originalUrl)
      }
    })
    return text
  },

  /***
   * Gets the LinksSettings based on all message text, in the order:
   * Initial Content -> Current Network -> Other Networks
   * @param message A message wrapper to check
   * @param text Any text string to search
   * @param selectedNetworkGroup The selected network group, or undefined if on Intial Content
   * @param mentions An array of mentions
   * @returns A new LinkSettings object
   */
  getAllLinkSettings(
    message: Message,
    text: string,
    selectedNetworkGroup?: SocialNetworkGroup | null,
    mentions?: Mentions,
  ): LinkSettings | null {
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      let selectedMessage: BaseMessage | InnerMessage
      if (selectedNetworkGroup) {
        selectedMessage =
          MessageUtils.getInnerMessageFromGroup(message?.messages || [], selectedNetworkGroup) ||
          message.baseMessage
      } else {
        selectedMessage = message.baseMessage
      }

      const isAmplify = ComposerUtils.isAmplifyComposer(ComposerUtils.getCustomContextType(message))

      return (
        LinkUtils.detectLinkSettings(
          text,
          selectedNetworkGroup && message?.supportsMentions() ? mentions || [] : [],
          selectedMessage?.linkSettings || [],
          isAmplify,
        ) || null
      )
    } else {
      const linkSettingsAll = []
      const isSingleSN = message?.messages?.length > 1
      // Extract base message linkSettings
      const baseMessageText =
        selectedNetworkGroup && isSingleSN
          ? MessageUtils.buildMessageFromTemplate(
              message.baseMessage.template,
              message.baseMessage.linkSettings,
              [],
            ).messageText
          : text
      const linkSettingsBaseMessage = LinkUtils.detectLinkSettingsOld(message, baseMessageText, []) || []
      const linkSettingsBaseMessageIds = linkSettingsBaseMessage.map(linkSetting => linkSetting.id)
      linkSettingsAll.push(...linkSettingsBaseMessage)

      // On SN tab
      if (selectedNetworkGroup && isSingleSN) {
        // Extract inner message linkSettings that are not on the base message
        message.messages.forEach(m => {
          if (MessageUtils.isNetworkTypeInGroup(m.snType, selectedNetworkGroup)) {
            // Extracting links for the current network
            const linkSettingsCurrentNetwork = LinkUtils.detectLinkSettingsOld(message, text, mentions) || []
            // Filter out links that are set on the base message
            const linkSettingsDiverged = linkSettingsCurrentNetwork.filter(
              linkSetting => !linkSettingsBaseMessageIds.includes(linkSetting.id),
            )
            linkSettingsAll.push(...linkSettingsDiverged)
          } else {
            // Extract links for a network that is not currently selected
            const linkSettingsInnerMessage =
              LinkUtils.detectLinkSettingsOld(message, m.renderMessageText(), m.mentions) || []
            // Filter out links that are set on the base message
            const linkSettingsDiverged = linkSettingsInnerMessage.filter(
              linkSetting => !linkSettingsBaseMessageIds.includes(linkSetting.id),
            )
            linkSettingsAll.push(...linkSettingsDiverged)
          }
        })
      } else {
        // on Initial Content
        message.messages.forEach(m => {
          if (MessageUtils.hasMessageTemplateDiverged(message.baseMessage, m)) {
            const linkSettingsInnerMessage =
              LinkUtils.detectLinkSettingsOld(message, m.renderMessageText(), m.mentions) || []
            const linkSettingsDiverged = linkSettingsInnerMessage.filter(
              linkSetting => !linkSettingsBaseMessageIds.includes(linkSetting.id),
            )
            linkSettingsAll.push(...linkSettingsDiverged)
          }
        })
      }

      return linkSettingsAll.length ? linkSettingsAll : null
    }
  },

  /**
   * @deprecated Use detectLinkSettings instead
   * Determines LinkSettings from the URLs in a text string
   * @param message The message object being checked
   * @param text Any text string to search
   * @param mentions  An array of mentions
   * @returns A new LinkSettings object
   */
  detectLinkSettingsOld(message: Message, text: string, mentions?: Mentions | null): LinkSettings | null {
    const addHttpToUrlIfMissing = (url = '') => {
      return url.toLowerCase().indexOf('http') === -1 ? `http://${url}` : url
    }

    let linkSettingsDetected: LinkSettings | null

    const urls = LinkUtils.getUrlsWithoutMentionOverlapsOld(text, message.supportsMentions() ? mentions : [])
    const isAmplify = ComposerUtils.isAmplifyComposer(ComposerUtils.getCustomContextType(message)) || false

    if (!_.isEmpty(urls)) {
      let index = 0
      let prevLinkSettings = cloneDeep(message.linkSettings)
      linkSettingsDetected = _.compact(
        _.map(urls, (link: string) => {
          if (index < text.length && text.indexOf(link, index) > -1) {
            // To deal with duplicate links, we advance the scanning range
            index = text.indexOf(link, index) + link.length
            //If previousLinkSettings exist, try to resolve and preserve them
            if (prevLinkSettings) {
              //Do our best to match -- take the first one where...
              const originalLinkSetting = _.first(
                filter(prevLinkSettings, previousLinkSetting => {
                  //...where domains match, if any
                  // extractDomain requires an http://
                  return (
                    extractDomain(addHttpToUrlIfMissing(previousLinkSetting.url)) ===
                    extractDomain(addHttpToUrlIfMissing(link))
                  )
                }),
              )

              if (originalLinkSetting) {
                let id: string
                if (isFeatureEnabled('PUB_31088_LINK_IDS_IN_AMPLIFY')) {
                  // The link settings coming from Amplify don't have uuids,
                  // so we need to generate them here
                  id = isAmplify && !originalLinkSetting.id ? uuid() : originalLinkSetting.id
                } else {
                  id = originalLinkSetting.id
                }
                //Remove the previousLinkSettings that match originalLinkSettings as we go so we handle case of duplicates
                prevLinkSettings = _.without(prevLinkSettings, originalLinkSetting)
                return {
                  url: link,
                  previouslyComputedLink: originalLinkSetting.previouslyComputedLink,
                  linkShortenerId: originalLinkSetting.linkShortenerId || Constants.LINK_SHORTENER.NONE,
                  linkTracker: originalLinkSetting.linkTracker,
                  id,
                }
              }
            }
            //No previous Link Settings was found for the given link, so return default link settings for link
            return {
              url: link,
              previouslyComputedLink: null,
              linkShortenerId: Constants.LINK_SHORTENER.NONE,
              linkTracker: {
                type: Constants.LINK_TRACKER.NONE,
                trackingParameters: null,
              },
              id: uuid(),
            }
          } else {
            return undefined
          }
        }),
      )
    } else {
      linkSettingsDetected = null
    }
    return linkSettingsDetected
  },

  /**
   *  Determines LinkSettings from the URLs in a text string
   * @param text Any text string to search
   * @param mentions  An array of mentions
   * @param previousLinkSettings  An array of previous link settings
   * @param isAmplify A boolean defining whether Amplify composer is currently being used
   * @returns A new LinkSettings object
   */
  detectLinkSettings(
    text: string,
    mentions?: Mentions | [],
    previousLinkSettings?: LinkSettings | [],
    isAmplify?: boolean | false,
  ): LinkSettings {
    const addHttpToUrlIfMissing = (url = '') => {
      return url.toLowerCase().indexOf('http') === -1 ? `http://${url}` : url
    }

    const urls = LinkUtils.getUrlsWithoutMentionOverlaps(text, mentions)

    if (isEmpty(urls)) return null

    let index = 0
    const linkSettingsDetected: LinkSettings = compact(
      urls.map(url => {
        if (index < text.length && text.indexOf(url, index) > -1) {
          // To deal with duplicate links, we advance the scanning range
          index = text.indexOf(url, index) + url.length

          const matchedLinkSetting = previousLinkSettings?.find(
            previousLinkSetting =>
              addHttpToUrlIfMissing(previousLinkSetting.url) === addHttpToUrlIfMissing(url),
          )
          if (!isEmpty(matchedLinkSetting)) {
            let id: string
            if (isFeatureEnabled('PUB_31088_LINK_IDS_IN_AMPLIFY')) {
              // The link settings coming from Amplify don't have uuids,
              // so we need to generate them here
              id = isAmplify && !matchedLinkSetting.id ? uuid() : matchedLinkSetting.id
            } else {
              id = matchedLinkSetting.id
            }
            return {
              url,
              previouslyComputedLink: matchedLinkSetting.previouslyComputedLink,
              linkShortenerId: matchedLinkSetting.linkShortenerId || Constants.LINK_SHORTENER.NONE,
              linkTracker: matchedLinkSetting.linkTracker,
              id,
            }
          } else {
            // No previous Link Settings was found for the given link, so return default link settings for link
            return {
              url,
              previouslyComputedLink: null,
              linkShortenerId: Constants.LINK_SHORTENER.NONE,
              linkTracker: {
                type: Constants.LINK_TRACKER.NONE,
                trackingParameters: null,
              },
              id: uuid(),
            }
          }
        } else {
          return undefined
        }
      }),
    )

    return isEmpty(linkSettingsDetected) ? null : linkSettingsDetected
  },

  /**
   * Determines if provided string contains invalid characters
   * @param link A text string
   * @returns true if string contains at least one invalid character
   */
  doesUrlHaveInvalidCharacters(link: string): boolean {
    return link.match(URL_ALLOWED_CHARACTERS_REGEX)?.join('') !== link
  },
  /**
   * Resets previouslyComputedLink on each link setting if the latter changed.
   * Returns updated link settings array
   * @param newLinkSettings Link settings to be set on the message
   * @param prevLinkSettings Link settings already exist on the message
   * @returns linkSettings with previous previouslyComputedLink if link settings
   * didn't change; otherwise returns linkSettings with null previouslyComputedLink
   */
  getLinkSettingsWithComputedLinks(
    newLinkSettings: LinkSettings,
    prevLinkSettings: LinkSettings,
  ): LinkSettings {
    if (Array.isArray(prevLinkSettings) && Array.isArray(newLinkSettings)) {
      return newLinkSettings.map((newLinkSetting, i) => {
        const prevLinkSetting = prevLinkSettings.find(
          prevLinkSetting => prevLinkSetting.url === newLinkSetting.url,
        )
        const hasLinkSettingChanged = prevLinkSetting?.linkShortenerId !== newLinkSetting.linkShortenerId
        if (hasLinkSettingChanged) {
          // let pnp replace previouslyComputedLink; it'll see that there is none and compute a new one (see updateMessagesFromPreview in composer-message store)
          newLinkSetting.previouslyComputedLink = null
        } else {
          // preserve the existing previouslyComputedLink for this link setting, if it exists
          if (prevLinkSettings[i] && prevLinkSettings[i].previouslyComputedLink) {
            newLinkSetting.previouslyComputedLink = cloneDeep(prevLinkSettings[i].previouslyComputedLink)
          }
        }
        return newLinkSetting
      })
    }
    return newLinkSettings
  },

  /**
   * Determines whether link setting ids should be re-generated
   * since SN link presets have diverged from the base link presets
   * and can npo longer have the same ids as the base link settings
   * @param snLinkSettings link settings set on the inner message
   * @param baseLinkSettings link settings set on the base message
   * @param newLinkSettings link settings to be set on the inner message in the setter
   * Returns true if link settings should be updated with new ids
   **/
  shouldGenerateNewLinkSettingIds(
    snLinkSettings: LinkSettings,
    baseLinkSettings: LinkSettings,
    newLinkSettings: LinkSettings,
  ): boolean {
    const hasLinkSettingsDivergedFromBase =
      snLinkSettings?.length !== baseLinkSettings?.length ||
      !!snLinkSettings?.find(
        (snLinkSetting, index) =>
          !isEqual(
            omit(snLinkSetting, 'previouslyComputedLink'),
            omit(baseLinkSettings[index], 'previouslyComputedLink'),
          ),
      )

    // If inner and base link settings are the same => no need to update link ids
    if (hasLinkSettingsDivergedFromBase) return false

    // If inner link settings have the same ids and urls as the new link settings => update ids
    const hasSameIdsAndUrls = !newLinkSettings?.some(
      newLinkSetting =>
        !snLinkSettings.find(
          snLinkSetting => snLinkSetting.url === newLinkSetting.url && snLinkSetting.id === newLinkSetting.id,
        ),
    )
    const hasDifferentPresets = !!snLinkSettings.find(
      (snLinkSetting, index) =>
        !isEqual(
          omit(snLinkSetting, 'previouslyComputedLink'),
          omit(newLinkSettings[index], 'previouslyComputedLink'),
        ),
    )

    return hasSameIdsAndUrls && hasDifferentPresets
  },

  /**
   * Adds required by Draft service properties to link settings
   * @param linkSettings link settings to sanitize
   * @param stateFarmContentSourceId
   * @param organizationId
   * @param memberEmail
   * Returns sanitized link settings
   **/
  sanitizeLinkSettingsToDraftValues(
    linkSettings: LinkSettings,
    stateFarmContentSourceId: number,
    organizationId: number,
    memberEmail: string,
  ): LinkSettings {
    return linkSettings.map(linkSetting => {
      if (
        isFeatureEnabled('PUB_12938_STATE_FARM_NC_URL_PARAMS') &&
        ComposerUtils.isStateFarm(organizationId)
      ) {
        linkSetting.memberEmailAddress = memberEmail
        linkSetting.linkShortenerId = parseInt(
          getFeatureValue('PUB_12938_STATE_FARM_FORCED_VANITY_URL_ID_NC'),
          10,
        )
        if (stateFarmContentSourceId >= 0) {
          linkSetting.contentLibraryTemplateId = stateFarmContentSourceId
        }
      }
      return linkSetting
    })
  },

  /**
   * Determines if an inner message linkSettings have diverged from the base message linkSettings
   * previouslyComputedLink link setting is excluded from the comparison since
   * it's not being set on the base message
   * @param baseMessage The base message ("Initial Content")
   * @param innerMessage The inner message to compare to
   * @returns true if the link settings have diverged
   */
  haveLinkSettingsDiverged(baseMessage: BaseMessage, innerMessage: InnerMessage): boolean {
    if (baseMessage?.linkSettings?.length !== innerMessage?.linkSettings?.length) return true

    return !!innerMessage?.linkSettings?.find(
      (linkSetting, index) =>
        !isEqual(
          omit(linkSetting, 'previouslyComputedLink'),
          omit(baseMessage.linkSettings[index], 'previouslyComputedLink'),
        ),
    )
  },

  getLinkSettingsWithCampaignPresetApplied(
    campaignPreset: Preset,
    linkSettings: LinkSettings,
    presets: Array<Preset>,
  ): LinkSettings | null {
    // if there's no preset or no links there's nothing to do
    if (campaignPreset && !isNil(linkSettings)) {
      if (!isEmpty(presets)) {
        const preset = presets.find((preset: Preset) => preset.id === Number(campaignPreset.id))
        if (isUndefined(preset)) {
          return null
        }
        return LinkSettingsUtils.applyPreset(preset, linkSettings)
      }
    }
    return null
  },

  /**
   * Applies campaign preset to the provided link settings
   * on campaign select
   * @param linkSettings to update
   * @param selectedCampaign campaign with presets
   * @param presets The list of presets available for this user
   * @param trackingContext to use if tracking event should be sent
   * @returns An object with updated linkSettings and linkSettingsPresetId
   */
  applyCampaignSettings(
    linkSettings: LinkSettings,
    selectedCampaign: Campaign,
    presets: Array<Preset>,
    trackingContext: string,
  ): {
    linkSettings: LinkSettings
    linkSettingsPresetId: number
  } {
    const clonedLinkSettings = cloneDeep(linkSettings)

    if (isEmpty(clonedLinkSettings)) return null

    let campaignHasPreset = false
    let newLinkSettings: LinkSettings = null
    let newLinkSettingsPresetId: number = null

    if ((selectedCampaign && isNil(selectedCampaign.preset)) || !selectedCampaign) {
      newLinkSettings = LinkSettingsUtils.applyDefaultLinkSettings(clonedLinkSettings)
    } else {
      newLinkSettings = this.getLinkSettingsWithCampaignPresetApplied(
        selectedCampaign.preset,
        clonedLinkSettings,
        presets,
      )
      newLinkSettingsPresetId = selectedCampaign.preset.id

      campaignHasPreset = true

      if (!newLinkSettings) {
        newLinkSettings = clonedLinkSettings
      }
    }

    if (campaignHasPreset) {
      track('web.publisher.' + trackingContext + '.send_message', 'campaign_applied_link_preset')
    }

    return {
      linkSettings: newLinkSettings,
      linkSettingsPresetId: newLinkSettingsPresetId,
    }
  },

  combineLinkSettings(urlDetected: LinkSettings, linkDiffWithPreset: LinkSettings): LinkSettings {
    if (!isEmpty(linkDiffWithPreset)) {
      urlDetected = urlDetected.filter(link => link.id !== linkDiffWithPreset[0].id)
    }
    return union(urlDetected, linkDiffWithPreset)
  },

  /**
   * Applies link preset to newly added link settings,
   * combines new and existing link settings.
   * Applies campaign preset if no custom preset is selected at the moment
   * Applies custom preset if a campaign is selected and user is modifying the campaign preset
   *
   * @param linkSettingsPresetId Custom preset id
   * @param selectedCampaignPreset Campaign preset id
   * @param presets An array of presets available to this user
   * @param linkDiff New link settings that are being added to the message
   * @param previousLinks The link settings previously existed in the message
   * @param newLinks The link settings detected in the updated message
   *
   * @return combined new and existing link settings with applied preset and preset id
   */
  applyCampaignPresetOnMessageChange(
    linkSettingsPresetId: number,
    selectedCampaignPreset: Preset,
    presets: Preset[],
    linkDiff: LinkSettings,
    previousLinks: LinkSettings,
    newLinks: LinkSettings,
  ): { linkSettings: LinkSettings; linkSettingsPresetId: number } {
    // Selected preset is the same as the selected campaign preset => apply campaign preset to all detected links
    if (isNil(linkSettingsPresetId) || linkSettingsPresetId === selectedCampaignPreset?.id) {
      const preset = presets?.find(preset => preset.id === selectedCampaignPreset?.id)

      const newLinksWithPreset =
        preset && !isNil(newLinks) ? LinkSettingsUtils.applyPreset(preset, newLinks) : null

      return {
        linkSettings: newLinksWithPreset,
        linkSettingsPresetId: selectedCampaignPreset.id,
      }
    }

    // Selected preset is different form campaign preset (user is overriding the campaign preset) => apply selected preset
    const selectedPreset = presets.find(preset => preset.id === linkSettingsPresetId)
    const linkDiffWithPreset: LinkSettings = LinkSettingsUtils.applyPreset(selectedPreset, linkDiff)
    return {
      linkSettings: isEmpty(previousLinks)
        ? linkDiffWithPreset
        : this.combineLinkSettings(newLinks, linkDiffWithPreset),
      linkSettingsPresetId,
    }
  },

  /**
   * Uploads a thumbnail to S3 using provided thumbnail url
   * @param thumbnailUrls
   * @returns An S3 url of the uploaded thumbnail
   */
  uploadThumbnailToS3(thumbnailUrls: ThumbnailURLs & { isDefault?: boolean }) {
    return getS3UrlFromExternalUrl({
      id: uuid(),
      appId: null,
      url: thumbnailUrls.thumbnailUrl,
      mimeTypeHint: 'image/jpeg',
      noToasts: true,
    })
      .then(s3Image => ({
        s3ThumbnailURL: s3Image.url,
        originalUrl: thumbnailUrls.originalUrl,
        thumbnailUrl: thumbnailUrls.thumbnailUrl,
        isDefault: thumbnailUrls?.isDefault,
      }))
      .catch(error => {
        logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'An error occurred during thumbnail upload', {
          errorMessage: JSON.stringify(error.message),
          stack: JSON.stringify(error.stack),
        })
      })
  },

  /**
   * Returns an array of thumbnail objects with thumbnailUrl field
   * set to S3 url returned from the media streaming service
   * @param thumbnailUrlsArray An array of thumbnail objects with
   * thumbnailUrl field set to the value returned from link scraper
   * @returns updated array of thumbnail objects
   */
  async getThumbnailURLsWithS3URLs(thumbnailUrlsArray: Array<ThumbnailURLs & { isDefault?: boolean }>) {
    const promises = thumbnailUrlsArray?.map(thumbnailUrls => {
      return this.uploadThumbnailToS3(thumbnailUrls)
    })
    const thumbnailUrlsArrayS3 = await Promise.all(promises)
    if (
      isNil(thumbnailUrlsArrayS3) ||
      isEmpty(thumbnailUrlsArrayS3) ||
      isUndefined(thumbnailUrlsArrayS3[0])
    ) {
      return []
    }

    return thumbnailUrlsArray
      ?.map(thumbnailUrls => {
        // Original order of the thumbnail urls is not kept
        // in the thumbnailUrlsArrayS3 returned from Promise.all
        // We need to place items back in the same order as in the thumbnailUrlsArray
        const isDefault = thumbnailUrls.isDefault
        const thumbnailUrlsS3 = thumbnailUrlsArrayS3.find(thumbnailUrlsS3 =>
          isDefault
            ? thumbnailUrlsS3?.isDefault
            : thumbnailUrlsS3?.thumbnailUrl === thumbnailUrls?.thumbnailUrl,
        )
        return {
          originalUrl: thumbnailUrlsS3?.originalUrl,
          thumbnailUrl: thumbnailUrlsS3?.s3ThumbnailURL,
          isDefault: thumbnailUrlsS3?.isDefault,
        }
      })
      ?.filter(thumbnailUrlS3 => !isEmpty(thumbnailUrlS3.thumbnailUrl))
  },

  /**
   * Updates message urlPreview and unEditedUrlPreview with S3 thumbnail urls
   * @param messageId The id of the message being updated
   * @param urlPreview The preview object to update
   * @param onPreviewUpdate The composer message action to call after thumbnail upload
   * @param fieldValidation message validation to update if thumbnail upload failed
   * urlPreview is updated with S3 urls
   */
  updateMessageURLPreviewWithS3ThumbnailURL(
    messageId: number,
    urlPreview: URLPreview,
    onPreviewUpdate: (id: number, updates: Record<string, any>) => void,
    fieldValidation?: FieldValidations, // Remove with PUB_30706_LINK_SETTINGS_PNE
  ) {
    let linkPreview = cloneDeep(urlPreview)
    const { thumbnailUrl, thumbnailUrls } = linkPreview
    const thumbnailsToUpload: Array<ThumbnailURLs & { isDefault?: boolean }> = thumbnailUrls || []
    let shouldSetThumbnailUrl = false

    if (!isEmpty(thumbnailUrls) || !isEmpty(thumbnailUrl)) {
      // Remove thumbnail warning before attempting to upload thumbnails
      const updatedValidation = ValidationUtils.removeErrors(fieldValidation, [
        CUSTOM_ERRORS.FE_PREVIEW_THUMBNAIL_UNAVAILABLE,
      ])
      if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
        onPreviewUpdate(messageId, {
          [Constants.FIELD_TO_UPDATE.UN_EDITED_URL_PREVIEW]: { hasError: false, hasWarning: false },
          [Constants.FIELD_TO_UPDATE.URL_PREVIEW]: { hasError: false, hasWarning: false },
        })
      } else {
        onPreviewUpdate(messageId, {
          [Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS]: updatedValidation,
        })
      }

      if (!isEmpty(thumbnailUrl)) {
        // Combining urlPreview.thumbnailUrl string with urlPreview.thumbnailUrls array
        // So we could feed this combined array into the media service.
        // We're adding isDefault field here, so we could find updated thumbnailUrl
        // later and set it on the urlPreview level
        thumbnailsToUpload.push({ thumbnailUrl, isDefault: true })
        shouldSetThumbnailUrl = true
      }

      this.getThumbnailURLsWithS3URLs(thumbnailsToUpload).then(thumbnailUrlsS3 => {
        let updatedFieldValidation = {}
        // Reset preview if nothing was returned from the streaming service
        if (isEmpty(thumbnailUrlsS3)) {
          updatedFieldValidation = fieldValidation
          linkPreview = {
            ...urlPreview,
            thumbnailUrls: [],
            thumbnailUrl: null,
            ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && {
              hasError: false,
              hasWarning: true,
            }),
          }
        } else {
          // We need to find the thumbnailUrl that was added earlier with isDefault = true
          // And set it on the urlPreview level
          let defaultThumbnailUrl: string = null
          if (shouldSetThumbnailUrl) {
            defaultThumbnailUrl = thumbnailUrlsS3.find(
              thumbnailUrlS3 => thumbnailUrlS3.isDefault,
            )?.thumbnailUrl
          }

          const thumbnailUrlsWithoutEmptyValues = thumbnailUrlsS3
            .filter(thumbnailUrlS3 => {
              return !isEmpty(thumbnailUrlS3.thumbnailUrl) && !thumbnailUrlS3.isDefault
            })
            .map(thumbnailUrlS3 => {
              delete thumbnailUrlS3.isDefault
              return thumbnailUrlS3
            })
          linkPreview = {
            ...urlPreview,
            thumbnailUrls: thumbnailUrlsWithoutEmptyValues,
            thumbnailUrl: defaultThumbnailUrl,
            ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && {
              hasError: false,
              hasWarning: false,
            }),
          }
        }

        if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
          onPreviewUpdate(messageId, {
            [Constants.FIELD_TO_UPDATE.UN_EDITED_URL_PREVIEW]: linkPreview,
            [Constants.FIELD_TO_UPDATE.URL_PREVIEW]: linkPreview,
          })
        } else {
          onPreviewUpdate(messageId, {
            [Constants.FIELD_TO_UPDATE.UN_EDITED_URL_PREVIEW]: { ...linkPreview },
            [Constants.FIELD_TO_UPDATE.URL_PREVIEW]: { ...linkPreview },
            ...(!isEmpty(updatedFieldValidation) && {
              [Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS]: updatedFieldValidation,
            }),
          })
        }
      })
    } else {
      // No thumbnails were provided to render
      if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
        // No thumbnail was provided due to failed link scraping - preserve existing error
        let updatedLinkPreview: URLPreview
        if (linkPreview.hasError) {
          updatedLinkPreview = linkPreview
        } else {
          // Link scraping succeeded but no thumbnail was returned - show warning
          updatedLinkPreview = {
            ...linkPreview,
            hasError: false,
            hasWarning: true,
          }
        }
        onPreviewUpdate(messageId, {
          [Constants.FIELD_TO_UPDATE.UN_EDITED_URL_PREVIEW]: updatedLinkPreview,
          [Constants.FIELD_TO_UPDATE.URL_PREVIEW]: updatedLinkPreview,
        })
      } else {
        onPreviewUpdate(messageId, {
          [Constants.FIELD_TO_UPDATE.UN_EDITED_URL_PREVIEW]: urlPreview,
          [Constants.FIELD_TO_UPDATE.URL_PREVIEW]: urlPreview,
          [Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS]: fieldValidation,
        })
      }
    }
  },

  /**
   * Applies a link shortener to all provided links
   *
   * @param previousLinks The link settings previously existed in the message
   * @param newLinks The link settings detected in the updated message
   *
   * @return detected link settings with applied shortener
   */
  applyLinkShortenerOnMessageChange(newLinks: LinkSettings, previousLinks: LinkSettings): LinkSettings {
    const areAllPrevLinksShortened =
      !isEmpty(previousLinks) &&
      !previousLinks?.find(previousLink => previousLink.linkShortenerId !== previousLinks[0].linkShortenerId)

    if (!areAllPrevLinksShortened) return newLinks

    return newLinks.map(newLink => {
      newLink.linkShortenerId = previousLinks[0].linkShortenerId
      return newLink
    })
  },

  /**
   * Applies default or organization preset to the newly added link settings if no campaign selected.
   * Applies link shortener to all new links if no preset provided and all
   * previous links have the same link shortener
   *
   * @param linkSettingsPresetId Custom preset id
   * @param presets An array of presets available to this user
   * @param linkDiff New link settings that are being added to the message
   * @param previousLinks The link settings previously existed in the message
   * @param newLinks The link settings detected in the updated message
   * @param onChangePreset A function that sets selected preset in the Composer component
   *
   * @return combined new and existing link settings with applied preset and preset id
   */
  applyOrgPresetOnMessageChange(
    linkSettingsPresetId: number,
    presets: Preset[],
    linkDiff: LinkSettings,
    previousLinks: LinkSettings,
    newLinks: LinkSettings,
    onChangePreset: (preset: Preset) => void,
  ): { linkSettings: LinkSettings; linkSettingsPresetId: number } {
    const defaultPreset = presets.find(preset => preset.isDefault)
    const selectedPreset = presets.find(preset => preset.id === linkSettingsPresetId)
    const shouldReturnLinkDiff = isEmpty(previousLinks)

    // If a preset is available => apply it to the link difference, combine with newly detected links
    if (linkSettingsPresetId) {
      const linkDiffWithPreset: LinkSettings = LinkSettingsUtils.applyPreset(selectedPreset, linkDiff)
      return {
        linkSettings: shouldReturnLinkDiff
          ? linkDiffWithPreset
          : this.combineLinkSettings(newLinks, linkDiffWithPreset),
        linkSettingsPresetId,
      }
      // If default preset is available => apply it to the link difference, combine with newly detected links
    }
    if (defaultPreset) {
      onChangePreset(defaultPreset)
      const linkDiffWithPreset = LinkSettingsUtils.applyPreset(defaultPreset, linkDiff)
      return {
        linkSettings: shouldReturnLinkDiff
          ? linkDiffWithPreset
          : this.combineLinkSettings(newLinks, linkDiffWithPreset),
        linkSettingsPresetId: defaultPreset.id,
      }
    }
    // If all previous links shortened with the same shortener and no preset found => apply the same
    // link shortener to all detected links
    return {
      linkSettings: this.applyLinkShortenerOnMessageChange(newLinks, previousLinks),
      linkSettingsPresetId: null,
    }
  },

  /**
   * Updates detected in the text links with any extra settings based on the user entitlements
   * and/or currently selected campaign on every message text change
   * @param newLinks detected link settings
   * @param previousLinks previous link settings
   * @param linkDiff difference between newLinks and previousLinks
   * @param linkSettingsPresetId
   * @param selectedCampaign
   * @param presets available in currently selected organization
   * @param onChangePreset
   * @param hasSelectedOrganization
   * @param isLinkSettingsEntitlementEnabled
   * @param shouldUseLocalPreset
   * @param localPreset
   * @returns An object with updated linkSettings and linkSettingsPresetId
   */
  updateLinkSettingsOnMessageChange(
    newLinks: LinkSettings,
    previousLinks: LinkSettings,
    linkDiff: LinkSettings,
    linkSettingsPresetId: number,
    selectedCampaign: Campaign,
    presets: Array<Preset>,
    onChangePreset: (preset: Preset) => void,
    hasSelectedOrganization: boolean,
    isLinkSettingsEntitlementEnabled: number | boolean,
    shouldUseLocalPreset: boolean,
    localPreset?: Preset,
  ): { linkSettings: LinkSettings; linkSettingsPresetId: number } {
    const didAddNewLinks = (isEmpty(previousLinks) && !isEmpty(newLinks)) || !isEmpty(linkDiff)
    const selectedCampaignHasValidLinkSettings = !!presets?.find(
      preset => preset.id === selectedCampaign?.preset?.id,
    )
    const hasCampaignWithValidPreset =
      !isNil(selectedCampaign?.preset) && selectedCampaignHasValidLinkSettings
    const hasOrganizationWithPreset =
      hasSelectedOrganization && isLinkSettingsEntitlementEnabled && !isEmpty(presets)

    if (!didAddNewLinks) {
      return {
        linkSettings: newLinks,
        linkSettingsPresetId,
      }
    }

    if (hasCampaignWithValidPreset) {
      return this.applyCampaignPresetOnMessageChange(
        linkSettingsPresetId,
        selectedCampaign.preset,
        presets,
        linkDiff,
        previousLinks,
        newLinks,
      )
    }

    if (hasOrganizationWithPreset) {
      return this.applyOrgPresetOnMessageChange(
        linkSettingsPresetId,
        presets,
        linkDiff,
        previousLinks,
        newLinks,
        onChangePreset,
      )
    }

    if (shouldUseLocalPreset) {
      const linkDiffWithPreset = LinkSettingsUtils.applyPreset(localPreset, linkDiff)
      return {
        linkSettings: isEmpty(previousLinks)
          ? linkDiffWithPreset
          : this.combineLinkSettings(newLinks, linkDiffWithPreset),
        linkSettingsPresetId: localPreset.id,
      }
    }

    return {
      linkSettings: newLinks,
      linkSettingsPresetId,
    }
  },

  /**
   * Applies link settings and/or link preset id to base message
   * and inner message links, and returns updated link settings
   * @param selectedMessage
   * @param linkSettingsUpdated Link settings to apply to the message links
   * @param linkSettingsPresetIdUpdated Link preset id to apply to the message
   * @returns An object with updated linkSettings and linkSettingsPresetId
   */
  getLinkSettingsWithPresetApplied(
    selectedMessage: Message,
    linkSettingsUpdated?: LinkSettings | null,
    linkSettingsPresetIdUpdated?: number | null,
  ): {
    baseMessage: { linkSettings?: LinkSettings; linkSettingsPresetId?: number }
    [snType: string]: { linkSettings?: LinkSettings; linkSettingsPresetId?: number }
  } {
    const pneLinkSettings = {}

    const linkSettings = isUndefined(linkSettingsUpdated) ? {} : { linkSettings: linkSettingsUpdated }
    const linkSettingsPresetId = isUndefined(linkSettingsPresetIdUpdated)
      ? {}
      : { linkSettingsPresetId: linkSettingsPresetIdUpdated }
    if (selectedMessage.selectedNetworkGroup) {
      // Applying preset id or link settings on SN tab
      if (selectedMessage.getSocialNetworkGroups()?.length > 1) {
        selectedMessage.messages.forEach(m => {
          if (MessageUtils.isNetworkTypeInGroup(m.snType, selectedMessage.selectedNetworkGroup)) {
            pneLinkSettings[m.snType] = {
              ...linkSettings,
              ...linkSettingsPresetId,
            }
          } else {
            pneLinkSettings[m.snType] = {
              linkSettings: m?.linkSettings,
              linkSettingsPresetId: m?.linkSettingsPresetId,
            }
          }
        })

        return {
          baseMessage: {
            linkSettings: selectedMessage.baseMessage?.linkSettings,
            linkSettingsPresetId: selectedMessage.baseMessage?.linkSettingsPresetId,
          },
          ...pneLinkSettings,
        }
        // Applying preset id or link settings on SN tab with multiple SNs of the same group selected
      } else {
        selectedMessage?.messages.forEach(m => {
          pneLinkSettings[m.snType] = {
            ...linkSettings,
            ...linkSettingsPresetId,
          }
        })
        return {
          baseMessage: {
            ...linkSettings,
            ...linkSettingsPresetId,
          },
          ...pneLinkSettings,
        }
      }
    } else {
      // Applying preset id or link settings on the Initial content tab
      selectedMessage?.messages.forEach(m => {
        if (
          LinkUtils.haveLinkSettingsDiverged(selectedMessage.baseMessage, m) ||
          MessageUtils.hasMessageTemplateDiverged(selectedMessage.baseMessage, m)
        ) {
          pneLinkSettings[m.snType] = {
            linkSettings: m.linkSettings,
            linkSettingsPresetId: m.linkSettingsPresetId,
          }
        } else {
          pneLinkSettings[m.snType] = {
            ...linkSettings,
            ...linkSettingsPresetId,
          }
        }
      })

      return {
        baseMessage: {
          ...linkSettings,
          ...linkSettingsPresetId,
        },
        ...pneLinkSettings,
      }
    }
  },

  /**
   * Determines if link preview customization should be enabled
   * @param message A message wrapper
   * @param socialNetworksToDisplay All social networks currently selected
   * @param facebookAllowsCustomization ture if a verified Facebook Page is selected
   * @param facebookPageIds an array of Facebook profile ids
   * @returns true if
   * 1. On Initial content tab and either LinkedIn or verified Facebook Page is selected, and
   * SN preview url is the same as Initial content preview url; or
   * 2. On LinkedIn tab; or
   * 3. On Facebook tab and a verified Facebook Page is selected
   */
  canCustomizeLinkPreview(
    message: Message,
    socialNetworksToDisplay: string[],
    facebookAllowsCustomization?: boolean,
    facebookPageIds?: number[],
  ) {
    // Allow to edit preview on Initial content tab only if SN preview link is the same as on Initial content tab
    const isOnInitContentTab = !message?.selectedNetworkGroup

    if (isOnInitContentTab) {
      const hasLinkedInNetwork = ComposerUtils.hasLinkedInNetwork(...socialNetworksToDisplay)
      const hasFacebookNetworkAndAllowsCustomization =
        !isEmpty(facebookPageIds) && facebookAllowsCustomization
      const linkedInPreview = hasLinkedInNetwork
        ? MessageUtils.getInnerMessageFromGroup(message.messages, SocialProfileConstants.SN_GROUP.LINKEDIN)
            ?.linkPreview
        : null
      const facebookPreview = hasFacebookNetworkAndAllowsCustomization
        ? MessageUtils.getInnerMessageFromGroup(message.messages, SocialProfileConstants.SN_GROUP.FACEBOOK)
            ?.linkPreview
        : null

      if (facebookPreview || linkedInPreview) {
        const snPreviewUrl = facebookPreview ? facebookPreview?.originalUrl : linkedInPreview?.originalUrl
        return message.baseMessage?.urlPreview?.originalUrl === snPreviewUrl
      }
    }

    return (
      (!isEmpty(facebookPageIds) && facebookAllowsCustomization) ||
      message?.selectedNetworkGroup === SocialProfileConstants.SN_GROUP.LINKEDIN
    )
  },
}

export default LinkUtils
