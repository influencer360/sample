/**
 * Extracted from dashboard.js
 * @author David Chan <david.chan@hootsuite.com>
 */
import $ from 'jquery';
import _ from 'underscore';
import hsEjs from 'utils/hs_ejs';
import memberUtil from 'utils/member';
import translation from 'utils/translation';
import util from 'utils/util';
import 'utils/ajax';
import 'utils/dropdown/jquery.hsdropdown';
import 'utils/status_bar';
import 'stream/box';
import 'stream/search';
import 'stream/stream';
import 'stream/twitter';
import hootbus from 'hs-nest/lib/utils/hootbus';
import darklaunch from 'hs-nest/lib/utils/darklaunch';
import { asyncStreamLoader } from '../stream/components/streams-loader';
import quicksearchContainerTemplate from '../../templates/dashboard/quick-search-container.ejs';

const qs = {},
    twitterUserTmpl = hsEjs.compileTemplate(
        '<% var cleanName = u_escape(username); %>' +
        '<% var cleanDescription = u_escape(description); %>' +
        '<% var cleanFullname = u_escape(fullname); %>' +
        '<div class="message x-networkResult">' +
        '<div class="-messageBody">' +
        '<img class="_userAvatar networkAvatar" src="<%= avatar %>" title="<%= cleanName %>">' +
        '<a class="_userInfoPopup _dragUser networkAvatarLink" href="http://twitter.com/<%= cleanName %>" target="_blank" title="<%= cleanName %>" rel="noopener noreferrer"></a>' +
        '<a class="_userInfoPopup networkName" href="http://twitter.com/<%= cleanName %>" target="_blank" title="<%= cleanName %>" rel="noopener noreferrer">' +
        '<span class="_username"><%= cleanName %></span></a>&nbsp;<span class="u-t-lightSmall">(<%= cleanFullname %>)</span><br />' +
        '<% if (cleanDescription.length > 0) { %><span class="_description u-t-lightSmall""><%= cleanDescription %></span><br><% } %>' +
        '<button class="btn-lite-sta" onclick="toggleFollow(1, \'<%= cleanName %>\', \'<%= userId %>\');" type="button"><%= translation._("Follow") + \' \' + cleanName %></button>' +
        '</div>' +
        '</div>'
    );
let containerTmpl,
    $container;

const fnLoadingSpinnerHtml = function() {
    return '<div class="_loading" style="text-align:center; padding: 10px 0;"><span class="icon-anim x-radialLines"></span></div>';
};

const fnGenerateTrendDiv = function(trendData) {
    var $trend = $('<div class="_trend trend"></div>');
    var $a = $('<a class="_title trendTitle" data-query="' + _.escape(trendData.query) + '" tabIndex="0">' + trendData.name + '</a>');

    $trend.append($a);

    return $trend;
};

qs.init = function () {
    $container = $('#quickSearchContainer');

    if (darklaunch.isFeatureEnabled('NGE_17050_REACT_TWITTER_QUICK_SEARCH')) {
        containerTmpl = document.createElement('div')
        containerTmpl.id = 'stream-migration-twitter-quick-search'
        asyncStreamLoader('twitterQuickSearch', {
            containerElement: containerTmpl,
            hasSocialNetworks: _.values(hs.socialNetworksKeyedByType['TWITTER']).length > 0
        })
    } else {
        containerTmpl = quicksearchContainerTemplate;
    }

    hootbus.on('notification:tray:opened', function (opened) {
        if (opened) {
            qs.close();
        }
    });
    hootbus.on('accountnavigation:tray:opened', function () {
        qs.close();
    });
};

