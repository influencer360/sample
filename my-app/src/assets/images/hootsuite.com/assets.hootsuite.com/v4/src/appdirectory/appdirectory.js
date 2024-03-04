import $ from 'jquery';
import _ from 'underscore';
import featuredApps from 'appdirectory/featured-apps';
import hootbus from 'utils/hootbus';
import memberUtil from 'utils/member';
import translation from 'utils/translation';
import owly from 'owly';

const appdirectory = {};
let appdirectoryPaidAppId;

appdirectory.errors = {
    ACCOUNT_INACTIVE: '1',
    BILLING_MIGRATION: '2'
};

appdirectory.installPlugin = function (appPluginId, memberAppId) {

    ajaxCall({
        url: "/ajax/stream/add-app-plugin",
        data: 'appPluginId=' + appPluginId + '&memberAppId=' + memberAppId,
        success: function () {

            if (!$('#_appPlugin')) {
                $('body').append('<div id="_appPlugin" style="display: none;"></div>');
            }
            var $appPlugin = $('#_appPlugin');
            $appPlugin.append(window.appendAppPluginIFrame());

            hs.statusObj.update(translation._("App plugin successfully installed!"), 'success', true);

        }
    }, 'qm');
};

appdirectory.installApp = function (appId) {
    var $installBtn = $('#_app-install-btn-' + appId);
    $installBtn.removeAttr('onclick');

    ajaxCall({
        type: 'POST',
        url: "/ajax/appdirectory/install",
        data: 'appId=' + appId,
        success: function (data) {

            if (1 == data.success) {
                hootbus.emit('appdirectory:install:success', appId);
                window.loadAppDirectory('my-installed-apps', undefined, true);

                hs.statusObj.update(translation._("App installed successfully!"), 'success', true);

                var appPluginIds = data.appPluginIds.length;
                var pluginsInstalled = 0;

                if (appPluginIds > 0) {
                    pluginsInstalled = 1;
                    for (var i = 0; i < appPluginIds; i++) {
                        appdirectory.installPlugin(data.appPluginIds[i], data.memberAppId);
                    }
                }

                appdirectory.loadAppSettingsPopup(appId, 0, pluginsInstalled);
            }
            else {
                hs.statusObj.update(translation._("Failed to install app"), 'error', true);
            }
        }
    }, 'q1').fail(function (jqXHR) {
        hs.statusObj.update(JSON.parse(jqXHR.responseText).error, 'error', true);
    });

};

