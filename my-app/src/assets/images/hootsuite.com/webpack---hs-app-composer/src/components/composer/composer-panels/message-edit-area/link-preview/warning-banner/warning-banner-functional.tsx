import React, { useEffect, useState } from 'react'

import { Banner, TYPE_WARNING } from 'fe-comp-banner'
import { AS_LINK, Button } from 'fe-comp-button'
import { Popover, TOP } from 'fe-comp-popover'
import translation from 'fe-pnc-lib-hs-translation'

import { jsxFromTemplate } from 'fe-pnc-lib-utils'
import { HelpLink, LinkPreviewWarningBanner } from './warning-banner.style'

const LINK_PREVIEW_WARNING = translation._(
  '%bLink customization only available on LinkedIn and Facebook Pages with verified domains%/b. These changes %bwill not%/b apply to ',
)
const N_SELECTED_NETWORKS = n =>
  translation
    ._('%b %s1 selected network%s2 %/b')
    .replace('%s1', n)
    .replace('%s2', n > 1 ? 's ' : ' ')
const LEARN_MORE = translation._('Learn more about verified domains')

const WARNING_POPOVER_ANCHOR_CLASS_NAME = '_warningPopoverAnchor'

interface WarningBannerProps {
  onClose?: () => void
  numberOfNetworksNotCustomized?: number
  socialNetworkNamesForWarning?: string[]
}

export const WarningBanner = ({
  onClose,
  numberOfNetworksNotCustomized = 0,
  socialNetworkNamesForWarning = [],
}: WarningBannerProps) => {
  const [showPopover, setShowPopover] = useState(false)
  const warningNumberLink = jsxFromTemplate(N_SELECTED_NETWORKS(numberOfNetworksNotCustomized))
  const popOverText = socialNetworkNamesForWarning.map(name => <div key={name}>{name}</div>)

  useEffect(() => {
    const onDocumentClick = (e: Event) => {
      const node = document.querySelector(`.${WARNING_POPOVER_ANCHOR_CLASS_NAME}`)

      if (node && e.target instanceof Node && !node.contains(e.target)) {
        setShowPopover(false)
      }
    }

    if (showPopover) {
      document.addEventListener('click', onDocumentClick)
      return () => {
        document.removeEventListener('click', onDocumentClick)
      }
    }
  }, [showPopover])

  return (
    <LinkPreviewWarningBanner>
      <Banner closeAction={onClose} type={TYPE_WARNING}>
        <span className="-linkPreviewWarningText" data-testid={'linkPreviewWarningText'}>
          {jsxFromTemplate(LINK_PREVIEW_WARNING)}
          <Button
            onClick={() => setShowPopover(true)}
            className={WARNING_POPOVER_ANCHOR_CLASS_NAME}
            type={AS_LINK}
            data-testid={'previewWarningPopoverAnchor'}
          >
            {warningNumberLink}
          </Button>
          <HelpLink className="-verifyHelpLink">
            <a
              href="https://help.hootsuite.com/hc/en-us/articles/204586030#3"
              rel="noopener noreferrer"
              target="_blank"
            >
              {LEARN_MORE}
            </a>
          </HelpLink>
          <Popover
            target={`.${WARNING_POPOVER_ANCHOR_CLASS_NAME}`}
            isOpen={showPopover}
            popTo={TOP}
            data-testid={'linkPreviewWarningPopover'}
          >
            {popOverText}
          </Popover>
        </span>
      </Banner>
    </LinkPreviewWarningBanner>
  )
}
