"use strict";

import React from 'react';
import ReactDOM from 'react-dom';
import translation from 'utils/translation';
import util from 'utils/util';
import darklaunch from 'utils/darklaunch';

import SimpleModal from 'hs-nest/lib/components/modal/simple-modal';
import StandardModal from 'hs-nest/lib/components/modal/standard-modal';
import Button from 'hs-nest/lib/components/buttons/button';

export function SessionExpiredModal({
    hasUserSessionBeenKickedOut,
    maxSessionsAllowed,
    kickedOutUserIp,
    kickedOutTime
}) {
    const titleText = translation._('Oh, your session expired');
    const footerContent = (
        <span>
            <Button btnStyle='primary' onClick={() => util.doRedirect('/login')}>
                {translation._('Sign in')}
            </Button>
        </span>
    );
    let modalBody = (
        <div className='modal-body'>
            <p>{translation._('To keep your account safe, we’ve signed you out. Please sign in again to return to your dashboard.')}</p>
        </div>
    );

    if (hasUserSessionBeenKickedOut) {
        const p1 = translation._("There are too many sessions open for this account. You will need to sign in again to restore your session.");
        const p2 = translation._("Hootsuite users are allowed to have up to %d sessions open at the same time. You may have exceeded this by signing in on multiple computers or browsers.")
            .replace('%d', maxSessionsAllowed);
        const p3 = translation._("Your session was signed out by: ") + 'IP address (' + kickedOutUserIp + ' at ' + kickedOutTime + ')';

        modalBody = (
            <div className='modal-body'>
                <p>{p1}</p>
                <p>{p2}</p>
                <p>{p3}</p>
            </div>
        );
    }

    const props = {
        titleText,
        footerContent,
        hasCloseButton: false,
        onRequestHide: () => {} //prop is required but not needed since close button isn't rendered
    }

    return darklaunch.isFeatureEnabled('DS2_66_LARGER_EXPIRED_MODAL') ? (
        <StandardModal {...props}>
            {modalBody}
        </StandardModal>
    ) : (
        <SimpleModal {...props} width="550">
            {modalBody}
        </SimpleModal>
    )
}

export function renderByElementId(id, data = {}) {
    ReactDOM.render(
        <SessionExpiredModal {...data}/>,
        document.getElementById(id)
    );
}
