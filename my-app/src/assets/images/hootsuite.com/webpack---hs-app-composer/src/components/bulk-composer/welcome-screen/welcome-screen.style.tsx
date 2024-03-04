import React from 'react'
import styled from 'styled-components'
import Pencil from '@fp-icons/emblem-pencil'
import IconBase from '@fp-icons/icon-base'
import SymbolArrowDownCloud from '@fp-icons/symbol-arrow-down-cloud'
import TriangleDownSmall from '@fp-icons/triangle-down-small'
import TriangleRightSmall from '@fp-icons/triangle-right-small'
import { Banner } from 'fe-comp-banner'
import { Button, CTA, SIZE_44 } from 'fe-comp-button'
import { H4, H2 } from 'fe-comp-dom-elements'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'
import { DropdownMenu } from 'fe-pnc-comp-dropdown-menu'

const WelcomeScreenContainer = withHsTheme(styled.div`
  display: flex;
  flex: 1 0 auto;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: flex-start;
  font-size: ${() => getThemeValue(t => t.typography.body.size)};
  color: ${() => getThemeValue(t => t.colors.darkGrey)};
  min-height: 600px;
`)
WelcomeScreenContainer.displayName = 'WelcomeScreenContainer'

const Column = withHsTheme(
  styled.div`
    display: flex;
    flex: 1 0 auto;
    flex-direction: column;
    flex-wrap: nowrap;
    width: 50%;
    box-sizing: border-box;
    padding: ${() => getThemeValue(t => t.spacing.spacing40)};
    min-height: 0;
    background-color: ${() => getThemeValue(t => t.colors.lightGrey)};
    &:first-of-type {
      background-color: ${() => getThemeValue(t => t.colors.lightGrey40)};
    }
  `,
)
Column.displayName = 'Column'

const ControlColumnTitle = styled(H2)`
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing24)};
  font-size: ${() => getThemeValue(t => t.typography.pageTitle.size)};
`
ControlColumnTitle.displayName = 'ControlColumnTitle'

const SubHeader = withHsTheme(styled.p`
  font-size: ${() => getThemeValue(t => t.typography.body.size)};
  line-height: ${() => getThemeValue(t => t.typography.body.lineHeight)};
  margin: 0 0 ${() => getThemeValue(t => t.spacing.spacing4)} 0;
  color: ${() => getThemeValue(t => t.colors.darkGrey)};
`)
SubHeader.displayName = 'SubHeader'

const InputCheckboxContainer = withHsTheme(
  styled.div`
    margin-top: ${() => getThemeValue(t => t.spacing.spacing16)};
  `,
)
InputCheckboxContainer.displayName = 'InputCheckboxContainer'

const DateSelector = styled.div`
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: flex-start;
  align-items: left;
`
DateSelector.displayName = 'DateSelector'

const DatePreviewSection = withHsTheme(
  styled.div`
    display: flex;
    flex: 0 1 auto;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: left;
    margin-top: ${() => getThemeValue(t => t.spacing.spacing8)};
  `,
)
DatePreviewSection.displayName = 'DatePreviewSection'

const DatePreview = withHsTheme(
  styled.div`
    display: flex;
    flex: 0 1 auto;
    margin-top: ${() => getThemeValue(t => t.spacing.spacing24)};
    margin-bottom: ${() => getThemeValue(t => t.spacing.spacing44)};
    border: none;
    th,
    td {
      padding: ${() => getThemeValue(t => `0 ${t.spacing.spacing4} ${t.spacing.spacing4} 0`)};
    }

    th {
      font-size: ${() => getThemeValue(t => t.typography.body.size)};
      font-weight: ${() => getThemeValue(t => t.typography.sectionTitle.weight)};
      margin-bottom: ${() => getThemeValue(t => t.spacing.spacing4)};
      min-width: 230px;
    }
  `,
)
DatePreview.displayName = 'DatePreview'

const Instructions = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
`
Instructions.displayName = 'Instructions'

const InstructionsHeader = withHsTheme(
  styled.h2`
    display: flex;
    flex: 0 0 auto;
    font-size: ${() => getThemeValue(t => t.typography.subSectionTitle.size)};
    font-weight: ${() => getThemeValue(t => t.ypography.sectionTitle.weight)};
    color: ${() => getThemeValue(t => t.colors.darkGrey)};
    margin-bottom: ${() => getThemeValue(t => t.spacing.spacing24)};
  `,
)
InstructionsHeader.displayName = 'InstructionsHeader'

const InstructionsBody = styled.div`
  display: flex;
  flex: 1 1 auto;
