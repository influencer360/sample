import baseFlux from 'hs-nest/lib/stores/flux';
import { SOCIAL_NETWORKS } from 'hs-nest/lib/actions';
import $ from 'jquery';
import _ from 'underscore';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import 'utils/dialogfactory';
import 'utils/ajax';
import 'utils/util';
import 'rjs/hs_require';
import messageSubscriptionMixin from 'utils/mixins/message-subscription';
import { renderByElementId }from 'components/modals/session-expired-modal';
import Modal from 'components/modals/reload-tab-modal';

/*
 * A module of handlers and helpers methods extracted from utils/ajax and modules/dashboard
 */
var handlers = {
    messageEvents: {
        'ajax:invalidManager': 'managerWarning',
        'ajax:response:success': 'handleResponseSuccess',
        'ajax:response:error': 'handleResponseError'
    },

    init: function () {
        this.delegateMessageEvents();
    },

    managerWarning: function () {
        hs.statusObj.update("Warning: Invalid ajax manager", 'warning', true);
    },

    handleResponseSuccess: function (data) {
        if (!data) {
            hs.statusObj.reset();
            return;
        }
        if (data.controllerPermissionRequest == 1) {
            // TODO: Make generic data.popupRoute so all routing can be done through one channel
            hs.statusObj.reset();
            handlers.showPermissionRequestPopup(data);
        } else if (data.socialNetworkReauthRequired == 1) {
            hs.statusObj.reset();
            if (data.socialNetworkId) {
                var profile = baseFlux.getStore(SOCIAL_NETWORKS).get(data.socialNetworkId);
                if (profile) {
                    profile.isReauthRequired = 1;
                    baseFlux.getActions(SOCIAL_NETWORKS).set(profile);
                }
            }

            // set statusMsg empty so that we don't display it.
            data.statusMsg = '';

            handlers.showSocialNetworkExpirationModal(data);
        }
    },

    handleResponseError: function (data, status, xhr, options) {
        options = options || {};
        data = data || {};

        // Set here because we don't assume hs.statusObj is defined in utils/ajax
        hs.statusObj.reset();

        // TODO: Need to investigate why 'data.exception' is populated on Stg, Prod
        if (data.exception) {
            handlers.displayExceptionPopup(data.exception);
        }

        if (xhr.status === 401) {
            handlers.loadLoginPopup();
            hootbus.emit(hs.c.eventSessionTimeout);
        } else if (xhr.status === 403) {
            if (data.feature) {
                if (!('featureAddSuccess' in options)) {
                    options.featureAddSuccess = $.noop;
                }

                // TODO: Eliminate this special callback and use error handler instead
                if ('featureAccessDenied' in options) {
                    options.featureAccessDenied(data, status);
                }

                dashboard.showFeatureAccessDeniedPopup(data, options.featureAddSuccess);
            }
            if (data.error && data.error.message) {
                hs.statusObj.update(data.error.message, 'error', true);
            }
        } else if (data.exceptionCode === 'CSRF_VALIDATION_FAILED') {
            handlers.loadReloadPopup();
        } else if (!(options && _.isFunction(options.error))) {
            // Only handle the general error case if no error handler already invoked
            hs.statusObj.update(translation._("There was an error while processing your request. Please try again later."), 'error', true);
        }
    },

    /**
     * Display exception popup
     *
     * @param {String} text Error message to display
     */
    displayExceptionPopup: function (text) {
        if (hs && hs.debug) {
            var params = {
                height: 'auto',
                width: 1065,
                position: ['center', 5],
                title: translation._("Exception"),
                modal: false,
                draggable: true,
                resizable: false,
                closeOnEscape: true,
                content: '<div class="ui-dialog-section ajax-exception-popup">' + text + '</div>'
            };
            $.dialogFactory.create('exceptionPopup', params);
        }
    },

    /**
     * Popup a login box
     *
     * @requires jQuery.dialogFactory
     * @requires ajaxCall
     */
    loadLoginPopup: function () {
        if (!$('#_session_expired_modal').length) {
            ajaxCall({
                type: 'GET',
                url: '/ajax/member/login-popup?json=1',
                success: function (res) {
                    const id = '_session_expired_modal';
                    $('<div>').attr('id', id).appendTo($('body'));
                    renderByElementId(id, res);
                }
            }, 'abortOld');
        }
    },

    /**
     * Popup a reload box
     *
     * @requires jQuery.dialogFactory
     * @requires ajaxCall
     */
    loadReloadPopup: function () {
        // only load this if session expired or reload tab modal is not open
        if (!$('#_reload_tab_modal').length && !$('#_session_expired_modal').length) {
            $('<div>').attr('id', '_reload_tab_modal').appendTo($('body'));
            Modal.render('_reload_tab_modal');
        }
    },

    showPermissionRequestPopup: function (data) {
        if (!data) {
            return;
        }

        var fnRenderPopup = function (popupData) {
            var params = {
                    title: popupData.popupTitle,
                    width: 500,
                    resizable: false,
                    modal: true,
                    closeOnEscape: true,
                    position: ['center', 30],
                    content: popupData.output,
                    close: function () {
                        $(document).trigger('permissionRequestPopupClose');
                    }
                },
                $popup = $.dialogFactory.create('permissionRequestPopup', params),
                trackingParams = {
                    category: 'permissionRequest',
                    label: popupData.objectTypeCode.toLowerCase()
                };

            $popup
                .find('._sendRequest').click(function () {
                    var $form = $("#permissionRequestForm");
                    hs.statusObj.update(translation._("Sending Request..."), 'info');
                    ajaxCall({
                        url: "/ajax/member/send-permission-request",
                        data: $form.serialize(),
                        success: function (data) {
                            if (data.success) {
                                hs.statusObj.update(translation._("Permission Request has been sent"), 'success', true, 4000);
                            }
                        }
                    }, 'qm');
                    $("#permissionRequestPopup").dialog('close');
                    hs.trackEvent($.extend({action: 'request_permission'}, trackingParams));
                }).end()
                .find('._cancel').click(function () {
                    $("#permissionRequestPopup").dialog('close');
                    hs.trackEvent($.extend({action: 'close'}, trackingParams));
                }).end();

            $(document).trigger('permissionRequestPopupOpen');

            $popup.find('#permissionRequestForm').bind('keypress', function (e) {
                return window.disableEnterKey(e);
            });

        };

        if (data.output) {
            fnRenderPopup(data);
        } else {
            ajaxCall({
                type: 'GET',
                url: "/ajax/member/permission-request-popup?objectTypeCode=" + data.objectTypeCode + "&objectId=" + data.objectId + "&objectPermissionCodes=" + data.objectPermissionCodes.join(),
                success: function (ajaxData) {
                    fnRenderPopup(ajaxData);
                }
            }, 'qm');
        }
    },
    showSocialNetworkExpirationModal: function (data) {
        if (data && data.invalidSocialNetworkRecords && data.invalidSocialNetworkRecords.length > 0) {
            hootbus.emit('overlay:init', 'modal', 'socialNetworkExpirationModal', {data: data});
        }
    }
};

import Cocktail from 'backbone.cocktail';
Cocktail.mixin(handlers, messageSubscriptionMixin());

export default handlers;
