import styled from 'styled-components'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

export const EditPanelSubtitle = withHsTheme(styled.div`
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: nowrap;

  color: ${() => getThemeValue(t => t.colors.darkGrey)};
  font-weight: ${() => getThemeValue(t => t.typography.label.weight)};
`)
EditPanelSubtitle.displayName = 'LinkPreviewEditPanelSubtitle'

export const EditPanel = withHsTheme(styled.div`
  margin: ${() => getThemeValue(t => t.spacing.spacing16)} 0 ${() => getThemeValue(t => t.spacing.spacing16)}
    0;
`)
EditPanel.displayName = 'LinkPreviewEditPanel'

export const EditPanelText = withHsTheme(styled.div`
  flex: 1 0 auto;
  text-align: left;
  font-weight: ${() => getThemeValue(t => t.typography.label.weight)};
  font-size: ${() => getThemeValue(t => t.typography.label.size)};
  color: ${() => getThemeValue(t => t.colors.darkGrey)};
`)
EditPanelText.displayName = 'LinkPreviewEditPanelText'

export const ThumbnailWrapper = venk(
  withHsTheme(styled.div`
    position: relative;
    margin: 0 ${() => getThemeValue(t => t.spacing.spacing8)} ${() => getThemeValue(t => t.spacing.spacing8)}
      0;
    cursor: pointer;
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100px;
      height: 100px;
      ${p =>
        p.isSelected &&
        `
      box-shadow: inset 0 0 0 ${getThemeValue(t => t.spacing.focusBorder)} ${getThemeValue(
          t => t.colors.focusBorder,
        )};
      `}
    }
    &:focus {
      outline: none;
      &::after {
        box-shadow: inset 0 0 0 ${() => getThemeValue(t => t.spacing.focusBorder)}
          ${() => getThemeValue(t => t.colors.focusBorder)};
      }
    }
  `),
  'CustomLinkPreviewThumbnailWrapper',
)
ThumbnailWrapper.displayName = 'CustomLinkPreviewThumbnailWrapper'

export const CustomizeLinkPreviewUploadButton = venk(
  withHsTheme(
    styled.div`
      display: flex;
      flex: 0 0 auto;
      flex-direction: column;
      flex-wrap: nowrap;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      width: 100px;
      height: 100px;
      border: 1px dashed ${() => getThemeValue(t => t.colors.darkGrey60)};
      text-align: center;
      box-sizing: border-box;
    `,
  ),
  'CustomizeLinkPreviewUploadButton',
)
CustomizeLinkPreviewUploadButton.displayName = 'CustomizeLinkPreviewUploadButton'

export const ImagesContentHolder = withHsTheme(styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-top: ${() => getThemeValue(t => t.spacing.spacing8)};
`)
ImagesContentHolder.displayName = 'LinkPreviewImagesContentHolder'

export const LoadingThumb = withHsTheme(styled.div`
  flex: 0 0 auto;
  padding: 2px;
  width: 100px;
  height: 100px;
  margin: 0 ${() => getThemeValue(t => t.spacing.spacing8)} ${() => getThemeValue(t => t.spacing.spacing8)} 0;
  background: ${() => getThemeValue(t => t.colors.darkGrey20)};
  position: relative;
  box-sizing: border-box;
`)
LoadingThumb.displayName = 'LinkPreviewLoadingThumb'

export const EditPanelLink = styled.div`
  flex: 0 0 auto;
  text-align: right;
  font-weight: normal;
`
EditPanelLink.displayName = 'LinkPreviewEditPanelLink'

export const ToggleThumbnailButton = venk(
  withHsTheme(styled.button`
    font-family: ${() => getThemeValue(t => t.typography.fontFamily.primary)};
    font-weight: ${() => getThemeValue(t => t.typography.hyperlink.weight)};
    font-size: ${() => getThemeValue(t => t.typography.hyperlink.size)};
    color: ${() => getThemeValue(t => t.colors.secondary)};

    &:focus {
      text-decoration: underline;
    }
  `),
  'ToggleThumbnailButton',
)
ToggleThumbnailButton.displayName = 'LinkPreviewToggleThumbnailButton'
