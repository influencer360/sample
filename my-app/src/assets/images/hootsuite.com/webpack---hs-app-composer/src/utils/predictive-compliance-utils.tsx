import { OrderedMap } from 'immutable'
import { APPROVED, IN_PROGRESS, PENDING, REJECTED, WARNING } from 'fe-pnc-data-predictive-compliance'
import constants from '@/constants/constants'
import { OwnerType } from '@/typings/Constants'
import { SocialNetworksKeyedById } from '@/typings/SocialNetwork'

const isInProgress = status => status === IN_PROGRESS
const isWarningState = status => status === WARNING
const isPendingState = status => status === PENDING
const isApprovedState = status => status === APPROVED
const isRejectedState = status => status === REJECTED

const PredictiveComplianceUtils = {
  getState(status) {
    return {
      isInProgress: isInProgress(status),
      isWarning: isWarningState(status),
      isPending: isPendingState(status),
      isApproved: isApprovedState(status),
      isRejected: isRejectedState(status),
    }
  },
  parseInputs(inputs) {
    const { urlPreview, text, organizationId } = inputs
    let link = ''
    if (urlPreview) {
      const { url } = urlPreview
      link = url && url.length > 0 ? url : ''
    }

    // if no text, but a link exists, set the content text to the link text to avoid proofpoint failure
    const content =
      ((typeof text === 'string' && text.length === 0) || !text) && link.length > 0 ? link : text

    return { link, content, organizationId }
  },
  getSocialNetworksOwnerTypes(
    socialNetworksKeyedById: SocialNetworksKeyedById = OrderedMap(),
  ): Array<OwnerType> {
    return socialNetworksKeyedById
      .map(sn => (sn?.ownerType as OwnerType) || constants.OWNER_TYPE.UNKNOWN)
      .toArray()
  },
  getIsAllOwnerTypesPrivate(socialNetworksKeyedById: SocialNetworksKeyedById): boolean {
    return this.getSocialNetworksOwnerTypes(socialNetworksKeyedById).every(
      ownerType => ownerType === constants.OWNER_TYPE.MEMBER,
    )
  },
}

export default PredictiveComplianceUtils
