import React from 'react';
import ReactDOM from 'react-dom';
import DashboardCoreViews from './components/core-views';

export default function () {
    ReactDOM.render(React.createElement(DashboardCoreViews, {}), document.getElementById('dashboard'));
    // this function should only be called once
    return function () {};
}
