import $ from 'jquery';
import _ from 'underscore';
import darklaunch from 'hs-nest/lib/utils/darklaunch';
import hsEvents from 'hs-events';
import translation from 'utils/translation';
import WalkthroughAppBase from './walkthrough-app-base';
import { types as socialNetworkTypes } from 'hs-nest/lib/constants/social-networks';
import {popoverArrowDefaultPosition} from './step-popover'

import 'velocity-animate';

var SELECTORS = Object.freeze({
    accountNavAnchorGlobal: '.-global-account-navigation-anchor:visible',
    accountNavMenu: '.account-navigation',
    accountNavMenuGlobal: '.-global-account-navigation-menu',
    manageSocialNetworksItem: '.account-navigation-menu-item:nth-child(4)',
    manageSocialNetworksItemGlobal: '.-global-manage-social-networks-item',
    addSnButton: '._memberAddSnButton',
    snSidebar: '._snProfilesSidebar',
    snProfiles: '._snProfilesSidebar ._tab',
    addedSnProfile: '._profileListItem:last',
    memberManagementContainer: '._teamManagementProfilePage',
    addToDropdown: '._organizationsDropdownBtn', // TODO: remove after TUX_NEW_TEAMS_ORGS_ROLLOUT_R1 and TUX_NEW_ADD_SN_DROPDOWN_ROLLOUT_ENT 100%
    orgPicker: '._organizationPicker', // TODO: remove after TUX_NEW_TEAMS_ORGS_ROLLOUT_R1 and TUX_NEW_ADD_SN_DROPDOWN_ROLLOUT_ENT 100%
    addToPicker: '._addToPicker',
    addToDropdownBtn: '._addToDropdownBtn',
    connectYoutubeButton: '._networkSection ._connectYoutubeButton',
});

/**
 * @class AddSocialNetworkWalkthrough
 */
