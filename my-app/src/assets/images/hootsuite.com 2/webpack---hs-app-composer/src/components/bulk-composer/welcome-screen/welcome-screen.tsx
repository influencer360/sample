/**
 * @preventMunge
 */

import React from 'react'
import cloneDeep from 'lodash/cloneDeep'
import _ from 'underscore'

import { TYPE_WARNING } from 'fe-comp-banner'
import { SECONDARY, STANDARD } from 'fe-comp-button'
import { BOTTOM_LEFT } from 'fe-comp-dropdown'
import { InputCheckbox } from 'fe-comp-input-checkbox'
import { logError } from 'fe-lib-logging'
import { hasMemberReachedSNMax } from 'fe-lib-pendo'
import { FileSelector } from 'fe-pnc-comp-file-selector'
import { ConnectedSocialNetworkPicker } from 'fe-pnc-comp-social-network-picker'
import type { SocialNetworkType } from 'fe-pnc-constants-social-profiles'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { Profile } from 'fe-pnc-data-social-profiles-v2'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'

import LOGGING_CATEGORIES from '@/constants/logging-categories'
import { DateFormat } from '@/typings/BulkComposer'
import { Organization } from '@/typings/Flux'
import { SocialNetworksKeyedByType } from '@/typings/SocialNetwork'
import BulkMessageDateUtils from '@/utils/bulk-message-date-utils'
import { formatDateTime } from '@/utils/composer-date-time-utils'
import ComposerUtils from '@/utils/composer-utils'

import translations from './translations'
import {
  BodyElement,
  BodyWrapper,
  Column,
  ControlColumnTitle,
  CsvExampleTable,
  DatePreview,
  DatePreviewSection,
  DateSelector,
  DateSelectorDropdown,
  DownloadExampleButton,
  FileSelectorContainer,
  FormatAndRulesButton,
  FormatAndRulesButtonText,
  InputCheckboxContainer,
  Instructions,
  InstructionsBody,
  InstructionsHeader,
  NewDateSelectorHeadingStyled,
  ReviewMessagesButton,
  RuleHeading,
  RulesList,
  SectionHeading,
  SubHeader,
  SvgArrowDownCloud,
  SvgPencil,
  SvgTriangleDown,
  SvgTriangleRight,
  TutorialSection,
  WelcomeScreenContainer,
  IGPersonalNotSupportedWarningBanner,
} from './welcome-screen.style'

const FILE_SELECTOR_BUTTON_WIDTH = '191px'
const FILE_SELECTOR_BUTTON_HEIGHT = '44px'
const FILE_SELECTOR_ACCEPTED_FILE_TYPES = '.csv'

const SocialNetworkPickerWithSocialProfiles = ConnectedSocialNetworkPicker
SocialNetworkPickerWithSocialProfiles.displayName = 'SocialNetworkPickerWithSocialProfiles'

const DateSelectorHeading = () => (
  <NewDateSelectorHeadingStyled>
    <SectionHeading>{translations.DATES_FORMATTING_MISMATCH_TITLE}</SectionHeading>
    <SubHeader>{translations.DATES_FORMATTING_MISMATCH_SUB_TITLE}</SubHeader>
  </NewDateSelectorHeadingStyled>
)

interface WelcomeScreenProps {
  excludedNetworkTypes?: Array<SocialNetworkType>
  fetchDataForBulkComposer?: (organization: Organization) => void
  isLoading?: boolean
  onNextClicked(
    file: File | null,
    selectedDateFormat: DateFormat | null,
    parsedDates: Record<string, unknown>,
    shouldSetDefaultPostType: boolean,
  ): void
  privateSocialProfiles: Array<Profile>
  selectedSocialNetworkIds: Array<number>
  setShouldShortenUrlsInBulk: () => void
  shouldShortenUrlsInBulk?: boolean
  socialProfilesKeyedByType?: SocialNetworksKeyedByType
  timezoneName: string
  updateSelectedSocialNetworks(selectedSocialNetworkIds: Array<number>): void
}

