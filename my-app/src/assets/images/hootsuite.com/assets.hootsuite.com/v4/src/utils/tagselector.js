import $ from 'jquery';
import _ from 'underscore';
import translation from 'utils/translation';
import hsEjs from 'utils/hs_ejs';
import 'utils/translation';
import 'utils/dropdown/jquery-hsdropdownlist';
import 'utils/util';
import uniqueId from 'utils/unique-id';

$.fn.hsTagSelector = function () {
    if (this.length === 1) {
        var $this = $(this),
            command = arguments[0],
            options = arguments[0] || {};

        if (typeof options === 'object') {
            $this.data('hsTagSelector', new TagSelector($this, options));

        } else if (typeof command === 'string') {

            var remap = {
                    'list': 'getList',
                    'input': 'getInputField',
                    'newTagName': 'getNewTagEl',
                    'createTagBtn': 'getCreateTagBtn',
                    'addTags': 'addPillsByValue',
                    'removeAllTags': 'removeAllPills',
                    'tags': 'getTags',
                    'serialize': 'serialize',
                    'serializeArray': 'serializeArray',
                    'onchange': 'onchange',
                    'destroy': 'destroy'
                },
                fnToRun = remap[command];

            var args = Array.prototype.slice.call(arguments, 1),
                inst = $this.data('hsTagSelector');

            if (inst && $.isFunction(inst[fnToRun])) {
                return inst[fnToRun].apply(inst, args);
            }
            return false;
        }
    }
    return this;
};

/**
 * Represents a tag selector
 * @param $el
 * @param options
 * @constructor
 */
