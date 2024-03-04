/**
 * @preventMunge
 */

import React from 'react'

import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import over from 'lodash/over'
import _ from 'underscore'

import axios from 'fe-axios'
import { InputBanner, TYPE_ERROR } from 'fe-comp-input-banner'
import { BouncingBars } from 'fe-comp-loader'
import { logError } from 'fe-lib-logging'
import { getThemeValue, withHsTheme } from 'fe-lib-theme'
import { ValidationBanner } from 'fe-pnc-comp-field-validation-item'
import Thumbnail from 'fe-pnc-comp-thumbnail'
import {
  actions as ComposerMessageActions,
  getSelectedMessageValue,
  store as composerMessageStore,
} from 'fe-pnc-data-composer-message'
import { authoringCancelRequests, verifyUrlEditingPermissions } from 'fe-pnc-lib-api'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'
import { observeStore } from 'fe-pnc-lib-store-observer'

import { CUSTOM_ERRORS, FIELD_TYPES, FIELD_VALIDATIONS } from 'fe-pnc-validation-error-messages'
import Constants from '@/constants/constants'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import { TrackingContext } from '@/typings/Constants'
import { FieldValidations } from '@/typings/Message'
import { SocialNetwork } from '@/typings/SocialNetwork'
import ComposerUtils from '@/utils/composer-utils'
import statusObject, { StatusObject } from '@/utils/status-bar'

import ValidationUtils from '@/utils/validation-utils'
import ClosePreviewButton from './close-preview-button'
import EditPanel from './edit-panel'
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
} from './link-preview.style'
import { getDefaultLinkPreviewFormat } from './utils'

const noop = () => {}

const LINK_PREVIEW_ERROR_TITLE = translation._('This link preview cannot be customized')

const COMPONENT_CLASS_NAME = 'rc-LinkPreviewPanel'

const Loader = withHsTheme(() => <BouncingBars fill={getThemeValue(t => t.colors.darkGrey)} />)

interface LinkPreviewProps {
  csrf: string
  error?: string
  facadeApiUrl: string
  fbPageIds?: Array<unknown>
  hasMedia?: boolean
  linkScrapeInProgress?: boolean
  messageId: number
  messages?: Array<Record<string, unknown>>
  onChange(...args: Array<unknown>): unknown
  onRemove(...args: Array<unknown>): unknown
  onVerifyDomain(...args: Array<unknown>): void
  socialNetworkNamesForWarning?: Array<string>
  socialNetworks: Array<SocialNetwork>
  socialNetworksToDisplay?: Array<SocialNetwork>
  trackingContext: TrackingContext
  unEditedUrlPreview?: Record<string, unknown>
  warning?: string
  fieldValidations?: FieldValidations
}

// eslint-disable-next-line valid-jsdoc
/**
 * Link preview is a subcomponent of the edit component that handles the url preview of a message
 * NOTE: All fields are not updated in the store until save is clicked, so we use the state
 * to cache the fields temporarily.
 */
export default class LinkPreview extends React.PureComponent<LinkPreviewProps> {
  static displayName = 'Link Preview'

  static defaultProps = {
    fbPageIds: [],
    linkScrapeInProgress: false,
    onVerifyDomain: noop,
    socialNetworkNamesForWarning: [],
    socialNetworksToDisplay: [],
    error: null,
    unEditedUrlPreview: {},
    warning: null,
  }

  unsubscribeObservers: Array<() => void>
  _statusObject: StatusObject

  constructor(props) {
    super(props)

    this._statusObject = statusObject // for dependency injection/mocking, since statusObject is actually a unique instance

    this.state = {
      facebookAllowsCustomization: false,
      facebookWarningVisible: true,
      mode: Constants.LINK_PREVIEW_MODES.PREVIEW,
      isRescrapeLoading: false,
      linkPreview: {},
    }

    this.unsubscribeObservers = [noop]
  }

