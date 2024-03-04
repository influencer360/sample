import React, { useState, useEffect } from 'react'

import { isNull, isEmpty, isString } from 'lodash'
import axios from 'fe-axios'
import { TYPE_WARNING } from 'fe-comp-input-banner'
import { BouncingBars } from 'fe-comp-loader'
import { connect } from 'fe-hoc-connect'
import { logError } from 'fe-lib-logging'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'
import { ValidationBanner } from 'fe-pnc-comp-field-validation-item'
import Thumbnail from 'fe-pnc-comp-thumbnail'
import {
  actions as ComposerMessageActions,
  getSelectedMessage,
  store as composerMessageStore,
} from 'fe-pnc-data-composer-message'
import { authoringCancelRequests, verifyUrlEditingPermissions } from 'fe-pnc-lib-api'
import { isFeatureEnabled, isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'
import { FIELD_TYPES, FIELD_VALIDATIONS } from 'fe-pnc-validation-error-messages'
import Constants from '@/constants/constants'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import Message from '@/models/message'
import { TrackingContext } from '@/typings/Constants'

import { FieldValidations } from '@/typings/Message'
import { URLPreview } from '@/typings/Message'
import LinkUtils from '@/utils/link-utils'
import ValidationUtils from '@/utils/validation-utils'
import ClosePreviewButton from './close-preview-button'
import { EditPanelFunctional as EditPanel } from './edit-panel'
import Footer from './footer'
import {
  ContentPanel,
  LinkPreviewPanel,
  LoaderPanel,
  PreviewDescription,
  PreviewLeftPanel,
  PreviewLink,
  PreviewPanel,
  PreviewRightPanel,
  PreviewTitle,
  GenericBanner,
} from './link-preview.style'
import { getDefaultLinkPreviewFormat } from './utils'

const noop = () => {}

const LINK_PREVIEW_ERROR_TITLE = translation._('This link preview cannot be customized')

const COMPONENT_CLASS_NAME = 'rc-LinkPreviewPanel'

const Loader = withHsTheme(() => <BouncingBars fill={getThemeValue(t => t.colors.darkGrey)} />)

interface LinkPreviewProps {
  csrf: string
  warning?: string | null
  facadeApiUrl: string
  fbPageIds?: Array<number>
  hasMedia?: boolean
  linkScrapeInProgress?: boolean
  messageId: number
  messages?: Message

  onRemove(...args: Array<unknown>): unknown
  onPreviewCustomize?(nextLinkPreview: URLPreview): void
  onVerifyDomain(...args: Array<unknown>): void

  socialNetworksToDisplay?: string[]
  trackingContext: TrackingContext
  fieldValidations?: FieldValidations
  socialNetworkNamesForWarning: string[]
  linkedInAndVerifiedFBPageNetworksLength: number
}

export const LinkPreviewFunctional = ({
  csrf,
  facadeApiUrl,
  fbPageIds,
  hasMedia,
  linkScrapeInProgress = false,
  messageId,
  messages,
  onRemove,
  onVerifyDomain = noop,
  socialNetworksToDisplay = [],
  trackingContext,
  socialNetworkNamesForWarning = [],
  linkedInAndVerifiedFBPageNetworksLength = 0,
  warning = null,
  onPreviewCustomize,
}: LinkPreviewProps) => {
  const [facebookAllowsCustomization, setFacebookAllowsCustomization] = useState(false)
  const [mode, setMode] = useState(Constants.LINK_PREVIEW_MODES.PREVIEW)
  const [showLinkCustomizationWarning, setShowLinkCustomizationWarning] = useState(true)
  const [hasDismissedLinkCustomizationWarning, setDismissedLinkCustomizationWarning] = useState(false)

  const linkPreview = messages?.urlPreview || null
  const numberOfNetworksNotCustomized = messages?.messages?.length - linkedInAndVerifiedFBPageNetworksLength
  const canEditPreview = LinkUtils.canCustomizeLinkPreview(
    messages,
    socialNetworksToDisplay,
    facebookAllowsCustomization,
    fbPageIds,
  )
  const hasGenericWarning = isString(warning) && !isEmpty(warning)

  useEffect(() => {
    setMode(Constants.LINK_PREVIEW_MODES.PREVIEW)

    if (!isNull(messages?.selectedNetworkGroup)) {
      setShowLinkCustomizationWarning(false)
    }
  }, [messages?.selectedNetworkGroup])

  useEffect(() => {
    if (
      !hasDismissedLinkCustomizationWarning &&
      isNull(messages?.selectedNetworkGroup) &&
      numberOfNetworksNotCustomized > 0
    ) {
      setShowLinkCustomizationWarning(true)
    }
  }, [messages?.selectedNetworkGroup, numberOfNetworksNotCustomized, hasDismissedLinkCustomizationWarning])

  const onLinkCustomizationWarningDismiss = () => {
    setDismissedLinkCustomizationWarning(true)
    setShowLinkCustomizationWarning(false)
  }

  const verifyDomain = (fbPageIds, url) => {
    verifyUrlEditingPermissions(fbPageIds, url)
      .then(data => {
        if (data.urlOwnershipPermissions && Array.isArray(data.urlOwnershipPermissions)) {
          const facebookAllowsCustomization = data.urlOwnershipPermissions.some(
            permission => permission.canCustomizeUrl,
          )
          const verifiedFbPageIds = data.urlOwnershipPermissions.reduce((acc, sn) => {
            if (sn.canCustomizeUrl) {
              acc.push(sn.socialProfileId)
            }
            return acc
          }, [])
          setFacebookAllowsCustomization(facebookAllowsCustomization)
          onVerifyDomain(verifiedFbPageIds)
        }
      })
      .catch(e => {
        if (!axios.isCancel(e)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during verify domain', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
      })
  }

  const handleCancel = () => {
    setMode(Constants.LINK_PREVIEW_MODES.PREVIEW)
  }

  const handleSave = (nextLinkPreview: URLPreview) => {
    const updatedNextLinkPreview = getDefaultLinkPreviewFormat(nextLinkPreview)
    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      onPreviewCustomize(updatedNextLinkPreview)
    } else {
      if (isFeatureEnabled('PUB_31031_UPLOAD_LI_THUMBNAILS')) {
        // Remove thumbnail warning if it's currently shown and new preview has thumbnail url
        if (!isEmpty(updatedNextLinkPreview.thumbnailUrl) || !isEmpty(updatedNextLinkPreview.thumbnailUrls)) {
          updatedNextLinkPreview.hasWarning = false
        }
      }

      ComposerMessageActions.updateFieldById(
        messageId,
        [Constants.FIELD_TO_UPDATE.URL_PREVIEW],
        updatedNextLinkPreview,
      )
    }

    setMode(Constants.LINK_PREVIEW_MODES.PREVIEW)
  }

  const handleEditClick = () => {
    setMode(Constants.LINK_PREVIEW_MODES.EDIT)
  }

  const renderLoader = () => {
    return (
      <ContentPanel className="-contentPanel">
        <LoaderPanel className="-loaderPanel">
          <Loader />
        </LoaderPanel>
      </ContentPanel>
    )
  }

  const renderFooter = () => {
    return mode === Constants.LINK_PREVIEW_MODES.PREVIEW && canEditPreview && !hasGenericWarning ? (
      <Footer hasError={false} onEdit={handleEditClick} />
    ) : null
  }

  const renderPreviewPanel = () => {
    const linkPreviewObj = getDefaultLinkPreviewFormat(linkPreview)

    if (linkPreviewObj.hasError) {
      return null
    }

    let thumbnailHtml = null
    if (linkPreviewObj.thumbnailUrl) {
      thumbnailHtml = (
        <PreviewLeftPanel className="-leftPanel">
          <Thumbnail url={linkPreviewObj.thumbnailUrl} size="100px" />
        </PreviewLeftPanel>
      )
    }

    let linkElement = null
    if (linkPreviewObj.originalUrl) {
      linkElement = <PreviewLink className="-link">{linkPreviewObj.originalUrl}</PreviewLink>
    }

    const titleArea = linkPreviewObj.title ? (
      <PreviewTitle className="-title">{linkPreviewObj.title}</PreviewTitle>
    ) : null
    const descriptionArea = linkPreviewObj.description ? (
      <PreviewDescription className="-description">{linkPreviewObj.description}</PreviewDescription>
    ) : null

    return (
      <PreviewPanel hasError={false} className="-previewPanel" key="-previewPanel">
        {thumbnailHtml}
        <PreviewRightPanel className="-rightPanel">
          {titleArea}
          {descriptionArea}
          {linkElement}
        </PreviewRightPanel>
      </PreviewPanel>
    )
  }

  const renderEditPanel = () => {
    return (
      <EditPanel
        key={'-editPanel'}
        onCancel={handleCancel}
        onSave={handleSave}
        linkPreview={linkPreview}
        facadeApiUrl={facadeApiUrl}
        csrf={csrf}
        trackingContext={trackingContext}
        messageId={messageId}
        mainComponentClassName={COMPONENT_CLASS_NAME}
        socialNetworkNamesForWarning={socialNetworkNamesForWarning}
        numberOfNetworksNotCustomized={numberOfNetworksNotCustomized}
        showLinkCustomizationWarning={showLinkCustomizationWarning}
        onLinkCustomizationWarningDismiss={onLinkCustomizationWarningDismiss}
      />
    )
  }
  const renderPanel = () => {
    let html = null
    switch (mode) {
      case Constants.LINK_PREVIEW_MODES.PREVIEW:
        html = [renderPreviewPanel()]
        break
      case Constants.LINK_PREVIEW_MODES.EDIT:
        html = [renderEditPanel()]
        break
    }
    return <ContentPanel className="-contentPanel">{html}</ContentPanel>
  }

  const handleClose = () => {
    if (linkScrapeInProgress) {
      authoringCancelRequests()
    }
    onRemove()
  }

  const renderCloseButton = () => {
    return <ClosePreviewButton onClick={handleClose} />
  }

  const renderPreviewValidation = (hasError: boolean, hasWarning: boolean) => {
    if ((!canEditPreview && hasWarning) || (!hasWarning && !hasError)) {
      return null
    }

    const fieldValidations = {
      ...(hasError && {
        errors: {
          [FIELD_VALIDATIONS.LINK_PREVIEW]: [ValidationUtils.getInvalidLinkPreviewError()],
        },
      }),
      ...(hasWarning && {
        warnings: {
          [FIELD_VALIDATIONS.LINK_PREVIEW]: [ValidationUtils.getThumbnailPreviewUnavailableWarning()],
        },
      }),
    }

    return (
      <ValidationBanner
        field={FIELD_VALIDATIONS.LINK_PREVIEW}
        fieldValidations={fieldValidations}
        type={FIELD_TYPES.LINK_PREVIEW}
        isBulkComposer={false}
        isPageLevel={true}
        errorProps={{
          ...(hasWarning && { shouldHideTitle: true }),
        }}
      />
    )
  }

  const renderGenericPreviewError = () => {
    if (!hasGenericWarning) return null

    return (
      canEditPreview && (
        <GenericBanner
          messageText={warning}
          titleText={LINK_PREVIEW_ERROR_TITLE}
          type={TYPE_WARNING}
          className={'previewCustomizationWarning'}
        />
      )
    )
  }

  useEffect(() => {
    const isFbIdsEmpty = isEmpty(fbPageIds)

    if (isFbIdsEmpty) {
      setFacebookAllowsCustomization(false)
      return null
    }

    const url = linkPreview?.url
    if (url) {
      verifyDomain(fbPageIds, url)
    }
  }, [fbPageIds, linkPreview?.url])

  useEffect(() => {
    if (!isEmpty(linkPreview) && linkPreview.originalUrl && !isEmpty(fbPageIds)) {
      verifyDomain(fbPageIds, linkPreview.url)
    }

    return () => {
      authoringCancelRequests()
    }
  }, [])

  const { hasError = false, hasWarning = false, ...previewProps } = linkPreview || {}
  const showPreviewArea = !linkScrapeInProgress && !isEmpty(previewProps) && !hasMedia && !hasError

  if (showPreviewArea) {
    return (
      <LinkPreviewPanel className={COMPONENT_CLASS_NAME}>
        {mode === Constants.LINK_PREVIEW_MODES.PREVIEW ? renderCloseButton() : null}
        {renderPanel()}
        {renderFooter()}
        {renderGenericPreviewError()}
        {renderPreviewValidation(hasError, hasWarning)}
      </LinkPreviewPanel>
    )
  } else if (linkScrapeInProgress) {
    return (
      <LinkPreviewPanel className={COMPONENT_CLASS_NAME}>
        {renderCloseButton()}
        {renderLoader()}
      </LinkPreviewPanel>
    )
  } else if (hasError) {
    return renderPreviewValidation(hasError, hasWarning)
  }

  return null
}

export const ConnectedLinkPreviewFunctional = connect(composerMessageStore, state => ({
  messages: getSelectedMessage(state),
}))(LinkPreviewFunctional)
