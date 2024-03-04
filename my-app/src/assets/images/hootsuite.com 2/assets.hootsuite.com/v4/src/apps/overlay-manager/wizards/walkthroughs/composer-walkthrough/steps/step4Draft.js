import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import { exitWalkthrough } from 'fe-billing-lib-walkthrough';
import util from 'utils/util';

var selectors = {
    DRAFT_BUTTON: '.vk-SaveAsDraftButton',
};

var onClickDraft = function(e) {
    redirectToDrafts(e.id, e.startDate);
}

var redirectToDrafts = function(draftId, dateQuery) {
    const draftsLink = `#/planner?view=drafts&messageId=${draftId}${dateQuery}`
    util.doRedirect(draftsLink);
    endWalkthrough();
}

var endWalkthrough = function () {
    exitWalkthrough();
    var draftButton = document.querySelector(selectors.DRAFT_BUTTON);
    draftButton && draftButton.removeEventListener('click', onClickDraft);
    hootbus.emit('composer:onboarding:walkthrough:close');
    hootbus.off('full_screen_composer:response:message_success', onClickDraft);
};

var onEnter = function () {
    hootbus.on('full_screen_composer:response:message_success', onClickDraft);
};

var onExit = function () {
    hootbus.emit('composer:onboarding:walkthrough:close');
};

var step4Draft = {
    target: selectors.DRAFT_BUTTON,
    title: translation._('Save a draft'),
    description: translation._('Not ready to publish yet? You can save a draft and review it later.'),
    placement: 'top-end',
    next: translation._('Next'),
    onEnter: onEnter,
    onExit: onExit,
    offset: '0, 12px',
    spotlightPadding: 6,
    spotlightBorderRadius: 0,
    spotlightTargets: [
        {
            target: selectors.DRAFT_BUTTON
        }
    ],
    trackingName: 'step_4_draft'
};

export default step4Draft;