interface WelcomeScreenState {
  selectedDateFormat: DateFormat | null
  file: File | null
  isParsingFile: boolean
  showFormatAndRules: boolean
  dateFormatItems: Array<any>
  parsedDates: Record<string, unknown>
}

class WelcomeScreen extends React.Component<WelcomeScreenProps, WelcomeScreenState> {
  static displayName = 'WelcomeScreen'

  static defaultProps = {
    excludedNetworkTypes: [],
    fetchDataForBulkComposer: () => {},
    isLoading: false,
    selectedSocialNetworkIds: [],
    shouldShortenUrlsInBulk: true,
  }

  constructor(props: WelcomeScreenProps) {
    super(props)

    this.state = {
      selectedDateFormat: null,
      file: null,
      isParsingFile: false,
      showFormatAndRules: false,
      dateFormatItems: [], // used only by new date process
      parsedDates: {}, // used only by new date process
    }
  }

  onDateFormatSelect = index => {
    this.setState({ selectedDateFormat: this.state.dateFormatItems[index].value })
  }

  onProfileSelected = id => {
    const selectedSocialNetworkIds = cloneDeep(this.props.selectedSocialNetworkIds)
    let selectedSocialNetworkIndex
    if (!Array.isArray(id)) {
      selectedSocialNetworkIndex = selectedSocialNetworkIds.indexOf(id)
      if (selectedSocialNetworkIndex > -1) {
        selectedSocialNetworkIds.splice(selectedSocialNetworkIndex, 1) // modifies the array in place
      } else {
        selectedSocialNetworkIds.push(id)
      }
    } else {
      _.each(id, i => {
        selectedSocialNetworkIndex = selectedSocialNetworkIds.indexOf(i)
        if (selectedSocialNetworkIndex > -1) {
          selectedSocialNetworkIds.splice(selectedSocialNetworkIndex, 1) // modifies the array in place
        } else {
          selectedSocialNetworkIds.push(i)
        }
      })
    }

    this.props.updateSelectedSocialNetworks(selectedSocialNetworkIds)
  }

  onNextClicked = () => {
    const { selectedSocialNetworkIds, socialProfilesKeyedByType } = this.props

    // Checking only for IG Business because IG Personal profile cannot be selected in bulk composer
    const hasInstagramAccountSelected = !!selectedSocialNetworkIds?.find(selectedSocialNetworkId =>
      socialProfilesKeyedByType?.[SocialProfileConstants.SN_TYPES.INSTAGRAMBUSINESS]?.find(
        socialProfile => socialProfile.socialProfileId === selectedSocialNetworkId,
      ),
    )

    this.props.onNextClicked(
      this.state.file,
      this.state.selectedDateFormat,
      this.state.parsedDates,
      hasInstagramAccountSelected,
    )
  }

  onFileSelected = (files: Array<File>) => {
    if (files?.length) {
      this.setState({ file: files[0] })
      this.setState({ isParsingFile: true })
      const reader = new FileReader()
      reader.onloadend = e => {
        const error = e.target?.error

        if (error) {
          logError(LOGGING_CATEGORIES.BULK_COMPOSER, 'Failed during receiving preview data', {
            errorMessage: JSON.stringify(error.message),
          })
        } else if (typeof e.target?.result === 'string') {
          const result = e.target.result
          this.determineDateFormatsFromCsv(result)
        } else {
          logError(LOGGING_CATEGORIES.BULK_COMPOSER, 'Uploaded file is not a valid CSV')
        }
        this.setState({ isParsingFile: false })
      }
      reader.readAsText(files[0])
    } else {
      this.setState({
        file: null,
        isParsingFile: false,
        dateFormatItems: [],
        parsedDates: {},
        selectedDateFormat: null,
      })
    }
  }

