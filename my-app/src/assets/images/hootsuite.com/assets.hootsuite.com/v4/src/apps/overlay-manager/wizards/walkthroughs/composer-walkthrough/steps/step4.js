import { goToNextStep as goToNextStepAction } from 'fe-billing-lib-walkthrough';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import walkthroughUtils from 'utils/walkthrough';
import darklaunch from 'utils/darklaunch';

var selectors = {
    SCHEDULER_BUTTON: '.vk-SchedulerSelector',
    DATE_TIME_PICKER: '.vk-SingleDateTimePicker',
    SET_DATE_BUTTON: '.vk-SetButton',
    DATE_TIME_CLOSE_BUTTON: '.vk-DateTimeCloseButton',
    MESSAGE_PREVIEW_AREA: '.vk-MessagePreviewArea'
};

var goToNextStep = function () {
    setTimeout(function () {
        goToNextStepAction();
    }, 0);
    removeEventListeners();
};

var removeEventListeners = function () {
    var setDateButton = document.querySelector(selectors.SET_DATE_BUTTON);
    setDateButton && setDateButton.removeEventListener('click', goToNextStep);

    var unsetDateButton = document.querySelector(selectors.DATE_TIME_CLOSE_BUTTON);
    unsetDateButton && unsetDateButton.removeEventListener('click', goToNextStep);
};

var onEnter = function () {
    setTimeout(function () {
        var dateTimePicker = document.querySelector(selectors.DATE_TIME_PICKER);

        if (!dateTimePicker) {
            var scheduleButton = document.querySelector(selectors.SCHEDULER_BUTTON);
            scheduleButton && scheduleButton.click();

            walkthroughUtils.pollForElement(selectors.SET_DATE_BUTTON, function (setDateButton) {
                setDateButton.addEventListener('click', goToNextStep);
            }, 50, 1000);

            walkthroughUtils.pollForElement(selectors.DATE_TIME_CLOSE_BUTTON, function (unsetDateButton) {
                unsetDateButton.addEventListener('click', goToNextStep);
            }, 50, 1000);
        }
    }, 0);
};

var onExit = function () {
    hootbus.emit('composer:onboarding:walkthrough:close');
};


var getTitle = function () {
    let title = translation._('Select date and time')
    
    if(darklaunch.isFeatureEnabled('PGR_882_TIMES_TO_POST_WALKTHROUGH')){
        title = translation._('Schedule your post')
    }

    return title
}

var getDescription = function () {
    let description = translation._('Pick a date and time and we\'ll publish this post for you—even if you\'re in bed, at brunch, or off to the Bahamas.')
    
    if(darklaunch.isFeatureEnabled('PGR_882_TIMES_TO_POST_WALKTHROUGH')){
        description = translation._('Pick a date and time, or select a recommended time, and we\'ll publish this post for you\u2014even if you\'re in bed, at brunch, or off to the Bahamas.')
    }

    return description
}



export default {
    target: selectors.SCHEDULER_BUTTON,
    title: getTitle,
    description: getDescription,
    placement: 'left',
    onEnter: onEnter,
    onExit: onExit,
    offset: '0, 16px',
    spotlightPadding: 8,
    spotlightBorderRadius: 0,
    spotlightTargets: [
        {
            target: selectors.DATE_TIME_PICKER
        },
        {
            target: selectors.MESSAGE_PREVIEW_AREA
        }
    ],
    trackingName: 'step_4_date_time'
};
