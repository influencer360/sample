import $ from 'jquery';
import _ from 'underscore';
import ProfileSelector from './profileselector';
import snActions from 'apps/social-network/actions';
import hootbus from 'utils/hootbus';
import ImageLazyLoad from 'utils/image-lazy-load';
import NetworksConf from 'utils/networks-conf';
import darklaunch from 'utils/darklaunch';
import translation from 'utils/translation';
import util from 'utils/util';
import hsEjs from 'utils/hs_ejs';
import jsapi from './in_jsapi';
import { hasMemberReachedSNMax, PENDO_TARGETS } from 'fe-lib-pendo'
import messageBoxProfileSelectorTemplate from '../templates/dashboard/message-box-profile-selector.ejs'
import messageBoxSelectorListItemTemplate from '../templates/dashboard/message-box-profile-selector-list-items.ejs';

import 'utils/util';

// event names
var EVENT_ON_CHANGE = 'mschange',
    EVENT_ON_SELECT = 'msselect',
    EVENT_ON_REMOVE = 'msremove',
    EVENT_ON_COLLAPSE = 'mscollapse',
    EVENT_ON_COLLAPSE_CHANGE = 'mscollapsechange';

var MessageboxProfileSelector = function () {
    ProfileSelector.apply(this, arguments);		// initialized, but not rendered
};

hs.util.inherit(MessageboxProfileSelector, ProfileSelector);

// internal helpers
var fnGetSortedSocialNetworks = function (filterOverride) {
    var defaultNetworksToFilter = NetworksConf.getExcludedNetworkTypesForComponent('COMPOSER', 'COMMON');

    var sns = ProfileSelector.getSortedSn(true, filterOverride || defaultNetworksToFilter); // true parameter means to filter out SNs which are not postable (ie. Instagram)
    var pinned = [],
        fav = [],
        rest = [];

    _.each(sns, function (sn) {
        var snId = sn.socialNetworkId.toString();
        if (_.indexOf(hs.pinnedSns, snId) > -1) {
            pinned.push(sn);
        } else if (_.indexOf(hs.favoritedSns, snId) > -1) {
            fav.push(sn);
        } else {
            rest.push(sn);
        }
    });

    sns = [].concat(pinned, fav, rest);

    return sns;
};

