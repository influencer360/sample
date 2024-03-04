import styled from 'styled-components'

import { withHsTheme, getThemeValue } from 'fe-lib-theme'

export const ListItem = withHsTheme(styled.button`
  text-align: left;
  transition: all 0.2s ease;
  cursor: pointer;
  box-sizing: border-box;
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing8)};
  padding: 12px;
  border: 2px solid ${() => getThemeValue(t => t.colors.secondary10)};
  background-color: ${() => getThemeValue(t => t.colors.lightGrey20)};
  :hover {
    background-color: ${() => getThemeValue(t => t.colors.accent20)};
    cursor: pointer;
    :not(:focus) {
      border: 3px solid ${() => getThemeValue(t => t.colors.focusBorder)};
    }
  }
`)
ListItem.displayName = 'AIListItem'

export const FeatureContainer = withHsTheme(styled.div`
  display: flex;
  flex-direction: row;
  gap: ${() => getThemeValue(t => t.spacing.spacing12)};
  align-items: center;
`)
FeatureContainer.displayName = 'FeatureContainer'

export const FeatureDescription = withHsTheme(styled.div`
  margin-top: ${() => getThemeValue(t => t.spacing.spacing4)};
  overflow-wrap: break-word;
  word-wrap: break-word;
  -ms-word-break: break-all;
  word-break: break-word;
`)
FeatureDescription.displayName = 'FeatureDescription'

export const IconContainer = withHsTheme(styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: ${() => getThemeValue(t => t.colors.accent40)};
  min-width: ${() => getThemeValue(t => t.spacing.spacing32)};
  height: ${() => getThemeValue(t => t.spacing.spacing32)};
`)
IconContainer.displayName = 'IconContainer'
