import $ from 'jquery';
import _ from 'underscore';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import 'utils/cookie';

hs.util = hs.util || {};

/**
 * @param $uploadBtn jQuery Object that should be clickable and initiate the upload process
 * @param uploadVars variables specific to each upload (upload url,  upload callback)
 */
hs.util.initPluploadImageUploader = function (flashId, uploadVars) {

    var $uploadBtn = $('#' + flashId).parent();
    var uploader = new window.plupload.Uploader({
        runtimes: 'html5,html4',
        file_data_name: 'Filedata',
        browse_button : $uploadBtn[0],
        container: $uploadBtn.parent()[0],
        max_file_size: '5mb',
        url: uploadVars.uploadPath,
        filters: [
            {
                title: "Image files",
                extensions: "jpg,jpeg,gif,png"
            }
        ]
    });

    uploader.bind('Error', function (up, params) {
        if (params && params.code == window.plupload.FILE_SIZE_ERROR) {
            hs.statusObj.update(translation._('Image size exceeds limit (5mb)'), 'error', true);
        }
    });

    uploader.bind('QueueChanged', function () {
        uploader.start();
        hootbus.emit('fileUpload:uploadStarted');
    });

    uploader.bind('FileUploaded', function (up, file, data) {
        // make sure there is a callback to update the image
        if (typeof uploadVars.uploadImageCompleteCallback !== 'undefined') {
            // make sure we have valid response
            if (typeof data !== 'undefined' && typeof data.response !== 'undefined') {
                try {
                    var jsonResponse = JSON.parse(data.response);
                    // make sure we have successfully uploaded the image
                    if (typeof jsonResponse.success !== 'undefined' && jsonResponse.success) {
                        if (_.isFunction(uploadVars.uploadImageCompleteCallback)) {
                            uploadVars.uploadImageCompleteCallback(jsonResponse.fileName);
                        } else if (_.isString(uploadVars.uploadImageCompleteCallback)) {
                            hs.util.dashboardWindowProxy(uploadVars.uploadImageCompleteCallback, [jsonResponse.fileName]);
                        }
                    }
                    if (typeof uploadVars.successCallback === 'undefined') {
                        hs.statusObj.update(translation._("Success"), "success", true);
                    } else {
                        uploadVars.successCallback();
                    }
                } catch (err) {
                    if (typeof uploadVars.errorCallback === 'undefined') {
                        hs.statusObj.update(translation._("An error occurred, please try again"), "error", true);
                    } else {
                        uploadVars.errorCallback();
                    }
                }
            }
        }
    });

    uploader.bind('BeforeUpload', function (upload) {
        if (uploadVars.csrfToken !== null) {
            upload.settings.multipart_params = {csrfToken: hs.csrfToken};
        }
    });

    uploader.init();
};

export default hs.util.initPluploadImageUploader;
