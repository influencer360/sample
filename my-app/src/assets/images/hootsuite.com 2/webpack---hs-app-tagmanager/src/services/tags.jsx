'use strict';
var ajaxPromise = require('hs-nest/lib/utils/ajax-promise');
var hootbus = require('hs-nest/lib/utils/hootbus');
module.exports = {
    manageTagsForOrg: (orgId) => {
        return ajaxPromise({
            type: 'GET',
            url: '/ajax/tag/can-manage-for-organization',
            data: {
                orgId: orgId
            }
        }, 'q1')
            .then((data) => {
            return data;
        });
    },
    fetchTagsForOrg: (orgId, isArchived, pageNumber, sortBy, sortDirection, tagName) => {
        return ajaxPromise({
            type: 'GET',
            url: '/ajax/tag/get-for-organization',
            data: {
                ownerId: orgId,
                contextType: 'MESSAGE',
                ownerType: 'ORGANIZATION',
                isArchived: isArchived,
                page: pageNumber,
                sortBy: sortBy,
                sortDirection: sortDirection,
                name: tagName || ''
            }
        }, 'q1')
            .then((data) => {
            return data;
        });
    },
    updateTag: (tagId, name, description) => {
        return ajaxPromise({
            type: 'POST',
            url: '/ajax/tag/update',
            data: {
                name: name,
                description: description,
                tagId: tagId
            }
        }, 'q1')
            .then((data) => {
            if (data && data.success) {
                hootbus.emit('Datalab:trackEvent', {
                    origin: 'web.dashboard.tag_manager.tag_service',
                    action: 'tag_modified'
                });
                return data.tag;
            }
            hootbus.emit('Datalab:trackEvent', {
                origin: 'web.dashboard.tag_manager.tag_service',
                action: 'tag_modification_failed'
            });
            return data;
        });
    },
    archiveTag: (tagId) => {
        return ajaxPromise({
            type: 'POST',
            url: '/ajax/tag/archive',
            data: {
                tagId: tagId
            }
        }, 'q1')
            .then((data) => {
            if (data && data.success) {
                hootbus.emit('Datalab:trackEvent', {
                    origin: 'web.dashboard.tag_manager.tag_service',
                    action: 'tag_archived'
                });
                return data.tag;
            }
            hootbus.emit('Datalab:trackEvent', {
                origin: 'web.dashboard.tag_manager.tag_service',
                action: 'tag_archive_failed'
            });
            return data;
        });
    },
    unarchiveTag: (tagId) => {
        return ajaxPromise({
            type: 'POST',
            url: '/ajax/tag/restore',
            data: {
                tagId: tagId
            }
        }, 'q1')
            .then((data) => {
            if (data && data.success) {
                hootbus.emit('Datalab:trackEvent', {
                    origin: 'web.dashboard.tag_manager.tag_service',
                    action: 'tag_unarchived'
                });
                return data.tag;
            }
            hootbus.emit('Datalab:trackEvent', {
                origin: 'web.dashboard.tag_manager.tag_service',
                action: 'tag_unarchive_failed'
            });
            return data;
        });
    },
    deleteTag: (tagId) => {
        return ajaxPromise({
            type: 'POST',
            url: '/ajax/tag/delete',
            data: {
                tagId: tagId
            }
        }, 'q1')
            .then((data) => {
            if (data && data.success) {
                hootbus.emit('Datalab:trackEvent', {
                    origin: 'web.dashboard.tag_manager.tag_service',
                    action: 'tag_deleted'
                });
                return tagId;
            }
            hootbus.emit('Datalab:trackEvent', {
                origin: 'web.dashboard.tag_manager.tag_service',
                action: 'tag_delete_failed'
            });
            return data;
        });
    },
    batchArchiveTags: (tagIds) => {
        return ajaxPromise({
            type: 'POST',
            url: '/ajax/tag/batch-archive',
            data: {
                tagIds: tagIds
            }
        }, 'q1')
            .then((data) => {
            if (data && data.success) {
                hootbus.emit('Datalab:trackEvent', {
                    origin: 'web.dashboard.tag_manager.tag_service',
                    action: 'tag_bulk_archived'
                });
                return data.tags;
            }
            hootbus.emit('Datalab:trackEvent', {
                origin: 'web.dashboard.tag_manager.tag_service',
                action: 'tag_bulk_archive_failed'
            });
            return data;
        });
    },
    batchRestoreTags: (tagIds) => {
        return ajaxPromise({
            type: 'POST',
            url: '/ajax/tag/batch-restore',
            data: {
                tagIds: tagIds
            }
        }, 'q1')
            .then((data) => {
            if (data && data.success) {
                hootbus.emit('Datalab:trackEvent', {
                    origin: 'web.dashboard.tag_manager.tag_service',
                    action: 'tag_bulk_restored'
                });
                return data.tags;
            }
            hootbus.emit('Datalab:trackEvent', {
                origin: 'web.dashboard.tag_manager.tag_service',
                action: 'tag_bulk_restore_failed'
            });
            return data;
        });
    },
    fetchTagHistory: (tagId) => {
        return ajaxPromise({
            type: 'GET',
            url: '/ajax/tag/history',
            data: {
                tagId: tagId
            }
        }, 'q1')
            .then((data) => {
            return data;
        });
    },
    createTag: (name, description, ownerId) => {
        return ajaxPromise({
            type: 'POST',
            url: '/ajax/tag/create',
            data: {
                name: name,
                description: description,
                contextType: 'MESSAGE',
                ownerId: ownerId,
                ownerType: 'ORGANIZATION'
            }
        }, 'q1')
            .then((data) => {
            if (data && data.success) {
                hootbus.emit('Datalab:trackEvent', {
                    origin: 'web.dashboard.tag_manager.tag_service',
                    action: 'tag_created'
                });
                return data.tag;
            }
            hootbus.emit('Datalab:trackEvent', {
                origin: 'web.dashboard.tag_manager.tag_service',
                action: 'tag_create_failed'
            });
            return data;
        });
    },
    batchCreateTags: (tagNames, ownerId) => {
        return ajaxPromise({
            type: 'POST',
            url: '/ajax/tag/batch-create',
            data: {
                names: tagNames,
                contextType: 'MESSAGE',
                ownerId: ownerId,
                ownerType: 'ORGANIZATION'
            }
        }, 'q1')
            .then((data) => {
            if (data && data.success) {
                hootbus.emit('Datalab:trackEvent', {
                    origin: 'web.dashboard.tag_manager.tag_service',
                    action: 'tags_batch_created'
                });
                return {
                    success: data.createdTags,
                    fail: data.failedTags
                };
            }
            hootbus.emit('Datalab:trackEvent', {
                origin: 'web.dashboard.tag_manager.tag_service',
                action: 'tags_batch_create_failed'
            });
            return data;
        });
    }
};
