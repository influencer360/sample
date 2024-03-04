import React from 'react';
import ReactDOM from 'react-dom';
import UnableToShareSnModal from 'hs-app-organization/lib/components/modal/unable-to-share-sn-modal/unable-to-share-sn-modal';
import JsxUtils from 'hs-nest/lib/utils/jsx-utils';
import translation from 'utils/translation';
import AppBase from 'core/app-base';
import hootbus from 'utils/hootbus';
import trackerDatalab from 'utils/tracker-datalab';
import _ from 'underscore';

export default AppBase.extend({
    messageEvents: {
        'modals:unable:to:share:sn:destroy': 'closeModal'
    },

    origin: 'web.dashboard.unable_to_share_social_network',
    moreInfoLink: 'https://help.hootsuite.com/hc/en-us/articles/204585390-Transfer-or-reclaim-social-networks',

    onInitialize: function (options) {
        options = options || {};
        _.extend(this, _.pick(options, 'socialNetworkName', 'socialNetworkOwnerName'));
    },

    render: function () {
        this.container = document.createElement('div');
        document.body.appendChild(this.container);

        trackerDatalab.trackCustom(this.origin, 'modal_opened');

        var translatedContent = translation._('The social network  %b%s1%/b cannot be added as it\'s managed in Hootsuite by %b%s2%/b.')
            .replace('%s1', this.socialNetworkName).replace('%s2', this.socialNetworkOwnerName);
        var boldedText = JsxUtils.jsxFromTemplate(translatedContent);
        var moreInfoLink = this.moreInfoLink ? (<a
            className='-link'
            href={this.moreInfoLink}
            target='_blank'
            rel="noopener noreferrer">
            {translation._('More Information')}
        </a>) : '';

        var bodyText = (
            <p className='-content'>
                {boldedText} {moreInfoLink}
            </p>
        );

        ReactDOM.render(
            <UnableToShareSnModal
                bodyText={bodyText}
                onRequestHide={this.closeModal.bind(this)}
                socialNetworkName={this.socialNetworkName}
            />
            , this.container);
    },

    closeModal: function () {
        _.defer(_.bind(function () {
            ReactDOM.unmountComponentAtNode(this.container);
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        }, this));

        this.destroy();
        hootbus.emit('notify:overlay:closed', 'modal', 'unableToShareSN');
    },

});
