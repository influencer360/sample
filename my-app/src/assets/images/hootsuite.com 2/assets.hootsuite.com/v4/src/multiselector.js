import $ from 'jquery';
import _ from 'underscore';
import hsEjs from 'utils/hs_ejs';

import 'utils/util';

// event names
var EVENT_ON_CHANGE = 'mschange',
    EVENT_ON_SELECT = 'msselect',
    EVENT_ON_REMOVE = 'msremove',
    EVENT_ON_EXPAND = 'msexpand',
    EVENT_ON_COLLAPSE = 'mscollapse',
    EVENT_ON_COLLAPSE_CHANGE = 'mscollapsechange';

var WIDGET_ID = 0;	// global widget id counter

var MultiSelector = function (target, opt, defaultSelected) {
    this.widgetId = 0;
    this.$widget = $(target);

    this.selItemTemplate = hsEjs.compileTemplate(this.SEL_ITEM_EJS);
    this.moreItemTemplate = hsEjs.compileTemplate(this.MORE_ITEMS_EJS);

    // auto init code
    !this.isRendered() && this.init(opt, defaultSelected);
};

$.extend(MultiSelector.prototype,
    {
        WIDGET_CLASS: 'multiSelectorWidget',
        WIDGET_EJS: 'dashboard/multiselector',
        SEL_ITEM_EJS: '<button class="item _selectItem _remove" itemid="<%= id %>" type="<%= type %>"><% if (hs.isFeatureEnabled("NO-MULTISELECTOR-PROXIFY")) { %><img class="avatar fs-exclude-container" src="<%= avatar %>" title="<%= translation._("Remove") %><% } else { %><img class="avatar" src="<%= hs.util.proxify(avatar) %>" title="<%= translation._("Remove") %><% } %> <%= hsEjs.cleanPage(name) %>" onerror="hs.replaceAvatarWithDefault(this)" /><% if (isShowNames) { %><strong><%= hsEjs.cleanPage(name) %><% if (description) { %><span class="_snDescription"><%= \'(\' + hsEjs.cleanPage(description) + \')\' %></span><% } %></strong><% } %><% if (type) { %><span class="icon-sn-13 <%= type.toLowerCase() %>"></span><% } %></button>',
        MORE_ITEMS_EJS: '<span class="item more-item _moreItem"><%= translation._("%d more...").replace("%d", num) %></span>',
        mouseoverTimeout: null,
        DELAY_MOUSEOVER: 100,
        fnClearMouseoverTimeout: function () {
            if (this.mouseoverTimeout) {
                clearTimeout(this.mouseoverTimeout);
            }
        },
        fnGetPreviousSelected: function () {
            return this.$widget.data('previousSelected') || [];
        },
        fnGetPreviousSelectedIds: function () {
            return _.map(this.fnGetPreviousSelected(), function (v) {
                return v.id;
            });
        },
        fnGetSelected: function () {
            return this.$widget.data('selected') || [];
        },
        fnSetSelected: function (arrSelected) {
            if (!arrSelected) {
                arrSelected = _.map(this.$widget.find('._selectedList ._selectItem'), function (v) {
                    var $item = $(v);
                    return {
                        id: $item.attr('itemid'),
                        type: $item.attr('type')
                    };
                });
            }
            this.$widget.data('previousSelected', this.fnGetSelected());
            this.$widget.data('selected', arrSelected);
            return this;
        },
        fnSetPreviousSelected: function (arrSelected) {
            if (!arrSelected) {
                arrSelected = this.fnGetSelected(this.$widget);
            }
            this.$widget.data('previousSelected', arrSelected);
            return this;
        },
        fnSelectItem: function (id) {
            var $selectedList = this.$widget.find('._selectedList'),
                listItems = this.$widget.data('options').listItems;
            if (!listItems[id]) {
                return false;
            }

            var itemHtml = this.selItemTemplate.render({
                id: id,
                avatar: listItems[id]['avatar'],
                name: listItems[id]['name'],
                type: listItems[id]['type'],
                isShowNames: this.$widget.data('options') && this.$widget.data('options').isShowNames || false
            });
            $selectedList.find('._filter').before(itemHtml).end()
                .find('._profileSelect').hide();	// always hide the placeholder icon

            // hide the item from list
            this.$widget.find('._itemList ._row[itemId="' + id + '"]').addClass('selected');
        },
        fnResizeFilterInput: function () {
            var INPUT_MIN_WIDTH = 50,
                $selectedList = this.$widget.find('._selectedList'),
                $selectedItems = this.$widget.find('._selectItem'),
                $input = $selectedList.find('._filterName'),
                itemWidth = $selectedItems.length ? $selectedItems.eq(0).outerWidth(true) : 0,
                totalItemsWidth = $selectedItems.length * itemWidth;

            if ($selectedList.width() > (totalItemsWidth + INPUT_MIN_WIDTH)) {
                $input.css({
                    'min-width': INPUT_MIN_WIDTH,
                    'width': $selectedList.width() - (totalItemsWidth + INPUT_MIN_WIDTH) - 2
                });
            }
        },
        // this function deals with fav and pin
        fnFilterList: function (criteria) {
            var $rows = this.$widget.find('._row'),
                classToAdd = '';
            $rows.removeClass('filtered');
            this.$widget.removeClass('filterFavorite filterPin');

            if (!criteria) {
                return;
            }

            $rows.each(function () {
                var $row = $(this),
                    selector = '';
                switch (criteria) {
                    case 'fav':
                        selector = '._fav';
                        break;
                    case 'pin':
                        selector = '._pin';
                        break;
                    default:
                        break;
                }
                selector && !$row.find(selector).is('.on') && $row.addClass('filtered');
            });

            switch (criteria) {
                case 'fav':
                    classToAdd = 'filterFavorite';
                    break;
                case 'pin':
                    classToAdd = 'filterPin';
                    break;
                default:
                    break;
            }

            this.$widget.addClass(classToAdd);
        },
        fnBindMouse: function () {
            var self = this,
                $widget = this.$widget,
                options = $widget.data('options');

            if (typeof options !== 'undefined' && options.isManualMode) {
                return;		// no need to bind mouse events
            }

            $widget.unbind('.collapseExpand')
                .bind('mouseenter.collapseExpand', function () {
                    self.fnClearMouseoverTimeout();
                    self.mouseoverTimeout = setTimeout(function () {
                        self.fnExpand();
                    }, self.DELAY_MOUSEOVER);
                })
                .bind('mouseleave.collapseExpand', function () {
                    if ($widget.data('nocollapse')) {
                        return;
                    }
                    self.fnClearMouseoverTimeout();
                    self.fnCollapse();
                });
        },
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
                $selectedItems = $selectedList.find('._selectItem').removeClass('_collapsable'),
                MORE_ITEM_PILL_WIDTH = 70;
            if ($selectedItems.length) {
                var listWidth = $selectedList.width(),
                    itemWidth = $selectedItems.eq(0).outerWidth(true),
                    totalItemsWidth = $selectedItems.length * itemWidth;

                $widget.find('._selectedList ._moreItem').remove();
                if (listWidth > 0 && totalItemsWidth > listWidth) {		// we check listWidth > 0 because if collapse is being called before browser redraw, the width is 0
                    var numExcess = Math.ceil((totalItemsWidth + MORE_ITEM_PILL_WIDTH - listWidth) / itemWidth),
                        moreItem = this.moreItemTemplate.render({num: numExcess});
                    $selectedItems.each(function (i) {
                        if (i >= $selectedItems.length - numExcess) {
                            $(this).addClass('_collapsable');
                        }
                    }).filter('._collapsable').eq(0).before(moreItem);
                }
            } else {  //@PD
                $widget.find('._selectedList')
                    .find('._defaultText').show().end() //@PD
                    .find('._profileSelect').show();  //@PD
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
        fnExpand: function () {
            var self = this,
                $widget = this.$widget,
                options = $widget.data('options');
            if ($widget.is('._expanded')) {
                return;
            }

            $widget.addClass('_expanded').find('._collapsable').not('._picker').show();
            $widget.find('._selectedList')
                .find('._filterName').removeClass('_collapsable').end()
                .find('._selectItem').removeClass('_collapsable').end()
                .find('._moreItem').remove().end()
                .find('._defaultText').hide().end()
                .find('._listCollapsed').hide();

            // handle expand animation
            var $picker = $widget.find('._picker'),
                oldCssPosition = $picker.css('position'),
                expandStyle = options ? options.expandStyle : '',
                fnAnimate = function (cb) {
                    this.slideDown('fast', cb);
                };		// default is just slidedown

            $picker.addClass('noShadow');		// remove box shadows
            if (expandStyle == 'show') {
                fnAnimate = function () {
                    this.show();
                };
            } else if (expandStyle == 'slidedownfixed') {
                fnAnimate = function (cb) {
                    var $target = this;
                    $target.css({
                        position: 'fixed'
                    }).slideDown('fast', function () {
                        $target.css({
                            position: oldCssPosition
                        });
                        cb && cb();
                    });
                };
            }

            fnAnimate.call($picker, function () {
                $picker.removeClass('noShadow');
            });

            if (options && !options.isManualMode) {
                // not manual, so we need to bind something to collapse the widget when user clicks outside of it
                var eventName = 'click.multiselector_' + $widget.data('wid'),
                    fnBindCollapse = function () {
                        $('html').unbind(eventName).bind(eventName, function (e) {
                            var $target = $(e.target),
                                widgetClass = typeof self.WIDGET_CLASS === 'string' && self.WIDGET_CLASS.split(' ')[0] || self.WIDGET_CLASS;
                            if ($target.closest('._' + widgetClass).length) {
                                return;
                            }
                            self.fnCollapse();
                        });
                    };
                _.defer(fnBindCollapse);

                // also focus the name filter input
                $widget.find('._selectedList ._filterName').focus();
            } else {
                $widget.addClass('permaexpanded');
            }

            this.fnResizeFilterInput();

            $widget.trigger(EVENT_ON_EXPAND);
        },
        fnUnbindWidgetEvents: function () {
            //this.$widget.unbind();		// @DC: this was unbinding user binds too...
            $('html').unbind('.multiselector_' + this.$widget.data('wid'));
        },
        fnPostStateChange: function () {
            var $widget = this.$widget,
                options = $widget.data('options') || {};

            this.fnFilterName('');
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

            this.fnResizeFilterInput();
            $widget.find('._selectedList ._filterName').val('').eq(0).trigger('focus.multiselector');
        },
        fnToggleSn: function (target, isRemove) {
            var $widget = this.$widget,
                $target = $(target);
            $target = $target.attr('itemid') ? $target : $target.closest('[itemid]');	// incase we're binding delete button

            var itemId = $target.attr('itemid'),
                $selectedList = $widget.find('._selectedList'),
                $selectedListItem = $selectedList.find('[itemid="' + itemId + '"]'),
                $snRow = $widget.find('._picker ._row[itemid="' + itemId + '"]');

            isRemove = !!$selectedListItem.length;	// remove this line for no toggle functionality

            // check max
            var max = (($widget.data('options') && +$widget.data('options').max) || null);
            if (!isRemove && (max && this.fnGetSelected().length >= max)) {
                // check if max == 1, if so, do swap
                if (max == 1) {
                    // clear, then continue with add
                    $widget
                        .find('._selectedList ._selectItem').remove().end()
                        .find('._picker ._row').removeClass('selected');
                } else {
                    return;
                }
            }

            if (isRemove) {
                $selectedListItem.remove();
                $snRow.removeClass('selected x-ads');
            } else if (!$selectedListItem.length) {
                this.fnSelectItem(itemId);
                $snRow.addClass('selected');
            }
            this.fnPostStateChange();
        },
        fnClear: function () {
            this.$widget
                .find('._selectedList ._selectItem').remove().end()
                .find('._picker ._row').removeClass('selected');
            this.fnPostStateChange();
        },
        fnSelectAll: function () {
            var self = this,
                $widget = this.$widget,
                $selectedList = $widget.find('._selectedList'),
                $selectedItems = $selectedList.find('._selectItem'),
                $snRows = $widget.find('._itemListBody ._row');

            if ($selectedItems.length == $snRows.length) {
                return;
            }

            $selectedItems.remove();	// we don't call fnClear here cause we already have the items selected...no need for more overhead.

            $snRows.each(function () {
                self.fnSelectItem($(this).attr('itemid'));
            });

            this.fnPostStateChange();
        },
        fnFilterName: function (val) {
            val = val.replace(/['"\\]/g, '');
            var $widget = this.$widget,
                $rows = $widget.find('._itemList ._row').not('.selected').removeClass('active').addClass('hidden'),
                $filtered = $rows.filter(':Contains("' + val + '")').removeClass('hidden');	// the :Contains expression is custom, find it in util.js
            if (val.length && $filtered.length) {
                $filtered.filter(':first').addClass('active');
            } else {
                if (!(val.length && !$filtered.length)) {
                    $rows.removeClass('hidden');
                }
            }
        },
        fnInitFilter: function () {
            var self = this,
                $widget = this.$widget,
                $input = $widget.find('._selectedList ._filterName');

            // This logic is debounced to avoid filtering the list unnecessarily when multiple letters are
            // typed in quick succession.
            var keyUpHandler = function (e, $selectedList, $input) {
                if (!e.which || !e.which.toString().match(/^(8|38|40)$/)) {
                    $selectedList.find('._selectItem.active').removeClass('active');	// remove any active
                }

                if (!e.which || !e.which.toString().match(/^(38|40)$/)) {
                    self.fnFilterName($input.val()); // read input val again in case we set it to empty string on enter press
                }
            };
            keyUpHandler = _.debounce(keyUpHandler, 300);

            var keyHandler = function (e) {
                var currVal = $input.val(),
                    $selectedList = $widget.find('._selectedList');
                if (e.type == 'keydown') {
                    // need to check for special chars
                    var $currSnList = $widget.find('._itemListBody ._row:visible');

                    if (e.which == 8 && !currVal.length) {								// delete key
                        var $lastSelectedItem = $selectedList.find('._selectItem:last');
                        if ($lastSelectedItem.length) {
                            if ($lastSelectedItem.is('.active')) {
                                $lastSelectedItem.prev('._selectItem').addClass('active');		// automatically set the previous one to active too
                                self.fnToggleSn($lastSelectedItem, true);
                            } else {
                                $lastSelectedItem.addClass('active');
                            }
                        }
                    } else if (e.which == 13 && $currSnList.filter('.active').length) {	// enter key
                        self.fnToggleSn($currSnList.filter('.active'));
                        e.preventDefault();
                    } else if (e.which == 38 || e.which == 40) {						// up and down keys
                        var activeIdx = -1,
                            $currSn = $currSnList.filter(function (i) {
                                if ($(this).is('.active')) {
                                    activeIdx = i;
                                    return true;
                                }
                                return false;
                            });

                        $currSn.removeClass('active');
                        if (e.which == 40) {	// down
                            if (++activeIdx < $currSnList.length) {
                                $currSnList.eq(activeIdx).addClass('active');
                            } else {
                                $currSnList.eq(0).addClass('active');
                            }
                        } else {
                            if (--activeIdx >= 0) {
                                $currSnList.eq(activeIdx).addClass('active');
                            } else {
                                $currSnList.eq($currSnList.length - 1).addClass('active');
                            }
                        }
                        return false;	// don't fire
                    } else if (e.which == 27) {		// ESC key
                        $input.val('');
                        self.fnCollapse();
                        return false;
                    }
                } else if (e.type == 'keyup' || e.type == 'blur') {
                    keyUpHandler(e, $selectedList, $input);
                }
            };

            $input.bind('keydown keyup blur', keyHandler);
        },
        fnInit: function () {
            var self = this,
                $widget = this.$widget,
                $picker = $widget.find('._picker');

            $widget.undelegate('._selectedList ._selectItem._remove', 'mousedown').delegate('._selectedList ._selectItem._remove', 'mousedown', function (e) {
                self.fnToggleSn(this, true);
                e.stopPropagation();    // restrict event from bubbling up past this widget
            });
            $picker.undelegate('._itemListBody ._row', 'mousedown mouseenter mouseleave').delegate('._itemListBody ._row', 'mousedown mouseenter mouseleave', function (e) {
                var $target = $(e.target),
                    $row = $(this),
                    rowIsDisabled = $row.hasClass('rowDisabled');
                if (e.type == 'mousedown' && !rowIsDisabled) {
                    if ($target.is('._action')) {
                        return false;
                    } else {
                        self.fnToggleSn(this);
                    }
                }
            });

            self.fnBindMouse();
            $widget.find('._selectedList').click(function () {
                $(this).find('._filterName').focus();
            });
            $picker.find('._tools')
                .find('._all').click(function () {
                    self.fnSelectAll();
                }).end()
                .find('._clear').click(function () {
                    self.fnClear();
                }).end()
                .find('._showOnly')
                .bind('change blur', function (e) {
                    if (e.type == 'change') {
                        self.fnFilterList($(this).val());
                    }
                    $widget.bind('mouseenter.rebind', function () {
                        $widget.unbind('.rebind');
                        _.defer(function () {
                            self.fnBindMouse();
                        });
                    });
                })
                .bind('focus click', function () {
                    $widget.unbind('.collapseExpand .rebind');
                })
                .end()
                .end();

            self.fnCollapse();
            self.fnInitFilter();
        },

        fnRenderWidgetHtml: function () {
            var template = hsEjs.getEjs(this.WIDGET_EJS),
                options = this.$widget.data('options') || {};

            return template.render({
                listItems: options.listItems,
                defaultText: options.defaultText,
                publisherFilterPin: options.publisherFilterPin,
                isDisabled: options.isDisabled
            });
        },

        fnRender: function (dontRestoreState) {
            var $widget = this.$widget,
                previouslySelected = this.fnGetSelected();

            if (!$widget.length) {
                return;
            }

            var options = $widget.data('options'),
                html = this.fnRenderWidgetHtml(),
                widgetCssClass = ['profileSelectorWidget', this.WIDGET_CLASS];

            // handle options
            options.isNoPin && widgetCssClass.push("nopin");
            options.isShowNames && widgetCssClass.push("shownames");

            // insert widget html into dom, reset events
            this.fnUnbindWidgetEvents();
            $widget.addClass(widgetCssClass.join(' ')).empty().html(html);
            if (!$widget.data('wid')) {
                // set a unique id for this widget
                this.widgetId = WIDGET_ID;
                $widget.data('wid', WIDGET_ID).attr('wid', WIDGET_ID);
                WIDGET_ID++;
            } else {
                $('html').unbind('click.multiselector_' + $widget.data('wid'));
            }
            this.fnSetSelected([]);		// reset selected

            // update widget dom based on options
            if (options.isExpanded) {
                $widget.addClass('permaexpanded');
            } else {
                $widget.find('._picker').addClass('_collapsable');	// add _collapsable to anything else that collapses at the same time
            }
            if (options.max) {
                $widget.find('._tools ._all').remove();		// no "all" button in Max mode
            }

            if (!dontRestoreState) {
                // restore state
                this.fnRestoreSelectedSns(previouslySelected);
                this.fnInit();
            }
        },

        fnRestoreSelectedSns: function (previouslySelected) {
            var $widget = this.$widget,
                $rows = $widget.find('._itemListBody ._row').not('.addSocialNetwork'),
                options = $widget.data('options') || {},
                idsToSelect = [];

            if (previouslySelected.length) {
                idsToSelect = previouslySelected;
            } else if (options.publisherFilterPin) {
                // select the SNs that have been pinned in Publisher
                idsToSelect = hs.publisherFilterSns;
            } else if (!options.isNoPin) {
                // restore from pinned if no previous state
                idsToSelect = [];

                // HS-2341
                if (hs.prefs.restrictedLogin) {
                    _.each(hs.pinnedSns, function (snid) {
                        if (hs.socialNetworks[snid].ownerType == "ORGANIZATION") {
                            idsToSelect.push(snid);
                        }
                    });
                } else {
                    idsToSelect = hs.pinnedSns;
                }
            }
            if (typeof idsToSelect == 'undefined') {
                idsToSelect = [];
            }

            idsToSelect = this.filterPinnedSns(idsToSelect);

            // select defaults if need be
            for (var i = 0; i < idsToSelect.length; i++) {
                if (typeof idsToSelect[i] == 'object' && idsToSelect[i].id !== undefined) {
                    this.fnSelectItem(idsToSelect[i].id);
                } else {
                    this.fnSelectItem(idsToSelect[i]);
                }
            }
            this.fnPostStateChange();	// post state change after selecting defaults

            // if nothing was selected, and isNoAutoSelect is OFF, and they only have one profile, select it here
            // we check this after pinned since hs.pinnedSns could contain ids that are no longer valid, so we can't only check the array
            if (!options.isNoAutoSelect && !this.fnGetSelected().length && $rows.length == 1) {
                this.fnSelectItem($rows.eq(0).attr('itemid'));
                this.fnPostStateChange();	// post state change after selecting defaults
            }

            this.fnPostStateChange();	// post state change after selecting defaults
        },
        filterPinnedSns: function (idsToSelect) {
            // Filters out sns that shouldn't be included in the picker, such as FOURSQAURE for web
            // Should be overridden by each profile selector that needs filtering
            return idsToSelect;
        },
        // really busted, can't do this with classes
        fnRenderAll: function () {
            this.prototype.constructor.renderAll();
        },
        fnGetEventNameByType: function (type) {
            var eventName = '';
            switch (type) {
                case 'change':
                    eventName = EVENT_ON_CHANGE;
                    break;
                case 'select':
                    eventName = EVENT_ON_SELECT;
                    break;
                case 'remove':
                    eventName = EVENT_ON_REMOVE;
                    break;
                case 'expand':
                    eventName = EVENT_ON_EXPAND;
                    break;
                case 'collapse':
                    eventName = EVENT_ON_COLLAPSE;
                    break;
                case 'collapsechange':
                    eventName = EVENT_ON_COLLAPSE_CHANGE;
                    break;
                default:
                    break;
            }
            return eventName;
        },
        fnReset: function () {
            this.fnClear();
            this.render();
        },
        ///////////////////////////////////////////////


        getWidget: function () {
            return this.$widget;
        },
        isRendered: function () {
            return !!this.$widget.children().length;
        },
        getSelectedTypes: function () {
            return _.uniq(_.map(this.fnGetSelected(), function (v) {
                return v.type;
            }));
        },
        getSelected: function () {
            return _.map(this.fnGetSelected(), function (v) {
                return v.id;
            });
        },
        setSelected: function (arrIds) {
            this.fnSetSelected(arrIds);
            return this;
        },
        getPreviousSelected: function () {
            return this.fnGetPreviousSelected();
        },
        init: function (opt, defaultSelected) {
            // @TODO: a lot of these are left over options from profileSelector, cleanup to come
            // handle options
            var $widget = this.$widget,
                options = opt || {},
                max,			// defaults
                type,
                permission,
                isNoPin = false,
                publisherFilterPin = false,
                isExpanded = false,
                isShowNames = false,
                isNoAutoSelect = false,
                expandStyle = 'show',
                filterSnIds,
                defaultText,
                isDisabled = false,
                disabledNetworkTypes,
                isManualMode = options.isManualMode || false;
            if (options.max || !isNaN($widget.attr('max'))) {
                max = options.max || +$widget.attr('max');
            }
            if (options.type || $widget.attr('type')) {
                type = options.type || $widget.attr('type');
            }
            if (options.permission || $widget.attr('permission')) {
                permission = options.permission || $widget.attr('permission');
            }

            isNoAutoSelect = !!(options.isNoAutoSelect || !!$widget.attr('noautoselect'));
            isNoPin = !!(max || options.isNoPin || !!$widget.attr('nopin') || isNoAutoSelect);		// if no auto select is on, no pinning is forced to TRUE
            isExpanded = !!(options.isExpanded || !!$widget.attr('expanded'));
            isShowNames = !!(max == 1 || options.isShowNames || !!$widget.attr('shownames'));
            expandStyle = options.expandStyle || $widget.attr('expandstyle') || 'show';
            defaultText = options.defaultText || $widget.attr('defaulttext');
            isDisabled = options.disabled || $widget.attr('disabled');
            publisherFilterPin = options.publisherFilterPin || !!$widget.attr('publisherfilterpin');

            var inputFilterIds = options.filterSnIds || $widget.attr('filtersnids');
            if (inputFilterIds) {
                filterSnIds = $.isArray(inputFilterIds) ? inputFilterIds : (typeof inputFilterIds.split == 'function') ? inputFilterIds.split(',') : inputFilterIds.toString().split(',');
            }

            disabledNetworkTypes = options.disabledNetworkTypes || $widget.attr('disabledNetworkTypes');

            options = $.extend(options, {
                //isForSocialNetworks: !!isForSocialNetworks,
                max: max,
                type: type,
                permission: permission,
                isNoPin: isNoPin,
                isExpanded: isExpanded,
                isShowNames: isShowNames,
                expandStyle: expandStyle,
                defaultText: defaultText,
                isNoAutoSelect: isNoAutoSelect,
                filterSnIds: filterSnIds,
                isDisabled: isDisabled,
                publisherFilterPin: publisherFilterPin,
                isManualMode: isManualMode,
                disabledNetworkTypes: disabledNetworkTypes
            });
            $widget.data('options', options);	// save options

            if (!this.isRendered()) {
                if ($.isArray(defaultSelected)) {
                    this.setSelected(defaultSelected);
                }
                this.render();
            }
            return this;
        },
        render: function () {
            this.fnRender();
            return this;
        },
        expand: function () {
            this.fnExpand();
            return this;
        },
        collapse: function () {
            var self = this;
            _.defer(function () {
                self.fnCollapse();
            });	// we need to defer this since the collapse event on HTML is also deferred
            return this;
        },
        destroy: function () {
            this.$widget.empty().remove();
        },
        clearSelected: function () {
            this.fnClear();
            return this;
        },
        bind: function (e, cb) {
            var self = this;
            this.$widget.bind(this.fnGetEventNameByType(e), function () {
                cb.call(self, self.getSelected());
            });
            return this;
        },
        unbind: function (e) {
            this.$widget.unbind(this.fnGetEventNameByType(e));
            return this;
        },

        trigger: function (e) {
            this.$widget.trigger(this.fnGetEventNameByType(e));
            return this;
        }
    });

MultiSelector.renderAll = function () {
    $('._multiSelectorWidget').not('._skip').each(function () {
        var ms = new MultiSelector(this);
        ms.render();
    });
};

export default MultiSelector;


