export const toastProperties = {
    successTitleText: "Results have been loaded successfully",
    successMessageText: "Your results are loaded. Now you can keep searching with no more delays.",
    errorTitleText: "We couldn't load your results",
    errorMessageText: "There was a problem connecting to our servers and accessing your data. Please try again."
};

export const getLoadedCountPercentage = function (loadedPages, totalPages) {
    var percentageLoaded = (loadedPages / totalPages) * 100;
    return Math.round(percentageLoaded);
};

export const collectionsCount = function () {
    return {
        members: { count: null, url: '/ajax/organization/get-member-count' },
        teams: { count: null, url: '/ajax/organization/get-team-count' },
        socialnetworks: { count: null, url: '/ajax/organization/get-social-network-count' }
    };
};

export const showToast = function (add, calloutType, type, titleText, messageText) {
    add({
        calloutType,
        type,
        titleText,
        messageText
    });
};

export const getCollectionsUrlArray = function (collectionsCount) {
    var collectionKeys = Object.keys(collectionsCount);
    return collectionKeys.map(function (element) {
        return collectionsCount[element].url;
    });
};

export const getCollectionsCount = function (ajax, collectionsUrlArray, organizationId, showErrorToast) {
    try {
        return collectionsUrlArray.map(function (url) {
            return ajax({
                type: 'GET',
                url: url,
                data: { organizationId: organizationId },
                fail: function () {
                    showErrorToast();
                }
            }, 'qm');
        });
    }
    catch (error) {
        showErrorToast();
    }
};

export const returnFilteredCollection = function (section, collection, searchRegEx, stashedCollection) {
    if (searchRegEx != null) {
        var filteredCollection = collection.filter(function (item) {
            switch (section) {
                case 'team':
                    return item.get("name").match(searchRegEx);
                case 'member':
                    return item.get("fullName").match(searchRegEx) || item.get("email").match(searchRegEx);
                case 'socialnetwork':
                    return item.get("username").match(searchRegEx) || item.get("type").match(searchRegEx);
            }
        });

        if (filteredCollection.length > 50) {
            filteredCollection = filteredCollection.slice(0, 50);
        }
        return filteredCollection;
    }
    return stashedCollection;
};

export const getFilterPlaceholder = function (count, loadAllPageSize, section) {
    if (count > loadAllPageSize) {
        return "Load %ss...".replace('%s', section);
    } else {
        return "Find %s...".replace('%s', section);
    }
};

export const closePopup = function (loadingModalUtils, toastFn) {
    loadingModalUtils.onClose();
    if (typeof toastFn === "function") {
        toastFn();
    }
};

export const applyCollectionCountPromises = function (collectionsCount, promises) {
    // the promises array order is defined in this file, it is:
    //   0  members
    //   1  teams
    //   2  social networks
    //
    promises[0]
        .then(function(value) {
            collectionsCount.members.count = value.count;
        }, function () {
            // this is expected if the user does not have permissions to manage members and the user's
            // org is an enterprise org where the member list is not public
            //
            collectionsCount.members.count = 0;
        });

    promises[1]
        .then(function(value) {
            collectionsCount.teams.count = value.count;
        }, function () {
            // eslint-disable-next-line no-console
            console.error('could not retrieve team count');
            collectionsCount.teams.count = 0;
        });

    promises[2]
        .then(function(value) {
            collectionsCount.socialnetworks.count = value.count;
        }, function () {
            // eslint-disable-next-line no-console
            console.error('could not retrieve social network count');
            collectionsCount.socialnetworks.count = 0;
        });
};
