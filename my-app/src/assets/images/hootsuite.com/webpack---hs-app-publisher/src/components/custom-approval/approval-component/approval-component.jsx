/**
 * @format
 * @preventMunge
 */

import './approval-component.less'

import PropTypes from 'prop-types'
import React from 'react'
import _ from 'underscore'
import Constants from '../../../constants/constants'
import AssigneeSearch from '../../assignee-search/assignee-search'
import AssigneeSearchResult from '../../assignee-search/assignee-search-result/assignee-search-result'
import translation from 'hs-nest/lib/utils/translation'
import classnames from 'classnames'

/**
 * @classdesc ApprovalComponent wraps the search bar, title, order number for a single assignee if the assignee exists
 */
export default class ApprovalComponent extends React.Component {
  constructor(props) {
    super(props)
    this.getAssignees = this.getAssignees.bind(this)
    this.getTitle = this.getTitle.bind(this)
    this.getOrderNumber = this.getOrderNumber.bind(this)
    this.onSelectAssignee = this.onSelectAssignee.bind(this)
    this.onAddApproverClick = this.onAddApproverClick.bind(this)
    this.onRemoveApproverClick = this.onRemoveApproverClick.bind(this)
    this.renderAssigneeSearch = this.renderAssigneeSearch.bind(this)
    this.renderTitle = this.renderTitle.bind(this)
    this.renderDescription = this.renderDescription.bind(this)
    this.renderAssignee = this.renderAssignee.bind(this)
    this.renderOrderNumber = this.renderOrderNumber.bind(this)

    this.state = {
      isEnabled: props.isEnabled,
      includeSearch: props.includeSearch,
      selectedAssignee: props.selectedAssignee,
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      selectedAssignee: nextProps.selectedAssignee,
    })
  }

  getAssignees() {
    var approvers = this.props.approvers
    var hasAnyEditorOrAdmin = _.some(approvers, o => {
      return o.teamName === Constants.CUSTOM_APPROVALS_DEFAULT_SEARCH_VALUE
    })

    if (!approvers) {
      approvers = [Constants.CUSTOM_APPROVALS_ANY_ADMIN_OR_EDITOR]
    } else if (!hasAnyEditorOrAdmin) {
      approvers.unshift(Constants.CUSTOM_APPROVALS_ANY_ADMIN_OR_EDITOR)
    }
    return approvers
  }

  getTitle() {
    return this.state.isEnabled ? this.props.title : translation._('Add a ') + this.props.title
  }

  getOrderNumber() {
    var plusSign = <p className="-plusSign">+</p>
    return this.state.isEnabled ? this.props.orderNumber : plusSign
  }

  onSelectAssignee(assignee) {
    this.setState(
      {
        selectedAssignee: assignee,
      },
      () => {
        this.props.onSelectAssignee(assignee, this.props.orderNumber)
      },
    )
  }

  onAddApproverClick() {
    if (!this.state.isEnabled) {
      this.setState(
        {
          isEnabled: true,
          includeSearch: true,
        },
        () => {
          this.props.onApproverEnable(this.props.orderNumber)
        },
      )
    }
  }

  onRemoveApproverClick() {
    if (this.state.isEnabled) {
      this.setState(
        {
          isEnabled: false,
          includeSearch: false,
          selectedAssignee: {},
        },
        () => {
          this.props.onApproverDisable(this.props.orderNumber)
        },
      )
    }
  }

  renderAssigneeSearch() {
    if (this.state.includeSearch) {
      return (
        <AssigneeSearch
          approvers={this.getAssignees()}
          flux={this.props.flux}
          memberId={this.props.memberId}
          onSearch={this.props.onSearch}
          onSelectAssignee={this.onSelectAssignee}
          searchOrganizationId={this.props.ownerId}
          selectedAssignee={this.state.selectedAssignee}
        />
      )
    }
    return null
  }

  renderTitle() {
    return (
      <div className="-approvalTop">
        <p
          className={classnames({
            '-approvalTitle': true,
            '-enabled': this.state.isEnabled,
          })}
          onClick={this.onAddApproverClick}
        >
          {this.getTitle()}
        </p>
        {this.renderRemoveButton()}
      </div>
    )
  }

  renderRemoveButton() {
    if (this.state.isEnabled && this.props.canRemove) {
      return (
        <p className="-approvalRemoveButton" onClick={this.onRemoveApproverClick}>
          {translation._('Remove')}
        </p>
      )
    }
    return null
  }

  renderDescription() {
    if (this.state.isEnabled && this.props.description) {
      return <p className="-approvalDescription">{this.props.description}</p>
    }
    return null
  }

  renderAssignee() {
    if (this.state.isEnabled && !this.state.includeSearch) {
      return (
        <AssigneeSearchResult assignee={this.state.selectedAssignee} isHighlighted={false} isPreview={true} />
      )
    }
    return null
  }

  renderOrderNumber() {
    if (this.state.isEnabled) {
      return (
        <span className={classnames({ '-orderNumber': true, '-enabled': true })}>
          {this.getOrderNumber()}
        </span>
      )
    } else {
      return (
        <span
          className={classnames({ '-orderNumber': true, '-enabled': false })}
          onClick={this.onAddApproverClick}
        >
          {this.getOrderNumber()}
        </span>
      )
    }
  }

  render() {
    if (this.props.isVisible) {
      return (
        <div
          className={classnames({
            'rc-ApprovalComponent': true,
            '-hasSearchBar': this.state.includeSearch,
          })}
        >
          <div className="-leftContent">{this.renderOrderNumber()}</div>
          <div className="-rightContent">
            {this.renderTitle()}
            {this.renderDescription()}
            {this.renderAssigneeSearch()}
            {this.renderAssignee()}
          </div>
        </div>
      )
    } else {
      return null
    }
  }
}

ApprovalComponent.propTypes = {
  approvers: PropTypes.array,
  canRemove: PropTypes.bool,
  description: PropTypes.string,
  flux: PropTypes.object,
  includeSearch: PropTypes.bool,
  isEnabled: PropTypes.bool.isRequired,
  isVisible: PropTypes.bool,
  memberId: PropTypes.number.isRequired,
  onApproverDisable: PropTypes.func,
  onApproverEnable: PropTypes.func,
  onSearch: PropTypes.func,
  onSelectAssignee: PropTypes.func,
  orderNumber: PropTypes.number,
  ownerId: PropTypes.number.isRequired,
  selectedAssignee: PropTypes.object,
  title: PropTypes.string.isRequired,
}
