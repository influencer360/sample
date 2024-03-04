import hootbus from "hs-nest/lib/utils/hootbus";
import events from "hs-events";
import member from "utils/member";
import {
    getPendoDarklaunchFlags,
    getPendoEntitlements,
    pendoHelpers,
} from "./utils";

import {
    getPendoVisitorData,
    hasMemberReachedSNMax,
    isOrgMember,
    updateAsyncDataToPendo,
    updatePendoVisitorMetadata,
} from "fe-lib-pendo";
import { getAllExperimentsVariation } from "fe-lib-optimizely";

export function initPendo() {
    runSnippet();

    var pendo = window["pendo"] || {};

    if (pendo.initialize && hs.memberId && hs.env) {
        const onRefreshSocialNetwork = function () {
            updatePendoVisitorMetadata({
                data: { social_account_max_reached: hasMemberReachedSNMax() },
            });
        };

        const onOrgListRendered = function () {
            updatePendoVisitorMetadata({
                data: { is_org_member: isOrgMember() },
            });
        };

        const onExperimentStarted = function (expData) {
            if (expData && expData.id) {
                updatePendoVisitorMetadata({
                    data: {["experiment_" + expData.id]: expData.variation},
                });
            }
        };

        hootbus.on(
            events.SOCIAL_NETWORK_REFRESH_SUCCESS,
            onRefreshSocialNetwork
        );

        hootbus.on(events.TEAM_MANAGEMENT_ORG_LIST_RENDERED, onOrgListRendered);
        hootbus.on(
            events.TEAM_MANAGEMENT_ORG_LIST_ITEM_RENDERED,
            onOrgListRendered
        );

        hootbus.on(
            events.OPTIMIZELY_EXPERIMENT_STARTED,
            onExperimentStarted
        );

        const gettingStarted = {
            getting_started_has_completed_schedule_post_task:
                member.getActionHistoryValue(
                    "getting_started.has_completed_schedule_post_task"
                ),
            getting_started_progress: member.getActionHistoryValue(
                "getting_started.progress"
            ),
            getting_started_task_create_post: member.getActionHistoryValue(
                "getting_started.task.create_post"
            ),
            getting_started_task_visit_analytics: member.getActionHistoryValue(
                "getting_started.task.visit_analytics"
            ),
            getting_started_task_visit_planner: member.getActionHistoryValue(
                "getting_started.task.visit_planner"
            ),
        };
        const socialnetworkTypeUniqueList = member.getSnTypeUniqList();
        const pendoDarklaunchFlags = getPendoDarklaunchFlags();
        const pendoEntitlements = getPendoEntitlements(hs);
        const experimentVariations = getAllExperimentsVariation()
        for (var key in experimentVariations) {
            experimentVariations["experiment_" + key] = experimentVariations[key];
            delete experimentVariations[key]
        }

        const visitor = getPendoVisitorData(
            gettingStarted,
            socialnetworkTypeUniqueList,
            pendoDarklaunchFlags,
            pendoEntitlements,
            experimentVariations,
        );

        pendo.initialize({
            excludeAllText: true,
            visitor,
            events: {
                ready: function () {
                    hootbus.emit(events.PENDO_READY);
                    updateAsyncDataToPendo();
                },
                guidesLoaded: function () {
                    hootbus.emit(events.PENDO_GUIDES_LOADED);
                },
                guidesFailed: function () {
                    hootbus.emit(events.PENDO_GUIDES_FAILED);
                },
            },
            account: {
                // id: 'ACCOUNT-UNIQUE-ID' // Required if using Pendo Feedback
                // name:         // Optional
                // is_paying:    // Recommended if using Pendo Feedback
                // monthly_value:// Recommended if using Pendo Feedback
                // planLevel:    // Optional
                // planPrice:    // Optional
                // creationDate: // Optional
                // You can add any additional account level key-values here,
                // as long as it's not one of the above reserved names.
            },
        });
    }

    /**
     * Expose helpers for Pendo Paywalls authors
     */
    window.pendoHelpers = pendoHelpers;
}

function runSnippet() {
    (function (p, e, n, d, o) {
        var v, w, x;
        o = p[d] = p[d] || {};
        o._q = o._q || [];
        v = [
            "initialize",
            "identify",
            "updateOptions",
            "pageLoad",
            "track",
            "getSerializedMetadata",
        ];
        for (w = 0, x = v.length; w < x; ++w)
            (function (m) {
                o[m] =
                    o[m] ||
                    function () {
                        o._q[m === v[0] ? "unshift" : "push"](
                            [m].concat([].slice.call(arguments, 0))
                        );
                    };
            })(v[w]);
    })(window, document, "script", "pendo");
}
