'use strict';
var constants = require('./constants');
var notificationTypes = require('./notificationTypes');
var translation = require('hs-nest/lib/utils/translation');
module.exports = {
    ERROR_CODE_TAG_NAME_ALREADY_EXISTS: 4109,
    ERROR_CODE_TAG_WITH_ID_ALREADY_EXISTS: 4110,
    ERROR_MESSAGE_UPDATE_TAG_EXISTS: {
        type: notificationTypes.ERROR,
        message: translation._('Cannot update tag name: a tag by that name already exists.')
    },
    ERROR_MESSAGE_CREATE_TAG_EXISTS: {
        type: notificationTypes.ERROR,
        message: translation._('Cannot create tag; a tag with this name already exists.')
    },
    ERROR_MESSAGE_BATCH_CREATE_ERROR: {
        type: notificationTypes.ERROR,
        message: translation._('Cannot create tags listed above; please check if the tag name already exists as an active or archived tag.')
    },
    ERROR_MESSAGE_DUPLICATE_TAG_IN_LIST: {
        type: notificationTypes.ERROR,
        message: translation._('Please remove all duplicate tags before creation.')
    },
    ERROR_MESSAGE_BATCH_CREATE_UNKNOWN: {
        type: notificationTypes.ERROR,
        message: translation._('There was an error creating the tags.')
    },
    ERROR_MESSAGE_UPDATE_UNKNOWN: {
        type: notificationTypes.ERROR,
        message: translation._('There was an error updating this tag.')
    },
    ERROR_MESSAGE_CREATE_UNKNOWN: {
        type: notificationTypes.ERROR,
        message: translation._('There was an error creating this tag.')
    },
    ERROR_MESSAGE_TAG_TOO_LONG: {
        type: notificationTypes.ERROR,
        message: translation._('Tag name is too long: tags can be no longer than %s characters.').replace('%s', constants.MAX_TAG_LENGTH.toString())
    },
    ERROR_MESSAGE_TAG_DESCRIPTION_TOO_LONG: {
        type: notificationTypes.ERROR,
        message: translation._('Tag description is too long: tags can be no longer than %s characters.').replace('%s', constants.MAX_TAG_DESCRIPTION_LENGTH.toString())
    },
    ERROR_MESSAGE_EMPTY_NAME: {
        type: notificationTypes.ERROR,
        message: translation._('Tag name cannot be empty.')
    },
    TAG_CREATED: {
        type: notificationTypes.INFO,
        message: translation._('Tag successfully created.')
    },
    BATCH_TAGS_CREATED: {
        type: notificationTypes.INFO,
        message: translation._(' tags successfully created.') // NOTE: must add number of tags created in front of message
    },
    TAG_ARCHIVED: {
        type: notificationTypes.INFO,
        message: translation._('Tag successfully archived.')
    },
    TAG_UNARCHIVED: {
        type: notificationTypes.INFO,
        message: translation._('Tag successfully restored.')
    },
    TAG_DELETED: {
        type: notificationTypes.INFO,
        message: translation._('Tag successfully deleted.')
    },
    FIELDS: {
        name: 'name',
        description: 'description'
    }
};
