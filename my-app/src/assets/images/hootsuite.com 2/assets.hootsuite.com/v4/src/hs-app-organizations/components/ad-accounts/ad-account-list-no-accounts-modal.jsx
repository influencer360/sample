'use strict';

import React from 'react';
import hootbus from 'hs-nest/lib/utils/hootbus';
import translation from 'utils/translation';
import adAccountConstants from '../../constants/ad-account-constants';
import trackingConstants from '../../constants/tracking-constants';

import './ad-account-list-no-accounts-modal.less';

export default {
  render: function(socialNetworkType) {
    const bodyEl = React.createElement(
      'div', {className: 'rc-noAdAccountsModal -container'},
      React.createElement('div', {className: '-p'}, adAccountConstants.noAdAccountsMessage[socialNetworkType]),
      React.createElement(
        'div', {},
        React.createElement('span', {
          className: '-learn-more -p',
          onClick: () => {
            window.open(adAccountConstants.noAdAccountsLearnMoreLink[socialNetworkType], '_blank');
          }
        }, translation._('Learn more')),
        React.createElement('span', {className: '-learn-more-explained -p'}, adAccountConstants.noAdAccountsLearnMoreText[socialNetworkType])
      )
    );

    const options = {
      bodyText: bodyEl,
      trackingOrigin: trackingConstants.addAdAccountNone,
      primaryBtnText: translation._('Ok'),
      title: translation._('No Ad Account'),
    };

    hootbus.emit('overlay:init', 'modal', 'confirmationModal', options);
  }
};
