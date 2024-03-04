// Disable eslint rul for _ajax and _id because we can't refactor these
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }]*/
import { getApp } from 'fe-lib-async-app';
import hootbus from 'utils/hootbus';
import appdirectory from './appdirectory';
import translation from 'utils/translation';
import { captureMessage, captureException }  from '@sentry/browser';

let basename = null;
let parentNode = null;

function cleanup() {
  parentNode = null;
  basename = null;
  hootbus.off('address:path:change', unmountAppIfPathChanged);
}

async function unmountAppIfPathChanged(path) {
  if (basename === null || parentNode === null) {
    return;
  }

  //Unmount app directory component when moving to a different tab.
  const regex = new RegExp('^' + basename);

  if (!regex.test(path)) {
    try {
      const { unmountAppComponent } = await getApp('hs-app-directory');
      unmountAppComponent(parentNode);
      cleanup();
    } catch(e) {
      captureMessage('Failed while unmounting hs-app-directory async app');
      captureException(e);
    }
  }
}

function setup() {
  basename = '/appdirectory';
  parentNode = document.createElement('div');
  hootbus.on('address:path:change', unmountAppIfPathChanged);
}

function updateURLQueryString(queryString) {
  window.address.go('#/appdirectory?' + queryString);
}

function createSettingsPopup(appId) {
  appdirectory.loadAppSettingsPopup(appId, true, 0);
}

function createAppReviewPopup(appId) {
  appdirectory.writeAppReview(appId);
}

/**
 * Handle install app button click.
 * @param app The hydrated appDirectory object
 */
function installApp(app) {
  if (app.isPaid && !app.payExemption && !app.purchased) {
      // this will check if the user has an Aria account before installing
      appdirectory.subscribeFreePlan(app._id, app.price, app.currencySymbol, app.trialDays);
  } else {
      appdirectory.installApp(app._id);
  }
}

/**
* Handle uninstall button click.
*
* @param appId The app to uninstall
* @param memberAppId The hydrated appDirectory object
* @param isPaid Whether the app is paid
* @param isPayExempt Whether the member is pay exempt (i.e., has enterprise app access)
*/
function uninstallApp(appId, memberAppId, isPaid, isPayExempt) {
  // Based on legacy implementation. See window.populateAppList
  var confirmationMessage = translation._("Are you sure you want to remove this app?");
  if (isPaid && !isPayExempt) {
    confirmationMessage = translation._("You are uninstalling a paid app. If you continue, this paid app will be removed from your next monthly bill.");
  }

  if (confirm(confirmationMessage)) {
    appdirectory.uninstallApp(appId, memberAppId);
  }
}

async function loadSection(params) {
  if (hs.dashboardState === 'appdirectory') {
    return;
  }

  hs.dashboardState = 'appdirectory';

  try {
    const { AjaxService, renderAppDirectory } = await getApp('hs-app-directory');
    setup();
    var props = {
      ajaxService: new AjaxService(),
      createAppReviewPopup,
      createSettingsPopup,
      initialParams: params,
      installApp,
      uninstallApp,
      updateURLQueryString
    };
    renderAppDirectory(parentNode, props);
    hootbus.emit('toggleCoreViews:secondary', {content: parentNode});
  } catch(e) {
    captureMessage('Failed while unmounting hs-app-directory async app');
    captureException(e);
  }
}

export default {
  setup,
  cleanup,
  unmountAppIfPathChanged,
  loadSection,
  updateURLQueryString,
  createSettingsPopup,
  createAppReviewPopup,
  installApp,
  uninstallApp
};
