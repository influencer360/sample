/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import MessagePreviewBanner from '../message-preview-banner/message-preview-banner'

const renderMessagePreviewBanner = async (props, parentNode) => {
  ReactDOM.render(<MessagePreviewBanner {...props} />, parentNode)
}

export default renderMessagePreviewBanner
