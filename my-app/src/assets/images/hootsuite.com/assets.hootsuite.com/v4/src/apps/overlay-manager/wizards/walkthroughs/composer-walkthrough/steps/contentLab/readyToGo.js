import { exitWalkthrough } from 'fe-billing-lib-walkthrough';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';

var selectors = {
    SEND_SCHEDULE_BUTTON: '.vk-EditFooterScheduleButton',
    SOCIAL_NETWORK_PICKER_PILL: '.vk-PillWrapper',
    DRAFT_EDITOR_CONTENT: '.public-DraftEditor-content',
    MEDIA_ATTACHMENT_AREA: '.rc-MediaPicker',
    IMAGE_PREVIEW: '.vk-Thumbnail',
    DATE_TIME_CLOSE_BUTTON: '.vk-DateTimeCloseButton',
    EDIT_FOOTER_SCHEDULE_BUTTON: '.vk-EditFooterScheduleButton',
    MESSAGE_PREVIEW_AREA: '.vk-MessagePreviewArea',
};

var isNetworkSelected = function () {
    return document.querySelectorAll(selectors.SOCIAL_NETWORK_PICKER_PILL).length > 0;
};

var isTextAdded = function () {
    var textBox = document.querySelector(selectors.DRAFT_EDITOR_CONTENT);
    if (textBox) {
        // an empty textbox has an innerText length of 1
        return textBox.innerText && textBox.innerText.length > 1;
    }
    return false;
};

var isMediaAdded = function () {
    try {
        return document.querySelector(selectors.MEDIA_ATTACHMENT_AREA).querySelectorAll(selectors.IMAGE_PREVIEW).length > 0;
    } catch (e) {
        return false;
    }
};

var isPostScheduled = function () {
    return !!document.querySelector(selectors.DATE_TIME_CLOSE_BUTTON);
};

var getStatuses = function () {
    return [isPostScheduled(), isNetworkSelected(), isTextAdded(), isMediaAdded()];
};

var getTitle = function () {
    var statuses = getStatuses();
    switch (statuses.toString()) {
        // Post now
        case [false, true, true, true].toString():
            return translation._('Ready to post?');
        case [false, true, true, false].toString():
            return translation._('Publish without media?');
        case [false, true, false, false].toString():
            return translation._('Almost ready to publish...');
        case [false, true, false, true].toString():
            return translation._('Almost ready to publish...');
        case [false, false, true, true].toString():
            return translation._('Almost ready to publish...');
        case [false, false, true, false].toString():
            return translation._('Almost ready to publish...');
        case [false, false, false, true].toString():
            return translation._('Almost ready to publish...');
        case [false, false, false, false].toString():
            return translation._('Not quite ready to publish...');
          // Scheduled
        case [true, true, true, true].toString():
            return translation._('Ready to schedule?');
        case [true, true, true, false].toString():
            return translation._('Schedule post without media?');
        case [true, true, false, false].toString():
            return translation._('Almost ready to schedule...');
        case [true, true, false, true].toString():
            return translation._('Almost ready to schedule...');
        case [true, false, true, true].toString():
            return translation._('Almost ready to schedule...');
        case [true, false, true, false].toString():
            return translation._('Almost ready to schedule...');
        case [true, false, false, true].toString():
            return translation._('Almost ready to schedule...');
        case [true, false, false, false].toString():
            return translation._('Not quite ready to schedule...');
    }
};

var getDescription = function () {
    var statuses = getStatuses();
    switch (statuses.toString()) {
        // Post now
        case [false, true, true, true].toString():
            return translation._('Once you’ve customized the text in brackets and added your own image, you’re ready to go!');
        case [false, true, true, false].toString():
            return translation._('%1$s, we noticed your post doesn’t have any media. As long as that’s ok with you, you’re ready to publish!').replace('%1$s', hs.memberName);
        case [false, true, false, false].toString():
            return translation._('Add text and/or media to your post and you’ll be ready to publish it.');
        case [false, true, false, true].toString():
            return translation._('Add text and/or media to your post and you’ll be ready to publish it.');
        case [false, false, true, true].toString():
            return translation._('Select a social account to publish to, and then you’ll be ready to publish your post.');
        case [false, false, true, false].toString():
            return translation._('Select a social account to publish to, and then you’ll be ready to publish your post.');
            case [false, false, false, true].toString():
            return translation._('Select a social account to publish to and add some text and/or media to your post. Then you’ll be ready to publish.');
        case [false, false, false, false].toString():
            return translation._('Select a social account to publish to and add some text and/or media to your post. Then you’ll be ready to publish.');

        // Scheduled
        case [true, true, true, true].toString():
            return translation._('Once you’ve customized the text in brackets and added your own image, you’re ready! ');
        case [true, true, true, false].toString():
            return translation._('%1$s, we noticed your post doesn’t have any media. As long as that’s ok with you, your’re ready to schedule your post!').replace('%1$s', hs.memberName);
        case [true, true, false, false].toString():
            return translation._('Add text and/or media to your post and you’ll be ready to schedule it.');
        case [true, true, false, true].toString():
            return translation._('Add text and/or media to your post and you’ll be ready to schedule it.');
        case [true, false, true, true].toString():
            return translation._('Select a social account to publish to, and then you’lll be ready to schedule your post.');
        case [true, false, true, false].toString():
            return translation._('Select a social account to publish to, and then you’lll be ready to schedule your post.');
        case [true, false, false, true].toString():
            return translation._('Select a social account to publish to and add some text and/or media to your post. Then you’ll be ready to schedule it.');
        case [true, false, false, false].toString():
            return translation._('Select a social account to publish to and add some text and/or media to your post. Then you’ll be ready to schedule it.');
    }
};

var endWalkthrough = function () {
    exitWalkthrough();
    var postButton = document.querySelector(selectors.EDIT_FOOTER_SCHEDULE_BUTTON);
    postButton && postButton.removeEventListener('click', endWalkthrough);
    hootbus.emit('composer:onboarding:walkthrough:close');
};

var onEnter = function () {
    var postButton = document.querySelector(selectors.EDIT_FOOTER_SCHEDULE_BUTTON);
    postButton && postButton.addEventListener('click', endWalkthrough);
};

var onExit = function () {
    hootbus.emit('composer:onboarding:walkthrough:close');
};

var step5 = {
    target: selectors.SEND_SCHEDULE_BUTTON,
    title: getTitle,
    description: getDescription,
    placement: 'top-end',
    hideExit: true,
    next: translation._('Exit'),
    onEnter: onEnter,
    onExit: onExit,
    onNext: endWalkthrough,
    offset: '0, 12px',
    spotlightPadding: 6,
    spotlightBorderRadius: 0,
    spotlightTargets: [
        {
            target: selectors.MESSAGE_PREVIEW_AREA
        }
    ],
    trackingName: 'step_5_publish_schedule'
};

export default step5;
