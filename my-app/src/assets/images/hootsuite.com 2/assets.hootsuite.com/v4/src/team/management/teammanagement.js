import _ from 'underscore';
import React from 'react';
import ReactDOM from 'react-dom';
import snActions from 'apps/social-network/actions';
import hootbus from 'utils/hootbus';
import memberUtil from 'utils/member';
import Util from 'utils/util';
import translation from 'utils/translation';
import hsEjs from 'utils/hs_ejs';

import baseFlux from 'hs-nest/lib/stores/flux';
import { ASSIGNEE, ORGANIZATIONS } from 'hs-nest/lib/actions';

import memberManagementWrapper from 'hs-app-organizations/components/wrapper';

import { add } from 'fe-lib-async-callouts';
import { CALLOUTS } from 'fe-comp-callout';
import { TYPE_SUCCESS } from 'fe-comp-banner';
import { TYPE_ERROR } from 'fe-comp-banner';
import { LoadingModal } from 'fe-legacy-platform-comp-loading-modal';
import { LOADING_MODAL_ID } from 'fe-legacy-platform-comp-loading-modal';
import { getMemberPlan } from 'fe-lib-hs'
import {
    toastProperties,
    getLoadedCountPercentage,
    showToast,
    collectionsCount,
    getCollectionsUrlArray,
    getCollectionsCount,
    applyCollectionCountPromises,
    closePopup
} from './teammanagement.helperFunctions';


import lodash from 'lodash';


/**
 * Given an array of functions, split them in chunks
 * of size <nChunks> and wait <wait> milliseconds
 * before calling each function in the next chunk
 */
function rateLimit(funcs, wait, nChunks) {
    const chunks = lodash.chunk(funcs, nChunks)

    const requestsIntervalId = setInterval(() => {
        const nextFuncsBatch = chunks.shift()

        if (nextFuncsBatch) {
            nextFuncsBatch.forEach(f => f())
        } else {
            clearInterval(requestsIntervalId)
        }
    }, wait)

    return requestsIntervalId
}

