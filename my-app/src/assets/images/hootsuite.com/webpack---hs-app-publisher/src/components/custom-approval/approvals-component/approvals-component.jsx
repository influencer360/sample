/**
 * @format
 * @preventMunge
 */

import './approvals-component.less'

import PropTypes from 'prop-types'
import React from 'react'
import _ from 'underscore'
import ApprovalComponent from '../approval-component/approval-component'
import translation from 'hs-nest/lib/utils/translation'
import Constants from '../../../constants/constants'

const FIRST_APPROVER_ORDER_NUMBER = 1
const SECOND_APPROVER_ORDER_NUMBER = 2
const THIRD_APPROVER_ORDER_NUMBER = 3

const FIRST_APPROVER_TITLE = translation._('1st approver')
const SECOND_APPROVER_TITLE = translation._('2nd approver')
const THIRD_APPROVER_TITLE = translation._('3rd approver')

/**
 * @classdesc ApprovalsComponent views the approvals in either preview mode (no search bar) or
 * edit mode (with a search bar)
 */
export default class ApprovalsComponent extends React.Component {
  constructor(props) {
    super(props)
    this.getFirstApproverDescription = this.getFirstApproverDescription.bind(this)
    this.renderSecondApproval = this.renderSecondApproval.bind(this)
    this.renderThirdApproval = this.renderThirdApproval.bind(this)
    this.renderOrderLineConnector = this.renderOrderLineConnector.bind(this)
    this.renderSecondOrderLineConnector = this.renderSecondOrderLineConnector.bind(this)
    this.renderApprovalsPreviewMode = this.renderApprovalsPreviewMode.bind(this)
    this.renderApprovalsEditMode = this.renderApprovalsEditMode.bind(this)
  }

  getFirstApproverDescription() {
    var firstApproverDescription
    if (this.props.isSecondApproverComponentOpen) {
      // prettier-ignore
      firstApproverDescription = translation._('Specify which role or team/team member will review the message first')
    } else {
      // prettier-ignore
      firstApproverDescription = translation._('Specify which role or team/team member will review the message')
    }

    return firstApproverDescription
  }

  renderSecondApproval() {
    if (this.props.hasApprover(2)) {
      return (
        <ApprovalComponent
          canRemove={false}
          includeSearch={false}
          isEnabled={true}
          isVisible={true}
          memberId={this.props.memberId}
          orderNumber={SECOND_APPROVER_ORDER_NUMBER}
          ownerId={this.props.ownerId}
          selectedAssignee={this.props.secondApprover}
          title={SECOND_APPROVER_TITLE}
        />
      )
    }
    return null
  }

  renderThirdApproval() {
    if (this.props.hasApprover(3)) {
      return (
        <ApprovalComponent
          canRemove={false}
          includeSearch={false}
          isEnabled={true}
          isVisible={true}
          memberId={this.props.memberId}
          orderNumber={THIRD_APPROVER_ORDER_NUMBER}
          ownerId={this.props.ownerId}
          selectedAssignee={this.props.thirdApprover}
          title={THIRD_APPROVER_TITLE}
        />
      )
    }
    return null
  }

  renderOrderLineConnector() {
    var lineClass
    switch (this.props.viewMode) {
      case Constants.CUSTOM_APPROVALS_MODE.EDIT_MODE:
        lineClass = '-orderLineConnector -editMode'
        break
      case Constants.CUSTOM_APPROVALS_MODE.PREVIEW_MODE:
        if (this.props.hasApprover(2)) {
          lineClass = '-orderLineConnector -previewMode'
        }
        break
    }

    if (lineClass) {
      return <div className={lineClass} />
    }

    return null
  }

  renderSecondOrderLineConnector() {
    var lineClass
    switch (this.props.viewMode) {
      case Constants.CUSTOM_APPROVALS_MODE.EDIT_MODE:
        if (this.props.isSecondApproverComponentOpen) {
          lineClass = '-orderLineConnector -editMode -editGap'
        }
        break
      case Constants.CUSTOM_APPROVALS_MODE.PREVIEW_MODE:
        if (this.props.hasApprover(3)) {
          lineClass = '-orderLineConnector -previewMode -previewGap'
        }
        break
    }

    if (lineClass) {
      return <div className={lineClass} />
    }

    return null
  }

