/** @preventMunge */
"use strict";

import messageActionsFactory from "../../../src/components/publisher/message-actions-factory";
import getHsAppPublisher from "components/publisher/get-hs-app-publisher";

let RenderMessagePreviewModal;
RenderMessagePreviewModal = {
    asSingleMessage: (
        element,
        messageId,
        messageType,
        isPreScreen,
        isUnscheduled,
        showVideoPopup,
        showYoutubeVideoPopup,
        timezoneOffset,
        view,
        isLegacy,
        isApproval,
        isLocked
    ) => {
        getHsAppPublisher().then(({ TetheredMessagePreviewModal }) => {
            TetheredMessagePreviewModal.createPopoverV2({
                element,
                groupHash: null,
                isApproval,
                isGroupMessage: false,
                isLegacy,
                isLocked,
                isPreScreen,
                isUnscheduled,
                memberId: hs.memberId,
                messageActions: messageActionsFactory,
                messageId,
                sendDate: null,
                showEditModal: scheduler.editMessagePopup,
                showVideoPopup,
                showYoutubeVideoPopup,
                socialNetworks: hs.socialNetworks,
                timezoneOffset,
                type: messageType,
                view,
            });
        });
    },
    asGroupedMessage: (
        element,
        groupHash,
        messageId,
        messageType,
        isPreScreen,
        isUnscheduled,
        sendDate,
        showVideoPopup,
        showYoutubeVideoPopup,
        timezoneOffset,
        view,
        isLegacy,
        isApproval
    ) => {
        getHsAppPublisher().then(({ TetheredMessagePreviewModal }) => {
            TetheredMessagePreviewModal.createPopoverV2({
                element,
                groupHash,
                isApproval,
                isGroupMessage: true,
                isLegacy,
                isPreScreen,
                isUnscheduled,
                memberId: hs.memberId,
                messageActions: messageActionsFactory,
                messageId,
                sendDate,
                showEditModal: scheduler.editMessagePopup,
                showVideoPopup,
                showYoutubeVideoPopup,
                socialNetworks: hs.socialNetworks,
                timezoneOffset,
                type: messageType,
                view,
            });
        });
    },
};

export default RenderMessagePreviewModal;