var teammanagement = {
    redirectTo: function (route) {
        route = route + (route.length && route.indexOf('?') > -1 ? '&' : '?') + '_=' + Math.random();
        window.location = this.getLink(route);
    },
    getLink: function (route) {
        var loc = '#/organizations';
        if (route) {
            loc += route;
        }
        return loc;
    },
    shouldLoadHome: function (section) {
        var noHtml = ($('#teamManagementSection').length === 0 && $('#memberProfileSection').length === 0);
        var isDrillDown = (section !== 'home' && section !== 'organization');
        return (noHtml && isDrillDown);
    },
    loadSection: function (section, params, callback) {
        $(window).unbind('resize.teamlazyload');
        if (teammanagement.shouldLoadHome(section)) {
            teammanagement.home.load({}, function () {
                teammanagement.loadSection(section, params, callback);
            });
            return;
        }
        if (!this.stateHasChanged(section, params)) {
            return;
        }
        if (section === 'home' || section === 'organization') {
            this.resetState();
            $('._drillDown').remove();
            $('#sidebarOverlay').remove();
        }
        teammanagement[section].load(params, callback, section != this.lastSection);
        this.lastSection = section;
    },
    resetState: function () {
        teammanagement.members.resetState();
        teammanagement.socialnetworks.resetState();
        teammanagement.teams.resetState();
    },
    stateHasChanged: function (section, params) {
        this.previous = _.clone(this.current);
        this.current = params;
        this.current.section = section;
        return true;
    },
    makeBulletDraggable: function (el) {
        var $bullet = $(el);
        if ($bullet.data('draggable')) {
            return;
        }
        $bullet.draggable({
            cursor: "move",
            cursorAt: {
                top: 5,
                left: 5
            },
            distance: 8,
            appendTo: 'body',
            helper: function () {
                if (!$bullet.is('.selected')) {
                    $bullet.click();
                }
                var $selected = $('._membersSnsContainer ._listItem.selected'),
                    memberIds = [],
                    freeMemberIds = [],
                    socialNetworkIds = [],
                    $helper = $([]);

                for (var i = 0; i < $selected.length; i++) {

                    if ($selected.eq(i).hasClass('_member')) {
                        // if this member is not
                        // seated, add to freeMemberIds. Otherwise add to
                        // memberIds.
                        if (!$selected.eq(i).find('.is-seated')[0]) {
                            freeMemberIds.push($selected.eq(i).data('modelid'));
                        } else {
                            memberIds.push($selected.eq(i).data('modelid'));
                        }
                    } else {
                        socialNetworkIds.push($selected.eq(i).data('modelid'));
                    }

                    // clone the item, give it a cascading effect, and return the actual DOM element to be pushed into our $helper array
                    var elBullet = $selected.eq(i).clone().removeClass('selected').css({
                        'position': 'absolute',
                        'top': i * 3 + 'px',
                        'left': i * 3 + 'px'
                    })[0];

                    if (i > 10) {
                        $(elBullet).css('display', 'none');
                    }

                    $helper.push(elBullet);
                }

                var dragData = {};
                dragData.memberIds = memberIds;
                dragData.freeMemberIds = freeMemberIds;
                dragData.socialNetworkIds = socialNetworkIds;

                $helper = $('<div class="deck-holder" style="z-index:999;">').append($helper).data('dragged', dragData);
                return $helper;
            },
            drag: function () {
            },
            start: function () {
                var $selected = $('._membersSnsContainer ._listItem.selected');
                $selected.fadeTo(250, 0.25);
            },
            stop: function () {
                var $selected = $('._membersSnsContainer ._listItem.selected');
                $selected.fadeTo(250, 1);
            }
        });
    },
    makeTeamItemDroppable: function ($els) {
        $els.droppable({
            accept: '.card-static.single',
            activeClass: "active",
            hoverClass: "hover",
            drop: function (event, ui) {
                var dragData = $(ui.helper).data('dragged'),
                    $team = $(this);

                if (dragData.freeMemberIds.length > 0) {
                    // Need a popup to upgrade the member to premium.
                    //dashboard.showFeatureAccessDeniedPopup({reason: 'SEATS'});
                    hs.statusObj.update(translation._('You may add only Premium Members to teams.'), 'error', true);
                }
                if (dragData.memberIds.length === 0 && dragData.socialNetworkIds.length === 0) {
                    return;
                }

                var $parentContainer = $('#teamManagementSection ._teamsContainer');
                if ($team.offset().top > ($parentContainer.offset().top + $parentContainer.outerHeight() - 10)) {
                    return;
                }

                if ($team.hasClass('_plusAction')) {
                    // get the members and social networks
                    var $section = $('#teamManagementSection'),
                        memberView = $section.find('._membersContainer').data('view'),
                        snView = $section.find('._socialNetworksContainer').data('view');

                    var params = [];
                    params.push(memberView.collection.getByIds(dragData.memberIds));
                    params.push(snView.collection.getByIds(dragData.socialNetworkIds));
                    $team.trigger('click', params);
                } else {
                    dragData.teamId = $team.data('modelid');
                    teammanagement.addMembersOrSnToTeam(dragData, function (data) {
                        if (data.success) {
                            hs.statusObj.update(translation._("Success"), 'success', true, 4000);
                            $team.trigger('updateView');
                        } else {
                            hs.statusObj.update(translation._("Error"), 'warning', true);
                        }
                    });
                }
            }
        });
    },
    manageBulkPermissions: function (options) {
        // background call to handle permissions, options should be:
        // {teamId:123, socialNetworkIds:[1,2], memberIds:[3,4]}
        ajaxCall({
            url: '/ajax/team/manage-bulk-permissions',
            data: options
        }, 'qm');
    },
    addMembersOrSnToTeam: function (options, callback) {
        hs.statusObj.update(translation.c.LOADING, 'info');
        ajaxCall({
            url: '/ajax/team/add-members-and-social-networks',
            data: options,
            success: function (data) {
                hs.statusObj.reset();
                data.manageBulkPermissions && teammanagement.manageBulkPermissions(options);
                _.isFunction(callback) && callback(data);
            }
        }, 'q1');
    },
    uploadImageComplete: function (fileName, folderName, containerId) {
        var $container = $('#' + containerId),
            filePath = hs.util.rootifyAvatar(folderName, fileName);
        // need to be specific to hidden input
        // as plupload is adding input type=file
        $container.find('._avatarUpdater input[type=hidden]').val(fileName);
        $container.find('._avatarPreview img').attr('src', filePath);
        $container.find('._avatarPreview').removeClass('visHide');
    },
    createOrganizationPopup: function (organizationModel) {
        ajaxCall({
            type: 'GET',
            data: (organizationModel) ? {organizationId: organizationModel.id} : {},
            url: "/ajax/organization/save-popup",
            success: function (data) {
                var params = {
                        modal: true,
                        resizable: false,
                        draggable: true,
                        closeOnEscape: true,
                        width: 500,
                        title: (organizationModel) ? translation._("Organization Settings") : translation._("Create an Organization"),
                        position: ['center', 50],
                        content: "<div class='large-loading'><img src='" + hs.util.rootifyImage('/dashboard/loaders/round-radial-lines-loader.gif') + "' /></div>"
                    },
                    $popup = $.dialogFactory.create('createOrganizationPopup', params);

                var $output = $(data.output);
                $output.hsPlaceholder();

                var orgDefaultPermission = new hs.teams.views.OrganizationDefaultPermission({
                    parentId: hs.memberId,
                    model: organizationModel,
                    canChooseCustom: data.chooseCustom,
                    canChooseLimited: data.chooseLimited
                });
                $output.find(".permissions-list").append(orgDefaultPermission.render().el);


                $popup.html($output);

                var popupView = new hs.teams.views.OrganizationCreatePopup({
                    model: organizationModel
                });
                popupView.setElement($output);
                popupView.render();
                popupView.initSWF();
            }
        }, 'q1');
    },
    removeSocialNetwork: function (snIds, callback) {

        const isProfileOrgOwned = async (snId) => {
            if (typeof hs === 'object') {
                const socialProfile = hs.socialNetworks[snId]
                if (!!socialProfile) {
                    return socialProfile.ownerType === 'ORGANIZATION'
                }
                return false
            }
        }

        const getDeletionMessageForProfile = (isOrgOwned, memberPlanType) => {
            const deletionHeaderDecorator = "--------------------------------------"
            const baseDeletionMessage = deletionHeaderDecorator + "\n" +
                translation._("Remove this social account?") + "\n" +
                deletionHeaderDecorator + "\n\n"

            if (isOrgOwned) {
                return baseDeletionMessage +
                    translation._("The account will be removed from Hootsuite for everybody in the organization.") + "\n\n" +
                    translation._("Streams, analytics, and scheduled content for the account will also be deleted.")
            } else if (memberPlanType === "PROFESSIONAL_PLAN") {
                return baseDeletionMessage +
                    translation._("Streams, analytics, and scheduled content for the account will also be deleted.")
            } else {
                // Should apply to FREE plans only, but also using as a catch-all
                return baseDeletionMessage +
                    translation._("Streams and scheduled content for the account will also be deleted.")
            }
        }

        const memberPlanType = getMemberPlan()
        const isOrgOwned = isProfileOrgOwned(snIds)

        Promise.all([isOrgOwned, memberPlanType]).then((values) => {
            const [ isOrgOwned, memberPlanType ] = values
            if (confirm(getDeletionMessageForProfile(isOrgOwned, memberPlanType))) {
                this.onConfirm(snIds, callback);
            }
        })
    },
    onConfirm: function (snIds, callback) {
        snActions.remove(snIds, {onSuccess: callback});
    },
    removeOrganization: function (organizationId, callback) {
        hootbus.emit('overlay:init', 'modal', 'deleteOrganization', {organizationId: organizationId, callback: callback});
        return false;
    },
    removeUserFromOrganization: function (organizationId, memberId, callback) {
        var confirmTxt = (memberId === hs.memberId) ? translation._("Are you sure you want to leave this organization?") : translation._("Are you sure you want to remove this user from this organization?");
        if (!confirm(confirmTxt)) {
            return;
        }
        ajaxCall({
            url: '/ajax/organization/remove-member',
            beforeSend: function () {
                hs.statusObj.update(translation.c.LOADING, 'info');
            },
            data: "organizationId=" + organizationId + '&memberIds=' + [memberId],
            success: function (data) {
                if (data.success) {
                    hs.statusObj.update(translation._("Success"), 'success', true, 4000);
                    _.isFunction(callback) && callback(data);
                } else if (data.errorMsg) {
                    hs.statusObj.update(data.errorMsg, 'error', true, 8000); //make timeout a bit longer, message could be long
                }
            }
        }, 'q1');
    },
    removeMemberFromTeam: function (teamId, memberIds, revokeSnPermission, callback) {
        if (_.isArray(memberIds)) {
            memberIds = memberIds.join(',');
        }
        ajaxCall({
            beforeSend: function () {
                hs.statusObj.update(translation.c.LOADING, 'info');
            },
            url: '/ajax/team/remove-members',
            data: 'teamId=' + teamId + '&memberIds=' + memberIds + (revokeSnPermission ? '&revokeSnPermission=1' : ''),
            success: function (data) {
                if (data.success) {
                    hs.statusObj.update(translation._("Success"), 'success', true, 4000);
                    baseFlux.getActions(ASSIGNEE).resetAssignees({});
                    _.isFunction(callback) && callback(data);
                } else {
                    hs.statusObj.update(translation._("Error"), 'error', true, 4000);
                }
            }
        }, 'q1');
    },
    removeMemberFromSocialNetwork: function (snId, memberIds, callback) {
        if (_.isArray(memberIds)) {
            memberIds = memberIds.join(',');
        }
        ajaxCall({
            beforeSend: function () {
                hs.statusObj.update(translation.c.LOADING, 'info');
            },
            url: '/ajax/network/remove-members',
            data: 'socialNetworkId=' + snId + '&memberIds=' + memberIds,
            success: function (data) {
                if (data.success) {
                    hs.statusObj.update(translation._("Success"), 'success', true, 4000);
                    _.isFunction(callback) && callback(data);
                } else {
                    hs.statusObj.update(translation._("Error"), 'error', true, 4000);
                }
            }
        }, 'q1');
    },
    removeTeam: function (teamIds, callback, customConfirmation) {
        if (hs.isFeatureEnabled('IDT_206_MOVE_TEAM_DELETE_CONFIRMATION_CLOSER_TO_CALL')) {
            var teamCount = 1;
            if (_.isArray(teamIds)) {
                teamCount = teamIds.length;
                teamIds = teamIds.join(',');
            }
            var confirmation = translation._("Remove %d team(s) from organization?")
                .replace(/%d/, teamCount.toString());
            if (typeof customConfirmation === 'string') {
                confirmation = customConfirmation;
            }
            if (!confirm(confirmation)) {
                return;
            }
        } else {
            if (_.isArray(teamIds)) {
                teamIds = teamIds.join(',');
            }
        }
        ajaxCall({
            beforeSend: function () {
                hs.statusObj.update(translation.c.LOADING, 'info');
            },
            url: '/ajax/team/delete',
            data: {
                teamIds: teamIds
            },
            success: function (data) {
                if (data.success) {
                    hs.statusObj.update(translation._("Success"), 'success', true, 4000);
                    baseFlux.getActions(ASSIGNEE).resetAssignees({});
                    _.isFunction(callback) && callback(data);
                } else {
                    hs.statusObj.update(translation._("Error removing team"), 'warning', true);
                }
            },
            error: function () {
                hs.statusObj.update(translation._("You do not have permission to remove teams for this organization"), 'error', true, 10000);
                return;
            }
        }, 'q1');
    },
    removeSocialNetworksFromMember: function (memberId, snIds, callback) {
        //if (!confirm(translation._("Are you sure you want to remove the social network(s) from this member?"))) return;
        if (_.isArray(snIds)) {
            snIds = snIds.join(',');
        }
        ajaxCall({
            beforeSend: function () {
                hs.statusObj.update(translation.c.LOADING, 'info');
            },
            url: '/ajax/member/remove-social-networks',
            data: 'memberId=' + memberId + '&socialNetworkIds=' + snIds,
            success: function (data) {
                if (data.success) {
                    hs.statusObj.update(translation._("Success"), 'success', true, 4000);
                    _.isFunction(callback) && callback(data);
                } else {
                    hs.statusObj.update(translation._("Error removing social network from member"), 'warning', true);
                }
            },
            error: function () {
                hs.statusObj.update(translation._("You do not have permission to remove social networks for this organization"), 'error', true, 10000);
                return;
            }
        }, 'q1');
    },
    removeSocialNetworksFromTeam: function (teamId, snIds, callback) {
        //if (!confirm(translation._("Remove this social network from team?"))) return;

        if (_.isArray(snIds)) {
            snIds = snIds.join(',');
        }
        ajaxCall({
            beforeSend: function () {
                hs.statusObj.update(translation.c.LOADING, 'info');
            },
            url: '/ajax/team/remove-social-networks',
            data: 'teamId=' + teamId + '&socialNetworkIds=' + snIds,
            success: function (data) {
                if (data.success) {
                    hs.statusObj.update(translation._("Success"), 'success', true, 4000);
                    _.isFunction(callback) && callback(data);
                } else {
                    hs.statusObj.update(translation._("Error removing social network from team"), 'warning', true);
                }
            },
            error: function () {
                hs.statusObj.update(translation._("You do not have permission to remove social networks for this organization"), 'error', true, 10000);
                return;
            }
        }, 'q1');
    },
    upgradeMemberToPremium: function (memberId, organizationId, callback) {
        ajaxCall({
            beforeSend: function () {
                hs.statusObj.update(translation._("Please wait..."), 'info');
            },
            url: '/ajax/organization/seat-member',
            data: 'memberId=' + memberId + '&organizationId=' + organizationId,
            featureAddSuccess: function () {
                teammanagement.upgradeMemberToPremium(memberId, organizationId, callback);
            },
            success: function (data) {
                if (data.success) {
                    hs.statusObj.update(translation._("Success"), 'success', true, 4000);
                    hs.trackEvent('Org', 'UpgradeMemberToPremium');
                    if (data.organization) {
                        baseFlux.getActions(ORGANIZATIONS).set(data.organization);
                        window.location = hs.c.rootUrl + '/dashboard#/member';
                        if (_.isFunction(callback)) {
                            callback(data);
                        }
                    }
                } else {
                    hs.statusObj.update(translation._("Error: Unable to upgrade member"), 'warning', true);
                }
            }
        }, 'q1');
    },
    addTeamPopup: function (organizationId, members, socialNetworks, callback) {
        var params = {
                modal: true,
                resizable: false,
                draggable: true,
                closeOnEscape: true,
                width: 450,
                title: translation._("Create Team"),
                position: ['center', 50],
                content: "<div class='large-loading'><img src='" + hs.util.rootifyImage('/dashboard/loaders/round-radial-lines-loader.gif') + "' /></div>"
            },
            $popup = $.dialogFactory.create('createTeamPopup', params);

        hs.statusObj.update(translation.c.LOADING, 'info');
        ajaxCall({
            type: 'GET',
            data: "organizationId=" + organizationId,
            url: "/ajax/team/add-popup",
            success: function (data) {
                hs.statusObj.reset();
                var $output = $(data.output);
                $output.hsPlaceholder();
                $popup.html($output);
                $popup.find('input._teamNameInput').focus();

                var popupView = new hs.teams.views.TeamCreatePopup({
                    organizationId: organizationId,
                    members: members,
                    socialNetworks: socialNetworks
                });
                popupView.setElement($output);
                popupView.render();
                popupView.initSWF();

                $output.on('createTeamSuccess', function (event, teamId) {
                    $popup.dialog('close');
                    ajaxCall({
                        url: '/ajax/team/get-data',
                        data: 'teamId=' + teamId,
                        success: callback
                    }, 'qm');
                });
            }
        }, 'q1');
    },
    lazyLoadPageSize: 20,
    loadAllPageSize: 150,
    /**
     * Returns the count for the section and the count type (each section has 3)
     * @param {string} currentSection the current section the use is on.
     * @param {string} countType the type of count within the section
     */
    returnCurrentSectionCount: function (currentSection, countType) {
        if (currentSection !== 'members' && currentSection !== 'teams' && currentSection !== 'socialnetworks' && currentSection !== 'organization') {
            currentSection = countType;
        }
        return teammanagement[currentSection].collectionsCount[countType].count;
    },
    /**
     * Aborts all the requests within the array received by param
     * @param {number} requestsArrayIntervalId
     */
    abortRequestsParallelizationArray: function (requestsArrayIntervalId) {
        clearInterval(requestsArrayIntervalId)
    },
    /**
     * Manages and returns all the parallelized requests for loading all content using pagination
     * @param {string} requestUrl url to perform the requests
     * @param {number} pageSize Page size
     * @param {string} collectionPropertyName name of the collection we are dealing with
     * @param {number} totalCount total count of items to load
     * @param {function} closePopup callback to close the popup
     * @param {object} loadingModalUtils
     * @param {string} loadingModalContainer id of the modal container
     * @param {object} pagination pagination object
     * @param {function} callback callback
     * @param {string} loadingModalId
     * @param {object} requestParams additional params to send with each request
     * @param {string} requestMethod the HTTP method to use for each request
     */
    loadPage: function (
        requestUrl, pageSize, collectionPropertyName, totalCount,
        closePopup, loadingModalUtils, pagination,
        callback, loadingModalId, requestParams, requestMethod) {
        // Amount of pages we have to request
        var totalPages = Math.ceil(totalCount / pageSize);
        var pageNumber = 1;
        var itemsArray = [];

        // Toast properties
        var successTitleText = translation._(toastProperties.successTitleText);
        var successMessageText = translation._(toastProperties.successMessageText);
        var errorTitleText = translation._(toastProperties.errorTitleText);
        var errorMessageText = translation._(toastProperties.errorMessageText);

        var requestsArray = [];
        for (var page=0; page < totalPages; page++) {
            requestsArray.push(((defaultRequestParams) => () => ajaxCall({
                type: requestMethod,
                url: requestUrl,
                data: _.defaults(defaultRequestParams, requestParams),
                success: function (data) {
                    itemsArray = itemsArray.concat(_.values(data[collectionPropertyName]));

                    if (totalPages > 1) {
                        loadingModalUtils.updateProgressBar(getLoadedCountPercentage(pageNumber, totalPages));
                    }

                    // It is done
                    if (pageNumber === totalPages) {
                        // Mark pagination as we already load all of them. This is need it to persist the data.
                        pagination.hasMore = false;
                        // Fire callback
                        callback(itemsArray, pagination);

                        if (totalPages > 1) {
                            // Close the popup
                            closePopup(loadingModalUtils, showToast(add, CALLOUTS.TOAST.NAME, TYPE_SUCCESS, successTitleText, successMessageText));
                        }
                    }
                    pageNumber++;
                },
                error: function (error) {
                    if (!_.isUndefined(error.statusText) && error.statusText === 'abort') {
                        if (totalPages > 1) {
                            closePopup(loadingModalUtils, null);
                        }
                    } else {
                        if (totalPages > 1) {
                            var modalElement = document.getElementById(loadingModalId);
                            if (modalElement) {
                                closePopup(loadingModalUtils, showToast(add, CALLOUTS.TOAST.NAME, TYPE_ERROR, errorTitleText, errorMessageText));
                            }
                        } else {
                            showToast(add, CALLOUTS.TOAST.NAME, TYPE_ERROR, errorTitleText, errorMessageText)
                        }
                    }
                }
            },'qm'))({
                pageSize: pageSize,
                page: page + 1
            }));
        }

        return rateLimit(requestsArray, 1500, 10);
    },
    /**
     * Returns a regular expresion if filtering, null if resetting the collection.
     * @param {object} event event fired by the user.
     * @param {string} inputValue value on the sidebar .filter input.
     * @param {string} section the section of the T&O the user is.
     */
    handleCollectionSearch: function (event, inputValue, section) {
        // If there is a value in the search box, create reg ex.
        if (inputValue.trim().length > 0) {
            var searchText = inputValue.replace(/\(/g, '\\(').replace(/\)/g, '\\)').trim();
            if (section === 'members') {
                searchText = inputValue.replace(/\(/g, '(').replace(/\)/g, ')').trim();
            }
            return new RegExp(searchText, "i");
        } else {
            return null;
        }
    }
};

