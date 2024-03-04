/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import InlineRedirectNotification from '../custom-approval/inline-redirect-notification/inline-redirect-notification'

const renderInlineRedirectNotification = async (props, parentNode) => {
  ReactDOM.render(<InlineRedirectNotification {...props} />, parentNode)
}

export default renderInlineRedirectNotification
