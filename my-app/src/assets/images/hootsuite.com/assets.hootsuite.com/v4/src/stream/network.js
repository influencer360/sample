import _ from 'underscore';
import twemoji from 'twemoji';
var stream_network = {};
import trackerDataLab from 'utils/tracker-datalab';
import translation from 'utils/translation';
import React from 'react';
import ReactDOM from 'react-dom';
import darklaunch from 'utils/darklaunch';
import hootbus from 'utils/hootbus';
import hsEjs from 'utils/hs_ejs';
import avatarAssets from './constants/avatar-assets';
import { asyncStreamLoader } from './components/streams-loader';
import streamsFlux from 'hs-app-streams/lib/stores/flux';
import { MESSAGE } from 'hs-app-streams/lib/actions/types';
import { formatDateWithOffset, makeUrlClickable } from 'utils/string';
import FluxComponent from 'hs-nest/lib/components/flux-component';
import SubscriptionManagerContainer from 'hs-app-streams/lib/components/user-info-modal/subscription-manager-container';

const HOOTBUS_EVENT_OPEN_COMPOSER = 'composer.open';

stream_network.TWITTER = "TWITTER";
stream_network.FACEBOOK = "FACEBOOK";
stream_network.LINKEDIN = "LINKEDIN";
stream_network.INSTAGRAM = "INSTAGRAM";

/**
 * getBoxType
 * helper to get the type of a box
 * @param {{}} obj a dom element or jQuery object within the box to check
 * @returns {string} box type
 */
stream_network.getBoxType = function (obj) {
    obj = $(obj);
    var result = stream_network.TWITTER;	// default twitter
    var $box = obj.closest("._box");
    if ($box.length) {
        var boxType = $box.box('get', 'type');
        if (boxType.indexOf("L_") === 0) {
            result = stream_network.LINKEDIN;
        } else if (boxType.indexOf("F_") === 0) {
            result = stream_network.FACEBOOK;
        } else if (boxType.indexOf("I_") === 0) {
            result = stream_network.INSTAGRAM;
        }
    }
    if (obj.closest('.x-instagram').length) {
        return stream_network.INSTAGRAM;
    }
    return result;
};

/**
 * shows user info dialog
 */
stream_network.showUserInfo = function (e, type) {
    var xPos = e.pageX + 30;
    var target = this;
    var $target = $(target);
    if (xPos > ($(window).width() - 300)) {
        xPos -= 300;
    }

    var userId = null,
        userName = null,
        $message = $target.closest('._message'),
        ptwImpressionId = $message.data('impressionId'),	// twitter promoted tweets impressionId is always stored on the message
        $link = $(e.target),
        socialNetworkType = null;

    try {
        socialNetworkType = stream_network.getBoxType(target);
    } catch (error) {
        if ($(target).hasClass('_instagram')) {
            socialNetworkType = stream_network.INSTAGRAM;
        } else if ($(target).hasClass('_twitter')) {
            socialNetworkType = stream_network.TWITTER;
        }
    }

    if ($target.hasClass('_userInfoPopupHere') || $target.hasClass('_commentUserInfoPopup') || $target.hasClass('_instagram')) {
        userId = $target.attr('userid');
        userName = $target.attr('title');
    } else if (type == 'company') {
        userId = $link.attr('companyId') || $link.data('companyId') || $message.data('companyId');
    } else if (socialNetworkType == stream_network.TWITTER || $target.hasClass('_twitter')) {
        // use title attribute
        userName = $target.attr('title');
        userId = $target.attr('data-user-id');
    } else {
        // use the userId data
        userId = $message.data('userId');
        userName = $message.data('userName');
    }

    //try to look for data available in assignments view
    if ($("div._viewAssignments").length > 0 && (!userId || userId === '')) {
        userId = $("input[name='userId']", $target.closest("._box")).val();
    }

    if (!userId || userId === '') {
        // last resort, use title attribute
        userId = $target.attr("title");
    }
    var socialNetworkId = ($target.closest('._box').data('box') && $target.closest('._box').box('get', 'socialNetworkId')) || $("input[name='socialNetworkId']", $target.closest("._box")).val() || $target.data("socialnetworkid");
    if (!socialNetworkId && $("#contactsManage").length) {
        // for people manage section, if we cannot find the socialNetworkId
        socialNetworkId = $("#contactsManage ._sectionFrame input._socialNetworkId").val();
    }
    if (!socialNetworkId && $target.closest('#commentsPopup').length) {
        socialNetworkId = $target.closest('#commentsPopup').find('.message-original').data('socialNetworkId');
    }
    if (!socialNetworkId && socialNetworkType == stream_network.FACEBOOK) {
        // still can't find fb snId, just use first one
        var firstFb = null;
        $.each(hs.socialNetworks, function () {
            if (this.type.match(/facebook/i)) {
                firstFb = this;
                return false;
            }
        });
        socialNetworkId = firstFb && firstFb.socialNetworkId;
    }
    if (!socialNetworkId && $target.hasClass("_userInfoPopupHere")) {
        socialNetworkId = $target.attr('snid');
    }

    if (!socialNetworkId) {
        var messageParent = $target.closest(".message");
        if (messageParent) {
            socialNetworkId = messageParent.attr('snid');
        }
    }

    if (socialNetworkType != stream_network.TWITTER && $target.hasClass("_twitter")) {
        socialNetworkId = null;	// when looking up twitter users in non-twitter streams, do not use socialNetworkId
    }

    var standardized = false;
    if ($target.hasClass('_standardized')) {
        standardized = true;
    }

    if (socialNetworkType === 'FACEBOOK' && userId.indexOf('|') >= 0) {
        userId = userId.split('|')[1];
    }
    var data = {
        userId: userId,
        socialNetworkId: socialNetworkId,
        socialNetworkType: socialNetworkType,
        xPos: xPos,
        ptwImpressionId: ptwImpressionId,
        type: type,
        userName: userName,
        standardized: standardized
    };
    streamsFlux.getActions(MESSAGE).showSocialProfile(data);
    return false;
};