  // In preview mode, it will show either 1 or 2 or 3 components depending on the number
  // of approvers
  renderApprovalsPreviewMode() {
    return (
      <div className="-approvals">
        <ApprovalComponent
          canRemove={false}
          includeSearch={false}
          isEnabled={true}
          isVisible={true}
          memberId={this.props.memberId}
          orderNumber={FIRST_APPROVER_ORDER_NUMBER}
          ownerId={this.props.ownerId}
          selectedAssignee={this.props.firstApprover}
          title={FIRST_APPROVER_TITLE}
        />
        {this.renderSecondApproval()}
        {this.renderThirdApproval()}
        {this.renderOrderLineConnector()}
        {this.renderSecondOrderLineConnector()}
      </div>
    )
  }

  // In edit mode, 2 approval components will always be present since there is
  // the option to add in an additional approver
  renderApprovalsEditMode() {
    var approvalsComponentProps = _.omit(
      this.props,
      'onModalClose',
      'onSaveButtonClick',
      'firstApprover',
      'secondApprover',
    )

    return (
      <div className="-approvals">
        <ApprovalComponent
          {...approvalsComponentProps}
          canRemove={false}
          description={this.getFirstApproverDescription()}
          includeSearch={true}
          isEnabled={true}
          isVisible={true}
          memberId={this.props.memberId}
          onSelectAssignee={this.props.onSelectAssignee}
          orderNumber={FIRST_APPROVER_ORDER_NUMBER}
          selectedAssignee={this.props.firstApprover.isInvalid ? {} : this.props.firstApprover}
          title={FIRST_APPROVER_TITLE}
        />
        <ApprovalComponent
          {...approvalsComponentProps}
          canRemove={!this.props.isThirdApproverComponentOpen}
          // prettier-ignore
          description={translation._('Specify which team/team member will review the message after approval is received from the 1st approver')}
          includeSearch={this.props.hasApprover(2)}
          isEnabled={this.props.hasApprover(2)}
          isVisible={true}
          memberId={this.props.memberId}
          onApproverDisable={this.props.onApproverDisable}
          onApproverEnable={this.props.onApproverEnable}
          onSelectAssignee={this.props.onSelectAssignee}
          orderNumber={SECOND_APPROVER_ORDER_NUMBER}
          selectedAssignee={this.props.secondApprover.isInvalid ? {} : this.props.secondApprover}
          title={SECOND_APPROVER_TITLE}
        />
        <ApprovalComponent
          {...approvalsComponentProps}
          canRemove={true}
          // prettier-ignore
          description={translation._('Specify which team/team member will review the message after approval is received from the 2nd approver')}
          includeSearch={this.props.hasApprover(3)}
          isEnabled={this.props.hasApprover(3)}
          isVisible={this.props.isSecondApproverComponentOpen}
          memberId={this.props.memberId}
          onApproverDisable={this.props.onApproverDisable}
          onApproverEnable={this.props.onApproverEnable}
          onSelectAssignee={this.props.onSelectAssignee}
          orderNumber={THIRD_APPROVER_ORDER_NUMBER}
          selectedAssignee={this.props.thirdApprover.isInvalid ? {} : this.props.thirdApprover}
          title={THIRD_APPROVER_TITLE}
        />
        {this.renderOrderLineConnector()}
        {this.renderSecondOrderLineConnector()}
      </div>
    )
  }

  render() {
    var html
    switch (this.props.viewMode) {
      case Constants.CUSTOM_APPROVALS_MODE.EDIT_MODE:
        html = this.renderApprovalsEditMode()
        break
      case Constants.CUSTOM_APPROVALS_MODE.PREVIEW_MODE:
        html = this.renderApprovalsPreviewMode()
        break
    }

    return <div className="rc-ApprovalsComponent">{html}</div>
  }
}

ApprovalsComponent.propTypes = {
  firstApprover: PropTypes.object.isRequired,
  hasApprover: PropTypes.func.isRequired,
  isSecondApproverComponentOpen: PropTypes.bool,
  isThirdApproverComponentOpen: PropTypes.bool,
  memberId: PropTypes.number.isRequired,
  onApproverDisable: PropTypes.func,
  onApproverEnable: PropTypes.func,
  onSelectAssignee: PropTypes.func,
  ownerId: PropTypes.number.isRequired,
  secondApprover: PropTypes.object,
  thirdApprover: PropTypes.object,
  viewMode: PropTypes.string.isRequired,
}

ApprovalsComponent.displayName = 'Approvals Component'
