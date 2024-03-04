/** @format */

const wisdom = require('hs-nest/lib/utils/wisdom')

class CampaignsActions extends wisdom.Actions {
  /**
   * Sets the array of campaigns
   * @param {Campaign[]} campaigns
   * @returns {Campaign[]}
   */
  setCampaigns(campaigns) {
    return campaigns
  }

  /**
   * Add campaign
   * @param {Campaign} campaign
   * @returns {Campaign}
   */
  addCampaign(campaign) {
    return campaign
  }

  /**
   * Update campaign
   * @param {Campaign} campaign
   * @returns {Campaign}
   */
  updateCampaign(campaign) {
    return campaign
  }
}

export default CampaignsActions
