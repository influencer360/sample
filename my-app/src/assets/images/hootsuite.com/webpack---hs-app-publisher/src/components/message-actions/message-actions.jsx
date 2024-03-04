/**
 * @format
 * @preventMunge
 */

import './message-actions.less'

import PropTypes from 'prop-types'
import React from 'react'
import _ from 'underscore'
import translation from 'hs-nest/lib/utils/translation'
import JsxUtils from 'hs-nest/lib/utils/jsx-utils'
import darklaunch from 'hs-nest/lib/utils/darklaunch'
import MenuButtonTethered from 'hs-nest/lib/components/buttons/menu-button-tethered'
import MenuPositions from 'hs-nest/lib/constants/menu-positions'
import ConstantMappings from '../../constants/constant-mappings'
import ActionButton from './action-button'
import { handleEntitlementCheck } from '../../utils/entitlement-utils'

/* fe-global */
import Icon from '@fp-icons/icon-base'
import Ellipsis from '@fp-icons/emblem-ellipsis'
import EmblemTrash from '@fp-icons/emblem-trash'
import XLight from '@fp-icons/symbol-x-light'
import IconCheck from '@fp-icons/symbol-check'
import Pencil from '@fp-icons/emblem-pencil'
import ArrowRoundCounterClockwise from '@fp-icons/arrow-round-counter-clockwise'
import { CUSTOM_APPROVALS } from 'fe-lib-entitlements'

