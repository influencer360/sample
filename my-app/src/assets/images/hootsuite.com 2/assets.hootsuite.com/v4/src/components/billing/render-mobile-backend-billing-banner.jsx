import React from 'react';
import ReactDOM from 'react-dom';
import translation from 'hs-nest/lib/utils/translation';
import {Banner, TYPE_WARNING} from 'fe-comp-banner';
import cookie from '../../utils/cookie';
import hootbus from 'utils/hootbus';

export default (parent) => {
    const onClose = () => {
        cookie.remove('showBillingMobileBackendBanner');
        ReactDOM.unmountComponentAtNode(parent);
        hootbus.emit('fixedHeader:resizeHeader');
    };

    const mobileBackendText = {
        'appleStore': translation._('Apple Store'),
        'googlePlay': translation._('Google Play store')
    }
    const backendSource = mobileBackendText[cookie.read('showBillingMobileBackendBanner')];
    const messageText = translation._(`Payments to Hootsuite are processed using the payment method you have previously ` +
        `established in the ${backendSource}. Please visit the Hootsuite mobile app to manage your payment method ` +
        `or make changes to your plan.`);

    const bannerContent =
            React.createElement(Banner, {
                messageText: messageText,
                type: TYPE_WARNING,
                closeAction: onClose
            });

    ReactDOM.render(bannerContent, parent);
};
