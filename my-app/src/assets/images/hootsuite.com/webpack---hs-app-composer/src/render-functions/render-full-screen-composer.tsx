/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import ReactDOM from 'react-dom'

import { TYPE_ERROR } from 'fe-comp-banner'
import {
  AUTO_SCHEDULE_MESSAGE,
  INSTAGRAM_STORIES,
  LINK_SETTINGS_ADVANCED,
  RECOMMENDED_TIMES_TO_POST,
  SCHEDULE_MESSAGES,
  VIDEO_TRANSCODING,
} from 'fe-lib-entitlements'
import { emit } from 'fe-lib-hootbus'
import { get } from 'fe-lib-localstorage'
import { logError } from 'fe-lib-logging'
import { LongtaskObserver } from 'fe-lib-longtask-observer'
import { recordIncrement, recordTiming } from 'fe-lib-recording'
import { provisionIndex } from 'fe-lib-zindex'
import { maximize, store as composerModalStore } from 'fe-pnc-comp-composer-modal'
import { removeLoadingModal, showLoadingModal } from 'fe-pnc-comp-loading-modal'
import { getState as getComposerMessageState } from 'fe-pnc-data-composer-message'
import { getPermissionValueForMember, getPermissionsForMember } from 'fe-pnc-data-entitlements'
import { actions as MessagePreviewsActions } from 'fe-pnc-data-message-previews'
import {
  setOrganizations,
  setSelectedOrganization,
  store as OrganizationStore,
} from 'fe-pnc-data-organizations'
import { getMessage, getNativeMessage } from 'fe-pnc-lib-api'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import { trackExperiment } from 'fe-pnc-lib-digital-enablement'
import translation from 'fe-pnc-lib-hs-translation'
import { NativePostId } from 'fe-pnc-lib-utils'
import ValidationErrorMessages, { mapOverlappingErrorCodes } from 'fe-pnc-validation-error-messages'
import { renderDisregardMessageModal } from '@/components/composer/composer-message-modals'
import FullScreenComposer from '@/components/full-screen-composer/full-screen-composer'
import ComposerConstants from '@/constants/composer'
import { FEATURE_CODES } from '@/constants/entitlements'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import METRIC_NAMES from '@/constants/metric-names'
import TrackingConstants from '@/constants/tracking'
import { composerActions } from '@/redux/reducers/composer'
import { StoreProvider, store } from '@/redux/store'
import type { FluxStore, MemberExtras } from '@/typings/Flux'
import AbortionError from '@/utils/abortion-error'
import ComposerDataFetcher from '@/utils/composer-data-fetcher'
import ComposerUtils from '@/utils/composer-utils'
import { isPlannerView } from '@/utils/dashboard-utils'
import { getOrganizationLogoSrc } from '@/utils/organization-utils'
import statusObject from '@/utils/status-bar'
import StatusToastUtils from '@/utils/status-toast-utils'
import {
  generateSessionId,
  setCrossProductSessionId,
  getTrackingActionsByMessageType,
  track,
} from '@/utils/tracking'

let onMinimize
let customContextKey
let creatorNameFromDraft
let onSaveTemplate
let contentSourceId
let zIndexNumber
let onDataLoadedLocal

const LAST_USED_ORGANIZATION_ID = 'pnc_preferences_last_used_organization_id'

const DATA_FETCH_MARK_START = 'composer-data-fetch-start'
const DATA_FETCH_MARK_END = 'composer-data-fetch-end'
const DATA_FETCH_MEASURE = 'composer-data-fetch'
const BUNDLE_LOAD_MEASURE = 'full-screen-composer-loading-performance'
const recordDataFetchTime = () => {
  performance.clearMeasures(DATA_FETCH_MEASURE)
  performance.measure(DATA_FETCH_MEASURE, DATA_FETCH_MARK_START, DATA_FETCH_MARK_END)
  const measure = performance.getEntriesByName(DATA_FETCH_MEASURE)
  if (measure && Array.isArray(measure) && measure.length) {
    if (measure[0].duration > 0) {
      recordTiming('fullscreencomposer.performance.dataFetched', {
        value: measure[0].duration,
        statType: 'timing',
        splitByLocation: true,
      })
    }
  }
  performance.clearMarks(DATA_FETCH_MARK_END)
  performance.clearMarks(DATA_FETCH_MARK_START)
}

