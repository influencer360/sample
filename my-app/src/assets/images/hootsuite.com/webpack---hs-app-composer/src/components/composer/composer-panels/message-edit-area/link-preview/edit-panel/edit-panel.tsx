import React from 'react'
import debounce from 'lodash/debounce'

import { Button, PRIMARY, CTA } from 'fe-comp-button'
import { InputText } from 'fe-comp-input-text'
import { getMessages, getState as getComposerMessageState } from 'fe-pnc-data-composer-message'
import translation from 'fe-pnc-lib-hs-translation'

import { TrackingContext } from '@/typings/Constants'
import { track } from '@/utils/tracking'
import ImageSelectionPanel from './../image-selection-panel'
import { getDefaultLinkPreviewFormat } from './../utils'
import WarningBanner from './../warning-banner'
import {
  ActionPanel,
  EditPanelDescription,
  EditPanelInput,
  EditPanelSubtitle,
  EditPanelText,
  EditPanelWrapper,
  Heading,
  SaveButton,
} from './edit-panel.style'

const CUSTOMIZE_LINK_PREVIEW = translation._('Customize link preview')
const LINK_TITLE = translation._('Link title')
const LINK_DESCRIPTION = translation._('Link description')
const TITLE = translation._('title')
const DESCRIPTION = translation._('description')
const CANCEL = translation._('Cancel')
const SAVE = translation._('Save')

const EDIT_DEBOUNCE_MS = 1500

interface EditPanelProps {
  facebookWarningVisible: boolean
  numberOfNetworksNotCustomized: number
  socialNetworkNamesForWarning?: Array<string>
  onDismissFacebookWarning?(...args: Array<unknown>): unknown
  facadeApiUrl?: string
  csrf?: string
  messageId?: number
  linkPreview: Record<string, unknown>
  selectedThumbnailUrl?: string
  trackingContext: TrackingContext
}

class EditPanel extends React.PureComponent<EditPanelProps> {
  static defaultProps = {
    numberOfNetworksNotCustomized: 0,
    socialNetworkNamesForWarning: [],
    selectedThumbnailUrl: null,
    facadeApiUrl: undefined,
    csrf: undefined,
    trackingContext: undefined,
    messageId: undefined,
    onDismissFacebookWarning: () => {},
  }

  constructor(props) {
    super(props)

    this.state = {
      title: props.linkPreview.title,
      description: props.linkPreview.description,
      thumbnailUrl: props.linkPreview.thumbnailUrl,
      thumbnailUrls: props.linkPreview.thumbnailUrls,
    }

    this.trackTitleChange = debounce(this.trackTitleChange, EDIT_DEBOUNCE_MS)
    this.trackDescriptionChange = debounce(this.trackDescriptionChange, EDIT_DEBOUNCE_MS)
  }

  handleCancel = () => {
    this.props.onCancel()
  }

  handleSave = () => {
    this.props.onSave({
      ...this.props.linkPreview,
      title: this.state.title,
      description: this.state.description,
      thumbnailUrl: this.state.thumbnailUrl,
    })
  }

  handleTitleChange = event => {
    this.setState({ title: event.target.value })
    this.trackTitleChange()
  }

  handleDescriptionChange = event => {
    this.setState({ description: event.target.value })
    this.trackDescriptionChange()
  }

  trackTitleChange = () => {
    track('web.publisher.' + this.props.trackingContext + '.edit_message', 'edit_link_title')
  }

  trackDescriptionChange = () => {
    track('web.publisher.' + this.props.trackingContext + '.edit_message', 'edit_link_description')
  }

  /**
   * Note: Set state will only function as expected if this component is properly mounted and unmounted as this function
   * is an async call back.
   * @param {object} response
   * @param {int} messageId
   */
  handleAttachmentUploaded = response => {
    const messages = getMessages(getComposerMessageState())

    track('web.publisher.' + this.props.trackingContext + '.edit_message', 'upload_custom_link_thumbnail')
    if (response && response.thumbnailUrl) {
      const message = messages.find(m => m.id === this.props.messageId)
      if (message) {
        const updatedLinkPreview = getDefaultLinkPreviewFormat(message.urlPreview)

        let thumbnailUrls = updatedLinkPreview.thumbnailUrls

        if (Array.isArray(thumbnailUrls)) {
          thumbnailUrls.push({
            thumbnailUrl: response.thumbnailUrl,
            originalUrl: response.url,
          })
        } else {
          thumbnailUrls = [
            {
              thumbnailUrl: response.thumbnailUrl,
              originalUrl: response.url,
            },
          ]
        }

        updatedLinkPreview.thumbnailUrls = thumbnailUrls

        this.setState({
          thumbnailUrls: thumbnailUrls,
          thumbnailUrl: response.thumbnailUrl,
        })
      }
    }
  }

