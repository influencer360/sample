/** @format */

import React from 'react'
import ReactDOM from 'react-dom'
import OptInModal from '../opt-in-modal/opt-in-modal'

const renderOptInModal = async (props, parentNode, bulkComposerOptIn) => {
  const onClose = () => ReactDOM.unmountComponentAtNode(document.querySelector(`#${bulkComposerOptIn}`))
  ReactDOM.render(
    <OptInModal {...props} onClose={onClose}>
      {props.children}
    </OptInModal>,
    parentNode,
  )
}

export default renderOptInModal
