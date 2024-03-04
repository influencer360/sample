import styled from 'styled-components'
import { Button } from 'fe-comp-button'
import { venk } from 'fe-hoc-venkman'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'
import { ExpandedUiMixin } from 'fe-pnc-comp-composer-modal'

export const PostTypeToggleContainer = styled.div`
  gap: 27px;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
`

export const PostTypeToggleButton = venk(
  withHsTheme(
    styled(Button)<{
      isSelected: boolean
    }>`
      ${ExpandedUiMixin}
      cursor: pointer;
      display: flex;
      padding: ${() => getThemeValue(t => `${t.spacing.spacing4} ${t.spacing.spacing8}`)};
      height: 27px;
      min-width: 50px;
      gap: 10px;
      font-weight: ${p =>
        p.isSelected
          ? getThemeValue(t => t.typography.fontWeight.bold)
          : getThemeValue(t => t.typography.fontWeight.normal)};
      background-color: ${getThemeValue(t => t.colors.lightGrey10)};
      &:focus {
        background-color: ${getThemeValue(t => t.colors.lightGrey10)};
      }
      &:disabled {
        cursor: pointer;
      }
    `,
  ),
  'PostTypeToggleButton',
)
PostTypeToggleButton.displayName = 'PostTypeToggleButton'

export const PostTypeDropdownButton = venk(
  withHsTheme(styled(Button)`
    min-width: 87px;
    height: ${() => getThemeValue(t => t.spacing.spacing32)};
    color: ${() => getThemeValue(t => t.colors.primary)};
    cursor: pointer;
    text-align: center;
    font-family: ${() => getThemeValue(t => t.typography.fontFamily.primary)};
    font-weight: ${() => getThemeValue(t => t.typography.fontWeight.bold)};
    font-size: ${() => getThemeValue(t => t.typography.hyperlink.size)};
    line-height: ${() => getThemeValue(t => t.typography.hyperlink.lineHeight)};
    padding: 6px ${() => getThemeValue(t => t.spacing.spacing16)};
    background-color: ${getThemeValue(t => t.colors.lightGrey10)};

    &:focus {
      background-color: ${getThemeValue(t => t.colors.primary10)};
      outline: 3px solid ${getThemeValue(t => t.colors.focusBorder)};
    }
    &:hover:not([disabled]):not(:active) {
      background-color: ${getThemeValue(t => t.colors.primary10)};
    }
    &:disabled {
      cursor: pointer;
    }
  `),
  'PostTypeDropdownButton',
)
PostTypeDropdownButton.displayName = 'PostTypeDropdownButton'
