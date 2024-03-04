/** @module components/single-modal/single-modal */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fe_comp_button_1 = require("fe-comp-button");
// Styles Dependencies
require('./single-modal.less');
// Script Dependencies
var React = require('react');
const PropTypes = require('prop-types');
var KeyCode = require('key-code');
var classNames = require('classnames');
var TextInput = require('hs-nest/lib/components/inputs/text-input');
var TextAreaOld = require('hs-nest/lib/components/inputs/text-area');
var StandardModal = require('hs-nest/lib/components/modal/standard-modal');
var Shroud = require('hs-nest/lib/components/shared/shroud');
var notificationTypes = require('../../constants/notificationTypes');
var notifications = require('../../constants/notifications');
var translation = require('hs-nest/lib/utils/translation');
var _ = require('underscore');
const { TAGS } = require('../../actions/types');
var { InputText } = require('fe-comp-input-text');
var { TextArea } = require('fe-comp-input-text-area');
var { InputBanner } = require('fe-comp-input-banner');
const { createFocusTrap } = require('focus-trap');
const darklaunch = require("hs-nest/lib/utils/darklaunch");
class SingleModal extends React.Component {
    constructor(props) {
        super(props);
        this.tagActions = this.props.flux.getActions(TAGS);
        this.renderFooter = this.renderFooter.bind(this);
        this.renderModal = this.renderModal.bind(this);
        this.handleHide = this.handleHide.bind(this);
        this.renderShroud = this.renderShroud.bind(this);
        this.submitTag = this.submitTag.bind(this);
        this.handleOnKeyDown = this.handleOnKeyDown.bind(this);
        this.handleBatchCreateClick = this.handleBatchCreateClick.bind(this);
        this.setContainerRef = this.setContainerRef.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    componentDidMount() {
        if (this.containerElement) {
            this.focusTrap = createFocusTrap(this.containerElement, {
                allowOutsideClick: true,
                escapeDeactivates: false,
            });
        }
        document.addEventListener('keydown', this.handleKeyDown);
    }
    componentDidUpdate() {
        if (this.props.isSingleModalOpen) {
            this.focusTrap.activate();
        }
        else {
            this.focusTrap.deactivate();
        }
    }
    componentWillUnmount() {
        if (this.focusTrap) {
            this.focusTrap.deactivate();
        }
    }
    setContainerRef(node) {
        this.containerElement = node;
    }
    handleBatchCreateClick() {
        this.tagActions.openCreateMultiTagModal();
    }
    handleKeyDown(event) {
        if (event.keyCode === 27 && this.props.isSingleModalOpen) {
            this.handleHide();
        }
    }
    renderShroud() {
        return (React.createElement(Shroud, { fadeDuration: 250, fadeToOpacity: 0.75 }));
    }
    renderFooter() {
        return (React.createElement("div", null,
            React.createElement("div", { className: '-inlineContent' },
                React.createElement(fe_comp_button_1.Button, { type: fe_comp_button_1.SECONDARY, className: 'batchCreateBtn', onClick: this.handleBatchCreateClick, trackingAction: 'open_batch_create_modal', trackingOrigin: 'web.dashboard.tag_manager.create_modal' }, translation._('Batch Create'))),
            React.createElement(fe_comp_button_1.Button, { type: fe_comp_button_1.SECONDARY, className: 'createTagCancelBtn', onClick: this.handleHide, trackingAction: 'create_tag_cancel', trackingOrigin: 'web.dashboard.tag_manager.create_modal' }, translation._('Cancel')),
            React.createElement(fe_comp_button_1.Button, { type: fe_comp_button_1.CTA, className: 'createTagSubmitBtn', isLoading: this.props.isThrobberDisplayed, onClick: this.submitTag, trackingAction: 'create_tag_submit', trackingOrigin: 'web.dashboard.tag_manager.create_modal' }, translation._('Create'))));
    }
    handleHide() {
        this.tagActions.closeCreateSingleTagModal();
    }
    submitTag() {
        var name = this.props.singleTagFormData.name;
        var description = this.props.singleTagFormData.description;
        if (this.tagActions.validateNameField(name, null) && this.tagActions.validateDescriptionField(description, null, false)) {
            var ownerId = this.props.id;
            this.tagActions.createTag(name, description, ownerId);
            this.tagActions.setIsThrobberDisplayed();
        }
    }
    handleChange(field, newValue) {
        var newData = _.clone(this.props.singleTagFormData);
        newData[field] = newValue;
        this.tagActions.setSingleTagFormData(newData);
    }
    handleOnKeyDown(e) {
        if (e.keyCode === KeyCode.ENTER) {
            this.submitTag();
        }
    }
    renderModal() {
        if (this.props.isSingleModalOpen) {
            return (React.createElement("div", null,
                React.createElement(StandardModal, { "data-origin-id": 'testModal', footerContent: this.renderFooter(), hasAnimation: false, hasBackdrop: false, isContainedModal: true, onRequestHide: this.handleHide, titleText: translation._('Create New Tag') },
                    this.renderName(),
                    this.renderDescription()),
                this.renderShroud()));
        }
        return null;
    }
    renderName() {
        var error = this.props.notification.type === notificationTypes.ERROR && this.props.notification.forField === notifications.FIELDS.name;
        if (darklaunch.isFeatureEnabled('PUB_26528_A11Y_CREATE_TAG')) {
            return (React.createElement(InputText, { className: classNames('tagNameInput', error ? 'hasError' : ''), errorState: error, errorMessageText: error ? this.props.notification.message : '', label: translation._('Tag Name'), onChange: ({ target }) => this.handleChange('name', target.value), onKeyDown: this.handleOnKeyDown, placeholder: translation._('Choose a tag name'), value: this.props.singleTagFormData.name, width: '100%', "aria-required": 'true', autoFocus: true }));
        }
        else {
            return (React.createElement(TextInput, { className: 'tagNameInput', error: error, instructions: error ? this.props.notification.message : '', label: translation._('Tag Name'), onChange: this.handleChange.bind(this, 'name'), onKeyDown: this.handleOnKeyDown, placeholder: translation._('Choose a tag name'), value: this.props.singleTagFormData.name, width: '100%', "aria-required": 'true' }));
        }
    }
    renderDescription() {
        var error = this.props.notification.type === notificationTypes.ERROR && this.props.notification.forField === notifications.FIELDS.description;
        if (darklaunch.isFeatureEnabled('PUB_26528_A11Y_CREATE_TAG')) {
            return (React.createElement(React.Fragment, null,
                React.createElement(TextArea, { className: classNames('tag-description-text-area', error ? 'hasError' : ''), errorState: error, label: translation._('Tag Description'), onChange: ({ target }) => this.handleChange('description', target.value), placeholder: translation._('Describe the tag'), width: '100%', value: this.props.singleTagFormData.description, minHeight: '65px' }),
                error && (React.createElement(InputBanner, { messageText: this.props.notification.message }))));
        }
        else {
            return (React.createElement(TextAreaOld, { className: 'tag-description-text-area', error: error, instructions: error ? this.props.notification.message : '', label: translation._('Tag Description'), onChange: this.handleChange.bind(this, 'description'), placeholder: translation._('Describe the tag'), value: this.props.singleTagFormData.description }));
        }
    }
    render() {
        return (React.createElement("div", { className: 'rc-SingleModal', ref: this.setContainerRef }, this.renderModal()));
    }
}
SingleModal.displayName = 'SingleModal';
SingleModal.propTypes = {
    flux: PropTypes.object,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isSingleModalOpen: PropTypes.bool,
    isThrobberDisplayed: PropTypes.bool,
    notification: PropTypes.object,
    singleTagFormData: PropTypes.object
};
SingleModal.defaultProps = {
    isSingleModalOpen: false
};
module.exports = SingleModal;
