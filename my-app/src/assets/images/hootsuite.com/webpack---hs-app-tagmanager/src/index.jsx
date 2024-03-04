/**
 * this file is used as an entry point to create your bundle
 * as well as register your app in dashboard
 * only expose methods in this file
 *
 *
 * DO NOT EXPORT CLASSES for react components
 * as this code will be compiled and those jsx components won't be available as jsx in dashboard
*/
'use strict';
var React = require('react');
var ReactDOM = require('react-dom');
var { register } = require('fe-lib-async-app');
var TagsStore = require('./stores/tags');
var TagsActions = require('./actions/tags');
var TagHeaderStore = require('./stores/header');
var TagHeaderActions = require('./actions/header');
var TagSidePanelStore = require('./stores/side-panel');
var TagSidePanelActions = require('./actions/side-panel');
var TagManager = require('./components/tag-manager/tag-manager');
var TagPermissionWrapper = require('./components/tag-permission-wrapper/tag-permission-wrapper');
const flux = require('./stores/flux');
const fluxActions = require('./actions/types');
var myApp = {
    mount: (node, props) => {
        ReactDOM.render(React.createElement(TagManager, { ...props }), node);
    },
    mountTagPermission: (node, props) => {
        ReactDOM.render(React.createElement(TagPermissionWrapper, { ...props }), node);
    },
    unmount: (node) => {
        ReactDOM.unmountComponentAtNode(node);
    },
    TagsStore,
    TagsActions,
    TagHeaderStore,
    TagHeaderActions,
    TagSidePanelStore,
    TagSidePanelActions,
    flux,
    fluxActions
};
register('hs-app-tagmanager', myApp);
