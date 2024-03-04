/** @preventMunge */
'use strict';

// logging
import logError from 'fe-lib-logging';
import LOGGING_CATEGORIES from 'publisher/logging-categories';

// callouts
import { add as addCallout } from 'fe-lib-async-callouts'
import { CALLOUTS } from 'fe-comp-callout'
import { TYPE_ERROR } from 'fe-comp-banner'

// fe-global component
import { provisionIndex } from 'fe-lib-zindex';

// hs-nest components
import AbortionError from 'hs-nest/lib/error/abortion-error';
import translation from 'hs-nest/lib/utils/translation';

// hs-app components
import getHsAppPublisher from 'components/publisher/get-hs-app-publisher';
import getHsAppTagmanager from 'tagmanager/get-hs-app-tagmanager';

const renderAppTagManager = (organizationId, canManageTags) => {
    let parentNode = document.querySelector('#tagManagerAreaMountPoint')
    if (parentNode === null) {
        parentNode = document.createElement('div')
        parentNode.id = 'tagManagerAreaMountPoint'
        document.body.appendChild(parentNode)
    }
    const zIndex = provisionIndex()

    let tagService
    getHsAppPublisher().then(({ TagService }) => {
        tagService = new TagService(hs.facadeApiUrl, hs.memberId)
    });

    getHsAppTagmanager().then(({ mount, unmount, flux, fluxActions }) => {
        const onBackClick = () => {
            tagService
                .getTagsByOrganizationId(organizationId)
                .then(data => {
                    if (data) {
                        flux.getActions(fluxActions.TAGS).setTags(data)
                    }
                })
                .catch(e => {
                    if (!AbortionError.isAbortionError(e)) {
                        addCallout({
                            calloutType: CALLOUTS.STATUS.NAME,
                            type: TYPE_ERROR,
                            messageText: translation._('Unable to retrieve tags'),
                        });
                        logError(
                            LOGGING_CATEGORIES.TAG_MANAGER,
                            'Failed retrieving tags on back clicked',
                            {
                                errorMessage: JSON.stringify(e.message),
                                stack: JSON.stringify(e.stack),
                                orgId: organizationId,
                            }
                        )
                    }
                })

            tagService
                .getSuggestedTagsByOrganizationId(organizationId)
                .then(data => {
                    if (data && data.recentTags && Array.isArray(data.recentTags)) {
                        flux.getActions(fluxActions.TAGS).setSuggestedTags(data.recentTags)
                    }
                })
                .catch(e => {
                    if (!AbortionError.isAbortionError(e)) {
                        addCallout({
                            calloutType: CALLOUTS.STATUS.NAME,
                            type: TYPE_ERROR,
                            messageText: translation._('Unable to retrieve suggested tags'),
                        });
                        logError(
                            LOGGING_CATEGORIES.TAG_MANAGER,
                            'Failed retrieving suggested tags on back clicked',
                            {
                                errorMessage: JSON.stringify(e.message),
                                stack: JSON.stringify(e.stack),
                                orgId: organizationId,
                            }
                        )
                    }
                })

            unmount(parentNode);
        }

        var props = {
            flux,
            awaitingCanLoadTagManager: false,
            canLoadTagManager: canManageTags,
            id: organizationId.toString(),
            onBackClick: onBackClick,
            zIndex: zIndex,
        };

        mount(parentNode, props);
    });


};

export default renderAppTagManager;
