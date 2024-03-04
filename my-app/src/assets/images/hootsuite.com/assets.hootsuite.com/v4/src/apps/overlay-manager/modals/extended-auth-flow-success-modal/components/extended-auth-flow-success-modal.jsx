import React from 'react'
import ReactDOM from 'react-dom'
import hootbus from 'utils/hootbus'
import { IgAuthSuccessModal } from 'fe-chan-comp-ig-auth-success-modal'

const ID = 'fe-chan-comp-ig-auth-success-modal'

// Create a div that will contain the React component
let container = document.getElementById(ID)
if (!container) {
  container = document.createElement('div')
  container.id = ID
  document.body.appendChild(container)
}

// Small component to handle whether the Modal is displayed or not
const ModalWrapper = ({isOpen = false, children}) => {
  if (isOpen) {
    return (
      <div>
        {children}
      </div>
    )
  }

  return null
}

export const getModal = function(isOpen = false, props = {}) {
  const instagramHandle = props.username;
  const onClose = () => {
    // Trigger event to update the overlay manager
    hootbus.emit('notify:overlay:closed', 'modal', 'extendedAuthFlowSuccess');
    if (props && props.onDismiss) {
      props.onDismiss()
    }
  }

  ReactDOM.render(
    <ModalWrapper isOpen={isOpen}>
      <IgAuthSuccessModal
        instagramHandle={instagramHandle}
        onDismiss={onClose}
      />
    </ModalWrapper>,
    container
  )
}
