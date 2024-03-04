'use strict';
var PropTypes = require('prop-types');
// Script dependencies
var React = require('react');
var _ = require('underscore');
var findIndex = require('lodash.findindex');
var translation = require('hs-nest/lib/utils/translation');
var domUtils = require('hs-nest/lib/utils/dom-utils');
var keyMirror = require('keymirror');
var KeyCode = require('key-code');
var TextInput = require('hs-nest/lib/components/inputs/text-input');
var SimpleMenu = require('hs-nest/lib/components/menus/simple-menu');
// Style dependencies
require('./autocomplete-input.less');
var menuPlacement = keyMirror({
    ABOVE: null,
    BELOW: null
});
class AutocompleteInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showingMenu: false,
            selectedItemIndex: props.mustSelectFromMenuItems ? 0 : -1,
            value: props.value
        };
        // Invalidate the menu scroll top value until it's first opened
        this.currentScrollTop = null;
        this._updateMenuState = this._updateMenuState.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._renderMenu = this._renderMenu.bind(this);
        this._showMenu = this._showMenu.bind(this);
        this._hideMenu = this._hideMenu.bind(this);
        this._menuIndexChange = this._menuIndexChange.bind(this);
        this._mouseOverMenuItem = this._mouseOverMenuItem.bind(this);
        this._selectMenuItem = this._selectMenuItem.bind(this);
        this._makeMenuItemVisible = this._makeMenuItemVisible.bind(this);
        this._onBlur = this._onBlur.bind(this);
        this._onFocus = this._onFocus.bind(this);
        this.getInputNode = this.getInputNode.bind(this);
    }
    componentDidMount() {
        this._addDomListeners();
    }
    componentWillUnmount() {
        this._removeDomListeners();
    }
    _addDomListeners() {
        document.addEventListener('click', this._hideMenu);
    }
    _removeDomListeners() {
        document.removeEventListener('click', this._hideMenu);
    }
    _getDefaultMenuIndex() {
        return this.props.mustSelectFromMenuItems ? Math.min(this.state.selectedItemIndex, this.props.menuItems.length) : -1;
    }
    _showMenu() {
        // Reset the scroll top on menu open
        this.currentScrollTop = null;
        this.setState({
            showingMenu: true,
            selectedItemIndex: this._getDefaultMenuIndex()
        });
    }
    isMenuVisible() {
        // menu is only visible if showing menu it set to true, and
        // either it is not in group input or there are menu items
        return this.state.showingMenu && (!this.props.isInGroupInput || this.props.menuItems.length);
    }
    _hideMenu() {
        this.setState({
            showingMenu: false,
            selectedItemIndex: this._getDefaultMenuIndex()
        });
    }
    _selectMenuItem(selectedItemIndex, hideMenu) {
        if (this.hideMenuTimeout) {
            // don't hide the menu, as it will be hidden once the method executes
            clearTimeout(this.hideMenuTimeout);
            delete this.hideMenuTimeout;
        }
        if (this.props.mustSelectFromMenuItems && this.props.menuItems.length === 0) {
            // No results were found, ignore the selection and close the menu
            this.setState({
                showingMenu: false,
                selectedItemIndex: this._getDefaultMenuIndex()
            });
            return;
        }
        selectedItemIndex = (selectedItemIndex === undefined) ? this.state.selectedItemIndex : selectedItemIndex;
        hideMenu = (hideMenu === undefined) ? true : hideMenu;
        var label;
        var value;
        var selectedItem;
        if (selectedItemIndex !== -1 && this.props.menuItems[selectedItemIndex]) {
            selectedItem = this.props.menuItems[selectedItemIndex];
            label = selectedItem.label;
            value = selectedItem.value;
            this.setState({
                value: value
            });
            this.props.onChange(value);
        }
        else {
            // Use the current input value
            selectedItem = this.inputRef.state;
            label = selectedItem.value;
            value = selectedItem.value;
        }
        if (this.props.value !== value) {
            this.props.onMenuItemSelect({
                index: selectedItemIndex,
                label: label,
                value: value
            });
        }
        if (hideMenu) {
            this.inputRef.blurInput();
            this.setState({
                showingMenu: false,
                selectedItemIndex: this._getDefaultMenuIndex()
            });
        }
    }
    getInputNode() {
        return this.inputRef.getInputNode();
    }
    _menuIndexChange(offset) {
        if (this.isMenuVisible()) {
            var newIndex = this.state.selectedItemIndex + offset;
            var maxIndex = this.props.menuItems.length - 1;
            newIndex = (newIndex < 0) ? maxIndex : (newIndex > maxIndex) ? 0 : newIndex;
            if (newIndex !== this.state.selectedItemIndex) {
                this.setState({
                    selectedItemIndex: newIndex
                });
                _.defer(() => { this._makeMenuItemVisible(offset); });
            }
        }
    }
    _makeMenuItemVisible(offset) {
        // make sure menu is visible before updating it
        if (!this.isMenuVisible()) {
            return;
        }
        var menu = this.menuRef.getDomNode();
        var selectedItem = menu.getElementsByClassName('x-selected');
        if (selectedItem.length) {
            selectedItem = selectedItem[0];
            var menuHeight = domUtils.getDimensions(menu).height;
            var menuScrollTop = this.currentScrollTop;
            var scrollToValue = menuScrollTop; // Don't adjust unless needed
            var selectedItemHeight = domUtils.getDimensions(selectedItem).height;
            var selectedItemTop = domUtils.getPosition(selectedItem).top;
            var selectedItemBottom = selectedItemTop + selectedItemHeight;
            if (selectedItemTop < 0 || selectedItemBottom > menuHeight) {
                if (offset < 0) { // Up arrow pressed
                    if (selectedItemTop < 0) {
                        scrollToValue = menuScrollTop + selectedItemTop;
                    }
                    else {
                        scrollToValue = menuScrollTop - menuHeight + selectedItemBottom;
                    }
                }
                else if (offset > 0) { // Down arrow pressed
                    if (selectedItemBottom > menuHeight) {
                        scrollToValue = menuScrollTop - menuHeight + selectedItemBottom;
                    }
                    else {
                        scrollToValue = 0;
                    }
                }
            }
            this.currentScrollTop = scrollToValue;
            menu.scrollTop = scrollToValue;
        }
    }
    _mouseOverMenuItem(label, value) {
        var newIndex = findIndex(this.props.menuItems, item => item.label === label && item.value === value);
        this.setState({
            selectedItemIndex: newIndex
        });
    }
    _updateMenuState(value, clickedClear) {
        // this will close all other autocomplete inputs
        document.body.click();
        this.setState({
            value: value
        });
        if (value.length >= 1) {
            this._showMenu();
        }
        else {
            this._hideMenu();
        }
        this.props.onChange(value, clickedClear);
    }
    componentDidUpdate() {
        if (this.isMenuVisible() && this.currentScrollTop === null) {
            var menu = this.menuRef.getDomNode();
            // Initialize the menu scroll position
            if (this.props.menuPlacement === AutocompleteInput.menuPlacement.BELOW) {
                this.currentScrollTop = 0;
            }
            else {
                // Reset the menu scroll top position
                menu.scrollTop = 0;
                var lastMenuItem = menu.lastChild;
                this.currentScrollTop = domUtils.getPosition(lastMenuItem).top + domUtils.getDimensions(lastMenuItem).height - domUtils.getDimensions(menu).height;
            }
            menu.scrollTop = this.currentScrollTop;
        }
    }
    _onKeyDown(e) {
        if (this.props.isInGroupInput) {
            if (!this.isMenuVisible() || !this.props.menuItems.length) {
                this.props.onKeyDown(e);
            }
        }
        switch (e.nativeEvent.keyCode) {
            case KeyCode.ESC: // Escape, close the menu
                e.preventDefault();
                this._hideMenu();
                break;
            case KeyCode.UP: // Up arrow key, move them to previous input
                e.preventDefault();
                this._menuIndexChange(-1);
                break;
            case KeyCode.ENTER: // Enter
            case KeyCode.TAB: // Tab key, select the appropriate item
                if (this.props.mustSelectFromMenuItems) {
                    // We're forcing the user to choose one of the returned menu item values
                    if (this.isMenuVisible()) {
                        this._selectMenuItem(this.state.selectedItemIndex);
                    }
                }
                else {
                    this._selectMenuItem(this.state.selectedItemIndex);
                }
                break;
            case KeyCode.DOWN: // Down arrow key, move them to next input
                e.preventDefault();
                this._menuIndexChange(1);
                break;
            case KeyCode.BACKSPACE: // Delete key
                // Delete the last character, no further actions necessary
                break;
            default:
                if (!this.props.mustSelectFromMenuItems) {
                    // Pass through the current input value if we're not enforcing "select from menu items"
                    _.defer(this._selectMenuItem, this.state.selectedItemIndex, false);
                }
                break;
        }
    }
    _onBlur() {
        // set timeout, so that if blur happens due to user selecting the menu item
        // we can cancel hiding the menu, otherwise user cannot select the menu item
        this.hideMenuTimeout = setTimeout(() => {
            if (this.isMenuVisible()) {
                this._hideMenu();
            }
            delete this.hideMenuTimeout;
        }, 400);
        this.props.onBlur();
    }
    _onFocus() {
        if (this.props.reopenOnFocus) {
            this._showMenu();
        }
        this.props.onFocus();
    }
    _renderMenu() {
        var menu;
        var menuProps = {
            className: (this.props.menuPlacement === AutocompleteInput.menuPlacement.ABOVE) ? 'x-placeAbove' : '',
            maxHeight: this.props.maxMenuHeight,
            onItemMouseOver: this._mouseOverMenuItem
        };
        var menuStyle = { zIndex: domUtils.provisionIndex() };
        var menuItems = this.props.menuItems.map((menuItem, i) => {
            menuItem.onSelect = () => {
                this._selectMenuItem(i);
            };
            if (i === this.state.selectedItemIndex) {
                menuItem.isSelected = true;
            }
            else {
                menuItem.isSelected = false;
            }
            return menuItem;
        });
        if (this.isMenuVisible()) {
            if (this.props.menuItems.length) {
                menu = (React.createElement(SimpleMenu, { ...menuProps, items: menuItems, ref: (menuRef) => { if (menuRef) {
                        this.menuRef = menuRef;
                    } }, style: menuStyle }));
            }
            else {
                if (!this.props.isInGroupInput) {
                    var emptyResultsItem = [{
                            label: this.props.noResultsLabel,
                            value: translation._('No results found')
                        }];
                    menu = (React.createElement(SimpleMenu, { ...menuProps, items: emptyResultsItem, ref: (menuRef) => { if (menuRef) {
                            this.menuRef = menuRef;
                        } }, style: menuStyle }));
                }
            }
        }
        return menu;
    }
    _renderInput() {
        var textInputProps = _.omit(this.props, 'maxMenuHeight', 'menuItems', 'menuPlacement', 'mustSelectFromMenuItems', 'noResultsLabel', 'onBlur', 'onChange', 'onKeyDown', 'onMenuItemSelect', 'value', 'width');
        var inputValue = this.state.value;
        if (this.props.shouldMenuItemLabelForDisplay && this.state.selectedItemIndex > -1 && this.props.menuItems.length) {
            this.props.menuItems.some((menuItem) => {
                if (menuItem.value === this.state.value) {
                    inputValue = menuItem.label;
                    return true;
                }
            });
        }
        return (React.createElement(TextInput, { ...textInputProps, onBlur: this._onBlur, onChange: this._updateMenuState, onFocus: this._onFocus, onKeyDown: this._onKeyDown, 
            // due the following bug, ref is first passed as null and then as component
            // therefore you need to add null check
            // https://github.com/facebook/react/issues/4533
            ref: (inputRef) => { if (inputRef) {
                this.inputRef = inputRef;
            } }, renderClearBtn: true, value: inputValue }));
    }
    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(newProps) {
        if (newProps.value !== this.state.value) {
            this.setState({
                value: newProps.value
            });
        }
    }
    render() {
        var style = {
            width: this.props.width
        };
        return (React.createElement("div", { className: "rc-AutocompleteInput", style: style },
            this._renderInput(),
            this._renderMenu()));
    }
}
AutocompleteInput.displayName = 'AutocompleteInput';
AutocompleteInput.menuPlacement = menuPlacement;
var { arrayOf, bool, func, object, oneOf, oneOfType, shape, string } = PropTypes;
var menuItemDef = shape({
    label: string.isRequired,
    subLabel: string,
    value: string.isRequired,
    avatar: string
});
AutocompleteInput.propTypes = {
    isInGroupInput: bool,
    maxMenuHeight: string,
    menuItems: arrayOf(menuItemDef),
    menuPlacement: oneOf([AutocompleteInput.menuPlacement.ABOVE, AutocompleteInput.menuPlacement.BELOW]),
    mustSelectFromMenuItems: bool,
    noResultsLabel: string,
    onBlur: func,
    onChange: func,
    onFocus: func,
    onKeyDown: func,
    onMenuItemSelect: func,
    placeholder: string,
    reopenOnFocus: bool,
    shouldMenuItemLabelForDisplay: bool,
    value: oneOfType([string, object]),
    width: string
};
AutocompleteInput.defaultProps = {
    isInGroupInput: false,
    maxMenuHeight: '190px',
    menuItems: [],
    menuPlacement: AutocompleteInput.menuPlacement.BELOW,
    mustSelectFromMenuItems: false,
    noResultsLabel: translation._('No results found'),
    onBlur: () => { },
    onChange: () => { },
    onFocus: () => { },
    onKeyDown: () => { },
    onMenuItemSelect: () => { },
    placeholder: translation._('Enter keyword, phrase or hashtag'),
    reopenOnFocus: false,
    shouldMenuItemLabelForDisplay: false,
    value: '',
    width: '300px'
};
module.exports = AutocompleteInput;
