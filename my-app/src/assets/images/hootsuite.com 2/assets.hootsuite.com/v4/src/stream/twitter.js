import _ from 'underscore';
import translation from 'utils/translation';
import localCache from 'utils/local-cache';
import showSecureDialog from 'utils/dialogs/secure';
import trackerDatalab from 'utils/tracker-datalab';
import hsEjs from 'utils/hs_ejs';
import hootbus from 'hs-nest/lib/utils/hootbus';
import darklaunch from 'utils/darklaunch';
import 'stream/stream';
import 'utils/ajax';
import 'utils/status_bar';
var stream_twitter = {};
import { formatDate, formatISO8601Date } from 'utils/string';
import { asyncStreamLoader } from './components/streams-loader';
import streamsFlux from 'hs-app-streams/lib/stores/flux';
import { MESSAGE } from 'hs-app-streams/lib/actions/types';

var HOOTBUS_EVENT_OPEN_COMPOSER = 'composer.open';

// define error messages here (speeds up translation, helps minifiy script)
stream_twitter.MSG_SEARCH_ERROR_TERMS = translation._("There were no results for your search, please check your search terms");

/**
 *  needed after snowflake tweet ID transition
 */
stream_twitter.convertTweetIdString = function (tweetData) {
    if (tweetData.id_str) {
        tweetData.id = tweetData.id_str;
    }
    if (tweetData.in_reply_to_status_id_str) {
        tweetData.in_reply_to_status_id = tweetData.in_reply_to_status_id_str;
    }
    if (tweetData.retweeted_status) {
        tweetData.retweeted_status.id = tweetData.retweeted_status.id_str;
        if (tweetData.retweeted_status.in_reply_to_status_id_str) {
            tweetData.retweeted_status.in_reply_to_status_id = tweetData.retweeted_status.in_reply_to_status_id_str;
        }
        if (tweetData.retweeted_status.in_reply_to_user_id_str) {
            tweetData.retweeted_status.in_reply_to_user_id = tweetData.retweeted_status.in_reply_to_user_id_str;
        }
    }
    return tweetData;
};

/**
 * editListPopup
 */
stream_twitter.editListPopup = function (boxId) {

    var params = {
        width: 400,
        closeOnEscape: true,
        draggable: true,
        position: ['center', 80],
        title: translation.c.LOADING,
        content: "<div class='large-loading'><img src='" + hs.util.rootifyImage('/dashboard/loaders/round-radial-lines-loader.gif') + "' /></div>",
        close: function () {
        }
    };

    $.dialogFactory.create('editListPopup', params);

    stream_twitter.getEditList(boxId);
    return false;
};

/**
 * view or add List members
 */
stream_twitter.getEditList = function (boxId, cursor, user) {
    var cursorQS = (cursor) ? "&cursor=" + cursor : "";
    var userQS = (user) ? "&userToAdd=" + encodeURIComponent(user) + "&isAddingUsername=1" : "";
    ajaxCall({
        type: 'POST',
        url: "/ajax/twitter/edit-list",
        data: "boxId=" + boxId + cursorQS + userQS,
        success: function (data) {
            var $popup = $("#editListPopup");
            $popup.dialog('option', 'title', "Edit " + data.title);
            if (data.success) {
                $popup.html(data.output);

                // init user info popup content
                if (darklaunch.isFeatureEnabled('NGE_17489_EDIT_LIST_POPUP')) {
                    asyncStreamLoader('editListPopup', {});
                }

                _.defer(function () {
                    $popup.find('._closeEditListPopup').bind('click', function (e) {
                        e.preventDefault();
                        $popup.dialog("close");
                        $('#box' + boxId).box('refresh', 'default');
                    });

                    hs.throbberMgrObj.remove("#editListPopup ._newListUserBtn");	// remove throbber on add button
                    stream_twitter.initEditListPopup(data);	// init
                    // check for add user result
                    if (data.addUserSuccess != null) {
                        if (data.addUserSuccess == 1) {
                            hs.statusObj.update("Added '" + escape(user) + "' to " + data.title, 'success', true);
                        } else {
                            hs.statusObj.update(translation._("Error adding") + " " + escape(user) + " " + translation._("to list, please check the user exists"), 'error', true);
                        }
                    }
                });
            } else {
                var errorMsg = translation._("There was a problem retrieving members of") + " " + data.title + translation._(". Please try again");
                if (data.errorMsg) {
                    errorMsg = data.errorMsg;
                }
                hs.statusObj.update(errorMsg, 'error', true);
                $popup.html("");
            }
        }
    }, 'q1');
};

/**
 * initEditListPopup
 */
