import React from 'react';
import ReactDOM from 'react-dom';
import DeleteOrganizationModal from 'hs-app-organization/lib/components/modal/delete-organization/delete-organization';
import translation from 'utils/translation';
import AppBase from 'core/app-base';
import hootbus from 'utils/hootbus';
import _ from 'underscore';
import trackerDatalab from 'utils/tracker-datalab';

export default AppBase.extend({
  messageEvents: {
    'modals:delete_organization:destroy': 'closeModal'
  },

  origin: 'web.dashboard.delete_organization',

  _deleteOrganization: function () {
    ajaxCall({
      url: '/ajax/organization/remove-organization',
      beforeSend: function () {
        hs.statusObj.update(translation.c.LOADING, 'info');
      },
      data: "organizationId=" + this.organizationId,
      success: function (data) {
        if (data.success) {
          hs.statusObj.update(translation._('Success'), 'success', true, 4000);
          trackerDatalab.trackCustom(this.origin, 'organization_deleted', {'organizationId': this.organizationId});
          _.isFunction(this.callback) && this.callback(data);
        } else if (data.errorMsg) {
          hs.statusObj.update(data.errorMsg, 'error', true, 8000); //make timeout a bit longer, message could be long
        }
      }.bind(this)
    }, 'q1');

    this.closeModal();
  },

  _renderModal: function (orgName) {
    ReactDOM.render(
      <DeleteOrganizationModal
        onDeleteOrganization={this._deleteOrganization.bind(this)}
        onRequestHide={this.closeModal.bind(this)}
        organizationName={orgName}
      />
      , this.container);
  },

  onInitialize: function (options) {
    options = options || {};
    _.extend(this, _.pick(options, 'organizationId', 'callback'));
  },

  render: function () {
    this.container = document.createElement('div');
    document.body.appendChild(this.container);

    trackerDatalab.trackCustom(this.origin, 'modal_opened');

    hs.statusObj.update(translation.c.LOADING, 'info');

    ajaxCall({
      url: '/ajax/organization/get-all-data',
      type: 'GET',
      data: 'organizationId=' + this.organizationId,
      success: function(data) {
        hs.statusObj.reset();
        this._renderModal(data.organization.name);
      }.bind(this)
    }, 'q1');
  },

  closeModal: function () {
    _.defer(_.bind(function () {
      ReactDOM.unmountComponentAtNode(this.container);
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
    }, this));

    this.destroy();

    trackerDatalab.trackCustom(this.origin, 'modal_closed');
    hootbus.emit('notify:overlay:closed', 'modal', 'deleteOrganization');
  },
});
