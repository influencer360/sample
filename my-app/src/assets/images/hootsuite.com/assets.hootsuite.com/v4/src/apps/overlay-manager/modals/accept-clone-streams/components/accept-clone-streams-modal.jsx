import React from 'react';
import ReactDOM from 'react-dom';
import StandardModal from 'hs-nest/lib/components/modal/standard-modal';
import Button from 'hs-nest/lib/components/buttons/button';
import AppBase from 'core/app-base';
import hootbus from 'utils/hootbus';
import trackerDatalab from 'utils/tracker-datalab';
import _ from 'underscore';
import translation from 'utils/translation';

import address from '../../../../../address';

import './accept-clone-streams-modal.less';

const ModalFooter = function() {
    return <span>
        <Button btnStyle='secondary' onClick={this.showConfirmStepOrRejectCloneStreams.bind(this)}>{translation._('Reject shared tabs')}</Button>
        <Button className="_submitBtn" isLoading btnStyle='primary' onClick={this.acceptCloneStreams.bind(this)}>{translation._('Accept shared tabs')}</Button>
    </span>
}

const ModalContent = function() {
    var textStep1 = translation._('%s has invited you to the team, and has shared some tabs with you:').replace("%s", this.senderName);
    var textStep2 = translation._('You’re still part of the team, but you won’t be able to receive the tabs %s is sharing.').replace("%s", this.senderName);

    return <p>
        <img className="-senderImage _step1" src={this.senderAvatar} />
        <span className="_step1">{textStep1}</span>
        <span className="_step2 u-displayNone">{textStep2}</span>
        <ul className="-tabList">
            {this.renderTabList()}
        </ul>
    </p>;
}

export default AppBase.extend({
    TRACKING_ORIGIN: 'web.dashboard.accept_clone_streams.modal',
    messageEvents: {
        'modals:accept:clone:streams:destroy': 'onDismiss',
        'stream:postLoad:complete': 'streamPostLoadComplete'
    },

    step: 1,
    memberInviteBoxes: [],

    onInitialize: function (params) {
        if (params) {
            _.extend(this, _.pick(params, 'memberInviteBoxes', 'senderAvatar'));

            if (this.memberInviteBoxes.length) {
                // all invites will have the same sender
                var firstInvite = this.memberInviteBoxes[0];
                this.senderName = firstInvite['senderName'];
            }
        }
    },

    toggleLoading: function () {
        var $submitBtn = document.querySelector('._submitBtn')
        $submitBtn.classList.toggle('isLoading');
        $submitBtn.querySelector('div:first-child').classList.toggle('rc-ThrobbingLoader');

    },

    rejectCloneStreams: function () {
        ajaxCall({
            url: '/ajax/member/reject-clone-streams',
            type: 'POST'
        }, 'qm');
        this.onDismiss();
    },

    acceptCloneStreams: function () {
        trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'accept_clone_streams_accepted');
        this.toggleLoading();
        ajaxCall({
            url: '/ajax/member/accept-clone-streams',
            type: 'POST',
            success: function () {
                this.navigateToLatestStream = true;
                address.reloadStreams();
                this.onDismiss();
            }.bind(this)
        }, 'qm');
    },

    streamPostLoadComplete: function () {
        if (this.navigateToLatestStream) {
            // click on the last non-active tab
            var nonActiveTabs = document.querySelectorAll('#dashboardTabs ._tab:not(.active) ._load');
            var lastNonActiveTab = nonActiveTabs[nonActiveTabs.length - 1]
            lastNonActiveTab.click()
            this.onDismiss();
        }
    },

    renderFooter: function () {
        return ModalFooter.call(this);
    },
    renderTabList: function () {
        var tabTitles = [];
        this.memberInviteBoxes.forEach(function (memberInviteBox) {

            if (!_.contains(tabTitles, memberInviteBox.tabTitle)) {
                tabTitles.push(memberInviteBox.tabTitle);
            }
        });


        return tabTitles.map(function (tabTitle, i) {
            return <li key={i}>{tabTitle}</li>;
        })
    },

    renderContent: function () {
        return ModalContent.call(this);
    },

    render: function () {
        trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'accept_clone_streams_opened');
        this.container = document.createElement('div');
        this.container.setAttribute('id', 'acceptCloneStreamsModal');
        document.body.appendChild(this.container);
        var title = <span className="-title">
            <span className="_step1">
                {translation._('You’ve been invited to a team')}
            </span>
            <span className="_step2 u-displayNone">
                {translation._('Are you sure?')}
            </span>
        </span>;

        ReactDOM.render(
            <StandardModal
                onRequestHide={this.showConfirmStepOrRejectCloneStreams.bind(this)}
                titleText={title}
                footerContent={this.renderFooter()}
                >
                {this.renderContent()}
            </StandardModal>
        , this.container);

        this.toggleLoading();
    },

    showConfirmStepOrRejectCloneStreams: function () {
        if (this.step === 1) {
            this.step++;
            trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'accept_clone_streams_dismissed_once');
            document.querySelector('._step1').classList.add('u-displayNone');
            document.querySelector('._step2').classList.remove('u-displayNone');
        } else {
            trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'accept_clone_streams_dismissed_twice');
            this.rejectCloneStreams();
        }
    },

    onDismiss: function () {
        setTimeout(() => {
            if (this.container) {
                this.container.parentNode.removeChild(this.container);
            }
        });

        AppBase.prototype.destroy.call(this);
        hootbus.emit('notify:overlay:closed', 'modal', 'acceptCloneStreams');
    }
});


