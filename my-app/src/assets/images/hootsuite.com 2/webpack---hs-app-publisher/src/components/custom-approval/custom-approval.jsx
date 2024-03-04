/**
 * @format
 * @preventMunge
 */

import './custom-approval.less'

import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'
import _ from 'underscore'
import { Banner, TYPE_ERROR } from 'fe-comp-banner'

import Button from 'hs-nest/lib/components/buttons/button'
import MenuButtonTethered from 'hs-nest/lib/components/buttons/menu-button-tethered'
import MenuPositions from 'hs-nest/lib/constants/menu-positions'
import CustomApprovalModal from './custom-approval-modal/custom-approval-modal'
import ApprovalsComponent from './approvals-component/approvals-component'
import translation from 'hs-nest/lib/utils/translation'
import FluxComponent from 'hs-nest/lib/components/flux-component'
import Constants from '../../constants/constants'
import ConstantMappings from '../../constants/constant-mappings'
import hootbus from 'hs-nest/lib/utils/hootbus'
import facadeAjaxPromise from '../../utils/facade-ajax-promise'
import facadeAjax from '../../utils/facade-ajax'
import statusObject from '../../hs-nest-utils/status_bar' // TODO: Replace with hs-nest/lib/utils/status_bar once it's moved

/* fe-global */
import Icon from '@fp-icons/icon-base'
import Gear from '@fp-icons/emblem-gear'

/**
 * CustomApproval is the main component that either enables or disables custom approvals
 */
export default class CustomApproval extends React.Component {
  constructor(props) {
    super(props)
    this.getApprover = this.getApprover.bind(this)
    this.getMenuItems = this.getMenuItems.bind(this)
    this.hasApprover = this.hasApprover.bind(this)
    this.onToggleMultiMenuItem = this.onToggleMultiMenuItem.bind(this)
    this.onEnableButtonClick = this.onEnableButtonClick.bind(this)
    this.trackedEventOccurred = this.trackedEventOccurred.bind(this)
    this.onSaveSuccess = this.onSaveSuccess.bind(this)
    this.onSelectAssignee = this.onSelectAssignee.bind(this)
    this.onModalClose = this.onModalClose.bind(this)
    this.onEditSelect = this.onEditSelect.bind(this)
    this.renderEditModal = this.renderEditModal.bind(this)
    this.renderDescription = this.renderDescription.bind(this)
    this.renderButton = this.renderButton.bind(this)
    this.renderApprovals = this.renderApprovals.bind(this)
    this.renderBody = this.renderBody.bind(this)
    this.getRuleId = this.getRuleId.bind(this)
    this.handleError = this.handleError.bind(this)
    this.onGetApprovalsSuccess = this.onGetApprovalsSuccess.bind(this)
    this.retrieveApprovals = this.retrieveApprovals.bind(this)
    this.didReceivePrescreenData = this.didReceivePrescreenData.bind(this)

    this.state = {
      isButtonDisabled: this.props.isButtonDisabled,
      isEnabled: props.isEnabled,
      isEditing: false,
      isInitialised: false,
      isValidRule: true,
      firstApprover: {},
      firstApproverOriginal: {},
      ruleId: null,
      secondApprover: {},
      secondApproverOriginal: {},
      thirdApprover: {},
      thirdApproverOriginal: {},
    }

    facadeAjax.setup({
      facadeApiUrl: this.props.facadeApiUrl,
    })

    hootbus.on('did_receive_prescreen_data', this.didReceivePrescreenData)

    this.statusObject = statusObject
  }

  retrieveApprovals() {
    this.getApprovals().then(
      approvalData => {
        this.onGetApprovalsSuccess(approvalData, this.props.allAssignees)
      },
      function() {
        // No approval rule exists for this social network- show the default view
        this.setState({
          isInitialised: true,
        })
      }.bind(this),
    )
  }

  componentDidMount() {
    if (this.props.allAssignees && !this.state.isInitialised) {
      this.retrieveApprovals()
    }
  }

  componentDidUpdate(prevProps) {
    var assigneePropChanged = this.hasAssigneesChanged(prevProps.allAssignees, this.props.allAssignees)
    if (assigneePropChanged && !this.state.isInitialised) {
      this.retrieveApprovals()
    }
  }

