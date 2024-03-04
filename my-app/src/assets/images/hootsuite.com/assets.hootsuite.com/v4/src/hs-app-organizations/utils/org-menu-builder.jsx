import teammanagement from 'team/management/teammanagement';
import permissions from 'hs-nest/lib/constants/organization-permissions';
import translation from 'hs-nest/lib/utils/translation';
import trackerDataLab from 'utils/tracker-datalab';
import trackingConstants from '../constants/tracking-constants';
import hootbus from 'utils/hootbus';

import {
  MEMBER,
  ORGANIZATIONS
} from 'hs-nest/lib/actions';

export default function (organization, flux, options = {}) {
    var menu = [];
    var memberId = flux.getStore(MEMBER).get().memberId;
    var trackingOrigin = trackingConstants.organizationListPath;
    var ownsAnOrganization = flux.getStore(ORGANIZATIONS).ownsAnOrganization(memberId);
    var showCreateNewOrganization = options.showCreateNewOrganization || false;

    var isOwned = memberId == organization.paymentMemberId;

    if (organization.permissions[permissions.ORG_MANAGE_MEMBER]) {
        menu.push({
            label: translation._("View Pending Invites"),
            onSelect: function () {
                trackerDataLab.trackCustom(trackingOrigin, 'view_pending_invites');
                teammanagement.createPendingInvitationRequestPopup({id: organization.organizationId});
            }
        });
    }

    if (organization.isUpgradeable) {
        menu.push({
            label: translation._("Upgrade Organization"),
            onSelect: function () {
                trackerDataLab.trackCustom(trackingOrigin, 'upgrade_organization');
                teammanagement.upgradeOrganization(organization.organizationId, isOwned);
            }
        });
    }

    var canManage = flux.getStore(ORGANIZATIONS).canUserManage(organization.organizationId);
    if (canManage) {
        menu.push({
            label: translation._("Settings"),
            onSelect: function () {
                trackerDataLab.trackCustom(trackingOrigin, 'view_settings');
                teammanagement.createOrganizationPopup({id: organization.organizationId});
            }
        });
    }

    if (!ownsAnOrganization && showCreateNewOrganization) {
        menu.push({
            label: translation._("Create new Organization"),
            onSelect: function () {
                trackerDataLab.trackCustom(trackingOrigin, 'view_create_organization');
                teammanagement.createOrganizationPopup();
            }
        });
    }

    var leaveAction, leaveLabel;
    if (isOwned) {
        leaveLabel = translation._("Delete Organization");
        leaveAction = function () {
            trackerDataLab.trackCustom(trackingOrigin, 'delete_organization');
            teammanagement.removeOrganization(organization.organizationId, function (data) {
                if (data.success) {
                    flux.getActions(ORGANIZATIONS).remove(organization.organizationId);
                    hootbus.emit('socialNetwork:refresh:command');
                }
            });
        };
    } else {
        leaveLabel = translation._("Leave Organization");
        leaveAction = function () {
            trackerDataLab.trackCustom(trackingOrigin, 'leave_organization');
            teammanagement.removeUserFromOrganization(organization.organizationId, memberId, function (data) {
                if (data.success) {
                    flux.getActions(ORGANIZATIONS).remove(organization.organizationId);
                    hootbus.emit('socialNetwork:refresh:command');
                }
            });
        };
    }
    menu.push({
        group: true,
        items: [
            {
                label : leaveLabel,
                onSelect: leaveAction
            }
        ]
    });
    return menu;
}
