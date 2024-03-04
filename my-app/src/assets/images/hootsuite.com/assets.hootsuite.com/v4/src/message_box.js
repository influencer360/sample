import $ from 'jquery';
import _ from 'underscore';
import hootbus from 'hs-nest/lib/utils/hootbus';
import translation from 'utils/translation';
import NetworksConf from 'utils/networks-conf';

import trackerDatalab from 'utils/tracker-datalab';
import darklaunch from 'utils/darklaunch';
import renderBulkComposerOptIn from 'components/publisher/render-bulk-composer-optin-modal/render-bulk-composer-optin-modal';

var HOOTBUS_EVENT_OPEN_COMPOSER = 'composer.open';

import 'utils/status_bar';
import 'utils/button_manager';
import 'fe-vendor-dateformat';
import 'utils/dropdown/jquery.hsdropdown';
import 'profileselector';
import 'messageboxprofileselector';
import 'utils/ajax';
import 'resize';
import 'config';

/**
 * Shows the Bulk Scheduler Dialog
 */
const showBulkScheduleDialog = function () {
    ajaxCall({
        url: "/ajax/scheduler/bulk-schedule-dialog",
        success: function (data) {
            var params = {
                    modal: true,
                    width: 600,
                    closeOnEscape: true,
                    draggable: true,
                    title: translation._("Bulk Schedule Updates"),
                    position: ['center', 50]
                },
                $popup = $.dialogFactory.create('bulkSchedulePopup', params);

            $popup.html(data.output);

            if (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_SHOW_TRY_BUTTON') || (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_SHOW_TRY_BUTTON_BETA') && darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_SHOW_TRY_BUTTON_BETA_PERCENTAGE'))) {
                var buttonText = translation._('Try the new Bulk Composer');
                var bulkComposerButtonHtml = '<div class="_button _tryBulkComposerButton tryBulkComposerButton" onclick="hs.util.recordAction(\'publisherClickedTryBulkComposer\')"><button data-tracking-origin="web.dashboard.publisher_sidebar" data-tracking-action="publisher_tryBulkComposer_clicked" class="btn-cta-med x-green">%s1</button></div>'.replace('%s1', buttonText);
                var $popupTitle = $('#ui-dialog-title-bulkSchedulePopup');
                $popupTitle.addClass('tryBulkComposer');
                $popupTitle.after(bulkComposerButtonHtml);

                $popupTitle.siblings('._tryBulkComposerButton').click(function () {
                    $popupTitle.siblings('._close').click();
                    renderBulkComposerOptIn();
                });
            }

            var networksToFilterOverride = NetworksConf.getExcludedNetworkTypesForComponent('BULK_SCHEDULER', 'COMMON');
            var disabledNetworkTypes = [];

            var ps = new hs.profileSelector($popup.find('._profileSelectorWidget'), {
                filterPostable: true,
                filterOverride: networksToFilterOverride,
                disabledNetworkTypes: disabledNetworkTypes
            });

            $("._profileSelectorWidget").bind('focus', function () {
                setSubmitButtonState(null, true);
            });
            // focus into the profile selector to trigger the multi-twitter network error if applicable
            $popup.find('._profileSelectorWidget').focus();

            ps.bind('change', function () {
                setSubmitButtonState(null, true);
            });

            $popup.find('._bulkScheduleBtn').bind('click', function () {
                if (!darklaunch.isFeatureEnabled('ALLOW_TWITTER_MULTI_POST')) {
                    if ($("#scheduleFileUploadForm ._multipleTwitterWarning").is(':hidden')) {
                        submitBulkScheduleForm();
                    }
                } else {
                    submitBulkScheduleForm();
                }
                return false;
            });

            $popup.find('#scheduleFileUploadForm').bind('keypress', function (e) {
                window.checkForEnterKey(e, '_bulkScheduleBtn');
            }).end();
        }
    }, 'q1');
};

const setSubmitButtonState = function () {
    var $messageBox = $('#scheduleFileUploadForm');
    var $errorTwitterArea = $messageBox.find('._multipleTwitterWarning');
    var $sendMsgBtn =$messageBox.find('._bulkScheduleBtn')
    // Common code for enabling/disabling submit button
    if ((!darklaunch.isFeatureEnabled('ALLOW_TWITTER_MULTI_POST') &&
            hasMoreThanOneTwitterSocialNetwork($messageBox)) ||
        hasFacebookProfileSelected($messageBox)
    ) {
        $sendMsgBtn.addClass('x-disabled');
        $sendMsgBtn.removeClass('x-primary');
        $sendMsgBtn.removeClass('x-standard');
        $sendMsgBtn.attr('disabled', 'disabled');
    } else {
        $sendMsgBtn.removeClass('x-disabled');
        $sendMsgBtn.removeAttr('disabled');
        $sendMsgBtn.addClass('x-primary');
    }
    // Specific UI code for Twitter case
    if (!darklaunch.isFeatureEnabled('ALLOW_TWITTER_MULTI_POST')) {
        if (hasMoreThanOneTwitterSocialNetwork($messageBox)) {
            $errorTwitterArea.css({'display': 'flex'});
        } else {
            $errorTwitterArea.css('display', 'none');
        }
    }
};

