import React from 'react'

import { SocialProfilePill } from 'fe-chan-comp-social-profile-pill'
import { PRIMARY } from 'fe-comp-button'
import { Popover, SCROLL_PARENT, TOP } from 'fe-comp-popover'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import translation from 'fe-pnc-lib-hs-translation'

import { Popover as PopoverType } from '@/typings/DualPublish'

import {
  PopoverBodyContainer,
  PopoverButton,
  PopoverContentContainer,
  Profile,
  ProfileContainer,
} from './dual-publish-popover.style'

export const DIRECT_PUBLISH_POPOVER_ANCHOR_CLASS_NAME = '_directPublishPopoverAnchor'
export const PUSH_PUBLISH_POPOVER_ANCHOR_CLASS_NAME = '_pushPublishPopoverAnchor'

const SET_UP = translation._('Set up')
const CONNECT = translation._('Connect')

const PopoverContent = ({ isDirectPublish, popovers, contentBody, profilesToSetup }) => {
  return (
    <PopoverContentContainer>
      <PopoverBodyContainer>
        <p>{contentBody}</p>
        <ProfileContainer>
          {profilesToSetup.map(profile => (
            <Profile key={profile.username}>
              <SocialProfilePill
                username={profile.username}
                avatarUrl={profile.avatar}
                socialProfileType={SocialProfileConstants.SN_TYPES.INSTAGRAM}
              />
              <PopoverButton
                type={PRIMARY}
                onClick={() =>
                  isDirectPublish
                    ? popovers.directPublish.onClickAction({ profile })
                    : popovers.pushPublish.onClickAction({ profile })
                }
              >
                {isDirectPublish ? CONNECT : SET_UP}
              </PopoverButton>
            </Profile>
          ))}
        </ProfileContainer>
      </PopoverBodyContainer>
    </PopoverContentContainer>
  )
}

interface DualPublishPopoverProps {
  isDirectPublish: boolean
  onExitClick(): void
  isPopoverOpen: boolean
  profilesToSetup?: Array<{
    avatar?: string
    username: string
    socialProfileId: number
  }>
  popovers: {
    pushPublish?: PopoverType
    directPublish?: PopoverType
  }
}

/**
 * Returns a DualPublishPopover component with content dictated by what permissions
 * are available for the user based on their selected social networks
 *
 * @param {boolean} isDirectPublish
 * @param {function} onExitClick callback when the popover is closed
 * @param {boolean} isPopoverOpen, state passed down from the toggle
 * @param {object} popovers an object containing Dual Publish popovers
 * @returns {object} a DualPublishToggle component
 */
const DualPublishPopover = ({
  isDirectPublish,
  onExitClick,
  isPopoverOpen,
  popovers,
  profilesToSetup,
}: DualPublishPopoverProps) => {
  const anchorClassName = isDirectPublish
    ? DIRECT_PUBLISH_POPOVER_ANCHOR_CLASS_NAME
    : PUSH_PUBLISH_POPOVER_ANCHOR_CLASS_NAME
  const popoverHeading = isDirectPublish ? popovers.directPublish.heading : popovers.pushPublish.heading
  const contentBody = isDirectPublish ? popovers.directPublish.body : popovers.pushPublish.body

  return (
    <Popover
      popTo={TOP}
      target={`.${anchorClassName}`}
      boundariesElement={SCROLL_PARENT}
      hasExitButton={true}
      isOpen={isPopoverOpen}
      onExitClick={onExitClick}
      heading={popoverHeading}
      width="441px"
      key={profilesToSetup}
    >
      <PopoverContent
        isDirectPublish={isDirectPublish}
        popovers={popovers}
        contentBody={contentBody}
        profilesToSetup={profilesToSetup}
      />
    </Popover>
  )
}

PopoverContent.displayName = 'PopoverContent'
DualPublishPopover.displayName = 'DualPublishPopover'

DualPublishPopover.defaultProps = {
  profilesToSetup: [],
}

export default DualPublishPopover