stream_twitter.initEditListPopup = function (data) {
    var $popup = $("#editListPopup");
    $popup.find("._listName").val(data.title);

    // bind remove button click
    $popup.find("._removeListMember").click(function () {
        var jqTarget = $(this).closest("._listMember");
        var userName = $("._screenName", jqTarget).text();
        if (confirm(translation._("Remove") + " " + userName + " " + translation._("from this list?"))) {
            hs.statusObj.update(translation._("Removing") + " " + userName + " " + translation._("from list..."), 'info');
            var userId = $("._id", jqTarget).val();

            stream_twitter.removeUserFromList(data.listId, data.listSocialNetworkId, userId, function () {
                hs.statusObj.update(userName + " " + translation._("was removed from the list"), 'success', true);
                window.fadeSlideRemove(jqTarget);
            });
            return false;
        }
    });

    // bind next/prev page click
    if (data.nextCursor) {
        $popup.find("._listMembersNext").click(function () {
            $popup.find("._listEditLoading").show();
            stream_twitter.getEditList(data.boxId, data.nextCursor);
        });
    }
    if (data.previousCursor) {
        $popup.find("._listMembersPrevious").click(function () {
            $popup.find("._listEditLoading").show();
            stream_twitter.getEditList(data.boxId, data.previousCursor);
        });
    }

    // bind add user button
    var textbox = $popup.find("._newListUser"),
        button = $popup.find("._newListUserBtn");
    textbox.unbind().bind("keypress", function (e) {
        if (e.keyCode == 13) {
            // enter key
            e.preventDefault();
            return false;
        }
    });
    button.click(function (e) {
        e.preventDefault();
        var name = $.trim(textbox.val().replace("@", ""));
        if (name.length === 0) {
            hs.statusObj.update(translation._("Please enter the name of a Twitter user to add to") + " " + data.title, 'warning', true);
            return false;
        }
        hs.throbberMgrObj.add("#editListPopup ._newListUserBtn");
        stream_twitter.getEditList(data.boxId, null, name);
    });

    // init add user to list box
    textbox.bind("keyup", function (e) {
        var key = (window.event) ? window.event.keyCode : e.which;
        if (key == 13) {
            // remove autocomplete on enter
            textbox.trigger("unautocomplete");
            button.click();
        }
    });
    textbox.focus().click();	// focus automatically
};

/**
 * removeUserFromList
 */
stream_twitter.removeUserFromList = function (list, listOwnerSocialNetworkId, userId, callback) {
    ajaxCall({
        type: 'POST',
        url: "/ajax/twitter/delete-list-member?sid=" + listOwnerSocialNetworkId + "&list=" + list + "&uid=" + userId,
        success: function (data) {
            hs.statusObj.reset();
            if (data.error.code == null && $.isFunction(callback)) {
                callback();
            } else {
                hs.statusObj.update(data.error.message, 'error', true);
            }
        },
        error: function () {
            hs.statusObj.reset();
        },
        abort: function () {
            hs.statusObj.reset();
        }
    }, 'q1');
};

stream_twitter.bindAddUserToListFunctions = function (user, $popup) {
    $popup
      .dialog('option', 'title', translation._("Add To list"))
      .find('._submitAddUserToList').bind('click', function (e) {
        e.preventDefault();
        stream_twitter.submitAddUserToList(user);
    })
      .end()
      .find('._close').bind('click', function (e) {
        e.preventDefault();
        $popup.dialog('close');
    });

    var $addUserToListOptions = $popup.find('._lists select option');

    // Remove '/lists' from the options text
    $addUserToListOptions.each(function () {
        $(this).text($(this).text().replace('/lists/', '/'));
    });

    // Sort the drop down options alphabetically
    var addUserToListArray = $addUserToListOptions.map(function (_, element) {
        return {
            text: $(element).text(),
            value: element.value
        };
    }).get();

    addUserToListArray.sort(function (element1, element2) {
        return element1.text > element2.text ? 1 : element1.text < element2.text ? -1 : 0;
    });

    $addUserToListOptions.each(function (index, element) {
        $(element).val(addUserToListArray[index].value)
          .text(addUserToListArray[index].text);
    });
}

/**
 * addUserToListPopup
 */
stream_twitter.addUserToListPopup = function (user) {
    let params = {
        resizable: false,
        draggable: true,
        closeOnEscape: true,
        width: 400,
        position: ['center', 150],
        title: translation.c.LOADING,
        content: "<div class='large-loading'><img src='" + hs.util.rootifyImage('/dashboard/loaders/round-radial-lines-loader.gif') + "' /></div>"
      };
    let $popup = $.dialogFactory.create('addUserToListPopup', params);

    ajaxCall({
        type: 'POST',
        url: "/ajax/twitter/add-to-list?user=" + user,
        success: function (data) {
            $popup.html(data.output)
            if (hs.isFeatureEnabled('NGE_18356_ADD_TO_LIST_POPUP_MIGRATION')) {
                asyncStreamLoader('addToListPopup', {
                    hasManageableLists: data.hasManageableLists,
                    lists: data.lists,
                  }).then(() => {
                    stream_twitter.bindAddUserToListFunctions(user, $popup);
                  })
            } else {
                stream_twitter.bindAddUserToListFunctions(user, $popup);
            }
        }
    }, 'q1');
    return false;
};

