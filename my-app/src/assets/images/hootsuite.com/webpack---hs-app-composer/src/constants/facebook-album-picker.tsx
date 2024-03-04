import translation from 'fe-pnc-lib-hs-translation'

const STATIC_ALBUM_OPTIONS = {
  TIMELINE_PHOTOS: translation._('Timeline Photos'),
  FACEBOOK_ALBUM_GROUP_FEED: translation._('Group Feed'),
  FACEBOOK_ALBUM_DEFAULT: translation._('Default album'),
  FACEBOOK_NO_SELECTION: translation._('Select an album'),
}

const ALBUM_TYPES = {
  WALL: 'wall',
  NORMAL: 'normal',
  APP: 'app',
}

export default {
  STATIC_ALBUM_OPTIONS,
  ALBUM_TYPES,
}
