import $ from 'jquery';
import _ from 'underscore';
import hsEjs from 'utils/hs_ejs';
import Popover from 'utils/dropdown/popovers/popover';
import snActions from 'apps/social-network/actions';
import hootbus from 'utils/hootbus';
import ImageLazyLoad from 'utils/image-lazy-load';
import translation from 'utils/translation';
import teammanagement from 'team/management/teammanagement';
import 'utils/jquery_ui/position_flipfirstorfit';
import templateStandardDropdown from '../../../templates/dropdown/standard-dropdown.ejs';

/**
 * Create a dropdown list
 * @class
 * @param {Object} options.data Data used to render the dropdown list.
 * @param {array} options.data.items Array describing the dropdown list items
 * @param {string} options.data.items[n].title
 * @example // Simple dropdown example :
 * var $dropdownlist = new DropdownList({
     *      data: {
     *          items: [
     *              { title: 'Title 1' },
     *              { title: 'Title 2' },
     *              { title: 'Title 3' }
     *          ]
     *      }
     * });
 * @param {string} options.data.items[n].text (if the template supports it)
 * @param {boolean} options.data.items[n].selected
 * @param {string} options.data.items[n].img (if the template supports it)
 * @param {string} options.data.items[n].id (if the template supports it)
 * @param {function} options.data.items[n].change A change callback, triggered when this element is specifically selected
 * @example // Dropdown list with a title, a text and an image :
 * var $dropdownlist = new DropdownList({
     *      data: {
     *         items: [
     *             { title: 'Title 1', text: 'Text 1', img: 'path/to/img/1' },
     *             { title: 'Title 2', text: 'Text 2', img: 'path/to/img/2' },
     *             { title: 'Title 3', text: 'Text 3', img: 'path/to/img/3' }
     *         ]
     *      }
     * });
 * @param {(boolean|string)} [options.data.items[n].divider] Creates a divider if set to true or to a string. If provided, the string will be used as a label
 * @example // Dropdown list with dividers
 * var $dropdownlist = new DropdownList({
     *         data: {
     *             items: [
     *                 { title: 'Title 1' },
     *                 { title: 'Title 2' },
     *                 { divider: true },
     *                 { title: 'Title 3' },
     *                 { divider: 'some label' },
     *                 { title: 'Title 4' }
     *             ]
     *         }
     * });
 * @param {boolean} [options.data.withSearch] Display a search input (if the template chosen supports it)
 * @example // Dropdown list with search
 * var $dropdownlist = new DropdownList({
     *         data: {
     *             items: [
     *                 { title: 'Title 1' },
     *                 { title: 'Title 2' }
     *             ],
     *             withSearch: true
     *         }
     * });
 * @param {Object} [options.adapter] Object used to massage data into data expected by the template (title, text, img keys)
 * @example // Dropdown list with an adapter
 * var $dropdownlist = new DropdownList({
     *         data: {
     *             items: [
     *                 { fullName: 'Title 1', companyName: 'Text 1', avatar: 'path/to/img/1', memberId: '1' },
     *                 { fullName: 'Title 2', companyName: 'Text 2', avatar: 'path/to/img/2', memberId: '2'  }
     *             ]
     *         },
     *         adapter: { title: 'fullName', text: 'companyName', img: 'avatar', id: 'memberId'}
     * });
 * @param {function} [options.select] Custom callback that will be fired on select (arguments : element, event)
 * @param {function} [options.change] Custom callback that will be fired on change (arguments: element, event)
 * @example
 * var $dropdownlist = new DropdownList({
     *         data: {
     *             items: [
     *                 { title: 'Title 1', id: 4 },
     *                 { title: 'Title 2', id: 6 }
     *             ]
     *         },
     *         change: function(element, event){
     *             ... element is the json item describing the row, for example : { title: 'Title 2', id: 6 }
     *         }
     * });
 * @param {function} [options.initialize] Custom callback that will be fired on init (arguments: options)
 * @param {number} [options.width] Dropdown list width
 * @param {jQuery} [options.$anchor] Anchor element, by default an empty jquery element, can be defined later
 * @param {boolean} [options.closeOnSelect] Whether the dropdown list has to close on select
 * @param {boolean} [options.resetOnSelect] Whether the dropdown list has to reset on select
 * @param {boolean} [options.withLazyLoading] Lazy-load the images in the dropdown list, if any are provided
 * @param {string} [options.template] Path to a template used to create the dropdown list
 * @example // 'template' option :
 * var $dropdownlist = new DropdownList({
     *         data: { items: [ {title: 'Title 1'}, { title: 'Title 2' }] },
     *         template: 'path/to/a/template'
     * });
 * @param {string} [options.hoverClass] CSS class added on mouseover
 * @param {string} [options.selectedClass] CSS class added when row is selected
 * @param {string} [options.placement_dropdown] Which position on the dropdown list to align with the anchor
 * @param {string} [options.placement_anchor] Which position on the anchor to align with the dropdown
 * @example
 * var $dropdownlist = new DropdownList({
     *         data: {
     *             items: [
     *                 { title: 'Title 1' },
     *                 { title: 'Title 2' }
     *             ]
     *         },
     *         placement_dropdown: 'center top',
     *         placement_anchor: 'right bottom'
     * });
 * @return {jQuery} dropdownlist element
 * it's possible to subscribe to events triggered on the list element on open, close, select or change
 * @example // subscribe to events
 * var $dropdownlist = new DropdownList({
     *         data: {
     *             items: [
     *                 { title: 'Title 1' },
     *                 { title: 'Title 2' }
     *             ]
     *         }
     * });
 * $dropdownlist.on('dropdownlistchange', function(event, element){});
 * $dropdownlist.on('dropdownlistselect', function(event, element){});
 * $dropdownlist.on('dropdownlistopen', function(event, element){});
 * $dropdownlist.on('dropdownlistclose', function(event, element){});
 * $dropdownlist.on('dropdownlistupdate', function(event){});
 */

