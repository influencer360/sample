/**
 * @format
 * @preventMunge
 */

import './message-delete-modal.less'
import { handleEntitlementCheck } from '../../utils/entitlement-utils'

import PropTypes from 'prop-types'
import React from 'react'
import SimpleModal from 'hs-nest/lib/components/modal/simple-modal'
import { Button, SECONDARY } from 'fe-comp-button'
import translation from 'hs-nest/lib/utils/translation'
import { CUSTOM_APPROVALS } from 'fe-lib-entitlements'

export default class MessageDeleteModal extends React.Component {
  constructor(props) {
    super(props)

    this.getButtonText = this.getButtonText.bind(this)
    this.getBodyText = this.getBodyText.bind(this)
    this.onDeleteBtnClick = this.onDeleteBtnClick.bind(this)
    this.cancelButton = React.createRef()

    this.state = {
      isLoading: false,
      hasCustomApprovalsEntitlement: false,
    }
  }

  componentDidMount() {
    handleEntitlementCheck(CUSTOM_APPROVALS, hasCustomApprovalsEntitlement => {
      this.setState({ hasCustomApprovalsEntitlement })
    })
  }

  getButtonText() {
    var buttonText = ''
    if (this.state.hasCustomApprovalsEntitlement) {
      if (this.props.isDraft) {
        buttonText = this.props.isGroup ? translation._('Delete drafts') : translation._('Delete draft')
      } else if (this.props.isComment) {
        buttonText = translation._('Delete comment')
      } else if (this.props.isReply) {
        buttonText = translation._('Delete reply')
      } else {
        buttonText = this.props.isGroup ? translation._('Delete posts') : translation._('Delete post')
      }
    } else {
      if (this.props.isDraft) {
        buttonText = this.props.isGroup ? translation._('Delete drafts') : translation._('Delete draft')
      } else {
        buttonText = this.props.isGroup ? translation._('Delete posts') : translation._('Delete post')
      }
    }

    return buttonText
  }

  getBodyText() {
    var bodyText = ''

    if (this.state.hasCustomApprovalsEntitlement) {
      if (this.props.isDraft) {
        bodyText = this.props.isGroup
          ? translation._('Are you sure you want to delete these drafts? This cannot be undone.')
          : translation._('Are you sure you want to delete this draft? This cannot be undone.')
      } else if (this.props.isComment) {
        bodyText = translation._('Are you sure you want to delete this comment? This cannot be undone.')
      } else if (this.props.isReply) {
        bodyText = translation._('Are you sure you want to delete this reply? This cannot be undone.')
      } else {
        bodyText = this.props.isGroup
          ? translation._('Are you sure you want to delete these posts? This cannot be undone.')
          : translation._('Are you sure you want to delete this post? This cannot be undone.')
      }
    } else {
      if (this.props.isDraft) {
        bodyText = this.props.isGroup
          ? translation._('Are you sure you want to delete these drafts? This cannot be undone.')
          : translation._('Are you sure you want to delete this draft? This cannot be undone.')
      } else {
        bodyText = this.props.isGroup
          ? translation._('Are you sure you want to delete these posts? This cannot be undone.')
          : translation._('Are you sure you want to delete this post? This cannot be undone.')
      }
    }

    return bodyText
  }

  onDeleteBtnClick() {
    this.setState({ isLoading: true })
    this.props.onDeleteBtnClick(this.props.onClose)
  }

  renderFooter() {
    return (
      <div className="-actions">
        <Button type={SECONDARY} onClick={this.props.onClose} ref={r => (this.cancelButton = r)}>
          {translation._('Cancel')}
        </Button>
        <Button btnStyle="primary" isLoading={this.state.isLoading} onClick={this.onDeleteBtnClick}>
          {this.getButtonText()}
        </Button>
      </div>
    )
  }

  render() {
    var titleText

    if (this.state.hasCustomApprovalsEntitlement) {
      if (this.props.isComment) {
        titleText = translation._('Delete comment')
      } else if (this.props.isReply) {
        titleText = translation._('Delete reply')
      } else {
        titleText = translation._('Delete post')
      }
    } else {
      titleText = translation._('Delete post')
    }

    return (
      <div className="rc-MessageDeleteModal">
        <SimpleModal
          footerContent={this.renderFooter()}
          hasBackdrop={true}
          hasCloseButton={true}
          onRequestHide={this.props.onClose}
          titleText={titleText}
          width="500px"
        >
          {this.getBodyText()}
        </SimpleModal>
      </div>
    )
  }
}

MessageDeleteModal.propTypes = {
  isComment: PropTypes.bool,
  isDraft: PropTypes.bool.isRequired,
  isGroup: PropTypes.bool.isRequired,
  isReply: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onDeleteBtnClick: PropTypes.func.isRequired,
}

MessageDeleteModal.defaultProps = {
  isComment: false,
  isReply: false,
}

MessageDeleteModal.displayName = 'Message Delete Modal'
