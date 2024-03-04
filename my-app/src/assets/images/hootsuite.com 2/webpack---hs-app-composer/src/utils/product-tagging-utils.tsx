import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import { logError } from 'fe-lib-logging'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import type { SocialNetworkGroup } from 'fe-pnc-constants-social-profiles'
import type { AttachmentObject, ProductTagsByNetwork } from 'fe-pnc-data-composer-message'
import { actions as ComposerMessageActions } from 'fe-pnc-data-composer-message'
import type { SanitizedAttachment, SanitizedMessage } from 'fe-pnc-data-message-previews'
import type { ProductTag, ProductTags } from 'fe-pnc-data-products'
import { getProductTaggingEligibility } from 'fe-pnc-lib-api'
import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import Constants from '@/constants/constants'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import Message from '@/models/message'
import MessageUtils from '@/utils/message-utils'

const ProductTaggingUtils = {
  /**
   * @param previews
   * @returns A list of social profile IDs with product tagging enabled
   */
  getSocialProfileIdsWithProductTaggingEnabled: (previews: Array<SanitizedMessage> = []): Array<number> => {
    return previews
      .filter(preview => preview.socialProfile?.productTaggingEnabled)
      .map(preview => {
        return preview.socialProfile?.socialProfileId
      })
  },

  /**
   * @param previews
   * @param existingPreviews
   * @returns A list of previews formatted for Product Tagging
   */
  formatPreviewsForProductTagging: (
    previews: Array<SanitizedMessage>,
    existingPreviews: Array<SanitizedMessage> = [],
  ): Array<SanitizedMessage> => {
    const foundEligibleInstagramBusinessAccount = existingPreviews.some(
      ({ socialProfile }) => socialProfile?.productTaggingEnabled,
    )

    return previews.map(({ socialProfile, ...rest }, index) => {
      const previewIneligibleForTagging =
        !socialProfile ||
        foundEligibleInstagramBusinessAccount ||
        socialProfile?.type !== SocialProfileConstants.SN_TYPES.INSTAGRAMBUSINESS

      if (previewIneligibleForTagging) {
        const preview = existingPreviews.find(existingPreview => {
          return (
            socialProfile?.socialProfileId &&
            existingPreview?.socialProfile?.socialProfileId &&
            existingPreview?.socialProfile?.socialProfileId === socialProfile.socialProfileId
          )
        })
        const productTaggingEnabled = preview
          ? preview.socialProfile?.productTaggingEnabled
          : existingPreviews[index]?.socialProfile?.productTaggingEnabled

        return Promise.resolve({
          socialProfile: {
            productTaggingEnabled,
            ...socialProfile,
          },
          ...rest,
        })
      }

      return getProductTaggingEligibility(socialProfile.socialProfileId)
        .then(({ isEligible }) => ({
          socialProfile: {
            productTaggingEnabled: isEligible,
            ...socialProfile,
          },
          ...rest,
        }))
        .catch(() => Promise.resolve({ socialProfile, ...rest }))
    })
  },

  /**
   * @param selectedNetworkGroup The network group (only INSTAGRAM support tagging at present)
   * @param attachments An array of attachents on the preview
   * @param index The index of the attachment. Defaults to 0
   * @returns An new array containing product tags on the Attachment for the given group
   */
  getProductTagsForGroup: (
    selectedNetworkGroup: SocialNetworkGroup,
    attachments?: Array<AttachmentObject | SanitizedAttachment>,
    index = 0,
  ): ProductTags | undefined => {
    if (!attachments?.length) {
      return
    }
    const selectedAttachment: AttachmentObject | SanitizedAttachment = attachments[index]

    if (!selectedAttachment) {
      logError(
        LOGGING_CATEGORIES.NEW_COMPOSER,
        `Could not select product tags for index ${index}, message has ${attachments.length} attachments`,
      )
      return
    }

    const selectedProductTags: ProductTagsByNetwork = selectedAttachment.productTags
      ? selectedAttachment.productTags
      : {}
    return selectedProductTags[selectedNetworkGroup]
  },

  /**
   * @param productTags An array of product tags
   * @param productId The ID of the product to find
   * @returns The index of the product with the given productId, or -1 if not found
   */
  findProductIndex: (productTags: ProductTags, productId: string): number => {
    if (!productTags) {
      return -1
    }
    return productTags?.findIndex(productTag => productTag.productId === productId)
  },

  /**
   * Updates the Product Tags on the Composer message
   * @param message The Composer Message to update
   * @param productTags The product tags
   * @param selectedNetworkGroup The network group of the product tags (only Instagram is supported at present)
   * @param index The index of the attachment. Defaults to 0
   */
  updateAttachmentProductTags: (
    message: Message,
    productTags: ProductTags,
    selectedNetworkGroup: SocialNetworkGroup,
    index = 0,
  ): void => {
    const updatedProductAttachments = message.attachments.map((attachment, i) => {
      if (i === index) {
        const updatedAttachment: AttachmentObject = attachment.clone()
        const updatedProductTags = {
          ...updatedAttachment.productTags,
          [selectedNetworkGroup]: productTags,
        }
        if (!productTags || !productTags.length) {
          delete updatedProductTags[selectedNetworkGroup]
        }
        updatedAttachment.productTags = !isEmpty(updatedProductTags) ? updatedProductTags : null
        return updatedAttachment
      }
      return attachment
    })
    ComposerMessageActions.updateFieldById(
      message.id,
      Constants.FIELD_TO_UPDATE.ATTACHMENTS,
      updatedProductAttachments,
    )
  },

  /**
   * Selects a Product Tag on the Message
   * @param message The Composer Message to update
   * @param productTag The product tag to select
   * @param selectedNetworkGroup The network group of the product tags (only Instagram is supported at present)
   * @param index The index of the attachment. Defaults to 0
   */
  selectProductTag: (
    message: Message,
    productTag: ProductTag,
    selectedNetworkGroup: SocialNetworkGroup,
    index = 0,
  ): void => {
    try {
      const innerMessagesByGroup = MessageUtils.getInnerMessagesByGroup(message?.messages)

      const selectedProductTags = ProductTaggingUtils.getProductTagsForGroup(
        selectedNetworkGroup,
        isFeatureEnabled('PUB_27685_PRODUCT_TAGGING_MULTIPLE_SNS')
          ? innerMessagesByGroup[selectedNetworkGroup].attachments
          : message.attachments,
        index,
      )
      const productTagIndex = ProductTaggingUtils.findProductIndex(selectedProductTags, productTag.productId)
      if (productTagIndex >= 0) {
        throw new Error(`Product with ID ${productTag.productId} has already been selected`)
      }
      const updatedProductTags = [...(selectedProductTags || []), productTag]
      ProductTaggingUtils.updateAttachmentProductTags(
        message,
        updatedProductTags,
        selectedNetworkGroup,
        index,
      )
    } catch (e) {
      logError(
        LOGGING_CATEGORIES.NEW_COMPOSER,
        `Could not select product tag`,
        e instanceof Error && {
          errorMessage: e.message,
          stack: e.stack,
        },
      )
    }
  },

  /**
   * Deletes a Product Tag if it has previously been selected on the Message
   * @param message The Composer Message to update
   * @param productId The ID of the product to delete
   * @param selectedNetworkGroup The network group of the product tags (only Instagram is supported at present)
   * @param index The index of the attachment. Defaults to 0
   */
  deleteProductTag: (
    message: Message,
    productId: string,
    selectedNetworkGroup: SocialNetworkGroup,
    index = 0,
  ): void => {
    try {
      const innerMessagesByGroup = MessageUtils.getInnerMessagesByGroup(message?.messages)

      const selectedProductTags = ProductTaggingUtils.getProductTagsForGroup(
        selectedNetworkGroup,
        isFeatureEnabled('PUB_27685_PRODUCT_TAGGING_MULTIPLE_SNS')
          ? innerMessagesByGroup[selectedNetworkGroup].attachments
          : message.attachments,
        index,
      )
      const productTagIndex = ProductTaggingUtils.findProductIndex(selectedProductTags || [], productId)
      if (productTagIndex < 0) {
        throw new Error(`Product with ID ${productId} has not been selected`)
      }
      const updatedProductTags = [...selectedProductTags]
      updatedProductTags.splice(productTagIndex, 1)
      ProductTaggingUtils.updateAttachmentProductTags(
        message,
        updatedProductTags,
        selectedNetworkGroup,
        index,
      )
    } catch (e) {
      logError(
        LOGGING_CATEGORIES.NEW_COMPOSER,
        `Could not delete product tag`,
        e instanceof Error && {
          errorMessage: e.message,
          stack: e.stack,
        },
      )
    }
  },

  /**
   * Deletes all Product Tags previously selected on the Message
   * @param message The Composer Message to update
   * @param selectedNetworkGroup The network group of the product tags (only Instagram is supported at present)
   * @param index The index of the attachment. Defaults to 0
   */
  deleteAllProductTags: (message: Message, selectedNetworkGroup: SocialNetworkGroup, index = 0): void => {
    ProductTaggingUtils.updateAttachmentProductTags(message, null, selectedNetworkGroup, index)
  },

  getProductTagsFromPreviews: (previews: SanitizedMessage[]) => {
    return cloneDeep(previews)
      .filter(preview => preview?.attachments && preview?.attachments.length > 0)
      .map(preview => preview.attachments.map(attachment => attachment?.productTags))
  },
  haveProductTagsChanged: (
    previews: Array<SanitizedMessage>,
    existingPreviews: Array<SanitizedMessage> = [],
  ) => {
    const productTags = ProductTaggingUtils.getProductTagsFromPreviews(previews)
    const existingProductTags = ProductTaggingUtils.getProductTagsFromPreviews(existingPreviews)
    return !isEqual(productTags, existingProductTags)
  },

  /**
   * Check if any product tags exist in current message attachments.
   * @param previewMessages Message data provided for preview in Composer.
   * @return boolean
   */
  hasProductTags: (previewMessages: SanitizedMessage[]) => {
    return (
      ProductTaggingUtils.getProductTagsFromPreviews(previewMessages).filter(
        item => item.filter(Boolean).length > 0,
      ).length > 0
    )
  },
}

export default ProductTaggingUtils
