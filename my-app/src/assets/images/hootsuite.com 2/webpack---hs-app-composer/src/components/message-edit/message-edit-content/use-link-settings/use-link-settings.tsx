import differenceWith from 'lodash/differenceWith'

import { getSelectedMessage, store as composerMessageStore } from 'fe-pnc-data-composer-message'
import { isFeatureEnabledOrBeta } from 'fe-pnc-lib-darklaunch'
import { useStoreValue } from 'fe-pnc-lib-hooks'
import { LinkSettingsUtils } from 'fe-pnc-lib-utils'
import MessageUtils from '@/utils/message-utils'

export const areLinkSettingsEqual = (linkSettingsA, linkSettingsB) => {
  return (
    linkSettingsA.length === linkSettingsB.length &&
    differenceWith(
      linkSettingsA,
      linkSettingsB,
      (A, B) => A.url === B.url && LinkSettingsUtils.linkDiff(A, B).length === 0,
    ).length === 0
  )
}

const useLinkSettings = () => {
  const message = useStoreValue(composerMessageStore, getSelectedMessage, (msg1, msg2) => {
    const nextCampaignId = msg2 && msg2.campaignId
    const campaignId = msg1 && msg1.campaignId
    const nextLinks = (msg2 && msg2.linkSettings) || []
    const currentLinks = (msg1 && msg1.linkSettings) || []

    const didSelectedCampaignIdChange = nextCampaignId !== campaignId
    const didLinkSettingsChange = !areLinkSettingsEqual(nextLinks, currentLinks)

    return !didSelectedCampaignIdChange && !didLinkSettingsChange
  })

  let selectedMessage
  if (isFeatureEnabledOrBeta('PUB_30706_LINK_SETTINGS_PNE')) {
    selectedMessage =
      message?.selectedNetworkGroup && message.messages?.length > 1
        ? MessageUtils.getInnerMessageFromGroup(message.messages, message.selectedNetworkGroup)
        : message?.baseMessage
  } else {
    selectedMessage = message
  }

  return selectedMessage
    ? {
        linkSettings: selectedMessage.linkSettings,
        selectedPreset: selectedMessage.linkSettingsPresetId,
      }
    : {
        linkSettings: [],
        selectedPreset: null,
      }
}

export default useLinkSettings
