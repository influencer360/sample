/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import MessageRejectModal from '../message-reject-modal/message-reject-modal'

const renderMessageRejectModal = async (props, parentNode, messageRejectModal) => {
  const onClose = event => {
    event && event.stopPropagation()
    ReactDOM.unmountComponentAtNode(document.getElementById(messageRejectModal))
  }
  ReactDOM.render(<MessageRejectModal {...props} onClose={onClose} />, parentNode)
}

export default renderMessageRejectModal