export default class MessageActions extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      hasCustomApprovalsEntitlement: false,
    }

    this.iconSize = '15'
    this.iconColor = '#5C6368'

    this.getActionMenuItems = this.getActionMenuItems.bind(this)
    this.onApproveMessage = this.onApproveMessage.bind(this)
    this.onRejectMessage = this.onRejectMessage.bind(this)
    this.onDeleteClick = this.onDeleteClick.bind(this)
    this.onEditMessage = this.onEditMessage.bind(this)
    this.getRejectTooltipText = this.getRejectTooltipText.bind(this)
    this.getMessageIds = this.getMessageIds.bind(this)
    this.getApprovalData = this.getApprovalData.bind(this)
    this.getMessageSelector = this.getMessageSelector.bind(this)
    this.onRetryClick = this.onRetryClick.bind(this)
  }

  componentDidMount() {
    handleEntitlementCheck(CUSTOM_APPROVALS, hasCustomApprovalsEntitlement => {
      this.setState({ hasCustomApprovalsEntitlement })
    })
  }

  onEditMessage() {
    this.props.editMessage(this.props)
  }

  onRetryClick() {
    this.props.onRetryClick(this.props)
  }

  onDeleteClick() {
    const {
      isApproval,
      isDraft,
      isExpired,
      isGroup,
      isLegacy,
      isPreScreen,
      messageId,
      renderDeleteModal,
      socialNetworkIds,
    } = this.props
    renderDeleteModal({
      callbackFn: null,
      isApproval,
      isDraft,
      isExpired,
      isGroup,
      isLegacy,
      isPreScreen,
      messageId,
      msgIdsAndSeqNums: this.getMsgIdsAndSeqNums(),
      socialNetworkIds,
    })
  }

  getMessageIds() {
    let messageIds

    if (this.props.isGroup) {
      const messageArray = this.props.isApproval ? this.props.group.approvals : this.props.group.messages
      messageIds = _.map(messageArray, message => {
        return message._id
      })
    } else {
      messageIds = [this.props.messageId]
    }

    return messageIds
  }

  getMsgIdsAndSeqNums() {
    let msgIdsAndSeqNums

    if (this.props.isGroup) {
      const messageArray = this.props.isApproval ? this.props.group.approvals : this.props.group.messages
      msgIdsAndSeqNums = _.map(messageArray, message => {
        return {
          id: message._id,
          sequenceNumber: message.sequenceNumber ? message.sequenceNumber : -1,
        }
      })
    } else {
      msgIdsAndSeqNums = [
        {
          id: this.props.messageId,
          sequenceNumber: this.props.sequenceNumber,
        },
      ]
    }

    return msgIdsAndSeqNums
  }

  getApprovalData() {
    return this.props.isGroup ? this.props.group : this.props.approval
  }

  onApproveMessage() {
    this.props.approveMessage(this.getMsgIdsAndSeqNums(), this.props.socialNetworkIds, this.props.isGroup)
  }

  onRejectMessage() {
    this.props.renderRejectModal(this.getMsgIdsAndSeqNums(), this.props.socialNetworkIds, this.props.isGroup)
  }

  isReplyApproval = () => {
    return this.props.isReply && this.props.isApproval
  }

  // TODO: Will be used when menu is added to populate menu items
  getActionMenuItems() {
    const menuItems = []

    if (this.props.canEdit) {
      const approvalMenuItems = {
        group: true,
        items: [],
      }

      if (this.props.canApprove && !this.props.isExpired && !this.isReplyApproval()) {
        approvalMenuItems.items.push({
          label: translation._('Edit Message'),
          leftIconSourceKey: Pencil,
          value: 'edit',
          onSelect: this.onEditMessage,
        })
      }

      if (approvalMenuItems.items.length > 0) {
        menuItems.push(approvalMenuItems)
      }
    }

    return menuItems
  }

  getApproveTooltipText() {
    let tooltipText

    if (this.state.hasCustomApprovalsEntitlement) {
      if (this.props.isGroup) {
        tooltipText = translation._('%bApprove group%/b')
      } else if (this.getNumOfReviewers() > 1) {
        if (this.props.isComment) {
          tooltipText = translation._('%bApprove comment%/b and send to %b%s%/b for their approval')
        } else if (this.props.isReply) {
          tooltipText = translation._('%bApprove reply%/b and send to %b%s%/b for their approval')
        } else {
          tooltipText = translation._('%bApprove message%/b and send to %b%s%/b for their approval')
        }
        tooltipText = tooltipText.replace('%s', this.props.message.details.nextReviewers[0].name)
      } else {
        if (this.props.isComment) {
          tooltipText = translation._('%bApprove comment%/b')
        } else if (this.props.isReply) {
          tooltipText = translation._('%bApprove reply%/b')
        } else {
          tooltipText = translation._('%bApprove message%/b')
        }
      }
    } else {
      tooltipText = translation._('%bApprove message%/b')

      if (this.props.isGroup) {
        tooltipText = translation._('%bApprove group%/b')
      } else if (this.getNumOfReviewers() > 1) {
        // prettier-ignore
        tooltipText = translation._('%bApprove message%/b and send to %b%s%/b for their approval').replace('%s', this.props.message.details.nextReviewers[0].name)
      }
    }

    return JsxUtils.jsxFromTemplate(tooltipText)
  }

  getRejectTooltipText() {
    let tooltipText

    if (this.state.hasCustomApprovalsEntitlement) {
      if (this.props.isGroup) {
        tooltipText = translation._('%bReject group%/b and send back to %b%s%/b with optional note')
      } else if (this.props.isComment) {
        tooltipText = translation._('%bReject comment%/b and send back to %b%s%/b with optional note')
      } else if (this.props.isReply) {
        tooltipText = translation._('%bReject reply%/b and send back to %b%s%/b with optional note')
      } else {
        tooltipText = translation._('%bReject message%/b and send back to %b%s%/b with optional note')
      }

      tooltipText = tooltipText.replace('%s', this.props.message.creatorName)
    } else {
      tooltipText = this.props.isGroup
        ? // prettier-ignore
          translation._('%bReject group%/b and send back to %b%s%/b with optional note').replace('%s', this.props.message.creatorName)
        : // prettier-ignore
          translation._('%bReject message%/b and send back to %b%s%/b with optional note').replace('%s', this.props.message.creatorName)
    }

    return JsxUtils.jsxFromTemplate(tooltipText)
  }

  getNumOfReviewers() {
    return this.props.message.details && this.props.message.details.numApprovalsRequired
      ? this.props.message.details.numApprovalsRequired
      : 0
  }

  /**
   * A helper function to pass information about a message back to the message list when events in message actions affect a message's itemWrapper or itemInfo element
   * @returns {String} an html selector unique to the message list row being acted upon
   */
  getMessageSelector() {
    if (this.props.isGroup) {
      // this reduce converts 4 flags to a single number with 4 binary digits that each correspond to one of the flags that can then be used in a constant mapping
      // for example, if  and isApproval are true, it should return 12 (1100)
      // if only isPreScreen is true, it should return 1 (0001)
      const flags = [
        this.props.message.isScheduled,
        this.props.isApproval,
        this.props.isDraft,
        this.props.isPreScreen,
      ].reduce((previousValue, currentFlag) => {
        return (previousValue << 1) | (currentFlag ? 1 : 0)
      }, 0)

      return ConstantMappings.GROUP_MESSAGE_FLAGS_TO_SELECTOR[flags] + this.props.group.groupHash
    }
    return "[mid='" + this.getMessageIds()[0] + "']"
  }

  hasFailedToSend() {
    return !!this.props.message.failedError
  }

  isExpiredAndReviewable() {
    return this.props.canApprove && this.props.isExpired
  }

  renderActionButtons() {
    //helper to reduce the amount of inline HTML combined with logic
    const actionButtonHtml = (
      className,
      icon,
      onClick,
      toolTip,
      iconColor = this.iconColor,
      iconSize = this.iconSize,
    ) => {
      return (
        <ActionButton
          className={className}
          color={iconColor}
          icon={icon}
          iconSize={iconSize}
          onClick={onClick}
        >
          {toolTip}
        </ActionButton>
      )
    }

    let buttonHtml = ''
    const deleteTooltip = this.props.isGroup ? translation._('Delete Group') : translation._('Delete')

    const renderMoreActions = () => {
      const items = this.getActionMenuItems()
      if (items.length > 0) {
        return (
          <MenuButtonTethered
            hasMoreIcon={false}
            items={items}
            onShowHideMenu={isShowing => this.props.onShowHideMenu(this.getMessageSelector(), isShowing)} // partially applying message selector because we deal with it here, not in MenuButtonTethered
            position={MenuPositions.BOTTOM_LEFT}
          >
            <Icon glyph={Ellipsis} size={this.iconSize} />
          </MenuButtonTethered>
        )
      }

      return null
    }

    const renderActionButton = () => {
      if (this.props.isLegacy) {
        return (
          <ActionButton
            className="x-delete"
            color={this.iconColor}
            icon={EmblemTrash}
            iconSize={this.iconSize}
            onClick={this.onDeleteClick}
          >
            {deleteTooltip}
          </ActionButton>
        )
      }
      return (
        <ActionButton
          className="x-reject"
          color="#FF3F02"
          icon={XLight}
          iconSize={this.iconSize}
          onClick={this.onRejectMessage}
        >
          {this.getRejectTooltipText()}
        </ActionButton>
      )
    }

    if (this.props.isApproval && this.props.canApprove && !this.props.isExpired) {
      buttonHtml = (
        <div className="-actionButtons">
          <ActionButton
            className="x-approve"
            color="#8DC63F"
            icon={IconCheck}
            iconSize={this.iconSize}
            onClick={this.onApproveMessage}
          >
            {this.getApproveTooltipText()}
          </ActionButton>
          {renderActionButton()}
          {renderMoreActions()}
        </div>
      )
    } else {
      const editTooltip = this.props.isGroup ? translation._('Edit Group') : translation._('Edit')
      const retryTooltip = translation._('Retry')

      let showDeleteButton = this.props.canDelete
      if (showDeleteButton === null) {
        //this is weird, but if the message has failed to send or if the person can approve and the message is expired, do not allow the user to delete
        //maintaining the logic as it used to be
        showDeleteButton = !(this.hasFailedToSend() || this.isExpiredAndReviewable())
      }

      let showEditButton = !this.props.isFailed && this.props.canEdit && !this.isReplyApproval()

      if (darklaunch.isFeatureEnabledOrBeta('PUB_27301_DISABLE_LEGACY_GROUP_EDIT')) {
        showEditButton = showEditButton && !this.props.isGroup
      }

      let showRetryButton = this.props.isFailed

      buttonHtml = (
        <div className="-actionButtons">
          {showRetryButton &&
            actionButtonHtml('x-retry', ArrowRoundCounterClockwise, this.onRetryClick, retryTooltip)}
          {showEditButton && actionButtonHtml('x-edit', Pencil, this.onEditMessage, editTooltip)}
          {showDeleteButton
            ? actionButtonHtml('x-delete', EmblemTrash, this.onDeleteClick, deleteTooltip)
            : null}
          {renderMoreActions()}
        </div>
      )
    }

    return buttonHtml
  }

  renderActions() {
    return (
      <div className="-messageActionsBody">
        {this.props.canEdit || this.props.isDraft || this.props.canDelete ? this.renderActionButtons() : null}
      </div>
    )
  }

  render() {
    return <div className="rc-MessageActions">{this.renderActions()}</div>
  }
}

