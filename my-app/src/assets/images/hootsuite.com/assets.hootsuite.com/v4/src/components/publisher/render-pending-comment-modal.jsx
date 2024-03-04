/** @preventMunge */
'use strict';

import { publisherFlux } from 'publisher/flux/store';
import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import FluxComponent from 'hs-nest/lib/components/flux-component';
import PendingCommentModalContainer from 'hs-app-streams/lib/components/pending-comment-modal/pending-comment-modal-container';

var removePendingCommentModal = (parentNode) => {
    _.defer(() => {
        ReactDOM.unmountComponentAtNode(parentNode);
        parentNode.remove();
    });
};

var renderPendingCommentModal = (data) => {
    var parentNode = document.getElementById('pendingCommentModal');

    if (!parentNode) {
        parentNode = document.createElement('div');
        parentNode.id = 'pendingCommentModal';
        $('body').append(parentNode);
    }

    ReactDOM.render(
        <FluxComponent flux={publisherFlux}>
            <PendingCommentModalContainer
                boxType={data.boxType}
                commentId={data.commentId}
                onHide={() => removePendingCommentModal(parentNode)}
                pendingComment={data.pendingComment}
                messageId={data.messageId}
                socialNetworkId={data.socialNetworkId}
                socialNetworkType={data.socialNetworkType}
            />
        </FluxComponent>, parentNode
    );
};

export default renderPendingCommentModal;
