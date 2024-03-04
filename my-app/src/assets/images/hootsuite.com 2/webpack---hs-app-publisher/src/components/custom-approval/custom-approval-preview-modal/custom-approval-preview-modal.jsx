/**
 * @format
 * @preventMunge
 */

import './custom-approval-preview-modal.less'

import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'
import Button from 'hs-nest/lib/components/buttons/button'
import SimpleModal from 'hs-nest/lib/components/modal/simple-modal'
import ApprovalsComponent from '../approvals-component/approvals-component'
import translation from 'hs-nest/lib/utils/translation'
import Constants from '../../../constants/constants'

/**
 * @classdesc CustomApprovalPreviewModal is a modal to preview the assigned approvers for the social network
 */
export default class CustomApprovalPreviewModal extends React.Component {
  constructor(props) {
    super(props)
    this.unmountComponent = this.unmountComponent.bind(this)
    this.onModalClose = this.onModalClose.bind(this)
    this.renderDescription = this.renderDescription.bind(this)
    this.renderNote = this.renderNote.bind(this)
    this.renderBody = this.renderBody.bind(this)
    this.renderFooter = this.renderFooter.bind(this)
  }

  unmountComponent() {
    ReactDOM.unmountComponentAtNode(this.props.mountPoint)
  }

  onModalClose() {
    this.unmountComponent()
  }

  renderDescription() {
    return (
      <div className="-description">
        {/* prettier-ignore */}
        <p>
          {translation._('Any new outbound messages posted by limited users for this network will now follow this custom approval workflow:')}
        </p>
      </div>
    )
  }

  renderNote() {
    return (
      <div className="-note">
        {/* prettier-ignore */}
        <p>
          {translation._('Note: Any messages "Pending Approval" prior to this change will be subjected to the new workflow.')}
        </p>
      </div>
    )
  }

  renderBody() {
    return (
      <div className="-customApprovalPreviewBody">
        {this.renderDescription()}
        <ApprovalsComponent
          firstApprover={this.props.firstApprover}
          hasApprover={this.props.hasApprover}
          memberId={this.props.memberId}
          ownerId={this.props.ownerId}
          secondApprover={this.props.secondApprover}
          thirdApprover={this.props.thirdApprover}
          viewMode={Constants.CUSTOM_APPROVALS_MODE.PREVIEW_MODE}
        />
        {this.renderNote()}
      </div>
    )
  }

  renderFooter() {
    const doneButtonText = translation._('Done')
    return (
      <div className="-customApprovalPreviewFooter">
        <Button btnStyle="primary" className="-doneButton" disabled={false} onClick={this.unmountComponent}>
          {doneButtonText}
        </Button>
      </div>
    )
  }

  render() {
    return (
      <div className="rc-CustomApprovalPreviewModal">
        <SimpleModal
          footerContent={this.renderFooter()}
          hasBackdrop={'static'}
          hasCloseButton={true}
          onRequestHide={this.onModalClose}
          titleText={translation._('Custom Approval Enabled!')}
          width="500px"
        >
          {this.renderBody()}
        </SimpleModal>
      </div>
    )
  }
}

CustomApprovalPreviewModal.propTypes = {
  firstApprover: PropTypes.object.isRequired,
  hasApprover: PropTypes.func.isRequired,
  memberId: PropTypes.number.isRequired,
  mountPoint: PropTypes.object.isRequired,
  ownerId: PropTypes.number.isRequired,
  secondApprover: PropTypes.object,
  thirdApprover: PropTypes.object,
}

CustomApprovalPreviewModal.displayName = 'Custom Approval Modal'
