import React from 'react'
import styled from 'styled-components'
import Send from '@fp-icons/action-send'
import Mobile from '@fp-icons/emblem-mobile'
import Icon from '@fp-icons/icon-base'
import { venk } from 'fe-hoc-venkman'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'

const DualPublishToggleContainer = withHsTheme(
  venk(
    styled.div`
      display: flex;
      flex-direction: row;
      align-items: center;
      margin-right: ${() => getThemeValue(t => t.spacing.spacing12)};
    `,
    'DualPublishToggleContainer',
  ),
)

const DualPublishToggleText = withHsTheme(
  venk(
    styled.p`
      font-size: ${() => getThemeValue(t => t.typography.metadata.size)};
      color: ${() => getThemeValue(t => t.colors.darkGrey80)};
      margin: 0 ${() => getThemeValue(t => t.spacing.spacing12)} 0 0;
    `,
    'DualPublishToggleText',
  ),
)

DualPublishToggleText.displayName = 'DualPublishToggleText'
DualPublishToggleContainer.displayName = 'DualPublishToggleContainer'

const PushIconToggle = withHsTheme(props => (
  <Icon
    fill={
      props.isSelected ? getThemeValue(t => t.colors.lightGrey10) : getThemeValue(t => t.colors.primary80)
    }
    glyph={Mobile}
    size="20"
    {...props}
  />
))

const DirectIconToggle = withHsTheme(props => (
  <Icon
    fill={
      props.isSelected ? getThemeValue(t => t.colors.lightGrey10) : getThemeValue(t => t.colors.primary80)
    }
    glyph={Send}
    size="16"
    {...props}
  />
))

export { DualPublishToggleContainer, DualPublishToggleText, DirectIconToggle, PushIconToggle }
