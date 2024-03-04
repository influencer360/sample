import styled from 'styled-components'
import { A } from 'fe-comp-dom-elements'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

export const MessagePreviewAreaComp = venk(
  styled.div`
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    flex-grow: 1;
    min-height: 0;
    background-color: ${() => getThemeValue(t => t.colors.darkGrey10)};
    color: ${getThemeValue(t => t.colors.darkGrey)};
  `,
  'MessagePreviewArea',
)

export const PreviewArea = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  flex-grow: 1;
  align-items: center;
  justify-content: flex-start;
  min-height: 0;
  overflow-y: auto;
  padding: 32px 0;
`

export const MessagePreviewContainer = venk(
  styled.div`
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    width: 450px;
    padding: 0 0 32px 0;
    align-items: center;
  `,
  'MessagePreviewContainer',
)

export const Disclaimer = withHsTheme(
  venk(
    styled.div`
      width: 400px;
      font-size: ${() => getThemeValue(t => t.typography.timestamp.size)};
      text-align: center;
      line-height: ${() => getThemeValue(t => t.typography.timestamp.lineHeight)};
    `,
    'MessagePreviewDisclaimer',
  ),
)

export const DisclaimerLink = withHsTheme(styled(A)`
  font-size: ${() => getThemeValue(t => t.typography.timestamp.size)};
  line-height: ${() => getThemeValue(t => t.typography.timestamp.lineHeight)};
`)

MessagePreviewAreaComp.displayName = 'MessagePreviewAreaComp'
PreviewArea.displayName = 'PreviewArea'
MessagePreviewContainer.displayName = 'MessagePreviewContainer'
Disclaimer.displayName = 'Disclaimer'
DisclaimerLink.displayName = 'DisclaimerLink'