appdirectory.loadAppSettingsPopup = function (appId, isSetting, addedPlugins) {
    var appStreamsToBeAdded = [];
    var appPluginsAdded = addedPlugins;
    var title;
    var isContentApp = false;
    var isMediaLibraryApp = false;
    if (isSetting) {
        title = translation._("App Settings");
    } else {
        title = translation._("App Installed!");
    }

    var params = {
        modal: false,
        resizable: false,
        draggable: true,
        width: 366,
        closeOnEscape: true,
        position: ['center', 40],
        title: title,
        beforeClose: function () {
            if (isContentApp || isMediaLibraryApp) {
                return;
            }
            if (0 === appStreamsToBeAdded.length && 0 == appPluginsAdded && 0 == isSetting) {
                var confirmed = confirm(translation._("You have not added any streams or plugins for this app to your dashboard yet, Click OK if you still wish to close this dialog."));
                if (!confirmed) {
                    return false;
                }
            }
        },
        content: "<div class='large-loading'><img src='" + hs.util.rootifyImage('/dashboard/loaders/round-radial-lines-loader.gif') + "' /></div>"
    }, $popup = $.dialogFactory.create('userAppStreamPopup', params);

    ajaxCall({
        url: '/ajax/appdirectory/postinstall',
        data: 'appId=' + appId + '&isSetting=' + isSetting,
        success: function (data) {
            $popup.html(data.output);

            var $radioNew = $popup.find('._newTab');
            var $radioExisting = $popup.find('._existingTab');
            var $userTabsSelector = $popup.find('._userTabs');

            $radioNew.attr('checked', true);
            $userTabsSelector.hide();
            $radioNew.click(function () {
                $radioNew.attr('checked', true);
                $radioExisting.attr('checked', false);
                $userTabsSelector.hide();
            });
            $radioExisting.click(function () {
                $radioNew.attr('checked', false);
                $radioExisting.attr('checked', true);
                $userTabsSelector.show();
            });


            var $appStreamSection = $popup.find('._appStreamSection');
            var $appPluginSection = $popup.find('._appPluginSection');
            var $contentAppSection = $popup.find('._contentAppSection');
            var $mediaLibrarySection = $popup.find('._mediaLibrarySection');
            var $allSections = $popup.find('._section');

            var $appStreamTab = $popup.find('._appStreams');
            var $appPluginTab = $popup.find('._appPlugins');
            var $contentAppTab = $popup.find('._contentApp');
            var $mediaLibraryTab = $popup.find('._appMedia');
            var $allTabs = $popup.find('._tab');

            isContentApp = !!$contentAppTab.length;
            isMediaLibraryApp = !!$mediaLibraryTab.length;

            $appStreamTab.click(function () {
                $allTabs.removeClass('active');
                $allSections.css("display", "none");

                $appStreamTab.addClass('active');
                $appStreamSection.css("display", "block");
            });

            $appPluginTab.click(function () {
                $allTabs.removeClass('active');
                $allSections.css("display", "none");

                $appPluginTab.addClass('active');
                $appPluginSection.css("display", "block");
            });

            $contentAppTab.click(function () {
                $allTabs.removeClass('active');
                $allSections.css("display", "none");

                $contentAppTab.addClass('active');
                $contentAppSection.css("display", "block");
            });

            $mediaLibraryTab.click(function () {
                $allTabs.removeClass('active');
                $allSections.css("display", "none");

                $mediaLibraryTab.addClass('active');
                $mediaLibrarySection.css("display", "block");
            });

            if ($contentAppTab.length) {
                $contentAppTab.click();
            } else if ($appStreamTab.length) {
                $appStreamTab.click();
            } else if ($appPluginTab.length) {
                $appPluginTab.click();
            } else if ($mediaLibraryTab.length) {
                $mediaLibraryTab.click();
            }

            $popup.find('._addPlugin').click(function () {

                $popup.dialog('close');

            });

            $popup.find('._installPlugin').click(function () {

                var $installPluginButton = $(this);
                var appPluginId = $installPluginButton.attr('appPluginId');
                var memberAppId = $installPluginButton.attr('memberAppId');
                var memberAppPluginId = $installPluginButton.attr('memberAppPluginId');
                var isInstalled = $installPluginButton.attr('isInstalled');

                if (1 == isInstalled) {

                    ajaxCall({
                        url: "/ajax/stream/remove-app-plugin",
                        data: 'memberAppPluginId=' + memberAppPluginId,
                        success: function (data) {


                            if (data.apiKey in window.jsapi.apps) {
                                if (memberAppPluginId in window.jsapi.apps[data.apiKey]) {
                                    delete window.jsapi.apps[data.apiKey][memberAppPluginId];
                                }
                            }


                            $installPluginButton.html('Add');
                            $installPluginButton.attr("memberAppPluginId", "");
                            $installPluginButton.attr("isInstalled", 0);

                            if ("APP_" + memberAppPluginId in window.jsapi.appSelectorList) {

                                delete window.jsapi.appSelectorList["APP_" + memberAppPluginId];

                            }

                            hs.statusObj.update(translation._("App plugin successfully removed!"), 'success', true);

                            appPluginsAdded--;
                        }
                    }, 'qm');

                } else {
                    ajaxCall({
                        url: "/ajax/stream/add-app-plugin",
                        data: 'appPluginId=' + appPluginId + '&memberAppId=' + memberAppId,
                        success: function (data) {

                            if (!$('#_appPlugin')) {
                                $('body').append('<div id="_appPlugin" style="display:none;"></div>');
                            }
                            var $appPlugin = $('#_appPlugin');

                            $appPlugin.append(window.appendAppPluginIFrame(data));
                            $installPluginButton.html('Remove');
                            $installPluginButton.attr("memberAppPluginId", data.memberAppStreamId);
                            $installPluginButton.attr("isInstalled", 1);

                            hs.statusObj.update(translation._("App plugin successfully installed!"), 'success', true);

                            appPluginsAdded++;
                        }
                    }, 'qm');

                }

            });


            $popup.find('._finishBtn').click(function () {

                var $tab = $popup.find('._tab.active');
                var options = {};
                options.promises = [];
                var usePromise = false;
                if ($tab.hasClass('_contentApp')) {
                    options.view = 'content';
                    options.componentId = $contentAppTab.attr('pid');
                    usePromise = true;
                }


                var popupCloseHandler = function (options) {
                    if (options && options.view === 'content') {
                        $.when.apply($, options.promises).done(function () {
                            window.location.hash = "#/publisher/contentsource?componentid=" + options.componentId;
                        });
                    } else {
                        $popup.dialog('close');
                    }
                };

                // do
                var $addStreamButton = $(this);
                var memberAppId;
                appStreamsToBeAdded = [];

                var $appStreamList = $popup.find("._appStreamList");
                $appStreamList.find("input:checkbox:checked").each(function () {
                    appStreamsToBeAdded.push($(this).val());
                });


                if ($radioNew.attr('checked')) {

                    //Remember to check app stream array size
                    if (appStreamsToBeAdded.length !== 0) {
                        //then
                        memberAppId = $addStreamButton.attr('memberAppId');

                        ajaxCall({
                            url: "/ajax/stream/add-tab",
                            data: 'refreshInterval=10&title=' + encodeURIComponent($addStreamButton.attr('appTitle')),
                            success: function (data) {


                                if (data.tabId > 0) {
                                    var tabId = data.tabId;

                                    if (isSetting || options.view === 'content') {
                                        //Silent install streams if it is not a new installation or the user is on the content source view
                                        for (var i = 0; i < appStreamsToBeAdded.length; i++) {
                                            options.promises.push(window.postInstallAddAppStreamBox(appStreamsToBeAdded[i], memberAppId, tabId, usePromise));
                                        }
                                        popupCloseHandler(options);
                                    } else {
                                        window.address.go('/tabs?id=' + tabId, function () {
                                            hootbus.emit('appdirectory:postinstall:addAppStream');
                                            for (i = 0; i < appStreamsToBeAdded.length; i++) {
                                                options.promises.push(window.postInstallAddAppStreamBox(appStreamsToBeAdded[i], memberAppId, tabId, usePromise));
                                            }
                                            popupCloseHandler(options);
                                        });
                                    }

                                }
                                else {
                                    hs.statusObj.update(translation._("Adding new tab failed. Please try again."), 'error', true);
                                }
                                return false;
                            }
                        }, 'qm');
                    }


                } else if ($radioExisting.attr('checked')) {

                    //Remember to check app stream array size
                    if (appStreamsToBeAdded.length !== 0) {
                        //then
                        var tabId = $userTabsSelector.find('option:selected').val();
                        memberAppId = $addStreamButton.attr('memberAppId');

                        if (isSetting || options.view === 'content') {
                            //Silent install streams if it is not a new installation or the user is on the content source view
                            for (var i = 0; i < appStreamsToBeAdded.length; i++) {

                                options.promises.push(window.postInstallAddAppStreamBox(appStreamsToBeAdded[i], memberAppId, tabId, usePromise));
                            }
                            popupCloseHandler(options);
                        } else {
                            window.address.go('/tabs?id=' + tabId, function () {
                                hootbus.emit('appdirectory:postinstall:addAppStream');
                                for (var i = 0; i < appStreamsToBeAdded.length; i++) {
                                    options.promises.push(window.postInstallAddAppStreamBox(appStreamsToBeAdded[i], memberAppId, tabId, usePromise));
                                }
                                popupCloseHandler(options);
                            });
                        }

                    }
                } else {
                    popupCloseHandler(options);
                }

            });

        }
    }, 'qm');
};

