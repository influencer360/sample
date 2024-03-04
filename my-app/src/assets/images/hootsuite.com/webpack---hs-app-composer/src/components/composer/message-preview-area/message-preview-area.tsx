import React from 'react'
import { noop } from 'lodash'
import isEqual from 'lodash/isEqual'
import over from 'lodash/over'
import { connect as reduxConnect } from 'react-redux'

import { compose } from 'fe-hoc-compose'
import { connect } from 'fe-hoc-connect'
import MessagePreview from 'fe-pnc-comp-message-preview'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkType, InstagramPostType } from 'fe-pnc-constants-social-profiles'
import {
  getSelectedMessage,
  getSelectedMessageValue,
  store as composerMessageStore,
} from 'fe-pnc-data-composer-message'
import type { AttachmentObject } from 'fe-pnc-data-composer-message'
import { getStore as getMessagePreviewsStore } from 'fe-pnc-data-message-previews'
import type { PreviewsState, SanitizedMessage } from 'fe-pnc-data-message-previews'
import { store as productStore, setTaggingProfileId } from 'fe-pnc-data-products'
import type { ProductState, ProductTag } from 'fe-pnc-data-products'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'

import translation from 'fe-pnc-lib-hs-translation'
import { observeStore } from 'fe-pnc-lib-store-observer'
import Constants from '@/constants/constants'
import Message from '@/models/message'
import { composerActions } from '@/redux/reducers/composer'
import { AppDispatch, RootState } from '@/redux/store'
import ComposerUtils from '@/utils/composer-utils'
import MessageUtils from '@/utils/message-utils'
import ProductTaggingUtils from '@/utils/product-tagging-utils'
import FetchProductTags from '../../fetch/fetch-product-tags'
import {
  MessagePreviewAreaComp,
  PreviewArea,
  MessagePreviewContainer,
  Disclaimer,
  DisclaimerLink,
} from './message-preview-area.style'
import StatefulMessagePreviewFooter from './stateful-message-preview-footer'

// prettier-ignore
const PREVIEW_DISCLAIMER = translation._('Social networks regularly make updates to formatting, so your post may appear slightly different when published. ')
const PREVIEW_DISCLAIMER_LINK_TEXT = translation._('Learn more')
const SN_FORMATTING_DISCLAIMER = translation._('Social network formatting disclaimer')

const PINTEREST_PREVIEW_WIDTH = '255px'
const PORTRAIT_PREVIEW_WIDTH = 'auto'
const DEFAULT_PREVIEW_WIDTH = '100%'

const previewsHasSingleInstagramBusinessAccount = (previews: Array<SanitizedMessage>) =>
  previews.filter(
    preview => preview.socialProfile?.type === SocialProfileConstants.SN_TYPES.INSTAGRAMBUSINESS,
  ).length === 1

//Remove isPortraitPreview() with PUB_25109_MESSAGE_PREVIEW_WIDTH_REFACTOR
const isPortraitPreview = (type: SocialNetworkType, postType: InstagramPostType) => {
  const isTiktok = type === SocialProfileConstants.SN_TYPES.TIKTOKBUSINESS
  const isInstagramPortrait =
    SocialProfileConstants.SN_TYPE_TO_SN_GROUP[type] === SocialProfileConstants.SN_GROUP.INSTAGRAM &&
    (postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY ||
      ComposerUtils.isInstagramReel(postType))
  return isTiktok || isInstagramPortrait
}