/**
 * submitAddUserToList
 */
stream_twitter.submitAddUserToList = function (user) {
    var $popup = $("#addUserToListPopup"),
        boxId = $popup.find("._lists select option:selected").val();
    hs.throbberMgrObj.add("._submitAddUserToList");
    ajaxCall({
        type: 'POST',
        url: "/ajax/twitter/add-to-list?user=" + user + "&boxId=" + boxId,
        success: function (data) {
            if (data.success == '1') {
                hs.statusObj.update(translation._("User has been added to list."), 'success', true);
            }
            else if (data.error) {
                hs.statusObj.update(data.error.message, 'error', true);
            }
            else {
                hs.statusObj.update(translation._("An error occurred, please try again later"), 'error', true);
            }
            $popup.dialog('close');
        },
        complete: function () {
            hs.throbberMgrObj.remove("._submitAddUserToList");
        }
    }, 'q1');
    return false;
};

/**
 * dropUserToList
 */
stream_twitter.dropUserToList = function (user, boxId) {
    ajaxCall({
        type: 'POST',
        url: "/ajax/twitter/add-to-list?user=" + user + "&boxId=" + boxId,
        success: function (data) {
            if (data.success == '1') {
                hs.statusObj.update(translation._("User has been added to list."), 'success', true);
                if ($("#box" + boxId).length) {
                    $('#box' + boxId).box('refresh', 'default');
                }
            }
            else if (data.error) {
                hs.statusObj.update(data.error.message, 'error', true);
            }
            else {
                hs.statusObj.update(translation._("An error occurred, please try again later"), 'error', true);
            }
        }
    }, 'qm');
    return false;
};

/**
 * deleteListMember
 */
stream_twitter.deleteListMember = function (user, listId, socialNetworkId, callback) {
    ajaxCall({
        type: 'POST',
        url: "/ajax/twitter/delete-list-member?uid=" + user + "&list=" + listId + "&sid=" + socialNetworkId,
        success: function (data) {
            if (data.error && data.error.message) {
                hs.statusObj.update(data.error.message, 'error', true);
            }
            else {
                hs.statusObj.update(translation._("User has been removed from list."), 'success', true);
                $.isFunction(callback) && callback();
            }
        }
    }, 'qm');
    return false;
};

/**
 * muteAccount
 */
stream_twitter.muteAccount = function (screenName, socialNetworkId) {
    if (!confirm(translation._("Are you sure to want to mute %1$s?").replace('%1$s', screenName))) {
        return false;
    }
    ajaxCall({
        type: 'POST',
        url: "/ajax/twitter/mute-account?username=" + screenName + "&socialNetworkId=" + socialNetworkId,
        success: function (responseData) {
            if (typeof responseData.error.code === 'undefined' || responseData.error.code == null || responseData.error.code == 200) {
                hs.statusObj.update(translation._("You will no longer see Tweets from @%1$s in your timeline").replace('%1$s', screenName), 'success', true);
                // clear local storage to remove the user from streams
                localCache.clear();
            }
            else {
                hs.statusObj.update(responseData.error.message, 'warning', true);
            }
        }
    }, 'single');
};

/**
 * blockUser
 */
stream_twitter.blockUser = function (screenName, socialNetworkId) {
    if (!confirm(translation._("Are you sure to want to block") + " " + screenName + "?")) {
        return false;
    }
    ajaxCall({
        type: 'POST',
        url: "/ajax/twitter/block-user?username=" + screenName + "&socialNetworkId=" + socialNetworkId,
        success: function (responseData) {
            if (typeof responseData.error.code === 'undefined' || responseData.error.code == null || responseData.error.code == 200)	// OK
            {
                hs.statusObj.update(translation._("You will no longer see Tweets from @%1$s in your timeline").replace('%1$s', screenName), 'success', true);
                localCache.clear();	// clear local storage to remove the user from streams
            }
            else {
                hs.statusObj.update(responseData.error.message, 'warning', true);
            }
        }
    }, 'single');
};

/**
 * reportSpam
 */

stream_twitter.reportSpam = function (screenName, socialNetworkId) {

    var userName = isNaN(screenName * 1) ? screenName : "this user"; // passing in a twitter username or id?

    // L10N: %1$s is the user's screenname.
    if (!confirm(translation._("Are you sure to want to report %1$s as a spammer?").replace('%1$s', userName))) {
        return false;
    }

    ajaxCall({
        type: 'POST',
        url: "/ajax/twitter/report-spam?userId=" + screenName + "&socialNetworkId=" + socialNetworkId,
        success: function (responseData) {
            if (typeof responseData.error.code === 'undefined' || responseData.error.code == null || responseData.error.code == 200)	// OK
            {
                hs.statusObj.update(translation._("User has been reported as a spammer"), 'success', true);
                localCache.clear();	// clear local storage to remove the user from streams
            }
            else {
                hs.statusObj.update(responseData.error.message, 'warning', true);
            }
        }
    }, 'single');
};