const recordTimeToInteractive = tti => {
  const dataLoadedMeasure = performance.getEntriesByName(DATA_FETCH_MEASURE)
  const bundleLoadedMeasure = performance.getEntriesByName(BUNDLE_LOAD_MEASURE)
  if (
    Array.isArray(dataLoadedMeasure) &&
    dataLoadedMeasure.length &&
    dataLoadedMeasure[0].duration > 0 &&
    Array.isArray(bundleLoadedMeasure) &&
    bundleLoadedMeasure.length &&
    bundleLoadedMeasure[0].duration > 0
  ) {
    const total = dataLoadedMeasure[0].duration + bundleLoadedMeasure[0].duration + tti
    // metric name based off of https://hootsuite.atlassian.net/wiki/spaces/PLATFORM/pages/80249000/Tracking+Time+to+Interactive+for+SLOs
    recordTiming('frontend.slo.histogram.500ms-0to10000.plancreate.composer.tti-new', {
      value: total,
      statType: 'timing',
      splitByLocation: true,
    })
  }
}

const { CONTENT_STATE } = ComposerConstants

const ERROR_LOADING_DRAFT = translation._('An unexpected error occurred trying to load the draft')
const ERROR_LOADING_MESSAGE = translation._('An unexpected error occurred trying to load the post')

