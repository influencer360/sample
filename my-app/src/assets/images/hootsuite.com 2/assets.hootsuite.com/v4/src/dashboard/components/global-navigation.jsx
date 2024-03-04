import React from 'react';
import { getApp } from 'fe-lib-async-app';
import ReactDOM from 'react-dom';
import {GlobalNavigationPlaceholder} from 'fe-nav-comp-global-navigation-placeholder'
import { hasYouTubeConnected } from '../../publisher/youtube';

const toBoolean = strVal => strVal === '1'

const getPropsFromDataAttributes = dataAttributes => ({
    canAccessStream: toBoolean(dataAttributes.canAccessStream),
    canAccessComposer: toBoolean(dataAttributes.canAccessComposer),
    canAccessInbox: toBoolean(dataAttributes.canAccessInbox),
    canAccessIntegratedSparkcentral: toBoolean(dataAttributes.canAccessUnifiedInbox),
    canAccessPlanner: toBoolean(dataAttributes.canAccessPlanner),
    canAccessAnalytics: toBoolean(dataAttributes.canAccessAnalytics),
    canAccessInsightsByBrandwatch: toBoolean(dataAttributes.canAccessInsightsByBrandwatch),
    canAccessImpact: toBoolean(dataAttributes.canAccessImpact),
    canAccessInsights: toBoolean(dataAttributes.canAccessInsights),
    canAccessAds: toBoolean(dataAttributes.canAccessAds),
    canAccessAppDirectory: toBoolean(dataAttributes.canAccessAppDirectory),
    canAccessAmplify: toBoolean(dataAttributes.canAccessAmplify),
    canAccessAmplifyComposer: toBoolean(dataAttributes.canAccessAmplifyComposer),
    canAccessComposerMenu: !toBoolean(dataAttributes.canAccessSimplifiedComposerExperience),
    canAccessInstagramStories: toBoolean(dataAttributes.canAccessInstagramStories),
    canAccessAdvertise: toBoolean(dataAttributes.canAccessAdvertise),
    canAccessPaidPublishing: toBoolean(dataAttributes.canAccessPaidPublishing),
    canAccessPaidManagement: toBoolean(dataAttributes.canAccessPaidManagement),
    canAccessContentLab: toBoolean(dataAttributes.canAccessContentLab),
    canAccessContentLibrary: toBoolean(dataAttributes.canAccessContentLibrary),
    canAccessNotificationCenter: toBoolean(dataAttributes.canAccessNotificationCenter),
    canAccessLivechat: toBoolean(dataAttributes.canAccessLivechat),
    canAccessGlobalSearch: toBoolean(dataAttributes.canAccessGlobalSearch),
    canAccessHomePage: toBoolean(dataAttributes.canAccessHomePage),
    canAccessOnboardingWizard: toBoolean(dataAttributes.canAccessOnboardingWizard),
    canAccessBeamer: toBoolean(dataAttributes.canAccessBeamer),
    canAccessOrganizationsSettings: toBoolean(dataAttributes.canAccessOrganizationsSettings),
    canAccessOrganizationManagement: toBoolean(dataAttributes.canAccessOrganizationManagement),
    canAccessHootbio: toBoolean(dataAttributes.canAccessHootbio),
});

export const mount = async (id) => {
    if (document.body.querySelector(`#${id}`) !== null) {
        const globalNavigationNode = document.body.querySelector(`#${id}`);
        var props = getPropsFromDataAttributes(globalNavigationNode.dataset);

        props.canAccessYouTube = hasYouTubeConnected()

        ReactDOM.render(<GlobalNavigationPlaceholder/>, globalNavigationNode);

        getApp('hs-app-global-nav').then(function (app) {
          ReactDOM.unmountComponentAtNode(globalNavigationNode)
          app.mount(globalNavigationNode, props)
        })
    }
};