  setOriginalApprovers() {
    this.setState({
      firstApproverOriginal: this.state.firstApprover,
      secondApproverOriginal: this.state.secondApprover,
      thirdApproverOriginal: this.state.thirdApprover,
    })
  }

  cancelChanges() {
    this.setState({
      firstApprover: this.state.firstApproverOriginal,
      secondApprover: this.state.secondApproverOriginal,
      thirdApprover: this.state.thirdApproverOriginal,
    })
  }

  didReceivePrescreenData(preScreenData) {
    if (preScreenData) {
      this.setState({
        isPrescreen:
          preScreenData.isPreScreenAvailableForNetwork && preScreenData.isPreScreenEnabledForNetwork,
        isButtonDisabled: false,
      })
    }
  }

  /**
   * Helper function to compare allAssignees prop
   * @param {object[]} arr1 The previous value of the allAssignees prop
   * @param {object[]} arr2 The current value of the allAssignees prop
   * @returns {boolean}
   */
  hasAssigneesChanged(arr1, arr2) {
    var mapArrayIds = arr => {
      return arr.map(obj => {
        if (obj.memberId) {
          return obj.memberId
        } else if (obj.teamId) {
          return obj.teamId
        }
        return null
      })
    }

    if (!_.isArray(arr1) || !_.isArray(arr2)) {
      return true
    }

    // Compare Contents
    var comparisonArr1 = mapArrayIds(arr1)
    var comparisonArr2 = mapArrayIds(arr2)
    var diff = _.difference(comparisonArr1, comparisonArr2)
    return diff.length !== 0
  }

  onGetApprovalsSuccess(approvalData, assignees) {
    var firstApprover = this.getApproverData(assignees, approvalData.reviewers[0])
    var hasSecondApprover = approvalData.reviewers.length > 1
    var secondApprover = {}

    if (hasSecondApprover) {
      secondApprover = this.getApproverData(assignees, approvalData.reviewers[1])
    }

    var hasThirdApprover = approvalData.reviewers.length > 2
    var thirdApprover = {}

    if (hasThirdApprover) {
      thirdApprover = this.getApproverData(assignees, approvalData.reviewers[2])
    }

    this.setState({
      firstApprover: firstApprover,
      isEnabled: true,
      isInitialised: true,
      isValidRule: !(firstApprover.isInvalid || secondApprover.isInvalid || thirdApprover.isInvalid),
      ruleId: approvalData.id,
      secondApprover: secondApprover,
      thirdApprover: thirdApprover,
    })
  }

  getDataForInvalidApprover(type) {
    return {
      avatar: null,
      isInvalid: true,
      searchValue: ConstantMappings.APPROVER_TYPE_TO_ERROR_MESSAGE[type],
      teamName: ConstantMappings.APPROVER_TYPE_TO_ERROR_MESSAGE[type],
    }
  }

  getApprover(orderNumber) {
    var approver = {}

    switch (orderNumber) {
      case 1:
        approver = this.state.firstApprover
        break
      case 2:
        approver = this.state.secondApprover
        break
      case 3:
        approver = this.state.thirdApprover
        break
    }

    return approver
  }

  getApproverData(assignees, approver) {
    var approverData = {}

    switch (approver.type) {
      case Constants.APPROVAL_TYPES.MEMBER:
        approverData = _.find(assignees, function(assignee) {
          return assignee.memberId === approver.id
        })
        break
      case Constants.APPROVAL_TYPES.TEAM:
        approverData = _.find(assignees, function(assignee) {
          return assignee.teamId === approver.id
        })
        break
      case Constants.APPROVAL_TYPES.ADMIN_AND_EDITOR:
        approverData = Constants.CUSTOM_APPROVALS_ANY_ADMIN_OR_EDITOR
        break
    }

    // Approver is invalid and could not be found in the list of assignees
    if (_.isEmpty(approverData)) {
      approverData = this.getDataForInvalidApprover(approver.type)
    }

    return approverData
  }

  getApprovals() {
    statusObject.update(translation._('Loading...'), 'info')

    return facadeAjaxPromise({
      url: '/publisher/message-review/customApprovalRules',
      type: 'GET',
      data: {
        socialProfileId: this.props.socialNetworkId,
      },
    })
  }

