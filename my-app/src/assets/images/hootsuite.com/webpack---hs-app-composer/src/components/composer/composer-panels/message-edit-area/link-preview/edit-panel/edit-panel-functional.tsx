import React, { useState } from 'react'
import debounce from 'lodash/debounce'

import { Button, PRIMARY, CTA } from 'fe-comp-button'
import { InputText } from 'fe-comp-input-text'
import { getMessages, getState as getComposerMessageState } from 'fe-pnc-data-composer-message'
import translation from 'fe-pnc-lib-hs-translation'

import { TrackingContext } from '@/typings/Constants'
import { URLPreview } from '@/typings/Message'
import { track } from '@/utils/tracking'
import ImageSelectionPanel from './../image-selection-panel'
import { getDefaultLinkPreviewFormat } from './../utils'
import { WarningBanner } from './../warning-banner'
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
  numberOfNetworksNotCustomized: number
  socialNetworkNamesForWarning?: Array<string>
  showLinkCustomizationWarning?: boolean

  onDismissFacebookWarning?(...args: Array<unknown>): unknown

  onCancel?(): unknown

  onSave?(...args): unknown

  facadeApiUrl?: string
  csrf?: string
  messageId?: number
  linkPreview: URLPreview
  mainComponentClassName?: string
  trackingContext: TrackingContext
  onLinkCustomizationWarningDismiss?: () => void
}

export const EditPanelFunctional = ({
  facadeApiUrl = undefined,
  csrf = undefined,
  messageId = undefined,
  linkPreview,
  trackingContext = undefined,
  onCancel,
  onSave,
  mainComponentClassName,
  socialNetworkNamesForWarning = [],
  numberOfNetworksNotCustomized = 0,
  showLinkCustomizationWarning = false,
  onLinkCustomizationWarningDismiss,
}: EditPanelProps) => {
  const [title, setTitle] = useState(linkPreview.title)
  const [description, setDescription] = useState(linkPreview.description)
  const [thumbnailUrl, setThumbnailUrl] = useState(linkPreview.thumbnailUrl)
  const [thumbnailUrls, setThumbnailUrls] = useState(linkPreview.thumbnailUrls)

  const trackTitleChange = debounce(() => {
    track('web.publisher.' + trackingContext + '.edit_message', 'edit_link_title')
  }, EDIT_DEBOUNCE_MS)

  const trackDescriptionChange = debounce(() => {
    track('web.publisher.' + trackingContext + '.edit_message', 'edit_link_description')
  }, EDIT_DEBOUNCE_MS)

  const handleCancel = () => {
    onCancel()
  }

  const handleSave = () => {
    onSave({
      ...linkPreview,
      title: title,
      description: description,
      thumbnailUrl: thumbnailUrl,
      thumbnailUrls: thumbnailUrls,
    })
  }

  const handleTitleChange = event => {
    setTitle(event.target.value)
    trackTitleChange()
  }

  const handleDescriptionChange = event => {
    setDescription(event.target.value)
    trackDescriptionChange()
  }

  const handleAttachmentUploaded = response => {
    const messages = getMessages(getComposerMessageState())

    track('web.publisher.' + trackingContext + '.edit_message', 'upload_custom_link_thumbnail')
    if (response && response.thumbnailUrl) {
      const message = messages.find(m => m.id === messageId)
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

        setThumbnailUrls(thumbnailUrls)
        setThumbnailUrl(response.thumbnailUrl)
      }
    }
  }

  const handleSelectImage = index => {
    let selectedThumbnailUrl
    if (thumbnailUrls.length && index >= 0 && index < thumbnailUrls.length) {
      if (thumbnailUrls[index].thumbnailUrl !== thumbnailUrl) {
        track('web.publisher.' + trackingContext + '.edit_message', 'change_link_thumbnail')
      }
      selectedThumbnailUrl = thumbnailUrls[index].thumbnailUrl
      setThumbnailUrl(selectedThumbnailUrl)
    }
  }

  const handleRemoveThumbnail = () => {
    setThumbnailUrl(null)
  }

  const handleAddThumbnail = () => {
    setThumbnailUrl({
      thumbnailUrl: thumbnailUrls.length ? thumbnailUrls[0].thumbnailUrl : null,
    })
  }

  return (
    <EditPanelWrapper className="-editPanel" key="-editPanel">
      {showLinkCustomizationWarning && (
        <WarningBanner
          numberOfNetworksNotCustomized={numberOfNetworksNotCustomized}
          socialNetworkNamesForWarning={socialNetworkNamesForWarning}
          onClose={onLinkCustomizationWarningDismiss}
        />
      )}
      <Heading>{CUSTOMIZE_LINK_PREVIEW}</Heading>
      <ImageSelectionPanel
        facadeApiUrl={facadeApiUrl}
        csrf={csrf}
        messageId={messageId}
        thumbnailUrls={thumbnailUrls}
        selectedThumbnailUrl={thumbnailUrl}
        onAttachmentUploaded={handleAttachmentUploaded}
        onSelectImage={handleSelectImage}
        onRemoveThumbnail={handleRemoveThumbnail}
        onAddThumbnail={handleAddThumbnail}
        mainComponentClassName={mainComponentClassName}
      />
      <EditPanelDescription className="-descriptionPanel">
        <EditPanelSubtitle className="-subtitle">
          <EditPanelText className="-text">{LINK_TITLE}</EditPanelText>
        </EditPanelSubtitle>
        <EditPanelInput data-testid="customizeLinkPreview-titleInput" className="-input">
          <InputText
            onChange={handleTitleChange}
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
            onChange={handleDescriptionChange}
            placeholder={DESCRIPTION}
            showLabel={false}
            compact={true}
            value={description}
            width="100%"
          />
        </EditPanelInput>
      </EditPanelDescription>
      <ActionPanel className="-actionPanel">
        <Button onClick={handleCancel} type={PRIMARY}>
          {CANCEL}
        </Button>
        <SaveButton data-testid="customizeLinkPreview-saveButton" onClick={handleSave} type={CTA}>
          {SAVE}
        </SaveButton>
      </ActionPanel>
      <div className="clearfix" />
    </EditPanelWrapper>
  )
}
