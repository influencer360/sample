import styled from 'styled-components'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'
import { MediaDropzoneOverlay } from 'fe-pnc-comp-media-upload'
import { AttachmentConstants } from 'fe-pnc-constants'

export const MessageEditAreaWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
`
MessageEditAreaWrapper.displayName = 'MessageEditAreaWrapper'

export const EditContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  flex: 1 1 auto;
  min-height: 0;
`
EditContainer.displayName = 'MessageEditAreaEditContainer'

export const EditContent = withHsTheme(styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  flex: 1 1 auto;
  justify-content: flex-start;
  min-height: 0;
  padding: 0 ${() => getThemeValue(t => t.spacing.spacing32)};
  > div {
    max-width: 885px;
    min-width: 350px;
    padding: ${() => getThemeValue(t => t.spacing.spacing24)} 0 0 0;
    width: 100%;
    &:last-child {
      padding-bottom: ${() => getThemeValue(t => t.spacing.spacing24)};
    }
  }
`)
EditContent.displayName = 'MessageEditAreaEditContent'

export const MessageSettingsContainer = withHsTheme(styled.div`
  > div {
    border-top: 1px solid ${() => getThemeValue(t => t.colors.darkGrey20)};
    padding: ${() => getThemeValue(t => t.spacing.spacing24)} 0;
    &:last-child {
      padding-bottom: 0;
    }
  }
`)
MessageSettingsContainer.displayName = 'MessageEditAreaSettingsContainer'

export const ProfileSelectorErrorContainer = venk(
  styled.div`
    &&&&& {
      padding-top: 0;
    }
  `,
  'ProfileSelectorError',
)
ProfileSelectorErrorContainer.displayName = 'MessageEditAreaProfileSelectorErrorContainer'

export const StyledMediaDropzoneOverlay = styled(MediaDropzoneOverlay)`
  display: none;
  height: 100%;
  z-index: 2;
  ${p => p.isBulkComposer && 'left: 50%;'} ${AttachmentConstants.DROPZONE_SELECTOR}.dz-drag-hover & {
    display: block;
  }
`
StyledMediaDropzoneOverlay.displayName = 'MessageEditAreaStyledMediaDropzoneOverlay'

export const BannerArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const LightbulbWrapper = withHsTheme(styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px;
  background: ${() => getThemeValue(t => t.colors.secondary40)};
  border-radius: 100px;
  margin: 12px 10px 12px 12px;

  > svg {
    view-box: 0 0 15 18;
  }

  > svg > path {
    fill: ${() => getThemeValue(t => t.colors.secondary)};
  }
`)

BannerArea.displayName = 'BannerArea'
