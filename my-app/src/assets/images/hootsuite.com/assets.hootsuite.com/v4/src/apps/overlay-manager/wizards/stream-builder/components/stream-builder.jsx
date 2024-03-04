import React from 'react';
import ReactDOM from 'react-dom';
import hootbus from 'utils/hootbus';
import AppBase from 'core/app-base';
import SidePanel from 'hs-app-side-panel/lib/components/side-panel/side-panel';
import StreamBuilderFixtures from 'hs-app-side-panel/lib/fixtures/stream-builder-fixture';
import StreamBuilderActions from 'hs-app-side-panel/lib/actions/stream-builder-actions';
import StreamBuilderStore from 'hs-app-side-panel/lib/stores/stream-builder-store';
import FluxComponent from 'hs-nest/lib/components/flux-component';
import streamsFlux from 'hs-app-streams/lib/stores/flux';
import domUtils from 'hs-nest/lib/utils/dom-utils';
import trackerDatalab from 'utils/tracker-datalab';

var WalkthroughAppBase = AppBase.extend({
    name: 'streamBuilder',
    messageEvents: {
        'stream:builder:close': 'destroy',
        'reload:streams': 'reloadStreams'
    },
    container: null,

    /**
     * Initialize App.
     * @param options
     */
    onInitialize: function (options) {
        options = options || {};

        this.actions = streamsFlux.createActions('sidePanel', StreamBuilderActions);
        streamsFlux.createStore('streamBuilder', StreamBuilderStore, streamsFlux);

        this.setStoreData(options);
        this.container = document.createElement('div');
        this.container.style.zIndex = domUtils.provisionIndex();
        this.container.style.position = 'fixed';
        document.body.appendChild(this.container);

        ReactDOM.render(
            <FluxComponent
                connectToStores={{
                    streamBuilder: store=>({
                        currentStepName: store.getCurrentStepName(),
                        currentStepTitle: store.getCurrentStepTitle(),
                        nextStepName: store.getNextStepName(),
                        currentProgressIdx: store.getCurrentProgressIdx(),
                        data: store.getData(),
                        origin: store.getOrigin(),
                        flow: store.getFlow(),
                        panelState: store.getPanelState(),
                        stepCount: store.getStepCount()
                    })
                }}
                flux={streamsFlux}>
                <SidePanel
                    onCloseComplete={this.destroy.bind(this)}
                    steps={StreamBuilderFixtures}
                    trackEvent={trackerDatalab.trackCustom.bind(trackerDatalab)}
                />
            </FluxComponent>,
        this.container);
    },

    setStoreData: function (options) {
        options.data = options.data || {};

        if (options.currentStepName) {
            this.actions.setCurrentStepName(options.currentStepName);
        }

        if (options.stepCount) {
            this.actions.setStepCount(options.stepCount);
        }

        if (!options.data.socialNetworks) {
            options.data.socialNetworks = hs.socialNetworks;
        }

        if (!options.data.tabId) {
            options.data.tabId = hs.currentTabId;
            options.data.tabName = $('#tab' + hs.currentTabId).find('._text').text();
        }

        this.actions.setData(options.data);

        var origin = options.origin || 'web.dashboard.slide_out_panel';
        this.actions.setOrigin(origin);

        if (options.flow) {
            this.actions.setFlow(options.flow);
        }
    },

    reloadStreams: function (tabId, callback) {
        window.loadStreams(tabId, callback);
    },

    destroy: function () {
        AppBase.prototype.destroy.call(this);
        ReactDOM.unmountComponentAtNode(this.container);
        this.container.parentNode.removeChild(this.container);
        hootbus.emit('notify:overlay:closed', 'wizard', this.name);

        streamsFlux.removeStore('streamBuilder');
        streamsFlux.removeActions('sidePanel');

        hootbus.emit('streams:onboarding:complete');
    }

});

export default WalkthroughAppBase;
