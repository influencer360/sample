/** @preventMunge */
'use strict';

import ReactDOM from 'react-dom';
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise';
import schedulerUtil from 'publisher/scheduler/util';
import translation from 'utils/translation';

import getHsAppPublisher from 'components/publisher/get-hs-app-publisher';

import baseFlux from 'hs-nest/lib/stores/flux';
import {
  MEMBER
} from 'hs-nest/lib/actions';

const handlePromiseError = () => {
    hs.statusObj.update(translation._('Failed to retrieve approval messages data'), 'warning', true);
};

const onViewMessagesClick = () => {
    const subSec = schedulerUtil.getSubSection();

    // If the user is not in the Scheduled view and they click on the
    // 'View messages' link, click the 'List' button to bring them to
    // the List view. We need to click on the refresh button to refresh
    // the list view and re-populate the unscheduled approvals dropdown.
    if (subSec !== 'scheduled') {
        const $filter = $('._filter');
        $filter.find('._list').trigger('click');
        $filter.find('._refresh').trigger('click');
    }
};

const _unmountInlineRedirectNotification = (component) => {
    ReactDOM.unmountComponentAtNode(component);
    $('._inlineRedirectNotification').remove();
};

const getMessagesRequireApprovalLabelAndUrl = () => {
    return {
        label: translation._('There are %s1unscheduled%s2 messages %s1awaiting your approval%s2')
            .replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>'),
        url: '/dashboard#/publisher/approvequeue'
    };
};

const getMessagesPendingApprovalLabelAndUrl = () => {
    return {
        label: translation._('You have %s1unscheduled%s2 messages %s1waiting to be approved%s2')
            .replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>'),
        url: '/dashboard#/publisher/pendingapproval'
    };
};

const getMessagesRejectLabelAndUrl = () => {
    return {
        label: translation._('You have %s1unscheduled%s2 messages that have been %s1rejected%s2')
            .replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>'),
        url: '/dashboard#/publisher/rejected'
    };
};

const getCommentsRequireApprovalLabelAndUrl = () => {
    return {
        label: translation._('There are %s1comments and replies%s2 %s1awaiting your approval%s2')
            .replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>'),
        url: '/dashboard#/publisher/approvequeue'
    };
};

const getCommentsPendingApprovalLabelAndUrl = () => {
    return {
        label: translation._('You have %s1comments and replies%s2 %s1waiting to be approved%s2')
            .replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>'),
        url: '/dashboard#/publisher/pendingapproval'
    };
};

const getCommentsRejectedLabelAndUrl = () => {
    return {
        label: translation._('You have %s1comments and replies%s2 that have been %s1rejected%s2')
            .replace(/%s1/g, '<strong>').replace(/%s2/g, '</strong>'),
        url: '/dashboard#/publisher/rejected'
    };
};

const _render = (data) => {
    const hasData = (data.grouped && data.grouped.length > 0) || (data.nonGrouped && data.nonGrouped.length > 0);
    const isCommentOrReply = hasData && data.nonGrouped[0] && (data.nonGrouped[0].type === 'MESSAGE' || data.nonGrouped[0].type === 'COMMENT');
    const subSec = schedulerUtil.getSubSection();
    const parent = document.getElementsByClassName(isCommentOrReply ? '_commentsRepliesNotification' : '_unscheduledMessagesNotification');
    let items = [];

    if (subSec !== 'scheduled') {
        if (parent.length && hasData) {
            if (subSec === 'approvequeue') {
                items = [isCommentOrReply ? getCommentsRequireApprovalLabelAndUrl() : getMessagesRequireApprovalLabelAndUrl()];
            }

            if (subSec === 'pendingapproval') {
                items = [isCommentOrReply ? getCommentsPendingApprovalLabelAndUrl() : getMessagesPendingApprovalLabelAndUrl()];
            }

            if (subSec === 'rejected') {
                items = [isCommentOrReply ? getCommentsRejectedLabelAndUrl() : getMessagesRejectLabelAndUrl()];
            }

            getHsAppPublisher().then(({ renderInlineRedirectNotification }) => {
                const props = {
                    items: items,
                    memberId: baseFlux.getStore(MEMBER).get().memberId,
                    resetTopAndHeightOfListContent: scheduler.setHeight,
                    onViewMessagesClick: onViewMessagesClick
                }
                renderInlineRedirectNotification(props, parent[0])
            });
        }
    } else {
        const requireApprovalUnscheduledMessages = ajaxPromise({
            type: 'GET',
            url: '/ajax/message-review/get-require-approval-unscheduled-messages'
        }, 'qm');

        const pendingApprovalUnscheduledMessages = ajaxPromise({
            type: 'GET',
            url: '/ajax/message-review/get-pending-approval-unscheduled-messages'
        }, 'qm');

        Promise.all([requireApprovalUnscheduledMessages, pendingApprovalUnscheduledMessages]).then(data => {
            const unscheduledRequireApprovalData = data[0];
            const unscheduledPendingApprovalData = data[1];
            const hasUnscheduledRequireApprovalMessages = (unscheduledRequireApprovalData.grouped.length > 0) || (unscheduledRequireApprovalData.nonGrouped.length > 0);
            const hasUnscheduledPendingApprovalMessages = (unscheduledPendingApprovalData.grouped.length > 0) || (unscheduledPendingApprovalData.nonGrouped.length > 0);
            const parent = document.getElementsByClassName('_inlineRedirectNotification');

            if (parent.length && !hasUnscheduledRequireApprovalMessages && !hasUnscheduledPendingApprovalMessages) {
                _unmountInlineRedirectNotification(parent[0]);
                scheduler.setHeight();
            } else if (parent.length) {
                if (hasUnscheduledRequireApprovalMessages) {
                    items.push(getMessagesRequireApprovalLabelAndUrl());
                }

                if (hasUnscheduledPendingApprovalMessages) {
                    items.push(getMessagesPendingApprovalLabelAndUrl());
                }

                getHsAppPublisher().then(({ renderInlineRedirectNotification }) => {
                    const props = {
                        items: items,
                        memberId: baseFlux.getStore(MEMBER).get().memberId,
                        resetTopAndHeightOfListContent: scheduler.setHeight,
                        onViewMessagesClick: onViewMessagesClick
                    }
                    renderInlineRedirectNotification(props, parent[0])
                });
            }
        }).catch(handlePromiseError);
    }
};

const RenderInlineRedirectNotification = {
    render: _render,
    unload: _unmountInlineRedirectNotification
};

export default RenderInlineRedirectNotification;
