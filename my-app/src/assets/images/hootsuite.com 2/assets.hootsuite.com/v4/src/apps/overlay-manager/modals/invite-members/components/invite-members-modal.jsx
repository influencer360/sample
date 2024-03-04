import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import AppBase from 'core/app-base';
import InviteMembersModalContainer from 'hs-app-organization/lib/components/modal/invite-members-modal/invite-members-modal-container';
import organizationFlux from 'hs-app-organization/lib/stores/flux';

export default AppBase.extend({
    messageEvents: {
        'inviteMembersModal:close': 'close'
    },

    onInitialize: function (options) {
        _.extend(this, _.pick(options, 'organizationId', 'onSuccess', 'paymentMemberId'));
        if (_.isUndefined(this.organizationId)) {
            hs.statusObj.update('An error occurred', 'error', true);
        }
    },

    render: function () {
        this.container = document.createElement('div');
        document.body.appendChild(this.container);

        ReactDOM.render(
            <InviteMembersModalContainer
                flux={organizationFlux}
                onRequestHide={this.close.bind(this)}
                facadeApiUrl={hs.facadeApiUrl || ''}
                onError={this.displayError}
                onShowPaywall={dashboard.showFeatureAccessDeniedPopup}
                onSuccess={this.onSuccess}
                organizationId={this.organizationId}
                paymentMemberId={this.paymentMemberId}
                memberId={hs.memberId}
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

        hootbus.emit('notify:overlay:closed', 'modal', 'inviteMembers');
    },

    displayError: function() {
        hs.statusObj.update(translation._('An error occurred while processing your request, please try again later'), 'error', true);
    }
});
