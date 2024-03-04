/**
 * @format
 * @preventMunge
 */

import './message-bulk-delete-modal.less'

import PropTypes from 'prop-types'
import React from 'react'
import SimpleModal from 'hs-nest/lib/components/modal/simple-modal'
import Button from 'hs-nest/lib/components/buttons/button'
import translation from 'hs-nest/lib/utils/translation'
import JsxUtils from 'hs-nest/lib/utils/jsx-utils'
import Constants from '../../constants/constants'

export default class BulkMessageDeleteModal extends React.Component {
  constructor(props) {
    super(props)

    this.getBodyLine1 = this.getBodyLine1.bind(this)
    this.getBodyLine2 = this.getBodyLine2.bind(this)
    this.getTitleText = this.getTitleText.bind(this)
    this.onDeleteBtnClick = this.onDeleteBtnClick.bind(this)
    this.cancelButtonRef = React.createRef()

    this.state = {
      isLoading: false,
    }
  }

  getBodyLine1() {
    var text

    if (
      this.props.dialogType === Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE.SIMPLE_DELETE ||
      this.props.dialogType === Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE.APPROVAL_WARNING
    ) {
      text = translation._('Are you sure you want to delete the selected messages?')
    } else if (
      this.props.dialogType === Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE.SOME_MESSAGES_COULD_NOT_BE_DELETED
    ) {
      // prettier-ignore
      text = translation._('Some of the messages you selected could not be deleted because they are %bpending approval%/b.')
      text = JsxUtils.jsxFromTemplate(text)
    } else if (this.props.dialogType === Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE.CANNOT_DELETE) {
      // prettier-ignore
      text = translation._('The post cannot be deleted because you are not the author, and/or the post is pending approval.')
    }

    return text
  }

  getBodyLine2() {
    var text

    if (this.props.dialogType === Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE.APPROVAL_WARNING) {
      // prettier-ignore
      text = translation._('Note: Some of the messages you selected may not be deleted because you are not the author, and/or the message is pending approval.')
    } else if (
      this.props.dialogType === Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE.SOME_MESSAGES_COULD_NOT_BE_DELETED
    ) {
      // prettier-ignore
      text = translation._('These messages must be rejected by the current approver, or deleted by the author.')
      text = JsxUtils.jsxFromTemplate(text)
    }

    if (text) {
      return <div className="rc-additionalLine">{text}</div>
    }

    return null
  }

  getTitleText() {
    var text

    if (
      this.props.dialogType === Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE.SIMPLE_DELETE ||
      this.props.dialogType === Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE.APPROVAL_WARNING
    ) {
      text = translation._('Delete selected messages')
    } else if (
      this.props.dialogType === Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE.SOME_MESSAGES_COULD_NOT_BE_DELETED
    ) {
      text = translation._('Some messages were not deleted')
    } else if (this.props.dialogType === Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE.CANNOT_DELETE) {
      text = translation._('Cannot delete selected post(s)')
    }

    return text
  }

  onDeleteBtnClick() {
    this.setState({ isLoading: true })
    this.props.onDeleteClicked()
    this.props.onClose()
  }

  renderFooter() {
    var isSingleButtonDialog =
      this.props.dialogType === Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE.CANNOT_DELETE ||
      this.props.dialogType === Constants.BULK_MESSAGE_DELETE_DIALOG_TYPE.SOME_MESSAGES_COULD_NOT_BE_DELETED

    if (isSingleButtonDialog) {
      return (
        <div className="-actions">
          <Button
            btnStyle="primary"
            className="x-close"
            onClick={this.props.onClose}
            ref={r => (this.cancelButtonRef = r)}
          >
            {translation._('Ok, close')}
          </Button>
        </div>
      )
    }

    // else: standard two-buttons
    return (
      <div className="-actions">
        <Button
          btnStyle="secondary"
          className="x-cancel"
          onClick={this.props.onClose}
          ref={r => (this.cancelButtonRef = r)}
        >
          {translation._('Cancel')}
        </Button>
        <Button
          btnStyle="primary"
          className="x-delete"
          isLoading={this.state.isLoading}
          onClick={this.onDeleteBtnClick}
        >
          {translation._('Delete Selected')}
        </Button>
      </div>
    )
  }

  render() {
    return (
      <div className="rc-MessageBulkDeleteModal">
        <SimpleModal
          footerContent={this.renderFooter()}
          hasBackdrop={true}
          hasCloseButton={true}
          onRequestHide={this.props.onClose}
          titleText={this.getTitleText()}
          width="450px"
        >
          <div>{this.getBodyLine1()}</div>
          {this.getBodyLine2()}
        </SimpleModal>
      </div>
    )
  }
}

BulkMessageDeleteModal.propTypes = {
  dialogType: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onDeleteClicked: PropTypes.func,
}

BulkMessageDeleteModal.displayName = 'Bulk Message Delete Modal'
