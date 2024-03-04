import React from 'react';
import ReactDOM from 'react-dom';
import FluxComponent from 'hs-nest/lib/components/flux-component';
import MessageListContainer from 'hs-app-streams/lib/components/message-list/message-list-container';
import streamsFlux from 'hs-app-streams/lib/stores/flux';
import CoreViewChange from '../../dashboard/components/core-view-change';

export default ({
    messageListId,
    entitlements,
    loadMessagesBetween,
    loadMessagesOlder,
    setUnreadCaching,
    loadUnreadMessages,
}, messageListEl) => {
    ReactDOM.render(
        <CoreViewChange onChange={({ isPrimaryView }) => {
            if (!isPrimaryView && messageListEl) {
                ReactDOM.unmountComponentAtNode(messageListEl);
            }
        }}>
            <FluxComponent flux={streamsFlux}>
                <MessageListContainer
                    loadMessagesBetween={loadMessagesBetween}
                    loadMessagesOlder={loadMessagesOlder}
                    loadUnreadMessages={loadUnreadMessages}
                    messageListId={messageListId}
                    setUnreadCaching={setUnreadCaching}
                    entitlements={entitlements}
                />
            </FluxComponent>
        </CoreViewChange>,
        messageListEl
    )
};
