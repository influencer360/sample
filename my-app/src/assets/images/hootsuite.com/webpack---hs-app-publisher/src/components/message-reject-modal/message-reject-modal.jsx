/**
 * @format
 * @preventMunge
 */

import './message-reject-modal.less'
import ConstantMappings from '../../constants/constant-mappings'
import { handleEntitlementCheck } from '../../utils/entitlement-utils'

import PropTypes from 'prop-types'
import React from 'react'
import SimpleModal from 'hs-nest/lib/components/modal/simple-modal'
import Button from 'hs-nest/lib/components/buttons/button'
import translation from 'hs-nest/lib/utils/translation'
import TextInput from 'hs-nest/lib/components/inputs/text-input'
import hootbus from 'hs-nest/lib/utils/hootbus'
import { CUSTOM_APPROVALS } from 'fe-lib-entitlements'

export default class MessageRejectModal extends React.Component {
  constructor(props) {
    super(props)

    this.onCancel = this.onCancel.bind(this)
    this.onReject = this.onReject.bind(this)

    this.state = {
      isLoading: false,
      rejectionReason: '',
      hasCustomApprovalsEntitlement: false,
    }
  }

  componentDidMount() {
    handleEntitlementCheck(CUSTOM_APPROVALS, hasCustomApprovalsEntitlement => {
      this.setState({ hasCustomApprovalsEntitlement })
    })
  }

  onCancel(event) {
    this.props.onClose(event)
  }

  getTrackingAction() {
    if (this.props.trackingOrigin) {
      if (this.state.rejectionReason && this.state.rejectionReason.length > 0) {
        return ConstantMappings.APPROVAL_REJECT_ORIGIN_TO_NAME_WITH_COMMENT[this.props.trackingOrigin]
      }
      return ConstantMappings.APPROVAL_REJECT_ORIGIN_TO_NAME_WITHOUT_COMMENT[this.props.trackingOrigin]
    }

    return null
  }

  trackedEventOccurred(action, data) {
    if (action) {
      hootbus.emit(
        'hs.app.web.tracked_event_occurred',
        'web.dashboard.publisher.custom_approval',
        action,
        data,
      )
    }
  }

  onReject(event) {
    this.setState({ isLoading: true })
    this.props.onConfirmReject(
      this.props.msgIdsAndSeqNums,
      this.props.socialNetworkIds,
      this.state.rejectionReason,
      this.props.isGroupMode,
      this.props.onClose(event),
    )
  }

  updateRejectionReason(newValue) {
    this.setState({
      rejectionReason: newValue,
    })
  }

  renderBody() {
    if (this.state.hasCustomApprovalsEntitlement) {
      var label = translation._('Why are you rejecting this message?')

      if (this.props.isComment) {
        label = translation._('Why are you rejecting this comment?')
      } else if (this.props.isReply) {
        label = translation._('Why are you rejecting this reply?')
      }

      return (
        <div className="-actions">
          <TextInput
            className="-rejectMessageReason"
            label={label}
            onChange={newValue => this.updateRejectionReason(newValue)}
            placeholder={translation._('Optional')}
            width="100%"
          />
        </div>
      )
    } else {
      return (
        <div className="-actions">
          <TextInput
            className="-rejectMessageReason"
            label={translation._('Why are you rejecting this message?')}
            onChange={newValue => this.updateRejectionReason(newValue)}
            placeholder={translation._('Optional')}
            width="100%"
          />
        </div>
      )
    }
  }

  renderFooter() {
    return (
      <div>
        <Button
          btnStyle="secondary"
          btnType="button"
          className="-reject-message-cancel"
          onClick={this.onCancel}
        >
          {translation._('Cancel')}
        </Button>
        <Button
          backgroundColor="#fba919"
          btnStyle="primary"
          btnType="button"
          className="-reject-message-confirm"
          isLoading={this.state.isLoading}
          onClick={this.onReject}
        >
          {translation._('Reject')}
        </Button>
      </div>
    )
  }

  render() {
    if (this.state.hasCustomApprovalsEntitlement) {
      var titleText = translation._('Reject Message')

      if (this.props.isComment) {
        titleText = translation._('Reject Comment')
      } else if (this.props.isReply) {
        titleText = translation._('Reject Reply')
      }

      return (
        <div className="rc-MessageRejectModal">
          <SimpleModal
            footerContent={this.renderFooter()}
            hasBackdrop={true}
            hasCloseButton={false}
            onRequestHide={this.props.onClose}
            titleText={titleText}
            width="500px"
          >
            {this.renderBody()}
          </SimpleModal>
        </div>
      )
    } else {
      return (
        <div className="rc-MessageRejectModal">
          <SimpleModal
            footerContent={this.renderFooter()}
            hasBackdrop={true}
            hasCloseButton={false}
            onRequestHide={this.props.onClose}
            titleText={translation._('Reject Message')}
            width="500px"
          >
            {this.renderBody()}
          </SimpleModal>
        </div>
      )
    }
  }
}

MessageRejectModal.propTypes = {
  commentId: PropTypes.number,
  isComment: PropTypes.bool,
  isGroupMode: PropTypes.bool.isRequired,
  isReply: PropTypes.bool,
  messageIds: PropTypes.arrayOf(PropTypes.number),
  msgIdsAndSeqNums: PropTypes.arrayOf(PropTypes.object),
  onClose: PropTypes.func.isRequired,
  onConfirmReject: PropTypes.func.isRequired,
  sequenceNumber: PropTypes.number,
  socialNetworkIds: PropTypes.array,
  trackingOrigin: PropTypes.string,
}

MessageRejectModal.defaultProps = {
  sequenceNumber: -1,
}

MessageRejectModal.displayName = 'Message Reject Modal'
