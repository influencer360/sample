'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import overlayUtils from 'hs-nest/lib/utils/overlay-utils';
import Button from 'hs-nest/lib/components/buttons/button';
import StandardModal from 'hs-nest/lib/components/modal/standard-modal';
import boxTypesUtils from 'hs-app-streams/lib/utils/box-types';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import SingleMessageViewWrapper from './single-message-view-wrapper';
import SingleMessageViewSavedItem from './single-message-view-saved-item';
import streamsFlux from 'hs-app-streams/lib/stores/flux';
import { MESSAGE } from 'hs-app-streams/lib/actions/types';

const singleMessageState = 'singlemessage';

const loadSection = (socialNetworkId, messageId, commentId, messageType) => {
  if (!socialNetworkId || !messageId) {
    window.location = '/dashboard';
  }

  hs.dashboardState = singleMessageState;

  hootbus.emit('toggleCoreViews:secondary', {content: '<div id="messageContainer" class="singleMsgPageWrapper"></div>'});

  const element = (
    <SingleMessageViewWrapper
      commentId={commentId}
      flux={streamsFlux}
      messageId={messageId}
      messageType={messageType}
      socialNetworkId={socialNetworkId}
      socialNetworkType={messageId .split('_')[0] .toUpperCase()}
      shouldScrollToComment={!!commentId}
      wrapperPositionStyle='absolute'
    />
  );
  ReactDOM.render(element, document.getElementById('messageContainer'));
}

const showMessageModal = ({commentId, messageId, socialNetworkId, socialNetworkType}) => {
  const onSaveStream = () => {
    streamsFlux.getActions(MESSAGE).createCommentStream({
      postId: messageId.replace('twitter_', '').replace('facebook_', ''),
      socialNetworkId: socialNetworkId,
      boxType: boxTypesUtils.getCommentBoxTypeForSocialNetwork(socialNetworkType)
    });
    overlayUtils.hideModal()
  }

  const footer = (
    <div>
      <Button
        btnStyle='secondary'
        onClick={overlayUtils.hideModal}
      >
        {translation._('Cancel')}
      </Button>
      <Button
        btnStyle='primary'
        onClick={onSaveStream}>
        {translation._('Save as Stream')}
      </Button>
    </div>
  );
  overlayUtils.openModal(
    <StandardModal
      className={'rc-SingleMessageViewModal'}
      footerContent={footer}
      onRequestHide={overlayUtils.hideModal}
      titleText={translation._('Post Details')}
      width='1000px'
    >
      <SingleMessageViewWrapper
        commentId={commentId}
        backButton={false}
        flux={streamsFlux}
        messageId={messageId}
        onHide={overlayUtils.hideModal}
        socialNetworkId={socialNetworkId}
        socialNetworkType={socialNetworkType}
      />
    </StandardModal>
  )
}

const showSavedItemModal = savedItem => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const onDismiss = () => {
      ReactDOM.unmountComponentAtNode(container);
  };
  ReactDOM.render(
    <SingleMessageViewSavedItem
      savedItem={savedItem}
      onDismissModal={onDismiss}
    />,
    container
  );
};

const showSavedItemContainer = (savedItem, container) => {
  ReactDOM.unmountComponentAtNode(container);
  ReactDOM.render(
    <SingleMessageViewSavedItem savedItem={savedItem} />,
    container
  );
}

export default {
  loadSection,
  showMessageModal,
  showSavedItemModal,
  showSavedItemContainer,
};