teammanagement.home = {
    load: function (params, callback) {
        hootbus.emit('toggleCoreViews:secondary', {content: memberManagementWrapper});
        $.isFunction(callback) && callback();
    },
    display: function (data) {
        var views = hs.teams.views;
        var orgsData = [];
        if (data.ownedOrganization && data.ownedOrganization.organizationId) {
            var owned = data.organizations[data.ownedOrganization.organizationId];
            owned.isOwned = true;	// pass in flag
            orgsData.push(owned);
            _.each(data.organizations, function (o) {
                (o.organizationId != data.ownedOrganization.organizationId) && orgsData.push(o);
            });
        } else {
            orgsData = _.values(data.organizations);
        }

        hs.teams.global.organizations.reset(orgsData);

        // add organizations
        if (orgsData.length) {
            var orgsCol = new hs.teams.cols.Organizations(orgsData);
            var orgList = new views.OrganizationList({collection: orgsCol});
            $('div#memberOrganizations').empty().append(orgList.render().el);
        }

        // add socialnetworks
        teammanagement.renderProfileSocialNetworks(data);

        $('._createOrganizationBtn').on('click', function () {
            hs.trackEvent('Org', 'StartCollaborating', '/member');
            teammanagement.createOrganizationPopup();
            return false;
        });
    },
    onOwnOrgCreation: function () {
        var $mps = $('#memberProfileSection');
        if ($mps.length) {
            $('#createOrgSection').hide();
            $mps.find('._createOrganizationBtn').hide();
            teammanagement.home.load();
        }
    }
};


teammanagement.organization = {
    collectionsCount: collectionsCount(),
    load: function (params, callback) {
        var organizationId = params.organizationId;
        var self = this;
        ajaxCall({
            type: 'GET',
            url: "/ajax/organization/get-all-data",
            data: {
                "organizationId" : organizationId,
                "includeSunshineProfiles" : true
            },
            beforeSend: function () {
                hs.statusObj.update(translation.c.LOADING, 'info');
            },
            success: function (data) {
                if ($('#teamManagementSection').length === 0) {
                    hootbus.emit('toggleCoreViews:secondary', { content: data.output });
                }

                var $container = $('#teamManagementSection'),
                    $headerContainer = $container.find('._headerContainer');

                //if ($headerContainer.children().length === 0) {
                hs.teams.global.organizations.reset(_.values(data.organizations));
                var headerView = new hs.teams.views.OrganizationsHeader({
                    selected: organizationId
                });
                $headerContainer.empty().append(headerView.render().el)
                    .find('._help').click(function () {
                        dashboard.showWizardOrgManagementDialog();
                    }).end();
                //}

                teammanagement.organization.display(data, organizationId);

                _.isFunction(callback) && callback();

                if (data.isShowOrgManagementWizard == 1) {
                    dashboard.showWizardOrgManagementDialog();
                }
            },
            complete: function () {
                hs.statusObj.reset();
            },
            abort: function () {
                hs.statusObj.reset();
            }
        }, 'abortOld');

        // Returns an array with all the urls to fetch counts
        var collectionsUrlArray = getCollectionsUrlArray(self.collectionsCount);
        // Returns an array with all the Promises for the counts requests
        var errorTitleText = translation._(toastProperties.errorTitleText);
        var errorMessageText = translation._(toastProperties.errorMessageText);
        var showErrorToast = function() {
            return showToast(add, CALLOUTS.TOAST.NAME, TYPE_ERROR, errorTitleText, errorMessageText)
        }
        var collectionsCountPromises = getCollectionsCount(ajaxCall, collectionsUrlArray, organizationId, showErrorToast);
        applyCollectionCountPromises(self.collectionsCount, collectionsCountPromises);
    },
    display: function (data, organizationId) {
        // update dropdown
        var $headerContainer = $('#teamManagementSection').find('._headerContainer');

        if ($headerContainer.children().length === 0) {
            hs.teams.global.organizations.reset(_.values(data.organizations));
            var headerView = new hs.teams.views.OrganizationsHeader({
                selected: organizationId
            });
            $headerContainer.empty().append(headerView.render().el);
        }

        $('._teamManagementProfilePage').hide();


        var $container = $('._teamManagementOrganizationPage').show(),
            $teamsContainer = $container.find('._teamsContainer'),
            $membersContainer = $container.find('._membersContainer'),
            $socialNetworksContainer = $container.find('._socialNetworksContainer');

        var memberBulletList = new hs.teams.views.MemberList({
            collection: new hs.teams.cols.Members(_.values(data.members)),
            organizationId: organizationId,
            canManageMember: data.canManageMember,
            canManagePermission: data.canManagePermission,
            seatCounts: data.seatCounts,
            parentType: 'organization',
            parentId: organizationId,
            loadMorePath: '/ajax/organization/get-members?organizationId=' + organizationId,
            scrollContainer: data.hasMoreMembers ? '.content' : null
        });
        $membersContainer.empty().append(memberBulletList.render().el).data('view', memberBulletList);

        var snBulletList = new hs.teams.views.SocialNetworkList({
            collection: new hs.teams.cols.SocialNetworks(_.values(data.socialNetworks)),
            organizationId: organizationId,
            canManageSocialNetwork: data.canManageSocialNetwork,
            canAddSocialNetwork: data.canAddSocialNetwork,
            parentType: 'organization',
            parentId: organizationId,
            loadMorePath: '/ajax/organization/get-social-networks?organizationId=' + organizationId + '&includeSunshineProfiles=true',
            scrollContainer: data.hasMoreSocialNetworks ? '.content' : null
        });
        $socialNetworksContainer.empty().append(snBulletList.render().el).data('view', snBulletList);

        var teamPortraitList = new hs.teams.views.TeamList({
            collection: new hs.teams.cols.Teams(_.values(data.teams)),
            organizationId: organizationId,
            canManageTeam: data.canManageTeam,
            parentType: 'organization',
            parentId: organizationId
        });
        $teamsContainer.empty().append(teamPortraitList.render().el);
        teamPortraitList.doLazyload();

        if (data.canManageTeam) {
            // drag setup
            $container
                .undelegate().delegate('._bullet', 'mouseenter', function () {
                    teammanagement.makeBulletDraggable(this);
                });

            teammanagement.makeTeamItemDroppable($container.find('._team'));
        }

        var fnDoResize = function ($target, leftSideWidth) {
            var newWidth = $('#dashboard').outerWidth() - leftSideWidth;
            $target.width(newWidth);
        };

        $container.find('._membersContainer').resizable('destroy').resizable({
            handles: 'e',
            containment: '._membersSnsContainer',
            minWidth: 460,
            resize: function (event, ui) {
                fnDoResize($('._socialNetworksContainer'), ui.size.width);
                $(this).height(ui.originalSize.height);
            },
            stop: function (event, ui) {
                var $rightSide = $('._socialNetworksContainer'),
                    $leftSide = $(this);

                fnDoResize($rightSide, $leftSide.outerWidth());
                $leftSide.height(ui.originalSize.height);

                //change width to percentages
                var dashWidth = $('#dashboard').outerWidth(),
                    leftPercent = $leftSide.outerWidth() / dashWidth * 100,
                    rightPercent = $rightSide.outerWidth() / dashWidth * 100;

                $leftSide.width(leftPercent.toFixed(2) + "%");
                $rightSide.width(rightPercent.toFixed(2) + "%");
            }
        });

        var $teamsScrollableContent = $container.find('._teamsContainer').find('._content');
        $container.find('._teamsContainer').resizable('destroy').resizable({
            handles: 's',
            minHeight: 150,
            containment: '._teamManagementOrganizationPage',
            stop: function (event, ui) {
                $(ui.element).width("auto");
            },
            resize: function () {
                $teamsScrollableContent.trigger('resizeteamcontent');
            }
        });
    }
};

