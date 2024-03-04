import $ from 'jquery';
import _ from 'underscore';
import React from 'react';
import ReactDOM from 'react-dom';
import PciIFrame from 'components/billing/app-dir-payment-form';
import PricingService from 'billing/pricing-service';
import SliderComponent from 'utils/components/slider';
import util from 'utils/util';
import hootbus from 'utils/hootbus';
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise';
import translation from 'utils/translation';
import plans from 'plans';
import { formatNumber } from 'utils/string';

import 'utils/status_bar';




/**
 * ===========================================================
 * ===========================================================
 * ===========================================================
 *
 * THIS FILE IS HARD TO IMPROVE AND NEEDS TO BE SPLIT INTO
 * SIMPLE COMPONENTS.
 *
 * PLEASE DO NOT ADD TO IT WITHOUT GOOD REASON.
 *
 * ESPECIALLY DO NOT ADD NEW FEATURES, THEY DO NOT BELONG HERE.
 *
 * IF YOU NEED TO UPDATE/FIX METHODS THAT ARE MARKED AS @DEPRECATED,
 * TALK TO THE BILLING TEAM FIRST (SPECIFICALLY, NIKITA).
 *
 * WE HAVE HS-APP-BILLING NOW. YOU CAN REQUIRE() THINGS FROM THERE.
 *
 * ===========================================================
 * ===========================================================
 * ===========================================================
 */




window.billing = window.billing || {};

import serverTime from 'utils/server-time';
import trackerDatalab from 'utils/tracker-datalab';

// Kinesis tracking
serverTime.init();
trackerDatalab.init('body');

var pricingService = window.pricingService = new PricingService();
// Update the base pricingProfile
_.extend(pricingService.pricingProfile, hs.memberPricingProfile);

// Initialize variables if they aren't already initialized

// Set the default tracking state to 'undefinedStateOther' so we can differentiate it from known states
// Note: Use "Other" to denote a flow outside of the normal Billing flows
billing.state = billing.state || 'undefinedStateOther';

// Set the default tracking prefix to 'undefinedPrefix' so we can differentiate it from known prefixes
billing.trackingPrefix = billing.trackingPrefix || 'web.billing.undefinedPrefix';

// Handle special cases for tracking (ie - all cases where billing.init() is not triggered)
if (location.pathname.indexOf('/dashboard') > -1) {
    billing.trackingPrefix = 'web.dashboard';
}

billing.activeCoupons = billing.activeCoupons || [];

billing.signupPlanId = billing.signupPlanId || 0;

billing.currentCost = billing.currentCost || 0;
billing.chosenPlanId = billing.chosenPlanId || 0;
billing.ajaxPage = billing.ajaxPage || false;
billing.memberLoggedIn = billing.memberLoggedIn || false;
billing.checkCouponToken = billing.checkCouponToken || '';
billing.coupons = billing.coupons || [];
billing.signupErrorMessage = translation._("Could not complete sign up. Please check form and try again.");
billing.showSpinners = true;
billing.showDowngradeOfferPopup = false;

billing.countryList = billing.countryList || [];
billing.stateList = billing.stateList || {};

billing.features = billing.features || {};
billing.features.PLAN = 'PLAN';
billing.features.SEATS = 'SEATS';
billing.features.PRIORITY_SUPPORT = 'PRIORITY_SUPPORT';
billing.features.ARCHIVING = 'ARCHIVING';
billing.features.HSU = 'HSU';
billing.features.ADDITIONAL_SOCIAL_NETWORKS = 'ADDITIONAL_SOCIAL_NETWORKS';
billing.features.PUBLISHER_PRO = 'PUBLISHER_PRO';
billing.features.ANALYTICS_PRO = 'ANALYTICS_PRO';

// List of features that have been "productized" (ie - offered separately)
billing.productizedFeatures = [
    billing.features.PUBLISHER_PRO,
    billing.features.ANALYTICS_PRO,
];

billing.currency = billing.currency || {};

billing.isSignup = billing.isSignup || false;

// Add list of currencies that you want to display as comma separated
billing.commaSeparatedCurrencies = ['PRICING_JPY'];

// Getter / Setter functions for initializing billing data
billing.setCountryList = function (countryList) {
    this.countryList = _.isArray(countryList) ? countryList : [];
    return this.countryList;
};

billing.getCountryList = function () {
    return this.countryList;
};

billing.setStateList = function (stateList) {
    this.stateList = _.isObject(stateList) ? stateList : {};
    return this.stateList;
};

billing.getStateList = function () {
    return this.stateList;
};

billing.setCurrencyDetails = function (currencyDetails) {
    currencyDetails = _.isObject(currencyDetails) ? currencyDetails : {};

    _.defaults(currencyDetails, {
        determined: '',
        defaultValue: '',
        localizedData: {}
    });

    this.currency.determined = currencyDetails.determined;
    this.currency.default = currencyDetails.defaultValue;
    this.currency.data = currencyDetails.localizedData;
    this.currency.formatting = currencyDetails.currencyFormatting;

    return this.currency;
};

billing.getCurrencyDetails = function () {
    return this.currency;
};

billing.setProDetails = function (proDetails) {
    proDetails = _.isObject(proDetails) ? proDetails : {};

    _.defaults(proDetails, {
        ajaxPage: false,
        memberLoggedIn: 0,
        showBillingHistory: 0,
        updateBilling: 0,
        chosenPlanId: undefined,
        ariaAcctValid: 0,
        addHsuOption: 0
    });

    // These values are all stored as separate variables
    this.ajaxPage = proDetails.ajaxPage;
    this.memberLoggedIn = proDetails.memberLoggedIn;
    this.billingHistory = proDetails.showBillingHistory;
    this.updateBilling = proDetails.updateBilling;
    this.chosenPlanId = proDetails.chosenPlanId;
    this.ariaAcctValid = proDetails.ariaAcctValid;
    this.addHsuOption = proDetails.addHsuOption;

    return this.getProDetails();
};

billing.getProDetails = function () {
    return {
        ajaxPage: this.ajaxPage,
        memberLoggedIn: this.memberLoggedIn,
        showBillingHistory: this.billingHistory,
        updateBilling: this.updateBilling,
        chosenPlanId: this.chosenPlanId,
        ariaAcctValid: this.ariaAcctValid,
        addHsuOption: this.addHsuOption
    };
};

billing.setPlanFeatureDetails = function (planFeatureDetails) {
    planFeatureDetails = _.isObject(planFeatureDetails) ? planFeatureDetails : {};

    _.defaults(planFeatureDetails, {
        activeCoupons: [],
        isSignup: false
    });

    // These values are all stored as separate variables
    this.activeCoupons = planFeatureDetails.activeCoupons;
    this.isSignup = planFeatureDetails.isSignup;

    return this.getPlanFeatureDetails();
};

billing.getPlanFeatureDetails = function () {
    return {
        activeCoupons: this.activeCoupons,
        isSignup: this.isSignup
    };
};

billing.setBillingPeriod = function (billingPeriod) {
    this.billingPeriod = billingPeriod || 'YEARLY'; // Default to yearly
    return this.billingPeriod;
};

billing.getBillingPeriod = function () {
    return this.billingPeriod;
};

billing.setDowngradeOfferPopup = function (showDowngradeOfferPopup) {
    this.showDowngradeOfferPopup = showDowngradeOfferPopup || false;
    return this.showDowngradeOfferPopup;
};

billing.getDowngradeOfferPopup = function () {
    return this.showDowngradeOfferPopup;
};
// End: Getter / Setter functions for initializing billing data

billing.spinnerHtml = function () {
    return "<div class='loading-content c-c'><h2>Loading...</h2><img src='" + hs.util.rootifyImage("/loader.gif") + "' /></div>";
};

billing.getSelectedCurrency = function () {
    return billing.currency.determined;
};

/**
 * If the billing object is not intialized and billing.currency.data does not exist, this function will fallback to default currency i.e. USD
 * @returns {object}
 */
billing.getCurrency = function () {
    if (typeof billing.currency.data !== 'undefined') {
        return billing.currency.data[billing.getSelectedCurrency()] || billing.currency.data[billing.currency['default']];
    } else {
        // fallback to USD if the currency is not initialized or defined
        return {
            symbol : '$',
            code : 'USD',
            zero : '0.00'
        };
    }
};

/**
 * This function should be used for tracking all events bound for Amazon Redshift
 *
 * @param {string} origin
 * @param {string} action
 * @param {object} data (optional)
 */
billing.trackEvent = function (origin, action, data) {
    // Extend the data object with error details to help resolve unaccounted for events
    var errorData = {
        state: billing.state,
        pathname: location.pathname
    };

    data = _.extend(errorData, data);

    trackerDatalab.trackCustom(origin, action, data);
};

/**
 * @deprecated - use hs-app-billing/CurrencyFormatter
 */
billing.roundCost = function (cost) {
    var c = parseFloat(cost);
    if (c <= 0) {
        c = billing.getCurrency().zero;
    } else {
        c = c.toFixed(billing.getSelectedCurrency() === 'PRICING_JPY' ? 0 : 2); // JPY doesn't have decimal point
    }

    return c;
};

/**
 * @deprecated - use hs-app-billing/CurrencyFormatter.formatCurrencyWithConfig
 *
 * This function is intentionally not made available in the billing name space.. you should be using billing.getCurrencyAmountForDisplay to format the currency outside this file
 *
 * @param {string} amount
 * @param {object} currencyFormatting
 * @returns {string}
 */
var formatCurrency = function (amount, currencyFormatting) {

    // Remove all whitespace
    amount = amount.replace(/s/, '');
    // Sometimes Aria returns two minus signs for some reason, remove extra minus signs in case they exist
    amount = amount.replace(/-+/g, '-');
    // Aria also puts commas to separate large numbers, remove those
    amount = amount.replace(/,/g, '');

    amount = parseFloat(amount).toFixed(currencyFormatting.decimalPoints);
    // replace "." with the decimal type to be used in the currency
    amount = amount.replace(/\./g, currencyFormatting.decimalType);

    amount = formatNumber(amount, currencyFormatting.decimalType, currencyFormatting.separatorType);

    return currencyFormatting.symbolBeforeAmount + amount + currencyFormatting.symbolAfterAmount;

};

/**
 * @param {string|int} amount
 * @param {object} currency: if undefined, default currency is selected
 * @param {string} locale: if undefined, default locale is selected
 * @returns {string}
 */
