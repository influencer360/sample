import React from 'react'
import loadable from '@loadable/component'

import Immutable from 'immutable'
import { findIndex, isEqual, isNull, over } from 'lodash'
import { connect as reduxConnect } from 'react-redux'
import ReactTimeout from 'react-timeout'
import _ from 'underscore'

import { Banner, TYPE_ERROR } from 'fe-comp-banner'
import { A } from 'fe-comp-dom-elements'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { logError } from 'fe-lib-logging'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'
import {
  actions as ComposerMessageActions,
  getSelectedMessageValue,
  getState as getComposerMessageState,
  store as composerMessageStore,
} from 'fe-pnc-data-composer-message'
import { actions as albumActions, store as albumStore } from 'fe-pnc-data-facebook-albums'
import { isFeatureEnabledOrBeta, isFeatureDisabledAndNotBeta } from 'fe-pnc-lib-darklaunch'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'
import { observeStore } from 'fe-pnc-lib-store-observer'

import LinkCustomizationNotAvailableInfoBanner from '@/components/composer/composer-panels/message-edit-area/link-preview/info-banners/customization-not-available'
import { ConnectedLinkPreviewFunctional } from '@/components/composer/composer-panels/message-edit-area/link-preview/link-preview-functional'
import ComposerConstants from '@/constants/composer'
import Constants from '@/constants/constants'
import FacebookAlbumPickerConstants from '@/constants/facebook-album-picker'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import Message from '@/models/message'
import { RootState } from '@/redux/store'
import type { TrackingContext, UploadingFile } from '@/typings/Constants'
import type { ErrorType, URLPreview } from '@/typings/Message'
import AbortionError from '@/utils/abortion-error'

import ComposerUtils from '@/utils/composer-utils'
import statusObject, { StatusObject } from '@/utils/status-bar'
import MediaAttachmentArea from '../media-attachment-area/media-attachment-area'
import { LinkScrapeWarning, MediaPickerContainer } from './media-picker.style'

// Lazy loaded components
const FacebookAlbumPicker = loadable(
  () =>
    import(/* webpackChunkName: "FacebookAlbumPicker" */ '../facebook-album-picker/facebook-album-picker'),
)
FacebookAlbumPicker.displayName = 'FacebookAlbumPicker' // The displayName is needed for finding the component in the unit tests
const LinkPreview = loadable(() => import(/* webpackChunkName: "LinkPreview" */ '../link-preview'))

const noop = () => {}
const { SN_TYPES, SN_GROUP_TO_SN_TYPES, SN_GROUP, NON_LINK_PREVIEW_NETWORKS } = SocialProfileConstants

// prettier-ignore
const UNABLE_TO_FETCH_ALBUMS = translation._('We were unable to fetch albums for all of the selected accounts.')
const UNABLE_TO_RETRIEVE_ALBUMS = translation._('Unable to retrieve albums')
// prettier-ignore
const POPULATE_LINK_PREVIEW_ERROR = translation._("We couldn't populate a link preview")
// prettier-ignore
const POPULATE_LINK_PREVIEW_ERROR_MESSAGE = translation._('Maybe try another URL, add custom media below, or view ')
const VIEW_ADVANCED_TROUBLESHOOTING = translation._('advanced troubleshooting steps')
const MEDIA = translation._('Media')
// prettier-ignore
const FB_ALBUMS_INFO_MESSAGE = translation._('When posting to more than one Facebook Page and/or Group at the same time, album selection is not available and your images will be posted to the timeline.')