teammanagement.socialnetworks = {
    // State to save between URL changes
    organizationId: null,
    sidebarCollection: null,
    sidebarPagination: null,
    canManageSocialNetworks: null,
    collectionsCount: collectionsCount(),
    resetState: function () {
        this.organizationId = null;
        this.sidebarCollection = null;
        this.sidebarPagination = null;
        this.collectionsCount = collectionsCount();
    },
    getHasSidebarListChanged: function (params) {
        if (!this.organizationId || (this.organizationId && this.organizationId !== params.organizationId)) {
            this.organizationId = params.organizationId;
            return true;
        }

        return false;
    },
    load: function (params, callback, newSection) {
        var self = this,
            id = params.snId,
            organizationId = params.organizationId,
            hasSidebarListChanged = true;

        hasSidebarListChanged = this.getHasSidebarListChanged(params) || newSection; // sets organizationId
        if (this.organizationId != null) {
            // Returns an array with all the urls to fetch counts
            var collectionsUrlArray = getCollectionsUrlArray(self.collectionsCount);

            // Returns an array with all the Promises for the counts requests
            var errorTitleText = translation._(toastProperties.errorTitleText);
            var errorMessageText = translation._(toastProperties.errorMessageText);
            var showErrorToast = function() {
                return showToast(add, CALLOUTS.TOAST.NAME, TYPE_ERROR, errorTitleText, errorMessageText)
            }
            var collectionsCountPromises = getCollectionsCount(ajaxCall, collectionsUrlArray, organizationId, showErrorToast);
            applyCollectionCountPromises(self.collectionsCount, collectionsCountPromises);
        }

        if (hasSidebarListChanged) {
            ajaxCall({
                url: '/ajax/organization/get-social-networks',
                data: {
                    organizationId: organizationId,
                    pageSize: teammanagement.lazyLoadPageSize,
                    includeSunshineProfiles: true
                },
                success: function (data) {
                    var sidebarData = (!data.socialNetworks || data.socialNetworks.length === 0) ? null : _.values(data.socialNetworks);
                    self.sidebarCollection = new hs.teams.cols.SocialNetworks(sidebarData);
                    self.sidebarPagination = data.pagination;
                    self.canManageSocialNetworks = data.canManageSocialNetworks;

                    if (id || self.sidebarCollection.length !== 0) {
                        if (!id) {
                            id = self.sidebarCollection.at(0).id;
                        }
                        ajaxCall({
                            url: '/ajax/network/drilldown',
                            data: 'socialNetworkId=' + id,
                            success: function (data) {
                                data.pagination = self.sidebarPagination;
                                data.canManageSocialNetworks = self.canManageSocialNetworks;
                                self.display(id, organizationId, hasSidebarListChanged, self.sidebarCollection, data, params);
                            }
                        }, 'qm');
                    } else {
                        self.display(id, organizationId, hasSidebarListChanged, self.sidebarCollection, data, params);
                    }

                    _.isFunction(callback) && callback();
                },
                complete: function (data) {
                    var response = JSON.parse(data.responseText);
                    if (response.controllerFeatureAccessDenied == 1 && response.feature == 'PREMIUM_ORGANIZATION') {
                        hs.trackEvent('Free Org', 'View SocialNetworks');
                    }
                }

            }, 'q1');
        } else {
            if (id) {
                ajaxCall({
                    url: '/ajax/network/drilldown',
                    data: 'socialNetworkId=' + id,
                    success: function (data) {
                        data.pagination = self.sidebarPagination;
                        data.canManageSocialNetworks = self.canManageSocialNetworks;
                        self.display(id, organizationId, hasSidebarListChanged, self.sidebarCollection, data, params);
                    }
                }, 'qm');
            }
        }
    },
    display: function (id, organizationId, hasSidebarListChanged, sidebarCollection, data, params) {
        if (!data) {
            data = {};
        }

        var members = new hs.teams.cols.Members(_.values(data.members)),
            teams = new hs.teams.cols.Teams(_.values(data.teams)),
            model = new hs.teams.models.SocialNetwork(data.socialNetwork);

        if (typeof this.page === "undefined" || hasSidebarListChanged) {
            // Sidebar data has changed, IE Organization has changed
            // Create a new SocialNetworkDrillDown and Render it
            this.page = new hs.teams.views.SocialNetworkDrillDown({
                id: id,
                model: model,
                organizationId: organizationId,
                members: members,
                teams: teams,
                tab: params.tab,
                sidebarCol: sidebarCollection,
                // permissions from /ajax/network/drilldown
                showPermissionsSection: data.showPermissionsSection,
                ownedByOrganization: data.ownedByOrganization,
                canTransfer: data.canTransfer,
                canDelete: data.canDelete,
                canSyncProfile: data.canSyncProfile,
                canManageSocialNetworks: data.canManageSocialNetworks,
                sidebarOptions: {
                    loadMorePath: '/ajax/organization/get-social-networks?organizationId=' + organizationId + '&includeSunshineProfiles=true',
                    scrollContainer: data.pagination && data.pagination.hasMore ? '._contentScroll' : null,
                    canManage: (organizationId == null) ? true : data.canManageOrgSn,
                    canAddSocialNetwork: data.canAdd
                }
            });


            $('#teamManagementDrillDown').html(this.page.render().el);
        } else {
            // Sidebar data has NOT changed, IE Organization has NOT changed
            // Update state of SocialNetworkDrillDown and re-render the selected item header and content
            this.page.setOptions({
                id: id, // memberId
                model: model, // member
                members: members,
                teams: teams,
                showPermissionsSection: data.showPermissionsSection,
                ownedByOrganization: data.ownedByOrganization,
                canTransfer: data.canTransfer,
                canDelete: data.canDelete,
                canSyncProfile: data.canSyncProfile,
                canManageSocialNetworks: data.canManageSocialNetworks
            });
            this.page.renderDrillDownSelected();


            // Click the "Overview" tab so it gets rendered in the main panel
            this.page.clickTab();
        }
    }
};

