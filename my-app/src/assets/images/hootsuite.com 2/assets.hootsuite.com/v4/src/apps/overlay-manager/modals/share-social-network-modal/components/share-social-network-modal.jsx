import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import AppBase from 'core/app-base';

import ShareSocialNetworkModalWrapper from 'hs-app-organization/lib/components/share-social-network-modal/share-social-network-modal-wrapper';

export default AppBase.extend({
    messageEvents: {
        'shareSocialNetworkModal:close': 'close'
    },

    onInitialize: function (options) {
        this.flux = options.flux;
        this.createCallback = options.createCallback;
    },

    render: function () {
        this.container = document.createElement('div');
        document.body.appendChild(this.container);

        ReactDOM.render(
          <ShareSocialNetworkModalWrapper
            createCallback={this.createCallback}
            flux={this.flux}
            permissionOptions={_.pick(hs.permissionsAndPresets['presets']['socialNetwork'], 'SN_DEFAULT', "SN_ADVANCED")}
            defaultPermissionValue='SN_DEFAULT'
            onRequestHide={this.close.bind(this)}
            onError={this.displayError}
          />,
          this.container
        );
    },

    close: function () {
        var container = this.container;

        _.defer(function () {
          ReactDOM.unmountComponentAtNode(container);
          if (container && container.parentNode) {
            container.parentNode.removeChild(container);
          }
        });

        hootbus.emit('notify:overlay:closed', 'modal', 'shareSocialNetwork');
    },

    displayError: function() {
        hs.statusObj.update(translation._('An error occurred while processing your request, please try again later'), 'error', true);
    }
});
