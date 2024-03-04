/** @module components/side-panel/panels/tag-details */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fe_comp_button_1 = require("fe-comp-button");
var React = require('react');
const PropTypes = require('prop-types');
var BasePane = require('hs-app-side-panel/lib/components/side-panel/base-pane');
var { InputText } = require('fe-comp-input-text');
var TextArea = require('hs-nest/lib/components/inputs/text-area');
var notifications = require('../../../constants/notifications');
var _ = require('underscore');
var { object, string } = PropTypes;
var translation = require('hs-nest/lib/utils/translation');
require('./tag-details.less');
const { TAGS } = require('../../../actions/types');
const TAG_NAME = translation._('Tag Name');
class TagDetailsPane extends BasePane {
    constructor(props) {
        super(props);
        this.tagActions = this.props.flux.getActions(TAGS);
        this.handleArchiveOnClick = this.handleArchiveOnClick.bind(this);
        this.handleUnarchiveOnClick = this.handleUnarchiveOnClick.bind(this);
        this.handleDeleteOnClick = this.handleDeleteOnClick.bind(this);
    }
    onBlurSingleInput(field, newValue) {
        var description = this.props.data.description;
        var name = this.props.data.name;
        if (field === notifications.FIELDS.name) {
            if (!this.tagActions.validateNameField(newValue, name)) {
                return false;
            }
            name = newValue;
        }
        else if (field === notifications.FIELDS.description) {
            // textArea inputs are dumb and have a totally different 'onBlur' api from textInput. have to parse the value
            // from the event ourselves.
            var newDescription = newValue.target.value;
            if (!this.tagActions.validateDescriptionField(newDescription, description, true)) {
                return false;
            }
            description = newDescription;
        }
        var tagId = this.props.data.id;
        this.tagActions.updateTag(tagId, name, description);
        this.tagActions.fetchTagHistory(tagId);
        return true;
    }
    onChangeSingleInput(field, newValue) {
        var newData = _.clone(this.props.singleTagFormData);
        newData[field] = newValue;
        this.tagActions.setSingleTagFormData(newData);
    }
    handleArchiveOnClick() {
        if (!_.isEmpty(this.props.data)) {
            this.tagActions.archiveTag(this.props.data.id);
            this.props.closeSidePanel();
        }
    }
    handleUnarchiveOnClick() {
        if (!_.isEmpty(this.props.data)) {
            this.tagActions.unarchiveTag(this.props.data.id);
            this.tagActions.setSelectedTagIndex(null);
            this.props.closeSidePanel();
        }
    }
    handleDeleteOnClick() {
        if (!_.isEmpty(this.props.data)) {
            this.tagActions.openDeleteTagConfirmationModal();
        }
    }
    renderInputs() {
        if (!this.props.data.isArchived) {
            return (React.createElement("div", null,
                React.createElement("div", { className: "singleTextInput-container" },
                    React.createElement(InputText, { className: '-singleTextInput', errorState: this.props.errorField === notifications.FIELDS.name, errorMessageText: this.props.errorField === notifications.FIELDS.name ? this.props.instructions : '', label: TAG_NAME, onBlur: ({ target }) => this.onBlurSingleInput('name', target.value), onChange: ({ target }) => this.onChangeSingleInput('name', target.value), value: this.props.singleTagFormData.name, width: '100%', tabIndex: '2', "aria-label": TAG_NAME })),
                React.createElement(TextArea, { className: 'tag-description-text-area', error: this.props.errorField === notifications.FIELDS.description, instructions: this.props.errorField === notifications.FIELDS.description ? this.props.instructions : '', label: React.createElement("span", { tabIndex: '3' }, translation._('Tag Description')), onBlur: this.onBlurSingleInput.bind(this, 'description'), onChange: this.onChangeSingleInput.bind(this, 'description'), placeholder: translation._('Describe the tag'), value: this.props.singleTagFormData.description, tabIndex: '4' })));
        }
        return (React.createElement("div", { className: 'tag-name' }, this.props.data.name));
    }
    renderDetails() {
        return (React.createElement("ul", { className: 'tagDetailsList' },
            React.createElement("li", { tabIndex: '5' },
                React.createElement("strong", null, translation._('Status')),
                " ",
                this.props.data.isArchived ? translation._('Archived') : translation._('Active')),
            React.createElement("li", { tabIndex: '6' },
                React.createElement("strong", null, translation._('Created')),
                " ",
                this.props.createdInfo),
            React.createElement("li", { tabIndex: '7' },
                React.createElement("strong", null, translation._('Modified')),
                " ",
                this.props.modifiedInfo)));
    }
    renderDefaultStateButtons() {
        if (!this.props.data.isArchived) {
            return (React.createElement("div", null,
                React.createElement(fe_comp_button_1.Button, { btnStyle: fe_comp_button_1.SECONDARY, className: 'pull-left archiveTagBtn', onClick: this.handleArchiveOnClick, trackingAction: 'archive_tag', trackingOrigin: 'web.dashboard.tag_manager.tag_details', tabIndex: '8' }, translation._('Archive'))));
        }
        return null;
    }
    renderArchivedStateButtons() {
        if (this.props.data.isArchived) {
            return (React.createElement("div", null,
                React.createElement(fe_comp_button_1.Button, { btnStyle: fe_comp_button_1.SECONDARY, className: 'pull-left deleteTagBtn', onClick: this.handleDeleteOnClick, trackingAction: 'delete_tag', trackingOrigin: 'web.dashboard.tag_manager.tag_details', tabIndex: '9' }, translation._('Delete')),
                React.createElement(fe_comp_button_1.Button, { btnStyle: fe_comp_button_1.CTA, className: 'pull-right unarchiveTagBtn', onClick: this.handleUnarchiveOnClick, trackingAction: 'unarchive_tag', trackingOrigin: 'web.dashboard.tag_manager.tag_details', tabIndex: '10' }, translation._('Unarchive'))));
        }
        return null;
    }
    renderFooter() {
        return (React.createElement("div", { className: 'footer' },
            React.createElement("div", { className: '-actions' },
                this.renderDefaultStateButtons(),
                this.renderArchivedStateButtons())));
    }
    render() {
        return (React.createElement("div", { className: 'rc-TagDetailsPane tagDetailsPane' },
            React.createElement("div", { className: 'main' },
                this.renderInputs(),
                this.renderDetails()),
            this.renderFooter()));
    }
}
TagDetailsPane.displayName = 'TagDetailsPane';
TagDetailsPane.propTypes = {
    createdInfo: string,
    data: object,
    modifiedInfo: string,
    singleTagFormData: object
};
TagDetailsPane.defaultProps = {
    data: {},
    singleTagFormData: {}
};
module.exports = TagDetailsPane;