const renderComposerFn = async ({
  customContextType,
  isEdit = false,
  isDuplicate = false,
  message,
  templateData,
  onCloseClicked = () => {},
  onMinimizeClicked = () => {},
  org,
  creatorName,
  onSaveTemplateClicked,
  contentTemplateId,
  onDataLoaded,
  // globals from the dashboard
  flux,
  saveToAmplify,
  canSendToAmplify,
  showAutoScheduleSettings,
  FluxComponent,
  derivedProps,
  isDraftAutoScheduled,
}) => {
  const origin = message?.origin
  const ideaId = message?.ideaId
  try {
    let parentNode = document.querySelector('#fullScreenComposerMountPoint')
    if (parentNode === null) {
      parentNode = document.createElement('div')
      parentNode.id = 'fullScreenComposerMountPoint'
      document.body.appendChild(parentNode)
    }

    if (typeof zIndexNumber !== 'number') {
      zIndexNumber = provisionIndex()
    }

    const {
      csrfToken,
      DataDrafts,
      facadeApiUrl,
      isDevOrStaging,
      language,
      memberEmail,
      memberId,
      memberInTrial,
      memberIsUsingLATM,
      memberName,
      memberSignupDate,
      organizationCount,
      socialNetworks,
      timezoneName,
    } = derivedProps

    const memberExtras = derivedProps.memberExtras as MemberExtras

    const socialNetworkTypesToExclude = await ComposerUtils.getSocialNetworkTypesToExclude(customContextType)

    const composerMessage = ComposerUtils.buildMessage({
      messageData: message,
      timezoneName,
      socialNetworks,
      socialNetworkTypesToExclude,
    })

    onDataLoadedLocal = onDataLoaded
    onMinimize = onMinimizeClicked
    onSaveTemplate = onSaveTemplateClicked
    if (isFeatureEnabled('PUB_12938_STATE_FARM_NC_URL_PARAMS')) {
      contentSourceId = contentTemplateId
    }
    customContextKey = customContextType
    creatorNameFromDraft = creatorName

    const fetchSelectedOrg = async function () {
      const groupByLabel = 'showTitle'
      const fluxOrganizationsStore = flux.getStore('organizations')
      const organizations = fluxOrganizationsStore.getSortedByOwner(memberId)
      let selectedOrg = OrganizationStore.getState().selectedOrganization
      if (!selectedOrg) {
        try {
          let orgsData
          if (organizations) {
            orgsData = organizations
          } else {
            orgsData = await flux.getActions('organizations').fetch(true)
          }
          selectedOrg = orgsData[Object.keys(orgsData)[0]]
        } catch (e: any) {
          if (!AbortionError.isAbortionError(e)) {
            statusObject.update(translation._('Unable to retrieve organizations'), 'error', true)

            logError(
              LOGGING_CATEGORIES.NEW_COMPOSER,
              'New Composer - Failed to render new composer while retrieving organizations',
              {
                errorMessage: JSON.stringify(e.message),
                stack: JSON.stringify(e.stack),
              },
            )
          }
        }
      }

      let orgs
      if (organizations) {
        // eslint-disable-next-line no-shadow
        orgs = organizations.map(org => ({
          ...org,
          showTitle: groupByLabel,
          logo: getOrganizationLogoSrc(org.logo),
        }))
      }

      const userPreferenceOrganizationId = get(LAST_USED_ORGANIZATION_ID, null)
      if (userPreferenceOrganizationId) {
        // eslint-disable-next-line eqeqeq
        selectedOrg = orgs.find(organization => organization.organizationId == userPreferenceOrganizationId) // using == because organization.organizationId is a number and userPreferenceOrganizationId a string
      }

      const shouldPopulateStore = !fluxOrganizationsStore.state.initialized

      if (shouldPopulateStore) {
        setOrganizations(orgs)
      }
      setSelectedOrganization(selectedOrg)

      return selectedOrg
    }

    const close = () => {
      ReactDOM.unmountComponentAtNode(parentNode)
      onCloseClicked()
    }

    const filterByContext = channelProfiles => {
      let channelProfilesForContext = channelProfiles
      // for AMPLIFY customContext we need all the channel profiles available
      if (customContextKey && !ComposerUtils.isAmplifyComposer(customContextKey)) {
        const customContextFilter = channel => channel.type === customContextKey
        channelProfilesForContext = channelProfiles.filter(customContextFilter)
      }
      return channelProfilesForContext
    }

    const filterGroupByContext = channelProfilesKeyedByType => {
      // for AMPLIFY customContext we need all the channel profiles available
      if (customContextKey && !ComposerUtils.isAmplifyComposer(customContextKey)) {
        return { [customContextKey]: channelProfilesKeyedByType[customContextKey] }
      } else {
        const filteredChannelProfiles = Object.assign({}, channelProfilesKeyedByType)
        socialNetworkTypesToExclude.forEach(type => {
          if (filteredChannelProfiles[type]) {
            delete filteredChannelProfiles[type]
          }
        })
        return filteredChannelProfiles
      }
    }

    const stores = {
      organizations: (store: FluxStore) => ({
        organizations: store.getSortedByOwner(memberId),
        orgStoreIsInitialized: store.state.initialized,
        selectedOrganization: store.state.selectedOrganization,
      }),
      presets: (store: FluxStore) => ({
        presets: store.get(),
      }),
      tags: (store: FluxStore) => ({
        tags: store.get(),
        suggestedTags: store.getSuggestedTags(),
      }),
      linkShorteners: (store: FluxStore) => ({
        linkShorteners: store.get(),
        shortenerConfigs: store.getConfigs(),
      }),
      /**
       * @deprecated Flux Social Networks are deprecated. Use the Social Profiles store instead
       */
      socialNetworks: (store: FluxStore) => ({
        socialNetworks: filterByContext(store.getCollection()),
      }),
      /**
       * @deprecated Flux Social Networks are deprecated. Use the Social Profiles store instead
       */
      socialNetworkProfiles: (store: FluxStore) => ({
        socialProfilesKeyedByType: filterGroupByContext(store.getSocialNetworksKeyedByType(null, null)),
        privateSocialProfiles: store.getPrivateSocialProfiles(socialNetworkTypesToExclude),
      }),
      campaigns: (store: FluxStore) => ({
        campaigns: store.get(),
      }),
    }

    const messageType = composerMessage && composerMessage.messageType
    const composerConf = await ComposerUtils.createComposerConf(
      customContextKey,
      isEdit,
      messageType,
      templateData,
    )
    const composerDataFetcher = new ComposerDataFetcher(flux, facadeApiUrl, memberId)

    let entitlements = {}

    if (isFeatureEnabled('PUB_31645_BULK_FETCH_COMPOSER_ENTITLEMENTS')) {
      entitlements = await getPermissionsForMember(memberId, FEATURE_CODES)
    } else {
      const fetchEntitlementsForFeatureCode = (featureCode: string) => {
        return getPermissionValueForMember(memberId, featureCode).then(entitlement => {
          entitlements[featureCode] = entitlement
        })
      }

      try {
        const entitlementsToFetch = [
          fetchEntitlementsForFeatureCode(SCHEDULE_MESSAGES),
          fetchEntitlementsForFeatureCode(LINK_SETTINGS_ADVANCED),
          fetchEntitlementsForFeatureCode(AUTO_SCHEDULE_MESSAGE),
          fetchEntitlementsForFeatureCode(VIDEO_TRANSCODING),
          fetchEntitlementsForFeatureCode(INSTAGRAM_STORIES),
          fetchEntitlementsForFeatureCode(RECOMMENDED_TIMES_TO_POST),
        ]
        await Promise.all(entitlementsToFetch)
      } catch (e: any) {
        if (!AbortionError.isAbortionError(e)) {
          statusObject.update(translation._('Unable to retrieve entitlements'), 'error', true)

          logError(
            LOGGING_CATEGORIES.NEW_COMPOSER,
            'New Composer - Failed to render new composer while retrieving entitlements',
            {
              errorMessage: JSON.stringify(e.message),
              stack: JSON.stringify(e.stack),
            },
          )
        }
      }
    }

    try {
      let selectedOrg
      if (organizationCount > 0) {
        selectedOrg = await fetchSelectedOrg() // this ensures the orgs store will be populated so we always make this call
        const orgs = flux.getStore('organizations').getImmutable().toJS()

        if (org) {
          // if we're given an org use it and trust in the caller
          selectedOrg = org
        } else if (composerMessage && orgs && Object.keys(orgs).length > 1) {
          // attempt at determining the org from the data
          selectedOrg = await ComposerUtils.determineOrgFromData(
            facadeApiUrl,
            memberId,
            composerMessage,
            orgs,
            selectedOrg,
          )
        }

        await setSelectedOrganization(selectedOrg)
      }

      performance.mark(DATA_FETCH_MARK_START)
      await composerDataFetcher.fetchDataForFullScreenComposer({
        organization: selectedOrg,
        message: composerMessage,
        forceFetch: false,
        isDuplicate,
      })
      performance.mark(DATA_FETCH_MARK_END)
      recordDataFetchTime()

      if (typeof onDataLoadedLocal === 'function') {
        onDataLoadedLocal()
      }
    } catch (e: any) {
      if (!AbortionError.isAbortionError(e)) {
        if (isDevOrStaging) {
          // eslint-disable-next-line no-console
          console.error(e)
        }
        if (!e.hasStatusBeenShown) {
          statusObject.update(translation._('An unexpected error occurred loading composer'), 'error', true)
        }

        logError(
          LOGGING_CATEGORIES.NEW_COMPOSER,
          'New Composer - Failed to render new composer data fetching',
          {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          },
        )
      }
    } finally {
      removeLoadingModal()
      if (composerModalStore.getState().isMinimized) {
        maximize()
      }
    }

    const onSelectNewOrganization = async orgData => {
      setSelectedOrganization(orgData)
      showLoadingModal()
      try {
        const newComposerMessage = ComposerUtils.buildMessage({
          messageData: {},
          timezoneName,
          socialNetworks,
          socialNetworkTypesToExclude,
        })
        store.dispatch(composerActions.resetSelectedNetworkGroup())

        await composerDataFetcher.fetchDataForFullScreenComposer({
          organization: orgData,
          message: newComposerMessage,
        })
      } catch (e: any) {
        logError(
          LOGGING_CATEGORIES.NEW_COMPOSER,
          'New Composer - Failed to render new composer org switching',
          {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          },
        )
      }
      removeLoadingModal()
    }

    const longtaskObserver = new LongtaskObserver()
    longtaskObserver
      .getTimeToInteractive({
        initialWindowDuration: 0.5,
        minimumWindowDuration: 0.5,
        minimumEstimatedTTI: 0,
      })
      .then(recordTimeToInteractive)
      .catch(() => {
        // do nothing. it is expected to fail for browsers other than Chrome});
      })

    ReactDOM.render(
      <StoreProvider>
        <FluxComponent connectToStores={stores} flux={flux}>
          <FullScreenComposer
            autoScheduleSettings={memberExtras.autoScheduleSettings}
            composerConf={composerConf}
            csrf={csrfToken}
            customContext={customContextKey}
            DataDrafts={DataDrafts}
            entitlements={entitlements}
            excludedNetworkTypes={socialNetworkTypesToExclude}
            facadeApiUrl={facadeApiUrl ? facadeApiUrl : ''}
            flux={flux}
            FluxComponent={FluxComponent}
            ideaId={ideaId}
            canSendToAmplify={canSendToAmplify}
            isDraftAutoScheduled={isDraftAutoScheduled}
            isDevOrStaging={isDevOrStaging}
            isEditMode={isEdit} // the isEditMode prop indicates that a message is being edited. it is optional and set to false by default
            isInCustomContext={!!customContextKey}
            isUsingLATM={memberIsUsingLATM}
            language={language}
            memberEmail={memberEmail}
            memberId={memberId}
            memberInTrial={memberInTrial}
            memberName={creatorNameFromDraft || memberName}
            memberSignupDate={memberSignupDate}
            message={composerMessage} // compared with selectedMessageForEdit to to determine if editing has occurred
            onClose={close}
            onMinimize={onMinimize}
            onSaveTemplate={onSaveTemplate}
            onSelectNewOrganization={onSelectNewOrganization}
            origin={origin}
            publisherSettings={memberExtras.publisherSettings}
            saveToAmplify={saveToAmplify}
            showAutoScheduleSettings={showAutoScheduleSettings}
            showCampaignsOnboarding={!memberExtras.hasSeenNewComposerCampaignsOnboarding}
            showOnboarding={!memberExtras.hasSeenNewComposerOnboarding}
            stateFarmContentSourceId={contentSourceId}
            templateData={templateData}
            timezoneName={timezoneName}
            zIndex={provisionIndex()}
          />
        </FluxComponent>
      </StoreProvider>,
      parentNode,
    )
    emit('full_screen_composer:response:open')
  } catch (e: any) {
    logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'New Composer - failed to render', {
      errorMessage: JSON.stringify(e.message),
      stack: JSON.stringify(e.stack),
    })

    e.logged = true
    recordIncrement(METRIC_NAMES.OPEN_COMPOSER_FAILED)
    e.failureRecorded = true
    throw e
  }
}