appdirectory.uninstallApp = function (appId, memberAppId) {
    ajaxCall({
        type: 'DELETE',
        url: "/ajax/appdirectory/uninstall?memberAppId=" + memberAppId,
        success: function (data) {
            if (1 == data.success) {
                hootbus.emit('appdirectory:uninstall:success', appId);
                _.each(data.memberAppPlugins, function (plugin) {
                    if ("APP_" + plugin._id in window.jsapi.appSelectorList) {

                        delete window.jsapi.appSelectorList["APP_" + plugin._id];
                    }
                });

                window.loadAppDirectory('my-installed-apps');
                hs.statusObj.update(translation._("App removed successfully!"), 'success', true);
            }
            else {
                window.loadAppDirectory('my-installed-apps');
                if (data.error === appdirectory.errors.BILLING_MIGRATION) {
                    hs.statusObj.update(translation._("App removal failed due to maintenance. We're working hard to get your billing page up and running again and apologize for any inconveniences. Check back soon!"), "error", true, 6000);
                } else {
                    hs.statusObj.update(translation._("Failed to remove app"), 'error', true);
                }
            }
        }
    }, 'q1');

};

appdirectory.getIframeSrc = function (backendSource, appId) {
    var hsHost = window.location.host;
    var protocol = window.location.protocol;
    return 'https://' + hsHost + '/app-billing-form?protocol=' + protocol + '&appId=' + appId + '&backendSource=' + backendSource;
};

