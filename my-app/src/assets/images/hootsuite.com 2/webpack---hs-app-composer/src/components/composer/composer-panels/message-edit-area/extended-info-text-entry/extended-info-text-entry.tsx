import React from 'react'

import { connect as reduxConnect } from 'react-redux'
import { InputText } from 'fe-comp-input-text'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { ValidationBanner } from 'fe-pnc-comp-field-validation-item'
import { store as composerMessageStore } from 'fe-pnc-data-composer-message'
import translation from 'fe-pnc-lib-hs-translation'
import { FIELD_TYPES, FIELD_VALIDATIONS } from 'fe-pnc-validation-error-messages'

import { RootState } from '@/redux/store'
import { FieldValidations } from '@/typings/Message'
import { TitleText } from '../title-text'
import { EntryContainer, Header, TitleContainer } from './extended-info-text-entry.style'

const noop = () => {}

interface ExtendedInfoTextEntryProps {
  extendedInfo: Record<string, unknown>
  extendedInfoKey: string
  getSelectedBoards?(...args: Array<unknown>): void
  onChange(...args: Array<unknown>): unknown
  placeHolder?: string
  showOnSubmitErrors?: boolean
  text: string
  validationError?(...args: Array<unknown>): boolean
  fieldValidations: FieldValidations
}

export const ExtendedInfoTextEntry = ({
  extendedInfo = {},
  extendedInfoKey,
  getSelectedBoards = () => [],
  onChange,
  placeHolder,
  showOnSubmitErrors = false,
  text,
  validationError = () => false,
  fieldValidations,
}: ExtendedInfoTextEntryProps) => {
  const onTextChange = event => {
    onChange(Object.assign({}, { [extendedInfoKey]: event.target.value }))
  }

  const titleText = translation._(text)

  return (
    <div className="rc-ExtendedInfoTextEntry">
      <Header className="-header">
        <TitleContainer>
          <TitleText>{titleText}</TitleText>
        </TitleContainer>
      </Header>
      <EntryContainer>
        <InputText
          compact={true}
          errorState={
            Array.isArray(getSelectedBoards()) &&
            getSelectedBoards()?.length > 0 &&
            showOnSubmitErrors &&
            Boolean(validationError() && validationError()[FIELD_VALIDATIONS.DESTINATION_URL])
          }
          onChange={onTextChange}
          placeholder={placeHolder}
          showLabel={false}
          value={extendedInfo[extendedInfoKey]}
          width="100%"
          label={titleText}
        />
      </EntryContainer>
      <ValidationBanner
        fieldValidations={fieldValidations}
        field={FIELD_VALIDATIONS.DESTINATION_URL}
        type={FIELD_TYPES.LINK}
        showOnSubmitErrors={showOnSubmitErrors}
        isBulkComposer={false}
      />
    </div>
  )
}

ExtendedInfoTextEntry.displayName = 'ExtendedInfoTextEntry'

export const ConnectedExtendedInfoTextEntry = compose(
  reduxConnect(({ validation }: RootState) => ({
    showOnSubmitErrors: validation.showOnSubmitErrors,
  })),
  connect(composerMessageStore, noop),
)(ExtendedInfoTextEntry)
