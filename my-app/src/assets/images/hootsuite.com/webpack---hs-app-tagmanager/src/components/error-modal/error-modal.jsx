/** @module components/single-modal/single-modal */
'use strict';
// Styles Dependencies
require('./error-modal.less');
// Script Dependencies
var React = require('react');
const PropTypes = require('prop-types');
var StandardModal = require('hs-nest/lib/components/modal/standard-modal');
var Button = require('hs-nest/lib/components/buttons/button');
var Shroud = require('hs-nest/lib/components/shared/shroud');
var translation = require('hs-nest/lib/utils/translation');
const { TAGS } = require('../../actions/types');
class ErrorModal extends React.Component {
    constructor(props) {
        super(props);
        this.tagActions = this.props.flux.getActions(TAGS);
        this.renderFooter = this.renderFooter.bind(this);
        this.renderModal = this.renderModal.bind(this);
        this.handleHide = this.handleHide.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
        this.renderListItem = this.renderListItem.bind(this);
        this.renderList = this.renderList.bind(this);
        this.renderShroud = this.renderShroud.bind(this);
        this.renderNotificationText = this.renderNotificationText.bind(this);
    }
    renderShroud() {
        return (React.createElement(Shroud, { fadeDuration: 250, fadeToOpacity: 0.75 }));
    }
    renderNotificationText() {
        var text = '';
        // 0,1,2+ cases
        // '0 tags were successfully created. We could not create the following XX tags:'
        // '1 tag was successfully created, but we could not create the following tag:'
        // '2+ tags were successfully create, but we could not create the following XX tags:'
        if (this.props.tagsCreated === 1) {
            text = this.props.tagsCreated + translation._(' tag was successfully created');
        }
        else {
            text = this.props.tagsCreated + translation._(' tags were successfully created');
        }
        if (this.props.tagsCreated === 0) {
            text += translation._('. We could not create the following ');
        }
        else {
            text += translation._(', but we could not create the following ');
        }
        if (this.props.multiTagFormData.length === 1) {
            text += translation._('tag:');
        }
        else {
            text += this.props.multiTagFormData.length + translation._(' tags:');
        }
        return (React.createElement("div", { className: 'instructions-text' }, text));
    }
    renderListItem(item, key) {
        return React.createElement("div", { className: 'listItem', key: key }, item);
    }
    renderList() {
        return (React.createElement("div", null, this.props.multiTagFormData.map(this.renderListItem)));
    }
    renderFooter() {
        return (React.createElement("div", { className: 'padTop' },
            React.createElement("div", { className: '-inlineContent' },
                React.createElement(Button, { btnStyle: 'secondary', className: 'errorModalEditBtn', onClick: this.handleEdit, trackingAction: 'batch_error_edit', trackingOrigin: 'web.dashboard.tag_manager.error_modal' }, translation._('Edit These Tags'))),
            React.createElement(Button, { btnStyle: 'primary', className: 'errorModalCloseBtn', onClick: this.handleHide, trackingAction: 'batch_error_close', trackingOrigin: 'web.dashboard.tag_manager.error_modal' }, translation._('OK, Close'))));
    }
    handleHide() {
        this.tagActions.closeNotifyErrorModal();
    }
    handleEdit() {
        this.tagActions.editFailedTagsInMultiModal();
        return true;
    }
    renderModal() {
        if (this.props.isErrorModalOpen) {
            return (React.createElement("div", { className: 'rc-ErrorModal' },
                React.createElement(StandardModal, { "data-origin-id": 'tag-manager-batch-create-error', footerContent: this.renderFooter(), hasAnimation: false, hasBackdrop: false, isContainedModal: true, onRequestHide: this.handleHide, titleText: translation._('Some tags could not be created') },
                    this.renderNotificationText(),
                    React.createElement("div", { className: 'scrollableSpacing' },
                        React.createElement("div", { className: 'scrollable' }, this.renderList())),
                    React.createElement("div", { className: 'instructions-text' }, translation._('Please check if the tag name already exists as an active or archived tag.'))),
                this.renderShroud()));
        }
        return (React.createElement("div", null));
    }
    render() {
        return (React.createElement("div", null, this.renderModal()));
    }
}
ErrorModal.displayName = 'ErrorModal';
ErrorModal.propTypes = {
    flux: PropTypes.object,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    isErrorModalOpen: PropTypes.bool,
    multiTagFormData: PropTypes.array,
    tagsCreated: PropTypes.number
};
ErrorModal.defaultProps = {
    isErrorModalOpen: false,
    multiTagFormData: []
};
module.exports = ErrorModal;