billing.getCurrencyAmountForDisplay = function (amount, currency, locale) {

    if (typeof amount === 'undefined' || amount === null) {
        amount = '0';
    } else {
        amount = amount.toString();
    }

    if (typeof currency === 'undefined') {
        currency = billing.getCurrency();
    }

    if (typeof locale === 'undefined') {
        if (typeof hs.language !== 'undefined') {
            locale = hs.language;
        } else {
            locale = '';
        }
    }

    var currencyAndLocale = currency['code'] + '_' + locale;
    var currencyCode = currency['code'];

    // default formatting for all currencies
    var currencyFormatting = {
        symbolBeforeAmount : currency['symbol'],
        symbolAfterAmount : '',
        decimalType : '.',
        separatorType : ',',
        decimalPoints : 2
    };

    if (typeof billing.currency.formatting !== 'undefined') {
        if (typeof billing.currency.formatting[currencyAndLocale] !== 'undefined') {
            currencyFormatting = billing.currency.formatting[currencyAndLocale];
        } else if (typeof billing.currency.formatting[currencyCode] !== 'undefined') {
            currencyFormatting = billing.currency.formatting[currencyCode];
        }
    }

    return formatCurrency(amount, currencyFormatting);

};

/**
 * @param {object} currency: if undefined, default currency is selected
 * @param {string} locale: if undefined, default locale is selected
 * @return {{
 *   symbolBeforeAmount: string,
 *   symbolAfterAmount: string,
 *   decimalType: string,
 *   separatorType: string,
 *   decimalPoints: number
 * }}
 */
billing.getCurrencyFormatting = function (currency, locale) {

    if (typeof currency === 'undefined') {
        currency = billing.getCurrency();
    }

    if (typeof locale === 'undefined') {
        if (typeof hs.language !== 'undefined') {
            locale = hs.language;
        } else {
            locale = '';
        }
    }

    var currencyAndLocale = currency['code'] + '_' + locale;
    var currencyCode = currency['code'];

    // default formatting for all currencies
    var currencyFormatting = {
        symbolBeforeAmount : currency['symbol'],
        symbolAfterAmount : '',
        decimalType : '.',
        separatorType : ',',
        decimalPoints : 2
    };

    if (typeof billing.currency.formatting !== 'undefined') {
        if (typeof billing.currency.formatting[currencyAndLocale] !== 'undefined') {
            currencyFormatting = billing.currency.formatting[currencyAndLocale];
        } else if (typeof billing.currency.formatting[currencyCode] !== 'undefined') {
            currencyFormatting = billing.currency.formatting[currencyCode];
        }
    }

    return currencyFormatting;
};

billing.setSavePlanChangeButtonState = function (disableButton) {
    var $savePlanButton = $('._savePlanChangeButtons').find('._saveAddons');

    // We can explicitly disable the save plan button by passing
    // true for disableButton, otherwise, determine based on page state
    disableButton = disableButton || false;

    if (disableButton || (billing.ajaxPage && !billing.memberLoggedIn)) {
        $savePlanButton
            .addClass('x-disabled')
            .prop('disabled', true);
    } else {
        $savePlanButton
            .removeClass('x-disabled')
            .prop('disabled', false);
    }
};

billing.populateBillingHistorySection = function (successCallback) {
    var billingHistoryDiv = $('.billing #billinghistory');

    ajaxCall({
        type: 'GET',
        url: "/ajax/billing/billing-history-section",
        success: function (data) {
            if (data.success == '1') {
                billingHistoryDiv.empty().html(data.output);
                if ($.isFunction(successCallback)) {
                    successCallback();
                }
            }
            else {
                hs.statusObj.update(translation._("Error retrieving billing history."), 'error', true);
            }
        }
    }, 'qmNoAbort');
};

billing.populateEnhancePlanSection = function (planId, formstash, successCallback) {
    var enhancePlanDiv = $('.billing #enhanceplan');

    if (billing.showSpinners) {
        enhancePlanDiv.html(billing.spinnerHtml()).show();
    }

    ajaxCall({
        type: 'GET',
        url: "/ajax/billing/enhance-plan-section",
        data: "planId=" + planId + '&addHsuOption=' + billing.addHsuOption,
        success: function (data) {
            if (data.success == '1') {
                billing.checkCouponToken = data.checkCouponToken;
                enhancePlanDiv.empty().html(data.output);
                $('#featuresForm').formValues(formstash);
                billing.updatePrice();

                billing.setSavePlanChangeButtonState();
                billing.showFreeTrial();

                if ($.isFunction(successCallback)) {
                    successCallback();
                }
            }
            else {
                enhancePlanDiv.empty();
                hs.statusObj.update(translation._("Error retrieving plan information."), 'error', true);
            }
        }
    }, 'qmNoAbort');

};

/* ADSG refactor all of these successCallbacks so that they're passed data */
billing.populateBillingSection = function (planId, updateBilling, formstash, successCallback) {
    var billingSectionDiv = $('.billing #billing-section');
    if (billing.showSpinners) {
        billingSectionDiv.html(billing.spinnerHtml()).show();
    }

    ajaxCall({
        type: 'GET',
        url: "/ajax/billing/billing-section",
        data: "planId=" + planId + "&updateBilling=" + updateBilling,
        success: function (data) {
            if (!_.has(data, 'success')) {
                document.location.reload(true);
                return false;
            }

            if (data.success == '1') {
                billingSectionDiv.empty().html(data.output);
                $("#seatUpperLimitErroMsg ._close").click(function () {
                    $('#seatUpperLimitErroMsg').hide();
                });

                // billing.init sets billing.countryList and billing.stateList
                billing.populateCountry();

                /* A biiit of a hack: the #ccForm formValues call can change the state/province part of the DOM,
                 * so afterwards restore the billingStateContainer div (which contains only the state/province SELECT)
                 * using the entire formStash. Everything but the state/province value will be skipped.
                 */
                $('#ccForm').formValues(formstash);
                $('#billingStateContainer').formValues(formstash);
                billing.showPaymentMethods();
                billing.showFreeTrial();

                if ($.isFunction(successCallback)) {
                    successCallback();
                }
            }
            else {
                billingSectionDiv.empty();
                hs.statusObj.update(translation._("Error retrieving billing section."), 'error', true);
            }
        }
    }, 'qmNoAbort');
};

billing.submitPaymentNotLoggedIn = function () {
    // The sequence of callbacks is:
    // submit signup form
    // on success: store features in session (user is now logged in)
    // on success: populate billing section (repopulated form has user's Aria session no.)
    // on success: submit the billing form
    if (!billing.checkCCForm()) {
        return;
    }

    if ($('._billingAddress ._billingZip').data('validated') === false) {
        billing.validationBlockedSignup();
        return;
    }

    // If member is logged in, skip the create account part.
    if (billing.memberLoggedIn) {
        billing.hideLoginBillingSection();
        billing.submitPayment();
        return;
    }

    // Store the signup plan id value; used to determine the redirect flow once the account has been created
    billing.signupPlanId = parseInt($.cookie.read('signup_plan_id'), 10) || 0;

    billing.hideLoginBillingSection();

    billing.autoSubmitCreateAccount(null, function (_featuresFormstash, _ccFormstash) {
        billing.submitPayment();
    });
};


billing.postConfirmationLoadedCallback = function () {
    if (!billing.ajaxPage) {
        return;
    }

    $('#createaccount').empty();
    $('#enhanceplan').empty();
    billing.hidePaymentMethods();
    billing.clearSubTitle();
    $("html, body").animate({scrollTop: 0}, "fast");

    if ($.isFunction(billing.callbacks.postConfirmationLoaded)) {
        billing.callbacks.postConfirmationLoaded();
    }
};

/* Utility functions to show/hide sections and change contents */
billing.showPaymentMethods = function () {
    $('#paymentMethods').show();
};

billing.hidePaymentMethods = function () {
    $('#paymentMethods').hide();
};

billing.showFreeTrial = function () {
    $('#freeTrial').show();
};

billing.hideFreeTrial = function () {
    $('#freeTrial').hide();
};

billing.setPageTitle = function (pageTitle) {
    $('h1.pageTitle').html(pageTitle);
};

/* what happens when "next"/"continue" is clicked in the billing section */
billing.billingNextHook = function () {
    if ($('._passwordField').length == 0 || hs.util.validatePassword($('._passwordField'))) {
        var promise = util.checkPasswordStrength($('._passwordField').val(), 'ProSignup');
        promise.then(function (_result) {
            billing.callbacks.billingNext();
        }, function (_error) {
            billing.callbacks.billingNext();
        });
    } else {
        $('html, body').animate({scrollTop: $('._ajax-signup').offset().top}, 500);

        // Track invalid password entry
        billing.trackEvent(billing.trackingPrefix + '.user_details', 'invalid_user_details_entered', {value: 'password'});
    }
};

/* what happens when "next"/"continue" is clicked in the enhance plan section */
billing.enhancePlanNextHook = function () {
    $("html, body").animate({scrollTop: 0}, "fast");
    billing.callbacks.enhancePlanNext();
};

/* what happens when "create account"/"continue" is clicked in the create account section */
billing.createAccountNextHook = function () {
    $("html, body").animate({scrollTop: 0}, "fast");
    billing.callbacks.createAccountNext();
};

/* what happens when "enhance your plan" is clicked on the billing
 * confirmation/success page
 */
billing.confirmationEnhancePlan = function () {
    if (billing.ajaxPage && $.isFunction(billing.callbacks.confirmationEnhancePlan)) {
        billing.callbacks.confirmationEnhancePlan();
    } else {
        window.location = 'https://hootsuite.com/billing';
    }
};

billing.titles = {
    subtitle: {
        "billing": translation._("Enter your billing information - Secure") + '&nbsp;<span class="t-s link _feature _feature_why_credit_card">' + translation._("Why do we need this?") + '</span>',
        "enhance-plan": translation._("Enhance your plan to take advantage of more Pro features."),
        "create-account": translation._("Free for 30 days, then starting at %s/month"),
        "sidebar-price": translation._("then starting at %s/month")
    },
    confirmation: {
        "thank-you": translation._("Thank You")
    }
};

billing.getMonthlyPlanCharge = function () {
    var selectedCurrency = billing.getSelectedCurrency();
    if (typeof selectedCurrency === 'undefined' || selectedCurrency === null) {
        // fallback to USD if unable to fetch selected currency
        selectedCurrency = 'PRICING_USD';
    }

    if (typeof pricingService.pricingData !== 'undefined') {
        var yearlyPlanPrice =  pricingService.pricingData.planPricing.YEARLY[selectedCurrency];
        return yearlyPlanPrice / 12;
    } else {
        // if this happens make sure you have pricingService.pricingData object initialized before calling this function
        return undefined;
    }
};

