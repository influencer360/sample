import styled from 'styled-components'

import { getThemeValue, withHsTheme } from 'fe-lib-theme'

export const Header = withHsTheme(styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing12)};
`)
Header.displayName = 'ApproverHeader'

export const Subtitle = withHsTheme(
  styled.p`
    color: ${() => getThemeValue(t => t.colors.darkGrey)};
    font-size: ${() => getThemeValue(t => t.typography.bodyPlaceHolder.size)};
    margin-bottom: ${() => getThemeValue(t => t.spacing.spacing12)};
  `,
)
Subtitle.displayName = 'ApproverSubtitle'
