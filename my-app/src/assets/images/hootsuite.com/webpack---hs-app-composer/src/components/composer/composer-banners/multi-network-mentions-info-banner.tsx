import React from 'react'
import { Banner, TYPE_INFO } from 'fe-comp-banner'
import translation from 'fe-pnc-lib-hs-translation'

interface Props {
  snNames: Array<string>
}

const MultiNetworkMentionsInfoBanner = ({ snNames }: Props) => {
  let names = ''
  const conjunction = translation._(' and ')
  if (snNames.length > 1) {
    //replace the last comma with 'and' to use in the sentence
    names = snNames.join(', ').replace(/,(?=[^,]*$)/, conjunction)
  } else {
    names = snNames[0]
  }

  const MULTI_NETWORK_MENTIONS_MESSAGE =
    snNames.length > 1
      ? translation._('%s1 mentions will be linked when the post is published.').replace('%s1', names)
      : translation
          ._('%s1 mentions will be linked when the post is published to %s2')
          .replace('%s1', names)
          .replace('%s2', names + '.')

  return <Banner type={TYPE_INFO} messageText={MULTI_NETWORK_MENTIONS_MESSAGE} />
}

MultiNetworkMentionsInfoBanner.displayName = 'MultiNetworkMentionsInfoBanner'

export default MultiNetworkMentionsInfoBanner
