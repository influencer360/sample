import React from 'react';
import ReactDOM from 'react-dom';
import events from 'hs-events';
import StandardModal from 'hs-nest/lib/components/modal/standard-modal';
import SocialNetworkAvatar from 'hs-nest/lib/components/avatars/social-network-avatar/social-network-avatar';
import Button from 'hs-nest/lib/components/buttons/button';
import Icon from '@fp-icons/icon-base';
import Check from '@fp-icons/symbol-check';
import AlertTriangle from '@fp-icons/symbol-alert-triangle';
import { InfoPopover, Placement } from 'fe-pg-comp-info-popover';
import AppBase from 'core/app-base';
import hootbus from 'utils/hootbus';
import trackerDatalab from 'utils/tracker-datalab';
import translation from 'utils/translation';
import snActions from 'apps/social-network/actions';

import './instagram-bunsiness-account-overview-modal.less';

export default AppBase.extend({

    TRACKING_ORIGIN: 'web.dashboard.instagram_business_account_overview_modal',

    messageEvents: {
        'instagramBusinessAccountOverviewModal:close': 'onDismiss'
    },

    onInitialize: function () {
        this.loadData = this.loadData.bind(this);
        this.socialNetworks = [];
        hootbus.on(events.SOCIAL_NETWORK_ADD_SUCCESS, this.loadData);
        hootbus.on(events.SOCIAL_NETWORK_ADD_ERROR, this.loadData);
        hootbus.on(events.SOCIAL_NETWORK_REAUTH_SUCCESS, this.loadData);
        hootbus.on(events.SOCIAL_NETWORK_REAUTH_ERROR, this.loadData);
    },

    onSetUpClick: function(socialNetwork) {
        snActions.reconnect(socialNetwork, null);
    },

    getProfileType: function(socialNetwork) {
        if (socialNetwork.extendedInfo && socialNetwork.extendedInfo.isBusiness) {
            return translation._('Business Profile');
        }

        return translation._('Personal Profile');
    },

    getProfileButton: function(socialNetwork) {
        if (socialNetwork.isDirectPublishingConfigured) {
            return <div className="rc-ready-to-publish">
              <Icon glyph={Check} fill="#417505" size={15} />
              {translation._('Ready to publish')}
            </div>
        } else {
            if (socialNetwork.extendedInfo && socialNetwork.extendedInfo.isBusiness) {
                return <Button className="rc-button-set-up" btnStyle='standard'
                               onClick={this.onSetUpClick.bind(this, socialNetwork)}>{translation._('Set up')}</Button>
            } else {
                const content = <div>
                  {translation._('Direct photo publishing is not available to personal profiles. You will have to switch to an Instagram business profile to enable this functionality.')} 
                  <a href='https://help.hootsuite.com/hc/en-us/articles/360000061827#androidExternalLink' target='_blank' rel="noopener noreferrer" style={{'fontWeight': 'bold'}}>{translation._('Learn more')}</a>
                </div>;
                return (
                    <div className="rc-set-up-personal">
                        <InfoPopover
                            placement={Placement.TOP}
                            title={translation._('Direct Photo Publishing')}
                            content={content}
                        >
                          <Icon glyph={AlertTriangle} size={20} />
                        </InfoPopover>
                        <Button className="rc-button-set-up" btnStyle='standard' onClick={this.onSetUpClick.bind(this, socialNetwork)}>{translation._('Set up')}</Button>
                    </div>
                );
            }
        }
    },

    renderModal: function () {
        const footer = (
            <span>
                {translation._('Having trouble?')}&nbsp;<a href='https://help.hootsuite.com/hc/en-us/articles/360000061827#androidExternalLink' target='_blank' rel="noopener noreferrer" className="rc-instagram-faqs">{translation._('Visit our Instagram FAQs')}</a>
           </span>
        );

        const _this = this;
        const socialNetworksList = this.socialNetworks.map(function(socialNetwork) {
            return (
                <div className="rc-profile" key={socialNetwork.socialNetworkId}>
                    <SocialNetworkAvatar
                        avatar={socialNetwork.avatar}
                        type={socialNetwork.type}
                        isReauthRequired={socialNetwork.isReauthRequired}
                        round />
                    <div className="rc-username">{socialNetwork.username}</div>
                    <div className="rc-type">{_this.getProfileType(socialNetwork)}</div>
                    {_this.getProfileButton(socialNetwork)}
                </div>
            );
        });

        ReactDOM.render(
            <StandardModal
                enableScrollableContent={false}
                footerContent={footer}
                onRequestHide={this.onDismiss.bind(this, true)}
                titleText={translation._('Set Up Instagram Direct Photo Publishing')}
                className='rc-instagramBusinessAccountOverviewModal'
                width='470'
            >
                <div>
                    <p className="rc-intro">{translation._('Direct photo publishing is available for Instagram business profiles. To enable, you must authenticate the Facebook account connected to each Instagram business profile.')}</p>
                    <div className="instagram-accounts">
                    {socialNetworksList}
                    </div>
                </div>
            </StandardModal>
            , this.container);
    },

    render: function () {
        trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'opened');

        this.container = document.createElement('div');
        this.container.setAttribute('id', 'instagramBusinessAccountOverview');
        document.body.appendChild(this.container);
        this.loadData();
    },

    loadData: function() {
        ajaxCall({
            url: '/ajax/instagram/get-accounts',
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
        hootbus.emit('notify:overlay:closed', 'modal', 'instagramBusinessAccountOverview');
    }
});
