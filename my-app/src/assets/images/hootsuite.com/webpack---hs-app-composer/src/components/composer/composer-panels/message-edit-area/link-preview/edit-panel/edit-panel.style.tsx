import styled from 'styled-components'
import { Button } from 'fe-comp-button'
import { H4 } from 'fe-comp-dom-elements'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

export const EditPanelWrapper = withHsTheme(styled.div`
  background-color: ${() => getThemeValue(t => t.colors.lightGrey10)};
  border: 1px solid ${() => getThemeValue(t => t.colors.darkGrey60)};
  padding: ${getThemeValue(t => t.spacing.spacing16)};
`)
EditPanelWrapper.displayName = 'LinkPreviewEditPanel'

export const EditPanelSubtitle = withHsTheme(styled.div`
  display: flex;
  flex-direction: row-reverse;
  flex-wrap: nowrap;
  font-weight: ${() => getThemeValue(t => t.typography.label.weight)};
  font-size: ${() => getThemeValue(t => t.typography.label.size)};
  color: ${() => getThemeValue(t => t.colors.darkGrey)};
`)
EditPanelSubtitle.displayName = 'LinkPreviewEditPanelSubtitle'

export const EditPanelText = withHsTheme(styled.div`
  flex: 1 0 auto;
  text-align: left;
  font-weight: ${() => getThemeValue(t => t.typography.label.weight)};
  font-size: ${() => getThemeValue(t => t.typography.label.size)};
  color: ${() => getThemeValue(t => t.colors.darkGrey)};
  margin-bottom: ${getThemeValue(t => t.spacing.spacing4)};
`)
EditPanelText.displayName = 'LinkPreviewEditPanelText'

export const EditPanelDescription = withHsTheme(styled.div`
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing24)};
`)
EditPanelDescription.displayName = 'LinkPreviewEditPanelDescription'

export const EditPanelInput = withHsTheme(styled.div`
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing24)};
  display: flex;

  & > div {
    flex: 1;
  }
`)
EditPanelInput.displayName = 'LinkPreviewEditPanelInput'

export const ActionPanel = withHsTheme(styled.div`
  margin-top: ${() => getThemeValue(t => t.spacing.spacing24)};
  text-align: right;
`)
ActionPanel.displayName = 'LinkPreviewActionPanel'

export const Heading = withHsTheme(styled(H4)`
  font-weight: ${() => getThemeValue(t => t.typography.label.weight)};
  font-size: ${() => getThemeValue(t => t.typography.label.size)};
`)
Heading.displayName = 'LinkPreviewHeading'

export const SaveButton = styled(Button)`
  margin-left: 8px;
`
SaveButton.displayName = 'LinkPreviewSaveButton'
