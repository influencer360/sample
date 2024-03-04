import { willGetScheduledCampaign as willGetScheduledBoostCampaign } from 'fe-ae-lib-boost-api/dist/v2'

import { willGetDraftBoostCampaign } from 'fe-ae-lib-boost-api'
import axios from 'fe-axios'
import { LINK_SETTINGS_ADVANCED } from 'fe-lib-entitlements'
import { logError } from 'fe-lib-logging'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import { actions as ComposerMessageActions } from 'fe-pnc-data-composer-message'
import { hasEntitlement } from 'fe-pnc-data-entitlements'
import { actions as mediaLibraryActions } from 'fe-pnc-data-media-library'
import {
  getProfilesV2,
  getState as getSocialProfilesStoreState,
  populateStore,
} from 'fe-pnc-data-social-profiles-v2'
import {
  getActiveCampaignsByOrganizationId,
  getPresets,
  getSuggestedTagsByOrganizationId,
  getTagsByOrganizationId,
  setPublisherSetting,
} from 'fe-pnc-lib-api'

import translation from 'fe-pnc-lib-hs-translation'
import { LinkSettingsUtils } from 'fe-pnc-lib-utils'
import { CampaignsUtils } from 'fe-pnc-lib-utils'

import ComposerConstants from '@/constants/composer'
import Constants from '@/constants/constants'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import { composerActions } from '@/redux/reducers/composer'
import { validationActions } from '@/redux/reducers/validation'
import { AppDispatch } from '@/redux/store'
import { Flux, PublisherSettings } from '@/typings/Flux'
import AbortionError from '@/utils/abortion-error'
import ComposerUtils from '@/utils/composer-utils'
import { isPlannerView } from '@/utils/dashboard-utils'

import statusObject, { StatusObject } from './status-bar'
import ValidationUtils from './validation-utils'

const FRESHNESS_MS = 5 * 60 * 1000 // 5 minutes
let lastUpdated = 0
let lastOrgId

const markStatusShownAndReThrow = e => {
  e.hasStatusBeenShown = true
  throw e
}

class ComposerDataFetcher {
  facadeApiUrl: string
  flux: Flux
  memberId: number
  statusObj: StatusObject

  constructor(flux, facadeApiUrl, memberId) {
    this.facadeApiUrl = facadeApiUrl
    this.flux = flux
    this.memberId = memberId

    this.statusObj = statusObject
  }

  static isComposerDataForOrganizationStale(organization) {
    const hasOrgChanged = Boolean(organization && organization.organizationId !== lastOrgId)
    const isDataStale = Date.now() - lastUpdated > FRESHNESS_MS
    return isDataStale || hasOrgChanged
  }

  /**
   * Fetches the campaign data for the org
   * @param {object} orgData
   * @return {Promise<*>}
   */
  async fetchCampaigns(orgData) {
    const orgId = orgData.organizationId

    let campaignsData
    try {
      campaignsData = await getActiveCampaignsByOrganizationId(orgId)
    } catch (e) {
      if (!axios.isCancel(e)) {
        this.statusObj.update(translation._('Unable to retrieve campaigns'), 'error', true)
        markStatusShownAndReThrow(e)
      }
    }

    return campaignsData
  }

  /**
   * Sets the campaignsData in the store
   * @param {object} campaignsData
   * @param {object} presets
   * @param {object} tags
   */
  setCampaignsData(campaignsData, presets, tags) {
    if (campaignsData && campaignsData.campaigns && Array.isArray(campaignsData.campaigns)) {
      const newCampaigns = campaignsData.campaigns.map(campaign =>
        CampaignsUtils.createCampaignResponseToCampaign(campaign, {
          presets,
          tags,
        }),
      )
      this.flux.getActions('campaigns').setCampaigns(newCampaigns)
    }
  }

  /**
   * Fetches the presets for the org
   * @param {object} orgData
   * @return {Promise<*>}
   */
  async fetchPresets(orgData) {
    const orgId = orgData.organizationId

    let presets
    try {
      const presetsData = await getPresets(orgId)
      presets = presetsData.presets
      const modifiedPresets = presets?.map(preset => {
        return LinkSettingsUtils.convertLinkSettingsToFrontendFriendlyValues(preset)
      })
      this.flux.getActions('presets').setPresets(modifiedPresets)
    } catch (e) {
      if (!axios.isCancel(e)) {
        this.statusObj.update(translation._('Unable to retrieve link setting presets'), 'error', true)
        markStatusShownAndReThrow(e)
      }
    }

    return presets
  }

