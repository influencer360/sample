import React from 'react';
import ReactDOM from 'react-dom';
import StandardModal from 'hs-nest/lib/components/modal/standard-modal';
import Button from 'hs-nest/lib/components/buttons/button';
import AppBase from 'core/app-base';
import hootbus from 'utils/hootbus';
import trackerDatalab from 'utils/tracker-datalab';
import memberUtil from 'utils/member';
import translation from 'utils/translation';

import './onboarding-video-modal.less';

const VideoModal = (variation) => {
    if (variation === 1) {
        return (
            <div>
                <h2>{translation._('Learn how to add social networks, create monitoring streams, and schedule messages in this 2-minute video.')}</h2>
                <iframe src="//play.vidyard.com/HpbAgmg5jdPtscmiW3EBwM.html?v=3.1.1" width="640" height="360" scrolling="no" frameBorder="0" allowTransparency="true" allowFullscreen="true" />
            </div>
        );
    }

    return (
        <div>
            <h2>{translation._('Watch this video and start scheduling messages and monitoring your social networks all from one platform.')}</h2>
            <iframe src="//play.vidyard.com/UpKrx9HUALaAhc5LcfWW7Y.html?v=3.1.1" width="640" height="360" scrolling="no" frameBorder="0" allowTransparency="true" allowFullscreen="true" />
        </div>
    );
}

export default AppBase.extend({

    onInitialize (params) {
        // We'll need the variation version
        this.variation = params.variation;

        this.TRACKING_ORIGIN = `web.cro.free_ob_2_1.video.${this.variation}`;
    },

    messageEvents: {
        'popups:onboarding:video:modal:close': 'onDismiss'
    },

    render: function () {
        trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'onboarding_video_modal_opened');

        this.container = document.createElement('div');
        this.container.setAttribute('id', 'onboardingVideo');
        document.body.appendChild(this.container);

        var footer = (
            <span>
                <Button btnStyle='standard' onClick={this.onDismiss.bind(this, true)}>{translation._('Ok')}</Button>
            </span>
        );

        ReactDOM.render(
            <StandardModal
                footerContent={footer}
                onRequestHide={this.onDismiss.bind(this, true)}
                titleText={translation._('Get setup in 3 easy steps!')}
                className='rc-onboardingVideoModal'
                width='670'
            >
                {this.renderContent(this.variation)}
            </StandardModal>
            , this.container);
    },

    renderContent: VideoModal,

    onDismiss: function (userAction) {
        if (userAction) {
            trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'onboarding_video_modal_closed');
            // Storing version means latest version has been seen
            memberUtil.storeActionHistoryValue('hasSeenOnboardingVideo', 1);
        }
        setTimeout(() => {
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        }, 0);
        AppBase.prototype.destroy.call(this);
        hootbus.emit('notify:overlay:closed', 'modal', 'onboardingVideo');
    }

});
