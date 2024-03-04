/** @format */

const Constants = {}

Constants.VIEW = {
  CREATE: 'CREATE',
  MANAGE: 'MANAGE',
}

Constants.DROPDOWN_SELECTOR = {
  NO_CAMPAIGN: 'NO_CAMPAIGN',
}

Constants.SETTING_TYPES = {
  LINK: 'Link',
  TAG: 'Tag',
}

Constants.MAX_CHARACTER_NAME_LIMIT = 150

Constants.MAX_CHARACTER_DESCRIPTION_LIMIT = 200

Constants.MODE = {
  CREATE: 'CREATE',
  EDIT: 'EDIT',
}

Constants.EVENTS = {
  CAMPAIGNS_CLOSED: 'campaigns.app.closed',
}

Constants.STATE = {
  ARCHIVED: 'Archived',
  ACTIVE: 'Active',
  EXPIRED: 'Expired',
}

Constants.STATE_ORDER = {}
Constants.STATE_ORDER[Constants.STATE.ARCHIVED] = 3
Constants.STATE_ORDER[Constants.STATE.EXPIRED] = 2
Constants.STATE_ORDER[Constants.STATE.ACTIVE] = 1

export default Constants
