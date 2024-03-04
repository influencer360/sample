import React, { useEffect } from 'react'

import styled from 'styled-components'
import { Spotlight } from 'fe-billing-comp-spotlight'
import { InlineToggleBar } from 'fe-comp-toggle-bar'
import { PLACEMENT_BOTTOM, tooltip } from 'fe-hoc-tooltip'
import { venk } from 'fe-hoc-venkman'
import { off, on } from 'fe-lib-hootbus'
import type { InstagramPostType } from 'fe-pnc-constants-social-profiles'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import { usePrevious } from 'fe-pnc-lib-hooks'
import translation from 'fe-pnc-lib-hs-translation'
import { keyboardEventHandler, SPACE } from 'fe-pnc-lib-keyboard-events'

import Constants from '@/constants/constants'
import { ONBOARDING_WALKTHROUGH_EVENTS } from '@/constants/events'
import { Popover as PopoverType } from '@/typings/DualPublish'
import ComposerUtils from '@/utils/composer-utils'
import ProfileUtils from '@/utils/profile-utils'

import hasPushPublishing from './dual-publish-config/has-push-publishing'
import DualPublishPopover, {
  DIRECT_PUBLISH_POPOVER_ANCHOR_CLASS_NAME,
  PUSH_PUBLISH_POPOVER_ANCHOR_CLASS_NAME,
} from './dual-publish-popover/dual-publish-popover'
import {
  DirectIconToggle,
  DualPublishToggleContainer,
  DualPublishToggleText,
  PushIconToggle,
} from './dual-publish-toggle.style'

const INSTAGRAM_PUBLISHING_MODES = Constants.INSTAGRAM_PUBLISHING_MODES

const PUSH_PUBLISH_HELPTEXT = translation._('Publish via mobile notification')
const PUSH_PUBLISH_UNAVAILABLETEXT = translation._('Available for Instagram accounts only')
// prettier-ignore
export const PUSH_PUBLISH_DISABLEDTEXT = translation._('Publishing via mobile notification isn’t available for reels')
const DIRECT_PUBLISH_HELPTEXT = translation._('Publish directly')
export const DIRECT_PUBLISH_DISABLEDTEXT = translation._('Direct publish not available for Stories')

const BUTTON_HEIGHT = '44px'

const PushIconWithTooltip = tooltip(
  props => <PushIconToggle {...props} />,
  ({ text }) => ({
    text,
    placement: PLACEMENT_BOTTOM,
  }),
)

const DirectIconWithTooltip = tooltip(
  props => <DirectIconToggle {...props} />,
  ({ text }) => ({
    text,
    placement: PLACEMENT_BOTTOM,
  }),
)

const dualPublishIcons = ({ value, isSelected, label }) => {
  const PushIconComponent = label ? PushIconWithTooltip : PushIconToggle
  const DirectIconComponent = label ? DirectIconWithTooltip : DirectIconToggle

  switch (value) {
    case INSTAGRAM_PUBLISHING_MODES.PUSH_PUBLISH:
      return (
        <PushIconComponent
          className={PUSH_PUBLISH_POPOVER_ANCHOR_CLASS_NAME}
          height={BUTTON_HEIGHT}
          text={label || undefined}
          isSelected={isSelected}
        />
      )
    case INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH:
      return (
        <DirectIconComponent
          className={DIRECT_PUBLISH_POPOVER_ANCHOR_CLASS_NAME}
          height={BUTTON_HEIGHT}
          text={label || undefined}
          isSelected={isSelected}
        />
      )
    default:
      return null
  }
}

const StyledSpotlightWrapper = styled.div`
  display: relative;
  z-index: 1;
`

const spotlightTargets = [
  {
    target: '.vk-DualPublishToggleContainer',
    padding: 12,
  },
]

const StyledToggleBarWrapper = styled.div`
  z-index: 2000;
`

