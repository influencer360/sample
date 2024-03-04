import React from 'react'

import { Banner, TYPE_WARNING } from 'fe-comp-banner'
import { AS_LINK, Button } from 'fe-comp-button'
import { Popover, TOP } from 'fe-comp-popover'
import translation from 'fe-pnc-lib-hs-translation'
import { jsxFromTemplate } from 'fe-pnc-lib-utils'

import { closest as domUtilsClosest } from '@/utils/dom-utils'
import { HelpLink, LinkPreviewWarningBanner } from './warning-banner.style'

// prettier-ignore
const LINK_PREVIEW_WARNING = translation._('%bLink customization only available on LinkedIn and Facebook Pages with verified domains%/b. These changes %bwill not%/b apply to ')
const N_SELECTED_NETWORKS = n =>
  translation
    ._('%b %s1 selected network%s2 %/b')
    .replace('%s1', n)
    .replace('%s2', n > 1 ? 's ' : ' ')
const LEARN_MORE = translation._('Learn more about verified domains')

const WARNING_POPOVER_ANCHOR_CLASS_NAME = '_warningPopoverAnchor'

interface WarningBannerProps {
  numberOfNetworksNotCustomized?: number
  socialNetworkNamesForWarning?: Array<string>
  onClose?(): void
}

class WarningBanner extends React.PureComponent<WarningBannerProps> {
  static defaultProps = {
    numberOfNetworksNotCustomized: 0,
    socialNetworkNamesForWarning: [],
    onClose: () => {},
  }

  constructor(props) {
    super(props)

    this.state = {
      showPopover: false,
    }
  }

  componentDidMount() {
    document.body.addEventListener('click', this.onDocumentClick)
  }

  componentWillUnmount() {
    document.body.removeEventListener('click', this.onDocumentClick)
  }

  openWarningPopover = () => {
    this.setState({
      showPopover: true,
    })
  }

  onDocumentClick = e => {
    const closest = function (element, selector) {
      if (typeof e.target.closest !== 'undefined') {
        return element.closest(selector)
      } else {
        return domUtilsClosest(element, selector)
      }
    }
    if (!closest(e.target, WARNING_POPOVER_ANCHOR_CLASS_NAME)) {
      this.setState({
        showPopover: false,
      })
    }
  }

  render() {
    const { numberOfNetworksNotCustomized, socialNetworkNamesForWarning, onClose } = this.props

    const { showPopover } = this.state

    const warningNumberLink = jsxFromTemplate(N_SELECTED_NETWORKS(numberOfNetworksNotCustomized))
    const popOverText = socialNetworkNamesForWarning.map(name => <div key={name}>{name}</div>)

    return (
      <LinkPreviewWarningBanner>
        <Banner closeAction={onClose} type={TYPE_WARNING}>
          <span className="-linkPreviewWarningText">
            {jsxFromTemplate(LINK_PREVIEW_WARNING)}{' '}
            <Button
              onClick={this.openWarningPopover}
              className={WARNING_POPOVER_ANCHOR_CLASS_NAME}
              type={AS_LINK}
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
            <Popover target={`.${WARNING_POPOVER_ANCHOR_CLASS_NAME}`} isOpen={showPopover} popTo={TOP}>
              {popOverText}
            </Popover>
          </span>
        </Banner>
      </LinkPreviewWarningBanner>
    )
  }
}

export default WarningBanner
