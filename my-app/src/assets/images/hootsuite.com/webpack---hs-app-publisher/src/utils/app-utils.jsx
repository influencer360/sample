/** @format */

import { env as getEnv, PRODUCTION, STAGING, DEV } from 'fe-lib-env'

export const appName = 'hs-app-publisher'

export const getCookie = name => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : ''
}

// Function for getting the publicPath based on the environment
// https://webpack.js.org/configuration/output/#outputpublicpath
export const getAppUrl = () => {
  if (getCookie(appName)) {
    // Strip out "hs-app-publisher-development.js" from "https://hs-app-publisher.hootsuite.test:3014/hs-app-publisher-development.js"
    // so we end up with "https://hs-app-publisher.hootsuite.test:3014/"
    return getCookie(appName).split('/').slice(0, -1).join('/') + '/'
  }
  const APP_PATH = process.env.APP_PATH
  let base = `i.hootsuite.com/async-apps/${appName}/${APP_PATH}`

  if (base.charAt(base.length - 1) !== '/') {
    // Append / if it wasn't present in the APP_PATH
    base += '/'
  }

  const ENV = getEnv()
  let appUrl = ''
  if (PRODUCTION === ENV) appUrl = `//${base}`
  else if (STAGING === ENV) appUrl = `//staging-${base}`
  else if (DEV === ENV) appUrl = `//development-${base}`

  return appUrl
}
