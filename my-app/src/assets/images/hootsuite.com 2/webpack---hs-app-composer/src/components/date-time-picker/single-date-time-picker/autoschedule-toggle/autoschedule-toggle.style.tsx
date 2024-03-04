import React from 'react'

import styled from 'styled-components'
import Icon from '@fp-icons/icon-base'
import SymbolInfoCircle from '@fp-icons/symbol-info-circle'
import { Button, ICON, SIZE_28 } from 'fe-comp-button'
import { InputToggle } from 'fe-comp-input-toggle'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

export const AutoScheduleHelpWrapper = styled.div`
  z-index: 10;
  display: inline-block;
`
AutoScheduleHelpWrapper.displayName = 'AutoScheduleHelpWrapper'

export const AutoScheduleSelector = withHsTheme(styled.div`
  align-items: center;
  background-color: ${() => getThemeValue(t => t.colors.lightGrey10)};
  border-bottom: 1px solid ${() => getThemeValue(t => t.colors.dropdownMenu.border)};
  bottom: ${p => (p.initialOpen ? '502px' : '512px')};
  color: ${() => getThemeValue(t => t.colors.darkGrey)};
  display: flex;
  left: ${p => (p.initialOpen ? '-110px' : '-10px')};
  margin: 0 auto;
  transition: margin 300ms ease;
  width: 280px;
`)
AutoScheduleSelector.displayName = 'AutoScheduleSelector'

export const AutoScheduleSelectorLabel = withHsTheme(styled.div`
  display: inline-block;
  font-weight: ${() => getThemeValue(t => t.typography.body.weight)};
  font-size: ${() => getThemeValue(t => t.typography.body.size)};
  padding: ${() =>
    getThemeValue(
      t => `${t.spacing.spacing12} ${t.spacing.spacing4} ${t.spacing.spacing12} ${t.spacing.spacing12}`,
    )};
`)
AutoScheduleSelectorLabel.displayName = 'AutoScheduleSelectorLabel'

const NewIconWrapper = props => <Button type={ICON} height={SIZE_28} {...props} />

export const AutoScheduleSelectorHelpIcon = props => (
  <NewIconWrapper {...props}>
    <Icon glyph={SymbolInfoCircle} />
  </NewIconWrapper>
)
AutoScheduleSelectorHelpIcon.displayName = 'AutoScheduleSelectorHelpIcon'

export const AutoScheduleSelectorToggle = styled.div`
  display: flex;
  flex: 1;
  justify-content: flex-end;
`
AutoScheduleSelectorToggle.displayName = 'AutoScheduleSelectorToggle'

export const AutoScheduleInputToggle = venk(styled(InputToggle)``, 'AutoScheduleInputToggle')
AutoScheduleInputToggle.displayName = 'AutoScheduleInputToggle'

export const PopoverTitle = withHsTheme(styled.p`
  display: inline-block;
  font-size: ${() => getThemeValue(t => t.typography.body.size)};
  font-weight: ${() => getThemeValue(t => t.typography.label.weight)};
  margin: 0 ${() => getThemeValue(t => t.spacing.spacing4)} 0 0;
`)
PopoverTitle.displayName = 'AutoSchedulePopoverTitle'
