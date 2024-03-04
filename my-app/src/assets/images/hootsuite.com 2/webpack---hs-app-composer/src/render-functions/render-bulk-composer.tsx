import React from 'react'
import ReactDOM from 'react-dom'
import _ from 'underscore'

import { logError } from 'fe-lib-logging'
import { getPermissionsForMember } from 'fe-pnc-data-entitlements'
import {
  setOrganizations,
  setSelectedOrganization,
  store as OrganizationStore,
} from 'fe-pnc-data-organizations'
import { getProfilesV2, populateStore } from 'fe-pnc-data-social-profiles-v2'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'
import { getExcludedNetworkTypesForComponent } from 'fe-pnc-lib-networks-conf'
import { DateUtils } from 'fe-pnc-lib-utils'
import BulkComposer from '@/components/bulk-composer/bulk-composer'
import { FEATURE_CODES } from '@/constants/entitlements'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import { StoreProvider } from '@/redux/store'
import AbortionError from '@/utils/abortion-error'
import { getOrganizationLogoSrc } from '@/utils/organization-utils'
import statusObject from '@/utils/status-bar'

const getBulkComposerParentNode = () => {
  let parentNode = document.querySelector('#bulkComposerMountPoint')
  if (parentNode === null) {
    parentNode = document.createElement('div')
    parentNode.id = 'bulkComposerMountPoint'
    document.body.appendChild(parentNode)
  }
  return parentNode
}

let dashboardProps = {}

const WINDOW_RESIZE_DEBOUNCE = 15
const onWindowResize = _.debounce(() => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  renderBulkComposer(dashboardProps)
}, WINDOW_RESIZE_DEBOUNCE)

const close = () => {
  window.removeEventListener('resize', onWindowResize)
  ReactDOM.unmountComponentAtNode(getBulkComposerParentNode())
}

/**
 * renders bulk composer
 * @param {function} optOut - the opt out callback
 * @param {function} onViewMessages - the call back for viewing messages
 * @param {function} renderLoadingModal - function to render the loading modal
 * @param {function} closeLoadingModal - function to close the loading modal
 * @param {object} flux - dashboards flux object
 * @param {number} memberId - the users memberId
 * @param {string} memberSignupDate - the initial sign up date for a given member
 * @param {string} facadeApiUrl - the facadeApiUrl
 * @param {string} timezoneName - the users hs timezone
 * @param {string} csrfToken - the csrf token
 * @param {boolean} memberIsUsingLATM - if the user is using log in as the member
 * @param {boolean} isDevOrStaging - is in the dev or staging environment
 * @param {function} FluxComponent - the Flux HOC
 */