/**
 * toggleFollow
 * @param on
 * @param username
 * @param userId
 * @param successCallback
 * @param impressionId
 * @param params
 */
window.toggleFollow = function (on, username, userId, successCallback, impressionId, params) {
    var followMessage = translation._("Which Twitter network should follow this user?"),
        unfollowMessage = translation._("Which Twitter network should unfollow this user?"),
        messageToDisplay = (on) ? followMessage : unfollowMessage;
    messageToDisplay += ' (@' + username + ')';


    window.selectSocialNetworkPopup(function (selectedSocialNetworkId) {
        var postData = "on=" + on + "&sid=" + selectedSocialNetworkId + "&screenName=" + username + "&userId=" + userId;
        var msg;
        if (on == 1) {
            msg = translation._("Following...");
        } else {
            msg = translation._("Unfollowing...");
        }
        ajaxCall({
            url: "/ajax/twitter/toggle-follow" + (impressionId ? '?impressionId=' + impressionId : ''),
            data: postData,
            beforeSend: function () {
                hs.statusObj.update(msg, 'info');
            },
            success: function (data) {
                var statusType = "success";
                if (data.success != 1) {
                    statusType = "error";
                }
                else {
                    // track event for featured user following
                    if (params && params.isFeaturedUserClick) {
                        //hs.trackEvent('FeaturedUser', (on ? 'follow' : 'unfollow'), '@'+ username);
                        hs.track('/featuredUser/follow/' + username);
                    }

                    if ($.isFunction(successCallback)) {
                        successCallback(selectedSocialNetworkId);
                    }
                }
                hs.statusObj.update(data.msg, statusType, true);
                return false;
            },
            error: function (data) {
                hs.util.keepErrorMessageVisible(data);
            },
            abort: function () {
                hs.statusObj.reset();
            }
        }, 'q1');

        // track event for promoted tweets following
        if (impressionId) {
            hs.trackEvent('PromoTweets', (on ? 'follow' : 'unfollow'), (params && params.fullname ? params.fullname + ' | @' : '@') + username);
        }

        // track event for featured user following
        if (params && params.isFeaturedUserClick) {
            //hs.trackEvent('FeaturedUser', 'click', '@'+ username);
            hs.track('/featuredUser/click/' + username);
        }

        return false;
    }, messageToDisplay, true);
    return false;
};

/**
 * deleteDMTweet
 * @param messageDivId
 * @param sid
 */
window.deleteDMTweet = function (messageDivId, sid) {
    if (!messageDivId || !sid) {
        return;
    }
    ajaxCall({
        url: "/ajax/twitter/delete-dm-tweet?id=" + window.stream.box.parseMessageId(messageDivId) + "&sid=" + sid,
        beforeSend: function () {
            hs.statusObj.update(translation._("Deleting..."), 'info');
        },
        success: function (data) {
            if (data.success == 1) {
                hs.statusObj.reset();
                var $messageDiv = $('#' + messageDivId);
                $messageDiv.addClass('tweet-delete');
                $messageDiv.find('._tweetInfo').empty();

                var callback = null;
                // see if this DM has an assignment attached to it
                if ($messageDiv.prev().is("._assignment, ._response")) {
                    var assignId = $messageDiv.prev().attr("id");
                    callback = function () {
                        window.fadeSlideRemove("#" + assignId, 500);
                    };
                }

                window.fadeSlideRemove('#' + messageDivId, 500, callback);
            }
            else {
                hs.statusObj.update(data.error, 'error', true);
            }
        },
        error: function () {
            hs.statusObj.reset();
        },
        abort: function () {
            hs.statusObj.reset();
        }
    }, 'q1');
    return false;
};


/**
 * showRetweetPopup
 */