var TagSelector = function ($el, options) {
    var tagInputId = uniqueId.create('tagInput_')
    var self = this;
    this.$el = $el;

    if (this.$el.data('hsTagSelector')) {
        this.$el.hsTagSelector('destroy');
    }

    var html = '<div class="tagging">';
    html += `<label for="${tagInputId}" class=" _taggingLabel" >`;
    html += '<ul class="_selection pickList">';

    if (options.fullInput) {
        html += '<li class="user full">';
    }
    else {
        html += '<li class="user">';
    }

    if (!('placeholderText' in options)) {
        options.placeholderText = translation._("Enter a Tag");
    }

    if (options.fullInput) {
        html += `<input id="${tagInputId}" class="clean full _tagInput" type="text" tabindex="1" aria-label="${options.placeholderText}" role="combobox" autocomplete="off" aria-autocomplete="list" aria-controls="tagDropdown" />`;
    }
    else if (options.wideInput) {
        html += `<input id="${tagInputId}" class="clean wide _tagInput" type="text" tabindex="1" aria-label="${options.placeholderText}" role="combobox" autocomplete="off" aria-autocomplete="list" aria-controls="tagDropdown" />`;
    }
    else {
        html += `<input id="${tagInputId}" class="clean _tagInput" type="text" tabindex="0" aria-label="${options.placeholderText}" role="combobox" autocomplete="off" aria-autocomplete="list" aria-controls="tagDropdown" />`;
    }

    html += '<span class="_tagsplaceholder">' + options.placeholderText + '&hellip;</span>';
    html += '</li></ul>';
    html += '</label></div>';

    if (!options.tagAdapter || !_.isObject(options.tagAdapter) || typeof options.tagAdapter.label !== 'string' || typeof options.tagAdapter.value !== 'string') {
        options.tagAdapter = {
            label: 'label',
            value: 'value'
        };
    }
    options.tagAdapter['cleanLabel'] = 'label';
    options.tagAdapter['cleanValue'] = 'value';

    if (!('canCreate' in options)) {
        options.canCreate = true;
    }
    if (!('canDelete' in options)) {
        options.canDelete = true;
    }
    if (!('dropDownList' in options)) {
        options.dropDownList = true;
    }
    if (!('src' in options)) {
        options.src = '';
    }

    var o = this.o = options;

    this.$el.empty().append(html);
    this.$input = this.getInputField();

    if ('pasteHandler' in options) {
        this.$input.bind('paste', function () {
            _.defer(function () {
                _.isFunction(options.pasteHandler) && options.pasteHandler(self.getInputFieldValue(), function (tag) {
                    self.createTagCallback(tag);
                });
            });
        });
    }

    var createOption = true;
    if (hs.isFeatureEnabledOrBeta('PUB_24504_TAGS_CREATE_PERMISSION')) {
        if (o.shouldHideCanCreateTag) {
            createOption = false;
        }
    }
    this.$list = new hs.DropdownList({
        data: {
            items: o.tags,
            canCreateTag: o.canCreate,
            canDeleteTag: o.canDelete,
            shouldHideCanCreateTag: createOption,
            src: o.src,
            inputId: tagInputId
        },
        $anchor: this.$input,
        adapter: {title: o.tagAdapter.label},
        template: 'dropdown/message_tag_list_dropdown',
        $searchInput: this.$input,
        resetOnSelect: true,
        placement_collision: 'fit',
        change: function (element) {
            self.addPills(element);
            if (self.o.$cb) {
                self.o.$cb.attr('checked', 'checked');
            }
        }
    });
    if (options.isCollapsible === true) { // only enable collapsing pills if specified
        this.$list.on('dropdownlistclose', function () {
            setTimeout(function () {
                // Without this, the pills collapse immediately, which is
                // too soon for a click to go through so trying to remove
                // a pill would fail.
                self.collapsePills();
            }, 250);
        });
        this.$list.on('dropdownlistopen', function () {
            self.expandPills();
        });
    }
    this.$list.on('dropdownlistupdate', function () {
        self.bindListEvents();
    });
    this.bindListEvents();

    this.$input.on('focus', function () {
        // Show dropdown when input is focused (keyboard or click) and the dropdown is not already shown
        if (o.dropDownList && !document.querySelector('#popOverPane .menu-dropdown')) {
            if (options.isCollapsible === true) { // only enable collapsing pills if specified
                self.expandPills();
            }
            self.$list.hsDropdownList('open');
        }
    });

    this.$input.on('keydown', function (e) {
        // Move focus to the dropdown when pressing the up or down arrow
        if (o.dropDownList && document.querySelector('#popOverPane .menu-dropdown')) {
            if (e.key === "ArrowDown") {
                self.$list.hsDropdownList('focusFirstElement');
            } else if (e.key === "ArrowUp") {
                self.$list.hsDropdownList('focusFirstElement');
                self.$list.hsDropdownList('focusPreviousElement');
            }
        }
    });

    this.$list.delegate('._deleteTagLink', 'click', function () {
        var tagIndex = $(this).closest('._row').data('index'),
            tagObj = self.getList().hsDropdownList('getElement', tagIndex);
        self.deleteTag(tagObj);
        return false;
    });

    this.$el.delegate('._item', 'click', function () {
        var tag = $(this).data('tag');
        if ($(this).hasClass('_collapsedPill')) {
            if (options.isCollapsible === true) { // only enable collapsing pills if specified
                // clicking on a collapsed pill expands it
                self.expandPills();
                if (o.dropDownList) {
                    self.$list.hsDropdownList('open');
                }
            }
        } else {
            if (tag != void 0) {
                self.removePill(tag);
                if (options.isCollapsible === true) { // only enable collapsing pills if specified
                    self.expandPills();
                    self.collapsePills();
                }
            }
        }
        return false;
    });

    var $tagsplaceholder = this.$input.add(this.$el.find('._tagsplaceholder'));

    if (!Object.prototype.hasOwnProperty.call(this.o, '$cb') || !('jquery' in this.o.$cb) || !this.o.$cb.is(':checkbox')) {
        this.o.$cb = false;
    }

    $tagsplaceholder.on('focus blur', function (e) {
        var $target = $(this),
            $placeholder = $target.is('._tagsplaceholder') ? $target : $target.siblings('._tagsplaceholder');

        if (e.type === 'focus') {
            if (self.o.$cb) {
                self.o.$cb.attr('checked', 'checked');
            }
            $placeholder.hide();
        } else if (e.type === 'blur') {
            if ($target.is('input') && $target.val() === '' && $target.closest('._selection').find('._item').length === 0) {
                if (self.o.$cb) {
                    self.o.$cb.attr('checked', false);
                }
                $placeholder[(self.getTags().length) ? 'hide' : 'show']();
            }
        }
    });

    if (o.canCreate) {
        this.$input
            .keyup(function (e) {
                // backspace: 8, space: 32, comma: 188
                if (e.keyCode != 13 && e.keyCode != 188) {
                    //update the dropdown with whatever the person is typing, and show the 'create tag' section
                    var val;
                    val = self.getInputFieldValue().trim();
                    self.setNewTagName(val);
                    var isLabelInList = !!self.$list.hsDropdownList('getElementByValue', val, o.tagAdapter.label);
                    var $createTagBtn = self.getCreateTagBtn();
                    if (val && !isLabelInList) {
                        $createTagBtn.parent().show();
                    } else {
                        $createTagBtn.parent().hide();
                    }
                }
            })
            .keydown(function (e) {
                // without dropdown trigger addition with space or comma as well
                var val = self.getInputFieldValue();

                // If backspacing in an empty input field, edit the last pill in the list and remove the placeholder
                if (e.keyCode === 8 && val === '') {
                    var pill = self.removeLastPill();
                    if (typeof pill !== 'undefined') {
                        self.setInputFieldValue(pill.label);
                    }
                    // always hide the placeholder here
                    // it shows back on input blur
                    $('._tagsplaceholder').hide();
                    e.preventDefault();
                } else if (e.keyCode === 13 || (!self.o.dropDownList && (e.keyCode === 32 || e.keyCode === 188))) {
                    if (!self.o.dropDownList || self.getList().hsDropdownList('countVisibleRows') === 0) {
                        self.createTag();
                    }
                    e.preventDefault();
                } else if (!self.getList().find('._tagList').is(':visible')) {
                    if (o.dropDownList) {
                        self.$list.hsDropdownList('open');
                    }
                }
            });
    }

};

