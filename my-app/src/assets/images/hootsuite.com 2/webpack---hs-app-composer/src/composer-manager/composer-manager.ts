import { canAccessAmplifyComposer } from 'fe-lib-entry-points'
import { DEV, env, STAGING } from 'fe-lib-env'
import {
  getCsrfToken,
  getFacadeApiUrl,
  getInTrial,
  getLanguage,
  getMemberEmail,
  getMemberExtras,
  getMemberId,
  getMemberIsUsingLATM,
  getMemberName,
  getMemberSignupDate,
  getOrganizationCount,
  getSocialNetworks,
  getTimezoneName,
} from 'fe-lib-hs'
import { recordIncrement } from 'fe-lib-recording'
import { actions as ComposerMessageActions } from 'fe-pnc-data-composer-message'
import * as DataDrafts from 'fe-pnc-data-drafts'
import * as DataOrganizations from 'fe-pnc-data-organizations'
import translation from 'fe-pnc-lib-hs-translation'
import { DateUtils } from 'fe-pnc-lib-utils'

import { renderPreapprovalModal } from '@/components/composer/composer-message-modals'
import Constants from '@/constants/constants'
import METRIC_NAMES from '@/constants/metric-names'
import TrackingConstants from '@/constants/tracking'
import { renderFullScreenComposer } from '@/render-functions/render-full-screen-composer'
import ComposerUtils from '@/utils/composer-utils'
import statusObject from '@/utils/status-bar'
import { track } from '@/utils/tracking'

/**
 * @return {object} props that can be gathered from fe-global libraries, composer mode type agnostic
 */
const deriveProps = async () => {
  const memberExtras = await getMemberExtras()
  const derivedProps = {
    DataDrafts: DataDrafts,
    DataOrganizations: DataOrganizations,
    csrfToken: await getCsrfToken(),
    facadeApiUrl: await getFacadeApiUrl(),
    isDevOrStaging: env() === DEV || env() === STAGING,
    language: await getLanguage(),
    memberEmail: await getMemberEmail(),
    memberExtras,
    memberId: await getMemberId(),
    memberInTrial: await getInTrial(),
    memberIsUsingLATM: await getMemberIsUsingLATM(),
    memberName: await getMemberName(),
    memberSignupDate: await getMemberSignupDate(),
    org: DataOrganizations.getState().selectedOrganization,
    organizationCount: await getOrganizationCount(),
    socialNetworks: await getSocialNetworks(),
    timezoneName: await getTimezoneName(),
  }

  derivedProps.timezoneName = DateUtils.formatTimezoneNameString(derivedProps.timezoneName)
  return derivedProps
}

// eslint-disable-next-line no-shadow,eqeqeq
const getOrg = orgId => DataOrganizations.getState().organizations.find(org => org.organizationId == orgId) // Shallow compare as organizationId can be a string, depending on which service returns it

/**
 * @param {object} message the message data from a new post; new post mode
 * @param {object} draft the message data from a draft; edit draft mode
 * @param {string} draftId the draftId; edit draft mode
 * @param {string} messageId the messageId of a scheduled post; edit scheduled post mode
 * @param {boolean} isEdit indicates if user has opened composer for editing a scheduled post; edit scheduled post mode
 * @param {function} legacyEditCallBack fallback for if new composer doesn't open in regular edit mode; edit scheduled post mode
 * @param {object} templateData the template data for creating a new post from tempate; new post from template mode
 * @param {string} templateId templatId; new post from template, won't exist if we are coming from new post from template in content library
 * @param {string} duplicateId id of post/draft to duplicate; duplicate scheduled post mode
 * @param {boolean} isDuplicateDraft indicates if we are duplicating a draft; duplicate draft mode
 */