//Remove getPreviewWidth() with PUB_25109_MESSAGE_PREVIEW_WIDTH_REFACTOR
const getPreviewWidth = (customContext: string, type: SocialNetworkType, postType: InstagramPostType) => {
  let previewWidth = DEFAULT_PREVIEW_WIDTH

  if (customContext) {
    if (ComposerUtils.isPinterestComposer(customContext)) {
      previewWidth = PINTEREST_PREVIEW_WIDTH
    }
  } else if (isFeatureEnabledOrBeta('PUB_27622_IG_REEL_PREVIEW')) {
    if (isPortraitPreview(type, postType)) {
      previewWidth = PORTRAIT_PREVIEW_WIDTH
    }
  } else if (type === SocialProfileConstants.SN_TYPES.TIKTOKBUSINESS) {
    previewWidth = PORTRAIT_PREVIEW_WIDTH
  }

  // We only want to set the width to Portrait if the preview we are showing is IG,
  // hence the need to check type as well as postType
  if (
    SocialProfileConstants.SN_TYPE_TO_SN_GROUP[type] === SocialProfileConstants.SN_GROUP.INSTAGRAM &&
    postType === SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_STORY
  ) {
    previewWidth = PORTRAIT_PREVIEW_WIDTH
  }

  return previewWidth
}

const getPreviewComponents = (state: MessagePreviewState, props: MessagePreviewAreaProps) => {
  const { previewMessages, publishingMode, postType, taggingProfileId } = state

  let previewMessagesToDisplay = previewMessages
  if (!props.isBulkComposer && !ComposerUtils.isPinterestComposer(props.customContext)) {
    previewMessagesToDisplay = previewMessages.filter(previewMessage =>
      MessageUtils.isNetworkTypeInGroup(previewMessage?.socialProfile?.type, props.selectedNetworkGroup),
    )
  }

  const previews = Array.isArray(previewMessagesToDisplay) ? previewMessagesToDisplay : []

  const messageForPreview =
    props.messageForPreview ||
    ({
      renderMessageText: () => {},
      attachments: [],
    } as Message)

  const message = messageForPreview.renderMessageText() || undefined
  const attachments = Array.isArray(messageForPreview.attachments)
    ? messageForPreview.attachments.map((a: AttachmentObject) => a.toRequestObject())
    : undefined

  const genericPreviews = previews.length === 0 ? [{ message, attachments }] : []

  return genericPreviews.concat(previews).map(previewMessage => {
    const i = genericPreviews.length === 1 ? 0 : previewMessages.indexOf(previewMessage)
    let customContext: string

    const socialProfile = previewMessage.socialProfile
    const hasSocialProfile = !!socialProfile
    const socialProfileId = socialProfile?.socialProfileId
    const type = socialProfile?.type

    let isProductTaggingEnabled = false
    let isTaggingMode = false

    const isDirectPublish = publishingMode === Constants.INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH
    const hasSingleInstagramBusinessAccount = previewsHasSingleInstagramBusinessAccount(previews)
    isProductTaggingEnabled =
      !!socialProfile?.productTaggingEnabled &&
      isDirectPublish &&
      !props.isBulkComposer &&
      hasSingleInstagramBusinessAccount
    isTaggingMode = taggingProfileId != null && taggingProfileId === socialProfileId

    const previewWidth = getPreviewWidth(customContext, type, postType) //Remove with PUB_25109_MESSAGE_PREVIEW_WIDTH_REFACTOR

    const getSelectedProductTags = currentAttachmentIndex =>
      ProductTaggingUtils.getProductTagsForGroup(
        props.selectedNetworkGroup,
        previewMessage.attachments,
        currentAttachmentIndex,
      )
    const getNumSelectedProductTagsPerPost = () => {
      let numSelectedProductTagsPerPost = 0
      previewMessage.attachments?.forEach((attachment, index) => {
        numSelectedProductTagsPerPost += getSelectedProductTags(index)?.length ?? 0
      })
      return numSelectedProductTagsPerPost
    }

    const onSelectProductTag = (productTag: ProductTag, currentAttachmentIndex) =>
      ProductTaggingUtils.selectProductTag(
        messageForPreview,
        productTag,
        props.selectedNetworkGroup,
        currentAttachmentIndex,
      )
    const onDeleteProductTag = (productId: string, currentAttachmentIndex) =>
      ProductTaggingUtils.deleteProductTag(
        messageForPreview,
        productId,
        props.selectedNetworkGroup,
        currentAttachmentIndex,
      )

    const handleTaggingModeToggle = () => {
      if (taggingProfileId) {
        setTaggingProfileId(null)
      } else {
        setTaggingProfileId(socialProfileId)
      }
    }

    const getPreviewAriaLabel = () => {
      const genericPostText = translation._('generic post')
      const previewText = translation._('preview')
      const postText = translation._('post')

      let previewPost = `${genericPostText}`
      if (props.selectedNetworkGroup) {
        previewPost = `${props.selectedNetworkGroup} ${postText}`
        if (props.selectedNetworkGroup === SocialProfileConstants.SN_GROUP.INSTAGRAM) {
          previewPost = `${
            props.selectedNetworkGroup
          } ${SocialProfileConstants.INSTAGRAM_POST_TYPES_TO_DISPLAY_TEXT[postType].toLowerCase()}`
        }
      }

      return `${previewPost} ${previewText}`
    }

    return (
      <MessagePreviewContainer
        key={socialProfileId ? `preview-${socialProfileId}-${i}` : `preview-generic-${i}`}
        aria-label={getPreviewAriaLabel()}
        data-testid="preview-container"
        role="region"
      >
        {isProductTaggingEnabled && (
          <FetchProductTags {...{ socialProfileId, isTaggingMode, messageId: messageForPreview?.id }} />
        )}
        <MessagePreview
          type={type}
          postType={postType}
          customContext={customContext}
          previewIndex={i}
          height="auto"
          width={previewWidth} //remove with PUB_25109_MESSAGE_PREVIEW_WIDTH_REFACTOR
          testid="composer-preview-text"
          productTagging={{
            onDeleteProductTag,
            onSelectProductTag,
            handleTaggingModeToggle,
            getSelectedProductTags,
            getNumSelectedProductTagsPerPost,
            showProductTaggingButton: isProductTaggingEnabled,
            taggingMode: isTaggingMode,
            showProductTags:
              !props.isBulkComposer &&
              state.publishingMode === Constants.INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH,
          }}
          isLight={false}
        />
        {hasSocialProfile ? (
          <StatefulMessagePreviewFooter
            ignoredPreviewValidationMessageCodes={props.ignoredPreviewValidationMessageCodes}
            isBulkComposer={props.isBulkComposer}
            onAddIgnoredPreviewValidationMessageCode={props.onAddIgnoredPreviewValidationMessageCode}
            socialProfileType={SocialProfileConstants.SN_TYPES[type]}
            previewIndex={i}
          />
        ) : null}
      </MessagePreviewContainer>
    )
  })
}

