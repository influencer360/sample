import React from 'react'

import axios from 'fe-axios'
import { Content, Dialog, Footer, Header, Icons } from 'fe-comp-dialog'
import { InputBanner, TYPE_ERROR } from 'fe-comp-input-banner'
import { InputCheckbox } from 'fe-comp-input-checkbox'
import { InputText } from 'fe-comp-input-text'
import { logError } from 'fe-lib-logging'
import { ConnectedSocialNetworkPicker } from 'fe-pnc-comp-social-network-picker'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import { createPinterestBoard } from 'fe-pnc-lib-api'
import { FocusManager } from 'fe-pnc-lib-focus-manager'
import translation from 'fe-pnc-lib-hs-translation'

import Constants from '@/constants/constants'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import {
  BoardNameTextInputContainer,
  CancelButton,
  Container,
  Field,
  FieldTitle,
  ModalContainer,
  SubmitButton,
} from './pinterest-board-creation-modal.style'

const CANCEL = translation._('Cancel')
const CREATE_BOARD = translation._('Create board')
const CREATE_NEW_BOARD = translation._('Create new board')
const CREATE_NEW_BOARD_DESCRIPTION = translation._('Create a new board in your Pinterest account')
const PINTEREST_ACCOUNT = translation._('Pinterest account')
const SELECT_PINTEREST_ACCOUNT = translation._('Select Pinterest account(s)')
const NAME_BOARD = translation._('Name your board')
const BOARD_NAME = translation._('Board name')
const SECRET_BOARD = translation._('Secret board')
// prettier-ignore
const BOARD_NAME_MUST_HAVE_VALID_CHARACTER = translation._('At least one letter or number is required in a board name')
const BOARD_NAME_INVALID_CHARACTER_TITLE = translation._('Oops! Your board name does not appear to be valid')
const EMPTY_BOARD_NAME_TITLE = translation._("Oops! You haven't added a board name")
const EMPTY_BOARD_NAME_MESSAGE = translation._('New boards require a board name')
const PINTEREST_ACCOUNT_REQUIRED_TITLE = translation._("Oops! You haven't selected your Pinterest account")
const PINTEREST_ACCOUNT_REQUIRED_MESSAGE = translation._('At least one Pinterest account is required')

const SocialNetworkPickerWithSocialProfiles = ConnectedSocialNetworkPicker

interface PinterestBoardCreationModalProps {
  onClose(): void
  onCreateBoardComplete?(...args: Array<unknown>): void
  onFetchSocialProfiles?(): void
  onRequestHide?(): void
  selectedOrganization?: Record<string, unknown>
  socialNetworks?: Array<unknown>
  shouldShowPaywall: boolean
}

class PinterestBoardCreationModal extends React.Component<PinterestBoardCreationModalProps> {
  static displayName = 'PinterestBoardCreationModal'

  static defaultProps = {
    socialNetworks: [],
  }

  constructor(props) {
    super(props)

    const selectedSocialNetworkIds = []
    let isSingleProfileAvailable = false
    if (this.props.socialNetworks.length === 1) {
      selectedSocialNetworkIds.push(this.props.socialNetworks[0].socialNetworkId)
      isSingleProfileAvailable = true
    }

    this.state = {
      isLoading: false,
      isSingleProfileAvailable,
      newBoardName: '',
      newBoardPrivacy: 'public',
      selectedSocialNetworkIds,
      showValidationErrors: false,
      validationResult: { isValid: true },
    }
  }

  componentDidMount() {
    if (this.modalNode) {
      FocusManager.addElement(this.modalNode)
      FocusManager.focus()
      FocusManager.trapFocus()
    }
  }

  componentWillUnmount() {
    if (this.modalNode) {
      FocusManager.remove(this.modalNode)
    }
  }

  handleClose = e => {
    e.stopPropagation()
    this.props.onClose()
  }

