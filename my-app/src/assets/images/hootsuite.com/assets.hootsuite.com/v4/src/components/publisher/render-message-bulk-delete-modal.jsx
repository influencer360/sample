/** @preventMunge */
'use strict';

import getHsAppPublisher from 'components/publisher/get-hs-app-publisher';

const MESSAGE_BULK_DELETE_MODAL = 'messageBulkDeleteModal'

const renderParentNode = () => {
    let parentNode = document.getElementById(MESSAGE_BULK_DELETE_MODAL);

    if (!parentNode) {
        parentNode = document.createElement('div');
        parentNode.id = MESSAGE_BULK_DELETE_MODAL;
        $('body').append(parentNode);
    }

    return parentNode;
};

const renderMessageBulkDeleteModal = (dialogType, onDeleteClicked) => {
    const parentNode = renderParentNode();

    getHsAppPublisher().then(({ renderMessageBulkDeleteModal }) => {
        const props = {
            dialogType: dialogType,
            onDeleteClicked: onDeleteClicked
        };
        renderMessageBulkDeleteModal(props, parentNode, MESSAGE_BULK_DELETE_MODAL)
    });
};

export default renderMessageBulkDeleteModal;
