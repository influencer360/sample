import AwsCredentialManager from 'utils/aws/credential-manager';
import AwsRequestSigner from 'utils/aws/aws-request-signer';

var ajaxKinesisRequest = async function (credentials, method, data, target) {
    var service = 'kinesis';
    var host = 'kinesis.us-east-1.amazonaws.com';
    var region = 'us-east-1';
    var uri = '/';
    var contentType = 'application/x-amz-json-1.1; charset=UTF-8';

    var content = JSON.stringify(data);

    var timestamp = AwsRequestSigner.getFormattedTimestamp();
    var canonicalRequest = await AwsRequestSigner.createCanonicalRequest(method, host, uri, timestamp, contentType, target, content);
    var stringToSign = await AwsRequestSigner.createStringToSign(service, region, timestamp, canonicalRequest);
    var signingKey = await AwsRequestSigner.computeSigningKey(credentials.secretAccessKey, service, region, timestamp);
    var signature = await AwsRequestSigner.calculateSignature(stringToSign, signingKey);
    var authHeader = AwsRequestSigner.createAuthorizationHeader(credentials.accessKeyId, service, region, timestamp, signature);

    return fetch('https://' + host, {
        method: method,
        headers: Object.assign({
            'X-Amz-Date': timestamp,
            'Authorization': authHeader,
            'X-Amz-Target': target,
            'Content-Type': contentType,
        }, credentials.sessionToken !== undefined && {
            'X-Amz-Security-Token': credentials.sessionToken,
        }),
        body: content,
    }).then(r => {
        if (!r.ok) {
            throw new Error('Could not send a request to kinesis')
        } else {
            return r.json()
        }
    })
};

var getCredentialsAndMakeKinesisRequest = function (credentialManager, requestContent) {
    return credentialManager.getCredentials()
        .then(function (credentials) {
            return ajaxKinesisRequest(
                credentials,
                'POST',
                requestContent,
                'Kinesis_20131202.PutRecords'
            )
        });
};

// Browser’s btoa function does not handle all unicode.
// Solution from stackoverflow: https://stackoverflow.com/a/43271130/210090
var u_btoa = function (buffer) {
    let binary = [];
    let bytes = new Uint8Array(buffer);
    for (let i = 0, il = bytes.byteLength; i < il; i++) {
        binary.push(String.fromCharCode(bytes[i]));
    }
    return btoa(binary.join(''));
}

var KinesisClient = {
    /**
     * Returns an object representing an Amazon Kinesis record. These objects can be used with the putRecords function.
     * @param {object|string} data The data to be sent in the record. This will be serialized to JSON for the request.
     * @param {number|string} partitionKey Our standard practice is to set this as the Member ID. You could use any
     * value. Every record with the same partition key will be sent to the same shard for a particular Kinesis stream.
     * @returns {{Data: string, PartitionKey: string}} The record object. Pass this to the putRecords function.
     */
    createRecord: function (data, partitionKey) {
        data = typeof data === 'string' ? data : JSON.stringify(data);
        partitionKey = typeof partitionKey === 'string' ? partitionKey : JSON.stringify(partitionKey);

        // Base64 encode the data
        data = u_btoa(new TextEncoder().encode(data))

        return {
            Data: data,
            PartitionKey: partitionKey
        };
    },
    /**
     * Put up to 500 records into an Amazon Kinesis stream.
     * @param streamName The name of the Kinesis stream. A stream must be provisioned explicitely so make sure this
     * stream name is valid.
     * @param records Record objects created with the KinesisClient.createRecord function. The Amazon Kinesis API has
     * a hard limit of 500 records per request - make sure you are not exceeding that limit.
     */
    putRecords: function (streamName, records) {
        var requestContent = {
            Records: records,
            StreamName: streamName
        };

        var credentialManager = AwsCredentialManager;

        var pResult = getCredentialsAndMakeKinesisRequest(credentialManager, requestContent);

        // If the Kinesis request fails, refresh credentials and try again. Only retry once.
        pResult.catch(function () {
            credentialManager.markCredentialsInvalid();

            getCredentialsAndMakeKinesisRequest(credentialManager, requestContent);
        });
    }
};

export default KinesisClient;
