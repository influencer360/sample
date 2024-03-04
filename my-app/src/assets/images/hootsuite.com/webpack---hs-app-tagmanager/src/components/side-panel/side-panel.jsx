/** @module components/side-panel/side-panel */
'use strict';
var React = require('react');
const PropTypes = require('prop-types');
var SlideOutPanel = require('hs-nest/lib/components/slide-out-panel/slide-out-panel');
var Shroud = require('hs-nest/lib/components/shared/shroud');
var notificationTypes = require('../../constants/notificationTypes');
var TagDetailsPane = require('./panels/tag-details');
var hootbus = require('hs-nest/lib/utils/hootbus');
var translation = require('hs-nest/lib/utils/translation');
var darklaunch = require('hs-nest/lib/utils/darklaunch');
const { Section, Header, SidebarStateless } = require('fe-comp-sidebar');
var _ = require('underscore');
var { bool, object, number, func, string, array } = PropTypes;
require('./side-panel.less');
const { TAGS, SIDE_PANEL_TAG_MANAGER } = require('../../actions/types');
class SidePanel extends React.Component {
    constructor(props) {
        super(props);
        this.tagActions = this.props.flux.getActions(TAGS);
        this.sidePanelActions = this.props.flux.getActions(SIDE_PANEL_TAG_MANAGER);
        this.closePanel = this.closePanel.bind(this);
        this.renderTagDetailsPane = this.renderTagDetailsPane.bind(this);
        this.renderSidePanel = this.renderSidePanel.bind(this);
        this._onKeyDownPressed = this._onKeyDownPressed.bind(this);
    }
    componentDidUpdate(prevProps) {
        const className = darklaunch.isFeatureEnabled('PUB_26521_RENOVATE_SIDEBAR') ? '.rc-RevampedSidePanel' : '.rc-SidePanel';
        const el = document.querySelector(className);
        if (prevProps.panelState === SlideOutPanel.constants.CLOSING &&
            this.props.panelState === SlideOutPanel.constants.OPENING) {
            el.addEventListener('keydown', this._onKeyDownPressed);
        }
        else if (prevProps.panelState === SlideOutPanel.constants.OPENING &&
            this.props.panelState === SlideOutPanel.constants.CLOSING) {
            el.removeEventListener('keydown', this._onKeyDownPressed);
        }
    }
    _onKeyDownPressed(event) {
        switch (event.key) {
            case 'Escape': {
                this.closePanel();
                break;
            }
            case 'Tab': {
                event.preventDefault();
                const className = darklaunch.isFeatureEnabled('PUB_26521_RENOVATE_SIDEBAR') ? '.rc-RevampedSidePanel' : '.rc-SidePanel';
                const isAscending = event.shiftKey;
                const elements = document.querySelectorAll(`${className} *[tabindex]`);
                const arrayElements = Array.from(elements);
                const activeElement = document.activeElement;
                const currentIndex = arrayElements.indexOf(activeElement);
                let nextIndex = isAscending ? currentIndex - 1 : currentIndex + 1;
                if (nextIndex === arrayElements.length) {
                    nextIndex = 0;
                }
                if (nextIndex === -1) {
                    nextIndex = arrayElements.length - 1;
                }
                arrayElements[nextIndex].focus();
                break;
            }
        }
    }
    onClickShroud() {
        if (this.props.closeOnShroudClick) {
            this.closePanel();
        }
    }
    closePanel() {
        hootbus.emit('Datalab:trackEvent', {
            origin: 'web.dashboard.tag_manager.tag_details',
            action: 'tag_details_closed'
        });
        const { id } = this.props.tags[this.props.selectedTagIndex];
        this.sidePanelActions.setPanelState(SlideOutPanel.constants.CLOSING);
        this.tagActions.setSelectedTagIndex(null);
        _.isFunction(this.props.onClose) && this.props.onClose();
        document.querySelector(`[data-tag-id="${id}"]`).focus();
    }
    renderTagDetailsPane() {
        return ({
            node: (React.createElement(TagDetailsPane, { closeSidePanel: this.closePanel, createdInfo: this.props.createdInfo, data: this.props.tags[this.props.selectedTagIndex], errorField: this.props.notification.type === notificationTypes.ERROR ? this.props.notification.forField : '', flux: this.props.flux, instructions: this.props.notification.type === notificationTypes.ERROR ? this.props.notification.message : '', modifiedInfo: this.props.modifiedInfo, singleTagFormData: this.props.singleTagFormData })),
            width: 400,
            hasNoFadeIn: true,
            displayName: 'tagDetails'
        });
    }
    renderShroud() {
        if (this.props.hasShroud) {
            return (React.createElement(Shroud, { fadeDuration: 250, fadeToOpacity: this.props.panelState === SlideOutPanel.constants.CLOSING ? 0 : 0.75, onClickShroud: this.onClickShroud.bind(this) }));
        }
        return null;
    }
    renderOldSidePanel() {
        // Should not be rendered in order to avoid conflicts with other tab-indexed elements
        if (this.props.panelState !== SlideOutPanel.constants.OPENING) {
            return null;
        }
        return (React.createElement(SlideOutPanel, { animationDuration: 500, onClose: this.closePanel, onOpenDelay: 400, panelContent: [this.renderTagDetailsPane()], panelState: this.props.panelState, title: React.createElement("span", { tabIndex: "0" }, translation._('Details')) }));
    }
    renderSidePanel() {
        const isPanelStateOpen = () => this.props.panelState === SlideOutPanel.constants.OPENING;
        // sidebar component collapses but we intend to fully hide it yet preserving the closing animation
        const closingWorkaround = { visibility: "hidden", transition: "visibility 80ms ease-in" };
        return (React.createElement("div", { className: "-right", style: !isPanelStateOpen() ? closingWorkaround : {} },
            React.createElement(SidebarStateless, { isOpen: isPanelStateOpen(), className: '-navigationBarRight', onToggle: () => {
                    if (isPanelStateOpen())
                        this.closePanel();
                    else
                        this.sidePanelActions.setPanelState(SlideOutPanel.constants.OPENING);
                }, width: '400px' },
                React.createElement(Header, null,
                    React.createElement("h3", { className: "header", tabIndex: "0" }, translation._('Details'))),
                React.createElement(Section, null, this.renderTagDetailsPane().node))));
    }
    render() {
        return (darklaunch.isFeatureEnabled('PUB_26521_RENOVATE_SIDEBAR')) ? (React.createElement("div", { className: 'rc-RevampedSidePanel' }, this.renderSidePanel())) : (React.createElement("div", { className: 'rc-SidePanel' },
            this.renderShroud(),
            this.renderOldSidePanel()));
    }
}
SidePanel.displayName = 'SidePanel';
SidePanel.propTypes = {
    className: string,
    closeOnShroudClick: bool,
    createdInfo: string,
    errorField: string,
    flux: object,
    hasShroud: bool,
    modifiedInfo: string,
    notification: object,
    onClose: func,
    panelState: string,
    selectedTagIndex: number,
    singleTagFormData: object,
    tags: array,
    trackEvent: func
};
SidePanel.defaultProps = {
    tags: [],
    selectedTagIndex: null
};
module.exports = SidePanel;