stream_network.initYoutubeRelationshipsDropdown = function (data) {
    const $userInfoPopup = $('#twitterUserInfoPopup');
    if (_.has(data, 'youtubeRelationships') && $userInfoPopup.find('._relationshipInfo')[0]) {
        var fluxComponentProps = {
            flux: streamsFlux,
            connectToStores: {
                socialNetworks: function (store) {
                    return {socialNetworks: store.getMultiple(_.keys(data.youtubeRelationships))};
                }
            }
        };
        var containerProps = {
            profileId: data.apiResult.id,
            subscriptionStates: data.youtubeRelationships
        };

        var containerElement = $userInfoPopup.find('._relationshipInfo')[0];
        var container = React.createElement(SubscriptionManagerContainer, containerProps);
        var fluxComponentWrapper = React.createElement(FluxComponent, fluxComponentProps, container);
        ReactDOM.render(fluxComponentWrapper, containerElement);

        $userInfoPopup.dialog('option', {
            close: function () {
                ReactDOM.unmountComponentAtNode(containerElement);
            }
        });
    }
}

stream_network.bindPostsTabControls = function (username, trackingParams, socialNetworkType) {
    const $userInfoPopup = $('#twitterUserInfoPopup');
    if ($userInfoPopup) {
        $userInfoPopup.find('._streamTypeDropDown ._sddMenu button').click(function (_e) {
            var $target = $(this);
            if ($target.is('.disabled, .active')) {
                return;
            }
            var spinnerHtml = "<div class='large-loading'><span class='icon-anim x-radialLines'></span></div>";
            $userInfoPopup.find('._content').hide();
            if ($target.is('._timeline')) {
                hs.trackEvent($.extend({action: 'timeline'}, trackingParams));
                trackerDataLab.trackCustom('web.dashboard.user_info.streamDropDown', 'user_info_timeline_clicked', {socialNetworkType: socialNetworkType});
                $userInfoPopup.find('._contents ._timeline').show().find('._body').empty().html(spinnerHtml);
                window.stream.twitter.viewUserTweets(username, $userInfoPopup.find('._contents ._timeline ._body'));
            } else if ($target.is('._mentions')) {
                hs.trackEvent($.extend({action: 'mentions'}, trackingParams));
                trackerDataLab.trackCustom('web.dashboard.user_info.streamDropDown', 'user_info_mentions_clicked', {socialNetworkType: socialNetworkType});
                $userInfoPopup.find('._contents ._mentions').show().find('._body').empty().html(spinnerHtml);
                window.stream.twitter.viewUserMentions(username, $userInfoPopup.find('._contents ._mentions ._body'));
            } else if ($target.is('._favorites')) {
                hs.trackEvent($.extend({action: 'favorites'}, trackingParams));
                trackerDataLab.trackCustom('web.dashboard.user_info.streamDropDown', 'user_info_favorites_clicked', {socialNetworkType: socialNetworkType});
                $userInfoPopup.find('._contents ._favorites').show().find('._body').empty().html(spinnerHtml);
                window.stream.twitter.viewUserFavorites(username, $userInfoPopup.find('._contents ._favorites ._body'));
            }
        });
    }
}