billing.setSubTitle = function (subTitle) {
    var subtitleStr = billing.titles.subtitle[subTitle];

    var monthlyPlanCharge = billing.getMonthlyPlanCharge();
    // only show the message if we have a defined value for the monthly charge
    if (typeof monthlyPlanCharge !== 'undefined') {
        subtitleStr = subtitleStr.replace('%s', billing.getCurrencyAmountForDisplay(monthlyPlanCharge));
        var $subtitle = $('#sub-title');

        $subtitle
            .html(subtitleStr)
            .removeClass('u-displayNoneWeak');
    }

    billing.setSidebarPrice();
};

billing.setSidebarPrice = function () {
    var sidebarStr = billing.titles.subtitle['sidebar-price'];
    var monthlyPlanCharge = billing.getMonthlyPlanCharge();
    // only show the message if we have a defined value for the monthly charge
    if (typeof monthlyPlanCharge !== 'undefined') {
        sidebarStr = sidebarStr.replace('%s', billing.getCurrencyAmountForDisplay(monthlyPlanCharge));
        $('._sidebarPrice').html(sidebarStr);
    }
};

billing.clearSubTitle = function () {
    $('#sub-title').empty();
};

billing.setConfirmationBanner = function (conf) {
    $('._setBillingConfirmationBanner').html(billing.titles.confirmation[conf]);
};

/* called from postLoad -- load the billing step instead of the create account
 * step.
 */
billing.loadBillingStep = function (ccFormstash) {
    // execute the following when user comes to the page
    // logged in without valid aria acct.
    billing.populateBillingSection(billing.chosenPlanId, billing.updateBilling, ccFormstash, function () {
        $('#billing-section').show();
    });
    billing.setPageTitle(translation._("Billing Information"));
    billing.setSubTitle('billing');
};

/* load the enhance plan step */
billing.loadEnhancePlanStep = function (formstash) {
    billing.setPageTitle(translation._("Enhance Plan"));
    billing.setSubTitle('enhance-plan');
    billing.populateEnhancePlanSection(undefined /*planId*/, formstash, function () {
        $('#enhanceplan').show();
    });
};

billing.saveNextState = function (state) {
    // 30 day cookie
    $.cookie.create('billingstate', state, 30);
};

billing.callbacks = {
    billingStepNumber: 1,
    enhancePlanStepNumber: 2,

    postLoad: function () {
        billing.setPageTitle(translation._("Create Account in 3 Easy Steps"));

        billing.saveNextState('billing');
        billing.showSpinners = false;

        $('#billing-please-wait').show();

        billing.populateAllSections(billing.chosenPlanId, billing.updatebiling, undefined, function () {
            // Do not show a sub-title for the feature flows
            if (!_.contains(billing.productizedFeatures, $.cookie.read('signup_flow'))) {
                billing.setSubTitle('create-account');
            }
            $('.billing #createaccount, .billing #enhanceplan, .billing #billing-section').show();
            $('#billing-please-wait').hide();
            $('#memberSignupForm #email').focus();
        });
    },

    createAccountNext: function () {
    },

    billingNext: function () {
        billing.submitPaymentNotLoggedIn();
    },

    postConfirmationLoaded: function () {
        billing.setPageTitle(translation._("Start Using Hootsuite"));
        billing.setConfirmationBanner("thank-you");
    },

    confirmationEnhancePlan: function () {
        $('#billing-section').hide();
        billing.loadEnhancePlanStep(undefined);
    }
};

billing.postLoadHook = function () {
    /*
     * Allows different versions of the billing page to do different
     * things (hide/show things, etc) after billing page loads.
     */
    if (billing.memberLoggedIn) {
        var nextstate = $.cookie.read('billingstate');

        if (billing.billingHistory) {
            billing.populateBillingHistorySection();
        } else if (billing.updateBilling) {
            billing.populateBillingSection(billing.chosenPlanId, billing.updateBilling);
            $('.billing #billing-section').show();
        } else if (nextstate !== null) {
            // user is coming back from somewhere else.
            switch (nextstate) {
                case 'billing':
                    billing.loadBillingStep(undefined);
                    break;

                case 'enhance':
                    billing.loadEnhancePlanStep(undefined);
                    break;
            }
        } else {
            // if user's aria account is valid, show them plan options. otherwise invite them to fill out the billing form.
            // TODO: check billingpagestate (dunning etc)
            if (billing.ariaAcctValid) {
                billing.populateEnhancePlanSection(billing.chosenPlanId, undefined, function () {
                    $('.billing #enhanceplan').show();
                });
            } else {
                billing.populateBillingSection(billing.chosenPlanId, billing.updateBilling, undefined, function () {
                    $('.billing #billing-section').show();
                });
            }
        }

    } else {
        billing.callbacks.postLoad();
    }
};

billing.ajaxSignUp = function (successCallback) {
    var createAccountDiv = $('.billing #createaccount');

    var featuresFormstash = $('#featuresForm').formValues();
    var ccFormstash = $('#ccForm').formValues();
    var postData = $("#memberSignupForm").serialize();
    var currency = billing.currency.determined;

    // clear form errors
    $('.ajax-signup .formError').empty();

    // additional post data
    postData += "&addHsuOption=" + billing.addHsuOption;

    if (currency) {
        // get user's chosen currency
        postData += '&currency=' + currency;
    }

    postData += "&planBillingPeriod=" + billing.billingPeriod + "&member%5BariaBillingPeriod%5D=" + billing.billingPeriod;

    ajaxCall({
        type: 'POST',
        url: "/ajax/member/ajax-signup",
        data: postData,
        success: function (data) {
            if (data.success == '1') {
                if (data.output) {
                    createAccountDiv.empty().html(data.output);
                }

                if ($.isFunction(successCallback)) {
                    successCallback(featuresFormstash, ccFormstash);
                }

                /*
                 * Update the billing form with the new member's aria session code
                 * and the new session id returned by the server
                 */
                $('input[name=inSessionID]').val(data.ariaSessionCode);
                featuresFormstash = ccFormstash = null;
                billing.memberLoggedIn = true;
            }
            else {
                billing.showLoginBillingSection();
                billing.removeThrobbers();
                // Just show the form errors:
                // error, so the regenerated token must be placed into the form:
                $("#memberSignupForm input[name='token']").val(data.token);
                if (data.error) {
                    // Redirects spammers
                    if (data.errorCode == 403) {
                        util.doRedirect('/security/unusual-activity');
                    }
                    if (data.memberInvalid) {
                        // this means that the e-mail address is already registered.
                        $('.ajax-signup input[id=email]').siblings('.formError').html(data.error);

                        billing.trackEvent(billing.trackingPrefix + '.user_details', 'email_address_already_registered');
                    } else {
                        // otherwise show the error before the signup form.
                        $('.ajax-signup .formError.generalError').html(data.error);
                    }

                }

                $("html, body").animate({scrollTop: $('.ajax-signup').offset().top}, 500);
            }
        }
    }, 'qmNoAbort');
};

billing.autoSubmitCreateAccount = function (eobj, signupSuccessCallback) {
    if (eobj != null) {
        eobj.stopPropagation();
    }

    // clear form errors
    $('.ajax-signup .formError').empty();

    // Check ajax-signup form for matching password/confirm-password.
    // If matching, and form completely filled out, submit it.

    var emailaddress = $('.ajax-signup input[id=email]').val();
    var fullname = $('.ajax-signup input[id=fullName]').val();
    var password = $('.ajax-signup input[id=password]').val();
    var hasError = false;

    var userTrackingErrors = [];

    if (!hs.util.isEmailValid(emailaddress)) {
        $('.ajax-signup input[id=email]').siblings('.formError').html(translation._("Please check e-mail address"));
        userTrackingErrors.push('email');
        hasError = true;
    }

    if (fullname === '') {
        $('.ajax-signup input[id=fullName]').siblings('.formError').html(translation._("Name cannot be empty"));
        userTrackingErrors.push('fullname');
        hasError = true;
    }

    if (password === '') {
        $('.ajax-signup input[id=password]').siblings('.formError').html(translation._("Password cannot be empty"));
        userTrackingErrors.push('password');
        hasError = true;
    } else if (password.length < 6 || password.length > 64) {
        $('.ajax-signup input[id=password]').siblings('.formError').html(translation._("Please enter 6 to 64 characters"));
        userTrackingErrors.push('password');
        hasError = true;
    }

    if (hasError) {
        billing.trackEvent(billing.trackingPrefix + '.user_details', 'invalid_user_details_entered', {value: userTrackingErrors.join(', ')});
    } else {
        // phew. we're OK! submit form!
        billing.ajaxSignUp(signupSuccessCallback);
        return true;
    }

    billing.showLoginBillingSection();
    billing.removeThrobbers();
    $("html, body").animate({scrollTop: $('.ajax-signup').offset().top}, 500);
    return false;
};

billing.populateAllSections = function (planId, updateBilling, formstash, successCallback) {
    var $targetDiv = $('._allSectionsAjax');

    if (billing.showSpinners) {
        $targetDiv.html(billing.spinnerHtml()).show();
    }

    ajaxCall({
        type: 'GET',
        url: "/ajax/billing/all-create-account-sections",
        data: "planId=" + planId + "&addHsuOption=" + billing.addHsuOption, // TODO sanitize
        success: function (data) {
            if (data.success == '1') {
                if (data.output) {
                    $targetDiv.empty().html(data.output);

                    window.initSignupForm($('#memberSignupForm'), ['input#password._passwordField', 'input#confirmPassword._confirmPasswordField'], function () {
                        if (hs.isFeatureEnabled('SIGNUP_CAPTCHA')) {
                            // Captcha is loaded and hidden before the sections are populated, move and show in signup section
                            $('div#captchaContainer').appendTo('form#memberSignupForm');
                            $('div#captchaContainer').show();
                        }
                    });
                }

                billing.checkCouponToken = data.checkCouponToken;

                billing.memberLoggedIn = data.isMemberLoggedIn;

                billing.showFreeTrial();
                billing.showPaymentMethods();
                billing.setSavePlanChangeButtonState();

                // billing.init sets billing.countryList and billing.stateList
                billing.populateCountry();

                // Initialize the plan billing period (monthly, annual) selectors
                billing.initPlanBillingPeriodSelectors();

                // Initialize the plan payment type (cc, paypal) selectors
                billing.initPaymentType();

                billing.updatePrice();

                /* A biiit of a hack: the #ccForm formValues call can change the state/province part of the DOM,
                 * so afterwards restore the billingStateContainer div (which contains only the state/province SELECT)
                 * using the entire formStash. Everything but the state/province value will be skipped.
                 */
                $('#ccForm').formValues(formstash);
                $('#billingStateContainer').formValues(formstash);

                if ($.isFunction(successCallback)) {
                    successCallback();
                }
            }
            else {
                $targetDiv.empty();
                hs.statusObj.update(translation._("Error retrieving create account forms."), 'error', true);
            }
        }
    }, 'qmNoAbort');

};

