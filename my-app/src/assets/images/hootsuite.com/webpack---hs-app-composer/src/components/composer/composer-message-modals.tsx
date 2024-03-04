import React from 'react'
import ReactDOM from 'react-dom'

import { P } from 'fe-comp-dom-elements'
import { showConfirmationModal } from 'fe-pnc-comp-confirmation-modal'
import { removeLoadingModal, showLoadingModal } from 'fe-pnc-comp-loading-modal'
import translation from 'fe-pnc-lib-hs-translation'

const CANCEL = translation._('Cancel')
const OPEN = translation._('Open')

const PREAPPROVED_CONTENT = translation._('Preapproved content')
// prettier-ignore
const DO_NOT_EDIT_POST = translation._('Do not edit this post. Any modifications to this preapproved content will result in this post not being published.')
const CONTINUE = translation._('Continue')

const EDIT_DRAFT = translation._('Edit this draft')
const EDIT_MESSAGE = translation._('Edit this post')
const DUPLICATE_MESSAGE = translation._('Duplicate this post')
// prettier-ignore
const DISREGARD_MESSAGE_DRAFT = translation._("It looks like you're currently editing a post, do you wish to disregard it and open this draft?")
// prettier-ignore
const DISREGARD_MESSAGE_EDIT = translation._("It looks like you're currently editing a post, do you wish to disregard it and open this post?")
// prettier-ignore
const DISREGARD_MESSAGE_DUPLICATE = translation._("It looks like you're currently editing a post, do you wish to disregard it and duplicate this post instead?")

const retrieveModalText = (isDraft, isDuplicate) => {
  let titleText
  let bodyText

  if (isDraft) {
    titleText = EDIT_DRAFT
    bodyText = DISREGARD_MESSAGE_DRAFT
  } else if (isDuplicate) {
    titleText = DUPLICATE_MESSAGE
    bodyText = DISREGARD_MESSAGE_DUPLICATE
  } else {
    titleText = EDIT_MESSAGE
    bodyText = DISREGARD_MESSAGE_EDIT
  }
  return { titleText, bodyText }
}

/**
 * Renders a pre-approval confirmation modal for State Farm preapproved templates
 * @param {function} onContinueClickFn
 */
const renderPreapprovalModal = onContinueClickFn => {
  showConfirmationModal({
    titleText: PREAPPROVED_CONTENT,
    bodyText: <P>{DO_NOT_EDIT_POST}</P>,
    submitButtonText: CONTINUE,
    cancelButtonText: CANCEL,
    onSubmit: close => {
      close()
      if (onContinueClickFn) {
        onContinueClickFn()
      }
    },
  })
}

/**
 * Renders a confirmation modal if the user has minimized a Composer instance and is attempting to open a new instance
 */
const renderDisregardMessageModal = ({
  isDraft = false,
  isDuplicate = false,
  isTemplate = false,
  onClose = () => {},
}) => {
  const { titleText, bodyText } = retrieveModalText(isDraft, isDuplicate, isTemplate)

  showConfirmationModal({
    titleText,
    bodyText: <P>{bodyText}</P>,
    submitButtonText: OPEN,
    cancelButtonText: CANCEL,
    onSubmit: close => {
      ReactDOM.unmountComponentAtNode(document.querySelector('#fullScreenComposerMountPoint'))
      close()
      showLoadingModal()
      onClose()
    },
    onCancel: removeLoadingModal(),
  })
}

export { renderDisregardMessageModal, renderPreapprovalModal }
