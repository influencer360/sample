import React from 'react'
import styled from 'styled-components'
import { Banner, TYPE_INFO } from 'fe-comp-banner'
import { withHsTheme, getThemeValue } from 'fe-lib-theme'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import translation from 'fe-pnc-lib-hs-translation'

const LinkCustomizationNotAvailableInfoBannerContainer = withHsTheme(styled.div`
  margin-bottom: ${() => getThemeValue(t => t.spacing.spacing20)};
`)
LinkCustomizationNotAvailableInfoBannerContainer.displayName =
  'LinkCustomizationNotAvailableInfoBannerContainer'

interface Props {
  selectedNetworkGroup: string
}

const LinkCustomizationNotAvailableInfoBanner = ({ selectedNetworkGroup }: Props) => {
  const snGroupName = SocialProfileConstants.SN_GROUP_TO_DISPLAY_NAME[selectedNetworkGroup]
  const CUSTOMIZATION_NOT_AVAILABLE_MESSAGE = translation
    ._('Link preview customization is not supported by %s1')
    .replace('%s1', snGroupName)
  return (
    <LinkCustomizationNotAvailableInfoBannerContainer>
      <Banner type={TYPE_INFO} messageText={CUSTOMIZATION_NOT_AVAILABLE_MESSAGE} />
    </LinkCustomizationNotAvailableInfoBannerContainer>
  )
}

LinkCustomizationNotAvailableInfoBanner.displayName = 'LinkCustomizationNotAvailableInfoBanner'

export default LinkCustomizationNotAvailableInfoBanner