teammanagement.members = {
    // State to save between URL changes
    organizationId: null,
    sidebarCollection: null,
    sidebarPagination: null,
    canManageOrgMember: null,
    collectionsCount: collectionsCount(),
    resetState: function () {
        this.organizationId = null;
        this.sidebarCollection = null;
        this.sidebarPagination = null;
        this.canManageOrgMember = null;
        this.collectionsCount = collectionsCount();
    },
    getHasSidebarListChanged: function (params) {
        if (!this.organizationId || (this.organizationId && this.organizationId !== params.organizationId)) {
            this.organizationId = params.organizationId;
            return true;
        }

        return false;
    },
    load: function (params, callback, newSection) {
        var self = this,
            id = params.memberId,
            organizationId = params.organizationId,
            hasSidebarListChanged = true;

        hasSidebarListChanged = this.getHasSidebarListChanged(params) || newSection; // sets organizationId
        // Returns an array with all the urls to fetch counts
        var collectionsUrlArray = getCollectionsUrlArray(self.collectionsCount);
        // Returns an array with all the Promises for the counts requests
        var errorTitleText = translation._(toastProperties.errorTitleText);
        var errorMessageText = translation._(toastProperties.errorMessageText);
        var showErrorToast = function() {
            return showToast(add, CALLOUTS.TOAST.NAME, TYPE_ERROR, errorTitleText, errorMessageText)
        }
        var collectionsCountPromises = getCollectionsCount(ajaxCall, collectionsUrlArray, organizationId, showErrorToast);
        applyCollectionCountPromises(self.collectionsCount, collectionsCountPromises);

        if (hasSidebarListChanged) {
            ajaxCall({
                url: '/ajax/organization/get-members',
                data: {
                    organizationId: organizationId,
                    pageSize: teammanagement.lazyLoadPageSize
                },
                success: function (data) {
                    var sidebarData = (!data.members || data.members.length === 0) ? null : _.values(data.members);
                    self.sidebarCollection = new hs.teams.cols.Members(sidebarData);
                    self.sidebarPagination = data.pagination;
                    self.canManageOrgMember = data.canManageOrgMember;

                    if (id || self.sidebarCollection.length !== 0) {
                        if (!id) {
                            id = self.sidebarCollection.at(0).id;
                        }
                        ajaxCall({
                            url: '/ajax/member/drilldown',
                            data: 'memberId=' + id + '&organizationId=' + organizationId,
                            success: function (data) {
                                data.pagination = self.sidebarPagination;
                                data.canManageOrgMember = self.canManageOrgMember;
                                self.display(id, organizationId, hasSidebarListChanged, self.sidebarCollection, data, params);
                            }
                        }, 'qm');
                    } else {
                        self.display(id, organizationId, hasSidebarListChanged, self.sidebarCollection, data, params);
                    }
                    _.isFunction(callback) && callback();
                },
                error: function () {
                    hs.statusObj.update(translation.c.ERROR_GENERIC, 'error', true, 4000);
                }

            }, 'q1');
        } else {
            if (id) {
                ajaxCall({
                    url: '/ajax/member/drilldown',
                    data: 'memberId=' + id + '&organizationId=' + organizationId,
                    success: function (data) {
                        data.pagination = self.sidebarPagination;
                        data.canManageOrgMember = self.canManageOrgMember;
                        self.display(id, organizationId, hasSidebarListChanged, self.sidebarCollection, data, params);
                    }
                }, 'qm');
            }
        }
    },
    display: function (id, organizationId, hasSidebarListChanged, sidebarCollection, data, params) {
        if (!data) {
            data = {};
        }

        var sns = new hs.teams.cols.SocialNetworks(_.values(data.socialNetworks)),
            teams = new hs.teams.cols.Teams(_.values(data.teams)),
            model = new hs.teams.models.Member(data.member);

        // Sidebar data has changed, IE Organization has changed
        // Create a new MemberDrillDown and Render it
        const viewOptions = {
            id: id,
            model: model,
            organizationId: organizationId,
            tab: params.tab,
            sns: sns,
            canChooseLimited: data.canChooseLimited,
            teams: teams,
            sidebarCol: sidebarCollection,
            canDelete: data.canDelete,
            canManagePermission: data.canManagePermission,
            canUpgradeToPremium: data.canUpgradeToPremium,
            sidebarOptions: {
                loadMorePath: '/ajax/organization/get-members?organizationId=' + organizationId,
                scrollContainer: data.pagination && data.pagination.hasMore ? '._contentScroll' : null,
                canManage: data.canManageOrgMember
            }
        };

        let viewPage;
        if (!data.member.isVirtualAgent) {
            viewPage = new hs.teams.views.MemberDrillDown(viewOptions);
        } else {
            viewOptions.canDelete = false; // Disable the user being able to delete the virtual agent
            viewPage = new hs.teams.views.VirtualAgentDrillDown(viewOptions);
        }
        this.page = viewPage;

        $('#teamManagementDrillDown').html(this.page.render().el);
    }
};

teammanagement.teams = {
    // State to save between URL changes
    organizationId: null,
    sidebarCollection: null,
    sidebarPagination: null,
    canManageOrgTeams: null,
    collectionsCount: collectionsCount(),
    resetState: function () {
        this.organizationId = null;
        this.sidebarCollection = null;
        this.sidebarPagination = null;
        this.canManageOrgTeams = null;
        this.collectionsCount = collectionsCount();
    },
    getHasSidebarListChanged: function (params) {
        if (!this.organizationId || (this.organizationId && this.organizationId !== params.organizationId)) {
            this.organizationId = params.organizationId;
            return true;
        }

        return false;
    },
    load: function (params, callback, newSection) {
        var self = this,
            id = params.teamId,
            organizationId = params.organizationId,
            hasSidebarListChanged = true;

        hasSidebarListChanged = this.getHasSidebarListChanged(params) || newSection; // sets organizationId
        // Returns an array with all the urls to fetch counts
        var collectionsUrlArray = getCollectionsUrlArray(self.collectionsCount);
        // Returns an array with all the Promises for the counts requests
        var errorTitleText = translation._(toastProperties.errorTitleText);
        var errorMessageText = translation._(toastProperties.errorMessageText);
        var showErrorToast = function() {
            return showToast(add, CALLOUTS.TOAST.NAME, TYPE_ERROR, errorTitleText, errorMessageText)
        }
        var collectionsCountPromises = getCollectionsCount(ajaxCall, collectionsUrlArray, organizationId, showErrorToast);
        applyCollectionCountPromises(self.collectionsCount, collectionsCountPromises);

        if (hasSidebarListChanged) {
            ajaxCall({
                url: '/ajax/organization/get-teams',
                data: {
                    organizationId: organizationId,
                    pageSize: teammanagement.lazyLoadPageSize
                },
                success: function (data) {
                    var sidebarData = (!data.teams || data.teams.length === 0) ? null : _.values(data.teams);
                    self.sidebarCollection = new hs.teams.cols.Teams(sidebarData);
                    self.sidebarPagination = data.pagination;
                    self.canManageOrgTeams = data.canManageOrgTeams;

                    if (id || self.sidebarCollection.length !== 0) {
                        if (!id) {
                            id = self.sidebarCollection.at(0).id;
                        }
                        ajaxCall({
                            url: '/ajax/team/drilldown',
                            data: 'teamId=' + id,
                            success: function (data) {
                                data.pagination = self.sidebarPagination;
                                data.canManageOrgTeams = self.canManageOrgTeams;
                                self.display(id, organizationId, hasSidebarListChanged, self.sidebarCollection, data, params);
                            }
                        }, 'qm');
                    } else {
                        self.display(id, organizationId, hasSidebarListChanged, self.sidebarCollection, data, params);
                    }
                    _.isFunction(callback) && callback();
                },
                complete: function (data) {
                    var response = JSON.parse(data.responseText);
                    if (response.controllerFeatureAccessDenied == 1 && response.feature == 'PREMIUM_ORGANIZATION') {
                        hs.trackEvent('Free Org', 'View Teams');
                    }
                }

            }, 'q1');
        } else {
            if (id) {
                ajaxCall({
                    url: '/ajax/team/drilldown',
                    data: 'teamId=' + id,
                    success: function (data) {
                        data.pagination = self.sidebarPagination;
                        data.canManageOrgTeams = self.canManageOrgTeams;
                        self.display(id, organizationId, hasSidebarListChanged, self.sidebarCollection, data, params);
                    }
                }, 'qm');
            }
        }
    },
    display: function (id, organizationId, hasSidebarListChanged, sidebarCollection, data, params) {
        if (!data) {
            data = {};
        }

        var sns = new hs.teams.cols.SocialNetworks(_.values(data.socialNetworks)),
            members = new hs.teams.cols.Members(_.values(data.teamMembers)),
            admins = new hs.teams.cols.Members(_.values(data.teamAdmins)),
            model = new hs.teams.models.Team(data.team);

        if (typeof this.page === "undefined" || hasSidebarListChanged) {
            // Sidebar data has changed, IE Organization has changed
            // Create a new SocialNetworkDrillDown and Render it
            this.page = new hs.teams.views.TeamDrillDown({
                id: id,
                model: model,
                organizationId: organizationId,
                sns: sns,
                members: members,
                admins: admins,
                tab: params.tab,
                sidebarCol: sidebarCollection,
                canDelete: data.canDeleteTeam,
                permissions: data.teamPermissions,
                sidebarOptions: {
                    loadMorePath: '/ajax/organization/get-teams?organizationId=' + organizationId,
                    scrollContainer: data.pagination && data.pagination.hasMore ? '._contentScroll' : null,
                    canManage: data.canManageOrgTeams
                }
            });

            $('#teamManagementDrillDown').html(this.page.render().el);
        } else {
            // Sidebar data has NOT changed, IE Organization has NOT changed
            // Update state of SocialNetworkDrillDown and re-render the selected item header and content
            this.page.setOptions({
                id: id,
                model: model,
                sns: sns,
                members: members,
                admins: admins,
                canDelete: data.canDeleteTeam,
                permissions: data.teamPermissions
            });
            this.page.renderDrillDownSelected();

            // Click the "Overview" tab so it gets rendered in the main panel
            this.page.clickTab();
        }
    }
};

teammanagement.c = {};
teammanagement.c.PERMISSION_CUSTOM = 'CUSTOM';
teammanagement.c.PERMISSION_DEFAULT = 'NONE';
teammanagement.c.ORG_MANAGE_INFO = 'ORG_MANAGE_INFO';
teammanagement.c.ORG_MANAGE_MEMBER = 'ORG_MANAGE_MEMBER';
teammanagement.c.ORG_MANAGE_TEAM = 'ORG_MANAGE_TEAM';
teammanagement.c.ORG_MANAGE_SOCIAL_NETWORK = 'ORG_MANAGE_SOCIAL_NETWORK';
teammanagement.c.ORG_ADD_SOCIAL_NETWORK = 'ORG_ADD_SOCIAL_NETWORK';
teammanagement.c.ORG_REMOVE_SOCIAL_NETWORK = 'ORG_REMOVE_SOCIAL_NETWORK';
teammanagement.c.SN_DEFAULT = 'SN_DEFAULT';

