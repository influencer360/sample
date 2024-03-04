'use strict';
var wisdom = require('hs-nest/lib/utils/wisdom');
var objectAssign = require('object-assign');
var notifications = require('../constants/notifications');
var constants = require('../constants/constants');
var _ = require('underscore');
var cloneDeep = require('lodash.clonedeep');
var translation = require('hs-nest/lib/utils/translation');
const { TAGS } = require('../actions/types');
class TagStore extends wisdom.Store {
    constructor(flux) {
        super();
        var actions = flux.getActionIds(TAGS);
        this.registerAsync(actions.manageTagsForOrg, this._manageTagsForOrgLoading, this._manageTagsForOrg, null);
        this.registerAsync(actions.fetchTagsForOrg, this._fetchTagsForOrgLoading, this._fetchTagsForOrg, null);
        this.registerAsync(actions.fetchTagsForOrgLazy, this._fetchTagsForOrgLoading, this._fetchTagsForOrgLazy, null);
        this.registerAsync(actions.fetchTagHistory, null, this._fetchTagHistory, null);
        this.registerAsync(actions.createTag, null, this._createTag, this.createTagFailure);
        this.registerAsync(actions.batchCreateTags, null, this._batchCreateTags, this.batchCreateTagsFailure);
        this.registerAsync(actions.updateTag, null, this._updateTag, this.updateTagFailure);
        this.registerAsync(actions.archiveTag, null, this._archiveTag, null);
        this.registerAsync(actions.unarchiveTag, null, this._unarchiveTag, null);
        this.registerAsync(actions.batchArchiveTags, null, this._batchArchiveTags, null);
        this.registerAsync(actions.batchRestoreTags, null, this._batchRestoreTags, null);
        this.register(actions.deleteTag, this._deleteTag);
        this.register(actions.setSelectedTagIndex, this._setSelectedTagIndex);
        this.register(actions.setIsLazyLoading, this._setIsLazyLoading);
        this.register(actions.setSingleTagFormData, this._setSingleTagFormData);
        this.register(actions.clearSingleTagFormData, this._clearSingleTagFormData);
        this.register(actions.setNotification, this._setNotification);
        this.register(actions.closeNotification, this._closeNotification);
        this.register(actions.setMultiTagFormData, this._setMultiTagFormData);
        // modals
        this.register(actions.openCreateSingleTagModal, this._openCreateSingleTagModal);
        this.register(actions.closeCreateSingleTagModal, this._closeCreateSingleTagModal);
        this.register(actions.openCreateMultiTagModal, this._openCreateMultiTagModal);
        this.register(actions.closeCreateMultiTagModal, this._closeCreateMultiTagModal);
        this.register(actions.closeNotifyErrorModal, this._closeNotifyErrorModal);
        this.register(actions.editFailedTagsInMultiModal, this._editFailedTagsInMultiModal);
        this.register(actions.openDeleteTagConfirmationModal, this._openDeleteTagConfirmationModal);
        this.register(actions.closeDeleteTagConfirmationModal, this._closeDeleteTagConfirmationModal);
        this.register(actions.setIsArchivedFilter, this._setIsArchivedFilter);
        this.register(actions.addTagToBatched, this._addTagToBatched);
        this.register(actions.batchSelectAll, this._batchSelectAll);
        this.register(actions.clearBatchSelect, this._clearBatchSelect);
        this.register(actions.setSort, this._setSort);
        this.register(actions.setSearchFilter, this._setSearchFilter);
        this.register(actions.setIsSearching, this._setIsSearching);
        this.register(actions.clearIsSearching, this._clearIsSearching);
        this.register(actions.setIsThrobberDisplayed, this._setIsThrobberDisplayed);
        // used in New Compose and Campaigns
        this.register(actions.setTags, this._setTags);
        this.register(actions.addTag, this._addTag);
        this.register(actions.restartPageNumber, this._restartPageNumber);
        this.register(actions.setSuggestedTags, this._setSuggestedTags);
        this.register(actions.removeSuggestedTag, this._removeSuggestedTag);
        this.initialState = {
            awaitingCanLoadTagManager: true,
            notification: {
                type: '',
                message: '',
                forField: ''
            },
            isLoading: true,
            isLazyLoading: true,
            isHandlingSubmit: false,
            tags: [],
            suggestedTags: [],
            createdInfo: '',
            modifiedInfo: '',
            singleTagFormData: {
                name: '',
                description: ''
            },
            tagsCreated: 0,
            multiTagFormData: [],
            isDuplicateTagInFormData: false,
            selectedTagIndex: null,
            createSingleTagModalOpen: false,
            createMultiTagModalOpen: false,
            notifyErrorModalOpen: false,
            isArchivedFilter: {
                label: translation._('Active Tags'),
                value: false
            },
            sort: {
                label: translation._('Tag Name: A-Z'),
                sortBy: 'name',
                sortDirection: 'asc'
            },
            pageNumber: 1,
            noMoreTags: false,
            batchedTags: [],
            deleteTagConfirmationModalOpen: false,
            searchFilter: '',
            isSearching: false
        };
        this.state = objectAssign({}, this.initialState);
    }
    getState() {
        return this.state;
    }
    _setSearchFilter(data) {
        this.setState({
            searchFilter: data
        });
    }
    _setIsSearching() {
        this.setState({
            isSearching: true
        });
    }
    _clearIsSearching() {
        this.setState({
            isSearching: this.initialState.isSearching,
            searchFilter: this.initialState.searchFilter
        });
    }
    _setIsArchivedFilter(data) {
        this.setState({
            isArchivedFilter: data
        });
    }
    _setMultiTagFormData(data) {
        var isDuplicateTagInFormData = false;
        var notification = Object.create(this.initialState.notification);
        if (this._checkDuplicateTags(data)) {
            isDuplicateTagInFormData = true;
            notification.forField = notifications.FIELDS.name;
            notification.type = notifications.ERROR_MESSAGE_DUPLICATE_TAG_IN_LIST.type;
            notification.message = notifications.ERROR_MESSAGE_DUPLICATE_TAG_IN_LIST.message;
        }
        this.setState({
            multiTagFormData: data,
            notification: notification,
            isDuplicateTagInFormData: isDuplicateTagInFormData
        });
    }
    _setSingleTagFormData(data) {
        objectAssign(this.state, { singleTagFormData: data });
        this.setState({
            singleTagFormData: this.state.singleTagFormData
        });
    }
    _clearSingleTagFormData() {
        this._setSingleTagFormData(this.initialState.singleTagFormData);
    }
    _setSelectedTagIndex(index) {
        this.setState({
            selectedTagIndex: index,
            notification: this.initialState.notification
        });
    }
    _manageTagsForOrgLoading() {
        this.setState({
            awaitingCanLoadTagManager: true
        });
    }
    _manageTagsForOrg(data) {
        this.setState({
            awaitingCanLoadTagManager: false,
            canLoadTagManager: data.canManageForOrg
        });
    }
    _fetchTagsForOrgLoading() {
        this.setState({
            isLoading: true,
            notification: this.initialState.notification,
            pageNumber: this.state.pageNumber + 1
        });
    }
    _fetchTagsForOrg(data) {
        this._doFetchTagsForOrg(data, false);
    }
    _fetchTagsForOrgLazy(data) {
        this._doFetchTagsForOrg(data, true);
    }
    _doFetchTagsForOrg(data, isLazyLoading) {
        var tags;
        if (isLazyLoading) {
            tags = this.state.tags.concat(data.tags);
        }
        else {
            tags = data.tags;
        }
        // if description is null, set it to the empty string
        for (var i = 0; i < tags.length; i++) {
            if (tags[i].description === null) {
                tags[i].description = '';
            }
        }
        this.setState({
            tags: tags,
            isLoading: false,
            isLazyLoading: false,
            noMoreTags: data.tags.length < constants.TAGS_PER_PAGE
        });
    }
    _fetchTagHistory(data) {
        this.setState({
            createdInfo: data.createdDate + ' by ' + data.createdUser,
            modifiedInfo: data.modifiedDate + ' by ' + data.modifiedUser
        });
    }
    _checkDuplicateTags(formData) {
        if (!formData) {
            return false;
        }
        var isDuplicateTags = false;
        for (var i = 0; i < formData.length - 1 && !isDuplicateTags; i++) {
            var val1 = formData[i];
            for (var j = i + 1; j < formData.length; j++) {
                var val2 = formData[j];
                if (val1 === val2) {
                    isDuplicateTags = true;
                    break;
                }
            }
        }
        return isDuplicateTags;
    }
    _createTag(tag) {
        if (tag.description === null) {
            tag.description = '';
        }
        this.state.tags.push(tag);
        this.setState({
            tags: this.state.tags,
            notification: {
                type: notifications.TAG_CREATED.type,
                message: notifications.TAG_CREATED.message
            },
            createSingleTagModalOpen: false,
            isHandlingSubmit: false,
            isThrobberDisplayed: false
        });
    }
    _batchCreateTags(tags) {
        var newTagsList = this.state.tags;
        tags.success.map(function (tag) {
            if (tag.description === null) {
                tag.description = '';
            }
            newTagsList.push(tag);
        });
        if (tags.fail.length > 0) {
            var failedTags = [];
            tags.fail.map((tag) => {
                failedTags.push(tag.name);
            });
            this.setState({
                tags: newTagsList,
                multiTagFormData: failedTags,
                tagsCreated: tags.success.length,
                isThrobberDisplayed: false,
                createMultiTagModalOpen: false,
                notifyErrorModalOpen: true
            });
        }
        else {
            this.setState({
                tags: newTagsList,
                notification: {
                    type: notifications.BATCH_TAGS_CREATED.type,
                    message: tags.success.length + notifications.BATCH_TAGS_CREATED.message
                },
                createMultiTagModalOpen: false,
                tagsCreated: tags.success.length,
                multiTagFormData: this.initialState.multiTagFormData,
                isThrobberDisplayed: false
            });
        }
    }
    createTagFailure(data) {
        var notification = {};
        notification.forField = notifications.FIELDS.name;
        var response = JSON.parse(data.errorCause.responseText);
        if (response.errorCode === notifications.ERROR_CODE_TAG_NAME_ALREADY_EXISTS ||
            response.errorCode === notifications.ERROR_CODE_TAG_WITH_ID_ALREADY_EXISTS) {
            notification.type = notifications.ERROR_MESSAGE_CREATE_TAG_EXISTS.type;
            notification.message = notifications.ERROR_MESSAGE_CREATE_TAG_EXISTS.message;
        }
        else {
            notification.type = notifications.ERROR_MESSAGE_CREATE_UNKNOWN.type;
            notification.message = notifications.ERROR_MESSAGE_CREATE_UNKNOWN.message;
        }
        this.setState({
            notification: notification,
            isThrobberDisplayed: false
        });
    }
    batchCreateTagsFailure() {
        var notification = {};
        notification.forField = notifications.FIELDS.name;
        notification.type = notifications.ERROR_MESSAGE_BATCH_CREATE_UNKNOWN.type;
        notification.message = notifications.ERROR_MESSAGE_BATCH_CREATE_UNKNOWN.message;
        this.setState({
            notification: notification,
            isThrobberDisplayed: false
        });
    }
    updateTagFailure(data) {
        var notification = {};
        notification.forField = notifications.FIELDS.name;
        var response = JSON.parse(data.errorCause.responseText);
        if (response.errorCode === notifications.ERROR_CODE_TAG_NAME_ALREADY_EXISTS) {
            notification.type = notifications.ERROR_MESSAGE_UPDATE_TAG_EXISTS.type;
            notification.message = notifications.ERROR_MESSAGE_UPDATE_TAG_EXISTS.message;
        }
        else {
            notification.type = notifications.ERROR_MESSAGE_UPDATE_UNKNOWN.type;
            notification.message = notifications.ERROR_MESSAGE_UPDATE_UNKNOWN.message;
        }
        this._setNotification(notification);
    }
    _setNotification(notification) {
        this.setState({
            notification: notification
        });
    }
    _closeNotification() {
        this.setState({
            notification: this.initialState.notification
        });
    }
    _updateTag(data) {
        var index = _.indexOf(_.pluck(this.state.tags, 'id'), data.id);
        if (data.description === null) {
            data.description = '';
        }
        this.state.tags[index] = data;
        this.setState({
            tags: this.state.tags,
            notification: this.initialState.notification
        });
    }
    _archiveTag(data) {
        var index = _.indexOf(_.pluck(this.state.tags, 'id'), data.id);
        this.state.tags[index] = data;
        this.setState({
            tags: this.state.tags,
            notification: {
                type: notifications.TAG_ARCHIVED.type,
                message: notifications.TAG_ARCHIVED.message
            }
        });
    }
    _batchArchiveTags(data) {
        var tags = cloneDeep(this.state.tags);
        for (var i = 0; i < data.length; i++) {
            var index = _.indexOf(_.pluck(tags, 'id'), data[i].id);
            tags.splice(index, 1);
        }
        this.setState({
            tags: tags,
            batchedTags: [],
            notification: {
                type: notifications.TAG_ARCHIVED.type,
                message: notifications.TAG_ARCHIVED.message
            }
        });
    }
    _unarchiveTag(data) {
        var index = _.indexOf(_.pluck(this.state.tags, 'id'), data.id);
        this.state.tags[index] = data;
        this.setState({
            tags: this.state.tags,
            notification: {
                type: notifications.TAG_UNARCHIVED.type,
                message: notifications.TAG_UNARCHIVED.message
            }
        });
    }
    _deleteTag(id) {
        var tags = cloneDeep(this.state.tags);
        var index = _.indexOf(_.pluck(tags, 'id'), id);
        tags.splice(index, 1);
        this.setState({
            tags: tags,
            notification: {
                type: notifications.TAG_DELETED.type,
                message: notifications.TAG_DELETED.message
            }
        });
    }
    _batchRestoreTags(data) {
        var tags = cloneDeep(this.state.tags);
        for (var i = 0; i < data.length; i++) {
            var index = _.indexOf(_.pluck(tags, 'id'), data[i].id);
            tags.splice(index, 1);
        }
        this.setState({
            tags: tags,
            batchedTags: [],
            notification: {
                type: notifications.TAG_UNARCHIVED.type,
                message: notifications.TAG_UNARCHIVED.message
            }
        });
    }
    _openCreateSingleTagModal() {
        this.setState({
            createSingleTagModalOpen: true,
            notification: this.initialState.notification
        });
    }
    _closeCreateSingleTagModal() {
        this.setState({
            createSingleTagModalOpen: false,
            notification: this.initialState.notification
        });
    }
    _openCreateMultiTagModal() {
        this.setState({
            createMultiTagModalOpen: true,
            createSingleTagModalOpen: false,
            notification: this.initialState.notification
        });
    }
    _closeCreateMultiTagModal() {
        this.setState({
            createMultiTagModalOpen: false,
            notification: this.initialState.notification,
            multiTagFormData: this.initialState.multiTagFormData
        });
    }
    _closeNotifyErrorModal() {
        this.setState({
            notifyErrorModalOpen: false,
            notification: this.initialState.notification,
            multiTagFormData: this.initialState.multiTagFormData
        });
    }
    _editFailedTagsInMultiModal() {
        this.setState({
            notifyErrorModalOpen: false,
            createMultiTagModalOpen: true
        });
    }
    _openDeleteTagConfirmationModal() {
        this.setState({
            deleteTagConfirmationModalOpen: true
        });
    }
    _closeDeleteTagConfirmationModal() {
        this.setState({
            deleteTagConfirmationModalOpen: false
        });
    }
    _addTagToBatched(id) {
        if (_.contains(this.state.batchedTags, id)) {
            var index = this.state.batchedTags.indexOf(id);
            this.state.batchedTags.splice(index, 1);
        }
        else {
            this.state.batchedTags.push(id);
        }
        this.setState({
            batchedTags: this.state.batchedTags
        });
    }
    _batchSelectAll() {
        if (this.state.batchedTags.length) {
            this.state.batchedTags = [];
        }
        else {
            this.state.batchedTags = _.pluck(this.state.tags, 'id');
        }
        this.setState({
            batchedTags: this.state.batchedTags
        });
    }
    _clearBatchSelect() {
        this.state.batchedTags = [];
        this.setState({
            batchedTags: this.state.batchedTags
        });
    }
    _setSort(data) {
        this.setState({
            sort: data
        });
    }
    _setIsThrobberDisplayed() {
        this.setState({
            isThrobberDisplayed: true
        });
    }
    _setIsLazyLoading(boolean) {
        this.setState({
            isLazyLoading: boolean
        });
    }
    _setTags(tags) {
        this.setState({
            tags: tags
        });
    }
    _addTag(tag) {
        this.setState({
            tags: this.state.tags.concat(tag)
        });
    }
    _restartPageNumber() {
        this.setState({
            pageNumber: this.initialState.pageNumber + 1 // already did initial search with pageNumber 1 so now we are on pageNumber 2
        });
    }
    getSuggestedTags() {
        return this.state.suggestedTags;
    }
    _setSuggestedTags(suggestedTags) {
        this.setState({
            suggestedTags: suggestedTags
        });
    }
    _removeSuggestedTag(suggestedTag) {
        var indexOfTag = this.state.suggestedTags.map(t => t.id).indexOf(suggestedTag.id);
        if (indexOfTag < 0) {
            return;
        }
        var suggestedTags = cloneDeep(this.state.suggestedTags);
        suggestedTags.splice(indexOfTag, 1);
        this.setState({
            suggestedTags: suggestedTags
        });
    }
    get() {
        return this.state.tags;
    }
}
module.exports = TagStore;