  determineDateFormatsFromCsv(fileText: string) {
    const lines = BulkMessageDateUtils.parseLinesFromFile(fileText)
    const dateOneDayAgo = new Date(Date.now() - 1000 * 3600 * 24)

    const parsedDates = BulkMessageDateUtils.parseDatesFromLines(
      lines,
      this.props.timezoneName,
      dateOneDayAgo,
    )

    // Sort the formats in order of quality
    const sortedFormats = BulkMessageDateUtils.getPrioritizedFormats(
      parsedDates.formats,
      parsedDates.parsedDates,
    )

    // If there are zero formats available, throw an error message to the user (this means all their dates were garbage)
    if (sortedFormats.length === 0) {
      // TODO: Use a modal to tell the user it failed - No valid dates were found in the file. Please try another file.
    } else {
      // If there are multiple formats, create items in a dropdown for them to select
      let formatItems = []
      if (sortedFormats.length > 1) {
        formatItems = sortedFormats.map(format => ({
          label: parsedDates.labels[format],
          value: format,
        }))
      }

      this.setState({
        dateFormatItems: formatItems,
        parsedDates: parsedDates.parsedDates,
        selectedDateFormat: sortedFormats[0],
      })
    }
  }

  getSelectedDateFormatIndex() {
    return this.state.dateFormatItems.findIndex(item => item.isSelected)
  }

  renderControlBlurb() {
    return [
      <ControlColumnTitle key="controlBlurbHeader">{translations.LETS_GET_STARTED}</ControlColumnTitle>,
      <SubHeader key="controlBlurbDescription">{translations.NEED_CSV_FILE}</SubHeader>,
    ]
  }

  renderFileSelector() {
    return (
      <FileSelectorContainer>
        <FileSelector
          accept={FILE_SELECTOR_ACCEPTED_FILE_TYPES}
          fileName={this.state.file ? this.state.file.name : ''}
          height={FILE_SELECTOR_BUTTON_HEIGHT}
          label={translations.UPLOAD_CSV}
          onChange={this.onFileSelected}
          width={FILE_SELECTOR_BUTTON_WIDTH}
        />
      </FileSelectorContainer>
    )
  }

  renderProfileSelector() {
    const shouldShowPaywall = hasMemberReachedSNMax()
    return (
      <SocialNetworkPickerWithSocialProfiles
        onProfileSelected={this.onProfileSelected}
        onProfilesRemoved={() => this.props.updateSelectedSocialNetworks([])}
        selectedSocialNetworkIds={this.props.selectedSocialNetworkIds}
        onFetchSocialProfiles={this.props.fetchDataForBulkComposer}
        excludedNetworkTypes={this.props.excludedNetworkTypes}
        showHeader={false}
        shouldShowPaywall={shouldShowPaywall}
      />
    )
  }

  renderIGPersonalNotSupportedWarningBanner() {
    return (
      <IGPersonalNotSupportedWarningBanner
        titleText={translations.IG_PERSONAL_NOT_SUPPORTED_TITLE}
        messageText={translations.generateIGPersonalNotSupportedMessage()}
        type={TYPE_WARNING}
      />
    )
  }

  renderShortenerCheckbox() {
    const { setShouldShortenUrlsInBulk, shouldShortenUrlsInBulk } = this.props
    return (
      <InputCheckboxContainer>
        <InputCheckbox
          checked={shouldShortenUrlsInBulk !== true} // if we should shorten, it should NOT be checked
          className="-dontShortenCheckbox"
          label={translations.DO_NOT_SHORTEN}
          onChange={setShouldShortenUrlsInBulk}
        />
      </InputCheckboxContainer>
    )
  }

