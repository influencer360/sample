import _ from 'underscore';
import translation from 'utils/translation';
import hootbus from 'utils/hootbus';
import hsEvents from 'hs-events';

export default {
    renderOrganisationPicker: function (organizations, selectedId) {
        var itemsArr = [];
        if (hs.canSeeNewAddSnDropdownEnterprise) {
            // Show a list of orgs, then "Private Social Networks"
            itemsArr = _.map(organizations, function (org) {
                return {
                    title: org.name,
                    id: org.organizationId,
                    selected: (org.organizationId == selectedId)
                };
            }).concat([
                {divider: ' '},
                {title: translation._("Private social accounts")}
            ]);
        } else {
            // Show "Private Social Networks" then a list of orgs
            var titleText = translation._("Private social accounts");
            itemsArr = [
                {title: titleText},
                {divider: translation._("Organizations")}
            ].concat(_.map(organizations, function (org) {
                return {
                    title: org.name,
                    id: org.organizationId,
                    selected: (org.organizationId == selectedId)
                };
            }));

            if (!selectedId) {
                itemsArr[0].selected = true;
            }
        }

        this.$('._organizationsDropdownBtn').hsDropdown({
            data: {items: itemsArr},
            change: _.bind(this.onOrgDropdownChange, this),
            select: _.bind(this.onOrgDropdownSelect, this)
        });
        this.$('._organizationPicker').show();
    },

    onOrgDropdownChange: function (element) {
        this.selectedOrganizationId = element && element.id || null;
    },

    onOrgDropdownSelect: function () {
        hootbus.emit(hsEvents.SELECT_ADD_TO_SOCIAL_NETWORKS);
    }
};

