import $ from 'jquery';
import _ from 'underscore';
import objectAssign from 'object-assign';
import languageSwitcher from 'settings/language_switcher';
import snActions from 'apps/social-network/actions';
import localCache from 'utils/local-cache';
import memberUtil from 'utils/member';
import darklaunch from 'hs-nest/lib/utils/darklaunch';
import baseFlux from 'hs-nest/lib/stores/flux';
import { MEMBER } from 'hs-nest/lib/actions';
import 'utils/tracker-datalab';
import { getApp } from 'fe-lib-async-app';
import hootbus from 'utils/hootbus';
import translation from 'utils/translation';
import { Winback } from 'fe-billing-constants';
import { startWinbackFlow, getAcceptedCouponCode } from 'fe-lib-winback';
import { isCurrentTimeWithinIntervals } from 'fe-billing-lib-utils';
import AutoScheduleSettings from './models/autoscheduleSettings';
import AutoScheduleView from './views/autoschedule';
import { applyCoupon } from './utils/coupon-util'

import '3rd/jquery.daterangepicker';
import 'utils/file-upload';

const settings = {};

settings.init = function () {
    if (settings.isFirstInit === false) {
        return;
    }
    settings.isFirstInit = false;
};

/**
 * Uses fe-lib-winback library to launch the ProsperStack overlay
 * and implicitly track results.
 */
const launchProsperstackFlow = async (data) => {
    const { trackerDatalab, memberId } = window.hs;
    const { memberData: winbackProps, cancelAccountFormToken } = data;

    trackerDatalab.trackCustom('web.dashboard.billing', 'billing_user_clicked_launch_winback');

    winbackProps.eventOrigin = 'web.dashboard.billing';
    const winbackResults = await startWinbackFlow(winbackProps);

    const { status } = winbackResults;
    if (status === 'canceled')  {
        const params = {
            reason: "prosperstack",
            cancelAccountFormToken
        };
        doCancelAccount($.param(params));
    } else if (status === 'saved') {
        const couponCode = getAcceptedCouponCode(winbackResults)
        couponCode && applyCoupon(memberId, couponCode);
    }
}

function saveAccountSettings() {
    hs.throbberMgrObj.add("#settingsContent ._submit");
    if ($('#isChangePassword').val() == '0') {
        $('#newPassword').val('');
    }
    var postData = $("#accountSettingForm").serialize();
    ajaxCall({
        url: "/ajax/settings/save-account",
        data: postData,
        success: function (data) {
            $('._newEmailCaptcha').addClass('u-displayNone');
            $("#footer ._username").html($("#accountSettingForm input[name='member[fullName]']").val());
            hs.prefs.isNotifyNewTweet = $("#accountSettingForm input[name='isNotifyNewTweet']:checked").length > 0 ? 1 : 0;
            hs.memberAutoInitial = $("#accountSettingForm input._autoInitialCheck:checked").length > 0 ? ' ^' + $("#accountSettingForm input[name='member[initials]']").val() : '';
            hs.statusObj.update(translation._("Account settings have been saved"), "success", true);

            // update global timezone
            window.handleTimezoneChange(data.timezoneOffset);

            if (data.modifiedData) {
                //update flux store
                baseFlux.getActions(MEMBER).set(data.modifiedData);
                //update global value
                memberUtil.updateMemberData(data.modifiedData);
                $("#settingsPopup").dialog('close');

                if (data.modifiedData.defaultTimezone) {
                    hootbus.emit('dashboard:timezone:updated');
                }
            }
            window.updateDashboardHeight();
        },
        error: function (response) {
            var data = JSON.parse(response.responseText);
            if (data.errorMessage) {
                hs.statusObj.update(data.errorMessage, 'error', true);
            } else {
                hs.statusObj.update(translation._("Sorry, we are unable to complete this operation right now. Please try again later."), 'error', true);
            }
            if (data.isCaptchaRequired) {
                $('._newEmailCaptcha').removeClass('u-displayNone');
                hs.recaptcha.init();
            }
        },
        complete: function () {
            hs.throbberMgrObj.remove("#settingsContent ._submit");
        }
    }, 'q1');
}

function toggleChangeEmail() {
    $('._emailNewEmail').toggle();
    $('._emailPassword').toggle();
    $('._emailRecaptcha').toggle();
}

function savePreferenceSettings() {
    hs.throbberMgrObj.add("#saveAccountButtons ._submitGeneral");

    var postData = $("#preferenceSettingForm").serialize();

    ajaxCall({
        url: "/ajax/settings/save-preferences",
        data: postData,
        success: function (data) {
            $("#settingsSection._content").html(data.output);
            settings.initPreferences();
            hs.statusObj.update(translation._("Account preferences have been saved"), "success", true);
            window.updateDashboardHeight();

            hs.prefs.isNotifyNewTweet = data.isNotifyNewTweet;
            hs.prefs.isNewRetweet = data.isNewRetweet;

            var member = baseFlux.getStore(MEMBER).get();
            baseFlux.getActions(MEMBER).set({
                prefs: objectAssign({}, member.prefs, {isNewRetweet: data.isNewRetweet})
            });

            hs.sa = parseInt(data.sa, 10);
            if (hs.sa !== 1) {
                // no ads, remove all ad nodes
                $("#streamsScroll ._messages ._message._promoted").remove();
            }

            if (data.showProWall) {
                dashboard.showFeatureAccessDeniedPopup({reason: data.proWallReason});
            }

            snActions.refreshNetworks();
        },
        complete: function () {
            hs.throbberMgrObj.remove("#saveAccountButtons ._submitGeneral");
        }
    }, 'q1');
}

