/** @module components/delete-modal/delete-modal */
'use strict';
// Script Dependencies
var React = require('react');
const PropTypes = require('prop-types');
var StandardModal = require('hs-nest/lib/components/modal/standard-modal');
var Button = require('hs-nest/lib/components/buttons/button');
var Shroud = require('hs-nest/lib/components/shared/shroud');
var SlideOutPanel = require('hs-nest/lib/components/slide-out-panel/slide-out-panel');
var translation = require('hs-nest/lib/utils/translation');
const { TAGS, SIDE_PANEL_TAG_MANAGER } = require('../../actions/types');
const { createFocusTrap } = require('focus-trap');
class DeleteModal extends React.Component {
    constructor(props) {
        super(props);
        this.tagActions = this.props.flux.getActions(TAGS);
        this.renderFooter = this.renderFooter.bind(this);
        this.renderModal = this.renderModal.bind(this);
        this.handleHide = this.handleHide.bind(this);
        this.renderShroud = this.renderShroud.bind(this);
        this.deleteTag = this.deleteTag.bind(this);
        this.setContainerRef = this.setContainerRef.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    componentDidMount() {
        if (this.containerElement) {
            this.focusTrap = createFocusTrap(this.containerElement, {
                allowOutsideClick: true,
                escapeDeactivates: false,
            });
            document.addEventListener('keydown', this.handleKeyDown);
        }
    }
    componentDidUpdate() {
        if (this.props.isDeleteTagConfirmationModalOpen) {
            this.focusTrap.activate();
        }
        else {
            this.focusTrap.deactivate();
        }
    }
    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown);
        if (this.focusTrap) {
            this.focusTrap.deactivate();
        }
    }
    setContainerRef(node) {
        this.containerElement = node;
    }
    handleKeyDown(event) {
        if (event.keyCode === 27 && this.props.isDeleteTagConfirmationModalOpen) {
            this.handleHide();
        }
    }
    renderShroud() {
        return (React.createElement(Shroud, { fadeDuration: 250, fadeToOpacity: 0.75 }));
    }
    renderFooter() {
        return (React.createElement("div", null,
            React.createElement(Button, { btnStyle: 'secondary', className: 'deleteTagCancelBtn', onClick: this.handleHide, trackingAction: 'delete_tag_cancel', trackingOrigin: 'web.dashboard.tag_manager.delete_modal' }, translation._('Cancel')),
            React.createElement(Button, { btnStyle: 'primary', className: 'deleteTagSubmitBtn', onClick: this.deleteTag, trackingAction: 'delete_tag_submit', trackingOrigin: 'web.dashboard.tag_manager.delete_modal' }, translation._('Delete'))));
    }
    handleHide() {
        this.tagActions.closeDeleteTagConfirmationModal();
    }
    deleteTag() {
        this.tagActions.deleteTag(this.props.tags[this.props.selectedTagIndex].id);
        this.tagActions.closeDeleteTagConfirmationModal();
        this.props.flux.getActions(SIDE_PANEL_TAG_MANAGER).setPanelState(SlideOutPanel.constants.CLOSING);
    }
    renderModal() {
        if (this.props.isDeleteTagConfirmationModalOpen) {
            return (React.createElement("div", null,
                React.createElement(StandardModal, { "data-origin-id": 'deleteModal', footerContent: this.renderFooter(), hasAnimation: false, hasBackdrop: false, isContainedModal: true, onRequestHide: this.handleHide, titleText: translation._('Delete Tag') },
                    React.createElement("div", null, translation._('Are you sure you want to delete this tag? This action cannot be undone. All data related to this tag will be lost.'))),
                this.renderShroud()));
        }
        return (React.createElement("div", null));
    }
    render() {
        return (React.createElement("div", { ref: this.setContainerRef }, this.renderModal()));
    }
}
DeleteModal.displayName = 'DeleteModal';
DeleteModal.propTypes = {
    flux: PropTypes.object,
    isDeleteTagConfirmationModalOpen: PropTypes.bool,
    selectedTagIndex: PropTypes.number,
    tags: PropTypes.array
};
DeleteModal.defaultProps = {
    isDeleteTagConfirmationModalOpen: false
};
module.exports = DeleteModal;
