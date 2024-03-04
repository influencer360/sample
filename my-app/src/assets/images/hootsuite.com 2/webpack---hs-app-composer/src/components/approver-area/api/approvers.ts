import { env } from 'fe-lib-env'
import { logError } from 'fe-lib-logging'
import { getPermittedMembersBySnIds } from 'fe-pnc-lib-api'

import LOGGING_CATEGORIES from '@/constants/logging-categories'
import { Approver } from '@/typings/Approver'

const getAvatarCDNUrl = (location: string) => {
  if (location.startsWith('https://') || location.startsWith('http://')) {
    return location
  }

  const base = `https://assets.hootsuite.com/avatars_${env()}/member/`
  return base + location
}

const fetchApproversBySnIds = async (socialProfileIds: Array<number>): Promise<Array<Approver>> => {
  const rawApprovers = []
  let currentPage = 1
  let totalPages = 1
  let approvers = []

  try {
    // Fetch complete data by pagination
    while (currentPage <= totalPages) {
      const response = await getPermittedMembersBySnIds(socialProfileIds, currentPage++)
      const { pagination, members, orgAdmins } = response
      rawApprovers.push(...Object.values(members), ...Object.values(orgAdmins))
      if (pagination?.totalPages && pagination.totalPages !== totalPages) {
        totalPages = pagination.totalPages
      }
    }

    // Remove duplicates - some members may also be admins
    const uniqueApprovers = rawApprovers.filter((member, index) => {
      return index === rawApprovers.findIndex(m => m.memberId === member.memberId)
    })

    // Sort alphabetically by fullName
    uniqueApprovers.sort((a, b) => a.fullName.localeCompare(b.fullName))

    // Transform member data strucure to be rendered by ListItem
    approvers = uniqueApprovers.map(member => ({
      memberId: member.memberId,
      title: member.fullName,
      image: {
        src: member.avatar ? getAvatarCDNUrl(member.avatar) : '',
      },
    }))
  } catch (e) {
    logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed to fetch flexible approvers', {
      errorMessage: JSON.stringify(e.message),
      stack: JSON.stringify(e.stack),
    })
  } finally {
    return approvers
  }
}

export { fetchApproversBySnIds }
