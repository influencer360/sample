import React from 'react';
import ReactDOM from 'react-dom';
import events from 'hs-events';
import StandardModal from 'hs-nest/lib/components/modal/standard-modal';
import SocialNetworkAvatar from 'hs-nest/lib/components/avatars/social-network-avatar/social-network-avatar';
import Icon from '@fp-icons/icon-base';
import Check from '@fp-icons/symbol-check';
import AppBase from 'core/app-base';
import hootbus from 'utils/hootbus';
import trackerDatalab from 'utils/tracker-datalab';
import translation from 'utils/translation';
import snActions from 'apps/social-network/actions';

import './twitter-account-overview-modal.less';

export default AppBase.extend({

    TRACKING_ORIGIN: 'web.dashboard.twitter_account_overview_modal',

    messageEvents: {
        'twitterAccountOverviewModal:close': 'onDismiss'
    },

    onInitialize: function () {
        this.loadData = this.loadData.bind(this);
        this.socialNetworks = [];
        hootbus.on(events.SOCIAL_NETWORK_ADD_SUCCESS, this.loadData);
        hootbus.on(events.SOCIAL_NETWORK_ADD_ERROR, this.loadData);
        hootbus.on(events.SOCIAL_NETWORK_REAUTH_SUCCESS, this.loadData);
        hootbus.on(events.SOCIAL_NETWORK_REAUTH_ERROR, this.loadData);
    },

    onReauthClick: function(socialNetwork) {
        snActions.reconnect(socialNetwork, null);
    },

    getProfileAction: function(socialNetwork) {
        if (socialNetwork.isReauthRequired || socialNetwork.socialIntegrationAccountId == 1) {
            return <a className="rc-action" onClick={this.onReauthClick.bind(this, socialNetwork)}>{translation._('Reauthenticate')}</a>
        } else {
            return <div className="rc-action"><Icon glyph={Check} fill="#417505" size={12} />{translation._('Reauthenticated')}</div>
        }
    },

    renderModal: function () {
        const footer = (
            <span>
                {translation._('Having trouble?')}&nbsp;<a href='https://help.hootsuite.com/hc/en-us/articles/360003039253' target='_blank' rel="noopener noreferrer" className="rc-twitter-faqs">{translation._('Visit our help article')}</a>
            </span>
        );

        const _this = this;
        const socialNetworksList = this.socialNetworks.map(function(socialNetwork) {
            return (
                <div className="rc-profile" key={socialNetwork.socialNetworkId}>
                    <SocialNetworkAvatar
                        avatar={socialNetwork.avatar}
                        type={socialNetwork.type}
                        isReauthRequired={socialNetwork.isReauthRequired || socialNetwork.socialIntegrationAccountId == 1}
                        round/>
                    <div className="rc-username">@{socialNetwork.username}</div>
                    {_this.getProfileAction(socialNetwork)}
                </div>
            );
        });

        ReactDOM.render(
            <StandardModal
                enableScrollableContent={false}
                footerContent={footer}
                onRequestHide={this.onDismiss.bind(this, true)}
                titleText={translation._('Reauthenticate your Twitter accounts')}
                className='rc-twitterAccountOverviewModal'
                width='470'
            >
                <div>
                    <p className="rc-intro">{translation._('In an ongoing effort to improve our customer\'s experience, we are migrating to a newer version of the Twitter app. Users need to reauthenticate their Twitter accounts before July 2nd.')}</p>
                    <div className="twitter-accounts">
                    {socialNetworksList}
                    </div>
                </div>
            </StandardModal>
            , this.container);
    },

    render: function () {
        trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'opened');

        this.container = document.createElement('div');
        this.container.setAttribute('id', 'twitterAccountOverview');
        document.body.appendChild(this.container);
        this.loadData();
    },

    loadData: function() {
        ajaxCall({
            url: '/ajax/twitter/get-accounts',
            success: function (data) {
                if (data.success) {
                    this.socialNetworks = data.socialNetworks;
                    this.renderModal();
                }
            }.bind(this)
        }, 'q1');
    },

    onDismiss: function () {
        this._closeModal();
    },

    _closeModal: function () {

        hootbus.off(events.SOCIAL_NETWORK_ADD_SUCCESS, this.loadData);
        hootbus.off(events.SOCIAL_NETWORK_ADD_ERROR, this.loadData);

        setTimeout(() => {
            if (this.container && this.container.parentNode) {
                ReactDOM.unmountComponentAtNode(this.container);
            }
        }, 0);
        AppBase.prototype.destroy.call(this);
        hootbus.emit('notify:overlay:closed', 'modal', 'twitterAccountOverview');
    }
});