stream_network.bindTwitterProfileComponents = function (socialNetworkId, data) {
    const $userInfoPopup = $('#twitterUserInfoPopup');
    if ($userInfoPopup) {
        $userInfoPopup.find('._view_followers').click(function (_) {
            if ($userInfoPopup.find('._contents ._showFollowers').is(":visible")) {
                $userInfoPopup.find('._contents ._showFollowers').hide();
            } else {
                var spinnerHtml = "<div class='icon-anim x-radialLines'></div>";
                $userInfoPopup.find('._contents ._showFollowers').show().find('._body').empty().html(spinnerHtml);
            }

            window.stream.twitter.viewFollowers(socialNetworkId, data.apiResult.id_str, $userInfoPopup.find('._contents ._showFollowers ._body'));

            $userInfoPopup.find('._contents ._showFollowers').on('click', '._doFollow', function (_) {
                window.toggleFollow(1, $(this).data('screenname'), $(this).data('userid'), null, "", {fullname: $(this).data('fullname')});
            });
        });
    }
}

stream_network.bindTwitterDropdownControls = function (socialNetworkId, userInfo) {
    const $userInfoPopup = $('#twitterUserInfoPopup');
    if ($userInfoPopup) {
        const { id_str, name, screen_name, socialProfileType } = userInfo;
        $userInfoPopup.find("._userInfoActions button").click(function (e) {
            e.preventDefault();
            // newActionTweet needs context for if the action is actually coming from twitter
            var isTwitter = socialProfileType && socialProfileType.toUpperCase() === stream_network.TWITTER || $(this).hasClass('_twitter');
            var socialNetworkContext = isTwitter ? 'TWITTER' : undefined;

            var text;
            if ($(this).hasClass('_follow')) {
                window.toggleFollow(1, screen_name, id_str, null, '', {fullname: name});
            }
            else if ($(this).hasClass('_unfollow')) {
                window.toggleFollow(0, screen_name, id_str, null, '', {fullname: name});
            }
            else if ($(this).hasClass('_reply')) {
                text = '@' + screen_name + hs.memberAutoInitial + ' ';
                if (darklaunch.isFeatureEnabled('NGE_19820_LEGACY_COMPOSE_DEPRECATION')) {
                    const params = {
                        messageText: text,
                        socialNetworkId
                    };
                    hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, params);
                } else {
                    window.newActionTweet('', text, '', '', undefined, undefined, undefined, undefined, socialNetworkContext);
                }
            }
            else if ($(this).hasClass('_dm')) {
                text = 'd ' + screen_name + hs.memberAutoInitial + ' ';
                if (darklaunch.isFeatureEnabled('NGE_19820_LEGACY_COMPOSE_DEPRECATION')) {
                    const params = {
                        messageText: text,
                        socialNetworkId
                    };
                    hootbus.emit(HOOTBUS_EVENT_OPEN_COMPOSER, params);
                } else {
                    window.newActionTweet('', text, '', '', undefined, undefined, undefined, undefined, socialNetworkContext);
                }
            }
            else if ($(this).hasClass('_addToList')) {
                window.stream.twitter.addUserToListPopup(id_str);
                trackerDataLab.trackCustom('web.dashboard.streams', 'stream_user_bio_add_to_list');
            }
        });
        // init buttons
        $userInfoPopup.find('._muteAccount').click(function (e) {
            e.preventDefault();
            if ((!socialNetworkId || parseInt(socialNetworkId, 10) < 1) && $("#streamsContainer, #contactsSection").length) {
                // for streams section and we can't find the socialNetworkId
                window.selectSocialNetworkPopup(function (selectedSocialNetworkId) {
                    window.stream.twitter.muteAccount(screen_name, selectedSocialNetworkId);
                }, translation._("Which Twitter profile should mute this user?"));
            } else {
                window.stream.twitter.muteAccount(screen_name, socialNetworkId);
            }
        });
        $userInfoPopup.find('._blockAccount').click(function (e) {
            e.preventDefault();
            if ((!socialNetworkId || parseInt(socialNetworkId, 10) < 1) && $("#streamsContainer, #contactsSection").length) {
                // for streams section and we can't find the socialNetworkId
                window.selectSocialNetworkPopup(function (selectedSocialNetworkId) {
                    window.stream.twitter.blockUser(screen_name, selectedSocialNetworkId);
                }, translation._("Which Twitter profile should block this user?"));
            } else {
                window.stream.twitter.blockUser(screen_name, socialNetworkId);
            }
        });
        $userInfoPopup.find('._reportAccount').click(function (e) {
            e.preventDefault();
            if ((!socialNetworkId || parseInt(socialNetworkId, 10) < 1) && $("#streamsContainer, #contactsSection").length) {
                // for streams section and we can't find the socialNetworkId
                window.selectSocialNetworkPopup(function (selectedSocialNetworkId) {
                    window.stream.twitter.reportSpam(screen_name, selectedSocialNetworkId);
                }, translation._("Which Twitter profile should report this user?"));
            } else {
                window.stream.twitter.reportSpam(screen_name, socialNetworkId);
            }
        });
    }
}

