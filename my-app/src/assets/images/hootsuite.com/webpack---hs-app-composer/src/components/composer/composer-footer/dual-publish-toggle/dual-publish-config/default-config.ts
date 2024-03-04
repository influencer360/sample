import { emit } from 'fe-lib-hootbus'
import translation from 'fe-pnc-lib-hs-translation'
import Constants from '@/constants/constants'
import { importInstagramMobileSetup } from '@/utils/load-ig-mobile-setup'
import { track } from '@/utils/tracking'

const INSTAGRAM_PUBLISHING_MODES = Constants.INSTAGRAM_PUBLISHING_MODES
const DUAL_PUBLISH_SETUP_TRACKING = Constants.DUAL_PUBLISH_SETUP_TRACKING

const PUSH_PUBLISH_POPOVER_HEADING = translation._('Set up mobile notifications to publish with Instagram')
// prettier-ignore
const PUSH_PUBLISH_POPOVER_BODY = translation._(
  'Hootsuite sends your prepared story or post, including media, to your phone for you to publish via the Instagram app. To publish directly, you need an Instagram Business account connected to a Facebook Page.',
)
const DIRECT_PUBLISH_POPOVER_HEADING = translation._('Publish directly to Instagram')
// prettier-ignore
const DIRECT_PUBLISH_POPOVER_BODY = translation._('Connect this profile to your Facebook Page to publish your post directly to Instagram from Hootsuite.')

const directPublishingPopoverButtonAction = ({ profile }) => {
  // The reauth modal expects a different property name for the profile id
  profile.socialNetworkId = profile.socialProfileId
  track(
    DUAL_PUBLISH_SETUP_TRACKING.TRACKING_ORIGIN,
    DUAL_PUBLISH_SETUP_TRACKING.TRACKING_ACTIONS.DIRECT_PUBLISH_SETUP.CLICKED,
    { profileData: profile },
  )
  emit('socialNetwork:reauthorize:command', profile, { permissionRequest: null, authType: 'rerequest' })
}

const pushPublishingPopoverButtonAction = ({ profile }) => {
  track(
    DUAL_PUBLISH_SETUP_TRACKING.TRACKING_ORIGIN,
    DUAL_PUBLISH_SETUP_TRACKING.TRACKING_ACTIONS.PUSH_PUBLISH_SETUP.CLICKED,
    { profileData: profile },
  )
  importInstagramMobileSetup(profile.socialProfileId)
}

export default () => ({
  defaultToggleBtn: INSTAGRAM_PUBLISHING_MODES.PUSH_PUBLISH,
  popovers: {
    pushPublish: {
      heading: PUSH_PUBLISH_POPOVER_HEADING,
      body: PUSH_PUBLISH_POPOVER_BODY,
      onClickAction: pushPublishingPopoverButtonAction,
    },
    directPublish: {
      heading: DIRECT_PUBLISH_POPOVER_HEADING,
      body: DIRECT_PUBLISH_POPOVER_BODY,
      onClickAction: directPublishingPopoverButtonAction,
    },
  },
})