  renderDateSelector() {
    if (this.state.dateFormatItems.length === 0) {
      return null
    }

    let dateFormatLabel = ''
    this.state.dateFormatItems.forEach(dateFormatItem => {
      dateFormatItem.isSelected = this.state.selectedDateFormat === dateFormatItem.value // the property is used by the dropdown component
      if (dateFormatItem.isSelected) {
        dateFormatLabel = dateFormatItem.label
      }
    })

    const datePreviewRows = Object.keys(this.state.parsedDates)
      .slice(0, 3)
      .map(exampleLineNum => {
        const example = this.state.parsedDates[exampleLineNum]
        const dateObject = new Date(example.parsedFormats[this.state.selectedDateFormat])

        return (
          <tr key={_.uniqueId('dateString_')}>
            <td>{example.dateString}</td>
            <td>
              {example.parsedFormats[this.state.selectedDateFormat]
                ? formatDateTime(dateObject)
                : translations.NOT_AVAILABLE_IN_THIS_FORMAT}
            </td>
          </tr>
        )
      })
    const datePreview = (
      <DatePreview>
        <table>
          <thead>
            <tr>
              <th>Example from your file</th>
              <th>How we interpret this date</th>
            </tr>
          </thead>
          <tbody>{datePreviewRows}</tbody>
        </table>
      </DatePreview>
    )

    return (
      <DateSelector>
        <DateSelectorHeading />
        <DatePreviewSection>
          <DateSelectorDropdown
            attachmentPosition={BOTTOM_LEFT}
            defaultLabel={dateFormatLabel}
            onSelect={this.onDateFormatSelect}
            selectedItem={this.getSelectedDateFormatIndex()}
          >
            {this.state.dateFormatItems.map(item => item.label)}
          </DateSelectorDropdown>
          {datePreview}
        </DatePreviewSection>
      </DateSelector>
    )
  }

  renderNextButton() {
    const twitterProfiles = _.filter(this.props.privateSocialProfiles, p => {
      return p.socialProfileType === SocialProfileConstants.SN_TYPES.TWITTER
    })
    if (
      this.props.socialProfilesKeyedByType &&
      this.props.socialProfilesKeyedByType[SocialProfileConstants.SN_TYPES.TWITTER]
    ) {
      twitterProfiles.push({
        ...this.props.socialProfilesKeyedByType[SocialProfileConstants.SN_TYPES.TWITTER],
      })
    }
    const selectedTwitterProfiles = _.compact(
      _.map(twitterProfiles, socialProfile => {
        if (
          this.props.selectedSocialNetworkIds &&
          _.contains(this.props.selectedSocialNetworkIds, socialProfile.socialProfileId)
        ) {
          return socialProfile
        } else return null
      }),
    )
    const hasInvalidSocialNetworks = this.props.selectedSocialNetworkIds.length === 0
    return (
      <ReviewMessagesButton
        disabled={
          hasInvalidSocialNetworks ||
          this.state.file === null ||
          (!isFeatureEnabled('ALLOW_TWITTER_MULTI_POST') && selectedTwitterProfiles.length > 1)
        }
        isLoading={this.props.isLoading || this.state.isParsingFile}
        onClick={this.onNextClicked}
      >
        {translations.REVIEW_MESSAGES}
      </ReviewMessagesButton>
    )
  }

