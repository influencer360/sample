import { ComposerConstants } from 'fe-pnc-constants'
import { ImageAttachment } from 'fe-pnc-data-composer-message'
import { openImageEditor } from 'fe-pnc-lib-async-image-editor'
import {
  trackActionHandlerEvent,
  VALIDATION_BANNER_ACTION_OPEN_CROP_IMAGE_CLICKED,
} from './track-action-handler-event'

export const renderImageEditor = (attachment, onAttachmentEdited, postType = null, selectedNetworkGroup) => {
  const imageAttachment = attachment as ImageAttachment

  trackActionHandlerEvent({
    action: VALIDATION_BANNER_ACTION_OPEN_CROP_IMAGE_CLICKED,
    payload: attachment,
  })

  openImageEditor({
    attachment,
    onSave: (editedAttachment: ImageAttachment) => onAttachmentEdited(imageAttachment, editedAttachment),
    postType,
    selectedNetworkGroup,
  })
}

const addCropImageActionHandler = (
  attachmentError,
  mediaAttachments,
  onAttachmentEdited,
  postType,
  selectedNetworkGroup,
) => {
  const attachmentIndex = parseInt(attachmentError?.vars.find(v => v.key === 'attachmentIndex').value)
  attachmentError.fileName = mediaAttachments[attachmentIndex]?.fileName
  attachmentError.actionHandler = () =>
    renderImageEditor(mediaAttachments[attachmentIndex], onAttachmentEdited, postType, selectedNetworkGroup)
}

export const addActionHandler = (
  fieldValidations,
  mediaAttachments,
  onAttachmentEdited,
  postType = null,
  selectedNetworkGroup,
) => {
  fieldValidations?.errors?.attachments?.forEach(attachmentError => {
    if (
      ComposerConstants.ERROR_CODES.INVALID_ASPECT_RATIO.includes(attachmentError.code) &&
      selectedNetworkGroup
    ) {
      addCropImageActionHandler(
        attachmentError,
        mediaAttachments,
        onAttachmentEdited,
        postType,
        selectedNetworkGroup,
      )
    } else {
      attachmentError.actionHandler = undefined
    }
  })
  return fieldValidations
}
