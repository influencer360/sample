/** @format */

import { List } from 'immutable'
import cloneDeep from 'lodash.clonedeep'
import CampaignConstants from '../constants/campaigns'
const wisdom = require('hs-nest/lib/utils/wisdom')

class CampaignsStore extends wisdom.Store {
  constructor(flux) {
    super()
    const campaignsActionIds = flux.getActionIds('campaigns')

    this.register(campaignsActionIds.addCampaign, this._addCampaign)
    this.register(campaignsActionIds.setCampaigns, this._setCampaigns)
    this.register(campaignsActionIds.updateCampaign, this._updateCampaign)

    this.state = {
      campaigns: List(),
    }
  }

  /**
   * Sorts the campaigns by state and id with in state
   * @param {List<Campaign>} campaigns
   * @return {List<Campaign>}
   */
  _sortCampaigns(campaigns) {
    return campaigns
      .groupBy(c => c.state)
      .sort(
        (
          listA,
          listB, // order these groups by state
        ) =>
          CampaignConstants.STATE_ORDER[listA.first().state] -
          CampaignConstants.STATE_ORDER[listB.first().state],
      )
      .reduce((acc, list) => acc.concat(list.sortBy(item => Number(item.id))), List()) // sort each individual list and combine them all
  }

  /**
   * Clones the given campaigns before storing them
   * @param {Campaign[]} campaigns
   */
  _setCampaigns(campaigns) {
    const newCampaigns = List(cloneDeep(campaigns))
    this.setState({ campaigns: this._sortCampaigns(newCampaigns) })
  }

  /**
   * @param {Campaign} campaign
   */
  _addCampaign(campaign) {
    const updatedCampaigns = this.state.campaigns.push(campaign)
    this.setState({ campaigns: this._sortCampaigns(updatedCampaigns) })
  }

  /**
   * @param {Campaign} campaign
   */
  _updateCampaign(campaign) {
    const updatedCampaigns = this.state.campaigns.map(c => {
      return c.id === campaign.id ? campaign : c
    })
    this.setState({ campaigns: this._sortCampaigns(updatedCampaigns) })
  }

  /**
   * Get all campaigns
   * @returns {List<Campaign>}
   */
  get() {
    return this.state.campaigns
  }

  /**
   * Get all active campaigns
   * @returns {List<Campaign>}
   */
  getActive() {
    return this.state.campaigns.filter(c => c.state === CampaignConstants.STATE.ACTIVE)
  }
}

export default CampaignsStore