teammanagement.t = {};
teammanagement.t.TEAM_ADMIN = {
    title: translation._("Team Admin"),
    content: translation._("Has Default permissions plus can manage team members, social networks, permissions, vanity URLs and message templates for the team")
};
teammanagement.t.TEAM_HOOTDESK_ADMIN = {
    title: translation._("Hootdesk Team Admin"),
    content: translation._("Has Default permissions and can also assign conversations to any agent, override team queue permissions, and access Hootdesk queue analytics features"),
};
teammanagement.t.ORG_ADMIN = {
    title: translation._("Admin"),
    content: translation._("Has Default permissions plus can invite and manage all members, all social networks and all teams in the organization. They can grant organization permissions to other members")
};
teammanagement.t.ORG_SUPER_ADMIN = {
    title: translation._("Super Admin"),
    content: translation._("Has Admin permissions plus can manage other organization assets (vanity URLs, etc.)")
};
teammanagement.t.ORG_HOOTDESK_SETTINGS_ADMIN = {
    title: translation._("Hootdesk Settings Admin"),
    content: translation._("Has Default permissions and can also access Hootdesk admin functions"),
};
teammanagement.t.SN_ADVANCED = {
    title: translation._("Advanced"),
    content: translation._("Has Editor permissions plus can manage permissions for other members on this social network. Can manage social network settings")
};
teammanagement.t.SN_DEFAULT = {
    title: translation._("Editor"),
    content: translation._("Has Limited permissions plus can post messages, approve unsent messages, and manage contacts for the social network")
};
teammanagement.t.SN_LIMITED = {
    title: translation._("Limited"),
    content: translation._("Has read-only access to the social network. Messages posted to the social network must be approved by an Editor or Advanced member")
};
teammanagement.t.SN_RESPONDER = {
    title: translation._("Responder"),
    content: translation._("Can reply to comments and other replies. Messages posted to the social network must be approved by an Editor or Advanced member")
};
teammanagement.t.SN_HOOTDESK_ADMIN = {
    title: translation._("Hootdesk Social Admin"),
    content: translation._("Has Default permissions and can also perform bulk resolves on conversations and mask messages"),
};

teammanagement.getPermissionItems = function (type, withCustom, withLimited) {
    var presetsDefaults = {
        'socialNetwork': [
            {divider: translation._("Social Network Permissions")},
            {
                title: translation._("None"),
                id: teammanagement.c.PERMISSION_DEFAULT,
                tooltip: {
                    title: translation._("No permission"),
                    content: translation._("No access to this social network")
                }
            }
        ],
        'team': [
            {divider: translation._("Team Permissions")},
            {
                title: translation.c.PERMISSION_DEFAULT,
                id: teammanagement.c.PERMISSION_DEFAULT,
                tooltip: {
                    title: translation._("Default"),
                    content: translation._("Can view other team members, social networks, vanity URLs and message templates for the team")
                }
            }
        ],
        'organization': [
            {
                title: translation.c.PERMISSION_DEFAULT,
                id: teammanagement.c.PERMISSION_DEFAULT,
                tooltip: {
                    title: translation._("Default"),
                    content: translation._("Can view details of the teams they are on and the social networks they have access to within the organization")
                }
            }
        ]
    };
    var presetItems = _.clone(hs.permissionsAndPresets['presets'][type])
    if (!withLimited) {
        delete presetItems['SN_LIMITED'];
    }

    presetItems = _.map(presetItems, function (val, key) {
        var obj = {
            title: val.name,
            id: key
        };
        if (teammanagement.t[key]) {
            obj.tooltip = teammanagement.t[key];
        }
        return obj;
    });
    if (withCustom) {
        presetItems.push({
            title: translation.c.PERMISSION_CUSTOM,
            id: teammanagement.c.PERMISSION_CUSTOM
        });
    }
    presetItems = presetsDefaults[type].concat(presetItems);

    return presetItems;
};

teammanagement.customPermissionPopup = function (type, target, onSave, defaultSet, onClose) {
    const permissions = {...hs.permissionsAndPresets['permissions'][type]};
    // JIRA ID-1167: Soft removal of the RSS permission so we can deprecated that function
    const permissionsWithNoRSS = Object.keys(permissions).reduce((object, key) => {
        if (key !== 'SN_MANAGE_RSS') {
            object[key] = permissions[key]
        }
        return object
    }, {})

    var html = hsEjs.getEjs('team/management/custompermissionpopup').render({
            perms: permissionsWithNoRSS,
            type: type,
            target: target
        }),
        params = {
            width: 500,
            resizable: false,
            closeOnEscape: true,
            content: html,
            title: translation._("Custom %s Permissions").replace('%s', Util.ucFirst(type)).replace("SocialNetwork", "Social Network"),
            close: function () {

            }
        };

    if (_.isFunction(onClose)) {
        params.close = onClose;
    }

    var $popup = $.dialogFactory.create('customPermissionPopup', params);

    var $dropdown = $popup.find('._presetsDropdownBtn'),
        presetItems = teammanagement.getPermissionItems(type, true, true);

    // select CUSTOM by default
    _.each(presetItems, function (item) {
        if (item.id == teammanagement.c.PERMISSION_CUSTOM) {
            item.selected = true;
            return false;
        }
    });

    var fnBatchSet = function (arrPermissions) {
        var $checkboxes = $popup.find('._row input');
        $checkboxes.removeAttr('checked');	// uncheck all

        _.each(arrPermissions, function (p) {
            $checkboxes.filter(function () {
                return $(this).data('permission') == p;
            }).attr('checked', 'checked');
        });
    };
    var fnHandleDependenciesAndExclusions = function (checkedPermission, isChecked) {
        var $checkboxes = $popup.find('._row input'),
            dependencies = hs.permissionsAndPresets.dependencies[type],
            exclusions = hs.permissionsAndPresets.exclusions[type];

        // check dependencies first
        if (dependencies) {
            if (isChecked) {
                _.each(dependencies[checkedPermission], function (p) {
                    $checkboxes.filter('[data-permission="' + p + '"]').attr('checked', 'checked');
                });
            } else {
                _.each(dependencies, function (arr, p) {
                    if (_.indexOf(arr, checkedPermission) > -1) {
                        $checkboxes.filter('[data-permission="' + p + '"]').removeAttr('checked');
                    }
                });
            }
        }

        isChecked && exclusions && _.each(exclusions, function (arr) {
            // arr is an array of mutually exclusive permissions
            if (_.indexOf(arr, checkedPermission) > -1) {
                var permsToUncheck = _.without(arr, checkedPermission);
                _.each(permsToUncheck, function (p) {
                    $checkboxes.filter('[data-permission="' + p + '"]').removeAttr('checked');
                });
            }
        });

        // checking any of the keys will check their respective value
        var granularDependencies = {
            "SN_REPLY": "SN_POST",
            "SN_POST" : "SN_REPLY",
            "SN_POST_WITH_APPROVAL": "SN_REPLY_WITH_APPROVAL"
        };
        // OR dependency where one permission may map to multiple dependencies
        var granularOr = {
            "SN_REPLY": "SN_POST_WITH_APPROVAL"
        };
        // checking any of these keys will uncheck their respective value
        var granularExclusions = {
            "SN_POST": "SN_REPLY_WITH_APPROVAL",
            "SN_POST_WITH_APPROVAL": "SN_REPLY",
            "SN_REPLY_WITH_APPROVAL": "SN_POST"
        };
        // unchecking any one of these will uncheck the rest
        var granularUncheck = ["SN_REPLY", "SN_REPLY_WITH_APPROVAL", "SN_POST", "SN_POST_WITH_APPROVAL"];

        if (isChecked) {
            if (_.has(granularDependencies, checkedPermission) &&
                !(_.has(granularOr, checkedPermission) && $checkboxes.filter('[data-permission="' + granularOr[checkedPermission] + '"]').is(':checked'))) {
                $checkboxes.filter('[data-permission="' + granularDependencies[checkedPermission] + '"]').attr('checked', 'checked');
            }
            if (_.has(granularExclusions, checkedPermission)) {
                $checkboxes.filter('[data-permission="' + granularExclusions[checkedPermission] + '"]').removeAttr('checked');
            }
        } else if (_.indexOf(granularUncheck, checkedPermission) > -1) {
            _.each(granularUncheck, function (p) {
                $checkboxes.filter('[data-permission="' + p + '"]').removeAttr('checked');
            });
        }

        var isPublish = $checkboxes.filter('[data-permission="SN_POST"]').attr('checked');

        if (isPublish) {
            $checkboxes.filter('[data-permission="SN_REACT"]').attr('checked', 'checked');
            $checkboxes.filter('[data-permission="SN_RETWEET"]').attr('checked', 'checked');
        }
    };

    // Displays the tooltip for the checked permission for 1 sec on the first ever click
    var fnHandleShowToolTipOnFirstClick = function (permission) {
        if (!memberUtil.getActionHistoryValue('hasSeenCustomPermissionToolTip' + permission)) {
            $("span." + permission).trigger('mouseover');
            setTimeout(function () {
                $("span." + permission).trigger('mouseout');
            }, 1000);
            memberUtil.storeActionHistoryValue('hasSeenCustomPermissionToolTip' + permission, 1);
        }
    };

    $dropdown.hsDropdown({
        data: {items: presetItems},
        change: function (element) {
            var selected = element.id || null;

            var $checkboxes = $popup.find('._row input');
            if (selected && !selected.match(/none|custom/i)) {
                var presetPerms = hs.permissionsAndPresets['presets'][type][selected].permissions;
                fnBatchSet(presetPerms);
            } else if (selected == teammanagement.c.PERMISSION_DEFAULT) {
                $checkboxes.removeAttr('checked');
            }
        }
    });

    var $presetContent = $popup.find('._presetContent'),
        fnGetSelectedPermissions = function () {
            return _.map($presetContent.find('input:checked'), function (el) {
                return $(el).data('permission');
            });
        };
    $presetContent.delegate('._row input[type="checkbox"]', 'click', function () {
        // check dependancies and exclusions
        var $checkbox = $(this),
            isChecked = $checkbox.is(':checked');

        var permission = $checkbox.data('permission');
        fnHandleShowToolTipOnFirstClick(permission);
        fnHandleDependenciesAndExclusions(permission, isChecked);

        // check what we have selected and see if it matches any preset
        var strSelected = fnGetSelectedPermissions().sort().join(','),
            presets = hs.permissionsAndPresets['presets'][type],
            foundMatch = false;
        _.each(presets, function (p, id) {
            if (strSelected == p.permissions.sort().join(',')) {		// sort and join to use string matching on array
                $dropdown.hsDropdown('selectElement', id);
                foundMatch = true;
                return false;
            }
        });
        if (!foundMatch) {
            $dropdown.hsDropdown('selectElement', teammanagement.c.PERMISSION_CUSTOM);
        }
    });

    $popup.find('._save').click(function () {
        _.isFunction(onSave) && onSave(fnGetSelectedPermissions());
        $popup.dialog('close');
    }).end()
        .find('._cancel').click(function () {
            $popup.dialog('close');
        });

    $.isArray(defaultSet) && fnBatchSet(defaultSet);
};