interface MediaPickerProps {
  albums: Array<{
    name: string
    type: string
  }>
  attachments?: Array<unknown>
  canUploadMixedMedia?: boolean
  csrf: string
  facadeApiUrl: string
  facebookSocialNetworkIds?: Array<unknown>
  fieldValidations?: Record<string, unknown>
  getAttachmentType?(...args: Array<unknown>): unknown
  getFirstErrorMessageForField?(...args: Array<unknown>): unknown
  getFirstWarningMessageForField?(...args: Array<unknown>): unknown
  getSocialNetworkIds?(...args: Array<unknown>): unknown
  getSocialNetworkTypes?(...args: Array<unknown>): unknown
  getSocialProfileUsernameById?(...args: Array<unknown>): unknown
  getSocialProfileUsernamesByIds?(...args: Array<unknown>): unknown
  hasAttachments?(...args: Array<unknown>): unknown
  hasAlbumTargetingWarning?: boolean
  hasThumbnailUrls?(...args: Array<unknown>): unknown
  hasVideoAttachment?(...args: Array<unknown>): unknown
  isBulkComposer?: boolean
  isEditMode?: boolean
  isEditOnly?: boolean
  hideAltText?: boolean
  isLoadingAlbums?: boolean
  isSocialProfileTypeSelected?(...types: Array<string>): boolean
  isTranscodingEnabled?: boolean
  linkScrapeInProgress?: boolean
  linkScrapeInvalid?: boolean
  linkSettings?: Array<Record<string, unknown>>
  messages?: Array<Message>
  messageId?: string | number
  onAddAttachment(...args: Array<unknown>): unknown
  onAttachmentEdited(...args: Array<unknown>): unknown
  onLinkPreviewChange(...args: Array<unknown>): unknown // Remove with PUB_30706_LINK_SETTINGS_PNE
  onLinkScrapeCancel?(...args: Array<unknown>): unknown
  onUploadQueueComplete?(...args: Array<unknown>): unknown
  onToggleMediaLibrary?(...args: Array<unknown>): unknown
  socialNetworks: Array<unknown>
  socialNetworksKeyedById?: Record<string, unknown>
  supportsLinkPreview?(...args: Array<unknown>): unknown
  text?: string
  trackingContext: TrackingContext
  unEditedUrlPreview?: Record<string, unknown>
  uploadingFiles?: Array<UploadingFile>
  validationError?(...args: Array<unknown>): unknown
  verifiedFbPageIds?: Array<unknown>
  selectedNetworkGroup?: SocialNetworkGroup | null
  onTrackMediaUploadError?(error: ErrorType): void
  customContext?: string
  showOnboarding: boolean
  isCanvaAccessAllowed?: boolean
  isPdfUploadAllowed: boolean
  onPreviewCustomize?(nextLinkPreview: URLPreview): void
}

class MediaPicker extends React.PureComponent<MediaPickerProps> {
  readonly composerMessageActions: typeof ComposerMessageActions
  static displayName = 'MediaPicker'

  static defaultProps = {
    albums: [],
    canUploadMixedMedia: false,
    hasAlbumTargetingWarning: false,
    isEditMode: false,
    isEditOnly: false,
    isLoadingAlbums: false,
    isTranscodingEnabled: false,
    hideAltText: false,
    linkScrapeInProgress: false,
    linkScrapeInvalid: false,
    linkSettings: [],
    onLinkScrapeCancel: noop,
    onUploadQueueComplete: noop,
    text: MEDIA,
    showOnSubmitErrors: false,
    selectedNetworkGroup: null,
    uploadingFiles: [],
    validationError: noop,
    showOnboarding: true,
    isCanvaAccessAllowed: false,
    isPdfUploadAllowed: false,
  }

  unsubscribeObservers: Array<() => void>
  statusObject: StatusObject

  constructor(props) {
    super(props)

    this.composerMessageActions = ComposerMessageActions

    // We want to make sure we're always using the same instance. This is important for dependency injection
    this.statusObject = statusObject

    this.state = {
      albumWarnings: null,
      albumInfos: null,
      unauthedProfiles: [],
      facebookNetworkIds: [],
      facebookPageIds: [],
      socialNetworksToDisplay: [],
      messages: [],
      albumName: getSelectedMessageValue(getComposerMessageState(), 'baseMessage.albumName'),
      socialNetworksKeyedById: Immutable.OrderedMap({}),
      selectedNetworkGroupOnMediaUpload: this.props.selectedNetworkGroup,
      ...(isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') && {
        urlPreview: getSelectedMessageValue(getComposerMessageState(), 'baseMessage.urlPreview'),
      }),
    }

