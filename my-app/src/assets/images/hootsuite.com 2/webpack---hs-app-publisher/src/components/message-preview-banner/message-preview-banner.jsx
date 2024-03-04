/**
 * @format
 * @preventMunge
 */

import './message-preview-banner.less'

import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'
import _ from 'underscore'
import Button from 'hs-nest/lib/components/buttons/button'
import classNames from 'classnames'
import Constants from '../../constants/constants'
import SocialNetworks from 'hs-nest/lib/constants/social-networks'
import ConstantMappings from '../../constants/constant-mappings'
import translation from 'hs-nest/lib/utils/translation'
import moment from 'moment'
import ThrobbingLoader from 'hs-nest/lib/components/shared/throbbing-loader'
import MessageApprovalHistoryModal from '../message-approval-history-modal/message-approval-history-modal'
import darklaunch from 'hs-nest/lib/utils/darklaunch'
import { tooltip, PLACEMENT_TOP } from 'fe-hoc-tooltip'

/* fe-global */
import Icon from '@fp-icons/icon-base'
import SymbolAlertCircle from '@fp-icons/symbol-alert-circle'
import XLight from '@fp-icons/symbol-x-light'

import { SubLabelContainer, TooltipContainer } from './message-preview.banner.style'

const TOOLTIP_COLOUR = '#969C9D'

// prettier-ignore
// L10N: %s1 is the name of the social network and %s2 is a unique id
const FB_POST_ID = (socialNetworkName, postId) => translation._('%s1 - Post ID: %s2').replace('%s1', socialNetworkName).replace('%s2', postId)
// prettier-ignore
// L10N: %s1 is the name of the social network and %s2 is a unique id
const FB_VIDEO_ID = (socialNetworkName, videoId) => translation._('%s1 - Video ID: %s2').replace('%s1', socialNetworkName).replace('%s2', videoId)
// prettier-ignore
const NATIVE_FB_SCHEDULING_VIDEO_POST_TOOLTIP_TEXT = translation._('This is a video ID')
// prettier-ignore
const DRAFT_GROUP_MESSAGE_LABEL = translation._('%s1Draft Group Message%s2').replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>')
// prettier-ignore
const PENDING_APPROVAL_LABEL = translation._('%s1Pending approval%s2').replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>')
// prettier-ignore
const REJECTED_BY_NEXGATE_LABEL = translation._('%s1Rejected%s2 by %s1Nexgate%s2').replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>')
// prettier-ignore
const REJECTED_LABEL = translation._('%s1Rejected%s2').replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>')
// prettier-ignore
const NOTIFICATION_SCHEDULED_WITH_CREATOR_NAME_LABEL = creatorName => translation._('%s1Notification scheduled%s2 by %s1%s3%s2').replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>').replace('%s3', creatorName)
// prettier-ignore
const NOTIFICATION_SCHEDULED_LABEL = translation._('%s1Notification scheduled%s2').replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>')
const APPROVED = translation._('Approved')
const VIEW_APPROVAL_HISTORY = translation._('View approval history')

