import { PRODUCTION, STAGING, DEV, env } from 'fe-lib-env';
import { apertureApiRequest } from 'fe-comp-aperture';
import { add as addCallout } from 'fe-lib-async-callouts';
import { TYPE_ERROR, TYPE_SUCCESS } from 'fe-comp-banner';
import { CALLOUTS } from 'fe-comp-callout';
import translation from 'utils/translation';

const apertureDomains = {
  [DEV]: 'development-api-services.hootsuite.com',
  [STAGING]: 'staging-api-services.hootsuite.com',
  [PRODUCTION]: 'api-services.hootsuite.com'
}
const apertureDomain = apertureDomains[env()];

const ACCOUNT_SERVICE_PATH = '/service/billing/accounts';
const ERROR_TOAST_TIMEOUT = 30000;

/**
 * Helper method for sending Aperture requests
 * @param {string} method
 * @param {string} url
 * @param {object} body
 * @return {Promise}
 */
function apertureRequest(method, url, body = {}) {
    return apertureApiRequest(
        apertureDomain,
        url,
        {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
        }
    );
}

/**
 * Apply a coupon to the account
 * @param {int} memberId
 * @param {string} couponCode
 * @return {Promise}
 */
async function applyAccountCoupon(memberId, couponCode) {
    const url = `${ACCOUNT_SERVICE_PATH}/${memberId}/apply-coupon/${couponCode}`;
    try {
        const response = await apertureRequest('POST', url);
        if (response) {
          return await response.json();
        }
        throw new Error('Apply coupon to account failed: no response returned.');
    } catch (e) {
        throw new Error(
          'Apply coupon to account failed with an exception.',
          { cause: e }
        );
    }
}

/**
 * Delete a coupon from account
 * @param {int} memberId
 * @param {string} couponCode
 * @return {Promise}
 */
async function removeCouponFromAccount(memberId, couponCode) {
    const url = `${ACCOUNT_SERVICE_PATH}/${memberId}/coupons/${couponCode}`;
    try {
        const response = await apertureRequest('DELETE', url);
        if (response) {
          return await response.json();
        }
        throw new Error('Remove coupon from account failed: no response returned.');
    } catch (e) {
        throw new Error(
          'Remove coupon from account failed with an exception.',
          { cause: e }
        );
    }
}

/**
 * Show user facing success/error message for coupon application result
 * @param {string} type
 * @param {string} messageText
 * @return {Promise}
 */
function showToast(type, messageText) {
  addCallout({
    calloutType: CALLOUTS.TOAST.NAME,
    type,
    messageText,
    timeout: ERROR_TOAST_TIMEOUT,
  });
}

/**
 *
 * @param {int} memberId
 * @param {string} couponCode
 * @returns {Promise}
 */
async function applyCoupon(memberId, couponCode) {
  try {
      const successMessage = translation._('Coupon successfully applied.');
      const res = await applyAccountCoupon(memberId, couponCode);
      const errorCode = res && res.errors && res.errors[0];
      if (errorCode) {
        switch (errorCode) {
          case 15003: {
            /**
             * Coupons can be on the account but 'expired' which means they no longer
             * provide a discount to the user because the active duration has passed.
             *
             * Expired coupons are filtered out by the endpoint so they won't be returned,
             * but the code is still considered 'applied' on the aria account so trying to
             * apply it again will error.
             *
             * Removing and reapplying refreshes the coupon duration.
             */

            const removeRes = await removeCouponFromAccount(memberId, couponCode);
            const removeErrorCode = removeRes && removeRes.errors && removeRes.errors[0];
            if (removeErrorCode) {
              throw new Error(
                `Remove coupon from account failed with error code ${removeErrorCode}.`,
                { cause: removeRes }
              );
            }

            const reapplyRes = await applyAccountCoupon(memberId, couponCode);
            const reapplyErrorCode = reapplyRes && reapplyRes.errors && reapplyRes.errors[0];
            if (reapplyErrorCode) {
              throw new Error(
                `Re-apply coupon to account failed with error code ${reapplyErrorCode}.`,
                { cause: reapplyRes }
              );
            }

            showToast(TYPE_SUCCESS, successMessage);
            break;
          }
          default:
            throw new Error(
              `Apply coupon to account failed with error code ${errorCode}.`,
              { cause: res }
            );
        }
      }
      showToast(TYPE_SUCCESS, successMessage);
    } catch (error) {
      const errorMessage = translation
        ._('The coupon code "%s" is no longer valid.')
        .replace('%s', couponCode);
      showToast(TYPE_ERROR, errorMessage);
      // eslint-disable-next-line no-console
      console.error('Apply coupon to account failed.', error);
    }
}

export { applyCoupon }