interface MessagePreviewAreaProps {
  customContext?: string
  dispatch: AppDispatch
  ignoredPreviewValidationMessageCodes?: Array<string>
  isDisabled?: boolean
  onAddIgnoredPreviewValidationMessageCode(code: number): void
  messageForPreview?: Message
  selectedNetworkGroup: string | null
  // Bulk Composer
  isBulkComposer?: boolean
  previewMessages?: Array<unknown>
}

interface MessagePreviewState {
  previewMessages: Array<SanitizedMessage>
  taggingProfileId: number | null
  publishingMode: string
  postType?: InstagramPostType | undefined
}

class MessagePreviewArea extends React.PureComponent<MessagePreviewAreaProps, MessagePreviewState> {
  observerUnsubscribe: Array<() => void>

  static displayName = 'MessagePreviewArea'

  static defaultProps = {
    ignoredPreviewValidationMessageCodes: [],
    selectedNetworkGroup: null,
  }

  constructor(props: MessagePreviewAreaProps) {
    super(props)

    this.observerUnsubscribe = [noop]

    const previewMessages = []
    // We should be able to remove the need to store the components in state with PNE;
    // this is just to be safe
    this.state = {
      previewMessages,
      taggingProfileId: null,
      publishingMode: Constants.INSTAGRAM_PUBLISHING_MODES.DIRECT_PUBLISH,
      postType: SocialProfileConstants.INSTAGRAM_POST_TYPES.IG_FEED,
    }
  }

