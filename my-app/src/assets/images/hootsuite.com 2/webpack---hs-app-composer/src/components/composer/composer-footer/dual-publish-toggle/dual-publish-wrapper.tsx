import React, { useEffect, useRef } from 'react'

import styled from 'styled-components'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { venk } from 'fe-hoc-venkman'
import { off, on } from 'fe-lib-hootbus'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { InstagramPostType } from 'fe-pnc-constants-social-profiles'
import { store as composerMessageStore, getSelectedMessageValue } from 'fe-pnc-data-composer-message'
import { store as socialProfileStore, getProfilesById } from 'fe-pnc-data-social-profiles-v2'
import type { Profile, SocialProfileState } from 'fe-pnc-data-social-profiles-v2'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'

import { usePrevious } from 'fe-pnc-lib-hooks'
import Constants from '@/constants/constants'

import getDualPublishConfig from './dual-publish-config/get-dual-publish-config'
import DualPublishToggle from './dual-publish-toggle'

const DualPublishContainer = venk(styled.div``, 'DualPublishContainer')

// Tip - Replace with 'instagram:device:pairing:modal:close' to event test without pairing
const DEVICE_PAIR_DETECTED = 'instagram:devicePairing:devicePairDetected'

export const getSelectedInstagramProfiles = (selectedProfiles: Array<Profile>) => {
  return selectedProfiles.reduce((filtered: Array<Profile>, profile: Profile) => {
    if (
      profile.socialProfileType === SocialProfileConstants.SN_TYPES.INSTAGRAM ||
      profile.socialProfileType === SocialProfileConstants.SN_TYPES.INSTAGRAMBUSINESS
    ) {
      filtered.push(profile)
    }
    return filtered
  }, [])
}

interface DualPublishWrapperProps {
  postType: InstagramPostType
  isOnboardingOpen: boolean
  onDevicePairDetected(): void
  onSelectDirectPublish(): void
  onSelectPushPublish(): void
  selectedProfileIds: Array<number>
  socialProfiles: Array<Profile>
  shouldRender?: boolean
  storePublishingMode: string
}

/**
 * Returns a DualPublishWrapper component that uses the SocialProfiles entity for information on selected
 * social networks that dictates what publishing options are available for a message.
 *
 * Note: The last piece of information this component needs is to know whether or not each IG network
 * has push notifications enabled. This will be exposed with further backend work. In the future, it may
 * also want to know whether or not there are multiple assets, in which case the user would be notified
 * only push notifications are available.
 *
 * @param {object} props Includes social profiles from the fe-pnc-entity-social-profiles store
 * @returns {object} a DualPublishToggle component
 */
const DualPublishWrapper = ({
  socialProfiles,
  selectedProfileIds,
  onDevicePairDetected,
  onSelectDirectPublish,
  onSelectPushPublish,
  postType,
  isOnboardingOpen,
  storePublishingMode,
}: DualPublishWrapperProps) => {
  const initialStorePublishingModeLock = useRef(!!storePublishingMode)
  const prevSelectedProfileIds = usePrevious(selectedProfileIds)
  const prevPostType = usePrevious(postType)
  const selectedProfiles = getProfilesById(socialProfiles, selectedProfileIds)
  const selectedInstagramProfiles = getSelectedInstagramProfiles(selectedProfiles)
  const isNonIGNetworkSelected = selectedProfiles.length > selectedInstagramProfiles.length
  const dualPublishConfig = getDualPublishConfig({
    selectedInstagramProfiles,
    isNonIGNetworkSelected,
    postType,
  })

  /**
   * Re-fetch social profiles on completion of pairing wizard
   */
  useEffect(() => {
    on(DEVICE_PAIR_DETECTED, onDevicePairDetected)

    return function cleanup() {
      off(DEVICE_PAIR_DETECTED, onDevicePairDetected)
    }
  }, [])

  /*
  Use lock to stop config from editing initial store publishingMode (composer opened from Drafts, Content Template or Planner Edit),
  Lock is released for later edits of publishingMode
  Always pull publishingMode from store (1 source of truth)
  PublishingMode and SNs selected/postType interactions tests are to be written, please manually QA PUB-27171 for further publishingMode changes
  */
  useEffect(() => {
    // If lock, unlock then return
    if (initialStorePublishingModeLock.current) {
      initialStorePublishingModeLock.current = false
      return
    }

    //Remove postType dependency with removal of PUB_28787_SIMPLIFY_IG_POST_TYPES
    const ignorePostType =
      isFeatureEnabledOrBeta('PUB_28787_SIMPLIFY_IG_POST_TYPES') && prevPostType !== postType
    // If no actual value changes then return (fix re-rendering issue)
    if (
      (JSON.stringify(prevSelectedProfileIds) === JSON.stringify(selectedProfileIds) &&
        prevPostType === postType) ||
      ignorePostType
    ) {
      return
    }
    // Edit publishingMode only if SNs selected or postType changed
    const publishingMode = dualPublishConfig.defaultToggleBtn
    if (publishingMode === Constants.INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH) {
      onSelectDirectPublish()
    } else {
      onSelectPushPublish()
    }
  }, [selectedProfileIds, postType])

  if (!selectedInstagramProfiles.length) {
    return null
  }

  return (
    <DualPublishContainer>
      <DualPublishToggle
        initialPublishingMode={storePublishingMode}
        onSelectDirectPublish={onSelectDirectPublish}
        onSelectPushPublish={onSelectPushPublish}
        dualPublishConfig={dualPublishConfig}
        instagramProfiles={selectedInstagramProfiles}
        postType={postType}
        isOnboardingOpen={isOnboardingOpen}
        isNonIGNetworkSelected={isNonIGNetworkSelected}
      />
    </DualPublishContainer>
  )
}

DualPublishWrapper.displayName = 'DualPublishWrapper'

DualPublishWrapper.defaultProps = {
  socialProfiles: [],
  shouldRender: false,
}

export default DualPublishWrapper

export const ConnectedDualPublishWrapper = compose(
  connect(socialProfileStore, (state: SocialProfileState) => ({
    socialProfiles: state.allProfiles,
  })),
  connect(composerMessageStore, state => ({
    storePublishingMode: getSelectedMessageValue(state, 'publishingMode', false, null),
  })),
)(DualPublishWrapper)
