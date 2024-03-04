import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'underscore';
import translation from 'utils/translation';
import './clone-streams-modal.less';

import StandardModal from 'hs-nest/lib/components/modal/standard-modal';
import ModalScrollGroup from 'hs-nest/lib/components/modal/modal-scroll-group';
import Button from 'hs-nest/lib/components/buttons/button';
import Icon from '@fp-icons/icon-base';
import CheckCircle from '@fp-icons/symbol-check-circle';
import LogoTwitter from '@fp-icons/product-logo-twitter';
import LogoInstagram from '@fp-icons/product-logo-instagram';
import LogoFacebook from '@fp-icons/product-logo-facebook';
import LogoYoutube from '@fp-icons/product-logo-youtube';
import LogoLinkedin from '@fp-icons/product-logo-linkedin';
import LogoPuzzle from '@fp-icons/emblem-puzzle2020';
import CloneStreamsMultiSelector from './clone-streams-multi-selector';
import AppBase from 'core/app-base';
import hootbus from 'utils/hootbus';
import trackerDatalab from 'utils/tracker-datalab';
import { types as socialNetworkTypes } from 'hs-nest/lib/constants/social-networks';

const ModalFooter = function() {
    return (
        <span>
            <Button btnStyle='secondary' onClick={this.userEventDismiss.bind(this)}>{translation._('Don’t copy streams')}</Button>
            <Button btnStyle='primary' className='_primaryButton' onClick={this.onCopyStreams.bind(this)}>{this.renderPrimaryButtonText()}</Button>
        </span>
    );
}

