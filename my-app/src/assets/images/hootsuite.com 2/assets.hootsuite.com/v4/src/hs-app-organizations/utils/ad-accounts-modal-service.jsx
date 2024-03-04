"use strict";

import adAccountsApiService from "./ad-accounts-api-service";
import adAccountConstants from "../constants/ad-account-constants";
import adAccountListAuthModal from "../components/ad-accounts/ad-account-list-auth-modal";
import adAccountListNoAccountsModal from "../components/ad-accounts/ad-account-list-no-accounts-modal";
import adAccountListNoPermissionsModal from "../components/ad-accounts/ad-account-list-no-permissions-modal";

export default {
    openAddAdAccountsModal: function (
        memberId,
        socialNetworkId,
        socialNetworkType,
        callback
    ) {
        this.checkSocialProfilePermissionsPromise(socialNetworkId).then(
            (permissions) => {
                if (
                    !permissions[socialNetworkId] ||
                    !permissions[socialNetworkId][
                        adAccountConstants.permissionCreateAds
                    ]
                ) {
                    return adAccountListNoPermissionsModal.render(
                        socialNetworkType
                    );
                }

                return this.checkExternalAdAccountsPromise(
                    memberId,
                    socialNetworkId,
                    socialNetworkType,
                    callback
                );
            }
        );
    },

    checkSocialProfilePermissionsPromise: function (socialNetworkId) {
        return adAccountsApiService
            .getSocialProfilePermissionsPromise(socialNetworkId)
            .then((results) => results.permissions || {});
    },

    checkExternalAdAccountsPromise: function (
        memberId,
        socialNetworkId,
        socialNetworkType,
        callback
    ) {
        return adAccountsApiService
            .getExternalAdAccountsPromise(socialNetworkId)
            .then((results) => {
                if (results.ad_accounts.length > 0) {
                    adAccountListAuthModal.render(
                        memberId,
                        socialNetworkId,
                        socialNetworkType,
                        callback
                    );
                } else {
                    adAccountListNoAccountsModal.render(socialNetworkType);
                }
            });
    },
};
