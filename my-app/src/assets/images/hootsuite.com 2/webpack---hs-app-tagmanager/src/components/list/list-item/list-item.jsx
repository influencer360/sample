/** @module components/list-item/list-item */
'use strict';
// Styles Dependencies
require('./list-item.less');
// Script Dependencies
const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const Checkbox = require('hs-nest/lib/components/inputs/checkbox');
const hootbus = require('hs-nest/lib/utils/hootbus');
const _ = require('underscore');
const translation = require('hs-nest/lib/utils/translation');
const { bool, number, func, string } = PropTypes;
//Renamed to TagListItem to match rc-TagListItem css class, rc-ListItem is already used in hs-nest
class TagListItem extends React.Component {
    constructor(props) {
        super(props);
        this.renderArchivedLabel = this.renderArchivedLabel.bind(this);
        this.handleOnCheckboxChange = this.handleOnCheckboxChange.bind(this);
        this.handleOnClick = this.handleOnClick.bind(this);
    }
    handleOnCheckboxChange(e) {
        e.stopPropagation();
        if (this.props.onChecked && _.isFunction(this.props.onChecked)) {
            this.props.onChecked(this.props.id);
        }
    }
    handleOnClick(e) {
        e.stopPropagation();
        if (!e.target.classList.contains('-checkLabel')) {
            if (this.props.onClick && _.isFunction(this.props.onClick)) {
                hootbus.emit('Datalab:trackEvent', {
                    origin: 'web.dashboard.tag_manager.tag_details',
                    action: 'tag_details_opened'
                });
                this.props.onClick();
            }
        }
        return null;
    }
    renderArchivedLabel() {
        if (this.props.isArchived) {
            return (React.createElement("small", { className: 'pull-right uppercase archived' }, translation._('ARCHIVED')));
        }
        return null;
    }
    render() {
        const classes = {
            'rc-TagListItem': true,
            'list-item': true,
            selected: this.props.isSelected,
            archived: this.props.isArchived,
            checked: this.props.isChecked,
            bulkMode: this.props.isBulkMode
        };
        return (React.createElement("div", { tabIndex: "0", "data-tag-id": this.props.id, className: classNames(classes), onClick: this.handleOnClick, role: "checkbox", "aria-checked": this.props.isChecked },
            React.createElement("div", { className: 'pull-left' },
                React.createElement(Checkbox, { checked: this.props.isChecked, defaultChecked: false, onChange: this.handleOnCheckboxChange, tabIndex: "1" }),
                React.createElement("span", { className: 'tagName' }, this.props.name.length > 65 ? this.props.name.slice(0, 65) + '...' : this.props.name)),
            this.renderArchivedLabel()));
    }
}
TagListItem.displayName = 'TagListItem';
TagListItem.propTypes = {
    id: number,
    index: number,
    isArchived: bool,
    isBulkMode: bool,
    isChecked: bool,
    isSelected: bool,
    name: string,
    onChecked: func,
    onClick: func,
    ownerId: number
};
TagListItem.defaultProps = {
    isArchived: false,
    isChecked: false,
    isSelected: false,
    isBulkMode: false
};
module.exports = TagListItem;