  render() {
    const { onFetchSocialProfiles, selectedOrganization } = this.props
    const validationResult = this.state.validationResult
    const showValidationErrors =
      this.state.showValidationErrors && !validationResult.isValid && validationResult.errors
    const { isLoading, isSingleProfileAvailable, newBoardPrivacy, selectedSocialNetworkIds } = this.state
    const excludedNetworkTypes = Object.keys(SocialProfileConstants.SN_TYPES).filter(
      networkType => networkType !== SocialProfileConstants.SN_TYPES.PINTEREST,
    )

    return (
      <Container
        tabIndex="-1"
        ref={node => {
          this.modalNode = node
        }}
      >
        <Dialog>
          <Icons>
            <Icons.Close close={this.handleClose} />
          </Icons>
          <Header>
            <Header.Title>{CREATE_NEW_BOARD}</Header.Title>
            <Header.Description>{CREATE_NEW_BOARD_DESCRIPTION}</Header.Description>
          </Header>
          <Content>
            <ModalContainer>
              <Field className="-field">
                <FieldTitle className="-title">
                  {isSingleProfileAvailable ? PINTEREST_ACCOUNT : SELECT_PINTEREST_ACCOUNT}
                </FieldTitle>
                <div>
                  <SocialNetworkPickerWithSocialProfiles
                    {...{ excludedNetworkTypes, onFetchSocialProfiles, selectedSocialNetworkIds }}
                    isDisabledState={isSingleProfileAvailable}
                    isErrorState={showValidationErrors && validationResult.errors.selectedProfiles}
                    onProfileSelected={this.onProfileSelected}
                    onProfilesRemoved={this.onProfilesRemoved}
                    organizationId={selectedOrganization && selectedOrganization.organizationId}
                    showHeader={false}
                    showSuggestedProfiles={false}
                    shouldShowPaywall={this.props.shouldShowPaywall}
                  />
                  {showValidationErrors && Boolean(validationResult.errors.selectedProfiles) && (
                    <InputBanner
                      messageText={
                        showValidationErrors && validationResult.errors.selectedProfiles
                          ? validationResult.errors.selectedProfiles.message
                          : ''
                      }
                      titleText={
                        showValidationErrors && validationResult.errors.selectedProfiles
                          ? validationResult.errors.selectedProfiles.title
                          : ''
                      }
                      type={TYPE_ERROR}
                    />
                  )}
                </div>
              </Field>
              <Field className="-field">
                <FieldTitle className="-title">{NAME_BOARD}</FieldTitle>
                <BoardNameTextInputContainer>
                  <InputText
                    errorMessageText={
                      showValidationErrors && validationResult.errors.boardName
                        ? validationResult.errors.boardName.message
                        : ''
                    }
                    errorState={showValidationErrors && !!validationResult.errors.boardName}
                    errorTitleText={
                      showValidationErrors && validationResult.errors.boardName
                        ? validationResult.errors.boardName.title
                        : ''
                    }
                    onChange={this.onBoardNameChange}
                    placeholder={BOARD_NAME}
                    showLabel={false}
                    label={NAME_BOARD}
                    width="100%"
                  />
                </BoardNameTextInputContainer>
              </Field>
              <Field className="-field">
                <InputCheckbox
                  className="-secretBoardCheckbox"
                  onChange={this.onBoardPrivacyChange}
                  checked={newBoardPrivacy === 'secret'}
                  label={SECRET_BOARD}
                />
              </Field>
            </ModalContainer>
          </Content>
          <Footer>
            <SubmitButton {...{ isLoading }} onClick={this.onSubmit}>
              {CREATE_BOARD}
            </SubmitButton>
            <CancelButton onClick={this.handleClose}>{CANCEL}</CancelButton>
          </Footer>
        </Dialog>
      </Container>
    )
  }