stream_twitter.showRetweetPopup = function (anchor, socialNetworkId, messageId, impressionId, fnOldRetweet, fnNewRetweet, fnTwitterQuote) {
    if (!anchor) {
        return;
    }

    var cancel = function () {
            $('body').unbind('click.closeRetweetPopup');
            hs.bubblePopup.close();
        },
        checkAndPostRetweet = function () {
            // display the select Twitter account popup if needed
            if (socialNetworkId && socialNetworkId > 0) {
                stream_twitter.doRetweet(messageId, socialNetworkId, impressionId);
                cancel();
            } else {
                cancel(); // close first
                window.selectSocialNetworkPopup(function (selectedSocialNetworkId) {
                    stream_twitter.doRetweet(messageId, selectedSocialNetworkId, impressionId);
                }, translation._("Which Twitter network should retweet this tweet?"));
            }
        };

    var $anchor = $(anchor),
        callback = function () {
            var $html = $('<div id="retweetPopup" class="_retweetPrompt">' +
                '<p>' + stream_twitter.generateAvatarImgForRetweetPopup(socialNetworkId) + ' ' + translation._("Retweet to your followers?") + '</p>' +
                '<div class="-actions">' +
                '<button class="_sendRetweet btn-lite-sta">' + translation._("Yes") + '</button>' +
                (hs.isFeatureEnabled('SCHEDULE_NATIVE_RETWEET') && hs.isFeatureDisabled('NGE_19820_LEGACY_COMPOSE_DEPRECATION') ? '<button class="_schedNewStyle btn-lite-sta">' + translation._("Schedule") + '</button>' : '') +
                '<button class="_quote btn-lite-sta">' + translation._("Quote") + '</button>' +
                (hs.isFeatureDisabled('NGE_19820_LEGACY_COMPOSE_DEPRECATION') ? '<button class="_oldStyle btn-lite-sta">' + translation._("Edit") + '</button>' : '') +
                '<button class="_cancel icon-19 close">X</button>' +
                '</div></div>');
            $html.find('a[href=#]').click(function (e) {
                e.preventDefault();
            });
            $html.find('._sendRetweet').click(function () {
                checkAndPostRetweet();
            });
            $html.find('._oldStyle').click(function () {
                fnOldRetweet();
                cancel();
            });
            $html.find('._schedNewStyle').click(function () {
                fnNewRetweet(messageId);
                $("._messageContainer ._messageTools ._showScheduler").click();
                cancel();
            });
            $html.find('._quote').click(function () {
                fnTwitterQuote();
                cancel();
            });
            $html.find('._cancel').click(function () {
                cancel();
            });
            $html.find('._chooseProfile').click(function () {
                cancel();	// close first
                window.selectSocialNetworkPopup(function (selectedSocialNetworkId) {
                    stream_twitter.doRetweet(messageId, selectedSocialNetworkId, impressionId);
                }, translation._("Which Twitter profile should retweet this tweet?"));
            });
            hs.bubblePopup.setContent($html);

            if (hs.bubblePopup.isOpen()) {
                $('body').bind('click.closeRetweetPopup', function (e) {
                    var $target = $(e.target);
                    if ($target.is('._dialog') || $target.closest('._dialog').length ||
                        $target.is('._bubblePopup') || $target.closest('._bubblePopup').length ||
                        $target.is('#bubblePopPane') || $target.closest('#bubblePopPane').length) {
                        return; // exemption
                    }

                    cancel();
                    e.stopPropagation();	// don't let it trigger other calls
                });
            }
        };

    $("#tooltip").hide();
    hs.bubblePopup.close();
    hs.bubblePopup.openVertical($anchor, null, null, callback, {
        autoclose: false,
        pos: 'up'
    });
};

/**
 * showRetweetPopupApp
 * Used by app directory to retweet a tweet with either new style rewteet or old style
 * retweet
 */
stream_twitter.showRetweetPopupApp = function (messageId, username) {

    var socialNetwork = _.find(_.values(hs.socialNetworksKeyedByType['TWITTER']), function (sn) {
            return (sn.type == 'TWITTER') && (sn.username == username);
        }),
        socialNetworkId = socialNetwork ? socialNetwork.socialNetworkId : undefined,
        $retweetPopup,
    // Custom old retweet function for the retweet popup for the app directory
        fnOldRetweet = function () {

            // We need to get the tweet the user passed
            // in using a social network so if they didn't
            // pass in a valid social network, then look for
            // one in the users twitter social networks so
            // that we can make a request to Twitter to get the
            // tweet we want to old style retweet
            var getTweetsocialNetworkId = socialNetworkId;
            if (!getTweetsocialNetworkId) {
                var keys = _.keys(hs.socialNetworksKeyedByType['TWITTER']);
                if (keys.length > 0) {
                    getTweetsocialNetworkId = hs.socialNetworksKeyedByType['TWITTER'][keys[0]].socialNetworkId;
                } else {
                    hs.statusObj.update(translation._("No valid Twitter profiles to retweet from"), 'error', true);
                    return;
                }
            }


            // Ajax call to get tweet we want to old style retweet
            var reqData = 'socialNetworkId=' + getTweetsocialNetworkId + '&messageId=' + messageId;
            ajaxCall({
                type: "POST",
                url: "/ajax/network/get-message",
                data: reqData,
                success: function (data) {
                    if (data.success == '1') {
                        const standardizedMessage = data.viewData.message

                        // Old style retweet
                        var text = 'RT @' + standardizedMessage.author.name + ': ' + standardizedMessage.text.replace(/<&#91;^>&#93;*>/g, "") + hs.memberAutoInitial + ' ';
                        var messageData = {
                            socialNetworkId: socialNetworkId,
                            messageText: text,
                        };
                        hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, messageData);
                        trackerDatalab.trackCustom('web.dashboard.popup_composer.open_new_composer', 'popup_composer_opened_new_composer', { source: 'APP_STREAM' });
                    } else {
                        // error getting tweet
                        hs.statusObj.update(data.error, 'error', true);
                    }
                },
                error: function () {
                    hs.statusObj.update(translation.c.ERROR_GENERIC, 'error', true);
                }
            }, 'qm');
        },
        checkAndPostRetweet = function () {
            // display the select Twitter account popup if needed
            if (socialNetworkId && socialNetworkId > 0) {
                stream_twitter.doRetweet(messageId, socialNetworkId);
                $retweetPopup.dialog('close');
            } else {
                $retweetPopup.dialog('close'); // close first
                window.selectSocialNetworkPopup(function (selectedSocialNetworkId) {
                    stream_twitter.doRetweet(messageId, selectedSocialNetworkId);
                }, translation._("Which Twitter network should retweet this tweet?"));
            }
        };

    // Build our retweet pop up html. This html is very similar to the
    // main html for the retweet popup for the dashboard except it doesn't
    // have a close button as the last item as the close button is in the dialog itself
    var $html = $('<div id="retweetPopup" class="_retweetPrompt">' +
        stream_twitter.generateAvatarImgForRetweetPopup(socialNetworkId) + translation._("Retweet to your followers?") + '&nbsp;&nbsp;' +
        '<button class="_sendRetweet btn-lite-sta">' + translation._("Yes") + '</button>&nbsp;&nbsp;' +
        (hs.isFeatureDisabled('NGE_19820_LEGACY_COMPOSE_DEPRECATION') ? '<button class="_oldStyle btn-lite-sta">' + translation._("Edit") + '</button>' : '') +
        '</div>');

    // setup events for retweet popup
    $html.find('a[href=#]').click(function (e) {
        e.preventDefault();
    });
    $html.find('._sendRetweet').click(function () {
        checkAndPostRetweet();
    });
    $html.find('._oldStyle').click(function () {
        fnOldRetweet();
        $retweetPopup.dialog('close');
    });
    $html.find('._chooseProfile').click(function () {
        $retweetPopup.dialog('close');	// close first
        window.selectSocialNetworkPopup(function (selectedSocialNetworkId) {
            stream_twitter.doRetweet(messageId, selectedSocialNetworkId);
        }, translation._("Which Twitter profile should retweet this tweet?"));
    });

    // create/show the retweet pop up
    $retweetPopup = $.dialogFactory.create('appRetweetPopup', {
        height: 'auto',
        width: 342,
        title: translation._("Retweet"),
        modal: false,
        draggable: true,
        closeOnEscape: true,
        content: $html
    });
};

