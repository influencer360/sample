/**
 * @format
 * @preventMunge
 */

import _ from 'underscore'
import cloneDeep from 'lodash.clonedeep'

// hs-nest constants
import OrganizationPermissions from 'hs-nest/lib/constants/organization-permissions'

// Models
import Campaign from '../models/campaign'

// Constants
import CampaignConstants from '../constants/campaigns'

const CampaignUtils = {
  /**
   * Transforms a create campaign response into something usable by the front end model
   *
   * @param {{}} response
   * @param {{}} settingsData
   * @return {Campaign}
   */
  createCampaignResponseToCampaign(response, settingsData) {
    const data = cloneDeep(response)

    const presetSetting = _.find(
      data.settings,
      setting => setting.settingType === CampaignConstants.SETTING_TYPES.LINK,
    )
    if (presetSetting) {
      data.preset = _.find(settingsData.presets, preset => preset.id.toString() === presetSetting.reference)
    }
    const tags = _.filter(
      data.settings,
      setting => setting.settingType === CampaignConstants.SETTING_TYPES.TAG,
    )
    if (tags.length) {
      data.tags = _.filter(settingsData.tags, tag => _.find(tags, t => t.reference === tag.id.toString()))
    }
    delete data.settings

    return new Campaign(data)
  },

  /**
   * @param {{}} organization
   * @return {Boolean} Returns whether the user has permissions to manage campaigns
   */
  canManageOrg(organization) {
    return (
      !!organization.permissions &&
      (organization.permissions[OrganizationPermissions.ORG_MANAGE_MEMBER] ||
        organization.permissions[OrganizationPermissions.ORG_MANAGE_TEAM] ||
        organization.permissions[OrganizationPermissions.ORG_MANAGE_SOCIAL_NETWORK] ||
        organization.permissions[OrganizationPermissions.ORG_ADD_SOCIAL_NETWORK] ||
        organization.permissions[OrganizationPermissions.ORG_REMOVE_SOCIAL_NETWORK])
    )
  },
}

export default CampaignUtils