/**
 * The updated function with pared down props, now calling composer manager to derive props
 *
 * main function exported to be called to open the FullScreenComposer
 * Data needed to the rendering is retrieved in composerDataFetcher.fetchDataForFullScreenComposer
 * Flux store is prepared for the FullScreenComposer to connect to
 * @param {boolean} isEdit - indicates if composer is being used for edit
 * @param {object} draft - the draft
 * @param {string} draftId - the draft i
 * @param {string} messageId
 * @param {Message?} message - when the message is passed in that means the message is being edited or duplicated
 * @param {TemplateData?} templateData - provides additional information about the template used
 * @param {function} onCloseClicked - function reference
 * @param {function} onMinimizeClicked - function reference
 * @param {object?} org - optional the org to use for the initial fetch of data
 * @param {string} creatorName - name of the person who created the message
 * @param {function} onSaveTemplateClicked - function reference
 * @param {string} contentTemplateId - content template id
 * @param {function} onDataLoaded - function called when composer is done loading its data
 * @param {object} flux - dashboards flux object
 * @param {function} saveToAmplify - function to save a message to amplify
 * @param {boolean} canSendToAmplify - indicates if send to Amplify is enabled
 * @param {function} showAutoScheduleSettings - show autoschedule settings popup
 * @param {function} FluxComponent - the Flux HOC
 */
