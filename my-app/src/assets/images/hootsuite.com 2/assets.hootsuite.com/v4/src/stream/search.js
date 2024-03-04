import _ from 'underscore';
import twemoji from 'twemoji';
import { NO_TWITTER_SEARCH, getFeatureAccessPermission } from 'fe-lib-entitlements';
import translation from 'utils/translation';
import hsEjs from 'utils/hs_ejs';
import { asyncStreamLoader } from './components/streams-loader';
import { formatDate } from 'utils/string';

/** @namespace */
const stream_search = window.stream && window.stream.search || {};

/**
 * init
 */
stream_search.init = function () {
    //Twitter quick search
    $("#quickSearchPopup ._options a, #quickSearchPopup ._options button").live("click", function () {
        window.stream.box.messageOptionsButtonHandler(this, hs.currentMessage);
    });
};

/**
 * showTwitterSearchResultsPopup
 */
stream_search.showTwitterSearchResultsPopup = function (title) {
    title = (title) ? title : translation._("Twitter search results");

    var params = {
        width: 400,
        minHeight: 400,
        modal: false,
        resizable: false,
        draggable: true,
        closeOnEscape: true,
        position: ['center', 50],
        title: title,
        content: "<div class='large-loading'><img src='" + hs.util.rootifyImage('/dashboard/loaders/round-radial-lines-loader.gif') + "' /></div>"
    };

    $.dialogFactory.create('quickSearchPopup', params);
};

/**
 * buildSearchResultsGenerator
 */
stream_search.buildSearchResultsGenerator = function (ejs) {
    return function (results, isError) {
        var template = hsEjs.getEjs(ejs);
        var html = results && results.length ? '' : '<div class="message">' + isError ? '<div class="message x-error">' + window.stream.twitter.MSG_SEARCH_ERROR_TERMS + '</div>' : translation._("No results found") + '</div>';

        if (!results) {
            return html;
        }

        var userAvatar = '';
        $.each(results, function (i, item) {
            // fix tweet id
            item.id = item.id_str;
            userAvatar = item.profile_image_url_https || item.user.profile_image_url_https;

            var data = {
                item: item,
                messageDivId: 'tweet_' + item.id,
                userAvatar: userAvatar,
                username: item.screen_name,
                userId: item.user ? item.user.id_str : item.id,
                postedTime: formatDate(item.created_at),
                text: window.stream.box.formatTweet(item),
                stripped_source: ''
            };

            if (item.source) {
                data.username = item.from_user || item.user.screen_name;

                var source = item.source.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace("<a", "<a target=\"_blank\"");
                data.stripped_source = source.replace(/(<([^>]+)>)/ig, "");
            }

            html += template.render(data);
        });
        return html;
    };
};

/**
 * buildSearchResults
 */
stream_search.buildSearchResults = stream_search.buildSearchResultsGenerator('stream/twittersearch');

stream_search.buildFollowersResults = stream_search.buildSearchResultsGenerator('stream/twitterfollowersearch');

/**
 * displaySearchResultsContent
 * @param term
 * @param isError
 */
stream_search.displaySearchResultsContent = function (term, isError, hideSaveSearch) {
    var $quickSearchPopup = $('#quickSearchPopup');
    if (!$quickSearchPopup.length) {
        return; // stop if the popup is closed
    }

    var insertHtml = "<div class='topTabs _tabs'>";
    insertHtml += "<div class='tab trim _tab _tweets'>" + translation._("Tweets") + "</div>";
    insertHtml += "<div class='tab trim _tab _users' style='display:none;'>" + translation._("Users") + "</div>";
    insertHtml += "<div class='tab trim _tab _fsearchPopup' style='display:none;'>" + translation._("Facebook") + "</div>";
    insertHtml += "</div>";
    insertHtml += "<div class='_box _body _search-results ui-dialog-section ui-dialog-tabs-section ui-dialog-scroll'><div class='_contents'>";
    insertHtml += "<div class='_content _messages stream' style='display:none;'></div>";
    insertHtml += "<div class='_content _usersList stream' style='display:none;'></div>";
    insertHtml += "<div class='_content _fsearchPopupResults stream' style='display:none;'></div>";
    insertHtml += "</div></div>";
    insertHtml += "<div class='btns btns-right'>";

    if (term && $("#streamsContainer:visible").length && $('#dashboardTabs ._tab.active').length && !isError && !hideSaveSearch) {	// only show save as column when users is searching a term (not viewing Tweets from user), and if on the actual dashboard
        // eslint-disable-next-line no-control-regex
        var escapedTerm = term.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
        escapedTerm = escapedTerm.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

        insertHtml += '<button class="btn-cmt trim _submitSaveAsColumn" onclick=\'saveSearchAsColumn("' + escapedTerm + '", true);\'>' + translation._("Save as Stream") + '</button>';
    }

    insertHtml += "</div>";

    $quickSearchPopup.html(twemoji.parse($('<div>').html(insertHtml).get(0)));

    //add tab switching functionality
    $quickSearchPopup.find('._tabs ._tab').click(function (e) {
        e.preventDefault();
        var $target = $(this);
        if ($target.is('.disabled, .active')) {
            return;
        }

        $quickSearchPopup.find('._tabs ._tab').removeClass('active');
        $target.addClass('active');
        $quickSearchPopup.find('._content').hide();	// hide all content
        $quickSearchPopup.find('._options').hide();	// hide all message options
        if ($target.is('._tweets')) {
            $quickSearchPopup.find('._contents ._messages').show();
            $quickSearchPopup.find('._options._twitter').show();
        } else if ($target.is('._users')) {
            $quickSearchPopup.find('._contents ._usersList').show();
        } else if ($target.is('._fsearchPopup')) {
            $quickSearchPopup.find('._contents ._fsearchPopupResults').show();
        }
    });
};

