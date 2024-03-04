/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import MessageApprovalHistoryModal from '../message-approval-history-modal/message-approval-history-modal'

const renderMessageApprovalHistoryModal = async (props, parentNode, messageApproveHistoryModal) => {
  const onClose = event => {
    event && event.stopPropagation()
    ReactDOM.unmountComponentAtNode(document.getElementById(messageApproveHistoryModal))
  }
  ReactDOM.render(<MessageApprovalHistoryModal {...props} onClose={onClose} />, parentNode)
}

export default renderMessageApprovalHistoryModal
