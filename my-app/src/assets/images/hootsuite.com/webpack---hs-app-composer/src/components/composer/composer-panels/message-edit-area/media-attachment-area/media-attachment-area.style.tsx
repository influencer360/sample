import styled from 'styled-components'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'
import { MediaSelector } from 'fe-pnc-comp-media-selector'

export const Root = withHsTheme(styled.div.attrs({ className: 'rc-MediaAttachmentArea' })`
  & > div:not(:last-child) {
    margin-bottom: ${() => getThemeValue(t => t.spacing.spacing12)};
  }
`)
Root.displayName = 'MediaAttachmentAreaRoot'

export const SortableList = withHsTheme(styled.div.attrs({ className: 'rc-SortableList' })`
  & > div:not(:last-child) {
    margin-bottom: ${() => getThemeValue(t => t.spacing.spacing12)};
  }
`)
SortableList.displayName = 'MediaAttachmentAreaSortableList'

export const VideoTranscodingInfo = venk(
  withHsTheme(
    styled.div`
      display: flex;
      margin-top: ${() => getThemeValue(t => t.spacing.spacing4)};
    `,
  ),
  `VideoTranscodingInfo`,
)
VideoTranscodingInfo.displayName = 'VideoTranscodingInfo'

export const MediaSelectorContainer = styled.div`
  display: flex;
`
MediaSelectorContainer.displayName = 'MediaSelectorContainer'

export const StyledMediaSelector = venk(
  styled(MediaSelector)`
    border-left-color: transparent;
  `,
  'MediaSelectorLibrary',
)

StyledMediaSelector.displayName = 'StyledMediaSelector'
