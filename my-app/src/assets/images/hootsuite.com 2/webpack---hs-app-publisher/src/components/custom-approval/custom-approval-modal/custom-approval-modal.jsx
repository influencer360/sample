/**
 * @format
 * @preventMunge
 */

import './custom-approval-modal.less'

import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'
import _ from 'underscore'
import Button from 'hs-nest/lib/components/buttons/button'
import SimpleModal from 'hs-nest/lib/components/modal/simple-modal'
import ApprovalsComponent from '../approvals-component/approvals-component'
import CustomApprovalPreviewModal from '../custom-approval-preview-modal/custom-approval-preview-modal'
import translation from 'hs-nest/lib/utils/translation'
import Constants from '../../../constants/constants'
import facadeAjaxPromise from '../../../utils/facade-ajax-promise'

/**
 * @classdesc CustomApprovalModal is a modal allowing users to setup and update approvers for a social network.
 */
export default class CustomApprovalModal extends React.Component {
  constructor(props) {
    super(props)
    this.unmountComponent = this.unmountComponent.bind(this)
    this.onSaveButtonClick = this.onSaveButtonClick.bind(this)
    this.onModalClose = this.onModalClose.bind(this)
    this.getTitle = this.getTitle.bind(this)
    this.onApproverEnable = this.onApproverEnable.bind(this)
    this.onApproverDisable = this.onApproverDisable.bind(this)
    this.renderDescription = this.renderDescription.bind(this)
    this.renderApprovals = this.renderApprovals.bind(this)
    this.renderBody = this.renderBody.bind(this)
    this.renderFooter = this.renderFooter.bind(this)
    this.saveApprovals = this.saveApprovals.bind(this)
    this.getReviewers = this.getReviewers.bind(this)
    this.formatApprover = this.formatApprover.bind(this)
    this.onSelectAssignee = this.onSelectAssignee.bind(this)
    this.cancelButton = React.createRef()

    var firstApprover = props.getApprover(1)
    var secondApprover = props.getApprover(2)

    var thirdApprover = props.getApprover(3)
    this.state = {
      isLoading: false,
      isSaveDisabled:
        !props.hasApprover(1) ||
        firstApprover.isInvalid ||
        secondApprover.isInvalid ||
        thirdApprover.isInvalid,
      isSecondApproverComponentOpen: props.hasApprover(2),
      isThirdApproverComponentOpen: props.hasApprover(3),
    }
  }

  unmountComponent() {
    ReactDOM.unmountComponentAtNode(this.props.mountPoint)
  }

  /**
   * Gets the appropriate user details and returns them in a format that can be passed to the facade
   * @param {Object} approver
   * @returns {Object} Returns an object with the approver type (TEAM, MEMBER, ADMIN_AND_EDITOR) and id
   **/
  formatApprover(approver) {
    var formattedApprover = {}

    // Member
    if (approver.memberId) {
      formattedApprover.type = Constants.APPROVAL_TYPES.MEMBER
      formattedApprover.id = approver.memberId
    } else {
      if (approver.teamId) {
        // Team
        formattedApprover.type = Constants.APPROVAL_TYPES.TEAM
        formattedApprover.id = approver.teamId
      } else {
        // Any Editor or Admin
        formattedApprover.type = Constants.APPROVAL_TYPES.ADMIN_AND_EDITOR
      }
    }
    return formattedApprover
  }

  /**
   * Gets the reviewers and returns them as an array that will be passed to the facade
   * @returns {Array}
   **/
  getReviewers() {
    var reviewers = []
    var firstApprover = this.formatApprover(this.props.getApprover(1))
    reviewers.push(firstApprover)

    if (!_.isEmpty(this.props.getApprover(2))) {
      var secondApprover = this.formatApprover(this.props.getApprover(2))
      reviewers.push(secondApprover)
    }

    if (!_.isEmpty(this.props.getApprover(3))) {
      var thirdApprover = this.formatApprover(this.props.getApprover(3))
      reviewers.push(thirdApprover)
    }

    return reviewers
  }

