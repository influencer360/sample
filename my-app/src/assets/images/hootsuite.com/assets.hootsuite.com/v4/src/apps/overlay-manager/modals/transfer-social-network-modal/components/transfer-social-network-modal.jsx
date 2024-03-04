import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import AppBase from 'core/app-base';
import TransferSocialNetworkModalWrapper from 'hs-app-organization/lib/components/transfer-social-network-modal/transfer-social-network-modal-wrapper';
import organizationFlux from 'hs-app-organization/lib/stores/flux';

export default AppBase.extend({
    messageEvents: {
        'transferSocialNetworkModal:close': 'close'
    },

    onInitialize: function (options) {
        this.socialNetwork = options.socialNetwork;
    },

    render: function () {
        this.container = document.createElement('div');
        document.body.appendChild(this.container);

        ReactDOM.render(
            <TransferSocialNetworkModalWrapper
                flux={organizationFlux}
                onRequestHide={this.close.bind(this)}
                facadeApiUrl={hs.facadeApiUrl || ''}
                onError={this.displayError}
                socialNetwork={this.socialNetwork}
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

        hootbus.emit('notify:overlay:closed', 'modal', 'transferSocialNetwork');
    },

    displayError: function() {
        hs.statusObj.update(translation._('An error occurred while processing your request, please try again later'), 'error', true);
    }
});