function showCancelAccountPopup() {
    if (darklaunch.isFeatureEnabled('BILLING-2755-maintenance-for-users') ||
        isCurrentTimeWithinIntervals(darklaunch.getFeatureValue('BILLING_3975_MAINTENANCE_INTERVALS'))
    ) {
        window.location.href = "/billing";
        return;
    }

    ajaxCall({
        type: 'GET',
        url: "/ajax/settings/show-cancel-account",
        success: function (data) {
            if (darklaunch.isFeatureEnabled('BILLING_5526_ENABLE_WINBACK_RESULTS_TRACKING')
                && !data.errorCode && data.memberData) {
                launchProsperstackFlow(data);
                return;
            }

            if (darklaunch.isFeatureEnabled('BILLING_4812_ENABLE_PROSPERSTACK')
                && !data.errorCode && data.memberData) {
                hs.trackerDatalab.trackCustom('web.dashboard.billing', 'billing_user_clicked_launch_winback');
                window.ProsperStack.flow(data.memberData).then(async (result) => {
                    if (result.status === Winback.status.CANCELED) {
                        let params = {
                            reason: "prosperstack",
                            cancelAccountFormToken: data.cancelAccountFormToken
                        };
                        doCancelAccount($.param(params));
                    } else if (result.status === Winback.status.SAVED) { // The customer accepted an offer and didn't cancel. Churn prevented!
                        const offerDetails = result.flowSession?.offer_accepted?.details;
                        if (offerDetails && offerDetails.type === 'coupon') {
                            const couponCode = offerDetails.payment_provider_coupon_id;
                            applyCoupon(window.hs.memberId, couponCode);
                        }
                    }
                });
                return;
            }

            var params = {
                    modal: true,
                    closeOnEscape: true,
                    resizable: false,
                    draggable: true,
                    title: translation._("Account Removal"),
                    width: 500,
                    position: ['center', 150],
                    content: translation.c.LOADING
                },
                $popup = $.dialogFactory.create('cancelAccountPopup', params);
            $popup.empty().html(data.output)
                .find('._viewAssignments').click(function () {
                window.address.go('#/assignments');
                $popup.dialog('close');
                return false;
            }).end()
                .find('form').keypress(function (e) {
                return window.disableEnterKey(e);
            }).end()
                .find('._cancel').click(function () {
                $popup.dialog('close');
                return false;
            }).end()
                .find('._submit').click(function () {
                doCancelAccount();
                return false;
            });
        }
    }, 'q1');
}

function doCancelAccount(paramString = null) {
    let postData = paramString || $("#cancelAccountPopupForm").serialize();
    ajaxCall({
        url: "/ajax/settings/cancel-account",
        data: postData,
        success: function (data) {
            if (data.success == 1) {
                hs.trackerDatalab.trackCustom('web.dashboard.billing', 'billing_user_confirmed_delete_account');
                hs.trackEvent({
                    category: 'Canceled',
                    value: paramString ? "prosperstack" : $("#cancelAccountPopupForm textArea._cancelReason").val()
                });
                window.location = hs.c.rootUrl + "/logout";
            } else {
                hs.statusObj.update("Error: " + data.errorMessage, "error", true);
                showCancelAccountPopup();
            }
            window.updateDashboardHeight();
        }
    }, 'q1');
}

settings.changeMemberTheme = function (e) {
    var theme = $(e).attr('id').replace('theme_', '');
    ajaxCall({
        url: "/ajax/settings/save-theme",
        data: "theme=" + theme,
        success: function (data) {
            if (data.success == 1) {
                window.location.reload(true);
            }
        }
    }, 'q1');
};

settings.removeAuthenticationMethod = function (id) {
    hs.statusObj.update(translation._("Removing authentication method..."));
    ajaxCall({
        type: 'DELETE',
        url: "/ajax/settings/remove-authentication-method?memberAuthId=" + id,
        success: function (data) {
            if (data.success) {
                hs.statusObj.update(translation._("Authentication method removed."), 'success', true, undefined, true);
                window.loadSettings('account', null, null, 'subsection=authentication');
            } else {
                var errorMessage = translation._("An error occurred while removing the authentication method, please try again in a bit.");
                if (data.error) {
                    errorMessage = data.error;
                }
                hs.statusObj.update(errorMessage, 'error', true);
            }
        },
        error: function (_data) {
            hs.statusObj.reset();
        }
    }, 'q1');
};

settings.initTabs = function ($popup, sectionList) {
    $popup.find('._tab').click(function (e) {
        e.preventDefault();

        var $tab = $(this),
            $tabs = $popup.find('._tab'),
            $sections = $popup.find('._section');

        for (var i = 0; i < sectionList.length; i++) {
            var section = sectionList[i];
            if ($tab.is('._' + section)) {
                $tabs.removeClass('active');
                $tabs.attr('aria-selected', 'false');
                $tabs.attr('tabindex', '-1');

                $tab.attr('aria-selected', 'true');
                $tab.removeAttr('tabindex');
                $tab.addClass('active');

                $sections.hide().filter('._' + section).show();
                break;
            }
        }
    });
};

settings.uploadMemberAvatarComplete = function (imgName) {
    var $section = $('#settingsContent ._avatarUpdater');
    $section
        .find('input[name="member[avatar]"]').val(imgName).end()
        .find('._avatarPreview')
        .removeClass('visHide')
        .find('img').attr('src', hs.util.rootifyAvatar('member', imgName));
};

