/** @module components/single-modal/single-modal */
'use strict';
// Styles Dependencies
require('./multi-modal.less');
// Script Dependencies
var React = require('react');
const PropTypes = require('prop-types');
var StandardModal = require('hs-nest/lib/components/modal/standard-modal');
var Button = require('hs-nest/lib/components/buttons/button');
var Shroud = require('hs-nest/lib/components/shared/shroud');
var GroupTextInput = require('../inputs/group-text-input');
var InputInstructions = require('hs-nest/lib/components/inputs/input-instructions');
var notificationTypes = require('../../constants/notificationTypes');
var notifications = require('../../constants/notifications');
var translation = require('hs-nest/lib/utils/translation');
const { TAGS } = require('../../actions/types');
const { createFocusTrap } = require('focus-trap');
class MultiModal extends React.Component {
    constructor(props) {
        super(props);
        this.tagActions = this.props.flux.getActions(TAGS);
        this.renderFooter = this.renderFooter.bind(this);
        this.renderModal = this.renderModal.bind(this);
        this.handleHide = this.handleHide.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.renderShroud = this.renderShroud.bind(this);
        this.setContainerRef = this.setContainerRef.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.labelText = translation._('List of Tags');
    }
    componentDidMount() {
        this.setAriaLabels();
        if (this.containerElement) {
            this.focusTrap = createFocusTrap(this.containerElement, {
                allowOutsideClick: true,
                escapeDeactivates: false,
            });
        }
        document.addEventListener('keydown', this.handleKeyDown);
    }
    componentDidUpdate() {
        this.setAriaLabels();
        if (this.props.isMultiModalOpen) {
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
    setAriaLabels() {
        if (!this.containerElement)
            return;
        const groupTextInputContainer = this.containerElement.querySelector('.rc-GroupTextInput');
        if (groupTextInputContainer) {
            const inputs = groupTextInputContainer.querySelectorAll('input');
            inputs.forEach(input => {
                input.setAttribute('aria-label', this.labelText);
            });
        }
    }
    setContainerRef(node) {
        this.containerElement = node;
    }
    handleKeyDown(event) {
        if (event.keyCode === 27 && this.props.isMultiModalOpen) {
            this.handleHide();
        }
    }
    renderShroud() {
        return (React.createElement(Shroud, { fadeDuration: 250, fadeToOpacity: 0.75 }));
    }
    renderFooter() {
        // List of tags can occasionally get an empty ('') entry so we must actually count it out vs calling .length
        var numTags = 0;
        this.props.multiTagFormData.map((val) => {
            if (val !== '') {
                numTags++;
            }
        });
        return (React.createElement("div", null,
            React.createElement(Button, { btnStyle: 'secondary', className: 'batchCreateTagCancelBtn', onClick: this.handleHide, trackingAction: 'batch_submit_cancel', trackingOrigin: 'web.dashboard.tag_manager.create_modal' }, translation._('Cancel')),
            React.createElement(Button, { btnStyle: 'primary', className: 'batchCreateTagSubmitBtn', disabled: this.props.isDuplicateTagInFormData, isLoading: this.props.isThrobberDisplayed, onClick: this.handleSubmit, trackingAction: 'batch_create_submit', trackingOrigin: 'web.dashboard.tag_manager.create_modal' }, translation._('Create tags (%s)').replace('%s', numTags.toString()))));
    }
    handleHide() {
        this.tagActions.closeCreateMultiTagModal();
    }
    handleSubmit() {
        this.tagActions.batchCreateTags(this.props.multiTagFormData, this.props.id);
        this.tagActions.setIsThrobberDisplayed();
    }
    groupTextInputChange(newValue) {
        this.tagActions.setMultiTagFormData(newValue);
    }
    renderNotifications() {
        var error = false;
        if (this.props.notification) {
            error = this.props.notification.type === notificationTypes.ERROR && this.props.notification.forField === notifications.FIELDS.name;
            if (error) {
                return (React.createElement(InputInstructions, { error: true, instructions: this.props.notification.message }));
            }
        }
        return '';
    }
    renderModal() {
        if (this.props.isMultiModalOpen) {
            return (React.createElement("div", { className: 'rc-MultiModal' },
                React.createElement(StandardModal, { "data-origin-id": 'tag-manager-batch-create', footerContent: this.renderFooter(), hasAnimation: false, hasBackdrop: false, isContainedModal: true, onRequestHide: this.handleHide, titleText: translation._('Create Tags') },
                    React.createElement("p", { className: 'instructions-text' }, translation._('Create a list of tags to make available to your organization below')),
                    React.createElement("div", { className: 'scrollableSpacing' },
                        React.createElement("div", { className: 'scrollable' },
                            React.createElement("label", { className: 'input-label' }, this.labelText),
                            React.createElement(GroupTextInput, { onChange: this.groupTextInputChange.bind(this), values: this.props.multiTagFormData, width: '100%' })),
                        this.renderNotifications())),
                this.renderShroud()));
        }
        return (React.createElement("div", null));
    }
    render() {
        return (React.createElement("div", { ref: this.setContainerRef }, this.renderModal()));
    }
}
MultiModal.displayName = 'MultiModal';
MultiModal.propTypes = {
    flux: PropTypes.object,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isDuplicateTagInFormData: PropTypes.bool,
    isMultiModalOpen: PropTypes.bool,
    isThrobberDisplayed: PropTypes.bool,
    multiTagFormData: PropTypes.array,
    notification: PropTypes.object
};
MultiModal.defaultProps = {
    isMultiModalOpen: false
};
module.exports = MultiModal;
