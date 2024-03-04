import React, { memo, useState, useEffect } from 'react'
import { useMediaQuery } from 'react-responsive'
import styled from 'styled-components'
import ArrowDownSmall from '@fp-icons/arrow-down-small'
import Icon from '@fp-icons/icon-base'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'
import type { SocialNetworkGroup, SocialNetworkType } from 'fe-pnc-constants-social-profiles'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import { isFeatureEnabledOrBeta, isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import { Entitlements } from '@/typings/Flux'
import ComposerUtils from '@/utils/composer-utils'
import { track } from '@/utils/tracking'
import { PostTypeToggleButtons } from './post-type-toggle-buttons'
import { PostTypeToggleDropdown } from './post-type-toggle-dropdown'
import { PostTypeToggleContainer, PostTypeDropdownButton } from './post-type-toggle.style'
import { shouldShowStoriesPaywall } from './should-show-stories-paywall'

const { INSTAGRAM_POST_TYPES_TO_DISPLAY_TEXT, INSTAGRAM_POST_TYPES } = SocialProfileConstants

export const DEFAULT_POST_TYPE = INSTAGRAM_POST_TYPES.IG_FEED

export const POST_TYPE_LABEL_TEXT_OLD = {
  [INSTAGRAM_POST_TYPES.IG_FEED]: INSTAGRAM_POST_TYPES_TO_DISPLAY_TEXT.IG_FEED,
  [INSTAGRAM_POST_TYPES.IG_STORY]: INSTAGRAM_POST_TYPES_TO_DISPLAY_TEXT.IG_STORY,
  [INSTAGRAM_POST_TYPES.IG_REEL]: INSTAGRAM_POST_TYPES_TO_DISPLAY_TEXT.IG_REEL,
}
export const POST_TYPE_LABEL_TEXT = {
  [INSTAGRAM_POST_TYPES.IG_FEED]: INSTAGRAM_POST_TYPES_TO_DISPLAY_TEXT.IG_FEED,
  [INSTAGRAM_POST_TYPES.IG_REEL]: INSTAGRAM_POST_TYPES_TO_DISPLAY_TEXT.IG_FEED,
  [INSTAGRAM_POST_TYPES.IG_STORY]: INSTAGRAM_POST_TYPES_TO_DISPLAY_TEXT.IG_STORY,
}
export const SELECTED_CLASS_NAME = 'selected'

interface Props {
  updateFieldById: (messageId: number | null, fieldId: string, value: any) => void
  messageId: number | null
  postType: string | undefined
  selectedNetworkTypes: Array<SocialNetworkType> | undefined
  selectedProfileIds: Array<[]> | undefined
  selectedNetworkGroup: SocialNetworkGroup | undefined
  entitlements: Entitlements
}

const PostTypeToggle = ({
  updateFieldById,
  messageId,
  postType,
  selectedNetworkTypes,
  selectedProfileIds,
  entitlements,
}: Props) => {
  const [selectedPostType, setSelectedPostType] = useState(postType ?? DEFAULT_POST_TYPE)

  const handleClick = postType => {
    if (isFeatureEnabled('PUB_30956_TRACK_COMPOSER_TEXT_POST_TYPE_ACTIONS')) {
      track('web.publisher.full_screen_composer', `user_toggled_post_type_composer`, {
        socialNetworkId: selectedProfileIds,
        socialNetworkType: selectedNetworkTypes,
        postType,
      })
    }
    if (shouldShowStoriesPaywall(entitlements) && postType === INSTAGRAM_POST_TYPES.IG_STORY) {
      // Do nothing/don't switch publishing modes, Pendo will take care of showing the paywall
      return
    }
    if (postType !== selectedPostType) {
      setSelectedPostType(postType)
      updateFieldById(messageId, 'postType', postType)
    }
  }

  const isPostTypeDisabled = postType => {
    // currently the only time we disable a postType is for reels + ig personal
    if (
      postType === INSTAGRAM_POST_TYPES.IG_REEL &&
      selectedNetworkTypes &&
      ComposerUtils.hasInstagramPersonalNetwork(selectedNetworkTypes)
    ) {
      return true
    }
    return false
  }

  useEffect(() => {
    updateFieldById(messageId, 'postType', selectedPostType)
  }, [])

  useEffect(() => {
    if (postType && postType !== selectedPostType) {
      setSelectedPostType(postType)
      updateFieldById(messageId, 'postType', postType)
    }
  }, [postType])

  useEffect(() => {
    if (isPostTypeDisabled(selectedPostType)) {
      handleClick(DEFAULT_POST_TYPE)
    }
  }, [selectedNetworkTypes])

  const postTypeDropdownButton = () => {
    const ChevronDownIcon = withHsTheme(styled(Icon).attrs({
      fill: 'currentColor',
      glyph: ArrowDownSmall,
      size: getThemeValue(t => t.spacing.spacing16),
    })`
      flex: 1 0 auto;
      margin-left: ${() => getThemeValue(t => t.spacing.spacing8)};
    `)
    ChevronDownIcon.displayName = 'PostTypeDropdownChevronDownIcon'

    return (
      <PostTypeDropdownButton>
        {isFeatureEnabledOrBeta('PUB_28787_SIMPLIFY_IG_POST_TYPES')
          ? POST_TYPE_LABEL_TEXT[postType]
          : POST_TYPE_LABEL_TEXT_OLD[postType]}
        <ChevronDownIcon />
      </PostTypeDropdownButton>
    )
  }

  // Remove with DL PUB_28787_SIMPLIFY_IG_POST_TYPES
  const postTypeToggleMediaQuery = '(max-width: 1540px)'
  const isPostTypeCondensed = useMediaQuery({ query: postTypeToggleMediaQuery })

  const shouldRenderDropdown = isFeatureEnabledOrBeta('PUB_28787_SIMPLIFY_IG_POST_TYPES')
    ? true
    : isPostTypeCondensed

  const dropdownAnchor = postTypeDropdownButton
  return (
    <PostTypeToggleContainer>
      {shouldRenderDropdown && isFeatureEnabledOrBeta('PUB_27419_POSTTYPE_DROPDOWN')
        ? PostTypeToggleDropdown({
            selectedPostType,
            handleClick,
            isPostTypeDisabled,
            dropdownAnchor,
            shouldShowStoriesPaywall: shouldShowStoriesPaywall(entitlements),
          })
        : PostTypeToggleButtons({
            selectedPostType,
            handleClick,
            isPostTypeDisabled,
            shouldShowStoriesPaywall: shouldShowStoriesPaywall(entitlements),
          })}
    </PostTypeToggleContainer>
  )
}

export default memo(PostTypeToggle)
