import hootbus from 'utils/hootbus';
import translation from 'utils/translation';

var selectors = {
    DRAFT_EDITOR_CONTENT: '.public-DraftEditor-content',
    MESSAGE_PREVIEW_AREA: '.vk-MessagePreviewArea',
    MESSAGE_TEXT_AREA: '.vk-MessageTextArea',
    EMOJI_PICKER: '.vk-EmojiMart',
};

var onEnter = function () {
    setTimeout(function () {
        var draftEditor = document.querySelector(selectors.DRAFT_EDITOR_CONTENT);
        draftEditor && draftEditor.focus();
    }, 0);
};

var onExit = function () {
    hootbus.emit('composer:onboarding:walkthrough:close');
};

export default {
    target: selectors.MESSAGE_TEXT_AREA,
    title: translation._('Write your post'),
    description: translation._('Add text, links, and maybe a sprinkling of #hashtags to your post. Then customize it for each social network.'),
    placement: 'top-end',
    onEnter: onEnter,
    onExit: onExit,
    offset: '0, 0',
    spotlightPadding: 8,
    spotlightBorderRadius: 0,
    spotlightTargets: [
        {
            target: selectors.MESSAGE_PREVIEW_AREA,
        },
        {
            target: selectors.EMOJI_PICKER,
            borderRadius: 5,
        }
    ],
    trackingName: 'step_2_write_post'
};
