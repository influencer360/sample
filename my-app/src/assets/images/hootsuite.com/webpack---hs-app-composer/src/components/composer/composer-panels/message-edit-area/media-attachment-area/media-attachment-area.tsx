import React from 'react'
import loadable from '@loadable/component'
import { arrayMoveImmutable } from 'array-move'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import over from 'lodash/over'
import uniq from 'lodash/uniq'
import { connect as reduxConnect } from 'react-redux'
import _ from 'underscore'

import { TYPE_ERROR, TYPE_WARNING } from 'fe-comp-banner'
import { InputBanner, TYPE_INFO } from 'fe-comp-input-banner'
import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import { ValidationBanner, FieldValidationItem } from 'fe-pnc-comp-field-validation-item'
import InnerMediaAttachmentArea from 'fe-pnc-comp-media-attachment-area'
import type { MediaAttachmentAreaEvent } from 'fe-pnc-comp-media-attachment-area'
import { showMediaReplaceModal } from 'fe-pnc-comp-media-replace-modal'
import {
  ACCEPTED_MIME_TYPES,
  STATUS,
  UPLOAD_ERROR_TYPE,
  getFileMimeType,
  getFileSize,
} from 'fe-pnc-comp-media-upload'
import type { InstagramPublishingMode } from 'fe-pnc-constants'
import { AttachmentConstants } from 'fe-pnc-constants'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { InstagramPostType, SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'
import {
  actions as ComposerMessageActions,
  store as composerMessageStore,
  getSelectedMessage,
  getState as getComposerMessageState,
  selectedMessageInterface as SelectedMessageState,
  getSelectedMessageValue,
  ImageAttachment,
  GifAttachment,
  VideoAttachment,
} from 'fe-pnc-data-composer-message'
import type {
  AttachmentData,
  AttachmentObject,
  ImageAttachmentData,
  VideoAttachmentData,
  ThumbnailUrl,
} from 'fe-pnc-data-composer-message'
import { isFeatureEnabledOrBeta, isFeatureEnabled, isThreadsEnabled } from 'fe-pnc-lib-darklaunch'
import translation from 'fe-pnc-lib-hs-translation'
import { doesSupportVideoPosting } from 'fe-pnc-lib-networks-conf'
import { observeStore } from 'fe-pnc-lib-store-observer'
import { FIELD_VALIDATIONS } from 'fe-pnc-validation-error-messages'
import ComposerConstants from '@/constants/composer'
import ConstantMappings from '@/constants/constant-mappings'
import Constants from '@/constants/constants'
import { ATTACHMENT_WARNINGS_MEDIA_AREA } from '@/constants/preview-validation-messages'
import TrackingConstants from '@/constants/tracking'
import { composerActions } from '@/redux/reducers/composer'
import { AppDispatch, RootState } from '@/redux/store'
import { TrackingContext, UploadingFile } from '@/typings/Constants'
import { ErrorType } from '@/typings/Message'
import { FieldValidations } from '@/typings/Message'
import AttachmentUtils from '@/utils/attachment-utils'
import ComposerUtils from '@/utils/composer-utils'
import MessageUtils from '@/utils/message-utils'
import statusObject, { StatusObject } from '@/utils/status-bar'
import StatusToastUtils from '@/utils/status-toast-utils'
import { track } from '@/utils/tracking'
import ValidationUtils from '@/utils/validation-utils'
import { addActionHandler } from '../media-picker/add-action-handler'
import { VideoTranscodingInfo } from './media-attachment-area.style'
import VistaCreateWrapper from './vista-create-wrapper'

const CANVA_API_KEY = process.env.CANVA_API_KEY
const VIDEO_TRANSCODING_TITLE = translation._("One or more videos need processing - we'll do that for you!")
// prettier-ignore
const VIDEO_TRANSCODING_DELAY_MSG = translation._('Processing begins when you complete your content.')
// prettier-ignore
const IG_VIDEO_TRANSCODING = translation._("Instagram limitations may slightly affect video quality. Schedule your content to review it before it's published.")

// Lazy loaded components
const SuggestedImages = isFeatureEnabled('PUB_31499_CONVERT_SUGGESTED_IMAGES_FUNCTIONAL')
  ? loadable(async () => {
      const { SuggestedImages } = await import(
        /* webpackChunkName: "SuggestedImages" */ './suggested-images/suggested-images'
      )

      return props => <SuggestedImages {...props} />
    })
  : loadable(
      () =>
        import(/* webpackChunkName: "SuggestedImages" */ './suggested-images/suggested-images-deprecated'),
    )
SuggestedImages.displayName = 'SuggestedImages' // The displayName is needed for finding the component in the unit tests

const ORIGIN = `web.publisher.${TrackingConstants.TRACKING_CONTEXT.COMPOSER}.media_attachment_area`
const onMediaAttachmentAreaEvent = (event: MediaAttachmentAreaEvent) => {
  const EVENT = 'user_took_media_action'
  const { action } = event

  switch (action) {
    case 'open_edit_media':
    case 'open_edit_canva':
    case 'open_edit_alt_text':
      track(ORIGIN, EVENT, {
        action: action,
        creativeSource: event.payload.trackingSource,
      })
      break
    case 'open_canva_design_list':
      track(ORIGIN, EVENT, {
        action: action,
      })
      break
    case 'select_canva_design':
      track(ORIGIN, EVENT, {
        action: action,
        designSelected: event.payload.designSelected,
      })
      break
  }
}

const noop = () => {}
const { SN_TYPES, SN_GROUP, SN_TYPE_TO_DISPLAY_NAME, SN_GROUP_TO_SN_TYPES, INSTAGRAM_POST_TYPES } =
  SocialProfileConstants

const INSTAGRAM_PUBLISHING_MODES = Constants.INSTAGRAM_PUBLISHING_MODES

const EDIT_OR_CREATE_TRACK_ORIGIN = isEditMode => (isEditMode ? '.edit_message' : '.create_message')
const UPLOAD_IMAGE_DEFAULT_ERROR_MESSAGE = translation._('An error occurred while uploading your file.')
const UPLOAD_INVALID_FILE_TITLE = translation._("You can't upload files of this type.")
const UPLOAD_INVALID_FILE_MESSAGE = translation._('Only image, gif, and video files can be uploaded.')
const UPLOAD_REACH_LIMIT_TITLE = translation._('Not all of your files are attached.')
// L10N: %s is a number of maximum files can upload at a time
const UPLOAD_REACH_LIMIT_MESSAGE = maxFiles =>
  translation._('You can only upload %s attachments at a time.').replace('%s', maxFiles)
// L10N: %s1 is the social network
const UPLOAD_MIMETYPE_TITLE = network =>
  translation._("%s1 doesn't support this type of file.").replace('%s1', network)
// L10N: %s1 is the list of image types
//       %s2 is the social network
const UPLOAD_MIMETYPE_MESSAGE = (sn, network) =>
  translation._('Only %s1 can be uploaded to %s2.').replace('%s1', sn).replace('%s2', network)

type MediaAttachmentAreaProps = {
  canUploadMixedMedia?: boolean
  csrf: string
  dispatch: AppDispatch
  facadeApiUrl: string
  getSocialNetworkTypes: () => Array<string>
  hasThumbnailUrls: () => boolean
  hasUrlPreview: boolean
  isEditMode?: boolean
  hideAltText: boolean
  isSocialProfileTypeSelected: (...types: Array<string>) => boolean
  isUploading?: boolean
  selectedNetworkGroup?: SocialNetworkGroup
  publishingMode: InstagramPublishingMode
  messageId: number
  mode: keyof typeof ComposerConstants.MODE
  onAddAttachment: (
    attachmentData: AttachmentData,
    isUploadRequired?: boolean,
    currentSource?: string,
  ) => void
  onToggleMediaLibrary: () => void
  onAttachmentRemove: () => void
  onAttachmentEdited: () => void
  onUploadQueueComplete?: (callback: () => void) => void
  postType: InstagramPostType
  showOnSubmitErrors?: boolean
  supportsLinkPreview: () => boolean
  thumbnailUrls: Array<ThumbnailUrl>
  trackingContext: TrackingContext
  uploadingFiles?: Array<any>
  validationError?: () => void
  onTrackMediaUploadError?: (error: ErrorType) => void
  setSelectedNetworkGroupOnMediaUpload?: () => void
  selectedNetworkGroupOnMediaUpload: SocialNetworkGroup
  customContext?: string
  showOnboarding: boolean
  isCanvaAccessAllowed?: boolean
  isPdfUploadAllowed: boolean
  isBulkComposer: boolean
  getAttachmentType?(...args: Array<unknown>): unknown
  hasAttachments?(...args: Array<unknown>): unknown
  isTranscodingEnabled?: boolean
}

type MediaAttachmentAreaState = {
  canUploadVideo: boolean
  hasManuallyHiddenSuggestions: boolean
  isRequestLoading: boolean
  isEditingVideoDetails: boolean
  selectedMessageCount: number
  fieldValidations: unknown[]
  mediaAttachments: AttachmentObject[]
  prevInstagramReelAttachments: AttachmentObject[]
}

export class MediaAttachmentArea extends React.PureComponent<
  MediaAttachmentAreaProps,
  MediaAttachmentAreaState
> {
  readonly composerMessageActions: typeof ComposerMessageActions
  static displayName = 'Media Attachment Area'

  static defaultProps = {
    isEditMode: false,
    isUploading: false,
    onUploadQueueComplete: noop,
    showOnSubmitErrors: false,
    thumbnailUrls: [],
    uploadingFiles: [],
    validationError: noop,
    showOnboarding: true,
    isCanvaAccessAllowed: false,
    isPdfUploadAllowed: false,
    isBulkComposer: false,
  }

  unsubscribeObservers: Array<() => void>
  _statusObject: StatusObject

  constructor(props) {
    super(props)

    this._statusObject = statusObject // for dependency injection/mocking, since statusObject is actually a unique instance

    this.composerMessageActions = ComposerMessageActions

    this.state = {
      canUploadVideo: true,
      hasManuallyHiddenSuggestions: false,
      isRequestLoading: false,
      isEditingVideoDetails: false,
      selectedMessageCount: 0,
      fieldValidations: [],
      mediaAttachments: [],
      prevInstagramReelAttachments: [],
    }

    this.unsubscribeObservers = [noop]
  }

  componentDidMount() {
    this.props.onUploadQueueComplete(this.onUploadQueueComplete)
    this.unsubscribeObservers = [
      observeStore(
        composerMessageStore,
        selectedMessageCount => this.setState({ selectedMessageCount }),
        state => getSelectedMessageValue(state, 'messages', false, []).length,
      ),
      observeStore(
        composerMessageStore,
        fieldValidations => this.setState({ fieldValidations }),
        state => getSelectedMessageValue(state, 'fieldValidations', false, []),
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        mediaAttachments => this.setState({ mediaAttachments }),
        state => {
          const selectedNetworkGroup = getSelectedMessageValue(state, 'selectedNetworkGroup', false, null)
          if (selectedNetworkGroup) {
            return MessageUtils.getAttachmentsBySelectedNetwork(
              getSelectedMessageValue(state, 'messages', false, []),
              selectedNetworkGroup,
            )
          }

          return getSelectedMessageValue(state, 'attachments', false, [])
        },
        isEqual,
      ),
      observeStore(
        composerMessageStore,
        (socialNetworkTypes: string[]) => {
          this.allowVideosDependingOnNetworks(socialNetworkTypes)
        },
        state => getSelectedMessage(state)?.getSocialNetworkTypes() ?? [],
        isEqual,
      ),
    ]
  }

  componentWillUnmount() {
    over(this.unsubscribeObservers)()
  }

  componentDidUpdate(prevProps, prevState) {
    if (!isEqual(prevState.fieldValidations, this.state.fieldValidations)) {
      const attachmentErrors = get(this.state.fieldValidations, ['errors', 'attachments'], [])
      attachmentErrors.forEach(attachmentError => this.props.onTrackMediaUploadError(attachmentError))
    }

    if (prevProps.selectedNetworkGroup !== this.props.selectedNetworkGroup) {
      const selectedMessageForEdit = getSelectedMessage(getComposerMessageState())
      if (this.props.selectedNetworkGroup) {
        this.setState({
          mediaAttachments: MessageUtils.getAttachmentsBySelectedNetwork(
            getSelectedMessageValue(getComposerMessageState(), 'messages', false, []),
            this.props.selectedNetworkGroup,
          ),
        })
      } else {
        this.setState({ mediaAttachments: selectedMessageForEdit?.attachments || [] })
      }
    }

    if (isFeatureEnabledOrBeta('PUB_28512_REELS_THUMBNAIL')) {
      //bulk composer does not support PNE or custom thumbnails
      const isNotBulkComposer =
        isFeatureEnabledOrBeta('PUB_28787_SIMPLIFY_IG_POST_TYPES') && !this.props.isBulkComposer
      if (prevProps.postType !== this.props.postType && isNotBulkComposer) {
        if (ComposerUtils.isInstagramReel(prevProps.postType)) {
          const exisistingPreInstagramReelAttachments = this.state.prevInstagramReelAttachments
          const attachmentsWithCustomThumbnail = this.state.mediaAttachments
            .filter(
              attachment =>
                attachment.userMetadata?.customThumbnail &&
                !attachment.thumbnailOffset &&
                !exisistingPreInstagramReelAttachments.some(
                  prevAttachment => prevAttachment.id === attachment.id,
                ),
            )
            .map(attachment => attachment)

          this.setState({
            prevInstagramReelAttachments: exisistingPreInstagramReelAttachments.concat(
              attachmentsWithCustomThumbnail,
            ),
          })
          this.composerMessageActions.updateFieldById(
            this.props.messageId,
            'attachments',
            this.state.mediaAttachments,
          )
        }

        if (ComposerUtils.isInstagramReel(this.props.postType)) {
          const prevAttachmentWithThumbnails = this.state.prevInstagramReelAttachments
          const revisedAttachments = this.state.mediaAttachments.map(attachment => {
            const hasCustomThumbnail = prevAttachmentWithThumbnails.some(
              prevAttachment => prevAttachment.id === attachment.id,
            )
            if (hasCustomThumbnail) {
              const prevThumbnail = prevAttachmentWithThumbnails.filter(
                prevAttachment => prevAttachment.id === attachment.id,
              )
              attachment.thumbnailUrl = prevThumbnail[0].thumbnailUrl
              return attachment
            }
            return attachment
          })

          this.composerMessageActions.updateFieldById(this.props.messageId, 'attachments', revisedAttachments)
          this.setState({ mediaAttachments: revisedAttachments })
        }
      }
    }
  }

  /**
   * Checks all network types to see if videos can be uploaded
   * Video uploads are enabled if at least one selected network allows it
   * @param {Array<string>} selectedSocialNetworkTypes
   */
  async allowVideosDependingOnNetworks(selectedSocialNetworkTypes: string[]) {
    if (selectedSocialNetworkTypes.length > 0) {
      const videoUploadPromises = selectedSocialNetworkTypes.map(doesSupportVideoPosting)
      const canUploadVideoArr = await Promise.all(videoUploadPromises)
      const canUploadVideo = canUploadVideoArr.some(canUpload => canUpload)
      this.setState({
        canUploadVideo,
      })
    } else {
      this.setState({ canUploadVideo: true })
    }
  }

  updateUploadingState = isUploading => {
    this.setState({ isRequestLoading: isUploading })
    this.setIsUploading(isUploading)
  }

  onAttachmentUploaded = async (uploadResponse, file) => {
    track(
      'web.publisher.' + this.props.trackingContext + EDIT_OR_CREATE_TRACK_ORIGIN(this.props.isEditMode),
      'attach_file',
      { mimeType: uploadResponse.mimeType },
    )
    const fileName = _.isObject(file) ? file.name : uploadResponse.fileName

    const { fileSize, bytes } = uploadResponse
    const attachmentData = {
      ...uploadResponse,
      fileName,
      bytes: VideoAttachment.isVideoAttachment(uploadResponse) ? bytes : fileSize ? fileSize : bytes, // once uploads via owly is removed this will be bytes
      fileSource: AttachmentConstants.FILESOURCE.UPLOAD,
      trackingSource: ComposerConstants.ATTACHMENT_TRACKING_SOURCE.UPLOAD,
    } as AttachmentData
    this.props.onAddAttachment(attachmentData)

    this.updateUploadingState(false)
  }

  determineValidations = (selectedNetworkGroup: SocialNetworkGroup): FieldValidations => {
    const filteredValidations = SelectedMessageState.filterOutDuplicateAttachmentValidations(
      getComposerMessageState(),
    )

    if (!selectedNetworkGroup) {
      return filteredValidations
    }
    return SelectedMessageState.getValidationsBySelectedNetwork(
      getComposerMessageState(),
      selectedNetworkGroup,
    )
  }

  buildAttachmentValidations = (isVideoTranscodeable: boolean) => {
    const {
      isBulkComposer,
      showOnSubmitErrors,
      isSocialProfileTypeSelected,
      getAttachmentType,
      publishingMode,
      selectedNetworkGroup,
      onAttachmentEdited,
    } = this.props
    const { mediaAttachments } = this.state

    const selectedMessageForEdit = getSelectedMessage(getComposerMessageState())
    const fieldValidationsFromMessage = selectedMessageForEdit?.fieldValidations
    const postType = selectedMessageForEdit?.postType
    const isInstagramNetworkSelected = isSocialProfileTypeSelected(
      ...SN_GROUP_TO_SN_TYPES[SN_GROUP.INSTAGRAM],
    )
    if (isVideoTranscodeable) {
      const igTranscodingInfo = () => {
        let hasIgAttachmentFieldValidation = false
        if (get(fieldValidationsFromMessage, ['info', 'attachments'], false)) {
          hasIgAttachmentFieldValidation = fieldValidationsFromMessage.info.attachments?.some(
            validation =>
              validation.socialProfileType === SN_TYPES.INSTAGRAM ||
              validation.socialProfileType === SN_TYPES.INSTAGRAMBUSINESS,
          )
        }
        if (isInstagramNetworkSelected && hasIgAttachmentFieldValidation) {
          return [<FieldValidationItem key={0} message={IG_VIDEO_TRANSCODING} />]
        } else {
          return []
        }
      }

      return (
        <VideoTranscodingInfo>
          <InputBanner
            type={TYPE_INFO}
            titleText={VIDEO_TRANSCODING_TITLE}
            messageText={VIDEO_TRANSCODING_DELAY_MSG}
            items={igTranscodingInfo()}
          />
        </VideoTranscodingInfo>
      )
    } else if (fieldValidationsFromMessage) {
      const fieldValidations = this.determineValidations(selectedNetworkGroup)

      if (fieldValidations.warnings) {
        fieldValidations.warnings[Constants.FIELD_TO_UPDATE.ATTACHMENTS] =
          fieldValidations.warnings[Constants.FIELD_TO_UPDATE.ATTACHMENTS]?.filter(warning =>
            Object.values(ATTACHMENT_WARNINGS_MEDIA_AREA).includes(warning.code),
          ) || []
      }

      // We need to clone the fieldValidations as updating the object directly in addActionHandler
      // causes a state change and ends up in a loop calling /previews as onUpdateFieldValidations()
      // is watching for these changes
      return (
        <ValidationBanner
          fieldValidations={addActionHandler(
            cloneDeep(fieldValidations),
            mediaAttachments,
            onAttachmentEdited,
            postType,
            selectedNetworkGroup,
          )}
          field={FIELD_VALIDATIONS.ATTACHMENTS}
          type={getAttachmentType()}
          showOnSubmitErrors={showOnSubmitErrors}
          isBulkComposer={isBulkComposer}
          publishingMode={publishingMode}
          isPageLevel={true}
        />
      )
    }
    return null
  }

  onMediaReplaceModalCancel = () => {
    const { messageId } = this.props
    const existingAttachments = this.state.mediaAttachments.filter(
      attachment => attachment.status === AttachmentConstants.STATUS.ATTACHED,
    )
    this.composerMessageActions.updateFieldById(
      messageId,
      Constants.FIELD_TO_UPDATE.ATTACHMENTS,
      existingAttachments,
    )
    this.setState({ isEditingVideoDetails: false })
  }

  onMediaReplaceModalSubmit = (selectedAttachment, close) => {
    const selectedAttachments = [] as Array<AttachmentObject | null>
    if (Array.isArray(selectedAttachment)) {
      selectedAttachment.forEach(attachment => {
        selectedAttachments.push(
          ComposerUtils.createAttachmentFromData(attachment, AttachmentConstants.STATUS.ATTACHED),
        )
      })
    } else {
      selectedAttachments.push(
        ComposerUtils.createAttachmentFromData(selectedAttachment, AttachmentConstants.STATUS.ATTACHED),
      )
    }
    this.composerMessageActions.updateFieldById(
      this.props.messageId,
      Constants.FIELD_TO_UPDATE.ATTACHMENTS,
      selectedAttachments,
    )
    this.setState({ isEditingVideoDetails: false })
    close()
  }

  /**
   * Restricts users to uploading attachments of a single media type unless specified otherwise,
   * such as for Instagram stories.
   */
  onUploadQueueComplete = () => {
    const { canUploadMixedMedia, isUploading, getSocialNetworkTypes, selectedNetworkGroup } = this.props

    const selectedNetworkGroups = selectedNetworkGroup
      ? [selectedNetworkGroup]
      : uniq(
          getSocialNetworkTypes().map(
            socialNetworkType => SocialProfileConstants.SN_TYPE_TO_SN_GROUP[socialNetworkType],
          ),
        )
    if (!isUploading) {
      const mediaAttachments = this.state.mediaAttachments
      if (!canUploadMixedMedia && ComposerUtils.shouldReplaceAttachments(mediaAttachments)) {
        const attachmentsAsDataObj = mediaAttachments.map(attachment => attachment.toDataObject())
        showMediaReplaceModal({
          media: AttachmentUtils.groupImagesInAttachments(attachmentsAsDataObj),
          onCancel: this.onMediaReplaceModalCancel,
          onSubmit: this.onMediaReplaceModalSubmit,
          selectedNetworkGroups,
        })
      }
    }
  }

  onAttachmentEditSave = (newAttachment, index) => {
    const { messageId } = this.props
    const revisedAttachments = _.clone(this.state.mediaAttachments)
    revisedAttachments[index] = newAttachment

    this.composerMessageActions.updateFieldById(messageId, 'attachments', revisedAttachments)
  }

  onAttachmentRemove = index => {
    const mediaAttachments = this.state.mediaAttachments
    const trackingSource = mediaAttachments[index].trackingSource
    const mediaEvent =
      trackingSource === ComposerConstants.ATTACHMENT_TRACKING_SOURCE.MEDIA_LIBRARY
        ? TrackingConstants.TRACKING_ACTION.ADD_MEDIA_FROM_LIBRARY
        : TrackingConstants.TRACKING_ACTION.ADD_MEDIA_FROM_COMPUTER

    if (isFeatureEnabled('PUB_30955_TRACK_COMPOSER_MEDIA_LIBRARY_ACTIONS')) {
      track(TrackingConstants.TRACKING_ORIGINS.MEDIA_LIBRARY, mediaEvent, {
        mediaAdded: false,
        mediaRemoved: true,
      })
    }

    track(
      'web.publisher.' + this.props.trackingContext + EDIT_OR_CREATE_TRACK_ORIGIN(this.props.isEditMode),
      ConstantMappings.ATTACHMENT_SOURCE_TO_REMOVAL_EVENT[trackingSource],
    )
    const revisedAttachments = mediaAttachments.slice(0, index).concat(mediaAttachments.slice(index + 1))
    this.composerMessageActions.updateFieldById(this.props.messageId, 'attachments', revisedAttachments)
    this.setState({ isEditingVideoDetails: false })
    this.setState({ mediaAttachments: revisedAttachments })
  }

  onSuggestedImageClicked = (imageUrl: string) => {
    const attachment = {
      trackingSource: ComposerConstants.ATTACHMENT_TRACKING_SOURCE.SUGGESTED,
      thumbnailUrl: imageUrl,
      url: imageUrl,
    } as AttachmentData
    this.props.onAddAttachment(attachment, true)

    track(
      'web.publisher.' + this.props.trackingContext + EDIT_OR_CREATE_TRACK_ORIGIN(this.props.isEditMode),
      'attach_file',
    )
  }

  handleSortAttachmentEnd = ({ oldIndex, newIndex }) => {
    if (!_.isEqual(oldIndex, newIndex)) {
      const reorderedAttachments = arrayMoveImmutable(this.state.mediaAttachments, oldIndex, newIndex)
      this.composerMessageActions.updateFieldById(this.props.messageId, 'attachments', reorderedAttachments)
    }
  }

  /**
   * Called when there is an error with the file or request.
   * @param {File} file
   * @param {(object|string)} error
   */
  onUploadError = (file, error) => {
    const { getSocialNetworkTypes } = this.props
    const socialNetworkTypes = getSocialNetworkTypes()
    const canUploadVideo = this.state.canUploadVideo
    // This is to add space between each comma and remove all the 'image' from the sentence
    // e.g. change 'image/png,image/jpg,image/jpeg' to 'png, jpg, jpeg'
    const acceptedMimeTypes = ACCEPTED_MIME_TYPES.IMAGE.filter(
      mimeType => !ComposerUtils.isGifMimeType(mimeType),
    )
      .join()
      .split(',')
      .join(', ')
      .split('image/')
      .join('')
    let errorMessage = [UPLOAD_IMAGE_DEFAULT_ERROR_MESSAGE]
    const errorTitle = []
    const bannerType = []

    const { fileType, mimeType: fileMimeType } = getFileMimeType(file) || {}
    const mimeType = fileMimeType || file?.name?.split('.')?.pop() || ''
    const fileSize = getFileSize(file)
    const event = fileType === 'image' || fileType === 'video' ? fileType : 'generic'

    if (typeof error === 'string') {
      // If the error is returned by the dropzone component, we receive it as string
      errorMessage = [error]
      if (UPLOAD_ERROR_TYPE && error === UPLOAD_ERROR_TYPE.INVALID_FILE_TYPE) {
        track(
          'web.publisher.' + this.props.trackingContext + EDIT_OR_CREATE_TRACK_ORIGIN(this.props.isEditMode),
          `upload_${event}_errors`,
          { mimeType, logDescription: UPLOAD_ERROR_TYPE.INVALID_FILE_TYPE },
        )
        if (canUploadVideo) {
          errorTitle.push(UPLOAD_INVALID_FILE_TITLE)
          errorMessage.push(UPLOAD_INVALID_FILE_MESSAGE)
          bannerType.push(TYPE_ERROR)
        } else {
          if (socialNetworkTypes) {
            socialNetworkTypes.forEach(network => {
              const translatedNetwork = SN_TYPE_TO_DISPLAY_NAME[network]
              errorTitle.push(UPLOAD_MIMETYPE_TITLE(translatedNetwork))
              errorMessage.push(UPLOAD_MIMETYPE_MESSAGE(acceptedMimeTypes, translatedNetwork))
              bannerType.push(TYPE_ERROR)
            })
          }
        }
      } else if (UPLOAD_ERROR_TYPE && error === UPLOAD_ERROR_TYPE.MAX_FILE_EXCEEDED) {
        errorTitle.push(UPLOAD_REACH_LIMIT_TITLE)
        bannerType.push(TYPE_WARNING)
        errorMessage.push(
          UPLOAD_REACH_LIMIT_MESSAGE(
            isFeatureEnabledOrBeta('PUB_29617_MAX_FILE_UPLOAD_CONST')
              ? AttachmentConstants.MAX_FILE_UPLOAD.DEFAULT
              : this.getMaxFiles(),
          ),
        )
      } else if (error.includes('File is too big')) {
        track(
          'web.publisher.' + this.props.trackingContext + EDIT_OR_CREATE_TRACK_ORIGIN(this.props.isEditMode),
          `upload_${event}_errors`,
          { fileSize, logDescription: UPLOAD_ERROR_TYPE.MAX_FILE_EXCEEDED },
        )
      } else if (typeof error === 'object') {
        // If the error is returned by the service, we receive it as an object
        if (error.details?.length && error.details[0].message) {
          errorMessage = [error.details[0].message]
        }
      }
      if (errorTitle.length !== 0) {
        for (let i = 0; i < errorTitle.length; i++) {
          StatusToastUtils.createToast(errorTitle[i], errorMessage[i + 1], bannerType[i])
        }
      } else {
        this._statusObject.update(errorMessage[0], 'error', true)
      }
    }
  }

  setIsUploading = (isUploading: boolean) => this.props.dispatch(composerActions.setIsUploading(isUploading))

  setUploadingFiles = (uploadingFiles: Array<UploadingFile>) =>
    this.props.dispatch(composerActions.setUploadingFiles(uploadingFiles))

  onUpdateUploadingFiles = files => {
    const updatedUploadingFiles = files.filter(file => file.status === STATUS.UPLOADING)
    this.setUploadingFiles(updatedUploadingFiles)
    if (!Array.isArray(updatedUploadingFiles) || _.isEmpty(updatedUploadingFiles)) {
      this.updateUploadingState(false)
    }
  }

  /**
   * Returns the maximum amount of files that can be uploaded concurrently
   * @returns {number}
   */
  getMaxFiles = () => {
    const { getSocialNetworkTypes, selectedNetworkGroup } = this.props

    const networkTypes = selectedNetworkGroup
      ? [...SN_GROUP_TO_SN_TYPES[selectedNetworkGroup]]
      : getSocialNetworkTypes()

    const isInstagramDirectPublishStory =
      this.props.postType === INSTAGRAM_POST_TYPES.IG_STORY &&
      this.props.publishingMode === INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH

    if (isInstagramDirectPublishStory) {
      return AttachmentConstants.MEDIA_LIMIT.INSTAGRAM_STORY_DIRECT_PUBLISH
    }
    if (ComposerUtils.hasSocialProfileType(networkTypes, SN_TYPES.FACEBOOKPAGE, SN_TYPES.FACEBOOKGROUP)) {
      return AttachmentConstants.MEDIA_LIMIT.FACEBOOK
    }
    if (ComposerUtils.hasSocialProfileType(networkTypes, ...SN_GROUP_TO_SN_TYPES[SN_GROUP.LINKEDIN])) {
      return AttachmentConstants.MEDIA_LIMIT.LINKEDIN
    }
    if (ComposerUtils.hasSocialProfileType(networkTypes, ...SN_GROUP_TO_SN_TYPES[SN_GROUP.INSTAGRAM])) {
      return AttachmentConstants.MEDIA_LIMIT.INSTAGRAM
    }

    if (isThreadsEnabled()) {
      if (ComposerUtils.hasSocialProfileType(networkTypes, ...SN_GROUP_TO_SN_TYPES[SN_GROUP.THREADS])) {
        return AttachmentConstants.MEDIA_LIMIT.THREADS
      }
    }

    return AttachmentConstants.MEDIA_LIMIT.TWITTER
  }

  filterSuggestedImages(images) {
    return images.filter(image => {
      const url = image.originalUrl ? image.originalUrl : image.thumbnailUrl
      const attachment = { url }
      return ImageAttachment.isImageAttachment(attachment) || GifAttachment.isGifAttachment(attachment)
    })
  }

  renderMediaSuggestions() {
    // We only show suggestions if the message doesn't support link previews and doesn't have any attachments yet
    // Because the message doesn't support link previews, the data in urlPreview is not really valid (even though we did scrape), so instead we use it as suggested images
    if (
      this.state.mediaAttachments.length > 0 ||
      this.props.supportsLinkPreview() ||
      !this.props.hasThumbnailUrls()
    ) {
      return null
    }

    // If we're uploading media we don't need to show suggested images anymore
    if (this.props.uploadingFiles.length) {
      return null
    }

    if (this.state.hasManuallyHiddenSuggestions) {
      return null
    }

    const imageUrls = this.filterSuggestedImages(this.props.thumbnailUrls)

    if (imageUrls.length <= 0) {
      return null
    }

    return (
      <SuggestedImages
        images={imageUrls}
        onCloseClicked={() => this.setState({ hasManuallyHiddenSuggestions: true })}
        onImageClicked={this.onSuggestedImageClicked}
      />
    )
  }

  renderVistaCreateWrapper() {
    if (isFeatureEnabledOrBeta('NGE_20113_VISTACREATE_INTEGRATION')) {
      const { onAddAttachment, onAttachmentEdited } = this.props
      return (
        <VistaCreateWrapper
          onAddAttachment={onAddAttachment}
          onImageEdited={onAttachmentEdited}
          onErrorLoadingVistaCreate={() => {}}
        >
          {() => {
            return null
          }}
        </VistaCreateWrapper>
      )
    }
    return null
  }

  render() {
    const {
      csrf,
      facadeApiUrl,
      getSocialNetworkTypes,
      hideAltText,
      isCanvaAccessAllowed,
      mode,
      onAddAttachment,
      onAttachmentEdited,
      onToggleMediaLibrary,
      postType,
      selectedNetworkGroup,
      setSelectedNetworkGroupOnMediaUpload,
      selectedNetworkGroupOnMediaUpload,
      showOnSubmitErrors,
      uploadingFiles,
      customContext,
      publishingMode,
      hasAttachments,
      isTranscodingEnabled,
      isPdfUploadAllowed,
    } = this.props

    const { fieldValidations } = this.state

    // Video is transcodeable when there exists only transcodeable info and no errors
    const isVideoTranscodeable = ValidationUtils.isVideoTranscodeable(
      isTranscodingEnabled,
      fieldValidations,
      hasAttachments,
    )

    return (
      <>
        {this.buildAttachmentValidations(isVideoTranscodeable)}
        <InnerMediaAttachmentArea
          canUploadVideo={this.state.canUploadVideo}
          canUploadPdf={isPdfUploadAllowed}
          csrf={csrf}
          dropzoneSelector={
            this.state.isEditingVideoDetails ? undefined : AttachmentConstants.DROPZONE_SELECTOR
          }
          facadeApiUrl={facadeApiUrl}
          fieldValidations={this.state.fieldValidations}
          handleSortAttachmentEnd={this.handleSortAttachmentEnd}
          hideAltText={hideAltText}
          isMediaLibraryVisible={!this.props.isBulkComposer}
          maxFiles={this.getMaxFiles()}
          mediaAttachments={this.state.mediaAttachments}
          mode={mode}
          onAttachmentRemove={this.onAttachmentRemove}
          onAttachmentUploaded={this.onAttachmentUploaded}
          onImageEdited={onAttachmentEdited}
          onVideoEdited={onAttachmentEdited}
          onMetadataEditSave={(attachment: ImageAttachmentData, index: number) => {
            const newAttachment = ComposerUtils.isGifMimeType(attachment.mimeType)
              ? new GifAttachment(attachment)
              : new ImageAttachment(attachment)
            this.onAttachmentEditSave(newAttachment, index)
          }}
          onVideoEditSave={(attachment: VideoAttachmentData, index: number) => {
            this.onAttachmentEditSave(new VideoAttachment(attachment), index)
          }}
          onToggleMediaLibrary={onToggleMediaLibrary}
          onUploadError={this.onUploadError}
          onUploadQueueComplete={this.onUploadQueueComplete}
          postType={postType}
          selectedNetworkGroup={selectedNetworkGroup}
          selectedNetworkGroupOnMediaUpload={selectedNetworkGroupOnMediaUpload}
          setIsUploading={this.setIsUploading}
          setSelectedNetworkGroupOnMediaUpload={setSelectedNetworkGroupOnMediaUpload}
          setUploadingFiles={this.setUploadingFiles}
          showOnSubmitErrors={showOnSubmitErrors}
          socialNetworkSelected={getSocialNetworkTypes()}
          uploadingFiles={uploadingFiles}
          onMediaAttachmentAreaEvent={onMediaAttachmentAreaEvent}
          publishingMode={publishingMode}
          isCanvaAccessAllowed={isCanvaAccessAllowed}
          isCanvaVisible={ComposerUtils.isBaseComposer(customContext)}
          onCanvaAddAttachment={onAddAttachment}
          onCanvaAttachmentEdited={onAttachmentEdited}
          onTrackCanvaEvent={event => track(ORIGIN, 'user_added_canva_to_post', event)}
          canvaApiKey={CANVA_API_KEY}
        />
        {this.renderVistaCreateWrapper()}
        {this.renderMediaSuggestions()}
        {this.props.validationError()}
      </>
    )
  }
}

export default compose(
  reduxConnect(({ composer, validation }: RootState) => ({
    isUploading: composer.isUploading,
    selectedNetworkGroup: composer.selectedNetworkGroup,
    showOnSubmitErrors: validation.showOnSubmitErrors,
    uploadingFiles: composer.uploadingFiles,
  })),
  connect(composerMessageStore, state => ({
    postType: getSelectedMessageValue(state, 'postType', false, undefined),
    publishingMode: getSelectedMessageValue(state, 'publishingMode', false, null),
  })),
)(MediaAttachmentArea)
