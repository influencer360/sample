import React from 'react'
import Tooltip, { PLACEMENT_BOTTOM } from 'fe-adp-comp-tooltip'
import { PENDO_TARGETS } from 'fe-lib-pendo'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import { ENTER, keyboardEventHandler } from 'fe-pnc-lib-keyboard-events'
import { IG_REEL_DISABLED_TOOLTIP_TEXT, MAX_WIDTH_TOOLTIP } from './consts'
import { SELECTED_CLASS_NAME, POST_TYPE_LABEL_TEXT_OLD, POST_TYPE_LABEL_TEXT } from './post-type-toggle'
import { PostTypeToggleButton } from './post-type-toggle.style'

export const PostTypeToggleButtons = ({
  selectedPostType,
  handleClick,
  isPostTypeDisabled,
  shouldShowStoriesPaywall = true,
}) => {
  // Combine post type toggle "Post" and "Reel" into "Post" to simplify IG Video posts experience
  const postTypeText = isFeatureEnabledOrBeta('PUB_28787_SIMPLIFY_IG_POST_TYPES')
    ? POST_TYPE_LABEL_TEXT
    : POST_TYPE_LABEL_TEXT_OLD

  const postTypes = isFeatureEnabledOrBeta('PUB_28787_SIMPLIFY_IG_POST_TYPES')
    ? [
        SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_FEED,
        SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY,
      ]
    : Object.keys(SocialProfileConstants.INSTAGRAM_POST_TYPES)

  return postTypes.map(postType => {
    const shouldDisablePostType = !!isPostTypeDisabled(postType)
    const isPostTypeSelected = isFeatureEnabledOrBeta('PUB_28787_SIMPLIFY_IG_POST_TYPES')
      ? selectedPostType === postType ||
        (selectedPostType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_REEL &&
          postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_FEED)
      : selectedPostType === postType

    return (
      <Tooltip
        key={`${postType}-tooltip`}
        className={`vk-PostTypeToggleTooltip vk-PostTypeToggleTooltip-${postTypeText[
          postType
        ].toLowerCase()} ${shouldDisablePostType ? 'showTooltip' : 'hideTooltip'}`} // if the postType is disabled, we want to show the tooltip on hover
        placement={PLACEMENT_BOTTOM}
        tooltip={IG_REEL_DISABLED_TOOLTIP_TEXT}
        disabled={!shouldDisablePostType}
        whiteSpace={'nowrap'}
        maxWidth={MAX_WIDTH_TOOLTIP}
      >
        <PostTypeToggleButton
          className={selectedPostType === postType && SELECTED_CLASS_NAME}
          aria-label={`Instagram ${postTypeText[postType]}`}
          key={postType}
          isSelected={isPostTypeSelected}
          onKeyDown={keyboardEventHandler({
            [ENTER]: () => handleClick(postType),
          })}
          onClick={() => handleClick(postType)}
          disabled={shouldDisablePostType}
          data-dap-target={
            postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY && shouldShowStoriesPaywall
              ? PENDO_TARGETS.NEW_INSTAGRAM_STORY
              : null
          }
          text={shouldDisablePostType ? IG_REEL_DISABLED_TOOLTIP_TEXT : undefined}
        >
          {postTypeText[postType]}
        </PostTypeToggleButton>
      </Tooltip>
    )
  })
}
