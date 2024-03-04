/** @module components/header/header */
'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Styles Dependencies
require('./header.less');
/* fe-global */
const icon_base_1 = __importDefault(require("@fp-icons/icon-base"));
const symbol_x_light_1 = __importDefault(require("@fp-icons/symbol-x-light"));
const arrow_left_1 = __importDefault(require("@fp-icons/arrow-left"));
const fe_comp_button_1 = require("fe-comp-button");
// Script Dependencies
var React = require('react');
const PropTypes = require('prop-types');
var classNames = require('classnames');
var hootbus = require('hs-nest/lib/utils/hootbus');
var SlideOutPanel = require('hs-nest/lib/components/slide-out-panel/slide-out-panel');
var translation = require('hs-nest/lib/utils/translation');
const { SIDE_PANEL_TAG_MANAGER, TAGS } = require('../../actions/types');
const header_dropdown_1 = __importDefault(require("./header-dropdown"));
const header_style_1 = require("./header-style");
const ACTIVE_FILTER = 'active';
const ARCHIVED_FILTER = 'archived';
const ALL_FILTER = 'all';
const NAME_ASC_ORDER = 'nameAsc';
const NAME_DESC_ORDER = 'nameDesc';
const MODIFIED_DATE_DESC = 'modifiedDateDesc';
const MODIFIED_DATE_ASC = 'modifiedDateAsc';
//Renamed to TagHeader to match rc-TagHeader css class, rc-Header is already used in hs-nest
class TagHeader extends React.Component {
    constructor(props) {
        super(props);
        this.renderMenuRight = this.renderMenuRight.bind(this);
        this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
        this.handleClearBatchOnClick = this.handleClearBatchOnClick.bind(this);
        this.handleOpenSingleModalClick = this.handleOpenSingleModalClick.bind(this);
        this.renderLeftNavButton = this.renderLeftNavButton.bind(this);
        this.renderBatchArchiveButton = this.renderBatchArchiveButton.bind(this);
        this.renderBatchRestoreButton = this.renderBatchRestoreButton.bind(this);
        this.handleBatchArchiveOnClick = this.handleBatchArchiveOnClick.bind(this);
        this.handleBatchRestoreOnClick = this.handleBatchRestoreOnClick.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handleFilter = this.handleFilter.bind(this);
        this.tagActions = this.props.flux.getActions(TAGS);
        this.sidePanelActions = this.props.flux.getActions(SIDE_PANEL_TAG_MANAGER);
    }
    renderLeftNavButton() {
        if (this.props.batchedTags.length >= 1) {
            return (React.createElement("button", { "aria-label": translation._('Deselect all tags'), className: 'primary-btn pull-left', onClick: this.handleClearBatchOnClick },
                React.createElement(icon_base_1.default, { fill: '#949a9b', glyph: symbol_x_light_1.default, size: 18 })));
        }
        return (React.createElement("button", { "aria-label": translation._('Close Tag Manager'), className: 'primary-btn pull-left', onClick: this.handleBackButtonClick },
            React.createElement(icon_base_1.default, { fill: '#949a9b', glyph: arrow_left_1.default, size: 18 })));
    }
    handleBackButtonClick() {
        hootbus.emit('Datalab:trackEvent', {
            origin: 'web.dashboard.tag_manager.header',
            action: 'exit_tag_manager'
        });
        if (this.props.onBackClick) {
            this.props.onBackClick();
        }
        else {
            window.location.hash = '#/member';
        }
    }
    handleClearBatchOnClick() {
        this.tagActions.clearBatchSelect();
    }
    handleOpenSingleModalClick() {
        this.sidePanelActions.setPanelState(SlideOutPanel.constants.CLOSING);
        this.tagActions.setSelectedTagIndex(null);
        this.tagActions.openCreateSingleTagModal();
    }
    handleBatchArchiveOnClick() {
        this.tagActions.batchArchiveTags(this.props.batchedTags);
    }
    handleBatchRestoreOnClick() {
        this.tagActions.batchRestoreTags(this.props.batchedTags);
    }
    renderBatchArchiveButton() {
        return (React.createElement(fe_comp_button_1.Button, { type: fe_comp_button_1.SECONDARY, className: 'batch-archive', onClick: this.handleBatchArchiveOnClick, trackingAction: 'bulk_archive_tags', trackingOrigin: 'web.dashboard.tag_manager.header' }, translation._('Archive Selected')));
    }
    renderBatchRestoreButton() {
        return (React.createElement(fe_comp_button_1.Button, { type: fe_comp_button_1.SECONDARY, className: 'batch-restore', onClick: this.handleBatchRestoreOnClick, trackingAction: 'bulk_restore_tags', trackingOrigin: 'web.dashboard.tag_manager.header' }, translation._('Restore Selected')));
    }
    handleFilter({ text, value }) {
        this.sidePanelActions.setPanelState(SlideOutPanel.constants.CLOSING);
        switch (value) {
            case ACTIVE_FILTER: {
                this.tagActions.fetchTagsForOrg(this.props.id, false, '', null, null, this.props.searchFilter);
                this.tagActions.setIsArchivedFilter(text, false);
                break;
            }
            case ARCHIVED_FILTER: {
                this.tagActions.fetchTagsForOrg(this.props.id, true, '', null, null, this.props.searchFilter);
                this.tagActions.setIsArchivedFilter(text, true);
                break;
            }
            case ALL_FILTER: {
                this.tagActions.fetchTagsForOrg(this.props.id, '', '', null, null, this.props.searchFilter);
                this.tagActions.setIsArchivedFilter(text, '');
                break;
            }
        }
    }
    handleSort({ text, value }) {
        this.sidePanelActions.setPanelState(SlideOutPanel.constants.CLOSING);
        switch (value) {
            case NAME_ASC_ORDER: {
                this.tagActions.fetchTagsForOrg(this.props.id, this.props.isArchivedFilter.value, '', 'name', 'asc', this.props.searchFilter);
                this.tagActions.setSort(text, 'name', 'asc');
                break;
            }
            case NAME_DESC_ORDER: {
                this.tagActions.fetchTagsForOrg(this.props.id, this.props.isArchivedFilter.value, '', 'name', 'desc', this.props.searchFilter);
                this.tagActions.setSort(text, 'name', 'desc');
                break;
            }
            case MODIFIED_DATE_DESC: {
                this.tagActions.fetchTagsForOrg(this.props.id, this.props.isArchivedFilter.value, '', 'modifiedDate', 'desc', this.props.searchFilter);
                this.tagActions.setSort(text, 'modifiedDate', 'desc');
                break;
            }
            case MODIFIED_DATE_ASC: {
                this.tagActions.fetchTagsForOrg(this.props.id, this.props.isArchivedFilter.value, '', 'modifiedDate', 'asc', this.props.searchFilter);
                this.tagActions.setSort(text, 'modifiedDate', 'asc');
                break;
            }
        }
    }
    renderMenuRight() {
        if (this.props.batchedTags.length >= 1) {
            if (this.props.isArchivedFilter.value === false) {
                return (React.createElement("div", null, this.renderBatchArchiveButton()));
            }
            if (this.props.isArchivedFilter.value === true) {
                return (React.createElement("div", null, this.renderBatchRestoreButton()));
            }
            return null;
        }
        const filterOptions = [
            { text: translation._('Active Tags'), value: ACTIVE_FILTER },
            { text: translation._('Archived Tags'), value: ARCHIVED_FILTER },
            { text: translation._('All Tags'), value: ALL_FILTER },
        ];
        const sortOptions = [
            { text: translation._('Tag Name: A-Z'), value: NAME_ASC_ORDER },
            { text: translation._('Tag Name: Z-A'), value: NAME_DESC_ORDER },
            { text: translation._('Date Modified: Newest'), value: MODIFIED_DATE_DESC },
            { text: translation._('Date Modified: Oldest'), value: MODIFIED_DATE_ASC }
        ];
        return (React.createElement(React.Fragment, null,
            React.createElement(header_dropdown_1.default, { label: filterOptions.find(option => option.text === this.props.isArchivedFilter.label)?.value, options: filterOptions, handleSelect: this.handleFilter }),
            React.createElement(header_dropdown_1.default, { label: sortOptions.find(option => option.text === this.props.sort.label)?.value, options: sortOptions, handleSelect: this.handleSort }),
            React.createElement(fe_comp_button_1.Button, { type: fe_comp_button_1.CTA, className: 'create-tag', onClick: this.handleOpenSingleModalClick, trackingAction: 'open_create_modal', trackingOrigin: 'web.dashboard.tag_manager.header' }, translation._('Create New Tag'))));
    }
    renderHeaderText() {
        if (this.props.batchedTags.length >= 1) {
            return (React.createElement("span", null,
                React.createElement("h1", null, translation._('%s Tags Selected').replace('%s', this.props.batchedTags.length.toString()))));
        }
        return (React.createElement("span", null,
            React.createElement("h1", null, translation._('Manage Tags')),
            React.createElement("h2", null, this.props.orgName)));
    }
    render() {
        var headerClasses = {
            'bulk-selected': this.props.batchedTags.length >= 1
        };
        return (React.createElement(header_style_1.TagHeaderContainer, { className: classNames('rc-TagHeader', headerClasses) },
            React.createElement("div", { className: 'header-left' },
                this.renderLeftNavButton(),
                this.renderHeaderText()),
            React.createElement(header_style_1.HeaderRightContainer, null, this.renderMenuRight())));
    }
}
TagHeader.displayName = 'TagHeader';
TagHeader.propTypes = {
    batchedTags: PropTypes.array,
    flux: PropTypes.object,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    isArchivedFilter: PropTypes.object,
    onBackClick: PropTypes.func,
    orgName: PropTypes.string,
    searchFilter: PropTypes.string,
    sort: PropTypes.object
};
TagHeader.defaultProps = {
    onBackClick: null
};
module.exports = TagHeader;
