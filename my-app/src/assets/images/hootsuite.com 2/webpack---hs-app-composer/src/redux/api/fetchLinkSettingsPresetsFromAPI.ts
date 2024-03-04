import { getPresets } from 'fe-pnc-lib-api'

export const fetchLinkSettingsPresetsFromAPI = async (organizationId: string) => {
  try {
    const { presets } = await getPresets(organizationId)
    return presets
  } catch (error) {
    throw error
  }
}
