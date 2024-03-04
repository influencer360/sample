"use strict";

import React, { useState } from "react";
import styled from "styled-components";

import { getThemeValue, withHsTheme } from 'fe-lib-theme'
import { Lightbox } from "fe-comp-lightbox";
import { Dialog, Content, Icons, Footer } from "fe-comp-dialog";
import { A11yDialog } from "fe-chan-comp-a11y-dialog";

import translation from "utils/translation";
import NetworksConf from 'utils/networks-conf';
import hootbus from "utils/hootbus";

import streamsFlux from 'hs-app-streams/lib/stores/flux';
import SingleMessageViewWrapper from "./single-message-view-wrapper";

const StyledDialog = withHsTheme(styled(Dialog)`
    height: fit-content;
    max-height: 90vh;
    width: 1000px;

    .rc-SingleMessageViewWrapper .-SingleMessageViewHeader {
      background-color: ${getThemeValue(t => t.colors.lightGrey10)};
    }
`);

const getMessageUid = savedItem => {
  const {
    messageId,
    parentMessageId,
    originalPostId,
    interactionType,
    socialNetworkType
  } = savedItem;
  let uid = ''

  switch (interactionType) {
    case 'COMMENT':
      uid = parentMessageId;
      break;
    case 'REPLY':
      uid = originalPostId;
      break;
    default:
      uid = messageId;
      break;
  }

  if (!uid) {
    return null;
  }

  // Streams message store expects either facebook_ or twitter_ prepended to the message id.
  // Since we're passing 'facebookpage' as the type, we need to do a translation
  const genericNetworkType = NetworksConf.getParentType(socialNetworkType) || socialNetworkType;
  return `${genericNetworkType}_${uid}`;
};

const getCommentId = savedItem => {
  const { messageId, interactionType, parentMessageId } = savedItem;

  if (interactionType === 'COMMENT') {
    return messageId;
  } else if (interactionType === 'REPLY') {
    return parentMessageId;
  }
  return null;
};


const SingleMessageViewSavedItem = ({savedItem, onDismissModal}) => {
  const { messageId, interactionType, socialNetworkId, socialNetworkType } = savedItem;
  const messageUid = getMessageUid(savedItem);
  const commentId = getCommentId(savedItem);
  const [ showFooter, setShowFooter ] = useState(false);

  if (onDismissModal) { // Show saved item modal
    return (
      <Lightbox>
        {({ close }) => {
          const onDismiss = () => {
            onDismissModal();
            close();
          };
          const reopenSingleMessageView = () => {
            hootbus.emit('stream:savedItem:viewPost', {savedItem, onDismissModal})
          }
          const onRemove = () => {
            const onCloseRemoveDialog = () => {
              // If the remove dialog is closed (without removing the item), reopen the Single Message View dialog
              reopenSingleMessageView()
            };
            hootbus.emit("stream:savedItem:removeItem", {
              onCloseRemoveDialog,
              messageId,
              interactionType,
              socialNetworkId,
              socialNetworkType
            });
            onDismiss();
          };
          return (
            <A11yDialog
              ariaLabel={translation._("Post Details")}
              closeModal={onDismiss}
            >
              <StyledDialog>
                <Icons>
                  <Icons.Close close={onDismiss} />
                </Icons>
                <Content className='-SavedItemModalScroll'>
                  <SingleMessageViewWrapper
                    backButton={false}
                    flux={streamsFlux}
                    messageId={messageUid}
                    commentId={commentId}
                    messageType={interactionType}
                    socialNetworkId={
                      socialNetworkId
                    }
                    socialNetworkType={
                      socialNetworkType
                    }
                    shouldScrollToComment={!!commentId}
                    onMessageReady={setShowFooter}
                  />
                </Content>
                {showFooter && (
                  <Footer>
                    <Footer.Buttons.TertiaryAction
                      onClick={onRemove}
                    >
                      {translation._(
                        "Remove from saved items"
                      )}
                    </Footer.Buttons.TertiaryAction>
                  </Footer>
                )}
              </StyledDialog>
            </A11yDialog>
          );
        }}
      </Lightbox>
    )
  } else { // Show saved item in the thread view
    return (
      <SingleMessageViewWrapper
        backButton={false}
        flux={streamsFlux}
        messageId={messageUid}
        commentId={commentId}
        messageType={interactionType}
        socialNetworkId={
          socialNetworkId
        }
        socialNetworkType={
          socialNetworkType
        }
        shouldScrollToComment={!!commentId}
        shouldHideHeader
      />
    );
  }
};

SingleMessageViewSavedItem.displayName = "SingleMessageViewSavedItem";

export default SingleMessageViewSavedItem;
