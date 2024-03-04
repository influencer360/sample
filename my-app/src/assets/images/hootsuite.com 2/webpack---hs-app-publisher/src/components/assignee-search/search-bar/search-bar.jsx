/**
 * @format
 * @module components/inputs/text-button
 */

import './search-bar.less'

import PropTypes from 'prop-types'
import React from 'react'
import TextInput from 'hs-nest/lib/components/inputs/text-input'

/* fe-global */
import Icon from '@fp-icons/icon-base'
import Search from '@fp-icons/emblem-magnify'
import ArrowRoundCounterClockwise from '@fp-icons/arrow-round-counter-clockwise'

/**
 * @classdesc Displays the search bar for input
 * Taken from hs-app-streams
 */
export default class SearchBar extends React.Component {
  render() {
    return (
      <div className="rc-SearchBar">
        <span className="-icon">
          <Icon glyph={Search} />
        </span>
        <span
          className="-spinner"
          style={{
            display: this.props.showSpinner ? 'block' : 'none',
          }}
        >
          <Icon className="fa-spin" glyph={ArrowRoundCounterClockwise} />
        </span>
        <TextInput {...this.props} />
      </div>
    )
  }
}

SearchBar.displayName = 'SearchBar'

SearchBar.propTypes = {
  showSpinner: PropTypes.bool,
}

SearchBar.propValues = {
  showSpinner: false,
}
