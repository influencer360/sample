import React from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { connect as reduxConnect } from 'react-redux'

import { Lightbox } from 'fe-comp-lightbox'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { ValidationBanner } from 'fe-pnc-comp-field-validation-item'
import BoardPicker from 'fe-pnc-comp-pinterest-board-picker'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import { store as PinterestStore } from 'fe-pnc-data-pinterest'
import translation from 'fe-pnc-lib-hs-translation'
import { FIELD_TYPES, FIELD_VALIDATIONS } from 'fe-pnc-validation-error-messages'

import { RootState } from '@/redux/store'
import { FieldValidations } from '@/typings/Message'
import { SocialNetwork } from '@/typings/SocialNetwork'
import ComposerUtils from '@/utils/composer-utils'

import PinterestBoardCreationModal from '../pinterest-board-creation-modal'

const noop = () => {}

const SELECT_BOARDS = translation._('Select boards')

const PRIVACY_SECRET = 'secret'

interface PinterestBoardPickerProps {
  addProfile?(...args: Array<unknown>): unknown
  errors?(...args: Array<unknown>): unknown
  fieldValidations?: FieldValidations
  extendedInfo?: Record<string, unknown>
  extendedInfoKey: string
  facadeApiUrl: string
  iconSourceKey: string
  isDraft?: boolean
  isFetchingPinterestBoards?: boolean
  onChange(...args: Array<unknown>): unknown
  onFetchSocialProfiles?(): void
  pinterestBoards?: Array<unknown>
  placeHolder?: string
  selectedBoards?: Array<unknown>
  selectedOrganization?: Record<string, unknown>
  showOnSubmitErrors?: boolean
  socialNetworkId?: string
  socialNetworks: Array<SocialNetwork>
  text: string
  shouldShowPaywall: boolean
}

export class PinterestBoardPicker extends React.Component<PinterestBoardPickerProps> {
  static defaultProps = {
    addProfile: noop,
    errors: noop,
    extendedInfo: {},
    isDraft: false,
    isFetchingPinterestBoards: false,
    onFetchSocialProfiles: noop,
    pinterestBoards: [],
    selectedBoards: [],
    showOnSubmitErrors: false,
    shouldShowPaywall: false,
  }

  constructor(props) {
    super(props)
    this.state = {
      boards: [],
      selectedBoards: [],
      isCreateBoardModalOpened: false,
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.isDraft) {
      // editing a draft so can have multiple boards selected
      const selectedBoardsForEditDraft =
        nextProps.selectedBoards &&
        nextProps.selectedBoards.length > 0 &&
        typeof nextProps.selectedBoards[0].boardId !== 'undefined' &&
        this.state.selectedBoards.length === 0
      if (selectedBoardsForEditDraft) {
        this.setState({ selectedBoards: nextProps.selectedBoards })
      }
    } else {
      const selectedBoardForEdit =
        nextProps.isEditMode &&
        nextProps.selectedBoards &&
        nextProps.selectedBoards.length > 0 &&
        typeof nextProps.selectedBoards[0].boardId !== 'undefined' &&
        this.state.selectedBoards.length === 0
      if (selectedBoardForEdit) {
        this.setState({ selectedBoards: nextProps.selectedBoards })
      }

      if (
        this.state.selectedBoards.length > 0 &&
        this.props.selectedOrganization &&
        nextProps.selectedOrganization &&
        this.props.selectedOrganization.organizationId !== nextProps.selectedOrganization.organizationId
      ) {
        this.setState({ selectedBoards: [] })
      }
    }
  }

  updateSelectedBoards = boards => {
    const { extendedInfo, extendedInfoKey, onChange } = this.props
    const updatedSelectedBoards = []
    for (const username in boards) {
      if (boards.hasOwnProperty(username)) {
        for (const boardId in boards[username]) {
          if (boards[username].hasOwnProperty(boardId)) {
            const board = boards[username][boardId]
            const { active, boardName, privacy, socialNetworkId } = board
            if (active) {
              updatedSelectedBoards.push({
                boardId,
                boardName,
                privacy,
                socialNetworkId,
                username,
              })
            }
          }
        }
      }
    }
    this.setState({ selectedBoards: updatedSelectedBoards })
    onChange(
      Object.assign({}, extendedInfo, {
        [extendedInfoKey]: updatedSelectedBoards,
      }),
    )
  }

