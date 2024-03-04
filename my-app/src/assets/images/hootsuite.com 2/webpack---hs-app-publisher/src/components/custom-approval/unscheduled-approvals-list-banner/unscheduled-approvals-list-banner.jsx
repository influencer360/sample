/**
 * @format
 * @preventMunge
 */

/* eslint-disable react/no-danger */
import './unscheduled-approvals-list-banner.less'

import PropTypes from 'prop-types'
import React from 'react'
import translation from 'hs-nest/lib/utils/translation'
import hootbus from 'hs-nest/lib/utils/hootbus'

export default class UnscheduledApprovalsListBanner extends React.Component {
  constructor(props) {
    super(props)
    this.trackedEventOccurred = this.trackedEventOccurred.bind(this)
    this.onViewMessagesClick = this.onViewMessagesClick.bind(this)
  }

  componentDidMount() {
    if (this.props.onMountComplete) {
      this.props.onMountComplete()
    }
  }

  onViewMessagesClick() {
    this.trackedEventOccurred('view_messages_link_clicked', {
      memberId: this.props.memberId,
    })
    this.props.onViewMessagesClick()
  }

  trackedEventOccurred(action, data) {
    hootbus.emit('hs.app.web.tracked_event_occurred', 'web.dashboard.publisher.custom_approval', action, data)
  }

  render() {
    // prettier-ignore
    var awaitingYourApproval = translation._('There are %s1unscheduled%s2 messages %s1awaiting your approval%s2').replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>')
    // prettier-ignore
    var waitingToBeApproved = translation._('You have %s1unscheduled%s2 messages %s1waiting to be approved%s2').replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>')
    // prettier-ignore
    var rejected = translation._('You have %s1unscheduled%s2 messages that have been %s1rejected%s2').replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>')

    return (
      <div className="rc-UnscheduledApprovalsListBanner">
        {this.props.hasUnscheduledRequireApprovalMessages ? (
          <div className="-messageBanner -requireApproval">
            <span dangerouslySetInnerHTML={{ __html: awaitingYourApproval }} />
            <a href="/dashboard#/publisher/approvequeue" onClick={this.onViewMessagesClick}>
              {translation._('View messages')}
            </a>
          </div>
        ) : null}
        {this.props.hasUnscheduledPendingApprovalMessages ? (
          <div className="-messageBanner -pendingApproval">
            <span dangerouslySetInnerHTML={{ __html: waitingToBeApproved }} />
            <a href="/dashboard#/publisher/pendingapproval" onClick={this.onViewMessagesClick}>
              {translation._('View messages')}
            </a>
          </div>
        ) : null}
        {this.props.hasUnscheduledRejectedMessages ? (
          <div className="-messageBanner -rejected">
            <span dangerouslySetInnerHTML={{ __html: rejected }} />
            <a href="/dashboard#/publisher/rejected" onClick={this.onViewMessagesClick}>
              {translation._('View messages')}
            </a>
          </div>
        ) : null}
      </div>
    )
  }
}

UnscheduledApprovalsListBanner.propTypes = {
  hasUnscheduledPendingApprovalMessages: PropTypes.bool,
  hasUnscheduledRejectedMessages: PropTypes.bool,
  hasUnscheduledRequireApprovalMessages: PropTypes.bool,
  memberId: PropTypes.number.isRequired,
  onMountComplete: PropTypes.func,
  onViewMessagesClick: PropTypes.func,
}

UnscheduledApprovalsListBanner.displayName = 'Unscheduled Approvals List Banner'
