/**
 * @format
 * @preventMunge
 */

import './message-approval-history-modal.less'

import PropTypes from 'prop-types'
import React from 'react'
import _ from 'underscore'
import SimpleModal from 'hs-nest/lib/components/modal/simple-modal'
import Button from 'hs-nest/lib/components/buttons/button'
import translation from 'hs-nest/lib/utils/translation'
import moment from 'moment'
import ConstantMappings from '../../constants/constant-mappings'
import Constants from '../../constants/constants'
import JsxUtils from 'hs-nest/lib/utils/jsx-utils'

/* fe-global */
import Icon from '@fp-icons/icon-base'
import { FocusManager } from 'fe-pnc-lib-focus-manager'

const COMPONENT_CLASS_NAME = 'rc-MessageApprovalHistoryModal'

export default class MessageApprovalHistoryModal extends React.Component {
  constructor(props) {
    super(props)

    this.iconColor = '#949A9B'

    this.getPendingDetails = this.getPendingDetails.bind(this)
    this.onBackButtonClick = this.onBackButtonClick.bind(this)
    this.onClose = this.onClose.bind(this)
    this.renderActions = this.renderActions.bind(this)
  }

  componentDidMount() {
    const node = document.querySelector(`.${COMPONENT_CLASS_NAME}`)
    if (node) {
      FocusManager.addElement(node)
      FocusManager.focus()
      FocusManager.trapFocus()
    }
  }

  componentWillUnmount() {
    const node = document.querySelector(`.${COMPONENT_CLASS_NAME}`)
    if (node) FocusManager.remove(node)
  }

  onBackButtonClick() {
    this.props.onClose()
  }

  onClose() {
    this.props.onClose()
  }

  getPendingDetails() {
    let labelText = ConstantMappings.APPROVAL_ACTION_TYPE_TO_LABEL[
      Constants.APPROVAL_ACTION_TYPES.PENDING
    ].replace('%s1', this.props.details.reviewers[0].name)
    labelText = JsxUtils.jsxFromTemplate(labelText)
    const actionTimestamp = this.props.actions[this.props.actions.length - 1].timestamp
    let actionTime = moment(actionTimestamp * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS).fromNow(true)
    actionTime = this.simplifyTimestamp(actionTime)

    const pendingLabelType =
      ConstantMappings.APPROVAL_ACTION_TYPE_TO_ICON[Constants.APPROVAL_ACTION_TYPES.PENDING]

    return (
      <li className="-action">
        <div className="-icon">{this.renderActionIcon(pendingLabelType)}</div>
        <div className="-details">
          <div className="-description fs-exclude-container">{labelText}</div>
          <div className="-timestamp">{actionTime}</div>
        </div>
      </li>
    )
  }

  simplifyTimestamp(timestamp) {
    if (timestamp === 'a few seconds') {
      return '< 1m'
    } else if (timestamp === 'a day') {
      return '1d'
    } else if (timestamp === 'a minute') {
      return '1m'
    } else if (timestamp === 'an hour') {
      return '1h'
    } else if (timestamp === 'a year') {
      return '1y'
    }

    return timestamp
      .replace(/\s\bdays?\b/g, 'd')
      .replace(/\s\bhours?\b/g, 'h')
      .replace(/\s\bminutes?\b/g, 'm')
      .replace(/\s\byears?\b/g, 'y')
  }

  renderActionReason(reason) {
    return <div className="-reason">{reason}</div>
  }

  renderActionIcon(labelType) {
    return <Icon className="x-actionIcon" fill={this.iconColor} size={16} glyph={labelType} width={'16px'} />
  }

  shouldShowReason(actionType) {
    return (
      actionType !== Constants.APPROVAL_ACTION_TYPES.SENDFAIL &&
      actionType !== Constants.APPROVAL_ACTION_TYPES.SCHEDULEFAIL
    )
  }

  renderAction(action, index) {
    const labelType =
      action.actionType === Constants.APPROVAL_ACTION_TYPES.RESET
        ? null
        : ConstantMappings.APPROVAL_ACTION_TYPE_TO_ICON[action.actionType]
    let labelText = ConstantMappings.APPROVAL_ACTION_TYPE_TO_LABEL[action.actionType]
    if (action.actionType !== Constants.APPROVAL_ACTION_TYPES.EXPIRED) {
      labelText = labelText.replace('%s1', action.actorName)
    }
    labelText = JsxUtils.jsxFromTemplate(labelText)
    let actionTime = moment(action.timestamp * Constants.DATE_TIME.NUM_SECONDS_IN_MILLISECONDS).fromNow(true)
    actionTime = this.simplifyTimestamp(actionTime)

    const shouldNotRenderIcon =
      action.actionType === Constants.APPROVAL_ACTION_TYPES.RESET ||
      action.actionType === Constants.APPROVAL_ACTION_TYPES.SENDFAIL ||
      action.actionType === Constants.APPROVAL_ACTION_TYPES.SCHEDULEFAIL ||
      action.actionType === Constants.APPROVAL_ACTION_TYPES.EXPIRE
    return (
      <li className="-action" key={index}>
        <div className="-icon">{shouldNotRenderIcon ? null : this.renderActionIcon(labelType)}</div>
        <div className="-details">
          <div className="-description fs-exclude-container">{labelText}</div>
          <div className="-timestamp">{actionTime}</div>
          {action.reason && this.shouldShowReason(action.actionType)
            ? this.renderActionReason(action.reason)
            : null}
        </div>
      </li>
    )
  }

  renderActions() {
    let messageActions
    if (_.isUndefined(this.props.actions)) {
      messageActions = <li className="-action">{translation._('Loading')}</li>
    } else if (this.props.actions.length) {
      messageActions = this.props.actions.map((action, index) => {
        // Only render the action if it is a recognised action
        return Constants.APPROVAL_ACTION_TYPES.hasOwnProperty(action.actionType)
          ? this.renderAction(action, index)
          : null
      })
    } else {
      messageActions = <li className="-action">{translation._('No actions found for this approval')}</li>
    }

    return (
      <ul className="-actionsList">
        {messageActions}
        {this.props.isPending ? this.getPendingDetails() : null}
      </ul>
    )
  }

  renderBody() {
    return <div className="-actions">{this.renderActions()}</div>
  }

  renderFooter() {
    return (
      <div>
        <Button btnStyle="secondary" btnType="button" onClick={this.onBackButtonClick}>
          {translation._('Back')}
        </Button>
      </div>
    )
  }

  render() {
    return (
      <div className={`${COMPONENT_CLASS_NAME} fs-unmask-container`} tabIndex={-1}>
        <SimpleModal
          footerContent={this.renderFooter()}
          hasBackdrop={true}
          hasCloseButton={true}
          onRequestHide={this.props.onClose}
          titleText={translation._('Approval History')}
          width="500px"
        >
          {this.renderBody()}
        </SimpleModal>
      </div>
    )
  }
}

MessageApprovalHistoryModal.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.object).isRequired,
  details: PropTypes.object,
  isPending: PropTypes.bool.isRequired,
  isPreScreen: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  timezoneOffset: PropTypes.number.isRequired,
}

MessageApprovalHistoryModal.displayName = 'Message Approval History Modal'
