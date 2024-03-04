/** @format */

import PropTypes from 'prop-types'
import React from 'react'
import OverlayTrigger from 'hs-nest/lib/components/shared/overlay-trigger'
import Tooltip from 'hs-nest/lib/components/tooltip/tooltip'
import Button from 'hs-nest/lib/components/buttons/button'

/* fe-global */
import Icon from '@fp-icons/icon-base'

export default class ActionButton extends React.Component {
  render() {
    return (
      <OverlayTrigger overlay={<Tooltip>{this.props.children}</Tooltip>} placement="top">
        <Button btnStyle="icon" className={this.props.className} onClick={this.props.onClick}>
          <Icon
            className="-icon"
            fill={this.props.color}
            size={this.props.iconSize}
            glyph={this.props.icon}
          />
        </Button>
      </OverlayTrigger>
    )
  }
}

ActionButton.displayName = 'ActionButton'

ActionButton.propTypes = {
  children: PropTypes.any,
  className: PropTypes.string,
  color: PropTypes.string,
  icon: PropTypes.string.isRequired,
  iconSize: PropTypes.string,
  onClick: PropTypes.func,
}

ActionButton.defaultProps = {
  color: '#949a9b',
  iconSize: '15',
}