$.extend(TagSelector.prototype,
    /** @lends TagSelector.prototype */
    {
        getList: function () {
            return this.$list;
        },
        getInputField: function () {
            return this.$input || (this.$input = this.$el.find('._tagInput'));
        },
        getInputFieldValue: function () {
            return this.getInputField().val();
        },
        setInputFieldValue: function (newval) {
            this.getInputField().val(newval);
        },
        bindListEvents: function () {
            var self = this;
            this.$newTagName = false;
            this.$createTagBtn = false;
            if (this.o.canCreate) {
                this.getCreateTagBtn().parent().off().on('click', function () {
                    self.createTag();
                    return false;
                });
            }

            var $tagSelector = this;
            var manageTagsLink = this.getManageTagsLink();
            if (manageTagsLink) {
                manageTagsLink.on('click', function () {
                    $tagSelector.getList().hsDropdownList('close');
                });
            }
        },
        getNewTagEl: function () {
            return this.$newTagName || (this.$newTagName = this.getList().find('._newTagName'));
        },
        getCreateTagBtn: function () {
            return this.$createTagBtn || (this.$createTagBtn = this.getList().find('._createTag'));
        },

        getManageTagsLink: function () {
            return this.$manageTagsLink || (this.$manageTagsLink = this.getList().find('.manage_tags_link'));
        },

        setNewTagName: function (val) {
            this.getNewTagEl().text(val);
        },
        getNewTagName: function () {
            return this.getNewTagEl().text();
        },
        cleanTag: function (json) {
            var tagAdapter = this.o.tagAdapter;

            // If the tag is already using the 'clean' fields, do nothing.
            if (json[tagAdapter.cleanLabel] && json[tagAdapter.cleanValue]) {
                return json;
            }
            var cleanTag = {};
            cleanTag['label'] = json[tagAdapter.label];
            cleanTag['value'] = json[tagAdapter.value] || cleanTag['label'];
            return cleanTag;
        },
        cleanTagOut: function (json) {
            var ta = this.o.tagAdapter;
            var cTOut = {};
            cTOut[ta.label] = json['label'] || json[ta.label];
            cTOut[ta.value] = json['value'] || json['label'] || json[ta.value];
            return cTOut;
        },
        cleanTagIn: function () {
        },
        addPillsByValue: function (values) {
            if (!values) {
                return;
            }
            if (!_.isArray(values)) {
                values = [values];
            }
            var self = this,
                tags = [],
                $l = this.getList(),
                key = self.o.tagAdapter.value;

            _.each(values, function (value) {
                var tagObj = $l.hsDropdownList('getElementByValue', value, key);
                if (tagObj) {
                    tags.push(tagObj);
                }
            });
            if (tags.length) {
                self.addPills(tags);
            }
        },
        // tags may not be formatted for internal use
        addPills: function (tags) {
            var self = this,
                tagAdapter = this.o.tagAdapter;
            this.$list.hsDropdownList('resetSearch');
            if (tags && !_.isArray(tags)) {
                tags = [tags];
            }
            if (!tags.length) {
                return;
            }

            // tags can come from the dropdown or outside and not be formatted for internal use { id: 3, name:''}
            var cleanTags = _.map(tags, function (tag) {
                return self.cleanTag(tag);
            });

            var tagPillsValues = _.pluck(this.getTags(), tagAdapter.value);

            var filteredTags = (tagPillsValues.length === 0) ? cleanTags : _.filter(cleanTags, function (tag) {
                return (_.indexOf(tagPillsValues, tag.value) === -1);
            });
            if (!filteredTags.length) {
                // nothing to add
                return;
            }

            var pillsArr = _.map(filteredTags, function (tag) {
                    // Since these tags have been cleaned, just use the raw 'label' and 'value'
                    var tagLabel = tag['label'],
                        tagValue = tag['value'] || tagLabel,
                        maxLabelLength = 30, //maximum pill chars
                        $li;
                    hsEjs.cleanPage(tagLabel);
                    if (tags[0].collapsed === true) {
                        // collapsed pills look and behave slightly differently
                        $li = $('<li class="item _item _collapsedPill val="' + hsEjs.cleanPage(tagValue) + '">' + hsEjs.cleanPage(window.truncate(tagLabel, maxLabelLength)) + '</li>');
                    } else {
                        const tagLabelText = hsEjs.cleanPage(window.truncate(tagLabel, maxLabelLength));
                        const tagAriaLabel = translation._("Remove %s1 tag").replace('%s1', tagLabelText);
                        $li = $(`<li class="item _item" val="${hsEjs.cleanPage(tagValue)}">${tagLabelText}<button type="button" class="icon-13 close _removeItem" aria-label="${tagAriaLabel}"></button></li>`);
                    }
                    $li.data('tag', tag);
                    return $li;
                }),
                $pills = $(pillsArr).map(function () {
                    return this.toArray();
                });
            if (!$pills.length) {
                return;
            }

            this.$el.find('li:last').before($pills);
            $('._tagsplaceholder').hide();
            this.triggerChange();
        },
        collapsePills: function () {
            this.expandPills(); // ensure that no collapsed pills are there (in case collapse pills gets called twice)
            var allPills = this.getPills();
            var pickListBoxLength = Math.floor($("._tagWidgetContainer").closest(".sf-col").width() / 2); // the max-width of the filter bar
            var sumWidthOfPills = 0;
            sumWidthOfPills += this.$el.find('._selection').find('._tagInput').outerWidth(true); // width of filter span
            allPills.each(function (key, value) {
                sumWidthOfPills += $(value).outerWidth(true);
            });

            // hide all offending pills by adding .hiddenPill class
            var numberOfCollapsedPills = 0;
            var arePillsCollapsed = false;
            for (var i = allPills.length - 1; i >= 0; i--) {
                if (sumWidthOfPills > pickListBoxLength) {
                    if (arePillsCollapsed === true) {
                        sumWidthOfPills = sumWidthOfPills - this.getAllPills().filter("._collapsedPill").outerWidth(true);
                        this.removePill({'value': 'collapsed'}); // remove the collapsed pill
                        arePillsCollapsed = false;
                    }
                    sumWidthOfPills = sumWidthOfPills - $(allPills[i]).outerWidth(true);
                    numberOfCollapsedPills++;
                    $(allPills[i]).addClass('hiddenPill');
                } else {
                    if (arePillsCollapsed === true) {
                        break;
                    }
                    if (numberOfCollapsedPills > 0) {
                        this.addPill({'label': '+' + numberOfCollapsedPills, 'value': 'collapsed', 'collapsed': true});
                        sumWidthOfPills += this.getAllPills().filter("._collapsedPill").outerWidth(true); // add width of collapsed pill into sumWidthOfPills
                        arePillsCollapsed = true;
                        i++; // in the case that collapsed pill causes pills to go over limit, keep i at current position
                    }
                }
            }
        },
        expandPills: function () {
            this.removePill({'value': 'collapsed'}, true); // remove the collapsed pill
            this.getPills().each(function (key, tagPill) {
                $(tagPill).removeClass('hiddenPill'); // expand each pill
            });
        },
        addPill: function (tag) {
            if (tag && !_.isArray(tag)) {
                tag = [tag];
            }
            return this.addPills(tag);
        },
        removePill: function (tag, forceSilent) {
            tag = this.cleanTag(tag);
            this.getAllPills().each(function () {
                var $pill = $(this),
                    pillTag = $pill.data('tag');
                if (pillTag.value == tag.value) {
                    $pill.remove();
                }
            });
            if (!forceSilent) {
                this.triggerChange();
            }

            if (this.getPills().length === 0) {
                $('._tagsplaceholder').show();
            }
        },
        removeAllPills: function (silent) {
            this.getAllPills().each(function () {
                var $pill = $(this);
                $pill.data('tag');
                $pill.remove();

            });

            if (!silent) {
                this.triggerChange();
                if ($(this).getPills().length === 0) {
                    $('._tagsplaceholder').show();
                }
            }
        },
        // remove last pill and return the tag
        removeLastPill: function () {
            var $pill = this.$el.find('ul').find('._item').get(-1);
            var pillTag = $($pill).data('tag');
            $($pill).remove();

            if (this.getPills().length === 0) {
                $('._tagsplaceholder').show();
            }
            return pillTag;
        },
        getPills: function () {
            return this.$el.find('ul').find('._item').not("._collapsedPill");
        },
        getAllPills: function () {
            return this.$el.find('ul').find('._item');
        },
        getTags: function () {
            var self = this;
            return this.getPills().map(function () {
                var tag = $(this).data('tag');
                return self.cleanTagOut(tag);
            }).get();
        },
        /**
         * Calls the callback that will save the tag to the database
         */
        createTag: function () {
            var self = this,
                tagValue = self.getNewTagName();

            var $tagCreateBtn = self.getCreateTagBtn();
            if (this.o.tags.constructor === Array && ($tagCreateBtn.is(":hidden") || tagValue === "")) {
                return;
            } else if (this.o.tags === "" && tagValue === "") {
                return;
            }
            self.o.create && _.isFunction(self.o.create) && self.o.create.call(this, tagValue, function (tag) {
                self.createTagCallback(tag);
            });
        },
        createTagCallback: function (tag) {
            this.addPills(tag);

            // check if tag.value already in list
            if (!this.$list.hsDropdownList('getElementByValue', tag[this.o.tagAdapter.value], 'value')) {
                if (this.o.dropDownList) {
                    this.getList().hsDropdownList('addRow', tag);
                }
            }

            if (this.o.dropDownList) {
                this.getList().hsDropdownList('close');
            }
        },
        /**
         * Calls the callback that will delete the tag from the database
         * tag should be formatted like expected by the frontend : { 'name': '', id: 3}
         */
        deleteTag: function (tag) {
            var self = this;
            self.o.remove && _.isFunction(self.o.remove) && self.o.remove.call(this, self.cleanTagOut(tag), function (tag) {
                self.deleteTagCallback(tag);
            });
        },
        deleteTagCallback: function (tag) {
            this.removePill(tag);
            tag = this.cleanTag(tag);
            // remove row from dropdown / update the dropdown
            this.getList().hsDropdownList('removeRow', tag.value, this.o.tagAdapter.value);
        },
        triggerChange: function () {
            this.o.change && _.isFunction(this.o.change) && this.o.change.call(this, this.getTags());
            this.$el.trigger('tagselectorchange');
        },
        destroy: function () {
            this.getList().hsDropdownList('destroy');
            this.$el.off().empty().removeData('hsTagSelector');
            for (var prop in this) {
                if (Object.prototype.hasOwnProperty.call(this, prop)) {
                    delete this[prop];
                }
            }
        },
        onchange: function (fn) {
            this.$el.on('tagselectorchange', fn);
        },
        serializeArray: function () {
            if (this.o.$cb && !this.o.$cb.is(':checked')) {
                return {};
            }
            var name = this.o.name;
            if (typeof name === 'undefined') {
                throw new Error('In order to be serialized, this tagSelector needs a name');
            }
            var els = this.getTags();
            return _.map(els, function (el) {
                var value = (el.value) ? el.value : el.label;
                return {
                    name: name,
                    value: value
                };
            });
        },
        serialize: function () {
            if (this.o.$cb && !this.o.$cb.is(':checked')) {
                return;
            }
            var values = _.map(this.serializeArray(), function (el) {
                return encodeURI(el.name + '=' + el.value).replace('%20', '+');
            });
            return values.join('&');
        }
    });

export default $.fn.hsTagSelector;