stream_network.bindCloseDialogControls = function () {
    const $userInfoPopup = $('#twitterUserInfoPopup');
    if ($userInfoPopup) {
        $userInfoPopup.find('._closeDialog').click(function () {
            $userInfoPopup.dialog('close');
        });
    }
}

stream_network.bindTabListeners = function (data, socialNetworkType, socialNetworkId, trackingParams) {
    const $userInfoPopup = $('#twitterUserInfoPopup');
    if ($userInfoPopup) {
        // init tabs
        $userInfoPopup.find('._tabs ._tab').click(function (e) {
            e.preventDefault();
            var $target = $(this);
            var spinnerHtml = "<div class='large-loading'><img src='" + hs.util.rootifyImage('/dashboard/loaders/round-radial-lines-loader.gif') + "' /></div>";
            if ($target.is('.disabled, .active')) {
                return;
            }

            $userInfoPopup.find('._tabs ._tab').removeClass('active');
            $target.addClass('active');
            $userInfoPopup.find('._content').hide();	// hide all content

            if ($target.is('._bio')) {
                $userInfoPopup.find('._contents ._bio').show();
            } else if ($target.is('._timeline')) {
                hs.trackEvent($.extend({action: 'timeline'}, trackingParams));
                trackerDataLab.trackCustom('web.dashboard.user_info.timeline', 'user_info_timeline_clicked', {socialNetworkType: socialNetworkType});
                $userInfoPopup.find('._contents ._timeline').show().find('._body').empty().html(spinnerHtml);
                window.stream.twitter.viewUserTweets(data.apiResult.screen_name, $userInfoPopup.find('._contents ._timeline ._body'));
            } else if ($target.is('._mentions')) {
                hs.trackEvent($.extend({action: 'mentions'}, trackingParams));
                trackerDataLab.trackCustom('web.dashboard.user_info.mentions', 'user_info_mentions_clicked', {socialNetworkType: socialNetworkType});
                $userInfoPopup.find('._contents ._mentions').show().find('._body').empty().html(spinnerHtml);
                window.stream.twitter.viewUserMentions(data.apiResult.screen_name, $userInfoPopup.find('._contents ._mentions ._body'));
            } else if ($target.is('._favorites')) {
                hs.trackEvent($.extend({action: 'favorites'}, trackingParams));
                trackerDataLab.trackCustom('web.dashboard.user_info.favorites', 'user_info_favorites_clicked', {socialNetworkType: socialNetworkType});
                $userInfoPopup.find('._contents ._favorites').show().find('._body').empty().html(spinnerHtml);
                window.stream.twitter.viewUserFavorites(data.apiResult.screenName, $userInfoPopup.find('._contents ._favorites ._body'));
            } else if ($target.is('._history')) {
                hs.trackEvent($.extend({action: 'interactionhistory'}, trackingParams));
                trackerDataLab.trackCustom('web.dashboard.user_info.interaction_history', 'user_info_interaction_history_clicked', {
                    socialNetworkType: socialNetworkType,
                    from: socialNetworkId,
                    to: data.apiResult.id
                });
                var $ihPopupContent = $userInfoPopup.find('._contents ._history');
                $ihPopupContent.show();
                if (socialNetworkType.toUpperCase() === stream_network.TWITTER) {
                    if (hs.isFeatureEnabled('NGE_3295_INTERACTION_HISTORY_SERVICE_TWITTER')) {
                        stream_network.showInteractionHistorySNPicker(socialNetworkId, socialNetworkType, data.apiResult.id_str, $ihPopupContent);
                    }
                } else {
                    if (hs.isFeatureEnabled('NGE_3295_INTERACTION_HISTORY_SERVICE')) {
                        stream_network.showInteractionHistorySNPicker(socialNetworkId, socialNetworkType, data.apiResult.id, $ihPopupContent);
                    }
                }
            } else if ($target.is('._notes')) {
                hs.trackEvent($.extend({action: 'notes'}, trackingParams));
                trackerDataLab.trackCustom('web.dashboard.user_info.notes', 'user_info_notes_clicked', {socialNetworkType: socialNetworkType});
                window.stream.twitter.viewNotes(data.apiResult.id, $userInfoPopup.find('._contents ._notes'));
            }
        });
    }
}

/**
 * Populates the Twitter User Info popup
 * @param $userInfoPopup the popup element
 * @param username
 * @param socialNetworkId
 * @param data contains user info
 * @param socialNetworkType
 * @param trackingParams
 */
