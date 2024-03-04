import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import hootbus from 'utils/hootbus';
import AppBase from 'core/app-base';
import AddSharedSocialNetworkModalWrapper from 'hs-app-organization/lib/components/add-shared-social-network-modal/add-shared-social-network-modal-wrapper';
import organizationFlux from 'hs-app-organization/lib/stores/flux';
import translation from 'utils/translation';

export default AppBase.extend({
    messageEvents: {
        'addSharedSocialNetworkModal:close': 'close'
    },

    onInitialize: function (options) {
        _.extend(this, _.pick(options, 'organizationId', 'onSuccess', 'trackingOrigin'));
        if (_.isUndefined(this.organizationId)) {
            hs.statusObj.update('An error occurred', 'error', true);
        }
    },

    render: function () {
        this.container = document.createElement('div');
        document.body.appendChild(this.container);

        ReactDOM.render(
            <AddSharedSocialNetworkModalWrapper
                flux={organizationFlux}
                onRequestHide={this.close.bind(this)}
                facadeApiUrl={hs.facadeApiUrl || ''}
                onError={this._displayError}
                onSuccess={this.onSuccess}
                organizationId={this.organizationId}
                trackingOrigin={this.trackingOrigin}
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

        hootbus.emit('notify:overlay:closed', 'modal', 'addSharedSocialNetwork');
    },

    _displayError: function() {
        hs.statusObj.update(translation._('An error occurred while processing your request, please try again later'), 'error', true);
    }
});