`
InstructionsBody.displayName = 'InstructionsBody'

const BodyElement = withHsTheme(
  styled.li`
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    &:not(:last-child) {
      padding-bottom: ${() => getThemeValue(t => t.spacing.spacing24)};
    }
  `,
)
BodyElement.displayName = 'BodyElement'

const TutorialSection = styled.span``
TutorialSection.displayName = 'TutorialSection'

const RuleHeading = withHsTheme(
  styled.p`
    margin-bottom: ${() => getThemeValue(t => t.spacing.spacing20)};
    font-weight: ${() => getThemeValue(t => t.typography.subSectionTitle.weight)};
    font-size: ${() => getThemeValue(t => t.typography.body.size)};
  `,
)
RuleHeading.displayName = 'RuleHeading'

const RulesList = withHsTheme(
  styled.ul`
    span {
      font-size: ${() => getThemeValue(t => t.typography.body.size)};
    }
    li {
      margin-bottom: ${() => getThemeValue(t => t.spacing.spacing20)};
    }

    ul {
      margin-bottom: 0;
      > li {
        font-size: ${() => getThemeValue(t => t.typography.body.size)};
      }
    }
    ol {
      margin: 0;
      > li {
        font-size: ${() => getThemeValue(t => t.typography.body.size)};
        list-style-type: none;
        ul > li {
          margin-bottom: 0;
        }
      }
    }
  `,
)
RulesList.displayName = 'RulesList'

const CsvExampleTable = withHsTheme(
  styled.table`
    font-family: ${() => getThemeValue(t => t.typography.fontFamily.primary)};
    font-size: 12px;
    border-collapse: separate;
    table-layout: fixed;
    margin-top: ${() => getThemeValue(t => t.spacing.spacing24)};
    tr > th:first-of-type {
      width: 24px;
    }

    th,
    td {
      width: 152px;
      height: 24px;
      border: 1px solid ${() => getThemeValue(t => t.colors.darkGrey20)};
      border-radius: 3px;
      text-align: center;
    }

    th {
      background-color: ${() => getThemeValue(t => t.colors.darkGrey10)};
      color: ${() => getThemeValue(t => t.colors.darkGrey60)};
      font-weight: ${() => getThemeValue(t => t.typography.metadata.weight)};
    }
    td {
      background-color: ${() => getThemeValue(t => t.colors.lightGrey10)};
    }
  `,
)
CsvExampleTable.displayName = 'CsvExampleTable'

const ReviewMessagesButton = withHsTheme(
  styled(Button).attrs({
    type: CTA,
  })`
    align-self: flex-end;
    margin: 0 0 ${() => getThemeValue(t => t.colors.darkGrey24)};
  `,
)
ReviewMessagesButton.displayName = 'ReviewMessagesButton'

const FormatAndRulesButton = withHsTheme(
  styled(Button)`
    margin: ${() => getThemeValue(t => `${t.spacing.spacing24} 0 ${t.spacing.spacing40} 0`)};
  `,
)
FormatAndRulesButton.displayName = 'FormatAndRulesButton'

const FormatAndRulesButtonText = styled.span`
  vertical-align: middle;
`
FormatAndRulesButtonText.displayName = 'FormatAndRulesButtonText'
const DownloadExampleButton = withHsTheme(
  styled(Button)`
    margin-top: ${() => getThemeValue(t => t.spacing.spacing8)};
  `,
)
DownloadExampleButton.displayName = 'DownloadExampleButton'

const LegacyHeading = styled(H4)`
  font-size: 14px;
  font-weight: 600;
  margin: 12px 0 8px 0;
