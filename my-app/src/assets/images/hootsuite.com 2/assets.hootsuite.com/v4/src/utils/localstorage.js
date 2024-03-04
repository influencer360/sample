import _ from 'underscore';

var defaultNamespace = 'default';
var localStorageSupported = null;

function getNamespacePrefix(namespace) {
    namespace = typeof namespace !== 'undefined' ? namespace : defaultNamespace;

    return namespace + '.';
}

function getTrueKey(namespace, key) {
    return getNamespacePrefix(namespace) + key;
}

/**
 * Iterates over all entries in localStorage and finds the keys with the specified namespace.
 * WARNING: This is very inefficient for obvious reasons. Use absolutely sparingly.
 * @param namespace
 */
function findAllTrueKeysInNamespace(namespace) {
    namespace = typeof namespace !== 'undefined' ? namespace : defaultNamespace;

    var allKeys = [],
        i, len = null;

    for (i = 0, len = sessionStorage.length; i < len; ++i) {
        allKeys[allKeys.length] = sessionStorage.key(i);
    }

    var nsPrefix = getNamespacePrefix(namespace);

    return _.filter(allKeys, function (key) {
        // Check if key starts with namespace.
        return key.indexOf(nsPrefix) === 0;
    });
}

var ls = {
    /**
     * Standardised check to see if localStorage is supported for this client.
     * @returns {boolean} True if browser supports HTML5 localStorage; otherwise, false.
     */
    supported: function () {
        if (localStorageSupported === null) {
            try {
                localStorageSupported = 'sessionStorage' in window && window['sessionStorage'] !== null;
            } catch (e) {
                localStorageSupported = false;
            }
        }

        return localStorageSupported;
    },
    /**
     * Save an object to the localStorage under the specified namespace.
     * @param {string} namespace Your component should use a consistent namespace for all localStorage operations.
     * @param {string} key The lookup key for this element.
     * @param {Object} value The value to store. Not restricted to strings as we JSON.stringify all values for storage.
     * @returns {boolean} True if browser supports HTML5 localStorage and value was stored; otherwise, false.
     */
    setItem: function (namespace, key, value) {
        if (!ls.supported()) {
            return false;
        }

        var trueKey = getTrueKey(namespace, key);

        // Allow the storing of objects by converting to JSON.
        var json = JSON.stringify(value);

        sessionStorage.setItem(trueKey, json);

        return true;
    },
    /**
     * Retrieve an item from localStorage under the specified key.
     * @param {string} namespace Your component should use a consistent namespace for all localStorage operations.
     * @param {string} key The lookup key for the object you seek.
     * @returns {(Object|null)} The object stored under the key or null if no item exists.
     */
    getItem: function (namespace, key) {
        if (!ls.supported()) {
            return null;
        }

        var trueKey = getTrueKey(namespace, key),
            json = null;

        json = sessionStorage.getItem(trueKey);

        return typeof json === 'undefined' ? null : JSON.parse(json);
    },
    /**
     * Delete any item identified by the specified key. This is safe to perform if no item exists for that key.
     * @param {string} namespace Your component should use a consistent namespace for all localStorage operations.
     * @param {string} key The lookup key for the item you wish to delete.
     */
    removeItem: function (namespace, key) {
        if (!ls.supported()) {
            return;
        }

        var trueKey = getTrueKey(namespace, key);

        sessionStorage.removeItem(trueKey);
    },
    /**
     * Delete all items stored for the specified namespace. This allows you to scope a clear for your component while
     * leaving localStorage entries for other components unaffected.
     * WARNING: This is not a particularly performant operation so please use it sparingly.
     * @param {string} namespace Your component should use a consistent namespace for all localStorage operations.
     */
    clear: function (namespace) {
        if (!ls.supported()) {
            return;
        }

        var namespaceKeys = findAllTrueKeysInNamespace(namespace);

        _.map(namespaceKeys, function (key) {
            sessionStorage.removeItem(key);
        });
    },
    /**
     * Returns an array of all keys within the specified namespace.
     * WARNING: This is not a particularly performent operation so please use it sparingly.
     * @param {string} namespace Your component should use a consistent namespace for all localStorage operations.
     * @returns {string[]} An array of keys that currently map to objects in this namespace.
     */
    getKeys: function (namespace) {
        if (!ls.supported()) {
            return [];
        }

        // The "true keys" are what we use internally to store values. These include the namespace prefix.
        var namespaceTrueKeys = findAllTrueKeysInNamespace(namespace);

        // Strip off the namespace prefixes before returning. These should be hidden from the outside world.
        var nsPrefixLength = getNamespacePrefix(namespace).length;
        return _.map(namespaceTrueKeys, function (trueKey) {
            return trueKey.substring(nsPrefixLength);
        });
    }
};

export default ls;
