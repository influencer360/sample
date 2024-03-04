import $ from 'jquery';
import _ from 'underscore';
import translation from 'utils/translation';
import 'utils/dropdown/jquery.hsdropdown';
import 'utils/util_static';

$.fn.hsDropdownMembers = function () {
    if (this.length === 1) {
        var $this = $(this),
            firstArg = arguments[0] || {};
        var fnSetListOptions = function (listOptions) {
            $this.data('ddlistoptions', listOptions);
        };
        if (typeof firstArg === 'object') {
            fnSetListOptions(firstArg);
        } else if (firstArg === 'populate') {

            if (!arguments[1]) {
                throw Error('second argument missing');
            }
            if (typeof arguments[2] === 'object') {
                fnSetListOptions(arguments[2]);
            }

            var width = 312;
            if (arguments[3]) {
                width = arguments[3];
            }

            var items = _.values(arguments[1]),
                members = _.sortBy(items, function (m) {
                    return m.fullName.toLowerCase();
                }),
                options = $this.data('ddlistoptions') || {};
            _.each(members, function (member) {

                member.avatar = hs.util.rootifyMemberAvatar(member.avatar, member.email);

            });
            if (options.withAll) {
                members = [
                    {
                        fullName: (typeof options.withAll === "string") ? options.withAll : translation._("All Team Members"),
                        memberId: 0
                    },
                    {divider: true}
                ].concat(members);
            }
            _.extend(options, {
                data: {
                    items: members,
                    withSearch: true
                },
                adapter: {
                    title: 'fullName',
                    img: 'avatar',
                    text: 'companyTitle',
                    id: 'memberId'
                },
                width: width

            });

            $this.hsDropdown(options);
        }
    }
    return this;
};

/*
 var $btn = $($0);
 ajaxCall({
 url: '/ajax/team/list-for-add-member',
 data: 'organizationId='+1+'&memberIdToAdd='+2,
 success: function(data) {
 if (data.success && data.teams) {
 $btn.hsDropdownTeams('populate', data.teams, {
 select: function(){},
 withAll: true
 });
 }
 }
 }, 'q1');
 */
$.fn.hsDropdownTeams = function () {
    if (this.length === 1) {
        var $this = $(this),
            firstArg = arguments[0] || {};
        var fnSetListOptions = function (listOptions) {
            $this.data('ddlistoptions', listOptions);
        };
        if (typeof firstArg === 'object') {
            fnSetListOptions(firstArg);
        } else if (firstArg === 'populate') {

            if (!arguments[1]) {
                throw Error('second argument missing');
            }
            if (typeof arguments[2] === 'object') {
                fnSetListOptions(arguments[2]);
            }

            var width = 312;
            if (arguments[3]) {
                width = arguments[3];
            }

            var options = $this.data('ddlistoptions') || {};

            var items = (('sort' in options) && options.sort === false) ? _.values(arguments[1]) : _.sortBy(_.values(arguments[1]), function (m) {
                return m.name.toLowerCase();
            });

            _.each(items, function (item) {
                if (!item.img) {
                    if (typeof item.logo !== 'string' || item.logo === '') {
                        item.img = hs.c.rootUrl + '/images/icons/icon-avatar-team.png';
                    } else if (item.logo.indexOf('http') !== 0) {
                        item.img = hs.util.rootifyAvatar('team', item.logo);
                    } else {
                        item.img = item.logo;
                    }
                }
            });
            if (options.withAll) {
                items = [
                    {
                        name: (typeof options.withAll === "string") ? options.withAll : translation._("All Teams"),
                        teamId: 0
                    },
                    {divider: true}
                ].concat(items);
            }
            _.extend(options, {
                data: {
                    items: items,
                    withSearch: true
                },
                adapter: {
                    title: 'name',
                    img: 'img',
                    text: 'organizationName',
                    id: 'teamId'
                },
                width: width
            });
            $this.hsDropdown(options);

        }
    }
    return this;
};
