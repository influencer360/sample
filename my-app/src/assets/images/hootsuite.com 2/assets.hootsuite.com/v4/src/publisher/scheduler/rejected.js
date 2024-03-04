import $ from 'jquery';
import _ from 'underscore';
import messagePreScreen from 'publisher/scheduler/messages/pre-screen';
import schedulerUtil from 'publisher/scheduler/util';
import 'utils/hs_ejs';

/**
 *
 * @param preScreenMessages
 */
var insertUnscheduledNonGroupedMessages = function (preScreenMessages) {
    var $itemList = $("#schedulerSection ._unscheduledApprovalSec ._itemList");

    var html = '';
    $.each(preScreenMessages, function (i, preScreen) {
        //if approval already exists then don't create again
        if ($("._unscheduledMessage._preScreen_" + preScreen._id).length === 0) {
            html += messagePreScreen.renderNonGroup(preScreen);
        }
    });

    if (html !== '') {
        $itemList.append(html);
    }
};

/**
 *
 * @param groups
 */
var insertUnscheduledGroupedMessages = function (groups) {
    var $itemList = $("#schedulerSection ._unscheduledApprovalSec ._itemList");

    var html = '';
    $.each(groups, function (groupHash, group) {
        //if group already exists then don't create again
        if ($("._unscheduledMessage._grouped._preScreen_" + groupHash).length === 0) {
            html += messagePreScreen.renderGroup(groupHash, group);
        }
    });

    if (html !== '') {
        $itemList.append(html);
    }
};

/**
 *
 * @type {{load: Function, insert: Function, remove: Function}}
 */
var rejected = {
    /**
     * Load unscheduled rejected and pending/retry MessagePreScreen records
     */
    load: function () {
        var self = this;

        //if no social network, then just do nothing
        if (!_.keys(hs.socialNetworks).length) {
            return;
        }
        var $scheduler = $("#schedulerSection"),
            query = schedulerUtil.collectSearchQuery();

        var q = $.param(query);

        ajaxCall({
            type: 'GET',
            url: "/ajax/scheduler/unscheduled-pre-screens?" + q,
            success: function (data) {
                var $unScheduledSec = $scheduler.find("._unscheduledApprovalSec");
                if (data.hasResult) {
                    //always reload the whole list
                    $unScheduledSec.empty().removeClass('resizable').html(data.output);
                    var $prompt = $unScheduledSec.find("._prompt"),
                        $unscheduled = $unScheduledSec.find('._unscheduled');

                    // init approval events
                    $prompt.mousedown(function () {
                        $prompt.hide();
                        self.insert(data.messagesWrapper);

                        $unscheduled.slideDown(function () {
                            // bind resizeable AFTER slidedown
                            $unScheduledSec.find('._close').click(function () {
                                $unscheduled.hide();
                                $prompt.show();
                                return false;
                            });
                        });
                    });

                    //if user is in approval queue section, then expand unscheduled view automatically
                    if (query['query[subSec]'] == 'rejected') {
                        if (schedulerUtil.isInListView()) {
                            $prompt.trigger('mousedown');
                        }
                    }
                }
                else {
                    $unScheduledSec.empty();
                }
            },
            complete: function () {/* always silent */},
            abort: function () {/*always silent*/}
        }, 'qm');
    },

    /**
     * Insert a wrapper of grouped and/or non-grouped messages into the view
     *
     * @param wrapper
     */
    insert: function (wrapper) {
        if (Object.prototype.hasOwnProperty.call(wrapper,'nonGrouped')) {
            insertUnscheduledNonGroupedMessages(wrapper.nonGrouped);
        }
        if (Object.prototype.hasOwnProperty.call(wrapper,'grouped')) {
            insertUnscheduledGroupedMessages(wrapper.grouped);
        }
    },

    /**
     * Delete a message or a group of messages from the view
     *
     *
     * @param id
     * @param isGroupMode
     */
    remove: function (id, isGroupMode) {
        var $groupDiv, $msgDiv, $dateSlot;
        if (isGroupMode) {
            // remove messages whether they are scheduled or not
            $('._preScreen_' + id).closest("._itemWrapper").remove();
        }
        else {
            //check to see if this message is part of a group, if so, remove sn avatar from the group avatars as well, and if all individual msgs removed, then remove the group as well
            $msgDiv = $('._preScreen_' + id);
            $groupDiv = $msgDiv.closest("._grouped");
            $dateSlot = $msgDiv.closest("._dateslot");

            // check if the message is part of a group
            if ($groupDiv.length == 1) {
                var $networkGroup = $groupDiv.find("._networkGroup");
                var $counter = $networkGroup.find("._profileCount");
                var count = parseInt($counter.text(), 10);

                //if this is the only one left, then remove whole group
                if (count <= 1) {
                    $groupDiv.remove();
                } else {
                    // update the counter
                    count--;
                    if (count == 1) {
                        $counter.hide();
                    }
                    $counter.text(count);

                    var $networkProfile = $networkGroup.find("._profile");
                    var msgSnId = $msgDiv.attr('snid');
                    if ($networkProfile.attr("snid") == msgSnId) {
                        // the avatar is the one of the message we are about to remove
                        // we need to update it
                        // get the first message which snid differs from msgSnId
                        var $newFirstMessage = $groupDiv.find("._preScreenInGroup[snid!='" + msgSnId + "']").first();
                        $networkProfile.attr("snid", $newFirstMessage.attr("snid"));
                        // I hate myself for doing this, but since we are not using backbone, I can't re-render the template for that item
                        //$networkProfile.html($newFirstMessage.find('._networkType').html());
                        $networkProfile.find('._snAvatar, ._networkIcon').remove();
                        $networkProfile.append($newFirstMessage.find('._networkType').children().clone());
                    }
                }
            }

            // .. and remove the message itself
            $msgDiv.remove();

            //if nothing left for the day, then remove the date slot
            if ($dateSlot.length == 1 && $dateSlot.find("._itemList ._itemWrapper").length < 1) {
                $dateSlot.remove();
            }
        }
    },

    extractInfoFromDom: function ($wrapper, $target) {
        var info = {};
        if ($wrapper.is("._grouped")) {
            if ($target.closest("._preScreenInGroup").length === 0) {
                info.isGroupMode = true;
                info.id = $wrapper.find("._itemDetail ._preScreenInGroup").first().attr("mid");
                info.snIds = schedulerUtil.collectSnIdsFromGroup($wrapper);
            } else {
                info.id = $target.closest("._preScreenInGroup").attr('mid');
                info.isGroupMode = false;
            }
        } else {
            info.id = $wrapper.attr('mid');
        }
        return info;
    }
};

export default rejected;

