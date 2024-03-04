import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import hootbus from 'utils/hootbus';
import AppBase from 'core/app-base';
import CreateTeamWithSnsAndMembersWrapper from 'hs-app-organization/lib/components/create-team-with-sns-and-members-modal/create-team-with-sns-and-members-modal-wrapper';
import organizationFlux from 'hs-app-organization/lib/stores/flux';
import translation from 'utils/translation';

export default AppBase.extend({
    messageEvents: {
        'createTeamWithSnsAndMembers:close': 'close'
    },

    trackingOrigin: 'web.dashboard.create_team_with_social_networks_and_members',

    onInitialize: function (options) {
        _.extend(this, _.pick(options, 'organizationId', 'onSuccess', 'paymentMemberId', 'memberId', 'trackingOrigin'));
        if (_.isUndefined(this.organizationId)) {
            hs.statusObj.update('An error occurred', 'error', true);
        }
    },

    render: function () {
        this.container = document.createElement('div');
        document.body.appendChild(this.container);

        ReactDOM.render(
            <CreateTeamWithSnsAndMembersWrapper
                flux={organizationFlux}
                memberId={this.memberId}
                onError={this.displayError}
                onRequestHide={this.close.bind(this)}
                onShowPaywall={dashboard.showFeatureAccessDeniedPopup}
                organizationId={this.organizationId}
                onSuccess={this.onSuccess}
                paymentMemberId={this.paymentMemberId}
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

        hootbus.emit('notify:overlay:closed', 'modal', 'createTeamWithSnsAndMembers');
    },

    displayError: function() {
        hs.statusObj.update(translation._('An error occurred while processing your request, please try again later'), 'error', true);
    }
});
