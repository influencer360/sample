import cookieUtil from 'utils/cookie';
import trackerDatalab from 'utils/tracker-datalab';
import darklaunch from 'utils/darklaunch';

import getHsAppPublisher from 'components/publisher/get-hs-app-publisher';

var optIn = {};

optIn.optIn = function (featureCode, trackingAction) {
    cookieUtil.create(featureCode, '1', 365);
    trackerDatalab.trackCustom('web.dashboard.feature', trackingAction);
};

optIn.optOut = function (featureCode, trackingAction) {
    cookieUtil.remove(featureCode);
    trackerDatalab.trackCustom('web.dashboard.feature', trackingAction);
};

optIn.bulkComposerOptIn = function () {
    if (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_REMOVE_BETA')) {
        trackerDatalab.trackCustom('web.dashboard.feature', 'bulk_composer_opt_in');
        
        getHsAppPublisher().then(function (publisher) {
            this.publisherSettingsService = new publisher.PublisherSettingsService();
            this.publisherSettingsService.setPublisherSetting('isUsingOldBulkComposer', false).then(function () {
                hs.memberExtras.publisherSettings.isUsingOldBulkComposer = false;

                if (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_SHOW_TRY_BUTTON') || (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_SHOW_TRY_BUTTON_BETA') && darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_SHOW_TRY_BUTTON_BETA_PERCENTAGE'))) {
                    // this ensures that when a user Opts out of the new BC they only have the Try button to opt-back in if the darklaunches for the try BC button are turned on
                    var $tryBulkComposerButton = $('._tryBulkComposerButton');

                    $tryBulkComposerButton.hide();
                }
                var $oldBulkUploadDialogButton = $('._showBulkScheduleDialogBtn');
                var $bulkComposerButton = $('._bulkComposerButton');

                $oldBulkUploadDialogButton.hide();
                $bulkComposerButton.show();
            });
        });
    } else {
        optIn.optIn('PUB_BULK_COMPOSER', 'bulk_composer_opt_in');

        var $tryBulkComposerButton = $('._tryBulkComposerButton');
        var $oldBulkUploadDialogButton = $('._showBulkScheduleDialogBtn');
        var $bulkComposerButton = $('._bulkComposerButton');

        $tryBulkComposerButton.hide();
        $oldBulkUploadDialogButton.hide();
        $bulkComposerButton.show();
    }
};

optIn.bulkComposerOptOut = function () {
    if (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_REMOVE_BETA')) {
        trackerDatalab.trackCustom('web.dashboard.feature', 'bulk_composer_opt_out');
        
        getHsAppPublisher().then(function (publisher) {
            this.publisherSettingsService = new publisher.PublisherSettingsService();
            this.publisherSettingsService.setPublisherSetting('isUsingOldBulkComposer', true).then(function () {
                hs.memberExtras.publisherSettings.isUsingOldBulkComposer = true;
                if (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_SHOW_TRY_BUTTON') || (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_SHOW_TRY_BUTTON_BETA') && darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_SHOW_TRY_BUTTON_BETA_PERCENTAGE'))) {
                    // this ensures that when a user Opts out of the new BC they only have the Try button to opt-back in if the darklaunches for the try BC button are turned on
                    var $tryBulkComposerButton = $('._tryBulkComposerButton');

                    $tryBulkComposerButton.show();
                }
                var $oldBulkUploadDialogButton = $('._showBulkScheduleDialogBtn');
                var $bulkComposerButton = $('._bulkComposerButton');

                $oldBulkUploadDialogButton.show();
                $bulkComposerButton.hide();
            });
        });
    } else {
        optIn.optOut('PUB_BULK_COMPOSER', 'bulk_composer_opt_out');

        var $tryBulkComposerButton = $('._tryBulkComposerButton');
        var $oldBulkUploadDialogButton = $('._showBulkScheduleDialogBtn');
        var $bulkComposerButton = $('._bulkComposerButton');

        $tryBulkComposerButton.show();
        $oldBulkUploadDialogButton.show();
        $bulkComposerButton.hide();
    }
};

export default optIn;