/**
 * generateAvatarImgForRetweetPopup - Shared function for retweets from the dashboard and within an app.
 * @param snId
 * @returns {string} - The html avatar for the retweet pop up
 */
stream_twitter.generateAvatarImgForRetweetPopup = function (snId) {
    var html = '';
    if (snId && snId > 0) {
        var avatar = hs.socialNetworks[snId].avatar;

        html = '<img class="networkAvatar" src="' + avatar + '" />';

        //Only allow retweets to other accounts if there are more than one account
        if (_.size(hs.socialNetworksKeyedByType['TWITTER']) > 1) {
            html = '<a href="#" class="_chooseProfile _jsTooltip" title="Click to choose a different Twitter network to send retweet">' + html + '</a>';
        }
    }
    return html;
};

/**
 * doRetweet - shared function for retweets from the dashboard and within an app.
 * @param messageId
 * @param snId
 * @param [impressionId]
 */
stream_twitter.doRetweet = function (messageId, snId, impressionId) {
    var retweetSn = _.find(_.values(hs.socialNetworks), function (sn) {
            return sn.socialNetworkId == snId;
        }),
        retweetFunc = function () {
            var messageData = {
                messageId: messageId,
                socialNetworkId: snId,
            };

            if (impressionId) {
                messageData.impressionId = impressionId;
            }

            streamsFlux.getActions(MESSAGE).sendRetweet(messageData, 'qm').then(function (data) {
                if (data.success) {
                    hs.statusObj.update(translation._("Tweet retweeted"), 'success', true);
                } else {
                    if (data.controllerPermissionRequest || data.socialNetworkReauthRequired) {
                        return;
                    }
                    var errorMsg = translation._("This tweet can not be retweeted, the user may be protected");
                    if (data.error) {
                        errorMsg = data.error;
                    }
                    hs.statusObj.update(errorMsg, 'error', true);
                }
            });
        };
    if (retweetSn.isSecurePost) { // retweet with secure profile dialog
        showSecureDialog([retweetSn], retweetFunc);
    } else { // retweet without secure profile dialog
        retweetFunc();
    }

    var origin = 'web.dashboard.streams';
    var action = 'streams_message_retweet';
    var eventDetails = {
        actionType: 'retweet',
        streamStyle: 'old'
    };
    trackerDatalab.trackCustom(origin, action, eventDetails);
};

stream_twitter.viewUserTweets = function (username, target) {
    ajaxCall({
        type: 'GET',
        url: '/ajax/twitter/user-tweets?username=' + username,
        success: function (data) {
            var $target = $(target);
            if (!data) {
                return;
            }
            if (!target) {
                window.stream.search.displaySearchResultsContent();
                window.stream.search.displayTwitterSearchResults(data);
            } else {
                if (!$target.length) {
                    return;
                }
                $target.empty().html(window.stream.search.buildSearchResults(data.result));
            }
        }
    }, 'qm');
};