$.extend(MessageboxProfileSelector.prototype,
    {
        WIDGET_CLASS: 'profileSelectorWidget newProfileSelector _messageboxProfileSelector',

        fnInit: function () {
            var options = this.$widget.data('options') || {};

            var self = this;
            ProfileSelector.prototype.fnInit.apply(this, arguments);

            this.isLazyLoaded = false;

            this.bind('expand', function () {
                // Initialize the item list and set scroll to top on expand
                self.$widget.find('._itemListBody').scrollTop(0);
                self.fnUpdateList();
                // allow us to style this widget during expanded state
                !this.$widget.hasClass('permaexpanded') && this.$widget.addClass('x-expanded');

                if (!self.isLazyLoaded && self.$widget.is(':visible')) {
                    self.imageLazyLoad = new ImageLazyLoad(self.$widget.find('._itemListBody'));
                    self.isLazyLoaded = true;
                }
            });

            this.bind('collapse', function () {
                // toggle css styling
                !this.$widget.hasClass('permaexpanded') && this.$widget.removeClass('x-expanded');
            });
            this.bind('collapsechange', function () {
            });

            // checks if user is using Firefox on a Mac and adds padding to controls in list of profiles
            this.isFirefoxMac(self.$widget.find('._itemListBody'));

            // add the stretched class to the SN list
            self.$widget.find('._itemListBody')
                .addClass('stretched');

            //hover for tiled profiles
            this.$widget.find('._itemListBody ._row').each(function () {
                var $row = $(this);
                $row
                    .on('mouseenter', function () {
                        $row.addClass('active');
                    })
                    .on('mouseleave', function () {
                        $row.removeClass('active');
                    });
            });

            this.$widget.find('._clear').bind('click', function () {
                // Clear and re-sort the list
                self.fnClear();
                self.fnUpdateList();

                // Reset the item list scroll position to top
                self.$widget.find('._itemListBody').scrollTop(0);
            });

            // bind selected counter
            this.bind('change', function () {
                var sel = self.getSelected();
                self.$widget.find('._selectedCount').text(sel.length);

                var $clearBtn = self.$widget.find('._clear');
                if (sel.length > 0) {
                    $clearBtn.animate({
                        marginRight: 0
                    }, 150);
                } else {
                    $clearBtn.animate({
                        marginRight: -27
                    }, 150);
                }
            });

            // selection dropdown
            this.$widget.find('._filterBy').hsDropdown({
                resetOnSelect: 1,
                data: {
                    items: self.fnBuildDdItems()
                },
                change: function (el) {
                    if (!el || !el.task) {
                        return;
                    }
                    switch (el.task) {
                        case 'all':
                            var snIds;
                            snIds = _.pluck(fnGetSortedSocialNetworks(options.filterOverride), 'socialNetworkId');
                            if (options.filterSnIds) {
                                snIds = _.compact(options.filterSnIds);
                            }
                            self.selectSocialNetworks(snIds);
                            break;
                        case 'none':
                            self.fnClear();
                            break;
                        case 'favorites':
                            self.fnClear();
                            var $favs = self.$widget.find('._itemListBody ._row')
                                .filter(function () {
                                    return !!$(this).find('._fav.on').length;
                                });
                            $favs.each(function () {
                                self.fnToggleSn(this);
                            });
                            break;
                        case 'lastused':
                            break;
                        case 'team_sns':
                            var team_sns_id = el.id.replace('team_sns_id_', '');
                            self.selectSocialNetworks(hs.teamSocialNetworks[team_sns_id].socialNetworks);
                            break;
                        default:
                            break;
                    }
                    self.fnUpdateList();
                }
            });

            // Initialize tooltips for item list control items
            this.$widget.find('._itemListBody ._row ._action').each(function () {
                var $target = $(this);

                if ($target.hasClass('on')) {
                    // Set tooltip to the selected state value
                    $target.data('title', $target.data('tooltipSelected'));
                } else {
                    // Set tooltip to the default state value
                    $target.data('title', $target.data('tooltipDefault'));
                }

                $target.removeAttr('title');
            });

            this.$widget.find('._addSocialNetwork').on('click', function () {
                hootbus.emit('messageBox:addSn:clicked');
                snActions.add();
            });

            this.trigger('change');     // trigger change manually to account for any pinned networks

            return this;
        },

        isFirefoxMac: function ($widget) {
            // is Firefox and is Mac
            if (util.isFireFox && navigator.userAgent.indexOf("Macintosh") != -1) {
                $widget.addClass('isFirefoxMac');
            }
        },

        // this is copied over from profileselector, to override delete
        fnRowActionButtonClick: function ($target) {
            var self = this,
                $row = $target.closest('._row'),
                key = 'favorite',
                publisherFilterPin = this.$widget.data('options') && this.$widget.data('options').publisherFilterPin,
                value = $target.is('.on') ? 0 : 1, // toggle off if the feature is already "on"
                selected = $target.closest('._row').hasClass('selected'),
                $favorite = $target.closest('._row').find('._fav');

            $target.toggleClass('on');

            if ($target.is('._pin')) {
                if (publisherFilterPin) {
                    key = 'publisherFilter';
                } else {
                    key = 'pin';
                }

                // also add the social network if we are pinning
                if (value && !selected) {
                    self.fnToggleSn($target);

                    // favorite it as well
                    if (!$favorite.hasClass('on')) {
                        $favorite.addClass('on');
                        snActions.storePreference($row.attr('itemid'), 'favorite', value, {isSoftRefresh: true});
                    }

                    // update the favorite tooltip text
                    if ($favorite.hasClass('on')) {
                        // set tooltip to the selected state value
                        $favorite.data('title', $favorite.data('tooltipSelected'));
                    } else {
                        // set tooltip to the default state value
                        $favorite.data('title', $favorite.data('tooltipDefault'));
                    }
                } else if (!value && selected) {
                    self.fnToggleSn($target);
                }
            }

            // update the current target's tooltip text
            if ($target.hasClass('on')) {
                // Set tooltip to the selected state value
                $target.data('title', $target.data('tooltipSelected'));
            } else {
                // Set tooltip to the default state value
                $target.data('title', $target.data('tooltipDefault'));
            }

            snActions.storePreference($row.attr('itemid'), key, value, {
                isSoftRefresh: true,
                onSuccess: function () {
                    // reload all other widgets
                    self.$widget.addClass('_skip');
                    _.isFunction(ProfileSelector.renderAll) && ProfileSelector.renderAll();
                    if (!darklaunch.isFeatureEnabled('ALLOW_TWITTER_MULTI_POST')) {
                        _.isFunction(hs.messageBox.renderTwitterWarning) && hs.messageBox.renderTwitterWarning();
                    }
                    self.$widget.removeClass('_skip');
                }
            });
        },

        fnBuildDdItems: function () {
            var snFilterDdItems = [
                {
                    title: translation._("All"),
                    task: 'all'
                },
                {
                    title: translation._("None"),
                    task: 'none'
                },
                {
                    title: translation._("Favorites"),
                    task: 'favorites'
                }
            ];

            var teamSnDdItems = [];

            $.each(hs.teamSocialNetworks, function (tId) {
                var t_sns = [];
                $.each(hs.teamSocialNetworks[tId].socialNetworks, function (snId) {
                    if (typeof(hs.socialNetworks[hs.teamSocialNetworks[tId].socialNetworks[snId]]) != 'undefined') { // Only include if member has permission.
                        var sn_name = hs.socialNetworks[hs.teamSocialNetworks[tId].socialNetworks[snId]].username;
                        t_sns.push(sn_name);
                    }
                });

                // cut off users in tooltip if more than tooltipCutoff
                var tooltipContent = '';

                var tooltipCutoff = 10;
                if (t_sns.length > tooltipCutoff) {
                    tooltipContent = _.first(t_sns, tooltipCutoff).join('<br>');
                    tooltipContent = hsEjs.cleanPage(tooltipContent);
                    tooltipContent += translation._("<br><br> ... and %d more").replace('%d', t_sns.length - tooltipCutoff);
                } else {
                    tooltipContent = hsEjs.cleanPage(t_sns.join('<br>'));
                }


                if (t_sns.length > 0) {
                    teamSnDdItems.push({
                        title: hs.teamSocialNetworks[tId].name,
                        text: "(" + t_sns.length + ")",
                        task: 'team_sns',
                        id: 'team_sns_id_' + tId,
                        tooltip: {content: tooltipContent}
                    });
                }
            });

            if (teamSnDdItems.length > 0) {
                snFilterDdItems.push({divider: translation._("Select by team")});
                snFilterDdItems = snFilterDdItems.concat(teamSnDdItems);
            }

            return snFilterDdItems;
        },

        fnRenderWidgetHtml: function () {
            var template = messageBoxProfileSelectorTemplate;
            var options = this.$widget.data('options');

            var postableSocialNetworks = this.fnGetPostableSocialNetworks();
            
            return template.render({
                defaultText: options.defaultText,
                hasPostableSocialNetworks: !!postableSocialNetworks.length,
                hasMemberReachedSNMax: hasMemberReachedSNMax(),
                pendoDataAttribute: PENDO_TARGETS.ADD_SOCIAL_NETWORK
            });
        },

        fnGetPostableSocialNetworks: function () {
            var options = this.$widget.data('options') || {};
            var socialNetworks = options.socialNetworkList || fnGetSortedSocialNetworks(options.filterOverride);
            var type = options.type ? options.type.split(' ') : null;
            var permission = null;
            var filterSnIds = options.filterSnIds ? _.compact(options.filterSnIds) : null;

            return _.filter(socialNetworks, function (sn) {
                if ((!type || _.indexOf(type, sn.type) > -1 || "*" == type) &&
                    (!permission || _.indexOf(permission, sn.permission) > -1) &&
                    (!filterSnIds || _.indexOf(filterSnIds, sn.socialNetworkId.toString()) > -1) &&
                    (sn.isGroupAdmin === undefined || sn.isGroupAdmin)) {
                    return true;
                }
            });
        },

        fnRenderProfilesHtml: function (profiles) {
            var template = messageBoxSelectorListItemTemplate;
            var options = this.$widget.data('options') || {};

            return template.render({
                socialNetworks: profiles,
                publisherFilterPin: options.publisherFilterPin,
                disabledSnTypes: options.disabledNetworkTypes || []
            });
        },

        fnRender: function () {
            var $widget = this.$widget;
            var previouslySelected = this.fnGetSelected();

            // Render the message box profile selector
            // Pass in true so the parents render doesn't restore state because the profiles aren't rendered yet
            this.superclass.fnRender.bind(this)(true);

            // Render the profiles in batches
            var $profileListInsertPoint = $widget.find('._itemListBody');
            var socialNetworks = this.fnGetPostableSocialNetworks();
            var chunkSize = 500;
            // this is destructive, but this.fnGetPostableSocialNetworks() returns a copy so its it's own array
            while (socialNetworks.length) {
                // appends the socialnetworks in reverse
                var chunkStart = socialNetworks.length - chunkSize;

                if (chunkStart < 0) {
                    chunkStart = 0;
                }

                var socialNetworksChunk = socialNetworks.splice(chunkStart, chunkSize);
                var profilesHtml = this.fnRenderProfilesHtml(socialNetworksChunk);
                $profileListInsertPoint.prepend(profilesHtml);
            }

            // restore state
            this.fnRestoreSelectedSns(previouslySelected);
            this.fnInit();
        },

        fnFilterName: function (val) {
            var $widget,
                $previouslyActiveRow,
                $rows,
                $filtered;

            val = val.replace(/['"\\]/g, '');
            $widget = this.$widget;

            // Add temporary 'activePlaceholder' class to the active list item
            $previouslyActiveRow = $widget.find('._itemList .active').addClass('_previouslyActive');

            $rows = $widget.find('._itemList ._row').removeClass('active').addClass('hidden');

            $filtered = $rows.filter(function () {
                var $row = $(this),
                    snType = $row.attr('type') || '',
                    isIncluded = false;

                if ($row.is(':Contains("' + val + '")')) {
                    isIncluded = true;
                } else if (snType.toLowerCase().indexOf(val.toLowerCase()) > -1) {
                    isIncluded = true;
                }

                return isIncluded;
            }).removeClass('hidden');

            // Non-empty query and we have 1+ filtered matches
            if (val.length && $filtered.length) {
                // Check if the previous 'active' item is included in the filtered list
                if ($filtered.hasClass('_previouslyActive')) {
                    // If so, make it active again
                    $previouslyActiveRow.addClass('active');
                } else {
                    // Otherwise, make the first list item active
                    $filtered.filter(':first').addClass('active');
                }
            } else {
                if (!(val.length && !$filtered.length)) {
                    $previouslyActiveRow.addClass('active');
                    $rows.removeClass('hidden');
                }
            }

            // Always show the 'Add social network' button
            $widget.find('._itemList ._row._addSocialNetwork').removeClass('hidden');

            // Remove the '_previouslyActive' class
            $previouslyActiveRow.removeClass('_previouslyActive');
        },
        fnPostStateChange: function () {
            var $widget = this.$widget,
                options = $widget.data('options') || {};

            this.fnSetSelected();		// save internal state

            var max = ($widget.data('options') && $widget.data('options').max) || null,
                currentState = this.getSelected(),
                previousState = this.fnGetPreviousSelectedIds(),
                isStateDifferent = previousState.sort().join(',') != currentState.sort().join(',');

            // trigger events
            $widget.trigger(EVENT_ON_CHANGE);
            if (currentState.length > previousState.length || (currentState.length == previousState.length && isStateDifferent)) {
                $widget.trigger(EVENT_ON_SELECT);	// added new
            } else if (currentState.length < previousState.length) {
                $widget.trigger(EVENT_ON_REMOVE);
            }

            // collapse SN List if we have selected our max
            // do not collapse if we're in manual mode
            if (!options.isManualMode && ((max && currentState.length == max) || !$widget.find('._itemListBody ._row:visible').length)) {
                this.fnCollapse();
            } else if (!currentState.length) {
                $('#tooltip').hide();
            }
            $widget.find('._selectedList ._filterName').eq(0).trigger('focus.multiselector');
        },
        // override multiselector function as we do not need to resize the filter input box
        fnResizeFilterInput: function () {
            // do nothing
        },
        // this is copied over from multiselector, to override delete
        fnInitFilter: function () {
            var self = this,
                $widget = this.$widget,
                $input = $widget.find('._selectedList ._filterName');

            // This logic is debounced to avoid filtering the list unnecessarily when multiple letters are
            // typed in quick succession.
            var keyUpHandler = function (e, $selectedList, $input) {
                if (!e.which || !e.which.toString().match(/^(8|38|40)$/)) {
                    $selectedList.find('._selectItem.active').removeClass('active'); // remove any active
                }

                if (!e.which || !e.which.toString().match(/^(13|38|40)$/)) {
                    // If not [up|down|enter] key pressed, remove active class from SN list and scroll to top
                    self.$widget.find('._itemListBody').children('._row.active').removeClass('active');

                    // Don't update the list position on mouse click
                    if (e.type !== 'blur') {
                        self.$widget.find('._itemListBody').scrollTop(0);
                    }
                }

                if (!e.which || !e.which.toString().match(/^(38|40)$/)) {
                    self.fnFilterName($input.val()); // read input val again in case we set it to empty string on enter press
                }
            };
            keyUpHandler = _.debounce(keyUpHandler, 300);

            var keyHandler = function (e) {
                var $selectedList = $widget.find('._selectedList'),
                    $activeRow;

                if (e.type === 'keydown') {
                    // need to check for special chars
                    var $currSnList = $widget.find('._itemListBody ._row:visible');

                    if (e.which === 13 && $currSnList.filter('.active').length) { // enter key
                        e.preventDefault();

                        $activeRow = $widget.find('._itemListBody').children('.active');

                        // Check whether the 'add social network' item is selected
                        if ($activeRow.hasClass('_addSocialNetwork')) {
                            // If so, trigger the event to add a new SN
                            $activeRow.trigger('click');
                        } else {
                            self.fnToggleSn($currSnList.filter('.active'));
                        }
                    } else if (e.which === 38 || e.which === 40) { // up and down keys
                        var activeIdx = -1,
                            $itemList = $widget.find('._itemListBody'),
                            itemListHeight = $itemList.height(),
                            itemListOffset = $itemList.children().first().position().top,
                            activeRowTop,
                            activeRowBottom,
                            $currSn = $currSnList.filter(function (i) {
                                if ($(this).is('.active')) {
                                    activeIdx = i;
                                    return true;
                                }
                                return false;
                            });

                        $currSn.removeClass('active');

                        if (e.which === 40) { // down
                            if (++activeIdx < $currSnList.length) {
                                $currSnList.eq(activeIdx).addClass('active');
                            } else {
                                $currSnList.eq(0).addClass('active');
                            }

                            $activeRow = $itemList.children('.active');
                            activeRowTop = $activeRow.position().top;
                            activeRowBottom = activeRowTop + $activeRow.height();

                            // Ensure the active element is visible
                            if (activeRowBottom < 0 || activeRowBottom > itemListHeight) {
                                if ($activeRow.index() !== 0) {
                                    $itemList.scrollTop($itemList.scrollTop() - itemListHeight + activeRowBottom);
                                } else {
                                    $itemList.scrollTop(0);
                                }
                            }
                        } else {
                            if (--activeIdx >= 0) {
                                $currSnList.eq(activeIdx).addClass('active');
                            } else {
                                $currSnList.eq($currSnList.length - 1).addClass('active');
                            }

                            $activeRow = $itemList.children('.active');
                            activeRowTop = $activeRow.position().top;

                            // Ensure the active element is visible
                            if (activeRowTop < 0 || activeRowTop > itemListHeight) {
                                $itemList.scrollTop(activeRowTop - itemListOffset);
                            }
                        }

                        return false; // don't fire
                    } else if (e.which === 27) { // ESC key
                        $input.val('');
                        self.fnCollapse();
                        return false;
                    }
                } else if (e.type === 'keyup' || e.type === 'blur') {
                    keyUpHandler(e, $selectedList, $input);
                }
            };

            $input.bind('keydown keyup blur', keyHandler);
        },
        /***
         * override this function to append selected items into a display:block div, to fix display issues with
         * the selected items and the filter input box
         */
        fnSelectItem: function (id) {
            var listItems = this.fnGetSocialNetworks(),
                itemData = null,
                $row = this.$widget.find('._itemList ._row[itemid="' + id + '"]');
            var isScheduled = $('#messageBoxForm').find('input[name="message[isScheduled]"]').val();

            if (listItems[id]) {
                // this is a social network
                itemData = {
                    id: id,
                    avatar: listItems[id]['avatar'],
                    name: listItems[id]['username'],
                    type: listItems[id]['type'],
                    isShowNames: this.$widget.data('options') && this.$widget.data('options').isShowNames || false
                };
            } else if (typeof jsapi !== 'undefined' && jsapi.appSelectorList[id]) {

                if (1 == isScheduled) {
                    hs.statusObj.update(translation._("Scheduled message cannot be send to App Plugin"), 'error', true);

                    _.defer(function () {
                        $row.removeClass('selected');
                    });

                    return;
                }

                // this is an app
                itemData = {
                    id: id,
                    avatar: jsapi.appSelectorList[id]['logo'],
                    name: jsapi.appSelectorList[id]['name'],
                    type: 'APP',
                    isShowNames: false
                };
            } else if (typeof window.appapi !== 'undefined' && window.appapi.memberAppStreams) {
                if (!id) {
                    return;
                }

                var pid = id;
                if (typeof pid === "string") {
                    pid = id.replace('APP_', '');
                }

                var appPlugin = window.appapi.memberAppStreams[pid];

                if (appPlugin) {
                    if (1 == isScheduled) {
                        hs.statusObj.update(translation._("Scheduled message cannot be send to App Plugin"), 'error', true);

                        _.defer(function () {
                            $row.removeClass('selected');
                        });

                        return;
                    }

                    itemData = {
                        id: id,
                        avatar: window.appapi.memberAppStreams[pid]['icon'],
                        name: window.appapi.memberAppStreams[pid]['title'],
                        type: 'APP',
                        isShowNames: false
                    };

                }
            }
            if (!itemData) {
                return;
            }

            var $selectedList = this.$widget.find('._selectedList');
            var itemHtml = this.selItemTemplate.render(itemData);
            $selectedList.find('._selectedListBlock').append(itemHtml).end()    // append into selectedListBlock
                .find('._profileSelect').hide();	// always hide the placeholder icon

            // hide the item from list
            $row.addClass('selected');
        },
        /**
         * Combination of fnToggleSn and fnSelectItem, optimised for team selections
         * This doesn't account for AppDirectory picker items
         *
         * @param socialNetworks
         */
        selectSocialNetworks: function (socialNetworks) {
            var $widget = this.$widget;
            var $selectedList = $widget.find('._selectedList');
            var options = $widget.data('options');
            var snListItems = this.fnGetSocialNetworks();

            // Clear existing selected items
            $selectedList.find('._selectItem').remove();
            $widget.find('._picker ._row').removeClass('selected');

            // Collect all the icons to append at once,
            var templateStrings = [];
            _.each(socialNetworks, function (snId) {
                templateStrings.push(this._renderItem(snListItems[snId], options.isShowNames || false));
                $widget.find('._picker ._row[itemid="' + snId + '"]').addClass('selected');
            }, this);
            $selectedList.find('._filter').before(templateStrings.join(''));
            this.fnPostStateChange();
        },
        _renderItem: function (listItem, isShowNames) {
            var itemData = null;
            var snId = listItem.socialNetworkId;
            if (listItem) {
                // this is a social network
                itemData = {
                    id: snId,
                    avatar: listItem['avatar'],
                    name: listItem['username'],
                    type: listItem['type'],
                    isShowNames: isShowNames
                };
            }
            if (!itemData) {
                return;
            }

            return this.selItemTemplate.render(itemData);
        },
        /**
         * override fnCollapse to not add "X more..." element
         */
        fnCollapse: function () {
            // anything we add the class '_collapsable' to gets hidden at the end of this function
            var self = this,
                $widget = this.$widget,
                eventName = 'click.multiselector_' + $widget.data('wid'),
                options = $widget.data('options');
            $widget.removeClass('_expanded').unbind(eventName).bind(eventName, function () {
                self.fnExpand();
            }).find('._selectedList')
                .find('._filterName').blur().addClass('_collapsable').end()
                .find('._defaultText').hide();		// always keep default text hidden
            _.defer(function () {
                $('html').unbind(eventName);
            });

            // handle the hiding of excess selected items
            var $selectedList = $widget.find('._selectedList'),
                $selectedItems = $selectedList.find('._selectItem').removeClass('_collapsable');
            // use CSS to control how elements are hidden
            if (!$selectedItems.length) {
                $widget.find('._selectedList')
                    .find('._defaultText').show().end()
                    .find('._profileSelect').show();
            }

            $widget.find('._collapsable').hide().end()
                .find('._listCollapsed').show();

            this.fnBindMouse();

            $widget.trigger(EVENT_ON_COLLAPSE);
            // check if state changed
            if (this.fnGetPreviousSelected($widget).length != this.fnGetSelected($widget).length) {
                $widget.trigger(EVENT_ON_COLLAPSE_CHANGE);
                this.fnSetPreviousSelected();		// used to update state change on collapse
            }

            if (typeof options !== 'undefined' && options.isManualMode) {
                $widget.removeClass('permaexpanded');
            }
        },

        isSnPostable: function (sn) {
            return sn.permissions && (sn.permissions['SN_POST_WITH_APPROVAL'] || sn.permissions['SN_POST']) && !(hs.prefs.restrictedLogin && sn.ownerType == "MEMBER");
        },

        filterPinnedSns: function (idsToSelect) {
            var disallowedSnIds = [];

            // do not pin the network if member cannot post to it.. (network will not be visible in profile selector)
            _.each(hs.socialNetworks, function (sn, snId) {
                if (!this.isSnPostable(sn)) {
                    disallowedSnIds.push(snId);
                }
            }, this);
            return _.filter(idsToSelect, function (snid) {
                return !_.contains(disallowedSnIds, snid);
            });
        }
    });

hs.messageboxProfileSelector = MessageboxProfileSelector;

export default MessageboxProfileSelector;
