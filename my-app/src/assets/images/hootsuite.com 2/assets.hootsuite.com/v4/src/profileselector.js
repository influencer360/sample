import $ from 'jquery';
import _ from 'underscore';
import MultiSelector from 'multiselector';
import snActions from 'apps/social-network/actions';
import NetworksConf from 'utils/networks-conf';
import hsEjs from 'utils/hs_ejs';
import jsapi from './in_jsapi';
import translation from 'utils/translation';
import 'utils/util';

var ProfileSelector = function () {
    MultiSelector.apply(this, arguments);   // initialized, but not rendered
};

hs.util.inherit(ProfileSelector, MultiSelector);

// internal helpers

// filterPostable: boolean whether or not to filter out social networks
// filterOverride: array of social networks to filter out
// Usage: new hs.profileSelector(target, {filterPostable: true, filterOverride: ["INSTAGRAM"]}, defaultSelected);
var fnGetSortedSocialNetworks = function (filterPostable, filterOverride) {
    if (!filterPostable && hs.socialNetworksSorted) {
        return hs.socialNetworksSorted;
    }

    var order = hs.socialNetworkTypeProfileSelectorOrder,
        fnSortByName = function (a, b) {
            var compareA = (a.username + '').toLowerCase(),
                compareB = (b.username + '').toLowerCase(); // force string for names incase of null

            return (compareA < compareB) ? -1 : (compareA > compareB) ? 1 : 0;
        },
        buffer = [];

    $.each(order, function (i, val) {
        var sns = _.values(hs.socialNetworksKeyedByType[val]),
            postableSns = sns;
        if (filterPostable) {

            var isUnpostableSn = _.contains(filterOverride, val);

            if (isUnpostableSn) {
                var snsids = _.keys(hs.socialNetworksKeyedByType[val]);
                $.each(snsids, function (j, snid) {
                    if ($.inArray(snid, hs.pinnedSns) >= 0) {
                        hs.pinnedSns.splice(hs.pinnedSns.indexOf(snid), 1);
                    }
                });
                return true; // short circuits
            }
            postableSns = [];
            _.each(sns, function (sn) {
                if (sn.permissions && (sn.permissions['SN_POST_WITH_APPROVAL'] || sn.permissions['SN_POST']) && !(hs.prefs.restrictedLogin && sn.ownerType == "MEMBER")) {
                    postableSns.push(sn);
                }
            });
        }

        postableSns.sort(fnSortByName);
        buffer.push(postableSns);
    });

    // cache if not filtered
    var output = _.flatten(buffer);
    if (!filterPostable) {

        var networksToFilter = NetworksConf.getNetworkTypesWithNoCommonComponents();

        //condition to remove network from the array
        var rejectCondition = function (filterNetworks) {
            return function (sn) {
                return (filterNetworks.indexOf(sn.type) != -1);
            };
        };

        //exclude networks from the output array
        output = _.reject(output, rejectCondition(networksToFilter));

        hs.socialNetworksSorted = output;
    }

    return output;
};
ProfileSelector.getSortedSn = fnGetSortedSocialNetworks;

