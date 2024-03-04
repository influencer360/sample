import _ from "underscore";

/**
 * Make an Ajax call using the Fetch API easily
 * @param {string} url A relative or absolute URL. If the URL is relative, we'll use hs.util.getUrlRoot() to add the right domain
 * @param {string} method The HTTP method to use (GET, POST, etc.)
 * @param {Object} options An object of options that will be passed to the fetch call.
 * It also supports custom options:
 * - json (object used in POST queries to pass in the body if the endpoint expects JSON data)
 * - data (object used in POST queries to pass in the body if the endpoint expects url-encoded data)
 * - csrfToken (if you'd like to provide your own CSRF token, will use hs.csrfToken otherwise)
 * @returns Promise
 * @example
 * // Makes a GET call to https://hootsuite.com/your-url
 * ajaxRequest('/your-url', 'GET')
 * @example
 * // Makes a POST call to https://coolsite.com/your-url containing some JSON
 * ajaxRequest('https://coolsite.com/your-url', 'POST', { json: { name: 'test', value: 2 } })
 */
export function ajaxRequest(url, method, options = {}) {
    const urlBase =
        window && window.hs && window.hs.util && window.hs.util.getUrlRoot
            ? window.hs.util.getUrlRoot()
            : null;
    let fullUrl = new URL(url, urlBase);
    const { json, data, ...init } = options;
    init.method = method;
    if (method === "GET" && data) {
        const flattenedData = flatten(data);
        fullUrl.search = new URLSearchParams(flattenedData).toString();
    } else if (method === "POST") {
        const csrfToken =
            options.csrfToken || (window && window.hs && window.hs.csrfToken);

        if (json) {
            // POST JSON call
            fullUrl.searchParams.set("csrfToken", csrfToken);
            init.body = json;
            init.headers = Object.assign({}, options.headers, {
                "Content-Type": "application/json",
            });
        } else if (data) {
            // POST url-encoded call
            const flattenedData = flatten(data);
            flattenedData.csrfToken = csrfToken;
            init.body = new URLSearchParams(flattenedData);
            init.headers = Object.assign({}, options.headers, {
                "Content-Type": "application/x-www-form-urlencoded",
            });
        } else {
            throw new Error(
                "Ajax error - Provide either a `json` or `data` property to make your POST call"
            );
        }
    }

    return new Promise((res, rej) => {
        return fetch(fullUrl.toString(), init).then(
            (response) => {
                if (!response.ok) {
                    // Try to get the error message but reject no matter what
                    getResponseBody(response, rej);
                } else {
                    getResponseBody(response, res);
                }
            },
            (error) => {
                rej(error);
            }
        );
    });
}

/**
 * Takes a Response object and tries to get its body, first as JSON, second as text. Returns the Response object if it's unable to get the content in JSON or text.
 * If the content is JSON, it'll reject the promise if it detects that the "success" is 0 or if there's an "error" property. This is used to mimic what was done in hs-nest.
 * @param {Response} response - Response JS object
 * @param {*} res - Success callback (will resolve the promise)
 * @param {*} rej - Error callback (will reject the promise)
 */
function getResponseBody(response, res) {
    // Try to get the JSON content of the error
    response.json().then(
        (json) => {
            res(json);
        },
        () => {
            // No JSON, try to get the text content
            response.text().then(
                (text) => res(text),
                () => res(response)
            );
        }
    );
}

/**
 * Takes an ajaxRequest promise and rejects if the response is a JS object with "success" set to 0 or "error" is not empty
 * This mimics the error handling done in hs-nest
 * @param {*} ajaxPromise
 * @returns Promise
 */
export function dashboardJsonErrorHandling(ajaxPromise) {
    return new Promise((res, rej) => {
        ajaxPromise.then(
            (response) => {
                if (
                    _.isObject(response) &&
                    ((typeof response.success !== "undefined" &&
                        (response.success === 0 || response.success === "0")) ||
                        response.error)
                ) {
                    rej(response);
                } else {
                    res(response);
                }
            },
            (err) => rej(err)
        );
    });
}

/**
 * Flattens a JS object with nested properties in order to serialize it in a query string (url-encoded)
 * @param {Object} obj - the JSON object to flatten
 * @param {string} path - used for recursion to construct the key
 * @returns {Object} Object without nested properties that uses query-string syntax
 */
function flatten(obj, path = null) {
    let result = {};

    for (const key in obj) {
        if (!hasOwnProperty.call(obj, key)) {
            continue;
        }

        const val = obj[key];
        if (val == null) {
            continue;
        }
        const type = toString.call(val);

        if (type === "[object Object]" || type === "[object Array]") {
            result = { ...result, ...flatten(val, join(path, key)) };
        } else {
            result[join(path, key)] = val;
        }
    }

    return result;
}

/**
 * Returns the path based on the query-string syntax
 * @param {string} path
 * @param {string} key
 * @returns {string} formatted path like "path[key1][key2]"
 */
function join(path, key) {
    return path != null ? `${path}[${key}]` : key;
}