  componentDidMount() {
    this.unsubscribeObservers = [
      observeStore(
        composerMessageStore,
        urlPreview => {
          const prevLinkPreview = this.state.linkPreview
          this.setState({ linkPreview: urlPreview })

          // If social networks or URL have changed, check if we need to verify the URL permissions
          if (this.hasLinkPreviewChanged(prevLinkPreview, urlPreview)) {
            const { fbPageIds } = this.props
            if (Array.isArray(fbPageIds) && fbPageIds.length && urlPreview.url) {
              this.verifyDomain(fbPageIds, urlPreview.url)
            }
          }
        },
        state => getSelectedMessageValue(state, 'urlPreview', false),
        isEqual,
      ),
    ]

    const { linkPreview } = this.state
    if (!_.isEmpty(linkPreview) && linkPreview.originalUrl && !_.isEmpty(this.props.fbPageIds)) {
      this.verifyDomain(this.props.fbPageIds, linkPreview.url)
    }
  }

  componentWillUnmount() {
    authoringCancelRequests()
    over(this.unsubscribeObservers)()
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!_.isEqual(this.props, nextProps)) {
      // If FB page Ids has changed, check if we need to verify the URL permissions
      if (this.hasFbPageIdsChanged(this.props, nextProps)) {
        const url = get(this, 'state.linkPreview.url')
        if (url) {
          this.verifyDomain(nextProps.fbPageIds, url)
        }
      }

      if (_.isEmpty(nextProps.fbPageIds)) {
        this.setState({ facebookAllowsCustomization: false })
      }
    }
  }

  hasFbPageIdsChanged(prevProps, nextProps) {
    const networksChanged = !_.isEqual(prevProps.fbPageIds, nextProps.fbPageIds)
    const isFbIdsEmpty = _.isEmpty(nextProps.fbPageIds)

    if (isFbIdsEmpty) {
      return false
    }

    // Check if networks have changed- no need to verify again if the link is the same and a network has been removed
    if (networksChanged) {
      const diff = _.difference(nextProps.fbPageIds, prevProps.fbPageIds)
      return diff.length > 0
    }

    return networksChanged
  }

  hasLinkPreviewChanged(prevLinkPreview, nextLinkPreview) {
    const linkChanged = !_.isEqual(prevLinkPreview, nextLinkPreview)
    const isLinkPreviewEmpty = _.isEmpty(nextLinkPreview) || !nextLinkPreview.originalUrl

    if (isLinkPreviewEmpty) {
      return false
    }

    return linkChanged
  }

  verifyDomain = (fbPageIds, url) => {
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
          this.setState({ facebookAllowsCustomization })
          this.props.onVerifyDomain(verifiedFbPageIds)
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

  handleCancel = () => {
    const defaultLinkPreview = getDefaultLinkPreviewFormat(this.state.linkPreview)

    this.setState({
      mode: Constants.LINK_PREVIEW_MODES.PREVIEW,
      linkPreview: defaultLinkPreview,
    })
  }

  handleSave = nextLinkPreview => {
    const updatedNextLinkPreview = getDefaultLinkPreviewFormat(nextLinkPreview)
    if (isFeatureEnabled('PUB_31031_UPLOAD_LI_THUMBNAILS')) {
      // Remove thumbnail warning if it's currently shown and new preview has thumbnail url
      if (!isEmpty(updatedNextLinkPreview.thumbnailUrl) || !isEmpty(updatedNextLinkPreview.thumbnailUrls)) {
        const updatedValidation = ValidationUtils.removeErrors(this.props.fieldValidations, [
          CUSTOM_ERRORS.FE_PREVIEW_THUMBNAIL_UNAVAILABLE,
        ])
        ComposerMessageActions.updateFieldById(
          this.props.messageId,
          [Constants.FIELD_TO_UPDATE.FIELD_VALIDATIONS],
          updatedValidation,
        )
      }
    }
    this.props.onChange(this.props.messageId, updatedNextLinkPreview)

    this.setState({
      mode: Constants.LINK_PREVIEW_MODES.PREVIEW,
    })
  }

  handleEditClick = () => {
    this.setState({
      mode: Constants.LINK_PREVIEW_MODES.EDIT,
    })
  }

  canEditPreview = () => {
    return (
      (!_.isEmpty(this.props.fbPageIds) && this.state.facebookAllowsCustomization) ||
      ComposerUtils.hasLinkedInNetwork(...this.props.socialNetworksToDisplay)
    )
  }

  renderLoader() {
    return (
      <ContentPanel className="-contentPanel">
        <LoaderPanel className="-loaderPanel">
          <Loader />
        </LoaderPanel>
      </ContentPanel>
    )
  }

  renderFooter(hasError) {
    return this.state.mode === Constants.LINK_PREVIEW_MODES.PREVIEW && this.canEditPreview() ? (
      <Footer hasError={hasError} onEdit={this.handleEditClick} />
    ) : null
  }

  renderPanel(hasError) {
    let html = null
    switch (this.state.mode) {
      case Constants.LINK_PREVIEW_MODES.PREVIEW:
        html = [this.renderPreviewPanel(hasError)]
        break
      case Constants.LINK_PREVIEW_MODES.EDIT:
        html = [this.renderEditPanel()]
        break
    }
    return <ContentPanel className="-contentPanel">{html}</ContentPanel>
  }

  renderPreviewPanel(hasError) {
    const linkPreview = this.state.linkPreview
    let linkPreviewObj = getDefaultLinkPreviewFormat(linkPreview)
    if (!this.canEditPreview()) {
      linkPreviewObj = getDefaultLinkPreviewFormat(this.props.unEditedUrlPreview)
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
      <PreviewPanel hasError={hasError} className="-previewPanel" key="-previewPanel">
        {thumbnailHtml}
        <PreviewRightPanel className="-rightPanel">
          {titleArea}
          {descriptionArea}
          {linkElement}
        </PreviewRightPanel>
      </PreviewPanel>
    )
  }

  handleDismissFacebookWarning = () => {
    this.setState({ facebookWarningVisible: false })
  }

  renderEditPanel() {
    return (
      <EditPanel
        key={'-editPanel'}
        onCancel={this.handleCancel}
        onSave={this.handleSave}
        linkPreview={this.state.linkPreview}
        socialNetworkNamesForWarning={this.props.socialNetworkNamesForWarning}
        numberOfNetworksNotCustomized={
          this.getNumberOfMessages(this.props) - this.props.numberOfLinkedInAndFBPageNetworks
        }
        onDismissFacebookWarning={this.handleDismissFacebookWarning}
        facebookWarningVisible={this.state.facebookWarningVisible}
        facadeApiUrl={this.props.facadeApiUrl}
        csrf={this.props.csrf}
        trackingContext={this.props.trackingContext}
        messageId={this.props.messageId}
        mainComponentClassName={COMPONENT_CLASS_NAME}
      />
    )
  }

  handleClose = () => {
    if (this.props.linkScrapeInProgress) {
      authoringCancelRequests()
    }
    this.props.onRemove()
  }

  renderCloseButton() {
    return <ClosePreviewButton onClick={this.handleClose} />
  }

  getNumberOfMessages(props) {
    let messagesLength = 0
    if (
      props &&
      props.messages &&
      props.messages[0] &&
      props.messages[0].messages &&
      props.messages[0].messages.length
    ) {
      messagesLength = props.messages[0].messages.length
    }
    return messagesLength
  }

  renderPreviewValidation() {
    // Only shows validation banners for LinkedIn
    if (isFeatureEnabled('PUB_31031_UPLOAD_LI_THUMBNAILS')) {
      return (
        <ValidationBanner
          fieldValidations={this.props.fieldValidations}
          field={FIELD_VALIDATIONS.LINK_PREVIEW}
          type={FIELD_TYPES.LINK_PREVIEW}
          isBulkComposer={false}
          isPageLevel={true}
          errorProps={{
            shouldHideTitle: true,
          }}
        />
      )
    }
  }

  render() {
    const { linkPreview } = this.state
    const { error, hasMedia, linkScrapeInProgress } = this.props
    const hasErrors = typeof error === 'string' && error.length > 0
    if (linkPreview && !hasMedia) {
      return (
        <LinkPreviewPanel className={COMPONENT_CLASS_NAME}>
          {this.state.mode === Constants.LINK_PREVIEW_MODES.PREVIEW ? this.renderCloseButton() : null}
          {this.renderPanel(hasErrors)}
          {this.renderFooter(hasErrors)}
          {hasErrors && (
            <InputBanner messageText={error} titleText={LINK_PREVIEW_ERROR_TITLE} type={TYPE_ERROR} />
          )}
          {this.renderPreviewValidation()}
        </LinkPreviewPanel>
      )
    } else if (linkScrapeInProgress) {
      return (
        <LinkPreviewPanel className={COMPONENT_CLASS_NAME}>
          {this.renderCloseButton()}
          {this.renderLoader()}
        </LinkPreviewPanel>
      )
    }

    return null
  }
}
