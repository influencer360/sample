import $ from 'jquery';
import { logInfo } from 'fe-lib-logging';
window.plans = window.plans || {};
import translation from 'utils/translation';
import billing from 'billing';

var plans = window.plans;

plans.switchToTeamsPricingToken = plans.switchToTeamsPricingToken || '';

// Getter / Setter functions for initializing plan data
plans.setTeamsPricingToken = function (pricingToken) {
    this.switchToTeamsPricingToken = pricingToken || '';
    return this.switchToTeamsPricingToken;
};

plans.getTeamsPricingToken = function () {
    return this.switchToTeamsPricingToken;
};
// End: Getter / Setter functions for initializing plan data

var featureWidget = {
    onFeatureTipShow: function (e) {
        var activeClass = '';
        var $target, featureClass;

        activeClass = featureWidget.getFeatureClass($(this).get(0).className);
        $target = $(e.target);
        featureClass = '._featureTooltip';

        if (!$target.is(featureClass)) {
            $target = $target.closest(featureClass);
        }

        // Show the feature popup content for screen readers associated with the active control
        $target.next('._featureContent').attr('aria-hidden', 'false');

        if (plans.featureInfoTimeout) {
            clearTimeout(plans.featureInfoTimeout);
        }

        featureWidget.showFeatureHighlight(activeClass, $target);
    },
    onFeatureTipHide: function (e) {
        var activeClass, $target;

        activeClass = featureWidget.getFeatureClass($(this).get(0).className);
        $target = $(e.target);

        // Hide the feature popup content for screen readers associated with the active control
        $target.next('._featureContent').attr('aria-hidden', 'true');

        if (plans.featureInfoTimeout) {
            clearTimeout(plans.featureInfoTimeout);
        }
        plans.featureInfoTimeout = setTimeout(function () {
            featureWidget.hideFeatureHighlight(activeClass, $target);
        }, 200);
    },
    getFeatureClass: function (classNames) {
        var matches = /_feature_([^\s]+)/.exec(classNames);
        if (matches && matches.length > 1) {
            return matches[1];
        }
        return null;
    },
    showFeatureHighlight: function (activeClass, $target) {
        var $featureContent = $target.next('._featureContent');

        if (!$featureContent.length && !activeClass) {
            return;
        }

        var $featureInfoPopup = $("#featureInfoPopup").length ? $("#featureInfoPopup") : $('<div id="featureInfoPopup" style="display: none;"></div>');
        var featureInfoHtml;

        if ($featureContent.length) {
            featureInfoHtml = $featureContent.html();
            featureInfoHtml += '<span class="arrow left" />';
        }

        $featureInfoPopup.html(featureInfoHtml);

        if (featureInfoHtml.length) {
            setTimeout(function () {
                if (!$("#featureInfoPopup").length) {
                    $featureInfoPopup.appendTo('body');
                }

                var top = $target.offset().top - ($featureInfoPopup.outerHeight(true) / 2) + 10,
                    left = $target.offset().left + $target.outerWidth(true);

                if (left + $featureInfoPopup.outerWidth(true) > $(window).width()) {
                    left -= 100; // hack to move most of the popup into view
                }

                $featureInfoPopup
                    .css({
                        'top': top,
                        'left': left,
                        'position': 'absolute'
                    })
                    .fadeIn(100);
            }, 1);
        } else {
            $featureInfoPopup.fadeOut(100);
        }
    },
    hideFeatureHighlight: function () {
        $("#featureInfoPopup").fadeOut(100);
    }
};

plans.initFeatureInfoPopup = function () {
    var featureClass = '._featureTooltip';

    $(document)
        .on('hover, focus', featureClass, featureWidget.onFeatureTipShow)
        .on('mouseleave', featureClass, featureWidget.onFeatureTipHide)
        .on('blur, focusout', featureClass, featureWidget.onFeatureTipHide)

        .on('mouseenter', '#featureInfoPopup', function () {
            if (plans.featureInfoTimeout) {
                clearTimeout(plans.featureInfoTimeout);
            }
        })
        .on('mouseleave', '#featureInfoPopup', function () {
            if (plans.featureInfoTimeout) {
                clearTimeout(plans.featureInfoTimeout);
            }
            plans.featureInfoTimeout = setTimeout(function () {
                featureWidget.hideFeatureHighlight();
            }, 200);
        });
};

plans.startFeatureFreeTrial = function (featureId, callback) {
    ajaxCall({
        url: "/ajax/member/start-feature-free-trial?featureId=" + featureId,
        success: function (data) {

            if (data.success == 1) {
                $.isFunction(callback) && callback();
                hs.statusObj.update(translation._("Free trial started"), 'success', true);
            }
            else {
                hs.statusObj.update(translation._("Sorry, you are not eligible to start a free trial for this feature."), 'error', true);
            }

        }
    }, 'q1');
};

