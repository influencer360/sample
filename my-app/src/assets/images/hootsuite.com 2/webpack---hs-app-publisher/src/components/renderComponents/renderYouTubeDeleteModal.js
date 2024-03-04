/** @format */

import React from 'react'
import ReactDOM from 'react-dom'

const renderYoutubeDeleteModal = async (props, parentNode, parentNodeId) => {
  const onClose = () => ReactDOM.unmountComponentAtNode(document.getElementById(parentNodeId))
  const { default: YouTubeDeleteModal } = await import('../youtube-delete-modal/youtube-delete-modal')
  ReactDOM.render(<YouTubeDeleteModal {...props} onClose={onClose} />, parentNode)
}

export default renderYoutubeDeleteModal