stream_twitter.viewUserMentions = function (username, target) {
    ajaxCall({
        type: 'GET',
        url: '/ajax/twitter/user-mentions?username=' + username,
        success: function (data) {
            var $target = $(target);

            if (!data || !$target.length) {
                return;
            }
            $target.empty().html(window.stream.search.buildSearchResults(data.result.statuses));
        }
    }, 'qm');
};
stream_twitter.viewUserFavorites = function (username, target) {
    ajaxCall({
        type: 'GET',
        url: '/ajax/twitter/user-favorites?username=' + username,
        success: function (data) {
            var $target = $(target);

            if (!data) {
                return;
            }

            if (!target) {
                window.stream.search.displaySearchResultsContent();
                window.stream.search.displayTwitterSearchResults(data.result);
            } else {
                if (!$target.length) {
                    return;
                }
                $target.empty().html(window.stream.search.buildSearchResults(data.result));
            }
        }
    }, 'qm');
};

stream_twitter.viewFollowers = function (socialNetworkId, username, target) {
    ajaxCall({
        type: 'GET',
        url: '/ajax/twitter/get-followers?userId=' + username,
        success: function (data) {
            var $target = $(target);
            if (!data) {
                return;
            } else if (data.error) {
                hs.statusObj.update(translation._("An error has occurred. Please try again later."), 'error', true);
                return;
            }
            $target.empty().html(window.stream.search.buildFollowersResults(data.result.users));

            var cursor = data.result.next_cursor_str;
            if (cursor && parseInt(cursor) > 0) {
                stream_twitter.appendLoadMoreButton(socialNetworkId, username, target, cursor);
            }
        },
        error: function (_data) {
            hs.statusObj.update(translation._("An error has occurred. Please try again later."), 'error', true);
        }
    }, 'qm');
};

stream_twitter.viewMoreFollowers = function (socialNetworkId, username, target, cursor) {
    ajaxCall({
        type: 'GET',
        url: '/ajax/twitter/get-followers?userId=' + username + '&cursor=' + cursor,
        success: function (data) {
            var $target = $(target);
            if (!data) {
                return;
            } else if (data.error) {
                hs.statusObj.update(translation._("An error has occurred. Please try again later."), 'error', true);
                return;
            }
            $target.find('._getMoreFollowersContainer').remove();
            $target.append(window.stream.search.buildFollowersResults(data.result.users));

            var cursor = data.result.next_cursor_str;
            if (cursor && parseInt(cursor) > 0) {
                stream_twitter.appendLoadMoreButton(socialNetworkId, username, target, cursor);
            }
        },
        error: function (_data) {
            hs.statusObj.update(translation._("An error has occurred. Please try again later."), 'error', true);
        }
    }, 'qm');
};

stream_twitter.appendLoadMoreButton = function (socialNetworkId, username, target, cursor) {
    var $target = $(target);
    $target.append(
        '<div class="_getMoreFollowersContainer" style="text-align:center;">' +
            '<div class="_getMoreFollowers -getMoreFollowers btn-sta" cursor="' + cursor + '">' +
                translation._("Load more") +
            '</div>' +
        '</div>'
    );
    $('._getMoreFollowers', $target).click(function () {
        stream_twitter.viewMoreFollowers(socialNetworkId, username, target, cursor);
    });
};


/**
 * Checks if a target twitter Id has any notes associated with it left by members from any organization
 * and if it does displays a different icon on the user info popup (notes tab)
 * @param targetTwitterId
 */
stream_twitter.hasNotes = function (targetTwitterId, callback) {
    ajaxCall({
        url: '/ajax/organization/get-member-organizations',
        success: function (data) {
            if (_.size(data.organizations) > 0) {
                var params = {targetTwitterId: targetTwitterId};
                _.each(data.organizations, function (organization) {
                    ajaxCall({
                        url: '/ajax/twitter/retrieve-notes',
                        data: _.extend({organizationId: organization.organizationId}, params),
                        success: function (data) {
                            if (data.numNotes > 0) {
                                callback(true);
                            }
                        }
                    }, 'qm');
                });
            }
        }
    }, 'qm');
};

/**
 * Show notes associated with a Target Twitter handle left by members of an organization
 *
 * @param targetTwitterId
 * @param $target
 */