  saveApprovals() {
    var data = {}

    if (this.props.isEditing) {
      // Editing approval
      data = {
        isPrescreenEnabled: this.props.isPrescreen,
        reviewers: this.getReviewers(),
      }

      return facadeAjaxPromise({
        url: '/publisher/message-review/customApprovalRules/' + this.props.getRuleId(),
        type: 'PUT',
        json: data,
      })
    }
    // Saving a new approval
    data = {
      isPrescreenEnabled: this.props.isPrescreen,
      organizationId: this.props.ownerId,
      socialProfileId: this.props.socialNetworkId,
      reviewers: this.getReviewers(),
    }

    return facadeAjaxPromise({
      url: '/publisher/message-review/customApprovalRules',
      type: 'POST',
      json: data,
    })
  }

  getTitle() {
    var editText = translation._('Edit Custom Approval')
    var setupText = translation._('Set Up Custom Approval')
    return this.props.isEditing ? editText : setupText
  }

  onSaveButtonClick() {
    this.setState({
      isLoading: true,
    })

    this.saveApprovals()
      .then(approvalData => {
        this.props.onSaveSuccess(approvalData)
        this.unmountComponent()

        var parent = document.getElementById('customApprovalPreviewModal')

        if (!parent) {
          parent = document.createElement('div')
          parent.id = 'customApprovalPreviewModal'
          document.body.appendChild(parent)
        }

        ReactDOM.render(
          <CustomApprovalPreviewModal
            firstApprover={this.props.getApprover(1)}
            hasApprover={this.props.hasApprover}
            memberId={this.props.memberId}
            mountPoint={parent}
            ownerId={this.props.ownerId}
            secondApprover={this.props.getApprover(2)}
            thirdApprover={this.props.getApprover(3)}
          />,
          parent,
        )
      })
      .catch(e => {
        if (this.props.isEditing) {
          this.props.handleError(e, translation._('Failed to update approval rule'))
        } else {
          this.props.handleError(e, translation._('Failed to create approval rule'))
        }

        this.setState({
          isLoading: false,
        })
      })
  }

  onModalClose() {
    this.props.onModalClose()
    this.unmountComponent()
  }

  onApproverEnable(orderNumber) {
    if (orderNumber === 2) {
      this.setState({
        isSecondApproverComponentOpen: true,
      })
    }

    if (orderNumber === 3) {
      this.setState({
        isThirdApproverComponentOpen: true,
      })
    }
  }

  onApproverDisable(orderNumber) {
    switch (orderNumber) {
      case 3:
        this.props.onSelectAssignee({}, orderNumber)
        this.setState({
          isThirdApproverComponentOpen: false,
        })
        break
      case 2:
        this.props.onSelectAssignee({}, orderNumber)
        this.setState({
          isSecondApproverComponentOpen: false,
        })
        break
      case 1:
        this.setState({
          isSaveDisabled: true,
        })
    }
  }

  onSelectAssignee(assignee, orderNumber) {
    this.props.onSelectAssignee(assignee, orderNumber)

    this.setState({
      isSaveDisabled: !this.getSaveStatus(assignee, orderNumber),
    })
  }

  getSaveStatus(assignee, orderNumber) {
    return (
      this.areEarlierApproversValid(assignee, orderNumber) &&
      this.areLaterApproversValid(assignee, orderNumber)
    )
  }

  areEarlierApproversValid(assignee, orderNumber) {
    var isValid = false

    switch (orderNumber) {
      case 1:
        isValid = !_.isEmpty(assignee)
        break
      case 2:
        isValid = this.props.hasApprover(1)
        break
      case 3:
        if (!_.isEmpty(assignee)) {
          isValid = this.props.hasApprover(1) && this.props.hasApprover(2)
        } else {
          isValid = this.props.hasApprover(1)
        }
        break
    }

    return isValid
  }

