import _ from 'underscore';
import $ from 'jquery';
import AssetEditPopup from 'publisher/views/popups/asset_edit';
import trackerDatalab from 'utils/tracker-datalab';
import translation from 'utils/translation';

export default AssetEditPopup.extend({
    params: {
        customOverlay: true,
        width: 450,
        height: 400,
    },
    text: {
        popupTitle: translation._("New Asset"),
        success: translation._("Successfully created")
    },
    popupId: 'createAsset',
    template: 'publisher/content-library/createitem',
    events: {
        'click ._assetAvailability': 'handleAssetAvailabilityChange',
        'click ._cancel': 'onCancelClick',
        'click ._save': 'onSaveClick'
    },

    initialize: function () {
        AssetEditPopup.prototype.initialize.call(this);

        if (!_.isFunction(this.options.callback)) {
            this.options.callback = function () {
            };
        }

        _.bindAll(this, 'onLibrarySelected', 'createTaglist');
    },

    onRender: function () {
        AssetEditPopup.prototype.onRender.call(this);
        
        // setup library selection dropdown
        if (this.options.libraryCollection) {

            // Set content library items for dropdown
            var dropdownItems = this.options.libraryCollection.map(function (library) {
                return {
                    title: library.get('name'),
                    libraryId: library.id,
                    bucketId: library.get('bucketId')
                };
            });

            // Create dropdown
            this.$('._librarySelectBtn').hsDropdown({
                data: {
                    items: dropdownItems
                },
                change: this.onLibrarySelected
            });
        }

        this.handleStartDateChange = _.bind(this.handleStartDateChange, this);
        this.handleExpiresDateChange = _.bind(this.handleExpiresDateChange, this);

        // DatePickers
        var $startDatePicker = this.$('._dateRangePickerStart');
        $startDatePicker.on('input change', this.handleStartDateChange);

        var $expiryDatePicker = this.$('._dateRangePickerExpiry');
        $expiryDatePicker.on('input change', this.handleExpiresDateChange);
        
        // update focus to the first element of the form
        $('._librarySelectBtn').trigger('focus');

        return this;
    },

    onLibrarySelected: function (element) {
        // Set selected library
        this.options.libraryCollection.setSelectedById(element.libraryId);

        // Create new tag list
        this.createTaglist();
        trackerDatalab.trackCustom('web.content_library.asset_create_actions', 'library_selected');
    },

    onCancelClick: function () {
        trackerDatalab.trackCustom('web.content_library.asset_create_actions', 'cancel_clicked');
        // close popup
        this.close();
    },

    onSaveClick: function () {
        // we want to just return the data to the callback
        var startTimestampUTC = null;
        var expiryTimestampUTC = null;
        var selectedLib;
        var $tagWidget;
        var params;

        if (this.setAvailabilityRestrictions) {
            if (!this.startDate && !this.expiryDate) {
                hs.statusObj.update(translation._("Please add a date restriction or select 'No restrictions' for asset availability"), 'error', true);
                return;
            }
            if (this.dateError) {
                hs.statusObj.update(translation._(this.dateErrorText), 'error', true);
                return;
            }

            if (this.startDate) {
                startTimestampUTC = this.startDate.toUTCString();
                // Tracking for if non-default start date is set
                trackerDatalab.trackCustom('web.content_library.asset_create_actions', 'start_date_saved');
            }
            if (this.expiryDate) {
                expiryTimestampUTC = this.expiryDate.toUTCString();
                // Tracking for if non-default expiry date is set
                trackerDatalab.trackCustom('web.content_library.asset_create_actions', 'expiry_date_saved');
            }
        }

        // Get selected content library
        selectedLib = this.$('._librarySelectBtn').hsDropdown('selectedElement');
        if (!selectedLib || !selectedLib.bucketId) {
            hs.statusObj.update(translation._("Please select a Content Library"), 'error', true);
            return;
        }

        // Get selected tags
        $tagWidget = this.$('._tagWidgetContainer');
        var tags = $tagWidget.hsTagSelector('tags');
        tags = _.pluck(tags, 'label');

        params = {
            name: this.$('._assetName').val(),
            description: this.$('._assetDesc').val(),
            contentLibraryId: selectedLib.libraryId,
            bucketId: selectedLib.bucketId,
            tags: tags
        };

        if (startTimestampUTC) {
            params['startDate'] = startTimestampUTC;
        }

        if (expiryTimestampUTC) {
            params['expiryDate'] = expiryTimestampUTC;
        }


        // return params to callback
        this.options.callback(params);

        // close popup
        this.close();
    },

    createTaglist: function (contentLibraryModel) {

        var self = this;

        // Get selected content library model
        contentLibraryModel = this.options.libraryCollection.getSelected();

        // Get widget container
        var $tagWidgetContainer = this.$('._tagWidgetContainer');

        // Get assigned tags
        var tags = $tagWidgetContainer.hsTagSelector('tags');
        tags = _.pluck(tags, 'label');

        // Set content library tags ready for tag selector
        var contentLibraryTags = _.map(contentLibraryModel.get('tags'), function (tag) {
            return {
                label: tag,
                value: tag
            };
        });

        // Create tag selector
        $tagWidgetContainer.hsTagSelector({
            placeholderText: translation._("Filter by tag"),
            tags: contentLibraryTags,
            canCreate: true,
            canDelete: false,
            create: _.bind(self.tagCreate, self)
        });

        // Set previously selected tags
        if (tags) {
            $tagWidgetContainer.hsTagSelector('addTags', tags);
        }

    },

    tagCreate: function (tag, createCallback) {
        // Tag is created, add to user tags
        // NOTE: a tag is defined by: {label: 'myLabel', value: someValue}
        // ------------------------------

        // Create Tag
        var newTag = {
            label: tag,
            value: tag
        };

        // Create tag in dropdown
        createCallback(newTag);
    },

    handleAssetAvailabilityChange: function (e) {
        if (e.currentTarget.value === 'setRestrictions') {
            this.setAvailabilityRestrictions = true;
            $('._assetAvailabilityDates').show();
            trackerDatalab.trackCustom('web.content_library.asset_create_actions', 'set_time_frame_clicked');
        } else {
            this.setAvailabilityRestrictions = false;
            $('._assetAvailabilityDates').hide();
        }
    },

    handleStartDateChange: function (e) {
        if (!e.currentTarget.value) {
            this.startDate = undefined;
            this.validateDates();
            return;
        }

        const date = new Date(e.currentTarget.value);
        this.startDate = date;
        this.validateDates();
        trackerDatalab.trackCustom('web.content_library.asset_create_actions', 'start_date_changed');
    },

    handleExpiresDateChange: function (e) {
        if (!e.currentTarget.value) {
            this.expiryDate = undefined;
            this.validateDates();
            return;
        }

        const date = new Date(e.currentTarget.value);
        this.expiryDate = date;
        this.validateDates();
        trackerDatalab.trackCustom('web.content_library.asset_upload_actions', 'expiry_date_changed');
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
    }
});