/**
 * @this {SliderComponent}
 */
billing.updateSeatsFeature = function (e) {
    var sliderWidget = $(this).data('sliderWidget');
    var sliderUpperLimit = sliderWidget.segmentMax();

    // Ensure the "seat requirement" warning is closed and the plan save button is enabled by default
    if (hs.bubblePopup.isOpen()) {
        hs.bubblePopup.close();
        billing.setSavePlanChangeButtonState();
    }

    billing.checkSeatRequirement(sliderWidget.value());

    // Show the max seats alert if the user selects the upper seat limit
    if (sliderWidget.value() === sliderUpperLimit) {
        $('._seatsFeatureAlert')
            .attr('aria-hidden', false)
            .show();
    } else {
        $('._seatsFeatureAlert')
            .attr('aria-hidden', true)
            .hide();
    }

    var $seatsInput = $('#seatsFeature').find('input[name="seats"]');
    $seatsInput.val(parseInt(sliderWidget.value(), 10));
    billing.updatePrice();

    if (e.type === 'sliderValueUpdated' && !e.initializing && !e.mouseMoving) {
        billing.trackEvent(billing.trackingPrefix + '.plan_features_section.additionalUsers', 'addon_value_changed', {value: e.value});
    }
};

billing.initSliders = function () {
    var $slider;

    // Create slider for Seats feature
    $slider = $('._sliderSeats');

    if ($slider.length) {
        $slider.on('sliderValueUpdated', billing.updateSeatsFeature);
        new SliderComponent($slider);
    }
};

billing.initAddonTracking = function () {
    $(document).on('change.addonTracking', '._featuresForm input[type=radio], ._featuresForm select, ._featuresForm input[type=checkbox]', function (e) {
        // By default, use the target name and value
        var $target = $(e.target);
        var addonName = $target.attr('name');
        var addonAction = 'addon_value_changed';
        var addonValue = e.target.value;

        switch (addonName) {
            case 'analyticsPro':
                addonName = 'analytics_pro';
                break;
            case 'publisherPro':
                addonName = 'publisher_pro';
                break;
            case 'prioritySupport': // aka HootCare
                addonName = 'hootcare';
                break;
            case 'owly': // aka Custom Vanity URL
                addonName = 'custom_vanity_url';
                break;
            case 'additionalSocialNetworks': // aka Additional Social Profiles
                addonName = 'additional_social_profiles';
                break;
            case 'hsuSeats[]':
                // The value is derived from the total number of enabled, selected seats
                addonName = 'enroll_in_hsu';
                addonValue = $('#hsuSeatsFeature input:checked:enabled').length;
                break;
        }

        billing.trackEvent(billing.trackingPrefix + '.plan_features_section.' + addonName, addonAction, {value: addonValue});
    });
};

billing.init = function () {
    hootbus.on('frontend.logging', function (level, category, message, data) {
        ajaxPromise({
            method: 'POST',
            url: '/ajax/error/frontend-logging',
            data: {
                level: level,
                category: category,
                message: message,
                additionalData: data
            }
        }, 'qm');
    });

    // If the country and state lists are populated initialize the form elements
    if (billing.countryList.length && !_.isEmpty(billing.stateList)) {
        billing.populateCountry();
    }

    if ($('._slider').length) {
        // Initialize sliders only if they exist
        billing.initSliders();
    }

    // Initialize tracking for all addons (excluding sliders, which are handled separately)
    billing.initAddonTracking();

    // Toggle visibility of Add-Ons
    $('._toggleAddOnsBtn').on('click', function () {
        $(this).toggleClass('x-active');
        $('._toggleAddOnsContent').toggleClass('u-displayNoneWeak');
    });

    // Determine the current billing state; if it doesn't exist set to unique undefined value
    billing.state = $('._mainContentArea').data('state') || 'undefinedState';

    // Define the default prefix for tracking events
    billing.trackingPrefix = 'web.billing.' + billing.state;

    billing.initPlanBillingPeriodSelectors();

    // Initialize the plan payment type (cc, paypal) selectors
    billing.initPaymentType();

    var seatsInputVal = $('#seatsFeature').find('input[name="seats"]').val();

    // Perform this check only if 'seatsInputVal' contains a valid value (ie - for current Pro users)
    if (!_.isUndefined(seatsInputVal)) {
        billing.checkSeatRequirement(seatsInputVal);
    }

    billing.updatePrice();

    $('#seatUpperLimitErroMsg').find('._close').click(function () {
        $('#seatUpperLimitErroMsg').hide();
    });
    plans.initFeatureInfoPopup();

};

/**
 * check team member requirement making sure upper limit is not exceeded, or min required is met
 */
billing.checkSeatRequirement = function (newValue) {
    newValue = parseInt(newValue, 10);

    var retVal = true;
    var $seatsInput = $('#seatsFeature').find('input[name="seats"]');
    var seatsData = $seatsInput.data();
    var minRequired = parseInt(seatsData['minimumRequired'], 10);
    var featureLimit = parseInt(seatsData['featureLimit'], 10);

    //if minRequired is greater than featureLimit, it means user is downgrading and have more team members than downgraded plan feature.
    if (minRequired > featureLimit) {
        if (newValue > featureLimit) {
            $('#seatUpperLimitErroMsg').show();
            $seatsInput.val(featureLimit);
        }

        billing.manageSeats();
        retVal = false;
    }
    else {
        if (newValue > featureLimit) {
            $seatsInput.val(featureLimit);
            $('#seatUpperLimitErroMsg').show();
            retVal = false;
        }
        else if (newValue < minRequired) {
            $seatsInput.val(minRequired);

            var sliderWidget = $('._sliderSeats').data('sliderWidget');

            if (sliderWidget !== undefined) {
                // Stop slider from dragging and set its value to the minimum required
                sliderWidget.stopDrag();
                sliderWidget.value(minRequired);
            }

            billing.manageSeats();

            retVal = false;
        }
    }

    return retVal;
};

billing.showBillingSection = function () {
    $('#billingSection').show();
    $('#featuresSummary').show();
    $('._featuresSection').hide();
};

billing.hideBillingSection = function () {
    $('#billingSection').hide();
    $('#featuresSummary').hide();
    $('._featuresSection').show();
};

/**
 * Extract an integer value from a form element
 * @param {jQuery} $input - jQuery input/select element
 * @private
 */
billing._getIntValue = function ($input) {
    if ($input.prop('tagName') === 'SELECT') {
        $input = $input.find('option:selected');
    }

    var value = parseInt($input.val(), 10);
    if ($input.length && !isNaN(value)) {
        return value;
    }
    return 0;
};

billing.setFeatureSubtotal = function (featureCode, unitPrice, subtotal) {
    var elementSelectors = {
        SEATS: ['#seatsFeature ._subtotal', '#seatsFeature ._numericPrice'],
        HSU_SEATS: ['#hsuSeatsFeature ._subtotal', '#hsuSeatsFeature ._numericPrice'],
        PRIORITY_SUPPORT: ['#hootcareFeature ._subtotal', '#hootcareFeature ._numericPrice'],
        PUBLISHER_PRO: ['#publisherProFeature ._subtotal', '#publisherProFeature ._numericPrice'],
        ANALYTICS_PRO: ['#analyticsProFeature ._subtotal', '#analyticsProFeature ._numericPrice'],
        OWLY_PRO: ['#brandFeature ._subtotal', '#brandFeature ._numericPrice'],
        MESSAGE_ARCHIVING: ['#archiveFeature ._subtotal', '#archiveFeature ._numericPrice'],
        ADDITIONAL_SOCIAL_NETWORKS: ['#additionalSocialNetworkFeature ._subtotal', '#additionalSocialNetworkFeature ._numericPrice']
    };

    var $subtotal = $(elementSelectors[featureCode][0]);
    var $numericPrice = $(elementSelectors[featureCode][1]);

    if (!subtotal) {
        $subtotal.html(billing.getCurrencyAmountForDisplay(billing.getCurrency.zero));
    } else {
        $subtotal.html(billing.getCurrencyAmountForDisplay(billing.roundCost(1 * subtotal)));
    }

    $numericPrice.html(billing.getCurrencyAmountForDisplay(billing.roundCost(1 * unitPrice)));
};

/**
 * Parse the html form into a hash of user selections for addon features
 */
billing.getSelectedFeatures = function () {
    var selectedFeatures;

    selectedFeatures = {
        // Additional Seats (this is in addition to the two free users)
        SEATS: this._getIntValue($('#seatsFeature input[name="seats"]')),

        // HSU Seats
        HSU_SEATS: $('#hsuSeatsFeature input:checked:enabled').length,

        // Owly Pro
        OWLY_PRO: $('#brandFeature').find('input[name="owly"]').prop('checked'),

        // Archiving
        MESSAGE_ARCHIVING: this._getIntValue($('#archiveFeature select[name="messageArchiving"]')),

        // Additional Social Networks
        ADDITIONAL_SOCIAL_NETWORKS: this._getIntValue($('#additionalSocialNetworkFeature select[name="additionalSocialNetworks"]'))
    };

    selectedFeatures.ANALYTICS_PRO = $('._feature_analyticsPro').find('input[name="analyticsPro"]').prop('checked') ? 1 : 0;

    // Apply the offsets
    _.each(selectedFeatures, function (amount, featureCode) {
        if (billing.featureAmountOffsets[featureCode]) {
            selectedFeatures[featureCode] += billing.featureAmountOffsets[featureCode];
        }
    });

    // Publisher Pro is dependent on number of users
    if ($('._feature_publisherPro').find('input[name="publisherPro"]').prop('checked') && selectedFeatures[billing.features.SEATS]) {
        selectedFeatures[billing.features.PUBLISHER_PRO] = selectedFeatures[billing.features.SEATS] - 1;
    } else {
        selectedFeatures[billing.features.PUBLISHER_PRO] = 0;
    }

    // HootCare is dependent on number of users
    if ($('#hootcareFeature').find('input[name="prioritySupport"]').prop('checked') && selectedFeatures[billing.features.SEATS]) {
        selectedFeatures[billing.features.PRIORITY_SUPPORT] = selectedFeatures[billing.features.SEATS] - 1;
    } else {
        selectedFeatures[billing.features.PRIORITY_SUPPORT] = 0;
    }

    return selectedFeatures;
};

