/** @format */

import React from 'react'
import ReactDOM from 'react-dom'

const renderYoutubeCTA = async (props, parentNode) => {
  const { default: YoutubeCTA } = await import('../youtube-cta/youtube-cta')
  ReactDOM.render(<YoutubeCTA {...props} />, parentNode)
}

export default renderYoutubeCTA
