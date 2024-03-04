"use strict";

import React from 'react';
import translation from 'utils/translation';
import Popover from 'hs-nest/lib/components/popovers/popover';
import TetheredElement from 'hs-nest/lib/utils/tethered-element';
import Constants from 'components/publisher/constants';
import darklaunch from 'hs-nest/lib/utils/darklaunch';
import 'utils/ajax';

import './bulk-composer-cta-popover.less';

export default {
    render: function (target, hasSeenPopover, hasSeenNewBulkComposerVersion) {
        if (hasSeenPopover && hasSeenNewBulkComposerVersion) {
            return;
        }

        var onClose = function () {
            hs.memberExtras = hs.memberExtras || {};
            if (!hasSeenPopover) {
                hs.memberExtras.hasSeenBulkComposerCtaPopover = true;
                hs.memberExtras.bulkComposerVersion = Constants.BULK_COMPOSER.VERSION;
                ajaxCall({
                    method: 'POST',
                    url: '/ajax/member/popup-seen',
                    data: {n: 'BULK_COMPOSER_CTA_POPOVER'}
                }, 'q1');
                ajaxCall({
                    method: 'POST',
                    url: '/ajax/member/bulk-composer-version-seen',
                    data: {newVersion: Constants.BULK_COMPOSER.VERSION}
                }, 'q1');
            } else if (!hasSeenNewBulkComposerVersion) {
                hs.memberExtras.bulkComposerVersion = Constants.BULK_COMPOSER.VERSION;
                ajaxCall({
                    method: 'POST',
                    url: '/ajax/member/bulk-composer-version-seen',
                    data: {newVersion: Constants.BULK_COMPOSER.VERSION}
                }, 'q1');
            }
            tetheredPopover.destroy();
            document.body.removeEventListener('click', onClose);
        };

        var tetherOptions = {
            target: target,
            attachment: 'top left',
            targetAttachment: 'bottom left',
            offset: '-5px 0',
            constraints: [{
                to: 'scrollParent',
                pin: false
            }],
            followTarget: true
        };

        if (window.location.hash === '#/publisher/bulkcomposer') {
            return null;
        }

        var popover = null;
        if (!hasSeenPopover) {
            popover= (
                <Popover
                    className={'x-bulkComposerCtaPopover'}
                    hasCloseButton
                    onRequestHide={onClose}
                    popverType={'default'}
                    titleText={translation._('Bulk Message Uploader is evolving')}>
                    <p>{translation._('Our existing Bulk Message Uploader is evolving to become Bulk Composer; an improved tool to make composing and scheduling messages even easier. Save time, stay organized, and confidently schedule multiple messages at once with the new Bulk Composer.')}</p>
                    <ul>
                        <li>{translation._('Review scheduled messages in one view')}</li>
                        <li>{translation._('Add images')}</li>
                        <li>{translation._('Customize link previews')}</li>
                    </ul>
                </Popover>
            );
        } else if (!hasSeenNewBulkComposerVersion) {
            if (darklaunch.isFeatureEnabled('PUB_BULK_COMPOSER_REMOVE_BETA')) {
                // Latest version goes here. Change the above dl code to the new dl code, and move this version to the else when updating the version
                popover = (
                    <Popover
                        className={'x-bulkComposerCtaPopover'}
                        hasCloseButton
                        onRequestHide={onClose}
                        popverType={'default'}
                        titleText={translation._('Bulk Composer moves out of Beta')}>
                        <p>{translation._('Bulk Composer is getting ready for release. Please give it a try and let us know if it can be improved for you before it replaces the old Bulk Uploader.')}</p>
                    </Popover>
                );
            } else {
                // Previous version goes here. By moving it down, we also cleanup the old dl code when we add a new one
                popover = (
                    <Popover
                      className={'x-bulkComposerCtaPopover'}
                      hasCloseButton
                      onRequestHide={onClose}
                      popverType={'default'}
                      titleText={translation._('You asked, we listened!')}>
                      <p>{translation._('Shortening links is now optional, plus images from your links can be directly uploaded to Twitter with one click.')}</p>
                    </Popover>
                );
            }
        }

        if (popover) {
            var tetheredPopover = new TetheredElement(popover, tetherOptions);
            document.body.addEventListener('click', onClose);
        }
    }
};