settings.initAccount = function (data) {
    var $popup = $('#settingsContent'),
        sectionList = ['profile', 'authentication', 'security', 'privacy', 'billing'];

    // init tabs
    settings.initTabs($popup, sectionList);

    function replaceAvatarWithDefault() {
        fetch(hs.util.getDefaultAvatar('member')).then(res => res.blob().then(blob => {
                const file = new File([blob], 'icon-avatar-member.jpeg', {type: blob.type});

                var formData = new FormData();
                formData.append('name', 'default_avatar');
                formData.append('Filedata', file);

                ajaxCall({
                    type: 'POST',
                    url: "/ajax/image-upload/upload-member-image",
                    data: formData,
                    encType: "multipart/form-data",
                    contentType: false,
                    processData: false,
                    success: function (data) {
                        if (data.success) {
                            settings.uploadMemberAvatarComplete(data.fileName);
                            hs.statusObj.update(translation._("Success"), "success", true);
                        }
                    }
                }, 'q1');
            }
        ));
    }

    if (darklaunch.isFeatureEnabled('ID_1642_NEW_USER_SETTINGS_MODAL_ACCOUNT_PROFILE')) {
        var settingsContent = document.getElementById('accountProfileContent');
        getApp('hs-app-user-settings').then(function (app) {
            app.account.profile.mount(settingsContent, {
                memberId: hs.memberId
            });
        })
    } else {
        // init avatar uploader
        var uploadVars = {};
        uploadVars.uploadPath = hs.c.rootUrl + '/ajax/image-upload/upload-member-image';
        uploadVars.csrfToken = hs.csrfToken;
        uploadVars.uploadImageCompleteCallback = settings.uploadMemberAvatarComplete;
        hs.util.initPluploadImageUploader("uploaderMemberSwf", uploadVars);
        // init update email fields
        $('._emailNewEmail, ._emailPassword, ._emailRecaptcha').hide();
        $popup
            .find(':input[name="member[bio]"]').bind('keypress', function (e) {
            // don't let these fields trigger the "enter to submit" functionality
            e.stopPropagation();
        }).end()
            .find('._deleteAvatar').click(function (e) {
            e.preventDefault();
            replaceAvatarWithDefault();
        }).end()
            .find('#accountSettingForm').bind('keypress', function (e) {
            window.checkForEnterKey(e, '_submit');
        }).end()
            .find('._autoInitialCheck').click(function () {
            var val = 0;
            if ($(this).is(':checked')) {
                val = 1;
            }
            $('#autoInitialField').val(val);
        }).end()
            .find('#newPassword').change(function () {
            $('#isChangePassword').val(1);
        }).end()
            .find('._toggleChangePassword').click(function () {
            $('#changePasswordSection').slideToggle();
            var $isChangePw = $('#isChangePassword'),
                val = $('#isChangePassword').val() == '0' ? 1 : 0;
            $isChangePw.val(val);
            return false;
        }).end()
            .find('._showChangeEmail').click(function () {
            toggleChangeEmail();
            return false;
        }).end()
            .find('._cancelAccount').click(function () {
            hs.trackerDatalab.trackCustom('web.dashboard.billing', 'billing_user_clicked_delete_account');
            showCancelAccountPopup();
            return false;
        }).end()
            .find('._submit').click(function () {
            var $input = $('._newPassword');
            if ($input.val() !== '') {
                if (hs.util.validatePassword($input)) {
                    saveAccountSettings();
                    return false;
                }
            } else {
                saveAccountSettings();
                return false;
            }
        }).end()
            .find('#description').bind('keyup', function () {
            var bioDescription = $(this).val(),
                textLimit = 2000;
            if (bioDescription.length > textLimit) {
                $(this).val(bioDescription.substring(0, textLimit));
            }
        });
        $popup.find('._newPassword').keyup(function (event) {
            if (event.keyCode != 13) {
                hs.util.checkPasswordPolicy($(this));
            }
        }).end();
    }

    if (darklaunch.isFeatureEnabled('ID_1703_NEW_USER_SETTINGS_MODAL_ACCOUNT_AUTHENTICATION')) {
        var authenticationContent = document.getElementById('accountAuthenticationContent');
        getApp('hs-app-user-settings').then(function (app) {
            app.account.authentication.mount(authenticationContent, {
                memberId: hs.memberId
            });
        })
    } else {
        $popup.find('._deleteAuth').click(function () {
            var $authMethods = $('#authMethods'),
                prompt1 = $authMethods.data('authprompt1'),
                prompt2 = $authMethods.data('authprompt2');
            if (($('#authMethods').children().length > 1) ? confirm(prompt1) : confirm(prompt2)) {
                var memberAuthId = $(this).attr('maid');
                settings.removeAuthenticationMethod(memberAuthId);
            }
            return false;
        }).end()

        hs.recaptcha.init();
    }
    /* dark launch integration for the new privacy tab*/
    if (darklaunch.isFeatureEnabled('ID_1721_NEW_USER_SETTINGS_MODAL_ACCOUNT_PRIVACY')) {
        const privacyContent = document.getElementsByClassName('privacySection')[0];
        privacyContent.replaceChildren();
        getApp('hs-app-user-settings').then(function (app) {
            app.account.privacy.mount(privacyContent, {
                memberId: hs.memberId
            });
        })
    }
    /* dark launch integration for the new billing tab*/
    if (darklaunch.isFeatureEnabled('ID_2120_NEW_USER_SETTINGS_MODAL_ACCOUNT_BILLING')) {
        const billingContent = document.getElementById('billingContent');
        billingContent.replaceChildren();
        getApp('hs-app-user-settings').then(function (app) {
            app.account.billing.mount(billingContent, {
                memberId: hs.memberId
            });
        })
    } else {
    /*
     * init invoice section
     */
    var $billingSection = $popup.find('._section._billing');

    // Validate VAT
    var $subSectionVat = $billingSection.find('._subSectionVat');

    // If the VAT sub-section exists store VAT-related variables
    if ($subSectionVat.length) {
        settings.vatCodes = {
            IS_VALID: 'valid',
            IS_EMPTY: 'empty',
            NO_CC_MATCH: 'country_code_does_not_match',
            INVALID_NUMBER: 'invalid_number'
        };

        var billingCountryCode = data.memberExtra && data.memberExtra.billingCountryCode ? data.memberExtra.billingCountryCode : null;

        settings.vatVars = {
            memberBillingCountryCode: billingCountryCode,
            $input: $subSectionVat.children('._vatInput'),
            $validateBtn: $subSectionVat.children('._vatValidate'),
            $throbber: $subSectionVat.children('._vatThrobber'),
            $successMessage: $subSectionVat.children('._vatSuccessMessage'),
            $errorNoCountryMatch: $subSectionVat.children('._vatErrorNoCountryMatch'),
            $errorInvalidNumber: $subSectionVat.children('._vatErrorInvalidNumber')
        };

        settings.vatVars.$input.keydown(settings.resetVatValidation);
        settings.vatVars.$validateBtn.click(settings.doVatValidation);
    }

    $billingSection.find('._submitInvoicePref').click(function () {
        // If we are including VAT validation for the user
        if (settings.vatVars !== undefined) {
            // Ensure the user has entered a valid (or blank) VAT number
            if (settings.vatVars.$input.val().length && settings.vatVars.$input.data('vat-validated') === false) {
                if (!settings.doVatValidation(false)) {
                    return false;
                }
            }
        }

        hs.statusObj.update(translation._("Saving invoice preferences..."), 'info');
        var postData = $billingSection.find(':input').serialize();
        ajaxCall({
            type: 'POST',
            url: '/ajax/settings/save-invoice-preferences',
            data: postData,
            success: function (data) {
                var msg = '',
                    type = 'success';
                if (data.success) {
                    msg = translation._("Invoice preferences saved");
                } else {
                    msg = data.errorMsg;
                    type = 'error';
                }
                _.defer(function () {
                    hs.statusObj.update(msg, type, true);
                });
            },
            complete: function () {
                hs.statusObj.reset();
            }
        }, 'q1');
        return false;
    });
    }

    /*
     * init security section
     */
    if (darklaunch.isFeatureEnabled('ID_1785_NEW_USER_SETTINGS_MODAL_ACCOUNT_SECURITY')) {
        var securityContent = document.getElementById('accountSecurityContent');
        getApp('hs-app-user-settings').then(function (app) {
            app.account.security.mount(securityContent, {
                memberId: hs.memberId
            });
        })
    } else {
        var $securitySection = $popup.find('._section._security');
        $popup.find('.tab._security').click(function () {
            ajaxCall({
                url: '/ajax/member/check-login-authentication',
                success: function (data) {
                    // returned data here looks like:
                    //   {output: "", success: 1, useGoogleAuth: "0"}
                    //
                    // values of useGoogleAuth are strings and correspond to:
                    //   null - do not use google auth
                    //   "0"  - "ask on location change"
                    //   "1"  - "ask always"
                    //
                    if (data.useGoogleAuth == "1") {
                        $securitySection.find('#gaAlwaysRadio').prop('checked', true);
                    } else if (data.useGoogleAuth == "0") {
                        $securitySection.find('#gaLocRadio').prop('checked', true);
                    } else {
                        // impossible condition according to the data model
                        // eslint-disable-next-line no-console
                        console.warn("unknown useGoogleAuth value: " + data.useGoogleAuth);
                    }
                }
            }, 'qm');
        });
        $securitySection
            .find('._generateGaSecret').click(function () {
            hs.statusObj.update(translation.c.LOADING, 'info');
            ajaxCall({
                url: '/ajax/settings/generate-ga-secret',
                success: function (data) {
                    if (data.secret) {
                        hs.statusObj.reset();
                        $securitySection
                            .find('._gaSecret').text(data.secret).end()
                            .find('._gaQrCode').attr('src', data.qrCodeUrl).end()
                            .find('._gaInProgress').show().end()
                            .find('._hasGaSecret').show().end()
                            .find('._gaComplete').hide().end()
                            .find('#gaLocRadio').prop('checked', true);
                    } else {
                        hs.statusObj.update(translation.c.ERROR_GENERIC, 'error', true);
                    }
                }
            }, 'qm');
        }).end()
            .find('._removeGaSecret').click(function () {
            hs.statusObj.update(translation.c.LOADING, 'info');
            ajaxCall({
                url: '/ajax/settings/remove-ga-secret',
                success: function (_data) {
                    hs.statusObj.reset();
                    $securitySection
                        .find('._gaSecret').text('').end()
                        .find('._gaInProgress').hide().end()
                        .find('._hasGaSecret').hide().end()
                        .find('._noGaSecret').show();
                }
            }, 'qm');
        }).end()
            .find("input[name='gaSettings']").change(function () {
            var self = this;
            this.gaSettingsValue = $securitySection.find($("input[name='gaSettings']:checked")).val();

            ajaxCall({
                url: '/ajax/settings/change-ga-settings?settingsValue=' + self.gaSettingsValue,
                success: function (data) {
                    if (data.success) {
                        hs.statusObj.update(translation._('Google Authentication settings changed.'), 'success', true);
                    } else {
                        hs.statusObj.update(translation.c.ERROR_GENERIC, 'error', true);
                    }
                }
            }, 'qm');
        }).end()
            .find('._checkGaCode').click(function () {
            var code = $securitySection.find($('#gaCodeConfirmCheck')).val();
            var url = '/ajax/settings/verify-ga-code?code=' + code;
            if (code.length == 6) {
                ajaxCall({
                    url: url,
                    success: function (data) {
                        if (data.success) {
                            $securitySection
                                .find('#gaCodeConfirmCheck').val('').end()
                                .find('._gaInProgress').hide().end()
                                .find('._noGaSecret').hide().end()
                                .find('._gaSecretPanel').css('margin-top', '0').end()
                                .find('._gaComplete').show();
                        } else {
                            hs.statusObj.update(translation._('Sorry, that code was invalid.'), 'error', true);
                        }
                    }
                }, 'qm');
            } else {
                hs.statusObj.update(translation._('Please enter a 6-character code.'), 'error', true);
            }
        });

    }
};