billing.updateFeaturePrices = function (selectedFeatures, featurePrices) {
    var subtotal, unitPrice, planIncluded;
    var pricingProfile = {billingInterval: billing.billingPeriod};
    _.each(selectedFeatures, function (count, featureCode) {
        planIncluded = pricingService.getPlanBaseValues(featureCode).value;
        if (pricingProfile.billingInterval === PricingService.INTERVAL_YEARLY) {
            subtotal = featurePrices[PricingService.INTERVAL_YEARLY][featureCode] / 12;
            if (pricingService.isTieredFeature(featureCode)) {
                unitPrice = pricingService.getFeatureTier(featureCode, count - planIncluded, {billingInterval: PricingService.INTERVAL_YEARLY}).price / 12;
            } else {
                unitPrice = pricingService.getFeatureCost(featureCode, 1, {billingInterval: PricingService.INTERVAL_YEARLY}) / 12;
            }
        } else {
            subtotal = featurePrices[PricingService.INTERVAL_MONTHLY][featureCode];
            unitPrice = pricingService.getFeatureCost(featureCode, count + 1, {billingInterval: PricingService.INTERVAL_MONTHLY}) - subtotal;
        }
        billing.setFeatureSubtotal(featureCode, unitPrice, subtotal);
    });
};

/**
 * Offset the feature amounts we send to PricingService
 */
billing.featureAmountOffsets = {
    SEATS: 2,
    MESSAGE_ARCHIVING: 1,
    ADDITIONAL_SOCIAL_NETWORKS: 5
};

billing.showOnlySelectedDynamicFeatures = function (selectedFeatures) {
    // Show / hide the dynamic features in the billing section
    if (!$('#dynamicFeatures').length) {
        return;
    }

    var containerSelectors = {
        SEATS: '#dynamicFeatures ._seats',
        PRIORITY_SUPPORT: '#dynamicFeatures ._hootcare',
        OWLY_PRO: '#dynamicFeatures ._owlyPro',
        OWLY_ENTERPRISE: '#dynamicFeatures ._owlyEnterprise'
    };

    _.each(containerSelectors, function (selector, featureCode) {
        if (selectedFeatures[featureCode] - billing.featureAmountOffsets[featureCode]) {
            $(selector).show();
        } else {
            $(selector).hide();
        }
    });
};

// Currently Publisher, Analytics and Campaigns features have distinct signup flows
billing.updateFeaturePricingTotals = function (featureCode, planCostDetails, pricing) {
    var $featureSelector;

    if (featureCode === billing.features.PUBLISHER_PRO) {
        $featureSelector = $('._planAddonPublisherPro');
    } else if (featureCode === billing.features.ANALYTICS_PRO) {
        $featureSelector = $('._planAddonAnalyticsPro');
    }

    if (_.contains(['create_pro_account', 'current_free_upgrade'], billing.state)) {
        // Feature cost is rolled up into overall total for Immediate Pro Upgrade, Free to Pro flows
        if (billing.billingPeriod === PricingService.INTERVAL_YEARLY) {
            var annualFeatureProductCost;

            if (pricingService.isTieredFeature(featureCode)) {
                annualFeatureProductCost = pricingService.getFeatureTier(featureCode, 1, {billingInterval: PricingService.INTERVAL_YEARLY}).price;
            } else {
                annualFeatureProductCost = pricingService.getFeatureCost(featureCode, 1, {billingInterval: PricingService.INTERVAL_YEARLY});
            }

            var annualMonthlifiedFeatureProductCost = annualFeatureProductCost / 12;

            planCostDetails.annualMonthlifiedPlanCost += annualMonthlifiedFeatureProductCost; // Pro Upgrade subtotal
            planCostDetails.annualMonthlifiedTotalCost = planCostDetails.annualMonthlifiedPlanCost; // Free to Pro subtotal

            planCostDetails.annualTotalCost = planCostDetails.annualPlanCost + annualFeatureProductCost; // Both Flows total
        } else {
            var monthlyFeatureProductCost;

            if (pricingService.isTieredFeature(featureCode)) {
                monthlyFeatureProductCost = pricingService.getFeatureTier(featureCode, 1, {billingInterval: PricingService.INTERVAL_MONTHLY}).price;
            } else {
                monthlyFeatureProductCost = pricingService.getFeatureCost(featureCode, 1, {billingInterval: PricingService.INTERVAL_MONTHLY});
            }

            planCostDetails.monthlyPlanCost += monthlyFeatureProductCost; // Pro Upgrade subtotal
            planCostDetails.monthlySubtotal = planCostDetails.monthlyPlanCost; // Free to Pro subtotal

            planCostDetails.monthlyTotalCost = planCostDetails.monthlyPlanCost; // Both Flows total
        }
    } else if (billing.state === 'account_feature_addons') {
        // Feature add-on cost is shown below the total cost as a separate line item
        var planAddonFeatureProductCost = pricing[billing.billingPeriod][featureCode];

        if (billing.billingPeriod === PricingService.INTERVAL_YEARLY) {
            planAddonFeatureProductCost = planAddonFeatureProductCost / 12;
        }

        $featureSelector.find('._subTotal').html(billing.getCurrencyAmountForDisplay(billing.roundCost(planAddonFeatureProductCost)));
    }
};


// TODO: refactor into manageable fragments
billing.updatePrice = function () {
    if (!pricingService.isDataLoaded()) {
        // Need to wait for pricing data to load
        pricingService.fetchPricingData().then(_.bind(billing.updatePrice, billing));

        billing.showOnlySelectedDynamicFeatures(billing.featureAmountOffsets);
        return;
    }

    // Update the base pricingProfile
    _.extend(pricingService.pricingProfile, {
        currency: billing.currency.determined,
        billingInterval: billing.billingPeriod
    });

    var selectedFeatures = billing.getSelectedFeatures();
    var pricing = {};
    pricing[PricingService.INTERVAL_MONTHLY] = pricingService.calculateFeaturePricing(selectedFeatures, {billingInterval: PricingService.INTERVAL_MONTHLY});
    pricing[PricingService.INTERVAL_YEARLY] = pricingService.calculateFeaturePricing(selectedFeatures, {billingInterval: PricingService.INTERVAL_YEARLY});

    billing.updateFeaturePrices(selectedFeatures, pricing);
    billing.showOnlySelectedDynamicFeatures(selectedFeatures);

    var planCostDetails = {};
    planCostDetails.planCost = 0;
    planCostDetails.monthlySubtotal = 0;
    planCostDetails.grandTotal = 0;
    planCostDetails.totalCouponDiscount = 0;
    planCostDetails.totalTaxRate = $('#totalTaxRate').val();
    planCostDetails.monthlyPlanCost = pricingService.getPlanCost({billingInterval: PricingService.INTERVAL_MONTHLY});
    planCostDetails.monthlyFeatureSubtotal = _.reduce(pricing[PricingService.INTERVAL_MONTHLY], function (total, price) { return total + price; }, 0);
    planCostDetails.monthlyTotalCost = planCostDetails.monthlyPlanCost + planCostDetails.monthlyFeatureSubtotal;
    planCostDetails.annualPlanCost = pricingService.getPlanCost({billingInterval: PricingService.INTERVAL_YEARLY});
    planCostDetails.annualMonthlifiedPlanCost = planCostDetails.annualPlanCost / 12;
    planCostDetails.annualFeatureCost = _.reduce(pricing[PricingService.INTERVAL_YEARLY], function (total, price) { return total + price; }, 0);
    planCostDetails.annualTotalCost = planCostDetails.annualPlanCost + planCostDetails.annualFeatureCost;
    planCostDetails.annualMonthlifiedFeatureSubtotal = planCostDetails.annualFeatureCost / 12;
    planCostDetails.annualMonthlifiedTotalCost = planCostDetails.annualMonthlifiedPlanCost + planCostDetails.annualMonthlifiedFeatureSubtotal;
    planCostDetails.monthlySubtotal = planCostDetails.monthlyFeatureSubtotal + planCostDetails.monthlyPlanCost;

    // For Feature Products (Publisher Pro, Analytics) sign up and upgrade flows, add the feature cost to the monthly, annual totals
    var signupFeatureCode = $.cookie.read('signup_flow');

    if (_.contains(billing.productizedFeatures, signupFeatureCode)) {
        billing.updateFeaturePricingTotals(signupFeatureCode, planCostDetails, pricing);
    }

    if (billing.billingPeriod === PricingService.INTERVAL_YEARLY) {
        planCostDetails.planCost = planCostDetails.annualMonthlifiedPlanCost;
    } else {
        planCostDetails.planCost = planCostDetails.monthlyPlanCost;
    }

    var $couponContainer = $('._totalCouponContainer');
    var $couponSubtotal = $couponContainer.find('._totalCoupons');

    pricing[billing.billingPeriod]['HOOTSUITE_PRO'] = planCostDetails.planCost;

    _.each(billing.activeCoupons, function (coupon) {
        planCostDetails.totalCouponDiscount += pricingService.calculateTotalCouponDiscount(planCostDetails.planCost, pricing[billing.billingPeriod], coupon);
    });

    if (planCostDetails.totalCouponDiscount > 0) {
        $couponContainer.show();
        $couponSubtotal.html('-' + billing.getCurrencyAmountForDisplay(billing.roundCost(planCostDetails.totalCouponDiscount)));
    }

    planCostDetails.monthlySubtotal -= planCostDetails.totalCouponDiscount;

    // Savings
    if (billing.billingPeriod === PricingService.INTERVAL_YEARLY) {
        var annualTotalCouponDiscount = (planCostDetails.totalCouponDiscount * 12);
        planCostDetails.grandTotal = planCostDetails.annualTotalCost - annualTotalCouponDiscount;
    } else {
        // Because paid apps are always billed monthly, they are included in the monthly total in monthly-billed accounts.
        planCostDetails.grandTotal = planCostDetails.monthlyTotalCost - planCostDetails.totalCouponDiscount + billing.getMonthlyAppsSubtotal();
    }

    // Taxes
    if (planCostDetails.totalTaxRate) {
        var taxAmount = planCostDetails.grandTotal * planCostDetails.totalTaxRate;
        planCostDetails.grandTotal += taxAmount;
        $('#totalTax').html(billing.getCurrencyAmountForDisplay(billing.roundCost(taxAmount)));
        $('#totalTax2').html(billing.getCurrencyAmountForDisplay(billing.roundCost(taxAmount)));
    }

    var $dynamicFeatures = $('#dynamicFeatures');

    var planSubtotalTitle = translation._("Monthly sub-total");
    var $planSubtotalTitle = $dynamicFeatures.find('._subtotalTitle');
    var $planTotalTitle = $dynamicFeatures.find('._totalTitle');
    var legalNoticePeriod;

    if (billing.billingPeriod === PricingService.INTERVAL_YEARLY) {
        var subtotalDiscountMessage = translation._("(save %s1)").replace('%s1', $planSubtotalTitle.data('annualDiscount'));
        planSubtotalTitle += ' <span class="-highlighted">' + subtotalDiscountMessage + '</span>';
        $planTotalTitle.html('<strong>' + translation._("Annual total") + '</strong>');
        legalNoticePeriod = ' annually';

    } else {
        $planTotalTitle.html('<strong>' + translation._("Monthly total") + '</strong>');
        legalNoticePeriod = ' monthly';
    }

    $planSubtotalTitle.html(planSubtotalTitle);

    $('#providedSeatsFeature ._planCost').html(billing.getCurrencyAmountForDisplay(billing.roundCost(planCostDetails.planCost))); // Subtotal
    $dynamicFeatures.find('._totalCost').html(billing.getCurrencyAmountForDisplay(billing.roundCost(planCostDetails.grandTotal))); // Total

    // Free to Pro Upgrade subtotals
    $('#monthlySubTotal').html(billing.getCurrencyAmountForDisplay(billing.roundCost(planCostDetails.monthlySubtotal))); // Monthly
    $('#monthlySubTotal2').html(billing.getCurrencyAmountForDisplay(billing.roundCost(planCostDetails.annualMonthlifiedTotalCost))); // Annual

    // Free to Pro Upgrade totals
    $('#totalCost').html(billing.getCurrencyAmountForDisplay(billing.roundCost(planCostDetails.grandTotal))); // Monthly Total
    $('#totalCost2').html(billing.getCurrencyAmountForDisplay(billing.roundCost(planCostDetails.grandTotal))); // Annual Total

    // Legal Notice
    var legalPriceWithSymbol = billing.getCurrencyAmountForDisplay(billing.roundCost(planCostDetails.grandTotal));
    // L10N: %s1 represents the plan cost, given monthly or annually
    var legalPricingText = translation._('%s1' + legalNoticePeriod).replace('%s1', legalPriceWithSymbol);
    $('._legalPricing').html(legalPricingText);

};