  handleSelectImage = index => {
    const thumbnailUrls = this.state.thumbnailUrls
    let selectedThumbnailUrl
    if (thumbnailUrls.length && index >= 0 && index < thumbnailUrls.length) {
      if (thumbnailUrls[index].thumbnailUrl !== this.state.thumbnailUrl) {
        track('web.publisher.' + this.props.trackingContext + '.edit_message', 'change_link_thumbnail')
      }
      selectedThumbnailUrl = thumbnailUrls[index].thumbnailUrl
      this.setState({
        thumbnailUrl: selectedThumbnailUrl,
      })
    }
  }

  /**
   * handleRemoveThumbnail does not remove an image from the list, it disables the link images entirely
   */
  handleRemoveThumbnail = () => {
    this.setState({
      thumbnailUrl: null,
    })
  }

  /**
   * Adds back the field for link images
   */
  handleAddThumbnail = () => {
    this.setState({
      thumbnailUrl: this.state.thumbnailUrls.length ? this.state.thumbnailUrls[0].thumbnailUrl : null,
    })
  }

  render() {
    const { title, description, thumbnailUrl, thumbnailUrls } = this.state

    const {
      mainComponentClassName,
      facebookWarningVisible,
      numberOfNetworksNotCustomized,
      socialNetworkNamesForWarning,
      onDismissFacebookWarning,
      facadeApiUrl,
      csrf,
      messageId,
    } = this.props

    const showWarningBanner = facebookWarningVisible && numberOfNetworksNotCustomized > 0

    return (
      <EditPanelWrapper className="-editPanel" key="-editPanel">
        {showWarningBanner && (
          <WarningBanner
            numberOfNetworksNotCustomized={numberOfNetworksNotCustomized}
            socialNetworkNamesForWarning={socialNetworkNamesForWarning}
            onClose={onDismissFacebookWarning}
          />
        )}
        <Heading>{CUSTOMIZE_LINK_PREVIEW}</Heading>
        <ImageSelectionPanel
          facadeApiUrl={facadeApiUrl}
          csrf={csrf}
          messageId={messageId}
          thumbnailUrls={thumbnailUrls}
          selectedThumbnailUrl={thumbnailUrl}
          onAttachmentUploaded={this.handleAttachmentUploaded}
          onSelectImage={this.handleSelectImage}
          onRemoveThumbnail={this.handleRemoveThumbnail}
          onAddThumbnail={this.handleAddThumbnail}
          mainComponentClassName={mainComponentClassName}
        />
        <EditPanelDescription className="-descriptionPanel">
          <EditPanelSubtitle className="-subtitle">
            <EditPanelText className="-text">{LINK_TITLE}</EditPanelText>
          </EditPanelSubtitle>
          <EditPanelInput className="-input">
            <InputText
              onChange={this.handleTitleChange}
              placeholder={TITLE}
              showLabel={false}
              compact={true}
              value={title}
              width="100%"
            />
          </EditPanelInput>
          <EditPanelSubtitle className="-subtitle">
            <EditPanelText className="-text">{LINK_DESCRIPTION}</EditPanelText>
          </EditPanelSubtitle>
          <EditPanelInput className="-input">
            <InputText
              onChange={this.handleDescriptionChange}
              placeholder={DESCRIPTION}
              showLabel={false}
              compact={true}
              value={description}
              width="100%"
            />
          </EditPanelInput>
        </EditPanelDescription>
        <ActionPanel className="-actionPanel">
          <Button onClick={this.handleCancel} type={PRIMARY}>
            {CANCEL}
          </Button>
          <SaveButton onClick={this.handleSave} type={CTA}>
            {SAVE}
          </SaveButton>
        </ActionPanel>
        <div className="clearfix" />
      </EditPanelWrapper>
    )
  }
}

export default EditPanel
