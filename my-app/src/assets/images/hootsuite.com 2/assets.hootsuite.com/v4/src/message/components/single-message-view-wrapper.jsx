'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Throbber from 'hs-nest/lib/components/shared/throbbing-loader';
import Icon from '@fp-icons/icon-base';
import ArrowLeft from '@fp-icons/arrow-left';
import SingleMessageView from 'hs-app-streams/lib/components/message/single-message-view';
import { ASSIGNMENT_SINGLE_POST_VIEW_ID as messageListId } from 'hs-app-streams/lib/constants/message-list';
import boxTypesUtils from 'hs-app-streams/lib/utils/box-types';
import SingleMessageNotFound from './single-message-not-found';
import trackerDataLab from 'utils/tracker-datalab';
import translation from 'utils/translation';
import NetworksConf from 'utils/networks-conf';

import { types } from 'hs-nest/lib/constants/social-networks';
import { MESSAGE_LIST, MESSAGE } from 'hs-app-streams/lib/actions/types';

import './single-message-view-wrapper.less';

const { FACEBOOK, TWITTER } = types;


class SingleMessageViewWrapper extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isMsgReady: false,
      isMsgRemoved: false
    };
    this.headerText = translation._('Loading...');

    this.fetchMessage = this.fetchMessage.bind(this);
    this.processMessage = this.processMessage.bind(this);
    this.createMessageList = this.createMessageList.bind(this);
    this.cleanupMessageList = this.cleanupMessageList.bind(this);
    this.onSaveStream = this.onSaveStream.bind(this);
  }

  componentDidMount() {
    setTimeout(() => {
      this.cleanupMessageList();
      this.fetchMessage().then(this.processMessage);
    }, 0);
  }

  componentWillUnmount() {
    this.cleanupMessageList();
  }

  getMessageParams() {
    const messageParams = {
      socialNetworkId: this.props.socialNetworkId,
      messageId: this.trimMsgId(this.props.messageId),
      socialNetworkType: this.props.socialNetworkType,
      boxType: this.getBoxType(),
      boxId: messageListId,
      includeAssignment: 1,
      messageType: this.props.messageType,
    }

    if (this.props.commentId) {
      messageParams.commentId = this.props.commentId;
    }

    return messageParams;
  }

  fetchMessage() {
    if (!this.props.messageId || !this.props.socialNetworkId) {
      return Promise.resolve();
    }

    return this.props.flux.getActions(MESSAGE).fetchMessage(this.getMessageParams());
  }

  processMessage(data) {
    if (data) {
      this.createMessageList(data);

      if (data.messages && data.messages[this.props.messageId]) {
        const getHeaderType = (genericNetworkType, messageType) => {
          if (genericNetworkType.toUpperCase() === FACEBOOK){
            if (messageType === 'COMMENT' || messageType === 'REPLY') {
              return 'Comment by %1$s'
            }
            return 'Post by %1$s'
          } else if(messageType === 'PRIVATE_MESSAGE') {
            return 'Direct Message by %1$s'
          } else {
            return 'Tweet by %1$s'
          }
        };
        const getFallbackAuthorName = genericNetworkType => {
          if (genericNetworkType.toUpperCase() === FACEBOOK) {
            return translation._('Facebook User');
          } else if(genericNetworkType.toUpperCase() === TWITTER) {
            return translation._('Twitter User');
          } else {
            return translation._('User');
          }
        };
        const {socialNetworkType, messageType} = this.props;
        const genericNetworkType = NetworksConf.getParentType(socialNetworkType) || socialNetworkType;
        const message = data.messages[this.props.messageId];
        const author = message.author;
        const authorName = author && author.name
          ? author.name
          : getFallbackAuthorName(genericNetworkType);
        this.headerText = translation._(getHeaderType(genericNetworkType, messageType)).replace('%1$s', authorName)
      }
      this.setState({
        isMsgReady: true,
        isMsgRemoved: false
      }, () => {
          this.props.onMessageReady(true);
      });
    } else {
      this.headerText = translation._('Message does not exist');

      this.setState({
        isMsgReady: false,
        isMsgRemoved: true
      });
    }
  }

  createMessageList(data) {
    this.props.flux.getActions(MESSAGE_LIST).set({
      id: messageListId,
      listContent: [{
        id: this.props.messageId,
        socialNetworkId: this.props.socialNetworkId,
      }],
      context: {
        socialNetworkId: this.props.socialNetworkId,
        boxType: this.getBoxType()
      },
      messages: data.messages,
      messageContexts: data.messageContexts,
      nestedMessages: data.nestedMessages,
      nestedMessagesPaging: data.nestedMessagesPaging
    });
  }

  cleanupMessageList() {
    this.props.flux.getActions(MESSAGE_LIST).cleanUp(messageListId);
    this.setState({
      isMsgReady: false,
      isMsgRemoved: false
    })
  }

  trimMsgId(msgId) {
    return msgId.replace('twitter_', '').replace('facebook_', '');
  }

  getBoxType() {
    // AssignmentsManager in the back-end requires a box type to be set so it can get the externalMessageId
    // This can be removed after Assignments has been removed.
    if (this.props.socialNetworkType && this.props.socialNetworkType.toLowerCase() === FACEBOOK.toLowerCase()) {
      return 'F_WALL';
    }
    // Default to MENTION as in SinglePostViewWrapper
    return 'MENTION';
  }

  scrollToSpecifiedComment() {
    if (typeof window.$.fn.velocity !== 'function') {
        return;
    }

    const _transitionStyleStr = 'transition: background-color 250ms ease-in;';
    // Highlights a comment for a specific duration using highlight control class
    const _highlightComment = ($c) => {
        const highlightDuration = 1000; // ms
        // This highlight is styled inline to avoid unecessary styles in hs-app-streams
        $c.attr('style', _transitionStyleStr + 'background-color: #fff0BD;');
        setTimeout(() => {
            $c.attr('style', _transitionStyleStr); // let bg color transition back
            setTimeout(() => {
                $c.removeAttr('style'); // Completely reset inline styles
            }, 1500);
        }, highlightDuration + 250); // CSS transition is already 250ms
    }

    // Wait so user sees post first, then scroll and/or highlight active comment
    const postDelay = 750;

    // CUXF-3235: I truly am sorry for such a hacky, non-React workaround
    setTimeout(() => {
      const $comment = window.$('.rc-CommentStreamView.x-isActive');
      const isSavedItemRightPanel = window.$('.-SavedItemScroll').length > 0;
      const isSavedItemModal = window.$('.-SavedItemModalScroll').length > 0;
      const $scrollContainer = isSavedItemRightPanel
        ? window.$('.-SavedItemScroll')
        : isSavedItemModal
          ? window.$('.-SavedItemModalScroll')
          : window.$('.rc-SingleMessageViewWrapper');
      const $listContainer = $scrollContainer.find('.-singleMessageSectionContainer');
      const listContainerHeight = $listContainer.height();
      const listContainerOffset = $listContainer.offset()?.top;
      const commentOffset = $comment.offset()?.top;
      const commentHeight = $comment.height();
      const windowHeight = window.$(window).height();
      let offset;
      if (commentOffset > windowHeight) {
          // Calculate offset to center comment in viewport
          offset = -0.5 * windowHeight + commentHeight / 2;
      }
      // Check if comment is near end of list and can't be centered
      const lastCenterableScrollOffset = listContainerOffset + listContainerHeight - windowHeight / 2;
      if (commentOffset > lastCenterableScrollOffset) {
          offset = -1 * (commentOffset - lastCenterableScrollOffset + windowHeight / 2 - 2 * commentHeight);
      }

      if (isSavedItemModal) {
        offset += 76; // Adding the height of the modal footer
      }

      // Prepare comment for fading highlight in and out
      $comment.attr('style', _transitionStyleStr);

      // If comment is already on page, no need to scroll to it
      if (offset) {
          // Scroll velocity in px/s we'd like to maintain
          const scrollVel = 2000;
          // Calculate scroll duration in ms
          const scrollDuration = 1000 * (commentOffset / scrollVel);
          // Easing for long posts should accelerate quicker
          const easing = scrollDuration > 1000 ? 'easeInOutSine' : 'easeInOutCubic';

          $.Velocity.animate($comment, 'scroll', {
              container: $scrollContainer,
              offset: offset,
              duration: scrollDuration,
              easing: easing
          }).then(() => {
              _highlightComment($comment);
          });
      } else {
          _highlightComment($comment);
      }
    }, postDelay);
  }

  getSingleMsgView() {
    if (this.state.isMsgReady) {
      const messageListContext = {
        boxType: this.getBoxType(),
        messageListId: messageListId,
        isAssignable: true,
        renderSocialNetworkAvatar: true,
        socialNetworkType: this.props.socialNetworkType && this.props.socialNetworkType.toUpperCase()
      };
      return (
        <div className='-singleMessageSection'>
          <SingleMessageView
            flux={this.props.flux}
            maxHeight={this.props.maxHeight}
            messageId={this.props.messageId}
            messageListContext={messageListContext}
            overflowY={this.props.overflowY}
            socialNetworkId={this.props.socialNetworkId}
            shouldScrollToComment={this.props.shouldScrollToComment}
            scrollToSpecifiedComment={this.scrollToSpecifiedComment}
          />
        </div>
      );
    } else if (this.state.isMsgRemoved) {
      return <SingleMessageNotFound />
    }
    return <Throbber />
  }

  onBackButtonClick() {
    trackerDataLab.trackCustom('web.dashboard.notification_center', 'SMV_back_button_clicked');
    if (hs.prevDashboardUrl) {
        window.history.back();
    } else {
        window.address.goToDefaultUrl();
    }
  }

  getSingleMessageHeaderText() {
    return this.headerText;
  }

  getSingleMessageHeader() {
    return (
      <div className='-SingleMessageViewHeader'>
        {this._renderButton()}
        <div className='-SingleMessageViewHeaderText'>
          {this.getSingleMessageHeaderText()}
        </div>
      </div>
    );
  }

  onSaveStream() {
    this.props.flux.getActions(MESSAGE).createCommentStream({
      postId: this.trimMsgId(this.props.messageId),
      socialNetworkId: this.props.socialNetworkId,
      boxType: boxTypesUtils.getCommentBoxTypeForSocialNetwork(this.props.socialNetworkType)
    });
    this.props.onHide();
  }

  _renderButton() {
    if (this.props.backButton) {
      return (
        <div className='-SingleMessageViewBackButton' onClick={this.onBackButtonClick}>
          <Icon glyph={ArrowLeft} />
        </div>
      );
    }
  }

  render() {
    return (
      <div className='rc-SingleMessageViewWrapper singleMsgPageWrapper'
        style={{position: this.props.wrapperPositionStyle}}
      >
        {!this.props.shouldHideHeader && this.getSingleMessageHeader()}
        <div className='-singleMessageSectionContainer'>
          {this.getSingleMsgView()}
        </div>
      </div>
    );
  }
}

SingleMessageViewWrapper.displayName = 'SingleMessageViewWrapper';

SingleMessageViewWrapper.propTypes = {
  backButton: PropTypes.bool,
  commentId: PropTypes.string,
  flux: PropTypes.object.isRequired,
  messageId: PropTypes.string,
  messageType: PropTypes.string,
  shouldScrollToComment: PropTypes.bool,
  socialNetworkId: PropTypes.number,
  socialNetworkType: PropTypes.string,
  wrapperPositionStyle: PropTypes.string,
  onHide: PropTypes.func,
  maxHeight: PropTypes.string,
  overflowY: PropTypes.string,
  onMessageReady: PropTypes.func,
  shouldHideHeader: PropTypes.bool,
};

SingleMessageViewWrapper.defaultProps = {
  backButton: true,
  maxHeight: 'none',
  messageType: '',
  overflowY: 'visible',
  shouldScrollToComment: false,
  wrapperPositionStyle: 'static',
  onMessageReady: () => {},
  shouldHideHeader: false,
}

export default SingleMessageViewWrapper;
