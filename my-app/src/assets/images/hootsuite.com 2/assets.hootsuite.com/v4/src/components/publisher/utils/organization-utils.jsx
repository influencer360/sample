import _ from 'underscore'
import { setOrganizations as setOrgs } from 'fe-pnc-data-organizations'
import utilStatic from 'hs-nest/lib/utils/static-assets'

export const setOrganizations = organizations => {
    if (organizations) {
        const updatedOrganizations = []
        _.each(organizations, organization => {
            updatedOrganizations.push({
                ...organization,
                showTitle: 'showTitle',
                logo: utilStatic.getOrganizationLogo(organization.logo),
            })
        })
        if (updatedOrganizations.length) {
            // Populate the fe-pnc-data-organizations store with the organizations data
            setOrgs(updatedOrganizations)
        }
    }
}

export const getSortedByOwner = (organizations, memberId) => {
    const result = []
    _.each(organizations, org => {
        if (memberId === org.paymentMemberId) {
            result.unshift(org)
        } else {
            result.push(org)
        }
    })
    return result
}
