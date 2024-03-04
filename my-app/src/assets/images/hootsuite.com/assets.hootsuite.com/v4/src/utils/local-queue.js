import _ from 'underscore';
import hsLocalStorage from 'utils/localstorage';
import uniqueId from 'utils/unique-id';

var LS_NAMESPACE = "localQueue";

var getStreamKey = function (streamName) {
    return 'stream_' + streamName;
};

var getNodeKey = function (nodeId) {
    return 'node_' + nodeId;
};

var getNodeDataKey = function (nodeId) {
    return 'data_' + nodeId;
};

var loadNode = function (nodeId) {
    var nodeKey = getNodeKey(nodeId);

    return hsLocalStorage.getItem(LS_NAMESPACE, nodeKey);
};

var saveNode = function (node) {
    var nodeKey = getNodeKey(node.nodeId);

    hsLocalStorage.setItem(LS_NAMESPACE, nodeKey, node);
};

var deleteNode = function (nodeId) {
    var nodeKey = getNodeKey(nodeId);

    hsLocalStorage.removeItem(LS_NAMESPACE, nodeKey);

    deleteData(nodeId);
};

var loadData = function (nodeId) {
    var dataKey = getNodeDataKey(nodeId);

    return hsLocalStorage.getItem(LS_NAMESPACE, dataKey);
};

var saveData = function (nodeId, data) {
    var dataKey = getNodeDataKey(nodeId);

    hsLocalStorage.setItem(LS_NAMESPACE, dataKey, data);
};

var deleteData = function (nodeId) {
    var dataKey = getNodeDataKey(nodeId);

    hsLocalStorage.removeItem(LS_NAMESPACE, dataKey);
};

var loadStream = function (streamName, createOnAbsent) {
    var stream = hsLocalStorage.getItem(LS_NAMESPACE, getStreamKey(streamName));

    // Create the stream if one does not exist
    if (stream == null && createOnAbsent) {
        stream = {
            name: streamName,
            headNodeId: null
        };

        saveStream(stream);
    }

    return stream;
};

var saveStream = function (stream) {
    var streamName = stream.name;

    hsLocalStorage.setItem(LS_NAMESPACE, getStreamKey(streamName), stream);
};

var getTailNode = function (stream) {
    // Empty list
    if (stream.headNodeId === null) {
        return null;
    }

    var cursor = loadNode(stream.headNodeId);

    while (cursor.nextNodeId !== null) {
        cursor = loadNode(cursor.nextNodeId);
    }

    return cursor;
};

var appendRecord = function (stream, data) {
    var newNode = createNode(data);
    var tail = getTailNode(stream);

    if (tail === null) {
        // Empty stream
        stream.headNodeId = newNode.nodeId;
        saveStream(stream);
    } else {
        // Or append to stream
        tail.nextNodeId = newNode.nodeId;
        saveNode(tail);
    }
};

/**
 * Collect the data from the first N nodes of the stream. The nodes will be removed from the stream. This is a
 * destructive operation.
 * @param stream The stream to read nodes from.
 * @param limit The maximum number of nodes to read in this batch.
 * @returns {object[]} The data contained within the nodes.
 */
var popHeadNodes = function (stream, limit) {
    if (stream.headNodeId === null) {
        return [];
    }

    // Build an array of the first {limit} nodes
    var nodeIdsToPop = [];
    var cursorNodeId = stream.headNodeId;
    var currentNode = null;
    for (var i = 0; i < limit && cursorNodeId !== null; i++) {
        currentNode = loadNode(cursorNodeId);
        nodeIdsToPop[nodeIdsToPop.length] = currentNode.nodeId;
        cursorNodeId = currentNode.nextNodeId;
    }

    // Reset the head of the stream to the next node (or null if we've consumed the list)
    stream.headNodeId = cursorNodeId;
    saveStream(stream);

    // Map our list of nodes to their respective data values and delete the nodes in the process.
    return _.map(nodeIdsToPop, function (nodeId) {
        var data = loadData(nodeId);

        deleteNode(nodeId);

        return data;
    });
};

var uniqueNodeId = function () {
    return uniqueId.create('queueNode_');
};

/**
 * Stores the data and creates a reference node.
 * @param data The record data to store in the node.
 * @returns {{nodeId: number, nextNodeId: null}}
 */
var createNode = function (data) {
    var nodeId = uniqueNodeId();

    // Store data for node
    saveData(nodeId, data);

    var node = {
        nodeId: nodeId,
        nextNodeId: null
    };

    // Store the node metadata
    saveNode(node);

    return node;
};

export default {
    /**
     * Enqueue a record to the specified stream. A record can be any object or primitive.
     * @param {string} streamName The name of the stream you want to add to.
     * @param {object} data The record data to enqueue in the stream
     */
    putRecord: function (streamName, data) {
        if (typeof streamName === 'undefined') {
            return;
        }

        var stream = loadStream(streamName, true);

        appendRecord(stream, data);
    },
    /**
     * Dequeue any number of records off the stream.
     * @param {string} streamName The name of the stream you want to remove from.
     * @param {number} limit The maximum number of records to read from the stream.
     * @returns {object[]} An array of data objects read from the stream.
     */
    getRecords: function (streamName, limit) {
        if (typeof streamName === 'undefined') {
            return [];
        }

        var stream = loadStream(streamName, false);

        if (stream === null) {
            return [];
        }

        return popHeadNodes(stream, limit);
    }
};
