import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'

const hasPushPublishing = instagramProfile =>
  instagramProfile &&
  Array.isArray(instagramProfile.networkSubscriptions) &&
  instagramProfile.networkSubscriptions.includes(
    SocialProfileConstants.NETWORK_SUBSCRIPTION_STATUSES.NETWORK_SUBSCRIPTION,
  )

export default hasPushPublishing
