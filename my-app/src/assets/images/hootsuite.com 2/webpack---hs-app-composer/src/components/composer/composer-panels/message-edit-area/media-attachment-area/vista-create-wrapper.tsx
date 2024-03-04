import { useEffect, useCallback, useState } from 'react'
import { TYPE_ERROR } from 'fe-comp-banner'
import { AttachmentConstants, ComposerConstants } from 'fe-pnc-constants'
import type { AttachmentData, ImageAttachment } from 'fe-pnc-data-composer-message'
import { getS3UrlFromExternalUrl } from 'fe-pnc-lib-api'
import translation from 'fe-pnc-lib-hs-translation'
import StatusToastUtils from '@/utils/status-toast-utils'

const API_URL = 'https://create.vista.com/js/frame_v2.min.js'
const API_KEY = process.env.VISTACREATE_API_KEY
const SCRIPT_ID = 'VISTACREATE'
const TOAST_TIMEOUT = 10000

const ERROR_BANNER_TITLE = translation._('Please try again')
const ERROR_ATTACH_BANNER_MESSAGE = translation._('There was an issue adding the image to your post.')

type PublishedData = {
  id: string
  downloadId: string
  extension: string
  projectName: string
  url: string
}

type VistaCreateOptions = {
  apiKey: string
  designType?: string
  designId?: string
  templateId?: string
  onPublishAction?: (publishedData: PublishedData) => void
}

type VistaEditorApi = {
  close: () => void
}

interface VistaCreateWindow extends Window {
  CrelloEditor?: {
    init(opts: VistaCreateOptions): Promise<VistaEditorApi>
  }
  __openVistaCreate: (attachmentToEdit?: ImageAttachment) => void
}

declare const window: VistaCreateWindow

type VistaCreateWrapperProps = {
  children: React.FC<VistaCreateChildProps>
  onAddAttachment: (
    attachmentData: AttachmentData,
    isUploadRequired?: boolean,
    currentSource?: string,
  ) => void
  onImageEdited: (attachment: AttachmentData, editedAttachment: AttachmentData) => void
  onErrorLoadingVistaCreate: () => void
}

export type VistaCreateChildProps = {
  editorApi?: Record<string, unknown>
}

function getMimeTypeFromExtension(extension: string) {
  switch (extension) {
    case 'mp4':
      return 'video/mp4'
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'png':
      return 'image/png'
    default:
      return null
  }
}

const VistaCreateWrapper = ({
  children,
  onAddAttachment,
  onImageEdited,
  onErrorLoadingVistaCreate,
}: VistaCreateWrapperProps) => {
  const [editorApi, setEditorApi] = useState(null)
  const onError = useCallback(() => {
    onErrorLoadingVistaCreate()
  }, [onErrorLoadingVistaCreate])

  const editExistingAttachment = useCallback(
    (attachmentData: AttachmentData, attachmentToEdit: ImageAttachment) => {
      // Upload new attachement to S3
      getS3UrlFromExternalUrl({
        id: attachmentData.id,
        appId: null,
        url: attachmentData.url,
        mimeTypeHint: attachmentData.mimeType,
      })
        .then(data => {
          // Update existing attachment
          onImageEdited(attachmentToEdit.toDataObject(), {
            ...attachmentData,
            url: data.url,
            thumbnailUrl: data.thumbnailUrl,
            bytes: data.bytes,
            mimeType: data.mimeType,
            height: data.height,
            width: data.width,
          })
        })
        .catch(() => {
          StatusToastUtils.createToast(
            ERROR_BANNER_TITLE,
            ERROR_ATTACH_BANNER_MESSAGE,
            TYPE_ERROR,
            TOAST_TIMEOUT,
            null,
          )
        })
    },
    [onImageEdited],
  )

  const onPublish = useCallback(
    (vistaCreateData: PublishedData, attachmentToEdit: ImageAttachment) => {
      const attachmentData = {
        id: vistaCreateData.id,
        fileName: vistaCreateData.projectName,
        url: vistaCreateData.url,
        thumbnailUrl: vistaCreateData.url,
        trackingSource: ComposerConstants.ATTACHMENT_TRACKING_SOURCE.VISTACREATE,
        fileSource: AttachmentConstants.FILESOURCE.VISTACREATE,
        externalProvider: {
          identifier: vistaCreateData.id,
          name: ComposerConstants.ATTACHMENT_TRACKING_SOURCE.VISTACREATE,
        },
        // We need to provide a mimeType as isImageAttachment is unable to parse the URL (the extension is after a ?)
        mimeType: getMimeTypeFromExtension(vistaCreateData.extension),
      } as AttachmentData

      if (attachmentToEdit?.externalProvider) {
        editExistingAttachment(attachmentData, attachmentToEdit)
      } else {
        onAddAttachment(attachmentData, true)
      }
    },
    [onAddAttachment, editExistingAttachment],
  )

  const openVistaCreate = useCallback(
    attachmentToEdit => {
      const createOptions: VistaCreateOptions = {
        apiKey: API_KEY,
        // using default designType until we are able to select a template
        designId: attachmentToEdit?.id || null,
        designType: 'facebookSM',
        onPublishAction: vistaCreateData => onPublish(vistaCreateData, attachmentToEdit),
      }
      window?.CrelloEditor?.init(createOptions)
        .then((api: VistaEditorApi) => {
          setEditorApi(api)
        })
        .catch(() => onError())
    },
    [onPublish, onError],
  )

  useEffect(() => {
    // avoid reloading the script if it has been already initialized in the page
    // used an early return here to increase readability
    if (document.getElementById(SCRIPT_ID)) {
      return
    }

    const scriptNode = document.createElement('script')
    scriptNode.id = SCRIPT_ID
    scriptNode.src = API_URL
    scriptNode.async = true
    scriptNode.onload = () => {
      window.__openVistaCreate = openVistaCreate
    }
    scriptNode.onerror = () => onError()
    document.head.appendChild(scriptNode)
  }, [onError, openVistaCreate])

  return children({
    editorApi: editorApi,
  })
}

export default VistaCreateWrapper
