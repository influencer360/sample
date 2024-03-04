import styled from 'styled-components'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

export const LinkPreviewWarningBanner = withHsTheme(styled.div`
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing16)};
`)
LinkPreviewWarningBanner.displayName = 'LinkPreviewWarningBanner'

export const HelpLink = withHsTheme(styled.span`
  margin-top: ${() => getThemeValue(t => t.spacing.spacing8)};
  font-weight: ${() => getThemeValue(t => t.typography.hyperlink.weight)};
  display: block;
`)
HelpLink.displayName = 'LinkPreviewHelpLink'
