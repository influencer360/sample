/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import { showConfirmationModal } from 'fe-pnc-comp-confirmation-modal'
import translation from 'hs-nest/lib/utils/translation'
import MessageDeleteModal from '../message-delete-modal/message-delete-modal'

const DELETE_POST_CONFIRMATION_MODAL_TITLE_TEXT = translation._('Delete this post?')
// prettier-ignore
const DELETE_POST_CONFIRMATION_MODAL_BODY_TEXT = translation._('The post will be deleted for all organization members.')
const CANCEL = translation._('Cancel')
const DELETE_POST = translation._('Delete post')

const renderMessageDeleteModal = async (
  { isApproval, isComment, isDraft, isExpired, isGroup, isReply, onDeleteBtnClick },
  parentNode,
  messageDeleteModal,
) => {
  const onClose = event => {
    event && event.stopPropagation()
    ReactDOM.unmountComponentAtNode(document.getElementById(messageDeleteModal))
  }
  if (isApproval && isExpired) {
    showConfirmationModal({
      titleText: DELETE_POST_CONFIRMATION_MODAL_TITLE_TEXT,
      bodyText: DELETE_POST_CONFIRMATION_MODAL_BODY_TEXT,
      submitButtonText: DELETE_POST,
      cancelButtonText: CANCEL,
      onSubmit: close => {
        close()
        onDeleteBtnClick()
      },
    })
  } else {
    ReactDOM.render(
      <MessageDeleteModal
        {...{ isApproval, isComment, isDraft, isExpired, isGroup, isReply, onDeleteBtnClick }}
        onClose={onClose}
      />,
      parentNode,
    )
  }
}

export default renderMessageDeleteModal