const hasMoreThanOneTwitterSocialNetwork = function ($mb) {
    var selected = getSelectedSns($mb);
    var selectedTwitterSns = _.filter(selected.data, function (sn) {
        return (sn.type === 'TWITTER');
    });
    return selectedTwitterSns.length  > 1;
};

const hasFacebookProfileSelected = function ($mb) {
    var selected = getSelectedSns($mb);
    var selectedFacebookSns = _.filter(selected.data, function (sn) {
        return (sn.type === 'FACEBOOK');
    });
    return selectedFacebookSns.length > 0;
};

const getSelectedSns = function (mb) {
    var $messageBox = $(mb),
        $selectProfiles = $messageBox.find('._selectProfiles'),
        ids,
        types,
        data;

    $selectProfiles = $selectProfiles.length ? $selectProfiles : $messageBox.find('._profileSelectorWidget').length ? $messageBox : [];	// for messageBoxes which don't support old and new style, there won't be a ._selectProfiles div, so just use the base message box instead


    $selectProfiles = $selectProfiles.length ? $selectProfiles : $messageBox.parent().find("._selectProfiles"); // for calls made from the hootlet, the selector is actually one level higher

    if ($selectProfiles.length) {		// regular usage of messagebox

        var ps;

        // Check if social network picker has actually been rendered - if not, no social networks are selected
        var $profileSelectorTarget = $selectProfiles.find('._profileSelectorWidget');
        if ($profileSelectorTarget.children().length) {
            ps = new hs.profileSelector($profileSelectorTarget);
            ids = ps.getSelected();
            types = ps.getSelectedTypes();

            // filter out app plugins
            ids = _.filter(ids, function (id) {
                return (id + '').toLowerCase().indexOf("app_") === -1;
            });
            types = _.filter(types, function (type) {
                return type !== "APP";
            });

            data = _.map(ids, function (snId) {
                return hs.socialNetworks[snId];
            });
        } else {
            ids = [];
            types = [];
            data = [];
        }
    } else {	// special case for pre-selected profiles
        var $profiles = $messageBox.find('._imageCheckboxes ._imageLink');
        if ($profiles.length) {
            $profiles.filter('.selected').each(function () {
                var $item = $(this),
                    sn = hs.socialNetworks[$item.find('input').val()];
                ids = ids || [];
                ids.push(sn.socialNetworkId);
                types = types || [];
                types.push(sn.type);
                data = data || [];
                data.push(sn);
            });
        }
    }

    return {
        'ids': ids,
        'types': types,
        'data': data
    };
};

const submitBulkScheduleForm = function () {
    var $form = $('#scheduleFileUploadForm'),
        ps = new hs.profileSelector($form.find('._profileSelectorWidget'));

    var fileName = $form.find('input[name="csvFile"]').val();
    if (_.isEmpty(fileName)) {
        hs.statusObj.update(translation._("Please select a CSV file to upload"), "error", true, 4000);
        return;
    }
    if (!_.isEmpty(fileName) && fileName.indexOf('.') > -1) {
        if (fileName.split('.').pop() != 'csv') {
            hs.statusObj.update(translation._("Incorrect file type. Please select a CSV file"), "error", true, 4000);
            return;
        }
    }

    if (_.isEmpty(ps.getSelected())) {
        hs.statusObj.update(translation._("Please select a social network"), "error", true, 3000);
        return;
    }
    hs.throbberMgrObj.add('._bulkScheduleBtn');
    $form.find('input[name="socialNetworks"]').val(ps.getSelected());
    $form.submit();
};

/**
 * @deprecated
 * Global method should no longer be used to open Composer, replace with Hootbus event:
 * hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, { messageText, socialNetworkId });
 */
window.newActionTweet = function (socialNetworkId, messageText) {
    hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, { messageText, socialNetworkId });

    trackerDatalab.trackCustom('web.dashboard.popup_composer.open_popup_composer', 'popup_composer_opened_popup_composer');
}

export {
    showBulkScheduleDialog,
}