  renderControlColumn() {
    return (
      <Column>
        {this.renderControlBlurb()}
        {this.renderFileSelector()}
        {ComposerUtils.hasInstagramPersonalNetworkBulkComposer(
          this.props.socialProfilesKeyedByType,
          this.props.selectedSocialNetworkIds,
        ) && this.renderIGPersonalNotSupportedWarningBanner()}
        {this.renderProfileSelector()}
        {this.renderShortenerCheckbox()}
        {this.renderDateSelector()}
        {this.renderNextButton()}
      </Column>
    )
  }
  renderFormatAndRulesSection() {
    const toggleFormatAndRulesSection = () => {
      this.setState(prevState => ({
        showFormatAndRules: !prevState.showFormatAndRules,
      }))
    }

    if (this.state.showFormatAndRules) {
      return (
        <span>
          <FormatAndRulesButton onClick={toggleFormatAndRulesSection} type={SECONDARY}>
            <SvgTriangleDown />
            <FormatAndRulesButtonText>{translations.HIDE_FORMAT_AND_RULES}</FormatAndRulesButtonText>
          </FormatAndRulesButton>
          <RulesList>
            <li>
              <RuleHeading>
                {translations.COLUMN_A} {translations.DATE_AND_TIME_REQUIRED}
              </RuleHeading>
              <ol type="1">
                <li>
                  {translations.PLEASE_PROVIDE_BOTH_DATE_AND_TIME}
                  <ul>
                    <li>{translations.D_M_Y}</li>
                    <li>{translations.M_D_Y}</li>
                    <li>{translations.Y_M_D}</li>
                    <li>{translations.Y_D_M}</li>
                  </ul>
                </li>
                <li>{translations.DATE_AND_TIME_10_MINS_IN_FUTURE_REQUIRED}</li>
                <li>{translations.TIME_ENDS_WITH_5_OR_0}</li>
                <li>{translations.ONLY_ONE_MESSAGE_PER_TIME_SLOT}</li>
              </ol>
            </li>
            <li>
              <RuleHeading>
                {translations.COLUMN_B} {translations.MESSAGE_REQUIRED}
              </RuleHeading>
              <ol type="1">
                <li>{translations.DUPLICATE_MESSAGES_NOT_ALLOWED}</li>
                <li>{translations.TWITTER_LIMIT_CHARACTERS}</li>
              </ol>
            </li>
            <li>
              <RuleHeading>
                {translations.COLUMN_C} {translations.LINK_OPTIONAL}
              </RuleHeading>
              <ol type="1">
                <li>{translations.TWITTER_LIMIT_CHARACTERS_LINK}</li>
              </ol>
            </li>
            <li>
              <span>{translations.MESSAGE_LIMIT}</span>
              <ol type="1">
                <li>{translations.MESSAGE_LIMIT_350_MESSAGES}</li>
                <li>{translations.MAX_CSV_ROWS}</li>
              </ol>
            </li>
            <li>
              <span>{translations.MEDIA}</span>
              <ul>
                <li>{translations.MEDIA_UPLOAD_IN_NEXT_STEP}</li>
              </ul>
            </li>
          </RulesList>
        </span>
      )
    } else {
      return (
        <span>
          <FormatAndRulesButton onClick={toggleFormatAndRulesSection} type={SECONDARY}>
            <SvgTriangleRight />
            <FormatAndRulesButtonText>{translations.SHOW_FORMAT_AND_RULES}</FormatAndRulesButtonText>
          </FormatAndRulesButton>
        </span>
      )
    }
  }
  renderInstructionColumn() {
    const onDownloadExampleCSV = () =>
      (location.href = '/publisher/scheduler/bulk-schedule-upload?downloadSample=1')
    const body = (
      <BodyWrapper>
        <BodyElement>
          <SvgArrowDownCloud />
          <TutorialSection>
            <SectionHeading>{translations.DOWNLOAD_EXAMPLE_CSV}</SectionHeading>
            <SubHeader>{translations.DOWNLOAD_EXAMPLE_CSV_INSTRUCTIONS}</SubHeader>
            <DownloadExampleButton onClick={onDownloadExampleCSV} type={STANDARD}>
              {translations.DOWNLOAD_EXAMPLE_CSV_BUTTON}
            </DownloadExampleButton>
          </TutorialSection>
        </BodyElement>
        <BodyElement>
          <SvgPencil />
          <TutorialSection>
            <SectionHeading>{translations.PROVIDE_MESSAGE_DETAILS}</SectionHeading>
            <SubHeader>{translations.CSV_SHOULD_INCLUDE_FIELDS}</SubHeader>
            <CsvExampleTable>
              <tbody>
                <tr>
                  <th>&nbsp;</th>
                  <th>A</th>
                  <th>B</th>
                  <th>C</th>
                </tr>
                <tr>
                  <th>1</th>
                  <td>24/10/16 09:15</td>
                  <td>{translations.MY_MESSAGE}</td>
                  <td>https://www.example.com</td>
                </tr>
              </tbody>
            </CsvExampleTable>
            {this.renderFormatAndRulesSection()}
          </TutorialSection>
        </BodyElement>
      </BodyWrapper>
    )

    return (
      <Column>
        <Instructions>
          <InstructionsHeader>{translations.HOW_TO_PREPARE_MESSAGES}</InstructionsHeader>
          <InstructionsBody>{body}</InstructionsBody>
        </Instructions>
      </Column>
    )
  }

  render() {
    return (
      <WelcomeScreenContainer className="rc-WelcomeScreen">
        {this.renderControlColumn()}
        {this.renderInstructionColumn()}
      </WelcomeScreenContainer>
    )
  }
}

export default WelcomeScreen