  validate({ newBoardName, selectedSocialNetworkIds }) {
    const validationResult = {
      isValid: true,
    }

    if (!newBoardName) {
      validationResult.isValid = false
      validationResult.errors = Object.assign({}, validationResult.errors, {
        boardName: {
          title: EMPTY_BOARD_NAME_TITLE,
          message: EMPTY_BOARD_NAME_MESSAGE,
        },
      })
    } else if (!Constants.PINTEREST_BOARD_NAME_REGEX.test(newBoardName)) {
      validationResult.isValid = false
      validationResult.errors = Object.assign({}, validationResult.errors, {
        boardName: {
          title: BOARD_NAME_INVALID_CHARACTER_TITLE,
          message: BOARD_NAME_MUST_HAVE_VALID_CHARACTER,
        },
      })
    }

    if (!selectedSocialNetworkIds || selectedSocialNetworkIds.length === 0) {
      validationResult.isValid = false
      validationResult.errors = Object.assign({}, validationResult.errors, {
        selectedProfiles: {
          title: PINTEREST_ACCOUNT_REQUIRED_TITLE,
          message: PINTEREST_ACCOUNT_REQUIRED_MESSAGE,
        },
      })
    }

    return validationResult
  }

  onProfileSelected = newId => {
    let selectedProfileId = newId
    if (Array.isArray(newId)) {
      selectedProfileId = newId[0]
    }
    const isProfileAlreadySelected = this.state.selectedSocialNetworkIds.some(id => id === selectedProfileId)
    let selectedProfileIds

    if (isProfileAlreadySelected) {
      selectedProfileIds = this.state.selectedSocialNetworkIds.filter(id => id !== selectedProfileId)
    } else {
      selectedProfileIds = [...this.state.selectedSocialNetworkIds, selectedProfileId]
    }

    // generate new state so we can pass it into validate, then update state (it's like 2 set states in a row)
    const newState = Object.assign({}, this.state, { selectedSocialNetworkIds: selectedProfileIds })
    this.setState(Object.assign(newState, { validationResult: this.validate(newState) }))
  }

  onBoardNameChange = event => {
    // generate new state so we can pass it into validate, then update state (it's like 2 set states in a row)
    const newState = Object.assign({}, this.state, { newBoardName: event.target.value })
    this.setState(Object.assign({}, newState, { validationResult: this.validate(newState) }))
  }

  onProfilesRemoved = () => {
    this.setState({ selectedSocialNetworkIds: [] })
  }

  onBoardPrivacyChange = () => {
    // toggle value on change
    const value = this.state.newBoardPrivacy === 'secret' ? 'public' : 'secret'
    // generate new state so we can pass it into validate, then update state (it's like 2 set states in a row)
    const newState = Object.assign({}, this.state, { newBoardPrivacy: value })
    this.setState(Object.assign({}, newState, { validationResult: this.validate(newState) }))
  }

  onSubmit = () => {
    const validationResult = this.validate(this.state)
    if (validationResult.isValid) {
      this.setState({ isLoading: true, validationResult, showValidationErrors: true })
      this.createBoard({
        name: this.state.newBoardName,
        privacy: this.state.newBoardPrivacy,
      })
    } else {
      this.setState({ validationResult, showValidationErrors: true })
    }
  }

  getProfileForId(id) {
    return this.props.socialNetworks.find(network => network.socialNetworkId === id)
  }

  createBoard(board) {
    const { onClose, onCreateBoardComplete } = this.props
    const boardCreationPromises = this.state.selectedSocialNetworkIds.map(id => {
      const requestData = Object.assign({}, board, { socialNetworkId: id })
      return createPinterestBoard(requestData).then(data => {
        return {
          profile: this.getProfileForId(id),
          errors: data.errors,
          board,
        }
      })
    })

    Promise.all(boardCreationPromises)
      .then(data => {
        this.setState({ isLoading: false })
        onCreateBoardComplete({ responses: data, boardName: board.name })
        onClose()
      })
      .catch(error => {
        this.setState({ isLoading: false })
        onCreateBoardComplete({ error })
        onClose()
        if (!axios.isCancel(error)) {
          logError(LOGGING_CATEGORIES.NEW_PIN, 'Failed during create Pinterest board', {
            errorMessage: JSON.stringify(error.message),
            stack: JSON.stringify(error.stack),
          })
        }
      })
  }
}

export default PinterestBoardCreationModal
