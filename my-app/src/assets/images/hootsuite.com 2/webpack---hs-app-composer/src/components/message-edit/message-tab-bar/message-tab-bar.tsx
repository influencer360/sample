import React, { useEffect, memo } from 'react'
import { connect as reduxConnect } from 'react-redux'
import { useMediaQuery } from 'react-responsive'
import Icon from '@fp-icons/icon-base'
import SymbolAlertCircle from '@fp-icons/symbol-alert-circle'
import SymbolAlertTriangle from '@fp-icons/symbol-alert-triangle'
import { ROLE_TABLIST } from 'fe-comp-toggle-bar'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { getThemeValue } from 'fe-lib-theme'
import type { InstagramPublishingMode } from 'fe-pnc-constants'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkGroup, InstagramPostType } from 'fe-pnc-constants-social-profiles'
import { setTaggingProfileId } from 'fe-pnc-data-products'
import { store as socialProfileStore } from 'fe-pnc-data-social-profiles-v2'
import type { SocialProfileState, Profile } from 'fe-pnc-data-social-profiles-v2'
import { usePrevious } from 'fe-pnc-lib-hooks'
import ComposerConstants from '@/constants/composer'
import { composerActions } from '@/redux/reducers/composer'
import { AppDispatch, RootState } from '@/redux/store'
import ComposerUtils from '@/utils/composer-utils'
import ProfileUtils from '@/utils/profile-utils'
import { MESSAGE_TAB_BAR } from '../message-edit-content/message-edit-content'
import {
  CONTENT,
  SMALL,
  FILL_WHITE,
  CURRENT_COLOR,
  CONTENT_TEXT,
  INITIAL_CONTENT_TEXT,
  CLIPBOARD_TEXT,
} from './constants'
import { getSelectedTab, getSNIcon, getTabs, capitalizeFirstLetter } from './helpers'
import {
  TabBarContainer,
  StyledToggleBar,
  ContentTabContainer,
  ContentTabTextContainer,
  StyledIcon,
} from './message-tab-bar.style'

const SOCIAL_NETWORK_GROUPS = Object.keys(SocialProfileConstants.SOCIAL_NETWORK_TABS)

// Remove references to isInstagramStory with PUB-27145
const itemRender = (selectedNetworkGroups: Array<SocialNetworkGroup>, useClipboardText: boolean) => {
  return ({ isSelected, value, hasError, errorLevel }) => {
    const fillColour = isSelected ? FILL_WHITE : CURRENT_COLOR
    const iconContainerMediaQuery = '(min-width: 1425px)'
    const showAlertIcon = hasError && useMediaQuery({ query: iconContainerMediaQuery })
    const errorIconColour = isSelected ? FILL_WHITE : getThemeValue(t => t.colors.complementaryRed)
    const warningIconColour = isSelected ? FILL_WHITE : getThemeValue(t => t.colors.accent)

    // Note: the classNames in ContentTabContainer are used strictly for integration test targeting
    // and should not be used for styling
    if (
      useClipboardText &&
      selectedNetworkGroups.length === 1 &&
      selectedNetworkGroups.every(snGroup => snGroup === SocialProfileConstants.SN_GROUP.INSTAGRAM)
    ) {
      value = SocialProfileConstants.SN_GROUP.INSTAGRAM
      return (
        <ContentTabContainer key={value} className={`vk-TabClipboardText`}>
          <Icon glyph={getSNIcon(value)} fill={fillColour} />
          <ContentTabTextContainer>{CLIPBOARD_TEXT}</ContentTabTextContainer>
        </ContentTabContainer>
      )
    }
    if (value === CONTENT) {
      const venkmanClassName = selectedNetworkGroups.length > 0 ? `vk-TabInitialContent` : `vk-TabContent`
      return (
        <ContentTabContainer key={value} className={venkmanClassName}>
          {selectedNetworkGroups.length > 0 ? INITIAL_CONTENT_TEXT : CONTENT_TEXT}
        </ContentTabContainer>
      )
    } else {
      return (
        <ContentTabContainer key={value} className={`vk-Tab${capitalizeFirstLetter(value)}`}>
          <Icon glyph={getSNIcon(value)} fill={fillColour} />
          {selectedNetworkGroups.length === 1 && (
            <ContentTabTextContainer>{CONTENT_TEXT}</ContentTabTextContainer>
          )}
          {showAlertIcon && (
            <StyledIcon
              glyph={
                errorLevel === ComposerConstants.ERROR_LEVELS.ERRORS ? SymbolAlertTriangle : SymbolAlertCircle
              }
              fill={
                errorLevel === ComposerConstants.ERROR_LEVELS.ERRORS ? errorIconColour : warningIconColour
              }
              size={16}
            />
          )}
        </ContentTabContainer>
      )
    }
  }
}