/**
 * displayTwitterSearchResults
 * @param results
 * @param isError
 */
stream_search.displayTwitterSearchResults = function (results, isError) {
    var $twitterResultsStream = $('._contents ._messages');
    if (!$twitterResultsStream.length) {
        return; // stop if the popup is closed
    }

    var resultListHtml = stream_search.buildSearchResults(results, isError);
    $twitterResultsStream.append(resultListHtml);

    if (results && results.length) {
        var twitterMessageOptionHtml = "<span class='_options _twitter' style='position:absolute; z-index:2;display: none'>";
        twitterMessageOptionHtml += " <button class='_jsTooltip _fav' title='" + translation._("Like / Unlike") + "'><span class='icon-19 notFavorite'></span></button>";
        twitterMessageOptionHtml += " <button class='_jsTooltip _dm' title='" + translation._("Direct Message") + "'><span class='icon-19 directMessage'></span></button>";
        twitterMessageOptionHtml += " <button class='_jsTooltip _reply' title='" + translation._("Reply") + "'><span class='icon-19 reply'></span></button>";
        twitterMessageOptionHtml += " <button class='_jsTooltip _retweet' title='" + translation._("Re-Tweet") + "'><span class='icon-19 retweet'></span></button>";
        twitterMessageOptionHtml += "</span>";

        $('._contents').append(twitterMessageOptionHtml);
    }
};

/**
 * displayTwitterSearchResultsStream
 * @param term
 * @param results
 * @param isError
 */
stream_search.displayTwitterSearchResultsStream = function (term, results, isError, hideSaveSearch) {
    var $quickSearchPopup = $("#quickSearchPopup");

    stream_search.displaySearchResultsContent(term, isError, hideSaveSearch);
    stream_search.displayTwitterSearchResults(results, isError);

    $quickSearchPopup.find('._messages').show();
    $quickSearchPopup.find('._tabs ._tweets').addClass('active');
    $quickSearchPopup.find('._options._twitter').show();
};

/**
 * doTwitterPeopleSearch
 */
stream_search.doTwitterPeopleSearch = function (query, callback) {
    // must have a twitter account to do this search
    var snId = null;
    $.each(hs.socialNetworksKeyedByType['TWITTER'], function () {
        if (!this.isReauthRequired) {
            snId = this.socialNetworkId;
            return false;
        }
    });
    if (snId) {
        ajaxCall({
            type: 'GET',
            url: "/ajax/twitter/user-search?socialNetworkId=" + snId + "&query=" + encodeURIComponent(query) + "&count=20",
            success: function (data) {
                // if a callback function is passed in, use it and exit
                if (_.isFunction(callback)) {
                    callback(data);
                    return;
                }

                if (data.users && data.users.length && $("#quickSearchPopup").length) {
                    var insertHtml = '';
                    var screenNames = {};	// use to filter duplicates
                    $.each(data.users, function (i, item) {
                        var username = item.screen_name,
                            fullname = item.name,
                            userAvatar = item.profile_image_url_https;

                        if (screenNames[username]) {
                            return true; // continue
                        }

                        screenNames[username] = true;

                        insertHtml += '<div class="message x-networkResult">';
                        insertHtml += '<div class="-messageBody">';
                        insertHtml += '<img class="_userAvatar networkAvatar" src="' + userAvatar + '" title="' + username + '" />';
                        insertHtml += '<a class="_userInfoPopup _dragUser networkAvatarLink" href="http://twitter.com/' + username + '" target="_blank" title="' + username + '" rel="noopener noreferrer"></a>';
                        insertHtml += '<a class="_userInfoPopup networkName" href="http://twitter.com/' + username + '" target="_blank" title="' + username + '" rel="noopener noreferrer">';
                        insertHtml += '<span class="_username">' + username + '</span></a>&nbsp;<span class="u-t-lightSmall">(' + fullname + ')</span><br />';
                        insertHtml += '<button class="btn-lite-sta" onclick="toggleFollow(1,\'' + username + '\');" type="button">' + translation._("Follow") + ' ' + username + '</button>';
                        insertHtml += '</div>';
                        insertHtml += '</div>';
                        $("#quickSearchPopup").find('._tabs ._users').fadeIn();
                    });
                    //insertHtml += '<h3 class="section-title">' + translation._("Tweets Found") + ':</h3>';
                    $("#quickSearchPopup ._usersList").prepend(insertHtml);
                }
            }
        }, 'qm');
    } else {
        if (_.isFunction(callback)) {
            callback({})
        }
    }
};