settings.resetVatValidation = function () {
    // Invalidate the input 'vat-validated' data attribute
    settings.vatVars.$input.data('vat-validated', false);

    // Hide the message dialogs
    settings.vatVars.$successMessage.addClass('u-displayNone');
    settings.vatVars.$errorNoCountryMatch.addClass('u-displayNone');
    settings.vatVars.$errorInvalidNumber.addClass('u-displayNone');
};

settings.doVatValidation = function (showAnimation) {
    var vatValue = settings.vatVars.$input.val();

    showAnimation = (showAnimation === undefined ? true : showAnimation);

    settings.resetVatValidation();

    var validateVatResponse = settings.validateVAT(vatValue);

    // Only evaluate non-empty VAT values
    if (vatValue.length) {
        if (showAnimation) {
            settings.vatVars.$validateBtn.addClass('u-displayNone');
            settings.vatVars.$throbber.removeClass('u-displayNone');

            setTimeout(function () {
                settings.vatVars.$validateBtn.removeClass('u-displayNone');
                settings.vatVars.$throbber.addClass('u-displayNone');

                if (validateVatResponse === settings.vatCodes.IS_VALID) {
                    settings.vatVars.$successMessage.removeClass('u-displayNone');
                } else if (validateVatResponse === settings.vatCodes.NO_CC_MATCH) {
                    settings.vatVars.$errorNoCountryMatch.removeClass('u-displayNone');
                    return false;
                } else {
                    // We have received an invalid number
                    settings.vatVars.$errorInvalidNumber.removeClass('u-displayNone');
                    return false;
                }
            }, 800);
        } else {
            if (validateVatResponse === settings.vatCodes.NO_CC_MATCH) {
                settings.vatVars.$errorNoCountryMatch.removeClass('u-displayNone');
                return false;
            } else if (validateVatResponse === settings.vatCodes.INVALID_NUMBER) {
                settings.vatVars.$errorInvalidNumber.removeClass('u-displayNone');
                return false;
            }
        }
    }

    return true;
};

