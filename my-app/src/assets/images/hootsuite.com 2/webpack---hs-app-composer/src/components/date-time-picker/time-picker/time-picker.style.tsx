import styled, { css } from 'styled-components'
import { venk } from 'fe-hoc-venkman'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'
import { DropdownMenu } from 'fe-pnc-comp-dropdown-menu'

const DropdownMenuContainer = styled.div`
  > div {
    width: 100%;
    display: block;
  }
`

const TimePickerContainer = venk(
  withHsTheme(styled.div`
    display: block;
    padding: ${() =>
      getThemeValue(
        t => `${t.spacing.spacing8} ${t.spacing.spacing8} ${t.spacing.spacing12} ${t.spacing.spacing8}`,
      )};
  `),
  'TimePicker',
)

const TimePickerDropdownWrapper = withHsTheme(styled.div`
  display: grid;
  gap: 0px ${() => getThemeValue(t => `${t.spacing.spacing4}`)};
  grid-template-columns: 1fr 1fr 1fr;
`)

const TimezoneContainer = withHsTheme(styled.div`
  display: flex;
  padding-top: ${() => getThemeValue(t => t.spacing.spacing8)};
`)

const Timezone = venk(
  withHsTheme(styled.div`
    flex: 1 1 auto;
    color: ${() => getThemeValue(t => t.colors.darkGrey80)};
    font-size: ${() => getThemeValue(t => t.typography.small.size)};
  `),
  'Timezone',
)

const DropdownStyles = css`
  button {
    width: 100%;
  }
`

const HourDropdown = venk(
  styled(DropdownMenuContainer)`
    ${DropdownStyles};
  `,
  'HourDropdown',
)
const MinuteDropdown = venk(
  styled(DropdownMenuContainer)`
    ${DropdownStyles};
  `,
  'MinuteDropdown',
)
const PeriodDropdown = venk(
  styled(DropdownMenuContainer)`
    ${DropdownStyles};
  `,
  'PeriodDropdown',
)

const StyledDropdownMenu = withHsTheme(styled(DropdownMenu)`
  padding: 0 ${() => getThemeValue(t => t.spacing.spacing16)};
`)

DropdownMenuContainer.displayName = 'DropdownMenuContainer'
HourDropdown.displayName = 'HourDropdown'
MinuteDropdown.displayName = 'MinuteDropdown'
PeriodDropdown.displayName = 'PeriodDropdown'
TimePickerContainer.displayName = 'TimePicker'
Timezone.displayName = 'Timezone'
TimezoneContainer.displayName = 'TimezoneContainer'

export {
  HourDropdown,
  MinuteDropdown,
  PeriodDropdown,
  StyledDropdownMenu,
  TimePickerContainer,
  TimePickerDropdownWrapper,
  Timezone,
  TimezoneContainer,
}
