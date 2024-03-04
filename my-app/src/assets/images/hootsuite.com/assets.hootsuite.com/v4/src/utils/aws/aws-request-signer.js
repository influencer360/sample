/**
 * Computes signatures for Amazon service API requests. Uses "AWS signature version 4" with SHA256 hashing. Most Amazon
 * APIs support CORS so you should be able to send an AJAX call directly once it has been signed with this library.
 *
 * This library produces the Authorization header for a request with the following headers.
 * - Host
 * - Content-Type
 * - X-Amz-Date (generate this with the getFormattedTimestamp function)
 * - X-Amz-Target
 * All of these headers must be included in the request and the exact values must match those used as parameters in the
 * functions of this library.
 *
 * Step 1: Create a canonical request
 * - Do this with the createCanonicalRequest function.
 * - See Amazon documentation: http://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html
 * Step 2: Create a string to sign
 * - Do this with the createStringToSign function.
 * - See Amazon documentation: http://docs.aws.amazon.com/general/latest/gr/sigv4-create-string-to-sign.html
 * Step 3: Calculate a signature
 * - Do this with the computeSigningKey and calculateSignature functions.
 * - See Amazon documentation: http://docs.aws.amazon.com/general/latest/gr/sigv4-calculate-signature.html
 * Step 4: Create the Authorization header
 * - Do this with the createAuthorizationHeader function.
 */
async function sha256(message) {
    const msgUint8 = new TextEncoder().encode(message);                   // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);   // hash the message
    return bufToHex(hashBuffer);                                          // convert buffer to byte array
}

var canonicalHeaderEntry = function (headerKey, headerValue) {
    return headerKey.toLowerCase() + ':' + headerValue;
};

var getDateFromTimestamp = function (timestamp) {
    return timestamp.split('T')[0];
};

function bufToHex(buf) {
    const array = Array.from(new Uint8Array(buf));                          // convert buffer to byte array
    const hex = array.map(b => b.toString(16).padStart(2, '0')).join('');   // convert bytes to hex string
    return hex
}

async function generateHmac(message, secretAsBytes) {
    const key = await window.crypto.subtle.importKey(
        "raw",
        secretAsBytes,
        { name: "HMAC","hash":"SHA-256"},
        false,
        ["sign", "verify"]
    );

    const msgUint8 = new TextEncoder("utf-8").encode(message);
    const signBuffer = await window.crypto.subtle.sign("HMAC", key, msgUint8);
    return signBuffer
}

var createResourcePath = function (date, service, region) {
    return date + '/' + region + '/' + service + '/aws4_request';
};