/**
 * billing.switchToAnnual
 *
 * Method to switch over to Annual Billing.
 *
 * @returns {boolean}
 */
billing.switchToAnnual = function () {
    // Do not track when initializing the plan selection state
    $('._bundleSelector ._planSelectionAnnual').trigger({type: 'click', excludeTracking: true});

    return false;
};

/**
 * billing.initPlanBillingPeriodSelectors
 *
 * Bootstraps packages and sets up event handlers for bundle selectors
 */
billing.initPlanBillingPeriodSelectors = function () {
    var $bundleSelector;

    $bundleSelector = $('._bundleSelector');

    // Handle Monthly / Yearly plan click
    $bundleSelector.on('click', '._planSelection', function (event) {
        var $input;
        var newPlanPeriod = $(event.target).data('planId');

        $input = $bundleSelector.find('._planBillingPeriod');

        $input.val(newPlanPeriod);
        billing.updatePlanBillingPeriod($input[0]);

        $bundleSelector.find('._planSelection').removeClass('selected');
        $(event.target).addClass('selected');

        if (event.excludeTracking !== true) {
            billing.trackEvent(billing.trackingPrefix + '.billing_cycle', 'billing_cycle_clicked', {value: newPlanPeriod.toLowerCase()});
        }
    });

    // If Free to Pro Upgrade flow, default to ANNUAL billing
    if (billing.state === 'current_free_upgrade') {
        billing.switchToAnnual();
    }
};

/**
 * Event tracking on payment type change
 */
billing.initPaymentType = function () {
    $('#ccForm input[name="paymentType"]').click(function (e) {
        billing.trackEvent(billing.trackingPrefix + '.payment_details', 'payment_method_clicked', {value: e.target.value});
    });
};

/**
 * @deprecated in favor of See hs-app-billing/src/components/invoice-history/invoice-history-plugin.jsx
 */
billing.showHistoryInvoice = function (invoiceId) {
    // by only passing invoice number (and not account number) user can only for sure access invoices that belong to them
    var newwindow = window.open(hs.c.rootUrl + '/show-history-invoice?id=' + invoiceId, 'Invoice', 'height=700,width=790,toolbar=no,menubar=yes,status=no,location=no,directories=no');
    if (window.focus) {
        newwindow.focus();
    }
};

billing.showPaidCampaign = function (invoiceId, viewPostProcessed) {
    var url = hs.c.rootUrl + '/show-paid-campaign?id=' + invoiceId;
    if (viewPostProcessed) {
        url += '&viewPostProcessed=1';
    }
    var newwindow = window.open(url, 'Invoice', 'height=700,width=800,toolbar=no,menubar=yes,status=no,location=no,directories=no');
    if (window.focus) {
        newwindow.focus();
    }
};

billing.manageSeats = function () {
    var planId = $("#featuresForm input[name='planId']").val();
    ajaxCall({
        type: 'GET',
        url: "/ajax/billing/billing-manage-seats?planId=" + planId + "&n=" + $("#seatsFeature input[name='seats']").val(),
        success: function (data) {
            var $target;

            // Disable the save plan button
            billing.setSavePlanChangeButtonState(true);

            $target = $('._sliderSeats');

            if ($target.length) {
                // Show active team member error as a popup
                hs.bubblePopup.open($target, null, null, function () {
                    hs.bubblePopup.setContent(data.output);
                    $('._billingManageSeatAlert ._close').click(function () {
                        hs.bubblePopup.close();
                        billing.setSavePlanChangeButtonState();
                    });
                }, {
                    width: 300,
                    autoclose: false
                });
            }
        },
        error: function () {
            billing.setSavePlanChangeButtonState();
            hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
        }
    }, 'qmNoAbort');
};

billing.cancelPayment = function () {
    if (confirm("Are you sure you want to cancel this payment? Your account will be set back to Free plan!")) {
        window.location = hs.c.rootUrl + '/member/cancel-payment';
    }
    return false;
};

billing.addFeature = function (featureId, value, callback, itemId, notice) {
    ajaxCall({
        type: 'POST',
        url: "/ajax/billing/billing-change-feature",
        data: "featureId=" + featureId + "&value=" + value + "&itemId=" + itemId,
        success: function (data) {
            if (data.success == '1') {
                $('#featureAccessDeniedPopup').dialog('close');
                notice = notice || translation._("Added feature");
                hs.statusObj.update(notice, 'success', true);

                $.isFunction(callback) && callback();
            }
            else {
                hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
            }

        },
        error: function () {
            hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
        }
    }, 'qmNoAbort');
};

billing.deleteOrganization = function (orgId, callback) {
    ajaxCall({
        type: 'DELETE',
        url: "/ajax/organization/delete?organizationId=" + orgId,
        success: function (data) {
            if (data.success == '1') {
                hs.statusObj.update(translation._("Deleted organization"), 'info', true);

                $.isFunction(callback) && callback();
            }
            else {
                hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
            }

        },
        error: function () {
            hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
        }
    }, 'qmNoAbort');
};

billing.focusCC = function () {
    $('#ccForm input[name="paymentType"][value="cc"]').attr('checked', 'checked');
};

/**
 * @deprecated in favor of hs-app-bililng/src/utils/validation.jsx
 */
billing.checkCCNum = function (element) {
    var $element = $(element),
        num = $element.val(),
        $errorField = $element.closest('form').find('._ccNumError');
    num = num.replace(/[ -]/g, '');

    if (!billing.testCCNum(num)) {
        $errorField.html(translation._("Invalid Credit Card Number"));
    }
    else {
        $errorField.html('');
    }
};

/**
 * @deprecated in favor of hs-app-bililng/src/utils/validation.jsx
 */
billing.testCCNum = function (num) {
    var matchFound = false;

    // Visa: length 16, prefix 4
    var visaRe = /^4\d{15}$/;

    // Mastercard: length 16, prefix 51-55
    var mcRe = /^5[1-5]\d{14}$/;

    // American Express: length 15, prefix 34 or 37.
    var amexRe = /^3[4,7]\d{13}$/;

    // Discover: length 16, prefix 6011
    var discRe = /^6011\d{12}$/;

    // JCB: length 16, prefix 35, or length 15 with prefix 2131 or 1800
    var jcbRe = /^(?:2131|1800|35\d{3})\d{11}$/;

    var tests = new Array(visaRe, mcRe, amexRe, discRe, jcbRe);

    for (var i = 0; i < tests.length; i++) {
        if (num.match(tests[i])) {
            matchFound = true;
            break;
        }
    }

    return matchFound;
};

/**
 * @deprecated in favor of hs-app-billing/src/utils/validation.jsx
 */
billing.validateCCExpiryDate = function () {
    // Reset the credit card date error field
    var $errorField = $('._ccExpiryDateError');
    $errorField.html('');

    if (!billing.isCCExpiryDateValid()) {
        $errorField.html(translation._("Credit Card date cannot be in the past"));
    }
};

/**
 * @deprecated in favor of hs-app-billing/src/utils/validation.jsx
 */
billing.isCCExpiryDateValid = function () {
    var ccExpMonth = parseInt($('#cc_exp_mm').val(), 10);
    var ccExpYear = parseInt($('#cc_exp_yyyy').val(), 10);

    // If both the Month and Year CC fields contain values verify the date is not in the past
    if (!_.isNaN(ccExpMonth) && !_.isNaN(ccExpYear)) {
        var date = new Date();
        var currMonth = date.getMonth() + 1; // Jan == 0, we need a range of: 1 - 12
        var currYear = date.getFullYear();

        // The year is incremented automatically so we only need to test the case
        // where the month is less than the current month, for the current year
        if (ccExpMonth < currMonth && ccExpYear === currYear) {
            return false;
        }
    }

    return true;
};

/**
 * @deprecated in favor of hs-app-billing/src/utils/validation.jsx
 */
billing.checkCVV = function (element) {
    var $element = $(element),
        cvv = $element.val(),
        $errorField = $element.closest('form').find('._cvvError');

    $errorField.html('');
    if (cvv.length > 0) {
        if (cvv.length < 3 || cvv.length > 4 || isNaN(cvv)) {
            $errorField.html(translation._("CVV code must be 3 or 4 digits"));
        }
    }
};

billing.populateHsuLink = function (hsuData) {
    if (hsuData != null) {
        $('span.hsulink').show();
    }
};

