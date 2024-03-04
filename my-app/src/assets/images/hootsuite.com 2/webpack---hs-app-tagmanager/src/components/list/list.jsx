/** @module components/list/list */
'use strict';
// Styles Dependencies
require('./list.less');
// Script Dependencies
var React = require('react');
const PropTypes = require('prop-types');
var SlideOutPanel = require('hs-nest/lib/components/slide-out-panel/slide-out-panel');
var Throbber = require('hs-nest/lib/components/shared/throbbing-loader');
var ListHeader = require('./list-header/list-header');
var ListSearch = require('./list-search/list-search');
var TagListItem = require('./list-item/list-item');
var EmptyState = require('../empty-state/empty-state');
var _ = require('underscore');
var translation = require('hs-nest/lib/utils/translation');
const { TAGS, SIDE_PANEL_TAG_MANAGER } = require('../../actions/types');
const TAG_LIST_ARIA_DESCRIPTION_ID = 'tag-list-aria-description';
const TAG_LIST_A11Y_ALERT_ID = 'tag-list-a11y-alert';
//Renamed to TagList to match rc-TagList css class, rc-List is already used in hs-nest
class TagList extends React.Component {
    constructor(props) {
        super(props);
        this.tagActions = this.props.flux.getActions(TAGS);
        this.sidePanelActions = this.props.flux.getActions(SIDE_PANEL_TAG_MANAGER);
        this.handleTagListItemOnClick = this.handleTagListItemOnClick.bind(this);
        this.handleTagListItemOnChecked = this.handleTagListItemOnChecked.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleAutoSearch = this.handleAutoSearch.bind(this);
        this.handleButtonSearch = this.handleButtonSearch.bind(this);
        this.handleClearSearch = this.handleClearSearch.bind(this);
        this.getAriaDescribedByText = this.getAriaDescribedByText.bind(this);
        this.getA11yAlertText = this.getA11yAlertText.bind(this);
    }
    handleScroll() {
        var container = document.querySelector('.tag-manager');
        if (!this.props.isLoading && !this.props.noMoreTags) {
            if (container.scrollTop >= (container.scrollHeight - container.offsetHeight)) {
                this.tagActions.fetchTagsForOrgLazy(this.props.orgid, false, this.props.pageNumber, null, null);
                this.tagActions.setIsLazyLoading(true);
                this.pageNumber++;
            }
        }
    }
    handleAutoSearch(value) {
        this.tagActions.setSearchFilter(value);
        //the code below should be controlled by darklaunch for auto searching
        if (value.length > 0) {
            this.tagActions.setIsSearching();
        }
        else {
            //if we auto search for an empty string, treat that as if we're going back to defaults
            this.tagActions.clearIsSearching();
        }
        //this part should be darklaunched
        this.tagActions.fetchTagsForOrg(this.props.orgid, this.props.isArchivedFilter.value, '', this.props.sort.sortBy, this.props.sort.sortDirection, value);
    }
    handleButtonSearch() {
        if (this.props.searchFilter.length > 0) {
            this.tagActions.setIsSearching();
            this.tagActions.fetchTagsForOrg(this.props.orgid, this.props.isArchivedFilter.value, '', this.props.sort.sortBy, this.props.sort.sortDirection, this.props.searchFilter);
        }
    }
    handleClearSearch() {
        this.tagActions.clearIsSearching();
        //we also want to reload the tag manager
        this.tagActions.fetchTagsForOrg(this.props.orgid, this.props.isArchivedFilter.value, '', this.props.sort.sortBy, this.props.sort.sortDirection, '');
    }
    componentDidMount() {
        if (document.querySelector('.tag-manager')) {
            document.querySelector('.tag-manager').addEventListener('scroll', this.handleScroll);
        }
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.handScroll);
    }
    handleTagListItemOnClick(item, index) {
        if (this.props.batchedTags.length > 0) {
            this.sidePanelActions.setPanelState(SlideOutPanel.constants.CLOSING);
        }
        else {
            this.tagActions.fetchTagHistory(item.id);
            this.tagActions.setSelectedTagIndex(index);
            this.tagActions.setSingleTagFormData(this.props.tags[index]);
            this.sidePanelActions.setPanelState(SlideOutPanel.constants.OPENING);
        }
    }
    handleTagListItemOnChecked(id) {
        this.tagActions.addTagToBatched(id);
        this.tagActions.setSelectedTagIndex(null);
        if (this.props.batchedTags.length > 0) {
            this.sidePanelActions.setPanelState(SlideOutPanel.constants.CLOSING);
        }
    }
    getAriaDescribedByText() {
        if (this.props.isSearching && this.props.tags.length === 0 && !this.props.isLoading) {
            return translation._('There are no tags to query or select. Create a tag to begin.');
        }
        else if (this.props.tags.length === 1) {
            return translation._('There is only 1 tag option to select.');
        }
        else {
            // L10N: %1$s is the number of available tags before starting the search
            return translation._('There are %1$s tags. Start typing to filter the results.').replace('%1$s', this.props.tags.length);
        }
    }
    getA11yAlertText() {
        if (this.props.isSearching && this.props.tags.length === 0 && !this.props.isLoading) {
            return translation._('There are no tag results for this query.');
        }
        else if (this.props.tags === 1) {
            return translation._('There is 1 tag result for this query.');
        }
        else {
            // L10N: %1$s is the number of available tags for the given query
            return translation._('There are %1$s tag results for this query.').replace('%1$s', this.props.tags.length);
        }
    }
    renderTagListItems() {
        return this.props.tags.map((item, index) => {
            return (React.createElement("div", { key: item.id },
                React.createElement(TagListItem, { ...item, index: index, isBulkMode: this.props.batchedTags.length >= 1, isChecked: _.contains(this.props.batchedTags, item.id), isSelected: index === this.props.selectedTagIndex, onChecked: this.handleTagListItemOnChecked, onClick: this.handleTagListItemOnClick.bind(this, item, index) })));
        });
    }
    renderEmptySearchResultState() {
        if (this.props.isSearching && this.props.tags.length === 0 && !this.props.isLoading) {
            const a11yAlertText = this.getA11yAlertText();
            return (React.createElement("div", { className: 'empty-search-result-container' },
                React.createElement("div", { id: TAG_LIST_A11Y_ALERT_ID, role: "alert" }, a11yAlertText),
                React.createElement("div", { className: 'title' }, translation._('No results found')),
                React.createElement("div", { className: 'text' }, translation._("Try adjusting your search filters to find what you're looking for"))));
        }
        return null;
    }
    renderEmptyState() {
        return (React.createElement(EmptyState, { flux: this.props.flux }));
    }
    renderLazyLoadingState() {
        if (this.props.isLazyLoading) {
            return (React.createElement("div", { className: 'loading-container' },
                React.createElement(Throbber, null)));
        }
        return null;
    }
    renderPopulatedState() {
        if (this.props.tags.length) {
            const a11yAlertText = this.getA11yAlertText();
            return (React.createElement("div", null,
                React.createElement("div", { id: TAG_LIST_A11Y_ALERT_ID, role: "alert" }, a11yAlertText),
                this.renderTagListItems()));
        }
        return null;
    }
    render() {
        if (!this.props.isLoading && !this.props.tags.length && this.props.isArchivedFilter.value !== true && this.props.isSearching !== true) {
            return (React.createElement("div", null, this.renderEmptyState()));
        }
        let ariaDescribedByText = this.getAriaDescribedByText();
        return (React.createElement("div", { className: 'rc-TagList' },
            React.createElement(ListHeader, { batchSelectAll: this.tagActions.batchSelectAll, batchedTags: this.props.batchedTags, closeNotification: this.tagActions.closeNotification, createMultiTagModalOpen: this.props.createMultiTagModalOpen, createSingleTagModalOpen: this.props.createSingleTagModalOpen, deleteTagConfirmationModalOpen: this.props.deleteTagConfirmationModalOpen, notification: this.props.notification, panelState: this.props.panelState, title: this.props.isArchivedFilter.label }),
            React.createElement("div", { className: 'list-search-container' },
                React.createElement("div", { id: TAG_LIST_ARIA_DESCRIPTION_ID }, ariaDescribedByText),
                React.createElement(ListSearch, { ariaDescribedById: TAG_LIST_ARIA_DESCRIPTION_ID, isLoading: this.props.isLoading, isSearching: this.props.isSearching, onChange: this.handleAutoSearch, onClear: this.handleClearSearch, onSubmit: this.handleButtonSearch, searchFilter: this.props.searchFilter })),
            React.createElement("div", { className: 'list-container' },
                this.renderEmptySearchResultState(),
                this.renderPopulatedState(),
                this.renderLazyLoadingState())));
    }
}
TagList.displayName = 'TagList';
TagList.propTypes = {
    batchedTags: PropTypes.array,
    createMultiTagModalOpen: PropTypes.bool,
    createSingleTagModalOpen: PropTypes.bool,
    deleteTagConfirmationModalOpen: PropTypes.bool,
    flux: PropTypes.object,
    isArchivedFilter: PropTypes.object,
    isLazyLoading: PropTypes.bool,
    isLoading: PropTypes.bool,
    isSearching: PropTypes.bool,
    noMoreTags: PropTypes.bool,
    notification: PropTypes.object,
    orgid: PropTypes.number,
    pageNumber: PropTypes.number,
    panelState: PropTypes.string,
    searchFilter: PropTypes.string,
    selectedTagIndex: PropTypes.number,
    sort: PropTypes.object,
    tags: PropTypes.array
};
TagList.defaultProps = {
    batchedTags: [],
    isLazyLoading: true,
    notification: {}
};
module.exports = TagList;