appdirectory.getSubscribeFreeDialogContent = function () {
    var emptyIframe = '<iframe id="appDirectoryPurchaseSection" class="_appDirectoryPurchaseSection" src="" frameBorder="0"></iframe>';

    return '<div class="ui-dialog-section solo rb-a-3">' + emptyIframe + '</div>';
};

appdirectory.subscribeFreePlan = function (appId, price, currencySymbol, trial) {

    var isIssue = memberUtil.checkUserEmail();
    if (isIssue) {
        return;
    }

    ajaxCall({

        url: "/ajax/appdirectory/subscribe-free",

        success: function (data) {

            if (data.freeActive == 1) {
                appdirectory.subscribeConfirm(appId, trial, currencySymbol, price);
            } else {
                var params = {
                        height: 618,
                        width: 614,
                        title: 'Purchase the app now!',
                        modal: true,
                        draggable: true,
                        closeOnEscape: true,
                        content: appdirectory.getSubscribeFreeDialogContent() // this gives the modal the _appDirectoryPurchaseSection for the attaching the iframe below
                    };
                var $userInfoPopup = $.dialogFactory.create('hs_subscribe_free_plan', params);

                // HTML shenanigans within $.dialogFactory.create cause the iframe URL to be loaded three times instead of one.
                // Each of those requests calls In_Aria::startSession, which is probably a race condition.
                // So instead we set the iframe source only after the dialog has been created.
                // this iframe contains the credit card payment form
                $userInfoPopup.find('._appDirectoryPurchaseSection')
                    .attr('src', appdirectory.getIframeSrc(data.backendSource, appId));

                appdirectoryPaidAppId = appId;
            }
        }

    }, 'qm');
};

appdirectory.subscribePaidPlan = function (appId) {

    $('#hs_subscribe_paid_plan').dialog('close');

    ajaxCall({
        url: "/ajax/appdirectory/buy",
        data: 'appId=' + appId,
        success: function (data) {

            if (1 == data.success) {
                var $installBtn = $('#_app-install-btn-' + appId);
                $installBtn.removeAttr('onclick');

                appdirectory.installApp(appId);

            } else {

                if (data.error === appdirectory.errors.ACCOUNT_INACTIVE) {
                    hs.statusObj.update(translation._("App purchase failed! Please update your billing info"), "error", true, 6000);
                } else if (data.error === appdirectory.errors.BILLING_MIGRATION) {
                    hs.statusObj.update(translation._("App purchase failed due to maintenance. We're working hard to get your billing page up and running again and apologize for any inconveniences. Check back soon!"), "error", true, 6000);
                } else {
                    hs.statusObj.update(translation._("App purchase failed! Please contact our support team to report the issue."), "error", true, 6000);
                }

            }

        }
    }, 'qm');

};

appdirectory.subscribeConfirm = function (appId, trialDays, currencySymbol, subscriptionFee) {

    ajaxCall({
        url: "/ajax/appdirectory/subscribe-paid",
        data: {
            appId: appId,
            trialDays: trialDays,
            currencySymbol: currencySymbol,
            subscriptionFee: subscriptionFee
        },
        success: function (data) {

            var dialogParams = {
                height: 288,
                width: 450,
                title: '',
                modal: true,
                draggable: true,
                closeOnEscape: true,
                content: data.output
            };

            $.dialogFactory.create('hs_subscribe_paid_plan', dialogParams);

        }
    }, 'qm');

};

appdirectory.ariaCallback = function (data) {
    if (data && (data.success == 0)) {
        // AppDirectoryPciContainer will show an error message within the iframe
        // do not attempt buy
        return;
    }

    //close credit card form pop-up
    $('#hs_subscribe_free_plan').remove();

    //buy and install the app for the user
    hs.statusObj.update(translation._("Purchasing the app..."), "success", true, 6000);
    var appId = appdirectoryPaidAppId;

    Promise.resolve(
        ajaxCall({
            url: "/ajax/appdirectory/buy",
            data: 'appId=' + appId
        }, 'qm')
    ).then(
        function (data) {
            if (data.success == 1) {
                hs.statusObj.update(translation._("App installation successful!"), 'success', true);
                var $installBtn = $('#_app-install-btn-' + appId);
                $installBtn.removeAttr('onclick');
                appdirectory.installApp(appId);
            } else {
                hs.statusObj.update(translation._(
                    "App purchase failed. Please contact our support team to report the issue."
                ), "error", true, 6000);
            }
        }
    );
};