teammanagement.setMemberSnPermissionPreset = function (memberId, socialNetworkId, presetCodeOrId, callback) {
    ajaxCall({
        url: '/ajax/network/set-permission-preset',
        data: 'memberId=' + memberId + '&socialNetworkId=' + socialNetworkId + '&permissionPreset=' + presetCodeOrId + '&overridePreset=1',
        success: function (data) {
            _.isFunction(callback) && callback(data);
            if (!data.success) {
                hs.statusObj.update(data.errorMessage, 'error', true, 4000);
            }
        }
    }, 'q1');
};

teammanagement.getPermissionPresetName = function (permissionType, permissionPreset) {
    if (!permissionPreset || permissionPreset === teammanagement.c.PERMISSION_DEFAULT) {
        return translation.c.PERMISSION_DEFAULT;
    }
    if (permissionPreset === teammanagement.c.PERMISSION_CUSTOM) {
        return translation.c.PERMISSION_CUSTOM;
    }
    return hs.permissionsAndPresets['presets'][permissionType][permissionPreset].name;
};

teammanagement.inviteMember = function (options) {
    var params = {
            modal: true,
            resizable: false,
            draggable: true,
            closeOnEscape: true,
            width: 500,
            title: translation._("Invite Member to Organization"),
            position: ['center', 50],
            content: "<div class='large-loading'><img src='" + hs.util.rootifyImage('/dashboard/loaders/round-radial-lines-loader.gif') + "' /></div>"
        },
        $popup = $.dialogFactory.create('inviteUserPopup', params);

    ajaxCall({
        type: 'GET',
        url: "/ajax/organization/add-seated-member-popup",
        data: "organizationId=" + options.organizationId,
        featureAddSuccess: function () {
            // a feature deficiency that was causing the feature access
            // denied pop-up has been rectified. So trigger this action
            // again.
            teammanagement.inviteMember(options);
        },
        success: function (data) {
            var $popupContent = $(data.output);
            $popupContent.hsPlaceholder();
            $popup.html($popupContent);

            var popupView = new hs.teams.views.MemberCreatePopup({
                organizationId: options.organizationId,
                organizationDomain: data.organizationDomain,
                organizationPlanId: data.organizationPlanId,
                teams: _.values(data.teams),
                sns: _.values(data.socialNetworks)
            });

            popupView.setElement($popupContent);
            popupView.render();

            $popupContent.on('inviteMemberSuccess', function () {
                $popup.dialog('close');
            });
            $popupContent.on('closePopup', function () {
                $popup.dialog('close');
            });

        },
        complete: function (data) {
            var response = JSON.parse(data.responseText);
            if (response.controllerFeatureAccessDenied == 1) {
                $popup.dialog('close');
            }
            hs.statusObj.reset();
        },
        abort: function () {
            hs.statusObj.reset();
        }
    }, 'qm');
};

teammanagement.remindMemberAboutInvitation = function (organizationId, $memberInvite) {

    ajaxCall({
        url: '/ajax/organization/remind-member-about-invitation',
        beforeSend: function () {
            hs.statusObj.update(translation._("Sending Reminder..."), 'info');
        },
        data: "organizationId=" + organizationId + '&memberId=' + $memberInvite.attr('memberId') + '&code=' + $memberInvite.attr('inviteCode'),
        success: function (data) {
            if (data.success) {
                hs.statusObj.update(translation._("Reminder Sent"), 'success', true, 4000);
                $memberInvite.find('._send-reminder-button').addClass('disabled').text(translation._("Reminder Sent")).unbind();
            } else {
                hs.statusObj.update(data.errorMsg, 'error', true, 4000);
            }
        }
    }, 'q1');
};

teammanagement.current = {};
teammanagement.previous = {};


teammanagement.createDropdownMembers = function (cols, optionsList, $anchor, addNew) {
    !optionsList && (optionsList = {});
    !addNew && (addNew = {});

    var optionsData = {
        items: cols.toJSON(),
        withSearch: true
    };
    if (addNew.organizationId) {
        optionsData.addNewMember = true;
    }

    var options = _.extend({
        template: 'dropdown/member_list_dropdown',
        data: optionsData,
        adapter: {
            title: 'fullName',
            img: 'img',
            text: 'companyTitle',
            isSeated: 'isSeated'
        },
        width: 312,
        addNew: addNew
    }, optionsList);
    var $dd = new hs.DropdownList(options);
    $anchor && $anchor.length && $dd.hsDropdownList('open', $anchor);
    return $dd;
};

teammanagement.createDropdownTeams = function (cols, optionsList, $anchor) {
    !optionsList && (optionsList = {});
    var options = _.extend({
        data: {
            items: cols.toJSON(),
            withSearch: true
        },
        adapter: {
            title: 'name',
            img: 'img'
        },
        width: 312
    }, optionsList);
    var $dd = new hs.DropdownList(options);
    $anchor && $anchor.length && $dd.hsDropdownList('open', $anchor);
    return $dd;
};

teammanagement.createDropdownSocialNetworks = function (cols, optionsList, $anchor) {
    !optionsList && (optionsList = {});
    var options = _.extend({
        data: {
            items: cols.toJSON(),
            withSearch: true
        },
        adapter: {
            title: 'username',
            img: 'img',
            text: 'type'
        },
        width: 312
    }, optionsList);
    var $dd = new hs.DropdownList(options);
    $anchor && $anchor.length && $dd.hsDropdownList('open', $anchor);
    return $dd;
};

/*
 * Function only works in member home page
 */
teammanagement.renderProfileSocialNetworks = function (data) {
    var $snContainer = $('._memberSocialNetworks');
    if ($snContainer.length) {
        var views = hs.teams.views;
        var socialNetworks = {};
        _.each(data.socialNetworks, function (sn, key) {

            // don't display social networks for in organizations
            if (sn.ownerType === 'MEMBER') {
                socialNetworks[key] = sn;
            }
        });

        var snsCol = new hs.teams.cols.SocialNetworks(_.values(socialNetworks));
        var snsList = new views.SocialNetworkHomeList({collection: snsCol});
        $snContainer.empty().append(snsList.render().el);
    }
};

teammanagement.upgradeOrganization = function (organizationId, isOwnedByCurrentMember) {
    var proUpgradeUrl = hs.c.rootUrl + '/plans/pro-upgrade?icn=paywall&ici=learnmore-free-premium_members';
    if (!isOwnedByCurrentMember) {
        ajaxCall({
            url: '/ajax/organization/transfer-to-me',
            data: 'organizationId=' + organizationId,
            success: function (data) {
                if (data.needsUpgrade) {
                    window.location = proUpgradeUrl;
                }

                if (data.success) {
                    hs.statusObj.update(translation._("Organization updated!"), 'success');
                    window.location = hs.c.rootUrl + '/dashboard#/member?refresh';
                }
            },
            featureAddSuccess: function () {
                teammanagement.upgradeOrganization(organizationId, isOwnedByCurrentMember);
            }
        }, 'q1');
    }
    else {
        window.location = proUpgradeUrl;
    }
};

teammanagement.transferOrganization = function (organizationId) {
    hs.statusObj.update(translation._("Sending Request..."), 'info');
    ajaxCall({
        url: '/ajax/organization/transfer-to-me',
        data: 'organizationId=' + organizationId,
        success: function (data) {
            if (data.needsUpgrade) {
                window.location = hs.c.rootUrl + '/pro';
                return;
            }

            if (data.success) {
                hs.statusObj.update(translation._("Organization transferred!"), 'success');
                window.location = hs.c.rootUrl + '/dashboard#/member';
                window.location.reload(true);
            } else {
                hs.statusObj.update(translation._("Request Failed"), 'warning', true);
            }
        }
    }, 'q1');
};

teammanagement.createPendingInvitationRequestPopup = function (organizationModel) {

    ajaxCall({
        type: 'POST',
        url: "/ajax/organization/pending-invitation-requests-popup",
        data: 'organizationId=' + organizationModel.id,
        beforeSend: function () {
            hs.statusObj.update(translation.c.LOADING, 'info');
        },
        success: function (data) {
            var params = {
                    width: 540,
                    resizable: false,
                    closeOnEscape: true,
                    content: data.output,
                    title: translation._("Pending invitations"),
                    close: function () {
                        //do nothing
                    }
                },
                $popup = $.dialogFactory.create('pendingInvitationRequestsPopup', params);

            //setup the tabs
            $popup.find('._topTabs ._pending-invites-tab').click(function () {
                //get the content loading, if this isn't already active
                if (!$(this).hasClass('_active')) {
                    teammanagement.loadPendingInvitationList($popup.find('._section._pending-invites-tab'), organizationModel.id);
                }
                teammanagement.showInvitationSection($popup, '_pending-invites-tab');
            }).end();

            //initially load the pending invites
            teammanagement.loadPendingInvitationList($popup.find('._section._pending-invites-tab'), organizationModel.id);
            teammanagement.showInvitationSection($popup, '_pending-invites-tab');

            $popup.delegate('._send-reminder-button', 'click', function () {
                var $memberInvite = $(this).closest('._pendingInvite');
                teammanagement.remindMemberAboutInvitation($memberInvite.attr('organizationId'), $memberInvite);
            });

            $popup.find('._close-button').click(function () {
                $popup.dialog('close');
            });
        },
        complete: function () {
            hs.statusObj.reset();
        },
        abort: function () {
            hs.statusObj.reset();
        }
    }, 'q1');

};