const StatefulInlineToggleBar = ({
  dualPublishConfig,
  instagramProfiles,
  postType,
  selectedInstagramIds,
  onSelectDirectPublish,
  onSelectPushPublish,
  initialPublishingMode,
  isNonIGNetworkSelected,
  isOnboardingOpen,
}) => {
  const [publishingMode, setPublishingMode] = React.useState(initialPublishingMode)
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
  const [isPopoverHighlighted, setIsPopoverHighlighted] = React.useState(false)

  const isDirectDisabled = false

  //Post type Feed and Reel are now automatically set.
  //Reel will be changed to Post on switching to Push
  const isPushDisabled = isFeatureEnabledOrBeta('PUB_28787_SIMPLIFY_IG_POST_TYPES')
    ? false
    : ComposerUtils.isInstagramReel(postType)

  const isDirectPublish = publishingMode === INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH

  const profilesToSetup = instagramProfiles.filter(profile => {
    const isBusiness = ProfileUtils.hasInstagramBusinessNetwork(profile)
    const isPushPublishEnabled = hasPushPublishing(profile)
    return isDirectPublish ? !isBusiness : !isPushPublishEnabled
  })

  const shouldRenderPopover = profilesToSetup.length > 0

  const prevInstagramIds = usePrevious(selectedInstagramIds)

  const handleChangeDualPublishMode = dualPublishMode =>
    dualPublishMode === INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH
      ? onSelectDirectPublish()
      : onSelectPushPublish()

  const onChange = newPublishingMode => {
    if (!isDirectDisabled) {
      setPublishingMode(newPublishingMode)
      handleChangeDualPublishMode(newPublishingMode)
    }
  }

  const onOnboardingClose = () => {
    setIsPopoverHighlighted(true)
  }

  useEffect(() => {
    on(ONBOARDING_WALKTHROUGH_EVENTS.CLOSE, onOnboardingClose)

    return function cleanup() {
      off(ONBOARDING_WALKTHROUGH_EVENTS.CLOSE, onOnboardingClose)
    }
  }, [])

  useEffect(() => {
    setPublishingMode(initialPublishingMode)
    handleChangeDualPublishMode(initialPublishingMode)
  }, [initialPublishingMode])

  // If the selected social networks change, show the relevant setup popover
  useEffect(() => {
    // useEffect only makes a shallow comparison, so check if Ids were added or removed
    if (!prevInstagramIds || selectedInstagramIds.length !== prevInstagramIds.length) {
      setIsPopoverOpen(true)
    }
  }, [selectedInstagramIds])

  const closePopover = () => {
    setIsPopoverOpen(false)
    setIsPopoverHighlighted(false)
  }

  // if the user clicks the toggle button and the popover should show (there are profiles that need setup), show it
  const onToggleBtnClick = () => {
    // Since the DualPublishConfig always knows whether or not it should ever show (contingent on what types of profiles are selected)
    // we can always set the popover to be showing so if a user selects profiles that need further setup, the popover
    // opens immediately.
    setIsPopoverOpen(true)
    setIsPopoverHighlighted(false)
  }

  const getDirectPublishLabel = () => {
    if (isDirectDisabled) {
      return DIRECT_PUBLISH_DISABLEDTEXT
    }
    return DIRECT_PUBLISH_HELPTEXT
  }

  const getPushPublishLabel = () => {
    if (isPushDisabled) {
      return PUSH_PUBLISH_DISABLEDTEXT
    }
    if (isNonIGNetworkSelected) {
      return PUSH_PUBLISH_UNAVAILABLETEXT
    }
    return PUSH_PUBLISH_HELPTEXT
  }

  const dualPublishItems = [
    {
      value: INSTAGRAM_PUBLISHING_MODES.PUSH_PUBLISH,
      disabled: isPushDisabled,
      label: getPushPublishLabel(),
    },
    {
      value: INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH,
      disabled: isDirectDisabled,
      label: getDirectPublishLabel(),
    },
  ]

  return (
    <DualPublishToggleContainer>
      <DualPublishToggleText>
        {isDirectPublish ? DIRECT_PUBLISH_HELPTEXT : PUSH_PUBLISH_HELPTEXT}
      </DualPublishToggleText>
      <StyledToggleBarWrapper
        onClick={onToggleBtnClick}
        onKeyDown={keyboardEventHandler({
          [SPACE]: onToggleBtnClick,
        })}
        role="button"
        tabIndex="-1"
      >
        <InlineToggleBar
          items={dualPublishItems}
          id="DualPublishToggleButton"
          itemRender={dualPublishIcons}
          onChange={onChange}
          value={publishingMode}
        />
      </StyledToggleBarWrapper>
      {!isOnboardingOpen && (
        <>
          {shouldRenderPopover && (
            <DualPublishPopover
              isDirectPublish={isDirectPublish}
              onExitClick={closePopover}
              isPopoverOpen={isPopoverOpen}
              popovers={dualPublishConfig.popovers}
              profilesToSetup={profilesToSetup}
            />
          )}
          {shouldRenderPopover && isPopoverHighlighted && (
            <StyledSpotlightWrapper>
              <Spotlight opacity={0.75} targets={spotlightTargets} />
            </StyledSpotlightWrapper>
          )}
        </>
      )}
    </DualPublishToggleContainer>
  )
}

const StyledDualPublishToggle = venk(
  styled(StatefulInlineToggleBar)`
    height: 32px;
  `,
  'StyledDualPublishToggle',
)

interface DualPublishToggleProps {
  initialPublishingMode?: string | null
  onSelectDirectPublish(): void
  onSelectPushPublish(): void
  dualPublishConfig: {
    defaultToggleBtn: string
    popovers: {
      pushPublish?: PopoverType
      directPublish?: PopoverType
    }
  }
  instagramProfiles?: Array<{
    avatar?: string
    username: string
    socialProfileId: number
  }>
  postType: InstagramPostType
  isNonIGNetworkSelected?: boolean
  isOnboardingOpen?: boolean
}

/**
 * Returns a DualPublishToggle component
 *
 * @param {string} initialPublishingMode the initial publishingMode selection for the toggle
 * @param {object} dualPublishConfig contains information on popovers, copy, and CTA onclick events
 * @param {array} instagramProfiles
 * @param {InstagramPostType} postType
 * @param {boolean} isOnboardingOpen
 * @param {function} onSelectDirectPublish
 * @param {function} onSelectPushPublish
 * @returns {object} a DualPublishToggle component
 */
const DualPublishToggle = ({
  initialPublishingMode,
  dualPublishConfig,
  instagramProfiles,
  postType,
  isOnboardingOpen,
  onSelectDirectPublish,
  onSelectPushPublish,
  isNonIGNetworkSelected,
}: DualPublishToggleProps) => {
  const selectedInstagramIds = instagramProfiles.map(profile => profile.socialProfileId)
  return (
    <StyledDualPublishToggle
      dualPublishConfig={dualPublishConfig}
      instagramProfiles={instagramProfiles}
      postType={postType}
      selectedInstagramIds={selectedInstagramIds}
      onSelectDirectPublish={onSelectDirectPublish}
      onSelectPushPublish={onSelectPushPublish}
      initialPublishingMode={initialPublishingMode}
      isNonIGNetworkSelected={isNonIGNetworkSelected}
      isOnboardingOpen={isOnboardingOpen}
    />
  )
}

DualPublishToggle.displayName = 'DualPublishToggle'

DualPublishToggle.defaultProps = {
  instagramProfiles: [],
}

export default DualPublishToggle
