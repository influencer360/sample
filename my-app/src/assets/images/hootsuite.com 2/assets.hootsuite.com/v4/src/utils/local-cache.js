import hsLocalStorage from 'utils/localstorage';

var localCache = {};

localCache.isSupported = hsLocalStorage.supported();
localCache.LOCAL_CACHE_NAMESPACE = 'localCache';
localCache.KEY_EXPIRE = 'e';
localCache.KEY_ACCESSED_DATE = 'lad';
localCache.DAYS_TO_KEEP = 1;
/*version number is used for cache entry invaildation. simply increase version number for next release*/
localCache.v = "v10";
localCache.gcLock = false; //when gc is running, thens storage is read only, insert/update will be blocked

/* ===========  Start of functions that wrap javascript built in localStorage object ===========*/

/**
 * @param expires in seconds, specifies how long it should expire from now
 */
localCache.setItem = function (key, data, expires) {
    if (!localCache.isSupported) {
        return false;
    }
    if (data === null) {
        return false;
    }
    if (!key) {
        return false;
    }
    if (localCache.gcLock === true) {
        return false;
    }

    key = localCache.v + "_" + key;

    // set expiry date
    var maxSecondsToKeep = localCache.DAYS_TO_KEEP * (24 * 60 * 60);
    expires = parseInt(expires, 10);
    if (!expires) {
        expires = maxSecondsToKeep;
    } else if (expires > maxSecondsToKeep) {
        expires = maxSecondsToKeep;
    } else if (expires <= 0) {
        expires = 1;
    }

    var now = localCache.getCurrentTime();
    var entry = {};
    entry[localCache.KEY_EXPIRE] = now + expires;
    entry[localCache.KEY_ACCESSED_DATE] = now;
    entry['data'] = data;

    try {
        var json = JSON.stringify(entry);
        hsLocalStorage.setItem(localCache.LOCAL_CACHE_NAMESPACE, key, json);
    } catch (e) {
        // localStorage disabled by user, or is full
        localCache.clear();
        localCache.reportCacheFull();
        if (!e.name || !(e.name == 'QUOTA_EXCEEDED_ERR' && e.name == 'NS_ERROR_DOM_QUOTA_REACHED')) {
            localCache.isSupported = false;	// error was not due to quota exceeded, turn localStorage off
        }
        return false;
    }
    return true;
};

localCache.getItem = function (key) {
    // check created date, if too old, delete
    // update lastGetDate
    if (!localCache.isSupported) {
        return null;
    }
    if (!key) {
        return null;
    }
    key = localCache.v + "_" + key;

    var obj = hsLocalStorage.getItem(localCache.LOCAL_CACHE_NAMESPACE, key);
    if (obj != null) {
        obj = JSON.parse(obj);
    } else {
        return null;
    }

    if (localCache.isItemExpired(obj)) {
        //if expired, simply remove it
        hsLocalStorage.removeItem(localCache.LOCAL_CACHE_NAMESPACE, key);
        return null;
    } else {
        obj[localCache.KEY_ACCESSED_DATE] = localCache.getCurrentTime(); //update last accessed timestamp
        var json = JSON.stringify(obj);
        hsLocalStorage.setItem(localCache.LOCAL_CACHE_NAMESPACE, key, json);
    }

    return obj.data;
};

localCache.removeItem = function (key) {
    if (!localCache.isSupported) {
        return false;
    }
    if (localCache.gcLock === true) {
        return false;
    }

    key = localCache.v + "_" + key;
    hsLocalStorage.removeItem(localCache.LOCAL_CACHE_NAMESPACE, key);
    return true;
};

localCache.clear = function () {
    if (!localCache.isSupported || localCache.gcLock === true) {
        return false;
    }
    hsLocalStorage.clear(localCache.LOCAL_CACHE_NAMESPACE);
};

/* ===========  End of functions that wrap javascript built in localStorage object ===========*/


/* ===========  Start of functions of our own ===========*/
localCache.isItemExpired = function (item) {
    if (!Object.prototype.hasOwnProperty.call(item, localCache.KEY_EXPIRE)) {
        //if somehow item doesn't have valid value, then simply expire it
        return true;
    }

    var now = localCache.getCurrentTime();
    return parseInt(item[localCache.KEY_EXPIRE], 10) < now;
};

/* given an array of keys, remove all cache entries */
localCache.removeByKeys = function (keys) {
    if (localCache.gcLock === true) {
        return false;
    }

    if (!$.isArray(keys)) {
        return;
    }

    $.each(keys, function (i, key) {
        hsLocalStorage.removeItem(localCache.LOCAL_CACHE_NAMESPACE, key);
    });
};

/* garbage collection function, remove all expired items, and ones whose version is old version
 * if aggressive==true, then also remove all entries that hasn't been used in the past few days
 */
localCache.gc = function () {
    if (!localCache.isSupported) {
        return;
    }

    localCache.gcLock = true;

    var localStorageKeys = hsLocalStorage.getKeys(localCache.LOCAL_CACHE_NAMESPACE);

    var len = localStorageKeys.length,
        keysToRemove = [],
        hasError = false;

    try {
        for (var i = 0; i < len; i++) {
            var key = localStorageKeys[i];
            if (localCache.v != key.substring(0, key.indexOf('_'))) {
                keysToRemove.push(key);
                continue;
            }

            var obj = localStorageKeys.getItem(localCache.LOCAL_CACHE_NAMESPACE, key);
            if (obj !== null) {
                obj = JSON.parse(obj);
            } else {
                continue;
            }
            if (localCache.isItemExpired(obj)) {
                keysToRemove.push(key);
            }
        }
    } catch (e) {
        hasError = true;
    }

    localCache.gcLock = false;

    if (hasError) {
        // something went wrong with GC, just nuke everything
        localCache.clear();
    } else {
        localCache.removeByKeys(keysToRemove);
    }
};

localCache.reportCacheFull = function () {
    ajaxCall({
        type: 'POST',
        url: "/ajax/index/html-cache-full",
        success: function () {
        },
        abort: function () {
        },
        error: function () {
        }
    }, 'qm');
};

//return current time in seconds since epouch time
localCache.getCurrentTime = function () {
    return Math.round((new Date()).getTime() / 1000);
};

export default localCache;