const DropdownList = function (options) {
    var self = this;

    var template = options.template;
    this.o = $.extend({}, this.defaults, options);

    if (!this.o.data) {
        throw Error('DropdownList Constructor : please provide a data object');
    }


    var cTpl;
    if (_.isString(template)) {
        cTpl = hsEjs.getEjs(template);
    } else if (_.isObject(template) && _.isFunction(template.render)) {
        cTpl = template;
    } else {
        cTpl = templateStandardDropdown;
    }
    this.compiledTmpl = cTpl;


    this.$list = $(this.compiledTmpl.render(this.massageData()))
        .css({width: this.o.width})
        .data('dropdownlist', this);

    var handleFocus = (event) => {
        if (event.code === 'ArrowDown') {
            event.preventDefault();
            this.focusNextElement();
        } else if (event.code === 'ArrowUp') {
            event.preventDefault();
            this.focusPreviousElement();
        } else if (event.code === 'Space' || event.code === 'Enter') {
            event.preventDefault();
            this.handleFocusSelect();
        } else if(event.code === 'Tab') {
            this.handleFocusTab();
        }
    }

    this.$list
        .on('dropdownlistopen', function () {
            self.$list.addClass('active');
            self.$list.hsDropdownList('focusFirstElement');
            self.$list[0].addEventListener('keydown', handleFocus);
            self.o.$anchor.attr('aria-expanded', 'true');
        })
        .on('dropdownlistclose', function () {
            self.$list.removeClass('active');
            self.o.$anchor.attr('aria-expanded', 'false');
        });

    if (this.o.withLazyLoading) {
        // Sets up lazy loading on the SN picker
        this.isLazyLoaded = false;

        this.$list.on('dropdownlistopen', function () {
            // Initialize the item list and set scroll to top on expand
            self.$list.find('._scroll-list').scrollTop(0);

            if (!self.isLazyLoaded) {
                self.imageLazyLoad = new ImageLazyLoad(self.$list.find('._scroll-list'));
                self.isLazyLoaded = true;
            }
        });
    }

    this.popover = new Popover({
        content: this.$list,
        $anchor: this.o.$anchor,
        placement_at: self.o.placement_anchor,
        placement_my: self.o.placement_dropdown,
        placement_collision: self.o.placement_collision
    });

    this.setAnchor(this.o.$anchor);

    this.setEvents(options);

    this.o.initialize && _.isFunction(this.o.initialize) && this.o.initialize.call(this, options);

    return this.$list;
};

