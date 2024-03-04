/** @format */

import './assignee-search-result.less'

import PropTypes from 'prop-types'
import React from 'react'
import classNames from 'classnames'
import HsProfileAvatar from 'hs-nest/lib/components/avatars/hs-profile-avatar/hs-profile-avatar'
import utils from 'hs-nest/lib/utils/static-assets'

/**
 * @classdesc Displays the assignee avatar, team name or combination of member and team names.
 * Taken from hs-app-streams
 */
export default class AssigneeSearchResult extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.isHighlighted !== this.props.isHighlighted || nextProps.assignee !== this.props.assignee
  }

  render() {
    var assignee = this.props.assignee
    var name = assignee.memberName
    if (assignee.teamName) {
      name = assignee.memberName ? assignee.memberName + ' - ' + assignee.teamName : assignee.teamName
    }

    var classes = classNames({
      'rc-AssigneeSearchResult': true,
      '-highlight': this.props.isHighlighted,
      '-preview': this.props.isPreview,
      'x-invalid': this.props.assignee.isInvalid,
    })

    return (
      <div className={classes}>
        <HsProfileAvatar
          alt={assignee.name}
          className="-avatar"
          round={true}
          size={30}
          src={utils.rootifyMemberAvatar(assignee.avatar, assignee.email)}
        />
        <span className="-name">{name}</span>
      </div>
    )
  }
}

AssigneeSearchResult.displayName = 'AssigneeSearchResult'

AssigneeSearchResult.propTypes = {
  assignee: PropTypes.object.isRequired,
  isHighlighted: PropTypes.bool,
  isPreview: PropTypes.bool,
}
