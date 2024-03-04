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

const unmountUnscheduledMessagesBanner = (component) => {
    ReactDOM.unmountComponentAtNode(component);
    $('._unscheduledMessagesBanner').remove();
};

const _render = (messages, isRefresh) => {
    let hasUnscheduledRequireApprovalMessages = false;
    let hasUnscheduledPendingApprovalMessages = false;
    let hasUnscheduledRejectedMessages = false;
    const parent = document.getElementsByClassName('_unscheduledMessagesBanner');
    const subSec = schedulerUtil.getSubSection();

    if (subSec === 'rejected') {
        hasUnscheduledRejectedMessages = (messages.grouped.length > 0) || (messages.nonGrouped.length > 0);
    } else if (subSec === 'approvequeue') {
        hasUnscheduledRequireApprovalMessages = (messages.grouped.length > 0) || (messages.nonGrouped.length > 0);
    } else if (subSec === 'pendingapproval') {
        hasUnscheduledPendingApprovalMessages = (messages.grouped.length > 0) || (messages.nonGrouped.length > 0);
    }

    if (subSec !== 'scheduled') {
        if (parent.length && isRefresh && !hasUnscheduledPendingApprovalMessages && !hasUnscheduledRequireApprovalMessages && !hasUnscheduledRejectedMessages) {
            unmountUnscheduledMessagesBanner(parent[0]);
            scheduler.setHeight();
        } else if (parent.length && (hasUnscheduledPendingApprovalMessages || hasUnscheduledRequireApprovalMessages || hasUnscheduledRejectedMessages)) {
            getHsAppPublisher().then(({ renderUnscheduledApprovalsListBanner }) => {
                const props = {
                    hasUnscheduledPendingApprovalMessages: hasUnscheduledPendingApprovalMessages,
                    hasUnscheduledRequireApprovalMessages: hasUnscheduledRequireApprovalMessages,
                    hasUnscheduledRejectedMessages: hasUnscheduledRejectedMessages,
                    memberId: baseFlux.getStore(MEMBER).get().memberId,
                    onMountComplete: scheduler.setHeight,
                    onViewMessagesClick: onViewMessagesClick
                };
                renderUnscheduledApprovalsListBanner(props ,parent[0]);
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
            const hasUnscheduledRequireApprovalMessages = (data[0].grouped.length > 0) || (data[0].nonGrouped.length > 0);
            const hasUnscheduledPendingApprovalMessages = (data[1].grouped.length > 0) || (data[1].nonGrouped.length > 0);
            const parent = document.getElementsByClassName('_unscheduledMessagesBanner');

            if (parent.length && isRefresh && !hasUnscheduledPendingApprovalMessages && !hasUnscheduledRequireApprovalMessages) {
                ReactDOM.unmountComponentAtNode(parent[0]);
                scheduler.setHeight();
            } else if (parent.length && (hasUnscheduledPendingApprovalMessages || hasUnscheduledRequireApprovalMessages)) {
                getHsAppPublisher().then(({ renderUnscheduledApprovalsListBanner }) => {
                    const props = {
                        hasUnscheduledPendingApprovalMessages: hasUnscheduledPendingApprovalMessages,
                        hasUnscheduledRequireApprovalMessages: hasUnscheduledRequireApprovalMessages,
                        hasUnscheduledRejectedMessages: hasUnscheduledRejectedMessages,
                        memberId: baseFlux.getStore(MEMBER).get().memberId,
                        onMountComplete: scheduler.setHeight,
                        onViewMessagesClick: onViewMessagesClick
                    };
                    renderUnscheduledApprovalsListBanner(props ,parent[0]);
                });
            }
        }).catch(handlePromiseError);
    }
};

const RenderUnscheduledMessagesBanner = {
    render: _render,
    unload: unmountUnscheduledMessagesBanner
};

export default RenderUnscheduledMessagesBanner;
