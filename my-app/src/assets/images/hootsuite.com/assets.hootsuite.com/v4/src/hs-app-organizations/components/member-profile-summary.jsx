/** @preventMunge */
'use strict';

import React from 'react';
import TooltipTrigger from 'hs-nest/lib/components/tooltip/tooltip-trigger';
import ProfileAvatar from 'hs-nest/lib/components/avatars/hs-profile-avatar/hs-profile-avatar';
import Button from 'hs-nest/lib/components/buttons/button';
import Icon from '@fp-icons/icon-base';
import Pencil from '@fp-icons/emblem-pencil';
import translation from 'utils/translation';
import utilStatic from 'utils/util_static';
import util from 'utils/util';
import { endsWith } from 'utils/string';
import trackingConstants from '../constants/tracking-constants';
import snUtil from 'core/social-network/util';

class MemberProfileSummary extends React.Component {
    onEditAccountClick(){
        window.loadSettings('account');
    }
    render() {
        var confirmAccount = function(){
            var createFreeAccountPath = '/academy-free-account';
            util.doRedirect(createFreeAccountPath, {verifyAccount:true});
        };
        var size = 100;
        var avatarHref = utilStatic.rootifyMemberAvatar(this.props.member.avatar, this.props.member.email);
        avatarHref = snUtil.getOriginalAvatar(avatarHref);
        const editProfileText = translation._('Edit profile')

        var emailSection;
        var memberEmail = this.props.member.email;
        if (endsWith(memberEmail, 'hootsuite.biz')) {
            emailSection = <Button btnStyle='primary'
                style={{marginTop: "20px"}}
                onClick={confirmAccount}
                trackingAction='confirm_account' >{translation._("Confirm Account")}</Button>
        } else {
            emailSection = <h2 className="accountEmail">{this.props.member.email}</h2>;
        }

        return(
            <div className='filterContainer' data-origin-id={trackingConstants.memberProfile}>
                <ProfileAvatar alt={this.props.member.fullName}
                               className='avatar'
                               onClick={this.onEditAccountClick}
                               round={false}
                               size={size}
                               src={avatarHref} />
                <div className="accountDetails">
                    <h1 className="accountName">{this.props.member.fullName}</h1>
                    {emailSection}
                    <h3 className="accountCompany t-l">{this.props.member.companyTitle}</h3>
                    <div className="controls">
                        <TooltipTrigger content={editProfileText} placement="top">
                            <Button aria-label={editProfileText} btnStyle='icon' onClick={this.onEditAccountClick} trackingAction='edit_profile'>
                                <Icon glyph={Pencil} />
                            </Button>
                        </TooltipTrigger>
                    </div>
                </div>
            </div>
        );
    }
}

MemberProfileSummary.displayName = 'MemberProfileSummary';

export default MemberProfileSummary;