  areLaterApproversValid(assignee, orderNumber) {
    var isValid = false

    switch (orderNumber) {
      case 1:
        if (_.isEmpty(assignee)) {
          isValid = false
        } else {
          isValid = this.props.hasApprover(2) || !this.props.hasApprover(3)
        }
        break
      case 2:
        if (_.isEmpty(assignee)) {
          isValid = !this.props.hasApprover(3)
        } else {
          isValid = true
        }
        break
      case 3:
        isValid = true
        break
    }

    return isValid
  }

  renderDescription() {
    return (
      <div className="-description">
        {/* prettier-ignore */}
        <p>
          {translation._('Define a custom approval workflow for authors with limited permission on this network')}
        </p>
      </div>
    )
  }

  renderApprovals() {
    var approvalComponentProps = _.omit(
      this.props,
      'isEditing',
      'mountPoint',
      'socialNetworkId',
      'onSelectAssignee',
    )

    return (
      <ApprovalsComponent
        {...approvalComponentProps}
        firstApprover={this.props.getApprover(1)}
        hasApprover={this.props.hasApprover}
        isSecondApproverComponentOpen={this.state.isSecondApproverComponentOpen}
        isThirdApproverComponentOpen={this.state.isThirdApproverComponentOpen}
        onApproverDisable={this.onApproverDisable}
        onApproverEnable={this.onApproverEnable}
        onSelectAssignee={this.onSelectAssignee}
        secondApprover={this.props.getApprover(2)}
        thirdApprover={this.props.getApprover(3)}
        viewMode={Constants.CUSTOM_APPROVALS_MODE.EDIT_MODE}
      />
    )
  }

  renderBody() {
    return (
      <div className="-customApprovalBody">
        {this.renderDescription()}
        {this.renderApprovals()}
      </div>
    )
  }

  renderFooter() {
    var cancelButtonText = translation._('Cancel')
    var saveButtonText = translation._('Save and set')
    return (
      <div className="-customApprovalFooter">
        <Button
          btnStyle="secondary"
          className="-cancelButton"
          onClick={this.onModalClose}
          ref={r => (this.cancelButton = r)}
        >
          {cancelButtonText}
        </Button>
        <Button
          btnStyle="primary"
          className="-saveButton"
          disabled={this.state.isSaveDisabled}
          isLoading={this.state.isLoading}
          onClick={this.onSaveButtonClick}
        >
          {saveButtonText}
        </Button>
      </div>
    )
  }

  render() {
    return (
      <div className="rc-CustomApprovalModal">
        <SimpleModal
          className="custom-approval-modal"
          enableScrollableContent={false}
          footerContent={this.renderFooter()}
          hasBackdrop={'static'}
          hasCloseButton={true}
          onRequestHide={this.onModalClose}
          titleText={this.getTitle()}
          width="500px"
        >
          {this.renderBody()}
        </SimpleModal>
      </div>
    )
  }
}

CustomApprovalModal.propTypes = {
  getApprover: PropTypes.func.isRequired,
  getRuleId: PropTypes.func.isRequired,
  handleError: PropTypes.func.isRequired,
  hasApprover: PropTypes.func.isRequired,
  isEditing: PropTypes.bool.isRequired,
  isPrescreen: PropTypes.bool,
  memberId: PropTypes.number.isRequired,
  mountPoint: PropTypes.object.isRequired,
  onModalClose: PropTypes.func.isRequired,
  onSaveSuccess: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onSelectAssignee: PropTypes.func.isRequired,
  ownerId: PropTypes.number.isRequired,
  socialNetworkId: PropTypes.number.isRequired,
}

CustomApprovalModal.defaultProps = {
  isPrescreen: false,
}

CustomApprovalModal.displayName = 'Custom Approval Modal'