  /**
   * Fetches the tags and suggest tags for the org
   * @param {object} orgData
   * @return {Promise<{tags: *, suggestedTags: *}>}
   */
  async fetchTags(orgData) {
    const orgId = orgData.organizationId

    try {
      const [tags, suggestedTags] = await Promise.all([
        getTagsByOrganizationId(orgId),
        getSuggestedTagsByOrganizationId(orgId),
      ])

      if (tags && Array.isArray(tags)) {
        this.flux.getActions('tags').setTags(tags)
      }

      if (suggestedTags && suggestedTags.recentTags && Array.isArray(suggestedTags.recentTags)) {
        this.flux.getActions('tags').setSuggestedTags(suggestedTags.recentTags)
      }

      return { tags, suggestedTags }
    } catch (e) {
      if (!axios.isCancel(e)) {
        this.statusObj.update(translation._('Unable to retrieve tags and suggested tags'), 'error', true)
        markStatusShownAndReThrow(e)
      }
    }
  }

  updateSocialProfilesFluxStore(socialProfiles, privateSocialProfiles) {
    if (socialProfiles) {
      this.flux.getActions('socialNetworkProfiles').setSocialProfiles(socialProfiles)
    }
    if (privateSocialProfiles) {
      this.flux.getActions('socialNetworkProfiles').setPrivateSocialProfiles(privateSocialProfiles)
    }
  }

  /**
   * Fetches the social profile for the org if provided otherwise gets all for the member
   * @param {object} orgData
   * @return {Promise<{socialProfiles: *}>}
   */
  async fetchSocialProfiles(orgData) {
    try {
      const getProfilesV2Data = await getProfilesV2(orgData && orgData.organizationId)

      populateStore(getProfilesV2Data)

      const { privateSocialProfiles, socialProfiles } = getProfilesV2Data

      this.updateSocialProfilesFluxStore(socialProfiles, privateSocialProfiles)

      return { socialProfiles }
    } catch (e) {
      if (!AbortionError.isAbortionError(e)) {
        this.statusObj.update(translation._('Unable to fetch social accounts'), 'error', true)
        markStatusShownAndReThrow(e)
      }
    }
  }

  async fetchBoostCampaign({ message, isDuplicate = false }) {
    const { id: messageId, messageType, isBoosted } = message
    let boostCampaign

    try {
      if (messageType === Constants.TYPE.DRAFT) {
        boostCampaign = await willGetDraftBoostCampaign(messageId)
      } else {
        boostCampaign = await willGetScheduledBoostCampaign(message.getBoostSocialNetwork(), messageId)
      }

      // Format the response from ad promotion service and validate campaign
      boostCampaign.social_profile_id = boostCampaign.social_profile_info.social_profile_id // eslint-disable-line camelcase
      boostCampaign.social_network = boostCampaign.social_profile_info.social_network // eslint-disable-line camelcase

      if (boostCampaign.social_network === SocialProfileConstants.SN_TYPES.INSTAGRAM) {
        boostCampaign.instagram_spec.targeting = JSON.stringify(boostCampaign.instagram_spec.targeting)
      }
      if (boostCampaign.social_network === SocialProfileConstants.SN_TYPES.FACEBOOK) {
        boostCampaign.facebook_spec.targeting = JSON.stringify(boostCampaign.facebook_spec.targeting)
      }
      if (boostCampaign.social_network === SocialProfileConstants.SN_TYPES.LINKEDIN) {
        // eslint-disable-next-line camelcase
        boostCampaign.linkedin_spec.targeting_criteria = JSON.stringify(
          // eslint-disable-line camelcase
          boostCampaign.linkedin_spec.targeting_criteria,
        )
      }
    } catch (e) {
      if (!AbortionError.isAbortionError(e)) {
        // If isDuplicate and isBoosted but no boostCampaign was receied it's sendNow message and we shouldn't display the toast
        const isSendNowBoostedPost = isDuplicate && isBoosted && !boostCampaign
        if (!isSendNowBoostedPost) {
          this.statusObj.update(translation._('Unable to fetch boost campaign'), 'error', true)
          markStatusShownAndReThrow(e)
        }
      }
    }
    if (boostCampaign) {
      const fieldsToUpdate = this.getFieldsToUpdateForBoostCampaign({ message, boostCampaign, isDuplicate })
      ComposerMessageActions.updateFieldsById(messageId, fieldsToUpdate)
    }
    return boostCampaign
  }

  getFieldsToUpdateForBoostCampaign({ message, boostCampaign, isDuplicate }) {
    const fieldToSet = isDuplicate
      ? Constants.FIELD_TO_UPDATE.BOOST_CAMPAIGN
      : Constants.FIELD_TO_UPDATE.SAVED_BOOST_CAMPAIGN
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, camelcase
    const { id, social_profile_info, ...boostCampaignForDuplicate } = boostCampaign
    const boostCampaignToSet = isDuplicate ? boostCampaignForDuplicate : boostCampaign

    return {
      [fieldToSet]: boostCampaignToSet,
      [Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS]: ValidationUtils.validateBoostCampaign(
        message.fieldValidations,
        undefined,
        {
          isVideoMessage: message.hasVideoAttachment(),
          sendDate: message.sendDate,
        },
      ),
    }
  }

