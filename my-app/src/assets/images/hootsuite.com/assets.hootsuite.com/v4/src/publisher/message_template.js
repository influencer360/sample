import _ from "underscore";
import AssetCreatePopup from "publisher/views/popups/asset_create";
import ContentLibraries from "publisher/cols/content_libraries";
import LibraryAsset from "publisher/models/library_asset";
import hootbus from "hs-nest/lib/utils/hootbus";
import translation from "utils/translation";

var messageTemplate = {};

messageTemplate.create = function (
    params,
    isNewCompose,
    messageData,
    callbackFn
) {
    messageTemplate.showNewTemplatePopup(
        true,
        function (assetParams) {
            messageTemplate.saveMessageToLibrary(
                messageData,
                assetParams,
                callbackFn
            );
        },
        messageData.selectedSocialNetworks
    );
};

messageTemplate.showNewTemplatePopup = function (filterEditable, callback) {
    ajaxCall(
        {
            type: "GET",
            url: "/ajax/content-library/list",
            beforeSend: function () {
                // Status message
                hs.statusObj.update(translation.c.LOADING, "info");
            },
            success: function (data) {
                var assetCreatePopup;
                // Reset status message
                hs.statusObj.reset();

                var dropdownLibraries = filterEditable
                    ? _.filter(data.contentLibraries, function (library) {
                          // Check if current library has edit permission
                          return library.hasEditPermission;
                      })
                    : data.contentLibraries;

                // Load content library collection
                // Get the data
                var libraries = new ContentLibraries();
                libraries.reset(_.values(dropdownLibraries));

                assetCreatePopup = new AssetCreatePopup({
                    model: new LibraryAsset(),
                    libraryCollection: libraries,
                    callback: callback,
                });

                assetCreatePopup.render();
            },
        },
        "qm"
    );
};

messageTemplate.saveMessageToLibrary = function (
    messageData,
    assetParams,
    callbackFn
) {
    // Extract data from the asset to put in the request, along with the message data
    var templateFields = [
        "name",
        "description",
        "bucketId",
        "startDate",
        "expiryDate",
        "tags",
        "contentLibraryId",
        "isLocked",
    ];

    var template = {};
    templateFields.forEach(function (field) {
        if (typeof assetParams[field] !== "undefined") {
            template[field] = assetParams[field];
        }
    });
    messageData["template"] = template;

    ajaxCall(
        {
            url: "/ajax/content-library/create-template",
            beforeSend: function () {
                // Status message
                hs.statusObj.update(translation._("Loading..."), "info");
            },
            success: function (data) {
                hs.statusObj.update(
                    translation._("Saved to the Content Library"),
                    "success",
                    true
                );

                if (data.isTemplate) {
                    hootbus.emit(
                        "composer:saveTemplate",
                        data.contentLibraryTags
                    );
                }

                if (callbackFn) {
                    callbackFn();
                }
            },
            error: function () {
                hs.statusObj.update(
                    translation._(
                        "An error occurred creating your template. Please try again."
                    ),
                    "error",
                    true
                );
            },
            json: messageData,
        },
        "qm"
    );
};

messageTemplate.editTemplate = function (
    templateData,
    asset,
    onSuccess,
    onFailure
) {
    var data = {};
    const json = {};
    var queryParams =
        "messageId=" +
        asset.get("assetId") +
        "&libId=" +
        asset.getContentLibraryId() +
        "&isLegacy=true&isSendImmediate=true";

    Object.keys(templateData.message).forEach(function (field) {
        data[field] = templateData.message[field];
    });

    // other fields
    if (templateData.selectedSocialNetworks) {
        json.snIds = templateData.selectedSocialNetworks.join(",");
    }
    if (templateData.orgID) {
        json.orgID = templateData.orgID;
    }

    json.message = data;

    ajaxCall(
        {
            url: "/ajax/content-library/edit-template?" + queryParams,
            json,
            method: "POST",
            success: function (templateResponse) {
                var wasSuccessful =
                    templateResponse.success && !!templateResponse.success;
                if (wasSuccessful) {
                    onSuccess(templateResponse);
                } else {
                    // On failure, the service might have given us an error to display. Otherwise, use a generic one, then reject
                    if (templateResponse.statusType) {
                        onFailure(new Error(templateResponse.statusMsg));
                    } else {
                        var errorMsg =
                            templateResponse.errors &&
                            templateResponse.errors.length > 0
                                ? templateResponse.errors[0]
                                : translation._(
                                      "Unknown error occurred saving template"
                                  );
                        onFailure(new Error(errorMsg));
                    }
                }
                return false;
            },
        },
        "q1NoAbort"
    );
};

export default messageTemplate;
