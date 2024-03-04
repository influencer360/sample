'use strict';
import React from 'react';
import ReactDOM from 'react-dom';
import { AccountConnectDialog } from 'fe-ae-comp-account-connect';
import hootbus from 'hs-nest/lib/utils/hootbus';
import adAccountConstants from '../../constants/ad-account-constants';

export default {
  facadeApiUrl: hs.facadeApiUrl,

  render: function(memberId, socialNetworkId, socialNetworkType, callback) {
    const adAccountType = adAccountConstants.socialNetworkAdAccountType[socialNetworkType]

    if (!this.$containerEl) {
      this.$containerEl = $('<div />');
      $('body').append(this.$containerEl);
    } else {
      ReactDOM.unmountComponentAtNode(this.$containerEl[0]);
    }

    const handleClose = this.remove.bind(this, socialNetworkId, socialNetworkType, callback)
    const component = (
              <AccountConnectDialog
                  isAllowedToClose={false} // The component will be destroyed later in the remove func
                  onCancel={handleClose}
                  onSubmit={handleClose}
                  socialProfileIds={[socialNetworkId.toString()]}
                  socialNetwork={adAccountType}
              />
          )

    ReactDOM.render(component, this.$containerEl[0])
  },
  remove: function(socialNetworkId, socialNetworkType, callback) {
    setTimeout(() => {
      hootbus.emit('adAccount:refresh:command', socialNetworkId, socialNetworkType);
      ReactDOM.unmountComponentAtNode(this.$containerEl[0]);
      callback();
    }, 0);
  }
};
