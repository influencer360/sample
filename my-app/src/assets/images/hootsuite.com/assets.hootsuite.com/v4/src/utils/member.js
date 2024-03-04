import _ from "underscore";
import snConfig from "core/social-network/config";
import darklaunch from "hs-nest/lib/utils/darklaunch";
import {
    getActionHistoryValue,
    setActionHistoryValue,
    deleteActionHistoryValue,
} from "fe-pg-lib-action-history";

var memberUtil = {
    getSnCollection: function () {
        return hs && hs.socialNetworks ? hs.socialNetworks : {};
    },
    getSnTypeUniqList: function () {
        const snColletion = this.getSnCollection();
        return _.chain(snColletion)
            .values()
            .pluck("type")
            .uniq()
            .filter((sn) => sn !== undefined)
            .value();
    },
    // returns true if the user has at least one Twitter account
    hasTwitterAccount: function () {
        return !!_.size(hs.socialNetworksKeyedByType[snConfig.c.TWITTER]);
    },

    hasFacebookAccount: function () {
        return (
            !!_.size(hs.socialNetworksKeyedByType[snConfig.c.FACEBOOK]) ||
            !!_.size(hs.socialNetworksKeyedByType[snConfig.c.FACEBOOKPAGE]) ||
            !!_.size(hs.socialNetworksKeyedByType[snConfig.c.FACEBOOKGROUP])
        );
    },

    hasInstagramAccount: function () {
        return !!_.size(hs.socialNetworksKeyedByType[snConfig.c.INSTAGRAM]);
    },

    checkUserEmail: function () {
        var email = hs.memberEmail || false;
        if (!email) {
            return false;
        }

        return !hs.memberIsEmailConfirmed;
    },

    hasSignedUpAfterDate: function (date) {
        var memberSignupDate = new Date(hs.memberSignupDate);
        return memberSignupDate - date > 0;
    },

    getTrialDuration: function () {
        const start = hs.memberTrialStartDate;
        const end = hs.memberTrialEndDate;

        if (!start || !end) {
            return -1;
        }

        const startMillis = Date.parse(start);
        const endMillis = Date.parse(end);
        const millisInADay = 86400000;

        const duration = Math.floor((endMillis - startMillis) / millisInADay);

        // if an account has no trial it still gets a
        // start and end trial date potentially slightly over 24 hours apart
        // so we count anything less than 2 days as 0 day trial duration
        return duration < 2 ? 0 : duration;
    },

    updateMemberData: function (modifiedData) {
        _.each(modifiedData, function (value, key) {
            var globalKey =
                "member" + key.charAt(0).toUpperCase() + key.slice(1);
            if (key == "fullName") {
                hs.memberName = value;
            } else if (key === "defaultTimezone") {
                hs.timezoneName = value;
            } else if (hs[globalKey]) {
                hs[globalKey] = value;
            }
        });
    },

    /**
     * Returns the member action history object (currently stored in hs.memberActionHistory)
     */
    getActionHistory: function () {
        return hs && hs.memberActionHistory ? hs.memberActionHistory : {};
    },

    /**
     * Returns a specific member action history value (currently stored in hs.memberActionHistory).
     * @param name
     */
    getActionHistoryValue: function (name) {
        if (darklaunch.isFeatureEnabled("PGR_624_ACTION_HISTORY_STORE")) {
            return getActionHistoryValue(name);
        } else {
            return hs && hs.memberActionHistory && hs.memberActionHistory[name]
                ? hs.memberActionHistory[name]
                : null;
        }
    },

    /**
     * Sends an action performed by the user to the backend, for storage in memberExtra.actionHistory
     * @param name
     * @param value
     * @return Promise
     */
    storeActionHistoryValue: function (name, value) {
        if (darklaunch.isFeatureEnabled("PGR_624_ACTION_HISTORY_STORE")) {
            return setActionHistoryValue(name, value);
        } else {
            if (!name || value === undefined) {
                return null;
            }

            //Pre-emptively update the ah object.
            if (hs && hs.memberActionHistory) {
                value = parseInt(value) ? parseInt(value) : value;
                value =
                    value.toString() == "true"
                        ? true
                        : value.toString() == "false"
                        ? false
                        : value;
                hs.memberActionHistory[name] = value;
            }
            return ajaxCall(
                {
                    url: "/ajax/member/store-action-history-value",
                    type: "POST",
                    data: { n: name, v: value },
                },
                "qm"
            );
        }
    },

    /**
     * Sends an action performed by the user to the backend, for storage in memberExtra.actionHistory
     * @param name
     */
    incrementActionHistoryValue: function (name) {
        if (darklaunch.isFeatureEnabled("PGR_624_ACTION_HISTORY_STORE")) {
            var value = getActionHistoryValue(name);
            var intValue = parseInt(value);

            if (value === undefined) {
                return setActionHistoryValue(name, 1);
            } else if (isFinite(intValue)) {
                return setActionHistoryValue(name, intValue + 1);
            }
        } else {
            if (!name) {
                return;
            }

            //Pre-emptively update the ah object.
            if (hs && hs.memberActionHistory) {
                hs.memberActionHistory[name] = parseInt(
                    hs.memberActionHistory[name]
                )
                    ? parseInt(hs.memberActionHistory[name]) + 1
                    : 1;
            }
            ajaxCall(
                {
                    url: "/ajax/member/increment-action-history-value",
                    type: "POST",
                    data: { n: name },
                },
                "qm"
            );
        }
    },

    /**
     * Removes a key from storage in memberExtra.actionHistory
     * @param name
     */
    removeActionHistoryValue: function (name) {
        if (darklaunch.isFeatureEnabled("PGR_624_ACTION_HISTORY_STORE")) {
            deleteActionHistoryValue(name);
        } else {
            if (!name) {
                return;
            }
            //Pre-emptively remove the ah value.
            if (hs && hs.memberActionHistory) {
                delete hs.memberActionHistory[name];
            }
            ajaxCall(
                {
                    url: "/ajax/member/remove-action-history-value?n=" + name,
                    type: "DELETE",
                },
                "qm"
            );
        }
    },
};

hs.memberUtil = hs.memberUtil || memberUtil;

export default memberUtil;