billing.removeThrobbers = function () {
    hs.throbberMgrObj.remove('#ccForm span.btn-cmt');
    hs.throbberMgrObj.remove('#ccForm span.btn-cta');
    hs.throbberMgrObj.remove('#submitPaymentBtn');
    hs.throbberMgrObj.remove('._submitSignup');
    $('#submitPaymentBtn').removeClass('btn-cta-throbber');
};

billing.showBillingErrorMessages = function (errorArray) {
    var text = $.map(errorArray, function (msg) {
        return '<li class="error">' + msg + '</li>';
    }).join('');

    $('._billingErrorMessages').html(text).show();
};

billing.showLoginBillingSection = function () {
    $('.billing #createaccount, .billing #enhanceplan, .billing #billing-section').show();

    this.showSpinners = true;

    $('._loadingBillingTitle').show();
    $('._waitLoadingMessageTitle, ._waitLoadingMessageDescription, #billing-please-wait').hide();
};

billing.hideLoginBillingSection = function () {
    $('.billing #createaccount, .billing #enhanceplan, .billing #billing-section').hide();

    $('html, body').animate({scrollTop: 0}, "fast");

    this.showSpinners = false;

    $('._loadingBillingTitle').hide();
    $('._waitLoadingMessageTitle, ._waitLoadingMessageDescription, #billing-please-wait').show();
};
billing.confirmationLoaded = function (data) {
    if (data.errorMessages && data.errorMessages.length > 0) {

        if (data.validationFailed) {
            $('#billingZipContainer').show();
        }

        if (data.errorTrackEvents && data.errorTrackEvents.length > 0) {
            $.map(data.errorTrackEvents, function (trackObj) {
                hs.trackEvent(trackObj);
            });
        }

        var $billingErrMsgDiv = $('._billingErrorMessages');

        if ($billingErrMsgDiv.length) {
            billing.showBillingErrorMessages(data.errorMessages);
            billing.removeThrobbers();
            billing.showLoginBillingSection();
            $('html,body').animate({scrollTop: $billingErrMsgDiv.offset().top}, 500);
        }
    } else if (data.success) {
        var postData = data;

        var $partnerProTrialCheck = billing.readCookie('partner_pro_trial_billing_start');

        if ($partnerProTrialCheck == 1) {
            ajaxCall({
                type: 'POST',
                url: "/ajax/member/partner-pro-trial-billing-complete",
                success: function (data) {
                    if (data.success == '1') {
                        billing.createCookie('partner_pro_trial_billing_start', '', -1);
                    }
                },
                complete: function () {
                    // Perform add-on page redirect only for the signup flows (Pro Immediate, Free to Pro)
                    if (!billing.doAddonsRedirect(postData)) {
                        // If no redirect is performed call the post conf callback
                        billing.doPostConfirmationCleanup(postData);
                    }
                }
            }, 'qmNoAbort');
        } else {
            // Perform add-on page redirect only for the signup flows (Pro Immediate, Free to Pro)
            if (!billing.doAddonsRedirect(postData)) {
                // If no redirect is performed call the post conf callback
                billing.doPostConfirmationCleanup(postData);
            }
        }
    }
};

billing.doPostConfirmationCleanup = function (data) {
    // Scroll to the top of the page
    $("html, body").animate({scrollTop: 0}, "fast");

    // Payment was successfully processed; hide billing form and payment message, show success area
    $('#ccForm').hide();
    $('._payment').hide();
    $('#ccSuccess').show();

    // Hide the billing period selector buttons
    $('._bundleSelector').hide();

    billing.hidePaymentMethods();

    if ($.isFunction(billing.postConfirmationLoadedCallback)) {
        billing.postConfirmationLoadedCallback();
    }

    billing.ariaAcctValid = 1;
    billing.populateHsuLink(data.hsuData);
};

billing.doAddonsRedirect = function (data) {
    // Only redirect if we're completing a signup flow (Immediate Pro, Free to Pro Upgrade)
    if (!billing.signupPlanId) { return false; }

    // Redirect to the new feature add-ons page
    if (billing.signupPlanId === data.plans.free) {
        // Track Free to Pro sign up in Google Analytics
        hs.track('/ga/signup-complete/pro-upgrade');

        // Search the url query string for a billing campaign param
        var params = util.parseQueryString(window.location.search);

        if (params.c) {
            // For all campaigns redirect to '/billing' without going through the add-ons flow
            util.doRedirect('/billing');
        } else {
            // Free to Pro Upgrade flow
            util.doRedirect('/account-feature-addons?origin=billing_free_to_pro');
        }
    } else {
        // Track Immediate Pro sign up in Google Analytics
        hs.track('/ga/signup-complete/pro-immediate');

        // Immediate Pro flow (default)
        util.doRedirect('/account-feature-addons?origin=billing_pro_signup');
    }

    return true;
};

billing.recordPaymentAction = function () {
    if (!billing.ajaxPage) {
        return;
    }
};

billing.recordBillingCancel = function () {
    if (!billing.ajaxPage) {
        return;
    }
};

billing.recordEnhancePlanCancel = function () {
    if (!billing.ajaxPage) {
        return;
    }
};

// Return false if any problems found with the CC billing form. Return true if
// it's OK to submit it.
billing.checkCCForm = function () {
    var errors = [];

    var $billingForm = $('._billingForm');

    // CC form doesn't matter when payment type is paypal, so don't check it HS-2209
    var selectedPaymentType = $billingForm.find('input[name="paymentType"]:checked').val();

    if (selectedPaymentType === 'paypal') {
        return true;
    }

    var $billingAddress = $('._billingAddress');
    var $postalCode = $billingAddress.find('._billingZip');

    var ccnum;
    var ccexpMonth;
    var ccexpYear;
    var cvv;
    var billingCountry;
    var billingZip;
    var billingState;

    ccnum = $billingForm.find('#cc_no').val();
    ccexpMonth = $billingForm.find('#cc_exp_mm').val();
    ccexpYear = $billingForm.find('#cc_exp_yyyy').val();
    cvv = $billingForm.find('#cvv').val();
    billingCountry = $billingAddress.find('._billingCountry').val();
    billingZip = $postalCode.val();
    billingState = $billingAddress.find('._billingState').val();

    // only numbers and spaces
    var ccRegex = /^[\d\s]+$/;

    var trackingErrors = {};
    trackingErrors.payment = [];
    trackingErrors.address = [];

    if (ccnum.length < 15 || !ccnum.match(ccRegex)) {
        errors.push(translation._("Please enter a valid credit card number."));
        trackingErrors.payment.push('cc_number');
    }

    if (ccexpMonth === '') {
        errors.push(translation._("Please choose credit card expiry month."));
        trackingErrors.payment.push('cc_month');
    }

    if (ccexpYear === '') {
        errors.push(translation._("Please choose credit card expiry year."));
        trackingErrors.payment.push('cc_year');
    }

    if (!billing.isCCExpiryDateValid()) {
        errors.push(translation._("Please enter a valid credit card date."));
        trackingErrors.payment.push('cc_date');
    }

    if (cvv.length < 3 || cvv.length > 4 || isNaN(cvv)) {
        errors.push(translation._("Please enter a valid CVV."));
        trackingErrors.payment.push('cc_cvv');
    }

    if (billingCountry === '') {
        errors.push(translation._("Please choose a Country."));
        trackingErrors.address.push('country');
    }

    if (billingState === '') {
        errors.push(translation._("Please choose a State or Province."));
        trackingErrors.address.push('state_province');
    }

    if ((billingCountry === 'US' || billingCountry === 'CA') && billingZip === '') {
        errors.push(translation._("Please enter a valid Zip/Postal code."));
        trackingErrors.address.push('zip_postal_code');
    }

    if (errors.length > 0) {
        $("html, body").animate({scrollTop: $('#billingSection').offset().top}, 'fast');

        if (trackingErrors.payment.length) {
            billing.trackEvent(billing.trackingPrefix + '.payment_details', 'invalid_payment_details_entered', {value: trackingErrors.payment.join(', ')});
        }

        if (trackingErrors.address.length) {
            billing.trackEvent(billing.trackingPrefix + '.address_details', 'invalid_address_details_entered', {value: trackingErrors.address.join(', ')});
        }

        billing.showBillingErrorMessages(errors);
        return false;
    }

    return true;
};

billing.submitPayment = function (callback) {
    if ($('#submitPaymentBtn').hasClass('btn-cta-throbber')) {
        return;
    }

    if ($('._billingAddress ._billingZip').data('validated') === false) {
        billing.validationBlockedSignup();
        return;
    }

    var $country = $('._billingCountry'),
        $state = $('._billingState'),
        $zip = $('._billingZip'),
        $addressValidated = $('._addressValidated');
    var ccFormExists = $('._billingForm').length;

    if (ccFormExists && !billing.checkCCForm()) {
        return;
    }

    $('#submitPaymentBtn').addClass('btn-cta-throbber');
    hs.throbberMgrObj.add('#submitPaymentBtn');

    // Store the signup plan id value; used to determine the redirect flow once the account has been created
    billing.signupPlanId = parseInt($.cookie.read('signup_plan_id'), 10) || 0;

    billing.createCookie("new_billing_period", billing.billingPeriod, 1 / 24); //one hour expiry cookie

    billing.recordPaymentAction();

    var postData = { country: $country.val(), state: $state.val(), zip: $zip.val(), v: $addressValidated.val() };

    // Submit a call to set the billing address and then if that's successful, submit the payment form
    ajaxCall({
        type: 'POST',
        url: '/ajax/billing/billing-save-address',
        data: postData,
        success: function (data) {
            var isSuccess = data.success == 1;

            if (callback) {
                callback(isSuccess);
                if (!isSuccess) { billing.removeThrobbers(); }
                return;
            }

            if (isSuccess) {
                $('#addressError').html('');

                if ($('#paypalRadio:checked').length > 0) {
                    billing.startPaypal();
                } else if (callback) {
                    callback(); // pci form doesn't have #AriaPay exposed
                } else {
                    $('#AriaPay').submit();
                    if ($('#featuresForm').length) {
                        $('#featuresForm').submit();
                    }
                }

            } else {
                billing.removeThrobbers();
                $('#addressError').html(translation._("Please verify that you have selected a valid Country."));
            }

        },
        error: function () {
            hs.statusObj.update(translation._("An error occurred while processing your request, please try again later. Your credit card was not charged."), 'error', true);
        }
    }, 'q1');

    var trackCat = 'Billing Signup Flow';
    if ($('#ccRadio:checked').length > 0) {
        trackCat = 'Start Free Trial';
    }
    hs.trackEvent({
        'category': trackCat,
        'action': $country.val() + '/' + $state.val(),
        label: $zip.val(),
        value: $('#authAttempts').val()
    });
};

