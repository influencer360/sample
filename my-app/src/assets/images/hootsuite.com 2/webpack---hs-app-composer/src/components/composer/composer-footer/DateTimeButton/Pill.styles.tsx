import styled from 'styled-components'
import Icon from '@fp-icons/icon-base'
import { Button, ICON } from 'fe-comp-button'
import { venk } from 'fe-hoc-venkman'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'
import { ExpandedUiMixin } from 'fe-pnc-comp-composer-modal'

export const getPillBgColor = (isActive: boolean, hasError: boolean): string => {
  getThemeValue(t => {
    if (isActive) {
      return hasError ? t.colors.primary20 : t.colors.primary40
    } else {
      return t.colors.primary20
    }
  })
}

export const Root = withHsTheme(styled.div<{
  hasError: boolean
  isActive: boolean
  isPrimary: boolean
  isClosable: boolean
}>`
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  color: ${() => getThemeValue(t => t.colors.tag.text)};
  box-shadow: ${p => `
    inset 0px 0px 0px
    ${getThemeValue(t => t.spacing.focusBorder)}
    ${p.hasError ? getThemeValue(t => t.colors.errorBorder) : 'transparent'}
  `};
  background: ${p => getPillBgColor(p.isActive, p.hasError)};
  cursor: pointer;
  padding: 2px ${p => getThemeValue(t => (p.isClosable ? t.spacing.spacing8 : t.spacing.spacing16))} 2px
    ${() => getThemeValue(t => t.spacing.spacing16)};
  max-width: 500px;
  min-height: ${() => getThemeValue(t => t.spacing.spacing44)};
  box-sizing: border-box;
  border-radius: 2px;
  ${ExpandedUiMixin}

  &:focus {
    outline: none;
    box-shadow: inset 0px 0px 0px ${() => getThemeValue(t => t.spacing.focusBorder)}
      ${() => getThemeValue(t => t.colors.focusBorder)};
  }

  ${p =>
    p.isPrimary &&
    `
  background: ${getThemeValue(t => t.colors.primary20)};

  &:focus {
    background: ${getThemeValue(t => t.colors.primary40)};
  }

  &:hover:not([disabled]):not(:active) {
    background-color:${getThemeValue(t => t.colors.primary40)};
  }

  &:focus-visible {
    background-color: ${getThemeValue(t => t.colors.primary40)};
  }

  &:active {
    background-color: ${getThemeValue(t => t.colors.primary40)};
  }`}
`)
Root.displayName = 'DateTimePillRoot'

export const Content = styled.div`
  display: flex;
  align-items: center;
  line-height: 0;
`
Content.displayName = 'DateTimePillContent'

export const PillIcon = withHsTheme(styled(Icon)<{ hasError: boolean }>`
  margin-right: ${() => getThemeValue(t => t.spacing.spacing8)};
  fill: ${({ hasError }) => (hasError ? getThemeValue(t => t.colors.complementaryRed) : 'currentColor')};
`)

export const CloseButton = withHsTheme(
  venk(
    styled(Button).attrs({
      type: ICON,
      //eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore We need to force a specific height.
      height: 20,
    })`
      margin-left: 10px;
      background: none;
    `,
    'DateTimeCloseButton',
  ),
)
CloseButton.displayName = 'DateTimeCloseButton'

export const CloseButtonIcon = withHsTheme(styled(Icon)`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  fill: ${() => getThemeValue(t => t.colors.primary)};
`)