teammanagement.loadPendingInvitationList = function ($container, organizationId) {
    //put some loader into the container first
    var loader = "<div class='large-loading'><img src='" + hs.util.rootifyImage('/dashboard/loaders/round-radial-lines-loader.gif') + "' /></div>";
    $container.html(loader);

    var listContainerTemplate = 'invites/pendinginvitelist';
    var listTemplate = 'invites/pendinginvites';

    ajaxCall({
        type: 'POST',
        url: '/ajax/organization/get-invitations',
        data: 'organizationId=' + organizationId,
        success: function (data) {
            var inviteListContainer = hsEjs.getEjs(listContainerTemplate).render({invites: data.invites});
            var inviteList = hsEjs.getEjs(listTemplate).render({invites: data.invites});
            $container.html(inviteListContainer).find('._invite-list').append(inviteList);
        }
    }, 'qm');
};

teammanagement.showInvitationSection = function ($popup, targetTab) {

    $popup.find('._tabs-section ._section._active').hide().removeClass('_active').end()
        .find('._tabs-section .' + targetTab).show().addClass('_active').end()
        .find('._topTabs ._active').removeClass('_active active').end()
        .find('._topTabs .' + targetTab).addClass('_active active');
};

teammanagement.memberLoader = {
    defaultOptions: {
        closePopupWhenDataLoaded: true,
        membersArrayPropertyName: 'members',
        requestMethod: 'POST',
        params: {}
    },
    /**
     * Load all members for an Organization using pagination. This control will block the UI and let the user
     * know we are loading members and will give the user updates on the progress.
     * @param {int} options.pageSize The number of items to load per page.
     * @param {string} options.loadMorePath - The URL (path + qs) of the AJAX endpoint to use to load paged data. This
     *        should have the same value as the loadMorePath used in your member list for pagination.
     *        Ex. '/ajax/organization/get-members?organizationId=12345'
     * @param {boolean} options.closePopupWhenDataLoaded - optional - Close the pop up when data is loaded. If you need to keep
     *        the popup open to render something or process the data in some way, set this to false and then call
     *        the function teammanagement.memberLoader.closePopup() when you are done.
     * @param {Object} options.params - optional - Additional data request params used to when loading items.
     * @param {function} options.callback - optional - The callback function called once all the items have loaded.
     * @param {string} options.membersArrayPropertyName - optional - The property name of the members array in the return response.
     */
    loadAllMembers: function (options) {
        var self = this;
        this.options = _.defaults(options, this.defaultOptions);
        this.loadedPages = 0;
        this.totalPages = teammanagement.returnCurrentSectionCount(teammanagement.current.section, 'members');
        this.continueLoadingAll = true;
        this.pagination = {
            page: 1,
            hasMore: true
        };
        this.pageSize = this.options.pageSize;
        this.loadingModal = null;
        this.loadingModalContainer = null;
        this.totalPages = Math.ceil(this.options.membersCount / this.pageSize);

        if (this.totalPages > 1) {
            this.loadingModalContainer = 'members-loading-modal-container';
            var membersLoadingModalContainer = document.createElement('div');
            membersLoadingModalContainer.id = this.loadingModalContainer;
            document.body.appendChild(membersLoadingModalContainer);

            // The utils prop extends functions defined inside component to be called outside
            var setLoadingModalUtils = function (utils) {
                self.loadingModalUtils = utils;
            };

            var modalCloseCallback = function () {
                teammanagement.abortRequestsParallelizationArray(self.requestsArrayIntervalId);
            };

            // Define Title and description
            var headerTitleText = translation._("Loading Members");
            var headerDescriptionText = translation._("We're loading your team members, this might take a few minutes.");

            this.loadingModal = React.createElement(LoadingModal, {
                headerTitleText: headerTitleText,
                headerDescriptionText: headerDescriptionText,
                allowCloseText: translation._("Are you sure you want to stop loading your team members?"),
                utils: setLoadingModalUtils,
                closeCallback: modalCloseCallback
            }, '');

            ReactDOM.render(this.loadingModal, membersLoadingModalContainer);
        }

        self.requestsArrayIntervalId = teammanagement.loadPage(
            this.options.loadMorePath,
            this.options.pageSize,
            this.options.membersArrayPropertyName,
            this.options.membersCount,
            closePopup,
            self.loadingModalUtils,
            self.pagination,
            this.options.callback,
            LOADING_MODAL_ID,
            this.options.params,
            this.options.requestMethod
        );
    }
};

teammanagement.socialNetworkLoader = {
    defaultOptions: {
        closePopupWhenDataLoaded: true,
        requestMethod: 'POST',
        params: {}
    },
    /**
     * Load all social networks for an Organization using pagination. This control will block the UI and let the user
     * know we are loading social networks and will give the user updates on the progress.
     * @param {int} options.organizationId The id of the organization to load the social networks in.
     * @param {int} options.pageSize The number of items to load per page.
     * @param {boolean} options.closePopupWhenDataLoaded Close the pop up when data is loaded. If you need to keep
     *        the popup open to render something or process the data in some way, set this to false and then call
     *        the function teammanagement.socialNetworkLoader.closePopup() when you are done.
     * @param {Object} options.params Additional data request params used to when loading items.
     * @param {function} options.callback The callback function called once all the items have loaded.
     */
    loadAllSocialNetworks: function (options) {
        var self = this;
        this.options = _.defaults(options, this.defaultOptions);

        this.loadedPages = 0;
        this.totalPages = teammanagement.returnCurrentSectionCount(teammanagement.current.section, 'socialnetworks');
        this.continueLoadingAll = true;
        this.pagination = {
            page: 1,
            hasMore: true
        };
        this.pageSize = this.options.pageSize;
        this.totalPages = Math.ceil(this.options.totalCount / this.pageSize);

        if (this.totalPages > 1) {
            this.loadingModalContainer = 'social-networks-loading-modal-container';
            var socialNetworksLoadingModalContainer = document.createElement('div');
            socialNetworksLoadingModalContainer.id = this.loadingModalContainer;
            document.body.appendChild(socialNetworksLoadingModalContainer);

            // The utils prop extends functions defined inside component to be called outside
            var setLoadingModalUtils = function (utils) {
                self.loadingModalUtils = utils;
            };

            var modalCloseCallback = function () {
                teammanagement.abortRequestsParallelizationArray(self.requestsArrayIntervalId);
            };

            // Define Title and description
            var headerTitleText = translation._("Loading Social Networks");
            var headerDescriptionText = translation._("We're loading your social networks, this might take a few minutes.");

            this.loadingModal = React.createElement(LoadingModal, {
                headerTitleText: headerTitleText,
                headerDescriptionText: headerDescriptionText,
                allowCloseText: translation._("Are you sure you want to stop loading your social networks?"),
                utils: setLoadingModalUtils,
                closeCallback: modalCloseCallback
            }, '');

            ReactDOM.render(this.loadingModal, socialNetworksLoadingModalContainer);
        }

        self.requestsArrayIntervalId = teammanagement.loadPage(
            this.options.loadMorePath,
            this.options.pageSize,
            'socialNetworks',
            this.options.totalCount,
            closePopup,
            self.loadingModalUtils,
            self.pagination,
            this.options.callback,
            LOADING_MODAL_ID,
            this.options.params,
            this.options.requestMethod
        );
    }
};

teammanagement.teamLoader = {
        defaultOptions: {
            closePopupWhenDataLoaded: true,
            teamsArrayPropertyName: 'teams',
            requestMethod: 'POST',
            params: {}
        },
        /**
         * Load all teams for an Organization using pagination. This control will block the UI and let the user
         * know we are loading teams and will give the user updates on the progress.
         * @param {int} options.organizationId The id of the organization to load the teams in.
         * @param {int} options.pageSize The number of items to load per page.
         * @param {boolean} options.closePopupWhenDataLoaded Close the pop up when data is loaded. If you need to keep
         *        the popup open to render something or process the data in some way, set this to false and then call
         *        the function teammanagement.teamLoader.closePopup() when you are done.
         * @param {string} options.teamsArrayPropertyName - optional - The property name of the teams array in the return response.
         * @param {Object} options.params Additional data request params used to when loading items.
         * @param {function} options.callback The callback function called once all the items have loaded.
         */
        loadAllTeams: function (options) {
            var self = this;
            this.options = _.defaults(options, this.defaultOptions);
            this.loadedPages = 0;
            this.totalPages = teammanagement.returnCurrentSectionCount(teammanagement.current.section, 'teams');
            this.continueLoadingAll = true;
            this.pagination = {
                page: 1,
                hasMore: true
            };
            this.pageSize = this.options.pageSize;
            this.totalPages = Math.ceil(this.options.totalCount / this.pageSize);

            if (this.totalPages > 1) {
                this.loadingModalContainer = 'teams-loading-modal-container';
                var teamsLoadingModalContainer = document.createElement('div');
                teamsLoadingModalContainer.id = this.loadingModalContainer;
                document.body.appendChild(teamsLoadingModalContainer);

                // The utils prop extends functions defined inside component to be called outside
                var setLoadingModalUtils = function (utils) {
                    self.loadingModalUtils = utils;
                };

                var modalCloseCallback = function () {
                    teammanagement.abortRequestsParallelizationArray(self.requestsArrayIntervalId);
                };

                // Define Title and Description
                var headerTitleText = translation._("Loading Teams");
                var headerDescriptionText = translation._("We're loading your teams, this might take a few minutes.");

                this.loadingModal = React.createElement(LoadingModal, {
                    headerTitleText: headerTitleText,
                    headerDescriptionText: headerDescriptionText,
                    allowCloseText: translation._("Are you sure you want to stop loading your teams?"),
                    utils: setLoadingModalUtils,
                    closeCallback: modalCloseCallback
                }, '');

                ReactDOM.render(this.loadingModal, teamsLoadingModalContainer);
            }

            self.requestsArrayIntervalId = teammanagement.loadPage(
                this.options.loadMorePath,
                this.options.pageSize,
                this.options.teamsArrayPropertyName,
                this.options.totalCount,
                closePopup,
                self.loadingModalUtils,
                self.pagination,
                this.options.callback,
                LOADING_MODAL_ID,
                this.options.params,
                this.options.requestMethod
            );
        }
    };

window.teammanagement = teammanagement;

export default teammanagement;
