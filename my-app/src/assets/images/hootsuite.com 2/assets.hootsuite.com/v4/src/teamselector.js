import $ from 'jquery';
import _ from 'underscore';
import MultiSelector from 'multiselector';
import 'utils/util';

var TeamSelector = function () {
    MultiSelector.apply(this, arguments); // initialized, but not rendered
};

hs.util.inherit(TeamSelector, MultiSelector);

// internal helpers
var fnLoadOrganizations = function (callback) {
    ajaxCall({
        url: '/ajax/organization/get-member-organizations',
        success: callback
    }, 'qm');
};


$.extend(TeamSelector.prototype,
    {
        WIDGET_CLASS: 'teamSelectorWidget',
        WIDGET_EJS: 'dashboard/teamselector',

        SEL_ITEM_EJS: '<span class="item _selectItem _remove" itemid="<%= id %>" type="<%= type %>"><img class="avatar _jsTooltip" src="<%= hs.util.rootifyAvatar(\'team\', avatar) %>" title="<%= translation._("Remove") %> <%= hsEjs.cleanPage(name) %>" /><% if (isShowNames) { %><strong><%= hsEjs.cleanPage(name) %></strong><% } %><% if (type) { %><span class="icon-sn-13 <%= type.toLowerCase() %>"></span><% } %></span>',
        MORE_ITEMS_EJS: '<span class="item more-item _moreItem"><%= translation._("%d more...").replace("%d", num) %></span>',

        initOrganizationDropdown: function (defaultSelected) {
            // init dropdown
            var self = this,
                options = this.$widget.data('options') || {}
            if (options.showOrganizations) {
                var $section = this.$widget.find('._organizationSection'),
                    fnOnOrgSelect = function (orgId) {
                        if (self.$widget.data('currentorg') == orgId) {
                            return;
                        }
                        ajaxCall({
                            url: '/ajax/organization/get-teams',
                            data: 'organizationId=' + orgId,
                            success: function (data) {
                                var teams = data.teams;
                                options.listItems = TeamSelector.formatTeamList(teams);	// reset the listItems
                                self.$widget.data('currentorg', orgId);
                                self.fnReset();				// re-render
                                self.initOrganizationDropdown(defaultSelected);
                            }
                        }, 'qm');
                    };

                fnLoadOrganizations(function (data) {
                    var selectedId = (options && options.organizationId) ? options.organizationId : null,		// get this from controller if we are handling an error
                        orgData = _.map(data.organizations, function (org) {
                            var obj = {
                                title: org.name,
                                id: org.organizationId
                            };
                            if (obj.id == selectedId) {
                                obj.selected = true;
                            }
                            return obj;
                        });

                    if (!self.$widget.data('currentorg') && orgData.length) {
                        // select the first organization in dropdown if there isn't one default specified or if there isn't one selected
                        // note this causes a re-load of organizations
                        var id = selectedId || orgData[0].id;
                        if (!selectedId) {
                            orgData[0].selected = true;
                        }
                        fnOnOrgSelect(id);
                        return;
                    } else if (self.$widget.data('currentorg')) {
                        // set the display of the dropdown to be the currently selected organization
                        _.each(orgData, function (org) {
                            if (org.id == self.$widget.data('currentorg')) {
                                org.selected = true;
                                return false;
                            }
                        });
                        // handle default selected
                        if ($.isArray(defaultSelected)) {
                            setTimeout(function () {
                                var hasChanges = false;
                                _.each(defaultSelected, function (id) {
                                    if (!self.$widget.find('._itemListBody ._row[itemid="' + id + '"]').is('.selected')) {
                                        self.fnSelectItem(id);		// set the item to the top
                                        hasChanges = true;
                                    }
                                });
                                hasChanges && self.fnPostStateChange();
                            }, 1);
                        }
                    }

                    $section.find('._organizationsDropdownBtn').hsDropdown({
                        data: {items: orgData},
                        change: function (element) {
                            var orgId = element.id || null;
                            $section.find('._organizationsDropdownBtn').data('organizationId', orgId);
                            // load teams
                            orgId && fnOnOrgSelect(orgId);
                        }
                    })
                        // when the org dropdown is open we want to make sure the picker-list does not collapse
                        .hsDropdown('list')
                        .on('dropdownlistopen', function () {
                            self.$widget.data('nocollapse', true);
                        })
                        .on('dropdownlistclose', function () {
                            self.$widget.data('nocollapse', false);
                        });
                });
            } else {
                this.$widget.find('._organizationSection').hide();
            }
        },

        init: function (opt, defaultSelected) {
            MultiSelector.prototype.init.call(this, opt, defaultSelected);
            if (!this.$widget.find('._organizationsDropdownBtn').data('hsdropdown')) {
                this.initOrganizationDropdown(defaultSelected);
            }
        }
    });

TeamSelector.renderAll = function () {
    $('._' + TeamSelector.prototype.WIDGET_CLASS).not('._skip').each(function () {
        var ts = new TeamSelector(this);
        ts.render();
    });
};

TeamSelector.formatTeamList = function (teams) {
    var o = {};
    _.each(teams, function (t) {
        o[t.teamId] = {
            id: t.teamId,
            name: t.name,
            avatar: t.logo
        };
    });
    return o;
};


hs.teamSelector = TeamSelector;
export default TeamSelector;