stream_network.populateUserInfoPopup = function ($userInfoPopup, username, socialNetworkId, data, socialNetworkType, trackingParams) {

    if (!$userInfoPopup.length) {
        return;
    }


    $userInfoPopup.html(twemoji.parse($('<div>').html(data.output).get(0)));

    if (darklaunch.isFeatureEnabled('NGE_17053_USER_INFO_POPUP_MIGRATION')) {
        asyncStreamLoader('userInfoPopup', { userInfo: data.apiResult })
    }

    if (darklaunch.isFeatureEnabled('NGE_17664_USER_INFO_POPUP_PROFILE_MIGRATION')) {
        asyncStreamLoader('userInfoPopupProfile', {data: data});
    }

    if (darklaunch.isFeatureEnabled('NGE_17668_USER_INFO_POPUP_POSTS_MIGRATION') && socialNetworkType.toUpperCase() === stream_network.TWITTER) {
        const userHandle = data.apiResult.screen_name;
        const fullName = data.apiResult.name;
        asyncStreamLoader('userInfoPopupPosts', {
            name: fullName,
            socialNetworkType: socialNetworkType,
            trackingParams: trackingParams,
            username: userHandle,
        });
    }

    if (darklaunch.isFeatureEnabled('NGE_17676_USER_INFO_POPUP_NOTES_MIGRATION') && socialNetworkType.toUpperCase() === stream_network.TWITTER) {
        asyncStreamLoader('userInfoPopupNotes', {});
    }

    if (darklaunch.isFeatureEnabled('NGE_17672_USER_INFO_POPUP_INTERACTIONS_MIGRATION')) {
        asyncStreamLoader('userInfoPopupInteractions', {socialProfileType: socialNetworkType});
    }

    /**
     * If the user has notes associated with them display a different colored tab
     */

    if (data.apiResult) {
        window.stream.twitter.hasNotes(data.apiResult.id);
    }

    var title = $userInfoPopup.find("input[name='username']").val(),
        screenName = $userInfoPopup.find("input[name='screenname']").val(),
        companyName = $userInfoPopup.find("input[name='companyname']").val();
    if (screenName && screenName.length) {
        title += ' <em>(' + screenName + ')</em>';
    }
    if (!title && companyName) {
        title = companyName;
    }

    if (title) {
        title = $(twemoji.parse($('<div>').html(title).get(0))).html();
    }

    if (title) {
        $userInfoPopup.dialog('option', {title: title});
    }

    stream_network.bindTabListeners(data, socialNetworkType, socialNetworkId, trackingParams)

    // disable insight tab for facebook pages
    if (socialNetworkType.match(/facebook/i) && username.match(/page/i)) {
        $userInfoPopup.find('._tabs ._tab._insight').addClass('disabled');
    }

    stream_network.bindTwitterDropdownControls(socialNetworkId, data.apiResult);
    stream_network.bindTwitterProfileComponents(socialNetworkId, data);
    stream_network.initYoutubeRelationshipsDropdown(data);
    stream_network.bindCloseDialogControls();
    stream_network.bindPostsTabControls(screenName, trackingParams, socialNetworkType);
};

stream_network.showInteractionHistorySNPicker = function (socialNetworkId, boxType, targetId, $target) {
    $target.show();
    $target.find('.noContent').remove();

    if (boxType.toUpperCase() !== stream_network.FACEBOOK) {
        var html = hsEjs.getEjs('stream/snpicker').render();
        if ($target.find('._header ._socialNetworkDropdown').length === 0) {
            $target.find('._header').append(html);
        }
    }
    var $dd = $target.find('._socialNetworkDropdown');

    var networks = [];
    if (boxType.toUpperCase().indexOf(stream_network.FACEBOOK) === 0) {
        networks = hs.socialNetworksKeyedByType['FACEBOOKPAGE'];
    } else {
        networks = hs.socialNetworksKeyedByType[stream_network.TWITTER];
    }

    var snList = [];
    var currentId = false;
    var selectedNetwork;

    if (!$dd.length && _.size(networks) > 0) {
        // For networks without profile picker, load interactions once
        _.each(networks, function (network) {
            if (network.socialNetworkId == socialNetworkId) {
                $target.find('._ihContent').empty();
                stream_network.getInteractionHistory(network.userId, boxType, targetId, $target);
            }
        });
    } else if (_.size(networks) > 0) {
        // Initialize profile picker for supported social networks
        _.each(networks, function (network) {
            if (network.userId != targetId) {
                snList.push({
                    title: network.username,
                    optId: network.socialNetworkId,
                    externalId: network.userId
                });
            } else {
                currentId = network.socialNetworkId;
            }
        });

        if (snList.length > 0) {
            if (currentId === socialNetworkId || !socialNetworkId) {
                selectedNetwork = snList[0].optId;
            } else {
                selectedNetwork = socialNetworkId;
            }

            $dd.removeClass('disabled');
            $dd.hsDropdown({
                data: {items: snList},
                change: function (dropDownItem) {
                    $target.find('._ihContent').empty();
                    stream_network.getInteractionHistory(dropDownItem.externalId, boxType, targetId, $target);
                }
            }).hsDropdown('selectElement', selectedNetwork, 'optId');
        } else {
            $dd.hsDropdown({
                data: {
                    items: [
                        {title: translation._("No profiles were found")}
                    ]
                }
            }).hsDropdown('selectFirstElement');
        }
    } else if ($dd.length) {
        $dd.hsDropdown({
            data: {
                items: [
                    {title: translation._("No profiles were found")}
                ]
            }
        }).hsDropdown('selectFirstElement');
    }
};

