import React from 'react';
import ReactDOM from 'react-dom';
import StandardModal from 'hs-nest/lib/components/modal/standard-modal';
import Icon from '@fp-icons/icon-base';
import Check from '@fp-icons/symbol-check';
import Button from 'hs-nest/lib/components/buttons/button';
import AppBase from 'core/app-base';
import hootbus from 'utils/hootbus';
import staticAssets from 'hs-nest/lib/utils/static-assets';
import trackerDatalab from 'utils/tracker-datalab';
import translation from 'utils/translation';

import './free-trial-promo-modal.less';

export default AppBase.extend({
    onInitialize (params) {
        this.offerDaysLeft = params.offerDaysLeft;
    },

    TRACKING_ORIGIN: 'web.dashboard.free_trial_promo_modal',

    messageEvents: {
        'freeTrialPromoModal:close': 'onDismiss'
    },

    render: function () {
        trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'free_trial_promo_opened');

        this.container = document.createElement('div');
        this.container.setAttribute('id', 'freeTrialPromo');
        document.body.appendChild(this.container);

        var checkmark = (
            <Icon
                fill={'#00aeef'}
                size={20}
                sourceKey={Check}
            />
        );

        var self = this;
        ReactDOM.render(
            <StandardModal
                onRequestHide={this.onDismiss.bind(this, true)}
                titleText={translation._('Try Hootsuite Professional, Free for 60 Days')}
                className='rc-freeTrialModal'
                width='510'>
                <div>
                    <span className='-introText'>
                        <strong>{translation._('Limited time offer') + ' - %s'.replace('%s', this.offerDaysLeft)}</strong><br />
                        {translation._('Upgrade your account to Hootsuite professional to unlock power features and get better results on social media')}
                    </span>
                    <img className='-image' src={staticAssets.rootifyImage('/modals/freeTrialPromo/confettiowly.png')} />
                    <span className='-checklist'>
                        <li>
                            <span className='-checklistHeadListItem'>{translation._('With Hootsuite Professional you can:')}</span>
                        </li>
                        <li>
                            {checkmark}
                            <span className='-checklistItem'>{translation._('Manage up to 10 social networks')}</span>
                        </li>
                        <li>
                            {checkmark}
                            <span className='-checklistItem'>{translation._('Schedule multiple posts in advance')}</span>
                        </li>
                        <li>
                            {checkmark}
                            <span className='-checklistItem'>{translation._('Get real-time analytics')}</span>
                        </li>
                        <li>
                            {checkmark}
                            <span className='-checklistItem'>{translation._('Create campaigns and contests')}</span>
                        </li>
                    </span>
                </div>
                <span className='-concText'>
                    <strong>{translation._('Start your free 60-day trial today')}</strong>
                </span>
                <Button btnStyle='action' className='-upgradeButton' onClick={self.onAction.bind(self)}>
                    {translation._('Upgrade Now')}
                </Button>
                <Button btnStyle='secondary' className='-dismissButton' onClick={self.onDismiss.bind(self, true)}>
                    {translation._('No Thanks')}
                </Button>
                <div className='-disclaimer'>
                    {translation._('Offer only available from this link')}
                </div>
            </StandardModal>
            , this.container);
    },

    onDismiss: function (userAction) {
        if (userAction) {
            trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'free_trial_promo_closed');
        }
        setTimeout(() => {
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        }, 0);
        AppBase.prototype.destroy.call(this);
        hootbus.emit('notify:overlay:closed', 'modal', 'freeTrialPromo');
    },

    onAction: function () {
        trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'free_trial_promo_action');
        window.location.href = '/plans/upgrade/60dft';
    }

});
