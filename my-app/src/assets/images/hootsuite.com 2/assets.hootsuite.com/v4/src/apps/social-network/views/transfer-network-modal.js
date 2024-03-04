import _ from 'underscore';
import hootbus from 'utils/hootbus';
import util from 'utils/util';
import translation from 'utils/translation';
import DialogBase from 'utils/dialogs/base';
import OrgPickerMixin from 'apps/social-network/views/org-picker-mixin';
import trackerDataLab from 'utils/tracker-datalab';
import 'utils/button_manager';
/**
 * This pop-up is rendered in two cases:
 * - through the add social network workflow, if account is already owned by another user
 * - through the account admin section in user settings (in which case you get the org dropdown)
 *
 * @class TransferNetworkModal
 */
var TransferNetworkModal = DialogBase.extend(/** @lends TransferNetworkModal.prototype */{
    text: {
        popupTitle: translation._("Transfer social account")
    },
    template: 'socialnetwork/transfer',
    params: {
        modal: true,
        resizable: false,
        draggable: true,
        width: 480,
        closeOnEscape: true,
        position: ['center', 80],
        zIndex: 2004
    },
    popupId: 'transferSocialNetworkPopup',

    events: {
        'click ._submit': 'onSubmitClick',
        'click ._cancel': 'onCancelClick'
    },

    trackingOrigin: 'web.dashboard.transfer_network_modal',

    initialize: function (options) {
        DialogBase.prototype.initialize.apply(this, arguments);

        // Passed in as options, must be defined or the templates explodes
        _.each(['createTab', 'saveCheckbox', 'isUsedForMemberAuth'], function (prop) {
            this.data[prop] = !!options[prop];
        }, this);

        var addOrg = this.data.addForOrganization;
        this.selectedOrganizationId = addOrg && addOrg.organizationId || '';
    },

    getTmplData: function () {
        return this.data;
    },

    /**
     * manageableOrganizations are only passed in the Transfer network work-flow from the account admin section
     */
    onRender: function () {
        var manageableOrganizations = this.data.manageableOrganizations;
        if (manageableOrganizations) {
            // see OrgPickerMixin
            this.renderOrganisationPicker(manageableOrganizations);
        }

        trackerDataLab.trackCustom(this.trackingOrigin, 'modal_opened');
        hootbus.emit('modal:open');
    },

    onSubmitClick: function () {
        var $submit = this.$('._submit');
        if ($submit.hasClass('_disabled')) {
            return;
        }
        $submit.addClass('_disabled');

        hs.throbberMgrObj.add($submit);

        var requestParams = util.serializeObject(this.$('form'));

        _.extend(requestParams, {
            toOrganizationId: this.selectedOrganizationId,
            socialNetworkId: this.data.socialNetwork.socialNetworkId,
            saveCheckbox: this.options.saveCheckbox,
            resetTwitterPhotoUpload: this.data.resetTwitterPhotoUpload
        });

        var callbacks = _.pick(this.options, 'onSuccess', 'onComplete');

        var trackingData = _.pick(requestParams, 'deleteMessages', 'createTab');
        trackerDataLab.trackCustom(this.trackingOrigin, 'yes_clicked', trackingData);

        hootbus.emit('socialNetwork:transfer:command', requestParams, callbacks);
    },

    onCancelClick: function () {
        trackerDataLab.trackCustom(this.trackingOrigin, 'cancel_clicked');
        this.close();
        hootbus.emit('modal:close');
    }
});

_.extend(TransferNetworkModal.prototype, OrgPickerMixin);

export default TransferNetworkModal;

