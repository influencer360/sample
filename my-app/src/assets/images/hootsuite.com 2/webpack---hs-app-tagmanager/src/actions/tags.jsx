'use strict';
var tagService = require('../services/tags');
var wisdom = require('hs-nest/lib/utils/wisdom');
var notifications = require('../constants/notifications');
var constants = require('../constants/constants');
class TagActions extends wisdom.Actions {
    manageTagsForOrg(orgId) {
        return tagService.manageTagsForOrg(orgId);
    }
    fetchTagsForOrg(orgId, isArchived, pageNumber, sortBy, sortDirection, tagName) {
        return tagService.fetchTagsForOrg(orgId, isArchived, pageNumber, sortBy, sortDirection, tagName);
    }
    // Need this one here too, so we can register a different callback in the store for whether to replace all tags
    // (when changing the filter) or to simply add tags to the end (when doing paginated call for lazy loading)
    fetchTagsForOrgLazy(orgId, isArchived, pageNumber, sortBy, sortDirection, tagName) {
        return tagService.fetchTagsForOrg(orgId, isArchived, pageNumber, sortBy, sortDirection, tagName);
    }
    fetchTagHistory(tagId) {
        return tagService.fetchTagHistory(tagId);
    }
    createTag(name, description, ownerId) {
        return tagService.createTag(name, description, ownerId);
    }
    batchCreateTags(tagNames, ownerId) {
        return tagService.batchCreateTags(tagNames, ownerId);
    }
    updateTag(tagId, name, description) {
        return tagService.updateTag(tagId, name, description);
    }
    archiveTag(tagId) {
        return tagService.archiveTag(tagId);
    }
    unarchiveTag(tagId) {
        return tagService.unarchiveTag(tagId);
    }
    deleteTag(tagId) {
        return tagService.deleteTag(tagId);
    }
    setSelectedTagIndex(index) {
        return index;
    }
    setIsLazyLoading(boolean) {
        return boolean;
    }
    setSingleTagFormData(formData) {
        return formData;
    }
    clearSingleTagFormData() {
        return true;
    }
    setMultiTagFormData(data) {
        return data;
    }
    setNotification(data) {
        return data;
    }
    closeNotification() {
        return true;
    }
    openCreateSingleTagModal() {
        this.clearSingleTagFormData();
        return true;
    }
    closeCreateSingleTagModal() {
        return true;
    }
    openCreateMultiTagModal() {
        return true;
    }
    closeCreateMultiTagModal() {
        return true;
    }
    closeNotifyErrorModal() {
        return true;
    }
    editFailedTagsInMultiModal() {
        return true;
    }
    openDeleteTagConfirmationModal() {
        return true;
    }
    closeDeleteTagConfirmationModal() {
        return true;
    }
    setIsArchivedFilter(label, state) {
        return { label: label, value: state };
    }
    /**
     * Compares new and old name, checks if new name is valid.
     * @param {String} newValue
     * @param {String} oldValue
     * @return {Boolean}
     */
    validateNameField(newValue, oldValue) {
        if (newValue === oldValue) {
            return false;
        }
        if (!newValue) {
            this.setNotification({
                type: notifications.ERROR_MESSAGE_EMPTY_NAME.type,
                message: notifications.ERROR_MESSAGE_EMPTY_NAME.message,
                forField: notifications.FIELDS.name
            });
            return false;
        }
        else if (newValue.length > constants.MAX_TAG_LENGTH) {
            this.setNotification({
                type: notifications.ERROR_MESSAGE_TAG_TOO_LONG.type,
                message: notifications.ERROR_MESSAGE_TAG_TOO_LONG.message,
                forField: notifications.FIELDS.name
            });
            return false;
        }
        return true;
    }
    /**
     * Check to see if a description is valid. If it is an update (not a create), it is invalid if empty or unchanged
     * from the original - we don't want to submit an ajax update request unless it's different.
     * @param {String} newValue
     * @param {String} oldValue
     * @param {Boolean} isUpdate
     * @return {Boolean}
     */
    validateDescriptionField(newValue, oldValue, isUpdate) {
        if (!isUpdate && !newValue) {
            return true;
        }
        // don't update if unchanged, or if changing from null to "" or vice versa (!= would be easier, but eslint demands !==)
        if (newValue === oldValue || (!newValue && !oldValue)) {
            return false;
        }
        if (newValue.length > constants.MAX_TAG_DESCRIPTION_LENGTH) {
            this.setNotification({
                type: notifications.ERROR_MESSAGE_TAG_DESCRIPTION_TOO_LONG.type,
                message: notifications.ERROR_MESSAGE_TAG_DESCRIPTION_TOO_LONG.message,
                forField: notifications.FIELDS.description
            });
            return false;
        }
        return true;
    }
    addTagToBatched(id) {
        return id;
    }
    batchSelectAll() {
        return null;
    }
    clearBatchSelect() {
        return null;
    }
    batchArchiveTags(tagIds) {
        return tagService.batchArchiveTags(tagIds);
    }
    batchRestoreTags(tagIds) {
        return tagService.batchRestoreTags(tagIds);
    }
    setSort(label, sortBy, sortDirection) {
        return { label: label, sortBy: sortBy, sortDirection: sortDirection };
    }
    setSearchFilter(value) {
        return value;
    }
    setIsSearching() {
        return null;
    }
    clearIsSearching() {
        return null;
    }
    setIsThrobberDisplayed() {
        return null;
    }
    setTags(tags) {
        return tags;
    }
    addTag(tag) {
        return tag;
    }
    restartPageNumber() {
        return null;
    }
    setSuggestedTags(suggestedTags) {
        return suggestedTags;
    }
    removeSuggestedTag(suggestedTag) {
        return suggestedTag;
    }
}
module.exports = TagActions;
