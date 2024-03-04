/** @format */

import React from 'react'
import ReactDOM from 'react-dom'

const renderYoutubePrivacyIndicator = async (props, parentNode) => {
  const { default: YoutubePrivacyIndicator } = await import(
    '../youtube-privacy-indicator/youtube-privacy-indicator'
  )
  ReactDOM.render(<YoutubePrivacyIndicator {...props} />, parentNode)
}

export default renderYoutubePrivacyIndicator