  _isBoardSelected(boardId) {
    return this.state.selectedBoards.some(board => board.boardId === boardId)
  }

  _getSelectedBoards(boards) {
    return boards.filter(board => {
      return this._isBoardSelected(board.boardId)
    })
  }

  _getBoardLabel(board) {
    let label = board.username ? `${board.username}: ${board.boardName}` : board.boardName

    if (board.privacy === PRIVACY_SECRET) {
      label = label + ' [SECRET]'
    }

    return label
  }

  getPinterestProfiles() {
    return ComposerUtils.getAvailableProfiles(
      this.props.socialNetworks,
      this.props.selectedOrganization,
      SocialProfileConstants.SN_TYPES.PINTEREST,
    )
  }

  getBoardsWithAvatars = () => {
    const { pinterestBoards, socialNetworks } = this.props
    if (pinterestBoards.length && socialNetworks.length) {
      const boards = cloneDeep(pinterestBoards)
      boards.forEach(board => {
        const socialNetwork = socialNetworks.find(
          network => network.socialNetworkId === board.socialNetworkId,
        )
        if (socialNetwork) {
          board.avatar = socialNetwork.avatar
        }
      })
      return boards
    }
    return []
  }

  openCreateBoardModal = () => this.setState({ isCreateBoardModalOpened: true })

  render() {
    const {
      isDraft,
      isEditMode,
      isFetchingPinterestBoards,
      onCreateBoardComplete,
      onFetchSocialProfiles,
      pinterestBoards,
      selectedOrganization,
      showOnSubmitErrors,
      fieldValidations,
    } = this.props
    const errors = this.props.errors()
    const selectedItems = this._getSelectedBoards(pinterestBoards)
    const selectedBoardsString =
      selectedItems.length === 0
        ? SELECT_BOARDS
        : selectedItems.map(item => this._getBoardLabel(item)).join(', ')
    const isBoardPickerDisabled = isEditMode && !isDraft
    const error = (
      <ValidationBanner
        field={FIELD_VALIDATIONS.SOCIAL_NETWORK}
        type={FIELD_TYPES.SOCIAL_NETWORK}
        showOnSubmitErrors={showOnSubmitErrors}
        fieldValidations={fieldValidations}
      />
    )
    return (
      <div className="rc-PinterestBoardPicker" title={selectedBoardsString}>
        <BoardPicker
          isDisabledState={isBoardPickerDisabled}
          isErrorState={errors && errors.socialProfileId}
          isLoadingState={isFetchingPinterestBoards}
          onBoardSelected={this.updateSelectedBoards}
          onCreateNewBoard={this.openCreateBoardModal}
          organizationId={selectedOrganization && selectedOrganization.organizationId}
          pinterestBoards={this.getBoardsWithAvatars()}
          selectedBoards={this.state.selectedBoards}
        />
        {error}
        {this.state.isCreateBoardModalOpened && (
          <Lightbox>
            {({ close }) => {
              const handleClose = () => {
                close()
                this.setState({ isCreateBoardModalOpened: false })
              }
              return (
                <PinterestBoardCreationModal
                  {...{ onCreateBoardComplete, onFetchSocialProfiles, selectedOrganization }}
                  onClose={handleClose}
                  socialNetworks={this.getPinterestProfiles()}
                  shouldShowPaywall={this.props.shouldShowPaywall}
                />
              )
            }}
          </Lightbox>
        )}
      </div>
    )
  }
}

export default compose(
  reduxConnect(({ composer, validation }: RootState) => ({
    isFetchingPinterestBoards: composer.isFetchingPinterestBoards,
    showOnSubmitErrors: validation.showOnSubmitErrors,
  })),
  connect(PinterestStore, state => ({
    pinterestBoards: state.pinterestBoards,
  })),
)(PinterestBoardPicker)
