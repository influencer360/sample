import $ from 'jquery';
import _ from 'underscore';
import hootbus from 'utils/hootbus';
import hsEvents from 'hs-events';
import translation from 'utils/translation';
import memberUtil from 'utils/member';
import WalkthroughAppBase from './walkthrough-app-base';
import { types as socialNetworkTypes } from 'hs-nest/lib/constants/social-networks';
import {popoverArrowDefaultPosition} from './step-popover'
import boxService from 'box/service';

import 'velocity-animate';

var SELECTORS = Object.freeze({
    createFirstTabBtn: '._noContentMessage ._addNewTabBtn',
    noStreamsView: '._noStreamsView',
    noTabsView: '._noTabsView',
    showStreamHelper: '#showStreamHelper',
    streamsAddAStream: '#boxAddStream',
    streamsStreamTypes: '#boxAddStream ._streamTypes',
    streamSearchBtnSelector: '#boxAddStream button._search:visible, button._y_search:visible',
    streamSearchBoxSelector: '#boxAddStream ._twitterSearch:visible, ._youtubeSearch:visible',
    streamSearchSelector: '#boxAddStream ._content ._tabSection._networks',
    // FPLAT-381: legacy nav reference ._bottomNavMenu is removed
    streamsNavSelector: '._bottomNavMenu ._links li:has(._streams)',
    streamsSocialNetworkSelector: '#boxAddStream ._walkthroughSnSelector',
});

/**
 * @class WizardAppBase
 */
