import React from 'react'
import { A, P } from 'fe-comp-dom-elements'
import { Constants as SocialProfileConstants } from 'fe-pnc-constants-social-profiles'
import translation from 'fe-pnc-lib-hs-translation'

export const goToBoostToastElement = boostRequest => {
  const socialProfileId = boostRequest.social_profile_id
  const socialNetwork = boostRequest.social_network
  const adAccountId = boostRequest.ad_account_id

  return (
    socialNetwork === SocialProfileConstants.SN_TYPES.FACEBOOK && (
      <React.Fragment>
        <P>
          <A
            href={`/dashboard#/advertise/promoted-posts/${socialNetwork.toLowerCase()}?account_id=${adAccountId}&social_profile_id=${socialProfileId}&go_to=APP`}
          >
            {translation._('Save time')}
          </A>
          {` ${translation._('by setting posts like this to be boosted automatically.')}`}
        </P>
      </React.Fragment>
    )
  )
}