qs.open = function () {
    if ($container.is(':visible')) {
        return;
    }
    $container.empty().show();

    var html = darklaunch.isFeatureEnabled('NGE_17050_REACT_TWITTER_QUICK_SEARCH') ? containerTmpl : containerTmpl.render();
    // init
    $container.html(html);

    var fnDoSearch = function () {
        var searchType = 'twitterSearch',
            selectedSearchType = $container.find('._searchTypeDropdown').hsDropdown('selectedElement');

        if (selectedSearchType) {
            searchType = selectedSearchType['label'];
        }

        $container.find('._save').hide();
        qs[searchType]($container.find('._searchTerm').val());
    };

    // search type dropdown
    var items = darklaunch.isFeatureEnabled('NGE_20960_ENABLE_X_USER_SEARCH') ? [
        {
            title: translation._("Search Twitter"),
            label: 'twitterSearch',
            avatar: '',
            selected: true
        },
        {
            title: translation._("Find Twitter Users"),
            label: 'twitterUserSearch',
            avatar: ''
        }
    ] : [
        {
            title: translation._("Search Twitter"),
            label: 'twitterSearch',
            avatar: '',
            selected: true
        }
    ];

    var $dd = $container.find('._searchTypeDropdown');
    if ($dd.length > 0) {
        $dd.hsDropdown({
            data: {items: items},
            change: function (element) {
                if (element) {
                    var classToAdd = '';
                    switch (element['label']) {
                        case 'twitterSearch':
                            classToAdd = 'icon-sn-16 twitter';
                            break;
                        case 'twitterUserSearch':
                            classToAdd = 'icon-19 account';
                            break;
                    }

                    $container.find('._searchTypeIcon')
                        .removeClass('icon-sn-16 icon-19 twitter account')
                        .addClass(classToAdd);
                }

                // hide geosearch button for non-twitter search
                $container.find('._geosearch')[(element && element['label'] === 'twitterSearch') ? 'show' : 'hide']();

                // defer is used here as we need to wait until the item is selected before fnDoSearch is called
                _.defer(function () {
                    var $textbox = $container.find('._searchTerm');
                    if ($textbox.val()) {
                        fnDoSearch();
                    }
                });
            }
        });
    }

    // binds
    $container.find('._searchTerm').unbind('keydown').bind('keydown', function (e) {
        if (e.which == 13) {
            fnDoSearch();
        }
    }).end()
        .find('._close').unbind('click').click(function () {
            qs.close();
        }).end()
        .find('._save').unbind('click').click(function () {
            window.saveSearchAsColumn();
        }).end()
        .find('._geosearch').click(function () {
            var $field = $container.find('._searchTerm').focus();
            hs.getGeolocation(function (position) {
                if (!position) {
                    return;
                }
                var term = $.trim($field.val());
                if (_.isString(term) && term.indexOf('geocode:') != -1) {
                    return;
                }
                term = term + ' geocode:' + (position.coords.latitude).toFixed(4) + ',' + (position.coords.longitude).toFixed(4) + ',25km';
                $field.val(term);
                qs.twitterSearch(term);
            });
        }).end()
        .delegate('._messageOptions a, ._messageOptions button', 'click', function () {
            window.stream.box.messageOptionsButtonHandler(this, hs.currentMessageDivId);
        }).end();

    // auto focus first in logical a11y order
    _.defer(function () {
        $container.find('._searchTypeDropdown').focus();
    });
    // when changing sections close quick search
    $('#globalNavigation').on('click', qs.close);
};

qs.close = function () {
    $container.empty().hide();
    if (darklaunch.isFeatureEnabled('NGE_17050_REACT_TWITTER_QUICK_SEARCH')) {
        $(containerTmpl).find('._searchTerm').val('')
    }
    // unbind function
    $('#globalNavigation').off('click', qs.close);
};