var EngagementWalkthrough = WalkthroughAppBase.extend({
    /**
     * Initialize App
     * @param options
     */
    onInitialize: function () {
        this.snCount = (hs && hs.socialNetworks) ? _.keys(hs.socialNetworks).length : 0;
        this.trackingWalkthroughName = 'monitor_your_network';
        this.walkthroughId = 'walkthroughEngagement';

        this.defaultPopoverProps = {
            // Leave popover anchor centred
            hasCloseButton: true,
            onRequestHide: this.onExit.bind(this),
        };

        this.defaultTetherOptions = {
            attachment: 'middle right',
            targetAttachment: 'middle left',
            offset: '0 0'
        };

        this.stepQueue = [
            // Stream builder intro
            {
                target: SELECTORS.streamsAddAStream,
                id: 'this_is_your_stream_builder',
                trackStep: true,
                data: {
                    title: translation._('Build your first stream'),
                    content: translation._("Streams are activity feeds from your connected social accounts. Use them to monitor conversations, mentions, keywords, and more. Let’s start by adding a Twitter Search stream."),
                    footerButtonText: translation._('Get started'),
                    arrowPosition: {horizontal: popoverArrowDefaultPosition, vertical: '39px'},
                },
                onOpen: function () {
                    var $addAStreamBox = $(SELECTORS.streamsAddAStream);

                    if (!window.stream.saveBox.checkNumBoxes()) {
                        // The above function will print the error message as well
                        this.exitWalkthrough();
                        return;
                    }

                    // If we're not showing New Streams or the Streams view is active
                    if ($addAStreamBox.length !== 0) {
                        this.initStreamBuilderBox();
                    } else {
                        // Otherwise, hide the popover and wait for hsEvents.STREAMS_WELCOME_MESSAGE_RENDERED
                        $(this.stepPopover.getTetheredElementRef()).css('visibility', 'hidden');
                    }
                },
                messageEvents: [
                    {
                        // The New Streams "Welcome Message" renders where the "Add a stream" element was originally
                        name: hsEvents.STREAMS_WELCOME_MESSAGE_RENDERED,
                        handler: function () {
                            this.initStreamBuilderBox();

                            $(this.stepPopover.getTetheredElementRef()).css('visibility', 'visible');
                        }.bind(this)
                    }
                ],
                tetherOptions : {
                    attachment: 'top left',
                    targetAttachment: 'top right',
                    offset: '12px 0',
                }
            },
            // Select a social network in the stream builder
            {
                target: SELECTORS.streamsSocialNetworkSelector,
                id: 'select_your_social_network',
                trackStep: true,
                data: {
                    title: translation._('Select an account'),
                    content: translation._('Select the account that this stream should be associated with. Each social network offers different stream types. Let’s select a Twitter account.'),
                    footerButtonText: translation._('Next'),
                    footerButtonAction: function () {
                        this.scrollToSearch();

                        // Move forward another step after scrolling to search
                        this.showNextStep();
                    }.bind(this)
                },
                onOpen: function () {
                    this.snChanged = false;
                    this.spotlight.show(SELECTORS.streamsSocialNetworkSelector);
                },
                messageEvents: [{
                    name: hsEvents.STREAM_SN_CHANGED,
                    handler: _.bind(function () {
                        this.snChanged = true;
                    }, this)
                }, {
                    name: hsEvents.STREAM_SN_CLOSED,
                    handler: _.bind(function () {
                        this.showNextStep();
                        if (!this.snChanged) {
                            // If close event was fired without change, skip next step as it waits to re-render on sn change
                            this.scrollToSearch();
                        }
                    }, this)
                }]
            },
            // Transition step that waits for the btns to populate, then scrolls to the search btn.
            {
                trackStep: false,
                onOpen: function () {
                    this.spotlight.show(SELECTORS.streamsSocialNetworkSelector);
                },
                messageEvents: [{
                    name: hsEvents.STREAM_BUTTONS_TRANSITION_COMPLETE,
                    handler: _.bind(function () {
                        this.scrollToSearch();
                    }, this)
                }]
            },
            // Highlight search button and instruct to click.
            {
                target: SELECTORS.streamSearchBtnSelector,
                id: 'click_on_search_icon',
                trackStep: true,
                data: {
                    title: translation._('Select Search'),
                    content: translation._('Twitter Search streams allow you to follow conversations about specific topics on Twitter.')
                },
                onOpen: function () {
                    // Look for the search button for any of the sn types
                    var selector = SELECTORS.streamSearchBtnSelector;
                    if ($(selector).length === 0) {
                        this.jumpToStep('choose_stream_type');
                    } else {
                        this.spotlight.show(selector);
                    }

                },
                messageEvents: [{
                    name: hsEvents.STREAM_OPTIONS_OVERLAY_TOGGLED,
                    handler: _.bind(function () {
                        _.defer(this.showNextStep);
                    }, this)
                }]
            },

            // Twitter / G+ / YT search
            // Highlight the search field and instruct user to create search stream
            {
                target: SELECTORS.streamSearchBoxSelector,
                id: 'type_in_company_name',
                trackStep: true,
                data: {
                    title: translation._('Enter a search term'),
                    content: function () {
                        if (this.isSearchListSupportedNetwork(this.getSelectedSocialNetwork())) {
                            return translation._("When you click the name from the resulting list this will create a stream that displays all available mentions of your company on the selected social network.");
                        } else {
                            return translation._("Try searching for your company name. This will create a stream that displays all available mentions of your company on Twitter.");
                        }
                    }.bind(this)
                },
                onOpen: function () {
                    this.fnScrollToStream();

                    if (this.isSearchListSupportedNetwork(this.getSelectedSocialNetwork())) {
                        this.spotlight.show($(SELECTORS.streamSearchSelector), {padding: {bottom: -40}});
                    } else {
                        this.spotlight.show($(SELECTORS.streamSearchBoxSelector), {padding: {bottom: 20}});
                        $(SELECTORS.streamsAddAStream).find('._optionsOverlay ._add').on('click.completeSearchStep', this.completeSearchStep.bind(this));
                    }

                    // Close the walkthrough if the user closes the search box
                    $(SELECTORS.streamsAddAStream).find('._optionsOverlay ._close').on('click', this.exitWalkthrough);
                },
                onClose: function () {
                    if (this.isSearchListSupportedNetwork(this.getSelectedSocialNetwork())) {
                        $(SELECTORS.streamsAddAStream).find('._optionsOverlay ._add').off('click.completeSearchStep');
                    }
                    $(SELECTORS.streamsAddAStream).find('._optionsOverlay ._close').off('click', this.exitWalkthrough);
                    this.spotlight.hide();
                },
                messageEvents: [{
                    name: hsEvents.NEW_STREAM_ADDED,
                    handler: this.jumpToStep.bind(this, 'walkthrough_complete')
                }]
            },
            {
                target: SELECTORS.streamsStreamTypes,
                id: 'choose_stream_type',
                trackStep: true,
                data: {
                    title: translation._('Choose a stream type to add'),
                    content: translation._('Click on one of the tiles to add that stream to your dashboard.')
                },
                onOpen: function () {
                    this.spotlight.show(SELECTORS.streamsStreamTypes, {padding: {top: 5, right: -5, bottom: -15, left: 5}});
                },
                onClose: function () {
                    this.spotlight.hide();
                },
                messageEvents: [{
                    name: hsEvents.NEW_STREAM_ADDED,
                    handler: this.showNextStep
                }, {
                    name: hsEvents.STREAM_OPTIONS_OVERLAY_TOGGLED,
                    handler: _.bind(function () {
                        _.defer(this.exitWalkthrough);
                    }, this)
                }]
            },
            // Congratulate the user and encourage them to add more streams
            {
                target: SELECTORS.streamsAddAStream,
                id: 'walkthrough_complete',
                trackStep: true,
                isStepCounted: false,
                isCongratulatoryStep: true,
                data: {
                    title: translation._('Way to go!'),
                    content: translation._("You've added your first stream. Now create some more streams to follow conversations and activity for all of your social accounts."),
                    footerButtonText: translation._('Done'),
                    footerButtonAction: function () { this.exitWalkthrough({isComplete: true}); }.bind(this),
                    arrowPosition: {horizontal: popoverArrowDefaultPosition, vertical: '39px'}
                },
                onClose: this.markAsCompleteAndStartComposerWalkthrough,
                tetherOptions: {
                    attachment: 'top left',
                    targetAttachment: 'top right',
                    offset: '12px 0'
                }
            }
        ];

        // If not currently in the engagement section, add initial step to navigate to it.
        if (!this.isInEngagement()) {
            var getTitle = function () {
                return translation._('Navigate to "Streams"');
            };
            var getContent = function () {
                return translation._('You can easily monitor your social networks with Streams.');
            };
            this.stepQueue.unshift({
                target: SELECTORS.streamsNavSelector,
                id: 'navigate_to_streams',
                trackStep: true,
                data: {
                    title: getTitle(),
                    content: getContent(),
                    arrowPosition: {horizontal: popoverArrowDefaultPosition, vertical: '36px'},
                },
                onOpen: function () {
                    this.spotlight.show(SELECTORS.streamsNavSelector);
                },
                messageEvents: [
                    {
                        // Once the stream builder has rendered, proceed to next step
                        // Note: Fires only if the user has 1+ SNs
                        name: hsEvents.STREAM_BUTTONS_TRANSITION_COMPLETE,
                        handler: this.showNextStep
                    },
                    {
                        // If the user has no SNs, listen for hsEvents.STREAMS_POST_LOAD_COMPLETE instead
                        name: hsEvents.STREAMS_POST_LOAD_COMPLETE,
                        handler: _.bind(function () {
                            if (this.snCount === 0) {
                                this.showNextStep();
                            }
                        }, this)
                    }
                ],
                tetherOptions: {
                    attachment: 'top right',
                    targetAttachment: 'top left',
                    offset: '32px 0'
                }
            });
        }

        if (this.snCount === 0) {
            this.insertStep(this.getAddSocialNetworkStep(), 'this_is_your_stream_builder', false);

            if (this.getCurrentStep().id !== 'navigate_to_streams') {
                // Update the current step id as the new one was inserted before the "current" step
                this.setCurrentStep('add_social_network');
            }
        }

        var nextStep = this.snCount === 0 ? 'add_social_network' : 'this_is_your_stream_builder';
        this.insertStep(this.getAddNewTabStep(), nextStep, false);
        if (this.getCurrentStep().id !== 'navigate_to_streams') {
            // Update the current step id as the new one was inserted before the "current" step
            this.setCurrentStep('add_new_tab');
        }
    },

    expandStreamBuilderIfMinimized: function () {
        // if stream builder is minimized, expand it
        var $showStreamHelper = $(SELECTORS.showStreamHelper);
        if ($showStreamHelper.length) {
            $showStreamHelper.click();
        }
    },

    revealStreamsView: function () {
        $('._noStreamsView').addClass('u-displayNone');
        $('._streamsView').removeClass('u-displayNone');
    },

    createNewTabAndReload: function () {
        boxService.createNewTab('New Tab')
            .then(window.address.reloadStreams);
    },

    getAddNewTabStep: function () {
        return {
            id: 'add_new_tab',
            trackStep: false,
            onOpen: function () {
                if (this.isNoTabsViewLoaded()) {
                    // need to create a new tab
                    // and wait for streams page to re-render
                    this.createNewTabAndReload();
                } else if (this.isNoStreamViewLoaded()) {
                    // streams are just hidden
                    // we can show them and need not wait for any loading
                    this.revealStreamsView();
                    this.showNextStep();
                } else if (this.isNoTabAdded()) {
                    // there is no tab added right now
                    // create a new tab for the user
                    $(SELECTORS.createFirstTabBtn).click();
                }
                else {
                    // streams are already loaded for the user
                    // lets move to next step
                    this.showNextStep();
                }

            }.bind(this),
            messageEvents: [
                {
                    name: hsEvents.STREAMS_POST_LOAD_COMPLETE,
                    handler: this.showNextStep
                }
            ]
        };
    },

    isNoTabAdded: function () {
        return !!$(SELECTORS.createFirstTabBtn).length;
    },

    isNoTabsViewLoaded: function () {
        return !!$(SELECTORS.noTabsView).length;
    },

    isNoStreamViewLoaded: function () {
        var $noStreamsView = $(SELECTORS.noStreamsView);
        return $noStreamsView.length && !$noStreamsView.hasClass('u-displayNone') && $noStreamsView.children().length;
    },

    initStreamBuilderBox: function () {
        // expand stream builder if minimized
        this.expandStreamBuilderIfMinimized();

        // Ensure the Add Stream element is visible
        this.fnScrollToStream();

        // Put the add-stream box back into it's initial state.
        this.resetAddStreamBox();

        // Reset the stream helper
        window.stream.streamHelper.toggleOptionsOverlay();

        this.revealStreamsView();

        // Re-apply the spotlight and popover
        this.updateStepPopover({}, {offset: '12px 0px'});

        this.spotlight.show(SELECTORS.streamsAddAStream, {
            disableView: true,
            onDisableViewClick: this.showNextStep
        });
    },

    getAddSocialNetworkStep: function () {
        return {
            target: SELECTORS.streamsAddAStream,
            id: 'add_social_network',
            trackStep: true,
            data: {
                title: translation._('Connect your first social network'),
                content: translation._('Hootsuite allows you to create and schedule posts to multiple social networks from one place. Choose the social network you want to connect first.'),
                arrowPosition: {horizontal: popoverArrowDefaultPosition, vertical: '60px'}
            },
            onOpen: function () {
                // expand stream builder if minimized
                this.expandStreamBuilderIfMinimized();

                this.revealStreamsView();

                var $addAStreamBox = $(SELECTORS.streamsAddAStream);

                // If we're not showing New Streams or the Streams view is active
                if ($addAStreamBox.length !== 0) {
                    // Re-apply the spotlight and popover
                    this.updateStepPopover({}, {offset: '12px 0px'});
                    // Position the overlay
                    this.spotlight.show(SELECTORS.streamsAddAStream);
                } else {
                    // Otherwise, hide the popover and wait for hsEvents.STREAMS_WELCOME_MESSAGE_RENDERED
                    $(this.stepPopover.getTetheredElementRef()).css('visibility', 'hidden');
                }
            },
            messageEvents: [
                {
                    name: hsEvents.ADD_SOCIAL_NETWORK_MODAL_RENDERED,
                    handler: function () {
                        this.exitWalkthrough({showPopover: false, trackExit: false});

                        this.triggerNestedWalkthrough("walkthroughAddSocialNetwork", {
                            customStepQueueIds: ['evaluate_add_dropdown_step', 'choose_social_network', 'adding_social_networks'],
                            walkthroughCallback: function () {
                                hootbus.emit('overlay:init', 'wizard', 'walkthroughEngagement');
                            }
                        });
                    }.bind(this)
                },
                {
                    // The New Streams "Welcome Message" renders where the "Add a stream" element was originally
                    name: hsEvents.STREAMS_WELCOME_MESSAGE_RENDERED,
                    handler: function () {
                        // Re-apply the spotlight and popover
                        this.updateStepPopover({}, {offset: '-165px 0px'});
                        this.spotlight.show(SELECTORS.streamsAddAStream);
                        $(this.stepPopover.getTetheredElementRef()).css('visibility', 'visible');
                    }.bind(this)
                }
            ],
            tetherOptions : {
                attachment: 'top left',
                targetAttachment: 'top right',
                offset: '-165px 0px',
            }
        };
    },

    /**
     *
     */
    onStartWalkthrough: function () {
        this.showStep();
    },

    completeEngagementTask: function () {
        this.exitWalkthrough({isComplete: true});
    },

    completeSearchStep: function () {
        this.getCurrentStep();
    },

    /**
     * Resets the add-streams box.
     */
    resetAddStreamBox: function () {
        $('#boxAddStream ._tab').filter(function () {
            return $(this).data('tab') == 'networks';
        }).click();
        $('._tabSection._networks').scrollTop(0);
    },

    isInEngagement: function () {
        return hs && hs.dashboardState == 'streams';
    },

    // Helper functions
    fnScrollToStream: function () {
        $('#streamsContainer')[0].scrollLeft = $('#streamsScroll').outerWidth();
    },

    getSelectedSocialNetwork: function () {
        if (_.isEmpty(this.selectedSocialNetwork)) {
            this.selectedSocialNetwork = $(SELECTORS.streamsSocialNetworkSelector).find('._selectedType').text().toUpperCase().replace(/ /g, '');
        }
        return this.selectedSocialNetwork;
    },

    isSearchListSupportedNetwork: function (network) {
        var searchListSupportedNetworks = [
            socialNetworkTypes.INSTAGRAM,
            socialNetworkTypes.FACEBOOK,
            socialNetworkTypes.FACEBOOKPAGE,
            socialNetworkTypes.FACEBOOKGROUP,
            socialNetworkTypes.YOUTUBECHANNEL
        ];

        return searchListSupportedNetworks.indexOf(network) > -1;
    },

    scrollToSearch: function () {
        var searchBtn = $(SELECTORS.streamSearchBtnSelector);
        var topOffset = searchBtn.length ? searchBtn.position().top : 0;
        var $buttonsContainer = $('#boxAddStream ._tabSection._networks');
        // Determine the speed at which to scroll to the search button (may need no transition depending on screen size)
        var transSpeed = Math.max(0, topOffset - $buttonsContainer.height()) * 4;
        // Scroll to the search button, then move to the next step

        $buttonsContainer.animate({scrollTop: topOffset}, transSpeed, this.showNextStep);
    },

    onExit: function () {
        this.exitWalkthrough();
        this.markAsCompleteAndStartComposerWalkthrough();
    },

    markAsCompleteAndStartComposerWalkthrough: function () {
        memberUtil.storeActionHistoryValue('hasCompletedEngagementWalkthrough', 1);
        hootbus.emit('streams:onboarding:complete');
    }
});

export default EngagementWalkthrough;
