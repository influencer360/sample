/** @module components/list-search/list-search */
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Styles Dependencies
require('./list-search.less');
/* fe-global */
const icon_base_1 = __importDefault(require("@fp-icons/icon-base"));
const symbol_x_light_1 = __importDefault(require("@fp-icons/symbol-x-light"));
const emblem_magnify_1 = __importDefault(require("@fp-icons/emblem-magnify"));
// Script Dependencies
var React = require('react');
const PropTypes = require('prop-types');
var TextInput = require('hs-nest/lib/components/inputs/text-input');
var Button = require('hs-nest/lib/components/buttons/button');
var Throbber = require('hs-nest/lib/components/shared/throbbing-loader');
var translation = require('hs-nest/lib/utils/translation');
var _ = require('underscore');
var { bool, number, func, string } = PropTypes;
class ListSearch extends React.Component {
    constructor(props) {
        super(props);
        this.handleOnChange = _.debounce(this.handleOnChange.bind(this), this.props.autoSearchDelay);
        this.handleOnSubmit = this.handleOnSubmit.bind(this);
        this.handleClearSearch = this.handleClearSearch.bind(this);
    }
    handleOnChange(value) {
        if (this.props.onChange && _.isFunction(this.props.onChange)) {
            this.props.onChange(value);
        }
        return null;
    }
    handleClearSearch() {
        this.props.onClear();
        // set focus back to search bar
        var searchBar = document.getElementsByClassName('rc-TextInput')[0];
        if (searchBar) {
            searchBar.getElementsByTagName('input')[0].focus();
        }
    }
    handleOnSubmit() {
        if (this.props.onSubmit && _.isFunction(this.props.onSubmit)) {
            this.props.onSubmit();
        }
        return null;
    }
    renderSearchThrobber() {
        if (this.props.isLoading) {
            return (React.createElement("span", { className: 'search-throbber' },
                React.createElement(Throbber, null)));
        }
        return null;
    }
    renderClearSearch() {
        if (!this.props.isLoading && this.props.isSearching) {
            return (React.createElement(Button, { "aria-label": translation._('Clear tag search'), className: 'clear-search', onClick: this.handleClearSearch, style: {
                    backgroundColor: 'unset'
                } },
                React.createElement(icon_base_1.default, { className: 'rc-IconBase', fill: 'currentColor', glyph: symbol_x_light_1.default, size: 14 })));
        }
        return null;
    }
    render() {
        return (React.createElement("div", { className: 'rc-ListSearch' },
            React.createElement(icon_base_1.default, { className: 'rc-IconBase', fill: '#949a9b', glyph: emblem_magnify_1.default, size: 20 }),
            React.createElement(TextInput, { "aria-describedby": this.props.ariaDescribedById, shouldTurnOffAutoComplete: true, onChange: this.handleOnChange, placeholder: translation._('Find tags'), value: this.props.searchFilter }),
            this.renderSearchThrobber(),
            this.renderClearSearch()));
    }
}
ListSearch.displayName = 'ListSearch';
ListSearch.propTypes = {
    ariaDescribedById: string,
    autoSearchDelay: number,
    isLoading: bool,
    isSearching: bool,
    onChange: func,
    onClear: func,
    onSubmit: func,
    searchFilter: string
};
ListSearch.defaultProps = {
    autoSearchDelay: 500,
    isLoading: false,
    isSearching: false,
    onChange: function onChange() { },
    onClear: function onClear() { },
    onSubmit: function onSubmit() { },
    searchFilter: ''
};
module.exports = ListSearch;
