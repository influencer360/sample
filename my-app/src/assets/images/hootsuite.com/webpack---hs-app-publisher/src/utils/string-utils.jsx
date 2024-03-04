/** @format */
import Constants from '../constants/constants'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import _ from 'underscore'
import twitterText from 'twitter-text'
import darklaunch from 'hs-nest/lib/utils/darklaunch'

const { SN_TYPES } = SocialProfileConstants

const StringUtils = {
  /**
   * Helper function to escape certain characters with HTML entity encoding
   * to protect from cross site scripting
   * @param {String} str
   * @return {String}
   */
  sanitizeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\//g, '&#47;')
  },
  /**
   * linkifies urls, with the option of adding the preview [+] icon
   * @param {string} str
   * @return {string}
   */
  makeUrlClickable(str) {
    if (typeof str !== 'string') return ''

    const urls = str.match(Constants.URL_REGEX) || []
    // add a underscore unique so duplicate urls in the array are eliminated
    return _.reduce(
      _.uniq(urls),
      function (urlStr, url) {
        const urlRegex = new RegExp('\\b' + url.replace(/\+/g, '\\+').replace(/\?/g, '\\?') + '\\b', 'g')
        // Find the regex url and replace it with a formed html anchor (replace $1 and $2 with the proper url, add a preview plus button if applicable)
        return urlStr.replace(urlRegex, String(Constants.LINK_TEMPLATE).replace(/(\$2|\$1)/g, url))
      },
      str,
    )
  },
  /**
   * linkifies Instagram usernames
   * @param {string} str
   * @param {string} snType
   * @return {string}
   */
  makeUsernameClickable(str, snType = '') {
    let reUser = /@([\w\d_]+)/g
    let linkifiedUser = ''
    switch (String(snType).toUpperCase()) {
      case SN_TYPES.INSTAGRAM:
      case SN_TYPES.INSTAGRAMBUSINESS:
        reUser = /@([\w\d_.]+)/g
        linkifiedUser = str.replace(
          reUser,
          "@<span class='-usernameLink x-instagram'><button class='_userInfoPopup _instagram' title='$1'>$1</button></span>",
        )
        break
      case SN_TYPES.TWITTER:
        if (darklaunch.isFeatureDisabled('PUB_30451_DISABLE_TWITTER_MENTIONS_SEARCH')) {
          linkifiedUser = str.replace(
            reUser,
            "@<button class='_userInfoPopup _twitter' title='$1'>$1</button>",
          )
          break
        }
      default:
        linkifiedUser = str // only instagram uses @ for mentions
        break
    }
    return linkifiedUser
  },
  /**
   * linkifies twitter hashtags
   * @param {string} str
   * @return {string}
   */
  makeHashClickable(str) {
    // character class special chars (escpae these): ^-]\
    const reHash = /(\s|^|:|\.|,)(#)([^!@#$%^&*()|\-+=\\[\]"':;,.?<>/\s]+)/g
    return str.replace(reHash, '$1<button class="_quickSearchPopup hash" title="$3">$2$3</button>')
  },
  /**
   * Finds and replaces instances of links and likifies them
   * @param {string} str
   * @return {string}
   */
  makeNonHttpUrlClickable(str) {
    if (typeof str !== 'string') return ''

    const urls = twitterText.extractUrlsWithIndices(str).filter(function (u) {
      return u.url.match(Constants.HTTP_REGEX) === null // return all URLs that do not start with http
    })

    return _.reduce(
      urls.reverse(),
      function (s, u) {
        const link = Constants.LINK_TEMPLATE.replace('$2', u.url).replace('$1', 'http://' + u.url)
        return s.slice(0, u.indices[0]) + link + s.slice(u.indices[1])
      },
      str,
    )
  },
}

export default StringUtils
