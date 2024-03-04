/**
 * @format
 * @preventMunge
 */

import FrontendService from './frontend-service'
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'

export default () =>
  FrontendService({
    /**
     * @param {String} settingName
     * @param {*} value
     * @returns {AbortablePromise}
     */
    setPublisherSetting(settingName, value) {
      let options = {
        type: 'POST',
        url: '/ajax/member/set-publisher-setting',
        json: {
          settingName,
          value,
        },
      }

      return ajaxPromise(options, 'qm')
    },
  })