qs.goToSection = function (section, doNotClear) {
    var isShowWarning;
    // check if we need to display a warning message for this section
    $container.find('._twitterSearchWarning').hide();
    switch (section) {
        case 'trends':
        case 'twitterResults':
        case 'twitterUserResults':
            isShowWarning = !memberUtil.hasTwitterAccount();
            // use defer here because trends clears the section
            _.defer(function () {
                $container.find('._twitterSearchWarning')[isShowWarning ? 'show' : 'hide']();
            });
            break;
        default:
            break;
    }

    if ($container.find('._section._' + section).is(':visible')) {
        return $container.find('._section._' + section);
    }

    qs.open();
    var $section = $container.find('._section').hide().filter('._' + section).show(),
        $backButton = $container.find('._header ._back');

    if (!doNotClear) {
        $section.empty();
    }

    var fnBindBackButton = function () {
        $backButton.show().unbind().click(function () {
            qs.showTrendingTopics();
            $section.empty();
            $section.closest('.ui-panel-content').unbind('scroll');		// kill all scroll events from search streams
        });
    };

    $container.find('._save').hide();

    // do neccessary setup for each section here (event binds etc)
    switch (section) {
        case 'trends':
            $backButton.hide();

            $section.undelegate()
                .delegate('._title', 'click', function () {
                    var query = decodeURIComponent($(this).data('query')),
                        $searchTypeDd = $container.find('._searchTypeDropdown'),
                        selectedSearchType = $searchTypeDd.hsDropdown('selectedElement');
                    $container.find('._searchTerm').val(query);		// put the query at the top

                    if (selectedSearchType && selectedSearchType['label'] === 'twitterSearch') {
                        qs.twitterSearch(query);
                    } else {
                        $searchTypeDd.hsDropdown('selectElement', 'twitterSearch', 'label');
                    }
                });
            break;
        case 'twitterResults':
            fnBindBackButton();

            // message menus
            $section.undelegate().delegate('._message', 'mouseenter mouseleave', function (e) {
                if (e.type === 'mouseleave') {
                    var $relatedTarget = $(e.relatedTarget);
                    if (!$relatedTarget.closest('._messageOptions').length) {
                        $container.find('._messageOptions').hide();
                    }
                    return;
                }

                var $message = $(this),
                    scrollTop = $section.closest('.ui-panel-content').scrollTop(),
                    $messageOptions = $container.find('.ui-panel-content > ._messageOptions');

                hs.currentMessageDivId = $message.attr('id');

                var top = $message.position().top + 8 + scrollTop;
                if (top < $section.position().top) {
                    // too high!  will show up outside the section
                    return;
                }

                if ($message.find('._messageOptions').length === 0) {
                    const $newOptions = $messageOptions.clone();
                    $newOptions.insertBefore($message.find('.-messageBody .messageContent'));
                    $newOptions.css({
                        'top': '10px',
                        'right': '10px',
                        'display': 'flex'
                    });
                    $messageOptions = $newOptions;
                }
                else {
                    $messageOptions = $message.find('._messageOptions');
                    $messageOptions.css({ 'display': 'flex' });
                }

                var favClass = $message.data('fav') == '1' ? 'favorite' : 'notFavorite';
                $messageOptions.find('._fav span').removeClass('favorite notFavorite').addClass(favClass);

                // handle promoted tweets
                if ($message.data('impressionId')) {
                    $message.addClass('message-promoted');
                }
            });

            // infinite scroll (load more)
            var $scrollingSection = $section.closest('.ui-panel-content');
            $scrollingSection.unbind('scroll').bind('scroll', _.debounce(function () {
                var searchOptions = $section.data('searchOptions');
                if (!searchOptions || !searchOptions.query) {
                    return;
                }

                var $lastPost = $section.find('._message:last');

                if (!$section.data('isLoading') && $lastPost.position().top < $scrollingSection.height() + 200) {
                    $section.data('isLoading', true);

                    // load
                    $section.append('<div class="_loading" style="text-align:center; padding: 10px 0;"><span class="icon-anim load-shockwave"></span>&nbsp;' + translation.c.LOADING + '</div>');

                    searchOptions['page'] = searchOptions['page'] + 1;

                    // api 1.1 search just uses max_id for pagination
                    // find last tweet id and send that as max_id
                    searchOptions['maxId'] = $lastPost.attr('externalpostid');

                    window.stream.twitter.search(searchOptions, function (data) {
                        $section.data('isLoading', false).find('._loading').remove();
                        var isError = !data.results || !data.results.length || (data.error && data.error.length);

                        if (isError) {
                            $section.removeData('searchOptions');
                        } else {
                            // remove first result since max_id is inclusive
                            $section.append(window.stream.search.buildSearchResults(data.results, isError));
                            // save search options (for pagination)
                            searchOptions['cursor'] = data['next_token'] || null;

                            $section.data('searchOptions', searchOptions);
                        }
                    });
                }

                //console.log('scrolling', $section.scrollTop(), $lastPost.position().top, $section.height(), $section.data('isLoading'));   // @bypasshook
            }, 200))
                .bind('scroll', _.throttle(function () {
                    $container.find('._messageOptions').hide();
                }, 200));
            break;
        case 'twitterUserResults':
            fnBindBackButton();
            break;
        default:
            break;

        // should append spinner here?
    }
    return $section;
};