/**
 * settings.validateVAT
 * Validates a supplied VAT Number
 * @param vatFull - full VAT Number, including country code (first two characters)
 * @returns {string}
 */
settings.validateVAT = function (vatFull) {
    if (!vatFull.length) {
        return settings.vatCodes.IS_EMPTY;
    }

    var vatBillingCountryCode, vatNumber, regex, regexResult, vatNorwayBillingCountryCode;

    vatFull = vatFull.toUpperCase().replace(/[ -]/g, '');
    vatBillingCountryCode = vatFull.substring(0, 2);

    if (vatFull.length == 12) {
        vatNorwayBillingCountryCode = vatFull.substring(9);
    }

    if (vatNorwayBillingCountryCode == 'MVA') {
        vatNumber = vatFull.substring(0, 9);
    } else {
        vatNumber = vatFull.substring(2);
    }

    regex = '';

    if (settings.vatVars.memberBillingCountryCode !== vatBillingCountryCode) {
        // exception for Greece, country code GR and VAT code EL
        if (settings.vatVars.memberBillingCountryCode !== 'GR' && vatBillingCountryCode !== 'EL' && vatNorwayBillingCountryCode !== 'MVA') {
            return settings.vatCodes.NO_CC_MATCH;
        }
    }

    if (vatNorwayBillingCountryCode == 'MVA') {
        regex = /^[0-9]{9}$/;
    } else {
        switch (vatBillingCountryCode) {
            case 'AT':
                regex = /^U[0-9A-Z]{8}$/; // 'U' + 8 characters
                break;
            case 'BE':
            case 'BG':
                regex = /^[0-9]{9,10}$/; // 9 - 10 digits
                break;
            case 'CY':
                regex = /^[0-9A-Z]{9}$/; // 9 characters
                break;
            case 'CZ':
                regex = /^[0-9]{8,10}$/; // 8 - 10 digits
                break;
            case 'DE':
            case 'EE':
            case 'EL':
            case 'PT':
                regex = /^[0-9]{9}$/; // 9 digits
                break;
            case 'DK':
            case 'FI':
            case 'HU':
            case 'LU':
            case 'MT':
            case 'SI':
                regex = /^[0-9]{8}$/; // 8 digits
                break;
            case 'ES':
                regex = /^[0-9A-Z][0-9]{7}[0-9A-Z]$/; // 9 digits, first and last can also be a character
                break;
            case 'FR':
                regex = /^[0-9A-Z]{2}[0-9]{9}$/; // 2 characters + 9 digits
                break;
            case 'GB':
                regex = /^[0-9]{9}$|^[0-9]{12}$|^GD[0-9]{3}$|^HA[0-9]{3}$/; // 9 digits -or- 12 digits -or- GD + 3 digits -or- HA + 3 digits
                break;
            case 'HR':
            case 'IT':
            case 'LV':
                regex = /^[0-9]{11}$/; // 11 digits
                break;
            case 'IE':
                regex = /^[0-9]{7}[A-Z]{1,2}$|^[0-9][A-Z][1-9]{5}[A-Z]$/; // 7 digits + 1 to 2 letters -or- 1 digit + 1 letter + 5 digits + 1 letter (old style)
                break;
            case 'LT':
                regex = /^[0-9]{9}$|^[0-9]{12}$/; // 9 digits or 12 digits
                break;
            case 'NL':
                regex = /^[0-9]{9}B[0-9]{2}$/; // 9 digits + 'B' + 2 digits
                break;
            case 'PL':
            case 'SK':
                regex = /^[0-9]{10}$/; // 10 digits
                break;
            case 'RO':
                regex = /^[0-9]{2,10}$/; // 2 - 10 digits
                break;
            case 'SE':
                regex = /^[0-9]{12}$/; // 12 digits
                break;
            case 'ZA':
                regex = /^[4][0-9]{9}$/; // '4' + 9 digits
                break;
            case 'CH':
                regex = /^E[0-9]{3}[.]?[0-9]{3}[.]?[0-9]{3}(MWST|TVA|IVA)$/g;
                // 'E' + 3 digits + dot + 3 digits + dot + 3 digits + MWST, TVA or IVA
                break;
            default:
                return settings.vatCodes.INVALID_NUMBER;
        }
    }

    regexResult = vatNumber.match(regex);

    if (regexResult !== null && regexResult.length === 1 && regexResult[0] === vatNumber) {
        // Update the VAT input element to reflect that the VAT number has been validated
        settings.vatVars.$input.data('vat-validated', true);
        return settings.vatCodes.IS_VALID;
    } else {
        // Likewise, update to reflect an invalid result
        settings.vatVars.$input.data('vat-validated', false);
        return settings.vatCodes.INVALID_NUMBER;
    }
};
settings.initBilling=function(data){
    if (darklaunch.isFeatureEnabled('ID_2120_NEW_USER_SETTINGS_MODAL_ACCOUNT_BILLING')) {
        const settingsContent = document.getElementById('settingsSection');
        settingsContent.replaceChildren();
        getApp('hs-app-user-settings').then(function (app) {
            app.account.billing.mount(settingsContent, {
                memberId: hs.memberId
            });
        })
    } else {
        const $popup = $('#settingsContent')
        /*
         * init invoice section
         */
        var $billingSection = $popup.find('._section._billing');

        // Validate VAT
        var $subSectionVat = $billingSection.find('._subSectionVat');

        // If the VAT sub-section exists store VAT-related variables
        if ($subSectionVat.length) {
            settings.vatCodes = {
                IS_VALID: 'valid',
                IS_EMPTY: 'empty',
                NO_CC_MATCH: 'country_code_does_not_match',
                INVALID_NUMBER: 'invalid_number'
            };

            var billingCountryCode = data.memberExtra && data.memberExtra.billingCountryCode ? data.memberExtra.billingCountryCode : null;

            settings.vatVars = {
                memberBillingCountryCode: billingCountryCode,
                $input: $subSectionVat.children('._vatInput'),
                $validateBtn: $subSectionVat.children('._vatValidate'),
                $throbber: $subSectionVat.children('._vatThrobber'),
                $successMessage: $subSectionVat.children('._vatSuccessMessage'),
                $errorNoCountryMatch: $subSectionVat.children('._vatErrorNoCountryMatch'),
                $errorInvalidNumber: $subSectionVat.children('._vatErrorInvalidNumber')
            };

            settings.vatVars.$input.keydown(settings.resetVatValidation);
            settings.vatVars.$validateBtn.click(settings.doVatValidation);
        }

        $billingSection.find('._submitInvoicePref').click(function () {
            // If we are including VAT validation for the user
            if (settings.vatVars !== undefined) {
                // Ensure the user has entered a valid (or blank) VAT number
                if (settings.vatVars.$input.val().length && settings.vatVars.$input.data('vat-validated') === false) {
                    if (!settings.doVatValidation(false)) {
                        return false;
                    }
                }
            }

            hs.statusObj.update(translation._("Saving invoice preferences..."), 'info');
            var postData = $billingSection.find(':input').serialize();
            ajaxCall({
                type: 'POST',
                url: '/ajax/settings/save-invoice-preferences',
                data: postData,
                success: function (data) {
                    var msg = '',
                        type = 'success';
                    if (data.success) {
                        msg = translation._("Invoice preferences saved");
                    } else {
                        msg = data.errorMsg;
                        type = 'error';
                    }
                    _.defer(function () {
                        hs.statusObj.update(msg, type, true);
                    });
                },
                complete: function () {
                    hs.statusObj.reset();
                }
            }, 'q1');
            return false;
        });
    }
}
settings.initPreferences = function () {
    if (darklaunch.isFeatureEnabled('ID_1516_NEW_USER_SETTINGS_MODAL_PREFERENCES')) {
        var settingsContent = document.getElementById('settingsContent');

        getApp('hs-app-user-settings').then(function (app) {
            app.preferences.mount(settingsContent, {
                memberId: hs.memberId
            });
        })
    } else {
        var $popup = $("#settingsPopup #settingsContent"),
            sectionList = ['general', 'themes'];

        // init languageSwitcher
        var trackingOrigin = 'web.dashboard.settings.preferences';
        languageSwitcher.init({trackingOrigin: trackingOrigin});

        settings.initTabs($popup, sectionList);
        /*
         * init general prefs
         */
        if (localCache.isSupported) {
            $popup.find("._clearCache")
                .click(function () {
                    localCache.clear();
                    hs.statusObj.update(translation._("Cached messages are cleared"), 'success', true);
                    hs.reloadBrowser();     // reload browser
                })
                .show();
        }
        $popup.find('._toggleSsl').click(function () {
            var isUseSsl = $(this).is('._on') ? 1 : 0;
            window.updateMemberPreference('isUseSsl', isUseSsl, function () {
                var url = hs.c.rootUrl;
                url = isUseSsl ? url.replace(/^http:/i, 'https:') : url.replace(/^https:/i, 'http:');
                _.defer(function () {
                    window.location.href = url;
                });
            });
        }).end()
            .find('._submitGeneral').click(function () {
            savePreferenceSettings();
            return false;
        });

        $('#preferenceSettingForm').bind('keypress', function (e) {
            window.checkForEnterKey(e, '_submitGeneral');
        });
    }
};