/**
 * quickSearch
 * @param term
 */
window.quickSearch = function (term) {
    if (!$.trim(term).length) {
        return;
    }

    /*
     qs.options = {};
     qs.options.rpp = 50;
     qs.options.query = term;
     */
    var options = {
        rpp: 50,
        query: term
    };

    stream_search.showTwitterSearchResultsPopup(translation._("Search results for: ") + term.replace(/</g, '&lt;'));

    //qs.twitterClient.search(qs.options, function(data) {
    getFeatureAccessPermission(hs.memberId, NO_TWITTER_SEARCH).then(function (hasPermission) {
        window.stream.twitter.search(options, function (data) {

            var isError = data.error && data.error.length;
            stream_search.displayTwitterSearchResultsStream(term, data.results, isError, hasPermission);

            // do a from:<term> search
            //checkIfSearchTermIsUser(term);

            // do a formal user search with twitter api
            if (!term.match(/[^\w\d\s]|\b(and|or)\b/i)) {		// does not contain punctuation, or AND or OR
                stream_search.doTwitterPeopleSearch(term);
            }

            // add show more
            if (data.results && data.results.length) {
                var lastPost = $('._message:last');
                var maxId = lastPost.attr('externalpostid');
                maxId = maxId - 1;

                var $btnMore = $('<a href="#" class="messageMore _loadMore">' + translation._("Loading More...") + '</a>');
                $btnMore.unbind("click").click(function () {
                    window.quickSearchMore(term, maxId, data.page + 1);
                });

                var $moreDiv = $('<div class="message-more _tweetMore dg-e-bb"></div>');
                $moreDiv.append($btnMore);

                $("#quickSearchPopup div._messages").append($moreDiv);

                // bind the scroll autoload on the results
                window.initScrollAutoLoad("#quickSearchPopup div._body");
            }

            // scrollback to top
            $("#quickSearchPopup div._body").scrollTop(0);

        });
    });

    //return false;
};

/**
 * quickSearchMore
 * @param term
 * @param maxId
 * @param page
 */
window.quickSearchMore = function (term, maxId, page) {

    var $popup = $("#quickSearchPopup");
    var $button = $popup.find("._loadMore");
    $button.unbind("click");	// unbind to prevent multiple triggers

    /*
     qs.options = {};
     qs.options.rpp = 50;
     qs.options.query = term;
     qs.options.maxId = maxId;
     qs.options.page = page;
     */

    var lastPost = $('._message:last');
    maxId = lastPost.attr('externalpostid');
    maxId = maxId - 1;

    var options = {
        rpp: 50,
        query: term,
        maxId: maxId,
        page: page
    };

    //qs.twitterClient.search(qs.options, function(data) {
    window.stream.twitter.search(options, function (data) {

        if (data.results && data.results.length) {
            // append new results
            var moreHtml = stream_search.buildSearchResults(data.results);
            $popup.find("._tweetMoreHidden").show().swapClass('_tweetMoreHidden', '_tweetMore').before(moreHtml);
            // update button bind
            $button.click(function () {
                window.quickSearchMore(term, maxId, page + 1);	// reuse input params
            });
        } else {
            // no more
            $popup.find("._tweetMore").remove();
        }
    });
};

/**
 * saveSearchAsColumn
 * @param term
 * @param isFromPopup
 */