appdirectory.showAppReviews = function (rowId, appId) {

    var row = rowId + 1;

    ajaxCall({
        url: "/ajax/appdirectory/app-reviews?appId=" + appId,
        success: function (data) {

            $('#appDirectoryReviews').append(data.output);

            //Update app ratings count
            var reviews = "";
            switch (data.ratingsCount) {
                case 0:
                    reviews = "No reviews";
                    break;
                case 1:
                    reviews = "1 review";
                    break;
                default:
                    reviews = data.ratingsCount + " reviews";
                    break;
            }
            $('#appDirectorySection ._listItem:nth-child(' + (row) + ') .reviewNav .reviewCount a').html(reviews);

            //Update app average rating
            $('#appDirectorySection ._listItem:nth-child(' + (row) + ') .reviewNav div.star-rating').remove();
            $('#appDirectorySection ._listItem:nth-child(' + (row) + ') .reviewNav input.star').remove();
            for (var i = 0; i < 10; i++) {
                $('#appDirectorySection ._listItem:nth-child(' + (row) + ') .reviewNav').prepend('<input name="rating" type="radio" class="star"/>');
            }

            //Clone app item and its event bindings (and all children's event bindings)
            var $app = $('#appDirectorySection ._listItem:nth-child(' + (row) + ')');
            $app.clone(true, true).prependTo($('#appDirectoryReviewsSection .list-scroll'));

            //Crop app item
            $('#appDirectoryReviewsSection .list-scroll .write').remove();
            $('#appDirectoryReviewsSection .list-scroll .installedButton').css('display', 'inline-block');
            $('#appDirectoryReviewsSection .list-scroll ._jsTooltip').removeClass('_jsTooltip');
            $('#appDirectoryReviewsSection .list-scroll ._itemDetails p').remove();
            $('#appDirectoryReviewsSection .list-scroll ._itemDetails .reviewNav').attr('onclick', '');

            //Set up style
            $('#appDirectoryReviewsSection').css('background-color', $('#appDirectoryPopup').css('background-color'));
            $('#appDirectoryReviewsSection').css('background-image', $('#appDirectoryPopup').css('background-image'));
            $('#appDirectoryReviewsSection .list-scroll').css('max-height', $('#appDirectorySection .list-scroll').css('height'));

            //Set up animation
            var $background = $('#appDirectorySection');
            //var $foreground = $('#appDirectoryReviewsSection');
            var $curtain = $('#appDirectoryReviewsMask');

            $curtain.css('width', $background.css('width'));
            //$foreground.css('width', $background.css('width'));
            //$foreground.css('margin-left', '-' + $curtain.css('width'));

            //Show reviews section
            $curtain.show();
            //$foreground.animate({marginLeft: '0px'}, 500, 'easeOutQuart', function(){});

            //Render chart bars
            for (var c = 1; c <= 5; c++) {
                if (data.ratingsStats[c] != 0) {
                    $('#appDirectoryReviewsSection .appDirectoryReviewsChart .rating-bar:eq(' + (5 - c) + ')').html(
                        '<div style="width:' + Math.round(data.ratingsStats[c] / data.ratingsCount * 100) + '%"></div>');
                    $('#appDirectoryReviewsSection .appDirectoryReviewsChart .rating-count:eq(' + (5 - c) + ')').html(
                        '(' + data.ratingsStats[c] + ')');
                }
            }
        }
    }, 'qm');
};

appdirectory.hideAppReviews = function () {
    //$('#appDirectoryReviewsSection').animate({marginLeft: '-' + $('#appDirectoryReviewsMask').css('width')}, 500, 'easeOutQuart', function(){

    //Clear reviews section
    $('#appDirectoryReviews').empty();

    //Mask reviews section
    $('#appDirectoryReviewsMask').hide();
    //});
};

appdirectory.shareAppReview = function (appName, appId) {
    $('#hs_write_a_review').remove();
    $('#appDirectoryPopup').remove();
    owly.shortenUrl("http://hootsuite.com/dashboard#/app-details?id=" + appId, null, function (data) {
        var shortenedLink = data.defaultUrlShortener + '/' + data.output.results[0].hash;
        window.newActionTweet(null, "I just reviewed the #" + appName + " app, check it out in the #Hootsuite App Directory! " + shortenedLink + " #HootApps", null, null, null, false);
    });
};

appdirectory.featuredApps = featuredApps;

window.appdirectory = appdirectory;

export default appdirectory;
