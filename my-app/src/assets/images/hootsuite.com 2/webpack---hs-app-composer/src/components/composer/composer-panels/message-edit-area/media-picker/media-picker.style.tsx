import styled from 'styled-components'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

export const Header = withHsTheme(styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  padding: 0 0 ${() => getThemeValue(t => t.spacing.spacing4)} 0;
`)

export const LinkScrapeWarning = withHsTheme(styled.div`
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing8)};
`)

export const MediaPickerContainer = withHsTheme(styled.div`
  padding: ${() => getThemeValue(t => t.spacing.spacing24)};
`)
