import React from 'react'

import BlockArrowUp from '@fp-icons/block-arrow-up'
import Icon from '@fp-icons/icon-base'
import { Button, ICON, SIZE_44 } from 'fe-comp-button'
import { BouncingBars } from 'fe-comp-loader'
import { MediaUpload } from 'fe-pnc-comp-media-upload'
import { ACCEPTED_MIME_TYPES } from 'fe-pnc-comp-media-upload'
import Thumbnail from 'fe-pnc-comp-thumbnail'
import translation from 'fe-pnc-lib-hs-translation'
import { ENTER, keyboardEventHandler } from 'fe-pnc-lib-keyboard-events'

import statusObject, { StatusObject } from '@/utils/status-bar'
import {
  CustomizeLinkPreviewUploadButton,
  EditPanel,
  EditPanelLink,
  EditPanelSubtitle,
  EditPanelText,
  ImagesContentHolder,
  LoadingThumb,
  ThumbnailWrapper,
  ToggleThumbnailButton,
} from './image-selection-panel.style'

const noop = () => {}

const LINK_IMAGE = translation._('Link image')
const REMOVE_IMAGE = translation._('Remove image')
const ADD_IMAGE = translation._('Add image')

const imageUploadButtonElementClass = '_linkPreviewUploadButton'

const UploadButton = () => (
  <CustomizeLinkPreviewUploadButton className={imageUploadButtonElementClass}>
    <Button type={ICON} height={SIZE_44}>
      <Icon glyph={BlockArrowUp} />
    </Button>
  </CustomizeLinkPreviewUploadButton>
)

interface ImageSelectionPanelProps {
  thumbnailUrls: Array<unknown>
  selectedThumbnailUrl?: string
  onRemoveThumbnail(): void
  onAddThumbnail(): void
  csrf?: string
  facadeApiUrl?: string
  onSelectImage(index: number): void
}

class ImageSelectionPanel extends React.PureComponent<ImageSelectionPanelProps> {
  static defaultProps = {
    thumbnailUrls: [],
    selectedThumbnailUrl: null,
    facadeApiUrl: undefined,
    csrf: undefined,
    onRemoveThumbnail: () => {},
    onAddThumbnail: () => {},
    onSelectImage: () => {},
  }

  _statusObject: StatusObject

  constructor(props) {
    super(props)

    this._statusObject = statusObject

    this.state = {
      isAttachmentLoading: false,
    }
  }

  handleAttachmentUploaded = (response, messageId) => {
    this.setState({ isAttachmentLoading: false })
    this.props.onAttachmentUploaded(response, messageId)
  }

  handleAttachmentUploadStarted = () => {
    this.setState({ isAttachmentLoading: true })
  }

  handleAttachmentUploadError = (file, error) => {
    const errorMessage = error ? error : 'An error occurred while uploading your file.'
    this._statusObject.update(translation._(errorMessage), 'error', true)
    this.setState({ isAttachmentLoading: false })
  }

  renderThumbnailPanel() {
    const { thumbnailUrls, selectedThumbnailUrl, onSelectImage } = this.props

    return thumbnailUrls.map((thumbnailUrlObj, index) => {
      let imageHtml
      const backgroundImage = thumbnailUrlObj.thumbnailUrl
      if (selectedThumbnailUrl === thumbnailUrlObj.thumbnailUrl) {
        imageHtml = (
          <ThumbnailWrapper isSelected={true} key={index}>
            <Thumbnail url={backgroundImage} />
          </ThumbnailWrapper>
        )
      } else {
        imageHtml = (
          <ThumbnailWrapper
            key={index}
            onClick={() => onSelectImage(index)}
            onKeyDown={keyboardEventHandler({
              [ENTER]: () => onSelectImage(index),
            })}
            role="button"
            tabIndex="0"
          >
            <Thumbnail url={backgroundImage} />
          </ThumbnailWrapper>
        )
      }
      return imageHtml
    })
  }

  render() {
    const {
      onRemoveThumbnail,
      onAddThumbnail,
      csrf,
      facadeApiUrl,
      mainComponentClassName,
      thumbnailUrls,
      selectedThumbnailUrl,
    } = this.props
    const { isAttachmentLoading } = this.state

    return (
      <EditPanel className="-imagesPanel">
        <EditPanelSubtitle className="-subtitle">
          {thumbnailUrls.length > 0 && (
            <EditPanelLink className="-link">
              {selectedThumbnailUrl ? (
                <ToggleThumbnailButton onClick={onRemoveThumbnail}>{REMOVE_IMAGE}</ToggleThumbnailButton>
              ) : (
                <ToggleThumbnailButton onClick={onAddThumbnail}>{ADD_IMAGE}</ToggleThumbnailButton>
              )}
            </EditPanelLink>
          )}
          <EditPanelText className="-text">{LINK_IMAGE}</EditPanelText>
        </EditPanelSubtitle>
        {(thumbnailUrls.length === 0 || selectedThumbnailUrl) && (
          <ImagesContentHolder className="-imagesContentHolder">
            {this.renderThumbnailPanel()}
            {isAttachmentLoading && (
              <LoadingThumb>
                <BouncingBars size={18} />
              </LoadingThumb>
            )}
            <MediaUpload
              acceptedMimeTypes={ACCEPTED_MIME_TYPES.IMAGE.join()}
              csrf={csrf}
              dropzoneSelector={`.${mainComponentClassName} .${imageUploadButtonElementClass}`}
              facadeApiUrl={facadeApiUrl}
              hiddenInputContainer={`.${mainComponentClassName}`}
              maxFiles={1}
              onFileAdded={this.handleAttachmentUploadStarted}
              onUpdateUploadingFiles={noop}
              onUploadComplete={this.handleAttachmentUploaded}
              onUploadError={this.handleAttachmentUploadError}
              width="auto"
            >
              <UploadButton />
            </MediaUpload>
          </ImagesContentHolder>
        )}
      </EditPanel>
    )
  }
}

export default ImageSelectionPanel