export default AppBase.extend({
    TRACKING_ORIGIN: 'web.dashboard.clone_streams.modal',
    selectedStreamsCount: 0,

    messageEvents: {
        'modals:clone:streams:destroy': 'onDismiss'
    },

    onInitialize: function (options) {
        // Store the member data for the selected members
        options = options || {};
        _.extend(this, _.pick(options, 'teams', 'memberEmails'));
    },

    renderMemberAddedList () {
        var memberListCopy;

        var firstMemberEmail = this.memberEmails[0];
        var otherMemberCount = this.memberEmails.length - 1;

        if (otherMemberCount === 0) {
            memberListCopy = translation._('has been added to your organization.');
        } else if (otherMemberCount === 1) {
            memberListCopy = translation._('and %s1 other member has been added to your organization.').replace('%s1', otherMemberCount);
        } else {
            memberListCopy = translation._('and %s1 other members have been added to your organization.').replace('%s1', otherMemberCount);
        }

        return (
            <div className='memberAddedList'>
                <span className='-successIcon'>
                    <Icon fill='currentColor' size={26} glyph={CheckCircle} />
                </span>

                <div className='-successCopy'>
                    <span className='-email'>{firstMemberEmail}</span>
                    {memberListCopy}
                </div>
            </div>
        )
    },

    // Return the appropriate SN based on SN Type
    renderAvatar (snType) {
        var sourceKey;

        switch (snType) {
            case socialNetworkTypes.TWITTER:
            case 'TWITTER_SEARCH': sourceKey = LogoTwitter; break; // not a valid social network type

            case socialNetworkTypes.INSTAGRAM: sourceKey = LogoInstagram; break;

            case socialNetworkTypes.FACEBOOK:
            case socialNetworkTypes.FACEBOOKPAGE:
            case socialNetworkTypes.FACEBOOKGROUP: sourceKey = LogoFacebook; break;

            case socialNetworkTypes.YOUTUBECHANNEL: sourceKey = LogoYoutube; break;

            case socialNetworkTypes.LINKEDIN:
            case socialNetworkTypes.LINKEDINCOMPANY: sourceKey = LogoLinkedin; break;

            case 'APP': sourceKey = LogoPuzzle; break; // not a valid social network type

            default: break;
        }

        if (sourceKey) {
            return (
                <Icon fill='currentColor' size={14} glyph={sourceKey} />
            );
        }
    },

    renderPrimaryButtonText: function () {
        var primaryButtonText;

        if (this.selectedStreamsCount === 0) {
            primaryButtonText = translation._('Copy streams');
        } else if (this.selectedStreamsCount === 1) {
            primaryButtonText = translation._('Copy %d stream').replace('%d', this.selectedStreamsCount);
        } else {
            primaryButtonText = translation._('Copy %d streams').replace('%d', this.selectedStreamsCount);
        }

        return primaryButtonText;
    },

    renderFooter: function() {
        return ModalFooter.call(this);
    },

    currentlySelectedStreamsCount () {
        var childItemSelectedCount = 0;

        _.each(this.items, (parentItem) => {
            _.each(parentItem.children, (childItem) => {
                if (childItem.selected) {
                    childItemSelectedCount++;
                }
            })
        });

        return childItemSelectedCount;
    },

    onMultiSelectorUpdate: function () {
        // Store the latest value
        this.selectedStreamsCount = this.currentlySelectedStreamsCount();

        // TODO: This is hacky, we should create a React-friendly AppBase with state
        this.$primaryButton = this.$primaryButton || document.querySelector('._primaryButton')

        this.$primaryButton.innerText = this.renderPrimaryButtonText()

        if (this.selectedStreamsCount === 0) {
            this.$primaryButton.setAttribute('disabled', '');
        } else {
            this.$primaryButton.removeAttribute('disabled')
        }
    },

    renderModal: function () {
        var modalScrollGroupID = 'dashboard:cloneStreamsModal:modalScrollGroup';

        trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'clone_streams_opened');

        ReactDOM.render(
            <StandardModal
                footerContent={this.renderFooter()}
                enableScrollableContent={false}
                onRequestHide={this.userEventDismiss.bind(this)}
                titleText={translation._('Give new members access')}>

                {this.renderMemberAddedList()}

                <p className='-selectHeading'>{translation._('Select the tabs and streams to copy:')}</p>

                <ModalScrollGroup id={modalScrollGroupID} maxHeight={650} minHeight={56}>
                    <CloneStreamsMultiSelector items={this.items} modalScrollGroupID={modalScrollGroupID} ref={(ref) => {this.cloneStreamsMultiSelectorRef = ref;}} onUpdate={this.onMultiSelectorUpdate.bind(this)} />
                </ModalScrollGroup>
            </StandardModal>
            , this.container
        );

        // Call after the multi selector has rendered
        this.onMultiSelectorUpdate();
    },

    render: function () {
        this.container = document.createElement('div');
        this.container.setAttribute('id', 'cloneStreamsModal');
        document.body.appendChild(this.container);

        var teamIds = '';

        if (this.teams) {
            teamIds = _.keys(this.teams).join(',');
        }

        ajaxCall({
            url: '/ajax/member/get-tabs-and-streams-for-teams',
            data: { teamIds: teamIds },
            type: 'GET',
            success: function (data) {
                if (data && data.tabs && data.boxes) {
                    this.items = this.formatTabAndBoxData(data.tabs, data.boxes);
                } else {
                    this.onDismiss();
                    return;
                }
                //No streams applicable to selected teams for cloning.
                if (_.flatten(this.items).length === 0) {
                    trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'clone_streams_eligible_but_no_streams');
                    this.onDismiss();
                    return;
                }

                this.renderModal();
            }.bind(this)
        }, 'qm');
    },

    getBoxById (tabBoxes, boxId) {
        var selectedBox;

        _.each(tabBoxes, (box) => {
           if (parseInt(box.boxId, 10) === parseInt(boxId, 10)) {
               selectedBox = box;
           }
        });

        return selectedBox;
    },

    formatTabAndBoxData (tabs, boxes) {
        var formattedItems = [];

        _.each(tabs, (tab) => {
            var currentChildren = [];

            var currentTabWithStreams = {
                label: tab.title,
                value: tab.tabId,
                isExpanded: false,
                selected: false,
            };

            var tabBoxes = boxes[tab.tabId];

            if (tabBoxes.length) {
                _.each(tab.boxOrder, (boxId) => {
                    var box = this.getBoxById(tabBoxes, boxId);
                    if (box) {
                        currentChildren.push(
                            {
                                label: box.title,
                                value: box.boxId,
                                avatar: this.renderAvatar(box.socialNetworkType),
                                selected: false
                            }
                        );
                    }
                });

                _.extend(currentTabWithStreams, {children: currentChildren});

                formattedItems.push(currentTabWithStreams);
            }
        });

        return formattedItems;
    },

    onCopyStreams () {
        trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'copy_streams_clicked');

        var boxIds = [];

        // Get all of the boxes that are currently selected
        // Note: Box consolidation logic (ie - into appropriate Tab) is performed separately
        _.each(this.cloneStreamsMultiSelectorRef.state.items, (tab) => {
            _.each(tab.children, (child) => {
                if (child.selected) {
                    boxIds.push(child.value);
                }
            })
        });

        if (boxIds.length === 0) {
            hs.statusObj.update(translation._('Please choose at least one stream to copy'), 'warning', true);
            return;
        }

        var formData = {
            boxIds: boxIds,
            memberEmails: this.memberEmails
        };

        ajaxCall({
            url: "/ajax/member/clone-streams-for-user",
            type: 'POST',
            data: formData,
            success: function () {
                var successMessage = translation._('Clone stream invites sent successfully.');
                hs.statusObj.update(successMessage, "success", true, 4000);

                this.onDismiss();
            }.bind(this)
        }, 'qm');
    },

    /**
     * Called whenever the user manually dismisses the modal (close or dismiss btn)
     */
    userEventDismiss () {
        trackerDatalab.trackCustom(this.TRACKING_ORIGIN, 'clone_streams_invite_modal_dismissed');
        this.onDismiss();
    },

    onDismiss () {
        setTimeout(() => {
            if (this.container) {
                this.container.parentNode.removeChild(this.container);
            }
        });

        AppBase.prototype.destroy.call(this);
        hootbus.emit('notify:overlay:closed', 'modal', 'cloneStreams');
    }
});


