import { envValue } from './env-utils'

export const appName = 'hs-app-composer'

export const getCookie = name => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : ''
}

// Function for getting the publicPath based on the environment
// https://webpack.js.org/configuration/output/#outputpublicpath
export const getAppUrl = () => {
  if (getCookie(appName)) {
    // Strip out "hs-app-composer-development.js" from "https://localhost:3013/hs-app-composer-development.js"
    // so we end up with "https://localhost:3013/"
    return getCookie(appName).split('/').slice(0, -1).join('/') + '/'
  } else {
    const APP_PATH = process.env.APP_PATH
    const base = `i.hootsuite.com/async-apps/${appName}/${APP_PATH}/`

    return envValue(`//${base}`, `//staging-${base}`, `//development-${base}`)
  }
}