$.extend(DropdownList.prototype,
    /** @lends DropdownList.prototype */
    {
        /**
         * Default options
         */
        defaults: {
            baseClass: '_dropdownlist-',
            closeOnSelect: true,
            resetOnSelect: false,
            hoverClass: 'hover',
            selectedClass: 'selected',
            rowSel: '._row',
            searchSel: 'input._dropdownSearch',
            width: 'auto',
            multiselect: false,
            multiselectDisplayLength: 3,
            $anchor: $([]),
            placement_dropdown: 'left top',
            placement_anchor: 'left bottom',
            placement_collision: 'flipfirstorfit',
            adapter: {
                title: 'title',
                text: 'text',
                img: 'img',
                id: 'id'
            },
            allOptionsKey: '_all',
            skipOptionsKey: '_skip',
            withLazyLoading: false
        },
        /**
         * Set events
         */
        setEvents: function (options) {
            var self = this;

            this.$list
                .on('click', self.o.rowSel, function (event) {
                    self.onItemClick(this, event);
                    event.preventDefault();
                })
                .on('click', '._noresults', function (event) {
                    self.close();
                    event.preventDefault();
                })
                .on('mouseenter', self.o.rowSel, function () {
                    $(this).addClass(self.o.hoverClass);
                })
                .on('mouseleave', self.o.rowSel, function () {
                    $(this).removeClass(self.o.hoverClass);
                });

            this.searchInputEventBinding();

            this.$addNewMember = this.$list.find('._addNewMember');
            if (this.$addNewMember.length && this.o.addNew && this.o.addNew.organizationId) {
                this.$addNewMember.on('click', function () {
                    self.close();
                    teammanagement.inviteMember(self.o.addNew);
                });
            }
            this.$addNewTeam = this.$list.find('._addNewTeam');
            if (this.$addNewTeam.length && this.o.addNew && this.o.addNew.organizationId) {
                this.$addNewTeam.on('click', function () {
                    self.close();
                    teammanagement.addTeamPopup(this.o.addNew.organizationId, null, null, function () {
                        // @TODO: refresh something
                    });
                });
            }
            this.$addNewSocialNetwork = this.$list.find('._addNewSocialNetwork');
            if (this.$addNewSocialNetwork.length && this.o.addNew && this.o.addNew.organizationId) {
                this.$addNewSocialNetwork.on('click', function () {
                    self.close();
                    snActions.add({organizationId: self.o.addNew.organizationId});
                });
            }

            var elementSelectedAtStart = this.getSelectedElement();
            if (elementSelectedAtStart) {
                _.defer(function () {
                    self.o.change && _.isFunction(self.o.change) && self.o.change.call(this, elementSelectedAtStart, null);
                    self.$list.trigger('dropdownlistchange', elementSelectedAtStart);
                });
            }

            this.$scrollList = this.$list.find('._scroll-list');
            this.$scrollList.on('scroll', _.throttle(function () {
                var buffer = 200;

                if (options.hasMore &&
                    self.$scrollList.find('._row:last').position().top - self.$scrollList.height() < buffer) {
                    ajaxCall({
                        type: 'GET',
                        url: options.loadMorePath,
                        data: "organizationId=" + options.organizationId + '&page=' + (options.currentPageNum + 1) + (options.memberId ? '&memberIdToSet=' + options.memberId : ''),
                        beforeSend: function () {
                            hs.statusObj.update(translation.c.LOADING, 'info');
                        },
                        success: function (data) {
                            options.currentPageNum++;
                            options.hasMore = data.pagination.hasMore;

                            var scrollTop = self.$scrollList.scrollTop();
                            _.each(_.values(data.socialNetworks), function (socialNetwork) {
                                self.addRow(socialNetwork);
                            });
                            self.$list.find('._scroll-list').scrollTop(scrollTop);
                            self.setEvents(options);
                        },
                        complete: function () {
                            hs.statusObj.reset();
                        },
                        abort: function () {
                            hs.statusObj.reset();
                        }
                    }, 'qm');
                }
            }, 100));
        },
        /**
         * Bind events to search input
         */
        searchInputEventBinding: function () {
            const handleFocus = (event) => {
                if (event.code === 'ArrowDown') {
                    event.preventDefault();
                    this.focusFirstElement();
                } else if (event.code === 'ArrowUp') {
                    event.preventDefault();
                    this.focusLastElement();
                } else if(event.code === 'Tab') {
                    this.handleFocusTab();
                }
            }

            this.$searchInput = (this.o.$searchInput && 'jquery' in  this.o.$searchInput) ? this.o.$searchInput : this.$list.find(this.o.searchSel);
            var self = this;
            if (this.$searchInput.length) {

                this.$searchInput[0].addEventListener('keydown', handleFocus);

                var onSearch = _.debounce(function (event) {
                    self.onSearchKeyUp(this, event);
                }, 300);

                this.$searchInput
                    .off('keyup.ddlist')
                    .on('keyup.ddlist', onSearch)
                    .css({width: this.o.width - 20});

                // Prevent the event from bubbling up - HS-3085
                this.$searchInput.off('click.ddlist').on('click.ddlist', function (event) {
                    event.stopPropagation();
                });

            }
        },

        /**
         * get all rows, visible or not
         */
        getRows: function () {
            return this.$list.find(this.o.rowSel);
        },
        /**
         * Get the number of visible rows
         * @return {Integer} number of visible rows
         */
        countVisibleRows: function () {
            return this.getRows().filter(':visible').length;
        },
        /**
         * Add a row
         * @param {Object} rowData
         */
        addRow: function (rowData) {
            this.o.data.items.push(rowData);
            this.updateList();
        },
        /**
         * Remove a row
         * @param {String} value
         * @param {String} [key], default : id
         */
        removeRow: function (value, key) {
            if (!key) {
                key = 'id';
            }
            var items = _.filter(this.o.data.items, function (item) {
                return (item[key] !== value);
            });
            if (items.length != this.o.data.items) {
                this.o.data.items = items;
                this.updateList();
            }
        },
        /**
         * Update the list (redraw)
         * @fires dropdownlistupdate
         */
        updateList: function () {
            var $compiled = $(this.compiledTmpl.render(this.massageData())).children();
            this.$list.html($compiled);
            this.$list.trigger('dropdownlistupdate');
            this.searchInputEventBinding();
        },
        /**
         * get selected Index
         */
        getSelectedIndex: function () {
            var $selectedRows = this.getRows().filter('.' + this.o.selectedClass);
            return ($selectedRows.length && $selectedRows.data('index') != null) ? $selectedRows.data('index') : -1;
        },
        /**
         * get selected Indexes
         */
        getSelectedIndexes: function () {
            var $selectedRows = this.getRows().filter('.' + this.o.selectedClass);
            if ($selectedRows.length === 1) {
                $selectedRows = [$selectedRows];
            }
            return _.map($selectedRows, function ($row) {
                return $($row).data('index');
            });
        },
        /**
         * get selected element
         */
        getSelectedElement: function () {
            var selectedIndex = this.getSelectedIndex();
            return this.getElement(selectedIndex);
        },
        getSelectedElements: function () {
            var self = this,
                selectedIndexes = this.getSelectedIndexes();
            return _.map(selectedIndexes, function (selectedIndex) {
                return self.getElement(selectedIndex);
            });
        },
        /**
         * get unique id
         */
        getUniqueId: function () {
            var matches = new RegExp(this.o.baseClass + '([0-9]+)', 'g').exec(this.$list.get(0).className);
            return (matches.length >= 2) ? matches[1] : false;
        },
        /**
         * get element at index
         * @param {Number} index
         * @return {Object} element
         */
        getElement: function (index) {
            return this.o.data.items[index];
        },
        /**
         * get an element data by providing its value
         * @param {String} value
         * @param {String} [key]
         */
        getElementByValue: function (value, key) {
            if (!key) {
                key = 'id';
            }
            return _.find(this.o.data.items, function (item) {
                return (item[key] == value);
            });
        },
        currentElement: 0,
        focusFirstElement: function () {
            const items = this.getRows().filter(':visible');
            this.currentElement = 0;
            if (items.length > 0) {
              items[0].focus();
            }
        },
        focusLastElement: function () {
            const items = this.getRows().filter(':visible');
            if (items.length > 0) {
                this.currentElement = items.length-1;
                items[items.length-1].focus();
            }
        },
        focusPreviousElement: function () {
            const items = this.getRows().filter(':visible');
            if (this.currentElement == 0){
                this.currentElement = items.length-1;
            } else {
                this.currentElement--;
            }
            items[this.currentElement].focus();
        },
        focusNextElement: function () {
            const items = this.getRows().filter(':visible');
            if (this.currentElement == items.length-1){
                this.currentElement = 0;
            } else {
                this.currentElement++;
            }
            items[this.currentElement].focus();
        },
        handleFocusSelect: function () {
            const items = this.getRows().filter(':visible');
            items[this.currentElement].click();
            this.currentElement = 0;
            this.o.$anchor[0].focus();
        },
        handleFocusTab: function() {
            this.o.$anchor[0].focus();
            this.close();
        },
        selectElement: function (value, key, silent) {
            if (!key) {
                key = 'id';
            }
            var item = _.find(this.o.data.items, function (item) {
                return (item[key] == value);
            });
            if (item == void 0) {
                return;
            }
            this.selectItem(item, silent);
        },
        deselectElement: function (value, key, silent) {
            if (!key) {
                key = 'id';
            }
            var item = _.find(this.o.data.items, function (item) {
                return (item[key] == value);
            });
            if (item == void 0) {
                return;
            }
            this.deselectItem(item, silent);
        },
        selectFirstElement: function (silent) {
            var firstItem = _.find(this.o.data.items, function (e) {
                return !Object.prototype.hasOwnProperty.call(e, 'divider');
            });
            this.selectItem(firstItem, silent);
        },
        selectItem: function (item, silent) {
            var self = this;
            this.getRows().each(function () {
                var $row = $(this);
                if ($row.data('index') === item.dd.index) {
                    self.onSelect(this, null, silent);
                }
            });
        },
        deselectItem: function (item, silent) {
            var self = this;
            this.getRows().each(function () {
                var $row = $(this);
                if ($row.data('index') === item.dd.index) {
                    self.onDeselect(this, null, silent);
                }
            });
        },
        hideElements: function (arrIdsToHide) {
            var $rows = this.getRows();
            $rows.show();

            var items = [];
            _.each(this.o.data.items, function (item) {
                if (_.indexOf(arrIdsToHide, item.id) > -1) {
                    items.push(item);
                }
            });

            _.each(items, function (item) {
                $rows.each(function () {
                    var $row = $(this);
                    if ($row.data('index') === item.dd.index) {
                        $row.hide();
                    }
                });
            });

            if (!this.countVisibleRows()) {
                this.close();
            }
        },

        /**
         * Close the popover and trigger dropdownlistclose event
         */
        close: function () {
            this.popover.close();
            this.$list.trigger('dropdownlistclose');
        },
        /**
         * Both display and position the popover
         * @param {jQuery} [$anchor] the anchor element
         */
        open: function ($anchor) {
            this.setAnchor($anchor);
            this.popover.open($anchor);
            this.$list.trigger('dropdownlistopen');
            // if the anchor that triggers the dropdown is in the messageBoxContainer subscribe to the 'composeBox:collapsed' hootbus and close if triggered
            if (this.o.$anchor.closest('#messageBoxContainer').length) {
                hootbus.once('composeBox:collapsed', _.bind(this.close, this));
            }
            if (this.$searchInput.length) {
                this.$searchInput.focus();
            }
        },
        /**
         * Reset all the rows
         */
        reset: function () {
            this.getRows()
                .removeClass(this.o.selectedClass)
                .find('._toggle').removeClass('checkmark').addClass('blank');
        },
        /**
         * Check if index is different from selected index
         * @param {Number} index Index to compare with the selected index
         * @returns {Boolean} Whether the selected index is different from the index provided
         */
        hasChanged: function (index) {
            return (this.getSelectedIndex() !== index);
        },
        /**
         * Handler triggered when typing in the search input field
         */
        onSearchKeyUp: function (el, event) {

            var $items = this.getRows();
            var val;
            val = $(el).val().trim().replace(/\(/g, '(').replace(/\)/g, ')');
            $items.not('._no-search').show().removeClass('_hiddenbysearch');
            if (!val.length) {
                return;
            }
            $items.not(':Contains(' + val + ')')
                .hide()
                .addClass('_hiddenbysearch');

            // hide dropdown options which are already selected
            var pillTags = _.map($(el).parents("._selection").find("._item"), function (tag) {
                return $(tag).attr("val");
            });
            _.each(pillTags, function (pillTag) {
                $items.filter(":has(._tagName[val = '" + pillTag + "'])")
                .hide()
                .addClass('_hiddenbysearch');
            });

            if (event.keyCode == 13) {
                var $visibleItems = $items.filter(':visible');
                if ($visibleItems.length >= 1) {
                    $visibleItems.first().click();
                }
            }
        },
        resetSearch: function () {
            this.$searchInput.val('').keyup();
        },
        /**
         * Handler triggered on select
         */
        onSelect: function (el, event, silent) {
            event && event.stopPropagation();
            var $el = $(el),
                index = $el.data('index'),
                element = this.getElement(index);

            if (!silent) {
                this.o.select && _.isFunction(this.o.select) && this.o.select.call(this, element, event);
            }
            this.$list.trigger('dropdownlistselect', element);

            this.onChange($el, index, element, event, silent);

            if (this.o.closeOnSelect) {
                this.close();
            }
            if (this.o.resetOnSelect) {
                this.reset();
            }
            return false;
        },
        /**
         * Handler triggered on deselect
         */
        onDeselect: function (el, event, silent) {
            event && event.stopPropagation();
            var $el = $(el),
                index = $el.data('index'),
                element = this.getElement(index);

            this.$list.trigger('dropdownlistdeselect', element);
            if (!silent) {
                this.o.deselect && _.isFunction(this.o.deselect) && this.o.deselect.call(this, element, event);
            }

            this.onChange($el, index, element, event, silent);

            if (this.o.closeOnSelect) {
                this.close();
            }
            if (this.o.resetOnSelect) {
                this.reset();
            }
            return false;
        },
        /**
         * Handler triggered on change
         */
        onChange: function ($el, index, element, event, silent) {
            if (!this.o.multiselect) {
                if (this.hasChanged(index)) {
                    this.getRows().removeClass(this.o.selectedClass)
                        .find('._toggle').removeClass('checkmark').addClass('blank');
                    $el.addClass(this.o.selectedClass);
                    $el.find('._toggle').removeClass('blank').addClass('checkmark');
                    if (!silent) {
                        this.o.change && _.isFunction(this.o.change) && this.o.change.call(this, element, event);
                    }
                    element.change && _.isFunction(element.change) && element.change.call(this, element, event);
                    this.$list.trigger('dropdownlistchange', element);
                }
            } else {
                if ($el.hasClass(this.o.selectedClass)) {
                    //deselect
                    $el.removeClass(this.o.selectedClass)
                        .find('._toggle').removeClass('checkmark').addClass('blank');
                } else {
                    //select
                    $el.addClass(this.o.selectedClass)
                        .find('._toggle').removeClass('blank').addClass('checkmark');
                }
                if (!silent) {
                    this.o.change && _.isFunction(this.o.change) && this.o.change.call(this, element, event);
                }
                element.change && _.isFunction(element.change) && element.change.call(this, element, event);
                this.$list.trigger('dropdownlistchange', element);
            }
            return false;
        },
        /**
         * Handler triggered on click on a row
         */
        onItemClick: function (el, event) {
            if ($(el).hasClass('disabled')) {
                return;
            }
            // insert multiselect condition
            if (this.o.multiselect && $(el).hasClass(this.o.selectedClass)) {
                this.onDeselect(el, event);
            } else {
                this.onSelect(el, event);
            }
        },
        /**
         * set or get an option
         */
        option: function (optionName, optionValue) {
            if (optionValue === void 0) {
                return this.o[optionName];
            } else {
                this.o[optionName] = optionValue;
            }
        },
        /**
         * Return value for several options
         */
        options: function (options) {
            var ret = {}, self = this;
            _.each(options, function (optionName) {
                ret[optionName] = self.o[optionName];
            });
            return ret;
        },
        /**
         * Massage data passed to the template, using the adapter option
         */
        massageData: function () {
            var items = this.o.data.items, adapter = this.o.adapter;
            this.o.data.withLazyLoading = this.o.withLazyLoading;

            if (adapter && items) {
                _.map(items, function (item, index) {
                    var obj = {};
                    obj.index = index;
                    _.each(adapter, function (value, key) {
                        obj[key] = item[value];
                    });
                    item.dd = obj;
                });
            }
            return this.o.data;
        },
        setAnchor: function ($anchor) {
            if ($anchor && $anchor.length) {
                var self = this;
                this.o.$anchor = $anchor;
                this.o.$anchor.on('popoverclose', function () {
                    self.$list.trigger('dropdownlistclose');
                });
            }
        },
        destroy: function () {
            this.$list.off();
            this.popover.close();
            this.$list.removeData('dropdownlist').empty();
            for (var prop in this) {
                if (Object.prototype.hasOwnProperty.call(this, prop)) {
                    delete this[prop];
                }
            }
        },
        serializeArray: function () {
            var name = this.o.name,
                self = this;
            if (typeof name === 'undefined') {
                throw new Error('Missing name for dropdown');
            }
            var els = this.getSelectedElements();

            if (els.length === 1) {
                if (els[0][this.o.skipOptionsKey]) {
                    return [];
                }
                if (els[0][this.o.allOptionsKey]) {
                    els = _.filter(this.o.data.items, function (item) {
                        return !Object.prototype.hasOwnProperty.call(item, 'divider') && !Object.prototype.hasOwnProperty.call(item, self.o.allOptionsKey);
                    });
                }

            }

            return _.map(els, function (el) {
                var value = (el.dd.id) ? el.dd.id : el.dd.title;
                return {
                    name: name,
                    value: value
                };
            });
        },
        serialize: function () {
            var values = _.map(this.serializeArray(), function (el) {
                return encodeURI(el.name + '=' + el.value).replace('%20', '+');
            });
            return values.join('&');
        },
        getItemIndex: function (key, value) {
            var items = _.filter(this.o.data.items, function (item) {
                return item.divider !== true;
            });
            for (var i = 0; i < items.length; i++) {
                if (items[i][key] === value) {
                    return i;
                }
            }
        },
        disableItem: function (key, value) {
            var itemIndexToDisable = this.getItemIndex(key, value);
            this.o.data.items[itemIndexToDisable].disabled = true;
            var $myRows = this.getRows();
            $($myRows[itemIndexToDisable]).addClass('disabled');
        },
        enableItem: function (key, value) {
            var itemIndexToEnable = this.getItemIndex(key, value);
            this.o.data.items[itemIndexToEnable].disabled = false;
            var $myRows = this.getRows();
            $($myRows[itemIndexToEnable]).removeClass('disabled');
        }
    });

hs.DropdownList = DropdownList;

export default DropdownList;

