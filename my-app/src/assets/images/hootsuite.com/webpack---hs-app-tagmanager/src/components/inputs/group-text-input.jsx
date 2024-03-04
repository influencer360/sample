'use strict';
// Styles Dependencies
require('./group-text-input.less');
var PropTypes = require('prop-types');
/* Script Dependencies */
var React = require('react');
var _ = require('underscore');
var findIndex = require('lodash.findindex');
var TextInput = require('hs-nest/lib/components/inputs/text-input');
var translation = require('hs-nest/lib/utils/translation');
var KeyCode = require('key-code');
var AutocompleteInput = require('./autocomplete-input');
class GroupTextInput extends React.Component {
    constructor(props) {
        super(props);
        var values = props.values || [];
        if (_.last(values) !== '') {
            values.push('');
        }
        this.state = {
            values: values
        };
        this.onBlur = this.onBlur.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.removeEmptyFields = this.removeEmptyFields.bind(this);
        this.isFocusedLastIndex = this.isFocusedLastIndex.bind(this);
    }
    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(newProps) {
        if (newProps.values !== this.props.values) {
            var values = newProps.values || [];
            if (_.last(values) !== '') {
                values.push('');
            }
            this.setState({
                values: values
            });
        }
    }
    onClickClear(removeIdx) {
        var newValues = this.state.values.filter((value, idx) => idx !== removeIdx);
        this.setState({ values: newValues });
        this.props.onChange(newValues);
    }
    removeEmptyFields() {
        var newValues = this.state.values.filter(value => !/^\s*$/.test(value));
        if (_.last(newValues) !== '') {
            newValues.push('');
        }
        var hasRemovedEmptyFields = newValues.length !== this.state.values.length;
        if (hasRemovedEmptyFields) {
            this.setState({ values: newValues });
            var onChangeValues = _.clone(newValues);
            onChangeValues.pop();
            this.props.onChange(onChangeValues);
        }
    }
    // First arg 'value' is needed to prevent TextInput from clearing empty fields
    // when a non-empty string is passed
    updateInputValues(idx, value, clickedClear) {
        var values = _.clone(this.state.values);
        if (clickedClear) {
            values.splice(idx, 1);
        }
        else {
            values[idx] = value;
        }
        if (_.last(values) !== '') {
            values.push('');
        }
        this.setState({
            values: values
        });
        // remove the empty index before calling on change, since last value is always empty
        var onChangeValues = _.clone(values);
        onChangeValues.pop();
        this.props.onChange(onChangeValues);
        // propogate single value that can be used for
        // populating code completion suggestions
        if (this.props.isAutoComplete) {
            this.props.onUserInputChange(value);
        }
    }
    isFocusedFirstIndex() {
        var focusIdx = this.getFocussedIndex();
        return focusIdx === 0;
    }
    isFocusedLastIndex() {
        var focusIdx = this.getFocussedIndex();
        return focusIdx === this.state.values.length - 1;
    }
    getFocussedIndex() {
        if (this.inputs) {
            return findIndex(this.inputs, (input) => {
                if (input.inputRef) {
                    input = input.inputRef;
                }
                return input.focussed === true;
            });
        }
        return -1;
    }
    shiftFocus(byAmount) {
        var currentFocussedIndex = this.getFocussedIndex();
        if (currentFocussedIndex !== -1) {
            var newFocussedIndex = currentFocussedIndex + byAmount;
            var inputRef = this.inputs[newFocussedIndex];
            if (inputRef) {
                inputRef.getInputNode().focus();
            }
        }
    }
    onKeyDown(e) {
        switch (e.keyCode) {
            case KeyCode.TAB:
                // WARNING: special snowflake IE9 requires additional handling:
                // Since the default(satanic) tab behavior moves the caret to an unknown dimension
                // we want to prevent it and move the cursor manualy.
                // When the first/last element is focused we allow a jump to the next component
                var movingUpFromFirstElement = (e.shiftKey && !this.isFocusedFirstIndex());
                var movingDownFromLastElement = (!e.shiftKey && !this.isFocusedLastIndex());
                if (movingUpFromFirstElement || movingDownFromLastElement) {
                    e.preventDefault();
                }
                if (e.shiftKey) {
                    this.shiftFocus(-1);
                }
                else {
                    this.shiftFocus(1);
                }
                break;
            // if user presses enter, tab or down arrow key, move them to next input
            case KeyCode.ENTER:
            case KeyCode.DOWN:
                this.shiftFocus(1);
                break;
            // if user presses up arrow key, move them to previous input
            case KeyCode.UP:
                this.shiftFocus(-1);
                break;
        }
    }
    onBlur(e) {
        if (this._node) {
            var isClickOutside = !this._node.contains(e.relatedTarget);
            if (isClickOutside) {
                this.removeEmptyFields();
            }
        }
    }
    // TODO change key to idx?
    renderInput(key, value, placeholder, width) {
        var inputProps = {
            className: '-single-text-input',
            key: key,
            onChange: this.updateInputValues.bind(this, key),
            onBackSpaceEmptyValue: () => { this.shiftFocus(-1); this.removeEmptyFields(); },
            onClickClear: this.onClickClear.bind(this, key),
            onKeyDown: this.onKeyDown,
            placeholder: placeholder,
            // due the following bug, ref is first passed as null and then as component
            // therefore you need to add null check
            // https://github.com/facebook/react/issues/4533
            ref: (input) => { if (input) {
                this.inputs.push(input);
            } },
            renderClearBtn: true,
            value: value,
            width: width
        };
        if (this.props.isAutoComplete) {
            return (React.createElement(AutocompleteInput, { ...inputProps, isInGroupInput: true, menuItems: this.props.menuItems }));
        }
        else {
            return (React.createElement(TextInput, { ...inputProps }));
        }
    }
    renderInputs(values, width) {
        var inputs = [];
        this.inputs = [];
        for (var i = 0; i < values.length; i++) {
            var placeholder = i == 0 ? this.props.placeholder : this.props.helperText;
            inputs.push(this.renderInput(i, values[i], placeholder, width));
        }
        return inputs;
    }
    render() {
        return (React.createElement("div", { className: "rc-GroupTextInput", onBlur: this.onBlur, ref: (node) => { this._node = node; } }, this.renderInputs(this.state.values, this.props.width)));
    }
}
GroupTextInput.displayName = 'GroupTextInput';
GroupTextInput.defaultProps = {
    helperText: translation._('Additional keyword, phrase or hashtag'),
    isAutoComplete: false,
    menuItems: [],
    onChange: () => { },
    onUserInputChange: () => { },
    placeholder: translation._('Enter keyword, phrase or hashtag'),
    values: [],
    width: '230px'
};
var { array, bool, func, string } = PropTypes;
GroupTextInput.propTypes = {
    helperText: string,
    isAutoComplete: bool,
    menuItems: array,
    onChange: func,
    onUserInputChange: func,
    placeholder: string,
    values: array,
    width: string
};
module.exports = GroupTextInput;