var AddSocialNetworkWalkthrough = WalkthroughAppBase.extend({

    snAddAttempt: false,
    addSnModalClosed: false,
    multiAddSnModalClose: false,

    /**
     * Initialize App
     * @param options
     */
    onInitialize: function () {
        this.snProfileIds = _.keys(hs.socialNetworks);
        this.trackingWalkthroughName = 'add_social_network';
        this.walkthroughId = 'walkthroughAddSocialNetwork';
        this.socialNetworkAddTransferError = false;

        //Populate the step queue
        this.stepQueue = [
            //Click on the add social network btn.
            {
                target: SELECTORS.addSnButton,
                id: 'click_add_sn_btn',
                trackStep: true,
                data: {
                    title: translation._('Start adding social networks'),
                    content: translation._('You can manage all of your social networks in Hootsuite. Click the "Add a social network" button to get started.'),
                    arrowPosition: {horizontal: '20%', vertical: popoverArrowDefaultPosition}
                },
                onOpen: function () {
                    this.onScroll = _.debounce(this.onScroll, this.debounceTime);
                    $(SELECTORS.memberManagementContainer).on('scroll.walkthrough', this.onScroll.bind(this));
                    this.spotlight.hide();

                    var $addSNButton = $(SELECTORS.addSnButton);

                    // If the target has been previously rendered we can proceed with the current step, otherwise,
                    // we wait for a response from TEAM_MANAGEMENT_ORG_LIST_RENDERED
                    if ($addSNButton.length) {
                        this.initAddSNStep();
                    }
                },
                onClose: function () {
                    $(SELECTORS.memberManagementContainer).off('scroll.walkthrough', this.onScroll.bind(this));
                    this.stepPopover.stopFollowingTarget();

                    // Re-enable the overlay animation and hide it
                    this.spotlight.toggleAnimation(true);
                    this.spotlight.hide();
                },
                messageEvents: [
                    {
                        name: hsEvents.ADD_SOCIAL_NETWORK_MODAL_RENDERED,
                        handler: this.showNextStep
                    },
                    {
                        name: 'member:management:mount',
                        handler: this.initAddSNStep.bind(this)
                    }
                ],
                tetherOptions: {
                    attachment: 'bottom left',
                    targetAttachment: 'top left',
                    offset: '7px 20px',
                }
            },
            // Determine whether we need to add the drop down step
            {
                id: 'evaluate_add_dropdown_step',
                trackStep: false,
                onOpen: function () {
                    var $addToPicker;

                    if (hs.canSeeNewTeamsOrgsUxReleaseOne) {
                        $addToPicker = $(SELECTORS.addToPicker);
                    } else {
                        // TODO: safe to remove when TUX_NEW_TEAMS_ORGS_ROLLOUT_R1 and TUX_NEW_ADD_SN_DROPDOWN_ROLLOUT_ENT are 100%
                        $addToPicker = $(SELECTORS.orgPicker);
                    }

                    // If the drop down is present, insert the "add_to_dropdown" step
                    if ($addToPicker.length) {
                        this.insertStep(this.getAddToDropdownStep(), this.getCurrentStep().id, true);
                    }

                    this.showNextStep();
                },
            },
            // Choose social network // Add next button
            {
                target: SELECTORS.snSidebar,
                id: 'choose_social_network',
                trackStep: true,
                data: {
                    title: translation._('Choose a social network'),
                    content: translation._('Select the social network you want to add and click the “Connect” button. A popup will prompt you to give Hootsuite permission to manage your account.'),
                    arrowPosition: {horizontal: '70%', vertical: popoverArrowDefaultPosition}
                },
                onOpen: function () {
                    $(SELECTORS.snProfiles).on('click.walkthrough', this.showNextStep.bind(this));
                },
                onClose: function () {
                    $(SELECTORS.snProfiles).off('click.walkthrough');
                },
                messageEvents : [
                    {
                        name: 'socialNetwork:addAccount:command',
                        handler: function (snType) {
                            this.snAddAttempt = true;
                            this.currentSnType = snType;
                            this.showNextStep();
                        }.bind(this)
                    },
                    {
                        name: 'socialNetwork:authorize:command',
                        handler: function (snType) {
                            this.snAddAttempt = true;
                            this.currentSnType = snType;
                            this.showNextStep();
                        }.bind(this)
                    },
                    {
                        name: 'socialNetwork:addNetworkModal:close',
                        handler: function () {
                            this.exitWalkthrough({isComplete: false});
                        }.bind(this)
                    }
                ],
                tetherOptions: {
                    attachment: 'top center',
                    targetAttachment: 'bottom center',
                    offset: '-10px 65px'
                }
            },
            // step to wait for the user to add a social network
            {
                id: 'adding_social_networks',
                messageEvents: [
                    {
                        name: 'socialNetwork:refresh:success',
                        handler: function () {
                            if (this.addSnModalClosed) {
                                if (this.snAdded()) {
                                    if (this.isMultiAddSn() && !this.multiAddSnModalClosed) { return; }

                                    this.completeTask();
                                    this.showNextStep();
                                } else {
                                    this.exitWalkthrough({isComplete: false});
                                }
                            }
                        }.bind(this)
                    },
                    {
                        name: hsEvents.SOCIAL_NETWORK_TRANSFER_ERROR,
                        handler: function () {
                            // Don't have permissions to transfer the network
                            this.socialNetworkAddTransferError = true;
                        }.bind(this)
                    },
                    {
                        name: hsEvents.SOCIAL_NETWORK_ADD_ERROR,
                        handler: function (data) {
                            if (data && data.errorThrown !== 'Forbidden') {
                                // Max SN limit hasn't been hit, exit the walkthrough and show the dismissal popover
                                this.exitWalkthrough({isComplete: false});
                            } else {
                                // Hit the max SN limit, allow the user to perform further actions
                                // Walkthrough close logic is performed in 'socialNetwork:addNetworkModal:close' (single SN)
                                // and 'socialNetwork:refresh:success' (multi SN)
                                this.socialNetworkAddTransferError = true;
                            }
                        }.bind(this)
                    },
                    {
                        name: 'socialNetwork:authorize:success',
                        handler: function (data, snType) {
                            this.snAddAttempt = true;
                            this.currentSnType = snType;

                            // Reset SN network add-transfer error flag
                            this.socialNetworkAddTransferError = false;

                            if (snType === socialNetworkTypes.INSTAGRAM) {
                                this.completeTask();
                                this.exitWalkthrough({isComplete: true});
                            }
                        }.bind(this)
                    },
                    {
                        name: 'socialNetwork:addNetwork:close',
                        handler: function () {
                            this.multiAddSnModalClosed = true;
                        }.bind(this)
                    },
                    {
                        name: 'socialNetwork:addNetworkModal:close',
                        handler: function () {
                            this.addSnModalClosed = true;

                            // Handle when the user has encountered socialNetworkAddTransferError while adding a single SN
                            // Note: Multi Add case is handled in 'socialNetwork:refresh:success'
                            if (this.socialNetworkAddTransferError && !this.isMultiAddSn()) {
                                this.exitWalkthrough({isComplete: false});
                            }

                            if (!this.snAddAttempt) {
                                this.exitWalkthrough({isComplete: false});
                            }
                        }.bind(this)
                    }
                ]
            },
            {
                id: 'social_network_added',
                target: SELECTORS.addSnButton,
                trackStep: true,
                isStepCounted: false,
                isCongratulatoryStep: true,
                data: {
                    title: translation._("Whoo! Don't stop now"),
                    content: translation._('Most people connect 2 or more social networks. Add another one to take your Hootsuite game to the next level.'),
                    footerButtonText: translation._('Ok, got it!'),
                    footerButtonAction: this.exitWalkthrough.bind(this, {isComplete: true}),
                    arrowPosition: {horizontal: '20%', vertical: popoverArrowDefaultPosition},
                },
                tetherOptions: {
                    attachment: 'bottom left',
                    targetAttachment: 'top left',
                    offset: '10px 20px',
                }
            }
        ];

        //If the user is not in the teams and orgs section, then inject a step to navigate to the section.
        if (!this.isInOrgsPage()) {
            this.insertStep(this.getNavigateToOrgsStep());
            this.setCurrentStep('navigate_to_orgs');
        }
    },

    getAddToDropdownStep: function () {
        return {
            id: 'add_to_dropdown',
            target: hs.canSeeNewTeamsOrgsUxReleaseOne ? SELECTORS.addToDropdownBtn : SELECTORS.addToDropdown,
            trackStep: true,
            data: {
                title: translation._('Choose who will see it'),
                content: (hs.canSeeNewTeamsOrgsUxReleaseOne || hs.canSeeNewAddSnDropdownEnterprise) ?
                    translation._('To share this social network with others, select your organization. For private accounts, choose “Private Social Networks“.') :
                    // TODO: safe to remove when TUX_NEW_TEAMS_ORGS_ROLLOUT_R1 and TUX_NEW_ADD_SN_DROPDOWN_ROLLOUT_ENT are 100%
                    translation._('To share this social network with others, select your organization. For private accounts, choose “My Social Networks“.')
            },
            onOpen: function () {
                if (hs.canSeeNewTeamsOrgsUxReleaseOne) {
                    this.spotlight.show(SELECTORS.addToPicker, {padding: {top: 60}});

                    if (!$(SELECTORS.addToDropdownBtn + ':visible').length) {
                        this.showNextStep();
                    }
                } else {
                    // TODO: safe to remove when TUX_NEW_TEAMS_ORGS_ROLLOUT_R1 and TUX_NEW_ADD_SN_DROPDOWN_ROLLOUT_ENT are 100%
                    this.spotlight.show(SELECTORS.orgPicker, {padding: {top: 60}});

                    if (!$(SELECTORS.addToDropdown + ':visible').length) {
                        this.showNextStep();
                    }
                }
            }.bind(this),
            onClose: function () {
                this.spotlight.hide();
            },
            messageEvents: [
                {
                    name: hsEvents.SELECT_ADD_TO_SOCIAL_NETWORKS,
                    handler: this.showNextStep
                },
                {
                    name: 'socialNetwork:addNetworkModal:close',
                    handler: function () {
                        this.exitWalkthrough({isComplete: false});
                    }.bind(this)
                }
            ],
            tetherOptions: {
                attachment: 'center left',
                targetAttachment: 'center right',
                offset: '0 -3px',
            }
        };
    },

    /**
     * Initializes the overlay and popover during the 'click_add_sn_btn' step
     */
    initAddSNStep: function () {
        // Ensure the "Add a Social Network" button is in view
        var $addSnButton = $(SELECTORS.addSnButton);
        var topOffset = $addSnButton.length ? $addSnButton.position().top : 0;
        var $memberContainer = $(SELECTORS.memberManagementContainer);
        var transSpeed = Math.max(0, topOffset - $memberContainer.height()) * 4;

        $memberContainer.animate({scrollTop: topOffset}, transSpeed, 'swing', function () {
            // The popover target may not have rendered at the time the tether was applied, force an update
            this.updateStepPopover({}, {offset: '5px 20px'});
            this.stepPopover.startFollowingTarget();
        }.bind(this));
    },

    /**
     * Gets the optional step to navigate to the organizations section.
     * @returns {{target: string, id: string, trackStep: boolean, data: {title: *, content: *}, onOpen: Function, messageEvents: *[], tetherOptions: {attachment: string, targetAttachment: string, offset: string}}}
     */
    getNavigateToOrgsStep: function () {
        var target = SELECTORS.manageSocialNetworksItem;
        if (darklaunch.isFeatureEnabled('GLOB_476_ACCOUNT_MENU_UPGRADE')) {
            target = SELECTORS.manageSocialNetworksItemGlobal;
        }
        return {
            target: target,
            id: 'navigate_to_orgs',
            trackStep: true,
            data: {
                title: translation._('Navigate to your account overview'),
                content: translation._("Click on 'Manage social networks.' This is where you'll be able to add, remove, and manage your social networks"),
                arrowPosition: {horizontal: popoverArrowDefaultPosition, vertical: '16px'},
            },
            onOpen: function () {
                if (darklaunch.isFeatureEnabled('GLOB_476_ACCOUNT_MENU_UPGRADE')) {
                    this.spotlight.show(SELECTORS.accountNavMenuGlobal);
                } else {
                    this.spotlight.show(SELECTORS.accountNavMenu);
                }
            },
            messageEvents: [
                {
                    name: 'accountnavigation:click:manageSocialNetworks',
                    handler: this.showNextStep
                },
                {
                    name: 'accountnavigation:tray:closed',
                    handler: function () {
                        this.exitWalkthrough({isComplete: false});
                    }.bind(this)
                }
            ],
            tetherOptions: {
                attachment: 'top left',
                targetAttachment: 'top right',
                offset: '10px 0'
            }
        };
    },

    getConnectWithYoutubeStep: function () {
        return {
            target: SELECTORS.connectYoutubeButton,
            id: 'connect_with_youtube',
            trackStep: true,
            data: {
                title: translation._('Add YouTube'),
                content: translation._('Click the “Connect with YouTube” button. A popup will prompt you to give Hootsuite permission to manage your account. Click the "Allow" button and you\'re set!'),
                arrowPosition: {horizontal: '70%', vertical: popoverArrowDefaultPosition}
            },
            messageEvents : [
                {
                    name: 'socialNetwork:addAccount:command',
                    handler: this.showNextStep
                },
                {
                    name: 'socialNetwork:authorize:command',
                    handler: this.showNextStep
                },
                {
                    name: 'socialNetwork:addNetworkModal:close',
                    handler: function () {
                        this.exitWalkthrough({isComplete: false});
                    }.bind(this)
                }
            ],
            tetherOptions: {
                attachment: 'top center',
                targetAttachment: 'bottom center',
                offset: '-10px 65px'
            }
        };
    },

    onScroll: function () {
        this.spotlight.reapply();
    },

    /**
     *
     */
    onStartWalkthrough: function () {
        this.showStep();
    },

    startSNWalkthrough: function () {
        if (!this.isInOrgsPage()) {
            if (darklaunch.isFeatureEnabled('GLOB_476_ACCOUNT_MENU_UPGRADE')) {
                new Promise(function (resolve) {
                    $(SELECTORS.accountNavAnchorGlobal).trigger('click');
                    resolve(true);
                }).then(this.startWalkthrough.bind(this));
            }
        } else {
            this.startWalkthrough();
        }
    },

    /**
     * Return if currently on the teams and orgs page.
     * @returns {hs|boolean}
     */
    isInOrgsPage: function () {
        return hs && hs.dashboardState === 'organizations';
    },

    snAdded: function () {
        return (this.snProfileIds.length <= _.keys(hs.socialNetworks).length && this.snChanged());
    },

    snChanged: function () {
        return !_.isEqual(this.snProfileIds, _.keys(hs.socialNetworks));
    },

    isMultiAddSn: function () {
        return _.contains([
            socialNetworkTypes.FACEBOOK,
            socialNetworkTypes.LINKEDIN
        ], this.currentSnType);
    }
});

export default AddSocialNetworkWalkthrough;
