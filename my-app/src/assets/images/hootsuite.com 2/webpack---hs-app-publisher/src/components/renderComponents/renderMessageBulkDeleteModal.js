/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import MessageBulkDeleteModal from '../message-bulk-delete-modal/message-bulk-delete-modal'

const renderMessageBulkDeleteModal = async (props, parentNode, messageBulkDeleteModal) => {
  const onClose = e => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation()
    }
    ReactDOM.unmountComponentAtNode(document.getElementById(messageBulkDeleteModal))
  }
  ReactDOM.render(<MessageBulkDeleteModal {...props} onClose={onClose} />, parentNode)
}

export default renderMessageBulkDeleteModal
