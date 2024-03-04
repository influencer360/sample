/**
 * @format
 * @preventMunge
 */

import './assignee-search.less'

import PropTypes from 'prop-types'
import React from 'react'
import ReactDOM from 'react-dom'
import _ from 'underscore'
import translation from 'hs-nest/lib/utils/translation'
import SearchBar from './search-bar/search-bar'
import AssigneeSearchResult from './assignee-search-result/assignee-search-result'

/**
 * @classdesc Displays the search bar component, the list of search results and the selected search result component.
 * Taken from hs-app-streams
 */
export default class AssigneeSearch extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      highlightedAssigneeIndex: -1,
      isSearching: false,
      searchValue: '',
      selectedAssignee: props.selectedAssignee,
    }

    this._onInputChange = this._onInputChange.bind(this)
    this._onKeyDown = this._onKeyDown.bind(this)
    this._onInputBlur = this._onInputBlur.bind(this)
    this._onInputFocus = this._onInputFocus.bind(this)
    this._onSelectedAssigneeClick = this._onSelectedAssigneeClick.bind(this)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!_.isUndefined(nextProps.approvers) && !_.isEqual(nextProps.approvers, this.props.approvers)) {
      this.setState({
        highlightedAssigneeIndex: 0,
      })
    }
  }

  _renderSearchBar() {
    var hasAssignee = !_.isEmpty(this.state.selectedAssignee)
    var placeholder = hasAssignee ? '' : translation._('Search for a team or team member')
    return (
      <SearchBar
        onBlur={this._onInputBlur}
        onChange={this._onInputChange}
        onChangeDebounce={this.props.onChangeDebounce}
        onFocus={this._onInputFocus}
        onKeyDown={this._onKeyDown}
        placeholder={placeholder}
        showSpinner={false}
        value={this.state.searchValue}
      />
    )
  }

  _renderSearchResults() {
    var areResultsVisible = this.state.isSearching && _.isEmpty(this.state.selectedAssignee)
    var searchResults

    if (_.isUndefined(this.props.approvers)) {
      searchResults = <li className="-message">{translation._('Loading')}</li>
    } else if (this.props.approvers.length) {
      searchResults = this.props.approvers.map((assignee, index) => {
        var key
        if (assignee.memberId) {
          key = assignee.teamId + '-' + assignee.memberId
        } else if (assignee.teamId) {
          key = assignee.teamId
        } else {
          key = index
        }

        var isHighlighted = index === this.state.highlightedAssigneeIndex
        return (
          <li
            key={key}
            onClick={this._handleAssigneeClick.bind(this, index)}
            onMouseDown={e => e.preventDefault()}
            onMouseOver={this._handleMouseOver.bind(this, index)}
          >
            <AssigneeSearchResult assignee={assignee} isHighlighted={isHighlighted} />
          </li>
        )
      })
    } else {
      searchResults = <li className="-message">{translation._('No assignees found with this criteria')}</li>
    }

    return (
      <ul className="-dropdown" style={{ display: areResultsVisible ? 'block' : 'none' }}>
        {searchResults}
      </ul>
    )
  }

  _renderSelectedAssignee() {
    var assignee = this.state.selectedAssignee
    var hasAssignees = !_.isEmpty(assignee)
    var selectedAssignee = hasAssignees ? <AssigneeSearchResult assignee={assignee} /> : <span />

    return (
      <div
        className="rc-SearchSelectedAssignee"
        onClick={this._onSelectedAssigneeClick}
        style={{
          display: hasAssignees ? 'block' : 'none',
        }}
      >
        {selectedAssignee}
      </div>
    )
  }

  _onInputChange(value) {
    this.setState({
      isSearching: true,
      searchValue: value,
    })
    this._scrollToTop()
    if (_.isFunction(this.props.onSearch)) {
      this.props.onSearch(value)
    }
  }

  _onInputFocus(e) {
    this.setState({
      highlightedAssigneeIndex: 0,
    })
    this._onInputChange(e.target.value)
  }

  _onInputBlur() {
    this.setState({
      isSearching: false,
      highlightedAssigneeIndex: -1,
    })
  }

  _onKeyDown(e) {
    var key = e.key
    var highlightedIndex
    var previousHighlightedIndex = this.state.highlightedAssigneeIndex

    switch (key) {
      case 'Enter':
        e.preventDefault()
        if (previousHighlightedIndex > -1) {
          this._handleAssigneeSelect(previousHighlightedIndex)
          this._blurInput()
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        highlightedIndex = previousHighlightedIndex > 0 ? previousHighlightedIndex - 1 : 0
        this._updateHighlightedAssignee(key, previousHighlightedIndex, highlightedIndex)
        break

      case 'ArrowDown':
        e.preventDefault()
        if (e.target.value === '' && previousHighlightedIndex < 0) {
          this._onInputChange('')
        }
        if (this.props.approvers) {
          var lastAssigneeIndex = this.props.approvers.length - 1
          highlightedIndex =
            previousHighlightedIndex < lastAssigneeIndex ? previousHighlightedIndex + 1 : lastAssigneeIndex
          this._updateHighlightedAssignee(key, previousHighlightedIndex, highlightedIndex)
        }
        break
    }
  }

  _handleMouseOver(highlightedAssigneeIndex) {
    if (this.state.highlightedAssigneeIndex !== highlightedAssigneeIndex) {
      this.setState({ highlightedAssigneeIndex })
    }
  }

  _scrollToTop() {
    _.defer(() => {
      var list = ReactDOM.findDOMNode(this).getElementsByClassName('-dropdown')[0]
      list.scrollTop = 0
    })
  }

  _scrollList(key) {
    var list = ReactDOM.findDOMNode(this).getElementsByClassName('-dropdown')[0]
    var top = list.scrollTop
    var listItem = list.getElementsByTagName('li')[0]
    if (list && listItem) {
      var itemHeight = listItem.getBoundingClientRect().height
      if (key === 'ArrowUp') {
        if (top !== 0) {
          list.scrollTop = top - itemHeight
        }
      } else {
        list.scrollTop = top + itemHeight
      }
    }
  }

  _updateHighlightedAssignee(key, previousHighlightedIndex, highlightedAssigneeIndex) {
    if (previousHighlightedIndex >= 0) {
      this._scrollList(key)
    }
    if (previousHighlightedIndex !== highlightedAssigneeIndex) {
      this.setState({ highlightedAssigneeIndex })
    }
  }

  _handleAssigneeClick(assigneeIndex) {
    this._blurInput()
    this._handleAssigneeSelect(assigneeIndex)
  }

  _handleAssigneeSelect(assigneeIndex) {
    var selectedAssignee = this.props.approvers[assigneeIndex]
    if (selectedAssignee) {
      this.setState(
        {
          selectedAssignee: selectedAssignee,
          highlightedAssigneeIndex: -1,
        },
        () => {
          this._clearInput()
          if (_.isFunction(this.props.onSelectAssignee)) {
            this.props.onSelectAssignee(selectedAssignee)
          }
        },
      )
    }
  }

  _onSelectedAssigneeClick() {
    this.setState(
      {
        selectedAssignee: {},
      },
      () => {
        this._focusInput()
        this._clearInput()
        if (_.isFunction(this.props.onSelectAssignee)) {
          this.props.onSelectAssignee(this.state.selectedAssignee)
        }
      },
    )
  }

  _blurInput() {
    ReactDOM.findDOMNode(this)
      .getElementsByTagName('input')[0]
      .blur()
  }

  _focusInput() {
    ReactDOM.findDOMNode(this)
      .getElementsByTagName('input')[0]
      .focus()
  }

  _clearInput() {
    this.setState({
      searchValue: '',
    })
  }

  render() {
    return (
      <div className="rc-x-AssigneeSearch">
        {this._renderSearchBar()}
        {this._renderSearchResults()}
        {this._renderSelectedAssignee()}
      </div>
    )
  }
}

AssigneeSearch.displayName = 'AssigneeSearch'

AssigneeSearch.propTypes = {
  approvers: PropTypes.array,
  onChangeDebounce: PropTypes.number,
  onSearch: PropTypes.func,
  onSelectAssignee: PropTypes.func,
  selectedAssignee: PropTypes.object,
}

AssigneeSearch.defaultProps = {
  onChangeDebounce: 0,
}