settings.initNotifications = function () {
    if (darklaunch.isFeatureEnabled('ID_2087_NEW_USER_SETTINGS_MODAL_NOTIFICATIONS')) {
        var settingsContent = document.getElementById('settingsContent');

        getApp('hs-app-user-settings').then(function (app) {
            app.notifications.mount(settingsContent, {
                memberId: hs.memberId
            });
        })
    } else {
        var $popup = $("#settingsPopup #settingsContent");

        $popup.find('._notifications._section').find('input:checkbox._generalCb').off().on('click', function (e) {
            var $target = $(e.target),
                name = $target.attr('name') || '',
                isChecked = ($target.is(':checked') ? '1' : '0');

            ajaxCall({
                type: 'POST',
                beforeSend: function () {
                    hs.statusObj.update(translation.c.SAVING, 'info');
                    $target.attr('disabled', true);
                },
                url: "/ajax/settings/save-notifications",
                data: {
                    'name': name,
                    'isChecked': isChecked
                },
                success: function (data) {
                    $target.attr('disabled', false);
                    if (parseInt(data.result, 10) === 0) {
                        $target.attr('checked', !isChecked);
                        hs.statusObj.update(translation.c.ERROR_GENERIC, 'error', true);
                    } else {
                        hs.statusObj.update(translation._("Saved."), 'success', true);
                    }
                }
            }, 'qm');
        });

        if (hs.shouldSeeNotificationCenter) {
            getApp('hs-app-notification-center').then(function (hsNotificationCenter) {
                var $container = $('._notification-center-settings');
                if ($container.length) {
                    var props = {
                        memberId: hs.memberId,
                        socialNetworks: hs.socialNetworks,
                        urlRoot: hs.facadeApiUrl + '/notification'
                    };
                    hsNotificationCenter.renderNotificationCenterSettingsApp($container[0], props);
                }
            });
        }
    }
};