plans.downgradePlan = function (planId) {
    hs.statusObj.update(translation._("Checking feature usage..."), 'info');
    ajaxCall(
        {
            type: 'POST',
            url: "/ajax/member/downgrade-plan?planId=" + planId,
            success: function (data) {
                hs.statusObj.reset();

                if (data.loggedOut) {
                    window.location = hs.c.rootUrl + '/login';
                }

                if (data.invalidPlan) {
                    window.location = hs.c.rootUrl;
                }

                if (data.downgradeAnnualPlan) {
                    var resp = confirm(translation._("Your account will be downgraded once your billing cycle ends on %s. Do you wish to continue?").replace('%s', data.accountExpiration));
                    if (resp) {
                        ajaxCall(
                            {
                                type: 'POST',
                                url: "/ajax/member/downgrade-annual-billing?planId=" + planId,
                                success: function (data) {

                                    hs.statusObj.reset();

                                    if (data.loggedOut) {
                                        window.location = hs.c.rootUrl + '/login';
                                    }
                                    if (data.invalidPlan) {
                                        window.location = hs.c.rootUrl;
                                    }

                                    if (data.downgradeSuccess) {
                                        hs.statusObj.update(translation._("Your account will be downgraded on %s").replace('%s', data.accountExpiration), 'success', true);
                                        location.reload(false);
                                    } else {
                                        hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
                                    }
                                },
                                error: function () {
                                    hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
                                },
                                abort: function () {
                                    hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
                                }
                            },
                            'q1');
                    }
                }
                plans.numAllowedSocialNetworksForFreePlan = data.numAllowedSocialNetworksForFreePlan;

            },
            error: function () {
                hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
            },
            abort: function () {
                hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
            }
        },
        'q1'
    );
};

plans.forceDowngradeToFree = function () {
    var text = translation._("Are you sure you want to downgrade to a Free account? Doing so will immediately remove all Custom Analytics Reports, all Team Members and all but %s of your Social Profiles.");
    var answer = confirm(text.replace('%s', plans.numAllowedSocialNetworksForFreePlan));

    if (answer) {
        hs.statusObj.update(translation._("Plan downgrade in progress..."), 'info');
        ajaxCall({
            type: 'POST',
            url: '/ajax/member/force-downgrade-to-free',
            success: function (data) {
                hs.statusObj.reset();

                if (data.loggedOut) {
                    window.location = hs.c.rootUrl + '/login';
                }

                if (data.success) {
                    plans.save(1); // downgrade to free
                }
            },
            error: function () {
                hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
            },
            abort: function () {
                hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
            }
        }, 'q1');
    }
};

plans.initDowngradePlanPopup = function () {
    var $popup = $("._downgradePlanFancyBox");

    $("#changePlanActionButtons ._continue").click(function () {
        plans.save($popup.find('#planChangeContent').attr('newPlanId'));
        return false;
    });

    $("#changePlanActionButtons ._forceDowngrade").click(function () {
        plans.forceDowngradeToFree();
        return false;
    });

    $("#changePlanSection ._removeFeature").click(function () {
        var feature = $(this).closest('._featureSection').attr('featurecode'),
            newPlanId = $popup.find('#planChangeContent').attr('newPlanId'),
            reloadDowngradePopup = function () {
                plans.downgradePlan(newPlanId);
            },
            featureData = $(this).closest('._featureSection').attr('featuredata');

        if (feature == 'ORGANIZATIONS') {
            var orgId = featureData;
            billing.deleteOrganization(orgId, reloadDowngradePopup);
        }

        return false;
    });

    $("#changePlanSectionErrorMsg").hide();
};

plans.save = function (planId) {
    $('._changePlan [name="planId"]').val(planId);
    $('._changePlan').submit();
};

plans.enterprise = (plans.enterprise) ? plans.enterprise : {};
plans.enterprise.init = function () {
    plans.initFeatureInfoPopup();
};

plans.showTeamsPricingPopup = function () {
    logInfo('billing', 'teams-pricing-popup called', {
        memberId: window.hs.memberId,
        url: window.location.toString()
    });
    ajaxCall({
        type: 'POST',
        url: "/ajax/member/teams-pricing-popup",
        success: function (data) {
            hs.statusObj.reset();

            if (data.loggedOut) {
                window.location = hs.c.rootUrl + '/login';
            }

            if (data.output) {

                var $popup = $('._fancyTeamsPricingPopup');
                $popup.html(data.output);

            }
        },
        error: function () {
            hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
        },
        abort: function () {
            hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
        }
    }, 'q1');
};

plans.switchToTeamsPricing = function () {
    hs.statusObj.update(translation._("Switching pricing plan..."), 'info');
    ajaxCall({
        type: 'POST',
        url: '/ajax/member/start-teams-pricing?token=' + plans.switchToTeamsPricingToken,
        success: function (data) {
            if (data.loggedOut) {
                window.location = hs.c.rootUrl + '/login';
            }

            // Reload the page to load new pricing
            if (data.success) {
                window.location.reload(true);
            }
            else {
                hs.statusObj.reset();
            }

        },
        error: function () {
            hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
        },
        abort: function () {
            hs.statusObj.update(translation._("An error occurred while processing your request, please try again later"), 'error', true);
        }
    }, 'q1');
};

export default plans;

