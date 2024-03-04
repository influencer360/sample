/** @preventMunge */
"use strict";

import React from "react";
import PropTypes from "prop-types";
import snActions from "apps/social-network/actions";
import translation from "utils/translation";
import teammanagement from "team/management/teammanagement";
import hootbus from "utils/hootbus";
import trackerDataLab from "utils/tracker-datalab";

import { SOCIAL_NETWORKS } from "hs-nest/lib/actions";

import "utils/status_bar";
import { getSocialNetworkNameByType } from "utils/string";

import "./social-profile-list-item.less";

import FluxComponent from "hs-nest/lib/components/flux-component";
import Icon from "@fp-icons/icon-base";
import Gear from "@fp-icons/emblem-gear";
import InfoCircle from "@fp-icons/symbol-info-circle";
import MenuButton from "hs-nest/lib/components/buttons/menu-button";
import SocialNetworkAvatar from "hs-nest/lib/components/avatars/social-network-avatar/social-network-avatar";
import trackingConstants from "../constants/tracking-constants";
import { types } from "hs-nest/lib/constants/social-networks";
import { InfoPopover, Placement } from "fe-pg-comp-info-popover";

const { INSTAGRAM, INSTAGRAMBUSINESS } = types;

class SocialProfileListItem extends React.Component {
    render() {
        var goToSocialNetwork = function (socialNetworkId) {
            var trackingOrigin = trackingConstants.socialNetworkListPath;
            return function () {
                trackerDataLab.trackCustom(
                    trackingOrigin,
                    "view_social_network"
                );
                window.location.hash =
                    "#/organizations/social-networks/?snId=" + socialNetworkId;
            };
        };
        var baseRoute = "/social-networks/?snId=";
        var flux = this.props.flux;
        var shareMenuItem;

        // it's not obvious at all what is happening here, so read carefully
        //
        // there are two modals that can be triggered here:
        //   - the old modal that lives in this repository
        //     - verbiage is TRANSFER social network
        //     - plain old js
        //     - allows for selecting an organization
        //     - found at: static/js/src/apps/social-network/views/transfer-network-modal.js
        //
        //   - the new modal that lives in a separate repository
        //     - verbiage is SHARE social network
        //     - react / jsx
        //     - does not allow to select an organization to share to
        //     - found at: https://github.hootops.com/Platform/hs-app-organization
        //     - wrapped in dashboard by this class: static/js/src/apps/overlay-manager/modals/transfer-social-network-modal/components/transfer-social-network-modal.jsx
        //
        // hs.canSeeNewTeamsOrgsUxReleaseThree is
        //   - TRUE if the user has only one org
        //   - FALSE if the user has more than one org
        //
        // if the value is true, then the new modal will be used, otherwise the old modal will be used
        //
        // my guess is that the new modal doesn't support all of the old functionality of the old one, like selecting
        // orgs - so when a user has more than one org, we have to default back to the old modal.
        //
        // teams plan also needs this old view
        //
        if (
            hs.canSeeNewTeamsOrgsUxReleaseThree &&
            hs.memberPlan !== "TEAMS_PLAN" &&
            hs.memberPlan !== "TEAM3S"
        ) {
            shareMenuItem = {
                label: translation._("Share"),
                value: this.props.socialNetwork,
                onSelect: function (label, value) {
                    trackerDataLab.trackCustom(
                        trackingConstants.socialNetworkListPath,
                        "transfer"
                    );
                    snActions.showTransferSocialNetworkModal({
                        socialNetwork: value,
                    });
                },
            };
        } else {
            shareMenuItem = {
                label: translation._("Transfer to..."),
                value: this.props.socialNetwork.socialNetworkId,
                onSelect: function (label, value) {
                    trackerDataLab.trackCustom(
                        trackingConstants.socialNetworkListPath,
                        "transfer"
                    );
                    snActions.transfer(value, {
                        onSuccess: function (data) {
                            if (data.success) {
                                hootbus.emit(
                                    "socialNetwork:refresh:success",
                                    data
                                );
                            }
                        },
                    });
                },
            };
        }

        var menuItems = [
            {
                label: translation._("Reconnect"),
                value: this.props.socialNetwork,
                onSelect: function (label, value) {
                    var trackingOrigin =
                        trackingConstants.socialNetworkListPath;
                    trackerDataLab.trackCustom(trackingOrigin, "reconnect");
                    snActions.reconnect(value, null);
                },
            },
            shareMenuItem,
            {
                label: translation._("Settings"),
                value: this.props.socialNetwork.socialNetworkId,
                onSelect: function (label, value) {
                    var route = baseRoute + value;
                    var trackingOrigin =
                        trackingConstants.socialNetworkListPath;
                    route += "&tab=settings";
                    trackerDataLab.trackCustom(trackingOrigin, "view_settings");
                    teammanagement.redirectTo(route);
                },
            },
            {
                label: translation._("Sync avatar"),
                value: this.props.socialNetwork.socialNetworkId,
                onSelect: function (label, value) {
                    flux.getActions(SOCIAL_NETWORKS).syncAvatar(value);
                },
            },
            {
                group: true,
                items: [
                    {
                        label: translation._("Remove from Hootsuite"),
                        value: this.props.socialNetwork.socialNetworkId,
                        onSelect: function (label, value) {
                            var trackingOrigin =
                                trackingConstants.socialNetworkListPath;
                            trackerDataLab.trackCustom(
                                trackingOrigin,
                                "remove_social_network"
                            );
                            teammanagement.removeSocialNetwork(
                                value,
                                function (data) {
                                    if (data.success) {
                                        flux.getActions(SOCIAL_NETWORKS).remove(
                                            value
                                        );
                                        hootbus.emit(
                                            "socialNetwork:refresh:success",
                                            data
                                        );
                                    }
                                }
                            );
                        },
                    },
                ],
            },
        ];

        // Display different default avatar for Instagram
        if (
            !this.props.socialNetwork.avatar &&
            (this.props.socialNetwork.type === INSTAGRAM ||
                this.props.socialNetwork.type === INSTAGRAMBUSINESS)
        ) {
            var assetsHost =
                process.env.NODE_ENV === "production"
                    ? "https://i.hootsuite.com"
                    : "https://staging-i.hootsuite.com";
            this.props.socialNetwork.avatar =
                assetsHost +
                "/assets/channel-integrations/default_avatar_ig_personal.svg";
        }

        var profileType = this.props.socialNetwork.type;

        var instagramPersonalTooltip;
        if (profileType === INSTAGRAM) {
            var tooltipTitle = translation._("Why is my Instagram different?");
            var tooltipContent = translation._(
                "Instagram has reduced functionality for Personal profiles. Change your Instagram profile type to Instagram Business to enable Hootsuite functionality."
            );
            var tooltipLink = translation._(
                "Learn how to change your Instagram profile"
            );
            const content = (
                <div>
                    <p>{tooltipContent}</p>
                    <br />
                    <p>
                        <a
                            target="_blank"
                            rel="noopener noreferrer"
                            href="https://help.hootsuite.com/hc/articles/1260802308530"
                        >
                            <strong>{tooltipLink}</strong>
                        </a>
                    </p>
                </div>
            );
            instagramPersonalTooltip = (
                <InfoPopover
                    placement={Placement.TOP}
                    title={tooltipTitle}
                    content={content}
                >
                    <Icon glyph={InfoCircle} size={20} />
                </InfoPopover>
            );
        }

        return (
            <li
                className="rc-SocialProfileListItem _profileListItem"
                data-origin-id={this.props.socialNetwork.socialNetworkId}
                onClick={goToSocialNetwork(
                    this.props.socialNetwork.socialNetworkId
                )}
                title={this.props.socialNetwork.username}
            >
                <div className="-profileAvatar">
                    <FluxComponent>
                        <SocialNetworkAvatar {...this.props.socialNetwork} />
                    </FluxComponent>
                </div>

                <span className="-profileName">
                    {this.props.socialNetwork.username}
                </span>

                <span className="-profileType">
                    {getSocialNetworkNameByType(profileType)}
                </span>

                <div className="-profileButtons">
                    {instagramPersonalTooltip}
                    <MenuButton
                        btnStyle="icon"
                        className="-profileOptions"
                        containerName="teamManagementProfilePage"
                        containerType="class"
                        hasMoreIcon={false}
                        isIcon
                        items={menuItems}
                        trackingAction="show_options"
                    >
                        <Icon glyph={Gear} size={20} />
                    </MenuButton>
                </div>
            </li>
        );
    }
}

SocialProfileListItem.displayName = "SocialProfileListItem";

SocialProfileListItem.propTypes = {
    flux: PropTypes.object,
    socialNetwork: PropTypes.object,
};

export default SocialProfileListItem;