window.saveSearchAsColumn = function (term, isFromPopup) {
    if (!window.stream.saveBox.checkNumBoxes()) {
        return false;
    }

    if (!$("#streamTabInfo #editTabForm input[name='id']").length) {
        hs.statusObj.update(translation._("You can not add streams to this tab"), 'error', true);
        return false;
    }

    hs.trackEvent('stream', 'save_search_as_stream');

    var $searchContainer;

    if (isFromPopup) {
        $searchContainer = $("#quickSearchPopup");
    } else {
        $searchContainer = $('#quickSearchContainer');
    }

    term = term || $searchContainer.find('._searchTerm').val();

    var postData = "box%5BtabId%5D=" + $("#streamTabInfo #editTabForm input[name='id']").val();
    postData += "&box%5Bterms%5D=" + encodeURIComponent(term);
    postData += "&form_submit=submit&box%5Btype%5D=SEARCH";

    window.selectSocialNetworkPopup(function (selectedSocialNetworkId) {
        postData += "&box%5BsocialNetworkId%5D=" + selectedSocialNetworkId;
        window.saveSearchAsColumnRequest(postData);
    });
};
/**
 * saveSearchAsColumnRequest
 * @param postData
 */
window.saveSearchAsColumnRequest = function (postData) {
    ajaxCall({
        url: "/ajax/stream/save-box",
        data: postData,
        success: function (data) {
            if (data.boxData) {
                $("#quickSearchPopup").dialog('close');

                $("#streamsScroll ._streamsScroll").append(data.output);
                window.stream.stream.initBox(data.boxData.boxId, data.boxData);
                $("#streamsScroll ._box ._body").hide();

                //if there are more columns than are allowed on screen
                var boxCount = $('._box').size();
                if (boxCount > hs.maxColsForRes) {
                    window.resizeColumns();
                    //animate to the new box
                    var scrollAmount = ($("#streamsScroll").width() + $("#streamsScroll ._box:first").width()) - $("#streamsContainer").width();
                    $("#streamsContainer").animate({ scrollLeft: scrollAmount }, {
                        duration: 750,
                        complete: function () {
                            $("#streamsScroll ._box ._body").show();
                        }
                    });
                } else {
                    //resize columns to show max amount allowed
                    window.updateViewableColumns(boxCount);
                    window.resizeColumns();
                    $('#colSizeSlider').slider('value', boxCount);
                    $("#streamsScroll ._box ._body").show();
                }

                $("#streamsContainer ._noBoxPrompt").hide();

                $('#box' + data.boxData.boxId).box('refresh', 'default');
                asyncStreamLoader('streamBox', { boxId: data.boxData.boxId })
            }
            else if (data.errorMsg) {
                hs.statusObj.update(data.errorMsg, 'error', true);
            }
            else {
                $("#quickSearchPopup").html(data.output);
            }
            return false;
        },
        complete: function () {
            hs.throbberMgrObj.remove("._submitSaveAsColumn");
        }
    }, 'q1');
};

/**
 * checkIfSearchTermIsUser
 * @param term
 */
window.checkIfSearchTermIsUser = function (term) {
    if (!(/[^A-Za-z0-9_]/.test(term)) && term.length < 16) {
        /*
         qs.options = {};
         qs.options.rpp = 1;
         qs.options.query = 'from:'+term;
         */
        var options = {
            rpp: 1,
            query: 'from:' + term
        };

        //qs.twitterClient.search(qs.options, function(data) {
        window.stream.twitter.search(options, function (data) {

            if (data.results.length > 0) {
                var insertHtml = '<span class="resultHeader">' + translation._("User Found") + ':</span>';

                $.each(data.results, function (i, item) {
                    var username = item.from_user,
                        userAvatar = item.profile_image_url_https;

                    insertHtml += '<div class="message x-networkResult">';
                    insertHtml += '<div class="-messageBody">';
                    insertHtml += '<div class="messageData">';
                    insertHtml += '<span class="messageUserImage _dragUser"><img class="_userAvatar" src="' + userAvatar + '" title="' + username + '" /><a target="_blank" class="_userInfoPopup" href="http://twitter.com/' + username + '" title="' + username + '"></a></span>';
                    insertHtml += '<div class="messageUserInfo">';
                    insertHtml += '<a target="_blank" class="_userInfoPopup username" href="http://twitter.com/' + username + '" title="' + username + '"><span class="_username">' + username + '</span></a><br />';
                    insertHtml += '<button onclick="quickSearch(\'from:' + username + '\'); return false;">View tweets from ' + username + '</button>';
                    insertHtml += '</div>';
                    insertHtml += '</div>';
                    insertHtml += '</div>';
                    insertHtml += '</div>';
                });
                //insertHtml += '<span class="resultHeader">Tweets Found:</span>';
                $("#quickSearchPopup ._messages").prepend(insertHtml);
            }
        });
    }
    else {
        return false;
    }
};

window.stream = window.stream || {};
window.stream.search = stream_search;

export default stream_search;
