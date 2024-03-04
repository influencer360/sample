import React, { useEffect } from 'react'

import { isFeatureEnabled } from 'fe-pnc-lib-darklaunch'
import { fetchLinkSettingsPresets, fetchLinkShorteners, fetchShortenerConfigs } from '@/redux/actions'
import { store as ComposerSingleStore } from '@/redux/store'

interface FetchLinkSettingsProps {
  organizationId: number
}

const FetchLinkSettings: React.FunctionComponent<FetchLinkSettingsProps> = ({ organizationId = '' }) => {
  // Select the node that will be observed for mutations

  const linkSettingsManager = document.getElementById('linkSettingsManagementAreaMountPoint')

  useEffect(() => {
    if (!isFeatureEnabled('PUB_30814_LINK_PRESETS_USE_REDUX')) {
      return null
    }
    const handleObserve = records => {
      // We watch for "linkSettingsManager". As soon as it outmounts we rehydrate linkSettingPresets
      if (records?.[0]?.removedNodes?.length > 0) {
        ComposerSingleStore.dispatch(fetchLinkSettingsPresets(organizationId))
      }
    }

    const config = { childList: true }
    const observer = new MutationObserver(records => {
      handleObserve(records)
    })

    if (observer && linkSettingsManager) {
      observer.observe(linkSettingsManager, config)

      return () => {
        observer.disconnect()
      }
    }
  }, [linkSettingsManager])

  useEffect(() => {
    if (!isFeatureEnabled('PUB_30814_LINK_PRESETS_USE_REDUX')) {
      return null
    }
    if (organizationId) {
      ComposerSingleStore.dispatch(fetchLinkSettingsPresets(organizationId))
      ComposerSingleStore.dispatch(fetchLinkShorteners(organizationId))
      ComposerSingleStore.dispatch(fetchShortenerConfigs(organizationId))
    }
  }, [organizationId])

  return null
}

export default FetchLinkSettings
