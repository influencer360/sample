/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import FluxComponent from 'hs-nest/lib/components/flux-component'

const renderTwitterNewStyleReplies = async (props, parentNode, twitterNewStyleRepliesId) => {
  const onClose = event => {
    event && event.stopPropagation()
    ReactDOM.unmountComponentAtNode(document.querySelector(`#${twitterNewStyleRepliesId}`))
  }
  const { default: TwitterNewStyleReplies } = await import(
    /* webpackChunkName: "TwitterNewStyleReplies" */ '../twitter-new-style-replies/twitter-new-style-replies'
  )
  ReactDOM.render(
    <FluxComponent
      connectToStores={{
        member: store => ({
          member: store.get(),
        }),
      }}
      flux={props.flux}
    >
      <TwitterNewStyleReplies {...props} onClose={onClose} />
    </FluxComponent>,
    parentNode,
  )
}

export default renderTwitterNewStyleReplies
