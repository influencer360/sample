import _ from 'underscore';
import $ from 'jquery';
import BasePopup from 'utils/dialogs/base';
import trackerDatalab from 'utils/tracker-datalab';
import translation from 'utils/translation';

export default BasePopup.extend({
    text: {
        popupTitle: translation._("Edit Asset"),
        editSuccess: translation._("Asset successfully updated")
    },
    popupId: 'editAsset',
    params: {
        width: 450,
        height: 400,
    },
    template: 'publisher/content-library/editItem',
    events: {
        'click ._save': 'onSaveClick',
        'click ._assetAvailability': 'handleAssetAvailabilityChange'
    },

    onRender: function () {
        // Get all user created tags in the current content library
        var currentTags = this.options.library ? this.options.library.get('tags') : [];
        var contentLibraryTags = _.map(currentTags, function (tag) {
            return {
                label: tag,
                value: tag
            };
        });

        // Get tag widget container
        var $tagWidgetContainer = this.$('._tagWidgetContainer');
        $tagWidgetContainer.hsTagSelector({
            tags: contentLibraryTags,
            canCreate: true,
            canDelete: false,
            create: function (tag, createCallback) {
                var newTag = {
                    label: tag,
                    value: tag
                };

                // Create tag in dropdown
                createCallback(newTag);
            }
        });

        // Get  user tags assigned to the current asset
        var assetTags = this.model.get('tags');
        if (assetTags) {
            $tagWidgetContainer.hsTagSelector('addTags', assetTags);
        }

        // Must set date/time picker values here, can't do it in template
        var data = this.model.toJSON();
        this.handleStartDateChange = _.bind(this.handleStartDateChange, this);
        this.handleExpiresDateChange = _.bind(this.handleExpiresDateChange, this);

        // DatePickers
        var $startDatePicker = this.$('._dateRangePickerStart');
        this.$startDatePicker = $startDatePicker;
        $startDatePicker.on('input change', this.handleStartDateChange);

        var $expiryDatePicker = this.$('._dateRangePickerExpiry');
        this.$expiryDatePicker = $expiryDatePicker;
        $expiryDatePicker.on('input change', this.handleExpiresDateChange);

        // Set if values already exist
        if (data.startDate) {
            this.hasInitialRestrictions = true;
            this.startDate = new Date(data.startDate);
            $startDatePicker.val(this.toDatetimeLocal(new Date(data.startDate)))
        }

        if (data.expiryDate) {
            this.hasInitialRestrictions = true;
            this.expiryDate = new Date(data.expiryDate);
            $expiryDatePicker.val(this.toDatetimeLocal(new Date(data.expiryDate)))
        }

        if (this.expiryDate || this.startDate) {
            this.$('input._assetAvailability[value=setRestrictions]').attr('checked', true);
            this.setAvailabilityRestrictions = true;
            $('._assetAvailabilityDates').show();
        }

        if (this.hasInitialRestrictions) {
            this.$('input._assetAvailability[value=pauseAvailability]').closest('.-formElement').show();
        }

        if (data.isPaused) {
            this.$('input._assetAvailability[value=pauseAvailability]').attr('checked', true);
            this.disableAvailabilitySection();
        }

        return this;
    },

    /**
     *
     * @returns {Object}
     */
    getTmplData: function () {
        var data = this.model.toJSON();
        return data;
    },

    onSaveClick: function () {
        var self = this;
        var params;
        var startTimestampUTC = null;
        var expiryTimestampUTC = null;

        if (this.setAvailabilityRestrictions) {
            if (!this.startDate) {
                // default to startDate = now
                this.startDate = new Date();
            } else {
                // Tracking for if non-default start date is set
                trackerDatalab.trackCustom('web.content_library.asset_edit_actions', 'start_date_saved');
            }

            if (this.dateError) {
                hs.statusObj.update(translation._(this.dateErrorText), 'error', true);
                return;
            }

            if (this.startDate) {
                startTimestampUTC = this.startDate.toUTCString();
            }
            if (this.expiryDate) {
                expiryTimestampUTC = this.expiryDate.toUTCString();
                // Tracking for if non-default expiry date is set
                trackerDatalab.trackCustom('web.content_library.asset_edit_actions', 'expiry_date_saved');
            }
        }

        // Get tag widget container
        var $tagWidgetContainer = this.$('._tagWidgetContainer');

        // Get assigned tags
        var tags = $tagWidgetContainer.hsTagSelector('tags');
        var assetTags = _.pluck(tags, 'label');

        // Update Content Library tags
        var contentLibraryTags = this.options.library.get('tags');
        var newTagsToSave = _.isArray(contentLibraryTags) ? contentLibraryTags.slice() : [];     // make a copy of the tags
        // Add new tags
        _.each(assetTags, function (tag) {
            newTagsToSave.push(tag);
        });
        newTagsToSave = _.uniq(newTagsToSave);

        var isPaused = $('input._assetAvailability[value=pauseAvailability]').attr('checked') ? true : false;

        // Update tags in content library model
        this.options.library.set('tags', newTagsToSave);

        params = {
            name: this.$('._assetName').val(),
            description: this.$('._assetDesc').val(),
            contentLibraryId: this.model.getContentLibraryId(),
            assetId: this.model.id,
            tags: assetTags,
            isPaused: isPaused
        };

        if (startTimestampUTC) {
            params['startDate'] = startTimestampUTC;
        }

        if (expiryTimestampUTC) {
            params['expiryDate'] = expiryTimestampUTC;
        }

        _.bindAll(this, 'onEditSuccess');
        ajaxCall({
            url: "/ajax/content-library/asset-edit",
            data: params,
            success: self.onEditSuccess,
            abort: function () {
                hs.statusObj.reset();
            }
        }, 'q1');
    },

    onEditSuccess: function (data) {
        this.release();
        if (data.success) {
            this.remove();
            // Update library asset model with info from database
            // Result from CL doesn't include disposition
            // We want to save the previous state (because it remains the same)
            var previousDisp = this.model.get('disposition');
            this.model.set(data.result, {silent: true});
            this.model.set('disposition', previousDisp);

            // trigger a re-render once so correct preapproval status appears
            this.model.trigger('change:description');
            hs.statusObj.update(this.text.editSuccess, 'success', true);
        } else if (data.errors) {
            var error;
            if (data.errors && data.errors.teams) {
                error = data.errors.teams;
            } else {
                error = data.errors[0];
            }

            hs.statusObj.update(error, 'error', true);
        }
    },

    disableAvailabilitySection: function () {
        // datepicker
        this.$startDatePicker.attr('disabled', true);
        this.$expiryDatePicker.attr('disabled', true);

        // add class to text
        this.$('._assetAvailabilityDates').addClass('disabled');
    },

    enableAvailabilitySection: function () {
        // datepicker
        this.$startDatePicker.attr('disabled', false);
        this.$expiryDatePicker.attr('disabled', false);

        // remove class from text
        this.$('._assetAvailabilityDates').removeClass('disabled');
    },

    handleAssetAvailabilityChange: function (e) {
        if (e.currentTarget.value === 'setRestrictions') {
            this.setAvailabilityRestrictions = true;
            this.enableAvailabilitySection();
            $('._assetAvailabilityDates').show();
        } else if (e.currentTarget.value === 'pauseAvailability') {
            this.setAvailabilityRestrictions = true;
            this.disableAvailabilitySection();
            $('._assetAvailabilityDates').show();
            trackerDatalab.trackCustom('web.content_library.asset_edit_actions', 'set_time_frame_clicked');
        } else {
            this.setAvailabilityRestrictions = false;
            $('._assetAvailabilityDates').hide();
        }
    },

    handleStartDateChange: function (e) {
        // if no startDate is chosen, default to immediately
        if (!e.currentTarget.value) {
            this.startDate = new Date();
            this.validateDates();
            return;
        }

        const date = new Date(e.currentTarget.value);
        if (this.isValidDate(date)) {
            this.startDate = date;
        }

        this.validateDates();
        trackerDatalab.trackCustom('web.content_library.asset_edit_actions', 'start_date_changed');
    },

    handleExpiresDateChange: function (e) {
        // if no expiryDate is chosen, default to never
        if (!e.currentTarget.value) {
            this.expiryDate = undefined;
            this.validateDates();
            return;
        }

        const date = new Date(e.currentTarget.value);
        if (this.isValidDate(date)) {
            this.expiryDate = date;
        }

        this.validateDates();
        trackerDatalab.trackCustom('web.content_library.asset_edit_actions', 'expiry_date_changed');
    },

    validateDates: function () {
        var today = new Date();
        if (this.startDate > this.expiryDate) {
            this.dateError = true;
            this.dateErrorText = translation._('Please ensure Expiry date comes after Availability date');
            $('._availabilityDateError').html(translation._('* Expiry date must come after the Availability date'));
        } else if (this.expiryDate < today) {
            this.dateError = false;
            $('._availabilityDateError').html(translation._('* Warning: this asset has an expiry date in the past'));
        } else {
            this.dateError = false;
            $('._availabilityDateError').html('');
        }
    },

    isValidDate: function (date) {
        return (date instanceof Date) && !isNaN(date.getTime());
    },

    toDatetimeLocal: function (date) {
        // Transform a Date object into a string that datetime inputs can accept
        const
          ten = function (i) {
            return (i < 10 ? '0' : '') + i;
          },
          YYYY = date.getFullYear(),
          MM = ten(date.getMonth() + 1),
          DD = ten(date.getDate()),
          HH = ten(date.getHours()),
          II = ten(date.getMinutes()),
          SS = ten(date.getSeconds())
        ;
        return YYYY + '-' + MM + '-' + DD + 'T' +
                 HH + ':' + II + ':' + SS;
      }
});
