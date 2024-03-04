/** @module components/empty-state/empty-state */
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Styles Dependencies
require('./empty-state.less');
/* fe-global */
const icon_base_1 = __importDefault(require("@fp-icons/icon-base"));
const action_tag_1 = __importDefault(require("@fp-icons/action-tag"));
// Script Dependencies
var React = require('react');
const PropTypes = require('prop-types');
var Button = require('hs-nest/lib/components/buttons/button');
var translation = require('hs-nest/lib/utils/translation');
const { TAGS } = require('../../actions/types');
class EmptyState extends React.Component {
    constructor(props) {
        super(props);
        this.tagActions = this.props.flux.getActions(TAGS);
    }
    render() {
        return (React.createElement("div", { className: 'rc-EmptyState' },
            React.createElement("div", { className: 'icon-container' },
                React.createElement(icon_base_1.default, { fill: '#949a9b', size: 80, glyph: action_tag_1.default })),
            React.createElement("strong", null, translation._("You haven't set up any tags yet!")),
            React.createElement("p", null, translation._('You can add tags to messages in Hootsuite to help you:')),
            React.createElement("ul", null,
                React.createElement("li", null,
                    "\u2022 ",
                    translation._('measure and analyze types of incoming messages')),
                React.createElement("li", null,
                    "\u2022 ",
                    translation._('track the success of your published campaigns')),
                React.createElement("li", null,
                    "\u2022 ",
                    translation._("measure your team's response times to customer enquiries"))),
            React.createElement(Button, { btnStyle: 'standard', onClick: this.tagActions.openCreateSingleTagModal, trackingAction: 'open_create_modal', trackingOrigin: 'web.dashboard.tag_manager.empty_state' }, translation._('Set Up Tags'))));
    }
}
EmptyState.displayName = 'EmptyState';
EmptyState.propTypes = {
    flux: PropTypes.object
};
EmptyState.defaultProps = {};
module.exports = EmptyState;