$.extend(ProfileSelector.prototype,
    {
        WIDGET_CLASS: 'profileSelectorWidget',

        WIDGET_EJS: 'dashboard/profileselector',

        fnRenderWidgetHtml: function () {
            var template = hsEjs.getEjs(this.WIDGET_EJS),
                options = this.$widget.data('options') || {},
                filterOverride = options.filterOverride || [],
                filterPostable = options.filterPostable || !!this.$widget.closest('._messageBoxForm').length || hs.prefs.restrictedLogin;
            return template.render({
                socialNetworks: options.socialNetworkList || fnGetSortedSocialNetworks(filterPostable, filterOverride),
                type: options.type ? options.type.split(' ') : null,
                permission: null,
                defaultText: options.defaultText,
                publisherFilterPin: options.publisherFilterPin,
                filterSnIds: options.filterSnIds ? _.compact(options.filterSnIds) : null,
                isDisabled: options.isDisabled,
                disabledSnTypes: options.disabledNetworkTypes || [],
                snDescriptorMap: options.snDescriptorMap ? options.snDescriptorMap : null,
                snDefaultAvatarMap: options.snDefaultAvatarMap ? options.snDefaultAvatarMap : null
            });
        },

        fnInit: function () {
            MultiSelector.prototype.fnInit.apply(this, arguments);

            this.$widget.find('._addSocialNetwork').on('click', function () {
                snActions.add();
            });
        },

        fnUpdateList: function () {
            var $container = this.$widget.find('._row').parent();
            var $rows = this.$widget.find('._row');
            var pinned_faved = [], pinned = [], faved = [], selected = [];
            $rows.each(function () {
                //Selected
                if ($(this).hasClass('selected')) {
                    selected.push($(this));
                }
                //Pinned and Favorited
                else if ($(this).find('.pin.on').length > 0 && $(this).find('.fave.on').length > 0) {
                    pinned_faved.push($(this));
                }
                //Pinned
                else if ($(this).find('.pin.on').length > 0) {
                    pinned.push($(this));
                }
                //Favorited
                else if ($(this).find('.fave.on').length > 0) {
                    faved.push($(this));
                }
            });

            pinned_faved.reverse();
            pinned.reverse();
            faved.reverse();
            selected.reverse();

            var i;
            for (i = 0; i < faved.length; i++) {
                $container.prepend(faved[i]);
            }
            for (i = 0; i < pinned.length; i++) {
                $container.prepend(pinned[i]);
            }
            for (i = 0; i < pinned_faved.length; i++) {
                $container.prepend(pinned_faved[i]);
            }
            for (i = 0; i < selected.length; i++) {
                $container.prepend(selected[i]);
            }
        },

        fnRowActionButtonClick: function ($target) {
            var self = this,
                $row = $target.closest('._row'),
                key = 'favorite',
                publisherFilterPin = this.$widget.data('options') && this.$widget.data('options').publisherFilterPin,
                value = $target.is('.on') ? 0 : 1,	// toggle off if the feature is already "on"
                selected = $target.closest('._row').hasClass('selected'),
                favorite = $target.closest('._row').find('._fav');

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

                    //favorite it as well
                    if (!favorite.hasClass('on')) {
                        favorite.addClass('on');
                        snActions.storePreference($row.attr('itemid'), 'favorite', value, {isSoftRefresh: true});
                    }
                } else if (!value && selected) {
                    self.fnToggleSn($target);
                }
            }

            snActions.storePreference($row.attr('itemid'), key, value, {
                isSoftRefresh: true,
                onSuccess: function () {
                    // reload all other widgets
                    self.$widget.addClass('_skip');
                    _.isFunction(ProfileSelector.renderAll) && ProfileSelector.renderAll();
                    self.$widget.removeClass('_skip');
                }
            });
        },

        fnSelectItem: function (id) {

            var listItems = this.fnGetSocialNetworks(),
                itemData = null;

            var isScheduled = $('#messageBoxForm').find('input[name="message[isScheduled]"]').val();

            if (listItems[id]) {
                // this is a social network
                itemData = {
                    id: id,
                    avatar: listItems[id]['avatar'] || this.$widget.data('options') && this.$widget.data('options').snDefaultAvatarMap &&
                        this.$widget.data('options').snDefaultAvatarMap[id] || null,
                    name: listItems[id]['username'],
                    type: listItems[id]['type'],
                    description: this.$widget.data('options') && this.$widget.data('options').snDescriptorMap &&
                        this.$widget.data('options').snDescriptorMap[id] || null,
                    isShowNames: this.$widget.data('options') && this.$widget.data('options').isShowNames || false
                };
            } else if (typeof jsapi !== 'undefined' && jsapi.appSelectorList[id]) {
                // check if scheduled

                if (1 == isScheduled) {
                    hs.statusObj.update(translation._("Scheduled message cannot be send to App Plugin"), 'error', true);
                    var $row = this.$widget.find('._itemList ._row[itemid="' + id + '"]');

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

                if (!id || typeof id !== "string") {
                    return;
                }

                var pid = id.replace('APP_', '');
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
                return;
            }

            if (!itemData) {
                return;
            }

            var $selectedList = this.$widget.find('._selectedList');
            var itemHtml = this.selItemTemplate.render(itemData);
            $selectedList.find('._filter').before(itemHtml).end()
                .find('._profileSelect').hide();	// always hide the placeholder icon

            // hide the item from list
            this.$widget.find('._itemList ._row[itemId="' + id + '"]').addClass('selected');
        },

        fnGetSocialNetworks: function () {
            // this function is needed to avoid trapping stale social network data in closures
            return hs.socialNetworks;
        }
    });

ProfileSelector.renderAll = function () {
    $('._profileSelectorWidget').not('._skip').each(function () {
        var profileSelectorInstance;
        if ($(this).is('._messageboxProfileSelector')) {
            profileSelectorInstance = new hs.messageboxProfileSelector(this);
        } else {
            profileSelectorInstance = new ProfileSelector(this);
        }

        profileSelectorInstance.render();
    });
};

ProfileSelector.initAll = function (context) {
    var $context = context ? $(context) : $('body'),
        profileSelectorInstance = [];
    $context.find('._profileSelectorWidget').not('._skip').each(function () {
        var p;
        if ($(this).is('._messageboxProfileSelector')) {
            p = new hs.messageboxProfileSelector(this);
        } else {
            p = new ProfileSelector(this);
        }
        profileSelectorInstance.push(p);
    });
    return profileSelectorInstance;
};

ProfileSelector.getSortedSocialNetworks = function () {
    return fnGetSortedSocialNetworks();
};

hs.profileSelector = ProfileSelector;

export default ProfileSelector;

