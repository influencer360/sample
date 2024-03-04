/** @module components/tag-permission-wrapper/tag-permission-wrapper */
'use strict';
// Script Dependencies
var React = require('react');
const PropTypes = require('prop-types');
// Styles Dependencies
// Component Dependencies
var FluxComponent = require('hs-nest/lib/components/flux-component');
var FluxApp = require('../app-flux');
var TagManager = require('../tag-manager/tag-manager');
const { TAGS } = require('../../actions/types');
class TagPermissionWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.flux = new FluxApp();
        this.tagsActions = this.flux.getActions(TAGS);
    }
    UNSAFE_componentWillMount() {
        this.tagsActions.manageTagsForOrg(this.props.id);
    }
    render() {
        return (React.createElement("div", { className: 'tag-permission-wrapper' },
            React.createElement(FluxComponent, { connectToStores: {
                    tags: store => ({
                        awaitingCanLoadTagManager: store.getState().awaitingCanLoadTagManager,
                        canLoadTagManager: store.getState().canLoadTagManager
                    })
                }, flux: this.flux },
                React.createElement(TagManager, { id: this.props.id }))));
    }
}
TagPermissionWrapper.propTypes = {
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};
TagPermissionWrapper.displayName = 'TagPermissionWrapper';
module.exports = TagPermissionWrapper;
