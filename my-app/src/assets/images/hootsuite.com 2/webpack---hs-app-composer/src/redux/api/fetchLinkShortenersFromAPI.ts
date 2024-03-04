import { getLinkShorteners } from 'fe-pnc-lib-api'

export const fetchLinkShortenersFromAPI = async (organizationId: string) => {
  try {
    const { shorteners } = await getLinkShorteners(organizationId)
    return shorteners
  } catch (error) {
    throw error
  }
}
