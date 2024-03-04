import hootbus from 'hs-nest/lib/utils/hootbus';
import trackerDatalab from 'utils/tracker-datalab';
import { getEntitlementsByFeatureCode } from 'utils/entitlements';
import { MESSAGE_TAGGING } from 'fe-lib-entitlements';

// error logging
import { logError } from 'fe-lib-logging';
import LOGGING_CATEGORIES from 'publisher/logging-categories';

// composer
import { renderComposer } from './composer-handlers'

// campaigns
import renderAppCampaigns from 'components/publisher/render-app-campaigns';
import renderAppTagManager from 'components/publisher/render-app-tagmanager';
import renderLinkSettingsDialog from 'components/publisher/render-link-settings-dialog';
import renderYouTubeUploader from 'publisher/components/youtube-upload-dialog';
import permissions from 'hs-nest/lib/constants/organization-permissions';
import { editTemplate } from "../../contentlab/async-actions";
import renderLinkSettingsManagementArea from 'components/publisher/render-link-settings-management';

export const HOOTBUS_EVENT_OPEN_COMPOSER_FROM_MESSAGE_TEMPLATE = 'composer.open.fromMessageTemplate';
export const HOOTBUS_EVENT_OPEN_COMPOSER_FROM_MESSAGE_TEMPLATE_EDIT = 'composer.open.fromMessageTemplateEdit';
export const HOOTBUS_EVENT_OPEN_COMPOSER = 'composer.open';
export const HOOTBUS_EVENT_OPEN_YOUTUBE = 'youtube.open';
const OPEN_LINK_SETTINGS_MANAGER = 'linkSettings.manager.open';
const SHOW_LINK_SETTINGS_DIALOG = 'linkSettings.dialog.show';

export const getCanManageMessageTags = async function (org) {
    if (!org.permissions[permissions.ORG_MANAGE_MESSAGE_TAGS]) {
        return false
    }
    const hasMessageTagsEntitlement = await getEntitlementsByFeatureCode(hs.memberId, MESSAGE_TAGGING)
    return hasMessageTagsEntitlement
}

export const initPublisherEventListeners = () => {
    hootbus.on('campaigns.app.show', async function (org, view) {
        if (org && view) {
            const canManageMessageTags = await getCanManageMessageTags(org)
            renderAppCampaigns(
                org.organizationId,
                org.name,
                view,
                canManageMessageTags
            );
        }
    });

    hootbus.on('tagmanager.app.show', async function (org) {
        if (org) {
            const canManageMessageTags = await getCanManageMessageTags(org)
            renderAppTagManager(
                org.organizationId,
                canManageMessageTags
            );
        }
    });

    // Register an event to open composer. This will be re-done more cleanly once the message store
    // and composers registration is in fe-global

    hootbus.on(HOOTBUS_EVENT_OPEN_COMPOSER_FROM_MESSAGE_TEMPLATE, (data) => {
        // open composer in new post from template mode,
        // from either content sources pane or the content library
        // if opened from the template itself in content library, the templateId won't exist
        renderComposer({
            templateData: data,
            templateId: data.templateId,
        })
    })

    hootbus.on(HOOTBUS_EVENT_OPEN_COMPOSER_FROM_MESSAGE_TEMPLATE_EDIT, (data) => {
        renderComposer({
            templateData: data,
            templateId: data.templateId,
            isEdit: true,
            onSaveTemplate: (templateData) => {
                const removeUndefinedOrNullAttachmentData = (arr) => {
                    arr.forEach(function (obj) {
                        Object.keys(obj).forEach(function (k) {
                            if (obj[k] === undefined || obj[k] === null) {
                                delete obj[k];
                            }
                        });
                    });
                    return arr;
                };
                templateData.template.templateId = data.templateId;
                if (templateData.message && templateData.message.attachments && templateData.message.attachments.length) {
                    removeUndefinedOrNullAttachmentData(templateData.message.attachments);
                }
                return editTemplate(templateData);
            }
        })
    })


    hootbus.on(HOOTBUS_EVENT_OPEN_COMPOSER, (data) => {
        try {
            // open composer in new post mode, customcontexttype is derived in manager using data.composeType
            renderComposer({ message: data })
            if (data && data.composeType === 'new_pin') {
                trackerDatalab.trackCustom(
                    'web.dashboard.header.compose_button',
                    'compose_new_message_for_network',
                    {
                        channel: 'PINTEREST',
                    }
                );
            } else {
                trackerDatalab.trackCustom(
                    'web.dashboard.header.compose_button',
                    'compose_new_message_for_network'
                )
            }
        } catch (e) {
            // Log to console in dev and staging env only
            if (hs.isDev || hs.isStaging) {
                // eslint-disable-next-line no-console
                console.error(e);
            }
            logError(
                LOGGING_CATEGORIES.NEW_COMPOSER,
                'New Composer - event listener error',
                {
                    errorMessage: JSON.stringify(e.message),
                    stack: JSON.stringify(e.stack),
                }
            );
        }
    });

    hootbus.on(HOOTBUS_EVENT_OPEN_YOUTUBE, () => {
        renderYouTubeUploader();
    })

    hootbus.on(SHOW_LINK_SETTINGS_DIALOG, ({
        campaignId,
        isAdmin,
        isEntitled,
        links,
        linkShorteners,
        mode,
        onChangePreset,
        onApplyLinkSettings,
        organizations,
        presets,
        selectedLink,
        selectedPreset,
        shortenerConfigs,
        trackingContext,
    }) => {
        renderLinkSettingsDialog({
            campaignId,
            isAdmin,
            isEntitled,
            links,
            linkShorteners,
            mode,
            onChangePreset,
            onApplyLinkSettings,
            organizations,
            presets,
            selectedLink,
            selectedPreset,
            shortenerConfigs,
            trackingContext,
        })
    });

    hootbus.on(OPEN_LINK_SETTINGS_MANAGER, ({ organizationId, selectedOrganization }) => {
        renderLinkSettingsManagementArea(organizationId, selectedOrganization)
    });
};
