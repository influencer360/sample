'use strict';

import React from 'react';
import hootbus from 'hs-nest/lib/utils/hootbus';
import translation from 'utils/translation';
import trackingConstants from '../../constants/tracking-constants';
import adAccountConstants from '../../constants/ad-account-constants';

import './ad-account-list-no-permissions-modal.less';

export default {
  render: function(socialNetworkType) {
    const bodyEl = React.createElement(
      'div', {className: 'rc-noPermissionsModal -container'},
      React.createElement('div', {className: '-p'}, adAccountConstants.noPermissionMessage[socialNetworkType])
    );

    const options = {
      bodyText: bodyEl,
      trackingOrigin: trackingConstants.addAdAccountNone,
      primaryBtnText: translation._('Ok'),
      title: adAccountConstants.noPermissionTitle[socialNetworkType],
    };

    hootbus.emit('overlay:init', 'modal', 'confirmationModal', options);
  }
};
