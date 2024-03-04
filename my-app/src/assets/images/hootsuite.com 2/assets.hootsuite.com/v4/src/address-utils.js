
var addressUtils = Object.create({
  /**
   * Return the path component, based on the current url hash
   *
   * e.g. with URL example.com/foobar#/some-path?x=1
   * path() === '/some-path'
   *
   * e.g. with URL example.com/foobar#/hello/world/?x=1
   * path() === '/hello/world'
   *
   * @returns {string} the path
   */
  path: function() {
      var m = window.location.hash.match('^#(/[^?]+)')
      var path = m ? m[1] : '/'
      // trim trailing slash, if the path is longer than '/'
      if (path.length > 1 && path[path.length -1] === '/') {
          path = path.substring(0, path.length)
      }
      return path
  },
  /**
   * Return what's at the right side of the hash symbol, based on the current url hash
   *
   * e.g. with URL example.com/foobar#/some-path?x=1&y=2
   * value() === '/some-path?x=1&y=2'
   *
   * @returns {string} content at the right side of '#'
   */
  value: function() {
      var m = window.location.hash.match('^#(.+)')
      return m ? m[1] : '/'
  },
  /**
   * Return the query parameters part of the url hash
   *
   * e.g. with URL example.com/foobar?notme=really#/some-path?x=1&y=2
   * queryString() === 'x=1&y=2'
   *
   * @returns {string} the query paramters part of the url hash
   */
  queryString: function() {
      var m = window.location.hash.match('^#.*?[?](.+)')
      return m ? m[1] : ''
  },
  /**
   * Parse the query parameters part of the url hash
   *
   * e.g. with URL example.com/foobar?notme=really#/some-path?x=1&y=2&y=3
   * parameters() == { x: '1', y: ['2', '3'] }
   *
   * @returns {object} mapping key => values. Duplicated keys appear once with their values grouped
   */
  parameters: function() {
      var q = this.queryString()
      var parameters = {}
      if (q !== '') {
          var searchParams = new URLSearchParams(q)
          // group identical keys, e.g. 'x=a&x=b&y=c' => { x: ['a', 'b'], y: 'c' }
          Array.from(searchParams.keys()).forEach(function (k) {
              var values = searchParams.getAll(k)
              parameters[k] = values.length === 1 ? values[0] : values
          })
      }
      return parameters
  },
  /**
   * Register a callback that will be called when the url hash changes
   *
   * The callback is called with an object with format
   * {
   *   path: '...',        // see doc for `path()`
   *   queryString: '...', // see doc for `queryString()`
   *   parameters: {...},  // see doc for `parameters()`
   * }
   *
   * @param {function} cb function to call each time the hash changes
   * @returns {number} the event listener id
   */
  change: function(cb) {
      var that = this
      return window.addEventListener('hashchange', function() {
          cb(that.buildChangeEvent())
      }, false);
  },
  /**
   * Generate an event, usually passed to the `change` callback
   *
   * The event has format
   * {
   *   path: '...',        // see doc for `path()`
   *   queryString: '...', // see doc for `queryString()`
   *   parameters: {...},  // see doc for `parameters()`
   * }
   *
   * @returns {object} the change event
   */
  buildChangeEvent: function() {
    return {
      path: this.path(),
      queryString: this.queryString(),
      parameters: this.parameters(),
    }
  }
});

export default addressUtils;