const renderBulkComposer = async ({
  optOut,
  onViewMessages,
  // globals from the dashboard
  renderLoadingModal,
  closeLoadingModal,
  flux,
  memberId,
  memberSignupDate,
  facadeApiUrl,
  timezoneName,
  csrfToken,
  memberIsUsingLATM,
  isDevOrStaging,
  FluxComponent,
}) => {
  try {
    renderLoadingModal()

    dashboardProps = {
      optOut,
      onViewMessages,
      // globals from the dashboard
      renderLoadingModal,
      closeLoadingModal,
      flux,
      memberId,
      facadeApiUrl,
      timezoneName,
      csrfToken,
      memberIsUsingLATM,
      isDevOrStaging,
      FluxComponent,
    }

    const fetchDataForBulkComposer = organization => {
      if (organization) {
        flux.getActions('organizations').setSelectedOrganization(organization.organizationId)
        setSelectedOrganization(organization)
      } else {
        organization = OrganizationStore.getState().selectedOrganization
      }
      getProfilesV2(organization && organization.organizationId)
        .then(data => {
          populateStore(data)
          if (data && data.socialProfiles) {
            flux.getActions('socialNetworkProfiles').setSocialProfiles(data.socialProfiles)
            if (data.privateSocialProfiles) {
              flux.getActions('socialNetworkProfiles').setPrivateSocialProfiles(data.privateSocialProfiles)
            }
          }
        })
        .catch(e => {
          if (!AbortionError.isAbortionError(e)) {
            statusObject.update(translation._('Unable to fetch social accounts'), 'error', true)
          }
        })
    }

    const fetchOrgs = () => {
      const organizationsStore = flux.getStore('organizations')

      const setOrgStore = selectedOrg => {
        const groupByLabel = 'showTitle'
        const organizations = organizationsStore.getSortedByOwner(memberId)
        let orgs
        if (organizations) {
          orgs = organizations.map(org => ({
            ...org,
            showTitle: groupByLabel,
            logo: getOrganizationLogoSrc(org.logo),
          }))
        }

        setOrganizations(orgs)
        setSelectedOrganization(selectedOrg)
      }

      const selectedOrg = OrganizationStore.getState().selectedOrganization
      const shouldPopulateStore = !organizationsStore.state.initialized

      if (selectedOrg && selectedOrg.organizationId) {
        fetchDataForBulkComposer(selectedOrg)
        if (shouldPopulateStore) {
          setOrgStore(selectedOrg)
        }
      } else {
        flux
          .getActions('organizations')
          .fetch(true)
          .then(orgData => {
            setOrgStore(orgData[Object.keys(orgData)[0]])
            fetchDataForBulkComposer(orgData[Object.keys(orgData)[0]])
          })
          .catch(e => {
            if (!AbortionError.isAbortionError(e)) {
              statusObject.update(translation._('Unable to retrieve organizations'), 'error', true)
            }
          })
      }
    }

    // If this is a fresh open (vs a re-render), then we need to update the orgs and social profiles and campaigns etc.
    if (getBulkComposerParentNode().innerHTML === '') {
      fetchOrgs()
    }

    if (isFeatureEnabled('PUB_31645_BULK_FETCH_COMPOSER_ENTITLEMENTS')) {
      await getPermissionsForMember(memberId, FEATURE_CODES)
    }

    window.removeEventListener('resize', onWindowResize)
    window.addEventListener('resize', onWindowResize)

    const stores = {}

    stores.socialNetworks = store => ({
      socialNetworks: store.getCollection(),
    })

    stores.socialNetworkProfiles = store => ({
      socialProfilesKeyedByType: store.getSocialNetworksKeyedByType(null, null),
    })

    stores.organizations = store => ({
      organizations: store.getSortedByOwner(memberId),
      selectedOrganization: store.state.selectedOrganization,
    })

    const socialNetworkTypesToExclude = await getExcludedNetworkTypesForComponent('COMPOSER', 'COMMON')
    ReactDOM.render(
      <StoreProvider>
        <FluxComponent connectToStores={stores} flux={flux}>
          <BulkComposer
            csrf={csrfToken}
            excludedNetworkTypes={socialNetworkTypesToExclude}
            facadeApiUrl={facadeApiUrl ? facadeApiUrl : ''}
            fetchDataForBulkComposer={fetchDataForBulkComposer}
            flux={flux}
            FluxComponent={FluxComponent}
            isUsingLATM={memberIsUsingLATM}
            onClose={close}
            onSelectNewOrganization={fetchDataForBulkComposer}
            onViewMessages={onViewMessages}
            optOut={optOut}
            memberId={memberId}
            memberSignupDate={memberSignupDate}
            timezoneName={DateUtils.formatTimezoneNameString(timezoneName)}
          />
        </FluxComponent>
      </StoreProvider>,
      getBulkComposerParentNode(),
    )
  } catch (e) {
    if (isDevOrStaging) {
      // eslint-disable-next-line no-console
      console.error(e)
    }
    statusObject.update(translation._('An unexpected error occurred loading Bulk Composer'), 'error', true)
    logError(LOGGING_CATEGORIES.BULK_COMPOSER, 'Bulk Composer - failed to render', {
      errorMessage: JSON.stringify(e.message),
      stack: JSON.stringify(e.stack),
    })
  } finally {
    closeLoadingModal()
  }
}

export default renderBulkComposer
