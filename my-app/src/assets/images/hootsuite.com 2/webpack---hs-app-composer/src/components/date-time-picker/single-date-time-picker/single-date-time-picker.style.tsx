import React from 'react'
import styled from 'styled-components'
import { Button, PRIMARY, SECONDARY, UPGRADE } from 'fe-comp-button'
import { Dialog, Header, Icons } from 'fe-comp-dialog'
import { A } from 'fe-comp-dom-elements'
import { venk } from 'fe-hoc-venkman'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'

const DateTimePickerWrapper = styled.div`
  outline: none;
`
const DateTimePicker = withHsTheme(
  venk(
    styled.div`
      width: 280px;
      margin: 0 auto;
      background-color: ${() => getThemeValue(t => t.colors.lightGrey10)};
      font-size: ${() => getThemeValue(t => t.typography.body.size)};
    `,
    'SingleDateTimePicker',
  ),
)

const DoneBtnContainer = withHsTheme(styled.div`
  display: flex;
  justify-content: center;
  padding: ${() => getThemeValue(t => `0 ${t.spacing.spacing8} ${t.spacing.spacing8} ${t.spacing.spacing8}`)};
`)

const StyledSetButton = withHsTheme(
  venk(
    styled(Button).attrs({
      type: SECONDARY,
    })`
      width: 100%;
    `,
    'SetButton',
  ),
)

const StyledSetLink = withHsTheme(
  venk(
    styled(A)`
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin-bottom: ${() => getThemeValue(t => t.spacing.spacing16)};

      &:hover {
        text-decoration: underline;
      }
    `,
    'SetButton',
  ),
)

const SetButton = props =>
  props.isAutoscheduled ? <StyledSetLink {...props} /> : <StyledSetButton {...props} />

const AutoScheduleInfo = withHsTheme(styled.div`
  display: block;
  width: 280px;
  height: 450px;
  margin: 0 auto;
  color: ${() => getThemeValue(t => t.colors.darkGrey)};
  background-color: ${() => getThemeValue(t => t.colors.lightGrey10)};
  transition: margin 300ms ease;
`)

const AutoScheduleInfoImageWrapper = withHsTheme(styled.div`
  width: 230px;
  padding: ${() => getThemeValue(t => t.spacing.spacing24)};
  text-align: center;
`)

const AutoScheduleInfoText = withHsTheme(styled.div`
  padding: 0 ${() => getThemeValue(t => t.spacing.spacing24)};
  font-size: ${() => getThemeValue(t => t.typography.body.size)};
`)

const AutoScheduleInfoBtnContainer = withHsTheme(styled.div`
  padding: ${() => getThemeValue(t => t.spacing.spacing24)};
  text-align: center;
`)

const AutoScheduleInfoBtn = props => <Button type={SECONDARY} width="100%" {...props} />

const AutoScheduleInfoTimezone = withHsTheme(styled.div`
  color: ${() => getThemeValue(t => t.colors.darkGrey80)};
  font-size: ${() => getThemeValue(t => t.typography.small.size)};
  padding-top: ${() => getThemeValue(t => t.spacing.spacing8)};
  font-family: ${() => getThemeValue(t => t.typography.fontFamily.primary)};
  text-align: left;
`)

const StyledDialog = styled(Dialog)`
  width: 630px;
`

const StyledDialogHeaderTitle = styled(Header.Title)`
  margin-bottom: 0;
`

const AutoScheduleMessagePaywallImage = styled.div`
  width: 100%;
  text-align: center;
`

const AutoScheduleImageWrapper = withHsTheme(styled.div`
  width: 200px;
  padding: ${() => getThemeValue(t => t.spacing.spacing24)};
  display: inline-block;
  -webkit-user-drag: none;
  user-select: none;
`)

const AutoScheduleMessagePaywallInfoText = withHsTheme(styled.div`
  text-align: left;
  font-size: ${() => getThemeValue(t => t.typography.body.size)};
  font-weight: ${() => getThemeValue(t => t.typography.body.weight)};
  padding-bottom: ${() => getThemeValue(t => t.spacing.spacing16)};
`)

const DialogFooterContent = styled.div`
  display: flex;
  flex-direction: row-reverse;
`

const AutoScheduleMessagePaywallButtonContainer = withHsTheme(styled.div`
  margin-right: ${p => (p.firstButton ? '0' : getThemeValue(t => t.spacing.spacing8))};
`)

const AutoScheduleMessagePaywallUpgradeButton = withHsTheme(
  styled(Button).attrs({
    type: UPGRADE,
  })``,
)

const AutoScheduleMessagePaywallCloseButton = withHsTheme(
  styled(Button).attrs({
    type: PRIMARY,
  })``,
)

const IconCloseButton = props => (
  <Icons>
    <Icons.Close {...props} />
  </Icons>
)

const SendDateErrorContainer = withHsTheme(styled.div`
  padding: 0 ${() => getThemeValue(t => t.spacing.spacing12)};
  background-color: ${() => getThemeValue(t => t.colors.toast.error.background)};
`)

SetButton.displayName = 'SetButton'
AutoScheduleInfo.displayName = 'AutoScheduleInfo'
AutoScheduleInfoImageWrapper.displayName = 'AutoScheduleInfoImage'
AutoScheduleInfoText.displayName = 'AutoScheduleInfoText'
AutoScheduleInfoBtnContainer.displayName = 'AutoScheduleInfoBtnContainer'
AutoScheduleInfoTimezone.displayName = 'AutoScheduleInfoTimezone'

export {
  DateTimePickerWrapper,
  DateTimePicker,
  DoneBtnContainer,
  SetButton,
  AutoScheduleInfo,
  AutoScheduleInfoImageWrapper,
  AutoScheduleInfoText,
  AutoScheduleInfoBtnContainer,
  AutoScheduleInfoBtn,
  AutoScheduleInfoTimezone,
  StyledDialog,
  StyledDialogHeaderTitle,
  DialogFooterContent,
  AutoScheduleMessagePaywallImage,
  AutoScheduleImageWrapper,
  AutoScheduleMessagePaywallInfoText,
  AutoScheduleMessagePaywallButtonContainer,
  AutoScheduleMessagePaywallUpgradeButton,
  AutoScheduleMessagePaywallCloseButton,
  IconCloseButton,
  SendDateErrorContainer,
}