stream_network.getInteractionHistory = function (socialNetworkId, boxType, targetSocialNetworkId, $target, cursor) {
    var $body = $target.find('._ihContent');
    var html = '';

    // Clear out any previous errors
    $body.find('.x-error').remove();

    // The very first call to interaction history has no 'cursor' param
    if (!cursor) {
        $body.css({ 'display': 'block' }).addClass('stream');
    }

    var data = {
        sourceUserId: socialNetworkId,
        targetUserId: targetSocialNetworkId,
        socialNetworkType: boxType,
        cursor: cursor,
    };

    ajaxCall({
        type: 'GET',
        url: "/ajax/network/get-interaction-history",
        data: data,
        beforeSend: function () {
            $body.append('<div class="ui-dialog-section ui-ghost c-c _ihLoading"><span class="icon-anim load-circular"></span></div>');
        },
        success: function (data) {
            $('._ihLoading').remove();

            if (data.success === 0 && data.errorMessage) {
                html += hsEjs.getEjs('stream/ih-error').render({message: data.errorMessage});
            } else if (_.isArray(data.data)) {
                if (data.data.length === 0) {
                    if (!cursor) {
                        html += hsEjs.getEjs('stream/ih-nohistory').render();
                    } else {
                        html += hsEjs.getEjs('stream/ih-endofhistory').render();
                    }
                } else {
                    var isFacebookHistory = (boxType.toUpperCase().indexOf(stream_network.FACEBOOK) === 0);
                    _.each(data.data, function (item) {
                        // Swap image src to anon avatar asset if there is an error with loading initial src
                        var avatarFallbackFunc = 'this.onerror = null; this.src = \'' + avatarAssets.DEFAULT + '\';';
                        var avatar = {
                            anonUrl: avatarAssets.DEFAULT,
                            fallbackFunc: avatarFallbackFunc,
                        };
                        if (isFacebookHistory) {
                            const data = {
                                avatar,
                                urlClickable: makeUrlClickable,
                                formatDate: formatDateWithOffset,
                                message: item
                            };
                            if (item.id.substring(0, 2) === 'm_') {
                                html += hsEjs.getEjs('stream/facebook/interactionhistory/private_message').render(data);
                            } else {
                                html += hsEjs.getEjs('stream/facebook/interactionhistory/comment').render(data);
                            }
                        } else {
                            const data = {
                                formatDate: formatDateWithOffset,
                                interaction: item
                            };
                            if (item.type === 'MENTION') {
                                html += hsEjs.getEjs('stream/twitter/interactionhistory/mention_via_ih').render(data);
                            } else if (item.type === 'DIRECT_MESSAGE') {
                                html += hsEjs.getEjs('stream/twitter/interactionhistory/directmessage_via_ih').render(data);
                            } else if (item.type === 'QUOTE') {
                                html += hsEjs.getEjs('stream/twitter/interactionhistory/quote_via_ih').render(data);
                            }
                        }
                    });

                    if (!_.isEmpty(data.cursor)) {
                        html += hsEjs.getEjs('stream/ih-loadmore').render();
                    } else {
                        html += hsEjs.getEjs('stream/ih-endofhistory').render();
                    }
                }
            }
            $body.append(html);
            $("._ihLoadMore").on("click", function () {
                $('._ihLoadMore').remove();
                stream_network.getInteractionHistory(socialNetworkId, boxType, targetSocialNetworkId, $target, data.cursor.next);
            });
        },
        error: function () {
            $('._ihLoading').remove();
            var errorMessage = translation._("Failed to load Interaction History. Please try again.");
            html += hsEjs.getEjs('stream/ih-error').render({message: errorMessage});
            $body.append(html);
        }
    }, 'qm');
};

/**
 * shows relationship info dialog
 */
stream_network.showRelationshipInfoPopup = function (e) {
    stream_network.relationshipInfoOffset = 0;
    var xPos = e.pageX + 30;
    //var target = e.target;

    if (xPos > ($(window).width() - 300)) {
        xPos -= 300;
    }

    /**
     * Intially try to read a value off the button element that opens the relationships popup to support new React code.
     * Then fallback and read the hidden inputs that are provided in the legacy code.
     */
    stream_network.relationshipUser = $(this).attr('data-screenname') ?? $(this).closest('._contents').children('input[name=screenname]').val();
    stream_network.relationshipUserId = $(this).attr('data-userid') ?? $(this).closest('._contents').children('input[name=userId]').val();

    var params = {
            height: 'auto',
            width: 380,
            position: [xPos, 50],
            title: translation.c.LOADING,
            modal: false,
            draggable: true,
            closeOnEscape: true,
            content: "<div class='large-loading'><img src='" + hs.util.rootifyImage('/dashboard/loaders/round-radial-lines-loader.gif') + "' /></div>"
        },
        trackingParams = {
            category: 'bio',
            label: 'relationships'
        };

    stream_network.$relationshipInfoPopup = $.dialogFactory.create('twitterRelationshipPopup', params),

        hs.trackEvent($.extend({action: 'open'}, trackingParams));

    stream_network.gatherRelationshipInfo();

    return false;
};

