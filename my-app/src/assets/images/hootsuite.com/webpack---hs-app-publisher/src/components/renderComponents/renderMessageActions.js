/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import MessageActions from '../message-actions/message-actions'

const renderMessageActions = async (props, parentNode) => {
  ReactDOM.render(<MessageActions {...props} />, parentNode)
  return () => ReactDOM.unmountComponentAtNode(parentNode)
}

export default renderMessageActions
