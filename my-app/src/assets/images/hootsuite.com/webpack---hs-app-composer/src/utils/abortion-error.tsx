/**
 * Custom error passed down when an AbortablePromise is aborted and rejected
 * It is a subclass of Error
 */

export default class AbortionError {
  constructor(message) {
    this.name = 'AbortionError'
    this.message = message || 'Promise was manually aborted'
    this.stack = new Error().stack
  }

  static isAbortionError(e) {
    return !!(e instanceof AbortionError || (e && e.name === 'AbortionError'))
  }
}