/**
 * Populate relationship info dialog
 */
stream_network.gatherRelationshipInfo = function () {

    var limit = 20;

    // Get Twitter SocialNetworkIds, store in array
    var networks = [];
    for (var network in hs.socialNetworks) {
        if (hs.socialNetworks[network].type === 'TWITTER') {
            networks.push(hs.socialNetworks[network]);
        }
    }

    // Check current offset for list of twitter networks
    // Populate an array of id's to check for relationship status
    var networksToSend = [];
    for (var i = stream_network.relationshipInfoOffset;
        i < (stream_network.relationshipInfoOffset + limit) && i < networks.length;
        i++) {
        networksToSend.push(networks[i]['socialNetworkId']);
    }

    trackerDataLab.trackCustom('web.dashboard.stream', 'user_relationship_info_opened', {
        "username": stream_network.relationshipUser,
        "userId": stream_network.relationshipUserId,
        "networksCount": networksToSend.length
    });

    var params = {
        "networks": networksToSend,
        "username": stream_network.relationshipUser,
        "userId" : stream_network.relationshipUserId
    };

    var url = "/ajax/network/relationship-info";

    ajaxCall({
        type: 'POST',
        data: params,
        url: url,
        success: function (data) {
            stream_network.$relationshipInfoPopup.dialog('option', {'title': 'Relationships'});
            var $data = $(data.output);

            stream_network.$relationshipInfoPopup.html($data);
            if (darklaunch.isFeatureEnabled('NGE_17054_RELATIONSHIP_POPUP')) {
                asyncStreamLoader('relationshipsPopup')
            }
        }
    }, 'qm');

    stream_network.relationshipInfoOffset = stream_network.relationshipInfoOffset + limit;

};

/**
 * showUserInfoPopup
 */
stream_network.showUserInfoPopup = function (userId, socialNetworkId, socialNetworkType, xPosition, ptwImpressionId, _type, userName, standardized) {
    socialNetworkType = socialNetworkType || '';
    xPosition = xPosition || 'center';

    var params = {
            height: 'auto',
            width: 528,
            position: [xPosition, 50],
            title: translation.c.LOADING,
            modal: false,
            draggable: true,
            closeOnEscape: true,
            content: "<div class='large-loading'><img src='" + hs.util.rootifyImage('/dashboard/loaders/round-radial-lines-loader.gif') + "' /></div>"
        },
        $userInfoPopup = $.dialogFactory.create('twitterUserInfoPopup', params),
        trackingParams = {
            category: 'bio',
            label: userId
        };

    trackerDataLab.trackCustom('web.dashboard.stream', 'user_profile_opened', {socialNetworkType: socialNetworkType, from: socialNetworkId, to: userId });
    hs.trackEvent($.extend({action: 'open'}, trackingParams));

    var url = "/ajax/network/user-info?userId=" + (userId ? encodeURIComponent(userId) : "") + "&socialNetworkId=" + (socialNetworkId ? encodeURIComponent(socialNetworkId) : "") + "&socialNetworkType=" + encodeURIComponent(socialNetworkType);

    // Temporary fix for NGE-441
    if (standardized) {
        url += "&s=1";
    }

    if (userName) {
        url = url + '&userName=' + encodeURIComponent(userName);
    }

    ajaxCall({
        type: 'GET',
        url: url,
        success: function (data) {
            if (_.has(data, 'apiResult') && !!data.apiResult && !!data.apiResult.id) {
                window.stream.twitter.hasNotes(data.apiResult.id, function (data) {
                    if (data) {
                        $userInfoPopup.find('._tab._notes').addClass('hasContent');
                    }
                });

                if (socialNetworkType.toUpperCase() == stream_network.INSTAGRAM) {
                    userId = data.apiResult.id;
                }
            }
            stream_network.populateUserInfoPopup($userInfoPopup, userId, socialNetworkId, data, socialNetworkType, trackingParams);
        }
    }, 'single');

};

/**
 * renderSteamOutsideBox
 */
