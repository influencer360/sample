/**
 * @format
 * @preventMunge
 */

/* eslint-disable react/no-danger */
import './inline-redirect-notification.less'

import PropTypes from 'prop-types'
import React from 'react'
import translation from 'hs-nest/lib/utils/translation'
import hootbus from 'hs-nest/lib/utils/hootbus'

export default class InlineRedirectNotification extends React.Component {
  constructor(props) {
    super(props)
    this.trackedEventOccurred = this.trackedEventOccurred.bind(this)
    this.onViewMessagesClick = this.onViewMessagesClick.bind(this)
  }

  componentDidMount() {
    this.resetTopAndHeightOfListContent()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.items !== this.props.items) {
      this.resetTopAndHeightOfListContent()
    }
  }

  resetTopAndHeightOfListContent() {
    if (this.props.resetTopAndHeightOfListContent) {
      this.props.resetTopAndHeightOfListContent()
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
    return (
      <div className="rc-InlineRedirectNotification">
        {this.props.items.map((item, index) => {
          return (
            <div className="-inlineBanner" key={index}>
              <span dangerouslySetInnerHTML={{ __html: item.label }} />
              <a href={item.url} onClick={this.onViewMessagesClick}>
                {translation._('View messages')}
              </a>
            </div>
          )
        })}
      </div>
    )
  }
}

InlineRedirectNotification.propTypes = {
  items: PropTypes.array.isRequired,
  memberId: PropTypes.number.isRequired,
  onViewMessagesClick: PropTypes.func,
  resetTopAndHeightOfListContent: PropTypes.func,
}

InlineRedirectNotification.displayName = 'Inline Redirect Notification'
