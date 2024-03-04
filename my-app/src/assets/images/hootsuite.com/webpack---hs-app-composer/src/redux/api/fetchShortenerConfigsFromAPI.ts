import { getShortenerConfigs } from 'fe-pnc-lib-api'
export const fetchShortenerConfigsFromAPI = async (organizationId: string) => {
  try {
    const { shortenerConfigs } = await getShortenerConfigs(organizationId)
    return shortenerConfigs
  } catch (error) {
    throw error
  }
}