const renderFullScreenComposer = async ({
  // post
  message,
  // template
  templateData,
  // edit draft
  draft,
  draftId,
  // edit scheduled post
  messageId,
  isEdit = false,
  isDuplicate = false,
  org,
  // globals from dashboard
  onDataLoaded,
  saveToAmplify,
  canSendToAmplify,
  showAutoScheduleSettings,
  flux,
  FluxComponent,
  onSaveTemplateClicked,
  contentTemplateId,
  creatorName,
  customContextType,
  // empty callback functions
  onCloseClicked = () => {},
  onMinimizeClicked = () => {},
  // props grabbed by composer manager
  derivedProps,
}) => {
  showLoadingModal()
  const {
    DataDrafts,
    isDevOrStaging,
    memberId,
    memberInTrial,
    memberSignupDate,
    timezoneName,
    socialNetworks,
  } = derivedProps

  const isDraft = !!(draft || draftId)
  const isTemplate = message && ComposerUtils.isTemplate(message.messageType)
  const nativePost = NativePostId.fromContent(messageId)
  const isNativePost = !!nativePost

  const TRACKING_ACTIONS = getTrackingActionsByMessageType({ isDraft, isDuplicate, isEdit })
  const experimentMemberData = { memberId, memberInTrial, memberSignupDate }

  generateSessionId()
  if (message?.crossProductSessionId) {
    setCrossProductSessionId(message.crossProductSessionId)
  }

  //either take the field from 2 different structures without checking the specific types
  const getCreativeSources = attachments =>
    Array.isArray(attachments) &&
    attachments.map(attachment => attachment?.trackingSource ?? attachment?._trackingSource)

  const getMessageDetailsAndRender = async () => {
    let isPinterestMessage: boolean
    if (isDraft) {
      if (draftId && !draft) {
        // Coming from planner, no draft given so we need to get it
        try {
          const drafts = await DataDrafts.getDrafts(undefined, undefined, draftId)
          draft = drafts.find(d => d.draft.id === draftId)
        } catch (e) {
          if (isDevOrStaging) {
            // eslint-disable-next-line no-console
            console.error(e)
          }
          statusObject.update(ERROR_LOADING_DRAFT, 'error', true)
        }
      }

      customContextType = ComposerUtils.getCustomContextType(draft)
      isPinterestMessage = ComposerUtils.isPinterestComposer(customContextType)

      message = ComposerUtils.messageFromDraft(draft, timezoneName, socialNetworks)

      if (isPinterestMessage) {
        track(TrackingConstants.TRACKING_ORIGINS.DRAFT, TRACKING_ACTIONS.PINTEREST.OPENED, {}, true)
      } else {
        track(
          TrackingConstants.TRACKING_ORIGINS.DRAFT,
          TRACKING_ACTIONS.NEW_COMPOSE.OPENED,
          { creativeSources: getCreativeSources(message.messages.flatMap(msg => msg.attachments)) },
          true,
        )
        if (isFeatureEnabled('PUB_DE_TRACKING_ENABLED') && isPlannerView()) {
          trackExperiment({
            origin: TrackingConstants.TRACKING_ORIGINS.DRAFT,
            event: `${TRACKING_ACTIONS.NEW_COMPOSE.OPENED}_experiment`,
            ...experimentMemberData,
          })
        }
      }
    } else if ((isEdit || isDuplicate) && !isTemplate) {
      let data

      if (isNativePost) {
        data = await getNativeMessage(nativePost.socialProfileId, nativePost.postExternalId, false)
        // drop external mediaUrls and hold in nativeMediaUrls to be uploaded to s3 later.
        data.nativeMediaUrls = data.mediaUrls
        data.mediaUrls = []
      } else {
        data = await getMessage(messageId)
      }

      customContextType = ComposerUtils.getCustomContextType(data)
      isPinterestMessage = ComposerUtils.isPinterestComposer(customContextType)

      const unsupportedFields = ComposerUtils.mpsMessageGetUnsupportedFields(
        data,
        derivedProps.socialNetworks,
      )

      if (isEdit && unsupportedFields?.length) {
        statusObject.update(translation.c.LOADING, 'info')
        track(
          TrackingConstants.TRACKING_ORIGINS.EDIT,
          TRACKING_ACTIONS.LEGACY.FIELDS,
          {
            legacyFields: unsupportedFields,
          },
          true,
        )
        return
      } else {
        // TODO: merge with createComposeMessage
        message = ComposerUtils.messageFromMPSGetMessage(data, timezoneName, socialNetworks)
        if (
          isDuplicate &&
          (data.state === CONTENT_STATE.SENT ||
            data.state === CONTENT_STATE.EXPIRED_APPROVAL ||
            data.state === CONTENT_STATE.SEND_FAILED_PERMANENTLY)
        ) {
          // Clear the scheduled time since the time will be in the past and
          // we don't want to populate an invalid schedule time in composer
          message.sendDate = null
        }

        if (isPinterestMessage) {
          track(TrackingConstants.TRACKING_ORIGINS.EDIT, TRACKING_ACTIONS.PINTEREST.OPENED, {}, true)
          if (isFeatureEnabled('PUB_DE_TRACKING_ENABLED') && isPlannerView()) {
            trackExperiment({
              origin: TrackingConstants.TRACKING_ORIGINS.EDIT,
              event: `${TRACKING_ACTIONS.PINTEREST.OPENED}_experiment`,
              ...experimentMemberData,
            })
          }
          saveToAmplify = undefined
          canSendToAmplify = false
        } else {
          track(
            TrackingConstants.TRACKING_ORIGINS.EDIT,
            TRACKING_ACTIONS.NEW_COMPOSE.OPENED,
            {
              socialNetwork: socialNetworks[data.socialProfile.id]?.type,
              creativeSources: getCreativeSources(data.mediaUrls),
            },
            true,
          )
          if (isFeatureEnabled('PUB_DE_TRACKING_ENABLED') && isPlannerView()) {
            trackExperiment({
              origin: TrackingConstants.TRACKING_ORIGINS.EDIT,
              event: `${TRACKING_ACTIONS.NEW_COMPOSE.OPENED}_experiment`,
              ...experimentMemberData,
            })
          }
        }

        // Editing failed messages is a special case were we want to duplicate the post instead
        if (data.state === CONTENT_STATE.SEND_FAILED_PERMANENTLY) {
          isEdit = false
          message.sendDate = null
        }
      }
    } else {
      isPinterestMessage = ComposerUtils.isPinterestComposer(customContextType)

      if (isPinterestMessage) {
        track(TrackingConstants.TRACKING_ORIGINS.NEW, TRACKING_ACTIONS.PINTEREST.OPENED, {}, true)
        if (isFeatureEnabled('PUB_DE_TRACKING_ENABLED') && isPlannerView()) {
          trackExperiment({
            origin: TrackingConstants.TRACKING_ORIGINS.NEW,
            event: `${TRACKING_ACTIONS.PINTEREST.OPENED}_experiment`,
            ...experimentMemberData,
          })
        }
      } else {
        track(TrackingConstants.TRACKING_ORIGINS.NEW, TRACKING_ACTIONS.NEW_COMPOSE.OPENED, {}, true)
        if (isFeatureEnabled('PUB_DE_TRACKING_ENABLED') && isPlannerView()) {
          trackExperiment({
            origin: TrackingConstants.TRACKING_ORIGINS.NEW,
            event: `${TRACKING_ACTIONS.NEW_COMPOSE.OPENED}_experiment`,
            ...experimentMemberData,
          })
        }
      }
    }

    await renderComposerFn({
      customContextType,
      isEdit,
      isDuplicate,
      message,
      templateData,
      creatorName,
      onCloseClicked,
      onMinimizeClicked,
      onSaveTemplateClicked,
      contentTemplateId,
      onDataLoaded,
      org,
      // globals from the dashboard
      flux,
      saveToAmplify,
      canSendToAmplify,
      showAutoScheduleSettings,
      FluxComponent,
      derivedProps,
      isDraftAutoScheduled: draft?.draft?.message?.isAutoScheduled,
    })
  }

  try {
    const maybeSelectedId = getComposerMessageState().selectedMessageId
    if (isDraft) messageId = draft ? draft.draft.id : draftId

    if (composerModalStore.getState().isMinimized) {
      // using == since some places its a string, some a number
      // eslint-disable-next-line eqeqeq
      if (((isDraft || isEdit) && maybeSelectedId == messageId) || !messageId) {
        await maximize()
        removeLoadingModal()
      } else {
        const onClose = async () => {
          MessagePreviewsActions.resetPreviews()
          getMessageDetailsAndRender()
        }
        renderDisregardMessageModal({ isDraft, isDuplicate, onClose })
      }
    } else {
      await getMessageDetailsAndRender()
    }
  } catch (e: any) {
    if (!AbortionError.isAbortionError(e)) {
      if (derivedProps.isDevOrStaging) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
      if (isDraft) {
        track(TrackingConstants.TRACKING_ORIGINS.DRAFT, TRACKING_ACTIONS.NEW_COMPOSE.ERROR, {}, true)
        statusObject.update(ERROR_LOADING_DRAFT, 'error', true)

        if (!e.logged) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed to render new composer draft edit', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
          e.logged = true
        }
        if (!e.failureRecorded) {
          recordIncrement(METRIC_NAMES.OPEN_COMPOSER_FAILED)
          e.failureRecorded = true
        }
        throw e
      } else if (isEdit) {
        if (!e.logged) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed to render new composer edit', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
        if (!e.failureRecorded) {
          recordIncrement(METRIC_NAMES.OPEN_COMPOSER_FAILED)
          e.failureRecorded = true
        }

        track(TrackingConstants.TRACKING_ORIGINS.EDIT, TRACKING_ACTIONS.NEW_COMPOSE.ERROR, {}, true)
        statusObject.update(ERROR_LOADING_MESSAGE, 'error', true)
      } else if (isDuplicate && isNativePost) {
        // we get the error code and translate it using ValidationErrorMessages, default toast is disabled at :680
        const code = mapOverlappingErrorCodes(e?.response?.data?.errors[0])
        const { title, message } = ValidationErrorMessages.get({ code })

        track(TrackingConstants.TRACKING_ORIGINS.NEW, TRACKING_ACTIONS.NEW_COMPOSE.ERROR, {}, true)
        StatusToastUtils.createToast(title, message, TYPE_ERROR, null, null)
      } else {
        track(TrackingConstants.TRACKING_ORIGINS.NEW, TRACKING_ACTIONS.NEW_COMPOSE.ERROR, {}, true)
      }
      removeLoadingModal()
    }
  }
}

export { renderFullScreenComposer }
