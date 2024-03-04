import translation from 'fe-pnc-lib-hs-translation'
import { transformMessageWithVars } from 'fe-pnc-validation-error-messages'

// Remove this file with removal of PUB_30000_DEPRECATE_ERROR_SOURCES
const Messages = {
  get: function (code, vars) {
    let message = this.default

    if (this[code]) {
      message = this[code]
    }

    return transformMessageWithVars({ rawMessage: message, vars })
  },
  1003: translation._('Please select a social account.'),
  1005: translation._('Please schedule for a time 5 minutes into the future.'),
  1006: translation._('Your message text cannot be empty.'),
  1008: translation._('Your message is too long.'),
  1009: translation._('Your message text cannot be empty.'),
  1012: translation._('Your message cannot be empty.'),
  1017: translation._('Please schedule for a time 15 minutes into the future.'),
  1022: translation._('The post cannot be scheduled this close to the current time.'),
  1025: translation._('The post cannot be modified this close to its scheduled send time.'),
  2000: translation._("You don't have permission to post to this social account."),
  2002: translation._("You don't have permission to post to this social account."),
  3002: translation._('Twitter only supports up to 4 images.'),
  3003: translation._('An image must be posted to Instagram.'),
  3004: translation._('The media attached is unsupported.'),
  3005: translation._("There's something wrong with your Facebook post's privacy."),
  3012: translation._('Something went wrong with your media.'),
  3013: translation._('Something went wrong with your media.'),
  3020: translation._('The image you attached is not supported.'),
  3021: translation._('Your image is too large. (10 Mb max)'),
  3022: translation._('Something went wrong with your image.'),
  3023: translation._('Something went wrong with your image.'),
  3025: translation._('Something went wrong with your image.'),
  3026: translation._('Something went wrong with your image.'),
  3030: translation._('Something went wrong with your image.'),
  3031: translation._('The thumbnail file size is too large.'),
  3048: translation._('Your Instagram account requires a paired device.'),
  // prettier-ignore
  3059: translation._('Your link is not formatted correctly. Please check for proper spacing and a link prefix.'),
  3079: translation._('Something went wrong with your link preview.'),
  3087: translation._('Your Instagram account requires direct publishing to be set up.'),
  4101: translation._('The post cannot be found.'),
  4203: translation._('This post is a duplicate.'),
  4204: translation._('The social network is limiting your access, please try again later.'),
  4205: translation._('An error occurred with the social network, please try again.'),
  4206: translation._('You need to re-authorize this profile.'),
  4264: translation._('Post failed because the attached media was rejected by the social network.'),
  4265: translation._("Facebook doesn't recognize a url you supplied as valid."),
  5000: translation._('The post cannot be deleted in its current state.'),
  // Pinterest context errors
  400003: translation._('Pinterest requires a board to be selected.'),
  400004: translation._('Pinterest requires an image to be attached.'),
  700040: translation._('The selected board is not available for the given profile.'),
  // prettier-ignore
  700233: translation._('The selected image is too small for Pinterest. Please choose a larger image and try again.'),
  700234: translation._('Pinterest could not download your image at this time. Please try again later.'),
  700235: translation._('The selected image is broken. Please pick a different image.'),
  // prettier-ignore
  700237: translation._('The image file size is too big for Pinterest. Please choose a smaller file and try again.'),
  // prettier-ignore
  700263: translation._('The selected image is too large for Pinterest. Please choose a smaller image and try again.'),
  defaultFailureReason: translation._('An unexpected error occurred, please try again later.'),
  default: translation._('One or more of your posts failed to send.'),
}

export default Messages
