/**
 * @format
 * @preventMunge
 */

import './counter-banner.less'

import PropTypes from 'prop-types'
import React from 'react'
import Icon from '@fp-icons/icon-base'
import BoxArrowTopRightOutline from '@fp-icons/box-arrow-top-right-outline'
import QuestionCircleOutline from '@fp-icons/symbol-question-circle-outline'
import { Banner } from 'fe-comp-banner'
import { tooltip, PLACEMENT_TOP } from 'fe-hoc-tooltip'

import Colors from 'hs-nest/lib/constants/colours'
import translation from 'hs-nest/lib/utils/translation'

import Constants from '../../../constants/constants'

/**
 * Scheduled message count banner component
 */
export default class CounterBanner extends React.Component {
  componentWillMount() {
    this.props.trackerDatalab.trackCustom(this.props.trackingOrigin, 'view_smp_counter_banner')
  }

  renderBannerTitle() {
    const msgCount = this.props.scheduledMsgCount
    const max = this.props.scheduledMsgMax
    let percentage = msgCount / max
    let msgCountHTML = <span className="-msgCount">{msgCount.toString()}</span>
    let bannerHeader = CounterBanner.sentences.messagesScheduled.replace('%d', max.toString())

    if (percentage >= 1) {
      // scheduled message limit reached
      msgCountHTML = ''
      bannerHeader = CounterBanner.sentences.scheduledMsgHeaderFull
    }

    const IconTooltip = tooltip(() => <Icon fill="black" size={14} glyph={QuestionCircleOutline} />, {
      text: CounterBanner.sentences.additionalInfo,
      placement: PLACEMENT_TOP,
    })

    return (
      <p className="-bannerHeader">
        <b>
          {msgCountHTML}
          {bannerHeader}
        </b>
        <IconTooltip />
      </p>
    )
  }

  renderBannerText(text, link) {
    const BANNER_URL = '/pages/unlimited-scheduling'

    return (
      <span className="-bannerText">
        {text}
        <a
          className="-bannerAnchor"
          data-tracking-action="plans_upgrade_clicked"
          data-tracking-origin={this.props.trackingOrigin}
          href={BANNER_URL}
          rel="noopnener noreferrer"
          target="_blank"
        >
          <strong>{link}</strong>{' '}
          <Icon fill={Colors.colourHyperlinkText} size={14} glyph={BoxArrowTopRightOutline} />
        </a>
      </span>
    )
  }

  renderBannerType() {
    // default (less than 90% messages scheduled)
    let bannerType = Constants.BANNER_TYPE.INFO
    let msgCount = this.props.scheduledMsgCount
    const max = this.props.scheduledMsgMax
    let percentage = msgCount / max
    let bannerMsg = CounterBanner.sentences.content
    let bannerLink = CounterBanner.sentences.link

    if (percentage >= 0.9 && percentage < 1) {
      // 90-99% messages scheduled
      bannerType = Constants.BANNER_TYPE.WARNING
    } else if (percentage >= 1) {
      // scheduled message limit reached
      bannerType = Constants.BANNER_TYPE.WARNING
      bannerMsg = CounterBanner.sentences.contentFull
        .replace('%s', msgCount.toString())
        .replace('%d', max.toString())
      bannerLink = CounterBanner.sentences.linkFull
    }

    return (
      <Banner
        titleText={this.renderBannerTitle()}
        messageText={this.renderBannerText(bannerMsg, bannerLink)}
        type={bannerType}
      />
    )
  }

  render() {
    return <div className="rc-CounterBanner">{this.renderBannerType()}</div>
  }
}

CounterBanner.sentences = {
  // prettier-ignore
  additionalInfo: translation._('You can schedule up to 5 messages at a time. New messages may be added as soon as your scheduled posts go out.'),
  // %d is max number of scheduled messages
  scheduledMsgHeader: translation._('/%d scheduled messages used'),
  messagesScheduled: translation._('/%d messages scheduled '),
  scheduledMsgHeaderFull: translation._('Scheduled message limit reached '),
  content: translation._('To schedule unlimited messages '),
  // %d is max number of scheduled messages
  contentFull: translation._("You're using %s/%d scheduled messages. "),
  link: translation._('upgrade your plan now'),
  linkFull: translation._('Upgrade now to get unlimited messages'),
}

const { number, func, shape, string } = PropTypes

CounterBanner.defaultProps = {
  gaTracker: () => {},
  gaTrackingAction: 'scheduler_new_compose_link',
  trackingOrigin: 'web.publisher.compose.counterbanner',
  trackerDatalab: {
    trackCustom: () => {},
  },
}

CounterBanner.propTypes = {
  gaTracker: func,
  gaTrackingAction: string,
  scheduledMsgCount: number.isRequired,
  scheduledMsgMax: number.isRequired,
  trackerDatalab: shape({ trackCustom: func.isRequired }),
  trackingOrigin: string,
}

CounterBanner.displayName = 'Counter Banner'