qs.showTrendingTopics = function (data) {
    // position quick search container based on trigger
    if (data && data.trigger) {
        var t = data.trigger;
        $container.css({
            'top': t.offsetParent.offsetTop || t.offsetTop,
            'left': t.offsetWidth + $('#globalNavigation').outerWidth()
        });
    }
    // @TODO: load the streams requirements at a more central point
    hs.require('streams', qs.postShowTrendingTopics);
};

qs.postShowTrendingTopics = function () {
    var $section = qs.goToSection('trends');

    if (!memberUtil.hasTwitterAccount()) {
        return;
    }

    // append spinner
    $section.empty().html(fnLoadingSpinnerHtml());

    ajaxCall({
        url: "/ajax/twitter/get-current-trends",
        success: function (data) {

            if (data.trends && data.trends.length) {
                var $trendDivs = $([]);
                $.each(data.trends, function (i, v) {
                    $trendDivs = $trendDivs.add(fnGenerateTrendDiv(v));
                });
                $section.empty().append('<h3>' + translation._("Trending on Twitter") + '</h3>').append($trendDivs);
            } else {
                $section.html('<div class="trend"><a class="trendTitle">' + translation._("No trending information found") + '</a></div>');
            }
        }
    }, 'qm');
};

qs.twitterSearch = function (term) {
    var $section = qs.goToSection('twitterResults'),
        options = {
            rpp: 50,
            query: term
        };

    if (!memberUtil.hasTwitterAccount()) {
        return;
    }

    if (term.length >= 500) {
        hs.statusObj.update(translation._("Twitter searches have a 500 character limit"), 'warning', true);
        return;
    }

    $section.empty().html(fnLoadingSpinnerHtml()).removeData('searchOptions');

    window.stream.twitter.search(options, function (data) {
        var hasResults = data.results && data.results.length;
        var hasErrors = data.error && data.error.length;
        var isError = !hasResults && hasErrors;
        $section.empty().append(window.stream.search.buildSearchResults(data.results, isError));

        // scrollback to top
        //$("#quickSearchPopup div._body").scrollTop(0);

        _.defer(function () {
            $section.scrollTop(0);
        });

        if (!isError) {
            // save search options for load more
            options['maxId'] = data.max_id_str;
            options['cursor'] = data.next_token;
            options['page'] = 1;
            $section.data('searchOptions', options);
        }

        // only show the save button in streams view with a tab NGE-2336
        if (!hasErrors && $('#dashboardTabs:visible ._tab.active').length && term) {
            $container.find('._save').show();
        }
    });
};

qs.twitterUserSearch = function (term) {
    term = term.replace(/[^\w\d\s]|\b(and|or)\b/ig, '');

    var $section = qs.goToSection('twitterUserResults');

    if (!memberUtil.hasTwitterAccount()) {
        return;
    }

    $section.empty().html(fnLoadingSpinnerHtml());

    window.stream.search.doTwitterPeopleSearch(term, function (data) {
        $section.empty();

        var html = '';
        var hasResults = data.users && data.users.length;

        if (!hasResults) {
            html = '<div class="message x-error">' + translation._("No results found") + '</div>';
        } else {
            var screenNames = {};	// use to filter duplicates

            _.each(data.users, function (item) {
                if (screenNames[item.screen_name]) {
                    return true;
                }
                screenNames[item.screen_name] = true;
                html += twitterUserTmpl.render({
                    u_escape: _.escape,
                    userId: item.id_str,
                    avatar: item.profile_image_url_https,
                    username: item.screen_name,
                    fullname: item.name,
                    description: item.description,
                    isProtected: item['protected']
                });
            });
        }

        $section.html(html);

        util.recordAction('twitterUserSearchWithDescription');
    });
};

export default qs;
