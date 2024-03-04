import { updateStep } from 'fe-billing-lib-walkthrough';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';

var selectors = {
    MEDIA_PICKER: '.rc-MediaPicker',
    MEDIA_LIBRARY: '.rc-MediaLibrary',
    MEDIA_LIBRARY_BUTTON: '.vk-MediaLibraryToggleButton',
    MEDIA_LIBRARY_OPEN_AREA: '.vk-MediaSelectorLibrary',
    MESSAGE_PREVIEW_AREA: '.vk-MessagePreviewArea',
    MEDIA_ATTACHMENT_AREA: '.rc-MediaAttachmentArea',
    IMAGE_PREVIEW: '.rc-ImagePreview',
    MEDIA_LIBRARY_CLOSE_BUTTON: '.vk-MediaLibraryCloseButton',
};

// STEP 3A

var replaceStepWithB = function () {
    setTimeout(function () {
        updateStep(2, stepB);
        onLeaveA();
    }, 0);
};

var onEnterA = function () {
    setTimeout(function () {
        var openMediaLibraryButton = document.querySelector(selectors.MEDIA_LIBRARY_BUTTON);
        openMediaLibraryButton.addEventListener('click', replaceStepWithB);
        var openMediaLibraryEl = document.querySelector(selectors.MEDIA_LIBRARY_OPEN_AREA);
        openMediaLibraryEl.addEventListener('click', replaceStepWithB);
    }, 0);
};

var getStrForMediaAttachment = function (ifStr, elseStr) {
    var mediaUploadCount;
    try {
        mediaUploadCount = document.querySelector(selectors.MEDIA_ATTACHMENT_AREA).querySelectorAll(selectors.IMAGE_PREVIEW).length;
    } catch (e) {
        mediaUploadCount = 0;
    }
    return (mediaUploadCount > 0) ? ifStr : elseStr;
};

var getTitleA = function () {
    return getStrForMediaAttachment(translation._('Add more media'), translation._('Add media'));
};

var getDescriptionA = function () {
    return getStrForMediaAttachment(
        translation._('Continue to add images or video from your computer, or browse our media library.'),
        translation._('Posts with media get more engagement. You can add an image or video from your computer, or browse our media library.')
    );
};

var onLeaveA = function () {
    setTimeout(function () {
        var openMediaLibraryButton = document.querySelector(selectors.MEDIA_LIBRARY_BUTTON);
        openMediaLibraryButton.removeEventListener('click', replaceStepWithB);
        var openMediaLibraryEl = document.querySelector(selectors.MEDIA_LIBRARY_OPEN_AREA);
        openMediaLibraryEl.removeEventListener('click', replaceStepWithB);
    }, 0);
};

var onExitA = function () {
    onLeaveA();
    hootbus.emit('composer:onboarding:walkthrough:close');
};

var stepA = {
    target: selectors.MEDIA_PICKER,
    title: getTitleA,
    description: getDescriptionA,
    placement: 'top-end',
    onEnter: onEnterA,
    onNext: onLeaveA,
    onPrev: onLeaveA,
    onExit: onExitA,
    offset: '9, 6',
    spotlightPadding: 8,
    spotlightPaddingTop: 0,
    spotlightBorderRadius: 0,
    spotlightTargets: [
        {
            target: selectors.MESSAGE_PREVIEW_AREA
        }
    ],
    trackingName: 'step_3a_upload_media'
};

// STEP 3B

var onEnterB = function () {
    var closeMediaLibButton = document.querySelector(selectors.MEDIA_LIBRARY_CLOSE_BUTTON);
    closeMediaLibButton.addEventListener('click', onExitMediaLibrary);
};

var onExitMediaLibrary = function () {
    var closeMediaLibButton = document.querySelector(selectors.MEDIA_LIBRARY_CLOSE_BUTTON);
    closeMediaLibButton.removeEventListener('click', onExitMediaLibrary);
    updateStep(2, stepA);
};

var onLeaveB = function () {
    setTimeout(function () {
        onExitMediaLibrary();
        var closeMediaLibButton = document.querySelector(selectors.MEDIA_LIBRARY_CLOSE_BUTTON);
        closeMediaLibButton.click();
    }, 0);
};

var onExitB = function () {
    onLeaveB();
    hootbus.emit('composer:onboarding:walkthrough:close');
};

var stepB = {
    target: selectors.MEDIA_LIBRARY,
    title: translation._('Media library'),
    description: translation._('Posts with media get more engagement. You can add an image or video from your computer, or browse our media library.'),
    placement: 'left-start',
    onEnter: onEnterB,
    onNext: onLeaveB,
    onPrev: onLeaveB,
    onExit: onExitB,
    offset: '0, 8px',
    spotlightBorderRadius: 0,
    trackingName: 'step_3b_media_library'
};

export default stepA;