stream_network.renderSteamOutsideBox = function (el, messages, avatar, socialNetworkId, socialNetworkType, renderer, disableComments) {
    var $el = $(el);
    disableComments = (typeof disableComments === "undefined") ? true : disableComments;

    $el.empty().html('<div class="_body"><div class="_message stream"></div></div>');

    var $content = $el.find('._message');

    var msgs = {
        messages: messages,
        snAvatar: avatar,
        disableComments: disableComments,
        box: {
            type: socialNetworkType,
            boxId: 0,
            socialNetworkId: socialNetworkId
        }
    };
    var $html = renderer(msgs);

    // @TODO: call the function to do lazy loading instead
    $html.find('img[lazysrc]').attr('src', function () {
        return $(this).attr('lazysrc');
    }).removeAttr('lazysrc');
    $html.find('[lazystyle]').attr('style', function () {
        return $(this).attr('lazystyle');
    }).removeAttr('lazystyle');

    $content.empty().html($html);

    $el.data({
        type: socialNetworkType,
        socialNetworkId: socialNetworkId
    });
    $el.bind('scroll.updateStream', window.stream.stream.updateStreamOnScroll);

    window.stream.stream.updateStreamOnScroll($el);

    $el.scrollTop(0);
};

stream_network.toggleCommentFavorite = function (commentId, socialNetworkId) {
    var $comments = $('._comment_' + commentId),
        $fav = $comments.find("._fav"),
        favValue = $comments.data('fav'),
        on = (parseInt(favValue, 10) === 1 || favValue === "true" || favValue === true) ? '0' : '1';

    ajaxCall({
        url: "/ajax/network/toggle-favorite",
        data: "id=" + commentId + "&socialNetworkId=" + socialNetworkId + "&on=" + on,
        beforeSend: function () {
            if (on === "1") {
                hs.statusObj.update(translation._("Liking comment..."), 'info');
            } else {
                hs.statusObj.update(translation._("Un-liking comment..."), 'info');
            }
        },
        success: function (data) {
            if (typeof data.status.error.code === 'undefined' || data.status.error.code == null)	// OK
            {
                hs.statusObj.reset();
                $comments.data('fav', on);
                $fav.children(".like, .unLike").swapClass("like", "unLike");
            } else {
                hs.statusObj.update(data.status.error.message, 'error', true);
            }
            return false;
        },
        error: function () {
            hs.statusObj.reset();
        },
        abort: function () {
            hs.statusObj.reset();
        }
    }, 'q1');
};

/**
 * toggleFavorite
 */
stream_network.toggleFavorite = function (messageDivId, socialNetworkId, ptwImpressionId) {
    var $messageDiv = $("#" + messageDivId),
        favValue = $messageDiv.data('fav');

    if (favValue == "-1") {
        return false;
    }	// can't be favorited (esp the case in facebook)

    var $closestBody = $messageDiv.closest("._body");
    var $fav = $closestBody.find("._options ._fav") || $closestBody.siblings("._options ._fav");
    $fav = $fav.find('span').length ? $fav.find('span') : $fav;		// favorites could be nested in the more menu...which uses <span> icon-19

    var postId = null,
        isTwitter = $fav.is(".favorite, .notFavorite");

    postId = $messageDiv.attr("externalpostid");


    var on = (parseInt(favValue, 10) === 1 || favValue === "true" || favValue === true) ? '0' : '1';

    var params = {
        id: postId,
        socialNetworkId: socialNetworkId,
        ptwImpressionId: ptwImpressionId || '',
        metadata: {
            liked: on
        }
    };
    streamsFlux.getActions(MESSAGE).toggleLike(params).then(function () {
        $messageDiv.data('fav', on);
        if (isTwitter) {
            $fav.swapClass("favorite", "notFavorite");
        } else {
            $fav.swapClass("like", "unLike");
            var $likeCount = $messageDiv.find('._likeCount span'),
              value = on === 1 || on === true || on === '1' ? 1 : -1,
              output = parseInt($likeCount.html(), 10) + value;

            output = output < 0 ? 0 : output;
            $likeCount.html(output);
        }
    });

    return false;
};

/**
 * Scroll to a given message
 */
stream_network.jumpToMessage = function (divId, callback) {
    var $message = $("#" + divId);

    var $assignment = $message.prev('._assignment');
    if ($assignment.length) {
        $message = $assignment;
    }


    var divTop = $message.position().top;

    if (divTop === 0) {
        if ($.isFunction(callback)) {
            callback();
            return;
        }
    }

    var boxBody = $message.closest("._body"),
        bodyScrollTop = boxBody.scrollTop(),
        $header = $message.closest("._box").find('._header');

    var value = bodyScrollTop + divTop - $header.outerHeight();

    //boxBody.scrollTop(value);
    hs.stopMessageMenuEvent = true;	// stop the event when scrolling
    boxBody.animate({scrollTop: value}, 750, null, function () {
        hs.stopMessageMenuEvent = false;
        callback();
    });
};

window.stream = window.stream || {};
window.stream.network = stream_network;

export default stream_network;
