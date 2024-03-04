/** @module components/list-header/list-header */
'use strict';
// Styles Dependencies
require('./list-header.less');
// Script Dependencies
var React = require('react');
const PropTypes = require('prop-types');
var classNames = require('classnames');
const { Banner } = require('fe-comp-banner');
const { InputCheckbox } = require('fe-comp-input-checkbox');
var SlideOutPanel = require('hs-nest/lib/components/slide-out-panel/slide-out-panel');
var _ = require('underscore');
var translation = require('hs-nest/lib/utils/translation');
class ListHeader extends React.Component {
    constructor(props) {
        super(props);
        this.renderDefaultState = this.renderDefaultState.bind(this);
        this.renderNotificationState = this.renderNotificationState.bind(this);
        this._shouldRenderNotification = this._shouldRenderNotification.bind(this);
        this.handleBatchSelectOnChange = this.handleBatchSelectOnChange.bind(this);
    }
    handleBatchSelectOnChange() {
        if (_.isFunction(this.props.batchSelectAll)) {
            this.props.batchSelectAll();
        }
    }
    renderDefaultState() {
        if (!this._shouldRenderNotification()) {
            return (React.createElement("div", null,
                React.createElement("div", { className: 'pull-left' },
                    React.createElement(InputCheckbox, { "aria-label": `${translation._('Select all')} ${this.props.title}`, label: this.props.title, checked: this.props.batchedTags.length >= 1, onChange: this.handleBatchSelectOnChange }))));
        }
        return null;
    }
    renderNotificationState() {
        if (this._shouldRenderNotification()) {
            return (React.createElement("div", { role: "status" },
                React.createElement(Banner, { isPoliteAlert: true, closeAction: this.props.closeNotification, messageText: this.props.notification.message, type: this.props.notification.type })));
        }
        return null;
    }
    _shouldRenderNotification() {
        return this.props.notification.type !== '' &&
            this.props.notification.message !== '' &&
            this.props.panelState === SlideOutPanel.constants.CLOSING &&
            !this.props.createSingleTagModalOpen &&
            !this.props.createMultiTagModalOpen &&
            !this.props.deleteTagConfirmationModalOpen;
    }
    render() {
        var listHeaderClasses = {
            'bulk-select': this.props.bulkSelect,
            'rc-ListHeader': true
        };
        return (React.createElement("div", { className: classNames(listHeaderClasses) },
            this.renderDefaultState(),
            this.renderNotificationState()));
    }
}
ListHeader.displayName = 'ListHeader';
ListHeader.propTypes = {
    batchSelectAll: PropTypes.func,
    batchedTags: PropTypes.array,
    bulkSelect: PropTypes.bool,
    closeNotification: PropTypes.func,
    createMultiTagModalOpen: PropTypes.bool,
    createSingleTagModalOpen: PropTypes.bool,
    deleteTagConfirmationModalOpen: PropTypes.bool,
    notification: PropTypes.object,
    panelState: PropTypes.string,
    title: PropTypes.string
};
ListHeader.defaultProps = {
    bulkSelect: false,
    closeNotification: () => { },
    title: ''
};
module.exports = ListHeader;
