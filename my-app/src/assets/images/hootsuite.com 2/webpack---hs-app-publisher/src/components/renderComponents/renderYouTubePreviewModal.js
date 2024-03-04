/** @format */

import React from 'react'
import ReactDOM from 'react-dom'

const renderYouTubePreviewModal = async (props, parentNode, youtubePreviewModalContainerId) => {
  const onClose = () =>
    ReactDOM.unmountComponentAtNode(document.getElementById(youtubePreviewModalContainerId))
  const { default: YouTubePreviewModal } = await import('../youtube-preview-modal/youtube-preview-modal')
  ReactDOM.render(<YouTubePreviewModal {...props} onClose={onClose} />, parentNode)
}

export default renderYouTubePreviewModal
