/**
 * @format
 * @preventMunge
 */

import AbortablePromise from 'hs-nest/lib/utils/abortable-promise'

/**
 * @param {Array.<{name: {string}, func: {function}}>|object.<string, function>} endpoints An array of endpoint functions and names that will be treated as loading requests. They must all return AbortablePromises, such as from ajaxPromise
 * @example
 * // my-service.jsx
 * module.exports = FrontendService([
 *   {name: 'loadMessages', func: () => ajaxPromise(...).catch(handleAbortionOrRealError)},
 *   {name: 'deleteMessage' func: () => longProcess().then(handleResult)}
 * });
 * // OR
 * module.exports = FrontendService(
 *   loadMessages: () => ajaxPromise(...).catch(handleAbortionOrRealError),
 *   deleteMessage: () => longProcess().then(handleResult)
 * });
 *
 * // my-service-consumer.jsx
 * myService = require('.../my-service');
 *
 * myService.loadMessage();
 * myService.isRequestInProgress(); // true
 * myService.abortAllRequests(); // 1
 *
 * @returns {object} A service with managed and abortable endpoints
 */
export default endpoints => {
  if (
    typeof endpoints === 'object' &&
    !Array.isArray(endpoints) &&
    Object.keys(endpoints).filter(name => typeof endpoints[name] !== 'function').length === 0
  ) {
    endpoints = Object.keys(endpoints).map(name => ({
      name,
      func: endpoints[name],
    }))
  }
  if (
    !Array.isArray(endpoints) ||
    endpoints.length === 0 ||
    endpoints.filter(e => typeof e.name !== 'string' || typeof e.func !== 'function').length !== 0
  ) {
    throw new TypeError(
      'endpoints must be a non empty array of endpoint functions, or an object of names to functions',
    )
  }
  const uniqueNames = Object.keys(
    endpoints.reduce((acc, next) => {
      acc[next.name] = 1
      return acc
    }, {}),
  )
  if (uniqueNames.length !== endpoints.length) {
    throw new TypeError('endpoints cannot contain duplicate function names')
  }

  /**
   * Tracks all in progress requests, storing a reference to the abortable promise
   * @type {object.<string, AbortablePromise>}
   */
  let requestsInProgress = {}

  const service = {
    /**
     * @returns {boolean} Whether or not any request is in progress
     */
    isRequestInProgress() {
      return Object.keys(requestsInProgress).length > 0
    },
    /**
     * @returns {number} The number of requests aborted
     */
    abortAllRequests() {
      Object.keys(requestsInProgress).forEach(requestId => {
        requestsInProgress[requestId].abortAndReject('Aborted via abort all requests.')
      })
      const numAborted = Object.keys(requestsInProgress).length
      requestsInProgress = []
      return numAborted
    },
  }

  // Aliases for backwards compatibility
  service.isRequestLoading = service.isRequestInProgress
  service.abortRequests = service.abortAllRequests

  endpoints.forEach(endpointDef => {
    // Note - this is a regular function on purpose! using () =>  causes a bind, which webpack f's up with regards to arguments
    service[endpointDef.name] = function() {
      const requestId = Date.now() + String(Math.random()).substr(2)

      return (requestsInProgress[requestId] = endpointDef.func
        .apply(null, arguments)
        .then(result => {
          delete requestsInProgress[requestId]
          return result
        })
        .catch(error => {
          delete requestsInProgress[requestId]
          return AbortablePromise.reject(error)
        }))
    }
  })

  return service
}
