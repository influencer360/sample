/** @preventMunge */
"use strict";

import React from 'react';
import FluxComponent from 'hs-nest/lib/components/flux-component';
import PrimaryView from './primary-view.jsx';
import SecondaryView from './secondary-view.jsx';
import hootbus from 'utils/hootbus';
import fluxApp from 'hs-nest/lib/stores/flux';

var defaultPrimaryState = {
    isPrimaryView: true,
    content: '',
    params: null
};
class DashboardCoreViews extends React.Component {
    constructor(props) {
        super(props);
        this.state = defaultPrimaryState;
    }
    componentDidMount() {
        hootbus.on('toggleCoreViews:primary', this.toggleToPrimaryView.bind(this));
        hootbus.on('toggleCoreViews:secondary', this.toggleToSecondaryView.bind(this));
    }
    componentWillUnmount() {
        hootbus.removeListener('toggleCoreViews:primary', this.toggleToPrimaryView.bind(this));
        hootbus.removeListener('toggleCoreViews:secondary', this.toggleToSecondaryView.bind(this));
    }
    componentDidUpdate() {
        hootbus.emit('coreViews:changed', {isPrimaryView: this.state.isPrimaryView});
    }
    toggleToPrimaryView({ content = '', params = null }) {
        this.state && this.setState({
            content,
            params,
            isPrimaryView: true
        });
    }
    toggleToSecondaryView({ content = '', params = null }) {
        this.state && this.setState({
            content,
            params,
            isPrimaryView: false
        });
    }
    render() {
        const {
            content,
            params,
            isPrimaryView
        } = this.state;

        return (
            <FluxComponent flux={fluxApp}>
                <PrimaryView show={isPrimaryView} content={isPrimaryView ? content : null} params={params} />
                <SecondaryView show={!isPrimaryView} content={isPrimaryView ? null : content} params={params} />
            </FluxComponent>
        );
    }
}

export default DashboardCoreViews;
