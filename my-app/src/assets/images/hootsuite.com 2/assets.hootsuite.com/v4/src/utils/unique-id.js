import hsLocalStorage from 'utils/localstorage';

var LS_NAMESPACE = 'uniqueID';
var BATCH_CURSOR_KEY = 'batchCursor';

/**
 * To reduce the frequency of hits to localStorage (which is slow) we grab ids in batches of 100.
 * @returns {{batchCursor: int, batchLimit: int}} Data about the new batch.
 */
var getNextBatch = function () {
    var last = hsLocalStorage.getItem(LS_NAMESPACE, BATCH_CURSOR_KEY);
    if (last === null) {
        last = 0;
    }

    var next = last + 100;
    hsLocalStorage.setItem(LS_NAMESPACE, BATCH_CURSOR_KEY, next);
    return {
        batchCursor: last,
        batchLimit: next
    };
};

var batchLimit = null;
var cursor = null;
var getNextId = function () {
    // Check if batch limit needs to be renewed
    if (batchLimit === null || cursor >= batchLimit) {
        var newBatch = getNextBatch();

        cursor = newBatch.batchCursor;
        batchLimit = newBatch.batchLimit;
    }

    return ++cursor;
};

export default {
    /**
     * Generate an ID that is unique across the current session
     * @param prefix A string prefix to prepend to IDs. This helps your value be unique to your library.
     */
    create: function (prefix) {
        var id = getNextId() + '';
        return prefix ? prefix + id : id;
    }
};
