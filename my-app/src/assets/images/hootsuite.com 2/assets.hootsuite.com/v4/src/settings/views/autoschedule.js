import _ from 'underscore';
import hootbus from 'utils/hootbus';
import BaseView from 'utils/backbone/base-view';
import { getApp } from 'fe-lib-async-app';
import trackerDatalab from 'utils/tracker-datalab';
import translation from 'utils/translation';


/**
 * @class AutoScheduleView
 * Backbone Base View that controls the auto schedule settings
 *
 * @author - Chris Noble @noblezilla, Andrew Draper @andrewdraper
 * Copyright (C) 2014  HootSuite Media
 */
const AutoScheduleView = BaseView.extend({

    template: 'settings/autoschedule',

    events: {
        'click .autoschedule-day': 'toggleDay',
        'click ._submitAuto': 'saveSettings',
        'change select[name=autoschedule-from-time]': 'checkFromTime',
        'change select[name=autoschedule-to-time]': 'checkToTime',
        'change select[name=autoschedule-posts-per-day]': 'trackNumPosts'
    },

    autoScheduleSettings: null,
    /**
     * initialize
     * Constructor for IQApp
     * Grabs the member settings and if none are found then it will show the first run screen
     * If member settings are found, then it will show the content view
     */
    initialize: function (options) {

        _.bindAll(this, 'saveSettings', "checkFromTime", 'checkToTime', 'trackNumPosts');

        if (options !== undefined && options.settings !== undefined) {
            this.autoScheduleSettings = options.settings;
        }

        hs.trackEvent({
            category: 'autoschedule',
            action: 'view',
            label: 'Settings'
        });
    },

    /**
     * trackNumPosts
     * Tracks the number of posts per day select box
     * @param event - jQuery Event
     */
    trackNumPosts: function () {
        hs.trackEvent({
            category: 'autoschedule',
            action: 'change',
            label: 'Num Posts'
        });
    },


    render: function () {
        BaseView.prototype.render.apply(this, arguments);
        return this;
    },

    /**
     * Get the data for a template
     * @returns {Object}
     */
    getTmplData: function () {
        var data = {};
        if (this.autoScheduleSettings !== null) {
            data.setting = this.autoScheduleSettings.toJSON();
        }
        return data;
    },

    /**
     * Toggle the state of the clicked on day from inactive to active and vice versa
     **/

    toggleDay: function (e) {
        if ($(e.currentTarget).hasClass("autoschedule-day-inactive")) {
            hs.trackEvent({
                category: 'autoschedule',
                action: 'click',
                label: 'Day Active'
            });
            $(e.currentTarget).removeClass("autoschedule-day-inactive").addClass("autoschedule-day-active");
        } else {
            hs.trackEvent({
                category: 'autoschedule',
                action: 'click',
                label: 'Day Inactive'
            });
            $(e.currentTarget).removeClass("autoschedule-day-active").addClass("autoschedule-day-inactive");
        }
    },

    /**
     * saveSettings
     * Saves the settings back to the server
     * @param event - jQuery Event
     **/
    saveSettings: function () {
        hs.trackEvent({
            category: 'autoschedule',
            action: 'click',
            label: 'Save'
        });
        trackerDatalab.trackCustom('web.dashboard.accounts_and_settings', 'autoschedule_settings_saved');
        var that = this;
        //Get the values
        var postPerDay = this.$('#autoschedule-posts-per-day').val();

        var startTime = this.$('#autoschedule-from-time').val();
        //Make sure we are sending seconds
        startTime = startTime * 3600;

        var endTime = this.$('#autoschedule-to-time').val();
        //Make sure we are sending seconds
        endTime = endTime * 3600;

        //Go through each day find if it is active or not
        var days = this.autoScheduleSettings.get('days');
        var hasActiveDay = false;
        _.each(days, function (dayValue, day) {
            var $elem = that.$("[data-day='" + day + "']");
            var active = $elem.hasClass('autoschedule-day-active');
            that.autoScheduleSettings.get('days')[day] = active;
            //Check to make sure that there is at least one active day
            if (active) {
                hasActiveDay = true;
            }
        });

        //Guard against no days selected
        if (!hasActiveDay) {
            hs.statusObj.update(translation._("Please select at least one day"), 'error', true);
            return;
        }


        this.autoScheduleSettings.set('postsPerDay', postPerDay);
        this.autoScheduleSettings.set('startTime', startTime);
        this.autoScheduleSettings.set('endTime', endTime);

        hs.throbberMgrObj.add("#settingsContent ._submitAuto");
        this.autoScheduleSettings.save(null, {
            success: function (model) {
                hs.statusObj.update(translation._("AutoSchedule Settings Updated"), 'success', true);
                hs.throbberMgrObj.remove("#settingsContent ._submitAuto");
                hs.memberExtras.autoScheduleSettings = model.attributes;
                hootbus.emit('settings:autoschedule:change', model);
                //User may be saving from within New Compose so we need to call back to update values there
                getApp('hs-app-composer').then(function (composerApp) {
                    composerApp.AutoScheduleSettings.setSettings(model.attributes, hs.memberId);
                });
            },
            'error': function (_model) {
                hs.statusObj.update(translation._("Problem saving your AutoSchedule settings"), 'error', true);
                hs.throbberMgrObj.remove("#settingsContent ._submitAuto");
            }
        });
    },

    /**
     * checkFromTime
     * Checks the from time and ensures the to time only has times ahead of the from time
     */
    checkFromTime: function (_e) {
        hs.trackEvent({
            category: 'autoschedule',
            action: 'change',
            label: 'From Time'
        });
        var fromTime = parseInt(this.$("select[name=autoschedule-from-time]").val(), 10) + 1;
        var toTime = parseInt(this.$("select[name=autoschedule-to-time]").val(), 10);
        var toOptions = '';

        if (fromTime == 24) {
            toOptions = '<option value="24">12 AM</option>';
        } else {

            for (var i = fromTime; i <= 24; i++) {
                var timeToDisplay;
                if (i === 0) {
                    timeToDisplay = '12 AM';
                }
                else if (i < 12) {
                    timeToDisplay = i + ' AM';
                }
                else if (i == 12) {
                    timeToDisplay = "12 PM";
                }
                else if (i > 12 && i < 24) {
                    timeToDisplay = (i - 12) + ' PM';
                }
                else if (i == 24) {
                    timeToDisplay = '12 AM';
                }

                toOptions += '<option value="' + i + '">' + timeToDisplay + '</option>';
            }

        }

        $("select[name=autoschedule-to-time]").html(toOptions);

        if (toTime <= fromTime) {
            $("select[name=autoschedule-to-time]").val(fromTime);
        } else {
            $("select[name=autoschedule-to-time]").val(toTime);
        }
    },

    /**
     * checkToTime
     * Checks the to time and ensures the from time only has times behind the to time
     */
    checkToTime: function (_e) {
        hs.trackEvent({
            category: 'autoschedule',
            action: 'change',
            label: 'To Time'
        });
        var fromTime = parseInt(this.$("select[name=autoschedule-from-time]").val(), 10);
        var toTime = parseInt(this.$("select[name=autoschedule-to-time]").val(), 10) - 1;
        var fromOptions = '';

        if (toTime === 0) {
            fromOptions = '<option value="24">12 AM</option>';
        } else {

            for (var i = 0; i <= toTime; i++) {
                var timeToDisplay;
                if (i === 0) {
                    timeToDisplay = '12 AM';
                } else if (i < 12) {
                    timeToDisplay = i + ' AM';
                } else if (i == 12) {
                    timeToDisplay = "12 PM";
                } else if (i > 12 && i < 24) {
                    timeToDisplay = (i - 12) + ' PM';
                } else if (i == 24) {
                    timeToDisplay = '12 AM';
                }

                fromOptions += '<option value="' + i + '">' + timeToDisplay + '</option>';
            }

        }

        this.$("select[name=autoschedule-from-time]").html(fromOptions);

        if (toTime <= fromTime) {
            this.$("select[name=autoschedule-from-time]").val(toTime);
        } else {
            this.$("select[name=autoschedule-from-time]").val(fromTime);
        }
    }


});

export default AutoScheduleView;