interface MessageTabBarProps {
  dispatch: AppDispatch
  isBulkComposer: boolean
  isLoadingProfiles: boolean
  showOnSubmitErrors: boolean
  selectedNetworkGroup: SocialNetworkGroup | null
  selectedProfileIds: Array<number> | undefined
  socialProfiles: Array<Profile>
  onMouseDown: () => void
  perNetworkErrorCodes: Record<string, Array<number>> | []
  snGroupsWithUnlinkedMention: Array<string>
  postType: InstagramPostType
  publishingMode: InstagramPublishingMode
}

/**
 * Handles user input, only possible when > 1 SNs are selected
 * @param nextSelectedGroup The social network group tab that was selected
 */
const onChange = (nextSelectedGroup: SocialNetworkGroup, dispatch: AppDispatch) => {
  if (SOCIAL_NETWORK_GROUPS.includes(nextSelectedGroup)) {
    dispatch(composerActions.setSelectedNetworkGroup(nextSelectedGroup))
  } else {
    dispatch(composerActions.resetSelectedNetworkGroup())
  }
}

const MessageTabBar = ({
  dispatch = () => undefined,
  isBulkComposer = false,
  isLoadingProfiles = false,
  showOnSubmitErrors = false,
  onMouseDown = () => {},
  perNetworkErrorCodes = [],
  selectedProfileIds = [],
  selectedNetworkGroup = null,
  snGroupsWithUnlinkedMention = [],
  socialProfiles = [],
  postType = undefined,
  publishingMode = undefined,
}: MessageTabBarProps) => {
  const selectedNetworkGroups: Array<SocialNetworkGroup> = ProfileUtils.getSelectedNetworkGroups(
    socialProfiles,
    isLoadingProfiles,
    selectedProfileIds,
  )
  const previousSelectedNetworkGroup = usePrevious(selectedNetworkGroup)

  useEffect(() => {
    return () => {
      dispatch(composerActions.resetSelectedNetworkGroup())
    }
  }, [])

  useEffect(() => {
    if (previousSelectedNetworkGroup !== selectedNetworkGroup) {
      setTaggingProfileId(null)
    }
  }, [selectedNetworkGroup])

  // Handles changes from the socialProfile store via the SN picker
  useEffect(() => {
    if (selectedNetworkGroups.length === 1 && SOCIAL_NETWORK_GROUPS.includes(selectedNetworkGroups[0])) {
      dispatch(composerActions.setSelectedNetworkGroup(selectedNetworkGroups[0]))
    } else {
      dispatch(composerActions.resetSelectedNetworkGroup())
    }
  }, [selectedNetworkGroups.length])

  const useClipboardText =
    ComposerUtils.isPushPublishing(publishingMode) &&
    postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY

  return (
    <TabBarContainer onMouseDown={onMouseDown}>
      <StyledToggleBar
        id={MESSAGE_TAB_BAR}
        items={getTabs(
          isBulkComposer,
          selectedNetworkGroups,
          perNetworkErrorCodes,
          snGroupsWithUnlinkedMention,
          showOnSubmitErrors,
        )}
        itemRender={itemRender(selectedNetworkGroups, useClipboardText)}
        onChange={(nextSelectedGroup: SocialNetworkGroup) => onChange(nextSelectedGroup, dispatch)}
        role={ROLE_TABLIST}
        size={SMALL}
        value={getSelectedTab(selectedNetworkGroups, selectedNetworkGroup)}
      />
    </TabBarContainer>
  )
}

const MemoizedMessageTabBar = memo(MessageTabBar)

export default compose(
  connect(socialProfileStore, (state: SocialProfileState) => ({
    isLoadingProfiles: state.isLoadingProfiles,
    socialProfiles: state.allProfiles,
  })),
  reduxConnect(({ validation }: RootState) => ({
    showOnSubmitErrors: validation.showOnSubmitErrors,
  })),
)(MemoizedMessageTabBar)
