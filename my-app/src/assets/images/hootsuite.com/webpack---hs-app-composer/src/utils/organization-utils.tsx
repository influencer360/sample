import { envValue } from './env-utils'

const STATIC_CF_DIST_BUCKET_SSL = 'https://assets.hootsuite.com'
export const IMG_ICON_AVATAR_ORG = 'https://i.hootsuite.com/assets/plancreate/icon-avatar-org.png'

/**
 * Returns the URL for organization's logo
 *
 * @param {String} [url] the url of the logo
 * @returns {String}
 */
const getOrganizationLogoSrc = url => {
  if (url) {
    const avatarFolder = envValue('avatars_production', 'avatars_staging', 'avatars_dev', '')

    return avatarFolder
      ? `${STATIC_CF_DIST_BUCKET_SSL}/${avatarFolder}/organization/${encodeURIComponent(url)}`
      : IMG_ICON_AVATAR_ORG
  }
  return IMG_ICON_AVATAR_ORG
}

export { getOrganizationLogoSrc }