export default class MessagePreviewBanner extends React.Component {
  constructor(props) {
    super(props)

    this.defaultIconSize = '18'
    this.failedIconSize = '15'
    this.renderApprovalHistory = this.renderApprovalHistory.bind(this)

    this.state = {
      isLoading: props.isLoading,
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      isLoading: nextProps.isLoading,
    })
  }

  getRejectionData() {
    const { messageData } = this.props
    const { actions } = messageData

    // We should only get rejection data if this is a rejection
    if (!actions || !this.isRejected()) {
      return null
    }

    let rejectionData = _.filter(actions, action => {
      return action.actionType === Constants.APPROVAL_ACTION_TYPES.REJECT
    })

    // Get the most recent rejection message
    rejectionData = !_.isEmpty(rejectionData) ? rejectionData[rejectionData.length - 1] : null

    return rejectionData
  }

  getMessageFailureData() {
    const { isFailed, messageData } = this.props
    const { actions } = messageData

    if (!actions || !this.isExpired() || !isFailed) {
      return null
    }

    let failureData = actions.filter(
      action =>
        action.actionType === Constants.APPROVAL_ACTION_TYPES.SCHEDULEFAIL ||
        action.actionType === Constants.APPROVAL_ACTION_TYPES.SENDFAIL,
    )

    // Get the most recent expiration message
    failureData = failureData.length ? failureData[failureData.length - 1] : null

    return failureData
  }

  isDraft() {
    return this.props.type === Constants.APPROVALS.TYPE.DRAFT
  }

  isRequireApproval() {
    return this.props.type === Constants.APPROVALS.TYPE.REQUIRE_APPROVAL
  }

  isPendingApproval() {
    return this.props.type === Constants.APPROVALS.TYPE.PENDING_APPROVAL
  }

  isScheduled() {
    return this.props.type === Constants.APPROVALS.TYPE.SCHEDULED
  }

  isPublished() {
    return this.props.type === Constants.APPROVALS.TYPE.PUBLISHED
  }

  isExpired() {
    return this.props.type === Constants.APPROVALS.TYPE.EXPIRED
  }

  isRejected() {
    return this.props.type === Constants.APPROVALS.TYPE.REJECTED
  }

  isPendingPreScreen() {
    const { messageData } = this.props
    const { details } = messageData
    return details && details.isPendingPreScreen ? details.isPendingPreScreen : false
  }

  isNativeFBSchedulingWithVideoPost() {
    const { isVideo, socialNetworkMessageId } = this.props.messageData
    return socialNetworkMessageId && isVideo
  }

  getNativeFBSchedulingWithVideoPostTooltip() {
    const Tooltip = tooltip(
      () => (
        <TooltipContainer>
          <Icon
            className="x-Icon"
            glyph={SymbolAlertCircle}
            fill={TOOLTIP_COLOUR}
            width="12px"
            height="12px"
          />
        </TooltipContainer>
      ),
      {
        text: NATIVE_FB_SCHEDULING_VIDEO_POST_TOOLTIP_TEXT,
        placement: PLACEMENT_TOP,
      },
    )
    return <Tooltip />
  }

  hasFailedToSend() {
    const { isFailed, messageData } = this.props
    const { failedError, socialNetworkMessageId } = messageData

    // In some cases, a failure can occur when a message is posted successfully. If we have network data, it is not a failure.
    return (!!failedError && !socialNetworkMessageId) || isFailed
  }

  getNumOfReviewers() {
    const { messageData } = this.props
    const { details } = messageData
    let numReviewers = 0

    if (details && Array.isArray(details.reviewers)) {
      numReviewers = details.reviewers.length
    }

    return numReviewers
  }

  hasNextReviewer(nextReviewersArr) {
    return !_.isEmpty(nextReviewersArr[0].name)
  }

  getApprovalStepInfo() {
    const { messageData } = this.props
    const { details } = messageData
    let currentApprovalStep = 0
    let totalNumApprovalsRequired

    if (details) {
      totalNumApprovalsRequired = details.totalNumApprovalsRequired
      const nextReviewersArr = details.nextReviewers
      if (nextReviewersArr && !_.isEmpty(nextReviewersArr) && Array.isArray(nextReviewersArr)) {
        const hasNextReviewer = this.hasNextReviewer(nextReviewersArr)
        if (hasNextReviewer) {
          currentApprovalStep = 1 + details.totalNumApprovalsRequired - details.numApprovalsRequired
        } else {
          currentApprovalStep = totalNumApprovalsRequired
        }
      }
    }

    return {
      currentApprovalStep: currentApprovalStep,
      totalNumApprovalsRequired: totalNumApprovalsRequired,
    }
  }

  getReviewerName() {
    const rejectionData = this.getRejectionData()
    if (!_.isEmpty(rejectionData)) {
      return rejectionData.actorName
    }

    return this.getNumOfReviewers() ? this.props.messageData.details.reviewers[0].name : ''
  }

  getRejectionReason() {
    const rejectionData = this.getRejectionData()
    if (!_.isEmpty(rejectionData) && rejectionData.reason) {
      return <span className="-reason">{rejectionData.reason}</span>
    }

    return null
  }

  renderFailureReason() {
    const failureData = this.getMessageFailureData()
    if (!_.isEmpty(failureData) && failureData.reason) {
      return <span className="-reason">{failureData.reason}</span>
    }

    return null
  }

  renderReason() {
    const { isFailed, isLegacy, messageData } = this.props
    if (this.hasFailedToSend() && messageData && messageData.failedError && messageData.failedError.message) {
      return <span className="-reason">{messageData.failedError.message}</span>
    } else if (this.isRejected() && !isLegacy) {
      return this.getRejectionReason()
    } else if (this.isExpired() && isFailed) {
      return this.renderFailureReason()
    }

    return null
  }

  renderApprovalHistory() {
    const { isPreScreen, messageData, timezoneOffset } = this.props
    const { actions, details } = messageData

    let parentNode = document.getElementById('messageApprovalHistoryModal')

    if (!parentNode) {
      parentNode = document.createElement('div')
      parentNode.id = 'messageApprovalHistoryModal'
      document.body.appendChild(parentNode)
    }

    ReactDOM.render(
      <MessageApprovalHistoryModal
        actions={actions}
        details={details}
        isPending={this.isPendingApproval() || this.isRequireApproval()}
        isPreScreen={isPreScreen}
        onClose={() => _.defer(() => ReactDOM.unmountComponentAtNode(parentNode))}
        timezoneOffset={timezoneOffset}
      />,
      parentNode,
    )
  }

  render() {
    const {
      isComment,
      isFailed,
      isGroupMessage,
      isLegacy,
      isNotification,
      isPreScreen,
      isReply,
      isUnscheduled,
      messageData,
      onClose,
      timezoneOffset,
      type,
    } = this.props
    const {
      actions,
      creatorName,
      isPreScreen: messageDataIsPreScreen,
      modifiedDate,
      modifiedUserFullName,
      rejectedDate,
      sendDate,
      socialNetworkMessageId,
      socialNetworkType,
    } = messageData
    const { isLoading } = this.state

    let labelType = ConstantMappings.APPROVALS_MESSAGE_TYPE_TO_LABEL[type]

    if (messageData && this.hasFailedToSend() && !isFailed) {
      labelType = ConstantMappings.APPROVALS_MESSAGE_TYPE_TO_LABEL[Constants.APPROVALS.FAILED]
    } else if (isFailed) {
      if (isComment) {
        labelType = ConstantMappings.APPROVALS_MESSAGE_TYPE_TO_LABEL[Constants.APPROVALS.COMMENT_FAILED]
      } else if (isReply) {
        labelType = ConstantMappings.APPROVALS_MESSAGE_TYPE_TO_LABEL[Constants.APPROVALS.REPLY_FAILED]
      } else {
        labelType = ConstantMappings.APPROVALS_MESSAGE_TYPE_TO_LABEL[Constants.APPROVALS.MESSAGE_FAILED]
      }
    }

    let subLabel = ConstantMappings.APPROVALS_MESSAGE_TYPE_TO_SUB_LABEL[type]
    let lastEdited = ''
    let infoBar
    const reviewerName = this.getReviewerName()

    if (this.isDraft() && isGroupMessage) {
      labelType = DRAFT_GROUP_MESSAGE_LABEL
    } else if (this.isRequireApproval() || this.isPendingApproval() || this.isRejected()) {
      if ((this.isRequireApproval() || this.isPendingApproval()) && isLegacy) {
        labelType = PENDING_APPROVAL_LABEL
      } else if (this.isRejected() && (isPreScreen || messageDataIsPreScreen)) {
        labelType = REJECTED_BY_NEXGATE_LABEL
      } else if (this.isRejected() && isLegacy) {
        labelType = REJECTED_LABEL
      } else {
        labelType = labelType
          .replace(/%s1/g, '<strong>')
          .replace(/%s2/g, '</strong>')
          .replace('%s3', reviewerName)
      }
    } else {
      if (darklaunch.isFeatureEnabledOrBeta('PUB_NATIVE_FB_SCHEDULING')) {
        if (this.isScheduled() && isNotification) {
          labelType = NOTIFICATION_SCHEDULED_WITH_CREATOR_NAME_LABEL(creatorName)
        } else {
          labelType = labelType
            .replace(/%s1/g, '<strong>')
            .replace(/%s2/g, '</strong>')
            .replace('%s3', creatorName)
        }
      } else {
        if (this.isScheduled() && isNotification) {
          labelType = NOTIFICATION_SCHEDULED_LABEL
        } else {
          labelType = labelType.replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>')
        }
      }
    }

    let date
    if (this.isRejected() && rejectedDate) {
      lastEdited = moment
        .utc(rejectedDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS)
        .utcOffset(timezoneOffset / Constants.DATE_TIME.NUM_SECONDS_IN_MINUTE)
        .fromNow()
    } else if (this.isExpired() && !isUnscheduled) {
      lastEdited = moment
        .utc(sendDate * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS)
        .utcOffset(timezoneOffset / Constants.DATE_TIME.NUM_SECONDS_IN_MINUTE)
        .fromNow()
    } else if (!this.isRejected()) {
      date = modifiedDate ? modifiedDate : sendDate
      lastEdited = moment
        .utc(date * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS)
        .utcOffset(timezoneOffset / Constants.DATE_TIME.NUM_SECONDS_IN_MINUTE)
        .fromNow()
    }

    if (this.isDraft()) {
      subLabel = subLabel
        .replace('%s1', lastEdited)
        .replace(/%s2/g, '<strong>')
        .replace(/%s4/g, '</strong>')
        .replace('%s3', modifiedUserFullName)
    } else if (this.isRequireApproval() || this.isPendingApproval()) {
      if (this.isPendingPreScreen()) {
        subLabel = null
      } else {
        subLabel = subLabel
          .replace('%s1', this.getApprovalStepInfo().currentApprovalStep)
          .replace('%s2', this.getApprovalStepInfo().totalNumApprovalsRequired)
      }
    } else if (this.isScheduled() || this.isPublished()) {
      if (darklaunch.isFeatureEnabledOrBeta('PUB_NATIVE_FB_SCHEDULING')) {
        if (socialNetworkMessageId) {
          const socialNetworkName = SocialNetworks.snTypeToDisplayName[socialNetworkType || null] || null
          if (this.isNativeFBSchedulingWithVideoPost()) {
            subLabel = FB_VIDEO_ID(socialNetworkName, socialNetworkMessageId)
          } else {
            subLabel = FB_POST_ID(socialNetworkName, socialNetworkMessageId)
          }
        } else {
          subLabel = null
        }
      } else {
        subLabel = subLabel
          .replace(/%s1/g, '<strong>')
          .replace(/%s3/g, '</strong>')
          .replace('%s2', creatorName)
      }
    } else if (this.isExpired() && !isUnscheduled) {
      subLabel = lastEdited
    } else if (this.isRejected()) {
      subLabel = lastEdited
    }

    const isApproved = this.isScheduled()
    const hasApprovalHistory = Array.isArray(actions)

    const approvalHistoryClasses = classNames(
      '-approvalHistory',
      isApproved && hasApprovalHistory ? '-hasApprovalHistory' : '',
    )

    let link

    if (darklaunch.isFeatureEnabledOrBeta('PUB_NATIVE_FB_SCHEDULING')) {
      link = (
        <div className={approvalHistoryClasses}>
          <a className="-approvalHistoryLink" href="#" onClick={this.renderApprovalHistory}>
            {isApproved && hasApprovalHistory ? APPROVED : VIEW_APPROVAL_HISTORY}
          </a>
          {(this.isExpired() && isUnscheduled) || this.isPendingPreScreen() || this.isScheduled() ? null : (
            <span className="-divider">&#8226;</span>
          )}
        </div>
      )
    } else {
      link = (
        <div className={approvalHistoryClasses}>
          <a className="-approvalHistoryLink" href="#" onClick={this.renderApprovalHistory}>
            {isApproved && hasApprovalHistory ? APPROVED : VIEW_APPROVAL_HISTORY}
          </a>
          {(this.isExpired() && isUnscheduled) || this.isPendingPreScreen() ? null : (
            <span className="-divider">&#8226;</span>
          )}
        </div>
      )
    }

    let subLabelClass = ''

    if (isApproved && hasApprovalHistory && !this.isDraft()) {
      subLabelClass = '-mediumWidth'
    } else if (!isApproved && hasApprovalHistory && !this.isDraft()) {
      subLabelClass = '-shortWidth'
    } else {
      subLabelClass = '-fullWidth'
    }

    let subLabelClasses

    if (darklaunch.isFeatureEnabledOrBeta('PUB_NATIVE_FB_SCHEDULING')) {
      subLabelClasses = classNames('-subLabel', subLabelClass, {
        'x-hasNativeId': socialNetworkMessageId,
      })
    } else {
      subLabelClasses = classNames('-subLabel', subLabelClass)
    }

    if (!(isLegacy && (this.isRequireApproval() || this.isPendingApproval()))) {
      let subLabelHtml
      if (this.isNativeFBSchedulingWithVideoPost()) {
        subLabelHtml = (
          <SubLabelContainer>
            {subLabel}
            {this.getNativeFBSchedulingWithVideoPostTooltip()}
          </SubLabelContainer>
        )
      } else {
        subLabelHtml = (
          /* eslint-disable react/no-danger */
          <span className={subLabelClasses} dangerouslySetInnerHTML={{ __html: subLabel }} />
          /* eslint-enable react/no-danger */
        )
      }
      if (this.isNativeFBSchedulingWithVideoPost()) {
        subLabelHtml = subLabel ? (
          <SubLabelContainer>
            {subLabel}
            {this.getNativeFBSchedulingWithVideoPostTooltip()}
          </SubLabelContainer>
        ) : null
      } else {
        subLabelHtml = subLabel ? (
          /* eslint-disable react/no-danger */
          <span className={subLabelClasses} dangerouslySetInnerHTML={{ __html: subLabel }} />
        ) : /* eslint-enable react/no-danger */
        null
      }
      infoBar = (
        <div className="-infoBar">
          {!this.isDraft() && hasApprovalHistory ? link : null}
          {subLabelHtml}
        </div>
      )
    }

    let iconHeight = this.defaultIconSize
    const classes = classNames('-subHeader', 'x-' + type, {
      'x-failed': this.hasFailedToSend(),
      'x-loading': isLoading,
    })

    if (this.hasFailedToSend()) {
      iconHeight = this.failedIconSize
    } else if (this.isRejected()) {
      iconHeight = '10'
    }

    const iconClasses = classNames('-iconContainer', 'x-' + type, {
      'x-failed': this.hasFailedToSend(),
    })

    const iconGlyph = this.hasFailedToSend()
      ? ConstantMappings.APPROVALS_MESSAGE_TYPE_TO_ICON[Constants.APPROVALS.FAILED]
      : ConstantMappings.APPROVALS_MESSAGE_TYPE_TO_ICON[type]

    const labelTypeHtml = (
      /* eslint-disable react/no-danger */
      <span className="-labelType fs-exclude-container" dangerouslySetInnerHTML={{ __html: labelType }} />
      /* eslint-enable react/no-danger */
    )

    return (
      <div className="rc-MessagePreviewBanner">
        <div className={classes}>
          {isLoading ? (
            <div className="-loadingHeader">
              <div className="-throbberWrapper">
                <ThrobbingLoader />
              </div>
            </div>
          ) : (
            <div>
              <Icon className={iconClasses} fill="#fff" size={iconHeight} glyph={iconGlyph} />
              <div className="-subHeaderContent">
                {labelTypeHtml}
                {infoBar}
              </div>
            </div>
          )}
          {this.renderReason()}
        </div>
        <Button aria-hidden="true" btnStyle="icon" className="-closeButton" onClick={onClose}>
          <Icon size={14} glyph={XLight} />
        </Button>
      </div>
    )
  }
}

MessagePreviewBanner.propTypes = {
  isComment: PropTypes.bool,
  isFailed: PropTypes.bool,
  isGroupMessage: PropTypes.bool,
  isLegacy: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool,
  isPreScreen: PropTypes.bool,
  isReply: PropTypes.bool,
  isUnscheduled: PropTypes.bool,
  isNotification: PropTypes.bool,
  messageData: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onViewApprovalClick: PropTypes.func,
  timezoneOffset: PropTypes.number,
  type: PropTypes.oneOf([
    Constants.APPROVALS.TYPE.DRAFT,
    Constants.APPROVALS.TYPE.REQUIRE_APPROVAL,
    Constants.APPROVALS.TYPE.PENDING_APPROVAL,
    Constants.APPROVALS.TYPE.SCHEDULED,
    Constants.APPROVALS.TYPE.PUBLISHED,
    Constants.APPROVALS.TYPE.EXPIRED,
    Constants.APPROVALS.TYPE.REJECTED,
  ]).isRequired,
}

MessagePreviewBanner.defaultProps = {
  isComment: false,
  isFailed: false,
  isPreScreen: false,
  isReply: false,
}

MessagePreviewBanner.displayName = 'Message Preview Banner'