stream_twitter.viewNotes = function (targetTwitterId, $target) {
    var fnInit = function () {
            $target.show();

            var $body = $target.find('._body');
            $body.empty();

            var content = hsEjs.getEjs('stream/twitter/interactionhistory/notes/addNote').render();
            $body.append(content);

            $('._saveNoteBtn').addClass('disabled');
            $('#organizationDd').addClass('disabled');
        },
        fnLoadOrganizations = function ($dd) {
            ajaxCall({
                url: '/ajax/organization/get-member-organizations',
                success: function (data) {
                    if (_.size(data.organizations) > 0) {
                        var organizationList = [];
                        _.each(data.organizations, function (organization) {
                            organizationList.push({
                                title: organization.name,
                                optId: organization.organizationId
                            });
                        });
                        $dd.removeClass('disabled');
                        $dd.hsDropdown({
                            data: {items: organizationList},
                            change: function (dropDownItem) {
                                fnDisplayOrganizationNotes(dropDownItem.optId);
                            }
                        }).hsDropdown('selectFirstElement');
                    } else {
                        $dd.hsDropdown({
                            data: {
                                items: [
                                    {title: translation._("No organizations were found")}
                                ]
                            }
                        }).hsDropdown('selectFirstElement');
                    }
                }
            }, 'qm');
        },

        fnDisplayOrganizationNotes = function (organizationId) {
            var parameters = {
                organizationId: organizationId,
                targetTwitterId: targetTwitterId
            };
            ajaxCall({
                url: '/ajax/twitter/retrieve-notes',
                data: parameters,
                success: function (data) {
                    var $displayNotesSection = $('.displayNotes');
                    $displayNotesSection.empty();
                    if (_.size(data.notes) > 0) {
                        $displayNotesSection.show();
                        _.each(data.notes, function (note) {
                            const noteContent = hsEjs.getEjs('stream/twitter/interactionhistory/notes/displayNote').render({
                                note: note,
                                formatDate: date => formatDate(formatISO8601Date(date))
                            });
                            $('.displayNotes').append(noteContent);
                        });
                        $('._deleteNote').bind('click', function () {
                            if (confirm(translation._("Are you sure you want to permanently delete this note?"))) {
                                fnDeleteNote(hs.currentMessageDivId);
                            }
                        });
                    } else {
                        $displayNotesSection.hide();
                    }
                }
            }, 'qm');
        },

        fnOnSaveNoteSubmit = function () {
            var noteParameters = {
                organizationId: $organizationDd.hsDropdown('selectedElement').optId,
                targetTwitterId: targetTwitterId,
                noteText: $('._writeNoteArea').val()
            };

            ajaxCall({
                url: '/ajax/twitter/store-notes',
                data: noteParameters,
                success: function (data) {
                    if (data.success) {
                        hs.statusObj.update(data.msg, 'success', true);
                        fnUnbindNoteSubmit();
                        fnDisplayOrganizationNotes(noteParameters.organizationId);
                    } else {
                        hs.statusObj.update(data.error, 'error', true);
                        fnUnbindNoteSubmit();
                    }
                }
            }, 'qm');
        },

        fnOnTextEntry = function () {
            $writeNoteArea.bind('input propertychange', function () {
                if (this.value.length) {
                    $saveNoteBtn.removeClass('disabled');
                    $saveNoteBtn.bind("click", function () {
                        hs.throbberMgrObj.add($saveNoteBtn);
                        fnOnSaveNoteSubmit();
                    });
                } else {
                    fnUnbindNoteSubmit();
                }
            });
        },

        fnDeleteNote = function (currentDivId) {
            var data = {noteId: currentDivId};
            ajaxCall({
                url: '/ajax/twitter/delete-note',
                data: data,
                success: function (data) {
                    if (data.success) {
                        var organizationId = $organizationDd.hsDropdown('selectedElement').optId;
                        fnDisplayOrganizationNotes(organizationId);
                    }
                }
            }, 'qm');
        },

        fnUnbindNoteSubmit = function () {
            hs.throbberMgrObj.removeAll();
            $saveNoteBtn.addClass('disabled');
            $saveNoteBtn.unbind();
            $writeNoteArea.val('');
        };

    // initalize notes tab
    fnInit();

    var $organizationDd = $('#organizationDd'),
        $saveNoteBtn = $('._saveNoteBtn'),
        $writeNoteArea = $('._writeNoteArea');

    // load the organizations in the dropdown
    fnLoadOrganizations($organizationDd);

    // detect note entry
    fnOnTextEntry();
};

/**
 * twitter search
 */
stream_twitter.search = function (options, callBack) {
    if (!('rpp' in options)) {
        options.rpp = 20;
    }
    if (!('query' in options)) {
        return;
    }

    ajaxCall({
        url: '/ajax/twitter/tweet-search',
        data: options,
        success: function (data) {
            data = data.result || {};
            var retVal = {};
            if (data && data.statuses) {
                var tweets = data.statuses;
                $.each(tweets, function (i) {
                    data.statuses[i] = stream_twitter.convertTweetIdString(tweets[i]);
                });
                // manipulate data to make it look like old format
                retVal = {
                    'results': data.statuses
                };
                $.each(data.search_metadata, function (key, prop) {
                    if (key === 'statuses') {
                        return true;
                    }
                    retVal[key] = prop;	// move metadata to the top level
                });
            }

            callBack(retVal);
        }
    }, 'q1');
};

window.stream = window.stream || {};
window.stream.twitter = stream_twitter;

export default stream_twitter;