var awsRequestSigner = {
    signedHeaders: 'content-type;host;x-amz-date;x-amz-target',

    /**
     * Produces a canonical request string. This is the first step in computing a request signature for Amazon APIs.
     * @param {string} method The HTTP method of the request. E.g., "GET", "POST", "PUT", etc.
     * @param {string} host The raw hostname of the service. For example, kinesis.us-east-1.amazonaws.com. Leave off "https://"
     * @param {string} uri The path of the request. For any service other than S3 this is usually "/"
     * @param {string} timestamp The current timestamp in the format YYYYMMDD'T'HHMMSS'Z'. For example: "20150129T221045Z". This
     * format is a requirement of the Amazon API. This should be approximately the current time within ~5mins. Also, this
     * timestamp should be consistent for all the steps in building this signature. To get the current time in this
     * format, use the getFormattedTimestamp() function.
     * @param {string} contentType The content type header value you will send with this request. I recommend
     * 'application/x-amz-json-1.1' for JSON data.
     * @param {string} xAmzTarget The target API function of the request. This is defined by Amazon and should match what you are
     * sending with the X-Amz-Target header. For example, a putRecords request to the Kinesis API has the value
     * 'Kinesis_20131202.PutRecords'. Note: that date is the API version, not today's date.
     * @param {string} content The actual request content to be sent with the request. Should be a string.
     * @returns {string} The canonical request in the format expected by Amazon. Pass this value to the
     * createStringToSign(...) function.
     */
    createCanonicalRequest: async function (method, host, uri, timestamp, contentType, xAmzTarget, content) {
        method = method.toUpperCase();
        host = host.toLowerCase();

        var contentHash = await sha256(content);

        // We haven't implemented logic to handle query strings. Feel free to do that yourself if you need it.
        var queryString = '';

        var canonicalHeaders = [
            canonicalHeaderEntry('content-type', contentType),
            canonicalHeaderEntry('host', host),
            canonicalHeaderEntry('x-amz-date', timestamp),
            canonicalHeaderEntry('x-amz-target', xAmzTarget),
            ''
        ].join('\n');

        return [method, uri, queryString, canonicalHeaders, this.signedHeaders, contentHash].join('\n');
    },
    /**
     * Create the string to sign for an AWS service API request.
     * @param {string} service The service this request is being sent to. Check the API hostname for a hint. E.g., 'kinesis'.
     * This should be a substring of what was specified in the 'host' parameter for the createCanonicalRequest(...)
     * function. This should also match the value passed to the computeSigningKey and
     * createAuthorizationHeader functions.
     * @param {string} region The region of the service this request is being sent to. Check the API hostname for a hint.
     * E.g., 'us-east-1'. This should be a substring of what was specified in the 'host' parameter for the
     * createCanonicalRequest function. This should also match the value passed to the computeSigningKey and
     * createAuthorizationHeader functions.
     * @param {string} timestamp The current timestamp in the format YYYYMMDD'T'HHMMSS'Z'. For example: "20150129T221045Z". This
     * format is a requirement of the Amazon API. This should be approximately the current time within ~5mins. Also, this
     * timestamp should be consistent for all the steps in building this signature. To get the current time in this
     * format, use the getFormattedTimestamp() function.
     * @param {string} canonicalRequest The canonical request string created with the createCanonicalRequest(...) function.
     * @returns {string} The final string to sign. Pass this value to the calculateSignature(...) function.
     */
    createStringToSign: async function (service, region, timestamp, canonicalRequest) {
        service = service.toLowerCase();
        region = region.toLowerCase();

        var algorithm = 'AWS4-HMAC-SHA256';
        var date = getDateFromTimestamp(timestamp);
        var resource = createResourcePath(date, service, region);

        var canonicalRequestHash = await sha256(canonicalRequest);

        return [algorithm, timestamp, resource, canonicalRequestHash].join('\n');
    },
    /**
     * Compute the signing key for the current request. This is specific to the combination of your IAM Secret Key and
     * the current date. A signing key can be used for multiple requests (based on my testing) but will expire within
     * 5-15 minutes of the timestamp used to compute it.
     * @param {string} awsSecret The secret key associated with the IAM key used with the request. This should pair with the
     * Access Key ID passed to the createAuthorizationHeader function. Obviously, never use permanent credentials in our
     * JavaScript front-end code (they will be h4x0r3d immediately). We have an API endpoint for retrieving temporary
     * IAM credentials that are tied to a specific member ID and expire in 60 minutes. Use those credentials for any requests.
     * @param {string} service The service this request is being sent to. Check the API hostname for a hint. E.g., 'kinesis'.
     * This should be a substring of what was specified in the 'host' parameter for the createCanonicalRequest(...)
     * function. This should also match the value passed to the createStringToSign and createAuthorizationHeader functions.
     * @param {string} region The region of the service this request is being sent to. Check the API hostname for a hint.
     * E.g., 'us-east-1'. This should be a substring of what was specified in the 'host' parameter for the
     * createCanonicalRequest function. This should also match the value passed to the createStringToSign and
     * createAuthorizationHeader functions.
     * @param {string} timestamp The current timestamp in the format YYYYMMDD'T'HHMMSS'Z'. For example: "20150129T221045Z". This
     * format is a requirement of the Amazon API. This should be approximately the current time within ~5mins. Also, this
     * timestamp should be consistent for all the steps in building this signature. To get the current time in this
     * format, use the getFormattedTimestamp() function.
     * @returns {object} A Hash object representing the computed signing key. Pass this to the calculateSignature function.
     */
    computeSigningKey: async function (awsSecret, service, region, timestamp) {
        service = service.toLowerCase();
        region = region.toLowerCase();

        var date = getDateFromTimestamp(timestamp);

        var kDate = await generateHmac(date, new TextEncoder('utf-8').encode('AWS4' + awsSecret));
        var kRegion = await generateHmac(region, kDate);
        var kService = await generateHmac(service, kRegion);
        return await generateHmac('aws4_request', kService);
    },
    /**
     * Calculate the signature of this Amazon API request.
     * @param {string} stringToSign The final string to sign. Create this string with the createStringToSign function.
     * @param {string} signingKey The signing key returned by the computeSigningKey function.
     * @returns {string} A hex string representation of the calculated signature. Pass this value to the
     * createAuthorizationHeader function.
     */
    calculateSignature: async function (stringToSign, signingKey) {
        return bufToHex(await generateHmac(stringToSign, signingKey))
    },
    /**
     * Produces the exact Authorization header you will use in your AJAX request.
     * @param {string} accessKeyId The IAM Access Key ID with permissions for this request. This should pair with the
     * Secret Access Key passed to the computeSigningKey function. Obviously, never use permanent credentials in our
     * JavaScript front-end code (they will be h4x0r3d immediately). We have an API endpoint for retrieving temporary
     * IAM credentials that are tied to a specific member ID and expire in 60 minutes. Use those credentials for any
     * requests.
     * @param {string} service The service this request is being sent to. Check the API hostname for a hint. E.g., 'kinesis'.
     * This should be a substring of what was specified in the 'host' parameter for the createCanonicalRequest(...)
     * function. This should also match the value passed to the createStringToSign and computeSigningKey functions.
     * @param {string} region The region of the service this request is being sent to. Check the API hostname for a hint.
     * E.g., 'us-east-1'. This should be a substring of what was specified in the 'host' parameter for the
     * createCanonicalRequest function. This should also match the value passed to the createStringToSign and
     * computeSigningKey functions.
     * @param {string} timestamp The current timestamp in the format YYYYMMDD'T'HHMMSS'Z'. For example: "20150129T221045Z".
     * This format is a requirement of the Amazon API. This should be approximately the current time within ~5mins. Also,
     * this timestamp should be consistent for all the steps in building this signature. To get the current time in this
     * format, use the getFormattedTimestamp() function.
     * @param {string} signature The signature for this request as computed by the calculateSignature function.
     * @returns {string} The value of the Authorization header to include in your AJAX request.
     */
    createAuthorizationHeader: function (accessKeyId, service, region, timestamp, signature) {
        var algorithm = 'AWS4-HMAC-SHA256';
        var date = getDateFromTimestamp(timestamp);
        var credential = accessKeyId + '/' + createResourcePath(date, service, region);

        return [
            algorithm + ' Credential=' + credential,
            'SignedHeaders=' + this.signedHeaders,
            'Signature=' + signature
        ].join(', ');
    },
    /**
     * Returns a string representation of a timestamp in the format YYYYMMDD'T'HHMMSS'Z'. This is the format expected
     * by Amazon APIs. The 'Z' denotes that the time returned is at UTC.
     * @param {object=} date (Optional) A specific date to format. Will use current time if undefined
     * @returns {string} The formatted timestamp converted to UTC.
     */
    getFormattedTimestamp: function (date) {
        date = date instanceof Date ? date : new Date();

        var yyyy = date.getUTCFullYear().toString();
        var mm = (date.getUTCMonth() + 1).toString(); // getMonth() is zero-based
        var dd  = date.getUTCDate().toString();

        var hh = date.getUTCHours().toString();
        var ii = date.getUTCMinutes().toString();
        var ss = date.getUTCSeconds().toString();

        // Return date with padding on all digits
        return yyyy +
            (mm[1] ? mm : "0" + mm[0]) +
            (dd[1] ? dd : "0" + dd[0]) + 'T' +
            (hh[1] ? hh : "0" + hh[0]) +
            (ii[1] ? ii : "0" + ii[0]) +
            (ss[1] ? ss : "0" + ss[0]) + 'Z';
    }
};

export default awsRequestSigner;