const renderComposer = async ({
  // New post mode
  message,

  // Edit Draft mode
  draft,
  draftId,

  // Edit scheduled message mode
  messageId,
  isEdit = false,

  // Edit template or new post from template
  templateData,
  templateId = '1',
  onSaveTemplate,

  // Duplicate scheduled post
  duplicateId,
  isDuplicateDraft,

  // Dependencies passed in from dashboard
  ...contextPropsFromDashboard
}) => {
  const dashboardProps = contextPropsFromDashboard
  const { onDataLoaded, saveToAmplify, showAutoScheduleSettings, flux, FluxComponent } = dashboardProps

  let customContextType

  //If we are opening a new post/pin, we grab the context right away
  if (message) {
    customContextType = ComposerUtils.getCustomContextType(message)
  }

  let org

  // Get derived props that are composer mode agnostic
  const derivedProps = await deriveProps()

  const canSendToAmplify = await canAccessAmplifyComposer()

  if (templateData) {
    customContextType = ComposerUtils.getCustomContextType(templateData)
    const isPreapproved = templateData.disposition === 'APPROVED' || false
    const composerMessage = ComposerUtils.createMessageFromTemplate({ id: templateId, templateData })
    if (templateData.organizationId) org = getOrg(templateData.organizationId)
    const renderComposerFn = () => {
      renderFullScreenComposer({
        message: composerMessage,
        templateData,
        isEdit: templateData.isEdit || false,
        org,
        onSaveTemplateClicked: onSaveTemplate ? onSaveTemplate : undefined,
        // globals from the dashboard
        onDataLoaded,
        saveToAmplify,
        canSendToAmplify,
        showAutoScheduleSettings,
        flux,
        FluxComponent,
        // props grabbed by composer manager
        derivedProps,
        customContextType,
      })
        .then(() => {
          // Some data is not loaded until composer is first rendered, so we can hydrate things like message tags
          const tagIds = templateData.tagIds ? templateData.tagIds.map(id => `${id}`) : []
          if (tagIds && tagIds.length > 0) {
            const messageTags = flux
              .getStore('tags')
              .get()
              .filter(tag => tagIds.includes(`${tag.id}`))
            ComposerMessageActions.updateFieldById(templateId, Constants.FIELD_TO_UPDATE.TAGS, messageTags)
          }
          track(
            TrackingConstants.TRACKING_ORIGINS.TEMPLATE,
            TrackingConstants.TRACKING_ACTIONS.TEMPLATE.OPENED_FROM_TEMPLATE_SUCCESS,
          )
        })
        .catch(e => {
          statusObject.update(
            translation._('An error occurred loading your template into the Composer. Please try again.'),
            'error',
            true,
          )
          if (!e.failureRecorded) {
            recordIncrement(METRIC_NAMES.OPEN_COMPOSER_FAILED)
            e.failureRecorded = true
          }
          throw e
        })
    }

    if (isPreapproved) {
      // Render the interrupting popover if this content is preapproved
      renderPreapprovalModal(renderComposerFn)
    } else {
      renderComposerFn()
    }
  } else if (duplicateId) {
    renderFullScreenComposer({
      messageId: duplicateId,
      isDuplicate: true,
      // globals from the dashboard
      onDataLoaded,
      saveToAmplify,
      canSendToAmplify,
      showAutoScheduleSettings,
      flux,
      FluxComponent,
      // props grabbed by composer manager
      derivedProps,
    })
  } else {
    if (draft || draftId) {
      isEdit = !isDuplicateDraft
      if (draft && draft.draft && draft.draft.organizationId) {
        org = getOrg(draft.draft.organizationId)
      }
    }

    renderFullScreenComposer({
      // props necessary for calling the manager
      customContextType,
      // post
      message: message ? message : undefined,
      // edit draft
      draft: draft ? draft : undefined,
      draftId: draftId ? draftId : undefined,
      isDuplicateDraft: isDuplicateDraft ? isDuplicateDraft : undefined,
      // edit scheduled post
      messageId: messageId ? messageId : undefined,
      isEdit: isEdit ? isEdit : undefined,
      org,
      // globals from dashboard
      onDataLoaded,
      saveToAmplify,
      canSendToAmplify,
      showAutoScheduleSettings,
      flux,
      FluxComponent,

      // props grabbed by composer manager
      derivedProps,
    })
  }
}

export { renderComposer }