`
LegacyHeading.displayName = 'LegacyHeading'

const NewTutorialSectionHeading = withHsTheme(
  styled.h3`
    font-size: ${() => getThemeValue(t => t.typography.body.size)};
    font-weight: ${() => getThemeValue(t => t.typography.sectionTitle.weight)};
    margin: 0 0 8px 0;
  `,
)
NewTutorialSectionHeading.displayName = 'NewTutorialSectionHeading'

const LegacySectionHeading = withHsTheme(
  styled.h3`
    font-size: ${p => p.$theme(t => t.typography.size.body)};
    font-weight: ${p => p.$theme(t => t.typography.weight.bold)};
    margin: 12px 0 8px 0;
    margin-top: 0;
  `,
)
LegacySectionHeading.displayName = 'LegacySectionHeading'

const SectionHeading = withHsTheme(
  styled.h3`
    font-size: ${() => getThemeValue(t => t.typography.body.size)};
    font-weight: ${() => getThemeValue(t => t.typography.sectionTitle.weight)};
    margin: 0;
    margin-bottom: ${() => getThemeValue(t => t.spacing.spacing4)};
  `,
)
SectionHeading.displayName = 'SectionHeading'

const NewDateSelectorHeadingStyled = styled.div`
  margin-top: ${() => getThemeValue(t => t.spacing.spacing16)};
`
NewDateSelectorHeadingStyled.displayName = 'NewDateSelectorHeadingStyled'

const DateSelectorDropdown = withHsTheme(
  styled(DropdownMenu).attrs({
    width: '100%',
    shouldInitDropdownItems: true,
    height: SIZE_44,
  })`
    margin-top: ${() => getThemeValue(t => t.spacing.spacing8)};
  `,
)
DateSelectorDropdown.displayName = 'DateSelectorDropdown'

const FileSelectorContainer = withHsTheme(
  styled.div`
    margin-top: ${() => getThemeValue(t => t.spacing.spacing40)};
    margin-bottom: ${() => getThemeValue(t => t.spacing.spacing4)};
  `,
)
FileSelectorContainer.displayName = 'FileSelectorContainer'

const TriangleIcon = styled(IconBase)`
  margin-right: ${() => getThemeValue(t => t.spacing.spacing8)};
`
const SvgTriangleDown = () => (
  <TriangleIcon glyph={TriangleDownSmall} fill={getThemeValue(t => t.colors.button.text)} size="16" />
)
SvgTriangleDown.displayName = 'SvgTriangleDown'

const SvgTriangleRight = () => (
  <TriangleIcon fill={getThemeValue(t => t.colors.button.text)} glyph={TriangleRightSmall} size="16" />
)
SvgTriangleRight.displayName = 'SvgTriangleRight'

const InstructionsIcon = styled(IconBase)`
  margin-right: ${() => getThemeValue(t => t.spacing.spacing16)};
`

const SvgArrowDownCloud = () => (
  <div>
    <InstructionsIcon fill={getThemeValue(t => t.colors.primary)} glyph={SymbolArrowDownCloud} />
  </div>
)
SvgArrowDownCloud.displayName = 'SvgArrowDownCloud'

const SvgPencil = () => (
  <div>
    <InstructionsIcon fill={getThemeValue(t => t.colors.primary)} glyph={Pencil} />
  </div>
)
SvgPencil.displayName = 'SvgPencil'

const BodyWrapper = styled.ul`
  margin-bottom: 0;
`

const IGPersonalNotSupportedWarningBanner = styled(Banner)`
  margin-bottom: 15px;
`
IGPersonalNotSupportedWarningBanner.displayName = 'IGPersonalNotSupportedWarningBanner'

export {
  WelcomeScreenContainer,
  Column,
  ControlColumnTitle,
  SubHeader,
  InputCheckboxContainer,
  DateSelector,
  DatePreviewSection,
  DatePreview,
  Instructions,
  InstructionsBody,
  BodyElement,
  TutorialSection,
  RuleHeading,
  RulesList,
  CsvExampleTable,
  ReviewMessagesButton,
  FormatAndRulesButton,
  FormatAndRulesButtonText,
  DownloadExampleButton,
  LegacyHeading,
  SectionHeading,
  NewTutorialSectionHeading,
  InstructionsHeader,
  NewDateSelectorHeadingStyled,
  DateSelectorDropdown,
  FileSelectorContainer,
  SvgTriangleDown,
  SvgTriangleRight,
  SvgArrowDownCloud,
  SvgPencil,
  BodyWrapper,
  IGPersonalNotSupportedWarningBanner,
}