settings.initVanityUrl = function (data) {
    if (darklaunch.isFeatureEnabled('ID_2086_NEW_USER_SETTINGS_MODAL_VANITY_URLS')) {
        const vanityUrlsContent = document.getElementsByClassName('vanityurl')[0];
        vanityUrlsContent.replaceChildren();
        getApp('hs-app-user-settings').then(function (app) {
            app.vanityurls.mount(vanityUrlsContent, {
                memberId: hs.memberId
            });
        })
    } else {
        var $popup = $("#settingsPopup #settingsContent");

        var fnOpenAddNewUrlPopup = function (e) {
                e.preventDefault();
                const POPUP_WIDTH = 460;
                const POPUP_HEIGHT = darklaunch.isFeatureEnabled('PUB_23730_ADD_VANITY_URL_POPUP_HEIGHT_FIX') ? $(window).height() - 100 : 'auto';
                ajaxCall({
                    type: 'POST',
                    url: "/ajax/settings/add-vanity-url",
                    data: "defaultOrgId=" + $popup.find("select._orgSelector").val(),
                    success: function (data) {
                        var params = {
                            modal: true,
                            closeOnEscape: true,
                            resizable: false,
                            draggable: true,
                            title: translation._("Add Vanity URL"),
                            width: POPUP_WIDTH,
                            height: POPUP_HEIGHT,
                            content: data.output
                        };
                        $.dialogFactory.create('addVanityUrlPopup', params);

                        settings.initAddNewVanityUrlPopup();
                    }
                }, 'q1');
            },
            fnDeleteUrl = function (e) {
                e.preventDefault();

                var confirmDel = confirm(translation._("Permanently delete this Vanity URL, and remove all URLs created with this domain?"));
                var id = $(this).attr('data-id');

                if (!confirmDel) {
                    return;
                }

                ajaxCall({
                    type: 'DELETE',
                    url: "/ajax/settings/delete-vanity-url?id=" + id,
                    success: function (data) {
                        var message = translation._("Your vanity URL has been deleted."),
                            msgType = 'success';
                        if (!data.success) {
                            message = translation._("There was an error deleting your vanity URL, please try again later.");
                            msgType = 'error';
                        }
                        hs.statusObj.update(message, msgType, true);

                        if (msgType === 'success') {
                            // update the url shorteners section
                            setTimeout(function () {
                                window.loadSettings('vanityurl');
                            }, 1);
                        }
                    }
                }, 'q1');
            },
            $addButton = $popup.find('._addNewShortener'),
            $orgSelectList = $popup.find('._orgSelector');

        $addButton.click(fnOpenAddNewUrlPopup);

        $popup
            .off('click', '._vanityUrl ._delete', fnDeleteUrl)
            .on('click', '._vanityUrl ._delete', fnDeleteUrl)

        //build organization dropdown
        if (data.organizations && _.values(data.organizations).length) {
            var selectedId = data.selectedOrgId,
                itemsArr = _.map(data.organizations, function (org) {
                    var obj = {
                        title: org.name,
                        id: org.id
                    };
                    if (obj.id === selectedId) {
                        obj.selected = true;
                    }
                    return obj;
                });
            if (!selectedId) {
                itemsArr[0].selected = true;
            }
            $orgSelectList.hsDropdown({
                data: {items: itemsArr},
                change: function (element, event) {
                    if (event) {
                        var selectedOrgId = element.id;
                        window.loadSettings('vanityurl', null, null, 'vanityUrlOrgId=' + selectedOrgId);
                    }
                }
            });
        }
    }
};

settings.saveTeamVanityUrl = function (vanityUrlId, selectedTeamIds) {
    var numberTeams = selectedTeamIds.length;

    var postData = "vanityUrlId=" + vanityUrlId;
    for (var i = 0; i < numberTeams; i++) {
        postData += '&teamIds%5B%5D=' + selectedTeamIds[i];
    }

    hs.statusObj.update(translation._("Updating...."), 'info', true);
    ajaxCall({
        url: "/ajax/settings/save-vanity-url-teams",
        data: postData,
        success: function (data) {
            if (data.success == 1) {
                hs.statusObj.update(translation._("Vanity Url settings have been saved"), "success", true);
                $("#settingsPopup #settingsContent #selectedTeams" + data.vanityUrlId).val(data.teamIds);
            } else {
                hs.statusObj.update(translation._("There was a problem saving the Vanity Url settings. Please review and try again."), "error", true);
            }
        }
    }, 'q1');
};

/*
 Data Portability Archiving
 */

settings.initDataPortabilityArchiving = function (data) {

    if (data.orgCount === 0) {
        return;
    }

    var $dialog = $('._dataPortabilitySettings');
    var $archivingStartDate = $dialog.find('._archivingStartDate');
    var $orgSelector = $dialog.find('._orgSelector');
    var $orgIdInput = $dialog.find('._orgId');

    if (data.orgCount == 1) {

        var org = data.orgDropdownOptions[0];

        $orgSelector.remove();
        $dialog.find('._titleOrg').append(': ' + org.title);

        if (org.id) {
            $orgIdInput.val(org.id);
        }
        if (org.archivingStartDate) {
            $archivingStartDate.html(org.archivingStartDate);
        }

    } else {
        $orgSelector.hsDropdown({
            data: {items: data.orgDropdownOptions},
            change: function (element, _event) {
                $orgIdInput.val(element.id);
                if (element.archivingStartDate) {
                    $archivingStartDate.html(element.archivingStartDate);
                } else {
                    $archivingStartDate.html('');
                }
            }
        }).hsDropdown('selectFirstElement');
    }

    // file type selector mock.
    // $dialog.find('._fileTypeSelector').hsDropdown({data: { items: data.fileTypeDropdownOptions }, change: function (element, event) {
    //     if (event) {
    //     }
    // }});

    var $daterange = $dialog.find('._daterangepicker');
    var dateFormat = 'M d, yy'; // Feb 16, 2011
    var date = new Date();
    date.setDate(date.getDate() - 1); // yesterday
    var currentRange = $.datepicker.formatDate(dateFormat, date);
    $daterange.val(currentRange);
    $daterange.daterangepicker({
        presetRanges: [
            {
                text: translation._("Yesterday"),
                dateStart: 'today-1days',
                dateEnd: 'today-1days'
            },
            {
                text: translation._("Last 7 days"),
                dateStart: 'today-7days',
                dateEnd: 'today-1days'
            },
            {
                text: translation._("Last 30 days"),
                dateStart: 'today-30days',
                dateEnd: 'today-1days'
            },
            {
                text: translation._("Last 90 days"),
                dateStart: 'today-90days',
                dateEnd: 'today-1days'
            },
            {
                text: translation._("Forever"),
                dateStart: '2014/01/01',
                dateEnd: 'today-1days'
            }
        ],
        dateFormat: dateFormat,
        isGMT: true,
        closeOnSelect: true,
        onOpen: function () {
            currentRange = $daterange.val();
        },
        appendTo: '._daterangepickerExpanded'
    });
    $('.ui-daterangepickercontain').css({
        'position': 'absolute',
        'zIndex': '2000'
    });

    $dialog.find('._dataPortabilityExport').click(function (e) {
        window.location.href = "/data-portability/export?orgId=" + $dialog.find('._orgId').val() + "&dateRange=" + $dialog.find('._dateRange').val();
        e.preventDefault();
    });
};


/*
 Vanity URLs
 */