  handleError(e, msg) {
    statusObject.update(msg, 'error')
  }

  getRuleId() {
    return this.state.ruleId
  }

  getMenuItems() {
    return [
      {
        label: translation._('Edit Custom Approval'),
        value: 'edit',
        onSelect: this.onEditSelect,
      },
    ]
  }

  hasApprover(orderNumber) {
    var approverExists

    switch (orderNumber) {
      case 1:
        approverExists = !_.isEmpty(this.state.firstApprover)
        break
      case 2:
        approverExists = !_.isEmpty(this.state.secondApprover)
        break
      case 3:
        approverExists = !_.isEmpty(this.state.thirdApprover)
        break
    }

    return approverExists
  }

  onToggleMultiMenuItem(label, value, onSelect) {
    onSelect()
  }

  logReviewerType(data) {
    if (data.reviewers && data.reviewers.length) {
      this.trackedEventOccurred(ConstantMappings.FIRST_APPROVER_TYPE_TO_EVENT[data.reviewers[0].type], {
        snID: this.props.socialNetworkId,
      })
      if (data.reviewers[1]) {
        this.trackedEventOccurred(ConstantMappings.SECOND_APPROVER_TYPE_TO_EVENT[data.reviewers[1].type], {
          snID: this.props.socialNetworkId,
        })
      }
      if (data.reviewers[2]) {
        this.trackedEventOccurred(ConstantMappings.THIRD_APPROVER_TYPE_TO_EVENT[data.reviewers[2].type], {
          snID: this.props.socialNetworkId,
        })
      }
    }
  }

  onSaveSuccess(approvalData) {
    if (this.state.isEditing) {
      this.trackedEventOccurred('publishing_approvals_updateApprovals', {
        snID: this.props.socialNetworkId,
      })
    } else {
      this.trackedEventOccurred('publishing_approvals_saveApprovals', {
        snID: this.props.socialNetworkId,
      })
    }
    this.logReviewerType(approvalData)

    this.setState({
      isEnabled: true,
      isEditing: false,
      isValidRule: true,
      ruleId: approvalData.id,
    })
  }

  onSelectAssignee(assignee, orderNumber) {
    switch (orderNumber) {
      case 1:
        this.setState({
          firstApprover: assignee,
        })
        break
      case 2:
        this.setState({
          secondApprover: assignee,
        })
        break
      case 3:
        this.setState({
          thirdApprover: assignee,
        })
        break
    }
  }

  onModalClose() {
    this.cancelChanges()
    this.setState({
      isEditing: false,
    })
  }

  // Action for clicking edit in the dropdown
  onEditSelect() {
    this.setState(
      {
        isEditing: true,
      },
      () => {
        this.renderEditModal()
      },
    )
  }

  onEnableButtonClick() {
    this.trackedEventOccurred('publishing_approvals_enableApprovals', {
      snID: this.props.socialNetworkId,
    })
    this.renderEditModal()
  }

  trackedEventOccurred(action, data) {
    hootbus.emit('hs.app.web.tracked_event_occurred', 'web.dashboard.publisher.custom_approval', action, data)
  }

  renderEditModal() {
    var parent = document.getElementById('customApprovalModal')

    if (!parent) {
      parent = document.createElement('div')
      parent.id = 'customApprovalModal'
      document.body.appendChild(parent)
    }

    var stateGetter = approverSearchResultStore => approverSearchResultStore.get()
    this.setOriginalApprovers()

    var onSearch = query => {
      this.props.flux.getActions('approver').searchApprovers(query)
    }
    var customApprovalModalProps = _.omit(this.props, 'allAssignees', 'flux')
    ReactDOM.render(
      <FluxComponent
        connectToStores={'approverSearchResult'}
        flux={this.props.flux}
        stateGetter={stateGetter}
      >
        <CustomApprovalModal
          {...customApprovalModalProps}
          getApprover={this.getApprover}
          getRuleId={this.getRuleId}
          handleError={this.handleError}
          hasApprover={this.hasApprover}
          isEditing={this.state.isEditing}
          isPrescreen={this.state.isPrescreen}
          mountPoint={parent}
          onModalClose={this.onModalClose}
          onSaveSuccess={this.onSaveSuccess}
          onSearch={onSearch}
          onSelectAssignee={this.onSelectAssignee}
          socialNetworkId={this.props.socialNetworkId}
        />
      </FluxComponent>,
      parent,
    )
  }

