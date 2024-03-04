/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import FluxComponent from 'hs-nest/lib/components/flux-component'

const renderYoutubeUploadModal = async (props, parentNode, youtubeUploadModalId) => {
  const onClose = () => ReactDOM.unmountComponentAtNode(document.getElementById(youtubeUploadModalId))
  const { default: YoutubeUploadModal } = await import('../youtube-upload-modal/youtube-upload-modal')
  ReactDOM.render(
    <FluxComponent
      connectToStores={{
        youtube: store => ({
          channels: store.getChannels(),
          categories: store.getCategories(),
        }),
      }}
      flux={props.flux}
    >
      <YoutubeUploadModal {...props} onClose={onClose} />
    </FluxComponent>,
    parentNode,
  )
}

export default renderYoutubeUploadModal
