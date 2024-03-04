import styled from 'styled-components'
import { Banner } from 'fe-comp-banner'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'

export const LinkPreviewPanel = withHsTheme(styled.div`
  position: relative;
  &:nth-child(2) {
    margin-bottom: ${() => getThemeValue(t => t.spacing.spacing20)};
  }
`)
LinkPreviewPanel.displayName = 'LinkPreviewLinkPreviewPanel'

export const ContentPanel = withHsTheme(styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: flex-start;
  min-height: 0;
  background: ${() => getThemeValue(t => t.colors.lightGrey10)};
`)
ContentPanel.displayName = 'LinkPreviewContentPanel'

export const LoaderPanel = styled.div`
  height: 80px;
  position: relative;
`
LoaderPanel.displayName = 'LinkPreviewLoaderPanel'

// Remove hasError prop with PUB_30706_LINK_SETTINGS_PNE
export const PreviewPanel = withHsTheme(styled.div<{ hasError: boolean }>`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;

  padding: ${() => getThemeValue(t => t.spacing.spacing12)} ${() => getThemeValue(t => t.spacing.spacing60)}
    ${() => getThemeValue(t => t.spacing.spacing16)} ${() => getThemeValue(t => t.spacing.spacing12)};

  border: 1px solid
    ${({ hasError }) => getThemeValue(t => (hasError ? t.colors.errorBorder : t.colors.darkGrey60))};
  border-bottom: 1px solid ${() => getThemeValue(t => t.colors.darkGrey60)};
`)
PreviewPanel.displayName = 'LinkPreviewPreviewPanel'

export const PreviewRightPanel = withHsTheme(styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;

  min-width: 0;
`)
PreviewRightPanel.displayName = 'LinkPreviewPreviewRightPanel'

export const PreviewLeftPanel = withHsTheme(styled.div`
  flex: 0 1 auto;
  width: 100px;
  min-width: 100px;
  padding-right: ${() => getThemeValue(t => t.spacing.spacing24)};
`)
PreviewLeftPanel.displayName = 'LinkPreviewPreviewLeftPanel'

export const PreviewLink = withHsTheme(styled.div`
  font-weight: ${() => getThemeValue(t => t.typography.hyperlink.weight)};
  font-size: ${() => getThemeValue(t => t.typography.hyperlink.size)};
  word-break: break-all;
  color: ${() => getThemeValue(t => t.colors.darkGrey)};
`)
PreviewLink.displayName = 'LinkPreviewPreviewLink'

export const PreviewTitle = withHsTheme(styled.div`
  font-weight: ${() => getThemeValue(t => t.typography.label.weight)};
  font-size: ${() => getThemeValue(t => t.typography.label.size)};
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing4)};
  color: ${() => getThemeValue(t => t.colors.darkGrey)};
`)
PreviewTitle.displayName = 'LinkPreviewPreviewTitle'

export const PreviewDescription = withHsTheme(styled.div`
  font-weight: ${() => getThemeValue(t => t.typography.body.weight)};
  font-size: ${() => getThemeValue(t => t.typography.body.size)};
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing12)};
  color: ${() => getThemeValue(t => t.colors.darkGrey)};
`)
PreviewDescription.displayName = 'LinkPreviewPreviewDescription'

export const GenericBanner = styled(Banner)`
  margin-top: ${() => getThemeValue(t => t.spacing.spacing16)};
`
