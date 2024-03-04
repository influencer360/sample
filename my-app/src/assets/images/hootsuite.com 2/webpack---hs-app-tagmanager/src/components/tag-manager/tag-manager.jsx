/** @module components/tag-manager/tag-manager */
'use strict';
// Script Dependencies
var React = require('react');
const PropTypes = require('prop-types');
var ClassNames = require('classnames');
// Styles Dependencies
require('./tag-manager.less');
// Component Dependencies
var DeleteModal = require('../delete-modal/delete-modal');
var FluxComponent = require('hs-nest/lib/components/flux-component');
var TagHeader = require('../header/header');
var TagList = require('../list/list');
var translation = require('hs-nest/lib/utils/translation');
var SidePanel = require('../side-panel/side-panel');
var SingleModal = require('../single-modal/single-modal');
var MultiModal = require('../multi-modal/multi-modal');
var ErrorModal = require('../error-modal/error-modal');
const { TAGS, TAG_HEADER } = require('../../actions/types');
class TagManager extends React.Component {
    constructor(props) {
        super(props);
        this.tagsActions = this.props.flux.getActions(TAGS);
        this.headerActions = this.props.flux.getActions(TAG_HEADER);
    }
    UNSAFE_componentWillMount() {
        this.tagsActions.fetchTagsForOrg(this.props.id, false, 1, null, null);
        this.headerActions.fetchOrgName(this.props.id);
    }
    componentDidUpdate() {
        if (!this.props.canLoadTagManager && !this.props.awaitingCanLoadTagManager) {
            this.permissionRedirect();
        }
    }
    componentDidMount() {
        document.title = `Hootsuite — ${translation._('Tags')}`;
    }
    componentWillUnmount() {
        document.title = 'Hootsuite';
    }
    permissionRedirect() {
        if (this.props.onBackClick) {
            this.props.onBackClick();
        }
        else {
            window.location.hash = '#/member';
        }
    }
    renderTagManager() {
        if (this.props.canLoadTagManager && !this.props.awaitingCanLoadTagManager) {
            return (React.createElement("div", { className: 'tag-manager' },
                React.createElement(FluxComponent, { connectToStores: {
                        tagHeader: store => ({
                            orgName: store.getOrgName()
                        }),
                        tags: store => ({
                            batchedTags: store.getState().batchedTags,
                            isArchivedFilter: store.getState().isArchivedFilter,
                            searchFilter: store.getState().searchFilter,
                            sort: store.getState().sort
                        })
                    }, flux: this.props.flux },
                    React.createElement(TagHeader, { id: this.props.id, onBackClick: this.props.onBackClick })),
                React.createElement("div", { className: 'container' },
                    React.createElement(FluxComponent, { connectToStores: {
                            tags: store => ({
                                isLoading: store.getState().isLoading,
                                isLazyLoading: store.getState().isLazyLoading,
                                tags: store.getState().tags,
                                batchedTags: store.getState().batchedTags,
                                selectedTagIndex: store.getState().selectedTagIndex,
                                notification: store.getState().notification,
                                isArchivedFilter: store.getState().isArchivedFilter,
                                orgid: this.props.id,
                                pageNumber: store.getState().pageNumber,
                                noMoreTags: store.getState().noMoreTags,
                                createSingleTagModalOpen: store.getState().createSingleTagModalOpen,
                                createMultiTagModalOpen: store.getState().createMultiTagModalOpen,
                                deleteTagConfirmationModalOpen: store.getState().deleteTagConfirmationModalOpen,
                                searchFilter: store.getState().searchFilter,
                                sort: store.getState().sort,
                                isSearching: store.getState().isSearching
                            }),
                            sidePanelTagManager: store => ({
                                panelState: store.getPanelState()
                            })
                        }, flux: this.props.flux },
                        React.createElement(TagList, null))),
                React.createElement(FluxComponent, { connectToStores: {
                        sidePanelTagManager: store => ({
                            panelState: store.getPanelState()
                        }),
                        tags: store => ({
                            tags: store.getState().tags,
                            createdInfo: store.getState().createdInfo,
                            modifiedInfo: store.getState().modifiedInfo,
                            selectedTagIndex: store.getState().selectedTagIndex,
                            singleTagFormData: store.getState().singleTagFormData,
                            notification: store.getState().notification
                        })
                    }, flux: this.props.flux },
                    React.createElement(SidePanel, null)),
                React.createElement(FluxComponent, { connectToStores: {
                        tags: store => ({
                            isSingleModalOpen: store.getState().createSingleTagModalOpen,
                            singleTagFormData: store.getState().singleTagFormData,
                            multiTagFormData: store.getState().multiTagFormData,
                            isMultiModalOpen: store.getState().createMultiTagModalOpen,
                            isErrorModalOpen: store.getState().notifyErrorModalOpen,
                            notification: store.getState().notification,
                            isDuplicateTagInFormData: store.getState().isDuplicateTagInFormData,
                            isThrobberDisplayed: store.getState().isThrobberDisplayed,
                            tagsCreated: store.getState().tagsCreated
                        })
                    }, flux: this.props.flux },
                    React.createElement(SingleModal, { id: this.props.id }),
                    React.createElement(MultiModal, { id: this.props.id }),
                    React.createElement(ErrorModal, { id: this.props.id })),
                React.createElement(FluxComponent, { connectToStores: {
                        tags: store => ({
                            tags: store.getState().tags,
                            selectedTagIndex: store.getState().selectedTagIndex,
                            isDeleteTagConfirmationModalOpen: store.getState().deleteTagConfirmationModalOpen
                        })
                    }, flux: this.props.flux },
                    React.createElement(DeleteModal, null))));
        }
        return (React.createElement("div", null));
    }
    render() {
        let classes;
        let zIndexStyle;
        if (typeof this.props.zIndex !== 'undefined') {
            classes = ClassNames({
                'rc-TagManager': true,
                'x-popout-tag-manager': true
            });
            zIndexStyle = { zIndex: this.props.zIndex };
            this.tagActions = this.props.flux.getActions(TAGS);
            this.tagActions.restartPageNumber();
        }
        else {
            classes = 'rc-TagManager';
        }
        return (React.createElement("div", { className: classes, style: zIndexStyle }, this.renderTagManager()));
    }
}
TagManager.propTypes = {
    awaitingCanLoadTagManager: PropTypes.bool,
    canLoadTagManager: PropTypes.bool,
    flux: PropTypes.object,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onBackClick: PropTypes.func,
    zIndex: PropTypes.number
};
TagManager.defaultProps = {
    awaitingCanLoadTagManager: true,
    flux: PropTypes.function,
    onBackClick: null
};
TagManager.displayName = 'TagManager';
module.exports = TagManager;
