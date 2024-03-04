import React from 'react'
import loadable from '@loadable/component'
import get from 'lodash/get'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import { getSelectedMessage, getState as getComposerMessageState } from 'fe-pnc-data-composer-message'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import { FieldValidations } from '@/typings/Message'

// Lazy loaded components
const loader: () => Promise<any> = async () => {
  const { TwitterLocation } = await import(
    /* webpackChunkName: "TwitterLocation" */ 'fe-pnc-comp-location-area'
  )
  return TwitterLocation
}

const TwitterLocationArea = React.memo(loadable(loader))

type LocationsProps = {
  selectedNetworkGroup: string
  twSpIds: string[]
  isBulkComposer?: boolean
  showOnSubmitErrors?: boolean
  onDoneApplyLocations: (
    snType: string,
    locationId: string,
    locationName: string,
    locationLat?: string,
    locationLong?: string,
  ) => void
  onLocationReset: (snType: string) => void
  fieldValidations: FieldValidations
}

const Locations = React.forwardRef((props: LocationsProps, ref) => {
  const {
    selectedNetworkGroup,
    twSpIds,
    isBulkComposer,
    showOnSubmitErrors,
    fieldValidations,
    onDoneApplyLocations,
    onLocationReset,
  } = props
  // Feature disabled due to deprecations https://hootsuite.atlassian.net/browse/PUB-30432
  if (isFeatureEnabledOrBeta('PUB_30452_DISABLE_TWITTER_LOCATIONS')) {
    return null
  }

  const locationProfilePresent = twSpIds.length > 0
  if (!locationProfilePresent) {
    return null
  }

  if (selectedNetworkGroup !== SocialProfileConstants.SN_GROUP.TWITTER) {
    return null
  }

  const selectedMessageForEdit = getSelectedMessage(getComposerMessageState())
  const appliedLocationsObj =
    selectedMessageForEdit && selectedMessageForEdit.hasLocations() ? selectedMessageForEdit.locations : null
  const locationAreaProps = {
    fieldValidations,
    isBulkComposer,
    onLocationsApplied: onDoneApplyLocations,
    onSelectorReset: onLocationReset,
    showOnSubmitErrors,
  }

  return (
    <TwitterLocationArea
      {...locationAreaProps}
      appliedLocation={get(appliedLocationsObj, SocialProfileConstants.SN_GROUP.TWITTER, null)}
      key="twitterLocationArea"
      ref={ref}
      profiles={twSpIds}
    />
  )
})

export default Locations
