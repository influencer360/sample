/** @preventMunge */
'use strict';

import translation from 'utils/translation';
import optInUtil from 'utils/opt-in';
import darklaunch from 'utils/darklaunch';

import Constants from 'components/publisher/constants';

import getHsAppPublisher from 'components/publisher/get-hs-app-publisher';

import './render-bulk-composer-optin-modal.less';

const BULK_COMPOSER_OPT_IN_ID = 'bulkComposerOptIn'

const renderOptInModal = () => {
    let parentNode = document.querySelector(`#${BULK_COMPOSER_OPT_IN_ID}`);
    if (parentNode === null) {
        parentNode = document.createElement('div');
        parentNode.id = BULK_COMPOSER_OPT_IN_ID;
        document.body.appendChild(parentNode);
    }

    getHsAppPublisher().then(({ renderOptInModal }) => {
        const props = {
            cancelButtonText: translation._('Not Now'),
            confirmButtonText: translation._('Try it Now'),
            isBeta: darklaunch.isFeatureDisabled('PUB_BULK_COMPOSER_REMOVE_BETA'),
            onSetVersionSuccess: () => {
                optInUtil.bulkComposerOptIn();
                hs.memberExtras.bulkComposerVersion = Constants.BULK_COMPOSER.VERSION;
                window.location = '#/publisher/bulkcomposer'; // let the router open the page
            },
            onSetVersionFailure: () => hs.statusObj.update(translation._('An unknown error occurred'), 'error', true),
            newVersion: Constants.BULK_COMPOSER.VERSION,
            title: translation._('Introducing Bulk Composer '),
            width: '600'
        }; 
        renderOptInModal(props, parentNode, BULK_COMPOSER_OPT_IN_ID);
    });
};

export default renderOptInModal;
