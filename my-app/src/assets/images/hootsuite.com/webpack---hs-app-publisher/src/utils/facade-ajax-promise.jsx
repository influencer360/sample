/** @format */

import _ from 'underscore'
import ajaxUtil from './facade-ajax'
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'

export default (...args) => {
  var options

  if (_.isObject(args[0])) {
    options = _.extend({}, args[0], {
      urlRoot: ajaxUtil.getUrl(),
      jwt: true,
    })

    args = _.rest(args)
    args.unshift(options)
  }

  return ajaxPromise.apply(null, args)
}
