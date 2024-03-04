/**
 * this file is used as an entry point to create your bundle
 * as well as register your app in dashboard
 * only expose methods in this file
 *
 *
 * DO NOT EXPORT CLASSES for react components
 * as this code will be compiled and those jsx components won't be available as jsx in dashboard
 *
 */

// webpack closure variable
// Used so webpack knows where to get the modules from
// eg. You're on production
__webpack_public_path__ = getAppUrl() // eslint-disable-line

import { register } from 'fe-lib-async-app'
import { renderComposer as renderComposerV2, renderComposer } from '@/composer-manager/composer-manager'
import AutoScheduleSettings from '@/utils/autoschedule-settings'
import renderBulkComposer from './render-functions/render-bulk-composer'
import { appName, getAppUrl } from './utils/app-utils'

const myApp = {
  renderBulkComposer,
  AutoScheduleSettings,
  renderComposerV2,
  renderComposer,
}

register(appName, myApp)