  componentDidMount() {
    this.observerUnsubscribe = [
      observeStore(
        getMessagePreviewsStore(),
        (previewMessages: Array<SanitizedMessage>) => {
          if (Array.isArray(previewMessages)) {
            const haveSocialNetworksChanged = previewMessages.length !== this.state.previewMessages.length
            const haveProductsTagChanged = ProductTaggingUtils.haveProductTagsChanged(
              previewMessages,
              this.state.previewMessages,
            )
            const hasProductTags = ProductTaggingUtils.hasProductTags(previewMessages)

            if (haveSocialNetworksChanged || haveProductsTagChanged) {
              Promise.all(
                ProductTaggingUtils.formatPreviewsForProductTagging(
                  previewMessages,
                  this.state.previewMessages,
                ),
              ).then(previewMessages => {
                const productTaggingEnabled = previewMessages.some(
                  previewMessage => !!previewMessage.socialProfile?.productTaggingEnabled,
                )

                this.props.dispatch(
                  composerActions.setIsEligibleProductAccountSelected(productTaggingEnabled),
                )

                const hasSingleInstagramBusinessAccount =
                  previewsHasSingleInstagramBusinessAccount(previewMessages)
                if (
                  (!productTaggingEnabled || !hasSingleInstagramBusinessAccount) &&
                  haveSocialNetworksChanged &&
                  hasProductTags
                ) {
                  this.props.messageForPreview?.attachments.forEach((attachment, index) => {
                    ProductTaggingUtils.deleteAllProductTags(
                      this.props.messageForPreview,
                      this.props.selectedNetworkGroup,
                      index,
                    )
                  })
                }

                this.setState({
                  previewMessages,
                })
              })
            }
          }
        },
        (state: PreviewsState) => state.previewMessages,
        isEqual,
      ),
      observeStore(
        productStore,
        (taggingProfileId: number | null) => this.setState({ taggingProfileId }),
        (state: ProductState) => state.taggingProfileId,
      ),
      observeStore(
        composerMessageStore,
        (publishingMode: string) => this.setState({ publishingMode }),
        state => getSelectedMessageValue(state, 'publishingMode'),
      ),
      observeStore(
        composerMessageStore,
        (postType: InstagramPostType) => this.setState({ postType }),
        state => getSelectedMessageValue(state, 'postType'),
      ),
    ]
  }

  componentWillUnmount() {
    setTaggingProfileId(null)
    over(this.observerUnsubscribe)()
  }

  render() {
    if (
      this.props.isDisabled &&
      this.props.messageForPreview?.getSocialNetworkTypes()[0] !== SocialProfileConstants.SN_TYPES.PINTEREST
    ) {
      return (
        <MessagePreviewAreaComp>
          <PreviewArea />
        </MessagePreviewAreaComp>
      )
    } else {
      return (
        <MessagePreviewAreaComp>
          <PreviewArea>
            {getPreviewComponents(this.state, this.props)}
            <Disclaimer aria-label={SN_FORMATTING_DISCLAIMER}>
              {PREVIEW_DISCLAIMER}
              <DisclaimerLink
                href="https://help.hootsuite.com/hc/articles/1260804249890"
                rel="noopener noreferrer"
                target="_blank"
                role="link"
              >
                {PREVIEW_DISCLAIMER_LINK_TEXT}
              </DisclaimerLink>
            </Disclaimer>
          </PreviewArea>
        </MessagePreviewAreaComp>
      )
    }
  }
}

const ConnectedMessagePreview = compose(
  connect(composerMessageStore, state => ({
    messageForPreview: getSelectedMessage(state) as Message,
  })),
  reduxConnect(({ composer }: RootState) => ({
    selectedNetworkGroup: composer.selectedNetworkGroup,
  })),
)(MessagePreviewArea)

export default ConnectedMessagePreview