MessageActions.propTypes = {
  approval: PropTypes.object,
  approveMessage: PropTypes.func,
  canApprove: PropTypes.bool,
  canDelete: PropTypes.bool,
  canEdit: PropTypes.bool,
  editMessage: PropTypes.func,
  group: PropTypes.object,
  isApproval: PropTypes.bool,
  isComment: PropTypes.bool,
  isDraft: PropTypes.bool,
  isExpired: PropTypes.bool,
  isFailed: PropTypes.bool,
  isGroup: PropTypes.bool,
  isLegacy: PropTypes.bool,
  isPreScreen: PropTypes.bool,
  isReply: PropTypes.bool,
  message: PropTypes.object.isRequired,
  messageId: PropTypes.number.isRequired,
  onRetryClick: PropTypes.func,
  onShowHideMenu: PropTypes.func,
  renderDeleteModal: PropTypes.func,
  renderRejectModal: PropTypes.func,
  sequenceNumber: PropTypes.number,
  socialNetworkIds: PropTypes.array,
}

MessageActions.defaultProps = {
  canDelete: null,
  canEdit: false,
  isApproval: false,
  isComment: false,
  isDraft: false,
  isExpired: false,
  isFailed: false,
  isGroup: false,
  isPreScreen: false,
  isReply: false,
  sequenceNumber: -1,
}

MessageActions.displayName = 'Message Actions'