  /**
   * prepare composer messages store with initial base composerMessage
   * @param {Message} message
   */
  prepareComposerBaseMessage(message) {
    const composerMessageActions = ComposerMessageActions
    if (message) {
      composerMessageActions.set([message])
      composerMessageActions.selectById(message.id)
    } else {
      composerMessageActions.set([ComposerUtils.createMessage()])
      composerMessageActions.selectById(ComposerConstants.BASE_MESSAGE_ID)
    }

    mediaLibraryActions.reset()
  }

  /**
   * method to load and setup data needed for full screen composer render
   * @param {object} fetchingOptions
   * @param {object} fetchingOptions.organization
   * @param {Message} fetchingOptions.message
   * @param {boolean} fetchingOptions.forceFetch - forces fetching of the data ignoring isComposerDataForOrganizationStale checks
   * @param {boolean} fetchingOptions.isDuplicate - flag to identify the message duplication
   * @return {object}
   */
  async fetchDataForFullScreenComposer({ organization, message, forceFetch = false, isDuplicate = false }) {
    this.prepareComposerBaseMessage(message)

    const promises = []

    if (organization) {
      // This is called on org change so set the selected org if there is one
      this.flux.getActions('organizations').setSelectedOrganization(organization.organizationId)

      promises.push(this.fetchCampaigns(organization))

      const hasEntitlementsForAdvancedLinkSettings = await hasEntitlement(
        this.memberId,
        LINK_SETTINGS_ADVANCED,
      )

      if (hasEntitlementsForAdvancedLinkSettings) {
        promises.push(this.fetchPresets(organization))
      }
      promises.push(this.fetchTags(organization))
    }

    // Planner already fetches the social profiles and populates the store so the
    // social profiles do not need to be re-fetched on initial Composer load
    if (isPlannerView()) {
      this.updateSocialProfilesFluxStore(
        getSocialProfilesStoreState().profiles,
        getSocialProfilesStoreState().private,
      )
    } else {
      // can still be called without the orgId. If so it will return all the social networks
      promises.push(this.fetchSocialProfiles(organization))
    }

    if (message && message.isBoosted) {
      promises.push(this.fetchBoostCampaign({ message, isDuplicate }))
    }

    const handlePromisesFulfilled = promiseData => {
      lastUpdated = Date.now()
      lastOrgId = organization && organization.organizationId

      // if there's an org pass back all the data
      if (organization) {
        const campaignsData = promiseData[0]
        const presets = promiseData[1]
        const tagsData = promiseData[2]
        this.setCampaignsData(campaignsData, presets, tagsData.tags)

        return {
          promiseData,
          presets,
          tags: tagsData.tags,
          suggestedTags: tagsData.suggestedTags,
          campaignsData,
          wasDataStale: true,
        }
      }

      return {
        wasDataStale: true,
      }
    }

    if (!ComposerDataFetcher.isComposerDataForOrganizationStale(organization) && !forceFetch) {
      await Promise.all(promises).then(handlePromisesFulfilled)
    } else {
      try {
        // Replace this with a simple assignment when all dls are removed;
        const promiseData = await Promise.all(promises)

        return handlePromisesFulfilled(promiseData)
      } catch (e) {
        // all errors should be caught and handled by the individual fetch functions
        // this is to prevent isComposerDataForOrganizationStale from returning false if there was an error in fetching any data
        // the error is re-thrown as its the expected behaviour from this function
        throw e
      }
    }

    return {
      wasDataStale: true,
    }
  }
}

const MANUAL_MODE = 'manual'
const RECOMMENDED_MODE = 'recommended'
/**
 * Update the Composer store based on previously saved data (publisherSettings)
 */
export const dispatchFromPublisherSettings = (
  publisherSettings: PublisherSettings,
  dispatch: AppDispatch,
) => {
  if (!publisherSettings) {
    // No data was previously saved in publisherSettings
    return
  }

  const { ignoredPreviewValidationMessageCodes, shouldShortenUrlsInBulk, defaultRecommendedTimesMode } =
    publisherSettings

  if (defaultRecommendedTimesMode === MANUAL_MODE || defaultRecommendedTimesMode === RECOMMENDED_MODE) {
    dispatch(composerActions.setDefaultRecommendedTimesMode(defaultRecommendedTimesMode))
  }

  if (Array.isArray(ignoredPreviewValidationMessageCodes)) {
    dispatch(validationActions.setIgnoredPreviewValidationMessageCodes(ignoredPreviewValidationMessageCodes))
  }

  if (typeof shouldShortenUrlsInBulk == 'boolean') {
    dispatch(composerActions.setShouldShortenUrlsInBulk(shouldShortenUrlsInBulk))
  }
}

/**
 * Makes a POST request to /ajax/member/set-publisher-setting to persist data across sessions.
 * Data is set on the global hs.memberExtras.publisherSettings namespace
 *
 * Data should be initialized in the Composer store in initializePublisherSettings
 */
export const savePublisherSetting = (settingName: string, value: unknown) => {
  return new Promise((resolve, reject) => {
    setPublisherSetting({
      settingName,
      value,
    })
      .then(resolve(value))
      .catch(e => {
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, `Failed setting ${settingName}`, {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
        reject()
      })
  })
}

export default ComposerDataFetcher