settings.initAddNewVanityUrlPopup = function () {
    var $popup = $('#addVanityUrlPopup');

    $popup
        .find('._addVanityUrlForm').bind('keypress', function (e) {
        window.checkForEnterKey(e, '_addNewVanityUrl');
    }).end()
        .find('._cancel').click(function (e) {
        e.preventDefault();
        $popup.dialog('close');
    }).end()
        .find('._addNewVanityUrl').click(function (e) {
        e.preventDefault();
        // @TODO: validate
        var url = $popup.find('._url').val(),
            root = $popup.find('._rootRedirect').val(),
            postData = $popup.find('form').serialize();

        //get selected teams
        var selectedItems = $popup.find('._teamSelectorWidget ._selectItem');
        if (selectedItems.length) {
            selectedItems.each(function (i, v) {
                var $v = $(v);
                postData += "&teamId[]=" + $v.attr('itemid');
            });
        }

        const httpOnlyPattern = /^http?:\/\/([\w\d])+/i;

        if (!url.length || !root.length) {
            hs.statusObj.update(translation._("You must enter a Vanity URL and an URL for redirecting."), 'warning', true);
            return;
        } else if (!url.match(httpOnlyPattern)) {
            hs.statusObj.update(translation._("You must enter a valid Vanity URL (http:// required)."), 'warning', true);
            return;
        } else if (!root.match(httpOnlyPattern)) {
            hs.statusObj.update(translation._("You must enter a valid URL for redirecting (http:// required)."), 'warning', true);
            return;
        }

        // save
        ajaxCall({
            type: 'POST',
            url: "/ajax/settings/add-vanity-url",
            data: postData,
            success: function (data) {
                if (data && data.success && data.output) {
                    // close add popup, and open another
                    $popup.dialog('close');

                    var params = {
                            modal: true,
                            closeOnEscape: true,
                            resizable: false,
                            draggable: true,
                            title: translation._("Complete the setup"),
                            width: 306,
                            content: data.output
                        },
                        $addVanityUrlFinishedPopup = $.dialogFactory.create('addVanityUrlFinishedPopup', params);

                    $addVanityUrlFinishedPopup.find('._finished').click(function (e) {
                        e.preventDefault();
                        $addVanityUrlFinishedPopup.dialog('close');
                    });

                    // update the url shorteners section
                    setTimeout(function () {
                        window.loadSettings('vanityurl');
                    }, 1);

                } else {
                    var message = data.errorMsg ? data.errorMsg : translation._("An error has occured, please try again later.");
                    hs.statusObj.update(message, 'error', true);
                }
            }
        }, 'q1');

    });

    if (darklaunch.isFeatureEnabled('PUB_23730_ADD_VANITY_URL_POPUP_HEIGHT_FIX')) {
        $popup.css('overflow-y', 'auto');
    }
};


/**
 * Initializer for the Auto Schedule Setting
 */
settings.initAutoSchedule = function () {
    hs.statusObj.update(translation.c.LOADING, 'info');
    if (darklaunch.isFeatureEnabled('ID_2088_NEW_USER_SETTINGS_MODAL_AUTOSCHEDULE')) {
        var settingsSection = document.getElementById('settingsSection');
        getApp('hs-app-user-settings').then(function (app) {
            app.autoSchedule.mount(settingsSection, {
                memberId: hs.memberId
            });
            hs.statusObj.reset();
        });
    }else{
        //Gran the settings from the server
        const autoScheduleSettings = new AutoScheduleSettings();
        autoScheduleSettings.fetch({
            'success': function (_model) {
                var autoscheduleSettingsView = new AutoScheduleView({'settings': autoScheduleSettings});
                var html = autoscheduleSettingsView.render().el;
                var $popup = $("#settingsSection");
                $popup.append(html);
                hs.statusObj.reset();
            },
            'error': function (_model) {
                //No settings, then show the first run
            }
        });
    }

};


/**
 * Debug/QA section
 */
settings.initDebug = function () {
    if (darklaunch.isFeatureEnabled('ID_2089_NEW_USER_SETTINGS_MODAL_DEBUG_QA')) {
        const debugContent = document.getElementsByClassName('debugContent')[0];
        debugContent.replaceChildren();
        getApp('hs-app-user-settings').then(function (app) {
            app.debug.mount(debugContent, {
                memberId: hs.memberId
            });
        })
    } else {

        var $popup = $("#settingsContent");

        $popup.find('._remove-popupsSeen').click(function (e) {
            if (confirm('Confirm deletion of ' + $(this).data('code'))) {
                ajaxCall({
                    type: 'POST',
                    url: '/ajax/settings/unset-popup-seen',
                    data: {code: $(this).data('code')},
                    success: function (data) {
                        if (data.success) {
                            window.loadSettings('debug');
                        } else {
                            hs.statusObj.update('Fail', 'error', true);
                        }
                    }
                }, 'q1');
            }
            e.preventDefault();
        });
        $popup.find('._remove-performedActions').click(function (e) {
            if (confirm('Confirm deletion of ' + $(this).data('code'))) {
                ajaxCall({
                    type: 'POST',
                    url: '/ajax/settings/unset-performed-action',
                    data: {code: $(this).data('code')},
                    success: function (data) {
                        if (data.success) {
                            window.loadSettings('debug');
                        } else {
                            hs.statusObj.update('Fail', 'error', true);
                        }
                    }
                }, 'q1');
            }
            e.preventDefault();
        });

        $popup.find('select').change(function (_e) {
            ajaxCall({
                type: 'POST',
                url: '/ajax/settings/set-member-extra-property',
                data: {
                    property: $(this).attr('name'),
                    value: $(this).val()
                },
                success: function (data) {
                    if (data.success) {
                        window.loadSettings('debug');
                    } else {
                        hs.statusObj.update('Fail', 'error', true);
                    }
                }
            }, 'q1');
        });


        $popup.find('._deleteLoginRecords').click(function (e) {
            if (confirm('Confirm deletion of login records')) {
                ajaxCall({
                    type: 'POST',
                    url: '/ajax/settings/delete-login-records',
                    success: function (data) {
                        if (data.success) {
                            window.loadSettings('debug');
                        } else {
                            hs.statusObj.update('Fail', 'error', true);
                        }
                    }
                }, 'q1');
            }
            e.preventDefault();
        });
    }

};



export default settings;