/**
 * Include the Aria PCI JS library which initializes the payment form's action
 * and method to Aria's Direct Post endpoint:
 *    "Once inserted, [the library] searches for an HTML form with the ID "AriaPay"
 *     and overwrites the action with a defined URL and method to POST"
 *
 * For more details, see:
 * @link https://developer.ariasystems.net/UserDocumentation/01Aria_PCI_3.0_JavaScript_Tag_Implementation/01Implement_the_Aria_JavaScript_Tag
 *
 * For more details on Direct Post, see:
 * @link https://developer.ariasystems.net/UserDocumentation/Direct_Post_Payment_Handler
 *
 * Related tickets:
 * @link https://jira.hootsuitemedia.com/browse/BILLING-119
 * @link https://jira.hootsuitemedia.com/browse/HS-10357
 *
 * -------------------------------- CAUTION ---------------------------------
 *
 *  Keep this in sync with AriaBillingFormModal._initializeAriaDirectPostForm
 *  as defined in the Ads repo (hs-app-hsads).
 *
 * -------------------------------- CAUTION ---------------------------------
 */
billing.initializeBillingFormAction = function () {
    if (hs.env === 'production') {
        $.getScript("https://secure.ariasystems.net/api/ariaCHD.js", function () {
            window.aria.environmentId = 'prod';
            window.aria.submitPayment(); // this sets the form's action and method (bad naming)
        });
    } else {
        $.getScript("https://secure.future.stage.ariasystems.net/api/ariaCHD.js", function (_data) {
            window.aria.environmentId = 'future.stage';
            window.aria.submitPayment(); // this sets the form's action and method (bad naming)
        });
    }
};

billing.injectPciIframe = function (data) {
    var container = document.getElementById('pciPayFrame');
    var props = {
        language: hs.prefs.language,
        configMessage: {
            clientNumber: (data.clientNumber || 0).toString(),
            collectionAmount: (data.appPrice || 0).toString(),
            collectionGroupId: parseInt(data.collectionGroupId) || '', // dev won't have a value
            mode: data.ariaMode,
            sessionId: data.ariaSession
        },
        billingCountries: billing.countryList
    };
    ReactDOM.render(React.createElement(PciIFrame, props), container);
};

billing.startPaypal = function () {
    ajaxCall({
        type: 'GET',
        url: "/ajax/billing/billing-start-paypal",
        success: function (data) {
            if (data.success == '1') {
                // ensure user sees billing form when they come back from paypal
                billing.saveNextState('billing');
                // change the location based on returned data
                document.location.href = data.returnUrl + data.token;
            }
            else {
                hs.statusObj.update(translation._("An error occurred while processing your request, please try again later. Your PayPal account was not charged."), 'error', true);
            }
        },
        error: function () {
            hs.statusObj.update(translation._("An error occurred while processing your request, please try again later. Your PayPal account was not charged."), 'error', true);
        }
    }, 'qmNoAbort');
};

// Country / State stuff from Aria, modified heavily
billing.populateCountry = function () {
    var $country = $('._billingCountry');
    if ($country.length < 1) {
        return;
    }

    if ($country.find('option').length <= 0) {
        $country.append($('<option/>').attr('value', '').html(translation._("Select Country")))
            .val('');
    }

    $(billing.countryList).each(function (_index, optionArr) {
        $country.append($('<option/>').attr('value', optionArr[0]).html(optionArr[1]));
    });

    $country.val($country.attr('currval'));

    // Add tracking for country change event
    $country.off('change').on('change', billing.countryChanged);

    billing.countryChanged(null);
};

/**
 *
 * @param e - included on change events, expect a value for e.data.trackEvent to be set (to true) when triggered
 * @returns {boolean}
 */
billing.countryChanged = function (e) {
    var $country = $('._billingCountry'),
        $state = $('._billingState'),
        $label = $state.closest('p').find('label');

    if ($country.val() == 'US') {
        $label.html(translation._("State"));
    } else if ($country.val() == 'CA') {
        $label.html(translation._("Province"));
    } else {
        $label.html(translation._("State/Province"));
    }

    var $newElement;
    // State list exists, make a dropdown
    if (billing.stateList[$country.val()]) {
        $newElement = $('<select class="_billingState"/>');
        $.each(billing.stateList[$country.val()], function (i, optionArr) {
            $newElement.addClass('-select').append($('<option/>').attr('value', optionArr[0]).html(optionArr[1]));
        });
    }
    else // States are unknown, make a textbox
    {
        $newElement = $('<input type="text" class="_billingState -text" />');
    }

    if ($state.length > 0) {
        $newElement.attr('name', $state.attr('name'))
            .attr('id', $state.attr('id'))
            .val($state.val());
    }
    $state.replaceWith($newElement);

    if ($country.val() !== '') {
        $('#billingStateContainer').show();
        if ($country.val() === 'US' || $country.val() === 'CA') {
            $('#billingZipContainer').show();
        } else {
            $('#billingZipContainer').hide();
        }
    }

    if (e && e.type === 'change') {
        billing.trackEvent(billing.trackingPrefix + '.address_details', 'country_selected', {value: $country.val()});
    }

    return true;
};

billing.showCvvPopup = function () {
    open("https://secure.ariasystems.net/webclients/HootSuitePay/whatisCVV.php", "displayWindow", "top=40,left=50,width=480,height=200,scroll=auto");
    hs.trackEvent({
        'category': 'Billing Signup Flow',
        'action': 'Why CVV'
    });
};

billing.submitCoupon = function () {
    if ($('._submitCoupon').hasClass('btn-cta-throbber')) {
        return;
    }

    $('._submitCoupon').addClass('btn-cta-throbber');
    hs.throbberMgrObj.add('._submitCoupon', "<span class=\"btn-ts\">" + translation.c.LOADING + "</span>");

    $('#couponForm').submit();
};

billing.getAriaSessionInfo = function () {
    ajaxCall({
        type: 'GET',
        url: "/ajax/billing/billing-get-aria-session-info",
        success: function (data) {
            if (data.success == '1') {
                if (data.isAriaSessionValid) {
                    billing.initializeBillingFormAction();

                    $('input[name="inSessionID"]').val(data.ariaSession);
                    $('input[name="mode"]').val(data.ariaMode);
                    $('input[name="client_no"]').val(data.clientNumber);

                    if (data.ccSuffix) {
                        $("#cc_no").val('XXXXXXXXXXXX' + data.ccSuffix);
                    }

                    if (data.ccExpireMonth) {
                        $("#cc_exp_mm").val(data.ccExpireMonth);
                    }

                    if (data.ccExpireYear) {
                        $("#cc_exp_yyyy").val(data.ccExpireYear);
                    }

                    if (data.billingCountry) {
                        $('._billingCountry').val(data.billingCountry);
                        billing.countryChanged(null);

                        if (data.billingState) {
                            $('._billingState').val(data.billingState);
                        }
                    }

                    if (data.billingZip) {
                        $('._billingZip').val(data.billingZip);
                    }

                    // enable form fields and remove loader
                    $(".disabled").removeAttr('disabled').removeClass("disabled");
                    $(".fieldLoader").hide();

                    // after fields have been enabled add events; add tracking for country change event
                    $('._billingCountry').on('change', billing.countryChanged);

                    $("#submitPaymentBtn").bind('click', function () {
                        billing.submitPayment();
                        return false;
                    });
                } else {
                    $("#ccForm").hide();
                    $("#footer").hide();
                    $("#invalidAriaSession").show();
                }
            }
            else {
                $("#ccForm").hide();
                $("#footer").hide();
                $("#invalidAriaSession").show();
            }

        },
        error: function () {
            $("#ccForm").hide();
            $("#footer").hide();
            $("#invalidAriaSession").show();
        }
    }, 'q1');
};

billing.readCookie = function (name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
};

billing.createCookie = function (name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
};

billing.updatePlanBillingPeriod = function (element) {
    var planBillingPeriod = element.value;

    billing.billingPeriod = planBillingPeriod;
    billing.updatePrice();

    var $grandfatherYearlyNotification = $("div._grandfatherYearlyNotification");

    var currentPricingValue;

    if (planBillingPeriod == "YEARLY") {
        $("div._billingTotalsMonthly").hide();
        $("div._billingTotalsYearly").show();
        $grandfatherYearlyNotification.show();
        currentPricingValue = $('#totalCost2').text() + ' annually';
    } else {
        billing.billingPeriod = "MONTHLY";
        $("div._billingTotalsMonthly").show();
        $("div._billingTotalsYearly").hide();
        $grandfatherYearlyNotification.hide();
        currentPricingValue = $('#totalCost').text() + ' monthly';
    }

    // Legal Notice
    var legalPricingText = translation._(currentPricingValue);
    $('._legalPricing').html(legalPricingText);

};

billing.switchProBillingPeriod = function (redirectLocation) {
    // Submit a call to update billing period
    ajaxCall({
        type: 'POST',
        url: "/ajax/billing/switch-pro-billing-period",
        data: "billingPeriod=" + billing.billingPeriod,
        success: function (data) {
            if (data.success != '1') {
                billing.removeThrobbers();
                hs.statusObj.update(translation._("An error occurred while setting your billing interval. Select 'Enhance Your Plan' to verify the correct billing interval is set, and update if necessary."), 'error', true);
            }
            parent.location = redirectLocation;
        },
        error: function () {
            hs.statusObj.update(translation._("An error occurred while processing your request, please try again later. Your credit card was not charged."), 'error', true);
        }
    }, 'q1');
};


billing.initChangePlanTypePopup = function () {
    $('._upgradeDowngradeLinks, ._changePlanTypePopup').on('click', '._downgradeToFree', function () {
        util.recordAction('billingPageDowngradeClick');

        var toPlanId = 1;
        plans.downgradePlan(toPlanId);
    });
};

billing.validationBlockedSignup = function () {
    billing.trackEvent(
        billing.trackingPrefix + '.address_details',
        'validation_blocked_signup',
        {
            value: 'country: ' + $('._billingCountry').val() +
            ', province: ' + $('._billingState').val() +
            ', postalCode: ' + $('._billingZip').val()

        }
    );
};

/**
 * Gets the monthly cost of the user's paid apps.
 * If a user has no paid apps, this function will return 0.
 *
 * @returns {number}
 */
billing.getMonthlyAppsSubtotal = function () {
    return Number($('._monthlyAppsTotal').val()) || 0;
};

export default billing;