    this.unsubscribeObservers = [noop]
  }

  componentDidMount() {
    this.unsubscribeObservers = [
      observeStore(
        composerMessageStore,
        (urlPreview: URLPreview) => this.setState({ urlPreview }),
        state => getSelectedMessageValue(state, 'urlPreview'),
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        albumName => this.setState({ albumName }),
        state => getSelectedMessageValue(state, 'baseMessage.albumName'),
      ),
      observeStore(
        composerMessageStore,
        socialNetworksKeyedById => {
          if (socialNetworksKeyedById) {
            let socialNetworkTypes
            if (Immutable.Map.isMap(socialNetworksKeyedById)) {
              const allSocialNetworkTypes = []
              socialNetworksKeyedById.map(socialNetwork => allSocialNetworkTypes.push(socialNetwork.type))
              socialNetworkTypes = _.unique(allSocialNetworkTypes)
            } else {
              socialNetworkTypes = _.unique(_.pluck(socialNetworksKeyedById, 'type'))
            }
            const validSocialNetworkTypes = socialNetworkTypes.filter(
              value => !_.contains(NON_LINK_PREVIEW_NETWORKS, value),
            )
            const fbPageIds = socialNetworksKeyedById.reduce((acc, sn) => {
              if (sn.type === SN_TYPES.FACEBOOKPAGE) {
                acc.push(sn.socialNetworkId)
              }
              return acc
            }, [])
            let socialNetworksToDisplayToSet = this.state.socialNetworksToDisplay
            let fbPageIdsToSet = this.state.facebookPageIds
            if (!_.isEqual(this.state.socialNetworksToDisplay, validSocialNetworkTypes)) {
              socialNetworksToDisplayToSet = validSocialNetworkTypes
            }
            if (!_.isEqual(fbPageIds, this.state.facebookPageIds)) {
              fbPageIdsToSet = fbPageIds
            }
            this.setState({
              socialNetworksKeyedById,
              socialNetworksToDisplay: socialNetworksToDisplayToSet,
              facebookPageIds: fbPageIdsToSet,
            })
          }
        },
        state => getSelectedMessageValue(state, 'socialNetworksKeyedById'),
        isEqual,
      ),
    ]
  }

  componentWillUnmount() {
    over(this.unsubscribeObservers)()
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.fetchFacebookAlbums(nextProps)

    if (
      Array.isArray(this.props.messages) &&
      Array.isArray(nextProps.messages) &&
      !_.isEqual(nextProps.messages, this.props.messages)
    ) {
      this.setState({
        messages: nextProps.messages,
      })
    }
  }

  /**
   * Returns true if the current state allows albums
   * @param {object} nextProps the incoming props if called from componentWillReceiveProps, or the current props if called elsewhere
   * @returns {boolean}
   */
  canHaveAlbums(nextProps = undefined) {
    // If there's no message, or it's bulk composer, or we're already fetching albums, albums aren't allowed
    if (!nextProps || nextProps.isLoadingAlbums || nextProps.isBulkComposer) {
      return false
    }

    // If it has a video, albums aren't allowed
    if (nextProps.hasVideoAttachment()) {
      return false
    }

    // If there are no fb networks at all, we don't need albums
    const nextFacebookNetworkIds = this.getNetworkIdsByType(SN_GROUP_TO_SN_TYPES[SN_GROUP.FACEBOOK])
    if (nextFacebookNetworkIds.length === 0) {
      return false
    }

    return true
  }

  // compares two arrays. Used for getNetworkIdsBy type for facebook because it returns a different array each call
  areArrayValuesEqual = (arr1, arr2) => {
    if (typeof arr1 !== typeof arr2) {
      return false
    }
    if (arr1.length !== arr2.length) {
      return false
    }
    return arr1.every(val => arr2.includes(val))
  }

  getNetworkIdsByType(networkTypes) {
    const { socialNetworksKeyedById } = this.state
    const containsNetworkType = type => _.contains(networkTypes, type, 0)
    if (Immutable.Map.isMap(socialNetworksKeyedById)) {
      return _.pluck(
        _.filter(socialNetworksKeyedById.toJS(), network => {
          return containsNetworkType(network.type)
        }),
        'socialNetworkId',
      )
    } else {
      return _.pluck(
        _.filter(socialNetworksKeyedById, function (network) {
          return containsNetworkType(network.type)
        }),
        'socialNetworkId',
      )
    }
  }

  /**
   * Returns true if the current album state needs to be refreshed.
   * @param {object} nextProps the incoming props from componentWillReceiveProps. Should never be called anywhere else
   * @returns {boolean}
   */
  shouldUpdateAlbums(nextProps = undefined) {
    const { attachments } = this.props
    const { albumName } = this.state

    // Don't fetch albums if they're not even allowed
    if (!this.canHaveAlbums(nextProps)) {
      return false
    }

    // Don't fetch albums if they're already being fetched
    if (this.props.isLoadingAlbums) {
      return false
    }

    // If any social networks have changes, fetch albums. But if there are no fb  networks at all, we don't need albums
    const currentFacebookNetworkIds = this.getNetworkIdsByType(SN_GROUP_TO_SN_TYPES[SN_GROUP.FACEBOOK])

    if (!this.areArrayValuesEqual(this.state.facebookNetworkIds, currentFacebookNetworkIds)) {
      this.setState({ facebookNetworkIds: currentFacebookNetworkIds })
      return true
    }

    // If any attachments on the baseMessage changed, fetch albums
    const attachmentsUrls = _.sortBy(
      attachments.map(a => a.url),
      'url',
    )
    const nextAttachmentUrls = _.sortBy(
      nextProps.attachments.map(a => a.url),
      'url',
    )
    const hasSameAttachmentsUrls = _.isEqual(attachmentsUrls, nextAttachmentUrls)
    if (!hasSameAttachmentsUrls && nextAttachmentUrls.length > 0) {
      return true
    }

    const hasFacebookNetworkIds = !_.isEmpty(this.state.facebookNetworkIds)
    const hasAttachments = !_.isEmpty(attachments)
    const albumsNotFetchedYet =
      hasAttachments &&
      hasFacebookNetworkIds &&
      (this.props.albums === null || (Array.isArray(this.props.albums) && this.props.albums.length === 0)) &&
      (nextProps.albums === null || (Array.isArray(nextProps.albums) && nextProps.albums.length === 0))

    return this.props.isEditMode && albumsNotFetchedYet && albumName && albumName.length > 0
  }

  fetchFacebookAlbums = nextProps => {
    const { messageId, getSocialProfileUsernameById } = this.props
    const { albumName } = this.state
    // TODO: This should be moved to fe-pnc-data-facebook-albums, and refactored

    if (!this.shouldUpdateAlbums(nextProps)) {
      if (!this.canHaveAlbums(nextProps) && nextProps.albums.length > 0) {
        albumActions.clearAlbums()

        // Match this.state.facebookNetworkIds to facebookPageIds
        if (isFeatureEnabledOrBeta('PUB_27624_ALBUM_PICKER_VANISHING_FIX')) {
          this.setState({ facebookNetworkIds: this.state.facebookPageIds })
        }
      }
      return
    }

    const facebookProfileIds = this.getNetworkIdsByType(SN_GROUP_TO_SN_TYPES[SN_GROUP.FACEBOOK])

    const albumInfos = facebookProfileIds.length > 1 ? FB_ALBUMS_INFO_MESSAGE : null
    this.setState({ albumWarnings: null, albumInfos, unauthedProfiles: [] })

    const fetchPromise = albumActions.fetchAlbums(facebookProfileIds, true)
    fetchPromise
      .then(data => {
        //Check for unauthorized profiles
        if (_.has(data, 'errors')) {
          const unauthedFbProfiles = _.map(
            _.filter(data.errors, error => {
              return error.codes.includes(4017)
            }),
            unauthedProfile => {
              return {
                profileId: unauthedProfile.socialProfileId,
                username: getSocialProfileUsernameById(unauthedProfile.socialProfileId),
              }
            },
          )
          this.setState({ unauthedProfiles: unauthedFbProfiles })
        }
        //Check if we have empty albums response, or some albums
        if (
          (_.isArray(data.data) && _.isEmpty(data.data)) ||
          _.some(data.data, album => {
            return (
              album.name && typeof album.name === 'string' && album.type && typeof album.type === 'string'
            )
          })
        ) {
          const albums = data.data
          //Are there partial errors?
          if (_.has(data, 'errors')) {
            //If so, set warning
            this.setState({
              // prettier-ignore
              albumWarnings: translation._('We were unable to fetch albums for some of the selected accounts.'),
            })
          }
          // Currently there is a Meta bug where posting to timeline photos within 24 hours gives us the same postID
          // which causes issues with analytics etc down the line. This is a temporary fix to post to the wall/timeline
          // See https://hootsuite.atlassian.net/browse/SBE-4796 for details
          if (isFeatureEnabledOrBeta('PUB_28288_REMOVE_FB_ALBUM_PICKER')) {
            albumActions.clearAlbums()
            this.composerMessageActions.updateFieldById(messageId, Constants.FIELD_TO_UPDATE.ALBUM_NAME, null)
            this.composerMessageActions.updateFieldById(messageId, Constants.FIELD_TO_UPDATE.ALBUM_TYPE, null)
          }
          // Currently the call to FB albums returns a list of albums that does not distinguish
          // between which albums belong to which profiles. To avoid confusion, if > 1 FB profiles
          // are selected we disable the album picker, clear the albums and publish to the wall/timeline
          // of the selected profiles
          else if (_.isEmpty(albums) || this.state.facebookNetworkIds.length > 1) {
            albumActions.clearAlbums()
            this.composerMessageActions.updateFieldById(messageId, Constants.FIELD_TO_UPDATE.ALBUM_NAME, null)
            this.composerMessageActions.updateFieldById(messageId, Constants.FIELD_TO_UPDATE.ALBUM_TYPE, null)
          } else {
            const indexTimelinePhotos = findIndex(
              albums,
              album => album.type === FacebookAlbumPickerConstants.ALBUM_TYPES.WALL,
            )
            if (indexTimelinePhotos > -1) {
              const timelinePhotos = albums[indexTimelinePhotos]
              albums.splice(indexTimelinePhotos, 1)
              albums.splice(0, 0, timelinePhotos)
            }

            if (isFeatureEnabled('PUB_28990_DESELECT_ALBUM')) {
              // Add No album selected option
              albums.unshift({
                name: FacebookAlbumPickerConstants.STATIC_ALBUM_OPTIONS.FACEBOOK_NO_SELECTION,
              })
            }

            albumActions.setAlbums(albums)

            const maybeSelectedAlbumIndex = findIndex(albums, album => album.name === albumName)

            if (maybeSelectedAlbumIndex <= -1) {
              const isNetworkTypeFBGroup = this.getNetworkIdsByType([SN_TYPES.FACEBOOKGROUP]).length > 0
              const defaultAlbumName = isNetworkTypeFBGroup ? null : _.first(albums).name
              const defaultAlbumType = isNetworkTypeFBGroup ? null : _.first(albums).type
              this.composerMessageActions.updateFieldById(
                messageId,
                Constants.FIELD_TO_UPDATE.ALBUM_NAME,
                defaultAlbumName,
              )
              this.composerMessageActions.updateFieldById(
                messageId,
                Constants.FIELD_TO_UPDATE.ALBUM_TYPE,
                defaultAlbumType,
              )
            }
          }
        } else if (data.errors.length > 0) {
          if (facebookProfileIds.length === data.errors.length) {
            albumActions.clearAlbums()
            this.composerMessageActions.updateFieldById(messageId, Constants.FIELD_TO_UPDATE.ALBUM_NAME, null)
            this.composerMessageActions.updateFieldById(messageId, Constants.FIELD_TO_UPDATE.ALBUM_TYPE, null)
          }
          if (_.isEmpty(this.state.unauthedProfiles)) {
            this.statusObject.update(UNABLE_TO_FETCH_ALBUMS, 'error', true)
          }
        }
      })
      .catch(error => {
        if (!AbortionError.isAbortionError(error)) {
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed get facebook albums', {
            errorMessage: JSON.stringify(error.message),
            stack: JSON.stringify(error.stack),
          })
          this.statusObject.update(UNABLE_TO_RETRIEVE_ALBUMS, 'error', true)
        }
      })
  }

  onRemoveLinkPreview = () => {
    const { messageId, linkSettings } = this.props
    this.composerMessageActions.updateFieldsById(messageId, {
      unEditedUrlPreview: null,
      urlPreview: null,
    })
    if (isFeatureDisabledAndNotBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      // does not have a url
      if (!linkSettings) {
        this.composerMessageActions.updateFieldById(
          messageId,
          Constants.FIELD_TO_UPDATE.UN_EDITED_URL_PREVIEW,
          null,
        )
      }
    }

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      this.props.onLinkScrapeCancel(this.state.urlPreview)
    } else {
      if (this.props.linkScrapeInProgress) {
        this.props.onLinkScrapeCancel()
      }
    }
  }

  onVerifyDomain = fbPageIds => {
    const { messageId } = this.props
    this.composerMessageActions.updateFieldById(
      messageId,
      Constants.FIELD_TO_UPDATE.VERIFIED_FB_PAGE_IDS,
      fbPageIds,
    )
  }

  onSelectAlbum = (label, type) => {
    const { messageId } = this.props
    this.composerMessageActions.updateFieldById(messageId, Constants.FIELD_TO_UPDATE.ALBUM_NAME, label)
    this.composerMessageActions.updateFieldById(messageId, Constants.FIELD_TO_UPDATE.ALBUM_TYPE, type)
  }

  selectAlbumName = (albumNameFromMessage, shouldShowFBGroupDefaultAlbum) => {
    if (!albumNameFromMessage) {
      let albumName
      if (shouldShowFBGroupDefaultAlbum) {
        albumName = FacebookAlbumPickerConstants.STATIC_ALBUM_OPTIONS.FACEBOOK_ALBUM_GROUP_FEED
      } else if (this.state.facebookNetworkIds.length > 1) {
        albumName = FacebookAlbumPickerConstants.STATIC_ALBUM_OPTIONS.FACEBOOK_ALBUM_DEFAULT
      }
      return albumName
    }
    return albumNameFromMessage
  }

  onReauthSuccess = () => {
    this.fetchFacebookAlbums(this.props)
  }

  renderFacebookAlbumPicker() {
    const { hasAttachments, hasVideoAttachment, getFirstErrorMessageForField, selectedNetworkGroup } =
      this.props
    const { albumName } = this.state

    const shouldShowFBGroupDefaultAlbum = this.getNetworkIdsByType([SN_TYPES.FACEBOOKGROUP]).length > 0

    const shouldShowFacebookAlbumPicker =
      hasAttachments() && !hasVideoAttachment() && selectedNetworkGroup === SN_GROUP.FACEBOOK

    let canSelectFacebookAlbum = this.state.facebookNetworkIds.length === 1

    if (isFeatureEnabledOrBeta('PUB_28288_REMOVE_FB_ALBUM_PICKER')) {
      canSelectFacebookAlbum = false
    }

    if (shouldShowFacebookAlbumPicker) {
      const isLoading = this.props.isLoadingAlbums
      return (
        <FacebookAlbumPicker
          albums={this.props.albums}
          error={getFirstErrorMessageForField('albumName')}
          warning={this.state.albumWarnings}
          info={this.state.albumInfos}
          facebookIds={this.state.facebookNetworkIds}
          isLoading={isLoading}
          onReauthSuccess={this.onReauthSuccess}
          onSelectAlbum={this.onSelectAlbum}
          selectedAlbumName={this.selectAlbumName(albumName, shouldShowFBGroupDefaultAlbum)}
          unauthedProfiles={this.state.unauthedProfiles}
          hasAlbumTargetingWarning={this.props.hasAlbumTargetingWarning}
          shouldShowFBGroupDefaultAlbum={shouldShowFBGroupDefaultAlbum}
          canSelectAlbum={canSelectFacebookAlbum}
        />
      )
    } else {
      return null
    }
  }

  // Remove with PUB_30706_LINK_SETTINGS_PNE
  renderLinkScrapeWarning() {
    if (!this.props.supportsLinkPreview() || !this.props.linkScrapeInvalid) {
      return null
    }

    const text = (
      <span>
        {POPULATE_LINK_PREVIEW_ERROR_MESSAGE}
        <A
          href="https://help.hootsuite.com/hc/en-us/articles/204586030-Shrink-links-and-customize-link-previews#2"
          rel="noopener noreferrer"
          target="_blank"
        >
          {VIEW_ADVANCED_TROUBLESHOOTING}
        </A>
        .
      </span>
    )

    return (
      <LinkScrapeWarning>
        <Banner messageText={text} titleText={POPULATE_LINK_PREVIEW_ERROR} type={TYPE_ERROR} />
      </LinkScrapeWarning>
    )
  }

  renderLinkPreview() {
    const {
      verifiedFbPageIds,
      messageId,
      getFirstWarningMessageForField,
      getSocialNetworkIds,
      getSocialProfileUsernamesByIds,
      supportsLinkPreview,
      selectedNetworkGroup,
      hasAttachments,
      getFirstErrorMessageForField,
    } = this.props
    const { urlPreview, facebookPageIds, socialNetworksToDisplay } = this.state

    if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
      if (!supportsLinkPreview()) {
        if (urlPreview) {
          return <LinkCustomizationNotAvailableInfoBanner selectedNetworkGroup={selectedNetworkGroup} />
        }

        return null
      }
    } else {
      if (!supportsLinkPreview()) {
        return null
      }
    }
    const CUSTOMIZABLE_LINKEDIN_TYPES = [SN_TYPES.LINKEDIN, SN_TYPES.LINKEDINGROUP, SN_TYPES.LINKEDINCOMPANY]
    const verifiedFBIds = verifiedFbPageIds ? verifiedFbPageIds : []

    const linkedInAndVerifiedFBPageNetworks = verifiedFBIds.concat(
      this.getNetworkIdsByType(CUSTOMIZABLE_LINKEDIN_TYPES),
    )

    let profileNames = []
    if (linkedInAndVerifiedFBPageNetworks.length > 0) {
      profileNames = getSocialProfileUsernamesByIds(
        _.difference(getSocialNetworkIds(), linkedInAndVerifiedFBPageNetworks),
      )
    }
    const shouldShowLinkedInValidation =
      (isFeatureEnabled('PUB_31031_UPLOAD_LI_THUMBNAILS') &&
        selectedNetworkGroup === SocialProfileConstants.SN_GROUP.LINKEDIN) ||
      (isNull(selectedNetworkGroup) && ComposerUtils.hasLinkedInNetwork(...socialNetworksToDisplay))

    return isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE') ? (
      <ConnectedLinkPreviewFunctional
        csrf={this.props.csrf}
        warning={getFirstWarningMessageForField('urlPreview')}
        facadeApiUrl={this.props.facadeApiUrl}
        fbPageIds={facebookPageIds}
        hasMedia={hasAttachments()}
        linkScrapeInProgress={this.props.linkScrapeInProgress}
        messageId={messageId}
        onChange={this.props.onLinkPreviewChange} // Remove with PUB_30706_LINK_SETTINGS_PNE
        onRemove={this.onRemoveLinkPreview}
        onVerifyDomain={this.onVerifyDomain}
        socialNetworksToDisplay={socialNetworksToDisplay}
        trackingContext={this.props.trackingContext}
        fieldValidations={shouldShowLinkedInValidation && this.props.fieldValidations}
        socialNetworkNamesForWarning={profileNames}
        linkedInAndVerifiedFBPageNetworksLength={linkedInAndVerifiedFBPageNetworks.length}
        onPreviewCustomize={this.props.onPreviewCustomize}
      />
    ) : (
      <LinkPreview
        csrf={this.props.csrf}
        error={getFirstErrorMessageForField('urlPreview')}
        facadeApiUrl={this.props.facadeApiUrl}
        fbPageIds={facebookPageIds}
        hasMedia={hasAttachments()}
        linkScrapeInProgress={this.props.linkScrapeInProgress}
        messageId={messageId}
        messages={this.state.messages}
        numberOfLinkedInAndFBPageNetworks={linkedInAndVerifiedFBPageNetworks.length}
        onChange={this.props.onLinkPreviewChange}
        onRemove={this.onRemoveLinkPreview}
        onVerifyDomain={this.onVerifyDomain}
        socialNetworks={this.props.socialNetworks}
        socialNetworksToDisplay={socialNetworksToDisplay}
        socialNetworkNamesForWarning={profileNames}
        trackingContext={this.props.trackingContext}
        unEditedUrlPreview={urlPreview}
        warning={getFirstWarningMessageForField('urlPreview')}
        fieldValidations={shouldShowLinkedInValidation && this.props.fieldValidations}
      />
    )
  }

  /**
   * Determines if the user can upload mixed media (video + images) for the currently selected network(s)
   */
  canUploadMixedMedia = (): boolean => {
    const { selectedNetworkGroup } = this.props

    // Return true for Instagram, Threads or Initial Content / no networks
    if (
      !selectedNetworkGroup ||
      selectedNetworkGroup === SN_GROUP.INSTAGRAM ||
      selectedNetworkGroup === SN_GROUP.THREADS
    ) {
      return true
    }
    // Return false if a non-Instagram network is selected
    return false
  }

  localOnAddAttachment = (attachment, isUploadRequired, currentSource) => {
    const { onAddAttachment, messages } = this.props
    const { selectedNetworkGroupOnMediaUpload } = this.state
    if (messages?.[0].messages.length > 1) {
      attachment.selectedNetworkGroup = selectedNetworkGroupOnMediaUpload
    }
    onAddAttachment(attachment, isUploadRequired, currentSource)
  }

  render() {
    // If retries are allowed (aka the preview is empty), then rendering the urlPreview just renders a retry line
    // In that case, we want it below the attachments, since rendering attachments without any attachments overloads it to the add media object. Because reasons.
    // Otherwise, urlPreview is available, and so we render it on top. Unless of course, there's no urlPreview at all (thus no retry allowed), in which case "rendering" the url preview will be a noop
    // Yes, this is a heaping pile... but fixing it properly will take a while.
    const {
      csrf,
      facadeApiUrl,
      fieldValidations,
      getSocialNetworkTypes,
      hasAttachments,
      hasThumbnailUrls,
      isBulkComposer,
      isEditMode,
      hideAltText,
      isSocialProfileTypeSelected,
      isTranscodingEnabled,
      onAttachmentEdited,
      onUploadQueueComplete,
      onToggleMediaLibrary,
      supportsLinkPreview,
      trackingContext,
      validationError,
      onTrackMediaUploadError,
      selectedNetworkGroup,
      customContext,
      showOnboarding,
      isCanvaAccessAllowed,
      isPdfUploadAllowed,
      getAttachmentType,
    } = this.props
    const { selectedNetworkGroupOnMediaUpload, urlPreview } = this.state

    const doesPreviewExist = typeof urlPreview === 'object' && urlPreview !== null
    const isPreviewEmpty =
      doesPreviewExist &&
      !urlPreview.title &&
      !urlPreview.description &&
      _.isEmpty(urlPreview.thumbnailUrls) &&
      !urlPreview.thumbnailUrl

    return (
      <MediaPickerContainer className="rc-MediaPicker -media">
        <div />
        {this.renderLinkPreview()}
        {isFeatureDisabledAndNotBeta('PUB_30706_LINK_SETTINGS_PNE') && this.renderLinkScrapeWarning()}
        <MediaAttachmentArea
          csrf={csrf}
          canUploadMixedMedia={this.canUploadMixedMedia()}
          facadeApiUrl={facadeApiUrl}
          getSocialNetworkTypes={getSocialNetworkTypes}
          hasAttachments={hasAttachments}
          hasThumbnailUrls={hasThumbnailUrls}
          isEditMode={isEditMode}
          hideAltText={hideAltText}
          isSocialProfileTypeSelected={isSocialProfileTypeSelected}
          fieldValidations={fieldValidations}
          hasUrlPreview={!isPreviewEmpty && doesPreviewExist}
          mode={isBulkComposer ? ComposerConstants.MODE.BULK_COMPOSER : ComposerConstants.MODE.COMPOSER}
          messageId={this.props.messageId}
          onAddAttachment={this.localOnAddAttachment}
          onAttachmentEdited={onAttachmentEdited}
          onUploadQueueComplete={onUploadQueueComplete}
          onToggleMediaLibrary={onToggleMediaLibrary}
          supportsLinkPreview={supportsLinkPreview}
          thumbnailUrls={(urlPreview && urlPreview.thumbnailUrls) || []}
          trackingContext={trackingContext}
          validationError={validationError}
          onTrackMediaUploadError={onTrackMediaUploadError}
          setSelectedNetworkGroupOnMediaUpload={() =>
            this.setState({ selectedNetworkGroupOnMediaUpload: selectedNetworkGroup })
          }
          selectedNetworkGroupOnMediaUpload={selectedNetworkGroupOnMediaUpload}
          customContext={customContext}
          showOnboarding={showOnboarding}
          isCanvaAccessAllowed={isCanvaAccessAllowed}
          isPdfUploadAllowed={isPdfUploadAllowed}
          isBulkComposer={isBulkComposer}
          getAttachmentType={getAttachmentType}
          isTranscodingEnabled={isTranscodingEnabled}
        />
        {isBulkComposer ? null : this.renderFacebookAlbumPicker()}
      </MediaPickerContainer>
    )
  }
}

const ConnectedMediaPicker = compose(
  connect(albumStore, state => ({
    albums: state.albums,
    isLoadingAlbums: state.isLoadingAlbums,
  })),
  reduxConnect(({ composer, validation }: RootState) => ({
    selectedNetworkGroup: composer.selectedNetworkGroup,
    showOnSubmitErrors: validation.showOnSubmitErrors,
  })),
)(MediaPicker)

export default ConnectedMediaPicker

const ReactTimeoutMediaPicker = ReactTimeout(ConnectedMediaPicker)
export { MediaPicker as UnwrappedMediaPicker, ReactTimeoutMediaPicker as MediaPicker }