  renderDescription() {
    var textBody
    if (this.state.isEnabled) {
      textBody = (
        <p>{translation._('Authors with limited permission on this network will require approval from:')}</p>
      )
    } else {
      textBody = (
        <div>
          <p className="-listTitle">
            {translation._('Enable the new custom approvals system for this network to:')}
          </p>
          <ul>
            <li className="-listItem">
              <p>{translation._('optionally customize your approval workflow')}</p>
            </li>
            <li className="-listItem">
              <p>{translation._('optionally add a second tier of approval')}</p>
            </li>
            <li className="-listItem">
              <p>{translation._('optionally add a third tier of approval')}</p>
            </li>
            <li className="-listItem">
              <p>{translation._('allow approvers to approve or reject posts')}</p>
            </li>
            <li className="-listItem">
              <p>{translation._('allow approvers to provide feedback on rejection')}</p>
            </li>
          </ul>
          {/* prettier-ignore */}
          <p>
            {translation._('Note: Any messages currently "Pending Approval" will not be affected by these changes.')}
          </p>
        </div>
      )
    }
    return <div className="-description">{textBody}</div>
  }

  renderButton() {
    var enableButtonText = 'Enable'
    var button

    if (this.state.isEnabled) {
      button = (
        <MenuButtonTethered
          disabled={this.state.isButtonDisabled}
          hasMoreIcon={false}
          items={this.getMenuItems()}
          onToggle={this.onToggleMultiMenuItem}
          position={MenuPositions.BOTTOM_LEFT}
        >
          <Icon glyph={Gear} />
        </MenuButtonTethered>
      )
    } else {
      button = (
        <Button
          btnStyle="primary"
          className="-enableButton"
          disabled={this.state.isButtonDisabled}
          onClick={this.onEnableButtonClick}
        >
          {enableButtonText}
        </Button>
      )
    }
    return <div className="-button">{button}</div>
  }

  renderApprovals() {
    if (this.state.isEnabled) {
      return (
        <ApprovalsComponent
          firstApprover={this.state.firstApprover}
          hasApprover={this.hasApprover}
          memberId={this.props.memberId}
          ownerId={this.props.ownerId}
          secondApprover={this.state.secondApprover}
          thirdApprover={this.state.thirdApprover}
          viewMode={Constants.CUSTOM_APPROVALS_MODE.PREVIEW_MODE}
        />
      )
    }
    return null
  }

  renderRuleWarning() {
    return (
      <Banner
        className="-invalidRuleNotification"
        messageText={translation._('Custom approval workflow is no longer valid. Please update.')}
        type={TYPE_ERROR}
      />
    )
  }

  renderBody() {
    if (this.state.isInitialised) {
      return (
        <div className="-customApprovalBody">
          <div className="-customApprovalTopBar">
            <h2 className="-customApprovalTitle">{translation._('Custom Approvals')}</h2>
            {this.renderButton()}
          </div>
          <div className="-customApprovalContent standardMessage">
            {this.renderDescription()}
            {this.renderApprovals()}
          </div>
          {!this.state.isValidRule ? this.renderRuleWarning() : null}
        </div>
      )
    }
    return null
  }

  render() {
    return <div className="rc-CustomApproval">{this.renderBody()}</div>
  }
}

CustomApproval.propTypes = {
  allAssignees: PropTypes.array,
  approvers: PropTypes.array,
  facadeApiUrl: PropTypes.string.isRequired,
  flux: PropTypes.object,
  isButtonDisabled: PropTypes.bool,
  isEnabled: PropTypes.bool.isRequired,
  memberId: PropTypes.number.isRequired,
  ownerId: PropTypes.number.isRequired,
  socialNetworkId: PropTypes.number.isRequired,
}

CustomApproval.defaultProps = {
  isButtonDisabled: false,
}

CustomApproval.displayName = 'Custom Approval'
