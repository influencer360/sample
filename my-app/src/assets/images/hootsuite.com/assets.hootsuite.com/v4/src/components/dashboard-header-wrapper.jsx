import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { Header } from 'fe-pnc-comp-header'
import hootbus from 'hs-nest/lib/utils/hootbus';

const toBoolean = strVal => strVal === '1';

export const mount = (id, Component, props) => {
    if (document.body.querySelector(`#${id}`) === null) {
        const appCore = document.body.querySelector('.appCore');
        const banners = document.body.querySelector('.appCore ._banners');
        const headerNode = document.createElement('div');
        headerNode.id = id;

        appCore.insertBefore(headerNode, banners.nextSibling);

        const unmount = function () {
            const header = document.body.querySelector(`#${id}`);
            if (header) {
                ReactDOM.unmountComponentAtNode(header);
                appCore.removeChild(header);
            }
        };

        const componentProps = Object.assign({unmount}, props);

        // AMP-3146 To hide composer in the top header for the legacy UI
        const globalNavigationNode = document.body.querySelector('#globalNavigation');
        componentProps.canAccessComposer = toBoolean(globalNavigationNode.dataset.canAccessComposer);

        ReactDOM.render(<Component {...componentProps} />, headerNode);
    }
};

export class DashboardHeaderWrapper extends React.PureComponent {
    constructor(props) {
        super(props);

        this.handleAddressChange = this.handleAddressChange.bind(this);
    }

    componentDidMount() {
        hootbus.on('address:path:change', this.handleAddressChange);
        hootbus.on('toggleCoreViews:primary', this.handleAddressChange);
        hootbus.on('toggleCoreViews:secondary', this.handleAddressChange);
    }

    componentWillUnmount() {
        hootbus.off('address:path:change', this.handleAddressChange);
        hootbus.off('toggleCoreViews:primary', this.handleAddressChange);
        hootbus.off('toggleCoreViews:secondary', this.handleAddressChange);
    }

    handleAddressChange () {
        const { sections, unmount } = this.props;

        const path = window.location.href.split('#').slice(-1)[0];
        const route = path.split('?')[0];
        const newSection = route.split('/')[1];

        if (!sections.some(section => section === newSection)) {
            unmount()
        }
    }

    render() {
        return (<Header {...this.props}/>)
    }
}

DashboardHeaderWrapper.propTypes = {
    // These are the sections that the header will remain open on. If a new section is navigated to not in this array the header will unmount.
    // This is done because some sections are spread over multiple urls.
    // For example Publisher is spread over /planner, /publisher, and /promote
    sections: PropTypes.arrayOf(PropTypes.string).isRequired,
    unmount: PropTypes.func.isRequired
};
