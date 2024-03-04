import { getApp } from "fe-lib-async-app";
import hootbus from "utils/hootbus";

const APP_NAME = "hs-app-ad-composer";

const FACEBOOK_AUTOBOOST_EVENT = "openFacebookAutoboost";
const FACEBOOK_AUTOBOOST_PENDO_EVENT = "pendo:openFacebookAutoboost";

const LINKEDIN_AD_COMPOSER_PENDO_EVENT = "pendo:openLinkedinAdComposer";
const TWITTER_AD_COMPOSER_PENDO_EVENT = "pendo:openTwitterAdComposer";
const FACEBOOK_AD_COMPOSER_PENDO_EVENT = "pendo:openFacebookAdComposer";

export default function () {
    hootbus.on(FACEBOOK_AUTOBOOST_EVENT, (props = {}) => {
        getApp(APP_NAME).then(function (app) {
            app.renderFacebookAutoboost(props);
        });
    });

    hootbus.on(FACEBOOK_AUTOBOOST_PENDO_EVENT, (props = {}) => {
        getApp(APP_NAME).then(function (app) {
            app.renderFacebookAutoboost(props);
        });
    });

    hootbus.on(LINKEDIN_AD_COMPOSER_PENDO_EVENT, (props = {}) => {
        getApp(APP_NAME).then(function (app) {
            app.renderLinkedInAdComposer(props);
        });
    });

    hootbus.on(TWITTER_AD_COMPOSER_PENDO_EVENT, (props = {}) => {
        getApp(APP_NAME).then(function (app) {
            app.renderTwitterAdComposer(props);
        });
    });

    hootbus.on(FACEBOOK_AD_COMPOSER_PENDO_EVENT, (props = {}) => {
        getApp(APP_NAME).then(function (app) {
            app.renderFacebookAdComposer(props);
        });
    });
}
